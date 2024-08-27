import React, { useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView";

const Project = ({ project, index, isDarkMode, isLiveVisible }) => {
  const projectRef = useRef(null);
  const isInView = useInView(projectRef, { threshold: 0.1 });

  return (
    <motion.div
      ref={projectRef}
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
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
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
                : project.status.includes("In Development")
                ? "border-yellow-500 text-yellow-500 w-32 px-3"
                : "border-gray-300 text-gray-500 w-24 px-3"
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
        <div className="mt-2 flex flex-wrap gap-1">
          {project.technologies.map((tech, techIndex) => (
            <span
              key={techIndex}
              className={`text-xs px-2 py-1 rounded-full ${
                isDarkMode
                  ? "bg-gray-900 text-gray-200"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Project;
