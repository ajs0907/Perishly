import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

// ── Design tokens ──
const T = {
  cream: "#FAF7F2", paper: "#F3EDE3", sand: "#E8DDD0", bark: "#C4A882",
  leaf: "#3A6644", leafLight: "#D4E8D8", leafMid: "#7DAA85",
  peach: "#E8876A", peachLight: "#FAEAE4",
  amber: "#D4922A", amberLight: "#FDF2DC",
  red: "#C94040", redLight: "#FAEBEB",
  ink: "#1E1A14", inkMid: "#5C5347", inkLight: "#9E9589", white: "#FFFFFF",
};

function urgency(d) {
  if (d <= 0) return { bg: T.redLight,   accent: T.red,     label: "Expired", pill: "#C94040", pillText: "#fff" };
  if (d === 1) return { bg: "#FEF0E8",   accent: T.peach,   label: "1 day",   pill: T.peach,   pillText: "#fff" };
  if (d <= 3)  return { bg: T.amberLight,accent: T.amber,   label: `${d}d`,   pill: T.amber,   pillText: "#fff" };
  if (d <= 7)  return { bg: "#EEF6F0",   accent: T.leafMid, label: `${d}d`,   pill: T.leafMid, pillText: "#fff" };
  return        { bg: T.paper,           accent: T.bark,    label: `${d}d`,   pill: T.sand,    pillText: T.inkMid };
}

// ── Shared UI ──
function Logo({ size = "md" }) {
  const s = size === "lg" ? 32 : size === "md" ? 26 : 22;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:s+6, height:s+6, borderRadius:8, background:T.leaf, display:"flex", alignItems:"center", justifyContent:"center", fontSize:s-6 }}>🌿</div>
      <span style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:s, color:T.ink, letterSpacing:"-0.01em" }}>Perishly</span>
    </div>
  );
}

