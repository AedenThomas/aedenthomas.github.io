import { useEffect, useState, useCallback, useRef } from "react";

function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const [element, setElement] = useState(null);
  const observerRef = useRef(null);
  
  // Use a callback ref to handle element mounting/unmounting
  const ref = useCallback((node) => {
    setElement(node);
  }, []);

  // Create a stable, primitive dependency from the options object.
  const stringifiedOptions = JSON.stringify(options);

  useEffect(() => {
    if (!element) return;

    // Disconnect previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const parsedOptions = JSON.parse(stringifiedOptions);
    const { triggerOnce = false } = parsedOptions;

    const observerCallback = ([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (triggerOnce && observerRef.current) {
          observerRef.current.unobserve(element);
        }
      } else if (!triggerOnce) {
        setIsInView(false);
      }
    };

    const observer = new IntersectionObserver(observerCallback, parsedOptions);
    observerRef.current = observer;
    observer.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [element, stringifiedOptions]);

  return [ref, isInView];
}

export default useInView;
