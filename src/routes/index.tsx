import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, type FormEvent } from 'react';
import { supabase }                            from '../lib/supabase';

export const Route = createFileRoute('/')({ component: Landing });

/* ── Dark-mode persistence ─────────────────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    // Always default to light — the game aesthetic is warm/organic.
    // SSR context returns false so Cloudflare Workers never pre-renders dark.
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('daisy-theme');
    return stored === 'dark'; // only dark if user explicitly chose it
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('daisy-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}

/* ── Thin-line glowing daisy ────────────────────────────────────────────── */
function DaisySplash() {
  return (
    <svg viewBox="0 0 160 160" width="120" height="120" aria-hidden
      style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <filter id="petal-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="petalStrokeGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#FFD700" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#FFD700" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFF2AA" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE55A" stopOpacity="1"   />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      <g filter="url(#petal-glow)">
        <animateTransform
          attributeName="transform" type="rotate"
          values="0 80 80;22.5 80 80;0 80 80"
          keyTimes="0;0.5;1" calcMode="spline"
          keySplines="0.37 0 0.63 1;0.37 0 0.63 1"
          dur="6s" repeatCount="indefinite"
        />
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="80" cy="30" rx="9" ry="24"
            fill="none" stroke="url(#petalStrokeGrad)" strokeWidth="1.6"
            opacity="0" transform={`rotate(${i * 45} 80 80)`}
          >
            <animate attributeName="opacity" from="0" to="1"
              dur="0.55s" begin={`${0.12 + i * 0.065}s`}
              fill="freeze" calcMode="spline"
              keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1" />
          </ellipse>
        ))}
        <circle cx="80" cy="80" r="13" fill="url(#centerGrad)" opacity="0">
          <animate attributeName="opacity" from="0" to="1"
            dur="0.4s" begin="0.62s" fill="freeze" />
          <animate attributeName="r" values="13;15;13" dur="3.6s" begin="1s"
            repeatCount="indefinite" calcMode="spline"
            keySplines="0.37 0 0.63 1;0.37 0 0.63 1" keyTimes="0;0.5;1" />
        </circle>
      </g>
    </svg>
  );
}

/* ── Sent-state glowing daisy silhouette (larger, pulses) ──────────────── */
function DaisySilhouette() {
  return (
    <svg viewBox="0 0 160 160" width="96" height="96" aria-hidden
      style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <filter id="sil-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="silCenterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE55A" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.4" />
        </radialGradient>
      </defs>

      <g filter="url(#sil-glow)">
        <animateTransform
          attributeName="transform" type="rotate"
          values="0 80 80;360 80 80"
          dur="18s" repeatCount="indefinite" calcMode="linear"
        />
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="80" cy="30" rx="10" ry="26"
            fill="rgba(255,215,0,0.15)"
            stroke="rgba(255,215,0,0.5)"
            strokeWidth="1.2"
            transform={`rotate(${i * 45} 80 80)`}
          />
        ))}
        <circle cx="80" cy="80" r="16" fill="url(#silCenterGrad)">
          <animate attributeName="r" values="16;19;16"
            dur="3s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.37 0 0.63 1;0.37 0 0.63 1"
            keyTimes="0;0.5;1" />
        </circle>
      </g>
    </svg>
  );
}

/* ── Neon spinner ─────────────────────────────────────────────────────────
   Gold arc on a dim track — replaces button text while Supabase call runs. */
function NeonSpinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden
      style={{ animation: 'anim-spin-kf 0.75s linear infinite', flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8" fill="none"
        stroke="rgba(112,94,0,0.25)" strokeWidth="2.4" />
      <path d="M 10 2 A 8 8 0 0 1 18 10" fill="none"
        stroke="#705E00" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── Glass micro-interactions ─────────────────────────────────────────────
   Shared pointer handlers for all glass pill buttons.                       */
const pressDown = (el: HTMLElement) => {
  el.style.transform = 'scale(0.97)';
  el.style.opacity   = '0.8';
};
const pressUp = (el: HTMLElement) => {
  el.style.transform = '';
  el.style.opacity   = '';
};

/* ── Landing ──────────────────────────────────────────────────────────────
   status: 'idle' → form visible
           'loading' → button shows spinner + "Zihin Hazırlanıyor…"
           'sent' → sent confirmation screen (1200ms fade-in)
           'error' → shows brief error in subtext then resets                */
function Landing() {
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [checking, setChecking] = useState(true);
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  /* Auth check — skip landing if already logged in, else reveal page */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: '/play', replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null; // invisible until auth check completes

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });

    if (error) {
      setErrMsg(error.message);
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrMsg(''); }, 3000);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div style={{
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
    }}>

      {/* ── Ambient glow orbs ── */}
      <div aria-hidden style={{
        position: 'absolute', top: '-8%', left: '-12%',
        width: 340, height: 340, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: '-6%', right: '-8%',
        width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(16,185,129,0.11) 0%, transparent 70%)',
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: '42%', right: '8%',
        width: 180, height: 180, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
      }} />

      {/* ── Dark mode toggle ── */}
      <button
        onClick={() => setDark(d => !d)}
        aria-label={dark ? 'Gündüz moduna geç' : 'Gece moduna geç'}
        onPointerDown={e => pressDown(e.currentTarget as HTMLElement)}
        onPointerUp={e   => pressUp(e.currentTarget   as HTMLElement)}
        style={{
          position:            'absolute', top: 20, right: 20,
          width: 40, height: 40, borderRadius: 10,
          border:              '1px solid var(--landing-border)',
          background:          'var(--landing-surface)',
          backdropFilter:      'blur(10px)',
          WebkitBackdropFilter:'blur(10px)',
          cursor:              'pointer',
          display:             'flex', alignItems: 'center', justifyContent: 'center',
          fontSize:            18,
          transition:          'transform 100ms ease, opacity 100ms ease',
          flexShrink:          0,
        }}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      {/* ── Main content ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28,
      }}>

        {/* Wordmark */}
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
            letterSpacing: '-0.03em', color: 'var(--landing-text)',
            margin: '20px 0 6px', lineHeight: 1,
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

        {/* ── Primary game entry — no auth required ── */}
        {status !== 'sent' && (
          <>
            <button
              type="button"
              onClick={() => navigate({ to: '/play' })}
              onPointerDown={e => pressDown(e.currentTarget as HTMLElement)}
              onPointerUp={e   => pressUp(e.currentTarget   as HTMLElement)}
              style={{
                width:         '100%',
                padding:       '16px 0',
                background:    'linear-gradient(160deg, #FFE566 0%, #FFD700 50%, #FFC200 100%)',
                color:         '#705E00',
                border:        'none',
                borderRadius:  14,
                fontFamily:    'Quicksand, sans-serif',
                fontSize:      18,
                fontWeight:    700,
                cursor:        'pointer',
                letterSpacing: '-0.01em',
                boxShadow:     '0 0 32px rgba(255,215,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
                transition:    'transform 80ms ease, box-shadow 80ms ease',
              }}
            >
              Oyuna Başla →
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--landing-border)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--landing-muted)' }}>
                veya ilerlemeyi kaydet
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--landing-border)' }} />
            </div>
          </>
        )}

        {/* ── Form / Sent screen ── */}
        {status !== 'sent' ? (

          /* ── Glass card — form ── */
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            display: 'flex', flexDirection: 'column', gap: 10,
            padding: '24px',
            background:          'var(--landing-surface)',
            backdropFilter:      'blur(18px)',
            WebkitBackdropFilter:'blur(18px)',
            borderRadius: 20,
            border: '1px solid var(--landing-border)',
            boxShadow: [
              '0 0 48px rgba(168,85,247,0.09)',
              'inset 0 1px 0 rgba(255,255,255,0.07)',
            ].join(', '),
          }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e-posta adresin"
              required
              disabled={status === 'loading'}
              style={{
                width: '100%', padding: '13px 16px',
                border: '1px solid var(--landing-border)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--landing-text)',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 15, fontWeight: 500,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                opacity: status === 'loading' ? 0.6 : 1,
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

            {/* ── Submit button — idle / loading / error ── */}
            <button
              type="submit"
              disabled={status === 'loading'}
              onPointerDown={e => {
                if (status === 'loading') return;
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
                width: '100%', padding: '14px 0',
                background: status === 'error'
                  ? 'linear-gradient(160deg,#FF8A80 0%,#FF5252 100%)'
                  : 'linear-gradient(160deg, #FFE566 0%, #FFD700 45%, #FFC200 100%)',
                color: status === 'error' ? '#fff' : '#705E00',
                border: 'none', borderRadius: 12,
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 16, fontWeight: 700,
                cursor: status === 'loading' ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                boxShadow: [
                  '0 0 28px rgba(255,215,0,0.38)',
                  'inset 0 1px 0 rgba(255,255,255,0.35)',
                ].join(', '),
                transition: 'transform 80ms ease, box-shadow 80ms ease, background 200ms ease',
              }}
            >
              {status === 'loading' && <NeonSpinner size={18} />}
              {status === 'loading' ? 'Zihin Hazırlanıyor…'
                : status === 'error' ? (errMsg || 'Bir hata oluştu')
                : 'Zihni Uyandır'}
            </button>

            <p style={{
              fontSize: 11, fontWeight: 500,
              color: 'var(--landing-muted)',
              textAlign: 'center', margin: '2px 0 0', lineHeight: 1.65,
            }}>
              Şifre yok. Ruh halini hatırlamak için e-postana sihirli bir bağlantı göndereceğiz.
            </p>
          </form>

        ) : (

          /* ── Sent screen — 1200ms fade-in ── */
          <div style={{
            width: '100%', textAlign: 'center',
            padding: '32px 24px',
            background:          'var(--landing-surface)',
            backdropFilter:      'blur(18px)',
            WebkitBackdropFilter:'blur(18px)',
            borderRadius: 20,
            border: '1px solid var(--landing-border)',
            boxShadow: '0 0 56px rgba(16,185,129,0.12)',
            animation: 'anim-fadein-kf 1200ms ease both',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16,
          }}>
            <DaisySilhouette />

            <div>
              <h2 style={{
                fontSize: 17, fontWeight: 700,
                color: 'var(--landing-text)',
                margin: '0 0 6px', lineHeight: 1.3,
              }}>
                Gözlerini Kapat ve<br />E-postanı Kontrol Et
              </h2>
              <p style={{
                fontSize: 13, fontWeight: 500,
                color: 'var(--landing-muted)', margin: 0,
              }}>
                {email}
              </p>
            </div>

            <button
              onClick={() => { setStatus('idle'); setEmail(''); }}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,215,0,0.55)',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                padding: '4px 0',
              }}
            >
              Başka bir frekans dene
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
