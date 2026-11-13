/* Orrery Sky Phase 1 - sky maths (pure, Node-testable). Needs OrreryAstro + EventFinderCore. */
(function(root){'use strict';
const C=root.EventFinderCore||require('./engine/event-finder-core.js'),A=root.OrreryAstro||require('./engine/orrery-astro.js');
const D=Math.PI/180,R=180/Math.PI,RE=6378.137;
const nd=x=>((x%360)+360)%360;
// BRIGHT STARS: 17 only, J2000 RA(h m s) Dec(d m s) V, typed from memory, NOT a catalogue. Replace with BSC5/HYG.
const S=[['Sirius',6,45,9,-16,42,58,-1.46],['Canopus',6,23,57,-52,41,45,-0.74],['Arcturus',14,15,40,19,10,57,-0.05],['Vega',18,36,56,38,47,1,0.03],['Capella',5,16,41,45,59,53,0.08],['Rigel',5,14,32,-8,12,6,0.13],['Procyon',7,39,18,5,13,30,0.34],['Betelgeuse',5,55,10,7,24,25,0.5],['Altair',19,50,47,8,52,6,0.76],['Aldebaran',4,35,55,16,30,33,0.85],['Antares',16,29,24,-26,25,55,1.06],['Spica',13,25,12,-11,9,41,0.97],['Pollux',7,45,19,28,1,34,1.14],['Fomalhaut',22,57,39,-29,37,20,1.16],['Deneb',20,41,26,45,16,49,1.25],['Regulus',10,8,22,11,58,2,1.35],['Polaris',2,31,49,89,15,51,1.98]]
 .map(s=>({name:s[0],ra:(s[1]+s[2]/60+s[3]/3600)*15,dec:(s[4]<0?-1:1)*(Math.abs(s[4])+s[5]/60+s[6]/3600),mag:s[7]}));
const eps=T=>(23.43929111-.0130042*T)*D;
function toHor(lonE,latE,jd,lat,lon){ // ecliptic-of-date lon/lat (deg) -> alt/az (deg, true, no refraction)
 const T=(jd-2451545)/36525,e=eps(T),l=lonE*D,b=latE*D;
 const x=Math.cos(b)*Math.cos(l),y=Math.cos(b)*Math.sin(l)*Math.cos(e)-Math.sin(b)*Math.sin(e),z=Math.cos(b)*Math.sin(l)*Math.sin(e)+Math.sin(b)*Math.cos(e);
 const ra=Math.atan2(y,x),dec=Math.asin(z),g=nd(280.46061837+360.98564736629*(jd-2451545)+.000387933*T*T),ha=(g+lon)*D-ra,la=lat*D;
 const alt=Math.asin(Math.sin(dec)*Math.sin(la)+Math.cos(dec)*Math.cos(la)*Math.cos(ha));
 const az=Math.atan2(-Math.cos(dec)*Math.sin(ha),Math.sin(dec)*Math.cos(la)-Math.cos(dec)*Math.sin(la)*Math.cos(ha));
 return{alt:alt*R,az:nd(az*R)}}
const prec=(lon,lat,T)=>[lon+1.396971*T+.0003086*T*T,lat]; // precession in longitude: planets and stars ONLY, never Sun/Moon
function eclFromEq(ra,dec){const e=eps(0),a=ra*D,d=dec*D,x=Math.cos(d)*Math.cos(a),y=Math.cos(d)*Math.sin(a),z=Math.sin(d);
 return[nd(Math.atan2(y*Math.cos(e)+z*Math.sin(e),x)*R),Math.asin(-y*Math.sin(e)+z*Math.cos(e))*R]}
const refr=h=>h<-1?0:(1.02/Math.tan((h+10.3/(h+5.11))*D))/60; // Bennett refraction, deg
// Older Astronomical Almanac visual magnitudes (NOT Mallama-Hilton; Saturn rings ignored). i = phase angle deg.
const H={mercury:[-.42,.038,-.000273,2e-6],venus:[-4.4,.0009,.000239,-6.5e-7],mars:[-1.52,.016,0,0],jupiter:[-9.4,.005,0,0],saturn:[-8.88,0,0,0],uranus:[-7.19,0,0,0],neptune:[-6.87,0,0,0]};
function limitMag(sunAlt,moonAlt,illum,city){ // faintest visible magnitude. PROPOSED values, to tune on a real device
 const k=[[0,-4.5],[-6,0],[-12,3],[-18,6.5]];let m=sunAlt>=0?-4.5:6.5;
 for(let i=0;i<3;i++)if(sunAlt<=k[i][0]&&sunAlt>k[i+1][0]){const f=(k[i][0]-sunAlt)/(k[i][0]-k[i+1][0]);m=k[i][1]+f*(k[i+1][1]-k[i][1])}
 if(moonAlt>0&&sunAlt<-6)m-=2*illum*Math.sin(moonAlt*D);return m-(city||0)}
function sepDeg(a,b){const x=Math.sin(a.alt*D)*Math.sin(b.alt*D)+Math.cos(a.alt*D)*Math.cos(b.alt*D)*Math.cos((a.az-b.az)*D);return Math.acos(Math.max(-1,Math.min(1,x)))*R}
// ---- Phase 3: topocentric Sun and Moon (full parallax in altitude AND azimuth), eclipse geometry ----
const R_SUN=695700,R_MOON=1737.4,FL=1/298.257223563;
const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
function obsVec(jd,lat,lon){ // observer, ecliptic-of-date axes, Earth radii (oblate Earth; same convention as the OrreryEclipse adapter)
 const T=(jd-2451545)/36525,th=(280.46061837+360.98564736629*(jd-2451545)+.000387933*T*T+lon)*D,
  dec=Math.atan(Math.pow(1-FL,2)*Math.tan(lat*D)),cd=Math.cos(dec),eq=[cd*Math.cos(th),cd*Math.sin(th),Math.sin(dec)],
  e=eps(T),ce=Math.cos(e),se=Math.sin(e),k=1-FL*Math.pow(Math.sin(lat*D),2);
 return[eq[0]*k,(eq[1]*ce+eq[2]*se)*k,(-eq[1]*se+eq[2]*ce)*k]}
function overlap(R1,R2,d){ // area of the intersection of two circles / (pi R1^2)
 if(d>=R1+R2)return 0;if(d<=Math.abs(R1-R2))return R2>=R1?1:(R2*R2)/(R1*R1);
 const a=R1*R1*Math.acos((d*d+R1*R1-R2*R2)/(2*d*R1))+R2*R2*Math.acos((d*d+R2*R2-R1*R1)/(2*d*R2))-.5*Math.sqrt((-d+R1+R2)*(d+R1-R2)*(d-R1+R2)*(d+R1+R2));
 return a/(Math.PI*R1*R1)}
const lonlat=v=>{const d=Math.hypot(v[0],v[1],v[2]);return{lon:nd(Math.atan2(v[1],v[0])*R),lat:Math.asin(v[2]/d)*R,dist:d}};
function topo(jd,lat,lon){ // topocentric Sun and Moon (true altitude/azimuth, no refraction), apparent radii, separation, obscuration
 const o=C.sunMoon(jd),ov=obsVec(jd,lat,lon).map(x=>x*RE),m=[o.M[0]-ov[0],o.M[1]-ov[1],o.M[2]-ov[2]],s=[o.S[0]-ov[0],o.S[1]-ov[1],o.S[2]-ov[2]];
 const ml=lonlat(m),sl=lonlat(s),mh=toHor(ml.lon,ml.lat,jd,lat,lon),sh=toHor(sl.lon,sl.lat,jd,lat,lon);
 const cs=(m[0]*s[0]+m[1]*s[1]+m[2]*s[2])/(ml.dist*sl.dist),sep=Math.acos(Math.max(-1,Math.min(1,cs))),rs=Math.asin(R_SUN/sl.dist),rm=Math.asin(R_MOON/ml.dist);
 const ob=sep<rs+rm?(sep<=Math.abs(rs-rm)?(rm>=rs?1:rm*rm/(rs*rs)):overlap(1,rm/rs,sep/rs)):0,mag=Math.max(0,(rs+rm-sep)/(2*rs));
 return{o,sun:{lon:sl.lon,lat:sl.lat,dist:sl.dist,alt:sh.alt,az:sh.az,semi:rs*R},moon:{lon:ml.lon,lat:ml.lat,dist:ml.dist,alt:mh.alt,az:mh.az,semi:rm*R},sep:sep*R,rs:rs*R,rm:rm*R,ob,mag}}
// geocentric lunar-eclipse geometry (identical for every observer): Moon centre vs the Earth's shadow axis. Shadow radii use the 1.0118 enlargement of the OrreryEclipse adapter.
function lunarShadow(jd){const o=C.sunMoon(jd),S=o.S,M=o.M,dS=Math.hypot(S[0],S[1],S[2]),dM=Math.hypot(M[0],M[1],M[2]),
 c=-(S[0]*M[0]+S[1]*M[1]+S[2]*M[2])/(dS*dM),sep=Math.acos(Math.max(-1,Math.min(1,c))),piM=Math.asin(RE/dM),piS=Math.asin(RE/dS),sS=Math.asin(R_SUN/dS),sM=Math.asin(R_MOON/dM),
 umbra=1.0118*(piM+piS-sS),pen=1.0118*(piM+piS+sS);
 return{sep:sep*R,umbra:umbra*R,pen:pen*R,sM:sM*R,umag:(umbra+sM-sep)/(2*sM),pmag:(pen+sM-sep)/(2*sM)}}
// rotation (radians, counter-clockwise on screen) that turns a picture with ecliptic north up so that it sits right in the horizon frame (parallactic tilt)
function moonTilt(lonE,latE,jd,lat,lon){const a=toHor(lonE,latE,jd,lat,lon),b=toHor(lonE,latE+.2,jd,lat,lon);
 let da=b.az-a.az;da=((da+540)%360)-180;const x=da*Math.cos(a.alt*D),y=b.alt-a.alt;return-Math.atan2(x,y)}
function sky(jd,lat,lon,opt){opt=opt||{};const T=(jd-2451545)/36525,tp=topo(jd,lat,lon),o=tp.o;
 const sun=tp.sun,mo=tp.moon;sun.mag=-26.7;
 const el=Math.acos(Math.cos((o.m.lon-o.s.lon)*D)*Math.cos(o.m.lat*D))*R;mo.illum=(1-Math.cos(el*D))/2;mo.waxing=Math.sin((o.m.lon-o.s.lon)*D)>=0;mo.mag=-12.7+1.2*(180-el)/90;
 // eclipse effects: sky darkening for a solar eclipse, Moon dimming for a lunar eclipse (illustrative curves, tuned by eye, not measured)
 const ecl={sep:tp.sep,ob:tp.ob,mag:tp.mag,rs:tp.rs,rm:tp.rm},p=sstep(.75,1,tp.ob);
 const lu=lunarShadow(jd),um=Math.max(0,Math.min(1,lu.umag)),pm=Math.max(0,Math.min(1,lu.pmag)),f=lu.pmag>0?Math.max(3e-4,1-um)*(1-.25*pm):1;   // brightness factor: partial umbra removes that fraction of the lit area; inside totality about 8-9 magnitudes dimmer (real range is roughly 8-12, depends on the shadow's darkness)

 const trueAlt=sun.alt;sun.trueAlt=trueAlt;sun.eff=trueAlt>-4?trueAlt+(-4-trueAlt)*p:trueAlt; // effective Sun altitude: totality looks like deep civil twilight
 if(f<1)mo.mag+=-2.5*Math.log10(f);
 mo.tilt=moonTilt(mo.lon,mo.lat,jd,lat,lon);
 sun.alt+=refr(sun.alt);mo.alt+=refr(mo.alt);
 const E=A.heliocentric('earth',jd),pl=[];
 for(const n of ['mercury','venus','mars','jupiter','saturn','uranus','neptune']){const P=A.heliocentric(n,jd),g=[P.x-E.x,P.y-E.y,P.z-E.z],d=Math.hypot(g[0],g[1],g[2]),r=Math.hypot(P.x,P.y,P.z),e2=E.x*E.x+E.y*E.y+E.z*E.z;
  const lo=nd(Math.atan2(g[1],g[0])*R),la=Math.asin(g[2]/d)*R,pp=prec(lo,la,T),h=toHor(pp[0],pp[1],jd,lat,lon),
  i=Math.acos(Math.max(-1,Math.min(1,(r*r+d*d-e2)/(2*r*d))))*R,c=H[n];
  h.name=n;h.trueAlt=h.alt;h.phase=i;h.illum=(1+Math.cos(i*D))/2;h.mag=c[0]+5*Math.log10(r*d)+c[1]*i+c[2]*i*i+c[3]*i*i*i;h.alt+=refr(h.alt);h.dist=d;h.semi=Math.asin(Math.min(1,PLANET_KM[n]/(d*AU_KM)))*R;if(n==='saturn')h.ring=ringGeom(g,d,T,jd,lat,lon);pl.push(h)}
 const st=S.map(s=>{const q=eclFromEq(s.ra,s.dec),pp=prec(q[0],q[1],T),h=toHor(pp[0],pp[1],jd,lat,lon);h.name=s.name;
  const am=h.alt>1?1/Math.sin(h.alt*D):40;h.mag=s.mag+.2*(am-1);h.alt+=refr(h.alt);return h}); // extinction 0.2 mag/airmass (proposed)
 for(const q of pl)q.sep=sepDeg(q,sun);
 return{jd,lat,lon,sun,moon:mo,planets:pl,stars:st,ecl,lunar:{umag:lu.umag,pmag:lu.pmag,f},limit:limitMag(sun.eff,mo.alt,mo.illum*f,opt.city||0)}}
// nearest time within +/-36 h (10 min steps) when pick(sky) is above the horizon and bright enough; null if none
function nearestVisible(jd,lat,lon,pick){for(let k=0;k<=216;k++)for(const s of k?[-1,1]:[1]){const j=jd+s*k/144,sk=sky(j,lat,lon),b=pick(sk);
 if(b&&b.alt>0&&(b.mag<=sk.limit||b===sk.sun||(b===sk.moon&&sk.sun.alt<-1)))return{jd:j,hours:(j-jd)*24}}return null}
// Planet disks (Phase 4A-1). Equatorial radii in km (IAU; Saturn = globe only, rings NOT included), AU in km. h.dist is in AU (same d used for the magnitude).
const AU_KM=149597870.7,PLANET_KM={mercury:2439.7,venus:6051.8,mars:3396.2,jupiter:71492,saturn:60268,uranus:25559,neptune:24764};
// diameter on screen in pixels for a body of angular semi-diameter semiDeg, camera vertical field of view fovDeg, canvas height hPx (centre of view; edges stretch a little)
const diskPx=(semiDeg,fovDeg,hPx)=>hPx*Math.tan(semiDeg*Math.PI/180)/Math.tan(fovDeg*Math.PI/360);
// 0 = draw the point, 1 = draw the disk. Starts when the disk is 0.6x the point's size, complete at 1.2x. (PROPOSED thresholds, to tune on a real device.)
const diskBlend=(diamPx,pointPx)=>{const t=Math.min(1,Math.max(0,(diamPx-.6*pointPx)/(.6*pointPx)));return t*t*(3-2*t)};
// Venus phase shading (Phase 4A-2). Pure maths, no DOM. h.phase (deg) is the Sun-planet-Earth angle i; h.illum = (1+cos i)/2 is the lit fraction of the disc.
// limbAngle: direction from a planet to the Sun as an angle (deg) clockwise from local zenith-up, from true alt/az. The bright limb points that way (Meeus ch.48, in the horizon frame).
function limbAngle(alt,az,sAlt,sAz){const a=alt*D,s=sAlt*D,dz=(sAz-az)*D;return Math.atan2(Math.sin(dz)*Math.cos(s),Math.cos(a)*Math.sin(s)-Math.sin(a)*Math.cos(s)*Math.cos(dz))*R}
// world (east=+x, up=+y, north=-z, same as sky.js dir()) -> camera axes for the viewer's camera (yaw clockwise from north, pitch up; Euler order YXZ, no roll). Camera looks down -z.
function toCam(v,yaw,pitch){const a=yaw*D,b=pitch*D,x1=v[0]*Math.cos(a)+v[2]*Math.sin(a),z1=-v[0]*Math.sin(a)+v[2]*Math.cos(a);
 return[x1,v[1]*Math.cos(b)+z1*Math.sin(b),-v[1]*Math.sin(b)+z1*Math.cos(b)]}
// Where the direction P->Q (unit world vectors, Q = the Sun) points ON THE SCREEN: degrees clockwise from screen-up, 0 if P is behind the camera. Uses the real perspective projection, so it
// includes the convergence of vertical lines off the view centre (a sprite turned by the zenith angle alone would be a few degrees off at 5-10 deg fields near the edge).
function screenAngle(P,Q,yaw,pitch){const d=P[0]*Q[0]+P[1]*Q[1]+P[2]*Q[2];let t=[Q[0]-d*P[0],Q[1]-d*P[1],Q[2]-d*P[2]];const n=Math.hypot(t[0],t[1],t[2]);if(n<1e-12)return 0;
 const e=1e-3,P2=[P[0]+e*t[0]/n,P[1]+e*t[1]/n,P[2]+e*t[2]/n],a=toCam(P,yaw,pitch),b=toCam(P2,yaw,pitch);if(a[2]>=-1e-9||b[2]>=-1e-9)return 0;
 return Math.atan2(b[0]/-b[2]-a[0]/-a[2],b[1]/-b[2]-a[1]/-a[2])*R}
// RGBA pixels (N x N, canvas row order, top row first) of a lit sphere seen at phase angle iDeg with the Sun toward the TOP of the picture: the lit side is up, cusps left and right.
// Sphere radius = fill*N/2 (fill 0.94 = the true limb, as in the flat planet disc); the last 6% is the same soft rim as the flat disc. Shading is illustrative (tuned by eye, unverified on a real screen):
// a soft terminator centred exactly on the geometric terminator, and a mild fall-off toward it. The unlit side is fully transparent (no earthshine, no ashen light).
function phaseDisk(N,fill,iDeg){const out=new Uint8ClampedArray(N*N*4),si=Math.sin(iDeg*D),ci=Math.cos(iDeg*D),h=N/2;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i+.5-h)/h,y=-(j+.5-h)/h,r=Math.hypot(x,y);if(r>=1)continue;
  const edge=r<=fill?1:(1-r)/(1-fill);let u=x/fill,w=y/fill;const q=Math.hypot(u,w);if(q>.995){u*=.995/q;w*=.995/q} // rim and soft rim use the normal at 0.995 of the radius (z about 0.1), so a new Venus (phase 180) gets no bright ring
  const z=Math.sqrt(Math.max(0,1-u*u-w*w)),ns=w*si+z*ci,I=sstep(-.06,.06,ns)*(.75+.25*sstep(0,.6,ns)),n=(j*N+i)*4;
  out[n]=out[n+1]=out[n+2]=255;out[n+3]=Math.round(255*edge*I)}
 return out}

