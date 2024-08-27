// Project.js
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView";
import "./App.css";

const Project = ({ project, index, isDarkMode, isLiveVisible }) => {
  const projectRef = useRef(null);
  const contentRef = useRef(null);
  const isInView = useInView(projectRef, { threshold: 0.1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        setIsScrolled(scrollTop > 0);
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isModalOpen]);

  return (
    <>
      <motion.div
        ref={projectRef}
        key={index}
        className={`flex items-start mb-1 p-2 rounded-lg transition-all duration-0 ease-in-out ${
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
        whileHover={project.status !== "Coming Soon" ? { scale: 1.02 } : {}}
        onClick={openModal}
      >
        <span className="text-2xl mr-4 mt-1 flex-shrink-0">{project.icon}</span>
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

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={closeModal}
          >
            <motion.div
              className={`
    ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}
    rounded-2xl w-full shadow-xl overflow-hidden m-4 flex flex-col
    max-w-[90vw] md:max-w-2xl lg:max-w-4xl
    max-h-[90vh] md:max-h-[80vh] lg:max-h-[90vh]
    min-h-[50vh] md:min-h-0
  `}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex justify-between items-start">
                <h2 className="text-3xl font-bold">{project.title}</h2>
                <button
                  onClick={closeModal}
                  className={`text-2xl font-bold ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-400 hover:text-gray-600"
                  } transition-colors`}
                >
                  ×
                </button>
              </div>
              <div className="px-6 overflow-y-auto flex-grow">
                <p
                  className={`text-lg mb-6 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {project.description}
                </p>
                <div className="mb-6">
                  <img
                    src={
                      project.image ||
                      "https://www.apple.com/v/mac/home/ca/images/overview/consider/boc_ease_01__fubebwkx80q6_large_2x.jpg"
                    }
                    alt={project.title}
                    className="w-full h-auto object-cover rounded-lg"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className={`text-sm px-3 py-1 rounded-full ${
                        isDarkMode
                          ? "bg-gray-900 text-gray-200"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block px-4 py-2 border ${
                      isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    } rounded-lg transition duration-300 text-sm font-medium mt-4 mb-6`}
                  >
                    View Project →
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Project;
