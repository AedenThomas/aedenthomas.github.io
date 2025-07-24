import { useEffect, useState } from "react";

function useInView(ref, options) {
  const [isInView, setIsInView] = useState(false);

  // Create a stable, primitive dependency from the options object.
  const stringifiedOptions = JSON.stringify(options);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const parsedOptions = JSON.parse(stringifiedOptions);
    const { triggerOnce = false } = parsedOptions;

    const observerCallback = ([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (triggerOnce) {
          observer.unobserve(element);
        }
      } else if (!triggerOnce) {
        setIsInView(false);
      }
    };

    const observer = new IntersectionObserver(observerCallback, parsedOptions);
    observer.observe(element);

    // Cleanup function to disconnect the observer
    return () => {
      observer.disconnect();
    };
    // FIX: The dependency array now ONLY contains stable values, preventing the infinite loop.
  }, [ref, stringifiedOptions]);

  return isInView;
}

export default useInView;