// Saturn's rings (Phase 4A-4). Pure maths, no DOM.
// Pole: IAU 2015 north pole of Saturn, RA 40.589 deg, Dec 83.537 deg (J2000); the ring plane is Saturn's equator plane. Used in the J2000 ECLIPTIC frame, the same frame as Orrery's planet vectors.
// ringGeom: B = ring tilt = angle between the line of sight and the ring plane, as seen from Earth (positive = the NORTH face of the rings is toward Earth, negative = the south face). Light-time is ignored.
// Also returns where the north pole points ON THE SKY as true alt/az of a point 0.001 rad from Saturn toward the pole (poleAlt, poleAz), so the viewer can turn the picture with screenAngle, the way it does for the Sun and Venus.
const SAT_POLE=eclFromEq(40.589,83.537),vecLB=(l,b)=>[Math.cos(b*D)*Math.cos(l*D),Math.cos(b*D)*Math.sin(l*D),Math.sin(b*D)];
function ringGeom(g,d,T,jd,lat,lon){const k=vecLB(SAT_POLE[0],SAT_POLE[1]),s=[g[0]/d,g[1]/d,g[2]/d],ks=k[0]*s[0]+k[1]*s[1]+k[2]*s[2],B=Math.asin(Math.max(-1,Math.min(1,-ks)))*R;
 const t=[k[0]-ks*s[0],k[1]-ks*s[1],k[2]-ks*s[2]],n=Math.hypot(t[0],t[1],t[2]);let q=[s[0]+1e-3*t[0]/n,s[1]+1e-3*t[1]/n,s[2]+1e-3*t[2]/n];
 const ll=lonlat(q),pp=prec(ll.lon,ll.lat,T),h=toHor(pp[0],pp[1],jd,lat,lon);return{B,poleAlt:h.alt,poleAz:h.az}}
