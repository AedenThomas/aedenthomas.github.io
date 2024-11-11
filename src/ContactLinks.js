import { getCalApi } from "@calcom/embed-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Tooltip } from "react-tooltip";

const ContactLinks = ({
  email,
  linkedinUrl,
  githubUrl,
  handleClickableHover,
}) => {
  const [contributionData, setContributionData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        if (!githubUrl) {
          throw new Error("GitHub URL is missing");
        }

        const urlParts = githubUrl.split("/");
        const username =
          urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

        if (!username) {
          throw new Error("Invalid GitHub URL");
        }

        const apiUrl = `https://github-contributions-api.deno.dev/${username}.json`;
        const response = await axios.get(apiUrl);
        setContributionData(response.data);
        setError(null);
      } catch (error) {
        console.error("Error in fetchContributions:", error);
        setError(error.message || "Failed to fetch contributions");
      }
    };

    if (githubUrl) {
      fetchContributions();
    }
  }, [githubUrl]);

  const pastYearContributions = useMemo(() => {
    if (!contributionData) return null;
    // Flatten the contributions array and take the last 365 days
    return contributionData.contributions.flat().slice(-365);
  }, [contributionData]);

  const totalPastYearContributions = useMemo(() => {
    if (!pastYearContributions) return 0;
    return pastYearContributions.reduce(
      (sum, day) => sum + day.contributionCount,
      0
    );
  }, [pastYearContributions]);

  const getContributionsSummary = useCallback(() => {
    if (error) return [error];
    if (!contributionData) return ["Loading contributions..."];
  
    const currentStreak = calculateCurrentStreak(pastYearContributions);
    const longestStreak = calculateLongestStreak(pastYearContributions);
    const todayCount = getTodayContributions(pastYearContributions);
  
    return [
      `Today: ${todayCount} contributions`,
      `Past year: ${totalPastYearContributions} contributions`,
      `Current streak: ${currentStreak} days`,
      `Longest streak: ${longestStreak} days`,
    ];
  }, [
    error,
    contributionData,
    pastYearContributions,
    totalPastYearContributions,
  ]);

    const calculateCurrentStreak = (contributions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    // Find today's index or the most recent day
    let currentIndex = contributions.findIndex(day => 
      new Date(day.date) > today
    ) - 1;
    
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
    
    const todayContribution = contributions.find(day => {
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
          <a
            href={`mailto:${email}`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
            onMouseEnter={() => handleClickableHover(true)}
            onMouseLeave={() => handleClickableHover(false)}
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
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
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
            LinkedIn
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 mr-4 custom-cursor-clickable"
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
            GitHub
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
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0 custom-cursor-clickable"
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
            Book a call
          </button>
        </div>
        {/* <a
          href="/Resume.pdf"
          download
          className="text-sm bg-transparent border border-gray-300 text-gray-500 px-4 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200 mt-2 md:mt-0 mr-2 custom-cursor-clickable"
          onClick={() => {
          }}
          onMouseEnter={() => handleClickableHover(true)}
          onMouseLeave={() => handleClickableHover(false)}
        >
          Résumé
        </a> */}
      </div>
    </div>
  );
};

export default ContactLinks;