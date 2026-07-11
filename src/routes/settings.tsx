import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, LogOut, Check } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Daisy Zen" },
      { name: "description", content: "Sign in and adjust your Daisy Zen space." },
      { property: "og:title", content: "Settings — Daisy Zen" },
      {
        property: "og:description",
        content: "Sign in and adjust your Daisy Zen space.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(!!data.session);
      setSessionEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasSession(!!s);
      setSessionEmail(s?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? window.location.origin + "/settings"
              : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something drifted. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore; hard reset regardless
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace("/settings");
      }
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-28">
      <ScreenHeader title="Settings" backTo="/profile" />

      {hasSession ? (
        <section
          className="w-full max-w-md mx-auto rounded-2xl bg-white p-6 flex flex-col gap-4"
          style={{
            border: "3px solid #1F1F1F",
            boxShadow: "4px 4px 0px #1F1F1F",
          }}
        >
          <p
            className="text-[10px] font-bold tracking-[0.18em] uppercase"
            style={{ color: "var(--ink)", opacity: 0.6 }}
          >
            Signed in as
          </p>
          <p
            className="text-base font-extrabold break-all"
            style={{ color: "var(--ink)" }}
          >
            {sessionEmail ?? "Anchored"}
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-xl bg-white py-3 text-base font-extrabold flex items-center justify-center gap-2 disabled:opacity-70 neo-press"
            style={{
              border: "3px solid #1F1F1F",
              boxShadow: "4px 4px 0px #1F1F1F",
              color: "#C0392B",
            }}
          >
            <LogOut className="size-5" strokeWidth={2.5} />
            {signingOut ? "Disconnecting…" : "Logout from Daisy Zen"}
          </button>
        </section>
      ) : (
        <section
          className="w-full max-w-md mx-auto rounded-2xl bg-white p-6 flex flex-col gap-4"
          style={{
            border: "3px solid #1F1F1F",
            boxShadow: "4px 4px 0px #1F1F1F",
          }}
        >
          <div className="flex flex-col gap-1">
            <h2
              className="text-xl font-extrabold"
              style={{ color: "var(--ink)" }}
            >
              Anchor your space
            </h2>
            <p
              className="text-xs font-bold tracking-[0.14em] uppercase"
              style={{ color: "var(--ink)", opacity: 0.6 }}
            >
              A quiet magic link, no passwords
            </p>
          </div>

          {sent ? (
            <div
              className="rounded-xl bg-white px-4 py-4 flex items-center gap-3"
              style={{
                border: "3px solid #1F1F1F",
                boxShadow: "4px 4px 0px #1F1F1F",
              }}
            >
              <Check className="size-5 shrink-0" strokeWidth={2.75} />
              <p
                className="text-sm font-bold"
                style={{ color: "var(--ink)" }}
              >
                Check your inbox. The link will return you here.
              </p>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span
                  className="text-[11px] font-bold tracking-[0.14em] uppercase"
                  style={{ color: "var(--ink)", opacity: 0.7 }}
                >
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg px-3 py-3 text-base bg-white placeholder:text-[color:var(--ink)]/40"
                  style={{
                    border: "3px solid #1F1F1F",
                    boxShadow: "4px 4px 0px #1F1F1F",
                    color: "var(--ink)",
                  }}
                  placeholder="you@quiet.space"
                />
              </label>
              {error && (
                <p
                  className="text-xs font-bold"
                  style={{ color: "#C0392B" }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl py-3 text-base font-extrabold flex items-center justify-center gap-2 disabled:opacity-70 neo-press"
                style={{
                  border: "3px solid #1F1F1F",
                  boxShadow: "4px 4px 0px #1F1F1F",
                  backgroundColor: "#FFE57F",
                  color: "var(--ink)",
                }}
              >
                <Mail className="size-5" strokeWidth={2.5} />
                {sending ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