// Ring radii in units of Saturn's equatorial radius 60,268 km (C inner 74,658 km, B inner 92,000, B outer 117,580, A inner 122,170, A outer 136,775: Cassini division between B and A).
const RING_C0=74658/60268,RING_B0=92000/60268,RING_B1=117580/60268,RING_A0=122170/60268,RING_OUT=136775/60268,RING_Q=2.4; // RING_Q: the texture spans +/- RING_Q globe radii (outer ring edge is 2.27)
// RGBA pixels (N x N, canvas row order) of Saturn's globe and rings seen at ring tilt BDeg, Saturn's north pole toward the TOP of the picture. Texture half-width = RING_Q globe radii.
// Globe: flat, opaque to radius 1 and the same 6% soft rim as the flat planet disc (so the globe looks as it did before). Rings: ellipse with minor/major ratio |sin B| (at least 0.02 so an edge-on ring stays a thin line);
// fainter and thinner at small |B| (illustrative: the real edge-on ring is almost invisible). Occlusion done in the picture: the half of the ring BEHIND the globe is hidden by it, the half in front crosses it.
// B > 0 (north face visible): the near half of the ring is the LOWER half of the picture. B < 0: the upper half. No shadows of globe on rings or rings on globe (not drawn). Bands are illustrative (tuned by eye, never seen live): C faint, B bright, Cassini division nearly clear, A medium.
function saturnDisk(N,BDeg){const out=new Uint8ClampedArray(N*N*4),sB=Math.max(.02,Math.abs(Math.sin(BDeg*D))),front=BDeg>=0?-1:1,h=N/2,w=.02,fade=.4+.6*sstep(0,3,Math.abs(BDeg));
 const band=r=>{const e=(a,b)=>sstep(a-w,a+w,r)*(1-sstep(b-w,b+w,r));return Math.max(.32*e(RING_C0,RING_B0)*(.45+.55*sstep(RING_C0,RING_B0,r)),.95*e(RING_B0,RING_B1)*(.7+.3*sstep(RING_B0,RING_B0+.15,r)),.07*e(RING_B1,RING_A0),.75*e(RING_A0,RING_OUT))};
 const lum=r=>r<RING_B0?150:r<RING_B1?238:r<RING_A0?200:205;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i+.5-h)/h*RING_Q,y=-(j+.5-h)/h*RING_Q,r=Math.hypot(x,y),rho=Math.hypot(x,y/sB),n=(j*N+i)*4;
  const ga=r<=1?1:Math.max(0,1-(r-1)/(1/.94-1)),ra=band(rho)*fade,isFront=y*front>0;
  let cc=0,al=0;const over=(c,a)=>{cc=c*a+cc*(1-a);al=a+al*(1-a)}; // composite: back ring, globe, front ring
  if(ra>0&&!isFront)over(lum(rho),ra);
  if(ga>0)over(255,ga);
  if(ra>0&&isFront)over(lum(rho),ra);
  if(al>0){out[n]=out[n+1]=out[n+2]=Math.min(255,Math.round(cc/al));out[n+3]=Math.round(255*al)}}
 return out}
