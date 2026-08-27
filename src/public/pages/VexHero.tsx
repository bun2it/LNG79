import React, { useState, useEffect } from 'react';

// --- FadeIn Component ---
interface FadeInProps {
  delayMs: number;
  durationMs: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FadeIn: React.FC<FadeInProps> = ({ delayMs, durationMs, children, className = '', style = {} }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transitionProperty: 'opacity',
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
};

// --- AnimatedHeading Component ---
interface AnimatedHeadingProps {
  text: string;
  initialDelayMs?: number;
  charDelayMs?: number;
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  text,
  initialDelayMs = 200,
  charDelayMs = 30,
  durationMs = 500,
  className = '',
  style = {},
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), initialDelayMs);
    return () => clearTimeout(timer);
  }, [initialDelayMs]);

  const lines = text.split('\n');

  // We want to calculate the global delay index for each character
  let globalCharIndex = 0;

  return (
    <h1 className={className} style={{ ...style, fontFamily: "'Inter', sans-serif" }}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} style={{ display: 'block', overflow: 'hidden' }}>
          {line.split('').map((char, charIdx) => {
            const delay = globalCharIndex * charDelayMs;
            globalCharIndex++;

            return (
              <span
                key={charIdx}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'pre',
                  opacity: animate ? 1 : 0,
                  transform: animate ? 'translateX(0)' : 'translateX(-18px)',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: `${durationMs}ms`,
                  transitionDelay: `${delay}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
};

// --- VexHero Page Component ---
interface VexHeroProps {
  onExplore?: () => void;
  onNavigateTo?: (view: string) => void;
}

export const VexHero: React.FC<VexHeroProps> = ({ onExplore, onNavigateTo }) => {
  const routes: Record<string, string> = {
    'LNG Solutions': 'lng-solution',
    'LPG Solutions': 'lpg-solution',
    'Conversion': 'conversion',
    'Kitchen': 'kitchen-solution'
  };
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Back to Home floating action toggle */}
      <button
        onClick={onExplore}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
          backdropFilter: 'blur(4px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ← LNG79 Home
      </button>

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
          type="video/mp4"
        />
      </video>

      {/* --- NAVBAR --- */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingTop: '1.5rem',
        }}
        className="vex-nav-wrapper"
      >
        <div
          className="liquid-glass"
          style={{
            borderRadius: '0.75rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1280px',
            margin: '0 auto',
          }}
        >
          {/* Left: Logo */}
          <div 
            onClick={onExplore}
            style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em', cursor: 'pointer' }}
          >
            LNG79
          </div>

          {/* Center Links (hidden on mobile, visible md+) */}
          <nav
            className="vex-nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}
          >
            {['LNG Solutions', 'LPG Solutions', 'Conversion', 'Kitchen'].map((link) => (
              <a
                key={link}
                href="#"
                onClick={(e) => { e.preventDefault(); onNavigateTo?.(routes[link]); }}
                className="vex-nav-link-item"
                style={{
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  textDecoration: 'none',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Right Button */}
          <div>
            <button
              className="vex-start-chat-btn"
              onClick={() => onNavigateTo?.('contact')}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              Start a Chat
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO CONTENT (Bottom of Viewport) --- */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '3rem',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
        className="vex-hero-content-wrapper"
      >
        <div className="vex-hero-grid" style={{ width: '100%' }}>
          {/* Left Column: Main text and buttons */}
          <div style={{ textAlign: 'left' }}>
            <AnimatedHeading
              text={`Shaping green energy\nwith vision and action.`}
              className="vex-hero-heading"
              style={{
                fontWeight: 400,
                marginBottom: '1rem',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#ffffff',
              }}
            />

            <FadeIn delayMs={800} durationMs={1000}>
              <p
                className="vex-hero-subheading"
                style={{
                  color: '#d1d5db',
                  marginBottom: '1.25rem',
                  lineHeight: 1.5,
                }}
              >
                We build premium cryogenic terminals, fuel conversion skids, and commercial kitchen systems that define tomorrow's industrial efficiency.
              </p>
            </FadeIn>

            <FadeIn delayMs={1200} durationMs={1000}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  onClick={() => onNavigateTo?.('contact')}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    paddingLeft: '2rem',
                    paddingRight: '2rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  Start a Chat
                </button>
                <button
                  className="liquid-glass vex-explore-btn"
                  onClick={onExplore}
                  style={{
                    color: '#ffffff',
                    paddingLeft: '2rem',
                    paddingRight: '2rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Explore Now
                </button>
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Glass card */}
          <div className="vex-right-col" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <FadeIn delayMs={1400} durationMs={1000} style={{ width: '100%' }}>
              <div
                className="liquid-glass"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingLeft: '1.5rem',
                  paddingRight: '1.5rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderRadius: '0.75rem',
                  width: 'fit-content',
                }}
              >
                <span
                  className="vex-tagline"
                  style={{
                    fontWeight: 300,
                    color: '#ffffff',
                  }}
                >
                  LNG/LPG. Conversion. Commercial Kitchen.
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>

      {/* Embedded style block for media queries and interactions */}
      <style>{`
        /* Media padding scales */
        @media (min-width: 768px) {
          .vex-nav-wrapper {
            padding-left: 3rem !important;
            padding-right: 3rem !important;
          }
          .vex-hero-content-wrapper {
            padding-left: 3rem !important;
            padding-right: 3rem !important;
            padding-bottom: 4rem !important;
          }
        }
        @media (min-width: 1024px) {
          .vex-nav-wrapper {
            padding-left: 4rem !important;
            padding-right: 4rem !important;
          }
          .vex-hero-content-wrapper {
            padding-left: 4rem !important;
            padding-right: 4rem !important;
          }
        }

        /* Mobile vs desktop layout for navbar links */
        @media (max-width: 767px) {
          .vex-nav-links {
            display: none !important;
          }
        }

        /* Hover transitions */
        .vex-nav-link-item:hover {
          opacity: 1 !important;
          color: #d1d5db !important;
        }
        .vex-start-chat-btn:hover {
          background-color: #f3f4f6 !important;
        }
        .vex-explore-btn:hover {
          background-color: #ffffff !important;
          color: #000000 !important;
        }

        /* Responsive Hero Grid */
        .vex-hero-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .vex-hero-grid {
            display: grid !important;
            grid-template-cols: 1.2fr 0.8fr !important;
            align-items: flex-end !important;
          }
          .vex-right-col {
            justify-content: flex-end !important;
          }
        }

        /* Typography sizing */
        .vex-hero-heading {
          font-size: 2.25rem !important;
        }
        @media (min-width: 768px) {
          .vex-hero-heading {
            font-size: 3rem !important;
          }
        }
        @media (min-width: 1024px) {
          .vex-hero-heading {
            font-size: 3.75rem !important;
          }
        }
        @media (min-width: 1200px) {
          .vex-hero-heading {
            font-size: 4.5rem !important;
          }
        }

        .vex-hero-subheading {
          font-size: 1rem !important;
        }
        @media (min-width: 768px) {
          .vex-hero-subheading {
            font-size: 1.125rem !important;
          }
        }

        .vex-tagline {
          font-size: 1.125rem !important;
        }
        @media (min-width: 768px) {
          .vex-tagline {
            font-size: 1.25rem !important;
          }
        }
        @media (min-width: 1024px) {
          .vex-tagline {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};
