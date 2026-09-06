import React, { useState, useEffect } from "react";
import {
  Waves, AlertTriangle, MapPin, Home, Phone, BarChart3, LogIn, Navigation,
  Siren, CloudRain, Users, Baby, Accessibility,
  HeartPulse, Car, X, Check, Radio, Package, Truck, Shield, Menu, ArrowRight,
  Droplets, Activity, Clock, Info, Megaphone, ClipboardList,
  RotateCcw, Loader2, CloudOff,
} from "lucide-react";

/* ------------------------------ Storage keys ------------------------------ */
const STORAGE_KEYS = { requests: "floodlink:requests", teams: "floodlink:teams", myRequest: "floodlink:my_request_id" };

/* ---------------------------------------------------------------------- */
/*  Design tokens (see App.css injected below)                            */
/*  Ink navy #0F1B2B · Base #EAF2F5 (soft blue-grey) · Water #0E7490 · River-deep #155E75  */
/*  Risk red #DC2626 · orange #EA580C · amber #CA8A04 · safe #16A34A      */
/*  Display: Space Grotesk · Body: IBM Plex Sans · Data: IBM Plex Mono    */
/* ---------------------------------------------------------------------- */

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');";

/* ------------------------------ Mock data ------------------------------ */

const RISK_ZONES = [
  { id: "z1", name: "Sitamarhi District", x: 62, y: 40, risk: "high", river: "Bagmati" },
  { id: "z2", name: "Darbhanga District", x: 70, y: 46, risk: "high", river: "Kamla" },
  { id: "z3", name: "Madhubani District", x: 66, y: 34, risk: "high", river: "Kamla" },
  { id: "z4", name: "Muzaffarpur District", x: 55, y: 48, risk: "medium", river: "Bagmati" },
  { id: "z5", name: "Samastipur District", x: 60, y: 55, risk: "medium", river: "Burhi Gandak" },
  { id: "z6", name: "Patna District", x: 48, y: 66, risk: "low", river: "Ganges" },
];

const INITIAL_SHELTERS = [
  { id: "SH-A", name: "Shelter A — Sitamarhi HS School", loc: "Sitamarhi District", cap: 500, occ: 372, x: 63, y: 42, medical: true, facilities: ["Drinking water", "Toilets", "Power backup", "Kitchen"] },
  { id: "SH-B", name: "Shelter B — Darbhanga Community Hall", loc: "Darbhanga District", cap: 300, occ: 295, x: 71, y: 48, medical: true, facilities: ["Drinking water", "Toilets"] },
  { id: "SH-C", name: "Shelter C — Madhubani Panchayat Bhawan", loc: "Madhubani District", cap: 700, occ: 700, x: 67, y: 36, medical: false, facilities: ["Drinking water", "Toilets", "Kitchen"] },
  { id: "SH-D", name: "Shelter D — Muzaffarpur Degree College", loc: "Muzaffarpur District", cap: 450, occ: 140, x: 56, y: 50, medical: true, facilities: ["Drinking water", "Toilets", "Power backup"] },
];

const TEAMS = [
  { id: "R-07", zone: "Zone B — Sitamarhi", x: 60, y: 44, status: "available", assignment: null },
  { id: "R-03", zone: "Zone C — Darbhanga", x: 73, y: 50, status: "assigned", assignment: "#1039" },
  { id: "R-11", zone: "Zone A — Madhubani", x: 64, y: 33, status: "available", assignment: null },
  { id: "R-05", zone: "Zone D — Muzaffarpur", x: 53, y: 51, status: "en route", assignment: "#1041" },
];

const INITIAL_RELIEF = [
  { id: "food", label: "Food packets", unit: "", qty: 820, threshold: 500, icon: Package },
  { id: "water", label: "Drinking water", unit: "L", qty: 1200, threshold: 1000, icon: Droplets },
  { id: "medkits", label: "Medical kits", unit: "", qty: 43, threshold: 50, icon: HeartPulse },
  { id: "blankets", label: "Blankets", unit: "", qty: 270, threshold: 200, icon: Package },
];

const WATER_LEVELS = [
  { id: "ankle", label: "Below ankle", score: 1 },
  { id: "knee", label: "Knee", score: 2 },
  { id: "waist", label: "Waist", score: 3 },
  { id: "chest", label: "Chest", score: 4 },
  { id: "above", label: "Above chest", score: 5 },
];

const INITIAL_REQUESTS = [
  { id: "#1042", location: "Sitamarhi District", people: 5, children: 1, elderly: 2, disability: 0, medical: true, water: "above", vehicle: false, riskZone: "high", info: "Family stranded on rooftop, water still rising.", stage: 1, createdAt: Date.now() - 6 * 60000, assignedTeam: null, assignedAt: null },
  { id: "#1048", location: "Muzaffarpur District", people: 12, children: 0, elderly: 0, disability: 0, medical: false, water: "knee", vehicle: true, riskZone: "medium", info: "Group evacuating together, have a tractor.", stage: 1, createdAt: Date.now() - 20 * 60000, assignedTeam: null, assignedAt: null },
  { id: "#1051", location: "Patna District", people: 4, children: 0, elderly: 0, disability: 0, medical: false, water: "ankle", vehicle: true, riskZone: "low", info: "Precautionary request, monitoring situation.", stage: 1, createdAt: Date.now() - 45 * 60000, assignedTeam: null, assignedAt: null },
];

const TIMELINE_STAGES = ["Request Created", "Prioritized", "Team Assigned", "Rescue In Progress", "Resolved"];

/* ---------------------------- Scoring engine ---------------------------- */

function scoreRequest(r) {
  const waterScore = (WATER_LEVELS.find((w) => w.id === r.water)?.score || 1) * 10;
  const peopleScore = r.people * 2;
  const childScore = r.children * 5;
  const elderlyScore = r.elderly * 5;
  const disabilityScore = r.disability * 6;
  const medicalScore = r.medical ? 25 : 0;
  const riskScore = r.riskZone === "high" ? 15 : r.riskZone === "medium" ? 8 : 3;
  const vehicleAdj = r.vehicle ? -5 : 0;
  const total = waterScore + peopleScore + childScore + elderlyScore + disabilityScore + medicalScore + riskScore + vehicleAdj;
  const factors = [
    { label: `Water level: ${WATER_LEVELS.find((w) => w.id === r.water)?.label}`, value: waterScore },
    { label: `${r.people} people stranded`, value: peopleScore },
    r.children > 0 && { label: `${r.children} child${r.children > 1 ? "ren" : ""}`, value: childScore },
    r.elderly > 0 && { label: `${r.elderly} elderly`, value: elderlyScore },
    r.disability > 0 && { label: `${r.disability} with disability`, value: disabilityScore },
    r.medical && { label: "Medical assistance required", value: medicalScore },
    { label: `Location risk: ${r.riskZone}`, value: riskScore },
    r.vehicle && { label: "Vehicle available on-site", value: vehicleAdj },
  ].filter(Boolean).sort((a, b) => b.value - a.value);
  let priority = "P3";
  if (total >= 60) priority = "P1";
  else if (total >= 35) priority = "P2";
  return { total, priority, factors };
}

/* ------------------------- Shelter & resource allocation ------------------------- */
// Picks a shelter for people leaving a resolved rescue — same-district shelter with
// room first, otherwise whichever shelter has the most space available. Never
// over-fills a shelter past its capacity.
function pickShelterForRequest(shelterList, request) {
  const sameDistrict = shelterList.find((s) => s.loc === request.location && s.cap - s.occ > 0);
  if (sameDistrict) return sameDistrict.id;
  let best = null;
  for (const s of shelterList) {
    const avail = s.cap - s.occ;
    if (avail <= 0) continue;
    if (!best || avail > best.cap - best.occ) best = s;
  }
  return best ? best.id : null;
}

