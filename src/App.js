import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";
import AnimatedGreeting from "./AnimatedGreeting.js";
import "./App.css";
import Project from "./Project.js";
import { education, projects, skills, research, coursework } from "./data";
import ContactLinks from "./ContactLinks";
import LanguageIcon from "./LanguageIcon";

import Privacy from "./BillifyPrivacy.js";
import AIResume from "./AIResume.js";
import Home from "./Home";
import AIPage from "./AIPage";



function App() {
  const [isLiveVisible, setIsLiveVisible] = useState(true);
  const greetingRef = useRef(null);
  const [greetingHeight, setGreetingHeight] = useState(0);
  const [isReachOutHovered, setIsReachOutHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredLanguage, setHoveredLanguage] = useState(null);
  const [isHoveredClickable, setIsHoveredClickable] = useState(false);
  const [hasPlayedInitialAnimation, setHasPlayedInitialAnimation] =
    useState(false);
  const [hoveredProjectIndex, setHoveredProjectIndex] = useState(null);
  const [initialAnimationComplete, setInitialAnimationComplete] =
    useState(false);

  const animationSequence = useMemo(
    () => [
      () => setHoveredLanguage("react"),
      () => setHoveredLanguage("react native"),
      () => setHoveredLanguage("flutter"),
      () => setHoveredLanguage("asp.net core"),
      () => setHoveredLanguage("python"),
      () => {
        const element = document.querySelector(".after\\:w-0");
        if (element) {
          element.classList.add("hover:after:w-full");
        }
      },
      () => {
        const element = document.querySelector(".hover\\:text-transparent");
        if (element) {
          element.classList.add(
            "text-transparent",
            "bg-gradient-to-r",
            "from-green-400",
            "to-blue-500"
          );
        }
      },
    ],
    []
  );

  useEffect(() => {
    if (!hasPlayedInitialAnimation) {
      let delay = 0;
      animationSequence.forEach((animation, index) => {
        setTimeout(() => {
          animation();
          if (index < 5) {
            setTimeout(() => setHoveredLanguage(null), 1000);
          }
        }, delay);
        delay += 1500;
      });

      setTimeout(() => {
        const afterElement = document.querySelector(".after\\:w-0");
        if (afterElement) {
          afterElement.classList.remove("hover:after:w-full");
        }
        const hoverElement = document.querySelector(
          ".hover\\:text-transparent"
        );
        if (hoverElement) {
          hoverElement.classList.remove(
            "text-transparent",
            "bg-gradient-to-r",
            "from-green-400",
            "to-blue-500"
          );
        }
        setHasPlayedInitialAnimation(true);
      }, delay);
    }
  }, [hasPlayedInitialAnimation, animationSequence]);

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
      setIsMobile(window.innerWidth <= 768);
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

  const greetings = useMemo(
    () => [
      "Hey!",
      "Hola!",
      "नमस्ते!",
      "Bonjour!",
      "你好!",
      "Ciao!",
      "Olá!",
      "여보세요!",
      "Hallo!",
    ],
    []
  );

  const [currentGreeting, setCurrentGreeting] = useState(0);

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (greetingRef.current) {
      setGreetingHeight(greetingRef.current.offsetHeight);
    }
  }, []);

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
      setInitialAnimationComplete(true);
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
  const sortedProjects = useMemo(
    () =>
      projects.sort((a, b) => {
        const order = ["Live", "Public", "In Development", "Private"];
        const indexA = order.findIndex((status) => a.status.includes(status));
        const indexB = order.findIndex((status) => b.status.includes(status));

        if (indexA === indexB) {
          if (a.status === "In Development" && b.status === "In Development") {
            if (a.url && !b.url) return -1;
            if (!a.url && b.url) return 1;
          }
          return 0;
        }

        return indexA - indexB;
      }),
    [projects]
  );



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
        <Route path="billify/privacy" element={<Privacy />} />
        <Route path="airesume/privacy" element={<AIResume />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
