import React from "react";
import { Swords, Flame, Search, Menu, X, ArrowUpRight, Crosshair, Zap, BookOpen, Activity, Dumbbell, ExternalLink, ChevronRight, Shield, Gamepad2, Target } from "lucide-react";
export const nav = [
  ["Home", "home", Flame], ["Fighters", "fighters", Swords], ["Guides", "guides", BookOpen],
  ["Frame Data", "frames", Activity], ["Patch Notes", "patches", BookOpen], ["Training", "training", Dumbbell], ["Resources", "resources", ExternalLink], ["Progression", "progression", Activity], ["Development", "development", Target]
];
import {useAuth} from "../context/AuthContext";
export default function Navbar({page,go,mobile,setMobile}) {
 const {user,logout}=useAuth();
  return <>    <div className="topline fl-concept-topline"><span><span className="live-dot"/> TRAINING MODE ONLINE</span><span className="topline-right">SF6 // FIGHTER DATABASE <span className="topline-sep">—</span> EST. 2026</span></div>
    <header className="navbar fl-concept-navbar">
      <button className="brand" onClick={()=>go("home")} aria-label="Go home"><span className="brand-mark"><Swords size={24}/></span><span>FIGHT<span className="brand-accent">LAB</span><small>STREET FIGHTER TRAINING HUB</small></span></button>
      <button className="mobile-toggle" onClick={()=>setMobile(!mobile)} aria-label="Toggle navigation">{mobile?<X/>:<Menu/>}</button>
      <nav className={mobile?"nav-links open":"nav-links"}>{nav.map(([label,id,Icon])=><button key={id} className={page===id?"nav-item active":"nav-item"} onClick={()=>go(id)}><Icon size={15}/>{label}</button>)}</nav>
      <div className="fl-nav-account">{user?<><button className="fl-nav-user" onClick={()=>go('profile')}>{user.avatar?<img src={user.avatar} alt=""/>:<span className="fl-avatar-letter">{user.username.charAt(0).toUpperCase()}</span>}<span>{user.username}</span></button><button className="fl-nav-signout" onClick={()=>{logout();go('home')}}>SIGN OUT</button></>:<button className="nav-cta" onClick={()=>go('login')}>LOG IN / REGISTER <ArrowUpRight size={15}/></button>}</div>
    </header>
</>;
}