const PRIORITY_STYLE = {
  P1: { dot: "bg-red-600", text: "text-red-700", bg: "bg-red-50", ring: "ring-red-200", label: "P1 — Critical" },
  P2: { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", ring: "ring-orange-200", label: "P2 — Urgent" },
  P3: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", label: "P3 — Monitor" },
};

const RISK_STYLE = {
  high: { dot: "bg-red-600", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "HIGH" },
  medium: { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", label: "MEDIUM" },
  low: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "LOW" },
};

/* ------------------------- ETA + re-report cooldown ------------------------- */
// Simulated arrival window for an assigned team — deterministic per request/team
// so it doesn't jump around on re-render.
function getEtaMinutes(req) {
  const seed = (req.id + (req.assignedTeam || "")).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 15 + (seed % 26); // 15–40 minutes
}
// Urgent, unaddressed cases get a shorter escalation window than routine ones.
function getCooldownMinutes(req, priority) {
  return priority === "P1" || req.medical ? 30 : 60;
}
function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/* ---------------------------- Assignment queue ---------------------------- */
// Requests still waiting for a team, ranked the same way the Priority Table
// ranks them (highest score first) — this is what "next in line" means.
function getUnassignedQueue(requests) {
  return requests
    .filter((r) => r.stage < 3)
    .map((r) => ({ r, s: scoreRequest(r) }))
    .sort((a, b) => b.s.total - a.s.total);
}
function getQueuePosition(requests, reqId) {
  const queue = getUnassignedQueue(requests);
  const idx = queue.findIndex((q) => q.r.id === reqId);
  return idx === -1 ? null : idx + 1; // 1-based
}
// Rough, clearly-labelled estimate — not a routing model, just
// "each request ahead of you takes about this long to clear."
function estimateQueueWaitMinutes(position) {
  if (!position || position <= 1) return 0;
  return (position - 1) * 18;
}

/* -------------------------------- Shell -------------------------------- */

const NAV = [
  { id: "landing", label: "Home", icon: Home },
  { id: "citizen", label: "Check Risk", icon: MapPin },
  { id: "rescue-form", label: "Emergency", icon: Siren },
  { id: "shelters", label: "Shelters", icon: Home },
  { id: "command", label: "Response Center", icon: BarChart3 },
  { id: "contacts", label: "Emergency Contacts", icon: Phone },
];

function Header({ view, setView, role, setRole, onLogoClick }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: "rgba(239,247,249,0.92)", backdropFilter: "blur(6px)", borderColor: "#DCE3E8" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <button onClick={onLogoClick} className="flex items-center gap-2 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-md" style={{ background: "#0E7490" }}>
              <Waves size={19} color="#fff" strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight" style={{ color: "#0F1B2B" }}>
              FloodLink
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === n.id ? "text-white" : "hover:bg-slate-200/60"
                }`}
                style={view === n.id ? { background: "#0E7490", color: "#fff" } : { color: "#334155" }}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center rounded-md border overflow-hidden text-xs font-semibold" style={{ borderColor: "#CBD5E1" }}>
              <button
                onClick={() => setRole("citizen")}
                className="px-2.5 py-1.5"
                style={role === "citizen" ? { background: "#0F1B2B", color: "#fff" } : { color: "#475569" }}
              >
                Citizen
              </button>
              <button
                onClick={() => setRole("responder")}
                className="px-2.5 py-1.5"
                style={role === "responder" ? { background: "#0F1B2B", color: "#fff" } : { color: "#475569" }}
              >
                Responder
              </button>
            </div>
            <button
              onClick={() => setView(role === "responder" ? "command" : "citizen")}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "#0F1B2B" }}
            >
              <LogIn size={15} /> Login
            </button>
          </div>

          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>
            <Menu size={22} color="#0F1B2B" />
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: "#DCE3E8" }}>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => { setView(n.id); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium"
              style={view === n.id ? { background: "#0E7490", color: "#fff" } : { color: "#334155" }}
            >
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ------------------------------- Landing -------------------------------- */

function FlowDiagram() {
  const nodes = [
    { label: "Nepal", sub: "Upstream rainfall" },
    { label: "River Event", sub: "Level rising" },
    { label: "Downstream Risk", sub: "Modelled exposure" },
    { label: "Bihar", sub: "Districts flagged" },
    { label: "Local Response", sub: "Teams + shelters" },
  ];
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex fl-min-w-640 items-stretch justify-between gap-2">
        {nodes.map((n, i) => (
          <React.Fragment key={n.label}>
            <div className="flex flex-col items-center text-center w-28">
              <div
                className="grid h-14 w-14 place-items-center rounded-full ring-4"
                style={{ background: i === 4 ? "#0E7490" : "#0F1B2B", ringColor: "#E2E8F0" }}
              >
                <span className="font-mono text-xs font-semibold text-white">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="mt-2 font-display text-sm font-semibold" style={{ color: "#0F1B2B" }}>{n.label}</p>
              <p className="text-xs" style={{ color: "#64748B" }}>{n.sub}</p>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex flex-1 items-center pt-7">
                <div className="fl-h-line w-full" style={{ background: "linear-gradient(90deg,#0E7490,#94A3B8)" }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Landing({ setView }) {
  return (
    <div>
      <section className="relative overflow-hidden" style={{ background: "#0F1B2B" }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(900px 600px at 85% 0%, rgba(56,163,190,0.16) 0%, transparent 60%), " +
              "radial-gradient(700px 700px at 5% 100%, rgba(20,120,145,0.16) 0%, transparent 60%), " +
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'><g fill='none' stroke='%237DD3E0' stroke-opacity='0.07' stroke-width='1.6'><circle cx='1320' cy='90' r='80'/><circle cx='1320' cy='90' r='140'/><circle cx='1320' cy='90' r='205'/><circle cx='1320' cy='90' r='275'/><circle cx='1320' cy='90' r='350'/></g><path d='M-100 260 C 260 180, 480 380, 800 300 S 1320 160, 1700 300' stroke='%2338A3BE' stroke-opacity='0.20' stroke-width='2.6' fill='none'/><path d='M-100 330 C 270 260, 500 460, 820 380 S 1340 230, 1700 370' stroke='%230E7490' stroke-opacity='0.16' stroke-width='2.2' fill='none'/><path d='M-100 700 C 320 620, 560 800, 880 720 S 1400 560, 1700 700' stroke='%2338A3BE' stroke-opacity='0.14' stroke-width='2.4' fill='none'/><path d='M-100 760 C 320 700, 580 860, 900 780 S 1420 630, 1700 770' stroke='%230E7490' stroke-opacity='0.10' stroke-width='2' fill='none'/><path d='M-100 900 C 200 700, 420 820, 640 700 C 830 600, 950 730, 1160 640 L1700 900 L-100 900 Z' fill='%230E7490' fill-opacity='0.10'/><g stroke='%237DD3E0' stroke-opacity='0.14' stroke-width='1.2'><line x1='90' y1='620' x2='230' y2='560'/><line x1='230' y1='560' x2='340' y2='650'/><line x1='90' y1='620' x2='170' y2='720'/><line x1='340' y1='650' x2='430' y2='580'/><line x1='170' y1='720' x2='280' y2='770'/></g><g fill='%237DD3E0' fill-opacity='0.35'><circle cx='90' cy='620' r='4'/><circle cx='230' cy='560' r='4'/><circle cx='340' cy='650' r='4'/><circle cx='170' cy='720' r='4'/><circle cx='430' cy='580' r='4'/><circle cx='280' cy='770' r='4'/></g></svg>\")",
            backgroundRepeat: "no-repeat, no-repeat, no-repeat",
            backgroundSize: "cover, cover, cover",
            backgroundPosition: "center, center, center",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-6" style={{ borderColor: "#2D4356" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs tracking-wide" style={{ color: "#9FB4C7" }}>
              LIVE DEMO · SIMULATED DATA · NEPAL → BIHAR CORRIDOR
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-white max-w-3xl">
            FloodLink
          </h1>
          <p className="mt-3 font-display text-lg sm:text-2xl font-medium max-w-2xl" style={{ color: "#7DD3E0" }}>
            Cross-Border Flood Response &amp; Coordination Platform
          </p>
          <p className="mt-5 max-w-xl text-base sm:text-lg font-semibold" style={{ color: "#E7EEF2" }}>
            One platform. One flood picture. Faster response.
          </p>
          <p className="mt-3 max-w-xl text-sm sm:text-base" style={{ color: "#9FB4C7" }}>
            Connecting flood alerts, vulnerable communities, rescue requests, shelters and response
            teams in one coordinated platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setView("rescue-form")}
              className="flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30"
              style={{ background: "#DC2626" }}
            >
              <Siren size={17} /> Report Emergency
            </button>
            <button
              onClick={() => setView("citizen")}
              className="flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white"
              style={{ background: "#0E7490" }}
            >
              <MapPin size={17} /> Check My Flood Risk
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={() => setView("shelters")} className="flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium" style={{ borderColor: "#2D4356", color: "#E7EEF2" }}>
              <Home size={15} /> Find Safe Shelter
            </button>
            <button onClick={() => setView("command")} className="flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium" style={{ borderColor: "#2D4356", color: "#E7EEF2" }}>
              <BarChart3 size={15} /> Response Dashboard
            </button>
            <button onClick={() => setView("contacts")} className="flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium" style={{ borderColor: "#2D4356", color: "#E7EEF2" }}>
              <Phone size={15} /> Emergency Contacts
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <p className="font-mono text-xs tracking-wide mb-2" style={{ color: "#0E7490" }}>HOW A FLOOD EVENT MOVES THROUGH THE SYSTEM</p>
        <FlowDiagram />
      </section>

      <section className="border-t" style={{ borderColor: "#DCE3E8" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: CloudRain, title: "Risk-aware alerts", desc: "Downstream districts are flagged as upstream river levels rise, with a recommended shelter and route sent to residents." },
            { icon: Siren, title: "One-tap SOS", desc: "Citizens report exact conditions — people, vulnerabilities, water depth — in a form built for use under pressure." },
            { icon: Activity, title: "Explainable prioritisation", desc: "An auditable scoring model ranks incoming requests and shows responders exactly why, not a black box." },
            { icon: Shield, title: "One operational picture", desc: "Shelters, relief stock and rescue teams stay in sync so command staff can assign available help fast." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border p-5" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
              <span className="grid h-10 w-10 place-items-center rounded-md mb-3" style={{ background: "#E6F4F7" }}>
                <f.icon size={19} color="#0E7490" />
              </span>
              <h3 className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#5B6B79" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t" style={{ borderColor: "#DCE3E8", background: "#F0F4F6" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold" style={{ color: "#0F1B2B" }}>Walk through the demo scenario</h3>
            <p className="text-sm mt-1" style={{ color: "#5B6B79" }}>
              Follow a single flood event from an upstream alert to a resolved rescue and an updated shelter.
            </p>
          </div>
          <button
            onClick={() => setView("scenario")}
            className="flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white shrink-0"
            style={{ background: "#0F1B2B" }}
          >
            View 10-step scenario <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

/* --------------------------------- Shared -------------------------------- */

function RiskPill({ risk }) {
  const s = RISK_STYLE[risk];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.text} ${s.bg} ring-1 ${s.ring || ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

function SectionLabel({ children }) {
  return <p className="font-mono text-xs tracking-wide mb-1.5" style={{ color: "#0E7490" }}>{children}</p>;
}

/* ------------------------------ Citizen view ------------------------------ */

function CitizenDashboard({ setView }) {
  const zone = RISK_ZONES[0]; // Sitamarhi — high risk, drives the demo
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="rounded-lg border-l-4 p-4 mb-6 flex items-start gap-3" style={{ borderColor: "#DC2626", background: "#FEF2F2" }}>
        <AlertTriangle size={20} color="#DC2626" className="mt-0.5 shrink-0" />
        <div>
          <p className="font-display font-semibold text-sm" style={{ color: "#991B1B" }}>FLOOD ALERT — HIGH RISK</p>
          <p className="text-sm mt-0.5" style={{ color: "#7F1D1D" }}>
            Water level in your region is rising following an upstream release. Evacuation is recommended.
          </p>
          <p className="text-xs mt-1.5 font-mono" style={{ color: "#B91C1C" }}>DEMO ALERT · SIMULATED UPSTREAM &amp; RIVER DATA</p>
        </div>
      </div>

      <SectionLabel>YOUR FLOOD STATUS</SectionLabel>
      <div className="rounded-lg border p-5 sm:p-6" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs" style={{ color: "#64748B" }}>Location</p>
            <p className="font-display text-lg font-semibold" style={{ color: "#0F1B2B" }}>Village X, {zone.name}, Bihar</p>
          </div>
          <RiskPill risk="high" />
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Flood risk", value: "High" },
            { label: "River level", value: "Rising" },
            { label: "Evacuation", value: "Recommended" },
            { label: "Nearest shelter", value: "2.4 km" },
            { label: "Safe route", value: "Route B" },
            { label: "River gauge", value: "Bagmati / SIT-04" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs" style={{ color: "#64748B" }}>{s.label}</p>
              <p className="font-mono text-sm font-semibold mt-0.5" style={{ color: "#0F1B2B" }}>{s.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4 pt-3 border-t" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
          River level, gauge reading and downstream risk shown here are simulated for this demo — not a live government or hydrological feed.
        </p>
      </div>

      <div className="mt-6 rounded-lg border p-5 sm:p-6" style={{ borderColor: "#DCE3E8", background: "#F0F4F6" }}>
        <p className="font-display font-semibold text-sm flex items-center gap-1.5" style={{ color: "#0F1B2B" }}>
          <AlertTriangle size={15} color="#EA580C" /> What should you do?
        </p>
        <p className="text-sm mt-1.5" style={{ color: "#334155" }}>Move to Shelter A using Route B.</p>

        <div className="mt-4 grid sm:grid-cols-3 gap-2.5">
          <button onClick={() => setView("shelters")} className="flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white" style={{ background: "#0E7490" }}>
            <Navigation size={16} /> Navigate to Shelter
          </button>
          <button onClick={() => setView("rescue-form")} className="flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
            <Siren size={16} /> Request Rescue
          </button>
          <button onClick={() => setView("rescue-form")} className="flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold" style={{ borderColor: "#CBD5E1", color: "#0F1B2B" }}>
            <Droplets size={16} /> Report Flooding
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Rescue form ------------------------------ */

function RescueForm({ setView, addRequest, setLastRequestId }) {
  const [form, setForm] = useState({
    location: "Village X, Sitamarhi District",
    people: 5, children: 1, elderly: 2, disability: 0,
    medical: true, water: "above", vehicle: false, info: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const numField = (k, label, Icon) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: "#475569" }}>
        <Icon size={13} /> {label}
      </label>
      <input
        type="number" min={0} value={form[k]}
        onChange={(e) => set(k, Math.max(0, Number(e.target.value)))}
        className="w-full rounded-md border px-3 py-2.5 text-sm font-mono"
        style={{ borderColor: "#CBD5E1" }}
      />
    </div>
  );

  const submit = () => {
    const id = `#${1052 + Math.floor(Math.random() * 90)}`;
    const req = { id, location: form.location, people: form.people, children: form.children, elderly: form.elderly, disability: form.disability, medical: form.medical, water: form.water, vehicle: form.vehicle, riskZone: "high", info: form.info || "Submitted via citizen portal.", stage: 1, createdAt: Date.now(), assignedTeam: null, assignedAt: null };
    addRequest(req);
    setLastRequestId(id);
    setView("rescue-status");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center gap-2 mb-1">
        <Siren size={18} color="#DC2626" />
        <SectionLabel>EMERGENCY RESCUE REQUEST</SectionLabel>
      </div>
      <h1 className="font-display text-2xl font-semibold" style={{ color: "#0F1B2B" }}>Tell us what's happening</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "#5B6B79" }}>Keep it quick — every field helps responders prioritise your request.</p>

      <div className="rounded-lg border p-5 sm:p-6 space-y-5" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: "#475569" }}>
            <MapPin size={13} /> Current location
          </label>
          <input
            value={form.location} onChange={(e) => set("location", e.target.value)}
            className="w-full rounded-md border px-3 py-2.5 text-sm"
            style={{ borderColor: "#CBD5E1" }}
          />
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Auto-detected — edit or drop a pin if this looks wrong.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {numField("people", "People", Users)}
          {numField("children", "Children", Baby)}
          {numField("elderly", "Elderly", Users)}
          {numField("disability", "Disability", Accessibility)}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "#475569" }}>
              <HeartPulse size={13} /> Medical emergency
            </label>
            <div className="flex rounded-md border overflow-hidden text-sm font-semibold" style={{ borderColor: "#CBD5E1" }}>
              <button onClick={() => set("medical", true)} className="flex-1 py-2.5" style={form.medical ? { background: "#DC2626", color: "#fff" } : { color: "#475569" }}>Yes</button>
              <button onClick={() => set("medical", false)} className="flex-1 py-2.5" style={!form.medical ? { background: "#0F1B2B", color: "#fff" } : { color: "#475569" }}>No</button>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "#475569" }}>
              <Car size={13} /> Vehicle available
            </label>
            <div className="flex rounded-md border overflow-hidden text-sm font-semibold" style={{ borderColor: "#CBD5E1" }}>
              <button onClick={() => set("vehicle", true)} className="flex-1 py-2.5" style={form.vehicle ? { background: "#0F1B2B", color: "#fff" } : { color: "#475569" }}>Yes</button>
              <button onClick={() => set("vehicle", false)} className="flex-1 py-2.5" style={!form.vehicle ? { background: "#0F1B2B", color: "#fff" } : { color: "#475569" }}>No</button>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "#475569" }}>
            <Droplets size={13} /> Water level
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {WATER_LEVELS.map((w) => (
              <button
                key={w.id} onClick={() => set("water", w.id)}
                className="rounded-md border py-2 fl-text-xxs sm:text-xs font-semibold text-center leading-tight"
                style={form.water === w.id ? { background: "#0E7490", color: "#fff", borderColor: "#0E7490" } : { borderColor: "#CBD5E1", color: "#475569" }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "#475569" }}>Additional information</label>
          <textarea
            value={form.info} onChange={(e) => set("info", e.target.value)} rows={3}
            placeholder="Anything responders should know — e.g. rooftop, no boat access, elderly can't walk..."
            className="w-full rounded-md border px-3 py-2.5 text-sm resize-none"
            style={{ borderColor: "#CBD5E1" }}
          />
        </div>

        <button
          onClick={submit}
          className="w-full flex items-center justify-center gap-2 rounded-md py-3.5 text-sm font-bold text-white tracking-wide"
          style={{ background: "#DC2626" }}
        >
          <Siren size={17} /> SUBMIT RESCUE REQUEST
        </button>
      </div>
    </div>
  );
}

