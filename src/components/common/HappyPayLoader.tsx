import React from "react";

export interface HappyPayLoaderProps {
  /**
   * Optional custom title or message.
   * If omitted, only the pure animated logo is displayed.
   */
  message?: string;
  /**
   * Optional contextual note or subtitle
   */
  subtitle?: string;
  /**
   * Display mode:
   * - "fullscreen": Fixed full viewport overlay (default, always dead-center of the screen)
   * - "page": Occupies full page content area with flex centering
   * - "inline": Centered presentation inside a section or container
   * @default "fullscreen"
   */
  variant?: "fullscreen" | "page" | "inline";
  /**
   * Scale size of the loader
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional container CSS classes
   */
  className?: string;
}

export const HappyPayLoader: React.FC<HappyPayLoaderProps> = ({
  message,
  subtitle,
  variant = "fullscreen",
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: {
      orbit1: "h-20 w-20",
      orbit2: "h-28 w-28",
      orbit3: "h-36 w-36",
      logo: "h-11 w-11",
      glow: "h-32 w-32",
    },
    md: {
      orbit1: "h-28 w-28",
      orbit2: "h-40 w-40",
      orbit3: "h-52 w-52",
      logo: "h-16 w-16",
      glow: "h-48 w-48",
    },
    lg: {
      orbit1: "h-36 w-36",
      orbit2: "h-52 w-52",
      orbit3: "h-64 w-64",
      logo: "h-20 w-20",
      glow: "h-60 w-60",
    },
  }[size];

  // Container styling tailored per variant without conflicting position classes
  const containerClasses = {
    fullscreen:
      "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md",
    page: "flex min-h-screen w-full flex-col items-center justify-center",
    inline: "flex min-h-[220px] w-full flex-col items-center justify-center py-6",
  }[variant];

  const inlineStyles: React.CSSProperties =
    variant === "fullscreen"
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }
      : {};

  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      aria-live="polite"
      style={inlineStyles}
      className={`select-none ${containerClasses} ${className}`}
    >
      {/* ── Core Centered Composition: Rings + Logo ─────────── */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Radial Brand Glow (Behind rings & logo) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className={`rounded-full bg-gradient-to-tr from-[#7c3aed]/25 via-[#315bd1]/15 to-transparent blur-3xl ${sizeMap.glow}`}
            style={{ animation: "hp-glow-pulse 3.2s ease-in-out infinite" }}
          />
        </div>

        {/* Ring 3: Slow outer orbit with glowing satellite dot */}
        <div
          className={`absolute rounded-full border border-[#7c3aed]/15 ${sizeMap.orbit3}`}
          style={{ animation: "hp-spin-slow 8s linear infinite" }}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_8px_#7c3aed]" />
        </div>

        {/* Ring 2: Concentric SVG gradient arc spinning clockwise */}
        <div className={`absolute ${sizeMap.orbit2}`}>
          <svg
            className="h-full w-full"
            style={{ animation: "hp-spin-med 3.2s linear infinite" }}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hp-ring2-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#315bd1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" stroke="#ede9fe" strokeWidth="2.5" />
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="url(#hp-ring2-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="220"
              strokeDashoffset="155"
            />
          </svg>
        </div>

        {/* Ring 1: Inner SVG lavender accent arc spinning counter-clockwise */}
        <div className={`absolute ${sizeMap.orbit1}`}>
          <svg
            className="h-full w-full"
            style={{ animation: "hp-spin-fast 1.8s linear infinite reverse" }}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hp-ring1-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" stroke="#f3e8ff" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#hp-ring1-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset="65"
            />
          </svg>
        </div>

        {/* Centerpiece Logo with symmetrical levitation float */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{ animation: "hp-logo-float 3s ease-in-out infinite" }}
        >
          <img
            src="/happy-favicon.jpeg"
            alt="HappyPay"
            className={`rounded-2xl object-contain drop-shadow-[0_8px_20px_rgba(124,58,237,0.22)] ${sizeMap.logo}`}
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          {/* Fallback Initials */}
          <div
            className={`hidden items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] font-extrabold text-white shadow-lg shadow-[#7c3aed]/30 ${sizeMap.logo}`}
            style={{ fontSize: "clamp(14px, 3vw, 22px)" }}
          >
            HP
          </div>
        </div>
      </div>

      {/* ── Optional Message & Dots (Positioned cleanly below rings) ─ */}
      {message && (
        <div
          className="mt-24 flex flex-col items-center text-center px-4"
          style={{ animation: "hp-fade-in 0.5s ease-out forwards" }}
        >
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-800">
            {message}
          </h3>

          {subtitle && (
            <p className="mt-1 max-w-[280px] text-[11px] text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* 3 Bouncing harmonic dots */}
          <div className="mt-2.5 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]"
                style={{
                  animation: `hp-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Keyframe Animations ───────────────────────────────── */}
      <style>{`
        @keyframes hp-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hp-spin-med {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hp-spin-fast {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hp-logo-float {
          0%, 100% {
            transform: translateY(-5px) scale(1);
          }
          50% {
            transform: translateY(5px) scale(1.03);
          }
        }
        @keyframes hp-glow-pulse {
          0%, 100% {
            opacity: 0.65;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.18);
          }
        }
        @keyframes hp-dot {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.35;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        @keyframes hp-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HappyPayLoader;
