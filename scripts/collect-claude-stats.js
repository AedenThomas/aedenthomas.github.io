const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

// Reproduces the Claude Code usage panel (Sessions / Messages / Total tokens /
// Active days / streaks / Peak hour / Favorite model) as public/claude-stats.json.
//
// There is no API for this — the panel is computed locally from ~/.claude. So
// unlike fetch-github-stats.js and fetch-ado-contributions.js, this script CANNOT
// run in the GitHub Action (ubuntu-latest has no ~/.claude). Run it on the Mac.
//
// Two sources, because neither alone is complete:
//   1. ~/.claude/stats-cache.json  — Claude Code's own accumulated history, but
//      only refreshed when you actually open the stats panel.
//   2. ~/.claude/projects/**/*.jsonl — raw transcripts, complete but pruned to a
//      rolling retention window (~29 active days here, against 98 lifetime).
//
// The cache is authoritative for everything up to its lastComputedDate; we scan
// transcripts only for days after it, so the two never overlap or double-count.
// Scanning transcripts alone would report 29 days and would shrink over time as
// old ones age out, so days we scan are kept in our own cumulative store.

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const STATS_CACHE = path.join(CLAUDE_DIR, 'stats-cache.json');

// A frozen snapshot of the AWS Bedrock work, captured once by
// scripts/fetch-bedrock-stats.js. That traffic is finished, so it is history
// rather than something to re-collect daily, and committing it keeps the site
// off both AWS credentials and CloudWatch's 15-month retention window.
const BEDROCK_SNAPSHOT = path.join(__dirname, 'bedrock-snapshot.json');

// Deliberately outside ~/.claude (Claude Code prunes in there) and outside the
// repo (survives a fresh clone). This file is the source of truth for history.
const STATE_DIR = path.join(os.homedir(), '.claude-portfolio-stats');
const STATE_FILE = path.join(STATE_DIR, 'state.json');

const OUTPUT_FILE = path.join(__dirname, '../public/claude-stats.json');

// Tokens counted here are "tokens processed": uncached input + output + cache
// reads + cache writes. That matches the headline number Claude Code's own stats
// panel reports. Note the panel mixes windows — its Sessions and Messages tiles
// are lifetime, while its Total tokens tile covers only the ~35 days that
// dailyModelTokens retains, so the two will not appear to agree there.
//
// Moby-Dick is ~206k words; the panel's comparison works out to ~268k tokens.
const MOBY_DICK_TOKENS = 268000;

const DAY_MS = 86400000;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// Local-time date key. The panel's day boundaries, streaks and peak hour are all
// in local time, while transcript timestamps are UTC ("...Z").
function localDateKey(date) {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

// Noon anchor keeps DST transitions from shifting the date.
function shiftDate(key, days) {
    return localDateKey(new Date(new Date(`${key}T12:00:00`).getTime() + days * DAY_MS));
}

function emptyDay() {
    return {
        messages: 0,
        sessions: 0,
        toolCalls: 0,
        tokens: 0,
        modelTokens: {}, // model -> input + output
        modelIo: {}, // model -> {input, output}; scanned days only, see legacy.modelUsage
        hourCounts: {}
    };
}

function addInto(target, source) {
    for (const [key, n] of Object.entries(source || {})) {
        target[key] = (target[key] || 0) + n;
    }
    return target;
}

// A finished day's numbers are final, so re-scanning it must not double up.
// Taking the max keeps re-runs idempotent while letting a day fill in if an
// earlier run caught it mid-flight.
function mergeDay(into, from) {
    into.messages = Math.max(into.messages || 0, from.messages || 0);
    into.sessions = Math.max(into.sessions || 0, from.sessions || 0);
    into.toolCalls = Math.max(into.toolCalls || 0, from.toolCalls || 0);
    into.tokens = Math.max(into.tokens || 0, from.tokens || 0);

    for (const [model, n] of Object.entries(from.modelTokens || {})) {
        into.modelTokens[model] = Math.max(into.modelTokens[model] || 0, n);
    }
    if (!into.modelIo) into.modelIo = {};
    for (const [model, io] of Object.entries(from.modelIo || {})) {
        const prev = into.modelIo[model] || { input: 0, output: 0 };
        into.modelIo[model] = {
            input: Math.max(prev.input || 0, io.input || 0),
            output: Math.max(prev.output || 0, io.output || 0)
        };
    }
    for (const [hour, n] of Object.entries(from.hourCounts || {})) {
        into.hourCounts[hour] = Math.max(into.hourCounts[hour] || 0, n);
    }
    return into;
}

// "claude-opus-4-8" -> "Opus 4.8", "claude-sonnet-4-5-20250929" -> "Sonnet 4.5"
//
// The family is the first non-numeric part rather than simply the first one:
// the older ids put the version in front ("claude-3-sonnet", "claude-3-5-haiku"),
// which otherwise labels as "3". Those only turn up via the Bedrock snapshot.
function modelLabel(id) {
    const parts = id
        .replace(/^claude-/, '')
        .replace(/-\d{8}$/, '') // trailing release date
        .split('-');
    const family = parts.find((p) => !/^\d+$/.test(p)) || parts[0];
    const name = family.charAt(0).toUpperCase() + family.slice(1);
    const version = parts.filter((p) => /^\d+$/.test(p)).join('.');
    return version ? `${name} ${version}` : name;
}

function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function listTranscripts(dir) {
    let out = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return out;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out = out.concat(listTranscripts(full));
        } else if (entry.name.endsWith('.jsonl')) {
            // projects/<project>/<session>.jsonl is a real session; anything
            // deeper (<session>/subagents/*, <session>/tool-results/*) is not.
            const isMain = path.relative(PROJECTS_DIR, full).split(path.sep).length === 2;
            out.push({ file: full, isMain });
        }
    }
    return out;
}

