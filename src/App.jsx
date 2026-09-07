import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Droplets,
  Gauge,
  Home,
  MapPin,
  Menu,
  Navigation,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Thermometer,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getFloodData } from "./services/floodData";
const initialLocations = [
  {
    id: 1,
    name: "Patna",
    state: "Bihar",
    rainfall: 82,
    river: 71,
    soil: 68,
    risk: "High",
  },
  {
    id: 2,
    name: "Kolkata",
    state: "West Bengal",
    rainfall: 58,
    river: 44,
    soil: 51,
    risk: "Moderate",
  },
  {
    id: 3,
    name: "Guwahati",
    state: "Assam",
    rainfall: 91,
    river: 84,
    soil: 79,
    risk: "Critical",
  },
];

function getRisk(rainfall, river, soil) {
  const score = Math.round(
    rainfall * 0.45 +
      river * 0.35 +
      soil * 0.2
  );

  if (score >= 80) return { label: "Critical", score };
  if (score >= 60) return { label: "High", score };
  if (score >= 40) return { label: "Moderate", score };
  return { label: "Low", score };
}

function RiskBadge({ risk }) {
  const styles = {
    Critical: "risk critical",
    High: "risk high",
    Moderate: "risk moderate",
    Low: "risk low",
  };

  return <span className={styles[risk] || "risk"}>{risk}</span>;
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [locations, setLocations] = useState(initialLocations);
  const [selectedLocation, setSelectedLocation] = useState(initialLocations[0]);
  const [notifications, setNotifications] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const [liveData, setLiveData] = useState(null);
const [loadingLiveData, setLoadingLiveData] = useState(false);
const [apiError, setApiError] = useState("");

  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
  loadLiveData(selectedLocation.name);
}, [selectedLocation]);

