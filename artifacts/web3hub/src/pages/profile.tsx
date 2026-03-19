import { useWeb3Auth } from "@/lib/web3";
import { useCheckin, useUpsertUser, useGetPosts } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  Zap, Star, Copy, Check, AlertCircle, Gift, Clock, Edit2,
  Twitter, Send, Hash, Pin, Trash2, Save
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useLang } from "@/lib/i18n";

function useCountdown(targetIso: string | null | undefined) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!targetIso) { setRemaining(""); return; }
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) { setRemaining(""); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return remaining;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1 text-muted-foreground text-xs">{icon}{label}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Profile() {
  const { address, isConnected, user, isLoading: userLoading } = useWeb3Auth();
  const checkinMutation = useCheckin();
  const upsertMutation = useUpsertUser();
  const queryClient = useQueryClient();
  const { data: userPosts } = useGetPosts(
    { authorType: address ?? "" },
    { query: { enabled: !!address } }
  );
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const nextCheckin = user?.lastCheckin
    ? new Date(new Date(user.lastCheckin).getTime() + 86_400_000).toISOString()
    : null;
  const countdown = useCountdown(nextCheckin);
  const canCheckin = !nextCheckin || new Date(nextCheckin).getTime() <= Date.now();

  useEffect(() => {
    if (user) {
      setTwitter(user.twitter ?? "");
      setTelegram(user.telegram ?? "");
      setDiscord(user.discord ?? "");
    }
  }, [user]);

  const markDirty = (fn: () => void) => () => { fn(); setDirty(true); };

  const handleSave = () => {
    if (!address || !dirty) return;
    setSaveStatus("saving");
    upsertMutation.mutate(
      { data: { wallet: address, twitter, telegram, discord } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          setDirty(false);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
        },
        onError: () => setSaveStatus("idle"),
      }
    );
  };

  const handleCheckin = () => {
    if (!address || !canCheckin) return;
    checkinMutation.mutate(
      { data: { wallet: address } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }) }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      upsertMutation.mutate(
        { data: { wallet: address, avatar: ev.target?.result as string } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }) }
      );
    };
    reader.readAsDataURL(file);
  };

  const spaceStatus = () => {
    const s = user?.spaceStatus;
    if (!s) return { label: t("spaceNo"), cls: "text-muted-foreground bg-muted" };
    if (s === "active") return { label: t("spaceYes"), cls: "text-green-700 bg-green-50" };
    if (s === "pending") return { label: t("spacePending"), cls: "text-amber-700 bg-amber-50" };
    if (s === "rejected") return { label: t("spaceRejected"), cls: "text-red-700 bg-red-50" };
    if (s === "banned") return { label: t("spaceBanned"), cls: "text-red-900 bg-red-100" };
    return { label: s, cls: "text-muted-foreground bg-muted" };
  };

  const isDev = user?.spaceType === "developer";

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("connect")}</h2>
        <p className="text-muted-foreground text-sm">请先连接钱包以查看个人资料。</p>
      </div>
    );
  }

  if (userLoading) return <div className="py-32 text-center animate-pulse text-muted-foreground">Loading...</div>;

  const ss = spaceStatus();

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Dashboard title + Save btn ─────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("myProfile")}</h1>
        <button
          onClick={handleSave}
          disabled={!dirty || saveStatus === "saving"}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            dirty
              ? "bg-[#FF69B4] text-white hover:bg-[#ff4fa8] shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Save className="w-4 h-4" />
          {saveStatus === "saving" ? t("saving") : saveStatus === "saved" ? t("saved") : t("save")}
        </button>
      </div>

      {/* ── Top row: Avatar info + Stats ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Avatar card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div
              className="w-24 h-24 rounded-2xl border-2 border-border shadow"
              style={{ background: user?.avatar ? `url(${user.avatar}) center/cover` : generateGradient(address) }}
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit2 className="w-6 h-6 text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="text-center">
            <div className="font-bold text-base font-mono">{user?.username || truncateAddress(address)}</div>
            {user?.spaceType && (
              <span className="inline-block mt-1 px-3 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                {user.spaceType}
              </span>
            )}
          </div>
          {/* Space status */}
          <div className="w-full pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-1.5">{t("space")}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${ss.cls}`}>{ss.label}</span>
              {(!user?.spaceStatus || user.spaceStatus === "rejected") && (
                <a href="/apply" className="text-xs text-primary hover:underline">{t("applySpace")}</a>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {!isDev && (
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatBox
              icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
              label={t("points")}
              value={user?.points ?? 0}
            />
            <StatBox
              icon={<Zap className="w-3.5 h-3.5 text-primary" />}
              label={t("energy")}
              value={user?.energy ?? 0}
            />
            <StatBox
              icon={<Pin className="w-3.5 h-3.5 text-violet-500" />}
              label={t("pinCount")}
              value={0}
            />
            <StatBox
              icon={<Hash className="w-3.5 h-3.5 text-green-500" />}
              label={t("inviteCode")}
              value={
                <span className="flex items-center gap-1 text-sm">
                  <span className="font-mono tracking-wider">{user?.inviteCode ?? "—"}</span>
                  {user?.inviteCode && <CopyBtn text={user.inviteCode} />}
                </span>
              }
              sub={`${t("invited")} ${user?.inviteCount ?? 0} ${t("people")}`}
            />
          </div>
        )}
      </div>

      {/* ── Middle row: Check-in + Wallet ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check-in (hidden for dev) */}
        {!isDev && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-pink-500" /> {t("checkinBtn")}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleCheckin}
                disabled={!canCheckin || checkinMutation.isPending}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  canCheckin
                    ? "bg-[#FF69B4] text-white hover:bg-[#ff4fa8]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {checkinMutation.isPending ? t("saving") : t("checkin")}
              </button>
              {!canCheckin && countdown && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t("nextCheckin")}</span>
                  <span className="font-mono font-bold text-foreground">{countdown}</span>
                </div>
              )}
              {canCheckin && <span className="text-xs text-green-600 font-medium">{t("canCheckin")}</span>}
            </div>
            {checkinMutation.data && (
              <p className={`mt-2 text-xs font-medium ${checkinMutation.data.success ? "text-green-600" : "text-amber-600"}`}>
                {checkinMutation.data.message}
              </p>
            )}
          </div>
        )}

        {/* Wallet address */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-3">{t("wallet")}</h2>
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
            <span className="font-mono text-xs text-muted-foreground flex-1 truncate">{address}</span>
            {address && <CopyBtn text={address} />}
          </div>
        </div>
      </div>

      {/* ── Social links ──────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-bold mb-4">{t("social")}</h2>
        <div className="space-y-3">
          {([
            { icon: <Twitter className="w-4 h-4 text-sky-500" />, label: "X / Twitter", value: twitter, onChange: markDirty((v) => setTwitter(v as string)), placeholder: "https://x.com/yourhandle" },
            { icon: <Send className="w-4 h-4 text-blue-500" />, label: "Telegram", value: telegram, onChange: markDirty((v) => setTelegram(v as string)), placeholder: "https://t.me/yourhandle" },
            { icon: <Hash className="w-4 h-4 text-indigo-500" />, label: "Discord", value: discord, onChange: markDirty((v) => setDiscord(v as string)), placeholder: "https://discord.gg/yourlink" },
          ] as Array<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string }>)
            .map(({ icon, label, value, onChange, placeholder }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 flex justify-center shrink-0">{icon}</div>
                <span className="w-24 text-xs text-muted-foreground shrink-0">{label}</span>
                <input
                  type="url"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 text-sm bg-muted/40 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                />
                {value && (
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">↗</a>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* ── Posts ─────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-bold mb-4">{t("myPosts")}</h2>
        {(!userPosts?.posts || userPosts.posts.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("noPost")}</p>
        ) : (
          <div className="divide-y divide-border/50">
            {userPosts.posts.map((post) => (
              <div key={post.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{post.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">#{post.section}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!isDev && (
                    <button className="p-1.5 rounded-lg hover:bg-violet-100 text-muted-foreground hover:text-violet-600 transition-colors" title={t("pinCount")}>
                      <Pin className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
