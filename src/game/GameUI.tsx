import { useEffect, useState } from 'react';
import type { Chapter } from './types';

/* ── Shared style helpers ── */
const shadowMd = '4px 4px 0px 0px rgba(77,71,50,1)';
const shadowSm = '2px 2px 0px 0px rgba(77,71,50,1)';
const ink      = '#4D4732';
const yellow   = '#FFD700';
const yTxt     = '#705E00';
const surface  = '#FFFFFF';
const text     = '#1B1C1C';
const muted    = '#4D4732';

const font = (size: number, weight = 700): React.CSSProperties => ({
  fontFamily:  'Quicksand, sans-serif',
  fontSize:    size,
  fontWeight:  weight,
  lineHeight:  1.3,
});

/* ── HEADER ──────────────────────────────────────────── */
export const Header = ({
  level, totalScore, onPause,
}: {
  level: number; totalScore: number; onPause: () => void;
}) => (
  <header style={{
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '12px 20px',
    background:     surface,
    borderBottom:   `2px solid ${ink}`,
    flexShrink:     0,
  }}>
    {/* Pause */}
    <button
      onClick={onPause}
      className="press"
      style={{
        width:          40,
        height:         40,
        background:     surface,
        border:         `2px solid ${ink}`,
        borderRadius:   8,
        boxShadow:      shadowSm,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="6"  y="4" width="4" height="16" rx="1" fill={text} />
        <rect x="14" y="4" width="4" height="16" rx="1" fill={text} />
      </svg>
    </button>

    {/* Level */}
    <span style={{ ...font(22), color: text }}>Level {level}</span>

    {/* Score */}
    <div style={{ textAlign: 'right' }}>
      <div style={{
        ...font(10),
        color:          muted,
        letterSpacing:  '0.06em',
        textTransform:  'uppercase',
      }}>
        Score
      </div>
      <div style={{ ...font(22), color: '#705D00' }}>
        {String(totalScore).padStart(4, '0')}
      </div>
    </div>
  </header>
);

/* ── PROGRESS AREA ───────────────────────────────────── */
export const ProgressArea = ({
  chapterName, aligned, total, onReset, onHint, hintReady,
}: {
  chapterName: string;
  aligned:     number;
  total:       number;
  moves:       number;
  onReset:     () => void;
  onHint:      () => void;
  hintReady:   boolean;
}) => (
  <div style={{ padding: '0 20px 24px', flexShrink: 0 }}>
    {/* Progress card */}
    <div style={{
      background:   surface,
      border:       `2px solid ${ink}`,
      borderRadius: 20,
      padding:      '14px 16px',
      boxShadow:    shadowMd,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ ...font(11), color: muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {chapterName}
        </span>
        <span style={{ ...font(11), color: '#705D00', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {aligned}/{total}
        </span>
      </div>
      <div style={{
        height:       10,
        background:   '#F0EDED',
        border:       `2px solid ${ink}`,
        borderRadius: 9999,
        overflow:     'hidden',
      }}>
        <div style={{
          height:       '100%',
          background:   yellow,
          borderRadius: 9999,
          width:        total > 0 ? `${(aligned / total) * 100}%` : '0%',
          transition:   'width 400ms cubic-bezier(0.25,0.46,0.45,0.94)',
        }} />
      </div>
    </div>

    {/* Buttons row */}
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={onReset}
        className="press"
        style={{
          flex:           1,
          padding:        '13px 0',
          background:     yellow,
          color:          yTxt,
          border:         `2px solid ${ink}`,
          borderRadius:   12,
          boxShadow:      shadowMd,
          ...font(18),
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            6,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
            stroke={yTxt} strokeWidth="2.5" strokeLinecap="round"
          />
          <path d="M3 3v5h5" stroke={yTxt} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Restore
      </button>

      <button
        onClick={onHint}
        className="press"
        style={{
          flex:           1,
          padding:        '13px 0',
          background:     hintReady ? '#FFF9E0' : surface,
          color:          hintReady ? yTxt : muted,
          border:         `2px solid ${ink}`,
          borderRadius:   12,
          boxShadow:      shadowSm,
          ...font(18),
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            6,
          opacity:        hintReady ? 1 : 0.5,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
        Hint
      </button>
    </div>
  </div>
);

/* ── WIN OVERLAY ─────────────────────────────────────── */
export const WinOverlay = ({
  score, onNext,
}: {
  score: number; onNext: () => void;
}) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const dur = 900;
    const t0  = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setShown(Math.round(score * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = setTimeout(() => requestAnimationFrame(tick), 350);
    return () => clearTimeout(id);
  }, [score]);

  return (
    <div style={{
      position:       'absolute',
      inset:          0,
      zIndex:         50,
      background:     'rgba(27,28,28,0.88)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            32,
    }}>
      <div className="score-pop" style={{ ...font(72), color: yellow, lineHeight: 1 }}>
        {String(shown).padStart(4, '0')}
      </div>
      <button
        onClick={onNext}
        className="press"
        style={{
          padding:        '14px 48px',
          background:     yellow,
          color:          yTxt,
          border:         `2px solid ${ink}`,
          borderRadius:   12,
          boxShadow:      shadowMd,
          ...font(20),
          display:        'flex',
          alignItems:     'center',
          gap:            8,
        }}
      >
        Next level
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6"
            stroke={yTxt} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

/* ── PAUSE MODAL ─────────────────────────────────────── */
export const PauseModal = ({
  chapter, onResume, onRestart,
}: {
  chapter: Chapter; onResume: () => void; onRestart: () => void;
}) => (
  <div style={{
    position:       'absolute',
    inset:          0,
    zIndex:         60,
    background:     'rgba(27,28,28,0.88)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  }}>
    <div style={{
      background:    surface,
      border:        `2px solid ${ink}`,
      borderRadius:  24,
      boxShadow:     shadowMd,
      padding:       '32px 28px',
      width:         280,
      display:       'flex',
      flexDirection: 'column',
      gap:           14,
      alignItems:    'center',
    }}>
      <span style={{ ...font(11), color: muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {chapter.name}
      </span>
      <button onClick={onResume} className="press" style={{
        width: '100%', padding: '13px 0',
        background: yellow, color: yTxt,
        border: `2px solid ${ink}`, borderRadius: 12,
        boxShadow: shadowMd, ...font(18),
      }}>
        Continue
      </button>
      <button onClick={onRestart} className="press" style={{
        width: '100%', padding: '13px 0',
        background: surface, color: text,
        border: `2px solid ${ink}`, borderRadius: 12,
        boxShadow: shadowSm, ...font(18),
      }}>
        Begin again
      </button>
    </div>
  </div>
);

/* ── CHAPTER TRANSITION ──────────────────────────────── */
export const ChapterTransition = ({
  chapter, onDismiss,
}: {
  chapter: Chapter; onDismiss: () => void;
}) => {
  useEffect(() => {
    typeof navigator !== 'undefined' && navigator.vibrate?.([20, 40, 20]);
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={onDismiss}
      className="chapter-anim"
      style={{
        position:       'absolute',
        inset:          0,
        zIndex:         70,
        background:     chapter.bg,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            16,
        cursor:         'pointer',
      }}
    >
      {/* Daisy watermark */}
      <svg
        style={{ position: 'absolute', width: 300, height: 300, opacity: 0.07 }}
        viewBox="0 0 200 200"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i}
            cx="100" cy="42" rx="18" ry="36"
            fill="white"
            transform={`rotate(${i * 45} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="28" fill="white" />
      </svg>

      <div style={{
        ...font(40),
        color:          '#fff',
        letterSpacing:  '-0.02em',
        textAlign:      'center',
        position:       'relative',
      }}>
        {chapter.name}
      </div>
      <div style={{
        ...font(17, 500),
        color:    'rgba(255,255,255,0.72)',
        fontStyle: 'italic',
        position: 'relative',
      }}>
        "{chapter.epigraph}"
      </div>
    </div>
  );
};

/* ── FIRST-TIME TUTORIAL (bottom sheet, level 1 only) ── */
export const TutorialSheet = ({ onDismiss }: { onDismiss: () => void }) => (
  <div
    onClick={onDismiss}
    style={{
      position:     'absolute',
      left:         20,
      right:        20,
      bottom:       160,
      background:   surface,
      border:       `2px solid ${ink}`,
      borderRadius: 16,
      boxShadow:    shadowMd,
      padding:      '16px 20px',
      animation:    'slideUp 320ms cubic-bezier(0.34,1.56,0.64,1)',
      zIndex:       40,
      cursor:       'pointer',
    }}
  >
    <div style={{ ...font(15), color: text, marginBottom: 6 }}>
      Bir yaprağa dokun
    </div>
    <div style={{ ...font(13, 500), color: muted, lineHeight: 1.5 }}>
      Her dokunuş, oktaki yönü saat yönünde çevirir.
      Tüm okları merkezdeki yönle hizala.
    </div>
  </div>
);
