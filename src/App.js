import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import useInView from "./useInView.js";
import "./App.css";
import Privacy from "./BillifyPrivacy.js";
import AIResume from "./AIResume.js";
import Home from "./Home";
import AIPage from "./AIPage";
import Blog from "./Blog";
import BlogPost from "./BlogPost";

function App() {
  const [isLiveVisible, setIsLiveVisible] = useState(true);
  const [isReachOutHovered, setIsReachOutHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredLanguage, setHoveredLanguage] = useState(null);
  const [isHoveredClickable, setIsHoveredClickable] = useState(false);
  const [hoveredProjectIndex, setHoveredProjectIndex] = useState(null);
  const [viewMode, setViewModeInternal] = useState(() => {
    console.log(`📱 [App.js] viewMode INITIAL STATE | Time: ${Date.now()} | Setting to: 'human'`);
    return 'human';
  });
  
  // Wrapper to track all viewMode changes
  const setViewMode = useCallback((newMode) => {
    console.log(`📱 [App.js] setViewMode CALLED | Time: ${Date.now()} | Old: ${viewMode} | New: ${newMode} | Stack:`, new Error().stack);
    setViewModeInternal(newMode);
  }, [viewMode]);

  const handleProjectHover = useCallback((index) => {
    setHoveredProjectIndex(index);
  }, []);

  const handleClickableHover = useCallback((isHovered) => {
    setIsHoveredClickable(isHovered);
  }, []);

  const handleLanguageHover = useCallback((language) => {
    setHoveredLanguage(language);
  }, []);

  const handleLanguageLeave = useCallback(() => {
    setHoveredLanguage(null);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);

      if (isMobileDevice) {
        document.documentElement.classList.remove("no-cursor");
      } else {
        document.documentElement.classList.add("no-cursor");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleReachOutMouseEnter = useCallback(
    () => setIsReachOutHovered(true),
    []
  );
  const handleReachOutMouseLeave = useCallback(
    () => setIsReachOutHovered(false),
    []
  );

  // useInView now returns [ref, isInView]
  // triggerOnce: true ensures sections stay visible after being seen once,
  // preventing content from disappearing after navigation between pages
  const [courseworkRef, isCourseworkInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [skillsRef, isSkillsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [educationRef, isEducationInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [publicationsRef, isPublicationsInView] = useInView({ threshold: 0.1, triggerOnce: true });

  const [currentGreeting, setCurrentGreeting] = useState(0);
  const greetings = useMemo(() => [
    "Hey!",
    "Hola!",
    "नमस्ते!",
    "Bonjour!",
    "你好!",
    "Ciao!",
    "Olá!",
    "여보세요!",
    "Hallo!",
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => (prev + 1) % greetings.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [greetings]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLiveVisible((prev) => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    console.log(`🎨 [App.js] INITIAL STATE | Time: ${Date.now()} | System prefers dark: ${prefersDark}`);
    return prefersDark;
  });

  // Wrapper to track all isDarkMode changes
  const setIsDarkModeWithLog = (value) => {
    const newValue = typeof value === 'function' ? value(isDarkMode) : value;
    console.log(`🎨 [App.js] setIsDarkMode CALLED | Time: ${Date.now()} | Old: ${isDarkMode} | New: ${newValue} | Stack:`, new Error().stack);
    setIsDarkMode(value);
  };

  useEffect(() => {
    console.log(`🎨 [App.js] isDarkMode CHANGED | Time: ${Date.now()} | isDarkMode: ${isDarkMode} | Toggling .dark class on documentElement`);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      console.log(`🎨 [App.js] SYSTEM THEME CHANGE | Time: ${Date.now()} | e.matches (prefers dark): ${e.matches}`);
      setIsDarkMode(e.matches);
    };
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);



  useEffect(() => {
    document.body.classList.add("custom-cursor");
    return () => {
      document.body.classList.remove("custom-cursor");
    };
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

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const email = "hey@aeden.me";
  const linkedinUrl = "https://www.linkedin.com/in/aedenthomas/";
  const githubUrl = "https://github.com/AedenThomas/";

  // Transition state
  const [isNavigating, setIsNavigating] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [navTarget, setNavTarget] = useState('ai'); // 'ai' or 'home'

  const triggerZoomAnimation = useCallback((rect, target = 'ai') => {
    setButtonPosition({ x: rect.left, y: rect.top });
    setNavTarget(target);
    
    // Start with opposite theme
    setTransitionTheme(!isDarkMode);
    setIsNavigating(true);

    // Transition to actual theme after 1.5s
    setTimeout(() => {
      setTransitionTheme(isDarkMode);
    }, 1500);

    // End navigation state after animation completes + some buffer
    setTimeout(() => {
      setIsNavigating(false);
    }, 2500);
  }, [isDarkMode]);

  // Context bundle
  const transitionProps = useMemo(() => ({
    triggerZoomAnimation
  }), [triggerZoomAnimation]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              isDarkMode={isDarkMode}
              isMobile={isMobile}
              mousePosition={mousePosition}
              isHoveredClickable={isHoveredClickable}
              toggleDarkMode={toggleDarkMode}
              handleClickableHover={handleClickableHover}
              hoveredProjectIndex={hoveredProjectIndex}
              isReachOutHovered={isReachOutHovered}
              greetings={greetings}
              currentGreeting={currentGreeting}
              handleLanguageHover={handleLanguageHover}
              handleLanguageLeave={handleLanguageLeave}
              hoveredLanguage={hoveredLanguage}
              handleReachOutMouseEnter={handleReachOutMouseEnter}
              handleReachOutMouseLeave={handleReachOutMouseLeave}
              email={email}
              linkedinUrl={linkedinUrl}
              githubUrl={githubUrl}
              isLiveVisible={isLiveVisible}
              handleProjectHover={handleProjectHover}
              skillsRef={skillsRef}
              isSkillsInView={isSkillsInView}
              educationRef={educationRef}
              isEducationInView={isEducationInView}
              publicationsRef={publicationsRef}
              isPublicationsInView={isPublicationsInView}
              courseworkRef={courseworkRef}
              isCourseworkInView={isCourseworkInView}
              viewMode={viewMode}
              setViewMode={setViewMode}
              triggerZoomAnimation={triggerZoomAnimation}
            />
          }
        />
        <Route
          path="/ai"
          element={
            <AIPage
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              handleClickableHover={handleClickableHover}
              isMobile={isMobile}
              viewMode={viewMode}
              setViewMode={setViewMode}
              triggerZoomAnimation={triggerZoomAnimation}
            />
          }
        />
        <Route
          path="/blog"
          element={
            <Blog
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              handleClickableHover={handleClickableHover}
              isMobile={isMobile}
            />
          }
        />
        <Route
          path="/blog/:id"
          element={
            <BlogPost
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              handleClickableHover={handleClickableHover}
              isMobile={isMobile}
            />
          }
        />
        <Route path="billify/privacy" element={<Privacy />} />
        <Route path="airesume/privacy" element={<AIResume />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Persistent Overlay rendered at App level */}
      <AnimatePresence>
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
              zIndex: 99999,
              backgroundColor: transitionTheme ? "#000000" : "#F2F0E9",
            }}
            animate={{
              clipPath: `circle(300vh at ${buttonPosition.x + 16}px ${
                buttonPosition.y + 16
              }px)`,
              backgroundColor: transitionTheme ? "#000000" : "#F2F0E9",
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            transition={{
              duration: 2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-screen h-screen overflow-hidden pointer-events-none"
          >
             <Suspense
                fallback={null}
              >
                <motion.div
                  animate={{
                    transition: { duration: 0.5 },
                  }}
                  className="w-full h-full"
                >
                  {/* Only render AIPage content when going TO AI page (Home -> AI) */}
                  {/* Only render AIPage content when going TO AI page (Home -> AI) */}
                  {navTarget === 'ai' && (
                    <AIPage
                      isDarkMode={transitionTheme}
                      isMobile={isMobile}
                      toggleDarkMode={toggleDarkMode}
                      handleClickableHover={handleClickableHover}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      triggerZoomAnimation={() => {}} // Dummy
                    />
                  )}
                  {/* Render Home content when going TO Home page (AI -> Home) */}
                  {navTarget === 'home' && (
                    <Home
                      isDarkMode={transitionTheme}
                      isMobile={isMobile}
                      mousePosition={mousePosition}
                      isHoveredClickable={isHoveredClickable}
                      toggleDarkMode={toggleDarkMode}
                      handleClickableHover={handleClickableHover}
                      hoveredProjectIndex={hoveredProjectIndex}
                      isReachOutHovered={isReachOutHovered}
                      greetings={greetings}
                      currentGreeting={currentGreeting}
                      handleLanguageHover={handleLanguageHover}
                      handleLanguageLeave={handleLanguageLeave}
                      hoveredLanguage={hoveredLanguage}
                      handleReachOutMouseEnter={handleReachOutMouseEnter}
                      handleReachOutMouseLeave={handleReachOutMouseLeave}
                      email={email}
                      linkedinUrl={linkedinUrl}
                      githubUrl={githubUrl}
                      isLiveVisible={isLiveVisible}
                      handleProjectHover={handleProjectHover}
                      skillsRef={skillsRef}
                      isSkillsInView={isSkillsInView}
                      educationRef={educationRef}
                      isEducationInView={isEducationInView}
                      publicationsRef={publicationsRef}
                      isPublicationsInView={isPublicationsInView}
                      courseworkRef={courseworkRef}
                      isCourseworkInView={isCourseworkInView}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      triggerZoomAnimation={() => {}} // Dummy
                    />
                  )}
                </motion.div>
              </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;
