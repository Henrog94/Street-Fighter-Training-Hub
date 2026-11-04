import './fightlab-six-fixes.css';
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import useLocalData from "./hooks/useLocalData";
import { Swords, Flame, Search, Menu, X, ArrowUpRight, Crosshair, Zap, BookOpen, Activity, Dumbbell, ExternalLink, ChevronRight, Shield, Gamepad2 } from "lucide-react";






import "./styles.css";
import "./fightlab-ui.css";
import "./fightlab-refinement.css";
import {AuthProvider} from "./context/AuthContext";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import fallbackPatchFeed from "./data/patch-feed.json";
import useSteamPatchNotes from "./hooks/useSteamPatchNotes";
import BackgroundMusic from "./BackgroundMusic";
import Navbar, {nav} from "./components/Navbar";
import FighterDetailModal from "./components/FighterDetailModal";
import Home from "./pages/Home";
import Fighters from "./pages/Fighters";
import Guides from "./pages/Guides";
import FrameData from "./pages/FrameData";
import PatchNotes from "./pages/PatchNotes";
import Training from "./pages/Training";
import Resources from "./pages/Resources";
import Progression from "./pages/Progression";
import AdvancedProgress from "./pages/AdvancedProgress";
import PublicProgress from "./pages/PublicProgress";
const pages = {home:Home, fighters:Fighters, guides:Guides, frames:FrameData, patches:PatchNotes, training:Training, resources:Resources, progression:Progression, development:AdvancedProgress, login:Login, profile:Profile};

function App(){
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.slice(1) || "home";
  const { data: characters, loading: charactersLoading, error: charactersError, retry: retryCharacters } = useLocalData("/api/data/characters", [], "/data/characters.json");
  const { data: guides, loading: guidesLoading, error: guidesError, retry: retryGuides } = useLocalData("/api/data/guides", [], "/data/guides.json");
  const { data: wikiMoves, loading: wikiLoading, error: wikiError, retry: retryWiki } = useLocalData("/api/data/wiki-moves", {}, "/data/wiki-moves.json");
  const { items: patchFeed } = useSteamPatchNotes(fallbackPatchFeed);
  const { data: databaseFighters } = useLocalData("/api/fighters", []);
  const mergedCharacters = useMemo(() => {
    const map = new Map(databaseFighters.map(f => [String(f.name).toLowerCase().replace(/[^a-z0-9]/g, ""), f]));
    return characters.map(c => {
      const match = map.get(String(c.name).toLowerCase().replace(/[^a-z0-9]/g, ""));
      return match ? { ...c, mongoId: match._id, databaseMoves: match.moves || [], databaseConnected: true } : c;
    });
  }, [characters, databaseFighters]);
  const importedFrames = useMemo(() => Object.entries(wikiMoves).flatMap(([character, entry]) =>
    (entry.moves || []).map((move, index) => ({...move, character, id:`${character}-${index}`, type:"Wiki import"}))), [wikiMoves]);
  const loading = charactersLoading || guidesLoading || wikiLoading;
  const dataError = charactersError || guidesError || wikiError;
  const retryData = () => { retryCharacters(); retryGuides(); retryWiki(); };
  const [savedPlan, setSavedPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fightlab-practice-plan") || "null"); }
    catch { return null; }
  });
  const [mobile,setMobile]=useState(false);
  const [query,setQuery]=useState("");
  const [difficulty,setDifficulty]=useState("All");
  const [category,setCategory]=useState("All");
  const [selected,setSelected]=useState(null);
  const [formSent,setFormSent]=useState(false);
  const [patchIndex,setPatchIndex]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>setPatchIndex(i=>(i+1)%Math.max(patchFeed.length,1)),6500);return ()=>clearInterval(timer)},[patchFeed.length]);
  useEffect(()=>setPatchIndex(i=>i%Math.max(patchFeed.length,1)),[patchFeed.length]);
  const go=(p)=>{navigate(p==="home"?"/":`/${p}`);setQuery("");setMobile(false);setSelected(null);window.scrollTo({top:0,behavior:"smooth"});};
  const filteredCharacters=useMemo(()=>mergedCharacters.filter(c=>(c.name+" "+c.style+" "+c.role+" "+c.difficulty).toLowerCase().includes(query.toLowerCase())&&(difficulty==="All"||c.difficulty===difficulty)),[mergedCharacters,query,difficulty]);
  const filteredGuides=useMemo(()=>guides.filter(g=>(g.title+" "+g.description+" "+g.topics.join(" ")).toLowerCase().includes(query.toLowerCase())&&(category==="All"||g.category===category)),[guides,query,category]);
  const filteredFrames=useMemo(()=>importedFrames.filter(f=>(f.character+" "+f.name+" "+f.description).toLowerCase().includes(query.toLowerCase())),[importedFrames,query]);

 const pageProps = {characters:mergedCharacters, guides, patchFeed, importedFrames, filteredCharacters, filteredGuides, filteredFrames, query, setQuery, difficulty, setDifficulty, category, setCategory, setSelected, go, patchIndex, setPatchIndex, savedPlan, setSavedPlan, formSent, setFormSent};
 return <div className="app-shell">
  <BackgroundMusic />
    <Navbar page={page} go={go} mobile={mobile} setMobile={setMobile}/>
    <main>
      {loading && <div className="data-status" role="status">LOADING FIGHTLAB DATA...</div>}
      {dataError && <div className="data-status data-error" role="alert">Could not load the local fighter database: {dataError} <button type="button" onClick={retryData}>RETRY</button></div>}
      {!loading && !dataError && <Routes>
        {nav.map(([, id]) => <Route key={id} path={id==="home"?"/":`/${id}`} element={<div className="route-page">{React.createElement(pages[id], pageProps)}</div>} />)}
        <Route path="/login" element={<Login/>}/>
        <Route path="/profile" element={<Profile characters={mergedCharacters}/>}/>
        <Route path="/progress/:username" element={<PublicProgress/>}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>}
    </main>
    <footer className="footer"><button className="footer-brand" onClick={()=>go("home")}><Swords size={19}/> FIGHT<span>LAB</span></button><span>TRAIN SMART. PLAY BOLD. KEEP LEARNING.</span><span className="footer-copy">FAN-MADE LEARNING PROJECT · 2026</span></footer>
    <FighterDetailModal selected={selected} setSelected={setSelected} wikiMoves={wikiMoves}/>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>);
