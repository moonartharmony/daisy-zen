import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Daisy Zen — Dokun ve Başla' },
      {
        name: 'description',
        content:
          'Sakin bir papatya bulmacası. Yaprakları hizala, zihnini dinlendir.',
      },
    ],
  }),
  component: Landing,
});

/* ── Calm forest background ─────────────────────────────────────────── */
function ForestBackdrop() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at 50% 35%, #1a2a1f 0%, #0f1612 55%, #080b09 100%)',
        overflow: 'hidden',
      }}
    >
      {/* ambient glow orbs */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(127,176,105,0.10), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,178,122,0.08), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
    </div>
  );
}

/* ── Large soft daisy ───────────────────────────────────────────────── */
function BigDaisy() {
  const petalCount = 12;
  return (
    <svg
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      aria-hidden
      style={{ overflow: 'visible', display: 'block', maxWidth: 520 }}
    >
      <defs>
        <radialGradient id="petalGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F8F3E4" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#E8DFC8" stopOpacity="0.78" />
        </radialGradient>
        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E4C97A" />
          <stop offset="100%" stopColor="#C9B27A" />
        </radialGradient>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* breathing wrapper */}
      <g style={{ transformOrigin: '200px 200px', animation: 'daisyBreath 5s ease-in-out infinite' }}>
        {/* petals */}
        <g filter="url(#softGlow)">
          {Array.from({ length: petalCount }).map((_, i) => {
            const angle = (360 / petalCount) * i;
            return (
              <ellipse
                key={i}
                cx="200"
                cy="100"
                rx="28"
                ry="62"
                fill="url(#petalGrad)"
                transform={`rotate(${angle} 200 200)`}
              />
            );
          })}
        </g>
        {/* center */}
        <circle cx="200" cy="200" r="34" fill="url(#centerGrad)" />

        {/* rotating rounded line arrow in the center */}
        <g
          style={{
            transformOrigin: '200px 200px',
            animation: 'arrowSpin 9s linear infinite',
          }}
        >
          <g
            fill="none"
            stroke="#0F1410"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.78"
          >
            {/* shaft */}
            <line x1="200" y1="216" x2="200" y2="184" />
            {/* head */}
            <polyline points="190,193 200,182 210,193" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ── Landing ────────────────────────────────────────────────────────── */
function Landing() {
  const navigate = useNavigate();
  const start = () => {
    if (typeof navigator !== 'undefined') navigator.vibrate?.(8);
    navigate({ to: '/play' });
  };

  return (
    <>
      <style>{`
        @keyframes daisyBreath {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.025); }
        }
        @keyframes arrowSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ctaPulse {
          0%, 100% { opacity: 0.62; }
          50%      { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .daisy-cta {
          animation: ctaPulse 3.2s ease-in-out infinite;
          transition: transform 180ms cubic-bezier(0.22,1,0.36,1),
                      letter-spacing 320ms ease;
        }
        .daisy-cta:hover { transform: translateY(-1px); letter-spacing: 0.22em; }
        .daisy-cta:active { transform: scale(0.97); }
      `}</style>

      <main
        onClick={start}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && start()}
        role="button"
        tabIndex={0}
        aria-label="Dokun ve başla"
        style={{
          position: 'relative',
          width: '100%',
          height: '100dvh',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        <ForestBackdrop />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 48,
            padding: 24,
            animation: 'fadeUp 900ms cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <div style={{ width: 'min(78vw, 520px)', aspectRatio: '1 / 1' }}>
            <BigDaisy />
          </div>

          <p
            className="daisy-cta"
            style={{
              margin: 0,
              fontFamily: 'Quicksand, system-ui, sans-serif',
              fontWeight: 500,
              fontSize: 15,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#EDE9DD',
            }}
          >
            Dokun ve Başla
          </p>
        </div>
      </main>
    </>
  );
}
