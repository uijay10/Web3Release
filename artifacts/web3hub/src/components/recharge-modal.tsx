import { useState } from "react";
import { X, Copy, Check, Zap } from "lucide-react";
import { useLang } from "@/lib/i18n";

const PAYMENT_ADDRESS = "0xbe4548c1458be01838f1faafd69d335f0567399a";

const PLANS = [
  { usdt: 150, energy: 10, label: "基础包", highlight: false },
  { usdt: 200, energy: 100, label: "标准包", highlight: true },
  { usdt: 300, energy: 9_999_999, label: "无限包", highlight: false },
];

interface RechargeModalProps {
  walletAddress: string;
  onClose: () => void;
}

export function RechargeModal({ walletAddress, onClose }: RechargeModalProps) {
  const { t } = useLang();
  const [copied, setCopied] = useState<"addr" | "memo" | null>(null);
  const memo = walletAddress.slice(-8).toUpperCase();

  const copy = (text: string, which: "addr" | "memo") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">能量充值</h2>
              <p className="text-xs text-muted-foreground">Energy Recharge</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Energy depleted warning */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
            <Zap className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 leading-snug">
              能量不足，无法发帖。请充值能量继续发布。
            </p>
          </div>

          {/* Plans */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">充值套餐</p>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map(plan => (
                <div key={plan.usdt}
                  className={`rounded-xl p-3 text-center border-2 transition-colors ${
                    plan.highlight
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "border-border bg-muted/30"
                  }`}
                >
                  {plan.highlight && (
                    <div className="text-[9px] font-bold text-amber-600 uppercase mb-1 tracking-wider">推荐</div>
                  )}
                  <div className="text-lg font-extrabold text-foreground">{plan.usdt}</div>
                  <div className="text-[10px] text-muted-foreground">USDT</div>
                  <div className="mt-1.5 text-sm font-bold text-amber-500 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    {plan.energy >= 9_000_000 ? "∞" : plan.energy.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">能量</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment address */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">官方收款地址 (EVM)</p>
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2.5">
              <code className="text-xs font-mono text-foreground flex-1 truncate select-all">{PAYMENT_ADDRESS}</code>
              <button onClick={() => copy(PAYMENT_ADDRESS, "addr")}
                className="shrink-0 p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground">
                {copied === "addr" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Memo instruction */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">转账备注 (Memo)</p>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-2">
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-snug">
                转账时必须在备注/Memo中填写您的钱包地址后8位，用于自动匹配充值：
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg px-3 py-1.5 select-all">
                  {memo}
                </code>
                <button onClick={() => copy(memo, "memo")}
                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-blue-600">
                  {copied === "memo" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Auto credit note */}
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            系统通过链上监听自动到账 · 转账后刷新页面即可查看能量余额
          </p>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-sm font-semibold transition-colors">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
