import { useState, useEffect, useRef } from "react";

/* ── Fonts ── */
const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
);

/* ── Design tokens ── */
const T = {
  cream: "#FAF7F2",
  paper: "#F3EDE3",
  sand: "#E8DDD0",
  bark: "#C4A882",
  soil: "#6B4E35",
  leaf: "#3A6644",
  leafLight: "#D4E8D8",
  leafMid: "#7DAA85",
  peach: "#E8876A",
  peachLight: "#FAEAE4",
  amber: "#D4922A",
  amberLight: "#FDF2DC",
  red: "#C94040",
  redLight: "#FAEBEB",
  ink: "#1E1A14",
  inkMid: "#5C5347",
  inkLight: "#9E9589",
  white: "#FFFFFF",
};

/* ── Fake DB ── */
const DB = { users: [], households: [] };

/* ── Sample items ── */
const SAMPLE_ITEMS = [
  { id: 1, name: "Whole Milk", owner: "You", category: "Dairy", expiresIn: 2, status: "private", bounty: null, emoji: "🥛", cost: 4.99 },
  { id: 2, name: "Greek Yogurt", owner: "Jamie", category: "Dairy", expiresIn: 5, status: "shared", bounty: null, emoji: "🫙", cost: 3.49 },
  { id: 3, name: "Baby Spinach", owner: "You", category: "Produce", expiresIn: 1, status: "fairgame", bounty: 10, emoji: "🥬", cost: 2.99 },
  { id: 4, name: "Chicken Thighs", owner: "Riley", category: "Meat", expiresIn: 1, status: "private", bounty: null, emoji: "🍗", cost: 8.50 },
  { id: 5, name: "Strawberries", owner: "Jamie", category: "Produce", expiresIn: 3, status: "fairgame", bounty: 5, emoji: "🍓", cost: 3.99 },
  { id: 6, name: "Cheddar Block", owner: "Riley", category: "Dairy", expiresIn: 12, status: "shared", bounty: null, emoji: "🧀", cost: 5.49 },
  { id: 7, name: "Eggs (dozen)", owner: "You", category: "Eggs", expiresIn: 18, status: "shared", bounty: null, emoji: "🥚", cost: 4.29 },
  { id: 8, name: "Leftover Pasta", owner: "Jamie", category: "Leftovers", expiresIn: 0, status: "fairgame", bounty: 15, emoji: "🍝", cost: 0 },
  { id: 9, name: "Orange Juice", owner: "Riley", category: "Beverage", expiresIn: 4, status: "private", bounty: null, emoji: "🍊", cost: 3.79 },
  { id: 10, name: "Sourdough Loaf", owner: "You", category: "Bread", expiresIn: 6, status: "shared", bounty: null, emoji: "🍞", cost: 6.00 },
];

const ROOMMATE_COLORS = { "You": T.leaf, "Jamie": T.peach, "Riley": T.amber };
const STATUS_CFG = {
  private: { label: "Private", icon: "🔴", color: T.red, bg: T.redLight, border: "#F5C6C6" },
  fairgame: { label: "Fair Game", icon: "🟡", color: T.amber, bg: T.amberLight, border: "#F5DFA6" },
  shared: { label: "Shared", icon: "🔵", color: T.leaf, bg: T.leafLight, border: "#B8D9BE" },
};

function urgency(d) {
  if (d <= 0) return { bg: T.redLight, accent: T.red, label: "Expired", pill: "#C94040", pillText: "#fff" };
  if (d === 1) return { bg: "#FEF0E8", accent: T.peach, label: "1 day", pill: T.peach, pillText: "#fff" };
  if (d <= 3) return { bg: T.amberLight, accent: T.amber, label: `${d}d`, pill: T.amber, pillText: "#fff" };
  if (d <= 7) return { bg: "#EEF6F0", accent: T.leafMid, label: `${d}d`, pill: T.leafMid, pillText: "#fff" };
  return { bg: T.paper, accent: T.bark, label: `${d}d`, pill: T.sand, pillText: T.inkMid };
}

