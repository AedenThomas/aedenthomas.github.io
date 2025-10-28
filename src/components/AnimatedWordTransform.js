import React, { useState, useEffect, useCallback, useRef } from "react";

const AnimatedWordTransform = ({
  fromWord = "shit",
  toWord = "software",
  delay = 5000,
  className = "",
  handleClickableHover,
}) => {
  const [currentWord, setCurrentWord] = useState(fromWord);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [animationInterval, setAnimationInterval] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hasInitialAnimationCompleted, setHasInitialAnimationCompleted] =
    useState(false);
  const [hoverAnimationInProgress, setHoverAnimationInProgress] =
    useState(false);
  const [targetState, setTargetState] = useState("toWord"); // Track intended state: "toWord" or "fromWord"
  const initialAnimationRan = useRef(false);
  const lastStateChangeTime = useRef(0);
  const stateChangeTimer = useRef(null);
  const isFirstHoverAfterInitial = useRef(true);

  // Generate alphabet with symbols for cycling effect
  const alphabet = "abcdefghijklmnopqrstuvwxyz!@#$%^&*+-=?";

  // Detect if device is mobile
  const isMobile = () => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  };

  // Check if enough time has passed since last state change
  const canChangeState = useCallback(
    (newTargetState) => {
      const now = Date.now();
      const timeSinceLastChange = now - lastStateChangeTime.current;

      // Allow first hover after initial animation without waiting
      if (
        newTargetState === "fromWord" &&
        targetState === "toWord" &&
        isFirstHoverAfterInitial.current
      ) {
        return true;
      }

      // If we're going to fromWord, need to wait 5 seconds since last toWord
      if (newTargetState === "fromWord" && targetState === "toWord") {
        return timeSinceLastChange >= 5000; // 5 seconds
      }

      // If we're going to toWord, need to wait 2 seconds since last fromWord
      if (newTargetState === "toWord" && targetState === "fromWord") {
        return timeSinceLastChange >= 2000; // 2 seconds
      }

      return true; // Allow other transitions
    },
    [targetState]
  );

  // Update state with timing control
  const updateTargetState = useCallback(
    (newState) => {
      console.log(
        `🕐 Attempting to change state to ${newState}, current: ${targetState}`
      );

      if (canChangeState(newState)) {
        console.log(`✅ State change allowed, updating to ${newState}`);
        setTargetState(newState);
        lastStateChangeTime.current = Date.now();

        // Mark that first hover has been used
        if (newState === "fromWord" && isFirstHoverAfterInitial.current) {
          isFirstHoverAfterInitial.current = false;
          console.log("🎯 First hover after initial animation used");
        }

        return true;
      } else {
        const timeSinceLastChange = Date.now() - lastStateChangeTime.current;
        const requiredWait = newState === "fromWord" ? 5000 : 2000;
        const remainingWait = requiredWait - timeSinceLastChange;
        console.log(
          `⏳ State change blocked, need to wait ${remainingWait}ms more`
        );
        return false;
      }
    },
    [targetState, canChangeState]
  );

  const animateTransform = useCallback(
    (startWord, targetWord, onComplete) => {
      console.log(`🎬 Starting animation: "${startWord}" → "${targetWord}"`);
      const maxLength = Math.max(startWord.length, targetWord.length);
      const startArray = startWord.split("");
      const targetArray = targetWord.split("");

      // Extend arrays to match target length
      while (startArray.length < maxLength) {
        startArray.push("");
      }
      while (targetArray.length < maxLength) {
        targetArray.push("");
      }

      // Initialize character indices for each position
      const charIndices = startArray.map((char) => {
        if (!char) return 0;
        const index = alphabet.indexOf(char.toLowerCase());
        return index === -1 ? alphabet.indexOf(char) : index; // Try exact match if lowercase fails
      });

      const targetIndices = targetArray.map((char) => {
        if (!char) return 0;
        const index = alphabet.indexOf(char.toLowerCase());
        return index === -1 ? alphabet.indexOf(char) : index; // Try exact match if lowercase fails
      });

      // Check if all characters have reached their targets
      const allReachedTarget = () => {
        return charIndices.every((current, i) => {
          const target = targetIndices[i];
          const targetChar = targetArray[i];
          // Handle characters not in alphabet
          if (
            !targetChar ||
            (alphabet.indexOf(targetChar.toLowerCase()) === -1 &&
              alphabet.indexOf(targetChar) === -1)
          ) {
            return true;
          }
          return current === target;
        });
      };

      const interval = setInterval(() => {
        let hasChanges = false;

        // Update each character that hasn't reached its target
        for (let i = 0; i < maxLength; i++) {
          const targetChar = targetArray[i];
          const targetIndex = targetIndices[i];

          // Handle characters not in alphabet
          if (
            !targetChar ||
            (alphabet.indexOf(targetChar.toLowerCase()) === -1 &&
              alphabet.indexOf(targetChar) === -1)
          ) {
            continue;
          }

          if (charIndices[i] !== targetIndex) {
            hasChanges = true;

            // Calculate shortest path with expanded alphabet
            const distance = targetIndex - charIndices[i];
            const absDistance = Math.abs(distance);
            const alphabetLength = alphabet.length;
            const reverseDistance = alphabetLength - absDistance;

            if (absDistance <= reverseDistance) {
              // Direct path is shorter
              charIndices[i] += distance > 0 ? 1 : -1;
            } else {
              // Reverse path is shorter
              charIndices[i] += distance > 0 ? -1 : 1;
            }

            // Handle wrap-around with expanded alphabet
            if (charIndices[i] < 0) charIndices[i] = alphabetLength - 1;
            if (charIndices[i] >= alphabetLength) charIndices[i] = 0;
          }
        }

        // Build the current word
        const currentArray = charIndices.map((index, i) => {
          const targetChar = targetArray[i];
          // Use target character if it's not in alphabet
          if (
            !targetChar ||
            (alphabet.indexOf(targetChar.toLowerCase()) === -1 &&
              alphabet.indexOf(targetChar) === -1)
          ) {
            return targetChar;
          }
          return alphabet[index];
        });

        setCurrentWord(currentArray.join(""));

        // Stop animation when all characters reach their targets
        if (!hasChanges || allReachedTarget()) {
          // Set final word to ensure exact match
          console.log(`🎯 Animation complete: "${targetWord}"`);
          setCurrentWord(targetWord);
          clearInterval(interval);
          setAnimationInterval(null);
          if (onComplete) {
            console.log("📞 Calling completion callback");
            onComplete();
          }
        }
      }, 80);

      setAnimationInterval(interval);
    },
    [alphabet]
  );

  useEffect(() => {
    if (!initialAnimationRan.current) {
      initialAnimationRan.current = true;
      const timer = setTimeout(() => {
        console.log("🚀 Starting initial animation");
        setIsAnimating(true);
        animateTransform(fromWord, toWord, () => {
          console.log("✅ Initial animation complete, ready for interactions");
          setIsAnimating(false);
          setHasInitialAnimationCompleted(true);
          setTargetState("toWord"); // We're now showing the toWord
          lastStateChangeTime.current = Date.now(); // Set initial timing
        });
      }, delay);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [delay, fromWord, toWord, animateTransform]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (stateChangeTimer.current) {
        clearTimeout(stateChangeTimer.current);
      }
    };
  }, []);

  // Handle laptop hover behavior - stay on fromWord while hovering
  useEffect(() => {
    if (
      !isMobile() &&
      hasInitialAnimationCompleted &&
      !hoverAnimationInProgress
    ) {
      if (isHovering && targetState === "toWord") {
        if (updateTargetState("fromWord")) {
          console.log("🖱️ Laptop hover detected, animating to fromWord");
          setHoverAnimationInProgress(true);
          setIsAnimating(true);
          animateTransform(currentWord, fromWord, () => {
            console.log("✅ Reached fromWord on hover");
            setIsAnimating(false);
            setHoverAnimationInProgress(false);
          });
        }
      } else if (!isHovering && targetState === "fromWord") {
        // Clear any existing timer first
        if (stateChangeTimer.current) {
          clearTimeout(stateChangeTimer.current);
          stateChangeTimer.current = null;
        }

        // Set a timer to allow transition back after 2 seconds minimum
        const timeSinceLastChange = Date.now() - lastStateChangeTime.current;
        const waitTime = Math.max(0, 2000 - timeSinceLastChange);

        stateChangeTimer.current = setTimeout(() => {
          if (!isHovering && targetState === "fromWord") {
            // Double check conditions
            if (updateTargetState("toWord")) {
              console.log("🖱️ Laptop hover ended, animating back to toWord");
              setHoverAnimationInProgress(true);
              setIsAnimating(true);
              animateTransform(currentWord, toWord, () => {
                console.log("✅ Returned to toWord after hover");
                setIsAnimating(false);
                setHoverAnimationInProgress(false);
              });
            }
          }
        }, waitTime);
      }
    }
  }, [
    isHovering,
    hasInitialAnimationCompleted,
    hoverAnimationInProgress,
    targetState,
    currentWord,
    fromWord,
    toWord,
    animateTransform,
    updateTargetState,
  ]);

  const handleMobileInteraction = () => {
    console.log("📱 Mobile interaction detected!");
    console.log("Current state:", { isAnimating, isReversed, currentWord });

    if (isAnimating) {
      console.log("⚠️ Animation in progress, ignoring interaction");
      return; // Prevent interactions during animation
    }

    console.log("✅ Starting mobile reverse animation");

    // Clear any existing animation
    if (animationInterval) {
      console.log("🧹 Clearing existing animation interval");
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }

    setIsReversed(true);
    setIsAnimating(true);
    setTargetState("fromWord");

    // Animate back to fromWord
    console.log(`🔄 Animating from "${currentWord}" to "${fromWord}"`);
    animateTransform(currentWord, fromWord, () => {
      console.log(`✅ Reached '${fromWord}', waiting 2 seconds...`);
      // After reaching fromWord, wait 2 seconds then go back to toWord
      setTimeout(() => {
        console.log(`🔄 Animating from "${fromWord}" to "${toWord}"`);
        setTargetState("toWord");
        animateTransform(fromWord, toWord, () => {
          console.log(`✅ Animation complete, back to '${toWord}'`);
          setIsReversed(false);
          setIsAnimating(false);
        });
      }, 2000);
    });
  };

  return (
    <span
      className={`${className} custom-cursor-clickable hover:opacity-80 transition-all duration-200`}
      onClick={isMobile() ? handleMobileInteraction : undefined}
      onMouseEnter={() => {
        if (handleClickableHover) {
          handleClickableHover(true);
        }
        // Set hovering state for desktop/laptop
        if (!isMobile()) {
          setIsHovering(true);
        }
      }}
      onMouseLeave={() => {
        if (handleClickableHover) {
          handleClickableHover(false);
        }
        // Clear hovering state for desktop/laptop
        if (!isMobile()) {
          setIsHovering(false);
        }
      }}
    >
      {currentWord}
    </span>
  );
};

export default AnimatedWordTransform;