// ---- Sky palette (Phase 4B-1: sunrise/sunset colours). Colours are DISPLAY values (0-1), tuned by eye against the concept image, NEVER seen on a real screen.
// Everything is a smooth function of the Sun's altitude h (degrees). Keys are interpolated with a monotone cubic (Fritsch-Carlson), so the result is continuous with a continuous slope and never overshoots between keys. End slopes are clamped to zero, so holding the end value outside the table has no kink.
// Outside the key range the end values are held. Altitude used by the caller is S.sun.eff (so eclipses darken the sky) except for sunTint, which uses the true altitude.
function pchip(keys,x){const n=keys.length;if(x<=keys[0][0])return keys[0][1].slice();if(x>=keys[n-1][0])return keys[n-1][1].slice();
 let i=0;while(x>keys[i+1][0])i++;const x0=keys[i][0],x1=keys[i+1][0],H=x1-x0,t=(x-x0)/H,t2=t*t,t3=t2*t,out=[];
 for(let c=0;c<keys[0][1].length;c++){const sl=k=>(keys[k+1][1][c]-keys[k][1][c])/(keys[k+1][0]-keys[k][0]);
  const tan=k=>{if(k===0||k===n-1)return 0;const d0=sl(k-1),d1=sl(k);if(d0*d1<=0)return 0;const h0=keys[k][0]-keys[k-1][0],h1=keys[k+1][0]-keys[k][0],w1=2*h1+h0,w2=h1+2*h0;return(w1+w2)/(w1/d0+w2/d1)};
  const y0=keys[i][1][c],y1=keys[i+1][1][c],m0=tan(i),m1=tan(i+1);
  out.push((2*t3-3*t2+1)*y0+(t3-2*t2+t)*H*m0+(-2*t3+3*t2)*y1+(t3-t2)*H*m1)}
 return out}
