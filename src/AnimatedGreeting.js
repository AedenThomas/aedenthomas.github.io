import React, { useState, useEffect, useMemo } from "react"; // Add useMemo
import { motion } from "framer-motion";

const AnimatedGreeting = ({ greeting, className }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [visibleLetters, setVisibleLetters] = useState(0);

  // THIS IS THE CRITICAL CHANGE
  // We use Intl.Segmenter to correctly split the string into graphemes.
  // useMemo ensures we don't recreate the segmenter on every render.
  const graphemes = useMemo(() => {
    // Create a segmenter for the user's locale that splits by grapheme.
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    // Perform the segmentation and convert the result into an array of strings.
    return Array.from(segmenter.segment(greeting), (s) => s.segment);
  }, [greeting]);

  useEffect(() => {
    setVisibleLetters(0);
    setIsComplete(false);

    const letterInterval = setInterval(() => {
      setVisibleLetters((prev) => {
        // We now check against the length of our correctly segmented array.
        if (prev < graphemes.length) {
          return prev + 1;
        } else {
          clearInterval(letterInterval);
          setIsComplete(true);
          return prev;
        }
      });
    }, 100);

    return () => {
      clearInterval(letterInterval);
    };
  }, [greeting, graphemes]); // Add graphemes to the dependency array

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      {/* We now map over the correctly segmented 'graphemes' array */}
      {graphemes.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: index < visibleLetters ? 1 : 0,
            y: index < visibleLetters ? 0 : 20,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            delay: 0, // No delay needed here
          }}
          // Add this style to prevent letter wrapping during animation
          style={{ display: "inline-block" }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedGreeting;
