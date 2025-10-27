import React, { useState, useEffect, useRef, Suspense } from "react";
import ReactMarkdown from "react-markdown"; // Add this import
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Add this import
import {
  DocumentTextIcon,
  LightBulbIcon,
  CodeBracketIcon,
  MapIcon,
  StarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import AnimatedGreeting from "./AnimatedGreeting";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { ArrowUpIcon } from "@heroicons/react/24/solid";

const Home = React.lazy(() => import("./Home")); // Add this import

// Add these constants at the top of the file with other constants
const email = "hey@aeden.me";
const linkedinUrl = "https://www.linkedin.com/in/aedenthomas/";
const githubUrl = "https://github.com/AedenThomas/";

// First, add these button variants near the top of the component
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
      delay: 0.2,
    },
  },
};

// Add near the top of the file after other imports
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

function AIPage({
  isDarkMode,
  toggleDarkMode,
  handleClickableHover,
  isMobile,
}) {
  // Add debug mount tracking
  useEffect(() => {
    return () => {};
  }, []);

  // Track theme transitions
  useEffect(() => {
    const timeout = setTimeout(() => {
      setThemeTransition(isDarkMode);
    }, 50);

    return () => clearTimeout(timeout);
  }, [isDarkMode]);

  // Track animation states
  const [animationState, setAnimationState] = useState({
    mounting: true,
    contentFade: false,
    themeTransition: false,
  });

  useEffect(() => {}, [animationState]);

  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentGreeting, setCurrentGreeting] = useState(0);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isHoveredClickable, setIsHoveredClickable] = useState(false); // Add this line
  const [isHomeButtonHovered, setIsHomeButtonHovered] = useState(false);
  const [themeTransition, setThemeTransition] = useState(isDarkMode);
  const [isNavigating, setIsNavigating] = useState(false);
  const homeButtonRef = useRef(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [themeTransitionDirection, setThemeTransitionDirection] =
    useState(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false); // Add this state
  const oppositeTheme = !isDarkMode; // Add this line

  // Add new state to track clicked buttons
  const [clickedButtons, setClickedButtons] = useState(new Set());

  // Add effect to smoothly transition the theme
  useEffect(() => {
    const timeout = setTimeout(() => {
      setThemeTransition(isDarkMode);
    }, 50); // Small delay to ensure the animation starts properly

    return () => clearTimeout(timeout);
  }, [isDarkMode]);

  // Add effect to track button position
  useEffect(() => {
    const updateButtonPosition = () => {
      if (homeButtonRef.current) {
        const rect = homeButtonRef.current.getBoundingClientRect();
        setButtonPosition({
          x: rect.left,
          y: rect.top,
        });
      }
    };

    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);
    return () => window.removeEventListener("resize", updateButtonPosition);
  }, []);

  // Add this function before handleHomeClick
  const updateButtonPosition = () => {
    if (homeButtonRef.current) {
      const rect = homeButtonRef.current.getBoundingClientRect();
      setButtonPosition({
        x: rect.left,
        y: rect.top,
      });
    }
  };

  // Update handleClickableHover to also update local state
  const handleLocalClickableHover = (isHovered) => {
    setIsHoveredClickable(isHovered);
    handleClickableHover(isHovered);
  };

  // Modify the greetings array to be specific to AIPage
  const aiGreetings = [
    "Hi, I'm Aeden! Ask me anything",
    "Want to know about my projects?",
    "Let's talk tech and coding",
    "What would you like to know about me?",
  ];

  // Rename to aiCurrentGreeting to avoid conflicts
  const [aiCurrentGreeting, setAiCurrentGreeting] = useState(0);

  // Update the useEffect to use aiCurrentGreeting
  useEffect(() => {
    const interval = setInterval(() => {
      setAiCurrentGreeting((prev) => (prev + 1) % aiGreetings.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleButtonClick = (text) => {
    setClickedButtons((prev) => new Set([...prev, text]));
    handleSubmit(null, text);
  };

  const handleSubmit = async (e, buttonText = null) => {
    e?.preventDefault();
    const messageToSend = buttonText || inputMessage.trim();
    if (!messageToSend) return;

    if (!chatStarted) {
      setChatStarted(true);
    }

    setInputMessage("");
    setIsLoading(true);

    // Add user message to history immediately
    setMessageHistory((prev) => [
      ...prev,
      { role: "user", text: messageToSend },
    ]);

    try {
      const response = await fetch(
        "https://aeden-portfolio-backend.azurewebsites.net/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors", // Add this
          credentials: "omit", // Add this
          body: JSON.stringify({
            message: messageToSend,
            history: messageHistory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for data.response instead of data.message
      if (data && typeof data.response === "string") {
        // Split response into paragraphs on double newlines
        const messages = data.response
          .split(/\n\n+/)
          .filter((msg) => msg.trim())
          .map((msg) => msg.trim());

        // Add messages sequentially with delay
        messages.forEach((message, index) => {
          setTimeout(() => {
            setMessageHistory((prev) => {
              const newHistory = [
                ...prev,
                {
                  role: "assistant",
                  text: message,
                },
              ];
              return newHistory;
            });
          }, index * 1000);
        });
      } else if (data && Array.isArray(data.history)) {
        setMessageHistory(data.history);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessageHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add prefetch logic for Home component
  useEffect(() => {
    const prefetchHome = async () => {
      try {
        const module = await import("./Home");
      } catch (error) {
        console.error("❌ Home prefetch failed:", error);
      }
    };
    prefetchHome();
  }, []);

  const handleHomeClick = () => {
    // Remove immediate theme transition
    // setThemeTransition(!isDarkMode);

    updateButtonPosition();

    // Update URL with hash routing
    window.history.pushState({}, "", "/#/"); // Changed from '/' to '/#/'

    setIsNavigatingBack(true);
    setShouldNavigate(true);

    // Delay theme transition by 1.9 seconds (1900ms)
    setTimeout(() => {
      setThemeTransition(!isDarkMode);
    }, 1900);

    // Use setTimeout to allow animations to complete
    setTimeout(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, 3000);
  };

  // Remove or modify the useEffect that was handling navigation
  useEffect(() => {
    if (shouldNavigate) {
      const initiateNavigation = async () => {
        setIsNavigating(true);

        try {
          // Just wait for animations, no navigation needed
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.error("❌ [Home Transition] Error:", error);
        } finally {
          setIsNavigating(false);
          setShouldNavigate(false);
        }
      };

      initiateNavigation();
    }
  }, [shouldNavigate]);

  // Function to get available action buttons
  const getAvailableActionButtons = () => {
    const allButtons = [
      {
        text: "What is your favorite project?",
        icon: <StarIcon className="w-4 h-4 text-yellow-500" />,
      },
      {
        text: "What tech stack do you know?",
        icon: <CodeBracketIcon className="w-4 h-4 text-blue-500" />,
      },
      {
        text: "What are your weaknesses?",
        icon: <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />,
      },
      {
        text: "What work interests you?",
        icon: <BriefcaseIcon className="w-4 h-4 text-purple-500" />,
      },
      {
        text: "How do I get in touch with you?",
        icon: <ChatBubbleLeftRightIcon className="w-4 h-4 text-red-500" />,
      },
    ];

    // Filter out buttons that have been clicked
    return allButtons.filter((button) => !clickedButtons.has(button.text));
  };

  const [showThemeTooltip, setShowThemeTooltip] = useState(false);

  // Add keyboard shortcut effect
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

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`h-dvh flex flex-col items-center custom-cursor ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}
      style={{
        overflow: "hidden",
      }}
    >
      {!isMobile && (
        <>
          <div
            className={`fixed w-5 h-5 rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
              backgroundColor: themeTransition
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(0, 0, 0, 0.5)",
              boxShadow: themeTransition
                ? "0 0 10px rgba(255, 255, 255, 0.5)"
                : "0 0 10px rgba(0, 0, 0, 0.5)",
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

      {/* Theme toggle button */}
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
          className={`fixed top-16 right-4 p-2 rounded-full custom-cursor-clickable w-10 h-10 flex items-center justify-center transition-all duration-500 ease-in-out ${
            themeTransition ? "bg-white text-black" : "bg-black text-white"
          }`}
          style={{
            transition:
              "background-color 0.5s ease-in-out, color 0.5s ease-in-out",
          }}
        >
          {themeTransition ? "☀️" : "🌙"}
        </button>

        <AnimatePresence>
          {showThemeTooltip && !isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className={`fixed top-16 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
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

      {/* Add Home button */}
      <motion.button
        ref={homeButtonRef}
        onClick={handleHomeClick}
        onMouseEnter={() => {
          handleLocalClickableHover(true);
          setIsHomeButtonHovered(true);
        }}
        onMouseLeave={() => {
          handleLocalClickableHover(false);
          setIsHomeButtonHovered(false);
        }}
        className={`fixed top-4 right-4 rounded-full custom-cursor-clickable overflow-hidden h-10 ${
          themeTransition ? "bg-white text-black" : "bg-black text-white"
        }`}
        variants={buttonVariants}
        initial="collapsed"
        animate={isHomeButtonHovered ? "expanded" : "collapsed"}
        style={{
          minWidth: "40px",
          maxWidth: "200px",
          willChange: "width",
          transform: "translateZ(0)", // Force GPU acceleration
        }}
      >
        {/* Container for animated content */}
        <div className="relative w-full h-full">
          {/* Static home emoji container - positioned absolutely */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[40px] flex items-center justify-center"
            style={{
              transform: "none",
              transition: "none", // Ensure no transition affects the emoji
            }}
          >
            <span className="text-sm" style={{ transition: "none" }}>
              🏠
            </span>
          </div>

          {/* Animated text container */}
          <div
            className="h-full flex items-center"
            style={{ paddingRight: "40px" }}
          >
            <AnimatePresence mode="wait">
              {isHomeButtonHovered && (
                <motion.span
                  key="home-text"
                  className="whitespace-nowrap overflow-hidden pl-4"
                  variants={{
                    expanded: {
                      width: "auto",
                      x: 0,
                      opacity: 1,
                      transition: {
                        width: { duration: 1, ease: [0.4, 0, 0.2, 1] },
                        x: { duration: 1, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.6, delay: 0.3, ease: "easeOut" },
                      },
                    },
                    collapsed: {
                      width: 0,
                      x: 40,
                      opacity: 0,
                      transition: {
                        opacity: { duration: 0.3, ease: "easeOut" },
                        width: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                        x: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                      },
                    },
                  }}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  onAnimationStart={() => {}}
                  onAnimationComplete={() => {}}
                >
                  Go to Home
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
              backgroundColor: "#F2F0E9", // Always start with light mode
            }}
            animate={{
              clipPath: `circle(300vh at ${buttonPosition.x + 16}px ${
                buttonPosition.y + 16
              }px)`,
            }}
            transition={{
              duration: 2.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-screen h-screen overflow-hidden"
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
                </div>
              }
            >
              <motion.div
                initial={{
                  opacity: 1,
                  backgroundColor: "#F2F0E9", // Always start with light mode
                }}
                animate={{
                  backgroundColor: ["#F2F0E9", "#F2F0E9", "#000000"],
                }}
                transition={{
                  duration: 3,
                  times: [0, 0.5, 1], // Hold light mode longer
                  ease: "easeInOut",
                }}
                className="w-full h-full"
              >
                <Home
                  isDarkMode={!themeTransition}
                  initialTransitionTheme={false} // Always start with light mode
                  isMobile={isMobile}
                  toggleDarkMode={toggleDarkMode}
                  handleClickableHover={handleClickableHover}
                  mousePosition={mousePosition}
                  isHoveredClickable={isHoveredClickable}
                  hoveredProjectIndex={null}
                  isReachOutHovered={false}
                  handleLanguageHover={() => {}}
                  handleLanguageLeave={() => {}}
                  hoveredLanguage={null}
                  handleReachOutMouseEnter={() => {}}
                  handleReachOutMouseLeave={() => {}}
                  email={email}
                  linkedinUrl={linkedinUrl}
                  githubUrl={githubUrl}
                  isLiveVisible={false}
                  handleProjectHover={() => {}}
                  skillsRef={null}
                  isSkillsInView={false}
                  educationRef={null}
                  isEducationInView={false}
                  publicationsRef={null}
                  isPublicationsInView={false}
                  courseworkRef={null}
                  isCourseworkInView={false}
                />
              </motion.div>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main heading - show only if chat hasn't started */}
      {/* {!chatStarted && (
        <div className="flex-[0.4] md:flex-none md:h-auto md:mt-[30vh] flex items-center justify-center md:block">
          <h1 className="text-xl md:text-4xl font-semibold h-[1.5em] md:h-[2em] flex items-center">
            <AnimatePresence mode="wait">
              <AnimatedGreeting
                key={aiCurrentGreeting}
                greeting={aiGreetings[aiCurrentGreeting]}
                className="handwritten-font"
              />
            </AnimatePresence>
          </h1>
        </div>
      )} */}

      {/* Centered container for all content within the viewport */}
      <div className="w-full max-w-4xl h-full flex flex-col p-4 md:p-8">
        {/*
          MAIN CONTENT AREA
          - This div is ALWAYS here. It grows to fill available space (`flex-1`) and scrolls its content.
          - We change what's INSIDE it, but the div itself never disappears. This prevents the layout jump.
        */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!chatStarted ? (
            // INITIAL STATE: Greeting and buttons, centered vertically within this scrollable area.
            <div className="h-full flex flex-col justify-center items-center text-center">
              <h1 className="text-xl md:text-4xl font-semibold h-[1.5em] md:h-[2em] flex items-center mb-8">
                <AnimatePresence mode="wait">
                  <AnimatedGreeting
                    key={aiCurrentGreeting}
                    greeting={aiGreetings[aiCurrentGreeting]}
                    className="handwritten-font"
                  />
                </AnimatePresence>
              </h1>
              {/* Initial Action Buttons */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-col md:flex-row justify-center gap-2 text-xs md:text-sm">
                  <button
                    onClick={() =>
                      handleButtonClick("What is your favorite project?")
                    }
                    onMouseEnter={() => handleLocalClickableHover(true)}
                    onMouseLeave={() => handleLocalClickableHover(false)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full custom-cursor-clickable ${
                      themeTransition
                        ? "bg-[#2F2F2F] text-gray-300"
                        : "bg-white text-gray-700"
                    } w-full md:w-auto`}
                  >
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-left flex-1">
                      What is your favorite project?
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleButtonClick("What tech stack do you know?")
                    }
                    onMouseEnter={() => handleLocalClickableHover(true)}
                    onMouseLeave={() => handleLocalClickableHover(false)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full custom-cursor-clickable ${
                      themeTransition
                        ? "bg-[#2F2F2F] text-gray-300"
                        : "bg-white text-gray-700"
                    } w-full md:w-auto`}
                  >
                    <CodeBracketIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-left flex-1">
                      What tech stack do you know?
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleButtonClick("What are your weaknesses?")
                    }
                    onMouseEnter={() => handleLocalClickableHover(true)}
                    onMouseLeave={() => handleLocalClickableHover(false)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full custom-cursor-clickable ${
                      themeTransition
                        ? "bg-[#2F2F2F] text-gray-300"
                        : "bg-white text-gray-700"
                    } w-full md:w-auto`}
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                    <span className="text-left flex-1">
                      What are your weaknesses?
                    </span>
                  </button>
                </div>
                <div className="flex flex-col md:flex-row justify-center gap-2 text-xs md:text-sm">
                  <button
                    onClick={() =>
                      handleButtonClick("What work interests you?")
                    }
                    onMouseEnter={() => handleLocalClickableHover(true)}
                    onMouseLeave={() => handleLocalClickableHover(false)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full custom-cursor-clickable ${
                      themeTransition
                        ? "bg-[#2F2F2F] text-gray-300"
                        : "bg-white text-gray-700"
                    } w-full md:w-auto`}
                  >
                    <BriefcaseIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-left flex-1">
                      What work interests you?
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleButtonClick("How do I get in touch with you?")
                    }
                    onMouseEnter={() => handleLocalClickableHover(true)}
                    onMouseLeave={() => handleLocalClickableHover(false)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full custom-cursor-clickable ${
                      themeTransition
                        ? "bg-[#2F2F2F] text-gray-300"
                        : "bg-white text-gray-700"
                    } w-full md:w-auto`}
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-red-500" />
                    <span className="text-left flex-1">
                      How do I get in touch with you?
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // CHAT STATE: Just the list of messages, which will scroll if it gets long.
            <div className="space-y-3 md:space-y-4 pt-4">
              {messageHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[80%] p-2 md:p-3 rounded-lg text-sm md:text-base markdown-content ${
                      message.role === "user"
                        ? themeTransition
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : themeTransition
                        ? "bg-[#2F2F2F] text-white"
                        : "bg-white text-gray-900"
                    }`}
                  >
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className={`p-3 rounded-lg ${
                      themeTransition ? "bg-[#2F2F2F]" : "bg-white"
                    }`}
                  >
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 
          BOTTOM CONTROLS AREA
          - This section is a sibling to the main content area, not inside it.
          - It contains the action buttons and the input form.
          - The `mt-auto` (margin-top: auto) on the form is the key to pushing it to the very bottom, but flexbox handles this well.
        */}
        <div className="pt-4">
          {chatStarted && (
            <div className="mb-4 flex flex-col md:flex-row justify-center gap-2 text-xs md:text-sm">
              {getAvailableActionButtons()
                .slice(0, 2)
                .map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(button.text)}
                    onMouseEnter={() => handleLocalClickableHover(true)}
                    onMouseLeave={() => handleLocalClickableHover(false)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full custom-cursor-clickable w-full md:w-auto ${
                      themeTransition
                        ? "bg-[#2F2F2F] text-gray-300"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {button.icon}
                    <span className="text-left flex-1 md:flex-none">
                      {button.text}
                    </span>
                  </button>
                ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative w-full">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Talk to me!"
              onMouseEnter={() => handleLocalClickableHover(true)}
              onMouseLeave={() => handleLocalClickableHover(false)}
              className={`w-full h-12 md:h-13 p-2 md:p-3 pl-4 md:pl-6 pr-10 md:pr-12 rounded-full text-sm md:text-base custom-cursor-clickable ${
                themeTransition
                  ? "bg-[#2F2F2F] text-white"
                  : "bg-white text-gray-900"
              } placeholder-gray-400 focus:outline-none`}
            />
            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => handleLocalClickableHover(true)}
              onMouseLeave={() => handleLocalClickableHover(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 custom-cursor-clickable"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 rounded-full border-t-transparent" />
              ) : (
                <div
                  className={`rounded-full p-2 h-8 w-8 flex items-center justify-center ${
                    themeTransition
                      ? "bg-[#2F2F2F] text-gray-300"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default AIPage;
