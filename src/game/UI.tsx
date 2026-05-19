import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Chapter } from './types';
import { ChapterSilhouette } from './shapes';

/* ── Shared style helpers ── */
const ink      = '#4D4732';
const yellow   = '#FFD700';
const yTxt     = '#705E00';
const surface  = '#FFFFFF';
const text     = '#1B1C1C';
const muted    = '#7E775F';
const shadowMd = '4px 4px 0px 0px rgba(77,71,50,1)';
const shadowSm = '2px 2px 0px 0px rgba(77,71,50,1)';

const font = (size: number, weight = 700): CSSProperties => ({
  fontFamily: 'Quicksand, sans-serif',
  fontSize:   size,
  fontWeight: weight,
  lineHeight: 1.3,
});

/* ── HEADER ──────────────────────────────────────────── */
export const Header = ({
  level, chapter, totalScore, onPause,
}: {
  level:      number;
  chapter:    Chapter;
  totalScore: number;
  onPause:    () => void;
}) => (
  <header style={{
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '10px 18px',
    background:     surface,
    borderBottom:   `2px solid ${ink}`,
    flexShrink:     0,
  }}>
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

    <div style={{ textAlign: 'center' }}>
      <div style={{ ...font(20), color: text }}>Level {level}</div>
      <div style={{
        ...font(10, 500),
        color:         muted,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginTop:     1,
      }}>
        {chapter.name}
      </div>
    </div>

    <div style={{ textAlign: 'right' }}>
      <div style={{
        ...font(9),
        color:         muted,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Score
      </div>
      <div style={{ ...font(20), color: '#705D00' }}>
        {String(totalScore).padStart(4, '0')}
      </div>
    </div>
  </header>
);

/* ── BOTTOM AREA ─────────────────────────────────────── */
export const BottomArea = ({
  chapter, aligned, total, onReset, onHint, hintReady,
}: {
  chapter:   Chapter;
  aligned:   number;
  total:     number;
  onReset:   () => void;
  onHint:    () => void;
  hintReady: boolean;
}) => (
  <div style={{ padding: '0 18px 22px', flexShrink: 0 }}>
    {/* Progress card */}
    <div style={{
      background:   surface,
      border:       `2px solid ${ink}`,
      borderRadius: 20,
      padding:      '12px 14px',
      boxShadow:    shadowMd,
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          ...font(10),
          color:         muted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {chapter.name}
        </span>
        <span style={{
          ...font(10),
          color:         '#705D00',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {aligned}/{total}
        </span>
      </div>
      <div style={{
        height:       9,
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
          transition:   'width 380ms cubic-bezier(0.25,0.46,0.45,0.94)',
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
          padding:        '12px 0',
          background:     yellow,
          color:          yTxt,
          border:         `2px solid ${ink}`,
          borderRadius:   12,
          boxShadow:      shadowMd,
          ...font(17),
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            6,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 12a9 9 0 1 0 9-9A9.75 9.75 0 0 0 5.26 4.74L3 7"
            stroke={yTxt} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M3 3v4h4" stroke={yTxt} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Restore
      </button>

      <button
        onClick={onHint}
        className="press"
        style={{
          flex:           1,
          padding:        '12px 0',
          background:     hintReady ? '#FFF9E0' : surface,
          color:          hintReady ? yTxt : muted,
          border:         `2px solid ${ink}`,
          borderRadius:   12,
          boxShadow:      shadowSm,
          ...font(17),
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            6,
          opacity:        hintReady ? 1 : 0.42,
          transition:     'opacity 400ms, background 400ms',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

/* ── WIN SCREEN — full-screen narrative takeover ──────── */
export const WinScreen = ({
  score, nextCh, curCh, petalCount, onNext,
}: {
  score:      number;
  nextCh:     Chapter;
  curCh:      Chapter;
  petalCount: number;
  onNext:     () => void;
}) => {
  const [shown, setShown]   = useState(0);
  const chChanged           = nextCh.id !== curCh.id;

  /* Count-up animation */
  useEffect(() => {
    const dur = 950;
    const t0  = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setShown(Math.round(score * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = setTimeout(() => requestAnimationFrame(tick), 280);
    return () => clearTimeout(id);
  }, [score]);

  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        zIndex:         50,
        background:     nextCh.bg,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            0,
      }}
    >
      {/* Spinning chapter silhouette background */}
      <div style={{
        position:  'absolute',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%,-50%)',
      }}>
        <ChapterSilhouette chapter={nextCh} n={petalCount} />
      </div>

      {/* Score count-up */}
      <div
        className="anim-score"
        style={{
          ...font(72),
          color:      yellow,
          lineHeight: 1,
          textShadow: '4px 4px 0 rgba(77,71,50,.4)',
          position:   'relative',
          zIndex:     1,
          marginBottom: 10,
        }}
      >
        {String(shown).padStart(4, '0')}
      </div>

      {/* Chapter epigraph (only when crossing chapter boundary) */}
      {chChanged && (
        <div
          className="anim-fadein"
          style={{
            ...font(13, 500),
            color:        'rgba(255,255,255,0.72)',
            fontStyle:    'italic',
            marginBottom: 36,
            position:     'relative',
            zIndex:       1,
            textAlign:    'center',
            padding:      '0 40px',
          }}
        >
          "{nextCh.epigraph}"
        </div>
      )}
      {!chChanged && <div style={{ marginBottom: 36 }} />}

      {/* CTA button */}
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
          ...font(18),
          display:        'flex',
          alignItems:     'center',
          gap:            8,
          position:       'relative',
          zIndex:         1,
        }}
      >
        {chChanged ? `Enter ${nextCh.name}` : 'Next level'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6"
            stroke={yTxt} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

/* ── PAUSE MODAL ─────────────────────────────────────── */
export const PauseModal = ({
  chapter, onResume, onRestart,
}: {
  chapter:   Chapter;
  onResume:  () => void;
  onRestart: () => void;
}) => (
  <div style={{
    position:       'absolute',
    inset:          0,
    zIndex:         60,
    background:     'rgba(27,28,28,0.87)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  }}>
    <div style={{
      background:    surface,
      border:        `2px solid ${ink}`,
      borderRadius:  24,
      boxShadow:     shadowMd,
      padding:       '30px 26px',
      width:         272,
      display:       'flex',
      flexDirection: 'column',
      gap:           12,
      alignItems:    'center',
    }}>
      <span style={{
        ...font(10),
        color:         muted,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {chapter.name}
      </span>
      <button onClick={onResume} className="press" style={{
        width:        '100%',
        padding:      '12px 0',
        background:   yellow,
        color:        yTxt,
        border:       `2px solid ${ink}`,
        borderRadius: 12,
        boxShadow:    shadowMd,
        ...font(17),
      }}>
        Continue
      </button>
      <button onClick={onRestart} className="press" style={{
        width:        '100%',
        padding:      '12px 0',
        background:   surface,
        color:        text,
        border:       `2px solid ${ink}`,
        borderRadius: 12,
        boxShadow:    shadowSm,
        ...font(17),
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
  chapter:   Chapter;
  onDismiss: () => void;
}) => {
  useEffect(() => {
    typeof navigator !== 'undefined' && navigator.vibrate?.([20, 40, 20]);
    const t = setTimeout(onDismiss, 2900);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={onDismiss}
      className="anim-chfade"
      style={{
        position:       'absolute',
        inset:          0,
        zIndex:         70,
        background:     chapter.bg,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            14,
        cursor:         'pointer',
      }}
    >
      {/* Daisy watermark */}
      <svg
        style={{ position: 'absolute', width: 260, height: 260, opacity: 0.09 }}
        viewBox="0 0 200 200"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i} cx="100" cy="44" rx="15" ry="32"
            fill="white"
            transform={`rotate(${i * 45} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="24" fill="white" />
      </svg>

      <div style={{
        ...font(40),
        color:         '#fff',
        letterSpacing: '-0.02em',
        textAlign:     'center',
        position:      'relative',
      }}>
        {chapter.name}
      </div>
      <div style={{
        ...font(16, 500),
        color:     'rgba(255,255,255,0.72)',
        fontStyle: 'italic',
        position:  'relative',
      }}>
        "{chapter.epigraph}"
      </div>
    </div>
  );
};

/* ── TUTORIAL BOTTOM SHEET (level 1 only) ───────────── */
export const TutorialSheet = ({
  step, onDismiss,
}: {
  step:      1 | 2;
  onDismiss: () => void;
}) => {
  const title = step === 1
    ? 'Bir yaprağa dokun'
    : 'Ya da yaprağı bir yöne savur';
  const body  = step === 1
    ? 'Her dokunuş, oku bir adım çevirir. Sol yapraklar ters döner — sanki çiçeği iki elinle tutuyorsun.'
    : 'Parmağını N · E · S · W yönünde kaydır; ok en yakın yöne snap olur. Tek hamlede hedef yön.';

  return (
    <div
      onClick={onDismiss}
      className="anim-slideup"
      style={{
        position:     'absolute',
        left:         18,
        right:        18,
        bottom:       158,
        background:   surface,
        border:       `2px solid ${ink}`,
        borderRadius: 16,
        boxShadow:    shadowMd,
        padding:      '14px 18px',
        zIndex:       40,
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        gap:          14,
      }}
    >
      {/* Visual: tap finger (step 1) or compass with snap arrows (step 2) */}
      <div style={{ flexShrink: 0, width: 56, height: 56 }}>
        {step === 1 ? (
          <svg viewBox="0 0 56 56" width="56" height="56">
            <ellipse cx="28" cy="30" rx="18" ry="22"
              fill="#FFFFFF" stroke={ink} strokeWidth="2" />
            <path d="M28 18 L28 26 M28 18 L24 22 M28 18 L32 22"
              stroke={ink} strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" fill="none" />
            <circle cx="28" cy="30" r="9" fill="none"
              stroke={yellow} strokeWidth="2"
              strokeDasharray="2 3" opacity="0.85">
              <animate attributeName="r" values="6;12;6" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </svg>
        ) : (
          <svg viewBox="0 0 56 56" width="56" height="56">
            {/* compass ring */}
            <circle cx="28" cy="28" r="22" fill="#FFF9E0"
              stroke={ink} strokeWidth="2" />
            {/* N E S W tick labels */}
            <text x="28" y="13" textAnchor="middle"
              style={{ font: 'bold 7px Quicksand, sans-serif' }} fill={ink}>N</text>
            <text x="48" y="30" textAnchor="middle"
              style={{ font: 'bold 7px Quicksand, sans-serif' }} fill={ink}>E</text>
            <text x="28" y="50" textAnchor="middle"
              style={{ font: 'bold 7px Quicksand, sans-serif' }} fill={ink}>S</text>
            <text x="8"  y="30" textAnchor="middle"
              style={{ font: 'bold 7px Quicksand, sans-serif' }} fill={ink}>W</text>
            {/* center arrow snapping between cardinals */}
            <g transform="translate(28 28)">
              <path d="M0,-9 L0,9 M0,-9 L-3.5,-4.5 M0,-9 L3.5,-4.5"
                stroke={ink} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" fill="none">
                <animateTransform attributeName="transform" type="rotate"
                  values="0;90;180;270;0" keyTimes="0;0.25;0.5;0.75;1"
                  dur="2.8s" repeatCount="indefinite"
                  calcMode="discrete" />
              </path>
            </g>
            {/* swipe trail */}
            <path d="M16 28 Q22 24 28 28"
              stroke={yellow} strokeWidth="2" fill="none"
              strokeLinecap="round" strokeDasharray="3 3" opacity="0.85" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...font(14), color: text, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ ...font(12, 500), color: muted, lineHeight: 1.5 }}>
          {body}
        </div>
        <div style={{
          ...font(9, 600),
          color:         muted,
          marginTop:     6,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {step} / 2 · {step === 1 ? 'dokun ile başla' : 'savur ile snap'}
        </div>
      </div>
    </div>
  );
};

