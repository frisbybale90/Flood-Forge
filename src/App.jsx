import React, { useState, useEffect } from "react";
import {
  Menu,
  AlertTriangle,
  MapPin,
  Users,
  CloudRain,
  Leaf,
  Navigation,
  Droplets,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";

// ===============================
// Flood-Forge Local Storage Keys
// ===============================

const LOCATIONS_KEY = "floodforge_locations";
const ALERTS_KEY = "floodforge_alerts";
const SETTINGS_KEY = "floodforge_settings";

// ===============================
// Main App
// ===============================

function App() {
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({});

  // Load saved data when the app starts
  useEffect(() => {
    try {
      const savedLocations = localStorage.getItem(LOCATIONS_KEY);
      const savedAlerts = localStorage.getItem(ALERTS_KEY);
      const savedSettings = localStorage.getItem(SETTINGS_KEY);

      if (savedLocations) {
        setLocations(JSON.parse(savedLocations));
      }

      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  // Save locations whenever they change
  useEffect(() => {
    localStorage.setItem(
      LOCATIONS_KEY,
      JSON.stringify(locations)
    );
  }, [locations]);

  // Save alerts whenever they change
  useEffect(() => {
    localStorage.setItem(
      ALERTS_KEY,
      JSON.stringify(alerts)
    );
  }, [alerts]);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  }, [settings]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2">
              <Droplets size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Flood-Forge
              </h1>

              <p className="text-xs text-slate-400">
                AI-Powered Flood Prediction
              </p>
            </div>
          </div>

          <button className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Hero */}
        <section className="mb-10">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950 to-slate-900 p-8">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-2 text-blue-400">
                <CloudRain size={22} />
                <span className="font-semibold">
                  Multi-source Flood Intelligence
                </span>
              </div>

              <h2 className="mb-4 text-4xl font-bold">
                Predict floods before they become disasters.
              </h2>

              <p className="text-lg text-slate-300">
                Flood-Forge combines environmental, weather,
                rainfall and geospatial information to provide
                early flood-risk warnings.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <CloudRain className="mb-4 text-blue-400" size={30} />
            <h3 className="font-semibold">Rainfall</h3>
            <p className="mt-2 text-3xl font-bold">--</p>
            <p className="text-sm text-slate-400">
              Current data
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <MapPin className="mb-4 text-green-400" size={30} />
            <h3 className="font-semibold">Locations</h3>
            <p className="mt-2 text-3xl font-bold">
              {locations.length}
            </p>
            <p className="text-sm text-slate-400">
              Monitored locations
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <AlertTriangle
              className="mb-4 text-yellow-400"
              size={30}
            />
            <h3 className="font-semibold">Alerts</h3>
            <p className="mt-2 text-3xl font-bold">
              {alerts.length}
            </p>
            <p className="text-sm text-slate-400">
              Active alerts
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <BarChart3
              className="mb-4 text-purple-400"
              size={30}
            />
            <h3 className="font-semibold">
              Risk Level
            </h3>
            <p className="mt-2 text-3xl font-bold">
              LOW
            </p>
            <p className="text-sm text-slate-400">
              Current assessment
            </p>
          </div>

        </section>

        {/* Features */}
        <section className="mt-10 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <Navigation
              className="mb-4 text-blue-400"
              size={28}
            />

            <h3 className="mb-2 text-lg font-bold">
              Geospatial Monitoring
            </h3>

            <p className="text-slate-400">
              Analyze geographical information to identify
              areas vulnerable to flooding.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <Bell
              className="mb-4 text-yellow-400"
              size={28}
            />

            <h3 className="mb-2 text-lg font-bold">
              Early Warnings
            </h3>

            <p className="text-slate-400">
              Generate alerts when environmental conditions
              indicate increased flood risk.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <Users
              className="mb-4 text-green-400"
              size={28}
            />

            <h3 className="mb-2 text-lg font-bold">
              Community Safety
            </h3>

            <p className="text-slate-400">
              Help communities understand flood risks and
              prepare before an emergency occurs.
            </p>
          </div>

        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Flood-Forge • AI-powered flood prediction and
            early warning system
          </p>
        </footer>

      </main>
    </div>
  );
}

export default App;
