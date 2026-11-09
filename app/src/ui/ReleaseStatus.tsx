import { useEffect, useState } from "react";
import { useCare } from "../data/workflow";
export function StorageNotice(){
 const {recoveryRequired,storageWarning,reset}=useCare();
 if(!recoveryRequired&&!storageWarning)return null;
 const exportOriginal=()=>{try{const raw=localStorage.getItem("carebridge-workflow-v1");if(raw===null)return;const url=URL.createObjectURL(new Blob([raw],{type:"text/plain"}));const a=document.createElement("a");a.href=url;a.download="avenlyth-workflow-recovery.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{/* Browser storage may be completely unavailable. */}};
 return <aside role="status" className="mx-4 mt-4 rounded-xl border border-amber/30 bg-amber-soft p-4 text-sm sm:mx-8"><b>{recoveryRequired?"Workflow recovery required":"Workflow storage unavailable"}</b><p className="mt-1">{recoveryRequired?"The stored workflow could not be restored. Its original browser record is retained and will not be overwritten. Editing is paused until you reset.":"Edits are session-only. Browser persistence is unavailable."}</p>{recoveryRequired&&<div className="mt-3 flex flex-wrap gap-4"><button className="font-semibold underline" onClick={exportOriginal}>Download original record</button><button className="font-semibold underline" onClick={()=>{if(window.confirm("Replace the invalid stored demo workflow with the initial synthetic data? Download the original record first if needed."))reset();}}>Reset stored demo workflow</button></div>}</aside>;
}
export function BuildStatus(){
 const [commit,setCommit]=useState<string|null>(null);const [loaded,setLoaded]=useState(false);
 useEffect(()=>{if(import.meta.env.DEV){setLoaded(true);return;}const controller=new AbortController();fetch("/build-info.json",{cache:"no-store",signal:controller.signal}).then(r=>{if(!r.ok)throw Error("Build info unavailable");return r.json();}).then(x=>{if(typeof x.commit==="string"&&/^[a-f0-9]{40}$/i.test(x.commit))setCommit(x.commit);setLoaded(true);}).catch(e=>{if(e.name!=="AbortError")setLoaded(true);});return()=>controller.abort();},[]);
 return <footer className="mx-auto max-w-7xl px-4 pb-4 text-xs text-body sm:px-8">AVENLYTH · synthetic-data demonstration · {import.meta.env.DEV?"local development build":commit?<span title={commit}>Build {commit.slice(0,8)}</span>:loaded?"Build identification unavailable":"Checking build identification…"}</footer>;
}
