import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Scale,
  BookOpen,
  Flame,
  Pencil,
  LogOut,
  Users,
  Flower,
  Sparkles,
  Leaf,
  Sun,
  Moon,
  Check,
  X,
} from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";
import { useProgress } from "@/lib/progress";
import { CHAPTERS, getChapter } from "@/lib/chapters";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Daisy Zen" },
      { name: "description", content: "Your zen identity and progress." },
      { property: "og:title", content: "Profile — Daisy Zen" },
      { property: "og:description", content: "Your zen identity and progress." },
    ],
  }),
  component: Profile,
});

// -- Profile metadata (local only, separate from progress state) ------------

const PROFILE_KEY = "daisy-zen-profile-v1";

type AvatarId = "users" | "flower" | "sparkles" | "leaf" | "sun" | "moon";

type ProfileMeta = {
  name: string;
  focus: string;
  avatar: AvatarId;
};

const DEFAULT_PROFILE: ProfileMeta = {
  name: "Daisy Williams",
  focus: "Cultivating quiet alignment",
  avatar: "users",
};

const AVATAR_OPTIONS: { id: AvatarId; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; bg: string }[] = [
  { id: "users", icon: Users, bg: "#D8C3A8" },
  { id: "flower", icon: Flower, bg: "#F7C6D0" },
  { id: "sparkles", icon: Sparkles, bg: "#FFE57F" },
  { id: "leaf", icon: Leaf, bg: "#B8D6CC" },
  { id: "sun", icon: Sun, bg: "#FFC98A" },
  { id: "moon", icon: Moon, bg: "#C9C3E4" },
];

function readProfile(): ProfileMeta {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<ProfileMeta>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeProfile(p: ProfileMeta) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function AvatarBadge({ avatar, size = 112 }: { avatar: AvatarId; size?: number }) {
  const opt = AVATAR_OPTIONS.find((a) => a.id === avatar) ?? AVATAR_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <div
      className="rounded-full grid place-items-center border-[3.5px] overflow-hidden"
      style={{
        width: size,
        height: size,
        backgroundColor: opt.bg,
        borderColor: "var(--ink)",
      }}
      aria-hidden
    >
      <Icon className="text-[color:var(--ink)]/80" strokeWidth={1.75} />
    </div>
  );
}