function Timeline({ stage }) {
  return (
    <div className="flex items-center justify-between">
      {TIMELINE_STAGES.map((s, i) => {
        const idx = i + 1;
        const done = idx <= stage;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center text-center w-16 sm:w-20">
              <div
                className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full text-white"
                style={{ background: done ? "#0E7490" : "#CBD5E1" }}
              >
                {done ? <Check size={14} /> : <span className="font-mono fl-text-xxs">{idx}</span>}
              </div>
              <p className="fl-text-2xs mt-1.5 leading-tight" style={{ color: done ? "#0F1B2B" : "#94A3B8", fontWeight: done ? 600 : 400 }}>{s}</p>
            </div>
            {i < TIMELINE_STAGES.length - 1 && (
              <div className="flex-1 fl-h-line mb-5" style={{ background: idx < stage ? "#0E7490" : "#E2E8F0" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const STAGE_STATUS_LABEL = {
  1: "Awaiting Assignment",
  2: "Awaiting Assignment",
  3: "Team Assigned",
  4: "Rescue In Progress",
  5: "Resolved",
};

// Live ETA (once a team is assigned) or a live re-report cooldown (while
// unassigned) — shared by the confirmation screen and the "already
// reported" block screen so the two stay consistent.
function EtaOrCooldownNote({ request, now, priority, requests }) {
  if (request.stage >= 5) return null;

  // Team is physically on site and working — an arrival ETA no longer
  // makes sense here, so swap it for an "in progress" state instead.
  if (request.stage === 4) {
    return (
      <div className="rounded-md p-4 flex items-start gap-3" style={{ background: "#E6F4F7" }}>
        <Activity size={16} color="#0E7490" className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0F1B2B" }}>Team {request.assignedTeam} is on site — rescue in progress</p>
          <p className="text-xs mt-0.5" style={{ color: "#3F5B6B" }}>No action needed from you — responders will update this once it's resolved.</p>
        </div>
      </div>
    );
  }

  // Team assigned but still travelling — show a live arrival ETA.
  if (request.assignedTeam && request.assignedAt && request.stage === 3) {
    const etaMs = getEtaMinutes(request) * 60000;
    const remaining = request.assignedAt + etaMs - now;
    return (
      <div className="rounded-md p-4 flex items-start gap-3" style={{ background: "#E6F4F7" }}>
        <Clock size={16} color="#0E7490" className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0F1B2B" }}>
            {remaining > 0 ? `Team ${request.assignedTeam} reaching in ${formatCountdown(remaining)}` : `Team ${request.assignedTeam} should be arriving now`}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#3F5B6B" }}>You don't need to report again — this request is already being handled.</p>
        </div>
      </div>
    );
  }

  const cooldownMs = getCooldownMinutes(request, priority) * 60000;
  const remaining = request.createdAt + cooldownMs - now;
  const queuePosition = requests ? getQueuePosition(requests, request.id) : null;
  const waitMinutes = estimateQueueWaitMinutes(queuePosition);
  const queueLine = queuePosition ? (
    <p className="text-xs mt-1.5 font-mono" style={{ color: "#7C4A17" }}>
      {queuePosition === 1
        ? "You're next in line once a team frees up."
        : `#${queuePosition} in line · ${queuePosition - 1} request${queuePosition - 1 > 1 ? "s" : ""} ahead · est. wait ~${waitMinutes} min`}
    </p>
  ) : null;
  if (remaining > 0) {
    return (
      <div className="rounded-md p-4 flex items-start gap-3" style={{ background: "#FFF7ED" }}>
        <Clock size={16} color="#EA580C" className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0F1B2B" }}>No team assigned yet — you can report again in {formatCountdown(remaining)}</p>
          <p className="text-xs mt-0.5" style={{ color: "#7C4A17" }}>
            {priority === "P1" || request.medical
              ? "This is flagged urgent, so re-reporting opens up sooner if it isn't picked up."
              : "Re-reporting opens up if this still hasn't been picked up by then."}
          </p>
          {queueLine}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-md p-4 flex items-start gap-3" style={{ background: "#FEF2F2" }}>
      <AlertTriangle size={16} color="#DC2626" className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold" style={{ color: "#0F1B2B" }}>Still no team assigned — you can report again now</p>
        <p className="text-xs mt-0.5" style={{ color: "#7F1D1D" }}>If the situation has gotten worse, submit a fresh request so it's re-scored.</p>
        {queueLine}
      </div>
    </div>
  );
}

function canReportAgain(request, now) {
  if (!request || request.stage >= 5) return true;
  if (request.stage >= 3) return false; // team assigned — no need to re-report
  const { priority } = scoreRequest(request);
  const cooldownMs = getCooldownMinutes(request, priority) * 60000;
  return now - request.createdAt >= cooldownMs;
}

function AlreadyReportedNotice({ request, now, requests, setView }) {
  const { priority } = scoreRequest(request);
  const ps = PRIORITY_STYLE[priority];
  const stageLabel = STAGE_STATUS_LABEL[request.stage] || "Awaiting Assignment";
  const canRetry = canReportAgain(request, now);
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full mb-4" style={{ background: "#F0F4F6" }}>
        <ClipboardList size={26} color="#0E7490" />
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold" style={{ color: "#0F1B2B" }}>
        You already have an active request
      </h1>
      <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "#5B6B79" }}>
        Request {request.id} is still open, so it's tracked instead of creating a duplicate for responders.
      </p>

      <div className="mt-6 rounded-lg border p-5 text-left space-y-4" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        <div className="flex items-center justify-between">
          <p className="font-mono font-semibold" style={{ color: "#0F1B2B" }}>{request.id}</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ps.text} ${ps.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} /> {ps.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs" style={{ color: "#64748B" }}>Rescue team</p><p className="font-mono font-semibold mt-0.5" style={{ color: "#0F1B2B" }}>{request.assignedTeam ? `Team ${request.assignedTeam}` : "Pending"}</p></div>
          <div><p className="text-xs" style={{ color: "#64748B" }}>Status</p><p className="font-mono font-semibold mt-0.5" style={{ color: "#0F1B2B" }}>{stageLabel}</p></div>
        </div>
        <EtaOrCooldownNote request={request} now={now} priority={priority} requests={requests} />
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button onClick={() => setView("rescue-status")} className="rounded-md px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#0E7490" }}>
          View my request status
        </button>
        {canRetry && (
          <button onClick={() => setView("rescue-form")} className="flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
            <Siren size={15} /> Report again
          </button>
        )}
        <button onClick={() => setView("citizen")} className="rounded-md border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "#CBD5E1", color: "#0F1B2B" }}>
          Back to my flood status
        </button>
      </div>
      <p className="text-xs mt-4" style={{ color: "#94A3B8" }}>
        Life-threatening and can't wait? Call the emergency contacts instead so a responder can act directly.
      </p>
    </div>
  );
}

function RescueStatus({ requests, lastRequestId, now, setView }) {
  const req = requests.find((r) => r.id === lastRequestId) || requests[0];
  const { priority } = scoreRequest(req);
  const ps = PRIORITY_STYLE[priority];
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full mb-4" style={{ background: "#FEF2F2" }}>
        <Siren size={26} color="#DC2626" />
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold" style={{ color: "#0F1B2B" }}>
        Rescue Request {req.id} Created
      </h1>
      <div className={`inline-flex items-center gap-1.5 mt-3 rounded-full px-3 py-1 text-xs font-semibold ${ps.text} ${ps.bg}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} /> Priority: {ps.label}
      </div>

      <div className="mt-6 rounded-lg border p-5 text-left space-y-4" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs" style={{ color: "#64748B" }}>Rescue team</p><p className="font-mono font-semibold mt-0.5" style={{ color: "#0F1B2B" }}>{req.assignedTeam ? `Team ${req.assignedTeam}` : "Pending"}</p></div>
          <div><p className="text-xs" style={{ color: "#64748B" }}>Status</p><p className="font-mono font-semibold mt-0.5" style={{ color: "#0F1B2B" }}>{STAGE_STATUS_LABEL[req.stage] || "Awaiting Assignment"}</p></div>
        </div>
        <EtaOrCooldownNote request={req} now={now} priority={priority} requests={requests} />
      </div>

      <div className="mt-8 rounded-lg border p-5 sm:p-6" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        <p className="text-xs font-medium mb-5 text-left" style={{ color: "#475569" }}>TRACKING</p>
        <Timeline stage={req.stage} />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={() => setView("citizen")} className="rounded-md border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "#CBD5E1", color: "#0F1B2B" }}>
          Back to my status
        </button>
        <button onClick={() => setView("command")} className="rounded-md px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#0F1B2B" }}>
          View in Response Center
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Emergency contacts ------------------------------ */

function Contacts() {
  const rows = [
    { name: "National Disaster Response Force (NDRF)", num: "011-2673-1133" },
    { name: "Bihar State Disaster Management Authority", num: "0612-2547-232" },
    { name: "District Control Room — Sitamarhi", num: "06226-252-076" },
    { name: "District Control Room — Darbhanga", num: "06272-240-513" },
    { name: "Ambulance", num: "108" },
    { name: "Police", num: "100" },
  ];
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <SectionLabel>ALWAYS AVAILABLE</SectionLabel>
      <h1 className="font-display text-2xl font-semibold mb-6" style={{ color: "#0F1B2B" }}>Emergency Contacts</h1>
      <div className="rounded-lg border divide-y" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium" style={{ color: "#0F1B2B" }}>{r.name}</p>
            <span className="font-mono text-sm font-semibold flex items-center gap-1.5" style={{ color: "#0E7490" }}>
              <Phone size={13} /> {r.num}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Shelters view ------------------------------ */

function shelterStatus(s) {
  const pct = s.occ / s.cap;
  if (pct >= 1) return { label: "Full", dot: "bg-red-600", text: "text-red-700" };
  if (pct >= 0.9) return { label: "Nearly Full", dot: "bg-orange-500", text: "text-orange-700" };
  return { label: "Available", dot: "bg-green-600", text: "text-green-700" };
}

function Shelters({ setView, shelters }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
      <SectionLabel>SHELTER MANAGEMENT</SectionLabel>
      <h1 className="font-display text-2xl font-semibold mb-6" style={{ color: "#0F1B2B" }}>Nearby Shelters</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {shelters.map((s) => {
          const st = shelterStatus(s);
          const avail = s.cap - s.occ;
          const pct = Math.min(100, (s.occ / s.cap) * 100);
          return (
            <div key={s.id} className="rounded-lg border p-5" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>{s.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{s.loc}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2 py-0.5 fl-text-xxs font-semibold ${st.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
                </span>
              </div>

              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: st.dot.includes("red") ? "#DC2626" : st.dot.includes("orange") ? "#EA580C" : "#16A34A" }} />
              </div>
              <div className="flex justify-between text-xs mt-1.5 font-mono" style={{ color: "#64748B" }}>
                <span>{s.occ} / {s.cap} occupied</span>
                <span>{avail} available</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.facilities.map((f) => (
                  <span key={f} className="rounded-md px-2 py-1 fl-text-xxs" style={{ background: "#F0F4F6", color: "#475569" }}>{f}</span>
                ))}
                {s.medical && (
                  <span className="rounded-md px-2 py-1 fl-text-xxs flex items-center gap-1" style={{ background: "#E6F4F7", color: "#0E7490" }}>
                    <HeartPulse size={11} /> Medical support
                  </span>
                )}
              </div>

              <button className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-semibold text-white" style={{ background: "#0E7490" }}>
                <Navigation size={14} /> Route to {s.id}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Map ------------------------------ */

function ResponseMap({ requests, shelters, teams, selected, setSelected }) {
  const [layer, setLayer] = useState("all");
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#DCE3E8" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "#64748B" }}>
          <MapPin size={13} /> OPERATIONAL RISK MAP — SIMULATED DATA · NEPAL–BIHAR CORRIDOR
        </div>
        <div className="flex rounded-md border overflow-hidden text-xs font-semibold" style={{ borderColor: "#CBD5E1" }}>
          {["all", "requests", "shelters", "teams"].map((l) => (
            <button key={l} onClick={() => setLayer(l)} className="px-2.5 py-1.5 capitalize"
              style={layer === l ? { background: "#0F1B2B", color: "#fff" } : { color: "#475569" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" style={{ background: "linear-gradient(180deg,#DCEEF2 0%,#EAF3EC 55%,#F3EFE2 100%)", height: 420 }}>
        {/* River path */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <path d="M 8,8 C 25,20 30,28 38,30 C 48,33 55,40 60,48 C 66,58 70,62 82,70 C 90,75 92,82 92,92"
            fill="none" stroke="#7FC7D9" strokeWidth="1.6" opacity="0.9" />
          <path d="M 38,30 C 45,45 50,50 60,55 C 68,59 72,68 74,80"
            fill="none" stroke="#7FC7D9" strokeWidth="1" opacity="0.7" />
          <text x="9" y="6" fontSize="3" fill="#155E75" fontFamily="IBM Plex Mono">NEPAL</text>
          <line x1="0" y1="18" x2="100" y2="18" stroke="#94A3B8" strokeDasharray="1,1.4" strokeWidth="0.3" />
          <text x="80" y="21" fontSize="2.6" fill="#64748B" fontFamily="IBM Plex Mono">BORDER</text>
          <text x="45" y="88" fontSize="3" fill="#3F5B6B" fontFamily="IBM Plex Mono">BIHAR, INDIA</text>
        </svg>

        {/* Risk zones */}
        {RISK_ZONES.map((z) => {
          const s = RISK_STYLE[z.risk];
          return (
            <div key={z.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${z.x}%`, top: `${z.y}%` }}>
              <div className={`h-9 w-9 rounded-full ${s.bg} ring-2 ${s.ring || ""} opacity-70`} />
            </div>
          );
        })}

        {/* Shelters */}
        {(layer === "all" || layer === "shelters") && shelters.map((s) => (
          <button key={s.id} onClick={() => setSelected({ type: "shelter", data: s })}
            className="absolute -translate-x-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-md shadow-md"
            style={{ left: `${s.x}%`, top: `${s.y}%`, background: "#fff", border: "1.5px solid #16A34A" }}>
            <Home size={12} color="#16A34A" />
          </button>
        ))}

        {/* Teams */}
        {(layer === "all" || layer === "teams") && teams.map((t) => (
          <button key={t.id} onClick={() => setSelected({ type: "team", data: t })}
            className="absolute -translate-x-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full shadow-md"
            style={{ left: `${t.x}%`, top: `${t.y}%`, background: "#0F1B2B" }}>
            <Truck size={12} color="#fff" />
          </button>
        ))}

        {/* Requests */}
        {(layer === "all" || layer === "requests") && requests.map((r, i) => {
          const zone = RISK_ZONES.find((z) => z.name === r.location) || RISK_ZONES[i % RISK_ZONES.length];
          const { priority } = scoreRequest(r);
          const color = priority === "P1" ? "#DC2626" : priority === "P2" ? "#EA580C" : "#CA8A04";
          return (
            <button key={r.id} onClick={() => setSelected({ type: "request", data: r })}
              className="absolute -translate-x-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full shadow-md animate-pulse"
              style={{ left: `${zone.x + 3}%`, top: `${zone.y - 3}%`, background: color }}>
              <AlertTriangle size={12} color="#fff" />
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-t p-4" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
          {selected.type === "shelter" && (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>{selected.data.name}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: "#64748B" }}>{selected.data.occ}/{selected.data.cap} occupied · {selected.data.loc}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={16} color="#94A3B8" /></button>
            </div>
          )}
          {selected.type === "team" && (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>Rescue Team {selected.data.id}</p>
                <p className="text-xs mt-1 font-mono capitalize" style={{ color: "#64748B" }}>{selected.data.status} · {selected.data.zone}{selected.data.assignment ? ` · assigned ${selected.data.assignment}` : ""}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={16} color="#94A3B8" /></button>
            </div>
          )}
          {selected.type === "request" && (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>Rescue Request {selected.data.id}</p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{selected.data.location} · {selected.data.people} people · {selected.data.info}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={16} color="#94A3B8" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Priority table ------------------------------ */

function PriorityTable({ requests, expanded, setExpanded, onAssign, onAdvance, noTeamsAvailable }) {
  const scored = requests.map((r) => ({ r, s: scoreRequest(r) })).sort((a, b) => b.s.total - a.s.total);
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#DCE3E8" }}>
      <div className="fl-priority-grid px-4 py-2.5 fl-text-xxs font-semibold font-mono" style={{ background: "#F0F4F6", color: "#64748B" }}>
        <span>REQUEST</span><span className="hidden sm:block">VULNERABLE / SIZE</span><span>RISK</span><span className="hidden sm:block">SCORE</span><span>PRIORITY</span>
      </div>
      {scored.map(({ r, s }) => {
        const ps = PRIORITY_STYLE[s.priority];
        const isOpen = expanded === r.id;
        const vulnParts = [r.children > 0 && `${r.children} child`, r.elderly > 0 && `${r.elderly} elderly`, r.disability > 0 && `${r.disability} disability`, r.medical && "medical"].filter(Boolean);
        return (
          <div key={r.id} className="border-t" style={{ borderColor: "#E7ECEF" }}>
            <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full fl-priority-grid items-center px-4 py-3 text-left hover:bg-slate-50">
              <span className="font-mono text-sm font-semibold" style={{ color: "#0F1B2B" }}>{r.id}</span>
              <span className="hidden sm:block text-xs" style={{ color: "#475569" }}>
                {r.people} people{vulnParts.length ? ` · ${vulnParts.join(", ")}` : " · none flagged"}
              </span>
              <span className="hidden sm:block"><RiskPill risk={r.riskZone} /></span>
              <span className="hidden sm:block font-mono text-sm" style={{ color: "#64748B" }}>{s.total}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ps.text} ${ps.bg} justify-self-start`}>
                <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} /> {s.priority}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 sm:px-8 pb-4">
                <div className="rounded-md p-4" style={{ background: "#F8FAFB" }}>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#0F1B2B" }}>
                    <Info size={13} /> Why {s.priority}?
                  </p>
                  <ul className="space-y-1">
                    {s.factors.map((f) => (
                      <li key={f.label} className="flex items-center justify-between text-xs">
                        <span style={{ color: "#475569" }}>{f.label}</span>
                        <span className="font-mono font-semibold" style={{ color: f.value < 0 ? "#16A34A" : "#0F1B2B" }}>{f.value > 0 ? "+" : ""}{f.value}</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between text-xs pt-1.5 mt-1.5 border-t" style={{ borderColor: "#E2E8F0" }}>
                      <span className="font-semibold" style={{ color: "#0F1B2B" }}>Total score</span>
                      <span className="font-mono font-bold" style={{ color: "#0F1B2B" }}>{s.total}</span>
                    </li>
                  </ul>
                  <p className="text-xs mt-2 italic" style={{ color: "#64748B" }}>"{r.info}"</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!r.assignedTeam && (
                      noTeamsAvailable ? (
                        <span className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold" style={{ background: "#FEF2F2", color: "#991B1B" }}>
                          <AlertTriangle size={13} /> No teams available right now
                        </span>
                      ) : (
                        <button onClick={() => onAssign(r.id)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ background: "#0F1B2B" }}>
                          <Truck size={13} /> Assign available team
                        </button>
                      )
                    )}
                    {r.assignedTeam && (
                      <span className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold" style={{ background: "#E6F4F7", color: "#0E7490" }}>
                        <Truck size={13} /> Team {r.assignedTeam} assigned
                      </span>
                    )}
                    {r.stage === 3 && (
                      <button onClick={() => onAdvance(r.id, 4)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold" style={{ background: "#FFF7ED", color: "#EA580C" }}>
                        <Activity size={13} /> Mark rescue in progress
                      </button>
                    )}
                    {r.stage === 4 && (
                      <button onClick={() => onAdvance(r.id, 5)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                        <Check size={13} /> Mark resolved
                      </button>
                    )}
                    {r.stage === 5 && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#16A34A" }}>
                        <Check size={13} /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ Command Center ------------------------------ */

const CMD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Flood Map" },
  { id: "requests", label: "Rescue Requests" },
  { id: "shelters", label: "Shelters" },
  { id: "resources", label: "Relief Resources" },
  { id: "teams", label: "Rescue Teams" },
];

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-md" style={{ background: tone + "1A" }}>
          <Icon size={15} color={tone} />
        </span>
      </div>
      <p className="font-mono text-2xl font-bold mt-3" style={{ color: "#0F1B2B" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{label}</p>
    </div>
  );
}

function CommandCenter({ requests, setRequests, teams, setTeams, shelters, setShelters, expanded, setExpanded, selectedMarker, setSelectedMarker, onBroadcast, resources, setResources }) {
  const [tab, setTab] = useState("overview");

  const assign = (reqId) => {
    setTeams((prev) => {
      const idx = prev.findIndex((t) => t.status === "available");
      if (idx === -1) return prev;
      const teamId = prev[idx].id;
      const next = [...prev];
      next[idx] = { ...next[idx], status: "assigned", assignment: reqId };
      setRequests((prevReqs) =>
        prevReqs.map((r) => (r.id === reqId ? { ...r, stage: Math.max(r.stage, 3), assignedTeam: teamId, assignedAt: Date.now() } : r))
      );
      return next;
    });
  };

  const advance = (reqId, newStage) => {
    const resolvedReq = requests.find((r) => r.id === reqId);
    const freedTeamId = resolvedReq?.assignedTeam || null;

    // If a team is freeing up, hand it straight to whoever's next in the
    // queue instead of leaving them waiting for a responder to notice.
    let nextQueued = null;
    if (newStage === 5 && freedTeamId) {
      const queue = getUnassignedQueue(requests.filter((r) => r.id !== reqId));
      nextQueued = queue[0]?.r || null;
    }

    setRequests((prevReqs) =>
      prevReqs.map((r) => {
        if (r.id === reqId) return { ...r, stage: newStage };
        if (nextQueued && r.id === nextQueued.id) {
          return { ...r, stage: Math.max(r.stage, 3), assignedTeam: freedTeamId, assignedAt: Date.now() };
        }
        return r;
      })
    );

    if (newStage === 5) {
      if (freedTeamId) {
        setTeams((prevTeams) =>
          prevTeams.map((t) =>
            t.id === freedTeamId
              ? nextQueued
                ? { ...t, status: "assigned", assignment: nextQueued.id }
                : { ...t, status: "available", assignment: null }
              : t
          )
        );
      }
      if (resolvedReq) {
        // Move the rescued people into a shelter, capped so occupancy
        // never exceeds capacity.
        setShelters((prevShelters) => {
          const targetId = pickShelterForRequest(prevShelters, resolvedReq);
          if (!targetId) return prevShelters;
          return prevShelters.map((s) => {
            if (s.id !== targetId) return s;
            const room = s.cap - s.occ;
            const moved = Math.max(0, Math.min(resolvedReq.people, room));
            return { ...s, occ: s.occ + moved };
          });
        });
        // Deduct relief resources used to support them, never below zero.
        setResources((prevResources) =>
          prevResources.map((res) => {
            let used = 0;
            if (res.id === "food") used = resolvedReq.people;
            else if (res.id === "water") used = resolvedReq.people * 2;
            else if (res.id === "blankets") used = resolvedReq.people;
            else if (res.id === "medkits") used = resolvedReq.medical ? 1 : 0;
            return { ...res, qty: Math.max(0, res.qty - used) };
          })
        );
      }
    }
  };

  const availableTeams = teams.filter((t) => t.status === "available").length;
  const availableShelters = shelters.filter((s) => s.cap - s.occ > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <SectionLabel>RESPONSE COMMAND CENTER</SectionLabel>
          <h1 className="font-display text-2xl font-semibold" style={{ color: "#0F1B2B" }}>Nepal–Bihar Corridor Operations</h1>
        </div>
        <button onClick={onBroadcast} className="flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
          <Megaphone size={15} /> Broadcast Emergency Alert
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={AlertTriangle} label="Active flood alerts" value="3" tone="#DC2626" />
        <StatCard icon={Shield} label="High-risk zones" value={RISK_ZONES.filter((z) => z.risk === "high").length} tone="#DC2626" />
        <StatCard icon={Siren} label="Pending requests" value={requests.length} tone="#EA580C" />
        <StatCard icon={Truck} label="Available teams" value={`${availableTeams}/${teams.length}`} tone="#0E7490" />
        <StatCard icon={Home} label="Available shelters" value={`${availableShelters}/${shelters.length}`} tone="#16A34A" />
        <StatCard icon={Package} label="Relief centers" value="3" tone="#0F1B2B" />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b mb-6" style={{ borderColor: "#DCE3E8" }}>
        {CMD_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px"
            style={tab === t.id ? { borderColor: "#0E7490", color: "#0E7490" } : { borderColor: "transparent", color: "#64748B" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#0F1B2B" }}><MapPin size={13} /> Operational Risk Map — Simulated Data</p>
            <ResponseMap requests={requests} shelters={shelters} teams={teams} selected={selectedMarker} setSelected={setSelectedMarker} />
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#0F1B2B" }}><ClipboardList size={13} /> Top priority requests</p>
            <PriorityTable requests={requests.slice(0, 3)} expanded={expanded} setExpanded={setExpanded} onAssign={assign} onAdvance={advance} noTeamsAvailable={availableTeams === 0} />
          </div>
        </div>
      )}

      {tab === "map" && <ResponseMap requests={requests} shelters={shelters} teams={teams} selected={selectedMarker} setSelected={setSelectedMarker} />}

      {tab === "requests" && (
        <div>
          <p className="text-xs mb-1.5" style={{ color: "#64748B" }}>
            Explainable Rescue Priority Engine — rule-based, explainable risk-based prioritization, not a flood predictor. Click a row to see the score breakdown.
          </p>
          <p className="text-xs mb-3 italic" style={{ color: "#94A3B8" }}>
            Current prototype uses an explainable rule-based scoring model. AI-assisted optimization can be integrated when sufficient historical emergency data is available.
          </p>
          <PriorityTable requests={requests} expanded={expanded} setExpanded={setExpanded} onAssign={assign} onAdvance={advance} noTeamsAvailable={availableTeams === 0} />
        </div>
      )}

      {tab === "shelters" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {shelters.map((s) => {
            const st = shelterStatus(s);
            const pct = Math.min(100, (s.occ / s.cap) * 100);
            return (
              <div key={s.id} className="rounded-lg border p-4" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>{s.name}</p>
                  <span className={`text-xs font-semibold ${st.text}`}>{st.label}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: st.dot.includes("red") ? "#DC2626" : st.dot.includes("orange") ? "#EA580C" : "#16A34A" }} />
                </div>
                <p className="text-xs mt-1.5 font-mono" style={{ color: "#64748B" }}>{s.occ}/{s.cap} · {s.cap - s.occ} available</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "resources" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((r) => {
            const low = r.qty < r.threshold;
            return (
              <div key={r.id} className="rounded-lg border p-4" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
                <span className="grid h-9 w-9 place-items-center rounded-md mb-2" style={{ background: low ? "#FEF2F2" : "#E6F4F7" }}>
                  <r.icon size={16} color={low ? "#DC2626" : "#0E7490"} />
                </span>
                <p className="font-mono text-xl font-bold" style={{ color: "#0F1B2B" }}>{r.qty.toLocaleString()}{r.unit}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{r.label}</p>
                {low && <p className="fl-text-xxs mt-1.5 font-semibold" style={{ color: "#DC2626" }}>Below threshold — needs restocking</p>}
              </div>
            );
          })}
        </div>
      )}

      {tab === "teams" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: "#DCE3E8", background: "#fff" }}>
              <div>
                <p className="font-display font-semibold text-sm" style={{ color: "#0F1B2B" }}>Rescue Team {t.id}</p>
                <p className="text-xs mt-0.5 font-mono capitalize" style={{ color: "#64748B" }}>{t.zone}</p>
                {t.assignment && <p className="text-xs mt-0.5" style={{ color: "#0E7490" }}>Assigned to {t.assignment}</p>}
              </div>
              <span
                className="text-xs font-semibold capitalize px-2 py-1 rounded-full"
                style={t.status === "available" ? { color: "#16A34A", background: "#F0FDF4" } : t.status === "assigned" ? { color: "#0E7490", background: "#E6F4F7" } : { color: "#EA580C", background: "#FFF7ED" }}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Scenario walkthrough ------------------------------ */

const SCENARIO_STEPS = [
  "An upstream flood event is entered into the system.",
  "The system identifies downstream high-risk areas in Bihar.",
  "Citizens in those areas receive an alert.",
  "A citizen checks their flood status.",
  "The citizen submits an SOS request — 5 people, 1 child, 2 elderly, medical emergency, chest-high water.",
  "The Explainable Rescue Priority Engine flags the request P1 — Critical, and explains why.",
  "The response command center assigns an available rescue team.",
  "The system recommends a suitable shelter based on location and capacity.",
  "The command center updates the rescue status.",
  "Shelter and relief-resource dashboards update accordingly.",
];

function Scenario({ setView }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <SectionLabel>DEMO SCENARIO</SectionLabel>
      <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: "#0F1B2B" }}>One flood event, start to finish</h1>
      <p className="text-sm mb-6" style={{ color: "#5B6B79" }}>The full flow is demonstrable in a few minutes — try it via Report Emergency, then watch it appear in the Response Center.</p>
      <ol className="space-y-0">
        {SCENARIO_STEPS.map((s, i) => (
          <li key={s} className="flex gap-3 pb-5 relative">
            {i < SCENARIO_STEPS.length - 1 && <span className="fl-connector" style={{ background: "#DCE3E8" }} />}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono fl-text-xxs font-bold text-white z-10" style={{ background: "#0E7490" }}>{i + 1}</span>
            <p className="text-sm pt-0.5" style={{ color: "#334155" }}>{s}</p>
          </li>
        ))}
      </ol>
      <div className="flex gap-3 mt-4">
        <button onClick={() => setView("rescue-form")} className="flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
          <Siren size={15} /> Start the scenario
        </button>
        <button onClick={() => setView("command")} className="rounded-md border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "#CBD5E1", color: "#0F1B2B" }}>
          Skip to Command Center
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Broadcast modal ------------------------------ */

function BroadcastModal({ onClose }) {
  const [zone, setZone] = useState(RISK_ZONES[0].id);
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(15,27,43,0.5)" }}>
      <div className="w-full max-w-md rounded-lg bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold flex items-center gap-1.5" style={{ color: "#0F1B2B" }}><Radio size={16} color="#DC2626" /> Broadcast Emergency Alert</p>
          <button onClick={onClose}><X size={18} color="#94A3B8" /></button>
        </div>
        {!sent ? (
          <>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#475569" }}>Select high-risk area</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full rounded-md border px-3 py-2.5 text-sm mb-4" style={{ borderColor: "#CBD5E1" }}>
              {RISK_ZONES.map((z) => <option key={z.id} value={z.id}>{z.name} — {z.risk} risk</option>)}
            </select>
            <textarea rows={3} defaultValue="Water level rising. Evacuation recommended. Move to your nearest designated shelter." className="w-full rounded-md border px-3 py-2.5 text-sm mb-4 resize-none" style={{ borderColor: "#CBD5E1" }} />
            <button onClick={() => setSent(true)} className="w-full rounded-md py-3 text-sm font-bold text-white" style={{ background: "#DC2626" }}>Send Alert</button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full mb-3" style={{ background: "#F0FDF4" }}>
              <Check size={22} color="#16A34A" />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#0F1B2B" }}>Alert sent to {RISK_ZONES.find((z) => z.id === zone)?.name}</p>
            <button onClick={onClose} className="mt-4 rounded-md border px-4 py-2 text-sm font-semibold" style={{ borderColor: "#CBD5E1", color: "#0F1B2B" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Footer -------------------------------- */

function Footer({ onReset, saveError }) {
  return (
    <footer className="border-t mt-10" style={{ borderColor: "#DCE3E8" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: "#94A3B8" }}>
        <p>FloodLink — prototype for the Nepal → Bihar flood-response corridor. All operational data shown is simulated for demonstration
          {saveError && <span style={{ color: "#DC2626" }}> · changes aren't saving right now, they'll only last this session</span>}.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <p className="font-mono">DEMO BUILD</p>
          <button onClick={onReset} className="flex items-center gap-1 font-medium hover:underline" style={{ color: "#64748B" }}>
            <RotateCcw size={12} /> Reset demo data
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------- App ---------------------------------- */

export default function App() {
  const [view, setViewRaw] = useState("landing");
  const [viewHistory, setViewHistory] = useState([]);

  // Wraps the raw setter so every navigation records where we came from —
  // lets the logo act as a real "back" button instead of always jumping home.
  const setView = (next) => {
    setViewHistory((prev) => (view === next ? prev : [...prev, view]));
    setViewRaw(next);
  };

  const goBack = () => {
    setViewHistory((prev) => {
      if (prev.length === 0) {
        setViewRaw("landing");
        return prev;
      }
      const next = [...prev];
      const last = next.pop();
      setViewRaw(last);
      return next;
    });
  };
  const [role, setRole] = useState("citizen");
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [lastRequestId, setLastRequestId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [teams, setTeams] = useState(TEAMS);
  const [shelters, setShelters] = useState(INITIAL_SHELTERS);
  const [resources, setResources] = useState(INITIAL_RELIEF);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [myRequestId, setMyRequestId] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Live clock — only ticks while it's actually needed (ETA / cooldown
  // countdowns), so the rest of the app isn't re-rendering every second.
  useEffect(() => {
    if (view !== "rescue-form" && view !== "rescue-status") return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [view]);

  // Load persisted state once on mount. Data is stored with shared=true —
  // every citizen and every responder using this app sees the same rescue
  // requests and team statuses, which is what a real coordination tool needs.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let reqData = INITIAL_REQUESTS;
      let teamData = TEAMS;
      try {
        const r = await window.storage.get(STORAGE_KEYS.requests, true);
        if (r && r.value) reqData = JSON.parse(r.value);
      } catch {
        try { await window.storage.set(STORAGE_KEYS.requests, JSON.stringify(INITIAL_REQUESTS), true); } catch {}
      }
      try {
        const t = await window.storage.get(STORAGE_KEYS.teams, true);
        if (t && t.value) teamData = JSON.parse(t.value);
      } catch {
        try { await window.storage.set(STORAGE_KEYS.teams, JSON.stringify(TEAMS), true); } catch {}
      }
      let myReq = null;
      try {
        const m = await window.storage.get(STORAGE_KEYS.myRequest, false);
        if (m && m.value) myReq = m.value;
      } catch {
        // no active request tracked for this device yet — that's fine
      }
      if (!cancelled) {
        setRequests(reqData);
        setTeams(teamData);
        setMyRequestId(myReq);
        setReady(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Persist on every change, once initial load has finished.
  useEffect(() => {
    if (!ready) return;
    window.storage.set(STORAGE_KEYS.requests, JSON.stringify(requests), true)
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true));
  }, [requests, ready]);

  useEffect(() => {
    if (!ready) return;
    window.storage.set(STORAGE_KEYS.teams, JSON.stringify(teams), true)
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true));
  }, [teams, ready]);

  const addRequest = (req) => {
    setRequests((prev) => [req, ...prev]);
    setMyRequestId(req.id);
    window.storage.set(STORAGE_KEYS.myRequest, req.id, false).catch(() => {});
  };

  const resetDemoData = async () => {
    setRequests(INITIAL_REQUESTS);
    setTeams(TEAMS);
    setShelters(INITIAL_SHELTERS);
    setResources(INITIAL_RELIEF);
    setLastRequestId(null);
    setSelectedMarker(null);
    setExpanded(null);
    setMyRequestId(null);
    try {
      await window.storage.set(STORAGE_KEYS.requests, JSON.stringify(INITIAL_REQUESTS), true);
      await window.storage.set(STORAGE_KEYS.teams, JSON.stringify(TEAMS), true);
      await window.storage.delete(STORAGE_KEYS.myRequest, false).catch(() => {});
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  };

  const myActiveRequest = requests.find((r) => r.id === myRequestId) || null;
  const mustBlockReport = myActiveRequest && !canReportAgain(myActiveRequest, now);

  const sharedStyles = (
    <style>{`
      ${FONT_IMPORT}
      .font-display { font-family: 'Space Grotesk', 'IBM Plex Sans', sans-serif; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; }
      button { cursor: pointer; }
      *:focus-visible { outline: 2px solid #0E7490; outline-offset: 2px; }

      /* FloodLink background: one large flowing composition (never tiled) —
         soft topographic contours, river-current bands and a faint node
         network, on a modern gradient wash. Everything is low-opacity and
         sits behind cards/maps/alerts, which keep their own solid surfaces
         so readability and contrast are unaffected. */
      .fl-app-bg {
        background-color: #E7F1F4;
        background-image:
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 1024'><g fill='none' stroke='%230F1B2B' stroke-opacity='0.032' stroke-width='2'><circle cx='1180' cy='120' r='90'/><circle cx='1180' cy='120' r='150'/><circle cx='1180' cy='120' r='215'/><circle cx='1180' cy='120' r='285'/><circle cx='1180' cy='120' r='360'/></g><path d='M-100 300 C 250 220, 450 420, 760 340 S 1250 180, 1560 320' stroke='%230E7490' stroke-opacity='0.11' stroke-width='3' fill='none'/><path d='M-100 380 C 260 300, 470 500, 780 420 S 1260 260, 1560 400' stroke='%2338A3BE' stroke-opacity='0.09' stroke-width='2.4' fill='none'/><path d='M-100 440 C 270 370, 480 560, 800 480 S 1270 330, 1560 460' stroke='%23155E75' stroke-opacity='0.06' stroke-width='2' fill='none'/><path d='M-100 900 C 300 800, 520 1010, 840 930 S 1300 760, 1560 900' stroke='%23155E75' stroke-opacity='0.10' stroke-width='3' fill='none'/><path d='M-100 960 C 300 880, 540 1060, 860 980 S 1320 820, 1560 960' stroke='%230E7490' stroke-opacity='0.07' stroke-width='2' fill='none'/><path d='M-100 1024 C 150 760, 380 900, 620 760 C 820 650, 950 800, 1180 700 L1560 1024 L-100 1024 Z' fill='%230E7490' fill-opacity='0.05'/><g stroke='%230F1B2B' stroke-opacity='0.075' stroke-width='1.4'><line x1='70' y1='95' x2='215' y2='45'/><line x1='215' y1='45' x2='335' y2='135'/><line x1='70' y1='95' x2='155' y2='195'/><line x1='335' y1='135' x2='435' y2='65'/><line x1='155' y1='195' x2='260' y2='250'/></g><g fill='%230E7490' fill-opacity='0.22'><circle cx='70' cy='95' r='4.5'/><circle cx='215' cy='45' r='4.5'/><circle cx='335' cy='135' r='4.5'/><circle cx='155' cy='195' r='4.5'/><circle cx='435' cy='65' r='4.5'/><circle cx='260' cy='250' r='4.5'/></g></svg>"),
          radial-gradient(900px 620px at 88% 6%, rgba(56,163,190,0.16) 0%, transparent 62%),
          radial-gradient(700px 700px at 4% 96%, rgba(21,94,117,0.12) 0%, transparent 60%),
          linear-gradient(165deg, #EFF7F9 0%, #E7F2F5 35%, #DFEDF1 68%, #D9E9EE 100%);
        background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
        background-size: cover, cover, cover, cover;
        background-position: center top, center top, center top, center top;
      }

      /* Fixes for a few fixed-pixel values that Tailwind's arbitrary-value
         syntax (text-[11px], h-[2px], grid-cols-[...], etc.) can't express
         in this environment without a JIT compiler — same visual intent,
         plain CSS instead. */
      .fl-text-2xs { font-size: 10px; line-height: 1.3; }
      .fl-text-xxs { font-size: 11px; line-height: 1.4; }
      .fl-h-line { height: 2px; }
      .fl-min-w-640 { min-width: 640px; }
      .fl-connector { position: absolute; left: 13px; top: 1.75rem; bottom: 0; width: 2px; }
      .fl-priority-grid { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
      @media (min-width: 640px) {
        .fl-priority-grid { grid-template-columns: 100px 1fr 100px 120px 110px; }
      }
    `}</style>
  );

  if (!ready) {
    return (
      <div className="fl-app-bg min-h-screen w-full grid place-items-center" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {sharedStyles}
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} color="#0E7490" className="animate-spin" />
          <p className="font-mono text-xs" style={{ color: "#64748B" }}>Loading FloodLink operational data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fl-app-bg min-h-screen w-full" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {sharedStyles}

      <Header view={view} setView={setView} role={role} setRole={setRole} onLogoClick={goBack} />

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium justify-center" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          <CloudOff size={13} /> Changes aren't syncing right now — you're working from a local, unsaved copy.
        </div>
      )}

      {view === "landing" && <Landing setView={setView} />}
      {view === "citizen" && <CitizenDashboard setView={setView} />}
      {view === "rescue-form" && (
        mustBlockReport
          ? <AlreadyReportedNotice request={myActiveRequest} now={now} requests={requests} setView={setView} />
          : <RescueForm setView={setView} addRequest={addRequest} setLastRequestId={setLastRequestId} />
      )}
      {view === "rescue-status" && <RescueStatus requests={requests} lastRequestId={lastRequestId || myRequestId} now={now} setView={setView} />}
      {view === "shelters" && <Shelters setView={setView} shelters={shelters} />}
      {view === "contacts" && <Contacts />}
      {view === "scenario" && <Scenario setView={setView} />}
      {view === "command" && (
        <CommandCenter
          requests={requests} setRequests={setRequests} teams={teams} setTeams={setTeams}
          shelters={shelters} setShelters={setShelters}
          expanded={expanded} setExpanded={setExpanded}
          selectedMarker={selectedMarker} setSelectedMarker={setSelectedMarker}
          onBroadcast={() => setShowBroadcast(true)}
          resources={resources} setResources={setResources}
        />
      )}

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
      <Footer onReset={resetDemoData} saveError={saveError} />
    </div>
  );
}
