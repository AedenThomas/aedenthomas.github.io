import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// Renders public/claude-stats.json, generated on my Mac by
// scripts/collect-claude-stats.js (there is no API for Claude Code usage stats —
// the numbers come from ~/.claude, so the GitHub Action can't produce them).

// Empty days stay barely-there so the active ones carry the shape.
const LEVEL_CLASSES = [
  "bg-gray-200/70 dark:bg-zinc-900",
  "bg-blue-200/70 dark:bg-blue-500/25",
  "bg-blue-300/80 dark:bg-blue-500/45",
  "bg-blue-400/90 dark:bg-blue-500/65",
  "bg-blue-500 dark:bg-blue-400/90",
];

// Ranked blue ramp, shared by the stacked bars and the legend swatches so the
// two always agree. Mid-weight at the top end so it holds up on white as well
// as black; the palest steps only ever carry fractions of a percent.
const MODEL_COLORS = [
  "#3b6fd4",
  "#5b8ae6",
  "#7fa6ef",
  "#a3c0f5",
  "#c2d6f8",
  "#d8e4fb",
];
const MODEL_COLOR_REST = "#e6edfc";

// The day heatmap and the stacked per-day token chart, hidden for now. Flip to
// true to bring both back; the numbers, summary line and model legend stay
// visible either way.
const SHOW_GRAPHS = false;

const LEGEND_LIMIT = 6;
const CHART_TICKS = 7;

function colorForRank(rank) {
  return MODEL_COLORS[rank] || MODEL_COLOR_REST;
}

function formatCount(n) {
  return (n || 0).toLocaleString();
}

// Lowercase suffixes, to sit with the rest of the page's voice ("265.9m").
// Trailing ".0" is dropped so it reads "2m", not "2.0m".
function formatTokens(n) {
  if (!n) return "0";
  const scale = [
    [1e9, "b"],
    [1e6, "m"],
    [1e3, "k"],
  ].find(([size]) => n >= size);
  if (!scale) return String(n);
  return `${(n / scale[0]).toFixed(1).replace(/\.0$/, "")}${scale[1]}`;
}

function formatDate(iso) {
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toLowerCase();
}

// "11 AM" -> "11am"
function lowerHour(label) {
  return (label || "").replace(/\s+/g, "").toLowerCase();
}

// Round up to a clean 1/2/2.5/5/10 x 10^n. Applied to the gap between ticks
// rather than to the peak itself: rounding a 10.8m peak straight up lands on
// 20m and wastes half the chart, while a nice 2m step gives a 12m top.
function niceStep(value) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 2.5, 5, 10].find((s) => value <= s * magnitude);
  return step * magnitude;
}

// Group days into week columns, Monday-first, padding the first week so weekdays
// line up across every column.
function toWeeks(days) {
  if (!days || !days.length) return [];
  const weeks = [];
  let current = [];

  const weekdayOf = (iso) => (new Date(`${iso}T12:00:00`).getDay() + 6) % 7; // Mon = 0

  const lead = weekdayOf(days[0].date);
  for (let i = 0; i < lead; i++) current.push(null);

  for (const day of days) {
    current.push(day);
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  }
  if (current.length) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }
  return weeks;
}

function Stat({ value, label, first }) {
  return (
    <div
      className={`flex-1 min-w-fit pr-6 ${
        first
          ? ""
          : "sm:border-l sm:border-gray-200 sm:dark:border-zinc-800 sm:pl-6"
      }`}
    >
      <div className="text-2xl md:text-3xl text-gray-900 dark:text-zinc-100 tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-1.5 text-xs text-gray-500 dark:text-zinc-500">
        {label}
      </div>
    </div>
  );
}

// Module-level cache so the payload can be warmed on hover without mounting the
// panel. Mounting it early is not an option: the collapsed wrapper is an in-flow
// last child, and its presence stops the links row's bottom margin collapsing
// into the section's, which shifts everything below down by 16px.
let cachedStats = null;
let inflightStats = null;

export function prefetchClaudeStats() {
  if (cachedStats) return Promise.resolve(cachedStats);
  if (!inflightStats) {
    inflightStats = axios
      .get("/claude-stats.json")
      .then((res) => {
        cachedStats = res.data;
        return cachedStats;
      })
      .catch((err) => {
        inflightStats = null; // let a later attempt retry
        throw err;
      });
  }
  return inflightStats;
}