/* ══════════════════════════════════════════
   AUTH SCREENS
══════════════════════════════════════════ */
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("landing"); // landing | login | signup | household
  const [form, setForm] = useState({ name: "", email: "", password: "", householdName: "", householdCode: "", joinMode: "create" });
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [animIn, setAnimIn] = useState(true);

  useEffect(() => { setAnimIn(true); }, [mode]);

  function f(key, val) { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: null })); }

  function validate(fields) {
    const e = {};
    fields.forEach(k => {
      if (!form[k]?.trim()) e[k] = "Required";
      if (k === "email" && form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
      if (k === "password" && form.password && form.password.length < 6) e.password = "At least 6 characters";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSignup() {
    if (!validate(["name", "email", "password"])) return;
    const newUser = { id: Date.now(), name: form.name, email: form.email, password: form.password, points: 0 };
    DB.users.push(newUser);
    setUser(newUser);
    setMode("household");
  }

  function handleLogin() {
    if (!validate(["email", "password"])) return;
    const found = DB.users.find(u => u.email === form.email && u.password === form.password);
    if (!found) { setErrors({ email: "No account found with these credentials" }); return; }
    const hh = DB.households.find(h => h.members.includes(found.id));
    onAuth(found, hh || null);
  }

  function handleHousehold() {
    if (form.joinMode === "create") {
      if (!validate(["householdName"])) return;
      const hh = { id: Date.now(), name: form.householdName, code: Math.random().toString(36).slice(2, 8).toUpperCase(), members: [user.id] };
      DB.households.push(hh);
      onAuth(user, hh);
    } else {
      if (!validate(["householdCode"])) return;
      const hh = DB.households.find(h => h.code === form.householdCode.toUpperCase());
      if (!hh) { setErrors({ householdCode: "Household not found" }); return; }
      hh.members.push(user.id);
      onAuth(user, hh);
    }
  }

  const inp = (key, placeholder, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <input
        type={type} value={form[key]} onChange={e => f(key, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", background: errors[key] ? T.redLight : T.white,
          border: `1.5px solid ${errors[key] ? T.red : T.sand}`, borderRadius: 12,
          padding: "13px 16px", fontSize: 15, fontFamily: "'DM Sans', sans-serif",
          color: T.ink, outline: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = T.leaf}
        onBlur={e => e.target.style.borderColor = errors[key] ? T.red : T.sand}
      />
      {errors[key] && <div style={{ color: T.red, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors[key]}</div>}
    </div>
  );

  /* LANDING */
  if (mode === "landing") return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex", flexDirection: "column" }}>
      <FontLink />
      {/* Nav */}
      <div style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size="md" />
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="ghost" onClick={() => setMode("login")}>Sign in</Btn>
          <Btn variant="primary" onClick={() => setMode("signup")}>Get started</Btn>
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 40px", textAlign: "center" }}>
        <div style={{ background: T.leafLight, color: T.leaf, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, marginBottom: 24, display: "inline-block" }}>
          🌿 Smart fridge. Happy household.
        </div>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 600, color: T.ink, margin: "0 0 20px", lineHeight: 1.1, maxWidth: 700 }}>
          Stop throwing<br /><em style={{ color: T.leaf }}>food</em> — and money — away.
        </h1>
        <p style={{ fontSize: 18, color: T.inkMid, maxWidth: 520, lineHeight: 1.7, margin: "0 0 36px" }}>
          Perishly helps shared households track what's in the fridge, split costs fairly, and actually use food before it expires.
        </p>
        <Btn variant="primary" size="lg" onClick={() => setMode("signup")}>Create your household →</Btn>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 48 }}>
          {["📸 Receipt scanning", "⏰ Expiry tracking", "🤝 Cost splitting", "✦ AI recipe ideas", "🎯 Bounty system", "✈ Going Home mode"].map(f => (
            <div key={f} style={{ background: T.paper, border: `1px solid ${T.sand}`, borderRadius: 20, padding: "8px 16px", fontSize: 14, color: T.inkMid }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Preview strip */}
      <div style={{ background: T.paper, borderTop: `1px solid ${T.sand}`, padding: "32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 800, margin: "0 auto" }}>
          {[
            { icon: "📉", title: "Average household saves", stat: "$480/yr", sub: "by cutting food waste" },
            { icon: "🏠", title: "Households track", stat: "12 items", sub: "on average per week" },
            { icon: "🤝", title: "Roommate disputes", stat: "↓ 90%", sub: "with transparent ledger" },
          ].map(c => (
            <div key={c.title} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 13, color: T.inkLight, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: T.ink }}>{c.stat}</div>
              <div style={{ fontSize: 13, color: T.inkLight }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* SIGNUP */
  if (mode === "signup") return (
    <AuthCard title="Create your account" sub="Join thousands of households saving food & money" onBack={() => setMode("landing")}>
      {inp("name", "Your full name")}
      {inp("email", "Email address", "email")}
      {inp("password", "Password (6+ characters)", "password")}
      <Btn variant="primary" fullWidth onClick={handleSignup}>Continue →</Btn>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: T.inkLight }}>
        Already have an account? <span style={{ color: T.leaf, cursor: "pointer", fontWeight: 600 }} onClick={() => setMode("login")}>Sign in</span>
      </div>
    </AuthCard>
  );

  /* LOGIN */
  if (mode === "login") return (
    <AuthCard title="Welcome back" sub="Sign in to your Perishly account" onBack={() => setMode("landing")}>
      {inp("email", "Email address", "email")}
      {inp("password", "Password", "password")}
      <Btn variant="primary" fullWidth onClick={handleLogin}>Sign in</Btn>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: T.inkLight }}>
        Don't have an account? <span style={{ color: T.leaf, cursor: "pointer", fontWeight: 600 }} onClick={() => setMode("signup")}>Sign up free</span>
      </div>
      <div style={{ background: T.leafLight, border: `1px solid ${T.sand}`, borderRadius: 10, padding: "10px 14px", marginTop: 16, fontSize: 13, color: T.leaf }}>
        <strong>Demo:</strong> Sign up first to create a test account, then log in.
      </div>
    </AuthCard>
  );

  /* HOUSEHOLD SETUP */
  if (mode === "household") return (
    <AuthCard title={`Welcome, ${user?.name?.split(" ")[0]}! 🌿`} sub="Set up or join your household">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["create", "join"].map(m => (
          <button key={m} onClick={() => f("joinMode", m)} style={{
            flex: 1, background: form.joinMode === m ? T.leaf : T.paper,
            border: `1.5px solid ${form.joinMode === m ? T.leaf : T.sand}`,
            color: form.joinMode === m ? "#fff" : T.inkMid,
            borderRadius: 10, padding: "10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600, fontSize: 14, transition: "all 0.2s"
          }}>{m === "create" ? "🏠 Create household" : "🔗 Join existing"}</button>
        ))}
      </div>
      {form.joinMode === "create"
        ? inp("householdName", "e.g. The Grove House, Apt 4B…")
        : inp("householdCode", "Enter household code (e.g. XK92BT)")}
      <Btn variant="primary" fullWidth onClick={handleHousehold}>
        {form.joinMode === "create" ? "Create household →" : "Join household →"}
      </Btn>
    </AuthCard>
  );
}

function AuthCard({ title, sub, children, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <FontLink />
      <div style={{ width: "100%", maxWidth: 420 }}>
        {onBack && <div onClick={onBack} style={{ cursor: "pointer", color: T.inkLight, fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>← Back</div>}
        <div style={{ marginBottom: 24 }}>
          <Logo size="md" />
        </div>
        <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 20, padding: "32px 32px" }}>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600, color: T.ink, margin: "0 0 6px" }}>{title}</h2>
          <p style={{ color: T.inkLight, fontSize: 14, margin: "0 0 28px" }}>{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
function App({ user, household }) {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [view, setView] = useState("dashboard");
  const [goingHome, setGoingHome] = useState(false);
  const [ariaOpen, setAriaOpen] = useState(false);
  const [ariaMessages, setAriaMessages] = useState([]);
  const [ariaInput, setAriaInput] = useState("");
  const [ariaLoading, setAriaLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", expiresIn: 5, status: "private" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [points, setPoints] = useState({ "You": 120, "Jamie": 85, "Riley": 200 });
  const chatRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [ariaMessages]);

  const userName = user?.name?.split(" ")[0] || "You";
  const redZone = items.filter(i => i.expiresIn <= 1);
  const filtered = items.filter(i => filterStatus === "all" || i.status === filterStatus);

  function claimBounty(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, bounty: null } : i));
    setPoints(prev => ({ ...prev, "You": prev["You"] + 15 }));
  }

  function toggleStatus(id, s) { setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i)); }

  function addItem() {
    if (!newItem.name.trim()) return;
    setItems(prev => [...prev, { id: Date.now(), name: newItem.name, owner: "You", category: "Other", expiresIn: parseInt(newItem.expiresIn), status: newItem.status, bounty: null, emoji: "📦", cost: 0 }]);
    setNewItem({ name: "", expiresIn: 5, status: "private" });
    setAddOpen(false);
  }

  function toggleGoingHome() {
    const next = !goingHome;
    setGoingHome(next);
    setItems(prev => prev.map(i => i.owner === "You" && i.status === "private" ? { ...i, status: next ? "fairgame" : "private" } : i));
  }

  async function sendAria() {
    if (!ariaInput.trim()) return;
    const msg = ariaInput.trim();
    setAriaInput("");
    setAriaMessages(prev => [...prev, { role: "user", content: msg }]);
    setAriaLoading(true);
    const expiring = items.filter(i => i.expiresIn <= 3).map(i => `${i.name} (${i.expiresIn <= 0 ? "expired" : i.expiresIn + "d left"})`).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are Aria, Perishly's warm AI assistant. Help reduce food waste with practical, friendly advice. Expiring items: ${expiring || "none urgent"}. Keep replies under 90 words, conversational and actionable.`,
          messages: [...ariaMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: msg }]
        })
      });
      const data = await res.json();
      setAriaMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "Hmm, trouble connecting — try again!" }]);
    } catch { setAriaMessages(prev => [...prev, { role: "assistant", content: "Network hiccup! Try again in a moment." }]); }
    setAriaLoading(false);
  }

  const wasteReport = { "You": 12.40, "Jamie": 8.20, "Riley": 19.80 };
  const totalWaste = 40.40;

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: "'DM Sans', sans-serif", color: T.ink }}>
      <FontLink />

      {/* Sidebar */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 220, background: T.white, borderRight: `1px solid ${T.sand}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
          <div style={{ padding: "24px 20px 16px" }}>
            <Logo size="sm" />
            <div style={{ background: T.leafLight, borderRadius: 10, padding: "10px 12px", marginTop: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: T.leaf }}>{household?.name || "Your Household"}</div>
              <div style={{ color: T.leafMid, marginTop: 2 }}>Code: <strong>{household?.code || "—"}</strong></div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "8px 12px", flex: 1 }}>
            {[
              { id: "dashboard", icon: "◈", label: "Dashboard" },
              { id: "ledger", icon: "☰", label: "Ledger" },
              { id: "bounty", icon: "◎", label: "Bounty Board" },
              { id: "report", icon: "◷", label: "Waste Report" },
            ].map(n => (
              <button key={n.id} onClick={() => setView(n.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: view === n.id ? T.leafLight : "transparent",
                border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                color: view === n.id ? T.leaf : T.inkMid, fontFamily: "inherit",
                fontWeight: view === n.id ? 600 : 400, fontSize: 15, marginBottom: 2, textAlign: "left",
                transition: "all 0.15s"
              }}>
                <span style={{ fontSize: 16, opacity: 0.8 }}>{n.icon}</span> {n.label}
              </button>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.sand}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.leafLight, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lora', serif", fontWeight: 600, color: T.leaf, fontSize: 16 }}>
                {userName[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{userName}</div>
                <div style={{ fontSize: 12, color: T.inkLight }}>{points["You"]} karma pts</div>
              </div>
            </div>
            <button onClick={toggleGoingHome} style={{
              width: "100%", background: goingHome ? T.amber : T.paper, border: `1px solid ${goingHome ? T.amber : T.sand}`,
              borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
              fontWeight: 600, fontSize: 13, color: goingHome ? T.white : T.inkMid, transition: "all 0.2s"
            }}>
              {goingHome ? "✈ Going Home: ON" : "✈ Going Home Mode"}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: "auto" }}>
          {/* Topbar */}
          <div style={{ background: T.white, borderBottom: `1px solid ${T.sand}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
            <div>
              <div style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: T.ink }}>
                {view === "dashboard" && "Dashboard"}
                {view === "ledger" && "Fridge Ledger"}
                {view === "bounty" && "Bounty Board"}
                {view === "report" && "Waste Report"}
              </div>
              <div style={{ fontSize: 13, color: T.inkLight }}>
                {view === "dashboard" && `${items.length} items · ${redZone.length} in red zone`}
                {view === "ledger" && "Track & tag every item"}
                {view === "bounty" && "Earn karma for saving food"}
                {view === "report" && "March 2026 · Household audit"}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            {redZone.length > 0 && (
              <div style={{ background: T.redLight, border: `1px solid #F5C6C6`, borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.red, fontWeight: 600 }}>
                🚨 {redZone.length} expiring today
              </div>
            )}
            <button onClick={() => setAriaOpen(true)} style={{
              background: T.leaf, border: "none", color: T.white, borderRadius: 20,
              padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14,
              display: "flex", alignItems: "center", gap: 7
            }}>✦ Ask Aria</button>
          </div>

          <div style={{ padding: "28px" }}>

            {/* ── DASHBOARD ── */}
            {view === "dashboard" && (
              <div>
                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
                  {[
                    { label: "Total Items", value: items.length, color: T.leaf, icon: "📦" },
                    { label: "Red Zone", value: redZone.length, color: T.red, icon: "🚨" },
                    { label: "Fair Game", value: items.filter(i => i.status === "fairgame").length, color: T.amber, icon: "🟡" },
                    { label: "Shared", value: items.filter(i => i.status === "shared").length, color: "#3b82f6", icon: "🔵" },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16, padding: "20px 22px" }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Lora', serif", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 13, color: T.inkLight, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Rot Heatmap */}
                <SectionHead title="Freshness map" sub="Sorted by urgency — act on red first" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
                  {[...items].sort((a, b) => a.expiresIn - b.expiresIn).map(item => {
                    const u = urgency(item.expiresIn);
                    const sm = STATUS_CFG[item.status];
                    return (
                      <div key={item.id} style={{ background: u.bg, borderRadius: 14, padding: "14px 14px 12px", border: `1.5px solid ${u.accent}22`, position: "relative", cursor: "default" }}>
                        <div style={{ fontSize: 26, marginBottom: 6 }}>{item.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, lineHeight: 1.3, marginBottom: 4 }}>{item.name}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ background: u.pill, color: u.pillText, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{u.label}</span>
                          <span style={{ fontSize: 10, color: sm.color }}>{sm.icon}</span>
                        </div>
                        {item.bounty && <div style={{ position: "absolute", top: 10, right: 10, background: T.amberLight, color: T.amber, borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>🎯{item.bounty}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Red zone callout */}
                {redZone.length > 0 && (
                  <div style={{ background: T.redLight, border: `1.5px solid #F5C6C6`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: T.red, fontSize: 16 }}>🚨 Use today or lose it</div>
                        <div style={{ fontSize: 13, color: T.inkLight, marginTop: 2 }}>{redZone.length} item{redZone.length > 1 ? "s" : ""} expiring within 24 hours</div>
                      </div>
                      <button onClick={() => setAriaOpen(true)} style={{ background: T.leaf, border: "none", color: T.white, borderRadius: 20, padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>✦ Get recipes</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {redZone.map(i => (
                        <div key={i.id} style={{ background: T.white, border: "1px solid #F5C6C6", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{i.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                            <div style={{ fontSize: 11, color: T.inkLight }}>{i.owner} · {i.expiresIn <= 0 ? "Expired" : "Expires today"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── LEDGER ── */}
            {view === "ledger" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  {["all", "private", "fairgame", "shared"].map(s => (
                    <FilterPill key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)}>
                      {s === "all" ? "All items" : `${STATUS_CFG[s].icon} ${STATUS_CFG[s].label}`}
                    </FilterPill>
                  ))}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setAddOpen(!addOpen)} style={{
                    background: T.leaf, border: "none", color: T.white, borderRadius: 10,
                    padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14
                  }}>+ Add item</button>
                </div>

                {addOpen && (
                  <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16, padding: "22px 22px", marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 17, marginBottom: 16, color: T.ink }}>Add new item</div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                      <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" style={inputStyle} />
                      <input type="number" value={newItem.expiresIn} onChange={e => setNewItem(p => ({ ...p, expiresIn: e.target.value }))} placeholder="Days left" style={inputStyle} />
                      <select value={newItem.status} onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                        <option value="private">🔴 Private</option>
                        <option value="fairgame">🟡 Fair Game</option>
                        <option value="shared">🔵 Shared</option>
                      </select>
                      <button onClick={addItem} style={{ background: T.leaf, border: "none", color: T.white, borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, height: 46 }}>Add</button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filtered.map(item => {
                    const u = urgency(item.expiresIn);
                    const sm = STATUS_CFG[item.status];
                    const ownerColor = ROOMMATE_COLORS[item.owner] || T.inkMid;
                    return (
                      <div key={item.id} style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, borderLeft: `4px solid ${u.accent}` }}>
                        <span style={{ fontSize: 26 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: T.ink }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: T.inkLight, marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: ownerColor, fontWeight: 600 }}>{item.owner}</span>
                            <span>·</span>
                            <span>{item.category}</span>
                            {item.cost > 0 && <><span>·</span><span>${item.cost.toFixed(2)}</span></>}
                          </div>
                        </div>
                        <div style={{ background: u.pill, color: u.pillText, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, minWidth: 60, textAlign: "center" }}>{u.label}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["private", "fairgame", "shared"].map(s => (
                            <button key={s} onClick={() => toggleStatus(item.id, s)} style={{
                              background: item.status === s ? STATUS_CFG[s].bg : "transparent",
                              border: `1px solid ${item.status === s ? STATUS_CFG[s].border : T.sand}`,
                              color: item.status === s ? STATUS_CFG[s].color : T.inkLight,
                              borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 11,
                            }}>{STATUS_CFG[s].icon} {STATUS_CFG[s].label}</button>
                          ))}
                        </div>
                        {item.bounty && (
                          <button onClick={() => claimBounty(item.id)} style={{ background: T.amberLight, border: `1px solid ${T.bark}`, color: T.amber, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>🎯 {item.bounty}pt</button>
                        )}
                      </div>
                    );
                  })}
                  {filtered.length === 0 && <div style={{ color: T.inkLight, padding: "32px 0", textAlign: "center" }}>No items found.</div>}
                </div>
              </div>
            )}

            {/* ── BOUNTY ── */}
            {view === "bounty" && (
              <div>
                <SectionHead title="Karma leaderboard" sub="Earn points by saving food from the bin" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
                  {["You", "Jamie", "Riley"].sort((a, b) => points[b] - points[a]).map((rm, i) => (
                    <div key={rm} style={{ background: T.white, border: `1.5px solid ${i === 0 ? T.amber : T.sand}`, borderRadius: 18, padding: "22px 24px", textAlign: "center", position: "relative" }}>
                      {i === 0 && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: T.amber, color: T.white, borderRadius: 20, padding: "3px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>👑 Top Saver</div>}
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: (ROOMMATE_COLORS[rm] || T.leaf) + "22", border: `2px solid ${ROOMMATE_COLORS[rm] || T.leaf}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 20, color: ROOMMATE_COLORS[rm] || T.leaf }}>{rm[0]}</div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{rm}</div>
                      <div style={{ fontFamily: "'Lora', serif", fontSize: 36, fontWeight: 600, color: i === 0 ? T.amber : T.leaf, margin: "4px 0 2px" }}>{points[rm]}</div>
                      <div style={{ fontSize: 12, color: T.inkLight }}>karma points</div>
                    </div>
                  ))}
                </div>

                <SectionHead title="Active bounties" sub="Finish these items to earn points" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {items.filter(i => i.bounty).map(item => {
                    const u = urgency(item.expiresIn);
                    return (
                      <div key={item.id} style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16, padding: "18px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 28 }}>{item.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: u.accent, fontWeight: 600 }}>{u.label} left</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ background: T.amberLight, color: T.amber, borderRadius: 10, padding: "5px 12px", fontWeight: 700, fontSize: 16 }}>🎯 {item.bounty}pt</div>
                          <button onClick={() => claimBounty(item.id)} style={{ background: T.leaf, border: "none", color: T.white, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13 }}>Claim</button>
                        </div>
                        <div style={{ fontSize: 11, color: T.inkLight, marginTop: 10 }}>Posted by {item.owner}</div>
                      </div>
                    );
                  })}
                  {items.filter(i => i.bounty).length === 0 && <div style={{ color: T.inkLight, fontSize: 14, padding: "16px 0" }}>No active bounties right now.</div>}
                </div>
              </div>
            )}

            {/* ── REPORT ── */}
            {view === "report" && (
              <div>
                <div style={{ background: T.redLight, border: `1px solid #F5C6C6`, borderRadius: 18, padding: "24px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 13, color: T.red, fontWeight: 700, marginBottom: 4 }}>HOUSEHOLD FOOD WASTE — MARCH 2026</div>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 52, fontWeight: 600, color: T.red }}>${totalWaste.toFixed(2)}</div>
                    <div style={{ fontSize: 14, color: T.inkMid, marginTop: 4 }}>thrown away this month</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: T.inkLight }}>Annualised</div>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: T.amber }}>${(totalWaste * 12).toFixed(0)}/yr</div>
                    <div style={{ fontSize: 12, color: T.inkLight, marginTop: 4 }}>That's a weekend away ✈</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
                  {["You", "Jamie", "Riley"].map(rm => {
                    const pct = (wasteReport[rm] / totalWaste) * 100;
                    return (
                      <div key={rm} style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16, padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: (ROOMMATE_COLORS[rm] || T.leaf) + "22", border: `2px solid ${ROOMMATE_COLORS[rm] || T.leaf}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lora', serif", fontWeight: 600, color: ROOMMATE_COLORS[rm] || T.leaf }}>{rm[0]}</div>
                          <div style={{ fontWeight: 600 }}>{rm}</div>
                        </div>
                        <div style={{ fontFamily: "'Lora', serif", fontSize: 30, fontWeight: 600, color: T.red }}>${wasteReport[rm].toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: T.inkLight, margin: "6px 0 10px" }}>wasted this month</div>
                        <div style={{ background: T.sand, borderRadius: 8, height: 6 }}>
                          <div style={{ background: ROOMMATE_COLORS[rm] || T.leaf, height: 6, borderRadius: 8, width: `${pct}%`, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ fontSize: 12, color: T.inkLight, marginTop: 6 }}>{pct.toFixed(0)}% of total</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: T.leafLight, border: `1px solid ${T.sand}`, borderRadius: 16, padding: "22px 24px" }}>
                  <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 18, color: T.leaf, marginBottom: 16 }}>✦ Aria's recommendations</div>
                  {["Spinach was wasted twice — consider halving your purchase quantity next shop.", "Shared eggs (9 uses) are a great candidate for formal expense splitting.", "Enable Going Home mode before trips to prevent private items expiring.", "Milk is high-volume — suggest a bulk 2-gallon split to save ~$4/month."].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 14, color: T.inkMid, alignItems: "flex-start" }}>
                      <span style={{ color: T.leaf, fontWeight: 700, fontFamily: "'Lora', serif", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>0{i + 1}</span>
                      <span style={{ lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Aria Panel */}
      {ariaOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 360, background: T.white, borderLeft: `1px solid ${T.sand}`, display: "flex", flexDirection: "column", zIndex: 100, boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.sand}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.leafLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 16 }}>Aria</div>
              <div style={{ fontSize: 12, color: T.leaf }}>● Live · {redZone.length} red zone item{redZone.length !== 1 ? "s" : ""}</div>
            </div>
            <button onClick={() => setAriaOpen(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: T.inkLight, cursor: "pointer", fontSize: 22 }}>×</button>
          </div>

          {ariaMessages.length === 0 && (
            <div style={{ padding: "18px 18px 0" }}>
              <div style={{ fontSize: 12, color: T.inkLight, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>QUICK PROMPTS</div>
              {["What can I cook with what's expiring?", "Who's wasting the most food?", "Suggest a recipe using spinach & eggs", "What should I restock this week?"].map(q => (
                <button key={q} onClick={() => setAriaInput(q)} style={{ display: "block", width: "100%", textAlign: "left", background: T.paper, border: `1px solid ${T.sand}`, color: T.inkMid, borderRadius: 10, padding: "10px 14px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{q}</button>
              ))}
            </div>
          )}

          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {ariaMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.leafLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, color: T.leaf }}>✦</div>}
                <div style={{ maxWidth: "80%", background: m.role === "user" ? T.leaf : T.paper, border: m.role === "assistant" ? `1px solid ${T.sand}` : "none", borderRadius: 14, padding: "10px 14px", fontSize: 14, lineHeight: 1.55, color: m.role === "user" ? T.white : T.ink }}>
                  {m.content}
                </div>
              </div>
            ))}
            {ariaLoading && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.leafLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: T.leaf }}>✦</div>
                <div style={{ background: T.paper, border: `1px solid ${T.sand}`, borderRadius: 14, padding: "10px 14px", color: T.inkLight, fontSize: 14 }}>Thinking…</div>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.sand}`, display: "flex", gap: 8 }}>
            <input value={ariaInput} onChange={e => setAriaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAria()} placeholder="Ask Aria anything…" style={{ flex: 1, background: T.paper, border: `1px solid ${T.sand}`, borderRadius: 12, padding: "10px 14px", color: T.ink, fontFamily: "inherit", fontSize: 14, outline: "none" }} />
            <button onClick={sendAria} style={{ background: T.leaf, border: "none", borderRadius: 12, padding: "10px 16px", color: T.white, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared components ── */
const inputStyle = { background: T.white, border: `1.5px solid ${T.sand}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: "none", width: "100%", boxSizing: "border-box" };

function Logo({ size = "md" }) {
  const s = size === "lg" ? 32 : size === "md" ? 26 : 22;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: s + 6, height: s + 6, borderRadius: 8, background: T.leaf, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s - 6 }}>🌿</div>
      <span style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: s, color: T.ink, letterSpacing: "-0.01em" }}>Perishly</span>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", fullWidth }) {
  const base = { border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderRadius: 10, transition: "all 0.15s", display: "inline-flex", alignItems: "center", justifyContent: "center", width: fullWidth ? "100%" : undefined };
  const variants = {
    primary: { background: T.leaf, color: T.white, fontSize: size === "lg" ? 17 : 15, padding: size === "lg" ? "14px 28px" : "10px 20px" },
    ghost: { background: "transparent", color: T.inkMid, fontSize: 15, padding: "10px 16px", border: `1px solid ${T.sand}` },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick}>{children}</button>;
}

function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 20, color: T.ink }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.inkLight, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function FilterPill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? T.leaf : T.white, border: `1px solid ${active ? T.leaf : T.sand}`, color: active ? T.white : T.inkMid, borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, transition: "all 0.15s" }}>{children}</button>
  );
}

/* ── Root ── */
export default function Root() {
  const [session, setSession] = useState(null);
  function onAuth(user, household) { setSession({ user, household }); }
  if (!session) return <AuthScreen onAuth={onAuth} />;
  return <App user={session.user} household={session.household} />;
}
