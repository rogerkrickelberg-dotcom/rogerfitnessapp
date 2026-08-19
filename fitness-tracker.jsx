import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, Dumbbell, Zap, Bike, Footprints, TrendingUp, Camera,
  Plus, Trash2, X, Save, Scale, Heart, Flame, Gauge, ArrowLeft, MoreVertical,
} from "lucide-react";

// ---------- design tokens (Forge Fitness) ----------
const PRIMARY = "#ffb59c";
const PRIMARY_CONTAINER = "#ff5f1f";
const ON_PRIMARY_CONTAINER = "#561700";
const SECONDARY = "#44e2cd";
const SECONDARY_CONTAINER = "#03c6b2";
const TERTIARY = "#8dcdff";
const TERTIARY_CONTAINER = "#009de4";
const ERROR = "#ffb4ab";
const SURFACE = "#0A0A0A";
const SURFACE_CONTAINER = "#201f1f";
const SURFACE_CONTAINER_LOW = "#1c1b1b";
const SURFACE_CONTAINER_HIGH = "#2a2a2a";
const ON_SURFACE = "#e5e2e1";
const ON_SURFACE_VARIANT = "#e3bfb3";
const OUTLINE = "#aa897f";
const OUTLINE_VARIANT = "#5b4138";
const MUTED = "#9a9a98";

const FONT_DISPLAY = "'Archivo Narrow', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

const CARDIO_TYPES = [
  { id: "running", label: "Running", icon: Footprints },
  { id: "bike", label: "Stationary bike", icon: Bike },
  { id: "elliptical", label: "Elliptical", icon: Activity },
];
const STRENGTH_TYPES = [
  { id: "weights", label: "Weights", icon: Dumbbell },
  { id: "hiit", label: "HIIT", icon: Zap },
  { id: "kettlebells", label: "Kettlebells", icon: Dumbbell },
];
const HR_ZONES = [
  { zone: 1, label: "Z1 Recovery", color: "#6b6b68" },
  { zone: 2, label: "Z2 Easy", color: TERTIARY },
  { zone: 3, label: "Z3 Aerobic", color: SECONDARY },
  { zone: 4, label: "Z4 Threshold", color: "#e0a83e" },
  { zone: 5, label: "Z5 Max", color: PRIMARY },
];

async function loadAll(key, fallback) {
  try { const res = await window.storage.get(key); return res ? JSON.parse(res.value) : fallback; }
  catch { return fallback; }
}
async function saveAll(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { console.error(e); }
}

// ---------- shared atoms ----------
function Header({ title, onBack }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid rgba(255,255,255,0.1)`, display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: "0 20px", height: 64,
    }}>
      {onBack ? (
        <button onClick={onBack} aria-label="Go back" style={{ background: "none", border: "none", color: ON_SURFACE_VARIANT, cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
      ) : <div style={{ width: 22 }} />}
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: ON_SURFACE, textTransform: "uppercase", margin: 0 }}>{title}</h1>
      <div style={{ width: 22 }} />
    </header>
  );
}

function Label({ children }) {
  return <p style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.1em", fontWeight: 500, color: ON_SURFACE_VARIANT, margin: "0 0 4px", textTransform: "uppercase" }}>{children}</p>;
}

function StatTile({ icon: Icon, iconColor, label, value, unit, wide, sparkline }) {
  return (
    <div style={{
      background: "rgba(32,31,31,0.6)", backdropFilter: "blur(12px)", borderRadius: 8,
      padding: 16, border: "1px solid rgba(255,255,255,0.05)", gridColumn: wide ? "span 2" : "span 1",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {Icon && <Icon size={18} color={iconColor || PRIMARY_CONTAINER} fill={iconColor === ERROR ? ERROR : "none"} />}
        <Label>{label}</Label>
      </div>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", color: ON_SURFACE, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 500, color: ON_SURFACE_VARIANT, marginLeft: 4 }}>{unit}</span>}
      </div>
      {sparkline && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32, marginTop: 8, opacity: 0.5 }}>
          {sparkline.map((v, i) => (
            <div key={i} style={{ flex: 1, background: PRIMARY_CONTAINER, borderRadius: "2px 2px 0 0", height: `${Math.max(8, v)}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: SURFACE_CONTAINER_LOW, border: `1px solid ${OUTLINE_VARIANT}44`, borderRadius: 12, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "ghost", style, disabled }) {
  const variants = {
    primary: { background: PRIMARY_CONTAINER, color: "#fff" },
    secondary: { background: SECONDARY_CONTAINER, color: "#00201c" },
    ghost: { background: SURFACE_CONTAINER, color: ON_SURFACE, border: `1px solid ${OUTLINE_VARIANT}` },
    danger: { background: "transparent", color: ERROR, border: `1px solid ${ERROR}55` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 700,
      fontFamily: FONT_BODY, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex",
      alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1, letterSpacing: "0.01em", ...variants[variant], ...style,
    }}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: ON_SURFACE_VARIANT, fontFamily: FONT_MONO, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}{children}</label>;
}