function ClaudeCodeStats() {
  // Seeded from the cache so a hover-warmed payload is present on the very first
  // render, which lets the parent measure the real height instead of the
  // skeleton's and then having to retarget the transition.
  const [data, setData] = useState(cachedStats);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [showAllModels, setShowAllModels] = useState(false);

  useEffect(() => {
    if (data) return;
    prefetchClaudeStats()
      .then(setData)
      .catch((err) => {
        console.warn("Could not fetch Claude Code stats", err);
        setFailed(true);
      });
  }, [data]);

  const weeks = useMemo(() => (data ? toWeeks(data.days) : []), [data]);

  const models = useMemo(
    () => (data ? data.windows.all.models : []),
    [data]
  );

  // Rank drives the colour in both the chart and the legend.
  const rankById = useMemo(() => {
    const map = {};
    models.forEach((m, i) => {
      map[m.id] = i;
    });
    return map;
  }, [models]);

  // Only days that actually spent tokens get a bar, so the dead months between
  // February and June collapse instead of padding the chart with 100 blanks.
  const chart = useMemo(() => {
    if (!data) return null;
    const active = data.days.filter((d) => d.tokens > 0);
    if (!active.length) return null;

    const bars = active.map((day) => ({
      date: day.date,
      tokens: day.tokens,
      // Strongest model last so it stacks at the bottom of the bar.
      segments: Object.entries(day.modelTokens || {})
        .map(([id, tokens]) => ({ id, tokens, rank: rankById[id] ?? 99 }))
        .sort((a, b) => b.rank - a.rank),
    }));

    const peak = Math.max(...bars.map((b) => b.tokens));
    const step = niceStep(peak / (CHART_TICKS - 1));
    const max = step * (CHART_TICKS - 1);
    const ticks = Array.from({ length: CHART_TICKS }, (_, i) => step * i);

    // Evenly spaced date labels along the axis.
    const labelCount = Math.min(7, bars.length);
    const labels = Array.from({ length: labelCount }, (_, i) =>
      formatDate(
        bars[Math.round((i * (bars.length - 1)) / (labelCount - 1))].date
      )
    );

    return { bars, max, ticks, labels };
  }, [data, rankById]);

  if (failed) return null;

  if (!data) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-wrap gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[6.5rem]">
              <div className="h-7 w-20 rounded bg-gray-100 dark:bg-zinc-900" />
              <div className="mt-2 h-3 w-14 rounded bg-gray-100 dark:bg-zinc-900" />
            </div>
          ))}
        </div>
        {SHOW_GRAPHS && (
          <div className="mt-6 h-[102px] rounded bg-gray-100 dark:bg-zinc-900" />
        )}
      </div>
    );
  }

  const t = data.windows.all.totals;
  const tools = data.toolUse;

  const summary = [
    `${t.currentStreak} day streak`,
    `longest was ${t.longestStreak}`,
    `mostly around ${lowerHour(t.peakHourLabel)}`,
    t.favoriteModel ? `${t.favoriteModel.toLowerCase()} is my favorite model` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const visibleModels = showAllModels ? models : models.slice(0, LEGEND_LIMIT);
  const hiddenCount = models.length - visibleModels.length;

  return (
    <div>
      <div className="flex flex-wrap gap-y-5">
        <Stat value={formatCount(t.sessions)} label="sessions" first />
        <Stat value={formatCount(t.messages)} label="messages" />
        <Stat value={formatTokens(t.tokens)} label="tokens" />
        <Stat value={formatCount(t.activeDays)} label="active days" />
        {tools && tools.subagents > 0 && (
          <Stat value={formatCount(tools.subagents)} label="subagents" />
        )}
        {tools && tools.skills > 0 && (
          <Stat value={formatCount(tools.skills)} label="skill runs" />
        )}
      </div>

      {SHOW_GRAPHS && (
        <div className="mt-6 overflow-x-auto pb-1">
          <div className="flex gap-[3px] min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) =>
                  day ? (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      className={`w-[11px] h-[11px] md:w-3 md:h-3 rounded-[3px] ${
                        LEVEL_CLASSES[day.level]
                      }`}
                    />
                  ) : (
                    <div
                      key={`pad-${di}`}
                      className="w-[11px] h-[11px] md:w-3 md:h-3"
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-zinc-500 min-h-[1rem]">
        {hovered ? (
          <span className="tabular-nums">
            {formatDate(hovered.date)} ·{" "}
            {hovered.messages
              ? `${formatCount(hovered.messages)} messages · ${formatTokens(
                  hovered.tokens
                )} tokens`
              : hovered.tokens
              ? // Bedrock days: real spend, but no session to count messages in.
                `${formatTokens(hovered.tokens)} tokens · via api`
              : "nothing"}
          </span>
        ) : (
          <span>{summary}</span>
        )}
      </div>

      {chart && (
        <div className={SHOW_GRAPHS ? "mt-8" : "mt-4"}>
          {SHOW_GRAPHS && (
            <>
            <div className="flex gap-2">
              <div className="relative h-32 w-9 shrink-0">
                {chart.ticks.map((tick) => (
                  <div
                    key={tick}
                    className="absolute right-0 -translate-y-1/2 text-[10px] leading-none text-gray-400 dark:text-zinc-600 tabular-nums"
                    style={{ bottom: `${(tick / chart.max) * 100}%` }}
                  >
                    {formatTokens(tick)}
                  </div>
                ))}
              </div>

              <div className="relative h-32 flex-1 min-w-0">
                {chart.ticks.map((tick) => (
                  <div
                    key={tick}
                    className="absolute inset-x-0 border-t border-gray-100 dark:border-zinc-900"
                    style={{ bottom: `${(tick / chart.max) * 100}%` }}
                  />
                ))}

                <div className="absolute inset-0 flex items-end gap-px">
                  {chart.bars.map((bar) => (
                    <div
                      key={bar.date}
                      onMouseEnter={() => setHoveredBar(bar)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    >
                      {bar.segments.map((segment) => (
                        <div
                          key={segment.id}
                          style={{
                            height: `${(segment.tokens / chart.max) * 100}%`,
                            background: colorForRank(segment.rank),
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2 flex justify-between pl-11 text-[10px] text-gray-400 dark:text-zinc-600">
              {chart.labels.map((label, i) => (
                <span key={`${label}-${i}`}>{label}</span>
              ))}
            </div>

            <div className="mt-1 text-xs text-gray-500 dark:text-zinc-500 min-h-[1rem]">
              {hoveredBar && (
                <span className="tabular-nums">
                  {formatDate(hoveredBar.date)} ·{" "}
                  {formatTokens(hoveredBar.tokens)} tokens ·{" "}
                  {models.find(
                    (m) =>
                      m.id ===
                      hoveredBar.segments[hoveredBar.segments.length - 1].id
                  )?.label.toLowerCase() || ""}
                </span>
              )}
            </div>
            </>
          )}

          <div className="mt-4 space-y-1.5">
            {visibleModels.map((model) => (
              <div
                key={model.id}
                className="flex items-baseline gap-3 text-xs md:text-sm"
              >
                <span
                  className="mt-[1px] h-2.5 w-2.5 shrink-0 rounded-sm self-center"
                  style={{ background: colorForRank(rankById[model.id]) }}
                />
                <span className="text-gray-800 dark:text-zinc-200">
                  {model.label.toLowerCase()}
                </span>
                <span className="ml-auto text-gray-400 dark:text-zinc-600 tabular-nums whitespace-nowrap">
                  {formatTokens(model.inputTokens)} in ·{" "}
                  {formatTokens(model.outputTokens)} out
                </span>
                <span className="w-12 shrink-0 text-right text-gray-600 dark:text-zinc-400 tabular-nums">
                  {(model.share * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {(hiddenCount > 0 || showAllModels) && (
            <button
              onClick={() => setShowAllModels((open) => !open)}
              className="mt-2 text-xs text-gray-400 dark:text-zinc-600 hover:underline custom-cursor-clickable"
            >
              {showAllModels ? "show less" : `show ${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ClaudeCodeStats;
