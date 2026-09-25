// src/components/ContactLinks.js
import { copyToClipboard } from "./utils";

import { getCalApi } from "@calcom/embed-react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import EmailPopup from "./EmailPopup";
import QuickMessageModal from "./QuickMessageModal"; // <-- 1. IMPORT THE NEW MODAL
import ClaudeCodeStats, { prefetchClaudeStats } from "./ClaudeCodeStats";
import { ChatBubbleLeftRightIcon, InformationCircleIcon } from "@heroicons/react/24/solid"; // <-- 2. IMPORT AN ICON FOR THE BUTTON
import { 
  SiSwift, SiJavascript, SiPython, SiTypescript, SiReact, SiMarkdown, SiCss3, SiHtml5, SiDart, SiCplusplus, SiDotnet, SiTerraform, SiJson
} from "react-icons/si";
import { VscFileCode, VscFileBinary, VscTerminal } from "react-icons/vsc";

const ContactLinks = ({
  email,
  linkedinUrl,
  githubUrl,
  handleClickableHover,
  isDarkMode,
  isQuickMessageAnimating,
  // Visitors from India don't get the GitHub stats hover or the AI usage panel.
  // Starts true in Home until the geo lookup says otherwise, so nothing flashes.
  hideStatsExtras = false,
}) => {
  const [adoContributionData, setAdoContributionData] = useState(null); // <-- NEW STATE FOR ADO
  const [githubStatsData, setGithubStatsData] = useState(null); // <-- STATE FOR GITHUB LINE STATS
  const [error, setError] = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false); // <-- 3. ADD STATE FOR THE NEW MODAL
  const [isLinesExpanded, setIsLinesExpanded] = useState(false); // <-- NEW STATE FOR LINES EXPANSION
  const [isAiUsageOpen, setIsAiUsageOpen] = useState(false);
  const [hasOpenedAiUsage, setHasOpenedAiUsage] = useState(false);
  const [aiUsageHeight, setAiUsageHeight] = useState(0);
  const [canHoverAiUsage, setCanHoverAiUsage] = useState(false);
  const aiUsageRef = useRef(null);
  // Hover opens the panel and it stays open: collapsing when the pointer
  // drifted off left people unsure whether to hover or click. Only a click (or
  // Escape) closes it. After a click-close, hover stays inert until the pointer
  // leaves, so the panel doesn't spring straight back open under the cursor.
  const aiUsageHoverSuppressed = useRef(false);
  // When hover opened it. A click right after that is someone who meant to
  // open it by clicking, so it must not close it again.
  const aiUsageHoverOpenedAt = useRef(0);

  // Hover opens it on a mouse, tap opens it on a touchscreen. Asking the device
  // beats asking the viewport width: a small window on a laptop still has a
  // mouse, and a tablet at desktop width does not.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHoverAiUsage(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Mount the content first, then open on the next frame. Opening in the same
  // tick as the mount means the element's first rendered frame already carries
  // the full height — there is no 0 to transition from, so it snaps open. This
  // only showed up from the second hover onwards, once a height had been
  // measured and kept.
  const openAiUsage = useCallback(() => {
    setHasOpenedAiUsage(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsAiUsageOpen(true));
    });
  }, []);

  const hoverOpenAiUsage = useCallback(() => {
    if (isAiUsageOpen || aiUsageHoverSuppressed.current) return;
    aiUsageHoverOpenedAt.current = Date.now();
    openAiUsage();
  }, [isAiUsageOpen, openAiUsage]);

  const toggleAiUsage = useCallback(() => {
    if (isAiUsageOpen) {
      if (Date.now() - aiUsageHoverOpenedAt.current < 700) return;
      aiUsageHoverSuppressed.current = true;
      setIsAiUsageOpen(false);
      return;
    }
    openAiUsage();
  }, [isAiUsageOpen, openAiUsage]);

  useEffect(() => {
    if (!isAiUsageOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setIsAiUsageOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAiUsageOpen]);

  // The panel animates height in plain CSS rather than via framer. Everything
  // below it (~60 layoutId nodes across the experience list) is part of framer's
  // shared-layout projection, and a framer height animation makes it re-measure
  // and tween all of them every frame — which is what made the expand stutter
  // and the experience text jitter as the collapse finished. A CSS transition
  // triggers no re-renders, so those nodes just reflow with the document.
  //
  // The height is always an explicit pixel value, never `auto`: `auto` can't be
  // interpolated, so collapsing from it would need a pinned intermediate frame.
  // A ResizeObserver keeps the value current instead, so the stats loading in,
  // "show more" expanding, a window resize or a late font all retarget the
  // transition rather than clipping against a stale measurement.
  useEffect(() => {
    const el = aiUsageRef.current;
    if (!el) return undefined;

    const measure = () => setAiUsageHeight(el.scrollHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasOpenedAiUsage]);

  useEffect(() => {
    // Fetch ADO stats from local JSON (generated by GitHub Action)
    const fetchAdoStats = async () => {
       try {
         const response = await axios.get('/ado-contributions.json');
         setAdoContributionData(response.data);
       } catch (err) {
         console.warn("Could not fetch ADO contributions (file might not exist yet)", err);
       }
    };
    fetchAdoStats();

    // Fetch GitHub stats (line diffs + contribution calendar) from local JSON,
    // generated nightly by the Action straight from GitHub's own GraphQL API —
    // replaces the old github-contributions-api.deno.dev proxy, which Deno
    // Deploy Classic permanently sunset on 2026-07-20.
    const fetchGithubStats = async () => {
       try {
         const response = await axios.get('/github-stats.json');
         setGithubStatsData(response.data);
       } catch (err) {
         console.warn("Could not fetch GitHub stats (file might not exist yet)", err);
         setError("Failed to fetch contributions");
       }
    };
    fetchGithubStats();
  }, [githubUrl]);

  const combinedPastYearContributions = useMemo(() => {
    if (!githubStatsData && !adoContributionData) return null;

    const githubContributions = githubStatsData?.contributions || [];
    const adoContributions = adoContributionData?.contributions || [];

    // Create a map to combine contributions by date
    const contributionsByDate = new Map();

    githubContributions.forEach((day) => {
      contributionsByDate.set(day.date, (contributionsByDate.get(day.date) || 0) + (day.count || 0));
    });

    adoContributions.forEach((day) => {
       const existing = contributionsByDate.get(day.date) || 0;
       // Azure DevOps data might need date formatting check, but script outputs YYYY-MM-DD
       contributionsByDate.set(day.date, existing + day.count);
    });

    // Convert back to array format
    return Array.from(contributionsByDate.entries())
      .map(([date, count]) => ({
        date,
        contributionCount: count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [adoContributionData, githubStatsData]);

  const totalPastYearContributions = useMemo(() => {
    if (!combinedPastYearContributions) return 0;
    return combinedPastYearContributions.reduce(
      (sum, day) => sum + day.contributionCount,
      0
    );
  }, [combinedPastYearContributions]);

  const calculateCurrentStreak = (contributions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    // Find today's index or the most recent day
    let currentIndex =
      contributions.findIndex((day) => new Date(day.date) > today) - 1;

    // If not found, start from the last day
    if (currentIndex === -2) {
      currentIndex = contributions.length - 1;
    }

    // Count streak backwards from current day
    for (let i = currentIndex; i >= 0; i--) {
      if (contributions[i].contributionCount > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getTodayContributions = (contributions) => {
    const today = new Date();
    // Compare YYYY-MM-DD strings to avoid timezone mismatch on midnight timestamps
    const todayStr = today.toISOString().split('T')[0];

    const todayContribution = contributions.find((day) => {
      // day.date is already YYYY-MM-DD
      return day.date === todayStr;
    });

    return todayContribution ? todayContribution.contributionCount : 0;
  };

  const getPastWeekContributions = (contributions) => {
    const today = new Date();
    // Use simple date comparison
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    // Normalize to YYYY-MM-DD strings for comparison
    const todayStr = today.toISOString().split('T')[0];
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    return contributions
      .filter((day) => {
        return day.date >= oneWeekAgoStr && day.date <= todayStr;
      })
      .reduce((sum, day) => sum + day.contributionCount, 0);
  };

  const calculateLongestStreak = (contributions) => {
    let longestStreak = 0;
    let currentStreak = 0;
    for (const day of contributions) {
      if (day.contributionCount > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return longestStreak;
  };

  const contributionBreakdown = useMemo(() => {
    if (!githubStatsData && !adoContributionData) return null;
    const githubTotal =
      githubStatsData?.contributions?.reduce((s, d) => s + (d.count || 0), 0) || 0;
    const adoTotal =
      adoContributionData?.contributions?.reduce((s, d) => s + d.count, 0) || 0;
    const adoPrs =
      adoContributionData?.contributions?.reduce((s, d) => s + (d.prs || 0), 0) || 0;
    return { github: githubTotal, ado: adoTotal, adoPrs };
  }, [adoContributionData, githubStatsData]);

  // Aggregate line stats from both GitHub and ADO
  const lineStats = useMemo(() => {
    const githubAdded = githubStatsData?.totalLinesAdded || 0;
    const githubDeleted = githubStatsData?.totalLinesDeleted || 0;
    const adoAdded = adoContributionData?.totalLinesAdded || 0;
    const adoDeleted = adoContributionData?.totalLinesDeleted || 0;

    // Aggregate extension stats
    const combinedExtensions = {};
    
    // Helper to merge stats
    const mergeStats = (sourceStats) => {
      if (!sourceStats) return;
      Object.entries(sourceStats).forEach(([ext, stats]) => {
        if (!combinedExtensions[ext]) {
          combinedExtensions[ext] = { added: 0, deleted: 0 };
        }
        combinedExtensions[ext].added += stats.added || 0;
        combinedExtensions[ext].deleted += stats.deleted || 0;
      });
    };

    mergeStats(githubStatsData?.extensionStats);
    mergeStats(adoContributionData?.extensionStats);

    // Aggregated extensions sorting
    // Filter out extensions with 0 changes and sort by lines added (descending)
    // Also logic to filter by whitelist for display could be here or in render.
    // Let's filter here for cleaner render logic, but keep raw for total calculation? 
    // Wait, total calculation is separate.
    
    const sortedExtensions = Object.entries(combinedExtensions)
      .filter(([_, stats]) => stats.added > 0 || stats.deleted > 0)
      .sort((a, b) => b[1].added - a[1].added);

    return {
      totalAdded: githubAdded + adoAdded,
      totalDeleted: githubDeleted + adoDeleted,
      extensions: sortedExtensions
    };
  }, [githubStatsData, adoContributionData]);
  
  const ALLOWED_EXTENSIONS = new Set([
     '.swift', '.js', '.py', '.tsx', '.md', '.ts', '.css', 
     '.jsx', '.dart', '.sh', '.cs'
  ]);

  const getContributionsSummary = useCallback(() => {
    if (error) return [error];
    if (!combinedPastYearContributions) return ["Loading contributions..."];

    const currentStreak = calculateCurrentStreak(combinedPastYearContributions);
    const todayCount = getTodayContributions(combinedPastYearContributions);
    const pastWeekCount = getPastWeekContributions(combinedPastYearContributions);

    // Format large numbers with commas
    const formatNumber = (num) => num.toLocaleString();
    
    // Flame SVG icon component (Lucide-style)
    const FlameIcon = () => (
      <svg className={`w-3 h-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>
      </svg>
    );

    // Lock SVG icon component (Lucide-style)
    // Lock SVG icon component (Lucide-style)
    const LockIcon = () => (
      <svg className="w-[11px] h-[11px] opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    );

    // File Icon Component
    const FileIcon = ({ ext }) => {
      const className = "w-3 h-3 opacity-70";
      switch (ext) {
        case '.swift': return <SiSwift className={className} color="#F05138" />;
        case '.js': return <SiJavascript className={className} color="#F7DF1E" />;
        case '.py': return <SiPython className={className} color="#3776AB" />;
        case '.tsx': 
        case '.jsx': return <SiReact className={className} color="#61DAFB" />;
        case '.ts': return <SiTypescript className={className} color="#3178C6" />;
        case '.css': return <SiCss3 className={className} color="#1572B6" />;
        case '.html': return <SiHtml5 className={className} color="#E34F26" />;
        case '.md': return <SiMarkdown className={className} />;
        case '.json': return <SiJson className={className} />;
        case '.dart': return <SiDart className={className} color="#0175C2" />;
        case '.cpp': 
        case '.cc': return <SiCplusplus className={className} color="#00599C" />;
        case '.cs': return <SiDotnet className={className} color="#512BD4" />;
        case '.tf': return <SiTerraform className={className} color="#623CE4" />;
        case '.sh': return <VscTerminal className={className} />;
        case '.lock': return <VscFileBinary className={className} />;
        default: return <VscFileCode className={className} />;
      }
    };

    // Chevron Down SVG icon
    const ChevronDownIcon = ({ className }) => (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    );

    return (
      <div className={`w-[280px] text-sm font-mono select-none ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
        <div className="space-y-3">
          {/* Past 24h / Past week section */}
          <div className={`pb-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'}`}>
            {todayCount > 0 && (
              <div className="flex justify-between items-baseline">
                <span>past 24h</span>
                <div>
                  <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}>{todayCount}</span>
                  <span className="text-[10px] ml-1 opacity-60">commits</span>
                </div>
              </div>
            )}
            <div className={`flex justify-between items-baseline ${todayCount > 0 ? 'mt-1' : ''}`}>
              <span>past week</span>
              <div>
                <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}>{pastWeekCount}</span>
                <span className="text-[10px] ml-1 opacity-60">commits</span>
              </div>
            </div>
          </div>

          {/* Past year section */}
          <div className="space-y-1">
            <div className={`flex justify-between items-baseline ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
              <span>past year</span>
              <div>
                <span>{totalPastYearContributions}</span>
                <span className="text-[10px] ml-1 opacity-60">commits</span>
              </div>
            </div>
            
          {/* Breakdown */}
            <div className="pl-2 flex flex-col gap-1 text-xs pt-1 opacity-80">
              {contributionBreakdown && contributionBreakdown.ado > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>↳ personal</span>
                    <span>{contributionBreakdown.github}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">↳ work <LockIcon /></span>
                    <span>{contributionBreakdown.ado}</span>
                  </div>
                </>
              )}
              {lineStats && (lineStats.totalAdded > 0 || lineStats.totalDeleted > 0) && (
                <>
                  <div 
                    className={`flex justify-between items-center pt-1 mt-1 border-t border-dashed ${isDarkMode ? 'border-zinc-700' : 'border-zinc-400'} cursor-pointer hover:opacity-100 transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLinesExpanded(!isLinesExpanded);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      ↳ lines
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isLinesExpanded ? 'rotate-180' : ''}`} />
                    </span>
                    <span>
                      <span className="text-green-600 dark:text-green-400">+{formatNumber(lineStats.totalAdded)}</span> / <span className="text-red-600 dark:text-red-400">-{formatNumber(lineStats.totalDeleted)}</span>
                    </span>
                  </div>
                  
                  {/* Expanded Extension Stats */}
                  <AnimatePresence>
                    {isLinesExpanded && lineStats.extensions && lineStats.extensions.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // Apple-like ease
                        className="overflow-hidden"
                      >
                        <div className="pl-2 flex flex-col gap-0.5 pt-1 border-l-2 border-zinc-700/20 dark:border-zinc-500/20 ml-1 my-1 max-h-[150px] overflow-y-auto pr-1">
                          {lineStats.extensions
                            .filter(([ext]) => ALLOWED_EXTENSIONS.has(ext)) // Filter by whitelist
                            .map(([ext, stats]) => (
                            <div key={ext} className="flex justify-between items-center text-xs"> {/* Match usage of text-xs from parent/lines row */}
                              <span className="font-mono flex items-center gap-1.5">
                                <FileIcon ext={ext} />
                                {ext}
                              </span>
                              <span className="font-mono">
                                <span className="text-green-600 dark:text-green-400">+{formatNumber(stats.added)}</span> / <span className="text-red-600 dark:text-red-400">-{formatNumber(stats.deleted)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Scroll indicator (Inverted V) */}
                        <div className="flex justify-center -mt-1 pb-1 opacity-50">
                          <ChevronDownIcon className="w-5 h-5 animate-bounce" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
          
          {/* Streak Section */}
          {currentStreak > 0 && (
            <div className={`pt-3 mt-2 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'} flex justify-between items-center text-xs opacity-90`}>
              <div className="flex items-center gap-1.5">
                <FlameIcon />
                <span>current streak:</span>
              </div>
              <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}>{currentStreak} days</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    error,
    combinedPastYearContributions,
    totalPastYearContributions,
    contributionBreakdown,
    lineStats,
    isDarkMode,
    isLinesExpanded // Added dependency
  ]);

  const handleCopyEmail = async (e) => {
    e.preventDefault();
    try {
      await copyToClipboard(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleEmailClick = (e) => {
    e.preventDefault();
    setIsEmailPopupOpen(true);
  };

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "week_view",
      });
    })();
  }, []);

  const [isLinkedinHovered, setIsLinkedinHovered] = useState(false); // New state for hover animation

  const [isMobile, setIsMobile] = useState(false);
  const [githubTapped, setGithubTapped] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleGithubClick = (e) => {
    if (isMobile && !hideStatsExtras) {
      if (!githubTapped) {
        e.preventDefault();
        setGithubTapped(true);
      } else {
        // Allow navigation on second tap
        setGithubTapped(false); // Reset for next time
      }
    }
    // Desktop behaves normally (link works immediately)
  };

  const handleTooltipClick = () => {
    if (isMobile) {
      window.open(githubUrl, "_blank", "noopener,noreferrer");
    }
  };

  const formattedSummary = useMemo(() => {
    const summary = getContributionsSummary();
    
    return (
      <div>
        {summary}
        {isMobile && (
          <div className="text-xs text-zinc-400 mt-3 italic text-center font-normal border-t border-zinc-700 pt-2">
            (tap again to open)
          </div>
        )}
      </div>
    );
  }, [getContributionsSummary, isMobile]);

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center">
          <div
            className="relative group"
            onMouseEnter={() => {
              handleClickableHover(true);
              setShowCopy(true);
            }}
            onMouseLeave={() => {
              handleClickableHover(false);
              // Don't hide immediately, add a delay
              setTimeout(() => {
                // Only hide if we're not hovering over the button
                if (!document.querySelector(".copy-button:hover")) {
                  setShowCopy(false);
                }
              }, 100);
            }}
          >
            {showCopy && (
              <button
                onClick={handleCopyEmail}
                onMouseEnter={() => {
                  handleClickableHover(true);
                  setShowCopy(true);
                }}
                className={`copy-button absolute transform -translate-x-1/2 -top-8 left-1/2 text-xs px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {copied ? (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                    Copy email
                  </span>
                )}
              </button>
            )}
            <a
              href={`mailto:${email}`}
              onClick={handleEmailClick}
              className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              <motion.span layoutId="contact-email">{email}</motion.span>
            </a>
          </div>
          <div className="relative group/linkedin">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
              onMouseEnter={() => {
                handleClickableHover(true);
                setIsLinkedinHovered(true);
              }}
              onMouseLeave={() => {
                handleClickableHover(false);
                setIsLinkedinHovered(false);
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <motion.span layoutId="contact-linkedin">linkedin</motion.span>
            </a>
            {/* Handwritten annotation - conditionally rendered safely */}
            {isLinkedinHovered && (
              <div
                className="linkedin-hover-annotation absolute pointer-events-none"
                style={{ left: '10px', top: '100%' }}
              >
                <svg
                  width="250"
                  height="80"
                  viewBox="0 0 250 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ overflow: 'visible' }}
                >
                  <path
                    className="animate-draw-arrow"
                    d="M 30 5 C 15 20, 5 30, 30 45 C 50 55, 70 50, 95 50"
                    stroke={isDarkMode ? "white" : "black"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    className="animate-draw-arrow-head"
                    d="M 90 45 L 95 50 L 90 55"
                    stroke={isDarkMode ? "white" : "black"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <text
                    className="animate-fade-in-text"
                    x="105"
                    y="55"
                    fill={isDarkMode ? "white" : "black"}
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: '30px', /* Kept user's requested 30px size */
                      fontStyle: 'italic',
                      fontWeight: '500'
                    }}
                    transform="rotate(-2, 105, 55)"
                  >
                    not active here...
                  </text>
                </svg>
              </div>
            )}
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGithubClick}
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
            onMouseEnter={() => handleClickableHover(true)}
            onMouseLeave={() => {
              handleClickableHover(false);
              // Reset tapped state on mouse leave (mainly for desktop/mixed pointer devices, 
              // or helping reset on mobile if they manage to "leave")
              if (isMobile) setGithubTapped(false);
            }}
            data-tooltip-id={hideStatsExtras ? undefined : "github-tooltip"}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              ></path>
            </svg>
            <motion.span layoutId="contact-github">github</motion.span>
            {!hideStatsExtras && (
              <InformationCircleIcon className="w-4 h-4 ml-1 text-gray-400 animate-pulse" />
            )}
          </a>
          {/* <a
            href="https://x.com/realaeden"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
            onMouseEnter={() => handleClickableHover(true)}
            onMouseLeave={() => handleClickableHover(false)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            x
          </a> */}
          {!hideStatsExtras && (
          <Tooltip
            id="github-tooltip"
            place="bottom"
            className="custom-tooltip"
            openOnClick={isMobile} // Hover on desktop, click on mobile
            afterHide={() => { if(isMobile) setGithubTapped(false); }} // Reset state when tooltip hides
            clickable={true}
            delayShow={200} // Increased delay to prevent positioning flash
            delayHide={300} // Prevent accidental closing during layout shifts
          >
            <div onClick={handleTooltipClick} className="cursor-pointer">
              {formattedSummary}
            </div>
          </Tooltip>
          )}

          <button
            data-cal-namespace="15min"
            data-cal-link="aeden/15min"
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 custom-cursor-clickable mr-4"
            onMouseEnter={() => handleClickableHover(true)}
            onMouseLeave={() => handleClickableHover(false)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            book a call
          </button>

          {/* --- 4. ADD THE NEW "QUICK MESSAGE" BUTTON HERE --- */}
          <motion.button
            onClick={() => setIsQuickMessageOpen(true)}
            className="origin-left text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
            onMouseEnter={() => handleClickableHover(true)}
            onMouseLeave={() => handleClickableHover(false)}
            animate={
              isQuickMessageAnimating
                ? {
                    // Keyframes adjusted for a 2-second, high-impact animation
                    scale: [1, 1.4, 1.3, 1.4, 1.35, 1.4, 1.3, 1.35, 1],
                    rotate: [0, -2, 2.5, -3, 3, -2.5, 2, -1, 1.5, 0],
                    x: [0, 3, -3, 4, -4, 3.5, -3, 2, -1, 0],
                    y: [0, -2, 2.5, -3, 3, -2, 2.5, -1.5, 1, 0],

                    // Transition settings updated
                    transition: {
                      duration: 2, // Animation now lasts for 2 seconds
                      ease: "easeInOut",
                    },
                  }
                : {
                    // Return to default state when not animating
                    scale: 1,
                    rotate: 0,
                    x: 0,
                    y: 0,
                  }
            }
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            quick message
          </motion.button>

          {!hideStatsExtras && (
          <button
            onClick={toggleAiUsage}
            aria-expanded={isAiUsageOpen}
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 custom-cursor-clickable"
            onMouseEnter={() => {
              handleClickableHover(true);
              prefetchClaudeStats().catch(() => {});
              if (canHoverAiUsage) hoverOpenAiUsage();
            }}
            onMouseLeave={() => {
              handleClickableHover(false);
              aiUsageHoverSuppressed.current = false;
            }}
          >
            {/* Claude mark. It paints with currentColor, so it takes the
                button's own light/dark text colour — no second asset. */}
            <svg
              className="w-4 h-4 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
              fillRule="evenodd"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
            </svg>
            ai usage
            <svg
              className={`w-3 h-3 ml-1 transition-transform duration-300 ${isAiUsageOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          )}
        </div>
      </div>

      {/* The wrapper stays in the DOM at zero height and only its contents mount
          on demand. Mounting and unmounting the wrapper itself around each
          expansion changed whether the row's bottom margin could collapse, which
          moved everything below by 16px the instant the collapse finished — the
          jolt under the experience section. An empty, margin-less, zero-height
          box costs nothing to leave in place. */}
      <div
        className="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
        style={{ height: isAiUsageOpen ? aiUsageHeight : 0 }}
        aria-hidden={!isAiUsageOpen}
        inert={!isAiUsageOpen ? "" : undefined}
      >
        {hasOpenedAiUsage && !hideStatsExtras && (
          <div ref={aiUsageRef} className="pt-4">
            <div className="pt-6 border-t border-gray-200 dark:border-zinc-800">
              <ClaudeCodeStats />
            </div>
          </div>
        )}
      </div>

      {/* Your existing Email Popup */}
      <EmailPopup
        email={email}
        isOpen={isEmailPopupOpen}
        onClose={() => setIsEmailPopupOpen(false)}
        handleClickableHover={handleClickableHover}
        isDarkMode={isDarkMode}
      />

      {/* --- 5. ADD THE NEW QUICK MESSAGE MODAL RENDER HERE --- */}
      <QuickMessageModal
        isOpen={isQuickMessageOpen}
        onClose={() => setIsQuickMessageOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ContactLinks;