// ---------------------------------------------------------------------------
// source 1: stats-cache.json — the frozen historical baseline
// ---------------------------------------------------------------------------

function readStatsCache() {
    if (!fs.existsSync(STATS_CACHE)) return null;
    try {
        return JSON.parse(fs.readFileSync(STATS_CACHE, 'utf8'));
    } catch (e) {
        console.warn(`Could not parse ${STATS_CACHE}: ${e.message}`);
        return null;
    }
}

// Cache field semantics, verified against the panel:
//   dailyActivity[].sessionCount  sessions bucketed by START date (sums to totalSessions)
//   dailyActivity[].messageCount  user + assistant entries on that date
//   dailyModelTokens[]            tokens processed per model per date, cache included,
//                                 but only for a rolling ~35-day retention window
//   modelUsage                    LIFETIME per-model in/out/cacheRead/cacheCreation
//   hourCounts                    sessions bucketed by START hour (also sums to totalSessions)
//
// Only modelUsage reaches back over the whole history, and it has no per-day
// breakdown. dailyModelTokens covers recent days in detail but drops the rest.
// So the two are used for different jobs: dailyModelTokens supplies per-day
// figures where it can, and the difference between the lifetime totals and what
// those days account for is carried as `residual` — real tokens with no
// surviving per-day detail, added to the totals but not to any day.
function buildLegacy(cache) {
    const days = {};

    for (const day of cache.dailyActivity || []) {
        days[day.date] = Object.assign(emptyDay(), {
            messages: day.messageCount || 0,
            sessions: day.sessionCount || 0,
            toolCalls: day.toolCallCount || 0
        });
    }
    for (const day of cache.dailyModelTokens || []) {
        if (!days[day.date]) days[day.date] = emptyDay();
        const byModel = day.tokensByModel || {};
        days[day.date].modelTokens = Object.assign({}, byModel);
        days[day.date].tokens = Object.values(byModel).reduce((a, b) => a + b, 0);
    }

    // modelUsage is a lifetime split per model with no per-day breakdown, so like
    // hourCounts it stays a single bucket covering everything through `through`.
    // Cache reads and writes are input-side, so they fold into `input`.
    const modelUsage = {};
    const lifetime = {};
    for (const [model, usage] of Object.entries(cache.modelUsage || {})) {
        if (!model.startsWith('claude-')) continue;
        const input =
            (usage.inputTokens || 0) +
            (usage.cacheReadInputTokens || 0) +
            (usage.cacheCreationInputTokens || 0);
        const output = usage.outputTokens || 0;
        modelUsage[model] = { input, output };
        lifetime[model] = input + output;
    }

    // What the retained per-day rows account for, per model...
    const detailed = {};
    for (const day of cache.dailyModelTokens || []) {
        addInto(detailed, day.tokensByModel || {});
    }

    // ...and the remainder, which is everything older than the retention window.
    // Without this the totals would silently shrink to the last ~35 days.
    const residual = {};
    for (const [model, total] of Object.entries(lifetime)) {
        const gap = total - (detailed[model] || 0);
        if (gap > 0) residual[model] = gap;
    }

    return {
        through: cache.lastComputedDate || null,
        // Only a lifetime total is stored, with no per-day breakdown to merge,
        // so it stays a single bucket covering everything through `through`.
        hourCounts: Object.assign({}, cache.hourCounts || {}),
        modelUsage,
        residual,
        firstSessionDate: cache.firstSessionDate ? localDateKey(new Date(cache.firstSessionDate)) : null,
        days
    };
}

