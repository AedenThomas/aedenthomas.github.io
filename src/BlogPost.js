import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function BlogPost({
  isDarkMode,
  isMobile,
  handleClickableHover,
  toggleDarkMode,
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isAIButtonHovered, setIsAIButtonHovered] = useState(false);
  const [isBlogButtonHovered, setBlogButtonHovered] = useState(false);
  const [post, setPost] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  // Sample blog posts data - this should be moved to a central location
  const blogPosts = [
    {
      id: 1,
      title: "Building a Modern Portfolio Website with React",
      date: "March 15, 2024",
      excerpt:
        "A deep dive into creating a responsive, animated portfolio website using React, Framer Motion, and TailwindCSS.",
      readTime: "5 min read",
      tags: ["React", "Framer Motion", "TailwindCSS"],
      image: "/blog/portfolio.webp",
      content: `
# Building a Modern Portfolio Website with React

## Introduction
Creating a modern portfolio website requires careful consideration of both aesthetics and functionality. In this post, I'll share my experience building this website using React, Framer Motion, and TailwindCSS.

## Key Features
- Responsive design that works on all devices
- Smooth animations and transitions
- Dark mode support
- Custom cursor implementation
- Interactive UI elements

## Technical Implementation
### Setting up the Project
First, we need to set up our React project with the necessary dependencies...

### Animation System
For animations, I chose Framer Motion because...

### Styling with TailwindCSS
TailwindCSS provided a great foundation for...

## Challenges and Solutions
One of the main challenges was...

## Conclusion
Building this portfolio has been an exciting journey...
      `,
    },
    {
      id: 2,
      title: "The Journey of Building AI Aeden",
      date: "March 10, 2024",
      excerpt:
        "Exploring the development process and technical challenges of creating an AI-powered chatbot interface.",
      readTime: "8 min read",
      tags: ["AI", "React", "API Integration"],
      image: "/blog/ai-aeden.webp",
      content: `
# The Journey of Building AI Aeden

## Introduction
AI Aeden started as an experiment in creating a more personal and interactive way to present my portfolio. Here's the story of how it came to be.

## The Vision
I wanted to create something more than just a static chatbot...

## Technical Architecture
### Frontend Implementation
The chat interface was built using...

### AI Integration
The AI capabilities were implemented using...

## Challenges Faced
### Real-time Response Handling
One of the biggest challenges was...

### Context Management
Maintaining conversation context required...

## Future Improvements
Some planned enhancements include...

## Conclusion
Building AI Aeden has been a fascinating journey...
      `,
    },
  ];

  useEffect(() => {
    const foundPost = blogPosts.find((p) => p.id === parseInt(id));
    if (foundPost) {
      setPost(foundPost);
    } else {
      navigate("/blog");
    }
  }, [id, navigate]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
      setButtonPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleAIClick = () => {
    setIsNavigating(true);
    setShouldNavigate(true);
    setTimeout(() => {
      navigate("/ai");
    }, 3000);
  };

  const handleBlogClick = () => {
    setIsNavigating(true);
    setShouldNavigate(true);
    setTimeout(() => {
      navigate("/blog");
    }, 3000);
  };

  useEffect(() => {
    if (shouldNavigate) {
      const initiateNavigation = async () => {
        setIsNavigating(true);

        try {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.error("❌ [Navigation] Error:", error);
        } finally {
          setIsNavigating(false);
          setShouldNavigate(false);
        }
      };

      initiateNavigation();
    }
  }, [shouldNavigate]);

  // Button animation variants
  const buttonVariants = {
    expanded: {
      width: "auto",
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    collapsed: {
      width: "40px",
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
        delay: 0.2,
      },
    },
  };

  // Text animation variants
  const aiTextVariants = {
    expanded: {
      width: "auto",
      x: 0,
      opacity: 1,
      paddingLeft: "16px",
      transition: {
        width: { duration: 1, ease: [0.4, 0, 0.2, 1] },
        x: { duration: 1, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.6, delay: 0.3, ease: "easeOut" },
        paddingLeft: { duration: 0.6, ease: "easeOut" },
      },
    },
    collapsed: {
      width: 0,
      x: 40,
      opacity: 0,
      paddingLeft: 0,
      transition: {
        opacity: { duration: 0.3, ease: "easeOut" },
        width: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
        x: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
        paddingLeft: { duration: 0.3, ease: "easeOut" },
      },
    },
  };

  if (!post) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen flex flex-col items-center p-4 md:p-8 theme-transition ${
        isDarkMode ? "bg-black text-white" : "bg-[#F2F0E9] text-gray-900"
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
                : "0 0 10px rgba(0, 0, 0, 5)",
            }}
          />
        </>
      )}

      <div className="relative w-full">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          onMouseEnter={() => handleClickableHover(true)}
          onMouseLeave={() => handleClickableHover(false)}
          className={`fixed ${
            isMobile ? "top-28" : "top-16"
          } right-4 p-2 rounded-full custom-cursor-clickable w-10 h-10 z-50 flex items-center justify-center transition-all duration-500 ease-in-out ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        {/* AI Button */}
        <motion.button
          onClick={handleAIClick}
          onMouseEnter={() => {
            handleClickableHover(true);
            setIsAIButtonHovered(true);
          }}
          onMouseLeave={() => {
            handleClickableHover(false);
            setIsAIButtonHovered(false);
          }}
          className={`fixed top-4 right-4 rounded-full custom-cursor-clickable overflow-hidden h-10 z-50 ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          }`}
          variants={buttonVariants}
          initial="collapsed"
          animate={isAIButtonHovered ? "expanded" : "collapsed"}
          style={{
            minWidth: "40px",
            maxWidth: "200px",
            willChange: "width",
            transform: "translateZ(0)",
          }}
        >
          <div className="relative w-full h-full">
            <div
              className="absolute right-0 top-0 bottom-0 w-[40px] flex items-center justify-center"
              style={{
                transform: "none",
                transition: "none",
              }}
            >
              <span className="text-sm" style={{ transition: "none" }}>
                🤖
              </span>
            </div>
            <div
              className="h-full flex items-center"
              style={{
                paddingRight: "40px",
                transition: "none",
              }}
            >
              <AnimatePresence mode="wait">
                {isAIButtonHovered && (
                  <motion.span
                    key="ai-text"
                    className="whitespace-nowrap overflow-hidden pl-4"
                    variants={aiTextVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                  >
                    Talk to AI Aeden
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.button>

        {/* Blog Button */}
        <motion.button
          onClick={handleBlogClick}
          onMouseEnter={() => {
            handleClickableHover(true);
            setBlogButtonHovered(true);
          }}
          onMouseLeave={() => {
            handleClickableHover(false);
            setBlogButtonHovered(false);
          }}
          className={`fixed ${
            isMobile ? "top-16 right-4" : "top-4 left-4"
          } rounded-full custom-cursor-clickable overflow-hidden h-10 z-50 ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          }`}
          variants={buttonVariants}
          initial="collapsed"
          animate={isBlogButtonHovered ? "expanded" : "collapsed"}
          style={{
            minWidth: "40px",
            maxWidth: "200px",
            willChange: "width",
            transform: "translateZ(0)",
          }}
        >
          <div className="relative w-full h-full">
            <div
              className="absolute left-0 top-0 bottom-0 w-[40px] flex items-center justify-center"
              style={{
                transform: "none",
                transition: "none",
              }}
            >
              <span className="text-sm" style={{ transition: "none" }}>
                📝
              </span>
            </div>
            <div
              className="h-full flex items-center"
              style={{
                paddingLeft: "40px",
                transition: "none",
              }}
            >
              <AnimatePresence mode="wait">
                {isBlogButtonHovered && (
                  <motion.span
                    key="blog-text"
                    className="whitespace-nowrap overflow-hidden pr-4"
                    variants={aiTextVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                  >
                    Back to Blog
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto w-full mt-20"
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {post.date}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {post.readTime}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            {post.image && (
              <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {isNavigating && (
          <motion.div
            initial={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              clipPath: `circle(0px at ${buttonPosition.x + 16}px ${
                buttonPosition.y + 16
              }px)`,
              zIndex: 9999,
              backgroundColor: isDarkMode ? "#000000" : "#F2F0E9",
            }}
            animate={{
              clipPath: `circle(300vh at ${buttonPosition.x + 16}px ${
                buttonPosition.y + 16
              }px)`,
            }}
            transition={{
              duration: 2.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-screen h-screen overflow-hidden"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BlogPost;
