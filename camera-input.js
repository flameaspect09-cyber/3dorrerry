/* Orrery Sky Phase 4C-2 - camera input (look, zoom) for touch, mouse, pen and keyboard. Loaded BEFORE sky.js; sky.js calls CamInput.attach(canvas, api).
   NOT tried on a real phone. Every number in CamInput.CFG is a first guess made without touching a real screen; they are collected here so they can be tuned in one place.
   Desktop behaviour is kept: mouse drag has no dead zone, the wheel still zooms by exp(deltaY*0.001), arrow keys and + - still work (but not while you type in a box). */
(function(root){'use strict';
const CFG={
 slop:{touch:6,pen:3,mouse:0},   // px a finger must travel before a drag starts looking (stops a tap with a shaky finger from nudging the view)
 touchGain:1,                    // 1 = the sky follows the finger 1:1 at the centre of the view (deg per px = fov / screen height)
 pinchExp:1,                     // fov = fov at start x (start distance / distance now)^pinchExp; 1 = fingers twice as far apart -> half the field of view
 pinchPanSlop:10,               // px the midpoint of the two fingers must travel from where it started before two-finger look begins (so a plain pinch never drifts the view)
 pinchMinDist:24,                // px; fingers closer than this count as 24 px apart (avoids a division blow-up)
 flingMin:350,                   // px/s needed at lift-off to coast
 flingMaxAge:70,                 // ms; if the finger rested this long before lifting, no coast
 flingWindow:110,                // ms of recent movement used to measure the speed
 flingCap:3000,                 // px/s upper limit
 flingScreens:1.2,               // ...and a coast never travels further than this many screen heights (v * tau <= 1.2 * height), so a flick on a short landscape phone cannot spin the sky round
 flingTau:.32,                   // s; speed falls to 1/e in this time
 flingStop:25,                   // px/s; below this the coast ends
 wheelMax:250,                   // largest deltaY used from ONE wheel event (a normal notch is 100-120)
 wheelLine:33,wheelPage:0        // deltaMode 1 (lines, Firefox) -> px per line; deltaMode 2 (pages) -> screen heights (0 = use the real height)
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const _now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const typing=t=>!!t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable===true);

// api: {get():{yaw,pitch,fov}, set(yaw,pitch,fov), inv():1|-1, height():px, lim:{minFov,maxFov,minPitch,maxPitch}}
function attach(el,api,opt){
 opt=opt||{};const now=opt.now||_now,lim=api.lim||{minFov:.2,maxFov:120,minPitch:-35,maxPitch:85},C=Object.assign({},CFG,opt.cfg||{});
 const ptrs=new Map();let look=null,pinch=null,fl=null,lastType='mouse',stats={looks:0,pinches:0,flings:0};
 const reduce=()=>{try{return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
 const H=()=>Math.max(1,api.height()||1);
 function put(yaw,pitch,fov){api.set(((yaw%360)+360)%360,clamp(pitch,lim.minPitch,lim.maxPitch),clamp(fov,lim.minFov,lim.maxFov))}
 // turn the view by a finger movement of (dx,dy) px; gain is the touch gain for touch/pen
 function pan(dx,dy,gain){const v=api.get(),k=v.fov/H()*gain,i=api.inv();put(v.yaw+i*dx*k,v.pitch-i*dy*k,v.fov)}
 function stopFling(){fl=null}
 function idOf(e){return e.pointerId!==undefined?e.pointerId:(ptrs.size===1?ptrs.keys().next().value:undefined)}
 const slopOf=t=>C.slop[t]!==undefined?C.slop[t]:C.slop.touch;
 function startLook(id,p,moved){look={id,sx:p.x,sy:p.y,x:p.x,y:p.y,moved:!!moved||slopOf(p.type)<=0,type:p.type,s:[]};pinch=null}   // no dead zone (mouse): moving from the first pixel, exactly as before 4C-2
 function startPinch(){const ids=[...ptrs.keys()].slice(0,2),a=ptrs.get(ids[0]),b=ptrs.get(ids[1]);look=null;
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;pinch={ids,d0:Math.max(C.pinchMinDist,Math.hypot(a.x-b.x,a.y-b.y)),fov0:api.get().fov,mx,my,mx0:mx,my0:my,pan:false};stats.pinches++}
 const gainOf=t=>t==='mouse'?1:C.touchGain;

 el.addEventListener('pointerdown',e=>{e=e||{};stopFling();const id=e.pointerId!==undefined?e.pointerId:0,type=e.pointerType||'mouse';lastType=type;
  ptrs.set(id,{x:e.clientX,y:e.clientY,type});try{el.setPointerCapture(id)}catch(x){}
  if(ptrs.size===1)startLook(id,ptrs.get(id),false);else if(ptrs.size===2)startPinch()}); // a third finger is ignored
 el.addEventListener('pointermove',e=>{e=e||{};const id=idOf(e);if(id===undefined||!ptrs.has(id))return;const p=ptrs.get(id);p.x=e.clientX;p.y=e.clientY;
  if(pinch&&pinch.ids.includes(id)){const a=ptrs.get(pinch.ids[0]),b=ptrs.get(pinch.ids[1]);if(!a||!b)return;
   const d=Math.max(C.pinchMinDist,Math.hypot(a.x-b.x,a.y-b.y)),v=api.get(),f=clamp(pinch.fov0*Math.pow(pinch.d0/d,C.pinchExp),lim.minFov,lim.maxFov);
   if(f<=lim.minFov||f>=lim.maxFov){pinch.d0=d;pinch.fov0=f}  // at a limit: restart from here so the next reverse pinch responds at once
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,k=f/H()*C.touchGain,i=api.inv();
   if(!pinch.pan&&Math.hypot(mx-pinch.mx0,my-pinch.my0)>=C.pinchPanSlop)pinch.pan=true,pinch.mx=mx,pinch.my=my;   // the midpoint drags the view (two-finger look) only after a deliberate move
   if(pinch.pan){put(v.yaw+i*(mx-pinch.mx)*k,v.pitch-i*(my-pinch.my)*k,f)}else put(v.yaw,v.pitch,f);
   pinch.mx=mx;pinch.my=my;return}
  if(!look||look.id!==id)return;
  if(!look.moved){if(Math.hypot(p.x-look.sx,p.y-look.sy)<slopOf(look.type))return;look.moved=true;look.x=p.x;look.y=p.y;stats.looks++;look.s.push({t:now(),x:p.x,y:p.y});return}  // crossed the dead zone: start from here, no jump
  const dx=p.x-look.x,dy=p.y-look.y;look.x=p.x;look.y=p.y;pan(dx,dy,gainOf(look.type));
  if(look.type!=='mouse'){const t=now();look.s.push({t,x:p.x,y:p.y});while(look.s.length>2&&t-look.s[0].t>C.flingWindow)look.s.shift()}});
 function release(id,cancel){
  if(id===undefined){ptrs.clear();look=null;pinch=null;return}
  if(!ptrs.has(id))return;const wasLook=look&&look.id===id,lk=look;ptrs.delete(id);
  if(pinch&&pinch.ids.includes(id)){pinch=null;const rest=[...ptrs.entries()][0];if(rest)startLook(rest[0],rest[1],true);return}   // 2 -> 1 fingers: continue as a look from where that finger is, no jump
  if(wasLook){look=null;if(!cancel&&lk.moved&&lk.type==='touch'&&!reduce())startFling(lk)}
  if(ptrs.size===0){look=null;pinch=null}}
 function startFling(lk){const s=lk.s,t=now();if(s.length<2)return;const a=s[0],b=s[s.length-1];if(t-b.t>C.flingMaxAge)return;const dt=(b.t-a.t)/1000;if(dt<.016)return;
  let vx=(b.x-a.x)/dt,vy=(b.y-a.y)/dt;const sp=Math.hypot(vx,vy);if(sp<C.flingMin)return;const cap=Math.min(C.flingCap,C.flingScreens*H()/C.flingTau);if(sp>cap){vx*=cap/sp;vy*=cap/sp}
  fl={vx,vy,t:now()};stats.flings++;step()}
 function step(){if(!fl)return;const me=fl;if(typeof requestAnimationFrame!=='function')return;requestAnimationFrame(()=>{if(fl!==me)return;const t=now(),dt=Math.min(.05,Math.max(0,(t-me.t)/1000));me.t=t;
   const v0=api.get();pan(me.vx*dt,me.vy*dt,C.touchGain);const v1=api.get();
   if(v1.pitch<=lim.minPitch+1e-9&&me.vy>0||v1.pitch>=lim.maxPitch-1e-9&&me.vy<0)me.vy=0;     // hit the top or bottom: stop that part
   const f=Math.exp(-dt/C.flingTau);me.vx*=f;me.vy*=f;if(Math.hypot(me.vx,me.vy)<C.flingStop){fl=null;return}step()})}
 for(const n of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(n,e=>release(e&&e.pointerId!==undefined?e.pointerId:(e&&e.type?idOf(e):undefined),n==='pointercancel'));
 el.addEventListener('wheel',e=>{e.preventDefault();stopFling();let d=e.deltaY||0;if(e.deltaMode===1)d*=C.wheelLine;else if(e.deltaMode===2)d*=(C.wheelPage||H());d=clamp(d,-C.wheelMax,C.wheelMax);
  const v=api.get();put(v.yaw,v.pitch,v.fov*Math.exp(d*.001))},{passive:false});
 el.addEventListener('contextmenu',e=>{if(lastType!=='mouse')e.preventDefault()}); // long-press menu on touch/pen only; the desktop right-click menu is untouched
 if(typeof addEventListener==='function'){
  addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||typing(e.target))return;
   if(/^Arrow/.test(e.key)&&e.target&&e.target.hasAttribute&&e.target.hasAttribute('data-own-arrows'))return;   // a focused scrollable info card keeps its arrow keys for scrolling
  const v=api.get(),s=v.fov/20,k=e.key,i=api.inv();let y=v.yaw,p=v.pitch,f=v.fov,hit=true;  // Ctrl/Cmd + or - is the browser's own zoom; typing - in the latitude box is not a camera command
   if(k==='ArrowLeft')y-=s*i;else if(k==='ArrowRight')y+=s*i;else if(k==='ArrowUp')p+=s*i;else if(k==='ArrowDown')p-=s*i;else if(k==='+'||k==='=')f/=1.2;else if(k==='-')f*=1.2;else hit=false;
   if(hit){stopFling();put(y,p,f)}});
  const drop=()=>{ptrs.clear();look=null;pinch=null;stopFling()};
  addEventListener('blur',drop);
  if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('visibilitychange',()=>{if(document.hidden)drop()})}
 return{cfg:C,stats,stop:stopFling,active:()=>({pointers:ptrs.size,look:!!look,pinch:!!pinch,fling:!!fl})}}

// Page-level guards for phones: no pull-to-refresh / rubber-band / page pinch from the top bar or empty areas. The info card (scrollable), text boxes and the canvas keep their own behaviour.
function guardPage(doc,scrollable){
 if(!doc||!doc.addEventListener)return;
 doc.addEventListener('touchmove',e=>{const t=e.target;if(typing(t))return;if(scrollable&&t&&t.closest&&t.closest(scrollable))return;if(e.cancelable)e.preventDefault()},{passive:false});
 for(const n of['gesturestart','gesturechange','gestureend'])doc.addEventListener(n,e=>e.preventDefault())}   // iOS Safari page-pinch events; harmless elsewhere

const api={attach,guardPage,CFG};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.CamInput=api;
})(typeof window!=='undefined'?window:globalThis);