const inputStyle = {
  background: SURFACE_CONTAINER, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 8, padding: "9px 10px",
  color: ON_SURFACE, fontSize: 14, outline: "none", fontFamily: FONT_BODY, width: "100%", boxSizing: "border-box",
};
function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select(props) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{props.children}</select>; }

function HRZoneBar({ zones, compact }) {
  const total = zones.reduce((s, z) => s + (z.minutes || 0), 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", height: compact ? 10 : 16, borderRadius: 4, overflow: "hidden", gap: 1 }}>
        {HR_ZONES.map((z) => {
          const mins = zones.find((zz) => zz.zone === z.zone)?.minutes || 0;
          const pct = (mins / total) * 100;
          if (pct <= 0) return null;
          return <div key={z.zone} style={{ width: `${pct}%`, background: z.color }} title={`${z.label}: ${mins}m`} />;
        })}
      </div>
      {!compact && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
          {HR_ZONES.map((z) => {
            const mins = zones.find((zz) => zz.zone === z.zone)?.minutes || 0;
            if (!mins) return null;
            return (
              <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: ON_SURFACE_VARIANT, fontFamily: FONT_MONO }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: z.color, display: "inline-block" }} />
                {z.label} · {mins}m
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Cardio ----------
function CardioForm({ onSave, onCancel, initial }) {
  const [type, setType] = useState(initial?.type || "running");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [distance, setDistance] = useState(initial?.distance ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [avgHR, setAvgHR] = useState(initial?.avgHR ?? "");
  const [calories, setCalories] = useState(initial?.calories ?? "");
  const [source, setSource] = useState(initial?.source || "manual");
  const [zones, setZones] = useState(initial?.zones || []);
  const [splits, setSplits] = useState(initial?.splits || []);
  const [notes, setNotes] = useState(initial?.notes || "");

  const avgPace = useMemo(() => {
    const d = parseFloat(distance), t = parseFloat(duration);
    if (!d || !t) return null;
    const paceMin = t / d;
    const min = Math.floor(paceMin), sec = Math.round((paceMin - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }, [distance, duration]);

  const setZoneMin = (zone, minutes) => setZones((prev) => {
    const rest = prev.filter((z) => z.zone !== zone);
    const val = parseFloat(minutes);
    return val ? [...rest, { zone, minutes: val }] : rest;
  });
  const addSplit = () => setSplits((s) => [...s, { id: uid(), label: `${s.length + 1}`, pace: "", hr: "" }]);
  const updateSplit = (id, key, val) => setSplits((s) => s.map((sp) => (sp.id === id ? { ...sp, [key]: val } : sp)));
  const removeSplit = (id) => setSplits((s) => s.filter((sp) => sp.id !== id));

  const submit = () => {
    if (!distance && !duration) return;
    onSave({
      id: initial?.id || uid(), kind: "cardio", type, date,
      distance: parseFloat(distance) || 0, duration: parseFloat(duration) || 0,
      avgHR: parseFloat(avgHR) || null, calories: parseFloat(calories) || null,
      avgPace, source, zones, splits, notes,
    });
  };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: "uppercase" }}>{initial ? "Edit session" : "Log cardio"}</div>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: ON_SURFACE_VARIANT, cursor: "pointer" }}><X size={18} /></button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {CARDIO_TYPES.map((ct) => (
          <button key={ct.id} onClick={() => setType(ct.id)} style={{
            flex: 1, padding: "10px 6px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${type === ct.id ? TERTIARY_CONTAINER : OUTLINE_VARIANT}`,
            background: type === ct.id ? "#00304a" : "transparent",
            color: type === ct.id ? TERTIARY : ON_SURFACE_VARIANT, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, fontSize: 11.5, fontFamily: FONT_BODY,
          }}>
            <ct.icon size={16} />{ct.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Source">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="manual">Manual entry</option>
            <option value="garmin">Garmin (pulled)</option>
            <option value="strava">Strava (pulled)</option>
          </Select>
        </Field>
        <Field label="Distance (km)"><TextInput type="number" step="0.01" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="10.2" /></Field>
        <Field label="Duration (min)"><TextInput type="number" step="0.1" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="52" /></Field>
        <Field label="Avg heart rate"><TextInput type="number" value={avgHR} onChange={(e) => setAvgHR(e.target.value)} placeholder="162" /></Field>
        <Field label="Calories"><TextInput type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="840" /></Field>
      </div>

      {avgPace && <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: TERTIARY }}>Avg pace: {avgPace} /km</div>}

      <div>
        <Label>Heart rate zones (minutes)</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {HR_ZONES.map((z) => (
            <TextInput key={z.zone} type="number" placeholder={z.label.split(" ")[0]}
              value={zones.find((zz) => zz.zone === z.zone)?.minutes || ""}
              onChange={(e) => setZoneMin(z.zone, e.target.value)}
              style={{ fontSize: 12, padding: "6px 6px", textAlign: "center" }} />
          ))}
        </div>
        {zones.length > 0 && <div style={{ marginTop: 8 }}><HRZoneBar zones={zones} compact /></div>}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Label>Splits / intervals</Label>
          <button onClick={addSplit} style={{ background: "none", border: "none", color: TERTIARY, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}><Plus size={13} /> Add</button>
        </div>
        {splits.map((sp) => (
          <div key={sp.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 28px", gap: 6, marginBottom: 5 }}>
            <TextInput value={sp.label} onChange={(e) => updateSplit(sp.id, "label", e.target.value)} style={{ fontSize: 12, padding: "6px 6px", textAlign: "center" }} />
            <TextInput placeholder="pace (m:ss)" value={sp.pace} onChange={(e) => updateSplit(sp.id, "pace", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
            <TextInput placeholder="HR bpm" value={sp.hr} onChange={(e) => updateSplit(sp.id, "hr", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
            <button onClick={() => removeSplit(sp.id)} style={{ background: "none", border: "none", color: OUTLINE, cursor: "pointer" }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <Field label="Notes"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="secondary" onClick={submit}><Save size={14} /> Save session</Btn>
      </div>
    </Card>
  );
}

function CardioSessionCard({ s, onDelete, weeklyTotal }) {
  const ct = CARDIO_TYPES.find((c) => c.id === s.type) || CARDIO_TYPES[0];
  return (
    <section style={{
      position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${OUTLINE_VARIANT}33`,
      background: `linear-gradient(180deg, transparent 0%, ${SURFACE} 85%), radial-gradient(circle at 30% 20%, #1a1210 0%, ${SURFACE} 70%)`,
    }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ct.icon size={16} color={TERTIARY} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.08em", color: ON_SURFACE_VARIANT, textTransform: "uppercase" }}>
              {ct.label} · {fmtDate(s.date)} · {s.source}
            </span>
          </div>
          <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: OUTLINE, cursor: "pointer" }}><Trash2 size={14} /></button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <Label>Distance</Label>
            <p style={{ fontFamily: FONT_BODY, fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color: PRIMARY, margin: 0, lineHeight: 1 }}>
              {s.distance || "—"}<span style={{ fontSize: 18, fontWeight: 700, color: ON_SURFACE_VARIANT, marginLeft: 4 }}>km</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <Label>Duration</Label>
            <p style={{ fontFamily: FONT_BODY, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: ON_SURFACE, margin: 0, lineHeight: 1 }}>{s.duration || "—"}<span style={{ fontSize: 14, color: ON_SURFACE_VARIANT }}>m</span></p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <StatTile icon={Gauge} iconColor={PRIMARY_CONTAINER} label="Avg pace" value={s.avgPace || "—"} unit="/km" />
          <StatTile icon={Flame} iconColor={PRIMARY_CONTAINER} label="Calories" value={s.calories || "—"} />
          <StatTile icon={Heart} iconColor={ERROR} label="Avg HR" value={s.avgHR || "—"} unit="bpm" />
        </div>

        {s.zones?.length > 0 && <div style={{ marginTop: 14 }}><HRZoneBar zones={s.zones} /></div>}

        {s.splits?.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${OUTLINE_VARIANT}33`, paddingTop: 12 }}>
            <Label>Splits</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {s.splits.map((sp) => (
                <div key={sp.id} style={{ background: SURFACE_CONTAINER, borderRadius: 6, padding: "5px 9px", fontSize: 11.5, fontFamily: FONT_MONO }}>
                  <span style={{ color: ON_SURFACE_VARIANT }}>{sp.label}</span>
                  {sp.pace && <span style={{ color: TERTIARY, marginLeft: 5 }}>{sp.pace}</span>}
                  {sp.hr && <span style={{ color: ON_SURFACE_VARIANT, marginLeft: 5 }}>{sp.hr}bpm</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {s.notes && <div style={{ marginTop: 10, fontSize: 12.5, color: ON_SURFACE_VARIANT, fontStyle: "italic" }}>{s.notes}</div>}
      </div>
    </section>
  );
}

// ---------- Strength ----------
function StrengthForm({ onSave, onCancel, initial }) {
  const [type, setType] = useState(initial?.type || "weights");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [avgHR, setAvgHR] = useState(initial?.avgHR ?? "");
  const [calories, setCalories] = useState(initial?.calories ?? "");
  const [exercises, setExercises] = useState(initial?.exercises || [{ id: uid(), name: "", sets: [{ id: uid(), weight: "", reps: "" }], rpe: "" }]);

  const addExercise = () => setExercises((ex) => [...ex, { id: uid(), name: "", sets: [{ id: uid(), weight: "", reps: "" }], rpe: "" }]);
  const removeExercise = (id) => setExercises((ex) => ex.filter((e) => e.id !== id));
  const updateExercise = (id, key, val) => setExercises((ex) => ex.map((e) => (e.id === id ? { ...e, [key]: val } : e)));
  const addSet = (exId) => setExercises((ex) => ex.map((e) => (e.id === exId ? { ...e, sets: [...e.sets, { id: uid(), weight: "", reps: "" }] } : e)));
  const removeSet = (exId, setId) => setExercises((ex) => ex.map((e) => (e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e)));
  const updateSet = (exId, setId, key, val) => setExercises((ex) => ex.map((e) => (e.id === exId ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, [key]: val } : s)) } : e)));

  const submit = () => {
    const cleaned = exercises.filter((e) => e.name.trim());
    if (!cleaned.length) return;
    onSave({
      id: initial?.id || uid(), kind: "strength", type, date,
      duration: parseFloat(duration) || null, avgHR: parseFloat(avgHR) || null, calories: parseFloat(calories) || null,
      exercises: cleaned.map((e) => ({ ...e, sets: e.sets.filter((s) => s.weight || s.reps) })),
    });
  };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, textTransform: "uppercase" }}>{initial ? "Edit session" : "Log strength"}</div>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: ON_SURFACE_VARIANT, cursor: "pointer" }}><X size={18} /></button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {STRENGTH_TYPES.map((st) => (
          <button key={st.id} onClick={() => setType(st.id)} style={{
            flex: 1, padding: "10px 6px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${type === st.id ? PRIMARY_CONTAINER : OUTLINE_VARIANT}`,
            background: type === st.id ? ON_PRIMARY_CONTAINER : "transparent",
            color: type === st.id ? PRIMARY : ON_SURFACE_VARIANT, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, fontSize: 11.5, fontFamily: FONT_BODY,
          }}>
            <st.icon size={16} />{st.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Time (min)"><TextInput type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" /></Field>
        <Field label="Avg HR"><TextInput type="number" value={avgHR} onChange={(e) => setAvgHR(e.target.value)} placeholder="128" /></Field>
        <Field label="Calories"><TextInput type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="380" /></Field>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {exercises.map((ex, i) => (
          <div key={ex.id} style={{ background: SURFACE_CONTAINER, borderRadius: 10, padding: 12, border: `1px solid ${OUTLINE_VARIANT}33` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <TextInput placeholder={`Exercise ${i + 1} name`} value={ex.name} onChange={(e) => updateExercise(ex.id, "name", e.target.value)} style={{ flex: 1 }} />
              <TextInput type="number" placeholder="RPE" value={ex.rpe} onChange={(e) => updateExercise(ex.id, "rpe", e.target.value)} style={{ width: 60, textAlign: "center" }} />
              {exercises.length > 1 && <button onClick={() => removeExercise(ex.id)} style={{ background: "none", border: "none", color: OUTLINE, cursor: "pointer" }}><Trash2 size={15} /></button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ex.sets.map((s, si) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 22px", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: ON_SURFACE_VARIANT, textAlign: "center", fontFamily: FONT_MONO }}>{si + 1}</span>
                  <TextInput type="number" placeholder="kg" value={s.weight} onChange={(e) => updateSet(ex.id, s.id, "weight", e.target.value)} style={{ fontSize: 12.5, padding: "6px 8px" }} />
                  <TextInput type="number" placeholder="reps" value={s.reps} onChange={(e) => updateSet(ex.id, s.id, "reps", e.target.value)} style={{ fontSize: 12.5, padding: "6px 8px" }} />
                  {ex.sets.length > 1 && <button onClick={() => removeSet(ex.id, s.id)} style={{ background: "none", border: "none", color: OUTLINE, cursor: "pointer" }}><X size={13} /></button>}
                </div>
              ))}
              <button onClick={() => addSet(ex.id)} style={{ background: "none", border: "none", color: PRIMARY, cursor: "pointer", fontSize: 11.5, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}><Plus size={12} /> Add set</button>
            </div>
          </div>
        ))}
        <button onClick={addExercise} style={{ background: "none", border: `1px dashed ${OUTLINE_VARIANT}`, borderRadius: 8, padding: "10px", color: ON_SURFACE_VARIANT, cursor: "pointer", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: FONT_BODY }}><Plus size={14} /> Add exercise</button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={submit}><Save size={14} /> Save session</Btn>
      </div>
    </Card>
  );
}

function StrengthSessionCard({ s, onDelete }) {
  const st = STRENGTH_TYPES.find((t) => t.id === s.type) || STRENGTH_TYPES[0];
  const totalVolume = s.exercises.reduce((sum, ex) => sum + ex.sets.reduce((ss, set) => ss + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0), 0), 0);
  return (
    <section style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${OUTLINE_VARIANT}33`, background: SURFACE_CONTAINER_LOW }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <st.icon size={16} color={PRIMARY} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.08em", color: ON_SURFACE_VARIANT, textTransform: "uppercase" }}>{st.label} · {fmtDate(s.date)}</span>
          </div>
          <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: OUTLINE, cursor: "pointer" }}><Trash2 size={14} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <StatTile label="Volume" value={Math.round(totalVolume).toLocaleString()} unit="kg" iconColor={PRIMARY_CONTAINER} icon={Dumbbell} />
          <StatTile label="Time" value={s.duration || "—"} unit="min" iconColor={PRIMARY_CONTAINER} icon={Flame} />
          <StatTile label="Avg HR" value={s.avgHR || "—"} unit="bpm" icon={Heart} iconColor={ERROR} />
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {s.exercises.map((ex) => (
            <div key={ex.id} style={{ borderTop: `1px solid ${OUTLINE_VARIANT}33`, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY }}>
                <span>{ex.name}</span>
                {ex.rpe && <span style={{ color: PRIMARY, fontSize: 11.5, fontFamily: FONT_MONO }}>RPE {ex.rpe}</span>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
                {ex.sets.map((set) => (
                  <span key={set.id} style={{ background: SURFACE_CONTAINER, borderRadius: 6, padding: "4px 8px", fontSize: 11.5, color: ON_SURFACE_VARIANT, fontFamily: FONT_MONO }}>{set.weight || 0}kg × {set.reps || 0}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Progress ----------
function ProgressTab({ cardio, strength, bodyLogs }) {
  const [exerciseFilter, setExerciseFilter] = useState("");
  const allExerciseNames = useMemo(() => {
    const names = new Set();
    strength.forEach((s) => s.exercises.forEach((e) => names.add(e.name)));
    return Array.from(names).sort();
  }, [strength]);

  useEffect(() => { if (!exerciseFilter && allExerciseNames.length) setExerciseFilter(allExerciseNames[0]); }, [allExerciseNames]);

  const strengthTrend = useMemo(() => {
    if (!exerciseFilter) return [];
    return strength.filter((s) => s.exercises.some((e) => e.name === exerciseFilter))
      .map((s) => {
        const ex = s.exercises.find((e) => e.name === exerciseFilter);
        return { date: fmtDate(s.date), rawDate: s.date, maxWeight: Math.max(...ex.sets.map((st) => parseFloat(st.weight) || 0), 0) };
      }).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [strength, exerciseFilter]);

  const cardioTrend = useMemo(() => cardio.filter((c) => c.type === "running" && c.avgPace)
    .map((c) => { const [m, s] = c.avgPace.split(":").map(Number); return { date: fmtDate(c.date), rawDate: c.date, paceSeconds: m * 60 + s }; })
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate)), [cardio]);

  const weightTrend = useMemo(() => bodyLogs.map((b) => ({ date: fmtDate(b.date), rawDate: b.date, weight: b.weight })).sort((a, b) => a.rawDate.localeCompare(b.rawDate)), [bodyLogs]);

  const paceTickFormatter = (v) => { const m = Math.floor(v / 60), s = Math.round(v % 60); return `${m}:${s.toString().padStart(2, "0")}`; };
  const gridColor = `${OUTLINE_VARIANT}44`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Dumbbell size={15} color={PRIMARY} /><span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, textTransform: "uppercase" }}>Strength progress</span></div>
          {allExerciseNames.length > 0 && (
            <Select value={exerciseFilter} onChange={(e) => setExerciseFilter(e.target.value)} style={{ width: 150, fontSize: 12, padding: "5px 8px" }}>
              {allExerciseNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          )}
        </div>
        {strengthTrend.length > 1 ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthTrend}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11, fontFamily: FONT_MONO }} axisLine={{ stroke: gridColor }} tickLine={false} />
                <YAxis tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: SURFACE_CONTAINER_HIGH, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: ON_SURFACE }} />
                <Line type="monotone" dataKey="maxWeight" name="Top set (kg)" stroke={PRIMARY_CONTAINER} strokeWidth={2} dot={{ r: 3, fill: PRIMARY_CONTAINER }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div style={{ color: OUTLINE, fontSize: 12.5, padding: "20px 0", textAlign: "center", fontFamily: FONT_BODY }}>Log this exercise a couple more times to see a trend.</div>}
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><Footprints size={15} color={TERTIARY} /><span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, textTransform: "uppercase" }}>Running pace trend</span></div>
        {cardioTrend.length > 1 ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cardioTrend}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11, fontFamily: FONT_MONO }} axisLine={{ stroke: gridColor }} tickLine={false} />
                <YAxis reversed tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} width={40} tickFormatter={paceTickFormatter} />
                <Tooltip contentStyle={{ background: SURFACE_CONTAINER_HIGH, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: ON_SURFACE }} formatter={(v) => paceTickFormatter(v)} />
                <Line type="monotone" dataKey="paceSeconds" name="Avg pace" stroke={TERTIARY} strokeWidth={2} dot={{ r: 3, fill: TERTIARY }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div style={{ color: OUTLINE, fontSize: 12.5, padding: "20px 0", textAlign: "center", fontFamily: FONT_BODY }}>Log a couple more runs with pace data to see a trend.</div>}
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><Scale size={15} color={SECONDARY} /><span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, textTransform: "uppercase" }}>Body weight</span></div>
        {weightTrend.length > 1 ? (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightTrend}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11, fontFamily: FONT_MONO }} axisLine={{ stroke: gridColor }} tickLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: SURFACE_CONTAINER_HIGH, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: ON_SURFACE }} />
                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke={SECONDARY} strokeWidth={2} dot={{ r: 3, fill: SECONDARY }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div style={{ color: OUTLINE, fontSize: 12.5, padding: "20px 0", textAlign: "center", fontFamily: FONT_BODY }}>Log your weight a couple more times to see a trend.</div>}
      </Card>
    </div>
  );
}

// ---------- Body ----------
function BodyTab({ bodyLogs, onAdd, onDelete }) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [photo, setPhoto] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 480 / img.width);
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = () => { if (!weight) return; onAdd({ id: uid(), date, weight: parseFloat(weight), photo }); setWeight(""); setPhoto(null); };
  const sorted = [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, textTransform: "uppercase" }}>Log body weight</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Weight (kg)"><TextInput type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75.4" /></Field>
        </div>
        <Field label="Progress photo">
          <label style={{ display: "flex", alignItems: "center", gap: 8, border: `1px dashed ${OUTLINE_VARIANT}`, borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 12.5, color: ON_SURFACE_VARIANT, fontFamily: FONT_BODY, textTransform: "none" }}>
            <Camera size={16} />{photo ? "Photo attached — tap to change" : "Tap to attach a photo"}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>
        </Field>
        {photo && <img src={photo} alt="preview" style={{ width: 90, borderRadius: 8, border: `1px solid ${OUTLINE_VARIANT}` }} />}
        <Btn variant="primary" onClick={submit} style={{ alignSelf: "flex-end" }}><Save size={14} /> Save entry</Btn>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((b) => (
          <Card key={b.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {b.photo ? (
              <img src={b.photo} alt="" onClick={() => setExpanded(b)} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: `1px solid ${OUTLINE_VARIANT}`, cursor: "pointer" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 8, background: SURFACE_CONTAINER, display: "flex", alignItems: "center", justifyContent: "center", color: OUTLINE }}><Scale size={20} /></div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, fontFamily: FONT_BODY }}>{b.weight} <span style={{ fontSize: 12, fontWeight: 500, color: ON_SURFACE_VARIANT }}>kg</span></div>
              <div style={{ fontSize: 11.5, color: ON_SURFACE_VARIANT, fontFamily: FONT_MONO }}>{fmtDate(b.date)}</div>
            </div>
            <button onClick={() => onDelete(b.id)} style={{ background: "none", border: "none", color: OUTLINE, cursor: "pointer" }}><Trash2 size={14} /></button>
          </Card>
        ))}
        {sorted.length === 0 && <div style={{ color: OUTLINE, fontSize: 12.5, textAlign: "center", padding: 20, fontFamily: FONT_BODY }}>No entries yet.</div>}
      </div>

      {expanded && (
        <div onClick={() => setExpanded(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
          <img src={expanded.photo} alt="" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 10 }} />
        </div>
      )}
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ cardio, strength, bodyLogs, onGo }) {
  const recent = [...cardio.map((c) => ({ ...c, kind: "cardio" })), ...strength.map((s) => ({ ...s, kind: "strength" }))]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const latestWeight = [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekSessions = [...cardio, ...strength].filter((s) => s.date >= weekAgo);
  const weekDistance = cardio.filter((c) => c.date >= weekAgo).reduce((sum, c) => sum + (c.distance || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        <StatTile icon={Activity} label="Sessions / week" value={weekSessions.length} iconColor={PRIMARY_CONTAINER} />
        <StatTile icon={Footprints} label="Weekly distance" value={weekDistance.toFixed(1)} unit="km" iconColor={TERTIARY_CONTAINER} />
        <StatTile icon={Scale} label="Latest weight" value={latestWeight ? latestWeight.weight : "—"} unit={latestWeight ? "kg" : ""} iconColor={SECONDARY_CONTAINER} wide />
      </div>

      <div>
        <Label>Quick log</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => onGo("cardio")} style={{ background: "#00304a", border: `1px solid ${TERTIARY_CONTAINER}44`, borderRadius: 10, padding: 16, color: TERTIARY, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, fontFamily: FONT_BODY }}>
            <Footprints size={17} /> Cardio
          </button>
          <button onClick={() => onGo("strength")} style={{ background: ON_PRIMARY_CONTAINER, border: `1px solid ${PRIMARY_CONTAINER}44`, borderRadius: 10, padding: 16, color: PRIMARY, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, fontFamily: FONT_BODY }}>
            <Dumbbell size={17} /> Strength
          </button>
        </div>
      </div>

      <div>
        <Label>Recent activity</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.length === 0 && <div style={{ color: OUTLINE, fontSize: 12.5, textAlign: "center", padding: 20, fontFamily: FONT_BODY }}>Nothing logged yet — start with a quick log above.</div>}
          {recent.map((r) => {
            const isCardio = r.kind === "cardio";
            const typeDef = isCardio ? CARDIO_TYPES.find((c) => c.id === r.type) : STRENGTH_TYPES.find((c) => c.id === r.type);
            const Icon = typeDef?.icon || Activity;
            return (
              <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
                <div style={{ background: isCardio ? "#00304a" : ON_PRIMARY_CONTAINER, padding: 7, borderRadius: 7, color: isCardio ? TERTIARY : PRIMARY }}><Icon size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY }}>{typeDef?.label}</div>
                  <div style={{ fontSize: 11, color: ON_SURFACE_VARIANT, fontFamily: FONT_MONO }}>{fmtDate(r.date)}</div>
                </div>
                <div style={{ fontSize: 12, color: ON_SURFACE_VARIANT, fontFamily: FONT_MONO }}>{isCardio ? `${r.distance || 0}km` : `${r.exercises?.length || 0} ex`}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [cardio, setCardio] = useState([]);
  const [strength, setStrength] = useState([]);
  const [bodyLogs, setBodyLogs] = useState([]);
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [showStrengthForm, setShowStrengthForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, s, b] = await Promise.all([loadAll("cardio_sessions", []), loadAll("strength_sessions", []), loadAll("body_logs", [])]);
      setCardio(c); setStrength(s); setBodyLogs(b); setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) saveAll("cardio_sessions", cardio); }, [cardio, loaded]);
  useEffect(() => { if (loaded) saveAll("strength_sessions", strength); }, [strength, loaded]);
  useEffect(() => { if (loaded) saveAll("body_logs", bodyLogs); }, [bodyLogs, loaded]);

  const addCardio = (s) => { setCardio((prev) => [s, ...prev]); setShowCardioForm(false); };
  const addStrength = (s) => { setStrength((prev) => [s, ...prev]); setShowStrengthForm(false); };
  const deleteCardio = (id) => setCardio((prev) => prev.filter((c) => c.id !== id));
  const deleteStrength = (id) => setStrength((prev) => prev.filter((s) => s.id !== id));
  const addBody = (b) => setBodyLogs((prev) => [b, ...prev]);
  const deleteBody = (id) => setBodyLogs((prev) => prev.filter((b) => b.id !== id));

  const cardioSorted = [...cardio].sort((a, b) => b.date.localeCompare(a.date));
  const strengthSorted = [...strength].sort((a, b) => b.date.localeCompare(a.date));

  const TAB_TITLES = { dashboard: "Forge", cardio: "Cardio", strength: "Strength", progress: "Progress", body: "Body log" };
  const NAV = [
    { id: "dashboard", label: "Home", icon: Activity },
    { id: "cardio", label: "Cardio", icon: Footprints },
    { id: "strength", label: "Strength", icon: Dumbbell },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "body", label: "Body", icon: Scale },
  ];

  return (
    <div style={{
      background: SURFACE, color: ON_SURFACE, minHeight: "100vh", fontFamily: FONT_BODY,
      maxWidth: 480, margin: "0 auto", paddingBottom: 90, position: "relative",
    }}>
      <Header title={TAB_TITLES[tab]} onBack={tab !== "dashboard" ? () => setTab("dashboard") : null} />

      <div style={{ padding: "20px 20px 0" }}>
        {tab === "dashboard" && <Dashboard cardio={cardio} strength={strength} bodyLogs={bodyLogs} onGo={setTab} />}

        {tab === "cardio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!showCardioForm && <Btn variant="secondary" onClick={() => setShowCardioForm(true)} style={{ justifyContent: "center" }}><Plus size={15} /> Log cardio session</Btn>}
            {showCardioForm && <CardioForm onSave={addCardio} onCancel={() => setShowCardioForm(false)} />}
            {cardioSorted.map((s) => <CardioSessionCard key={s.id} s={s} onDelete={deleteCardio} />)}
            {cardioSorted.length === 0 && !showCardioForm && <div style={{ color: OUTLINE, fontSize: 12.5, textAlign: "center", padding: 30, fontFamily: FONT_BODY }}>No cardio sessions logged yet.</div>}
          </div>
        )}

        {tab === "strength" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!showStrengthForm && <Btn variant="primary" onClick={() => setShowStrengthForm(true)} style={{ justifyContent: "center" }}><Plus size={15} /> Log strength session</Btn>}
            {showStrengthForm && <StrengthForm onSave={addStrength} onCancel={() => setShowStrengthForm(false)} />}
            {strengthSorted.map((s) => <StrengthSessionCard key={s.id} s={s} onDelete={deleteStrength} />)}
            {strengthSorted.length === 0 && !showStrengthForm && <div style={{ color: OUTLINE, fontSize: 12.5, textAlign: "center", padding: 30, fontFamily: FONT_BODY }}>No strength sessions logged yet.</div>}
          </div>
        )}

        {tab === "progress" && <ProgressTab cardio={cardio} strength={strength} bodyLogs={bodyLogs} />}
        {tab === "body" && <BodyTab bodyLogs={bodyLogs} onAdd={addBody} onDelete={deleteBody} />}
      </div>

      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
        background: "rgba(10,10,10,0.9)", backdropFilter: "blur(20px)", borderTop: `1px solid rgba(255,255,255,0.1)`,
        display: "flex", padding: "8px 4px",
      }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, color: tab === n.id ? PRIMARY_CONTAINER : OUTLINE, padding: "4px 0",
          }}>
            <n.icon size={19} />
            <span style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "0.03em" }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