// ---------------------------------------------------------------------------
// source 2: raw transcripts, for days after the legacy boundary
// ---------------------------------------------------------------------------

// Top-level transcripts are real sessions and drive every count. Nested ones are
// subagent / tool-result sidechains: their model calls are real spend and count
// toward tokens, but they are not sessions or user-facing messages. That split is
// what makes the token total match the panel exactly.
async function scanTranscripts() {
    const days = {};
    const sessionStart = {}; // sessionId -> earliest Date seen, across every file
    const files = listTranscripts(PROJECTS_DIR);

    let mainFiles = 0;
    let auxFiles = 0;

    const dayFor = (date) => {
        if (!days[date]) days[date] = emptyDay();
        return days[date];
    };

    for (const { file, isMain } of files) {
        if (isMain) mainFiles++;
        else auxFiles++;

        const rl = readline.createInterface({
            input: fs.createReadStream(file, { encoding: 'utf8' }),
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            if (!line) continue;
            // Cheap prefilter: attachments and tool results dominate the bytes
            // and never carry usage or message counts.
            if (!line.includes('"assistant"') && !line.includes('"user"')) continue;

            let entry;
            try {
                entry = JSON.parse(line);
            } catch (e) {
                continue;
            }

            const type = entry.type;
            if ((type !== 'assistant' && type !== 'user') || !entry.timestamp) continue;

            const when = new Date(entry.timestamp);
            if (isNaN(when)) continue;
            const date = localDateKey(when);

            const message = entry.message || {};
            const usage = message.usage || {};

            // Tokens processed: uncached input + output + cache reads + writes.
            // Checked against the panel's own per-day figures — on every day whose
            // transcripts have not been pruned yet the two agree exactly, and
            // counting every .jsonl (subagent files included) is what makes them
            // agree: subagent calls are distinct spend, not duplicates of the
            // parent session, and dropping them undercounts by about a third.
            if (type === 'assistant' && typeof message.model === 'string' && message.model.startsWith('claude-')) {
                const input =
                    (usage.input_tokens || 0) +
                    (usage.cache_read_input_tokens || 0) +
                    (usage.cache_creation_input_tokens || 0);
                const output = usage.output_tokens || 0;
                if (input + output > 0) {
                    const day = dayFor(date);
                    day.tokens += input + output;
                    day.modelTokens[message.model] = (day.modelTokens[message.model] || 0) + input + output;
                    const io = day.modelIo[message.model] || { input: 0, output: 0 };
                    io.input += input;
                    io.output += output;
                    day.modelIo[message.model] = io;
                }
            }

            if (!isMain || entry.isSidechain) continue;

            dayFor(date).messages++;

            if (entry.sessionId && (!sessionStart[entry.sessionId] || when < sessionStart[entry.sessionId])) {
                sessionStart[entry.sessionId] = when;
            }

            if (type === 'assistant') {
                const content = Array.isArray(message.content) ? message.content : [];
                for (const block of content) {
                    if (block && block.type === 'tool_use') dayFor(date).toolCalls++;
                }
            }
        }
    }

    // Attribute each session once, to the day and hour it started.
    for (const start of Object.values(sessionStart)) {
        const day = dayFor(localDateKey(start));
        day.sessions++;
        day.hourCounts[start.getHours()] = (day.hourCounts[start.getHours()] || 0) + 1;
    }

    console.log(`Scanned ${mainFiles} session transcripts + ${auxFiles} subagent/tool files`);
    console.log(`Transcript window: ${Object.keys(days).length} active days, ${Object.keys(sessionStart).length} sessions`);
    return days;
}

// ---------------------------------------------------------------------------
// derive the panel figures
// ---------------------------------------------------------------------------

// One set of figures over a date range. `from` = null means all time.
function computeWindow(combined, legacy, today, from) {
    const dates = Object.keys(combined)
        .filter((d) => !from || d >= from)
        .sort();
    const activeDates = dates.filter((d) => (combined[d].messages || 0) > 0);

    let sessions = 0;
    let messages = 0;
    let toolCalls = 0;
    let tokens = 0;
    const modelTokens = {};
    const modelIo = {};

    const addIo = (model, input, output) => {
        const io = modelIo[model] || { input: 0, output: 0 };
        io.input += input;
        io.output += output;
        modelIo[model] = io;
    };

    for (const date of dates) {
        const day = combined[date];
        sessions += day.sessions || 0;
        messages += day.messages || 0;
        toolCalls += day.toolCalls || 0;
        tokens += day.tokens || 0;
        addInto(modelTokens, day.modelTokens);
    }

    // Same split as hourCounts: the legacy bucket is lifetime-through-`through`
    // with no per-day detail, so fold it in whenever the range reaches back into
    // it, and take per-day figures for everything after.
    if (legacy.through && (!from || from <= legacy.through)) {
        for (const [model, io] of Object.entries(legacy.modelUsage || {})) {
            addIo(model, io.input || 0, io.output || 0);
        }
        // Tokens from before the per-day retention window. They have no date, so
        // they can only join the totals here, never a day or the heatmap.
        for (const [model, n] of Object.entries(legacy.residual || {})) {
            tokens += n;
            modelTokens[model] = (modelTokens[model] || 0) + n;
        }
    }
    for (const date of dates) {
        if (legacy.through && date <= legacy.through) continue;
        for (const [model, io] of Object.entries(combined[date].modelIo || {})) {
            addIo(model, io.input || 0, io.output || 0);
        }
    }

    // Per-day hour buckets exist only for days we scanned ourselves; the cache
    // stores one lifetime total for its own window, so fold that in whenever the
    // range reaches back into it.
    const hourCounts = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;
    if (legacy.through && (!from || from <= legacy.through)) addInto(hourCounts, legacy.hourCounts);
    for (const date of dates) {
        if (legacy.through && date <= legacy.through) continue;
        addInto(hourCounts, combined[date].hourCounts);
    }

    let peakHour = 0;
    for (let h = 0; h < 24; h++) {
        if (hourCounts[h] > hourCounts[peakHour]) peakHour = h;
    }

    let longestStreak = 0;
    let run = 0;
    for (let i = 0; i < activeDates.length; i++) {
        run = i > 0 && shiftDate(activeDates[i - 1], 1) === activeDates[i] ? run + 1 : 1;
        longestStreak = Math.max(longestStreak, run);
    }

    // A streak stays alive until the day after your last active day has passed.
    const activeSet = new Set(activeDates);
    let currentStreak = 0;
    let cursor = activeSet.has(today) ? today : shiftDate(today, -1);
    while (activeSet.has(cursor)) {
        currentStreak++;
        cursor = shiftDate(cursor, -1);
    }

    const models = Object.entries(modelTokens)
        .map(([id, n]) => ({
            id,
            label: modelLabel(id),
            tokens: n,
            inputTokens: (modelIo[id] || {}).input || 0,
            outputTokens: (modelIo[id] || {}).output || 0,
            share: tokens ? n / tokens : 0
        }))
        .sort((a, b) => b.tokens - a.tokens);

    return {
        from,
        totals: {
            sessions,
            messages,
            toolCalls,
            tokens,
            activeDays: activeDates.length,
            currentStreak,
            longestStreak,
            peakHour,
            peakHourLabel: formatHour(peakHour),
            favoriteModel: models.length ? models[0].label : null
        },
        mobyDickMultiple: Math.floor(tokens / MOBY_DICK_TOKENS),
        models,
        hourCounts
    };
}

// Fold the Bedrock snapshot into the day map and the legacy model split.
//
// Bedrock's cache read/write metrics are folded into its input side by the
// snapshot script, so both sources count tokens the same way.
//
// Tokens merge; sessions, messages, streaks and peak hour do not. Bedrock has no
// notion of a session or a user message — only invocations — so those stay
// transcript-only, and a Bedrock-only day is not an "active day" (computeWindow
// keys that off messages). It contributes tokens to the totals and nothing else.
//
// The modelIo split has to respect the same boundary computeWindow uses: it
// takes per-model in/out from legacy.modelUsage for dates through
// legacy.through, and from each day's own modelIo after that. Bedrock spans
// both sides, so each date is routed to whichever side owns it. Without this,
// everything before the baseline date would count toward the token totals but
// vanish from the model legend.
function mergeBedrock(combined, legacy) {
    if (!fs.existsSync(BEDROCK_SNAPSHOT)) return null;

    let snapshot;
    try {
        snapshot = JSON.parse(fs.readFileSync(BEDROCK_SNAPSHOT, 'utf8'));
    } catch (e) {
        console.warn(`Ignoring unreadable Bedrock snapshot: ${e.message}`);
        return null;
    }

    let tokens = 0;
    let dayCount = 0;

    for (const [date, models] of Object.entries(snapshot.days || {})) {
        const day = combined[date] || emptyDay();
        combined[date] = day;
        dayCount++;

        const beforeBaseline = legacy.through && date <= legacy.through;

        for (const [model, io] of Object.entries(models)) {
            const input = io.input || 0;
            const output = io.output || 0;
            const total = input + output;
            if (!total) continue;

            tokens += total;
            day.tokens = (day.tokens || 0) + total;
            day.modelTokens[model] = (day.modelTokens[model] || 0) + total;

            if (beforeBaseline) {
                const prev = legacy.modelUsage[model] || { input: 0, output: 0 };
                legacy.modelUsage[model] = {
                    input: (prev.input || 0) + input,
                    output: (prev.output || 0) + output
                };
            } else {
                const prev = day.modelIo[model] || { input: 0, output: 0 };
                day.modelIo[model] = { input: prev.input + input, output: prev.output + output };
            }
        }
    }

    return { tokens, days: dayCount, range: [snapshot.firstDate, snapshot.lastDate] };
}

function buildOutput(state) {
    // Deep copy: mergeBedrock writes into legacy.modelUsage and into individual
    // days, and state is persisted straight after this runs. Mutating the live
    // objects would bake the snapshot into the saved history and re-add it on
    // every subsequent run.
    const source = JSON.parse(JSON.stringify(state.legacy || { through: null, hourCounts: {}, days: {} }));
    const legacy = Object.assign({ through: null, hourCounts: {}, days: {}, modelUsage: {} }, source);

    // Disjoint by construction: legacy owns <= through, our scan owns everything after.
    const combined = {};
    for (const [date, day] of Object.entries(legacy.days || {})) combined[date] = day;
    for (const [date, day] of Object.entries(JSON.parse(JSON.stringify(state.days || {})))) combined[date] = day;

    const bedrock = mergeBedrock(combined, legacy);
    if (bedrock) {
        console.log(
            `Bedrock: +${(bedrock.tokens / 1e6).toFixed(1)}M tokens over ${bedrock.days} days ` +
            `(${bedrock.range[0]} -> ${bedrock.range[1]})`
        );
    }

    const dates = Object.keys(combined).sort();
    const today = localDateKey(new Date());

    // Heatmap shading, keyed off tokens rather than messages. Quantiles over
    // active days spread the four levels evenly; a max-relative scale would
    // flatten everything against outlier days.
    //
    // Tokens, because the Bedrock days have no messages to shade by — that work
    // went through the API, not a chat session. Shading by messages left 160 real
    // working days rendering as blank squares.
    const sorted = dates
        .map((d) => combined[d].tokens || 0)
        .filter((n) => n > 0)
        .sort((a, b) => a - b);
    const quantile = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] || 0;
    const thresholds = [quantile(0.25), quantile(0.5), quantile(0.75)];
    const levelFor = (count) => {
        if (!count) return 0;
        if (count <= thresholds[0]) return 1;
        if (count <= thresholds[1]) return 2;
        if (count <= thresholds[2]) return 3;
        return 4;
    };

    // Emit an unbroken date range so the client can grid it into weeks directly.
    const days = [];
    if (dates.length) {
        const last = today > dates[dates.length - 1] ? today : dates[dates.length - 1];
        for (let cur = dates[0]; cur <= last; cur = shiftDate(cur, 1)) {
            const day = combined[cur] || emptyDay();
            days.push({
                date: cur,
                messages: day.messages || 0,
                sessions: day.sessions || 0,
                tokens: day.tokens || 0,
                level: levelFor(day.tokens || 0),
                // Per-model split drives the stacked chart. Only models actually
                // used that day are listed, which keeps the payload small.
                modelTokens: Object.assign({}, day.modelTokens)
            });
        }
    }

    return {
        updatedAt: new Date().toISOString(),
        firstSessionDate: legacy.firstSessionDate || dates[0] || null,
        windows: {
            all: computeWindow(combined, legacy, today, null),
            d30: computeWindow(combined, legacy, today, shiftDate(today, -29)),
            d7: computeWindow(combined, legacy, today, shiftDate(today, -6))
        },
        days
    };
}

