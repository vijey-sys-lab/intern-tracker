import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot, where
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { format, startOfDay, endOfDay } from "date-fns";

function fmtHM(s) {
  if (!s) return "0m";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function fmtSecs(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
}

export default function AdminDashboard({ user }) {
  const [sessions, setSessions] = useState([]);
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [liveElapsed, setLiveElapsed] = useState({});

  // Load all sessions
  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("startedAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Tick live sessions every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const live = {};
      sessions.forEach(s => {
        if (s.status === "active" && s.startedAt) {
          const start = s.startedAt.toDate ? s.startedAt.toDate().getTime() : now;
          live[s.id] = Math.floor((now - start) / 1000);
        }
      });
      setLiveElapsed(live);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  // Filter by selected date
  const filtered = sessions.filter(s => {
    if (!s.startedAt) return false;
    const d = s.startedAt.toDate ? s.startedAt.toDate() : new Date();
    return format(d, "yyyy-MM-dd") === filterDate;
  });

  const liveSessions = filtered.filter(s => s.status === "active");
  const doneSessions = filtered.filter(s => s.status === "done");
  const totalHours = doneSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const goalMetCount = doneSessions.filter(s => s.goalMet).length;

  // CSV export
  const exportCSV = () => {
    const rows = [["Name", "Email", "Date", "Task", "Duration (min)", "Target (min)", "Goal Met", "Status"]];
    filtered.forEach(s => {
      const d = s.startedAt?.toDate ? s.startedAt.toDate() : new Date();
      rows.push([
        s.name, s.email, format(d, "yyyy-MM-dd HH:mm"),
        s.task, Math.round((s.duration || 0) / 60),
        Math.round((s.target || 10800) / 60),
        s.goalMet ? "Yes" : "No", s.status
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `devverse-sessions-${filterDate}.csv`;
    a.click();
  };

  return (
    <div className="page">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="logo-dv">DV</div>
          <span className="logo-text">Devverse</span>
          <span className="badge badge-amber" style={{ marginLeft: 8, fontSize: 11 }}>Admin</span>
        </div>
        <div className="topbar-right">
          <div className="user-pill">
            <div className="user-avatar">VJ</div>
            Vijey
          </div>
          <button className="btn btn-sm" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>

      <main className="main-content" style={{ maxWidth: 1000 }}>

        {/* METRICS */}
        <div className="section-header">
          <div>
            <div className="section-title">Admin Dashboard</div>
            <div className="section-sub">Real-time intern session monitoring</div>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Live now</div>
            <div className="metric-value" style={{ color: liveSessions.length > 0 ? "var(--brand)" : "var(--text)" }}>
              {liveSessions.length}
            </div>
            <div className="metric-sub">active sessions</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Sessions today</div>
            <div className="metric-value">{filtered.length}</div>
            <div className="metric-sub">{format(new Date(filterDate), "dd MMM")}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Goals met</div>
            <div className="metric-value">{goalMetCount}</div>
            <div className="metric-sub">of {doneSessions.length} done</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total hours</div>
            <div className="metric-value">{Math.round(totalHours / 360) / 10}h</div>
            <div className="metric-sub">logged today</div>
          </div>
        </div>

        {/* LIVE SESSIONS */}
        {liveSessions.length > 0 && (
          <div className="card" style={{ borderColor: "var(--border-brand)" }}>
            <div className="card-title" style={{ color: "var(--brand)" }}>● Live sessions</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Task</th>
                  <th>Live time</th>
                  <th>Target</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.map(s => {
                  const el = liveElapsed[s.id] || 0;
                  const pct = Math.min(Math.round((el / (s.target || 10800)) * 100), 100);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {s.photoURL
                            ? <img src={s.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                            : <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                                {(s.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                          }
                          {s.name}
                        </div>
                      </td>
                      <td>{s.task}</td>
                      <td>
                        <span style={{ fontFamily: "var(--font-head)", fontWeight: 600, color: "var(--brand)" }}>
                          {fmtSecs(el)}
                        </span>
                      </td>
                      <td>{fmtHM(s.target)}</td>
                      <td style={{ minWidth: 100 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1, height: 4 }}>
                            <div className="progress-fill" style={{ width: pct + "%", transition: "width 1s linear" }} />
                          </div>
                          <span style={{ fontSize: 12, color: "var(--text2)", minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FILTER + EXPORT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 13, color: "var(--text2)" }}>Filter date:</label>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
          <button className="btn btn-sm" onClick={exportCSV}>
            ↓ Export CSV
          </button>
        </div>

        {/* ALL SESSIONS TABLE */}
        <div className="card">
          <div className="card-title">Session log — {format(new Date(filterDate), "dd MMMM yyyy")}</div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              No sessions found for this date.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Task</th>
                    <th>Check-in</th>
                    <th>Duration</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const d = s.startedAt?.toDate ? s.startedAt.toDate() : new Date();
                    const el = s.status === "active" ? (liveElapsed[s.id] || 0) : (s.duration || 0);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {s.photoURL
                              ? <img src={s.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: "50%" }} />
                              : <div className="user-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                                  {(s.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                            }
                            <div>
                              <div>{s.name}</div>
                              <div style={{ fontSize: 12, color: "var(--text3)" }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.task}</td>
                        <td style={{ color: "var(--text2)", whiteSpace: "nowrap" }}>{format(d, "hh:mm a")}</td>
                        <td style={{ fontWeight: 500 }}>{fmtHM(el)}</td>
                        <td style={{ color: "var(--text2)" }}>{fmtHM(s.target)}</td>
                        <td>
                          {s.status === "active"
                            ? <span className="badge badge-green badge-pulse">Live</span>
                            : s.goalMet
                              ? <span className="badge badge-green">✓ Goal met</span>
                              : <span className="badge badge-amber">Short</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ALL TIME SUMMARY (unique interns) */}
        <div className="card">
          <div className="card-title">All interns — overall stats</div>
          <AllInternStats sessions={sessions} />
        </div>
      </main>
    </div>
  );
}

function AllInternStats({ sessions }) {
  const map = {};
  sessions.forEach(s => {
    if (s.status !== "done") return;
    if (!map[s.uid]) map[s.uid] = { name: s.name, email: s.email, photoURL: s.photoURL, total: 0, count: 0, goals: 0 };
    map[s.uid].total += s.duration || 0;
    map[s.uid].count += 1;
    if (s.goalMet) map[s.uid].goals += 1;
  });
  const interns = Object.values(map).sort((a, b) => b.total - a.total);

  if (interns.length === 0) return <div className="empty-state"><div className="empty-icon">👥</div>No interns yet.</div>;

  function fmtHM(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Intern</th>
            <th>Sessions</th>
            <th>Total hours</th>
            <th>Goals met</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {interns.map((i, idx) => (
            <tr key={i.email}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {i.photoURL
                    ? <img src={i.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: "50%" }} />
                    : <div className="user-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                        {(i.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                  }
                  {i.name}
                </div>
              </td>
              <td>{i.count}</td>
              <td style={{ fontWeight: 500 }}>{fmtHM(i.total)}</td>
              <td>{i.goals}</td>
              <td>
                <span className={`badge ${i.goals / i.count >= 0.8 ? "badge-green" : i.goals / i.count >= 0.5 ? "badge-amber" : "badge-red"}`}>
                  {Math.round((i.goals / i.count) * 100)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
