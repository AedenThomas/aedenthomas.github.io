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
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
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
    width: 'auto',
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  collapsed: {
    width: '40px',
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.2
    }
  }
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
          .filter(msg => msg.trim())
          .map(msg => msg.trim());
      
        // Add messages sequentially with delay
        messages.forEach((message, index) => {
      
          setTimeout(() => {
            setMessageHistory(prev => {
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
      }  else {
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
    updateButtonPosition();
    
    // Immediately update URL without triggering navigation
    window.history.pushState({}, '', '/');
    
    setIsNavigatingBack(true);
    setShouldNavigate(true);
    
    // Use setTimeout to allow animations to complete
    setTimeout(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
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

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen flex flex-col items-center p-4 md:p-8 theme-transition custom-cursor ${
        themeTransition ? "bg-black text-white" : "bg-[#F2F0E9] text-gray-900"
      }`}
      style={{
        transition: "background-color 0.5s ease-in-out, color 0.5s ease-in-out",
        height: '100vh', // Ensures the container fits the viewport
        overflow: 'hidden', // Prevents page-level scrolling
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
      <button
        onClick={toggleDarkMode}
        onMouseEnter={() => handleLocalClickableHover(true)}
        onMouseLeave={() => handleLocalClickableHover(false)}
        className={`fixed top-4 right-4 p-2 rounded-full custom-cursor-clickable w-10 h-10 flex items-center justify-center transition-all duration-500 ease-in-out ${
          themeTransition ? "bg-white text-black" : "bg-black text-white"
        }`}
        style={{
          transition: 'background-color 0.5s ease-in-out, color 0.5s ease-in-out'
        }}
      >
        {themeTransition ? "☀️" : "🌙"}
      </button>

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
        className={`fixed top-16 right-4 rounded-full custom-cursor-clickable overflow-hidden h-10 ${
          themeTransition ? "bg-white text-black" : "bg-black text-white"
        }`}
        variants={buttonVariants}
        initial="collapsed"
        animate={isHomeButtonHovered ? "expanded" : "collapsed"}
        style={{
          minWidth: '40px',
          maxWidth: '200px',
          willChange: 'width',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
      >
        {/* Container for animated content */}
        <div className="relative w-full h-full">
          {/* Static home emoji container - positioned absolutely */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-[40px] flex items-center justify-center"
            style={{ 
              transform: 'none',
              transition: 'none' // Ensure no transition affects the emoji
            }}
          >
            <span className="text-sm" style={{ transition: 'none' }}>🏠</span>
          </div>

          {/* Animated text container */}
          <div 
            className="h-full flex items-center" 
            style={{ paddingRight: '40px' }}
          >
            <AnimatePresence mode="wait">
              {isHomeButtonHovered && (
                <motion.span
                  key="home-text"
                  className="whitespace-nowrap overflow-hidden pl-4"
                  variants={{
                    expanded: { 
                      width: 'auto',
                      x: 0,
                      opacity: 1,
                      transition: {
                        width: { duration: 1, ease: [0.4, 0, 0.2, 1] },
                        x: { duration: 1, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.6, delay: 0.3, ease: "easeOut" }
                      }
                    },
                    collapsed: { 
                      width: 0,
                      x: 40,
                      opacity: 0,
                      transition: {
                        opacity: { duration: 0.3, ease: "easeOut" },
                        width: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                        x: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
                      }
                    }
                  }}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  onAnimationStart={() => {
                  }}
                  onAnimationComplete={() => {
                  }}
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
              duration: 1.5, // Circle expansion takes exactly 1.5 seconds
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
      {!chatStarted && (
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
      )}

      <div
        className={`w-full max-w-4xl px-2 md:px-4 flex-1 overflow-hidden ${
          chatStarted
            ? "flex flex-col h-[calc(100vh-2rem)]"
            : "flex-[0.6] md:flex-none flex flex-col justify-center md:block md:h-auto mt-4 md:mt-20"
        }`}
      >
        {chatStarted ? (
          <>
            {/* Chat history area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 md:space-y-4 pb-20 md:pb-0">
              {messageHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[80%] p-2 md:p-3 rounded-lg text-sm md:text-base ${
                      message.role === "user"
                        ? themeTransition
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : themeTransition
                        ? "bg-[#2F2F2F] text-white"
                        : "bg-white text-gray-900"
                    } markdown-content`} // Added markdown-content class
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
          </>
        ) : null}

        {/* Reorder elements using absolute positioning on mobile */}
        <div className="relative flex flex-col-reverse md:flex-col">
          {/* Input form */}
          <form
            onSubmit={handleSubmit}
            className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto px-2 md:px-0 bg-inherit pb-4 pt-2 md:py-0 md:mb-8"
          >
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
    <div className={`rounded-full p-2 h-8 w-8 flex items-center justify-center ${
      themeTransition 
        ? "bg-[#2F2F2F] text-gray-300" 
        : "bg-white text-gray-700"
    }`}>
      <ArrowUpIcon className="w-4 h-4" />
    </div>
  )}
</button>


          </form>

          {/* Action buttons - show only if chat hasn't started */}
          {!chatStarted && (
            <div className="flex flex-col gap-2 mb-24 md:mb-0">
                            <div className="flex flex-col md:flex-row justify-center gap-2 text-xs md:text-sm">
                              
                              <button
                                onClick={() =>
                                  handleButtonClick("What is your Favorite project?")
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
                  onClick={() => handleButtonClick("What work interests you?")}
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
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AIPage;