function PrimaryBtn({ children, onClick, fullWidth, size="md" }) {
  const pad = size === "lg" ? "14px 28px" : "10px 20px";
  const fs  = size === "lg" ? 17 : 15;
  return (
    <button className="btn-primary" onClick={onClick} style={{
      background:T.leaf, color:T.white, border:"none", borderRadius:10, cursor:"pointer",
      fontWeight:600, fontSize:fs, padding:pad, width:fullWidth?"100%":undefined,
      display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s"
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, fullWidth }) {
  return (
    <button className="btn-ghost" onClick={onClick} style={{
      background:"transparent", color:T.inkMid, border:`1px solid ${T.sand}`,
      borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:15, padding:"10px 16px", transition:"background 0.15s", width: fullWidth ? "100%" : undefined
    }}>{children}</button>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:20, color:T.ink }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:T.inkLight, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Field({ value, onChange, placeholder, type="text", error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:"100%", background: error ? T.redLight : T.white,
          border:`1.5px solid ${error ? T.red : focused ? T.leaf : T.sand}`,
          borderRadius:12, padding:"13px 16px", fontSize:15, color:T.ink,
          outline:"none", transition:"border-color 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(58,102,68,0.1)" : "none"
        }}
      />
      {error && <div style={{ color:T.red, fontSize:12, marginTop:4, marginLeft:4 }}>{error}</div>}
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("landing"); // landing, household
  const [form, setForm] = useState({ householdName:"", householdCode:"", joinMode:"create" });
  const [errors, setErrors] = useState({});
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkHousehold(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkHousehold(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkHousehold(user) {
    const { data: memberData } = await supabase
      .from('household_members')
      .select('household_id, households(id, name, code)')
      .eq('user_id', user.id)
      .single();

    if (memberData && memberData.households) {
      onAuth(user, memberData.households);
    } else {
      setPendingUser(user);
      setMode("household");
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  async function handleEmailSignup() {
    if (!form.email || !form.password) return setErrors(p => ({ ...p, auth: "Email & password required" }));
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (error) setErrors(p => ({ ...p, auth: error.message }));
    else alert("Please check your email to confirm registration (if required), or you may be automatically signed in.");
  }

  async function handleEmailLogin() {
    if (!form.email || !form.password) return setErrors(p => ({ ...p, auth: "Email & password required" }));
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) setErrors(p => ({ ...p, auth: error.message }));
  }

  function f(key, val) {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: null }));
  }

  async function handleHousehold() {
    if (form.joinMode === "create") {
      if (!form.householdName.trim()) { setErrors({ householdName: "Required" }); return; }
      
      const code = Math.random().toString(36).slice(2,8).toUpperCase();
      const { data: hh, error: err1 } = await supabase
        .from('households')
        .insert({ name: form.householdName, code })
        .select()
        .single();
        
      if (err1) { alert("Error creating household: " + err1.message); return; }
      
      await supabase.from('household_members').insert({ household_id: hh.id, user_id: pendingUser.id });
      onAuth(pendingUser, hh);

    } else {
      if (!form.householdCode.trim()) { setErrors({ householdCode: "Required" }); return; }
      
      const { data: hh, error: err1 } = await supabase
        .from('households')
        .select()
        .eq('code', form.householdCode.toUpperCase())
        .single();
        
      if (!hh || err1) { setErrors({ householdCode: "Household not found" }); return; }
      
      await supabase.from('household_members').insert({ household_id: hh.id, user_id: pendingUser.id });
      onAuth(pendingUser, hh);
    }
  }

  if (mode === "landing") return (
    <div className="fade-in" style={{ minHeight:"100vh", background:T.cream, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"20px 40px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Logo size="md" />
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 24px 40px", textAlign:"center" }}>
        <div style={{ background:T.leafLight, color:T.leaf, borderRadius:20, padding:"6px 16px", fontSize:13, fontWeight:600, marginBottom:24 }}>
          🌿 Smart fridge. Happy household.
        </div>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:"clamp(38px,6vw,68px)", fontWeight:600, color:T.ink, margin:"0 0 20px", lineHeight:1.1, maxWidth:680 }}>
          Stop throwing <em style={{ color:T.leaf }}>food</em> — and money — away.
        </h1>
        <p style={{ fontSize:18, color:T.inkMid, maxWidth:500, lineHeight:1.7, margin:"0 0 36px" }}>
          Perishly helps shared households track what's in the fridge, split costs fairly, and actually use food before it expires.
        </p>
        
        <div style={{ background:T.white, padding:32, borderRadius:20, border:`1px solid ${T.sand}`, width:"100%", maxWidth:360, textAlign:"left" }}>
          <h2 style={{ fontSize:20, marginTop:0, marginBottom:16 }}>Get Started</h2>
          {errors.auth && <div style={{ color:T.red, fontSize:13, marginBottom:12 }}>{errors.auth}</div>}
          <Field value={form.email || ""} onChange={v => f("email",v)} placeholder="Email" type="email" />
          <Field value={form.password || ""} onChange={v => f("password",v)} placeholder="Password" type="password" />
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <PrimaryBtn fullWidth onClick={handleEmailLogin}>Log In</PrimaryBtn>
            <div style={{ flex:1, display:"flex" }}><GhostBtn fullWidth onClick={handleEmailSignup}>Register</GhostBtn></div>
          </div>
          <div style={{ margin:"20px 0", borderTop:`1px solid ${T.sand}`, position:"relative", textAlign:"center" }}>
            <span style={{ background:T.white, padding:"0 10px", position:"relative", top:-10, fontSize:13, color:T.inkLight }}>or</span>
          </div>
          <GhostBtn fullWidth onClick={handleGoogleLogin}>Continue with Google</GhostBtn>
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center", marginTop:48 }}>
          {["📸 Receipt scanning","⏰ Expiry tracking","🤝 Cost splitting","✦ AI recipe ideas","🎯 Bounty system","✈ Going Home mode"].map(f => (
            <div key={f} style={{ background:T.paper, border:`1px solid ${T.sand}`, borderRadius:20, padding:"8px 16px", fontSize:14, color:T.inkMid }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );

  if (mode === "household") return (
    <div className="fade-in" style={{ minHeight:"100vh", background:T.cream, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ marginBottom:24 }}><Logo size="md" /></div>
        <div style={{ background:T.white, border:`1px solid ${T.sand}`, borderRadius:20, padding:"32px 32px" }}>
          <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:600, color:T.ink, margin:"0 0 6px" }}>
            Welcome, {pendingUser?.user_metadata?.full_name?.split(" ")[0] || "User"}! 🌿
          </h2>
          <p style={{ color:T.inkLight, fontSize:14, margin:"0 0 28px" }}>Set up or join your household</p>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {["create","join"].map(m => (
              <button key={m} onClick={() => f("joinMode",m)} style={{
                flex:1, background: form.joinMode === m ? T.leaf : T.paper,
                border:`1.5px solid ${form.joinMode === m ? T.leaf : T.sand}`,
                color: form.joinMode === m ? "#fff" : T.inkMid,
                borderRadius:10, padding:"10px", cursor:"pointer",
                fontWeight:600, fontSize:14, transition:"all 0.2s"
              }}>{m === "create" ? "🏠 Create household" : "🔗 Join existing"}</button>
            ))}
          </div>
          {form.joinMode === "create"
            ? <Field value={form.householdName} onChange={v => f("householdName",v)} placeholder="e.g. The Grove House, Apt 4B…" error={errors.householdName} />
            : <Field value={form.householdCode} onChange={v => f("householdCode",v)} placeholder="Enter household code (e.g. XK92BT)" error={errors.householdCode} />
          }
          <PrimaryBtn fullWidth onClick={handleHousehold}>
            {form.joinMode === "create" ? "Create household →" : "Join household →"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );

  return null;
}

function MainApp({ user, household }) {
  const [items, setItems]               = useState([]);
  const [view, setView]                = useState("dashboard");
  const [goingHome, setGoingHome]      = useState(false);
  const [ariaOpen, setAriaOpen]        = useState(false);
  const [ariaMessages, setAriaMessages] = useState([]);
  const [ariaInput, setAriaInput]      = useState("");
  const [ariaLoading, setAriaLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Example waste/points logic
  const [points, setPoints]            = useState({ "You":120 });
  const chatRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [ariaMessages]);

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const { data } = await supabase.from('items').select('*').eq('household_id', household.id)
    if (data) setItems(data)
  }

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "You";
  const redZone  = items.filter(i => i.expires_in <= 1);
  const totalWaste  = 40.40;

  async function claimBounty(id) {
    await supabase.from('items').update({ bounty: null }).eq('id', id);
    setPoints(prev => ({ ...prev, "You": prev["You"] + 15 }));
    fetchItems();
  }

  async function toggleStatus(id, s) {
    await supabase.from('items').update({ status: s }).eq('id', id);
    fetchItems();
  }

  // Simplified Add Item form inline for now, but not implemented in UI originally except as an outline
  async function addItem(newItem) {
    await supabase.from('items').insert({
      household_id: household.id,
      name: newItem.name,
      owner_id: user.id,
      category: "Other",
      expires_in: parseInt(newItem.expiresIn)||5,
      status: newItem.status,
      emoji: "📦"
    });
    fetchItems();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function sendAria() {
    if (!ariaInput.trim()) return;
    const msg = ariaInput.trim();
    setAriaInput("");
    setAriaMessages(prev => [...prev, { role:"user", content:msg }]);
    setAriaLoading(true);
    setTimeout(() => {
      setAriaMessages(prev => [...prev, { role:"assistant", content: "That looks delicious! Based on your expiring items, I recommend a quick stir-fry or a frittata." }]);
      setAriaLoading(false);
    }, 1000);
  }

  const navItems = [
    { id:"dashboard", icon:"◈", label:"Dashboard" },
    { id:"ledger",    icon:"☰", label:"Ledger" },
    { id:"bounty",    icon:"◎", label:"Bounty Board" },
    { id:"report",    icon:"◷", label:"Waste Report" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.cream }}>
      <aside style={{ width:224, background:T.white, borderRight:`1px solid ${T.sand}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0, zIndex:20 }}>
        <div style={{ padding:"24px 20px 16px" }}>
          <Logo size="sm" />
          {household && (
            <div style={{ background:T.leafLight, borderRadius:10, padding:"10px 12px", marginTop:16, fontSize:13 }}>
              <div style={{ fontWeight:600, color:T.leaf }}>{household.name}</div>
              <div style={{ color:T.leafMid, marginTop:2 }}>Code: <strong>{household.code}</strong></div>
            </div>
          )}
        </div>
        <nav style={{ padding:"8px 12px", flex:1 }}>
          {navItems.map(n => (
            <button key={n.id} className="nav-btn" onClick={() => setView(n.id)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              background: view === n.id ? T.leafLight : "transparent",
              border:"none", borderRadius:10, padding:"10px 12px", cursor:"pointer",
              color: view === n.id ? T.leaf : T.inkMid,
              fontWeight: view === n.id ? 600 : 400, fontSize:15, marginBottom:2, textAlign:"left", transition:"all 0.15s"
            }}>
              <span style={{ fontSize:16, opacity:0.8 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"16px 20px", borderTop:`1px solid ${T.sand}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:T.leafLight, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:600, color:T.leaf }}>{userName[0]}</div>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{userName}</div>
              <div style={{ fontSize:12, color:T.inkLight, cursor:"pointer" }} onClick={handleLogout}>Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ background:T.white, borderBottom:`1px solid ${T.sand}`, padding:"14px 28px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:600 }}>{navItems.find(n => n.id === view)?.label}</div>
          <div style={{ flex:1 }} />
          <button onClick={() => setAriaOpen(true)} style={{ background:T.leaf, color:"#fff", border:"none", borderRadius:20, padding:"8px 18px", cursor:"pointer", fontWeight:600 }}>✦ Ask Aria</button>
        </div>
        <main className="fade-in" style={{ flex:1, overflowY:"auto", padding:28 }}>
          {view === "dashboard" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
                {[{ label:"Items", v:items.length, c:T.leaf, i:"📦" }, { label:"Red Zone", v:redZone.length, c:T.red, i:"🚨" }, { label:"Fair Game", v:items.filter(i=>i.status==="fairgame").length, c:T.amber, i:"🟡" }, { label:"Shared", v:items.filter(i=>i.status==="shared").length, c:"#3b82f6", i:"🔵" }].map(s => (
                  <div key={s.label} style={{ background:"#fff", border:`1px solid ${T.sand}`, borderRadius:16, padding:20 }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{s.i}</div>
                    <div style={{ fontSize:32, fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:13, color:T.inkLight }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <SectionHead title="Freshness Map" sub="Sorted by urgency" />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                {items.sort((a,b)=>a.expires_in-b.expires_in).map(item => {
                  const u = urgency(item.expires_in);
                  return (
                    <div key={item.id} style={{ background:u.bg, borderRadius:14, padding:14, border:`1px solid ${u.accent}33` }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>{item.emoji}</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{item.name}</div>
                      <div style={{ background:u.pill, color:u.pillText, borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:700, display:"inline-block", marginTop:4 }}>{u.label}</div>
                    </div>
                  )
                })}
                {items.length === 0 && (
                   <div style={{ color:T.inkLight, fontSize:14, padding:"20px 0" }}>Your household's fridge is empty. Time for groceries!</div>
                )}
              </div>
            </div>
          )}
          {view === "ledger" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {items.map(item => {
                const u = urgency(item.expires_in);
                return (
                  <div key={item.id} style={{ background:"#fff", border:`1px solid ${T.sand}`, borderRadius:14, padding:14, display:"flex", alignItems:"center", gap:14, borderLeft:`4px solid ${u.accent}` }}>
                    <span style={{ fontSize:26 }}>{item.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{item.name}</div>
                      <div style={{ fontSize:12, color:T.inkLight }}>{item.category}</div>
                    </div>
                    <div style={{ background:u.pill, color:u.pillText, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>{u.label}</div>
                  </div>
                )
              })}
            </div>
          )}
          {view === "bounty" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
              {items.filter(i=>i.bounty).map(item => (
                <div key={item.id} style={{ background:"#fff", border:`1px solid ${T.sand}`, borderRadius:16, padding:18 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <span style={{ fontSize:28 }}>{item.emoji}</span>
                    <div style={{ fontWeight:600 }}>{item.name}</div>
                  </div>
                  <div style={{ background:T.amberLight, color:T.amber, borderRadius:10, padding:"5px 12px", fontWeight:700, fontSize:16, display:"inline-block" }}>🎯 {item.bounty}pt</div>
                </div>
              ))}
            </div>
          )}
          {view === "report" && (
            <div style={{ background:T.redLight, borderRadius:18, padding:28 }}>
              <div style={{ fontSize:13, color:T.red, fontWeight:700 }}>MONTHLY WASTE</div>
              <div style={{ fontSize:52, fontWeight:600, color:T.red }}>${totalWaste.toFixed(2)}</div>
            </div>
          )}
        </main>
      </div>
      {ariaOpen && (
        <div style={{ position:"fixed", top:0, right:0, height:"100vh", width:360, background:"#fff", borderLeft:`1px solid ${T.sand}`, display:"flex", flexDirection:"column", zIndex:100 }}>
          <div style={{ padding:20, borderBottom:`1px solid ${T.sand}`, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontWeight:600 }}>✦ Aria</div>
            <button onClick={() => setAriaOpen(false)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:20 }}>×</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            {ariaMessages.map((m,i)=>(
              <div key={i} style={{ marginBottom:12, textAlign:m.role==="user"?"right":"left" }}>
                <div style={{ display:"inline-block", padding:"8px 12px", borderRadius:12, background:m.role==="user"?T.leaf:T.paper, color:m.role==="user"?"#fff":T.ink }}>{m.content}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:14, borderTop:`1px solid ${T.sand}`, display:"flex", gap:8 }}>
            <input value={ariaInput} onChange={e=>setAriaInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAria()} placeholder="Type..." style={{ flex:1, padding:10, borderRadius:8, border:`1px solid ${T.sand}` }} />
            <button onClick={sendAria} style={{ background:T.leaf, color:"#fff", border:"none", borderRadius:8, padding:"0 16px" }}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  return session ? <MainApp user={session.user} household={session.household} /> : <AuthScreen onAuth={(u,h)=>setSession({user:u,household:h})} />;
}
