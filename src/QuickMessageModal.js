// src/components/QuickMessageModal.js

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

// A new, separate component for the success animation.
const SuccessAnimation = ({ isDarkMode }) => {
  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const pathVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 0.5, ease: "easeInOut", delay: 0.2 },
    },
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="text-center py-8 flex flex-col items-center justify-center gap-4"
    >
      <motion.svg
        variants={iconVariants}
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-2"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          className={isDarkMode ? "stroke-gray-700" : "stroke-gray-300"}
        />
        <motion.path
          d="M7.75 12.5L10.58 15.25L16.25 9.75"
          variants={pathVariants}
          className={isDarkMode ? "stroke-white" : "stroke-black"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
      <motion.div variants={textVariants}>
        <h3 className="text-lg font-semibold">Message Received</h3>
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          I'll be in touch shortly.
        </p>
      </motion.div>
    </motion.div>
  );
};

const QuickMessageModal = ({ isOpen, onClose, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  // We use a more descriptive state now: 'idle', 'submitting', 'success', 'error'
  const [formStatus, setFormStatus] = useState("idle");

  useEffect(() => {
    if (isOpen) {
      setFormStatus("idle"); // Reset status when modal opens
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("submitting");

    try {
      const response = await fetch("https://formspree.io/f/mblpdlpz", {
        // <-- MAKE SURE YOUR URL IS HERE
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => {
          onClose();
        }, 3000); // Keep success message visible for 3 seconds
      } else {
        setFormStatus("error");
      }
    } catch (error) {
      setFormStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed inset-0 ${
            isDarkMode
              ? "dark-mode-backdrop"
              : "bg-black bg-opacity-30 backdrop-blur"
          } flex items-center justify-center z-[9998]`}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`relative p-6 rounded-2xl w-full max-w-lg shadow-2xl ${
              isDarkMode
                ? "bg-black text-gray-200"
                : "bg-[#F2F0E9] text-gray-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1 rounded-full custom-cursor-clickable transition-colors ${
                isDarkMode
                  ? "text-gray-500 hover:bg-gray-800"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <AnimatePresence mode="wait">
              {formStatus === "success" ? (
                <motion.div key="success">
                  <SuccessAnimation isDarkMode={isDarkMode} />
                </motion.div>
              ) : (
                <motion.div key="form">
                  <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
                    Quick Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ... (Your form inputs remain exactly the same) ... */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label
                        htmlFor="name"
                        className="text-sm font-medium mb-1 block"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`w-full p-3 rounded-lg text-base transition-colors focus:outline-none focus:ring-2 ${
                          isDarkMode
                            ? "bg-[#2F2F2F] text-white placeholder-gray-500 border-transparent focus:ring-white/50"
                            : "bg-white text-black placeholder-gray-400 border border-gray-300 focus:ring-blue-500"
                        }`}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label
                        htmlFor="email"
                        className="text-sm font-medium mb-1 block"
                      >
                        Your Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        className={`w-full p-3 rounded-lg text-base transition-colors focus:outline-none focus:ring-2 ${
                          isDarkMode
                            ? "bg-[#2F2F2F] text-white placeholder-gray-500 border-transparent focus:ring-white/50"
                            : "bg-white text-black placeholder-gray-400 border border-gray-300 focus:ring-blue-500"
                        }`}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label
                        htmlFor="message"
                        className="text-sm font-medium mb-1 block"
                      >
                        Your Message
                      </label>
                      <textarea
                        name="message"
                        id="message"
                        rows="5"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="What's on your mind?"
                        className={`w-full p-3 rounded-lg text-base transition-colors focus:outline-none focus:ring-2 ${
                          isDarkMode
                            ? "bg-[#2F2F2F] text-white placeholder-gray-500 border-transparent focus:ring-white/50"
                            : "bg-white text-black placeholder-gray-400 border border-gray-300 focus:ring-blue-500"
                        }`}
                      ></textarea>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-between pt-2"
                    >
                      <button
                        type="submit"
                        disabled={formStatus === "submitting"}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold custom-cursor-clickable transition-all duration-300 ease-in-out ${
                          formStatus === "submitting"
                            ? isDarkMode
                              ? "bg-gray-700 text-gray-400"
                              : "bg-gray-300 text-gray-500"
                            : isDarkMode
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        {formStatus === "submitting" ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <PaperAirplaneIcon className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </motion.div>

                    {formStatus === "error" && (
                      <p className="text-center text-sm text-red-500 pt-2">
                        An error occurred. Please try again.
                      </p>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickMessageModal;
