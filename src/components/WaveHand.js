/**
 * Memoji-style waving hand, drawn to the skin tones sampled from Face.webp
 * (shadow #BB8760 / mid #D3A888 / highlight #EDC1A8).
 *
 * This is a stand-in. To swap in Apple's real 👋 sticker instead: export the
 * pose from Messages, cut the hand onto its own transparent PNG cropped so the
 * wrist sits flush with the bottom edge, then replace this whole component with
 * an <img>. The bottom-edge crop is what makes transform-origin: 50% 100%
 * pivot at the wrist — nothing else needs to change.
 */
function WaveHand({ className = "", style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 110 150"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="aedenPalmSkin" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#F0C6AD" />
          <stop offset="0.5" stopColor="#DCAF8F" />
          <stop offset="1" stopColor="#BE8A63" />
        </linearGradient>
        <linearGradient id="aedenFingerSkin" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F4CDB6" />
          <stop offset="1" stopColor="#D2A585" />
        </linearGradient>
      </defs>
      <g stroke="#A87954" strokeWidth="2.5" strokeLinejoin="round">
        {/* thumb */}
        <rect x="4" y="76" width="17" height="42" rx="8.5" fill="url(#aedenFingerSkin)" transform="rotate(-26 12.5 112)" />
        {/* pinky → index, splayed outward from the palm */}
        <rect x="78" y="48" width="16" height="46" rx="8" fill="url(#aedenFingerSkin)" transform="rotate(9 86 92)" />
        <rect x="60" y="32" width="17" height="60" rx="8.5" fill="url(#aedenFingerSkin)" transform="rotate(4 68 90)" />
        <rect x="41" y="26" width="18" height="66" rx="9" fill="url(#aedenFingerSkin)" />
        <rect x="23" y="34" width="17" height="58" rx="8.5" fill="url(#aedenFingerSkin)" transform="rotate(-6 31 90)" />
        {/* palm drawn last so the finger bases tuck behind it */}
        <rect x="17" y="66" width="76" height="64" rx="27" fill="url(#aedenPalmSkin)" />
      </g>
    </svg>
  );
}

export default WaveHand;
