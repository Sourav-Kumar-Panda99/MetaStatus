// Purely decorative, original artwork: soft glow blobs + flowing wave
// lines on a deep navy base. Fixed behind all content so it stays put
// while pages scroll. No logos, wordmarks, or brand assets — just a
// mood/color treatment.

export default function BackgroundArt() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#060A18]"
    >
      {/* Soft radial glows */}
      <div className="absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-primary/25 blur-[120px]" />
      <div className="absolute right-[-15%] top-[10%] h-[420px] w-[420px] rounded-full bg-blue-500/15 blur-[110px]" />
      <div className="absolute bottom-[-15%] left-[20%] h-[480px] w-[480px] rounded-full bg-primary/15 blur-[130px]" />

      {/* Flowing wave lines */}
      <svg
        className="absolute bottom-0 left-0 h-[70%] w-full opacity-[0.35]"
        viewBox="0 0 1600 900"
        fill="none"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave1" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1877F2" stopOpacity="0" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1877F2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave2" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -100 620 C 250 520, 450 720, 800 600 C 1150 480, 1350 640, 1700 560"
          stroke="url(#wave1)"
          strokeWidth="2"
        />
        <path
          d="M -100 700 C 300 780, 500 600, 850 700 C 1200 800, 1400 640, 1700 700"
          stroke="url(#wave2)"
          strokeWidth="1.5"
        />
        <path
          d="M -100 800 C 280 740, 520 860, 900 780 C 1250 710, 1420 820, 1700 780"
          stroke="url(#wave1)"
          strokeWidth="1"
        />
      </svg>

      {/* Very faint grid, adds texture without competing with content */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Vignette so edges stay dark and content in the center pops */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#060A18_90%)]" />
    </div>
  );
}
