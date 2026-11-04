import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, VolumeX, Sparkles, X, Trophy } from "lucide-react";

const STORAGE_KEY = "fightlab-interface-settings";
function readSettings() {
  try { return { sounds: false, motion: true, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return { sounds: false, motion: true }; }
}
function clickTone() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    const ctx = new Context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.075);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.095);
    osc.onended = () => ctx.close();
  } catch { /* Sound is optional. */ }
}
export default function FightLabVisualFX() {
  const location = useLocation();
  const [settings, setSettings] = useState(readSettings);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle("fl-reduced-fx", !settings.motion);
    return () => document.documentElement.classList.remove("fl-reduced-fx");
  }, [settings]);
  useEffect(() => {
    const show = event => setToast({
      title: String(event.detail?.title || "FIGHTLAB"),
      message: String(event.detail?.message || "Updated"),
      id: Date.now()
    });
    window.addEventListener("fightlab:toast", show);
    window.addEventListener("fightlab:achievement", show);
    return () => {
      window.removeEventListener("fightlab:toast", show);
      window.removeEventListener("fightlab:achievement", show);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!settings.sounds) return;
    const onClick = event => {
      if (event.target.closest("button, [role=tab], .btn-primary")) clickTone();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [settings.sounds]);
  useEffect(() => {
    const root = document.querySelector("main");
    if (!root || !settings.motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fl-fx-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: "0px 0px 45px 0px" });
    const observe = () => root.querySelectorAll(".fighter-card, .fl-prog-panel, .fl-profile-stats > div, .fl-advanced article, .training-aside, .fl-v2-fighter-plans article").forEach(el => {
      if (!el.classList.contains("fl-fx-visible")) { el.classList.add("fl-fx-reveal"); observer.observe(el); }
    });
    observe();
    const mutation = new MutationObserver(observe);
    mutation.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutation.disconnect(); };
  }, [location.pathname, settings.motion]);
  return <>
    <div className="fl-fx-route-indicator" key={location.pathname} aria-hidden="true" />
    <div className="fl-fx-controls">
      <button type="button" className="fl-fx-settings-toggle" onClick={() => setShowSettings(v => !v)} aria-expanded={showSettings} aria-label="Visual and sound settings" title="Visual and sound settings"><Sparkles size={17}/></button>
      {showSettings && <div className="fl-fx-settings" role="group" aria-label="Interface preferences">
        <strong>INTERFACE SETTINGS</strong>
        <button type="button" onClick={() => setSettings(v => ({...v, sounds: !v.sounds}))}>{settings.sounds ? <Volume2 size={16}/> : <VolumeX size={16}/>} UI SOUND {settings.sounds ? "ON" : "OFF"}</button>
        <button type="button" onClick={() => setSettings(v => ({...v, motion: !v.motion}))}><Sparkles size={16}/> EFFECTS {settings.motion ? "ON" : "OFF"}</button>
        <small>Sound effects are separate from the music player.</small>
      </div>}
    </div>
    {toast && <div className="fl-fx-toast" role="status" key={toast.id}><Trophy size={26}/><div><strong>{toast.title}</strong><span>{toast.message}</span></div><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={17}/></button></div>}
  </>;
}
