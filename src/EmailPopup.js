import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

const EmailPopup = ({
  email,
  isOpen,
  onClose,
  handleClickableHover,
  isDarkMode = false,
  emailSubject = "Quick Question!",
  emailBody = "Hey Aeden :),\n\nI'm reaching out regarding...",
}) => {
  const options = [
    {
      title: "Open in Gmail",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="52 42 88 66"
          className="w-6 h-6"
        >
          <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
          <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
          <path
            fill="#fbbc04"
            d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"
          />
          <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
          <path
            fill="#c5221f"
            d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
          />
        </svg>
      ),
      description: "Compose new email in Gmail",
      action: () =>
        window.open(
          `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(
            emailSubject
          )}&body=${encodeURIComponent(emailBody)}`,
          "_blank"
        ),
    },
    {
      title: "Open in Outlook",
      icon: <img src="/outlook.svg" alt="Outlook" className="w-6 h-6" />,
      description: "Compose new email in Outlook",
      action: () =>
        window.open(
          `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${encodeURIComponent(
            emailSubject
          )}&body=${encodeURIComponent(emailBody)}`,
          "_blank"
        ),
    },
    {
      title: "Open in Mail App",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path
            fill={isDarkMode ? "#ffffff" : "#000000"}
            d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
          />
        </svg>
      ),
      description: "Use your default email client",
      action: () =>
        (window.location.href = `mailto:${email}?subject=${encodeURIComponent(
          emailSubject
        )}&body=${encodeURIComponent(emailBody)}`),
    },
    {
      title: "Copy Email Address",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path
            fill={isDarkMode ? "#ffffff" : "#000000"}
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          />
        </svg>
      ),
      description: "Copy to clipboard",
      action: async () => {
        await navigator.clipboard.writeText(email);
        onClose();
      },
    },
  ];

  // Debug function to log class names
  const getModalClasses = () => {
    const classes = `
      rounded-2xl shadow-xl overflow-hidden m-4 flex flex-col
      w-full max-w-md
      ${isDarkMode === true ? "!bg-black !text-white" : "bg-white text-black"}
    `;
    return classes;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 ${
            isDarkMode === true
              ? "dark-mode-backdrop"
              : "bg-black bg-opacity-30 backdrop-blur"
          } flex items-center justify-center z-[9998]`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onClose}
        >
          <motion.div
            className={getModalClasses()}
            style={{
              backgroundColor: isDarkMode === true ? "#000000" : "#ffffff",
              color: isDarkMode === true ? "#ffffff" : "#000000",
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div
              className={`p-6 flex justify-between items-start border-b ${
                isDarkMode === true ? "border-gray-800" : "border-gray-200"
              }`}
              style={{
                borderColor: isDarkMode === true ? "#1f2937" : "#e5e7eb",
              }}
            >
              <div>
                <h2
                  className={`text-2xl font-bold mb-2 ${
                    isDarkMode === true ? "!text-white" : "text-black"
                  }`}
                  style={{
                    color: isDarkMode === true ? "#ffffff" : "#000000",
                  }}
                >
                  Contact Options
                </h2>
                <p
                  className={`text-sm ${
                    isDarkMode === true ? "!text-gray-400" : "text-gray-600"
                  }`}
                  style={{
                    color: isDarkMode === true ? "#9ca3af" : "#4b5563",
                  }}
                >
                  Choose how you'd like to get in touch
                </p>
              </div>
              <button
                onClick={(e) => {
                  onClose();
                }}
                className={`text-2xl font-bold ${
                  isDarkMode === true
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-400 hover:text-gray-600"
                } transition-colors`}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-3">
              {options.map((option, index) => (
                <motion.button
                  key={index}
                  className={`w-full text-left p-4 rounded-xl flex items-center space-x-4 
                    ${
                      isDarkMode === true
                        ? "hover:bg-gray-800 active:bg-gray-700"
                        : "hover:bg-gray-100 active:bg-gray-200"
                    } transition-colors duration-200 custom-cursor-clickable`}
                  style={{
                    backgroundColor:
                      isDarkMode === true ? "#000000" : "#ffffff",
                  }}
                  onClick={(e) => {
                    option.action();
                  }}
                  onMouseEnter={() => handleClickableHover(true)}
                  onMouseLeave={() => handleClickableHover(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div>
                    <p
                      className={`font-medium ${
                        isDarkMode === true ? "!text-white" : "text-gray-900"
                      }`}
                      style={{
                        color: isDarkMode === true ? "#ffffff" : "#111827",
                      }}
                    >
                      {option.title}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode === true ? "!text-gray-400" : "text-gray-600"
                      }`}
                      style={{
                        color: isDarkMode === true ? "#9ca3af" : "#4b5563",
                      }}
                    >
                      {option.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

EmailPopup.propTypes = {
  email: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleClickableHover: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
  emailSubject: PropTypes.string,
  emailBody: PropTypes.string,
};

EmailPopup.defaultProps = {
  isDarkMode: false,
};

export default EmailPopup;
