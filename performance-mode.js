/* Phase 4E-1B: mode preference only. Rendering remains unchanged until later tasks. */
(function(root){'use strict';
 const KEY='orrerySky.performanceMode';let mode='normal';const listeners=new Set();
 try{mode=root.localStorage.getItem(KEY)==='low'?'low':'normal'}catch(e){}
 function syncButton(){const b=root.document&&root.document.getElementById('performance-mode');if(!b)return;b.textContent='Performance: '+(mode==='low'?'Low':'Normal');b.setAttribute('aria-pressed',mode==='low'?'true':'false')}
 function setMode(next){if(next!=='normal'&&next!=='low')return false;if(next!==mode){mode=next;try{root.localStorage.setItem(KEY,mode)}catch(e){}syncButton();listeners.forEach(fn=>{try{fn(mode)}catch(e){}})}return true}
 function toggle(){setMode(mode==='low'?'normal':'low');return mode}
 function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn)}
 const api={getMode:()=>mode,setMode,toggle,subscribe};root.OrreryPerformanceMode=api;
 const b=root.document&&root.document.getElementById('performance-mode');if(b)b.addEventListener('click',toggle);syncButton();
})(typeof window!=='undefined'?window:globalThis);