// keys: [sun altitude deg, value]; ascending altitude
const PAL={
 top:[[-18,[.005,.008,.025]],[-15,[.007,.012,.045]],[-12,[.012,.025,.09]],[-9,[.025,.05,.17]],[-6,[.05,.10,.30]],[-4,[.09,.16,.40]],[-1,[.15,.28,.58]],[2,[.2,.38,.74]],[8,[.24,.46,.86]],[20,[.25,.5,.9]]], // zenith
 hor:[[-18,[.01,.015,.04]],[-15,[.025,.03,.07]],[-12,[.07,.06,.13]],[-9,[.2,.12,.2]],[-6,[.42,.22,.24]],[-4,[.62,.32,.25]],[-1,[.85,.5,.38]],[2,[.85,.72,.72]],[8,[.72,.78,.9]],[20,[.7,.8,.95]]], // horizon, all round
 warm:[[-12,[.2,.09,.2]],[-9,[.45,.15,.25]],[-6,[.75,.22,.22]],[-3,[.95,.34,.2]],[0,[1,.5,.22]],[6,[1,.75,.45]]], // sun-side horizon: orange to deep red
 wa:[[-16,[0]],[-13,[.04]],[-10,[.16]],[-8,[.34]],[-6,[.58]],[-4,[.82]],[-2,[1]],[0,[.88]],[2,[.64]],[6,[.18]],[12,[0]]], // how much of it
 belt:[[-10,[.25,.2,.45]],[-6,[.55,.38,.58]],[-2,[.85,.55,.6]]], // opposite horizon: pink "belt of Venus" over the blue Earth shadow
 ba:[[-13,[0]],[-10,[.12]],[-8,[.28]],[-6,[.46]],[-4,[.55]],[-2,[.4]],[0,[.2]],[4,[0]]],
 glow:[[-12,[.2,.09,.2]],[-6,[.9,.3,.2]],[-2,[1,.5,.2]],[3,[1,.7,.4]],[10,[1,.8,.55]]], // glow around the Sun
 ga:[[-14,[0]],[-12,[.1]],[-8,[.45]],[-3,[.9]],[-1,[.8]],[3,[.35]],[8,[0]]],
 // Phase 4B-2: horizon haze (a band that hugs the horizon on every side, a little stronger toward the Sun), a tight bright aureole around the Sun, and a faint night airglow.
 hz:[[-18,[.03,.05,.05]],[-14,[.06,.07,.13]],[-12,[.12,.11,.24]],[-10,[.2,.15,.32]],[-6,[.55,.32,.42]],[-3,[.95,.5,.38]],[0,[1,.68,.42]],[3,[1,.8,.58]],[8,[.95,.88,.8]],[20,[.88,.92,.98]]], // haze colour: green-grey airglow at night, purple, red, orange, gold, pale white by day
 za:[[-18,[.05]],[-14,[.12]],[-12,[.26]],[-10,[.32]],[-6,[.44]],[-3,[.5]],[0,[.5]],[3,[.42]],[8,[.3]],[20,[.18]]], // how much of the band replaces the base colour right at the horizon
 zk:[[-18,[14]],[-10,[9]],[-4,[6.5]],[0,[6]],[4,[7]],[10,[8]],[20,[9]]], // how fast the band fades with height (per sin of altitude): thick at sunset, thin at night and midday
 gt:[[-10,[0]],[-5,[.12]],[-1,[.35]],[2,[.5]],[8,[.4]],[20,[.18]],[40,[.06]]] // tight aureole around the Sun
};
// asym: 1 = normal (warm glow only on the Sun's side); toward 0 during a solar eclipse, when the whole horizon is lit (all-round sunset glow)
function skyPalette(h,asym){const a=asym===undefined?1:asym,g=k=>pchip(PAL[k],h),wa=g('wa')[0],ba=g('ba')[0];
 return{top:g('top'),hor:g('hor'),warm:g('warm'),wa:Math.max(0,wa),asym:a,belt:g('belt'),ba:Math.max(0,ba)*a,glow:g('glow'),ga:Math.max(0,g('ga')[0])*.9,hz:g('hz'),za:Math.max(0,g('za')[0]),zk:Math.max(1,g('zk')[0]),gt:Math.max(0,g('gt')[0])}}
// share of the horizon glow that stays on the Sun's side: 1 normally; less during a solar eclipse (uses true altitude and effective altitude)
function eclipseAsym(alt,eff){if(eff===undefined||alt<=-4||eff>=alt)return 1;const p=Math.min(1,(alt-eff)/(alt+4));return 1-.85*p}
// the Sun itself reddens near the horizon (multiplies the Sun sprite colour); true altitude
const SUNT=[[-3,[1,.38,.18]],[0,[1,.52,.28]],[3,[1,.68,.45]],[8,[1,.82,.68]],[20,[1,.95,.88]],[40,[1,1,1]]];
function sunTint(alt){return pchip(SUNT,alt)}
const api={skyPalette,eclipseAsym,sunTint,pchip,PAL,saturnDisk,ringGeom,RING_OUT,RING_Q,limbAngle,toCam,screenAngle,phaseDisk,diskPx,diskBlend,PLANET_KM,AU_KM,sky,topo,lunarShadow,moonTilt,obsVec,overlap,toHor,limitMag,refr,sepDeg,nearestVisible,STARS:S,R_SUN,R_MOON};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SkyMath=api;
})(typeof window!=='undefined'?window:globalThis);
