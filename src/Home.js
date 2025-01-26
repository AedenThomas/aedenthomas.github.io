import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import ReactMarkdown from "react-markdown";

import { motion, AnimatePresence } from "framer-motion";
import AnimatedGreeting from "./AnimatedGreeting.js";
import "./App.css";
import Project from "./Project.js";
import {
  education,
  projects,
  skills,
  research,
  coursework,
  experience,
  notableInteractions,
} from "./data";
import ContactLinks from "./ContactLinks";
import LanguageIcon from "./LanguageIcon";
import { useNavigate } from "react-router-dom";

// Add this near the top of the file, outside the component
const AIPage = React.lazy(() => import("./AIPage"));

function Home({
  isDarkMode,
  initialTransitionTheme,
  isMobile,
  mousePosition,
  isHoveredClickable,
  toggleDarkMode,
  handleClickableHover,
  hoveredProjectIndex,
  isReachOutHovered,
  handleLanguageHover,
  handleLanguageLeave,
  hoveredLanguage,
  handleReachOutMouseEnter,
  handleReachOutMouseLeave,
  email,
  linkedinUrl,
  githubUrl,
  isLiveVisible,
  handleProjectHover,
  skillsRef,
  isSkillsInView,
  educationRef,
  isEducationInView,
  publicationsRef,
  isPublicationsInView,
  courseworkRef,
  isCourseworkInView,
}) {
  const navigate = useNavigate();
  const [isAIButtonHovered, setIsAIButtonHovered] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const aiButtonRef = useRef(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isPrefetched, setIsPrefetched] = useState(false);
  const [showAIPage, setShowAIPage] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    prefetchStatus: "pending",
    animationStatus: "idle",
    aiPageStatus: "hidden",
    navigationStatus: "idle",
  });
  const [buttonDebug, setButtonDebug] = useState({
    hoverState: true,
    timestamp: Date.now(),
    animationPhase: "initial",
  });
  // Initialize themeTransition based on isDarkMode prop
  const [transitionTheme, setTransitionTheme] = useState(
    initialTransitionTheme !== undefined ? initialTransitionTheme : isDarkMode
  );

  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCardHover = (index) => {
    setHoveredCard(index);
  };

  const handleCardLeave = (index) => {
    setHoveredCard(null);
  };

  // Add this new debug state to track width transitions
  const [buttonMetrics, setButtonMetrics] = useState({
    currentWidth: 40,
    targetWidth: 40,
    transitionPhase: "idle",
    timestamp: Date.now(),
  });

  const [expandedExperiences, setExpandedExperiences] = useState(new Set());

  const [expandedItems, setExpandedItems] = useState(new Set());

  // Add a click handler
  const handleExperienceClick = (index) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  const toggleExperience = (index) => {
    setExpandedExperiences((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const [currentGreeting, setCurrentGreeting] = useState(0);
  const greetings = [
    "Hey!",
    "Hola!",
    "नमस्ते!",
    "Bonjour!",
    "你好!",
    "Ciao!",
    "Olá!",
    "여보세요!",
    "Hallo!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => (prev + 1) % greetings.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const updateButtonPosition = () => {
    if (aiButtonRef.current) {
      const rect = aiButtonRef.current.getBoundingClientRect();
      setButtonPosition({
        x: rect.left,
        y: rect.top,
      });
    }
  };

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);
    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, []);

  // Add prefetch logic
  useEffect(() => {
    // Prefetch AIPage component
    const prefetchAIPage = async () => {
      setDebugInfo((prev) => ({ ...prev, prefetchStatus: "starting" }));
      try {
        const module = await import("./AIPage");
        setDebugInfo((prev) => ({ ...prev, prefetchStatus: "success" }));
        setIsPrefetched(true);
      } catch (error) {
        console.error("❌ AIPage prefetch failed:", error);
        setDebugInfo((prev) => ({ ...prev, prefetchStatus: "error" }));
      }
    };
    prefetchAIPage();
  }, []);

  // Enhanced button position tracking
  useEffect(() => {}, [buttonPosition]);

  const handleAIClick = async () => {
    setDebugInfo((prev) => ({
      ...prev,
      animationStatus: "starting",
      timestamp: new Date().toISOString(),
    }));

    updateButtonPosition();

    // Update URL with hash routing
    window.history.pushState({}, "", "/#/ai"); // Changed from '/ai' to '/#/ai'

    // Set initial opposite theme
    setTransitionTheme(true);

    // Start animation
    setIsNavigating(true);
    setShowAIPage(true);

    try {
      // Wait for circle animation to complete expansion
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Changed from 2000 to 1000

      // Wait additional time with opposite theme
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Smoothly fade to device theme
      setTransitionTheme(false);

      // Instead of navigating, we'll reload the app state
      setTimeout(() => {
        // This will trigger a re-render to show the AI page
        // without a full navigation
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, 2000);
    } catch (error) {
      console.error("❌ [AI Transition] Error during transition:", error);
      setTransitionTheme(false);
      setDebugInfo((prev) => ({
        ...prev,
        error: error.message,
        animationStatus: "error",
      }));
    }
  };
  // Enhanced debug effect
  useEffect(() => {}, [
    debugInfo,
    buttonPosition,
    isNavigating,
    showAIPage,
    transitionTheme,
  ]);

  // Add transition state tracking
  useEffect(() => {
    if (isNavigating) {
      const transitionSteps = {
        start: Date.now(),
        circleAnimation: null,
        themeTransition: null,
        navigation: null,
        complete: null,
      };

      const circleTimer = setTimeout(() => {
        transitionSteps.circleAnimation = Date.now();
      }, 2000); // Increased from 800 to 1500

      const themeTimer = setTimeout(() => {
        transitionSteps.themeTransition = Date.now();
      }, 2500); // Increased from 1300 to 2000

      const navigationTimer = setTimeout(() => {
        transitionSteps.navigation = Date.now();
        transitionSteps.complete = Date.now();

        // Calculate durations
        const durations = {
          totalDuration: transitionSteps.complete - transitionSteps.start,
          circleAnimation:
            transitionSteps.circleAnimation - transitionSteps.start,
          themeTransition:
            transitionSteps.themeTransition - transitionSteps.circleAnimation,
          navigation:
            transitionSteps.navigation - transitionSteps.themeTransition,
        };
      }, 4000); // Increased from 1800 to 3500

      return () => {
        [circleTimer, themeTimer, navigationTimer].forEach(clearTimeout);
      };
    }
  }, [isNavigating]);

  // Remove duplicate useEffects and combine them into one comprehensive effect:
  useEffect(() => {
    // Delay the theme transition
    const timeout = setTimeout(() => {
      setTransitionTheme(isDarkMode);
    }, 50); // Small delay to ensure smooth transition

    return () => {
      clearTimeout(timeout);
    };
  }, [isDarkMode]);

  // Add this new effect near other useEffects
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAIButtonHovered(false);
      setButtonDebug((prev) => ({
        ...prev,
        hoverState: false,
        animationPhase: "collapsing",
        timestamp: Date.now(),
      }));
    }, 5000); // Changed from 3000 to 5000 to match the new duration

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Add debug effect to monitor button state
  useEffect(() => {}, [isAIButtonHovered, buttonDebug]);

  // Define animation variants
  const textVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  // Add motion variants for the AI text animation
  const aiTextVariants = {
    expanded: {
      width: "auto",
      x: 0,
      opacity: 1,
      paddingLeft: "16px",
      transition: {
        width: { duration: 1, ease: [0.4, 0, 0.2, 1] },
        x: { duration: 1, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.6, delay: 0.3, ease: "easeOut" },
        paddingLeft: { duration: 0.6, ease: "easeOut" },
      },
    },
    collapsed: {
      width: 0,
      x: 40,
      opacity: 0,
      paddingLeft: 0,
      transition: {
        opacity: { duration: 0.3, ease: "easeOut" },
        width: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
        x: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
        paddingLeft: { duration: 0.3, ease: "easeOut" },
      },
    },
  };

  // Add this modified useEffect for the initial animation
  useEffect(() => {
    // Slightly longer delay before initial expansion
    const expandTimer = setTimeout(() => {
      setIsAIButtonHovered(true);
      setButtonDebug((prev) => ({
        ...prev,
        animationPhase: "expanding",
        timestamp: Date.now(),
      }));
    }, 800); // Increased from 500ms for a more deliberate start

    // Longer display time before collapse
    const collapseTimer = setTimeout(() => {
      setIsAIButtonHovered(false);
      setButtonDebug((prev) => ({
        ...prev,
        animationPhase: "collapsing",
        timestamp: Date.now(),
      }));
    }, 4000); // Increased from 3500ms for longer visibility

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(collapseTimer);
    };
  }, []); // Empty dependency array for one-time execution

  // Add this debug effect to monitor button state changes
  useEffect(() => {}, [isAIButtonHovered, buttonDebug]);

  // Add this debug effect near your other useEffects
  useEffect(() => {}, [isAIButtonHovered, buttonDebug]);

  // Add this debug effect to monitor width changes
  useEffect(() => {
    if (aiButtonRef.current) {
    }
  }, [isAIButtonHovered]);

  // Add this effect to track width changes in real-time
  useEffect(() => {
    let frameId;
    const trackWidth = () => {
      if (aiButtonRef.current) {
        const currentWidth = aiButtonRef.current.offsetWidth;
        setButtonMetrics((prev) => ({
          ...prev,
          currentWidth,
          timestamp: Date.now(),
          transitionPhase:
            currentWidth === prev.currentWidth
              ? "stable"
              : currentWidth > prev.currentWidth
              ? "expanding"
              : "shrinking",
        }));
        frameId = requestAnimationFrame(trackWidth);
      }
    };

    frameId = requestAnimationFrame(trackWidth);
    return () => cancelAnimationFrame(frameId);
  }, [isAIButtonHovered]);

  // First, define button variants for width animation
  const buttonVariants = {
    expanded: {
      width: "auto",
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    collapsed: {
      width: "40px",
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
        delay: 0.2, // Slight delay to let text animation start
      },
    },
  };

  const getOperatingSystem = () => {
    // Try modern navigator.userAgentData first
    if (navigator.userAgentData) {
      const platform = navigator.userAgentData.platform.toLowerCase();
      if (platform.includes("mac")) return "mac";
      if (platform.includes("windows")) return "windows";
      if (platform.includes("linux")) return "linux";
    }

    // Fallback to userAgent string
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("mac")) return "mac";
    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("linux")) return "linux";

    return "other";
  };

  // Add this state to track scroll position
  const [isScrolling, setIsScrolling] = useState(false);

  // Remove or modify the scroll handler to not interfere with project visibility
  useEffect(() => {
    let scrollTimeout;

    const handleScroll = () => {
      // Only reset hover states, don't affect project visibility
      handleProjectHover(null);
      handleReachOutMouseLeave();

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Reset scroll state after scrolling stops
      }, 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleProjectHover, handleReachOutMouseLeave]);

  // Add this new state and effect to handle visibility updates
  const [visibleProjects, setVisibleProjects] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const projectId = entry.target.getAttribute("data-project-id");
          setVisibleProjects((prev) => {
            const newSet = new Set(prev);
            if (entry.isIntersecting) {
              newSet.add(projectId);
            } else {
              newSet.delete(projectId);
            }
            return newSet;
          });
        });
      },
      {
        root: null,
        rootMargin: "200px 0px", // Changed from '0px' to '200px 0px' to trigger earlier
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9], // Modified thresholds for finer detection
      }
    );

    // Observe all project elements
    document.querySelectorAll("[data-project-id]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Add this inside the Home component, after the existing state declarations
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);

  // Add this useEffect for keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (
        ((getOperatingSystem() === "mac" && e.metaKey) ||
          (getOperatingSystem() !== "mac" && e.ctrlKey)) &&
        e.shiftKey &&
        e.key.toLowerCase() === "l"
      ) {
        e.preventDefault();
        toggleDarkMode();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleDarkMode]);

  // Add these new state variables at the top with other state declarations
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Add these handlers with other function declarations
  const openImageModal = (image) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onAnimationStart={() => {}}
      className={`min-h-screen flex flex-col items-center p-4 md:p-8 theme-transition custom-cursor ${
        transitionTheme ? "bg-black text-white" : "bg-[#F2F0E9] text-gray-900"
      }`}
      style={{
        transition: "background-color 1.5s ease-in-out, color 1.5s ease-in-out",
      }}
    >
      {!isMobile && (
        <>
          <div
            className={`fixed w-5 h-5 rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(0, 0, 0, 0.5)",
              boxShadow: isDarkMode
                ? "0 0 10px rgba(255, 255, 255, 0.5)"
                : "0 0 10px rgba(0, 0, 0, 5)",
            }}
          />
          <div
            className={`fixed w-7 h-7 rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
              isHoveredClickable
                ? "opacity-100 scale-110"
                : "opacity-0 scale-100"
            }`}
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
              backgroundColor: "rgba(74, 222, 128, 0.7)",
              boxShadow: "0 0 15px rgba(74, 222, 128, 0.7)",
              animation: isHoveredClickable ? "pulse 1.5s infinite" : "none",
            }}
          />
        </>
      )}

      <div className="relative">
        <button
          onClick={toggleDarkMode}
          onMouseEnter={() => {
            handleClickableHover(true);
            setShowThemeTooltip(true);
          }}
          onMouseLeave={() => {
            handleClickableHover(false);
            setShowThemeTooltip(false);
          }}
          className={`fixed top-4 right-4 p-2 rounded-full custom-cursor-clickable w-10 h-10 z-50 flex items-center justify-center transition-all duration-500 ease-in-out ${
            transitionTheme ? "bg-white text-black" : "bg-black text-white"
          }`}
          style={{
            transition:
              "background-color 0.5s ease-in-out, color 0.5s ease-in-out",
          }}
        >
          {transitionTheme ? "☀️" : "🌙"}
        </button>

        <AnimatePresence>
          {showThemeTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className={`fixed top-4 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                isDarkMode
                  ? "bg-white text-black shadow-light"
                  : "bg-black text-white shadow-dark"
              }`}
              style={{
                boxShadow: isDarkMode
                  ? "0 2px 8px rgba(255, 255, 255, 0.1)"
                  : "0 2px 8px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                right: "4.5rem",
              }}
            >
              Press{" "}
              {getOperatingSystem() === "mac" ? (
                <>
                  <kbd className="px-2 py-1 rounded bg-opacity-20 bg-gray-500 mx-1 font-mono text-xs">
                    ⌘
                  </kbd>
                  <kbd className="px-2 py-1 rounded bg-opacity-20 bg-gray-500 mx-1 font-mono text-xs">
                    ⇧
                  </kbd>
                </>
              ) : (
                <>
                  <kbd className="px-2 py-1 rounded bg-opacity-20 bg-gray-500 mx-1 font-mono text-xs">
                    Ctrl
                  </kbd>
                  <kbd className="px-2 py-1 rounded bg-opacity-20 bg-gray-500 mx-1 font-mono text-xs">
                    Shift
                  </kbd>
                </>
              )}
              <kbd className="px-2 py-1 rounded bg-opacity-20 bg-gray-500 mx-1 font-mono text-xs">
                L
              </kbd>
              to toggle theme
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        ref={aiButtonRef}
        onClick={handleAIClick}
        onMouseEnter={() => {
          handleClickableHover(true);
          setIsAIButtonHovered(true);
        }}
        onMouseLeave={() => {
          handleClickableHover(false);
          setIsAIButtonHovered(false);
        }}
        className={`fixed top-16 right-4 rounded-full custom-cursor-clickable overflow-hidden h-10 z-50 ${
          // Add z-50 here
          isDarkMode ? "bg-white text-black" : "bg-black text-white"
        }`}
        variants={buttonVariants}
        initial="collapsed"
        animate={isAIButtonHovered ? "expanded" : "collapsed"}
        style={{
          minWidth: "40px",
          maxWidth: "200px",
          willChange: "width",
          transform: "translateZ(0)", // Force GPU acceleration
        }}
        onAnimationStart={() => {}}
        onAnimationComplete={() => {}}
      >
        {/* Container for animated content */}
        <div className="relative w-full h-full">
          {/* Static emoji container - positioned absolutely */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[40px] flex items-center justify-center"
            style={{
              transform: "none",
              transition: "none",
            }}
          >
            <span className="text-sm" style={{ transition: "none" }}>
              🤖
            </span>
          </div>

          {/* Animated text container */}
          <div
            className="h-full flex items-center"
            style={{
              paddingRight: "40px",
              transition: "none",
            }}
          >
            <AnimatePresence mode="wait">
              {isAIButtonHovered && (
                <motion.span
                  key="ai-text"
                  className="whitespace-nowrap overflow-hidden pl-4"
                  variants={aiTextVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  onAnimationStart={() => {}}
                  onAnimationComplete={() => {}}
                >
                  Talk to AI Aeden
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.button>

      <AnimatePresence mode="wait">
        {isNavigating && (
          <motion.div
            initial={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              clipPath: `circle(0px at ${buttonPosition.x + 16}px ${
                buttonPosition.y + 16
              }px)`,
              zIndex: 9999,
              backgroundColor: isDarkMode ? "#F2F0E9" : "#000000", // Add background color
            }}
            animate={{
              clipPath: `circle(300vh at ${buttonPosition.x + 16}px ${
                buttonPosition.y + 16
              }px)`, // Increased from 200vh to 300vh
            }}
            transition={{
              duration: 2, // Increased from 0.8 to 1.5
              ease: [0.22, 1, 0.36, 1], // Custom easing function for smoother animation
            }}
            className={`w-screen h-screen overflow-hidden`} // Add these classes
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
                </div>
              }
            >
              <motion.div
                animate={{
                  transition: { duration: 0.5 },
                }}
                className="w-full h-full"
              >
                <AIPage
                  isDarkMode={transitionTheme ? !isDarkMode : isDarkMode}
                  isMobile={isMobile}
                  toggleDarkMode={toggleDarkMode}
                  handleClickableHover={handleClickableHover}
                />
              </motion.div>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null
              ? "blur-xs"
              : isReachOutHovered
              ? "blur-sm"
              : ""
          }`}
        >
          <div className="mb-8">
            <img
              src="/Face.webp"
              alt="Face"
              width="45"
              height="45"
              className="text-4xl mb-7"
            />

            <h1 className="text-4xl font-bold mb-5 mt-5 h-[2em] flex items-center">
              <AnimatePresence mode="wait">
                <AnimatedGreeting
                  key={currentGreeting}
                  greeting={greetings[currentGreeting]}
                  className="handwritten-font"
                />
              </AnimatePresence>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              I'm a full-stack developer, and I've gotten pretty good with{" "}
              <span
                onMouseEnter={() => handleLanguageHover("react")}
                onMouseLeave={handleLanguageLeave}
                className="relative hover:text-green-500 transition-all duration-300"
              >
                React
                <AnimatePresence mode="wait">
                  {hoveredLanguage === "react" && (
                    <LanguageIcon language="react" />
                  )}
                </AnimatePresence>
              </span>
              ,{" "}
              <span
                onMouseEnter={() => handleLanguageHover("react native")}
                onMouseLeave={handleLanguageLeave}
                className="relative"
              >
                React Native
                <AnimatePresence>
                  {hoveredLanguage === "react native" && (
                    <LanguageIcon language="react native" />
                  )}
                </AnimatePresence>
              </span>
              ,{" "}
              <span
                onMouseEnter={() => handleLanguageHover("flutter")}
                onMouseLeave={handleLanguageLeave}
                className="relative"
              >
                Flutter
                <AnimatePresence>
                  {hoveredLanguage === "flutter" && (
                    <LanguageIcon language="flutter" />
                  )}
                </AnimatePresence>
              </span>
              ,{" "}
              <span
                onMouseEnter={() => handleLanguageHover("asp.net core")}
                onMouseLeave={handleLanguageLeave}
                className="relative"
              >
                ASP.NET Core
                <AnimatePresence>
                  {hoveredLanguage === "asp.net core" && (
                    <LanguageIcon language="asp.net core" />
                  )}
                </AnimatePresence>
              </span>
              , and{" "}
              <span
                onMouseEnter={() => handleLanguageHover("python")}
                onMouseLeave={handleLanguageLeave}
                className="relative"
              >
                Python
                <AnimatePresence>
                  {hoveredLanguage === "python" && (
                    <LanguageIcon language="python" />
                  )}
                </AnimatePresence>
              </span>
              . I've built all sorts of cool stuff for mobile and web, always
              trying to find that sweet spot where{" "}
              <span className="relative">
                things work great but also look awesome
              </span>
              . I really get excited about bringing{" "}
              <span className="relative">fresh ideas</span> to projects,
              especially in{" "}
              <span className="relative">
                <span className="whitespace-nowrap">startup environments</span>{" "}
                where things are always moving
              </span>
              .
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              My main thing is using my tech skills to build stuff that actually
              matters. I'm super interested in enterprise solutions, especially
              with <span className="relative">cool startups</span>. I'm pretty
              good at{" "}
              <span className="relative">picking up new things quickly</span>,
              which comes in handy in the startup world.{" "}
              <span
                className="reach-out-text relative custom-cursor-clickable"
                onMouseEnter={() => {
                  handleReachOutMouseEnter();
                  handleClickableHover(true);
                  setIsAIButtonHovered(true); // Trigger AI button hover
                }}
                onMouseLeave={() => {
                  handleReachOutMouseLeave();
                  handleClickableHover(false);
                  setIsAIButtonHovered(false); // Reset AI button hover
                }}
              >
                Drop me a line
              </span>{" "}
              if you wanna chat about working together!
            </p>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null ? "blur-xs" : ""
          }`}
        >
          <ContactLinks
            email={email}
            linkedinUrl={linkedinUrl}
            githubUrl={githubUrl}
            handleClickableHover={handleClickableHover}
            isDarkMode={isDarkMode}
          />
        </div>


        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null || isReachOutHovered ? "blur-xs" : ""
          }`}
        >
        <div
          className={`mb-8 transition-all duration-300 ${
            isReachOutHovered ? "blur-sm" : ""
          }`}
        >
          <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
            ~/experience
          </h2>
          {experience.map((exp, index) => (
            <motion.div
              key={index}
              className="mb-2 relative bg-transparent rounded-lg p-4 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => {
                handleCardHover(index);
                handleClickableHover(true);
              }}
              onMouseLeave={() => {
                handleCardLeave(index);
                handleClickableHover(false);
              }}
              onClick={() => toggleExperience(index)}
            >
              <div className="flex items-start gap-3">
                {exp.logo && (
                  <img
                    src={exp.logo}
                    alt={`${exp.company} logo`}
                    className="w-8 h-8 mt-1 shrink-0"
                  />
                )}
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {exp.company}
                    </h3>
                    {exp.url && (
                      <a
                        href={exp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <svg
                          className="w-4 h-4 inline"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {exp.position}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{exp.location}</span>
                    <span>{exp.period}</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                    {exp.description}
                  </p>

                  <div className="relative">
                    <motion.div
                      className="relative overflow-hidden"
                      initial={{ height: 80 }}
                      animate={{
                        height: expandedExperiences.has(index)
                          ? "auto"
                          : hoveredCard === index
                          ? "auto"
                          : 80,
                        transition: { duration: 0.3, ease: "easeInOut" },
                      }}
                    >
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {exp.highlights.map((highlight, i) => (
                          <li key={i} className="ml-4 mb-2">
                            {highlight}
                          </li>
                        ))}
                      </ul>

                      {!expandedExperiences.has(index) &&
                        hoveredCard !== index && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F2F0E9] dark:from-black to-transparent pointer-events-none z-0" />
                        )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div
          className={`mb-8 transition-all duration-300 ${
            isReachOutHovered ? "blur-sm" : ""
          }`}
        >
          <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
            ~/notable interactions
          </h2>
          {notableInteractions.map((interaction, index) => (
            <motion.div
              key={index}
              className={`mb-4 p-4 rounded-lg hover:bg-navy-800 dark:hover:bg-navy-900 transition-transform duration-200 ease-in-out 
      ${interaction.image ? "custom-cursor-clickable" : ""}`} // Add custom cursor only if image exists
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              onMouseEnter={() =>
                interaction.image && handleClickableHover(true)
              }
              onMouseLeave={() =>
                interaction.image && handleClickableHover(false)
              }
              onClick={() =>
                interaction.image && openImageModal(interaction.image)
              }
            >
              <div className="flex items-start">
                {interaction.logo && (
                  <img
                    src={
                      typeof interaction.logo === "string"
                        ? interaction.logo
                        : isDarkMode
                        ? interaction.logo.dark
                        : interaction.logo.light
                    }
                    alt={`${interaction.company} logo`}
                    className="w-8 h-8 mr-3 mt-1"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold group-hover:text-white">
                      {interaction.company}
                    </h3>
                    {interaction.url && (
                      <a
                        href={interaction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <svg
                          className="w-4 h-4 inline"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {interaction.period}
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{interaction.description}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>


</div>
        <AnimatePresence>
          {isImageModalOpen && selectedImage && (
            <motion.div
              className={`fixed inset-0 ${
                isDarkMode
                  ? "dark-mode-backdrop"
                  : "bg-black bg-opacity-30 backdrop-blur"
              } flex items-center justify-center z-[9998]`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onClick={closeImageModal}
            >
              <motion.div
                className={`${
                  isDarkMode ? "bg-black" : "bg-white"
                } rounded-2xl overflow-hidden max-w-[90vw] max-h-[90vh]`}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt="Interaction preview"
                  className="w-full h-auto object-contain max-h-[80vh]"
                  loading="lazy"
                  style={{
                    maxWidth: "800px",
                    width: "100%",
                    height: "auto",
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`mb-8 transition-all duration-300 ${
            isReachOutHovered ? "blur-sm" : ""
          }`}
        >
          <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
            ~/side projects
          </h2>
          {projects.map((project, index) => (
            <Project
              key={index}
              project={project}
              index={index}
              isDarkMode={isDarkMode}
              isLiveVisible={isLiveVisible}
              handleClickableHover={handleClickableHover}
              onProjectHover={handleProjectHover}
              isBlurred={
                hoveredProjectIndex !== null && hoveredProjectIndex !== index
              }
              hoveredProjectIndex={hoveredProjectIndex}
              isReachOutHovered={isReachOutHovered}
            />
          ))}
        </div>

        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null || isReachOutHovered ? "blur-xs" : ""
          }`}
        >
          <div ref={skillsRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-5 text-gray-500 dark:text-gray-400">
              ~/skills
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isSkillsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {skills.map((skill, index) => (
                <motion.span
                  key={index}
                  className="bg-gray-200 text-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-full px-3 py-1 text-sm cursor-pointer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    isSkillsInView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  transition={{ delay: index * 0.05 }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 },
                  }}
                >
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </div>

          <div ref={educationRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
              ~/education
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isEducationInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5 }}
            >
              {education.map((edu, index) => (
                <motion.div
                  key={index}
                  className="mb-4 p-2 rounded-lg hover:bg-navy-800 dark:hover:bg-navy-900 transition-transform duration-200 ease-in-out"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isEducationInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center">
                    {edu.logo && (
                      <img
                        src={edu.logo}
                        alt={`${edu.university} logo`}
                        className="w-6 h-6 mr-3"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold group-hover:text-white">
                        {edu.university}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-200">
                        {edu.degree} in {edu.branch}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-300">
                        {edu.period}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div ref={publicationsRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
              ~/research
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isPublicationsInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5 }}
            >
              {research.map((pub, index) => (
                <motion.div
                  key={index}
                  className="mb-4 p-2 rounded-lg hover:bg-navy-800 dark:hover:bg-navy-900"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isPublicationsInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <h3 className="font-semibold group-hover:text-white">
                    {pub.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-200">
                    {pub.authors}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-300">
                    {pub.journal}, {pub.year}
                  </p>
                  {pub.doi && (
                    <p className="text-sm text-blue-500 group-hover:text-gray-300">
                      DOI:{" "}
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        {pub.doi}
                      </a>
                    </p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div ref={courseworkRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
              ~/coursework
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isCourseworkInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {coursework.map((course, index) => (
                <motion.span
                  key={index}
                  className="bg-gray-200 text-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-full px-3 py-1 text-sm cursor-pointer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    isCourseworkInView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  transition={{ delay: index * 0.05 }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 },
                  }}
                >
                  {course}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Home;