// ---------------------------------------------------------------------------

function loadState() {
    if (!fs.existsSync(STATE_FILE)) return { version: 2, legacy: null, days: {} };
    try {
        const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (saved && saved.days) {
            console.log(`Loaded ${Object.keys(saved.days).length} scanned days from ${STATE_FILE}`);
            return saved;
        }
    } catch (e) {
        console.warn(`Ignoring unreadable state file: ${e.message}`);
    }
    return { version: 2, legacy: null, days: {} };
}

function saveState(state) {
    state.updatedAt = new Date().toISOString();
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(`${STATE_FILE}.tmp`, JSON.stringify(state, null, 2));
    fs.renameSync(`${STATE_FILE}.tmp`, STATE_FILE); // atomic, so a crash can't corrupt history
}

async function main() {
    if (!fs.existsSync(PROJECTS_DIR)) {
        console.error(`No ${PROJECTS_DIR} — run this on the machine you use Claude Code for.`);
        process.exit(1);
    }

    const state = loadState();
    const cache = readStatsCache();

    // The baseline is frozen on first run. stats-cache.json only advances when you
    // open the stats panel, and by then the transcripts behind it may already be
    // pruned — so a later cache can cover less than we have already banked.
    // Re-adopt it deliberately with CLAUDE_STATS_RESEED=1.
    if (cache && (!state.legacy || process.env.CLAUDE_STATS_RESEED === '1')) {
        const next = buildLegacy(cache);
        if (state.legacy && next.through && state.legacy.through && next.through < state.legacy.through) {
            console.warn(`Refusing to reseed: cache (${next.through}) is older than baseline (${state.legacy.through}).`);
        } else {
            state.legacy = next;
            // Drop scanned days the new baseline now covers, so nothing counts twice.
            for (const date of Object.keys(state.days)) {
                if (next.through && date <= next.through) delete state.days[date];
            }
            console.log(`Baseline: ${Object.keys(next.days).length} days from stats-cache.json through ${next.through}`);
        }
    } else if (!cache && !state.legacy) {
        console.warn('No stats-cache.json and no saved baseline — history is limited to the transcript window.');
    } else if (state.legacy) {
        console.log(`Baseline: frozen at ${state.legacy.through} (set CLAUDE_STATS_RESEED=1 to re-adopt the cache)`);
    }

    const boundary = state.legacy ? state.legacy.through : null;
    const scanned = await scanTranscripts();

    let adopted = 0;
    let skipped = 0;
    for (const [date, day] of Object.entries(scanned)) {
        if (boundary && date <= boundary) {
            skipped++; // already covered by the baseline
            continue;
        }
        state.days[date] = mergeDay(state.days[date] || emptyDay(), day);
        adopted++;
    }
    console.log(`Adopted ${adopted} scanned days${skipped ? `, skipped ${skipped} already in the baseline` : ''}`);

    saveState(state);

    const output = buildOutput(state);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    const t = output.windows.all.totals;
    console.log('\n=== Claude Code stats ===');
    console.log(`Sessions       : ${t.sessions.toLocaleString()}`);
    console.log(`Messages       : ${t.messages.toLocaleString()}`);
    console.log(`Total tokens   : ${(t.tokens / 1e6).toFixed(1)}M`);
    console.log(`Active days    : ${t.activeDays}`);
    console.log(`Current streak : ${t.currentStreak}d`);
    console.log(`Longest streak : ${t.longestStreak}d`);
    console.log(`Peak hour      : ${t.peakHourLabel}`);
    console.log(`Favorite model : ${t.favoriteModel}`);
    console.log(`Moby-Dicks     : ~${output.windows.all.mobyDickMultiple}x`);
    console.log(`\nWrote ${OUTPUT_FILE}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
