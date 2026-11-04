import '../fightlab-id-motion.css';
import React, {useEffect,useRef,useState} from "react";
const chartMetrics = [
  {key:"startup",label:"Startup"}, {key:"active",label:"Active"},
  {key:"recovery",label:"Recovery"}, {key:"onHit",label:"On Hit"},
  {key:"onBlock",label:"On Block"}
];
function numericFrame(value){
  const s=String(value??"").trim();
  return /^[+-]?\d+(?:\.\d+)?$/.test(s) ? Number(s) : null;
}
export default function FighterFrameChart({fighter, wikiMoves}){
  const [metric,setMetric]=useState("startup");
  const [sourceType,setSourceType]=useState("scraped");
  useEffect(()=>setMetric("startup"),[fighter.name]);
  const scraped=wikiMoves[fighter.name]?.moves||[];
  const database=fighter.databaseMoves||[];
  const source=sourceType==="database"?database:scraped;
  const available=source.map((m,i)=>({...m,position:i})).filter(m=>numericFrame(m[metric])!==null).slice(0,24);

  const w=760,h=260,left=54,right=20,top=24,bottom=64;
  const vals=available.map(m=>numericFrame(m[metric]));
  // Retain the previous coordinates and tween to new ones on metric/source changes.
  const targetRef=useRef([]);
  const [animatedValues,setAnimatedValues]=useState([]);
  useEffect(()=>{
    const target=vals.slice();
    const previous=targetRef.current;
    const start=target.map((v,i)=>Number.isFinite(previous[i])?previous[i]:v);
    targetRef.current=target;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setAnimatedValues(target);return;}
    let frame,begin;
    const animate=timestamp=>{
      if(begin===undefined)begin=timestamp;
      const t=Math.min(1,(timestamp-begin)/480);
      const eased=1-Math.pow(1-t,3);
      setAnimatedValues(target.map((v,i)=>start[i]+(v-start[i])*eased));
      if(t<1)frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(frame);
  },[metric,sourceType,fighter.name,vals.join(',')]);
  const display=vals.map((v,i)=>Number.isFinite(animatedValues[i])?animatedValues[i]:v);
  const min=Math.min(0,...vals,...display),max=Math.max(1,...vals,...display);
  const range=max-min||1;
  const x=i=>left+(available.length===1?0:i/(available.length-1))*(w-left-right);
  const y=v=>top+(max-v)/range*(h-top-bottom);
  const points=available.map((m,i)=>`${x(i)},${y(display[i])}`).join(" ");
  if(!source.length) return <section className="fighter-chart"><h4>FRAME DATA GRAPH</h4><p>No imported frame data is available for this fighter yet.</p></section>;
  return <section className="fighter-chart"><h4>FRAME DATA GRAPH</h4><p>Compare the first 24 moves with simple numeric values. Switch metrics to explore different frame properties.</p>
    <div className="fighter-chart-controls" role="group" aria-label="Frame data source">
      <button type="button" className={sourceType === "scraped" ? "active" : ""} onClick={() => setSourceType("scraped")}>
        SOURCE 1
      </button>
      <button type="button" className={sourceType === "database" ? "active" : ""} onClick={() => setSourceType("database")}>
        SOURCE 2 ({database.length})
      </button>
    </div>
    <div className="fighter-chart-controls" role="group" aria-label="Frame data graph metric">{chartMetrics.map(opt=><button key={opt.key} type="button" className={metric===opt.key?"active":""} onClick={()=>setMetric(opt.key)}>{opt.label}</button>)}</div>
    {available.length? <div className="fighter-chart-scroll"><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${fighter.name} ${chartMetrics.find(m=>m.key===metric)?.label} frame data line graph`}>
      {[0,.25,.5,.75,1].map((t,i)=>{const v=min+(max-min)*(1-t);return <g key={i}><line x1={left} x2={w-right} y1={y(v)} y2={y(v)} stroke="#ffffff25"/><text x={left-9} y={y(v)+4} textAnchor="end" fill="#c6c6c6" fontSize="12">{Number(v.toFixed(1))}</text></g>})}
      <polyline points={points} fill="none" stroke="#f04d4d" strokeWidth="3" strokeLinejoin="round"/>
      {available.map((m,i)=><g key={m.position}><circle cx={x(i)} cy={y(display[i])} r="5" fill="#ff6868"><title>{m.name}: {vals[i]}</title></circle>{(available.length<=12||i%2===0)&&<text x={x(i)} y={h-44} transform={`rotate(-45 ${x(i)} ${h-44})`} fill="#ddd" fontSize="10" textAnchor="end">{String(m.name).slice(0,13)}</text>}</g>)}
    </svg></div>:<p>No simple numeric values available for this metric.</p>}
    <p className="fighter-chart-note">
      Frame data values are displayed according to the selected source.
    </p>
  </section>;
}
