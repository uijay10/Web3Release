import { useState, useEffect } from "react";
import { useWeb3Auth } from "@/lib/web3";
import { isAdmin } from "@/lib/admin";
import { useLang } from "@/lib/i18n";
import { useLocation } from "wouter";
import {
  Users, ClipboardList, Zap, Star, Ban, Download,
  CheckCircle, XCircle, ChevronDown, Pin, RefreshCw
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/[^/]*$/, "") + "/../api";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const apiBase = getApiBase();

async function adminFetch(path: string, wallet: string, opts: RequestInit = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const url = path.startsWith("GET") || !opts.method || opts.method === "GET"
    ? `${apiBase}/admin${path}${sep}adminWallet=${encodeURIComponent(wallet)}`
    : `${apiBase}/admin${path}`;

  const isGet = !opts.method || opts.method === "GET";
  const finalUrl = isGet
    ? `${apiBase}/admin${path}${sep}adminWallet=${encodeURIComponent(wallet)}`
    : `${apiBase}/admin${path}`;

  return fetch(finalUrl, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify({ ...(JSON.parse(opts.body as string) ?? {}), adminWallet: wallet })) : undefined,
  });
}

type Tab = "applications" | "users" | "points";

export default function AdminPage() {
  const { address, isConnected } = useWeb3Auth();
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editUser, setEditUser] = useState<string | null>(null);
  const [editOp, setEditOp] = useState<"set"|"add"|"sub"|"clear">("add");
  const [editVal, setEditVal] = useState("");
  const [editField, setEditField] = useState<"energy"|"points"|"pinCount">("points");

  const admin = isAdmin(address);

  useEffect(() => {
    if (!admin && isConnected !== undefined && !isConnected) setLocation("/");
    if (!admin && address) setLocation("/");
  }, [admin, address, isConnected]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const loadApps = async () => {
    if (!address) return;
    setLoading(true);
    const r = await fetch(`${apiBase}/admin/applications?adminWallet=${encodeURIComponent(address)}&status=${statusFilter}`);
    const d = await r.json();
    setApplications(d.applications ?? []);
    setLoading(false);
  };

  const loadUsers = async () => {
    if (!address) return;
    setLoading(true);
    const r = await fetch(`${apiBase}/admin/users?adminWallet=${encodeURIComponent(address)}&limit=100`);
    const d = await r.json();
    setUsers(d.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!admin || !address) return;
    if (tab === "applications") loadApps();
    else if (tab === "users" || tab === "points") loadUsers();
  }, [tab, statusFilter, admin, address]);

  const approve = async (id: number) => {
    if (!address) return;
    await fetch(`${apiBase}/admin/applications/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address }),
    });
    flash("✓ Approved"); loadApps();
  };

  const reject = async (id: number) => {
    if (!address) return;
    await fetch(`${apiBase}/admin/applications/${id}/reject`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address }),
    });
    flash("✓ Rejected"); loadApps();
  };

  const batchAction = async (action: "approve" | "reject") => {
    if (!address || selected.size === 0) return;
    await fetch(`${apiBase}/admin/applications/batch`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address, ids: Array.from(selected), action }),
    });
    flash(`✓ Batch ${action}`); setSelected(new Set()); loadApps();
  };

  const banUser = async (wallet: string, ban: boolean) => {
    if (!address) return;
    await fetch(`${apiBase}/admin/users/${wallet}/ban`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address, ban }),
    });
    flash(ban ? "✓ User banned" : "✓ User unbanned"); loadUsers();
  };

  const applyEdit = async () => {
    if (!address || !editUser) return;
    const endpoint = editField === "pinCount" ? "pin-count" : editField;
    await fetch(`${apiBase}/admin/users/${editUser}/${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address, op: editOp, value: Number(editVal) }),
    });
    flash(`✓ Updated ${editField}`); setEditUser(null); loadUsers();
  };

  const applyAllPoints = async (op: "add"|"sub"|"clear", val?: number) => {
    if (!address) return;
    await fetch(`${apiBase}/admin/users/all/points`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address, op, value: val }),
    });
    flash("✓ Applied to all users"); loadUsers();
  };

  const downloadCsv = (type: "points-summary" | "bills") => {
    if (!address) return;
    window.open(`${apiBase}/admin/${type}?adminWallet=${encodeURIComponent(address)}`, "_blank");
  };

  if (!admin) {
    return (
      <div className="py-32 text-center">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Admin wallets only.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.wallet.includes(userSearch.toLowerCase()) || (u.username ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const btnCls = "px-4 py-2 rounded-xl font-semibold text-sm transition-all";

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🛡️ Admin Panel</h1>
        {msg && <div className="px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">{msg}</div>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {(["applications","users","points"] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all ${tab === tb ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tb === "applications" ? <><ClipboardList className="w-4 h-4 inline mr-1" />Applications</>
             : tb === "users" ? <><Users className="w-4 h-4 inline mr-1" />Users</>
             : <><Star className="w-4 h-4 inline mr-1" />Points & Energy</>}
          </button>
        ))}
      </div>

      {/* Applications Tab */}
      {tab === "applications" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-border rounded-xl px-3 py-2 text-sm bg-background">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
            <button onClick={loadApps} className={`${btnCls} bg-muted hover:bg-muted/80`}><RefreshCw className="w-4 h-4 inline mr-1" />Refresh</button>
            {selected.size > 0 && (
              <>
                <button onClick={() => batchAction("approve")} className={`${btnCls} bg-green-500 text-white hover:bg-green-600`}><CheckCircle className="w-4 h-4 inline mr-1" />Approve {selected.size}</button>
                <button onClick={() => batchAction("reject")} className={`${btnCls} bg-red-500 text-white hover:bg-red-600`}><XCircle className="w-4 h-4 inline mr-1" />Reject {selected.size}</button>
              </>
            )}
          </div>

          {loading ? <div className="h-40 rounded-2xl bg-muted animate-pulse" /> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left w-8"><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(applications.map(a => a.id)) : new Set())} /></th>
                    <th className="p-3 text-left">Wallet</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Twitter</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {applications.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No applications</td></tr>
                  ) : applications.map(app => (
                    <tr key={app.id} className="hover:bg-muted/20">
                      <td className="p-3"><input type="checkbox" checked={selected.has(app.id)} onChange={e => {
                        const s = new Set(selected);
                        e.target.checked ? s.add(app.id) : s.delete(app.id);
                        setSelected(s);
                      }} /></td>
                      <td className="p-3 font-mono text-xs">{app.wallet.slice(0,8)}...{app.wallet.slice(-4)}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{app.type}</span></td>
                      <td className="p-3 text-xs">{app.twitter ?? "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${app.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : app.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"}`}>{app.status}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 flex gap-1">
                        {app.status === "pending" && (
                          <>
                            <button onClick={() => approve(app.id)} className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs hover:bg-green-200 transition-colors">✓</button>
                            <button onClick={() => reject(app.id)} className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs hover:bg-red-200 transition-colors">✗</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="Search wallet / username..." className="border border-border rounded-xl px-3 py-2 text-sm bg-background flex-1 max-w-xs" />
            <button onClick={loadUsers} className={`${btnCls} bg-muted hover:bg-muted/80`}><RefreshCw className="w-4 h-4 inline mr-1" />Refresh</button>
          </div>

          {editUser && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold">Edit: {editUser.slice(0,10)}...</h3>
              <div className="flex gap-2 flex-wrap">
                {(["energy","points","pinCount"] as const).map(f => (
                  <button key={f} onClick={() => setEditField(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${editField === f ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{f}</button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["set","add","sub","clear"] as const).map(o => (
                  <button key={o} onClick={() => setEditOp(o)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${editOp === o ? "bg-blue-500 text-white" : "bg-muted"}`}>{o}</button>
                ))}
              </div>
              {editOp !== "clear" && <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Value" className="border border-border rounded-xl px-3 py-2 text-sm bg-background w-32" />}
              <div className="flex gap-2">
                <button onClick={applyEdit} className={`${btnCls} bg-primary text-primary-foreground`}>Apply</button>
                <button onClick={() => setEditUser(null)} className={`${btnCls} bg-muted`}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="h-40 rounded-2xl bg-muted animate-pulse" /> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">Wallet</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-right">Points</th>
                    <th className="p-3 text-right">Energy</th>
                    <th className="p-3 text-right">Pins</th>
                    <th className="p-3 text-left">Space</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No users</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className={`hover:bg-muted/20 ${u.isBanned ? "opacity-50" : ""}`}>
                      <td className="p-3 font-mono text-xs">{u.wallet.slice(0,8)}...{u.wallet.slice(-4)}</td>
                      <td className="p-3 text-xs">{u.username ?? "-"}</td>
                      <td className="p-3 text-right font-semibold">{u.points.toLocaleString()}</td>
                      <td className="p-3 text-right">{u.energy.toLocaleString()}</td>
                      <td className="p-3 text-right">{u.pinCount ?? 0}</td>
                      <td className="p-3 text-xs">{u.spaceStatus ? <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{u.spaceType}</span> : "-"}</td>
                      <td className="p-3">
                        {u.isBanned ? <span className="text-xs text-red-500 font-semibold">Banned</span> : <span className="text-xs text-green-500">Active</span>}
                      </td>
                      <td className="p-3 flex gap-1.5">
                        <button onClick={() => { setEditUser(u.wallet); setEditField("points"); setEditOp("add"); setEditVal(""); }}
                          className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs hover:bg-blue-200 transition-colors">Edit</button>
                        <button onClick={() => banUser(u.wallet, !u.isBanned)}
                          className={`px-2 py-1 rounded-lg text-xs transition-colors ${u.isBanned ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200"}`}>
                          {u.isBanned ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Points & Energy Tab */}
      {tab === "points" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Bulk Points Operations</h3>
              <p className="text-sm text-muted-foreground">Apply points changes to ALL users at once.</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { const v = prompt("Add points to all users:"); if (v) applyAllPoints("add", Number(v)); }}
                  className={`${btnCls} bg-green-500 text-white hover:bg-green-600`}>+ Add to All</button>
                <button onClick={() => { const v = prompt("Subtract points from all users:"); if (v) applyAllPoints("sub", Number(v)); }}
                  className={`${btnCls} bg-orange-500 text-white hover:bg-orange-600`}>- Sub from All</button>
                <button onClick={() => { if (confirm("Clear ALL users' points?")) applyAllPoints("clear"); }}
                  className={`${btnCls} bg-red-500 text-white hover:bg-red-600`}>✗ Clear All</button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Download className="w-5 h-5 text-blue-500" />Export Data</h3>
              <p className="text-sm text-muted-foreground">Download CSV reports.</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => downloadCsv("points-summary")}
                  className={`${btnCls} bg-blue-500 text-white hover:bg-blue-600`}><Download className="w-4 h-4 inline mr-1" />Points Summary CSV</button>
                <button onClick={() => downloadCsv("bills")}
                  className={`${btnCls} bg-violet-500 text-white hover:bg-violet-600`}><Download className="w-4 h-4 inline mr-1" />Bills CSV</button>
              </div>
            </div>
          </div>

          {/* Summary table */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Points Summary</h3>
              <button onClick={loadUsers} className={`${btnCls} bg-muted hover:bg-muted/80 text-xs`}><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Refresh</button>
            </div>
            {loading ? <div className="h-40 rounded-xl bg-muted animate-pulse" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left">Wallet</th>
                      <th className="p-3 text-left">Username</th>
                      <th className="p-3 text-right">Points</th>
                      <th className="p-3 text-right">Energy</th>
                      <th className="p-3 text-right">PinCount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[...users].sort((a,b) => b.points - a.points).slice(0,50).map(u => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono text-xs">{u.wallet.slice(0,10)}...{u.wallet.slice(-4)}</td>
                        <td className="p-3 text-xs">{u.username ?? "-"}</td>
                        <td className="p-3 text-right font-bold">{u.points.toLocaleString()}</td>
                        <td className="p-3 text-right">{u.energy.toLocaleString()}</td>
                        <td className="p-3 text-right">{u.pinCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
