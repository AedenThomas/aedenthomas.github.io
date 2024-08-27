import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";
import AnimatedGreeting from "./AnimatedGreeting.js";
import "./App.css";
import Project from "./Project.js";
import { education, projects, skills } from "./data";

function App() {
  const [isLiveVisible, setIsLiveVisible] = useState(true);
  const greetingRef = useRef(null);
  const [greetingHeight, setGreetingHeight] = useState(0);

  const skillsRef = useRef(null);
  const educationRef = useRef(null);
  const isSkillsInView = useInView(skillsRef, { threshold: 0.1 });
  const isEducationInView = useInView(educationRef, { threshold: 0.1 });

  const greetings = [
    "Hey!",
    "Hola!",
    "Bonjour!",
    "Ciao!",
    "Olá!",
    "Hallo!",
    "你好!",
    "नमस्ते!",
    "여보세요!",
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
        console.log(`Changing greeting to: ${greetings[next]} at ${new Date().toISOString()}`);
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
    return indexA - indexB;
  });

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-gray-900"
      }`}
    >
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 p-2 rounded-full ${
          isDarkMode ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">

          <img
            src="/Face.png"
            alt="Face"
            className="text-4xl mb-4"
            style={{ width: "45px", height: "45px" }}
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
            I'm a code enthusiast with a solid foundation in Python, Flutter,
            C++, C, and Unix. I've been diving deep into the world of software
            development, cooking up some cool mobile and web applications along
            the way. My sweet spot? That awesome intersection where design meets
            engineering – creating stuff that not only looks great but also runs
            like a dream under the hood.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Right now, I'm on the hunt for an opportunity where I can level up
            my skills and contribute to something amazing. I'm all about pushing
            boundaries, solving tricky problems, and bringing fresh ideas to the
            table. If you're looking for a motivated engineer who can blend
            creativity with technical know-how, I'm your person! Let's team up
            and build some digital magic together.
          </p>

          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex flex-wrap items-center space-x-4">
              <a
                href={`mailto:${email}`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0"
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
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0"
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
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center mb-2 md:mb-0"
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
            </div>
                        <a
              href="/Resume.pdf"
              download
              className="text-sm bg-transparent border border-gray-300 text-gray-500 px-4 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200 mt-2 md:mt-0"
              onClick={() => {
                console.log("Resume clicked");
              }}
            >
              Résumé
            </a>
          </div>
        </div>

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
      </div>
    </div>
  );
}

export default App;
