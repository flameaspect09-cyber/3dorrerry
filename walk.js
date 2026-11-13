/* Orrery Sky Phase 2 - walking rules (pure, Node-testable). Metres, x east, z south, dome centre (0,0). */
(function(root){'use strict';
const DOME_R=3.3,DOOR_HALF=.45,TX=6.6,TZ0=3.9,TZ1=11.1;
const PATH_IN=3.82,PATH_OUT=4.95;
// Dome floor + terrace are one walkable area joined by the door gap (z 3.0..3.9). Glass wall, fence and wall are boundaries.
// open (default true, so old callers still work): when the door is shut the door gap is a wall.
function walkable(x,z,open){
 if(open===undefined)open=true;
 const r=Math.hypot(x,z);if(r<DOME_R)return true;
 if(open&&Math.abs(x)<DOOR_HALF&&z>=2.9&&z<=TZ0+.05)return true;
 // Raised stone path follows the outside of the dome across its front half; the rear edge remains cliff.
 if(z>=0&&r>=PATH_IN&&r<=PATH_OUT)return true;
 return Math.abs(x)<=TX&&z>=TZ0&&z<=TZ1}
// slide along walls: try full move, then each axis
function step(x,z,dx,dz,open){if(walkable(x+dx,z+dz,open))return[x+dx,z+dz];if(walkable(x+dx,z,open))return[x+dx,z];if(walkable(x,z+dz,open))return[x,z+dz];return[x,z]}
// Door handle is at local (0, 3.5). You can only use it within arm's reach (default 1.4 m).
const DOOR_Z=3.5,nearDoor=(x,z,r)=>Math.hypot(x,z-DOOR_Z)<(r||1.4);
// Doorway + the area the door swings through: the door will not close on you.
const inDoorway=(x,z)=>Math.abs(x)<1&&z>2.85&&z<4.5;
// Walking feel (pure maths, Node-testable): speeds in m/s, smoothing instead of instant start/stop, head bob and sway.
const SPEED={walk:1.5,run:3};
const approach=(v,t,dt,moving)=>v+(t-v)*Math.min(1,dt*(moving?7:11));
const ampTarget=s=>Math.min(1,s/1.2);
function bobAt(ph,amp,speed,reduced){const rf=1+.4*Math.min(1,Math.max(0,(speed-1.6)/1)),m=amp*rf*(reduced?.2:1);return{y:.032*m*Math.sin(ph),side:.018*m*Math.sin(ph/2)}}
// The scene is built with the door and city toward local +z, then rotated by ANG so they face EAST (+x world).
// The Sun then rises in front (over the city) and sets behind (over the mountain).
const ANG=Math.PI/2,CA=Math.cos(ANG),SA=Math.sin(ANG);
const toWorld=(lx,lz)=>[lx*CA+lz*SA,-lx*SA+lz*CA],toLocal=(wx,wz)=>[wx*CA-wz*SA,wx*SA+wz*CA];
// ---- Phase 4C-1: touch joystick and shared movement command (pure, Node-testable) ----
// Joystick: offset of the finger from the stick centre in screen px (dy positive DOWN), R = full-deflection radius in px.
// Returns a unit direction (f forward, r right) and mag 0..1 AFTER the dead zone (0 just past the dead zone, so there is no jump when it starts).
// Directions within SNAP deg of straight forward/back/left/right snap to the axis, so walking dead straight is easy with a thumb.
const JOY={dead:.12,snap:7,walkAt:.8};
function joyVec(dx,dy,R){const d=Math.hypot(dx,dy);if(!(R>0)||!isFinite(d))return{f:0,r:0,mag:0};const m=Math.min(1,d/R);if(m<=JOY.dead)return{f:0,r:0,mag:0};
 let f=-dy/d,r=dx/d;const a=Math.atan2(r,f)*180/Math.PI,q=Math.round(a/90)*90;if(Math.abs(a-q)<=JOY.snap){const rad=q*Math.PI/180;f=Math.round(Math.cos(rad));r=Math.round(Math.sin(rad))}
 return{f,r,mag:(m-JOY.dead)/(1-JOY.dead)}}
// Speed from stick deflection: 0 to walk speed over 0..walkAt, then walk to run speed over walkAt..1 (push to the edge to run).
const joySpeed=m=>{m=Math.min(1,Math.max(0,m));return m<=JOY.walkAt?SPEED.walk*m/JOY.walkAt:SPEED.walk+(SPEED.run-SPEED.walk)*(m-JOY.walkAt)/(1-JOY.walkAt)};
// One command from keyboard (keys: {w,a,s,d,shift} truthy/falsy) and/or joystick ({f,r,mag} or null). The joystick wins while it is held.
// Returns a UNIT direction (f,r) and a speed in m/s (0 = standing). Keyboard behaves exactly as before 4C-1 (diagonals normalised, shift runs).
function moveCmd(k,joy){if(joy&&joy.mag>0)return{f:joy.f,r:joy.r,speed:joySpeed(joy.mag)};
 k=k||{};const f=(k.w?1:0)-(k.s?1:0),r=(k.d?1:0)-(k.a?1:0);if(!(f||r))return{f:0,r:0,speed:0};const n=Math.hypot(f,r);return{f:f/n,r:r/n,speed:k.shift?SPEED.run:SPEED.walk}}
// Collision that cannot tunnel: a long step (slow frame, run speed) is cut into pieces of at most maxLen metres, each one checked by step().
function stepSub(x,z,dx,dz,open,maxLen){const L=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(L/(maxLen||.1)));for(let i=0;i<n;i++){const p=step(x,z,dx/n,dz/n,open);x=p[0];z=p[1]}return[x,z]}
// One frame of walking: state {x,z,vx,vz} (local metres, world-frame velocity), cmd from moveCmd, yaw in degrees, dt in s. Same smoothing and wall-slide as before 4C-1.
function advance(s,cmd,yawDeg,dt,open){const y=yawDeg*Math.PI/180,f=cmd.f,r=cmd.r,sp=cmd.speed,mv=sp>0;
 let vx=approach(s.vx,(Math.sin(y)*f+Math.cos(y)*r)*sp,dt,mv),vz=approach(s.vz,(-Math.cos(y)*f+Math.sin(y)*r)*sp,dt,mv);if(!mv&&Math.hypot(vx,vz)<.03){vx=vz=0}
 let x=s.x,z=s.z,moved=0;if(vx||vz){const d=toLocal(vx*dt,vz*dt),p=stepSub(x,z,d[0],d[1],open),want=Math.hypot(d[0],d[1]);moved=Math.hypot(p[0]-x,p[1]-z);x=p[0];z=p[1];if(want>0&&moved<want*.5){vx*=.5;vz*=.5}}
 return{x,z,vx,vz,moved}}
const api={JOY,joyVec,joySpeed,moveCmd,stepSub,advance,ANG,toWorld,toLocal,walkable,step,DOME_R,DOOR_HALF,PATH_IN,PATH_OUT,TX,TZ0,TZ1,DOOR_Z,nearDoor,inDoorway,SPEED,approach,ampTarget,bobAt};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SkyWalk=api})(typeof window!=='undefined'?window:globalThis);
