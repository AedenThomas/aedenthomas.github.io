import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown'; // Add this import
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

function AIPage({
  isDarkMode,
  toggleDarkMode,
  handleClickableHover,
  isMobile,
}) {
  // Add debug mount tracking
  useEffect(() => {
    console.log('🎭 [AIPage] Component mounted', {
      initialTheme: isDarkMode ? 'dark' : 'light',
      isMobile,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('🎭 [AIPage] Component unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  // Track theme transitions
  useEffect(() => {
    console.log('🎨 [AIPage] Theme transition effect triggered', {
      isDarkMode,
      themeTransition,
      timestamp: new Date().toISOString()
    });

    const timeout = setTimeout(() => {
      setThemeTransition(isDarkMode);
      console.log('🎨 [AIPage] Theme transition completed', {
        newTheme: isDarkMode ? 'dark' : 'light',
        timestamp: new Date().toISOString()
      });
    }, 50);

    return () => clearTimeout(timeout);
  }, [isDarkMode]);

  // Track animation states
  const [animationState, setAnimationState] = useState({
    mounting: true,
    contentFade: false,
    themeTransition: false
  });

  useEffect(() => {
    console.log('🎬 [AIPage] Animation state updated:', {
      ...animationState,
      timestamp: new Date().toISOString()
    });
  }, [animationState]);

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

  // Add effect to smoothly transition the theme
  useEffect(() => {
    const timeout = setTimeout(() => {
      setThemeTransition(isDarkMode);
    }, 50); // Small delay to ensure the animation starts properly

    return () => clearTimeout(timeout);
  }, [isDarkMode]);

  // Update handleClickableHover to also update local state
  const handleLocalClickableHover = (isHovered) => {
    setIsHoveredClickable(isHovered);
    handleClickableHover(isHovered);
  };

  const greetings = [
    "What can I help with?",
    "Let's build something cool",
    "Got any interesting ideas?",
    "Need help with code?",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => (prev + 1) % greetings.length);
    }, 6000); // Increased to 6 seconds to ensure complete animation

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
    setMessageHistory(prev => [...prev, { role: 'user', text: messageToSend }]);
    
    try {
      const response = await fetch("https://aeden-portfolio-backend.azurewebsites.net/api/chat", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
          },
          mode: 'cors', // Add this
          credentials: 'omit', // Add this
          body: JSON.stringify({
              message: messageToSend,
              history: messageHistory
          }),
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the response with proper type checking
      if (data && Array.isArray(data.history)) {
        setMessageHistory(data.history);
      } else if (data && typeof data.message === 'string') {
        // Fallback for old response format
        setMessageHistory(prev => [...prev, { role: 'assistant', text: data.message }]);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error("Error:", error);
      setMessageHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, there was an error processing your request."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced navigation tracking
  const handleHomeClick = () => {
    console.log('🏠 [AIPage] Home navigation triggered');
    setAnimationState(prev => ({
      ...prev,
      navigating: true
    }));
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen flex flex-col items-center p-4 md:p-8 theme-transition custom-cursor ${
        themeTransition ? "bg-black text-white" : "bg-[#F2F0E9] text-gray-900"
      }`}
      style={{
        transition: 'background-color 0.5s ease-in-out, color 0.5s ease-in-out'
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
        className={`fixed top-2 right-2 md:top-4 md:right-4 p-2 rounded-full custom-cursor-clickable theme-transition ${
          themeTransition ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        {themeTransition ? "☀️" : "🌙"}
      </button>

      {/* Add Home button */}
      <button
        onClick={handleHomeClick}
        onMouseEnter={() => setIsHomeButtonHovered(true)}
        onMouseLeave={() => setIsHomeButtonHovered(false)}
        className={`fixed top-16 right-4 p-2 rounded-full custom-cursor-clickable flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out h-10 ${
          themeTransition ? "bg-white text-black" : "bg-black text-white"
        }`}
        style={{
          width: isHomeButtonHovered ? '110px' : '33px',
        }}
      >
        <AnimatePresence mode="wait">
          {isHomeButtonHovered && (
            <motion.span
              className="whitespace-nowrap overflow-hidden text-sm"
              variants={{
                hidden: { width: 0, opacity: 0 },
                visible: { width: 'auto', opacity: 1 },
                exit: { width: 0, opacity: 0 }
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ 
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              Home&nbsp;
            </motion.span>
          )}
        </AnimatePresence>
        <span className="flex-shrink-0 text-sm">🏠</span>
      </button>

      {/* Main heading - show only if chat hasn't started */}
      {!chatStarted && (
        <div className="flex-[0.4] md:flex-none md:h-auto md:mt-[30vh] flex items-center justify-center md:block">
          <h1 className="text-xl md:text-4xl font-semibold h-[1.5em] md:h-[2em] flex items-center">
            <AnimatePresence mode="wait">
              <AnimatedGreeting
                key={currentGreeting}
                greeting={greetings[currentGreeting]}
                className="handwritten-font"
              />
            </AnimatePresence>
          </h1>
        </div>
      )}

      <div
        className={`w-full max-w-4xl px-2 md:px-4 ${
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
                    <ReactMarkdown>
                      {message.text}
                    </ReactMarkdown>
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
                themeTransition ? "bg-[#2F2F2F] text-white" : "bg-white text-gray-900"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 rotate-90"
                >
                  <path d="M12 2L19 8.5V22H5V8.5L12 2Z" />
                </svg>
              )}
            </button>
          </form>

          {/* Action buttons - show only if chat hasn't started */}
          {!chatStarted && (
            <div className="flex flex-col gap-2 mb-24 md:mb-0">
              <div className="flex flex-col md:flex-row justify-center gap-2 text-xs md:text-sm">
                <button
                  onClick={() => handleButtonClick("What is your Favorite project?")}
                  onMouseEnter={() => handleLocalClickableHover(true)}
                  onMouseLeave={() => handleLocalClickableHover(false)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg custom-cursor-clickable ${
                    themeTransition
                      ? "bg-[#2F2F2F] text-gray-300"
                      : "bg-white text-gray-700"
                  } w-full md:w-auto`}
                >
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-left flex-1">What is your Favorite project?</span>
                </button>
                <button
                  onClick={() => handleButtonClick("What tech stack do you know?")}
                  onMouseEnter={() => handleLocalClickableHover(true)}
                  onMouseLeave={() => handleLocalClickableHover(false)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg custom-cursor-clickable ${
                    themeTransition
                      ? "bg-[#2F2F2F] text-gray-300"
                      : "bg-white text-gray-700"
                  } w-full md:w-auto`}
                >
                  <CodeBracketIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-left flex-1">What tech stack do you know?</span>
                </button>
                <button
                  onClick={() => handleButtonClick("What did you study?")}
                  onMouseEnter={() => handleLocalClickableHover(true)}
                  onMouseLeave={() => handleLocalClickableHover(false)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg custom-cursor-clickable ${
                    themeTransition
                      ? "bg-[#2F2F2F] text-gray-300"
                      : "bg-white text-gray-700"
                  } w-full md:w-auto`}
                >
                  <AcademicCapIcon className="w-4 h-4 text-green-500" />
                  <span className="text-left flex-1">What did you study?</span>
                </button>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-2 text-xs md:text-sm">
                <button
                  onClick={() => handleButtonClick("What work interests you?")}
                  onMouseEnter={() => handleLocalClickableHover(true)}
                  onMouseLeave={() => handleLocalClickableHover(false)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg custom-cursor-clickable ${
                    themeTransition
                      ? "bg-[#2F2F2F] text-gray-300"
                      : "bg-white text-gray-700"
                  } w-full md:w-auto`}
                >
                  <BriefcaseIcon className="w-4 h-4 text-purple-500" />
                  <span className="text-left flex-1">What work interests you?</span>
                </button>
                <button
                  onClick={() => handleButtonClick("How do I get in touch with you?")}
                  onMouseEnter={() => handleLocalClickableHover(true)}
                  onMouseLeave={() => handleLocalClickableHover(false)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg custom-cursor-clickable ${
                    themeTransition
                      ? "bg-[#2F2F2F] text-gray-300"
                      : "bg-white text-gray-700"
                  } w-full md:w-auto`}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-red-500" />
                  <span className="text-left flex-1">How do I get in touch with you?</span>
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
