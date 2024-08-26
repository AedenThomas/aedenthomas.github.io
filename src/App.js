import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLiveVisible, setIsLiveVisible] = useState(true);

  const skillsRef = useRef(null);
  const educationRef = useRef(null);

  const isSkillsInView = useInView(skillsRef, { threshold: 0.1 });
  const isEducationInView = useInView(educationRef, { threshold: 0.1 });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLiveVisible((prev) => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

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
      status: "Coming Soon",
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
      icon: "🔒",
      title: "Outline VPN",
      description:
        "Hosted and managed VPN Servers using Shadowsocks on various cloud platforms.",
      status: "Live",
      url: "https://outline.example.com",
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
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Motivated and skilled engineer with a strong foundation in Python,
            Flutter, C++, C, and Unix. Experienced in developing mobile and web
            applications. Seeking an internship opportunity to further develop
            my skills and contribute to a successful organization.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">
            ~/projects
          </h2>
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className={`flex items-start mb-4 p-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-navy-800 dark:hover:bg-navy-900 ${
                project.url ? "cursor-pointer" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => project.url && window.open(project.url, "_blank")}
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
        </div>

        <div ref={skillsRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">
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
          <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">
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
                className="mb-4 p-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-navy-800 dark:hover:bg-navy-900"
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
