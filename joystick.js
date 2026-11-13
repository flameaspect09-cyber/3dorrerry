/* Orrery Sky Phase 4C-1 - touch joystick for walking. Loaded after scene.js. All movement maths lives in walk.js (SkyWalk.joyVec etc.); this file is only the on-screen stick.
   It sets SkyHook.joy = {f, r, mag} while a finger holds the stick and null otherwise; scene.js reads it every frame, so walls, the dome glass, the fence and the door rules are the same as for the keyboard.
   Shown by default on touch (coarse pointer) screens, or with ?stick=1; the Stick button in the top bar turns it on and off (remembered). */
(function(){'use strict';
const H=window.SkyHook,W=window.SkyWalk;if(!H||!W)return;
const doc=document,q=new URLSearchParams(location.search);
let saved=null;try{saved=localStorage.getItem('orrerySky.stick')}catch(e){}
const coarse=typeof matchMedia==='function'&&(matchMedia('(pointer: coarse)').matches||(navigator.maxTouchPoints||0)>0);
let on=q.get('stick')==='1'?true:q.get('stick')==='0'?false:saved==='1'?true:saved==='0'?false:coarse;
const st=doc.createElement('style');
st.textContent='#stick{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:18px;z-index:6;padding:14px;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;display:none}'
+'#stick .ring{position:relative;border-radius:50%;background:radial-gradient(#1a2a4a55,#0a122288);border:2px solid #8fb3ff77;box-shadow:0 0 0 1px #0008}'
+'#stick .knob{position:absolute;left:50%;top:50%;border-radius:50%;background:#cfe0ffcc;border:2px solid #fff9;box-shadow:0 2px 8px #0009;transform:translate(-50%,-50%);will-change:transform}'
+'#stick.run .ring{border-color:#ffd37a;box-shadow:0 0 12px #ffd37a88}'
+'#stick .ring::before,#stick .ring::after{content:"";position:absolute;background:#8fb3ff33}#stick .ring::before{left:50%;top:12%;bottom:12%;width:1px}#stick .ring::after{top:50%;left:12%;right:12%;height:1px}';
doc.head.appendChild(st);
const box=doc.createElement('div');box.id='stick';box.setAttribute('role','application');box.setAttribute('aria-label','Walking joystick. Drag to walk, push to the edge to run.');
box.innerHTML='<div class="ring"><div class="knob"></div></div>';doc.body.appendChild(box);
const ring=box.firstChild,knob=ring.firstChild,card=doc.getElementById('card'),ui=doc.getElementById('ui');
let pid=null,size=120;
// Size and place it for phones: about 30% of the short screen side (112 to 156 px), shrunk (down to 80 px) if the room between the top bar and the info card is small (phone in landscape), sitting just above the info card.
function layout(){const vw=window.innerWidth||360,vh=window.innerHeight||640,ch=card?card.offsetHeight:0,ub=ui?ui.getBoundingClientRect().bottom:60,room=vh-ch-ub-54; // 54 = padding, borders and gaps around the ring
 size=Math.round(Math.max(80,Math.min(Math.min(156,Math.max(112,.3*Math.min(vw,vh))),room)));ring.style.width=ring.style.height=size+'px';knob.style.width=knob.style.height=Math.round(size*.4)+'px';
 box.style.bottom='calc(max(10px,env(safe-area-inset-bottom)) + '+(ch?ch+8:8)+'px)'}
function show(v){on=v;box.style.display=v?'block':'none';if(!v)release();const b=doc.getElementById('bstick');if(b)b.setAttribute('aria-pressed',v?'true':'false');try{localStorage.setItem('orrerySky.stick',v?'1':'0')}catch(e){}if(v)layout()}
function release(){pid=null;H.joy=null;knob.style.transform='translate(-50%,-50%)';box.classList.remove('run')}
function update(e){const r=ring.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2-knob.offsetWidth/2,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),k=d>R?R/d:1;
 const v=W.joyVec(dx,dy,R);H.joy=v.mag>0?{f:v.f,r:v.r,mag:v.mag}:null;box.classList.toggle('run',v.mag>W.JOY.walkAt);knob.style.transform='translate(calc(-50% + '+(dx*k)+'px),calc(-50% + '+(dy*k)+'px))'}
box.addEventListener('pointerdown',e=>{if(pid!==null)return;pid=e.pointerId;try{box.setPointerCapture(pid)}catch(x){}e.preventDefault();update(e)});
box.addEventListener('pointermove',e=>{if(e.pointerId===pid){e.preventDefault();update(e)}});
for(const t of['pointerup','pointercancel','lostpointercapture'])box.addEventListener(t,e=>{if(e.pointerId===pid)release()});
box.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',release);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)release()});
addEventListener('resize',()=>{if(on)layout()});addEventListener('orientationchange',()=>{if(on)setTimeout(layout,150)});
if(typeof ResizeObserver==='function'&&card)new ResizeObserver(()=>{if(on)layout()}).observe(card);
if(ui){const b=doc.createElement('button');b.id='bstick';b.textContent='Stick';b.setAttribute('aria-label','Show or hide the touch joystick for walking');b.onclick=()=>show(!on);ui.appendChild(b)}
H.stick={show,isOn:()=>on,size:()=>size,el:box};
show(on);
})();
