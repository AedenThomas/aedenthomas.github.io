// src/components/ContactLinks.js

import { getCalApi } from "@calcom/embed-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import { motion } from "framer-motion";
import EmailPopup from "./EmailPopup";
import QuickMessageModal from "./QuickMessageModal"; // <-- 1. IMPORT THE NEW MODAL
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid"; // <-- 2. IMPORT AN ICON FOR THE BUTTON

const ContactLinks = ({
  email,
  linkedinUrl,
  githubUrl,
  handleClickableHover,
  isDarkMode,
  isQuickMessageAnimating,
}) => {
  const [contributionData, setContributionData] = useState(null);
  const [intrycContributionData, setIntrycContributionData] = useState(null);
  const [error, setError] = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false); // <-- 3. ADD STATE FOR THE NEW MODAL

  useEffect(() => {
    const fetchContributions = async (url, setter) => {
      try {
        if (!url) {
          throw new Error("GitHub URL is missing");
        }

        const urlParts = url.split("/");
        const username =
          urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

        if (!username) {
          throw new Error("Invalid GitHub URL");
        }

        const apiUrl = `https://github-contributions-api.deno.dev/${username}.json`;
        const response = await axios.get(apiUrl);
        setter(response.data);
      } catch (error) {
        console.error("Error in fetchContributions:", error);
        setError(error.message || "Failed to fetch contributions");
      }
    };

    fetchContributions(githubUrl, setContributionData);
    fetchContributions(
      "https://github.com/AedenThomasIntryc",
      setIntrycContributionData
    );
  }, [githubUrl]);

  const combinedPastYearContributions = useMemo(() => {
    if (!contributionData && !intrycContributionData) return null;

    const mainContributions =
      contributionData?.contributions.flat().slice(-365) || [];
    const intrycContributions =
      intrycContributionData?.contributions.flat().slice(-365) || [];

    // Create a map to combine contributions by date
    const contributionsByDate = new Map();

    mainContributions.forEach((day) => {
      contributionsByDate.set(day.date, day.contributionCount);
    });

    intrycContributions.forEach((day) => {
      const existing = contributionsByDate.get(day.date) || 0;
      contributionsByDate.set(day.date, existing + day.contributionCount);
    });

    // Convert back to array format
    return Array.from(contributionsByDate.entries())
      .map(([date, count]) => ({
        date,
        contributionCount: count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [contributionData, intrycContributionData]);

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
    today.setHours(0, 0, 0, 0);

    const todayContribution = contributions.find((day) => {
      const contribDate = new Date(day.date);
      return contribDate.getTime() === today.getTime();
    });

    return todayContribution ? todayContribution.contributionCount : 0;
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

  const getContributionsSummary = useCallback(() => {
    if (error) return [error];
    if (!combinedPastYearContributions) return ["Loading contributions..."];

    const currentStreak = calculateCurrentStreak(combinedPastYearContributions);
    const longestStreak = calculateLongestStreak(combinedPastYearContributions);
    const todayCount = getTodayContributions(combinedPastYearContributions);

    return [
      `Today: ${todayCount} contributions`,
      `Past year: ${totalPastYearContributions} contributions`,
      `Current streak: ${currentStreak} days`,
      `Longest streak: ${longestStreak} days`,
    ];
  }, [error, combinedPastYearContributions, totalPastYearContributions]);

  const handleCopyEmail = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
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

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between mb-4">
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
              {email}
            </a>
          </div>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
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
                d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                clipRule="evenodd"
              ></path>
            </svg>
            linkedin
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
            onMouseEnter={() => handleClickableHover(true)}
            onMouseLeave={() => handleClickableHover(false)}
            data-tooltip-id="github-tooltip"
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
            github
          </a>
          <Tooltip
            id="github-tooltip"
            place="top"
            effect="solid"
            className="custom-tooltip"
          >
            {Array.isArray(getContributionsSummary()) ? (
              getContributionsSummary().map((line, index) => (
                <div key={index}>{line}</div>
              ))
            ) : (
              <div>{getContributionsSummary()}</div>
            )}
          </Tooltip>

          <button
            data-cal-namespace="15min"
            data-cal-link="aeden/15min"
            className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 custom-cursor-clickable"
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
            className="origin-left text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 ml-4 custom-cursor-clickable"
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
        </div>
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
