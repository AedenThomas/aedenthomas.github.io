import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  Suspense,
} from "react";

import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";
import AnimatedGreeting from "./AnimatedGreeting.js";
import "./App.css";
import Project from "./Project.js";
import { education, projects, skills, research, coursework } from "./data";
import ContactLinks from "./ContactLinks";
import LanguageIcon from "./LanguageIcon";
import { getCalApi } from "@calcom/embed-react";
import Privacy from "./BillifyPrivacy.js";
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

  // Add this new debug state to track width transitions
  const [buttonMetrics, setButtonMetrics] = useState({
    currentWidth: 40,
    targetWidth: 40,
    transitionPhase: "idle",
    timestamp: Date.now(),
  });

  const [currentGreeting, setCurrentGreeting] = useState(0);
  const greetings = ["Hey!",
      "Hola!",
      "नमस्ते!",
      "Bonjour!",
      "你好!",
      "Ciao!",
      "Olá!",
      "여보세요!",
      "Hallo!"];

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

    // Log initial theme state

    // Set initial opposite theme
    setTransitionTheme(true);

    // Start animation
    setIsNavigating(true);
    setShowAIPage(true);

    try {
      // Wait for circle animation to complete expansion
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased from 800 to 1500

      // Wait additional time with opposite theme
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Smoothly fade to device theme
      setTransitionTheme(false);

      // Add a delay before navigation to ensure animations complete
      setTimeout(() => {
        navigate("/ai");
      }, 2000); // Increased from 800 to 1500 to match new animation duration
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleProjectHover, handleReachOutMouseLeave]);

  // Add this new state and effect to handle visibility updates
  const [visibleProjects, setVisibleProjects] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const projectId = entry.target.getAttribute('data-project-id');
          setVisibleProjects(prev => {
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
        rootMargin: '50px', // Start loading slightly before they come into view
        threshold: 0.1
      }
    );

    // Observe all project elements
    document.querySelectorAll('[data-project-id]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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

      <button
        onClick={toggleDarkMode}
        onMouseEnter={() => handleClickableHover(true)}
        onMouseLeave={() => handleClickableHover(false)}
        className={`fixed top-4 right-4 p-2 rounded-full custom-cursor-clickable w-10 h-10 flex items-center justify-center transition-all duration-500 ease-in-out ${
          transitionTheme ? "bg-white text-black" : "bg-black text-white"
        }`}
        style={{
          transition:
            "background-color 0.5s ease-in-out, color 0.5s ease-in-out",
        }}
      >
        {transitionTheme ? "☀️" : "🌙"}
      </button>

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
        className={`fixed top-16 right-4 rounded-full custom-cursor-clickable overflow-hidden h-10 ${
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
              I'm a{" "}
              <span className="relative inline-block px-1">
                full-stack developer
              </span>
              , and I've gotten pretty good with{" "}
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
              . You know, I've built all sorts of cool stuff for mobile and web, always trying to find that sweet spot where{" "}
              <span className="relative">
                things work great but also look awesome
              </span>
              . I really get excited about bringing{" "}
              <span className="relative">
                fresh ideas
              </span>{" "}
              to projects, especially in{" "}
              <span className="relative">
                <span className="whitespace-nowrap">startup environments</span>{" "}
                where things are always moving
              </span>
              .
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              My main thing is using my{" "}
              <span className="relative">
                tech skills
              </span>{" "}
              to build stuff that actually matters. I'm super interested in{" "}
              <span className="relative inline-block px-1">
                full-stack development
              </span>{" "}
              and{" "}
              <span className="relative inline-block px-1">
                enterprise solutions
              </span>
              , especially with{" "}
              <span className="relative">
                cool startups
              </span>
              . I'm pretty good at{" "}
              <span className="relative">
                picking up new things quickly
              </span>
              , which comes in handy in the startup world.{" "}
              <span
                className="reach-out-text relative custom-cursor-clickable"
                onMouseEnter={() => {
                  handleReachOutMouseEnter();
                  handleClickableHover(true);
                }}
                onMouseLeave={() => {
                  handleReachOutMouseLeave();
                  handleClickableHover(false);
                }}
              >
                Hey, drop me a line
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
          />
        </div>

        <div className="mb-8 transition-all duration-300">
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
                hoveredProjectIndex !== null && 
                hoveredProjectIndex !== index
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
                  <h3 className="font-semibold group-hover:text-white">
                    {edu.university}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-200">
                    {edu.degree} in {edu.branch}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-300">
                    {edu.period}
                  </p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-300">
                      DOI: {pub.doi}
                    </p>
                  )}
                  <a
                    href="https://link.springer.com/book/9789819766802"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Releasing on 23 Dec 2024
                  </a>
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
