import React, { useState, useRef, useEffect, useCallback } from "react";
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

  const courseworkRef = useRef(null);
  const isCourseworkInView = useInView(courseworkRef, { threshold: 0.1 });

  const skillsRef = useRef(null);
  const educationRef = useRef(null);
  const isSkillsInView = useInView(skillsRef, { threshold: 0.1 });
  const isEducationInView = useInView(educationRef, { threshold: 0.1 });

  const publicationsRef = useRef(null);
  const isPublicationsInView = useInView(publicationsRef, { threshold: 0.1 });

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
    return !window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    setIsDarkMode(!prefersDarkMode);
    const timer = setTimeout(() => {
      setIsDarkMode(prefersDarkMode);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

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
    </Router>
  );
}

export default App;
