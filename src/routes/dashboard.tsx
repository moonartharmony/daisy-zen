/**
 * /dashboard — Bahçe Seçim Alanı (Garden selection hub)
 *
 * Layout:
 *  • Fixed glass navbar — daisy logo (left) + emotional avatar ring (right)
 *  • Avatar dropdown — email + "Evrenden Ayrıl" sign-out
 *  • Scrollable grid of 5 chapter cards
 *
 * Emotional ring colour is read from localStorage key 'daisy-emotional-state'
 * (written by ZenStateController during gameplay). Falls back to gold (calm).
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState }  from 'react';
import { supabase, type User }          from '../lib/supabase';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

/* ── Emotional ring palette ─────────────────────────────────────────────── */
const RING: Record<string, { color: string; glow: string }> = {
  calm:        { color: '#FFD700',                  glow: 'rgba(255,215,  0,0.55)' },
  anxious:     { color: '#E8C4B0',                  glow: 'rgba(232,196,176,0.55)' },
  melancholic: { color: '#B8C8DA',                  glow: 'rgba(184,200,218,0.55)' },
};
function getEmotionStyle() {
  const state = localStorage.getItem('daisy-emotional-state') ?? 'calm';
  return RING[state] ?? RING.calm;
}

/* ── Chapter catalogue ─────────────────────────────────────────────────── */
const CHAPTERS = [
  { id: 'garden',   label: 'The Garden',   sub: 'Oklar ilk burada konuştu.',      icon: '🌸', levels: [1,  10] as [number, number] },
  { id: 'forest',   label: 'The Forest',   sub: 'Gölgeler içinde hizalanma.',     icon: '🌲', levels: [11, 25] as [number, number] },
  { id: 'mountain', label: 'The Mountain', sub: 'Dorukta sessizlik.',              icon: '🏔️', levels: [26, 40] as [number, number] },
  { id: 'storm',    label: 'The Storm',    sub: 'Kaos içinde denge.',             icon: '⚡', levels: [41, 55] as [number, number] },
  { id: 'void',     label: 'The Void',     sub: 'Sonsuzlukta çözülme.',           icon: '✦',  levels: [56, 99] as [number, number] },
];

/** Derive chapter access from the player's current level (stored in localStorage). */
function chapterStatus(ch: { levels: [number, number] }, currentLevel: number) {
  if (currentLevel > ch.levels[1])  return 'done'   as const;
  if (currentLevel >= ch.levels[0]) return 'active' as const;
  return 'locked' as const;
}

function getCurrentLevel(): number {
  try {
    const v = localStorage.getItem('daisy-level');
    const n = v ? parseInt(v, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}

/* ── Tiny navbar daisy (outline-only, 28 px) ────────────────────────────── */
function DaisyMini() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden
      style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <filter id="mini-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter="url(#mini-glow)">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="16" cy="6" rx="2.2" ry="5.5"
            fill="none" stroke="#FFD700" strokeWidth="1.2"
            transform={`rotate(${i * 45} 16 16)`} />
        ))}
        <circle cx="16" cy="16" r="3.5" fill="#FFD700" opacity="0.9" />
      </g>
    </svg>
  );
}

