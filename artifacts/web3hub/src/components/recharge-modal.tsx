import { useState } from "react";
import { X, Copy, Check, Zap } from "lucide-react";

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
  const [copied, setCopied] = useState<"addr" | "memo" | null>(null);
  const memo = walletAddress.slice(-8).toUpperCase();

  const copy = (text: string, which: "addr" | "memo") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: "auto" }}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={onClose} />

      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#0A0C14", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#10131f" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.2)" }}>
              <Zap className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "#ffffff" }}>能量充值</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Energy Recharge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Energy depleted warning */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} />
            <p className="text-sm leading-snug" style={{ color: "#fca5a5" }}>
              能量不足，无法发帖。请充值能量继续发布。
            </p>
          </div>

          {/* Plans */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>充值套餐</p>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map(plan => (
                <div
                  key={plan.usdt}
                  className="rounded-xl p-3 text-center transition-colors"
                  style={plan.highlight
                    ? { border: "2px solid #f59e0b", backgroundColor: "rgba(245,158,11,0.12)" }
                    : { border: "2px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)" }
                  }
                >
                  {plan.highlight && (
                    <div className="text-[9px] font-bold uppercase mb-1 tracking-wider" style={{ color: "#f59e0b" }}>推荐</div>
                  )}
                  <div className="text-lg font-extrabold" style={{ color: "#ffffff" }}>{plan.usdt}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>USDT</div>
                  <div className="mt-1.5 text-sm font-bold flex items-center justify-center gap-1" style={{ color: "#f59e0b" }}>
                    <Zap className="w-3 h-3" />
                    {plan.energy >= 9_000_000 ? "∞" : plan.energy.toLocaleString()}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>能量</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment address */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>官方收款地址 (EVM)</p>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <code className="text-xs font-mono flex-1 truncate select-all" style={{ color: "rgba(255,255,255,0.85)" }}>
                {PAYMENT_ADDRESS}
              </code>
              <button
                onClick={() => copy(PAYMENT_ADDRESS, "addr")}
                className="shrink-0 p-1.5 rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {copied === "addr" ? <Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Memo instruction */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>转账备注 (Memo)</p>
            <div
              className="p-3 rounded-xl space-y-2"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}
            >
              <p className="text-xs leading-snug" style={{ color: "#93c5fd" }}>
                转账时必须在备注/Memo中填写您的钱包地址后8位，用于自动匹配充值：
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 text-sm font-mono font-bold rounded-lg px-3 py-1.5 select-all"
                  style={{ color: "#bfdbfe", backgroundColor: "rgba(59,130,246,0.15)" }}
                >
                  {memo}
                </code>
                <button
                  onClick={() => copy(memo, "memo")}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "#60a5fa" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {copied === "memo" ? <Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Auto credit note */}
          <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
            系统通过链上监听自动到账 · 转账后刷新页面即可查看能量余额
          </p>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
