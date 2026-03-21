import { useState, useEffect } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { X, ExternalLink, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WalletConfig {
  key: string;
  name: string;
  color: string;
  logoUrl: string;
  detect: () => boolean;
  installUrl: string;
}

const WALLETS: WalletConfig[] = [
  {
    key: "metamask",
    name: "MetaMask",
    color: "#F6851B",
    logoUrl: "https://www.google.com/s2/favicons?domain=metamask.io&sz=128",
    detect: () =>
      typeof window !== "undefined" &&
      !!(window as any).ethereum?.isMetaMask &&
      !(window as any).ethereum?.isRabby &&
      !(window as any).ethereum?.isBraveWallet,
    installUrl: "https://metamask.io/download/",
  },
  {
    key: "okx",
    name: "OKX Wallet",
    color: "#000000",
    logoUrl: "https://www.google.com/s2/favicons?domain=okx.com&sz=128",
    detect: () =>
      typeof window !== "undefined" &&
      (!!(window as any).okxwallet || !!(window as any).ethereum?.isOKExWallet),
    installUrl: "https://www.okx.com/web3",
  },
  {
    key: "trust",
    name: "Trust Wallet",
    color: "#3375BB",
    logoUrl: "https://www.google.com/s2/favicons?domain=trustwallet.com&sz=128",
    detect: () =>
      typeof window !== "undefined" &&
      (!!(window as any).ethereum?.isTrust || !!(window as any).trustwallet),
    installUrl: "https://trustwallet.com/download",
  },
  {
    key: "rabby",
    name: "Rabby Wallet",
    color: "#7084FF",
    logoUrl: "https://www.google.com/s2/favicons?domain=rabby.io&sz=128",
    detect: () =>
      typeof window !== "undefined" && !!(window as any).ethereum?.isRabby,
    installUrl: "https://rabby.io",
  },
  {
    key: "phantom",
    name: "Phantom",
    color: "#AB9FF2",
    logoUrl: "https://www.google.com/s2/favicons?domain=phantom.app&sz=128",
    detect: () =>
      typeof window !== "undefined" &&
      (!!(window as any).phantom?.ethereum || !!(window as any).ethereum?.isPhantom),
    installUrl: "https://phantom.app/download",
  },
  {
    key: "coinbase",
    name: "Coinbase Wallet",
    color: "#0052FF",
    logoUrl: "https://www.google.com/s2/favicons?domain=coinbase.com&sz=128",
    detect: () =>
      typeof window !== "undefined" &&
      (!!(window as any).ethereum?.isCoinbaseWallet ||
        !!(window as any).coinbaseWalletExtension),
    installUrl: "https://www.coinbase.com/wallet/downloads",
  },
  {
    key: "rainbow",
    name: "Rainbow",
    color: "#174299",
    logoUrl: "https://www.google.com/s2/favicons?domain=rainbow.me&sz=128",
    detect: () =>
      typeof window !== "undefined" && !!(window as any).ethereum?.isRainbow,
    installUrl: "https://rainbow.me/download",
  },
];

function WalletLogo({ wallet, size = 44 }: { wallet: WalletConfig; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const letter = wallet.name[0].toUpperCase();

  if (imgError) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{ width: size, height: size, background: wallet.color }}
      >
        {letter}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: "#f8f8f8" }}
    >
      <img
        src={wallet.logoUrl}
        alt={wallet.name}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

interface WalletRowProps {
  wallet: WalletConfig;
  isInstalled: boolean;
  onConnect: () => void;
  lang: string;
}

function WalletRow({ wallet, isInstalled, onConnect, lang }: WalletRowProps) {
  const [showNotInstalled, setShowNotInstalled] = useState(false);
  const isZh = lang === "zh-CN";

  const handleClick = () => {
    if (isInstalled) {
      setShowNotInstalled(false);
      onConnect();
    } else {
      setShowNotInstalled(true);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 transition-all text-left",
          "hover:bg-gray-50 dark:hover:bg-slate-800/60 active:scale-[0.99]"
        )}
      >
        <WalletLogo wallet={wallet} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {wallet.name}
            </span>
            {isInstalled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium leading-none">
                {isZh ? "已安装" : "Installed"}
              </span>
            )}
          </div>
          {!isInstalled && !showNotInstalled && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isZh ? "点击查看安装提示" : "Click to install"}
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
      </button>

      {showNotInstalled && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-2">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {isZh ? "请先安装该钱包" : "Please install this wallet first"}
          </p>
          <a
            href={wallet.installUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline flex-shrink-0"
          >
            {isZh ? "去安装" : "Install"}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

interface WalletPickerModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletPickerModal({ open, onClose }: WalletPickerModalProps) {
  const { connect } = useConnect();
  const { open: openW3M } = useWeb3Modal();
  const { lang } = useLang();
  const isZh = lang === "zh-CN";

  const [walletStates, setWalletStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      const states: Record<string, boolean> = {};
      for (const w of WALLETS) {
        try {
          states[w.key] = w.detect();
        } catch {
          states[w.key] = false;
        }
      }
      setWalletStates(states);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleConnectWallet = (wallet: WalletConfig) => {
    try {
      connect({ connector: injected() });
      onClose();
    } catch {
      // silently fail; wagmi will surface errors via its own state
    }
  };

  const handleMoreWallets = () => {
    onClose();
    setTimeout(() => openW3M(), 100);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {isZh ? "连接钱包" : "Connect Wallet"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Wallet list */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {WALLETS.map((wallet) => (
            <WalletRow
              key={wallet.key}
              wallet={wallet}
              isInstalled={!!walletStates[wallet.key]}
              onConnect={() => handleConnectWallet(wallet)}
              lang={lang}
            />
          ))}
        </div>

        {/* Footer: More wallets */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={handleMoreWallets}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700"
          >
            {isZh ? "更多钱包 / WalletConnect" : "More Wallets / WalletConnect"}
          </button>
        </div>
      </div>
    </div>
  );
}