function Profile() {
  const { highestUnlocked, xp } = useProgress();
  const chapter = getChapter(highestUnlocked);
  const totalLevels = CHAPTERS[CHAPTERS.length - 2]?.levelEnd ?? 50;
  const focusPct = Math.min(100, Math.round((highestUnlocked / totalLevels) * 100));
  const totalXP = xp;
  const dailyStreak = 12;

  const [profile, setProfile] = useState<ProfileMeta>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileMeta>(DEFAULT_PROFILE);
  const [hasSession, setHasSession] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const p = readProfile();
    setProfile(p);
    setDraft(p);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setHasSession(!!data.session);
        setSessionEmail(data.session?.user?.email ?? null);
        setOffline(false);
      })
      .catch(() => mounted && setOffline(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasSession(!!s);
      setSessionEmail(s?.user?.email ?? null);
    });
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      if (!window.navigator.onLine) setOffline(true);
    }
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      }
    };
  }, []);

  const handleLogoutClick = async () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      return;
    }
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      setOffline(true);
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace("/settings");
      }
    }
  };

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };
  const cancel = () => {
    setDraft(profile);
    setEditing(false);
  };
  const save = () => {
    const cleaned: ProfileMeta = {
      name: draft.name.trim() || DEFAULT_PROFILE.name,
      focus: draft.focus.trim() || DEFAULT_PROFILE.focus,
      avatar: draft.avatar,
    };
    setProfile(cleaned);
    writeProfile(cleaned);
    setEditing(false);
  };

  return (
    <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-28">
      <ScreenHeader title="Daisy Zen" backTo="/journey" />

      {hasSession && !editing && (
        <p
          className="w-full max-w-md mx-auto text-center text-[10px] font-bold tracking-[0.18em] uppercase -mb-2"
          style={{ color: "var(--ink)", opacity: 0.5 }}
        >
          You are securely anchored in your quiet space
        </p>
      )}


      {/* Identity card */}
      <section className="w-full max-w-md mx-auto neo-lg rounded-2xl bg-white p-6 flex flex-col items-center gap-3">
        <div className="relative">
          <AvatarBadge avatar={editing ? draft.avatar : profile.avatar} />
          {!editing && (
            <button
              aria-label="Edit profile"
              onClick={startEdit}
              className="absolute bottom-0 right-0 neo-sm rounded-full size-8 grid place-items-center neo-press"
              style={{ backgroundColor: "#2E6B6E", color: "#fff" }}
            >
              <Pencil className="size-4" strokeWidth={2.75} />
            </button>
          )}
        </div>

        {!editing ? (
          <>
            <h2 className="text-[26px] font-extrabold" style={{ color: "var(--ink)" }}>
              {profile.name}
            </h2>
            <p
              className="text-sm font-semibold text-center"
              style={{ color: "var(--ink)", opacity: 0.7 }}
            >
              {hasSession && sessionEmail ? sessionEmail : profile.focus}
            </p>
            <p
              className="text-xs font-bold tracking-[0.14em] uppercase pt-1"
              style={{ color: "var(--ink)", opacity: 0.55 }}
            >
              Zen Level · {chapter.name}
            </p>

            <div className="w-full flex items-center justify-between text-sm font-bold pt-3">
              <span style={{ color: "var(--ink)" }}>Current Focus</span>
              <span style={{ color: "#7A6A00" }}>{focusPct}%</span>
            </div>
            <div
              className="w-full h-3 rounded-full border-[3px] overflow-hidden bg-white"
              style={{ borderColor: "var(--ink)" }}
            >
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(4, focusPct)}%`,
                  backgroundColor: "#B8D6CC",
                }}
              />
            </div>
          </>
        ) : (
          <EditForm
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={cancel}
          />
        )}
      </section>

      {editing ? null : (
        <>
          {/* Total alignment */}
          <section className="w-full max-w-md mx-auto neo-lg rounded-2xl bg-[color:var(--primary)] p-4 flex items-center gap-4">
            <div className="neo-sm rounded-xl size-14 grid place-items-center bg-white shrink-0">
              <Scale className="size-7" strokeWidth={2.25} />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[11px] font-bold tracking-[0.12em] uppercase"
                style={{ color: "var(--ink)", opacity: 0.7 }}
              >
                Total Alignment
              </span>
              <span
                className="text-[26px] font-extrabold leading-tight"
                style={{ color: "var(--ink)" }}
              >
                {totalXP.toLocaleString()} XP
              </span>
            </div>
          </section>

          {/* Stat duo */}
          <section className="w-full max-w-md mx-auto grid grid-cols-2 gap-4">
            <StatCard
              icon={
                <BookOpen
                  className="size-5"
                  strokeWidth={2.5}
                  style={{ color: "#1F4F4A" }}
                />
              }
              label="Chapters"
              value={String(CHAPTERS.length - 2)}
            />
            <StatCard
              icon={
                <Flame
                  className="size-5"
                  strokeWidth={2.5}
                  style={{ color: "#C0392B" }}
                  fill="#C0392B"
                />
              }
              label="Daily Streak"
              value={`${dailyStreak} Days`}
            />
          </section>

          <button
            className="w-full max-w-md mx-auto text-sm font-bold flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: "var(--ink)" }}
          >
            <Users className="size-4" strokeWidth={2.5} />
            Switch Account
          </button>

          <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2">
            <button
              onClick={handleLogoutClick}
              disabled={loggingOut}
              className="w-full neo neo-press rounded-xl bg-white py-3 text-base font-extrabold flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ color: "#C0392B" }}
            >
              <LogOut className="size-5" strokeWidth={2.5} />
              {loggingOut
                ? "Disconnecting…"
                : confirmingLogout
                  ? "Are you sure you want to disconnect?"
                  : "Logout from Daisy Zen"}
            </button>
            {confirmingLogout && !loggingOut && (
              <button
                onClick={() => setConfirmingLogout(false)}
                className="text-xs font-bold tracking-[0.14em] uppercase underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: "var(--ink)" }}
              >
                Stay in the flow
              </button>
            )}
          </div>
        </>
      )}

      {offline && !editing && (
        <div
          className="w-full max-w-md mx-auto neo-sm rounded-xl bg-white px-4 py-3 text-center text-xs font-bold tracking-wide"
          style={{ color: "var(--ink)" }}
        >
          The continuum is momentarily drifting. Your progress is safe locally.
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function EditForm({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: ProfileMeta;
  setDraft: React.Dispatch<React.SetStateAction<ProfileMeta>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="w-full flex flex-col gap-4 pt-2">
      {/* Avatar picker */}
      <div className="flex flex-col gap-2">
        <span
          className="text-[11px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "var(--ink)", opacity: 0.7 }}
        >
          Change Avatar
        </span>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = draft.avatar === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-label={`Avatar ${opt.id}`}
                aria-pressed={active}
                onClick={() => setDraft((d) => ({ ...d, avatar: opt.id }))}
                className="neo-sm neo-press rounded-xl aspect-square grid place-items-center transition-opacity"
                style={{
                  backgroundColor: opt.bg,
                  outline: active ? "3px solid var(--ink)" : "none",
                  outlineOffset: active ? "2px" : "0",
                }}
              >
                <Icon
                  className="size-5 text-[color:var(--ink)]"
                  strokeWidth={2.25}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Zen name */}
      <label className="flex flex-col gap-1">
        <span
          className="text-[11px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "var(--ink)", opacity: 0.7 }}
        >
          Zen Name
        </span>
        <input
          type="text"
          value={draft.name}
          maxLength={40}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="neo-sm rounded-lg px-3 py-3 text-base bg-white placeholder:text-[color:var(--ink)]/40"
          style={{ color: "var(--ink)" }}
          placeholder="Your zen name"
        />
      </label>

      {/* Focus / intent */}
      <label className="flex flex-col gap-1">
        <span
          className="text-[11px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "var(--ink)", opacity: 0.7 }}
        >
          Focus / Intent
        </span>
        <input
          type="text"
          value={draft.focus}
          maxLength={80}
          onChange={(e) => setDraft((d) => ({ ...d, focus: e.target.value }))}
          className="neo-sm rounded-lg px-3 py-3 text-base bg-white placeholder:text-[color:var(--ink)]/40"
          style={{ color: "var(--ink)" }}
          placeholder="A short intention"
        />
      </label>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="neo neo-press rounded-xl bg-transparent py-3 text-base font-extrabold flex items-center justify-center gap-2"
          style={{ color: "var(--ink)" }}
        >
          <X className="size-5" strokeWidth={2.75} />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="neo neo-press rounded-xl py-3 text-base font-extrabold flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FFE57F", color: "var(--ink)" }}
        >
          <Check className="size-5" strokeWidth={2.75} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="neo-lg rounded-2xl bg-white p-4 flex flex-col gap-2">
      <div>{icon}</div>
      <span
        className="text-[12px] font-bold tracking-wide"
        style={{ color: "var(--ink)", opacity: 0.75 }}
      >
        {label}
      </span>
      <span className="text-[22px] font-extrabold" style={{ color: "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}
