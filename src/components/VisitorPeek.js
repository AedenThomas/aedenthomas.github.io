import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import useVisitorCompany from "../useVisitorCompany";
import QuickMessageModal from "../QuickMessageModal";

/**
 * "The Peek" — when a visitor arrives from a company's corporate network, the
 * memoji and a question fade up in the bottom-left corner. The question shows
 * on its own; hovering (or tabbing in) opens the second line and the actions
 * underneath it, so the bubble only ever grows downward — nothing re-wraps.
 *
 * Portalled to <body> for the same reason ModeToggle is: Framer Motion adds
 * transforms to ancestors, which would otherwise break position: fixed. Being
 * outside the app tree also puts it out of reach of Tailwind's `dark` class,
 * so the theme is handed to the CSS on data-theme instead.
 *
 * Layout, colours and the open/close motion live in index.css under `.knock`.
 */
function VisitorPeek({ isDarkMode, handleClickableHover = () => {} }) {
  const [visitor, dismiss] = useVisitorCompany();
  const reduceMotion = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const rootRef = useRef(null);

  const hover = (on) => handleClickableHover(on);

  // Hover drives the reveal; a click pins it open so the pointer can wander off
  // the widget without collapsing it. Escape or a click elsewhere un-pins.
  useEffect(() => {
    if (!pinned) return undefined;

    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setPinned(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setPinned(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return ReactDOM.createPortal(
    <>
      <AnimatePresence>
        {visitor && (
          <motion.div
            ref={rootRef}
            data-theme={isDarkMode ? "dark" : "light"}
            className={`knock hidden md:block ${pinned ? "is-open" : ""}`}
            onClick={() => setPinned(true)}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.2 } }
                : { opacity: 0, y: 10, transition: { duration: 0.35, ease: "easeIn" } }
            }
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : {
                    opacity: { duration: 0.5 },
                    y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  }
            }
          >
            <div className="knock-row">
              <span className="knock-face">
                {/* two hoodies, one per theme, so the memoji never sinks into
                    the page behind it: white on the black site, black on the
                    cream one */}
                <img
                  src={
                    isDarkMode ? "/Memoji-Wave-Dark.webp" : "/Memoji-Wave-Light.webp"
                  }
                  alt=""
                  width="72"
                  height="72"
                  draggable="false"
                />
                <i className="knock-live" aria-hidden="true" />
              </span>

              <div className="knock-bubble">
                <p className="knock-q">oh, wait! do you work at {visitor.company}?</p>

                {/* second line + actions: closed until hover or focus */}
                <div className="knock-more">
                  <div>
                    <p className="knock-sub">
                      if so, hmu — i'd love to hear what you're building.
                    </p>
                    <div className="knock-acts">
                      <button
                        type="button"
                        className="knock-go custom-cursor-clickable"
                        onClick={() => {
                          hover(false);
                          setMessageOpen(true);
                        }}
                        onMouseEnter={() => hover(true)}
                        onMouseLeave={() => hover(false)}
                      >
                        quick message
                      </button>
                      <button
                        type="button"
                        className="knock-no custom-cursor-clickable"
                        onClick={() => {
                          hover(false);
                          dismiss();
                        }}
                        onMouseEnter={() => hover(true)}
                        onMouseLeave={() => hover(false)}
                      >
                        not me
                      </button>
                    </div>
                  </div>
                </div>

                {/* the "there's more here" tell, gone once it opens */}
                <span className="knock-tell" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickMessageModal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        isDarkMode={isDarkMode}
      />
    </>,
    document.body
  );
}

export default VisitorPeek;
