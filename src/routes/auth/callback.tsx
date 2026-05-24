/**
 * /auth/callback — Magic link landing pad (PKCE flow)
 *
 * Supabase sends the user here with ?code=CODE in the query string.
 * With detectSessionInUrl:true the client auto-exchanges the code on
 * first `getSession()` call. We wait for SIGNED_IN, then push to /dashboard.
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect }                    from 'react';
import { supabase }                     from '../../lib/supabase';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

/* ── Thin spinning arc ── */
function NeonSpinner({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 48 48"
      aria-hidden
      style={{ animation: 'anim-spin-kf 1s linear infinite' }}
    >
      {/* Track */}
      <circle cx="24" cy="24" r="20" fill="none"
        stroke="rgba(255,215,0,0.12)" strokeWidth="2.5" />
      {/* Arc */}
      <path
        d="M 24 4 A 20 20 0 0 1 44 24"
        fill="none"
        stroke="#FFD700"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Trailing glow dot */}
      <circle cx="44" cy="24" r="3" fill="#FFD700" opacity="0.9" />
    </svg>
  );
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    /* Supabase detectSessionInUrl auto-exchanges the code on getSession().
       We additionally listen via onAuthStateChange so we catch both
       immediate (already cached) and async (network round-trip) cases.   */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          subscription.unsubscribe();
          navigate({ to: '/dashboard' });
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: '/dashboard' });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{
      minHeight:      '100dvh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            20,
      background:     '#0B0C10',
      fontFamily:     'Quicksand, sans-serif',
    }}>
      <NeonSpinner size={52} />
      <p style={{
        color:         'rgba(255,255,255,0.38)',
        fontSize:      13,
        fontWeight:    600,
        letterSpacing: '0.06em',
        margin:        0,
      }}>
        Evren kapıları açılıyor…
      </p>
    </div>
  );
}
