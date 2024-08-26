import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";

function App() {
  const [isLiveVisible, setIsLiveVisible] = useState(true);

  const skillsRef = useRef(null);
  const educationRef = useRef(null);
  const projectsRef = useRef(null);

  const isProjectsInView = useInView(projectsRef, { threshold: 0.1 });
  const isSkillsInView = useInView(skillsRef, { threshold: 0.1 });
  const isEducationInView = useInView(educationRef, { threshold: 0.1 });

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

  const education = [
    {
      university: "University of Bath",
      degree: "Master of Science",
      branch: "Computer Science",
      period: "2024–2025",
    },
    {
      university: "B.M.S. College of Engineering",
      degree: "Bachelors of Engineering",
      branch: "Information Science and Engineering",
      period: "2020–2024",
    },
  ];

  const projects = [
    {
      icon: "💰",
      title: "Bill Split",
      description:
        "Cross-platform bill splitting app using Flutter with perfect bill splitting algorithm.",
      status: "In Development",
      url: null,
    },
    {
      icon: "🧠",
      title: "InsightX",
      description:
        "Video analysis web application leveraging LLM for insight extraction.",
      status: "Live",
      url: "https://insightx.example.com",
    },
    {
      icon: "🎙️",
      title: "InterviewPal",
      description:
        "Real-time interview assistant web application using React.js and Cohere API.",
      status: "Live",
      url: "https://interviewpal.example.com",
    },
    {
      icon: "📧",
      title: "Email Asterisk Decoder",
      description:
        "Python script to predict and decode emails hidden behind asterisks for OSINT.",
      status: "Live",
      url: "https://github.com/yourusername/email-asterisk-decoder",
    },

    {
      icon: "🏢",
      title: "Nedea",
      description:
        "ERP application for document analysis and data extraction using AI technologies.",
      status: "In Development",
      url: null,
    },
    {
      icon: "📄",
      title: "AIResume",
      description:
        "AI-powered resume tailoring system with frontend and backend components.",
      status: "In Development",
      url: null,
    },
    {
      icon: "📝",
      title: "Textara",
      description:
        "Text analysis and processing tool with JavaScript frontend and C# backend.",
      status: "In Development",
      url: null,
    },
    {
      icon: "📚",
      title: "StudyHub",
      description:
        "Educational platform with JavaScript frontend and backend components.",
      status: "In Development",
      url: null,
    },
    {
      icon: "💭",
      title: "Dream",
      description:
        "C++ project exploring dream analysis or simulation (details not provided).",
      status: "Public",
      url: "https://github.com/yourusername/dream",
    },
    {
      icon: "🍳",
      title: "Cookify",
      description:
        "C++ application for recipe management or cooking assistance.",
      status: "Public",
      url: "https://github.com/yourusername/cookify",
    },

    {
      icon: "💼",
      title: "CryptoVault",
      description:
        "JavaScript-based cryptocurrency management or storage solution.",
      status: "Public",
      url: "https://github.com/yourusername/cryptovault",
    },
    {
      icon: "🔗",
      title: "Blockchain Backend",
      description:
        "Python-based backend system for blockchain-related applications.",
      status: "Public",
      url: "https://github.com/yourusername/blockchain_backend",
    },

    {
      icon: "✉️",
      title: "Generate Email Address",
      description:
        "Tool for generating or predicting email addresses (details not provided).",
      status: "Private",
      url: null,
    },
  ];

  const skills = [
    "Python",
    "Flutter",
    "C++",
    "C",
    "Unix",
    "Java",
    "Dart",
    "SQL",
    "Bash",
    "CSS",
    "JavaScript",
    "React",
    "MySQL",
    "MongoDB",
    "AWS",
    "Git",
    "Oracle Cloud",
    "Google Cloud",
    "Google Firebase",
    "Microsoft Azure",
    "Data Structures and Algorithms",
    "Figma",
    "Azure Vision",
    "Cohere LLM API",
    "Speech Recognition",
  ];

  const email = "hey@aeden.me";
  const linkedinUrl = "https://www.linkedin.com/in/aedenthomas/";
  const githubUrl = "https://github.com/AedenThomas/";

  const sortedProjects = projects.sort((a, b) => {
    const order = ["Live", "In Development", "Public", "Private"];
    return order.indexOf(a.status) - order.indexOf(b.status);
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
          <span className="text-4xl mb-4">👨‍💻</span>
          <h1 className="text-4xl font-bold mb-4 mt-5">
            Aeden Thomas - Software Engineer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Motivated and skilled engineer with a strong foundation in Python,
            Flutter, C++, C, and Unix. Experienced in developing mobile and web
            applications. Seeking an internship opportunity to further develop
            my skills and contribute to a successful organization.
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <a
                href={`mailto:${email}`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center"
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
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center"
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
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center"
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
            <button
              className="text-sm bg-transparent border border-gray-300 text-gray-500 px-4 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200 mr-3"
              onClick={() => {
                // Add logic to view/download resume
                console.log("Resume clicked");
              }}
            >
              Resume
            </button>
          </div>
        </div>

        <div ref={projectsRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
            ~/side projects
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isProjectsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5 }}
          >
            {sortedProjects.map((project, index) => (
              <motion.div
                key={index}
                className={`flex items-start mb-1 p-2 rounded-lg transition-all duration-200 ease-in-out ${
                  project.url
                    ? "hover:bg-navy-800 dark:hover:bg-navy-900 cursor-pointer"
                    : ""
                } ${
                  project.status === "Coming Soon"
                    ? ""
                    : "hover:bg-navy-800 dark:hover:bg-navy-900"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={
                  project.status !== "Coming Soon" ? { scale: 1.01 } : {}
                }
                onClick={() =>
                  project.url && window.open(project.url, "_blank")
                }
              >
                <span className="text-2xl mr-4 mt-1 flex-shrink-0">
                  {project.icon}
                </span>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate mr-2 group-hover:text-white">
                      {project.title}
                    </h3>
                    <button
                      className={`text-sm rounded-full border flex items-center justify-center h-8 flex-shrink-0 relative ${
                        project.status === "Live"
                          ? "border-green-500 text-green-500 w-[4.75rem] pl-3 pr-0"
                          : project.status === "Public"
                          ? "border-blue-500 text-blue-500 w-20 px-3"
                          : project.status === "In Development"
                          ? "border-yellow-500 text-yellow-500 w-32 px-3"
                          : "border-gray-300 text-gray-500 w-32 px-3"
                      }`}
                    >
                      <AnimatePresence>
                        {project.status === "Live" && isLiveVisible && (
                          <motion.span
                            className="absolute left-2 w-2 h-2 rounded-full bg-green-500"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
                      </AnimatePresence>
                      <span
                        className={`flex-grow text-center ${
                          project.status === "Live" ? "mr-1" : ""
                        }`}
                      >
                        {project.status}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words group-hover:text-gray-200">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
                className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 rounded-full px-3 py-1 text-sm cursor-pointer"
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