async function loadLiveData(location) {
  try {
    setLoadingLiveData(true);
    setApiError("");

    const data = await getFloodData(location);

    setLiveData(data);
  } catch (error) {
    console.error(error);
    setApiError("Unable to load live flood data");
  } finally {
    setLoadingLiveData(false);
  }
}

  const risk = useMemo(
    () =>
      getRisk(
        liveData?.weather?.rain ??
         selectedLocation.rainfall,
liveData?.river?.discharge ?? 
selectedLocation.river,
        selectedLocation.soil
      ),
    [selectedLocation, liveData]
  );

  const refreshData = () => {
    const updated = locations.map((location) => {
      const rainfall = Math.max(
        20,
        Math.min(100, location.rainfall + Math.floor(Math.random() * 11) - 5)
      );

      const river = Math.max(
        20,
        Math.min(100, location.river + Math.floor(Math.random() * 11) - 5)
      );

      const soil = Math.max(
        20,
        Math.min(100, location.soil + Math.floor(Math.random() * 9) - 4)
      );

      const calculated = getRisk(rainfall, river, soil);

      return {
        ...location,
        rainfall,
        river,
        soil,
        risk: calculated.label,
      };
    });

    setLocations(updated);

    const selected = updated.find(
      (location) => location.id === selectedLocation.id
    );

    if (selected) setSelectedLocation(selected);

    setLastUpdated("Just now");
  };

  const addLocation = () => {
    if (!newLocation.trim()) return;

    const location = {
      id: Date.now(),
      name: newLocation.trim(),
      state: "New monitoring zone",
      rainfall: 45,
      river: 38,
      soil: 42,
      risk: "Moderate",
    };

    setLocations([...locations, location]);
    setSelectedLocation(location);
    setNewLocation("");
    setShowAddLocation(false);
    setActivePage("Locations");
  };

  const acknowledgeAlerts = () => {
    setNotifications(0);
    setShowNotifications(false);
  };

  const navItems = [
    { name: "Dashboard", icon: Home },
    { name: "Map", icon: MapPin },
    { name: "Alerts", icon: ShieldAlert },
    { name: "Weather", icon: CloudRain },
    { name: "Locations", icon: Navigation },
    { name: "Users", icon: Users },
  ];

  return (
    <div className="app">

      {liveData && (
  <div style={{
    margin: "16px",
    padding: "16px",
    background: "#10243e",
    borderRadius: "12px",
    color: "white"
  }}>
    <h2>🌊 Live Flood Data</h2>

    {loadingLiveData && <p>Loading live data...</p>}

    {apiError && <p>{apiError}</p>}

    {!loadingLiveData && !apiError && (
      <>
        <p>📍 Location: <strong>{liveData.location}</strong></p>
        <p>🌧️ Rainfall: <strong>{liveData.weather.rain ?? 0} mm</strong></p>
        <p>🌡️ Temperature: <strong>{liveData.weather.temperature ?? "--"} °C</strong></p>
        <p>🌊 River Discharge: <strong>{liveData.river.discharge ?? "--"} m³/s</strong></p>
      </>
    )}
  </div>
)}
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #06111f;
        }

        button, input {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          color: #eaf4ff;
          background:
            radial-gradient(circle at 80% 0%, rgba(0, 184, 255, .12), transparent 30%),
            radial-gradient(circle at 0% 100%, rgba(25, 118, 210, .12), transparent 35%),
            #06111f;
        }

        .topbar {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          background: rgba(7, 19, 33, .92);
          backdrop-filter: blur(18px);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(135deg, #00c6ff, #1769ff);
          box-shadow: 0 8px 30px rgba(0, 174, 255, .25);
        }

        .brand h1 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -.4px;
        }

        .brand span {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          color: #7f9ab5;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 11px;
          background: #0b1b2d;
          color: #b8cce0;
          display: grid;
          place-items: center;
          position: relative;
        }

        .icon-btn:hover {
          background: #102942;
          color: white;
        }

        .notification-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ff5964;
          box-shadow: 0 0 0 3px #0b1b2d;
        }

        .layout {
          display: flex;
          min-height: calc(100vh - 72px);
        }

        .sidebar {
          width: 230px;
          padding: 22px 14px;
          border-right: 1px solid rgba(255,255,255,.07);
          background: rgba(5, 16, 29, .7);
        }

        .side-label {
          padding: 0 12px 10px;
          color: #58718a;
          text-transform: uppercase;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-bottom: 5px;
          border: 0;
          border-radius: 11px;
          color: #8da6be;
          background: transparent;
          text-align: left;
        }

        .nav-btn:hover {
          background: rgba(34, 122, 197, .12);
          color: white;
        }

        .nav-btn.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(0, 174, 255, .2), rgba(0, 174, 255, .04));
          box-shadow: inset 3px 0 #00bfff;
        }

        .main {
          flex: 1;
          padding: 28px;
          max-width: 1500px;
          margin: 0 auto;
          width: 100%;
        }

        .page-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #42cfff;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .page-head h2 {
          margin: 0;
          font-size: clamp(25px, 3vw, 36px);
          letter-spacing: -1px;
        }

        .page-head p {
          margin: 8px 0 0;
          color: #718ba5;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 9px;
        }

        .primary-btn, .secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 11px;
          padding: 11px 15px;
          border: 1px solid transparent;
          font-weight: 700;
          font-size: 13px;
        }

        .primary-btn {
          color: white;
          background: linear-gradient(135deg, #009ee8, #155cf6);
          box-shadow: 0 8px 25px rgba(0, 136, 255, .2);
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(0, 136, 255, .3);
        }

        .secondary-btn {
          color: #b8cce0;
          background: #0b1b2d;
          border-color: rgba(255,255,255,.08);
        }

        .secondary-btn:hover {
          color: white;
          background: #102942;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card, .panel {
          border: 1px solid rgba(255,255,255,.07);
          background: linear-gradient(145deg, rgba(15, 35, 55, .92), rgba(8, 23, 39, .92));
          border-radius: 17px;
          box-shadow: 0 15px 40px rgba(0,0,0,.12);
        }

        .stat-card {
          padding: 18px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #7892aa;
          font-size: 12px;
          font-weight: 700;
        }

        .stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(0, 174, 255, .12);
          color: #36c9ff;
        }

        .stat-value {
          margin-top: 15px;
          font-size: 29px;
          font-weight: 800;
        }

        .stat-change {
          color: #5fd69b;
          font-size: 11px;
          margin-top: 4px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.35fr .65fr;
          gap: 18px;
        }

        .panel {
          padding: 20px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 18px;
        }

        .panel-title {
          margin: 0;
          font-size: 16px;
        }

        .panel-subtitle {
          margin: 4px 0 0;
          color: #68839c;
          font-size: 11px;
        }

        .risk-panel {
          min-height: 330px;
          position: relative;
          overflow: hidden;
        }

        .risk-panel::after {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          right: -100px;
          bottom: -120px;
          border-radius: 50%;
          background: rgba(0, 174, 255, .08);
        }

        .risk-main {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .risk-circle {
          width: 170px;
          height: 170px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle, #091a2b 55%, transparent 56%),
            conic-gradient(#ffae42 ${risk.score * 1}%, #12304a 0);
          flex-shrink: 0;
          position: relative;
        }

        .risk-score {
          text-align: center;
        }

        .risk-score strong {
          display: block;
          font-size: 42px;
        }

        .risk-score span {
          color: #7190aa;
          font-size: 11px;
        }

        .risk-details h3 {
          margin: 0 0 6px;
          font-size: 25px;
        }

        .risk-details p {
          margin: 0;
          color: #7893aa;
          line-height: 1.6;
          font-size: 13px;
          max-width: 450px;
        }

        .risk {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .critical {
          color: #ff9aa1;
          background: rgba(255, 76, 87, .13);
        }

        .high {
          color: #ffc878;
          background: rgba(255, 174, 66, .13);
        }

        .moderate {
          color: #7ddcff;
          background: rgba(0, 188, 255, .12);
        }

        .low {
          color: #79e6ae;
          background: rgba(68, 211, 143, .12);
        }

        .factors {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 25px;
        }

        .factor {
          padding: 12px;
          border-radius: 11px;
          background: rgba(255,255,255,.035);
        }

        .factor-top {
          display: flex;
          justify-content: space-between;
          color: #819ab1;
          font-size: 11px;
        }

        .factor strong {
          display: block;
          margin-top: 6px;
          font-size: 18px;
        }

        .bar {
          height: 5px;
          border-radius: 20px;
          background: #142c42;
          overflow: hidden;
          margin-top: 9px;
        }

        .bar > div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #00bfff, #3378ff);
        }

        .alert-list {
          display: grid;
          gap: 9px;
        }

        .alert-item {
          padding: 13px;
          border-radius: 12px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.04);
          display: flex;
          gap: 11px;
          align-items: flex-start;
        }

        .alert-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: rgba(255, 86, 96, .12);
          color: #ff727b;
          flex-shrink: 0;
        }

        .alert-item strong {
          font-size: 12px;
        }

        .alert-item p {
          margin: 3px 0 0;
          color: #718ca5;
          font-size: 11px;
        }

        .location-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .location-card {
          padding: 18px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(10, 27, 45, .75);
          cursor: pointer;
          transition: .2s;
        }

        .location-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 191, 255, .3);
        }

        .location-card.selected {
          border-color: rgba(0, 191, 255, .55);
          box-shadow: inset 0 0 0 1px rgba(0,191,255,.12);
        }

        .location-name {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .location-name h3 {
          margin: 0;
          font-size: 15px;
        }

        .location-name p {
          margin: 4px 0 0;
          color: #657f97;
          font-size: 11px;
        }

        .mini-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 15px;
        }

        .mini {
          padding: 9px;
          border-radius: 9px;
          background: rgba(255,255,255,.035);
        }

        .mini span {
          display: block;
          color: #657f97;
          font-size: 9px;
        }

        .mini strong {
          display: block;
          margin-top: 3px;
          font-size: 13px;
        }

        .map {
          min-height: 285px;
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(rgba(0,191,255,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,191,255,.045) 1px, transparent 1px),
            radial-gradient(circle at 45% 45%, rgba(0,177,255,.15), transparent 28%),
            #071a2a;
          background-size: 35px 35px, 35px 35px, auto, auto;
          border-radius: 13px;
        }

        .map::before {
          content: "";
          position: absolute;
          width: 70%;
          height: 130%;
          left: 17%;
          top: -10%;
          background: rgba(0, 129, 255, .09);
          clip-path: polygon(30% 0, 62% 12%, 50% 30%, 78% 48%, 45% 68%, 65% 100%, 20% 90%, 40% 57%, 12% 36%);
        }

        .pin {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #ffb24a;
          color: #16202a;
          border: 3px solid rgba(255,255,255,.8);
          box-shadow: 0 0 0 8px rgba(255,174,66,.1), 0 8px 25px rgba(0,0,0,.3);
        }

        .pin.critical {
          background: #ff5964;
          color: white;
        }

        .pin.low {
          background: #54d995;
        }

        .pin-label {
          position: absolute;
          left: 35px;
          top: 4px;
          white-space: nowrap;
          color: white;
          font-size: 10px;
          font-weight: 800;
        }

        .empty-page {
          min-height: 430px;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .empty-icon {
          width: 70px;
          height: 70px;
          margin: auto;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: rgba(0,191,255,.1);
          color: #39caff;
        }

        .empty-page h2 {
          margin: 18px 0 6px;
        }

        .empty-page p {
          margin: 0 auto 20px;
          max-width: 450px;
          color: #718ba4;
          line-height: 1.6;
          font-size: 13px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.65);
          backdrop-filter: blur(7px);
          display: grid;
          place-items: center;
          z-index: 100;
          padding: 20px;
        }

        .modal {
          width: min(450px, 100%);
          padding: 22px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 17px;
          background: #0b1d30;
          box-shadow: 0 30px 80px rgba(0,0,0,.4);
        }

        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal h3 {
          margin: 0;
        }

        .input {
          width: 100%;
          margin: 18px 0;
          padding: 13px;
          color: white;
          background: #071525;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          outline: none;
        }

        .input:focus {
          border-color: #00bfff;
        }

        .notification-panel {
          position: fixed;
          right: 25px;
          top: 65px;
          width: 330px;
          z-index: 50;
          padding: 15px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 15px;
          background: #0b1d30;
          box-shadow: 0 25px 70px rgba(0,0,0,.35);
        }

        .notification-panel h3 {
          margin: 0;
          font-size: 14px;
        }

        .notification {
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .notification strong {
          font-size: 12px;
        }

        .notification p {
          margin: 4px 0 0;
          color: #6f899f;
          font-size: 11px;
        }

        @media (max-width: 1000px) {
          .sidebar {
            width: 75px;
          }

          .nav-btn span, .side-label {
            display: none;
          }

          .nav-btn {
            justify-content: center;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .location-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .topbar {
            padding: 0 15px;
          }

          .sidebar {
            display: none;
          }

          .main {
            padding: 18px 14px;
          }

          .page-head {
            flex-direction: column;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .risk-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .factors {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Droplets size={23} />
          </div>
          <div>
            <h1>Flood-Forge</h1>
            <span>AI-Powered Flood Intelligence</span>
          </div>
        </div>

        <div className="top-actions">
          <button
            className="icon-btn"
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {notifications > 0 && <i className="notification-dot" />}
          </button>

          <button
            className="icon-btn"
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {showNotifications && (
        <div className="notification-panel">
          <div className="modal-head">
            <h3>Notifications</h3>
            <button
              className="icon-btn"
              onClick={() => setShowNotifications(false)}
            >
              <X size={15} />
            </button>
          </div>

          <div className="notification">
            <strong>⚠️ High rainfall detected</strong>
            <p>Patna monitoring zone has crossed the warning threshold.</p>
          </div>

          <div className="notification">
            <strong>🌧️ Heavy rainfall forecast</strong>
            <p>Rainfall intensity may increase over the next 6 hours.</p>
          </div>

          <div className="notification">
            <strong>🌊 River level rising</strong>
            <p>Guwahati river level is approaching the critical zone.</p>
          </div>

          <button
            className="secondary-btn"
            style={{ width: "100%", marginTop: 12 }}
            onClick={acknowledgeAlerts}
          >
            Mark all as read
          </button>
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <div className="side-label">Monitoring</div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-btn ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setShowMenu(false);
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}

          <div className="side-label" style={{ marginTop: 25 }}>
            System
          </div>

          <button
            className="nav-btn"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </aside>

        <main className="main">
          {activePage === "Dashboard" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">
                    <Activity size={14} />
                    LIVE MONITORING SYSTEM
                  </div>

                  <h2>Flood Risk Dashboard</h2>

                  <p>
                    Multi-source environmental intelligence for early warning.
                  </p>
                </div>

                <div className="actions">
                  <button
                    className="secondary-btn"
                    onClick={refreshData}
                  >
                    <RefreshCw size={15} />
                    Refresh
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() => setShowAddLocation(true)}
                  >
                    <Plus size={15} />
                    Add Location
                  </button>
                </div>
              </div>

              <section className="stats">
                <div className="stat-card">
                  <div className="stat-top">
                    Active Locations
                    <div className="stat-icon">
                      <MapPin size={17} />
                    </div>
                  </div>
                  <div className="stat-value">{locations.length}</div>
                  <div className="stat-change">● Monitoring normally</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    High Risk Zones
                    <div className="stat-icon">
                      <ShieldAlert size={17} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {locations.filter(
                      (x) => x.risk === "High" || x.risk === "Critical"
                    ).length}
                  </div>
                  <div className="stat-change">Requires attention</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    Rainfall Intensity
                    <div className="stat-icon">
                      <CloudRain size={17} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {selectedLocation.rainfall}%
                  </div>
                  <div className="stat-change">Based on latest sample</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    System Status
                    <div className="stat-icon">
                      <Zap size={17} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ fontSize: 23 }}>
                    ONLINE
                  </div>
                  <div className="stat-change">● All systems operational</div>
                </div>
              </section>

              <div className="dashboard-grid">
                <section className="panel risk-panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">
                        Current Flood Risk
                      </h3>
                      <p className="panel-subtitle">
                        Selected location: {selectedLocation.name}
                      </p>
                    </div>

                    <RiskBadge risk={risk.label} />
                  </div>

                  <div className="risk-main">
                    <div className="risk-circle">
                      <div className="risk-score">
                        <strong>{risk.score}</strong>
                        <span>RISK SCORE</span>
                      </div>
                    </div>

                    <div className="risk-details">
                      <h3>{risk.label} Risk</h3>

                      <p>
                        Flood risk is estimated using rainfall intensity,
                        river-level conditions and soil saturation.
                      </p>

                      <div style={{ marginTop: 15 }}>
                        <button
                          className="primary-btn"
                          onClick={refreshData}
                        >
                          <Gauge size={15} />
                          Recalculate Risk
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="factors">
                    <div className="factor">
                      <div className="factor-top">
                        Rainfall
                        <span>{selectedLocation.rainfall}%</span>
                      </div>
                      <strong>Rain Intensity</strong>
                      <div className="bar">
                        <div style={{ width: `${selectedLocation.rainfall}%` }} />
                      </div>
                    </div>

                    <div className="factor">
                      <div className="factor-top">
                        River Level
                        <span>{selectedLocation.river}%</span>
                      </div>
                      <strong>Water Level</strong>
                      <div className="bar">
                        <div style={{ width: `${selectedLocation.river}%` }} />
                      </div>
                    </div>

                    <div className="factor">
                      <div className="factor-top">
                        Soil
                        <span>{selectedLocation.soil}%</span>
                      </div>
                      <strong>Saturation</strong>
                      <div className="bar">
                        <div style={{ width: `${selectedLocation.soil}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">Active Alerts</h3>
                      <p className="panel-subtitle">
                        Latest system warnings
                      </p>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() => setActivePage("Alerts")}
                    >
                      View all
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="alert-list">
                    <div className="alert-item">
                      <div className="alert-icon">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <strong>High rainfall — Patna</strong>
                        <p>Rainfall threshold exceeded.</p>
                      </div>
                    </div>

                    <div className="alert-item">
                      <div className="alert-icon">
                        <Droplets size={16} />
                      </div>
                      <div>
                        <strong>River rising — Guwahati</strong>
                        <p>River level approaching critical range.</p>
                      </div>
                    </div>

                    <div className="alert-item">
                      <div className="alert-icon">
                        <CloudRain size={16} />
                      </div>
                      <div>
                        <strong>Heavy rain forecast</strong>
                        <p>Increased rainfall probability detected.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <section className="panel" style={{ marginTop: 18 }}>
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Monitored Locations</h3>
                    <p className="panel-subtitle">
                      Click a location to analyze its flood risk
                    </p>
                  </div>

                  <span style={{ color: "#5f7991", fontSize: 11 }}>
                    Updated {lastUpdated}
                  </span>
                </div>

                <div className="location-grid">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className={`location-card ${
                        selectedLocation.id === location.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="location-name">
                        <div>
                          <h3>{location.name}</h3>
                          <p>{location.state}</p>
                        </div>

                        <RiskBadge risk={location.risk} />
                      </div>

                      <div className="mini-metrics">
                        <div className="mini">
                          <span>Rainfall</span>
                          <strong>
                            {liveData?.weather?.rain ??
                          location.rainfall} mm
                          </strong>
                        </div>

                        <div className="mini">
                          <span>River</span>
                          <strong>
  {liveData?.river?.discharge ??
   location.river} m³/s
</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activePage === "Map" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">
                    <MapPin size={14} />
                    GEOSPATIAL VIEW
                  </div>
                  <h2>Flood Risk Map</h2>
                  <p>
                    Visual overview of monitored flood-risk locations.
                  </p>
                </div>
              </div>

              <section className="panel">
                <div className="map">
                  {locations.map((location, index) => {
                    const positions = [
                      { left: "35%", top: "35%" },
                      { left: "60%", top: "58%" },
                      { left: "48%", top: "22%" },
                    ];

                    return (
                      <button
                        key={location.id}
                        className={`pin ${
                          location.risk === "Critical"
                            ? "critical"
                            : location.risk === "Low"
                            ? "low"
                            : ""
                        }`}
                        style={positions[index % positions.length]}
                        onClick={() => {
                          setSelectedLocation(location);
                          setActivePage("Dashboard");
                        }}
                      >
                        <MapPin size={17} />
                        <span className="pin-label">
                          {location.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activePage === "Alerts" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">
                    <ShieldAlert size={14} />
                    EARLY WARNING
                  </div>
                  <h2>Flood Alerts</h2>
                  <p>
                    Warnings generated from the current prototype data.
                  </p>
                </div>

                <button
                  className="primary-btn"
                  onClick={refreshData}
                >
                  <RefreshCw size={15} />
                  Refresh Alerts
                </button>
              </div>

              <section className="panel">
                <div className="alert-list">
                  {locations.map((location) => (
                    <div className="alert-item" key={location.id}>
                      <div className="alert-icon">
                        {location.risk === "Critical" ? (
                          <AlertTriangle size={17} />
                        ) : (
                          <ShieldAlert size={17} />
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <strong>
                          {location.risk} flood risk detected —{" "}
                          {location.name}
                        </strong>
                        <p>
                          Rainfall {location.rainfall}% · River{" "}
                          {location.river}% · Soil{" "}
                          {location.soil}%
                        </p>
                      </div>

                      <RiskBadge risk={location.risk} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activePage === "Weather" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">
                    <CloudRain size={14} />
                    ENVIRONMENTAL DATA
                  </div>
                  <h2>Weather Intelligence</h2>
                  <p>
                    Environmental signals contributing to the prototype risk
                    model.
                  </p>
                </div>
              </div>

              <section className="stats">
                <div className="stat-card">
                  <div className="stat-top">
                    Rainfall
                    <div className="stat-icon">
                      <CloudRain size={17} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {selectedLocation.rainfall}%
                  </div>
                  <div className="stat-change">
                    {selectedLocation.rainfall > 70
                      ? "Heavy"
                      : "Moderate"}{" "}
                    intensity
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    River Level
                    <div className="stat-icon">
                      <Droplets size={17} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {selectedLocation.river}%
                  </div>
                  <div className="stat-change">Monitoring active</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    Soil Moisture
                    <div className="stat-icon">
                      <Activity size={17} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {selectedLocation.soil}%
                  </div>
                  <div className="stat-change">Saturation indicator</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    Temperature
                    <div className="stat-icon">
                      <Thermometer size={17} />
                    </div>
                  </div>
                  <div className="stat-value">29°C</div>
                  <div className="stat-change">Current sample</div>
                </div>
              </section>
            </>
          )}

          {activePage === "Locations" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">
                    <Navigation size={14} />
                    MONITORING ZONES
                  </div>
                  <h2>Locations</h2>
                  <p>
                    Manage areas being monitored by Flood-Forge.
                  </p>
                </div>

                <button
                  className="primary-btn"
                  onClick={() => setShowAddLocation(true)}
                >
                  <Plus size={15} />
                  Add Location
                </button>
              </div>

              <section className="panel">
                <div className="location-grid">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="location-card"
                      onClick={() => {
                        setSelectedLocation(location);
                        setActivePage("Dashboard");
                      }}
                    >
                      <div className="location-name">
                        <div>
                          <h3>{location.name}</h3>
                          <p>{location.state}</p>
                        </div>
                        <RiskBadge risk={location.risk} />
                      </div>

                      <div className="mini-metrics">
                        <div className="mini">
                          <span>Rainfall</span>
                          <strong>{location.rainfall}%</strong>
                        </div>
                        <div className="mini">
                          <span>River</span>
                          <strong>{location.river}%</strong>
                        </div>
                        <div className="mini">
                          <span>Soil</span>
                          <strong>{location.soil}%</strong>
                        </div>
                        <div className="mini">
                          <span>Action</span>
                          <strong>Analyze →</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activePage === "Users" && (
            <div className="empty-page panel">
              <div>
                <div className="empty-icon">
                  <Users size={30} />
                </div>
                <h2>Community & Response Network</h2>
                <p>
                  This module can later connect citizens, emergency
                  responders and administrators to the Flood-Forge alert
                  network.
                </p>
                <button
                  className="primary-btn"
                  onClick={() => setShowSettings(true)}
                >
                  Configure Module
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddLocation && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddLocation(false)}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Add Monitoring Location</h3>

              <button
                className="icon-btn"
                onClick={() => setShowAddLocation(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: "#718ba4", fontSize: 12 }}>
              Add a city or monitoring zone to the prototype.
            </p>

            <input
              className="input"
              placeholder="Example: Delhi"
              value={newLocation}
              onChange={(event) => setNewLocation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addLocation();
              }}
            />

            <button
              className="primary-btn"
              style={{ width: "100%" }}
              onClick={addLocation}
            >
              <Plus size={15} />
              Add Location
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Flood-Forge Settings</h3>

              <button
                className="icon-btn"
                onClick={() => setShowSettings(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="alert-item" style={{ marginTop: 18 }}>
              <CheckCircle2 color="#5fd69b" size={20} />

              <div>
                <strong>Prototype Mode</strong>
                <p>
                  Dashboard currently uses simulated environmental data.
                  Real APIs can be connected later.
                </p>
              </div>
            </div>

            <div className="alert-item" style={{ marginTop: 10 }}>
              <Activity color="#3dccff" size={20} />

              <div>
                <strong>Risk Model</strong>
                <p>
                  Rainfall 45% · River level 35% · Soil saturation 20%.
                </p>
              </div>
            </div>

            <button
              className="primary-btn"
              style={{ width: "100%", marginTop: 18 }}
              onClick={() => setShowSettings(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;