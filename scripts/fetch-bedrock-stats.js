const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// One-time snapshot of Bedrock token usage into scripts/bedrock-snapshot.json,
// which collect-claude-stats.js folds into the portfolio's totals.
//
// This is deliberately NOT part of the daily refresh: the Bedrock work is
// finished, so the numbers are history. Committing the snapshot also means the
// site doesn't depend on AWS credentials or on CloudWatch's 15-month retention,
// which would otherwise start silently dropping the oldest days.
//
// Re-run it by hand (needs a configured AWS CLI) only if that changes:
//   node scripts/fetch-bedrock-stats.js
//
// Counts tokens processed: uncached input + output + cache reads + cache writes.
// Bedrock reports the cache metrics separately, so all four are summed to match
// how the transcript side counts (and how Claude Code's own panel reports its
// headline total).

const REGIONS = ['us-east-1', 'eu-west-2'];
// Cache reads and writes are input-side tokens, so they fold into `input` —
// the same treatment the transcript side gives cache_read / cache_creation.
const METRICS = {
    InputTokenCount: 'input',
    OutputTokenCount: 'output',
    CacheReadInputTokenCount: 'input',
    CacheWriteInputTokenCount: 'input'
};
const OUTPUT_FILE = path.join(__dirname, 'bedrock-snapshot.json');

// CloudWatch keeps hourly rollups for 455 days; anything older is already gone.
const LOOKBACK_DAYS = 450;

function aws(args, region) {
    return JSON.parse(
        execFileSync('aws', [...args, '--region', region, '--output', 'json'], {
            encoding: 'utf8',
            maxBuffer: 256 * 1024 * 1024
        })
    );
}

function localDateKey(date) {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD, matches the collector
}

// Strip the region routing prefix and the version suffix so Bedrock's ids collapse
// onto the same keys the transcripts use:
//   us.anthropic.claude-opus-4-6-v1              -> claude-opus-4-6
//   global.anthropic.claude-sonnet-4-5-2025...-v1:0 -> claude-sonnet-4-5-20250929
// The collector's modelLabel() then drops the trailing release date, so a model
// invoked through several profiles lands in one legend row instead of three.
function normalizeModelId(id) {
    return id
        .replace(/^(us|eu|apac|global)\./, '')
        .replace(/^anthropic\./, '')
        .replace(/-v\d+(:\d+)?$/, '');
}

// Which model ids this account has actually invoked. list-metrics only reports
// ids seen in the last ~2 weeks, so it can't be the source; the inference
// profiles give the full candidate set and the metric query decides.
function candidateModelIds(region) {
    const ids = new Set();
    let profiles;
    try {
        profiles = aws(['bedrock', 'list-inference-profiles'], region);
    } catch (e) {
        console.warn(`  could not list inference profiles in ${region}: ${e.message}`);
        return [];
    }
    for (const p of profiles.inferenceProfileSummaries || []) {
        const id = p.inferenceProfileId;
        if (!id.includes('anthropic')) continue;
        ids.add(id);
        // Direct on-demand invocations use the bare id, with no routing prefix.
        ids.add(id.replace(/^(us|eu|apac|global)\./, ''));
    }
    return [...ids].sort();
}

function fetchRegion(region, days) {
    const modelIds = candidateModelIds(region);
    if (!modelIds.length) return;
    console.log(`${region}: probing ${modelIds.length} model ids`);

    const end = new Date();
    const start = new Date(end.getTime() - LOOKBACK_DAYS * 86400000);

    const queries = [];
    const keyMap = {};
    let i = 0;
    for (const modelId of modelIds) {
        for (const metric of Object.keys(METRICS)) {
            const id = `q${i++}`;
            keyMap[id] = { modelId, field: METRICS[metric] };
            queries.push({
                Id: id,
                MetricStat: {
                    Metric: {
                        Namespace: 'AWS/Bedrock',
                        MetricName: metric,
                        Dimensions: [{ Name: 'ModelId', Value: modelId }]
                    },
                    // Hourly, then bucketed into local days below. Asking for
                    // 86400 directly would bucket on the query's start offset,
                    // giving days that straddle two of the portfolio's.
                    Period: 3600,
                    Stat: 'Sum'
                },
                ReturnData: true
            });
        }
    }

    const byDate = {};
    // get-metric-data caps at 500 queries and paginates results by token.
    for (let c = 0; c < queries.length; c += 400) {
        const chunk = queries.slice(c, c + 400);
        let token = null;
        do {
            const args = [
                'cloudwatch', 'get-metric-data',
                '--start-time', start.toISOString(),
                '--end-time', end.toISOString(),
                '--metric-data-queries', JSON.stringify(chunk)
            ];
            if (token) args.push('--next-token', token);
            const page = aws(args, region);
            for (const res of page.MetricDataResults || []) {
                const { modelId, field } = keyMap[res.Id];
                const model = normalizeModelId(modelId);
                res.Timestamps.forEach((ts, idx) => {
                    const value = res.Values[idx];
                    if (!value) return;
                    const date = localDateKey(new Date(ts));
                    const day = (byDate[date] = byDate[date] || {});
                    const io = (day[model] = day[model] || { input: 0, output: 0 });
                    io[field] += value;
                });
            }
            token = page.NextToken || null;
        } while (token);
    }
    return byDate;
}

function main() {
    const merged = {};
    for (const region of REGIONS) {
        const byDate = fetchRegion(region, LOOKBACK_DAYS) || {};
        for (const [date, models] of Object.entries(byDate)) {
            const day = (merged[date] = merged[date] || {});
            for (const [model, io] of Object.entries(models)) {
                const prev = day[model] || { input: 0, output: 0 };
                day[model] = { input: prev.input + io.input, output: prev.output + io.output };
            }
        }
    }

    const dates = Object.keys(merged).sort();
    let input = 0;
    let output = 0;
    for (const d of dates) {
        for (const io of Object.values(merged[d])) {
            input += io.input;
            output += io.output;
        }
    }

    const snapshot = {
        source: 'aws-bedrock',
        capturedAt: new Date().toISOString(),
        regions: REGIONS,
        note: 'Uncached input + output only; cache reads/writes excluded to match the transcript figures.',
        totals: { input, output, tokens: input + output, activeDays: dates.length },
        firstDate: dates[0] || null,
        lastDate: dates[dates.length - 1] || null,
        days: merged
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2) + '\n');

    console.log('\n=== Bedrock snapshot ===');
    console.log(`Range        : ${snapshot.firstDate} -> ${snapshot.lastDate}`);
    console.log(`Active days  : ${dates.length}`);
    console.log(`Input tokens : ${input.toLocaleString()}`);
    console.log(`Output tokens: ${output.toLocaleString()}`);
    console.log(`Total        : ${((input + output) / 1e6).toFixed(1)}M`);
    console.log(`\nWrote ${OUTPUT_FILE}`);
}

main();
