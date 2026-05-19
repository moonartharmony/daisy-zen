import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, type FormEvent } from 'react';

export const Route = createFileRoute('/')({ component: Landing });

/* ── Dark-mode persistence ───────────────────────────────────────────────
   Reads from localStorage on first render. Writes back on toggle.
   Default: system preference (dark-first intent — most visitors use dark).  */
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('daisy-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('daisy-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}

/* ── Thin-line glowing daisy SVG ─────────────────────────────────────────
   Outline-only petals (fill:none, stroke) with SVG feGaussianBlur glow.
   Matches new glassmorphism identity — ethereal, cosmic, not neubrutalist.
   SMIL animations: staggered opacity fade-in + gentle rotation breathing.  */
function DaisySplash() {
  return (
    <svg
      viewBox="0 0 160 160"
      width="120"
      height="120"
      aria-hidden
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        {/* Glow: blur layer composited under source */}
        <filter id="petal-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Petal stroke gradient: gold tip → softer gold base */}
        <linearGradient id="petalStrokeGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#FFD700" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#FFD700" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFF2AA" stopOpacity="0.95" />
        </linearGradient>
        {/* Center glow radial gradient */}
        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE55A" stopOpacity="1"   />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Breathing wrapper — 0° → 22.5° → 0° oscillation every 6 s */}
      <g filter="url(#petal-glow)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 80 80;22.5 80 80;0 80 80"
          keyTimes="0;0.5;1"
          calcMode="spline"
          keySplines="0.37 0 0.63 1;0.37 0 0.63 1"
          dur="6s"
          repeatCount="indefinite"
        />

        {/* 8 thin-line petals, staggered fade-in */}
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i}
            cx="80" cy="30"
            rx="9" ry="24"
            fill="none"
            stroke="url(#petalStrokeGrad)"
            strokeWidth="1.6"
            opacity="0"
            transform={`rotate(${i * 45} 80 80)`}
          >
            <animate
              attributeName="opacity"
              from="0" to="1"
              dur="0.55s"
              begin={`${0.12 + i * 0.065}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.25 0.46 0.45 0.94"
              keyTimes="0;1"
            />
          </ellipse>
        ))}

        {/* Center disc — appears last, then pulses gently */}
        <circle cx="80" cy="80" r="13"
          fill="url(#centerGrad)"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            from="0" to="1"
            dur="0.4s"
            begin="0.62s"
            fill="freeze"
          />
          <animate
            attributeName="r"
            values="13;15;13"
            dur="3.6s"
            begin="1s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.37 0 0.63 1;0.37 0 0.63 1"
            keyTimes="0;0.5;1"
          />
        </circle>
      </g>
    </svg>
  );
}

/* ── Shared glass button micro-interaction ───────────────────────────── */
const pressDown = (el: HTMLElement) => {
  el.style.transform   = 'scale(0.97)';
  el.style.opacity     = '0.85';
};
const pressUp = (el: HTMLElement) => {
  el.style.transform   = '';
  el.style.opacity     = '';
};

/* ── Landing page ──────────────────────────────────────────────────────── */
function Landing() {
  const navigate          = useNavigate();
  const [dark, setDark]   = useDarkMode();
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    /* TODO: wire real magic-link API */
    setSent(true);
    setTimeout(() => navigate({ to: '/play' }), 1800);
  };

  return (
    <div
      style={{
        minHeight:      '100dvh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '32px 24px',
        background:     'var(--landing-bg)',
        position:       'relative',
        overflow:       'hidden',
        transition:     'background 500ms ease',
        fontFamily:     'Quicksand, sans-serif',
      }}
    >

      {/* ── Ambient glow orbs (create depth for glass blur to pick up) ── */}
      <div aria-hidden style={{
        position: 'absolute', top: '-8%', left: '-12%',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: '-6%', right: '-8%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.11) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: '42%', right: '8%',
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Dark mode toggle — top right — glass pill ── */}
      <button
        onClick={() => setDark(d => !d)}
        aria-label={dark ? 'Gündüz moduna geç' : 'Gece moduna geç'}
        onPointerDown={e => pressDown(e.currentTarget as HTMLElement)}
        onPointerUp={e   => pressUp(e.currentTarget   as HTMLElement)}
        style={{
          position:            'absolute',
          top: 20, right: 20,
          width: 40, height: 40,
          borderRadius:        10,
          border:              '1px solid var(--landing-border)',
          background:          'var(--landing-surface)',
          backdropFilter:      'blur(10px)',
          WebkitBackdropFilter:'blur(10px)',
          cursor:              'pointer',
          display:             'flex',
          alignItems:          'center',
          justifyContent:      'center',
          fontSize:            18,
          transition:          'transform 100ms ease, opacity 100ms ease',
          flexShrink:          0,
        }}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      {/* ── Skip to game — top left — glass pill ── */}
      <button
        onClick={() => navigate({ to: '/play' })}
        onPointerDown={e => pressDown(e.currentTarget as HTMLElement)}
        onPointerUp={e   => pressUp(e.currentTarget   as HTMLElement)}
        style={{
          position:            'absolute',
          top: 20, left: 20,
          padding:             '7px 13px',
          border:              '1px solid var(--landing-border)',
          borderRadius:        8,
          background:          'var(--landing-surface)',
          backdropFilter:      'blur(10px)',
          WebkitBackdropFilter:'blur(10px)',
          color:               'var(--landing-muted)',
          fontFamily:          'Quicksand, sans-serif',
          fontSize:            11,
          fontWeight:          600,
          letterSpacing:       '0.08em',
          textTransform:       'uppercase',
          cursor:              'pointer',
          transition:          'transform 100ms ease, opacity 100ms ease',
        }}
      >
        Oyuna gir →
      </button>

      {/* ── Main content ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28,
      }}>

        {/* Wordmark block */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'var(--landing-muted)', marginBottom: 22,
          }}>
            ✦ mindful puzzles ✦
          </div>

          <DaisySplash />

          <h1 style={{
            fontSize: 36, fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--landing-text)',
            margin: '20px 0 6px',
            lineHeight: 1,
          }}>
            daisy zen
          </h1>
          <p style={{
            fontSize: 13, fontWeight: 500,
            color: 'var(--landing-muted)', margin: 0,
          }}>
            Okları hizala. Zihni dinginleştir.
          </p>
        </div>

        {/* ── Glass card — magic link form ── */}
        {!sent ? (
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '24px',
              background:          'var(--landing-surface)',
              backdropFilter:      'blur(18px)',
              WebkitBackdropFilter:'blur(18px)',
              borderRadius: 20,
              border: '1px solid var(--landing-border)',
              /* Purple ambient glow + inset highlight line */
              boxShadow: [
                '0 0 48px rgba(168, 85, 247, 0.09)',
                'inset 0 1px 0 rgba(255,255,255,0.07)',
              ].join(', '),
            }}
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e-posta adresin"
              required
              style={{
                width: '100%',
                padding: '13px 16px',
                border: '1px solid var(--landing-border)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--landing-text)',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 15, fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(255,215,0,0.55)';
                e.target.style.boxShadow   = '0 0 0 3px rgba(255,215,0,0.1), 0 0 16px rgba(255,215,0,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--landing-border)';
                e.target.style.boxShadow   = 'none';
              }}
            />

            {/* Reflective gold button */}
            <button
              type="submit"
              onPointerDown={e => {
                (e.currentTarget as HTMLElement).style.transform  = 'scale(0.98)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(255,215,0,0.2)';
              }}
              onPointerUp={e => {
                (e.currentTarget as HTMLElement).style.transform  = '';
                (e.currentTarget as HTMLElement).style.boxShadow = [
                  '0 0 28px rgba(255,215,0,0.38)',
                  'inset 0 1px 0 rgba(255,255,255,0.35)',
                ].join(', ');
              }}
              style={{
                width: '100%',
                padding: '14px 0',
                /* Gold shimmer gradient with inset highlight */
                background: 'linear-gradient(160deg, #FFE566 0%, #FFD700 45%, #FFC200 100%)',
                color: '#705E00',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 16, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: [
                  '0 0 28px rgba(255,215,0,0.38)',
                  'inset 0 1px 0 rgba(255,255,255,0.35)',
                ].join(', '),
                transition: 'transform 80ms ease, box-shadow 80ms ease',
              }}
            >
              Zihni Uyandır
            </button>

            <p style={{
              fontSize: 11, fontWeight: 500,
              color: 'var(--landing-muted)',
              textAlign: 'center',
              margin: '2px 0 0',
              lineHeight: 1.65,
            }}>
              Şifre yok. Ruh halini hatırlamak için e-postana sihirli bir bağlantı göndereceğiz.
            </p>
          </form>

        ) : (
          /* ── Sent state — emerald accent glow ── */
          <div style={{
            textAlign: 'center', padding: '28px 24px',
            border: '1px solid var(--landing-border)',
            borderRadius: 20,
            background:          'var(--landing-surface)',
            backdropFilter:      'blur(18px)',
            WebkitBackdropFilter:'blur(18px)',
            boxShadow: '0 0 48px rgba(16, 185, 129, 0.12)',
            width: '100%',
          }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>✉️</div>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: 'var(--landing-text)', marginBottom: 6,
            }}>
              Bağlantı yolda
            </div>
            <div style={{
              fontSize: 12, fontWeight: 500,
              color: 'var(--landing-muted)',
            }}>
              Seni oyuna yönlendiriyoruz…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
