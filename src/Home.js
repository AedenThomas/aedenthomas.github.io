import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";

import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView.js";
import AnimatedGreeting from "./AnimatedGreeting.js";
import "./App.css";
import Project from "./Project.js";
import { education, projects, skills, research, coursework } from "./data";
import ContactLinks from "./ContactLinks";
import LanguageIcon from "./LanguageIcon";
import { getCalApi } from "@calcom/embed-react";
import Privacy from "./BillifyPrivacy.js";

function Home({
  isDarkMode,
  isMobile,
  mousePosition,
  isHoveredClickable,
  toggleDarkMode,
  handleClickableHover,
  hoveredProjectIndex,
  isReachOutHovered,
  greetings,
  currentGreeting,
  handleLanguageHover,
  handleLanguageLeave,
  hoveredLanguage,
  handleReachOutMouseEnter,
  handleReachOutMouseLeave,
  email,
  linkedinUrl,
  githubUrl,
  isLiveVisible,
  handleProjectHover,
  skillsRef,
  isSkillsInView,
  educationRef,
  isEducationInView,
  publicationsRef,
  isPublicationsInView,
  courseworkRef,
  isCourseworkInView,
}) {
  return (
    <div
      className={`custom-cursor min-h-screen p-8 transition-colors duration-1000 ${
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
        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null
              ? "blur-xs"
              : isReachOutHovered
              ? "blur-sm"
              : ""
          }`}
        >
          <div className="mb-8">
            <img
              src="/Face.webp"
              alt="Face"
              width="45"
              height="45"
              className="text-4xl mb-7"
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
              . I've created various mobile and web applications, striving for that perfect{" "}
  <span className="relative bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300">
    balance between design and functionality
  </span>
  . I'm passionate about bringing{" "}
  <span className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-green-500 after:transition-all after:duration-300">
    innovative solutions
  </span>{" "}
  to projects, especially in{" "}
  <span className="relative inline hover:text-green-500 hover:bg-opacity-10 hover:bg-green-300 dark:hover:bg-green-800 transition-all duration-300">
    <span className="whitespace-nowrap">dynamic startup</span>{" "}
    environments
  </span>
  .
</p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              My goal is to apply my{" "}
              <span className="relative bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300">
                expertise
              </span>{" "}
              to meaningful initiatives using cutting-edge technologies. I'm
              eager to explore opportunities in{" "}
              <span className="relative inline-block px-1 hover:text-green-500 hover:scale-105 hover:bg-opacity-10 hover:bg-green-300 dark:hover:bg-green-800 transition-all duration-300">
                full-stack development
              </span>{" "}
              and{" "}
              <span className="relative inline-block px-1 hover:text-green-500 hover:scale-105 hover:bg-opacity-10 hover:bg-green-300 dark:hover:bg-green-800 transition-all duration-300">
                enterprise solutions
              </span>
              , particularly within{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-green-500 after:transition-all after:duration-300">
                emerging startups
              </span>
              . With my{" "}
              <span className="relative bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300">
                adaptability and quick learning skills
              </span>
              , I'm well-suited for the ever-changing startup landscape.{" "}
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
                Lemme know
              </span>{" "}
              if you'd like to discuss potential collaborations in these
              exciting areas.
            </p>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null ? "blur-xs" : ""
          }`}
        >
          <ContactLinks
            email={email}
            linkedinUrl={linkedinUrl}
            githubUrl={githubUrl}
            handleClickableHover={handleClickableHover}
          />
        </div>

        <div
          className={`mb-8 transition-all duration-300 ${
            isReachOutHovered ? "blur-sm" : ""
          }`}
        >
          <h2 className="text-xl font-semibold mb-3 text-gray-500 dark:text-gray-400">
            ~/side projects
          </h2>
          {projects.map((project, index) => (
            <Project
              key={index}
              project={project}
              index={index}
              isDarkMode={isDarkMode}
              isLiveVisible={isLiveVisible}
              handleClickableHover={handleClickableHover}
              onProjectHover={handleProjectHover}
              isBlurred={
                hoveredProjectIndex !== null && hoveredProjectIndex !== index
              }
              hoveredProjectIndex={hoveredProjectIndex}
              isReachOutHovered={isReachOutHovered}
            />
          ))}
        </div>

        <div
          className={`transition-all duration-300 ${
            hoveredProjectIndex !== null || isReachOutHovered ? "blur-xs" : ""
          }`}
        >
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
                  className="mb-4 p-2 rounded-lg hover:bg-navy-800 dark:hover:bg-navy-900 transition-transform duration-200 ease-in-out"
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
                  className="mb-4 p-2 rounded-lg hover:bg-navy-800 dark:hover:bg-navy-900"
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
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
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

export default Home;