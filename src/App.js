import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";
import AnimatedGreeting from "./AnimatedGreeting.js";
import "./App.css";
import Project from "./Project.js";
import { education, projects, skills, research, coursework } from "./data";
import ContactLinks from "./ContactLinks";
import LanguageIcon from "./LanguageIcon";

function App() {
  const [isLiveVisible, setIsLiveVisible] = useState(true);
  const greetingRef = useRef(null);
  const [greetingHeight, setGreetingHeight] = useState(0);
  const [isReachOutHovered, setIsReachOutHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredLanguage, setHoveredLanguage] = useState(null);
  const [isHoveredClickable, setIsHoveredClickable] = useState(false);

  const handleClickableHover = (isHovered) => {
    setIsHoveredClickable(isHovered);
  };

  const handleLanguageHover = (language) => {
    setHoveredLanguage(language);
  };

  const handleLanguageLeave = () => {
    setHoveredLanguage(null);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleReachOutMouseEnter = () => setIsReachOutHovered(true);
  const handleReachOutMouseLeave = () => setIsReachOutHovered(false);

  const courseworkRef = useRef(null);
  const isCourseworkInView = useInView(courseworkRef, { threshold: 0.1 });

  const skillsRef = useRef(null);
  const educationRef = useRef(null);
  const isSkillsInView = useInView(skillsRef, { threshold: 0.1 });
  const isEducationInView = useInView(educationRef, { threshold: 0.1 });

  const publicationsRef = useRef(null);
  const isPublicationsInView = useInView(publicationsRef, { threshold: 0.1 });

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

  const [currentGreeting, setCurrentGreeting] = useState(0);

  useEffect(() => {
    console.log("Hello, World!");
  }, []);

  useEffect(() => {
    if (greetingRef.current) {
      setGreetingHeight(greetingRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => {
        const next = (prev + 1) % greetings.length;
        console.log(
          `Changing greeting to: ${
            greetings[next]
          } at ${new Date().toISOString()}`,
        );
        return next;
      });
    }, 5000); // Should be at least 13 seconds (3s for reveal + 10s display)

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLiveVisible((prev) => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a saved preference
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode !== null) {
        return savedMode === "true";
      }
    }
    // If no saved preference, use system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Update class on html element
    document.documentElement.classList.toggle("dark", isDarkMode);
    // Save user preference
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Listen for changes in system color scheme
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const email = "hey@aeden.me";
  const linkedinUrl = "https://www.linkedin.com/in/aedenthomas/";
  const githubUrl = "https://github.com/AedenThomas/";
  const sortedProjects = projects.sort((a, b) => {
    const order = ["Live", "Public", "In Development", "Private"];
    const indexA = order.findIndex((status) => a.status.includes(status));
    const indexB = order.findIndex((status) => b.status.includes(status));

    if (indexA === indexB) {
      // If both are "In Development", prioritize the one with a URL
      if (a.status === "In Development" && b.status === "In Development") {
        if (a.url && !b.url) return -1;
        if (!a.url && b.url) return 1;
      }
      return 0;
    }

    return indexA - indexB;
  });

  return (
    <div
      className={`custom-cursor min-h-screen p-8 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-gray-900"
      }`}
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
                : "0 0 10px rgba(0, 0, 0, 0.5)",
            }}
          />
          <div
            className={`fixed w-7 h-7 rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
              isHoveredClickable ? "opacity-100 scale-110" : "opacity-0 scale-100"

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
        className={`fixed top-4 right-4 p-2 rounded-full custom-cursor-clickable ${
          isDarkMode ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>

      <div className="max-w-3xl mx-auto">
        <div className={`${isReachOutHovered ? "blur-background" : ""}`}>
          <div className="mb-8">
            <img
              src="/Face.webp"
              alt="Face"
              width="45"
              height="45"
              class="text-4xl mb-7"
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
              As a{" "}
              <span className="relative inline-block px-1 hover:text-green-500 hover:scale-105 hover:bg-opacity-10 hover:bg-green-300 dark:hover:bg-green-800 transition-all duration-300">
                full-stack developer
              </span>
              , I've built a strong foundation in{" "}
              <span
                onMouseEnter={() => handleLanguageHover("react")}
                onMouseLeave={handleLanguageLeave}
                className="relative"
              >
                React
                <AnimatePresence>
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
              . My journey in{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-green-500 after:transition-all after:duration-300">
                software development
              </span>{" "}
              has led me to create various mobile and web applications, always
              striving to find that perfect{" "}
              <span className="relative bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300">
                balance between design and functionality
              </span>
              .
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              I'm passionate about{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-green-500 after:transition-all after:duration-300">
                creating innovative solutions
              </span>{" "}
              and bringing fresh perspectives to projects. My goal is to
              contribute to meaningful initiatives where I can apply my{" "}
              <span className="relative bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300">
                expertise in cross-platform and web development
              </span>{" "}
              using cutting-edge technologies. I'm always eager to explore new{" "}
              <span className="relative inline-block px-1 hover:text-green-500 hover:scale-105 hover:bg-opacity-10 hover:bg-green-300 dark:hover:bg-green-800 transition-all duration-300">
                challenging opportunities
              </span>{" "}
              that align with my interests in full-stack development and
              enterprise solutions. Feel free to{" "}
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
                reach out
              </span>{" "}
              if you'd like to discuss potential projects or collaborations in
              these areas.
            </p>
          </div>
        </div>

        <ContactLinks
          email={email}
          linkedinUrl={linkedinUrl}
          githubUrl={githubUrl}
          handleClickableHover={handleClickableHover}
        />

        <div className={`${isReachOutHovered ? "blur-background" : ""}`}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
              ~/side projects
            </h2>
            {sortedProjects.map((project, index) => (
              <Project
                key={index}
                project={project}
                index={index}
                isDarkMode={isDarkMode}
                isLiveVisible={isLiveVisible}
                handleClickableHover={handleClickableHover}
              />
            ))}
          </div>

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
                  className="mb-4 p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-navy-800 dark:hover:bg-navy-900"
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
                  className="mb-4 p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-navy-800 dark:hover:bg-navy-900"
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
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-200"
                    >
                      DOI: {pub.doi}
                    </a>
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
    </div>
  );
}

export default App;
