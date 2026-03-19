import { Link, useLocation } from "wouter";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWeb3Auth } from "@/lib/web3";
import { useLang } from "@/lib/i18n";
import { Box, LogOut, User as UserIcon, Home, Mail } from "lucide-react";
import { cn, truncateAddress, generateGradient } from "@/lib/utils";
import { useState } from "react";

const NAV_ROW1 = [
  { label: "测试网",        href: "/section/testnet" },
  { label: "IDO/Launchpad", href: "/section/ido" },
  { label: "安全审计",      href: "/section/security" },
  { label: "集成公告",      href: "/section/integration" },
  { label: "空投计划",      href: "/section/airdrop" },
  { label: "活动奖励",      href: "/section/events" },
  { label: "融资公告",      href: "/section/funding" },
  { label: "招聘人才",      href: "/section/jobs" },
  { label: "节点招募",      href: "/section/nodes" },
  { label: "项目展示",      href: "/showcase" },
];

const NAV_ROW2 = [
  { label: "生态系统",   href: "/section/ecosystem" },
  { label: "伙伴招募",   href: "/section/partners" },
  { label: "黑客松",     href: "/section/hackathon" },
  { label: "AMA",        href: "/section/ama" },
  { label: "漏洞赏金",   href: "/section/bugbounty" },
  { label: "社区聊天",   href: "/community" },
  { label: "KOL 合作",   href: "/kol" },
  { label: "开发者",     href: "/developer" },
  { label: "KOL",        href: "/kol" },
];

const DONATE_ADDR = "0xbe4548c1458be01838f1faafd69d335f0567399a";

export function Layout({ children }: { children: React.ReactNode }) {
  const { open } = useWeb3Modal();
  const { address, isConnected, user, disconnect } = useWeb3Auth();
  const [location] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);
  const { t } = useLang();

  const copyAddr = () => {
    navigator.clipboard.writeText(DONATE_ADDR).then(() => {
      setAddrCopied(true);
      setTimeout(() => setAddrCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top Navbar ──────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Box className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">Web3Hub</span>
            </Link>

            <div className="flex items-center gap-3 ml-auto">
              <Link
                href="/apply"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                + {t("apply")}
              </Link>

              {!isConnected ? (
                <button
                  onClick={() => open()}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                >
                  {t("connect")}
                </button>
              ) : (
                <div
                  className="relative"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button className="flex items-center gap-2 p-1 pr-3 rounded-full border border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
                    <div
                      className="w-7 h-7 rounded-full"
                      style={{ background: user?.avatar ? `url(${user.avatar}) center/cover` : generateGradient(address) }}
                    />
                    <span className="text-sm font-medium font-mono">{truncateAddress(address)}</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-card rounded-xl shadow-xl border border-border/50 py-1 z-50">
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4" /> {t("profile")}
                      </Link>
                      <button
                        onClick={() => { disconnect(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" /> {t("disconnect")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Nav rows (Home + 10 + 9) ── */}
        <div className="border-t border-border/30 bg-muted/20">
          <div className="max-w-7xl mx-auto px-2 py-1.5 space-y-1">
            {/* Row 1: Home button + 10 items */}
            <div className="flex items-center gap-0.5 justify-center flex-nowrap overflow-x-auto scrollbar-none">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors shrink-0",
                  location === "/"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Home className="w-3.5 h-3.5" />
                {t("home")}
              </Link>
              {NAV_ROW1.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    location === href
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Row 2: 9 items */}
            <div className="flex items-center gap-0.5 justify-center flex-nowrap overflow-x-auto scrollbar-none">
              {NAV_ROW2.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    location === href
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-36">
        {children}
      </main>

      {/* ── Fixed Bottom Footer ──────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border/50 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Contact icons */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-medium">{t("contact")}：</span>
            <a
              href="#"
              title="Twitter / X"
              className="w-8 h-8 rounded-full bg-muted/60 hover:bg-sky-50 flex items-center justify-center transition-colors group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-muted-foreground group-hover:fill-sky-500 transition-colors">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="mailto:"
              title="Email"
              className="w-8 h-8 rounded-full bg-muted/60 hover:bg-pink-50 flex items-center justify-center transition-colors group"
            >
              <Mail className="w-4 h-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
            </a>
            <a
              href="#"
              title="Telegram"
              className="w-8 h-8 rounded-full bg-muted/60 hover:bg-blue-50 flex items-center justify-center transition-colors group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-muted-foreground group-hover:fill-blue-500 transition-colors">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>

          {/* Donate */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-muted-foreground">{t("donate")} EVM：</span>
            <button
              onClick={copyAddr}
              className="font-mono text-xs bg-muted/60 hover:bg-muted px-3 py-1 rounded-full border border-border/50 transition-colors flex items-center gap-1"
            >
              {addrCopied ? "✓ Copied!" : `${DONATE_ADDR.slice(0, 10)}...${DONATE_ADDR.slice(-6)}`}
            </button>
            <span className="text-xs text-muted-foreground">Thank you so much 🙏</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
