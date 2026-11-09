import { useEffect, useRef, type RefObject } from "react";
export function useDialog(ref:RefObject<HTMLElement>,onClose:()=>void){
 const close=useRef(onClose);useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{
  const root=ref.current;if(!root)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const oldOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
  const focusables=()=>[...root.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')].filter(e=>e.tabIndex>=0&&e.getClientRects().length>0);
  (root.querySelector<HTMLElement>('[aria-label="Close panel"]')??focusables()[0]??root).focus();
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="Escape"){e.preventDefault();close.current();return;}
   if(e.key!=="Tab")return;const elements=focusables();const first=elements[0],last=elements[elements.length-1];
   if(!first){e.preventDefault();root.focus();return;}
   if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){e.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",onKey);
  return()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=oldOverflow;if(previous?.isConnected)previous.focus();};
 },[ref]);
}
