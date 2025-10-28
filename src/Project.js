import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useInView from "./useInView";
import "./App.css";
import { FaLock, FaLockOpen, FaClock, FaChevronRight } from "react-icons/fa";

const statusConfig = {
  Live: { colorClass: "text-green-500 border-green-500", width: "w-[4.75rem]" },
  Public: { colorClass: "text-blue-500 border-blue-500", width: "w-20" },
  "In Development": {
    colorClass: "text-yellow-500 border-yellow-500",
    width: "w-40",
  },
  "Coming Soon": {
    colorClass: "text-purple-500 border-purple-500",
    width: "w-32",
  },
  Private: { colorClass: "text-gray-500 border-gray-500", width: "w-20" },
};

// FIX: Define options OUTSIDE the component. This object is now a stable constant.
const viewOptions = {
  threshold: 0.1,
  triggerOnce: true,
};

const Project = ({
  project,
  index,
  isDarkMode,
  isLiveVisible,
  handleClickableHover,
  onProjectHover,
  isBlurred,
  hoveredProjectIndex,
  isReachOutHovered,
}) => {
  const projectRef = useRef(null);

  // Pass the stable viewOptions object to the hook.
  const isInView = useInView(projectRef, viewOptions);

  const contentRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleMouseEnter = () => {
    handleClickableHover(true);
    onProjectHover(index);
  };

  const handleMouseLeave = () => {
    handleClickableHover(false);
    onProjectHover(null);
  };
  const getStatusConfig = (status) => {
    if (status === "Live") return statusConfig["Live"];
    if (status.includes("In Development"))
      return statusConfig["In Development"];
    if (status === "Public") return statusConfig["Public"];
    if (status === "Coming Soon") return statusConfig["Coming Soon"];
    if (status === "Private") return statusConfig["Private"];
    return statusConfig["In Development"];
  };

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    if (isModalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (isModalOpen && contentRef.current) {
        e.preventDefault();
        contentRef.current.scrollTop += e.deltaY;
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [isModalOpen]);

  const getProjectUrl = (project) => {
    if (project.url) return project.url;
    if (project.relativePath)
      return `${window.location.origin}/${project.relativePath}`;
    return null;
  };

  return (
    <>
      <motion.div
        data-project-id={`project-${index}`}
        ref={projectRef}
        key={index}
        className={`flex items-center mb-3 p-4 rounded-xl 
          cursor-pointer custom-cursor-clickable
          transition-all duration-300 ease-out
          active:scale-[0.98]
          ${isBlurred || isReachOutHovered ? "blur-xs" : ""} 
          ${hoveredProjectIndex === index ? "z-10 relative" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={openModal}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="text-2xl mr-4 flex-shrink-0">{project.icon}</span>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="text-sm md:text-base font-semibold truncate mr-2 group-hover:text-white">
              {project.title}
            </h3>
            <button
              className={`text-xs rounded-full border flex items-center justify-center h-8 flex-shrink-0 relative
                ${getStatusConfig(project.status).width}
                ${getStatusConfig(project.status).colorClass}
                ${
                  project.status === "Live" ||
                  project.status.includes("In Development")
                    ? "pl-6 pr-3"
                    : "px-3"
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
                {project.status.includes("In Development") && (
                  <motion.span
                    className="absolute left-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {project.url ? (
                      <FaLockOpen className="text-yellow-500" size={12} />
                    ) : (
                      <FaLock className="text-yellow-500" size={12} />
                    )}
                  </motion.span>
                )}
                {project.status === "Coming Soon" && (
                  <motion.span
                    className="absolute left-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaClock className="text-purple-500" size={12} />
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="flex-grow text-center">{project.status}</span>
            </button>
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words group-hover:text-gray-200">
            {project.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {project.technologies.map((tech, techIndex) => (
              <span
                key={techIndex}
                className={`text-[10px] md:text-xs px-2 py-1 rounded-full ${
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
        <FaChevronRight
          className={`flex-shrink-0 ml-2 transition-transform duration-300 group-hover:translate-x-1 ${
            isDarkMode ? "text-white/30" : "text-gray-900/30"
          }`}
          size={16}
        />
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className={`fixed inset-0 ${
              isDarkMode
                ? "dark-mode-backdrop"
                : "bg-black bg-opacity-30 backdrop-blur"
            } flex items-center justify-center z-[9998]`}
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
                <h2 className="text-xl md:text-3xl font-bold">
                  {project.title}
                </h2>
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
              <div ref={contentRef} className="px-6 overflow-y-auto flex-grow">
                <div className="mb-6">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-auto object-cover rounded-lg"
                  />
                </div>
                <p
                  className={`text-sm md:text-lg mb-6 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {project.popupDescription || project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className={`text-xs md:text-sm px-3 py-1 rounded-full ${
                        isDarkMode
                          ? "bg-gray-900 text-gray-200"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {getProjectUrl(project) && (
                  <a
                    href={getProjectUrl(project)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block px-4 py-2 border ${
                      isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    } rounded-lg transition duration-300 text-xs md:text-sm font-medium mt-4 mb-6`}
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
