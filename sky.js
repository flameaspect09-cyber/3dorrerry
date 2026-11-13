/* Orrery Sky Phase 1 viewer. UNTESTED in a real browser/GPU (written without one). Plain platform, no scene yet (Phase 2). */
(function(){'use strict';
const M=SkyMath,C=EventFinderCore,OE=OrreryEclipse,EL=EclipseLocal,D=Math.PI/180,$=id=>document.getElementById(id);
const cv=$('c'),card=$('card');let ren;
try{ren=new THREE.WebGLRenderer({canvas:cv,antialias:true});}catch(e){card.innerHTML='WebGL is not available. Sky needs it. Sun/Moon/planet data cannot be drawn without it.';return}
function pixelRatioForMode(){const dpr=devicePixelRatio||1,mode=window.OrreryPerformanceMode,normal=Math.min(dpr,1.5),low=Math.min(dpr,1)*0.75;return mode&&mode.getMode()==='low'?low:normal}
function applyRenderMode(){ren.setPixelRatio(pixelRatioForMode());ren.shadowMap.enabled=!(window.OrreryPerformanceMode&&window.OrreryPerformanceMode.getMode()==='low');ren.shadowMap.type=THREE.PCFSoftShadowMap}
applyRenderMode();if(window.OrreryPerformanceMode&&window.OrreryPerformanceMode.subscribe)window.OrreryPerformanceMode.subscribe(applyRenderMode);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(60,1,.3,15000),skyG=new THREE.Group();skyG.scale.setScalar(20);scene.add(skyG); // sky lives in a group x20 that follows the camera, so scene geometry can occlude it
const dir=(alt,az,r)=>new THREE.Vector3(Math.sin(az*D)*Math.cos(alt*D),Math.sin(alt*D),-Math.cos(az*D)*Math.cos(alt*D)).multiplyScalar(r||100); // north=-z, east=+x
// sky dome
const U={top:{value:new THREE.Color()},hor:{value:new THREE.Color()},glow:{value:new THREE.Color()},ga:{value:0},cg:{value:0},sd:{value:new THREE.Vector3(0,1,0)},warm:{value:new THREE.Color()},belt:{value:new THREE.Color()},wa:{value:0},ba:{value:0},asym:{value:1},sa:{value:new THREE.Vector3(1,0,0)},hz:{value:new THREE.Color()},za:{value:0},zk:{value:8},gt:{value:0}};
const skyVertexShader='varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
// Normal mode keeps the established sky fragment shader. Low mode skips optional atmosphere/twilight work and dither.
const normalSkyFragmentShader='uniform vec3 top,hor,glow,sd,warm,belt,sa,hz;uniform float ga,cg,wa,ba,asym,za,zk,gt;varying vec3 v;void main(){float h=v.y,hh=max(h,0.);vec3 c=mix(hor,top,pow(hh,.5));vec3 az=normalize(vec3(v.x,.001,v.z));float side=mix(1.,dot(az,sa)*.5+.5,asym);c=mix(c,warm,clamp(wa*pow(side,2.2)*exp(-hh*5.)*.9,0.,1.));c=mix(c,belt,clamp(ba*pow(1.-side,1.5)*exp(-pow((hh-.09)/.1,2.)),0.,1.));c*=1.-.25*ba*pow(1.-side,2.)*exp(-hh*25.);c=mix(c,hz,clamp(za*(.65+.35*side)*exp(-hh*zk),0.,1.));float ds=max(dot(v,sd),0.);c+=glow*(ga*pow(ds,6.)+gt*pow(ds,40.));c+=vec3(1.,.55,.2)*cg*smoothstep(-.1,.5,normalize(vec3(v.x,.001,v.z)).x)*exp(-hh*9.);c=mix(vec3(.01,.012,.02)+hor*.15,c,smoothstep(-.015,.0,h));c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;gl_FragColor=vec4(c,1.);}';
const lowSkyFragmentShader='uniform vec3 top,hor,glow,sd;uniform float ga,cg,gt;varying vec3 v;void main(){float h=v.y,hh=max(h,0.);vec3 c=mix(hor,top,pow(hh,.5));float ds=max(dot(v,sd),0.);c+=glow*(ga*pow(ds,6.)+gt*pow(ds,40.));vec3 az=normalize(vec3(v.x,.001,v.z));c+=vec3(1.,.55,.2)*cg*max(0.,az.x)*max(0.,1.-hh*9.);c=mix(vec3(.01,.012,.02)+hor*.15,c,smoothstep(-.015,.0,h));gl_FragColor=vec4(c,1.);}';
const normalSkyMaterial=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,vertexShader:skyVertexShader,fragmentShader:normalSkyFragmentShader});
const lowSkyMaterial=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,vertexShader:skyVertexShader,fragmentShader:lowSkyFragmentShader});
let activeSkyMode=window.OrreryPerformanceMode&&window.OrreryPerformanceMode.getMode()==='low'?'low':'normal';
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(300,32,16),activeSkyMode==='low'?lowSkyMaterial:normalSkyMaterial);skyG.add(skyDome);
function applySkyMode(mode){activeSkyMode=mode==='low'?'low':'normal';skyDome.material=activeSkyMode==='low'?lowSkyMaterial:normalSkyMaterial}
if(window.OrreryPerformanceMode&&window.OrreryPerformanceMode.subscribe)window.OrreryPerformanceMode.subscribe(applySkyMode);
// stars + planets as points
const NP=7,NS=M.STARS.length,N=NP+NS,pos=new Float32Array(N*3),sz=new Float32Array(N),al=new Float32Array(N),col=new Float32Array(N*3);
const pc={mercury:[.8,.8,.8],venus:[1,.97,.9],mars:[1,.6,.4],jupiter:[1,.93,.8],saturn:[1,.9,.65],uranus:[.7,.9,1],neptune:[.6,.7,1]};
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('size',new THREE.BufferAttribute(sz,1));g.setAttribute('alpha',new THREE.BufferAttribute(al,1));g.setAttribute('color',new THREE.BufferAttribute(col,3));
const pts=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'attribute float size,alpha;attribute vec3 color;varying float a;varying vec3 c;void main(){a=alpha;c=color;gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying float a;varying vec3 c;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(c,a*smoothstep(1.,.2,d));}'}));pts.frustumCulled=false;skyG.add(pts);
// Sun and Moon sprites
function glowTex(){const k=document.createElement('canvas');k.width=k.height=128;const x=k.getContext('2d'),r=x.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'#fff');r.addColorStop(.12,'#fff8dd');r.addColorStop(.3,'rgba(255,220,150,.35)');r.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=r;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(k)}
const sst=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
// Sun = glow sprite + limb-darkened disc sprite + corona sprite (only visible in totality); Moon sprite is drawn in front, so it really covers the Sun.
function discTex(){const k=document.createElement('canvas');k.width=k.height=128;const x=k.getContext('2d'),r=x.createRadialGradient(64,64,0,64,64,60);r.addColorStop(0,'#fffff6');r.addColorStop(.8,'#fff1cc');r.addColorStop(.96,'#ffcf8a');r.addColorStop(1,'rgba(255,200,130,0)');x.fillStyle=r;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(k)}
function coronaTex(){const N=256,k=document.createElement('canvas');k.width=k.height=N;const x=k.getContext('2d'),im=x.createImageData(N,N),d=im.data,RC=4; // sprite spans 4 solar radii each side; streamers and falloff are ILLUSTRATIVE, not a photograph
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const px=(i+.5-N/2)/(N/2)*RC,py=-(j+.5-N/2)/(N/2)*RC,rs=Math.max(1,Math.hypot(px,py)),ph=Math.atan2(py,px),
  I=(.85*Math.exp(-(rs-1)*2.6)+.14*Math.exp(-(rs-1)*.75))*(.82+.18*Math.cos(5*ph+1.3)*Math.cos(2*ph))*(1-sst(3,4,rs)),n=(j*N+i)*4;d[n]=255;d[n+1]=243;d[n+2]=214;d[n+3]=Math.max(0,Math.min(255,I*255))}
 x.putImageData(im,0,0);return new THREE.CanvasTexture(k)}
const sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),mk=document.createElement('canvas');mk.width=mk.height=256;
const sunD=new THREE.Sprite(new THREE.SpriteMaterial({map:discTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),corS=new THREE.Sprite(new THREE.SpriteMaterial({map:coronaTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
const moonS=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(mk),transparent:true,depthWrite:false}));sunS.renderOrder=1;sunD.renderOrder=2;corS.renderOrder=3;moonS.renderOrder=4;corS.visible=false;skyG.add(sunS,sunD,corS,moonS);
const img=new Image();img.onload=()=>{try{const k=document.createElement('canvas');k.width=img.width;k.height=img.height;const x=k.getContext('2d');x.drawImage(img,0,0);OE.setMoonTexture(x.getImageData(0,0,k.width,k.height).data,k.width,k.height);moonKey='';update(true)}catch(e){card.dataset.tex='Moon texture unreadable (open via http://, not file://); using plain grey.'}};img.src='tex/MoonMoon2k.webp';
// state
// Planet disks (Phase 4A-1): flat-colour procedural disc, no textures. A planet is a POINT until its true angular size is big enough on screen, then it cross-fades to a DISC of the true size. No rings yet.
// Phase 4A-4: Saturn's disc is a procedural globe + RINGS picture (SkyMath.saturnDisk, 256 px, north pole up, turned toward the pole's screen direction every frame). It cross-fades from the point by the size of the RING system, not of the globe. No textures downloaded.
// Phase 4A-2/4A-3: the discs of Mercury, Venus and Mars carry phase shading (texture from SkyMath.phaseDisk, lit side up; the sprite is turned toward the Sun on screen every frame, one 128 px texture each). Jupiter to Neptune keep the flat disc.
function planetDiskTex(){const N=128,k=document.createElement('canvas');k.width=k.height=N;const x=k.getContext('2d'),r=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);r.addColorStop(0,'#fff');r.addColorStop(.94,'#fff');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,N,N);return new THREE.CanvasTexture(k)}
const DISK_FILL=.94,DISK_R=90,pdTex=planetDiskTex(),pdS=[],alB=new Float32Array(NP),dskInfo=[],PN=['mercury','venus','mars','jupiter','saturn','uranus','neptune'],VI=PN.indexOf('venus'),vnN=128,SI=PN.indexOf('saturn'),satN=256,sat={B:NaN,draws:0,rot:0,k:null,tex:null},phs={}; // sat = Saturn globe+ring texture state (Phase 4A-4); phs[i] = phase texture state of a shaded planet (Mercury, Venus, Mars; i = planet index): {phase,draws,rot,k (canvas),tex} // DISK_FILL: the opaque part of the texture is 94% of the quad (soft 6% edge); DISK_R: same sky radius as the points
['mercury','venus','mars'].forEach(n=>{const k=document.createElement('canvas');k.width=k.height=vnN;phs[PN.indexOf(n)]={phase:NaN,draws:0,rot:0,k,tex:new THREE.CanvasTexture(k)}});
sat.k=document.createElement('canvas');sat.k.width=sat.k.height=satN;sat.tex=new THREE.CanvasTexture(sat.k);
for(let i=0;i<NP;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:phs[i]?phs[i].tex:i===SI?sat.tex:pdTex,color:new THREE.Color(...pc[PN[i]]),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));sp.renderOrder=.5;sp.visible=false;skyG.add(sp);pdS.push(sp)}
let jd=0,lat=14.6,lon=121,yaw=0,pitch=15,fov=60,S=null,moonKey='',pend=null,selectedObject='',lastObjectDescription='';
try{const p=JSON.parse(localStorage.getItem('orrerySky.place')||'null');if(p&&isFinite(p.lat)&&isFinite(p.lon)){lat=p.lat;lon=p.lon}}catch(e){}
const q=new URLSearchParams(location.search),clampN=(x,a,b)=>Math.min(b,Math.max(a,x));
const fmt=j=>C.jdToDate(j).toISOString().slice(0,19);
function lerpC(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
// Phase 4B-1: colours come from SkyMath.skyPalette (smooth in the Sun's altitude); the old 2-step blend is gone.
function setSkyColors(h,asym){const P=M.skyPalette(h,asym);U.top.value.setRGB(...P.top);U.hor.value.setRGB(...P.hor);U.glow.value.setRGB(...P.glow);U.warm.value.setRGB(...P.warm);U.belt.value.setRGB(...P.belt);U.wa.value=P.wa;U.ba.value=P.ba;U.asym.value=P.asym;U.ga.value=P.ga;U.hz.value.setRGB(...P.hz);U.za.value=P.za;U.zk.value=P.zk;U.gt.value=P.gt}
function updateObjectDescription(){if(!S)return;const node=$('sky-object-current');if(!node)return;
 const horizon=o=>o.alt>0?'above the horizon':'below the horizon',planetVisible=p=>p.alt>0&&p.mag<=S.limit;
 const moonState=Math.round(S.moon.illum*100)+'% illuminated, '+(S.moon.waxing?'waxing':'waning');
 const planets=S.planets.filter(planetVisible).map(p=>p.name[0].toUpperCase()+p.name.slice(1)+' (magnitude '+p.mag.toFixed(1)+')');
 const stars=S.stars.filter(s=>s.alt>0&&s.mag<=S.limit).map(s=>s.name);
 let next='Current sky: Sun '+horizon(S.sun)+'; Moon '+horizon(S.moon)+', '+moonState+'. Visible planets: '+(planets.join(', ')||'none')+'. Bright stars above the visibility limit: '+(stars.join(', ')||'none')+'.';
 if(selectedObject){const o=find(selectedObject,S);if(o){const name=selectedObject==='sun'?'Sun':selectedObject==='moon'?'Moon':o.name[0].toUpperCase()+o.name.slice(1),kind=selectedObject==='sun'?'star':selectedObject==='moon'?'Earth’s natural satellite':'planet';let state=horizon(o);
  if(selectedObject!=='sun'&&selectedObject!=='moon')state=planetVisible(o)?'visible':o.alt>0?'above the horizon but fainter than the current visibility limit':state;
  next+=' Selected object: '+name+', '+kind+', '+state+', altitude '+Math.round(o.alt)+'°.'+(selectedObject==='moon'?' '+moonState+'.':selectedObject!=='sun'?' Magnitude '+o.mag.toFixed(1)+'.':'');}}
 if(next!==lastObjectDescription){node.textContent=next;lastObjectDescription=next}}
function selectObject(k){if(!S||!find(k,S))return;selectedObject=k;updateObjectDescription()}
function update(force){if(!jd)return;S=M.sky(jd,lat,lon,{city:window.SkyCity||0});setSkyColors(S.sun.eff,M.eclipseAsym(S.sun.trueAlt,S.sun.eff));U.sd.value.copy(dir(S.sun.alt,S.sun.az,1));{const q=U.sd.value,l=Math.hypot(q.x,q.z);U.sa.value.set(l>1e-4?q.x/l:1,0,l>1e-4?q.z/l:0)}
 const L=S.limit;S.planets.forEach((p,i)=>{const v=dir(p.alt,p.az,90);pos.set([v.x,v.y,v.z],i*3);col.set(pc[p.name],i*3);sz[i]=clampN(3.6-.6*p.mag,2.5,14);alB[i]=p.alt>0?clampN((L-p.mag)+.3,0,1):0;al[i]=alB[i];pdS[i].position.copy(v)});
 S.stars.forEach((s,k)=>{const i=NP+k,v=dir(s.alt,s.az,90);pos.set([v.x,v.y,v.z],i*3);col.set([.9,.93,1],i*3);sz[i]=clampN(3.2-.55*s.mag,2,9);al[i]=s.alt>0?clampN((L-s.mag)+.3,0,1):0});
 ['position','size','alpha','color'].forEach(a=>g.attributes[a].needsUpdate=true);applyDisks(innerHeight*ren.getPixelRatio());
 const sv=S.sun.alt>-3,E=S.ecl,cor=E.rm>=E.rs?sst(.985,1,E.ob):0;sunS.position.copy(dir(S.sun.alt,S.sun.az,200.5));sunD.position.copy(dir(S.sun.alt,S.sun.az,200));corS.position.copy(dir(S.sun.alt,S.sun.az,199.5));sunS.visible=sunD.visible=sv;{const st=M.sunTint(S.sun.alt);sunS.material.color.setRGB(...st);sunD.material.color.setRGB(...st)}corS.visible=sv&&cor>0;corS.material.opacity=cor;sunS.material.opacity=Math.pow(1-E.ob,.7);moonS.position.copy(dir(S.moon.alt,S.moon.az,190));moonS.visible=S.moon.alt>-1;moonS.material.rotation=S.moon.tilt;
 const key=jd.toFixed(5)+'|'+lat.toFixed(3)+'|'+lon.toFixed(3);if(force||key!==moonKey){moonKey=key;try{OE.setObserver({lat:lat,lon:lon,jd:jd});const sk=OE.skyMoon(jd,C.sunMoon(jd).s.lon),x=mk.getContext('2d');x.clearRect(0,0,256,256);OE.drawSky(x,128,128,120,sk,null);moonS.material.map.needsUpdate=true}catch(e){}}
 text();updateObjectDescription();if(window.SkyHook&&SkyHook.onSky)SkyHook.onSky(S)}
function text(){const vis=S.planets.filter(p=>p.alt>0&&p.mag<=S.limit).map(p=>p.name+' '+p.mag.toFixed(1));
 $('card').querySelector('#live')&&($('card').querySelector('#live').textContent='Sun '+S.sun.alt.toFixed(0)+'° high, Moon '+S.moon.alt.toFixed(0)+'° high, '+Math.round(S.moon.illum*100)+'% lit. Faintest visible magnitude '+S.limit.toFixed(1)+'. Planets visible: '+(vis.join(', ')||'none')+'.'+(S.ecl.ob>0&&S.sun.alt>0?' Solar eclipse in progress: '+Math.round(S.ecl.ob*100)+'% of the Sun covered.':'')+(S.lunar.pmag>0&&S.moon.alt>0?' Lunar eclipse in progress: umbral magnitude '+S.lunar.umag.toFixed(2)+'.':''))}
// Mercury, Venus, Mars: redraw a phase texture only when its phase angle moved by 0.25 deg or more (Mercury can move 3 deg per day, so it redraws often; Venus about 1; Mars far less), only while that disc is shown.
function drawPhase(st,v){if(Math.abs(v.phase-st.phase)<.25)return;st.phase=v.phase;const x=st.k.getContext('2d'),im=x.createImageData(vnN,vnN);im.data.set(M.phaseDisk(vnN,DISK_FILL,v.phase));x.putImageData(im,0,0);st.tex.needsUpdate=true;st.draws++}
// Saturn: redraw the globe+ring picture only while it is shown and the ring tilt B moved 0.1 deg or more (B changes about 0.01 deg per day).
function drawSaturn(B){if(Math.abs(B-sat.B)<.1)return;sat.B=B;const x=sat.k.getContext('2d'),im=x.createImageData(satN,satN);im.data.set(M.saturnDisk(satN,B));x.putImageData(im,0,0);sat.tex.needsUpdate=true;sat.draws++}
function applyDisks(hb){if(!S)return;let ch=false; // hb = canvas height in device pixels (the same unit as gl_PointSize)
 S.planets.forEach((p,i)=>{const dpx=M.diskPx(p.semi,fov,hb),ext=i===SI?M.diskPx(p.semi*M.RING_OUT,fov,hb):dpx,b=M.diskBlend(ext,sz[i]),a=alB[i]*(1-b),sp=pdS[i]; // ext = size that drives the cross-fade: the globe, but for Saturn the whole ring system (diamPx stays the globe)
  dskInfo[i]={name:p.name,diamPx:dpx,blend:b,ringPx:i===SI?ext:0};
  if(al[i]!==a){al[i]=a;ch=true}
  sp.visible=b>0&&alB[i]>0;sp.material.opacity=alB[i]*b;if(sp.visible){sp.scale.setScalar(i===SI?2*DISK_R*Math.tan(p.semi*D)*M.RING_Q:2*DISK_R*Math.tan(p.semi*D)/DISK_FILL);if(i===SI){drawSaturn(p.ring.B);const P=dir(p.trueAlt,p.az,1),Q=dir(p.ring.poleAlt,p.ring.poleAz,1);sat.rot=-M.screenAngle([P.x,P.y,P.z],[Q.x,Q.y,Q.z],yaw,pitch)*D;sp.material.rotation=sat.rot}const st=phs[i];if(st){drawPhase(st,p);const P=dir(p.trueAlt,p.az,1),Q=dir(S.sun.trueAlt,S.sun.az,1);st.rot=-M.screenAngle([P.x,P.y,P.z],[Q.x,Q.y,Q.z],yaw,pitch)*D;sp.material.rotation=st.rot}}}); // texture lit side is UP; sprite rotation is counter-clockwise, screen angle is clockwise from up
 if(ch)g.attributes.alpha.needsUpdate=true}
let vW=0,vH=0,vP=0; // last applied size; a height-only change (phone URL bar hiding, rotation) used to be missed because only the width was compared
function frame(){const w=innerWidth,h=innerHeight,targetPR=pixelRatioForMode();if(ren.getPixelRatio()!==targetPR)ren.setPixelRatio(targetPR);const pr=ren.getPixelRatio();if(w!==vW||h!==vH||pr!==vP){vW=w;vH=h;vP=pr;ren.setSize(w,h,false);cam.aspect=w/h}
 cam.fov=fov;cam.updateProjectionMatrix();cam.rotation.set(pitch*D,-yaw*D,0,'YXZ');cam.rotation.y=-yaw*D;
 const px=2*Math.tan(fov*D/2)/h,ms=(a,r,mp)=>{return Math.max(2*r*Math.tan(a*D/2),r*px*mp)};if(S){const sd=2*S.sun.semi,md=2*S.moon.semi;sunD.scale.setScalar(ms(sd,200,16)*64/60);sunS.scale.setScalar(ms(sd*6,200.5,70));corS.scale.setScalar(ms(sd*8,199.5,128));moonS.scale.setScalar(ms(md,190,14)*1.0667)}
 applyDisks(h*ren.getPixelRatio());if(window.SkyHook&&SkyHook.tick)SkyHook.tick();skyG.position.copy(cam.position);ren.render(scene,cam);requestAnimationFrame(frame)}
function lookAt(a,z){yaw=z;pitch=clampN(a,-35,85)}
// input
let inv=1;try{if(localStorage.getItem('orrerySky.flip')==='1')inv=-1}catch(e){} // inv=1: drag right looks right, drag up looks up (mouse-look); the Flip look button reverses drag and arrow keys
// camera input (touch look, pinch zoom, fling, wheel, keys) lives in camera-input.js (Phase 4C-2)
const camIn=window.CamInput?CamInput.attach(cv,{get:()=>({yaw,pitch,fov}),set:(y,p,f)=>{yaw=y;pitch=p;fov=f},inv:()=>inv,height:()=>innerHeight,lim:{minFov:.2,maxFov:120,minPitch:-35,maxPitch:85}}):null;
if(window.CamInput&&CamInput.guardPage)CamInput.guardPage(document,'#card');
function setPlace(a,b){if(!isFinite(a)||!isFinite(b)||Math.abs(a)>90||Math.abs(b)>180){return false}lat=a;lon=b;$('la').value=a;$('lo').value=b;try{localStorage.setItem('orrerySky.place',JSON.stringify({lat:a,lon:b}))}catch(e){}return true}
function setTime(j){jd=clampN(j,C.dateToJD(new Date(Date.UTC(1900,0,1))),C.dateToJD(new Date(Date.UTC(2100,11,31))));$('dt').value=fmt(jd);update()}
$('go').onclick=()=>{if(setPlace(parseFloat($('la').value),parseFloat($('lo').value))){const dv=$('dt').value,d=Date.parse(dv+(dv.length>16?'':':00')+'Z');if(isFinite(d))setTime(d/864e5+2440587.5);else update()}};
const pf=()=>{const b=$('flip');if(b.setAttribute)b.setAttribute('aria-pressed',inv<0?'true':'false')};pf();$('flip').onclick=()=>{inv=-inv;pf();try{localStorage.setItem('orrerySky.flip',inv<0?'1':'0')}catch(e){}};
$('now').onclick=()=>{setTime(Date.now()/864e5+2440587.5)};
document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>setTime(jd+parseFloat(b.dataset.d)));
document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const o=S[b.dataset.l];selectObject(b.dataset.l);lookAt(o.alt,o.az)});
// Orrery link: v, t, lat, lon, name, ev, look, fov, back. Unknown params ignored, invalid ones fall back to defaults.
const EV=['solar','lunar','phase','conj','opp','elong','solarconj','season','free'],ev=EV.includes(q.get('ev'))?q.get('ev'):null,hasPlace=q.has('lat')&&q.has('lon')&&setPlace(parseFloat(q.get('lat')),parseFloat(q.get('lon')));
if(!hasPlace)setPlace(lat,lon);
let t0=Date.parse(q.get('t')||'');t0=isFinite(t0)?t0/864e5+2440587.5:Date.now()/864e5+2440587.5;
if(ev==='free'&&q.has('t')){t0=Math.floor(t0+.5+1e-6)-.5+(21-lon/15)/24}
const fv=parseFloat(q.get('fov'));if(isFinite(fv))fov=clampN(fv,.2,120);else if(ev==='solar'||ev==='lunar')fov=8; // eclipses open zoomed in
const keys=(q.get('look')||'').toLowerCase().split(',').filter(Boolean),back=q.get('back');selectedObject=keys.find(k=>k==='sun'||k==='moon'||PN.includes(k))||'';
function find(k,s){return k==='sun'?s.sun:k==='moon'?s.moon:s.planets.find(p=>p.name===k)||null}
function html(a){card.innerHTML=a+'<div id="live"></div>'+(card.dataset.tex?'<div class="warn">'+card.dataset.tex+'</div>':'')+(back&&/^https?:\/\//.test(back)?'<div><a id="back" href="'+encodeURI(back)+'">← Back to Orrery</a></div>':'')}
const tzName=q.get('tz');let tzOk=null;try{if(tzName&&/^[A-Za-z0-9_\/+\-]{1,40}$/.test(tzName)){new Intl.DateTimeFormat('en-GB',{timeZone:tzName});tzOk=tzName}}catch(e){}
const rsec=j=>new Date(Math.round(C.jdToDate(j).getTime()/1000)*1000),hms=j=>rsec(j).toISOString().slice(11,19),
 loc=j=>tzOk?new Intl.DateTimeFormat('en-GB',{timeZone:tzOk,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(rsec(j)):'',
 dur=sc=>Math.floor(sc/60)+' min '+Math.round(sc%60)+' s',
 crow=(label,p)=>p?'<tr><td><button data-j="'+p.jd.toFixed(7)+'">'+label+'</button></td><td>'+hms(p.jd)+' UTC</td>'+(tzOk?'<td>'+loc(p.jd)+' local</td>':'')+'<td>'+(p.alt>0?p.alt.toFixed(0)+'° high':'<span class="warn">below horizon</span>')+'</td></tr>':'';
function solarInfo(Lc,e,o){
 if(!Lc.eclipse)return '<br><span class="warn">No part of this eclipse reaches this place (closest Sun–Moon separation '+Lc.nearest.sep.toFixed(2)+'°).'+(o.alt<=0?' The Sun is below the horizon here at that time.':'')+' Try the greatest-eclipse point (lat '+e.lat.toFixed(2)+', lon '+e.lon.toFixed(2)+') or another place.</span>';
 if(!Lc.anyVisible)return '<br><span class="warn">The Sun is below the horizon here for the whole eclipse, so it cannot be seen from this place. Try the greatest-eclipse point (lat '+e.lat.toFixed(2)+', lon '+e.lon.toFixed(2)+') or another place.</span>';
 const ty={total:'total',annular:'annular',partial:'partial'}[Lc.type];
 return '<br>From here: <b>'+ty+'</b> eclipse, magnitude '+Lc.mag.toFixed(3)+', '+(Lc.ob*100).toFixed(1)+'% of the Sun’s area covered at maximum.'+(Lc.durSec?' '+(Lc.type==='total'?'Totality':'Annularity')+' lasts '+dur(Lc.durSec)+'.':'')+
  '<table>'+crow('Partial begins (C1)',Lc.c1)+(Lc.c2?crow(Lc.type==='total'?'Totality begins (C2)':'Annular begins (C2)',Lc.c2):'')+crow('Maximum',Lc.max)+(Lc.c3?crow(Lc.type==='total'?'Totality ends (C3)':'Annular ends (C3)',Lc.c3):'')+crow('Partial ends (C4)',Lc.c4)+'</table>'+
  '<small>Times come from Sky’s own Sun and Moon formulas. In tests they differ from JPL DE421 by about 10–60 s, so this is not an official table. The corona is illustrative.</small>'}
function lunarInfo(Lc,o){
 if(!Lc.eclipse)return '';
 return '<br>From the Earth’s shadow: <b>'+Lc.type+'</b> lunar eclipse, umbral magnitude '+Lc.umag.toFixed(3)+(Lc.durSec?', totality lasts '+dur(Lc.durSec):'')+'. The Moon’s altitude below is for this place.'+
  '<table>'+crow('Penumbral begins (P1)',Lc.p1)+crow('Partial begins (U1)',Lc.u1)+crow('Totality begins (U2)',Lc.u2)+crow('Maximum',Lc.max)+crow('Totality ends (U3)',Lc.u3)+crow('Partial ends (U4)',Lc.u4)+crow('Penumbral ends (P4)',Lc.p4)+'</table>'+
  (Lc.anyVisible?'':'<span class="warn">The Moon is below the horizon for the whole eclipse here, so it cannot be seen from this place. Try another place.</span><br>')+
  '<small>Contact times come from Sky’s own Sun and Moon formulas (about 10–70 s from JPL DE421 in tests). The shadow colour is illustrative.</small>'}
card.addEventListener('click',ev2=>{const b=ev2.target&&ev2.target.closest?ev2.target.closest('button[data-j]'):null;if(!b)return;setTime(parseFloat(b.dataset.j));const o=ev==='lunar'?S.moon:S.sun;lookAt(o.alt,o.az)});
function preset(){const nm=q.get('name')?' · '+q.get('name').slice(0,40):'';let s0=M.sky(t0,lat,lon),tg=keys.map(k=>find(k,s0)).filter(Boolean),pickFn=null,info='<b>'+({free:'Free sky',season:'Equinox or solstice',phase:'Moon phase',solarconj:'Planet near the Sun',opp:'Opposition',elong:'Greatest elongation',conj:'Conjunction',solar:'Solar eclipse',lunar:'Lunar eclipse'}[ev]||'Sky')+'</b>'+nm+' · '+fmt(t0)+' UTC';
 const warn=(ev==='solar'?'<div class="warn">Never look at the Sun without proper solar filters, except during totality.</div>':'');
 if(ev==='solar'||ev==='lunar'){const e=C.eclipsesBetween(t0-1,t0+1,{solar:ev==='solar',lunar:ev==='lunar'})[0];if(e){let Lc,jv=e.jd;
  if(ev==='solar'){Lc=EL.solarLocal(e.jd,lat,lon);if(Lc.eclipse&&Lc.anyVisible)jv=Lc.max.visible?Lc.max.jd:Lc.c1.visible?Lc.c1.jd:Lc.c4.jd}
  else{Lc=EL.lunarLocal(e.jd,lat,lon);if(Lc.eclipse&&Lc.anyVisible){const pv=[Lc.max,Lc.u2,Lc.u3,Lc.u1,Lc.u4,Lc.p1,Lc.p4].filter(Boolean).filter(p=>p.visible);if(pv.length)jv=pv[0].jd}}
  t0=jv;s0=M.sky(t0,lat,lon);const o=ev==='solar'?s0.sun:s0.moon;lookAt(o.alt,o.az);
  info+='<br>'+e.type+' eclipse, greatest eclipse '+fmt(e.jd)+' UTC (global magnitude '+(+e.mag).toFixed(3)+').'+(ev==='solar'?solarInfo(Lc,e,o):lunarInfo(Lc,o))
  }else info+='<br>No eclipse found within a day of this time.'} else if(ev==='solarconj'&&tg.length){lookAt(tg[0].alt,tg[0].az);info+='<br>'+keys[0]+' is lost in the Sun’s glare: separation '+M.sepDeg(tg[0],s0.sun).toFixed(1)+'°. It cannot be seen.'}
 else if(ev==='season'){lookAt(s0.sun.alt,s0.sun.az);info+='<br>Sun '+s0.sun.alt.toFixed(0)+'° high.'}
 else if(ev==='free'||!ev){lookAt(20,s0.sun.alt>0?s0.sun.az:180)}
 else{ // phase, opp, elong, conj: nearest time when the target(s) can be seen from this place
  const pick=k=>{const o=keys.length?keys.map(x=>find(x,k)).filter(Boolean):[k.moon];return o.length&&o.every(b=>b.alt>0&&(b.mag<=k.limit||b===k.moon&&k.sun.alt<-1))?o[0]:null};
  const r=M.nearestVisible(t0,lat,lon,pick);
  if(r){t0=r.jd;s0=M.sky(t0,lat,lon);tg=(keys.length?keys:['moon']).map(x=>find(x,s0)).filter(Boolean);const a=tg.reduce((u,b)=>u+b.alt,0)/tg.length,z=tg.length>1?Math.atan2(tg.reduce((u,b)=>u+Math.sin(b.az*D),0),tg.reduce((u,b)=>u+Math.cos(b.az*D),0))/D:tg[0].az;lookAt(a,(z+360)%360);
   info+=(Math.abs(r.hours)>.05?'<br>Not visible at the event time here. Showing the nearest visible time, '+r.hours.toFixed(1)+' h away.':'<br>Visible from here at this time.');}
  else info+='<br><span class="warn">Not visible from this place within 36 h. Try another place or date.</span>';
  if(ev==='conj'&&tg.length>1)info+='<br>Separation from Sky’s own positions: '+M.sepDeg(tg[0],tg[1]).toFixed(2)+'°. Orrery’s time for Jupiter to Neptune is only good to about half a day.';
  if(ev==='phase')info+='<br>'+Math.round(s0.moon.illum*100)+'% lit.'}
 html(info+warn);setTime(t0)}
addEventListener('resize',()=>{});const phaseInfo=i=>({phase:phs[i].phase,draws:phs[i].draws,rotation:phs[i].rot,illum:S?S.planets[i].illum:null});window.SkyHook={THREE,scene,cam,ren,skyG,U,redraw:()=>update(true),disks:()=>dskInfo.map((d,i)=>Object.assign({},d,{visible:pdS[i].visible,opacity:pdS[i].material.opacity,scale:pdS[i].scale.x,rotation:pdS[i].material.rotation||0,shaded:pdS[i].material.map!==pdTex&&i!==SI,ringed:i===SI,pointAlpha:al[i],baseAlpha:alB[i]})),get fov(){return fov},set fov(v){fov=clampN(v,.2,120)},get S(){return S},skyMode:()=>activeSkyMode,selectObject,description:()=>$('sky-object-current').textContent,setTime,venus:()=>phaseInfo(VI),mercury:()=>phaseInfo(PN.indexOf('mercury')),mars:()=>phaseInfo(PN.indexOf('mars')),saturn:()=>({B:sat.B,draws:sat.draws,rotation:sat.rot,ringB:S?S.planets[SI].ring.B:null}),input:camIn,view:()=>({w:vW,h:vH,pr:vP}),get yaw(){return yaw},set yaw(v){yaw=(v+360)%360},get pitch(){return pitch},set pitch(v){pitch=clampN(v,-35,85)}};
html('');preset();requestAnimationFrame(frame);
})();