/* ── Chapter card ────────────────────────────────────────────────────────── */
function ChapterCard({
  chapter, status, onSelect,
}: {
  chapter:  (typeof CHAPTERS)[number];
  status:   'done' | 'active' | 'locked';
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accessible = status !== 'locked';

  return (
    <button
      onClick={accessible ? onSelect : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:         '100%',
        display:       'flex',
        alignItems:    'center',
        gap:           16,
        padding:       '16px 20px',
        background:    hovered && accessible
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.025)',
        backdropFilter:      'blur(12px)',
        WebkitBackdropFilter:'blur(12px)',
        border:        status === 'active'
          ? '1px solid rgba(255,215,0,0.28)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius:  16,
        cursor:        accessible ? 'pointer' : 'default',
        textAlign:     'left',
        fontFamily:    'Quicksand, sans-serif',
        transition:    'background 150ms ease, box-shadow 150ms ease',
        boxShadow:     hovered && accessible
          ? '0 0 28px rgba(255,215,0,0.07)'
          : 'none',
        opacity:       accessible ? 1 : 0.45,
      }}
    >
      {/* Icon */}
      <div style={{
        width:          44, height: 44, flexShrink: 0,
        borderRadius:   12,
        background:     'rgba(255,215,0,0.06)',
        border:         '1px solid rgba(255,215,0,0.12)',
        display:        'flex', alignItems: 'center', justifyContent: 'center',
        fontSize:       20,
      }}>
        {chapter.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:   15, fontWeight: 700,
          color:      accessible ? '#EDE9E0' : 'rgba(255,255,255,0.4)',
          marginBottom: 3,
        }}>
          {chapter.label}
        </div>
        <div style={{
          fontSize:   12, fontWeight: 500,
          color:      'rgba(255,255,255,0.32)',
        }}>
          {chapter.sub}
        </div>
      </div>

      {/* State indicator — derived from chapterStatus(), not hardcoded */}
      <div style={{
        fontSize:   11, fontWeight: 700,
        color:      status === 'done'   ? 'rgba(80,200,120,0.7)'
                  : status === 'active' ? 'rgba(255,215,0,0.6)'
                  :                       'rgba(255,255,255,0.18)',
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}>
        {status === 'done' ? '✓' : status === 'active' ? '→' : '🔒'}
      </div>
    </button>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */
function Dashboard() {
  const navigate            = useNavigate();
  const [user, setUser]     = useState<User | null>(null);
  const [menu, setMenu]     = useState(false);
  const menuRef             = useRef<HTMLDivElement>(null);
  const ring                = getEmotionStyle();
  const currentLevel        = getCurrentLevel();

  /* Auth guard */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate({ to: '/' }); return; }
      setUser(session.user);
    });
  }, [navigate]);

  /* Close menu on outside click */
  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/' });
  };

  return (
    <div style={{
      minHeight:   '100dvh',
      background:  '#0B0C10',
      fontFamily:  'Quicksand, sans-serif',
      overflowY:   'auto',
    }}>

      {/* ── Glass navbar ── */}
      <nav style={{
        position:            'fixed',
        top: 0, left: 0, right: 0,
        zIndex:              50,
        height:              56,
        backdropFilter:      'blur(18px)',
        WebkitBackdropFilter:'blur(18px)',
        background:          'rgba(0,0,0,0.22)',
        borderBottom:        '1px solid rgba(255,255,255,0.05)',
        display:             'flex',
        alignItems:          'center',
        justifyContent:      'space-between',
        padding:             '0 20px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'default' }}>
          <DaisyMini />
          <span style={{
            color:         '#EDE9E0',
            fontWeight:    700,
            fontSize:      15,
            letterSpacing: '-0.02em',
          }}>
            daisy zen
          </span>
        </div>

        {/* Avatar ring + dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenu(m => !m)}
            aria-label="Hesap menüsü"
            style={{
              width:        36,
              height:       36,
              borderRadius: '50%',
              border:       `2px solid ${ring.color}`,
              boxShadow:    `0 0 14px ${ring.glow}, 0 0 4px ${ring.glow}`,
              background:   'rgba(255,255,255,0.06)',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              fontSize:     14,
              fontWeight:   700,
              color:        '#EDE9E0',
              transition:   'box-shadow 400ms ease',
              fontFamily:   'Quicksand, sans-serif',
            }}
          >
            {user?.email?.[0]?.toUpperCase() ?? '✦'}
          </button>

          {menu && (
            <div style={{
              position:            'absolute',
              top:                 44,
              right:               0,
              background:          'rgba(14,14,18,0.95)',
              backdropFilter:      'blur(20px)',
              WebkitBackdropFilter:'blur(20px)',
              border:              '1px solid rgba(255,255,255,0.08)',
              borderRadius:        14,
              padding:             8,
              minWidth:            200,
              boxShadow:           '0 12px 48px rgba(0,0,0,0.5)',
              animation:           'anim-fadein-kf 120ms ease both',
            }}>
              {/* Email */}
              <div style={{
                padding:      '7px 12px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 4,
              }}>
                <div style={{
                  fontSize:      10,
                  color:         'rgba(255,255,255,0.3)',
                  marginBottom:  3,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  oturum
                </div>
                <div style={{
                  fontSize:   12,
                  color:      'rgba(255,255,255,0.65)',
                  fontWeight: 600,
                  wordBreak:  'break-all',
                }}>
                  {user?.email}
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                style={{
                  width:      '100%',
                  padding:    '9px 12px',
                  textAlign:  'left',
                  background: 'none',
                  border:     'none',
                  borderRadius:8,
                  color:      'rgba(255,100,100,0.8)',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize:   13,
                  fontWeight: 700,
                  cursor:     'pointer',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'rgba(255,50,50,0.09)')}
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'none')}
              >
                Evrenden Ayrıl
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Content ── */}
      <div style={{
        paddingTop:  80,
        padding:     '80px 20px 60px',
        maxWidth:    480,
        margin:      '0 auto',
      }}>

        {/* Section label */}
        <p style={{
          color:         'rgba(255,255,255,0.28)',
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom:  20,
          margin:        '0 0 20px',
        }}>
          ✦ evren seçimi ✦
        </p>

        {/* Chapter cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CHAPTERS.map(ch => (
            <ChapterCard
              key={ch.id}
              chapter={ch}
              status={chapterStatus(ch, currentLevel)}
              onSelect={() => navigate({ to: '/play' })}
            />
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          marginTop:  40,
          textAlign:  'center',
          fontSize:   11,
          fontWeight: 500,
          color:      'rgba(255,255,255,0.18)',
          lineHeight: 1.7,
        }}>
          Her bölüm bir nefes. Kendi hızında ilerle.
        </p>
      </div>
    </div>
  );
}
