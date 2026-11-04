import './home-recovery.css';
import React, {useEffect, useMemo, useState} from "react";
import {Swords, BookOpen, Activity, Dumbbell, Trophy, ChevronRight, ArrowUpRight, Target, Flame} from "lucide-react";
export default function Home({characters=[],patchFeed=[],patchIndex=0,go}) {
 // Use the roster contents, not the array identity, as the shuffle dependency.
 // Parent renders may create a new `characters` array with identical fighters.
 const rosterKey = characters.filter(c => c?.image).map(c => `${c.id ?? c.name}:${c.image}`).join('|');
 const slides = useMemo(() => characters.filter(c => c?.image), [rosterKey]);
 const [slideIndex, setSlideIndex] = useState(0);
 // Shuffle the fighter order once per roster change; keep every fighter in the rotation.
 const shuffledSlides = useMemo(() => {
   const items = [...slides];
   for (let i = items.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [items[i], items[j]] = [items[j], items[i]];
   }
   return items;
 }, [slides]);
 const [manualPatchIndex, setManualPatchIndex] = useState(null);
 const visiblePatchIndex = manualPatchIndex === null ? patchIndex : manualPatchIndex;
 useEffect(() => {
   if (shuffledSlides.length < 2) return;
   const timer = window.setInterval(() => setSlideIndex(i => (i + 1) % shuffledSlides.length), 6500);
   return () => window.clearInterval(timer);
 }, [shuffledSlides]);
 const hero = shuffledSlides[slideIndex % (shuffledSlides.length || 1)];
 const portrait = hero?.image
   ? (/^https?:\/\//i.test(hero.image) ? hero.image : '/' + hero.image.replace(/^\//, ''))
   : '/assets/images/ryu.png.png';
 const modules=[{name:'FIGHTERS',text:'Explore the roster, character strengths and frame data.',icon:Swords,route:'fighters'},{name:'TRAINING',text:'Build deliberate practice sessions and improve your game.',icon:Dumbbell,route:'training'},{name:'PROGRESSION',text:'Track your growth, achievements and personal bests.',icon:Trophy,route:'progression'},{name:'DEVELOPMENT',text:'Analyze matchups, ranks and training insights.',icon:Target,route:'development'}];
 return <div className="fl-concept-home"><section className="fl-concept-hero"><div className="fl-concept-hero-art" key={hero?.id ?? slideIndex} style={{backgroundImage:`url("${portrait}")`}} aria-hidden="true"/><div className="fl-concept-hero-copy"><div className="fl-concept-kicker"><Flame size={17}/> STREET FIGHTER 6 // TRAINING HUB</div><h1>TRAIN.<br/><span>LEARN.</span><br/>IMPROVE.<br/><em>EVOLVE.</em></h1><p>Your command center for mastering fighters, reviewing match results and measuring real progress.</p><div className="fl-concept-actions"><button className="btn-primary" onClick={()=>go('fighters')}>EXPLORE FIGHTERS <ChevronRight size={17}/></button><button className="btn-ghost" onClick={()=>go('progression')}>VIEW PROGRESSION <ArrowUpRight size={17}/></button></div><div className="fl-concept-hero-counter"><span>FIGHTER DATABASE ONLINE</span><strong>{String(characters.length).padStart(2,'0')} FIGHTERS</strong></div></div><div className="fl-concept-hero-quote"><span>“A WARRIOR NEVER STOPS LEARNING.”</span><small>FIGHTLAB // TRAIN · ADAPT · WIN</small></div></section><section className="fl-concept-module-grid" aria-label="FightLab tools">{modules.map(({name,text,icon:Icon,route})=><button key={route} onClick={()=>go(route)} className="fl-concept-module"><Icon size={31}/><strong>{name}</strong><span>{text}</span><ArrowUpRight size={16} className="fl-concept-arrow"/></button>)}</section>{patchFeed.length>0&&<section className="fl-concept-intel"><div><span className="fl-concept-kicker">LATEST INTEL // PATCH RADAR</span><h2>{patchFeed[((visiblePatchIndex%patchFeed.length)+patchFeed.length)%patchFeed.length]?.title}</h2><p>{patchFeed[((visiblePatchIndex%patchFeed.length)+patchFeed.length)%patchFeed.length]?.summary}</p></div><div className="fl-home-patch-controls"><button type="button" aria-label="Previous patch note" onClick={()=>setManualPatchIndex(i=>((i===null?patchIndex:i)-1+patchFeed.length)%patchFeed.length)}>‹</button><button type="button" aria-label="Next patch note" onClick={()=>setManualPatchIndex(i=>((i===null?patchIndex:i)+1)%patchFeed.length)}>›</button></div><button className="btn-ghost" onClick={()=>go('patches')}>PATCH NOTES <ArrowUpRight size={16}/></button></section>}</div>;
}
