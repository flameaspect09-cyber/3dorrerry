/* Orrery Sky Phase 3 - local eclipse circumstances (pure maths, Node-testable). Needs SkyMath (topo, lunarShadow) and EventFinderCore.
   Solar: topocentric Sun-Moon separation, contacts C1-C4, maximum, magnitude, obscuration, Sun altitude at each contact.
   Lunar: geocentric contacts P1 U1 U2 max U3 U4 P4 (the same instants for everyone) plus the Moon altitude at each, for the chosen place.
   Accuracy is limited by the Meeus-type Sun/Moon in EventFinderCore (about 0.005 deg Moon = ~10 s of time) and Delta T; see tests/eclipse.test.js for measured differences. */
(function(root){'use strict';
const SM=root.SkyMath||require('./sky-math.js'),C=root.EventFinderCore||require('./engine/event-finder-core.js');
const bis=(f,a,b)=>{let fa=f(a);for(let i=0;i<50;i++){const c=(a+b)/2,fc=f(c);if((fc<0)===(fa<0)){a=c;fa=fc}else b=c}return(a+b)/2};
function gmin(f,a,b){const g=(Math.sqrt(5)-1)/2;let c=b-g*(b-a),d=a+g*(b-a),fc=f(c),fd=f(d);while(b-a>1e-8){if(fc<fd){b=d;d=c;fd=fc;c=b-g*(b-a);fc=f(c)}else{a=c;c=d;fc=fd;d=a+g*(b-a);fd=f(d)}}return(a+b)/2}
function scanMin(f,j0,half,step){let best=j0,bv=Infinity;for(let j=j0-half;j<=j0+half;j+=step){const v=f(j);if(v<bv){bv=v;best=j}}return gmin(f,best-step,best+step)}
function pt(jd,lat,lon){const t=SM.topo(jd,lat,lon),alt=t.sun.alt+SM.refr(t.sun.alt);return{jd,alt,az:t.sun.az,visible:alt>0}}
// jd0: approximate time of the eclipse (the engine's greatest-eclipse time is fine; +/-0.25 day is searched).
function solarLocal(jd0,lat,lon){
 const sep=j=>SM.topo(j,lat,lon).sep,tm=scanMin(sep,jd0,.25,3/1440),T=SM.topo(tm,lat,lon);
 if(T.sep>=T.rs+T.rm)return{eclipse:false,nearest:{jd:tm,sep:T.sep,rs:T.rs,rm:T.rm}};
 const outer=j=>{const t=SM.topo(j,lat,lon);return t.sep-(t.rs+t.rm)},inner=j=>{const t=SM.topo(j,lat,lon);return t.sep-Math.abs(t.rs-t.rm)};
 const r={eclipse:true,jd0,max:pt(tm,lat,lon),mag:T.mag,ob:T.ob,sepMax:T.sep,sunSemi:T.rs,moonSemi:T.rm,type:'partial'};
 r.max.mag=T.mag;r.max.ob=T.ob;
 r.c1=pt(bis(outer,tm-.25,tm),lat,lon);r.c4=pt(bis(outer,tm,tm+.25),lat,lon);
 if(T.sep<Math.abs(T.rs-T.rm)){r.type=T.rm>T.rs?'total':'annular';r.c2=pt(bis(inner,tm-.1,tm),lat,lon);r.c3=pt(bis(inner,tm,tm+.1),lat,lon);r.durSec=(r.c3.jd-r.c2.jd)*86400}
 // anything visible at all? (Sun above the apparent horizon at some moment between C1 and C4)
 r.anyVisible=false;for(let k=0;k<=40;k++){if(pt(r.c1.jd+(r.c4.jd-r.c1.jd)*k/40,lat,lon).visible){r.anyVisible=true;break}}
 r.maxVisible=r.max.visible;return r}
function lunarLocal(jd0,lat,lon){
 const sepf=j=>SM.lunarShadow(j).sep,tm=scanMin(sepf,jd0,.3,3/1440),L=SM.lunarShadow(tm);
 if(L.sep>=L.pen+L.sM)return{eclipse:false};
 const g=(kind)=>j=>{const l=SM.lunarShadow(j);return l.sep-(kind==='pen'?l.pen+l.sM:kind==='umb'?l.umbra+l.sM:l.umbra-l.sM)};
 const mp=j=>{const t=SM.topo(j,lat,lon),alt=t.moon.alt+SM.refr(t.moon.alt);return{jd:j,alt,az:t.moon.az,visible:alt>0}};
 const r={eclipse:true,jd0,umag:L.umag,pmag:L.pmag,type:L.umag>=1?'total':L.umag>0?'partial':'penumbral',max:mp(tm)};
 r.max.umag=L.umag;
 r.p1=mp(bis(g('pen'),tm-.25,tm));r.p4=mp(bis(g('pen'),tm,tm+.25));
 if(L.sep<L.umbra+L.sM){r.u1=mp(bis(g('umb'),tm-.25,tm));r.u4=mp(bis(g('umb'),tm,tm+.25))}
 if(L.sep<L.umbra-L.sM){r.u2=mp(bis(g('tot'),tm-.25,tm));r.u3=mp(bis(g('tot'),tm,tm+.25));r.durSec=(r.u3.jd-r.u2.jd)*86400}
 r.anyVisible=false;for(let k=0;k<=40;k++){if(mp(r.p1.jd+(r.p4.jd-r.p1.jd)*k/40).visible){r.anyVisible=true;break}}
 r.maxVisible=r.max.visible;return r}
const api={solarLocal,lunarLocal};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.EclipseLocal=api;
})(typeof window!=='undefined'?window:globalThis);
