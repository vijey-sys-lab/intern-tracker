import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import {
  collection, addDoc, updateDoc, doc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { format } from "date-fns";

function fmtSecs(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
}
function fmtHM(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const TARGETS = [
  { label: "2 hours", value: 7200 },
  { label: "3 hours", value: 10800 },
  { label: "4 hours", value: 14400 },
];

export default function InternDashboard({ user }) {
  const [phase, setPhase] = useState("idle"); // idle | active | done
  const [task, setTask] = useState("");
  const [target, setTarget] = useState(10800);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  // Load past sessions
  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      where("uid", "==", user.uid),
      orderBy("startedAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user.uid]);

  // Timer tick
  useEffect(() => {
    if (phase === "active") {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  const handleStart = async () => {
    if (!task.trim()) { setError("Please enter your task for today."); return; }
    setError("");
    try {
      const docRef = await addDoc(collection(db, "sessions"), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        task: task.trim(),
        target,
        startedAt: serverTimestamp(),
        status: "active",
        duration: 0,
      });
      setSessionId(docRef.id);
      startRef.current = Date.now();
      setElapsed(0);
      setPhase("active");
    } catch (e) {
      setError("Failed to start session. Check your connection.");
    }
  };

  const handleCheckout = async () => {
    const duration = elapsed;
    const goalMet = duration >= target;
    clearInterval(intervalRef.current);
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        duration,
        goalMet,
        status: "done",
        endedAt: serverTimestamp(),
      });
    } catch (e) { /* best effort */ }
    setPhase("done");
  };

  const handleNew = () => {
    setPhase("idle");
    setTask("");
    setElapsed(0);
    setSessionId(null);
  };

  const pct = Math.min((elapsed / target) * 100, 100);
  const remaining = target - elapsed;
  const goalMet = elapsed >= target;

  const todaySessions = sessions.filter(s => {
    if (!s.startedAt) return false;
    const d = s.startedAt.toDate ? s.startedAt.toDate() : new Date();
    return format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  });

  return (
    <div className="page">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="logo-dv">DV</div>
          <span className="logo-text">Devverse</span>
        </div>
        <div className="topbar-right">
          <div className="user-pill">
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: "50%" }} />
              : <div className="user-avatar">{initials(user.displayName || "U")}</div>
            }
            {user.displayName?.split(" ")[0]}
          </div>
          <button className="btn btn-sm" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>

      <main className="main-content">

        {/* ── IDLE: check-in form ── */}
        {phase === "idle" && (
          <>
            <div className="section-header" style={{ marginBottom: 24 }}>
              <div>
                <div className="section-title">Good {greeting()}, {user.displayName?.split(" ")[0]}!</div>
                <div className="section-sub">Start your internship session for today.</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Check in</div>
              {error && <div className="alert alert-red">{error}</div>}
              <div className="form-group">
                <label className="form-label">What will you work on today?</label>
                <input
                  className="form-input"
                  placeholder="e.g. React landing page, Node.js API, UI design…"
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStart()}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Session target</label>
                <select className="form-input" value={target} onChange={e => setTarget(Number(e.target.value))}>
                  {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleStart}>
                Start session ↗
              </button>
            </div>

            {/* Past sessions today */}
            {todaySessions.length > 0 && (
              <div className="card">
                <div className="card-title">Today's sessions</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySessions.map(s => (
                      <tr key={s.id}>
                        <td>{s.task}</td>
                        <td style={{ color: "var(--text2)" }}>{fmtHM(s.duration || 0)}</td>
                        <td>
                          {s.status === "active"
                            ? <span className="badge badge-green badge-pulse">Live</span>
                            : s.goalMet
                              ? <span className="badge badge-green">✓ Goal met</span>
                              : <span className="badge badge-amber">Short</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── ACTIVE: live timer ── */}
        {phase === "active" && (
          <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>{task}</span>
              <span className="badge badge-green badge-pulse">Live</span>
            </div>

            <div className="timer-block">
              <div className="timer-digits">{fmtSecs(elapsed)}</div>
              <div className="timer-label">
                Target: {fmtHM(target)} · {goalMet ? "Goal reached!" : `${fmtHM(remaining)} remaining`}
              </div>
            </div>

            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: pct + "%" }} />
              </div>
              <div className="progress-meta">
                <span>0:00</span>
                <span>{Math.round(pct)}%</span>
                <span>{fmtHM(target)}</span>
              </div>
            </div>

            {!goalMet && remaining <= 900 && (
              <div className="alert alert-amber" style={{ marginTop: 16 }}>
                ⏰ {Math.ceil(remaining / 60)} minutes to go — you're almost there!
              </div>
            )}
            {goalMet && (
              <div className="alert alert-green" style={{ marginTop: 16 }}>
                ✓ You've completed your target! You can check out now.
              </div>
            )}

            <button className="btn btn-danger btn-full" style={{ marginTop: 20 }} onClick={handleCheckout}>
              Check out
            </button>
          </div>
        )}

        {/* ── DONE: summary ── */}
        {phase === "done" && (
          <div className="card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{elapsed >= target ? "🎉" : "👋"}</div>
            <div className="section-title" style={{ marginBottom: 4 }}>Session complete</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28 }}>
              Your attendance has been recorded.
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="metric-card">
                <div className="metric-label">Duration</div>
                <div className="metric-value">{fmtHM(elapsed)}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Target</div>
                <div className="metric-value">{fmtHM(target)}</div>
              </div>
            </div>

            <div className={`alert ${elapsed >= target ? "alert-green" : "alert-amber"}`} style={{ marginBottom: 20 }}>
              {elapsed >= target
                ? "✓ Great work! You met your session target."
                : `You were ${fmtHM(target - elapsed)} short of your target. Your admin will see your actual duration.`
              }
            </div>

            <button className="btn btn-primary btn-full" onClick={handleNew}>
              Start new session
            </button>
          </div>
        )}

        {/* All past sessions (non-today) */}
        {phase === "idle" && sessions.filter(s => {
          if (!s.startedAt) return false;
          const d = s.startedAt.toDate ? s.startedAt.toDate() : new Date();
          return format(d, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd");
        }).length > 0 && (
          <div className="card">
            <div className="card-title">Previous sessions</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Task</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 20).filter(s => {
                    if (!s.startedAt) return false;
                    const d = s.startedAt.toDate ? s.startedAt.toDate() : new Date();
                    return format(d, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd");
                  }).map(s => {
                    const d = s.startedAt?.toDate ? s.startedAt.toDate() : new Date();
                    return (
                      <tr key={s.id}>
                        <td style={{ whiteSpace: "nowrap", color: "var(--text2)" }}>{format(d, "dd MMM")}</td>
                        <td>{s.task}</td>
                        <td style={{ color: "var(--text2)" }}>{fmtHM(s.duration || 0)}</td>
                        <td>
                          {s.goalMet
                            ? <span className="badge badge-green">✓ Done</span>
                            : <span className="badge badge-amber">Short</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
