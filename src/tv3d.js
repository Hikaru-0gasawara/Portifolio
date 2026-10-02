/* The opening television as a real 3D object: a procedural WebGL model that stays put while the camera
   orbits it, five live channels painted on a canvas and used as the screen texture, working knobs and an
   enter button. No external libraries. The state machine below is pure so it can be tested without WebGL. */
(function(g){
  'use strict';
  const T=text=>g.PortfolioI18n?.t?g.PortfolioI18n.t(text):text;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2,easeIn=x=>x*x;
  const FOV=35*Math.PI/180,TAN=Math.tan(FOV/2);
  const POWER_ON=2200,POWER_OFF=700,CALM_ON=700,TUNE=350,ALIGN=900,DOLLY=1400;
  // score: the channel plays its own music, so the set's theme stays quiet there.
  const channels=[{id:'fight',name:'Luta'},{id:'monsters',name:'Monstros de bolso'},{id:'show',name:'Show ao vivo',score:true},{id:'rpg',name:'RPG',score:true},{id:'western',name:'Faroeste'}];
  // Front panel layout in model units (the cabinet front is the z=0.25 plane, x to the right, y up).
  const layout={
    screen:{x0:-.66,x1:.26,y0:-.345,y1:.345,z:.255,bulge:.03},
    controls:{
      'channel+':{shape:'circle',x:.54,y:.24,r:.09},
      'volume+':{shape:'circle',x:.54,y:.0,r:.08},
      power:{shape:'rect',x:.46,y:-.21,hw:.045,hh:.035},
      enter:{shape:'rect',x:.62,y:-.21,hw:.055,hh:.04}
    },
    pickZ:.29
  };
  const screenW=layout.screen.x1-layout.screen.x0,screenH=layout.screen.y1-layout.screen.y0;
  const screenCenter=[(layout.screen.x0+layout.screen.x1)/2,(layout.screen.y0+layout.screen.y1)/2,layout.screen.z+layout.screen.bulge];

  // ---------- pure state ----------
  function fitDistance(aspect){return Math.max(1.12/TAN,1.0/(TAN*Math.max(.2,aspect||1)));}
  // The distance at which the glass covers the whole viewport, like the CSS zoom used to.
  function finalDistance(aspect){return Math.min(screenH/(2*TAN),screenW/(2*TAN*Math.max(.2,aspect||1)))/1.04;}
  function createState(o={}){
    const aspect=o.aspect||16/10,fit=fitDistance(aspect);
    return {t:0,power:o.power||'on',powerT:0,channel:o.channel||0,tuneT:0,volume:o.volume??4,volShown:o.volume??4,osdT:1800,volT:0,
      cam:{yaw:-.34,pitch:.1,dist:fit,tx:0,ty:.15,tz:0,vy:0,vp:0},aspect,fit,zoom:1,dragging:false,
      knob:{channel:0,volume:0},pressed:{},enter:null,card:false,events:[],cardPx:48,fx:1};
  }
  function knobTargets(s){return {channel:-s.channel*2*Math.PI/channels.length,volume:(135-s.volume*27)*Math.PI/180};}
  function press(s,name){
    if(s.enter)return false;
    s.pressed[name]=160;
    if(name==='power'){
      if(s.power==='on'||s.power==='warming'){s.power='cooling';s.powerT=0;s.events.push('switch','off');}
      else{s.power='warming';s.powerT=0;s.events.push('switch','degauss');}
      return true;
    }
    if(name==='channel+'||name==='channel-'){
      s.channel=(s.channel+(name==='channel+'?1:channels.length-1))%channels.length;s.osdT=2200;s.events.push('knob');
      if(s.power==='on'){s.tuneT=TUNE;s.events.push('tune');}
      return true;
    }
    if(name==='volume+'||name==='volume-'){
      s.volume=clamp(s.volume+(name==='volume+'?1:-1),0,10);s.volT=1700;s.events.push('knob','vol');return true;
    }
    if(name==='enter'){s.events.push('press');return true;}
    return false;
  }
  function beginEnter(s,reduced){
    if(s.enter)return false;
    s.enter={stage:s.power==='on'?'tune':'warm',t:0,reduced:!!reduced,from:null};s.card=true;s.osdT=0;s.volT=0;s.dragging=false;s.cam.vy=s.cam.vp=0;
    if(s.power==='on'){s.tuneT=TUNE;s.events.push('tune');}
    else{s.power='warming';s.powerT=0;s.events.push('switch','degauss');}
    return true;
  }
  const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function cameraLerp(a,b,k,logDist){
    const d=logDist?Math.exp(Math.log(a.dist)+(Math.log(b.dist)-Math.log(a.dist))*k):a.dist+(b.dist-a.dist)*k;
    return {yaw:a.yaw+wrapAngle(b.yaw-a.yaw)*k,pitch:a.pitch+(b.pitch-a.pitch)*k,dist:d,tx:a.tx+(b.tx-a.tx)*k,ty:a.ty+(b.ty-a.ty)*k,tz:a.tz+(b.tz-a.tz)*k,vy:0,vp:0};
  }
  function step(s,dt){
    const before=s.powerT;s.t+=dt;
    for(const k of Object.keys(s.pressed)){s.pressed[k]-=dt;if(s.pressed[k]<=0)delete s.pressed[k];}
    if(s.power==='warming'){
      const dur=s.enter?.reduced?CALM_ON:POWER_ON;s.powerT+=dt;
      const cross=f=>before<dur*f&&s.powerT>=dur*f;
      if(cross(.25))s.events.push('dot');if(cross(.45))s.events.push('crackle');if(cross(.55))s.events.push('snow');if(cross(.78))s.events.push('blup');
      if(s.powerT>=dur){s.power='on';s.powerT=0;if(!s.enter)s.osdT=2200;}
    }else if(s.power==='cooling'){s.powerT+=dt;if(s.powerT>=POWER_OFF){s.power='off';s.powerT=0;}}
    s.tuneT=Math.max(0,s.tuneT-dt);s.osdT=Math.max(0,s.osdT-dt);s.volT=Math.max(0,s.volT-dt);
    s.volShown+=(s.volume-s.volShown)*Math.min(1,dt/90);
    const target=knobTargets(s);for(const k of ['channel','volume'])s.knob[k]+=(target[k]-s.knob[k])*Math.min(1,dt/70);
    const cam=s.cam;
    if(!s.enter&&!s.dragging&&(cam.vy||cam.vp)){
      cam.yaw+=cam.vy*dt;cam.pitch=clamp(cam.pitch+cam.vp*dt,-1.45,1.45);
      const decay=Math.exp(-dt/260);cam.vy*=decay;cam.vp*=decay;if(Math.abs(cam.vy)+Math.abs(cam.vp)<1e-5)cam.vy=cam.vp=0;
    }
    const e=s.enter;if(!e)return s;
    e.t+=dt;
    const next=stage=>{e.stage=stage;e.t=0;e.from=null;};
    if(e.stage==='warm'&&s.power==='on')next(e.reduced?'done':'align');
    else if(e.stage==='tune'&&e.t>=TUNE)next(e.reduced?'done':'align');
    if(e.stage==='align'||e.stage==='dolly'){
      e.from=e.from||{...cam};
      const front={yaw:0,pitch:0,tx:screenCenter[0],ty:screenCenter[1],tz:screenCenter[2]};
      if(e.stage==='align'){
        Object.assign(cam,cameraLerp(e.from,{...front,dist:Math.max(finalDistance(s.aspect)*2.6,s.fit*.8)},ease(clamp(e.t/ALIGN))));
        if(e.t>=ALIGN)next('dolly');
      }else{
        const k=clamp(e.t/DOLLY);Object.assign(cam,cameraLerp(e.from,{...front,dist:finalDistance(s.aspect)},ease(k),true));
        s.fx=1-easeIn(k);if(e.t>=DOLLY){s.fx=0;next('done');}
      }
    }
    return s;
  }
  function orbitEye(c){const cp=Math.cos(c.pitch);return [c.tx+c.dist*cp*Math.sin(c.yaw),c.ty+c.dist*Math.sin(c.pitch),c.tz+c.dist*cp*Math.cos(c.yaw)];}
  // Which front-panel control a pointer at normalized device coordinates (-1..1) is over, if any.
  // Front-panel control under the pointer. Knobs report which half was hit: the left half turns them down.
  function pick(cam,aspect,nx,ny){const hit=pickPoint(cam,aspect,nx,ny);return hit?hit.name:null;}
  function controlAction(hit){if(!hit)return null;const c=layout.controls[hit.name];return c.shape==='circle'&&hit.x<c.x?hit.name.replace('+','-'):hit.name;}
  function pickPoint(cam,aspect,nx,ny){
    const eye=orbitEye(cam),f=norm([cam.tx-eye[0],cam.ty-eye[1],cam.tz-eye[2]]),r=norm(cross(f,[0,1,0])),u=cross(r,f);
    const d=norm([f[0]+r[0]*nx*TAN*aspect+u[0]*ny*TAN,f[1]+r[1]*nx*TAN*aspect+u[1]*ny*TAN,f[2]+r[2]*nx*TAN*aspect+u[2]*ny*TAN]);
    if(eye[2]<=layout.pickZ||d[2]>=0)return null;
    const t=(layout.pickZ-eye[2])/d[2],x=eye[0]+d[0]*t,y=eye[1]+d[1]*t;
    const name=hitControl(x,y);return name?{name,x,y}:null;
  }
  function hitControl(x,y){
    for(const [name,c] of Object.entries(layout.controls)){
      if(c.shape==='circle'?Math.hypot(x-c.x,y-c.y)<=c.r:Math.abs(x-c.x)<=c.hw&&Math.abs(y-c.y)<=c.hh)return name;
    }
    return null;
  }

  // ---------- math ----------
  function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
  function persp(aspect,near,far){const f=1/TAN,nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function lookAt(e,c){
    const z=norm(sub(e,c)),x=norm(cross([0,1,0],z)),y=cross(z,x);
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);
  }
  function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v;}return o;}
  const IDENTITY=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function rotZAbout(cx,cy,a,dz=0){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,cx-c*cx+s*cy,cy-s*cx-c*cy,dz,1]);}

  // ---------- geometry ----------
  // Interleaved vertices: position(3) normal(3) material rgb+kind(4) uv(2). Kinds: 0 matte, 1 wood, 2 plastic, 3 metal, 4 emissive.
  function Mesh(){this.v=[];}
  Mesh.prototype.tri=function(a,b,c,m,uv=[[0,0],[0,0],[0,0]]){
    const n=norm(cross(sub(b,a),sub(c,a)));
    [a,b,c].forEach((p,i)=>this.v.push(p[0],p[1],p[2],n[0],n[1],n[2],m[0],m[1],m[2],m[3],uv[i][0],uv[i][1]));
  };
  Mesh.prototype.quad=function(a,b,c,d,m,uv){
    uv=uv||[[0,0],[1,0],[1,1],[0,1]];this.tri(a,b,c,m,[uv[0],uv[1],uv[2]]);this.tri(a,c,d,m,[uv[0],uv[2],uv[3]]);
  };
  // Eight corners: 0-3 the back face (z-), 4-7 the front face (z+), each counter-clockwise from bottom-left.
  Mesh.prototype.hexa=function(P,m){
    for(const f of [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]])this.quad(P[f[0]],P[f[1]],P[f[2]],P[f[3]],m);
  };
  Mesh.prototype.box=function(x0,y0,z0,x1,y1,z1,m){
    this.hexa([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],m);
  };
  // A cylinder from p0 to p1; optional ribs alternate the side colour (knob grips).
  Mesh.prototype.cylinder=function(p0,p1,r0,r1,seg,m,cap,ribs){
    const axis=norm(sub(p1,p0)),ref=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0],u=norm(cross(axis,ref)),w=cross(axis,u);
    const ring=(p,r,a)=>[p[0]+(u[0]*Math.cos(a)+w[0]*Math.sin(a))*r,p[1]+(u[1]*Math.cos(a)+w[1]*Math.sin(a))*r,p[2]+(u[2]*Math.cos(a)+w[2]*Math.sin(a))*r];
    for(let i=0;i<seg;i++){
      const a=i/seg*Math.PI*2,b=(i+1)/seg*Math.PI*2,mm=ribs&&i%2?ribs:m;
      this.quad(ring(p0,r0,a),ring(p0,r0,b),ring(p1,r1,b),ring(p1,r1,a),mm);
      if(cap){this.tri(p1,ring(p1,r1,a),ring(p1,r1,b),cap);this.tri(p0,ring(p0,r0,b),ring(p0,r0,a),cap);}
    }
  };
  Mesh.prototype.sphere=function(c,r,seg,m){
    for(let i=0;i<seg;i++)for(let j=0;j<seg*2;j++){
      const p=(a,b)=>[c[0]+r*Math.sin(a)*Math.cos(b),c[1]+r*Math.cos(a),c[2]+r*Math.sin(a)*Math.sin(b)];
      const a0=i/seg*Math.PI,a1=(i+1)/seg*Math.PI,b0=j/(seg*2)*Math.PI*2,b1=(j+1)/(seg*2)*Math.PI*2;
      this.quad(p(a0,b0),p(a0,b1),p(a1,b1),p(a1,b0),m);
    }
  };
  const C={
    wood:[.42,.26,.14,1],woodDark:[.27,.17,.09,1],back:[.2,.15,.1,2],bezel:[.15,.16,.14,2],brass:[.58,.47,.27,3],
    knob:[.18,.19,.17,2],knobRib:[.3,.31,.28,2],cap:[.66,.63,.52,3],mark:[.92,.88,.7,4],black:[.04,.04,.035,0],
    leg:[.11,.09,.07,3],tip:[.62,.5,.26,3],antenna:[.72,.72,.66,3],button:[.6,.57,.45,2],enter:[.68,.16,.1,2],grille:[.08,.07,.06,0]
  };
  function buildModel(){
    const m=new Mesh();
    m.box(-.76,-.5,-.25,.76,.5,.25,C.wood);                       // front section of the cabinet
    m.box(-.78,-.52,.18,.78,-.5,.26,C.woodDark);m.box(-.78,.5,.18,.78,.52,.26,C.woodDark); // trim
    m.hexa([[-.46,-.3,-.75],[.46,-.3,-.75],[.46,.3,-.75],[-.46,.3,-.75],[-.7,-.45,-.25],[.7,-.45,-.25],[.7,.45,-.25],[-.7,.45,-.25]],C.back); // tube housing
    for(let i=0;i<7;i++)m.box(-.3,-.2+i*.06,-.752,.3,-.18+i*.06,-.75,C.black);          // back vents
    for(const [x0,x1,y0,y1] of [[-.72,.32,.38,.41],[-.72,.32,-.41,-.38],[-.72,-.66,-.41,.41],[.26,.32,-.41,.41]])m.box(x0,y0,.25,x1,y1,.29,C.bezel); // bezel
    m.box(-.66,-.345,.24,.26,.345,.252,C.black);                  // tube face behind the glass
    m.box(.38,-.42,.25,.68,-.29,.256,C.grille);                   // speaker
    for(let i=0;i<6;i++)m.box(.39,-.41+i*.022,.256,.67,-.4+i*.022,.262,C.brass);
    for(const [x,z] of [[-.62,-.15],[.62,-.15],[-.62,.15],[.62,.15]]){
      const foot=[x*1.14,-.86,z*1.5];m.cylinder([x,-.5,z],foot,.028,.02,10,C.leg,C.leg);m.cylinder(foot,[foot[0],foot[1]-.008,foot[2]],.024,.024,10,C.tip,C.tip);
    }
    m.sphere([.15,.5,-.18],.075,6,C.knob);
    for(const side of [-1,1]){const tip=[.15+side*.4,1.08,-.26];m.cylinder([.15,.53,-.18],tip,.009,.006,6,C.antenna,C.antenna);m.sphere(tip,.018,4,C.antenna);}
    m.box(-.79,-.53,-.26,.79,-.5,.26,C.woodDark);                 // underside board
    return m;
  }
  function knobMesh(x,y,r){const m=new Mesh();m.cylinder([x,y,.256],[x,y,.33],r,r*.92,20,C.knob,C.cap,C.knobRib);m.box(x-.006,y+r*.2,.331,x+.006,y+r*.82,.334,C.mark);return m;}
  function buttonMesh(c,m0){const m=new Mesh();m.box(c.x-c.hw,c.y-c.hh,.256,c.x+c.hw,c.y+c.hh,.29,m0);return m;}
  // Canvas textures are uploaded top row first, so the plates map v=0 to their top edge.
  const plateUV=[[0,1],[1,1],[1,0],[0,0]];
  function plateMesh(x0,y0,x1,y1,z){const m=new Mesh();m.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[1,1,1,2],plateUV);return m;}
  function backPlateMesh(){const m=new Mesh();m.quad([.28,-.27,-.754],[-.28,-.27,-.754],[-.28,.07,-.754],[.28,.07,-.754],[1,1,1,2],plateUV);return m;}
  function screenMesh(){
    const s=layout.screen,N=24,M=18,v=[];
    const P=(i,j)=>{const u=i/N,w=j/M,cx=u*2-1,cy=w*2-1,z=s.z+s.bulge*(1-cx*cx*.6)*(1-cy*cy*.6);return {p:[s.x0+u*(s.x1-s.x0),s.y0+w*(s.y1-s.y0),z],uv:[u,w],n:norm([cx*s.bulge*1.2,cy*s.bulge*1.6,1])};};
    for(let i=0;i<N;i++)for(let j=0;j<M;j++){
      const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1);
      for(const q of [a,b,c,a,c,d])v.push(...q.p,...q.n,0,0,0,0,...q.uv);
    }
    return {v};
  }

  // ---------- WebGL ----------
  const VS='attribute vec3 aPos;attribute vec3 aNor;attribute vec4 aMat;attribute vec2 aUV;uniform mat4 uVP;uniform mat4 uModel;varying vec3 vPos;varying vec3 vNor;varying vec4 vMat;varying vec2 vUV;'+
    'void main(){vec4 w=uModel*vec4(aPos,1.0);vPos=w.xyz;vNor=(uModel*vec4(aNor,0.0)).xyz;vMat=aMat;vUV=aUV;gl_Position=uVP*w;}';
  const FS_LIT='precision mediump float;varying vec3 vPos;varying vec3 vNor;varying vec4 vMat;varying vec2 vUV;uniform vec3 uEye;uniform sampler2D uTex;uniform float uUseTex;uniform vec3 uTint;uniform float uGlow;'+
    'void main(){vec3 n=normalize(vNor);vec3 v=normalize(uEye-vPos);if(dot(n,v)<0.0)n=-n;vec3 base=vMat.rgb*uTint;float k=vMat.a;float spec=0.12;'+
    'if(k>0.5&&k<1.5){float gr=sin(vPos.x*38.0+sin(vPos.y*6.0+vPos.z*9.0)*2.2+sin(vPos.z*17.0)*0.6);float ring=sin((vPos.y*3.0+vPos.z*2.0)*14.0+sin(vPos.x*4.0)*3.0);base*=0.86+0.1*gr+0.05*ring;}'+
    'else if(k>1.5&&k<2.5)spec=0.5;else if(k>2.5&&k<3.5)spec=0.85;'+
    'if(uUseTex>0.5){vec4 t=texture2D(uTex,vUV);base=mix(base*0.6,t.rgb,t.a);}'+
    'vec3 L1=normalize(vec3(-0.5,0.8,0.7));vec3 L2=normalize(vec3(0.7,0.3,0.45));vec3 L3=normalize(vec3(0.1,0.35,-1.0));'+
    'vec3 L4=normalize(vec3(-0.2,-1.0,0.3));float d=max(dot(n,L1),0.0)*0.85+max(dot(n,L2),0.0)*0.32+max(dot(n,L3),0.0)*0.4+max(dot(n,L4),0.0)*0.38;float s=pow(max(dot(n,normalize(L1+v)),0.0),36.0)*spec;'+
    'vec3 col=k>3.5?base:base*(0.3+d)+vec3(s);col+=uGlow*vec3(0.3,0.24,0.12);gl_FragColor=vec4(col,1.0);}';
  const FS_SCREEN='precision mediump float;varying vec3 vPos;varying vec3 vNor;varying vec2 vUV;uniform sampler2D uTex;uniform vec3 uEye;uniform float uFx;'+
    'void main(){vec2 c=vUV-0.5;vec2 uv=0.5+c*(1.0+0.12*uFx*dot(c,c));vec3 col=vec3(0.0);'+
    'vec2 q=abs(c)-vec2(0.5-0.1*uFx);float corner=length(max(q,0.0))-0.1*uFx;'+
    'if(uv.x>=0.0&&uv.x<=1.0&&uv.y>=0.0&&uv.y<=1.0)col=texture2D(uTex,vec2(uv.x,1.0-uv.y)).rgb;'+
    'col*=mix(1.0,0.86+0.14*sin(uv.y*1130.0),uFx);col*=1.0-dot(c,c)*1.3*uFx;'+
    'vec3 n=normalize(vNor);vec3 v=normalize(uEye-vPos);float fres=pow(1.0-max(dot(n,v),0.0),3.0);'+
    'vec3 L=normalize(vec3(-0.5,0.8,0.7));float s=pow(max(dot(n,normalize(L+v)),0.0),60.0);'+
    'col+=uFx*(vec3(0.025,0.035,0.03)+vec3(0.14,0.16,0.15)*fres+vec3(0.35)*s);if(corner>0.0)col=vec3(0.05,0.055,0.05);gl_FragColor=vec4(col,1.0);}';
  const VS_SHADOW='attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;varying vec2 vUV;void main(){vUV=aUV;gl_Position=uVP*vec4(aPos,1.0);}';
  const FS_SHADOW='precision mediump float;varying vec2 vUV;void main(){float d=length(vUV*2.0-1.0);gl_FragColor=vec4(0.0,0.0,0.0,0.5*smoothstep(1.0,0.15,d));}';
  function program(gl,vs,fs){
    const make=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const p=gl.createProgram();gl.attachShader(p,make(gl.VERTEX_SHADER,vs));gl.attachShader(p,make(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    const loc={};const count=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<count;i++){const u=gl.getActiveUniform(p,i);loc[u.name]=gl.getUniformLocation(p,u.name);}
    for(const a of ['aPos','aNor','aMat','aUV'])loc[a]=gl.getAttribLocation(p,a);
    return {p,loc};
  }
  function texture(gl,source,linear=true){
    const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    for(const [k,v] of [[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,linear?gl.LINEAR:gl.NEAREST],[gl.TEXTURE_MAG_FILTER,linear?gl.LINEAR:gl.NEAREST]])gl.texParameteri(gl.TEXTURE_2D,k,v);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);return t;
  }
  function createRenderer(canvas,screenCanvas,textures){
    let gl=null;
    try{gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl');}catch{gl=null;}
    if(!gl)return null;
    let lit,screen,shadow;
    try{lit=program(gl,VS,FS_LIT);screen=program(gl,VS,FS_SCREEN);shadow=program(gl,VS_SHADOW,FS_SHADOW);}catch{return null;}
    const upload=v=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);return {b,count:v.length/12};};
    const c=layout.controls;
    const meshes={
      body:upload(buildModel().v),channel:upload(knobMesh(c['channel+'].x,c['channel+'].y,.085).v),volume:upload(knobMesh(c['volume+'].x,c['volume+'].y,.075).v),
      power:upload(buttonMesh(c.power,C.button).v),enter:upload(buttonMesh(c.enter,C.enter).v),
      led:upload((()=>{const m=new Mesh();m.box(.448,-.152,.256,.472,-.14,.262,[1,1,1,4]);return m;})().v),
      panel:upload(plateMesh(.36,-.27,.72,.44,.2505).v),brand:upload(plateMesh(-.36,-.49,-.04,-.425,.2505).v),back:upload(backPlateMesh().v),screen:upload(screenMesh().v),
      shadow:(()=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1.25,-.872,-1.3,0,0,1.25,-.872,-1.3,1,0,1.25,-.872,.9,1,1,-1.25,-.872,-1.3,0,0,1.25,-.872,.9,1,1,-1.25,-.872,.9,0,1]),gl.STATIC_DRAW);return {b,count:6};})()
    };
    const tex={screen:texture(gl,screenCanvas),panel:texture(gl,textures.panel),brand:texture(gl,textures.brand),back:texture(gl,textures.back)};
    function bind(prog,mesh){
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.b);const L=prog.loc,S=48;
      const attr=(name,size,off)=>{if(L[name]<0)return;gl.enableVertexAttribArray(L[name]);gl.vertexAttribPointer(L[name],size,gl.FLOAT,false,S,off);};
      attr('aPos',3,0);attr('aNor',3,12);attr('aMat',4,24);attr('aUV',2,40);
    }
    function draw(prog,mesh,model,opts={}){
      bind(prog,mesh);const L=prog.loc;
      gl.uniformMatrix4fv(L.uModel,false,model||IDENTITY);
      if(L.uTint)gl.uniform3fv(L.uTint,opts.tint||[1,1,1]);if(L.uGlow)gl.uniform1f(L.uGlow,opts.glow||0);
      if(L.uUseTex)gl.uniform1f(L.uUseTex,opts.tex?1:0);
      if(opts.tex){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,opts.tex);gl.uniform1i(L.uTex,0);}
      gl.drawArrays(gl.TRIANGLES,0,mesh.count);
    }
    function render(s,hover,refresh){
      const dpr=Math.min(2,g.devicePixelRatio||1),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
      const eye=orbitEye(s.cam),vp=mul(persp(w/h,.03,40),lookAt(eye,[s.cam.tx,s.cam.ty,s.cam.tz]));
      gl.bindTexture(gl.TEXTURE_2D,tex.screen);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,screenCanvas);
      if(refresh)for(const k of ['panel','brand','back']){gl.bindTexture(gl.TEXTURE_2D,tex[k]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textures[k]);}
      gl.useProgram(lit.p);gl.uniformMatrix4fv(lit.loc.uVP,false,vp);gl.uniform3fv(lit.loc.uEye,eye);
      const cc=layout.controls,pulse=.5+.5*Math.sin(s.t/320),glow=name=>(hover===name?.55:0)+(name==='enter'&&!s.enter?.18*pulse:0);
      draw(lit,meshes.body);
      draw(lit,meshes.panel,null,{tex:tex.panel});draw(lit,meshes.brand,null,{tex:tex.brand});draw(lit,meshes.back,null,{tex:tex.back});
      draw(lit,meshes.channel,rotZAbout(cc['channel+'].x,cc['channel+'].y,s.knob.channel),{glow:glow('channel+')});
      draw(lit,meshes.volume,rotZAbout(cc['volume+'].x,cc['volume+'].y,s.knob.volume),{glow:glow('volume+')});
      for(const name of ['power','enter'])draw(lit,meshes[name],rotZAbout(0,0,0,s.pressed[name]?-.016:0),{glow:glow(name)});
      const on=s.power==='on'||s.power==='warming';draw(lit,meshes.led,null,{tint:on?[.55,1,.5]:[.85,.22,.16]});
      gl.useProgram(screen.p);gl.uniformMatrix4fv(screen.loc.uVP,false,vp);gl.uniform3fv(screen.loc.uEye,eye);gl.uniform1f(screen.loc.uFx,s.fx);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex.screen);gl.uniform1i(screen.loc.uTex,0);bind(screen,meshes.screen);gl.uniformMatrix4fv(screen.loc.uModel,false,IDENTITY);gl.drawArrays(gl.TRIANGLES,0,meshes.screen.count);
      gl.useProgram(shadow.p);gl.uniformMatrix4fv(shadow.loc.uVP,false,vp);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER,meshes.shadow.b);gl.enableVertexAttribArray(shadow.loc.aPos);gl.vertexAttribPointer(shadow.loc.aPos,3,gl.FLOAT,false,20,0);
      if(shadow.loc.aUV>=0){gl.enableVertexAttribArray(shadow.loc.aUV);gl.vertexAttribPointer(shadow.loc.aUV,2,gl.FLOAT,false,20,12);}
      gl.drawArrays(gl.TRIANGLES,0,6);gl.depthMask(true);gl.disable(gl.BLEND);
      for(let i=0;i<8;i++)gl.disableVertexAttribArray(i);
    }
    return {render,gl,destroy(){gl.getExtension('WEBGL_lose_context')?.loseContext();}};
  }

  // ---------- printed parts ----------
  function makeCanvas(w,h){const c=g.document.createElement('canvas');c.width=w;c.height=h;return c;}
  function paintTextures(t){
    const font=size=>size+"px 'DotGothic16','JetBrains Mono',monospace";
    t.panel=t.panel||makeCanvas(256,512);const p=t.panel.getContext('2d'),W=256,H=512;
    const gr=p.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#b0925a');gr.addColorStop(.5,'#8d7240');gr.addColorStop(1,'#a3864f');p.fillStyle=gr;p.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=3){p.fillStyle='rgba(255,240,200,'+(.03+.03*Math.sin(y*1.7))+')';p.fillRect(0,y,W,1);}
    // panel covers x .36..72, y -.27...44; map model coords to texels
    const X=x=>(x-.36)/.36*W,Y=y=>(.44-y)/.71*H;
    p.fillStyle='#2b200f';p.textAlign='center';p.textBaseline='middle';
    const ring=(cx,cy,r,count,labels)=>{for(let i=0;i<count;i++){const a=(labels?-i*2*Math.PI/count:(135-i*27)*Math.PI/180)-Math.PI/2+(labels?0:Math.PI);const x=X(cx)+Math.cos(labels?a:-a+Math.PI)*r,y=Y(cy)+Math.sin(labels?a:-a+Math.PI)*r;
      if(labels){p.font=font(17);p.fillText(String(i+1),x,y);}else{p.fillRect(x-2,y-2,4,4);}}};
    ring(.54,.24,82,channels.length,true);ring(.54,0,70,11,false);
    p.font=font(22);p.fillText(T('CANAL'),X(.54),Y(.385));p.fillText(T('VOLUME'),X(.54),Y(.135));
    p.font=font(16);p.fillText(T('ENERGIA'),X(.46),Y(-.255)+4);p.fillText(T('ENTRAR'),X(.62),Y(-.255)+4);
    for(const [x,y] of [[12,12],[W-12,12],[12,H-12],[W-12,H-12]]){p.fillStyle='#5e4a26';p.beginPath();p.arc(x,y,6,0,7);p.fill();p.fillStyle='#d8c08a';p.fillRect(x-4,y-1,8,2);}
    t.brand=t.brand||makeCanvas(256,52);const b=t.brand.getContext('2d');
    b.fillStyle='#1c1610';b.fillRect(0,0,256,52);b.strokeStyle='#c8a75e';b.lineWidth=3;b.strokeRect(3,3,250,46);
    b.fillStyle='#e2c578';b.font=font(26);b.textAlign='center';b.textBaseline='middle';b.fillText('OKARU  光',128,28);
    t.back=t.back||makeCanvas(256,160);const k=t.back.getContext('2d');
    k.fillStyle='#d9cfb4';k.fillRect(0,0,256,160);k.strokeStyle='#3a2f1e';k.lineWidth=3;k.strokeRect(4,4,248,152);
    k.fillStyle='#2b2418';k.textAlign='center';k.font=font(22);k.fillText('OKARU · 光-77',128,36);k.font=font(15);k.fillText('110 / 220 V · 60 Hz · 75 W',128,66);
    k.fillStyle='#8e2a1c';k.fillRect(14,86,228,56);k.fillStyle='#f3e6c4';k.font=font(15);k.fillText(T('NÃO ABRA · ALTA TENSÃO'),128,114);
    return t;
  }

  // ---------- channels ----------
  const rnd=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822507)+1013904223|0)>>>0)/4294967296;
  function crossed(prev,t,at,cycle){if(t<=prev)return false;const a=prev%cycle,b=t%cycle;return t-prev>=cycle||(a<=b?at>a&&at<=b:at>a||at<=b);}
  function sky(s,stops){const gr=s.createLinearGradient(0,0,0,120);stops.forEach(([o,c])=>gr.addColorStop(o,c));s.fillStyle=gr;s.fillRect(0,0,160,120);}
  function fighter(s,x,y,dir,c,pose,k){
    const R=(a,b,w,h,col)=>{s.fillStyle=col;s.fillRect(Math.round(dir>0?x+a:x-a-w),Math.round(y+b),w,h);};
    const e=Math.sin(clamp(k)*Math.PI),skin='#e8b98f';
    if(pose==='down'){R(-12,-5,10,4,c.gi);R(-2,-5,8,4,c.pants);R(-17,-6,5,5,skin);return;}
    const lean=pose==='hit'?-3*e:0;
    if(pose==='kick'){R(-4,-10,3,10,c.pants);R(0,-13,4+9*e,3,c.pants);}else{R(-4,-10,3,10,c.pants);R(1,-10,3,10,c.pants);}
    R(-4+lean,-22,8,12,c.gi);R(-4+lean,-15,8,2,c.belt);R(-3+lean,-29,6,7,skin);R(-3+lean,-30,7,2,c.hair);R(1+lean,-27,1,1,'#1a1410');
    if(pose==='punch'){R(3+lean,-20,3+9*e,3,c.gi);R(5+9*e+lean,-21,3,4,skin);}
    else if(pose==='fire'){R(3+lean,-20,7,3,c.gi);R(9+lean,-21,3,5,skin);}
    else if(pose==='win'){R(2+lean,-33,3,12,c.gi);R(2+lean,-35,3,3,skin);}
    else{R(2+lean,-20,3,6,c.gi);R(3+lean,-15,3,2,skin);}
  }
  const CH={
    fight(s,o,t,prev,ev){
      const cyc=9,k=t%cyc,round=Math.floor(t/cyc),r=rnd(round*977+13),acts=[];
      for(let i=0;i<9;i++)acts.push({at:1.4+i*.65,actor:r()<.55?0:1,type:['punch','kick','fire'][Math.floor(r()*3)],hit:r()<.75});
      const hp=[100,100];let last=null;
      for(const a of acts){if(a.at>k)break;last=a;if(a.hit)hp[1-a.actor]=Math.max(0,hp[1-a.actor]-(a.type==='fire'?18:13));}
      const loser=hp[0]<=hp[1]?0:1,ko=k>7.6;if(ko)hp[loser]=0;
      for(const a of acts)if(a.hit&&crossed(prev,t,a.at+.15,cyc))ev.push(a.type==='fire'?'fire':'hit');
      if(crossed(prev,t,7.6,cyc))ev.push('ko');
      sky(s,[[0,'#2b1a4a'],[.55,'#c2563a'],[.75,'#f0a85a']]);
      s.fillStyle='#3a2340';s.beginPath();s.moveTo(0,80);for(let x=0;x<=160;x+=20)s.lineTo(x,62+((x*37)%23));s.lineTo(160,80);s.fill();
      s.fillStyle='#2a1a1c';s.fillRect(118,44,6,40);s.fillRect(140,44,6,40);s.fillRect(112,40,40,5);s.fillRect(115,48,34,3);
      s.fillStyle='#6b4a34';s.fillRect(0,84,160,36);s.fillStyle='#57392a';for(let i=0;i<9;i++)s.fillRect(i*20-((t*6)%20),84,1,36);s.fillRect(0,96,160,1);
      const bob=Math.sin(t*6)*1,pa=50+Math.sin(t*1.3)*6,pb=110-Math.sin(t*1.1)*6;
      const pose=i=>{if(ko)return i===loser?'down':'win';if(!last||k-last.at>.4)return 'idle';if(last.actor===i)return last.type;return last.hit&&k-last.at>.1?'hit':'idle';};
      const prog=last?(k-last.at)/.4:0;
      fighter(s,pa,100+bob,1,{gi:'#e9e4d6',pants:'#e9e4d6',belt:'#2a2a2a',hair:'#1c1c1c'},pose(0),prog);
      fighter(s,pb,100-bob,-1,{gi:'#b8282a',pants:'#b8282a',belt:'#1c1c1c',hair:'#d8b24a'},pose(1),prog);
      if(last?.type==='fire'&&k-last.at<.6){const p=(k-last.at)/.6,from=last.actor?pb:pa,to=last.actor?pa:pb,x=from+(to-from)*p;s.fillStyle='#8ec5ff';s.fillRect(x-4,79,8,7);s.fillStyle='#fff';s.fillRect(x-2,81,4,3);}
      if(last?.hit&&k-last.at>.12&&k-last.at<.3){const x=last.actor?pa+6:pb-6;s.fillStyle='#fff6c8';for(let i=0;i<6;i++)s.fillRect(x+Math.cos(i)*6,78+Math.sin(i)*6,2,2);}
      return ()=>{
        const bar=(x,w,v,right)=>{o.fillStyle='#1a1410';o.fillRect(x-3,15,w+6,21);o.fillStyle='#b8282a';o.fillRect(x,18,w,15);o.fillStyle='#f0ce6a';const f=w*v/100;o.fillRect(right?x+w-f:x,18,f,15);};
        bar(18,180,hp[0],false);bar(282,180,hp[1],true);
        o.font="22px 'DotGothic16',monospace";o.textBaseline='top';o.fillStyle='#fff';o.textAlign='left';o.fillText('OKARU',18,40);o.textAlign='right';o.fillText('RIVAL',462,40);
        o.textAlign='center';o.font="30px 'DotGothic16',monospace";o.fillText(String(Math.max(0,99-Math.floor(k*9))).padStart(2,'0'),240,10);
        if(k<1.3){o.font="44px 'DotGothic16',monospace";o.fillStyle='#f0ce6a';o.fillText(k<.7?'ROUND '+(round%3+1):'FIGHT!',240,150);}
        if(ko&&Math.floor(t*4)%2){o.font="56px 'DotGothic16',monospace";o.fillStyle='#e04a3a';o.fillText('K.O.',240,140);}
      };
    },
    monsters(s,o,t,prev,ev){
      const cyc=10,k=t%cyc,stage=k<2.5?0:k<5?1:k<7.5?2:3,start=[0,2.5,5,7.5][stage];
      const msgs=['Um FOLHINHA selvagem apareceu!','FAÍSCA usou CHOQUE!','É super efetivo!','FOLHINHA desmaiou!'];
      if(crossed(prev,t,3.2,cyc))ev.push('zap');if(crossed(prev,t,7.5,cyc))ev.push('faint');
      for(let i=1;i<14;i++)if(crossed(prev,t,start+i*.12,cyc)&&i*.12<2)ev.push('blip');
      sky(s,[[0,'#cfe8b0'],[.6,'#a8d488'],[1,'#7fb862']]);
      s.fillStyle='#8cc070';s.beginPath();s.ellipse(112,48,30,7,0,0,7);s.fill();s.beginPath();s.ellipse(44,77,34,8,0,0,7);s.fill();
      const enterX=Math.min(1,k/.8),hpE=k<3.4?1:k<4.2?1-.7*(k-3.4)/.8:k<7.5?.3:0,faint=k>7.5?Math.min(1,(k-7.5)/.6):0,blink=k>3.3&&k<4.1&&Math.floor(k*14)%2;
      if(!blink&&faint<1){const ex=160-48*enterX,ey=40+faint*14;s.fillStyle='#5fae4f';s.beginPath();s.ellipse(ex,ey,11,9*(1-faint*.6),0,0,7);s.fill();s.fillStyle='#3e7e36';s.fillRect(ex-1,ey-14,2,6);s.fillStyle='#7ed16a';s.beginPath();s.ellipse(ex+5,ey-15,6,3,-.6,0,7);s.fill();s.fillStyle='#1a1a1a';s.fillRect(ex-5,ey-3,2,3);s.fillRect(ex+3,ey-3,2,3);}
      // The player's partner, seen from behind above the text box.
      const px=44+Math.sin(t*2)*1,py=66;s.fillStyle='#e8913a';s.beginPath();s.ellipse(px,py,13,12,0,0,7);s.fill();s.fillStyle='#f6c26a';s.fillRect(px-4,py-8,8,6);s.fillStyle='#e8913a';s.beginPath();s.moveTo(px-12,py-8);s.lineTo(px-7,py-20);s.lineTo(px-4,py-8);s.fill();s.beginPath();s.moveTo(px+12,py-8);s.lineTo(px+7,py-20);s.lineTo(px+4,py-8);s.fill();
      s.fillStyle='#ffe066';s.fillRect(px+12,py-4,8,3);s.fillRect(px+18,py-8,3,6);
      if(k>3.1&&k<3.5){s.fillStyle='#fff7a0';let x=px+10,y=py-12;for(let i=0;i<6;i++){const nx=x+10,ny=y-5+(i%2?6:-6);s.fillRect(Math.min(x,nx),Math.min(y,ny),Math.abs(nx-x)+2,2);x=nx;y=ny;}}
      return ()=>{
        const box=(x,y,w,h)=>{o.fillStyle='#f8f8f0';o.fillRect(x,y,w,h);o.strokeStyle='#303030';o.lineWidth=4;o.strokeRect(x+2,y+2,w-4,h-4);};
        const hp=(x,y,v)=>{o.fillStyle='#404040';o.fillRect(x,y,120,10);o.fillStyle=v>.5?'#48c048':v>.2?'#e0c030':'#e04030';o.fillRect(x+2,y+2,116*v,6);};
        o.font="20px 'DotGothic16',monospace";o.textBaseline='top';o.textAlign='left';
        if(faint<1){box(20,18,190,58);o.fillStyle='#202020';o.fillText(T('FOLHINHA')+'  '+T('Nv')+'12',32,26);hp(70,52,hpE);}
        box(270,170,190,64);o.fillStyle='#202020';o.fillText(T('FAÍSCA')+'  '+T('Nv')+'15',282,178);hp(320,204,.86);
        box(10,250,460,100);o.fillStyle='#202020';o.font="24px 'DotGothic16',monospace";
        const text=T(msgs[stage]),shown=text.slice(0,Math.floor((k-start)*30));o.fillText(shown,30,270,420);
      };
    },
    show(s,o,t,prev,ev){
      const beat=Math.floor(t*4),last=Math.floor(prev*4),mel=[392,466,523,466,392,349,392,0,330,392,440,392,349,330,294,0];
      if(beat!==last&&t>prev){const f=mel[beat%16];if(f)ev.push({note:f,dur:.18,type:'square',vol:.035});if(beat%2===0)ev.push({note:98,dur:.2,type:'triangle',vol:.06});}
      s.fillStyle='#0b0814';s.fillRect(0,0,160,120);
      for(let i=0;i<12;i++){const h=6+Math.abs(Math.sin(t*5+i*1.3))*22;s.fillStyle=i%2?'#6b3fa0':'#3f6ba0';s.fillRect(20+i*10,58-h,7,h);}
      s.fillStyle='#1d1530';s.fillRect(0,78,160,42);s.fillStyle='#2c2245';s.fillRect(0,78,160,3);
      for(const [x0,ph,col] of [[30,0,'rgba(255,230,150,.22)'],[130,1.6,'rgba(150,200,255,.2)']]){const a=Math.sin(t*1.2+ph)*.5;s.fillStyle=col;s.beginPath();s.moveTo(x0,0);s.lineTo(80+Math.sin(a)*60-14,84);s.lineTo(80+Math.sin(a)*60+14,84);s.fill();}
      const jump=Math.abs(Math.sin(t*Math.PI*2))*4;s.fillStyle='#120c1c';s.fillRect(76,58-jump,8,18);s.fillRect(77,52-jump,6,6);s.fillRect(84,60-jump,6,2);s.fillStyle='#d8b24a';s.fillRect(89,58-jump,2,2);
      for(let i=0;i<20;i++){const b=Math.abs(Math.sin(t*4+i))*3;s.fillStyle=i%3?'#2a2238':'#352b48';s.beginPath();s.arc(4+i*8,116-b,5,0,7);s.fill();}
      for(let i=0;i<8;i++){const y=(t*30+i*37)%120,x=(i*53+t*10)%160;s.fillStyle=['#f0ce6a','#e05a6a','#6ad0e0'][i%3];s.fillRect(x,y,2,2);}
      return ()=>{if(Math.floor(t*2)%2){o.fillStyle='#e03030';o.beginPath();o.arc(28,28,7,0,7);o.fill();}o.fillStyle='#fff';o.font="22px 'DotGothic16',monospace";o.textAlign='left';o.textBaseline='middle';o.fillText(T('AO VIVO'),42,29);};
    },
    rpg(s,o,t,prev,ev){
      const step=Math.floor(t/.3),last=Math.floor(prev/.3),bass=[110,131,147,165,147,131,123,98];
      if(step!==last&&t>prev){ev.push({note:bass[step%8],dur:.26,type:'triangle',vol:.07});if(step%2)ev.push({noise:.03,freq:2000,vol:.02});}
      s.fillStyle='#c4161c';s.fillRect(0,0,160,120);
      s.fillStyle='#1a0a0c';for(let i=-4;i<12;i++){const x=i*18+((t*24)%18);s.beginPath();s.moveTo(x,0);s.lineTo(x+8,0);s.lineTo(x-22,120);s.lineTo(x-30,120);s.fill();}
      s.fillStyle='#f4f0e6';s.beginPath();s.moveTo(0,70);s.lineTo(160,40);s.lineTo(160,62);s.lineTo(0,96);s.fill();
      const bob=Math.sin(t*2)*1.5;s.fillStyle='#0d0d0d';s.beginPath();s.arc(48,44+bob,12,0,7);s.fill();s.fillRect(36,54+bob,24,40);
      s.fillStyle='#f4f0e6';s.fillRect(42,42+bob,12,2);s.fillRect(44,40+bob,3,6);s.fillRect(50,40+bob,3,6);s.fillStyle='#c4161c';s.fillRect(44,60+bob,8,3);
      return ()=>{
        o.textBaseline='top';o.textAlign='left';o.fillStyle='#f4f0e6';o.font="64px 'DotGothic16',monospace";o.fillText('4/12',20,12);
        o.font="28px 'DotGothic16',monospace";o.fillStyle='#1a0a0c';o.fillRect(180,30,70,34);o.fillStyle='#f4f0e6';o.fillText(T('SEG'),190,34);
        o.font="22px 'DotGothic16',monospace";o.fillStyle='#f4f0e6';o.fillText(T('Depois da aula'),22,84);
        const items=['ATACAR','HABILIDADE','ITENS','GUARDA'],sel=Math.floor(t/1.2)%4;
        items.forEach((it,i)=>{const y=160+i*44,x=270-i*16;o.save();o.translate(x,y);o.rotate(-.12);o.fillStyle=i===sel?'#f4f0e6':'#1a0a0c';o.fillRect(0,0,180,36);o.fillStyle=i===sel?'#c4161c':'#f4f0e6';o.font="24px 'DotGothic16',monospace";o.fillText(T(it),14,6);o.restore();});
      };
    },
    western(s,o,t,prev,ev){
      const gait=Math.floor(t/.125),last=Math.floor(prev/.125);
      if(gait!==last&&t>prev&&gait%4<3)ev.push({noise:.05,freq:450,vol:.07});
      if(crossed(prev,t,1,7))ev.push({chord:[196,247,294]});
      sky(s,[[0,'#3a1d4a'],[.45,'#c4472e'],[.7,'#f2a046'],[1,'#f6c66a']]);
      s.fillStyle='#ffd98a';s.beginPath();s.arc(118,62,16,0,7);s.fill();
      const layer=(speed,y,h,col,step)=>{s.fillStyle=col;s.beginPath();s.moveTo(0,120);const off=(t*speed)%step;for(let x=-step;x<=160+step;x+=step/2){const i=Math.floor((x+off)/(step/2));s.lineTo(x-off,y-((i*53)%h));}s.lineTo(160,120);s.fill();};
      layer(4,74,18,'#7a2d2a',60);layer(12,86,10,'#4a2018',40);
      s.fillStyle='#c98a4a';s.fillRect(0,96,160,24);s.fillStyle='#b5763c';for(let i=0;i<10;i++)s.fillRect((i*29-t*60)%180+(i*29-t*60<0?180:0)-10,100+i%3*6,8,1);
      for(let i=0;i<3;i++){const x=((i*70-t*60)%240+240)%240-40;s.fillStyle='#2e4a24';s.fillRect(x,82,4,16);s.fillRect(x-4,86,4,2);s.fillRect(x-4,84,2,4);s.fillRect(x+4,88,4,2);s.fillRect(x+6,85,2,5);}
      const leg=gait%2,by=Math.abs(Math.sin(t*Math.PI*4))*1.5;s.fillStyle='#1a120e';
      s.fillRect(52,82-by,24,8);s.fillRect(72,76-by,6,8);s.fillRect(76,74-by,6,4);s.fillRect(48,82-by,4,3);
      for(const [x,l] of [[54,leg],[58,1-leg],[68,leg],[72,1-leg]])s.fillRect(x+(l?2:-2),90-by,2,7);
      s.fillRect(60,70-by,6,12);s.fillRect(59,66-by,8,4);s.fillRect(56,64-by,14,2);
      for(let i=0;i<4;i++){const age=(t*3+i/4)%1;s.fillStyle='rgba(210,170,120,'+(.5*(1-age))+')';s.fillRect(46-age*20,94-age*6,3+age*4,3);}
      for(let i=0;i<3;i++){const x=(t*14+i*30)%180-10,y=30+i*6+Math.sin(t*3+i)*2;s.fillStyle='#2a1a2a';s.fillRect(x,y,3,1);s.fillRect(x+3,y-1,3,1);}
      return ()=>{o.textAlign='right';o.textBaseline='bottom';o.fillStyle='rgba(255,240,210,.85)';o.font="20px 'DotGothic16',monospace";o.fillText(T('CAPÍTULO II'),462,350);};
    }
  };
  function snow(s){const img=s.getImageData(0,0,160,120),d=img.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}s.putImageData(img,0,0);}
  function card(o,px,W,H){
    const gr=o.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.55);gr.addColorStop(0,'#17241a');gr.addColorStop(.7,'#080e0a');gr.addColorStop(1,'#080e0a');o.fillStyle=gr;o.fillRect(0,0,W,H);
    o.textAlign='center';o.textBaseline='middle';o.fillStyle='#d8b24a';o.font=Math.round(px)+"px 'DotGothic16',monospace";o.fillText('OKARU',W/2,H/2-px*.25);
    o.fillStyle='#8f9e8f';o.font=Math.max(6,Math.round(px*11/48))+"px 'DotGothic16',monospace";o.fillText('小笠原 光',W/2,H/2+px*.55);
  }
  // Paints the glass: channel or card, plus warm-up, switch-off, tuning snow and on-screen displays.
  function paintScreen(o,s,scene,state,prevT,ev){
    const W=o.canvas.width,H=o.canvas.height,t=state.t/1000,prev=prevT/1000;
    o.imageSmoothingEnabled=false;o.globalAlpha=1;o.fillStyle='#030504';o.fillRect(0,0,W,H);
    if(state.power==='off')return;
    const picture=()=>{
      if(state.tuneT>0){snow(s);o.drawImage(scene,0,0,W,H);return;}
      if(state.card){card(o,state.cardPx,W,H);return;}
      const ch=channels[state.channel],overlay=CH[ch.id](s,o,t,prev,ev);o.drawImage(scene,0,0,W,H);overlay?.();
    };
    if(state.power==='cooling'){
      const p=state.powerT/POWER_OFF;
      if(p<.35){const k=1-p/.35;o.save();o.translate(0,H/2*(1-k));o.scale(1,Math.max(.01,k));picture();o.restore();o.fillStyle='rgba(235,250,225,'+(.8*(1-k))+')';o.fillRect(0,H/2*(1-k),W,H*k);}
      else if(p<.65){const k=1-(p-.35)/.3;o.fillStyle='#eefae4';o.fillRect(W/2*(1-k),H/2-2,W*k,4);}
      else{const k=1-(p-.65)/.35;o.fillStyle='rgba(238,250,228,'+k+')';o.beginPath();o.arc(W/2,H/2,5*k+1,0,7);o.fill();}
      return;
    }
    if(state.power==='warming'){
      const dur=state.enter?.reduced?CALM_ON:POWER_ON,p=state.powerT/dur;
      if(state.enter?.reduced){o.globalAlpha=clamp(p);picture();o.globalAlpha=1;return;}
      o.fillStyle='rgba(97,121,95,'+(.35*clamp(p/.25))+')';o.fillRect(0,0,W,H);
      if(p>=.25&&p<.32){o.fillStyle='#f4fbe9';o.beginPath();o.arc(W/2,H/2,5,0,7);o.fill();}
      else if(p>=.32&&p<.42){const k=(p-.32)/.1;o.fillStyle='#f4fbe9';o.fillRect(W/2*(1-k),H/2-2,W*k,4);}
      else if(p>=.42){
        if(p>=.75){o.globalAlpha=clamp((p-.75)/.15);picture();o.globalAlpha=1;}
        if(p>=.55&&p<.92){snow(s);o.globalAlpha=p<.8?.85:.85*(1-(p-.8)/.12);o.drawImage(scene,0,0,W,H);o.globalAlpha=1;}
        const k=clamp((p-.42)/.16),fade=1-clamp((p-.58)/.14);if(fade>0){o.fillStyle='rgba(240,252,230,'+fade+')';o.fillRect(0,H/2*(1-k),W,H*k);}
      }
      return;
    }
    picture();
    if(state.osdT>0&&!state.card){o.globalAlpha=clamp(state.osdT/300);o.textAlign='right';o.textBaseline='top';o.fillStyle='#86f08f';o.font="34px 'DotGothic16',monospace";o.fillText('CH '+String(state.channel+1).padStart(2,'0'),W-24,72);o.font="18px 'DotGothic16',monospace";o.fillText(T(channels[state.channel].name),W-24,110);o.globalAlpha=1;}
    if(state.volT>0&&!state.card){
      o.globalAlpha=clamp(state.volT/300);const x=W/2-150,y=H-62;o.fillStyle='rgba(0,0,0,.55)';o.fillRect(x-10,y-30,320,56);
      o.fillStyle='#86f08f';o.font="18px 'DotGothic16',monospace";o.textAlign='left';o.textBaseline='top';o.fillText(T('VOLUME'),x,y-26);o.textAlign='right';o.fillText(String(state.volume),x+300,y-26);
      for(let i=0;i<10;i++){o.fillStyle=i<Math.round(state.volShown)?'#86f08f':'#21402a';o.fillRect(x+i*30,y,24,18);}o.globalAlpha=1;
    }
  }

  // ---------- sound ----------
  // The set's own theme, in the portfolio's track format (MIDI notes, lengths in sixteenths): a slow late-night
  // groove over Fmaj7, Em7, Dm7 and G7, with an A7 turnaround. The lead stays between G4 and G5.
  function theme(){
    const ev=Array.from({length:128},()=>[]),put=(step,v)=>ev[step].push(v);
    const bars=[[41,[57,60,64]],[40,[55,59,62]],[38,[53,57,60]],[43,[59,62,65]],[41,[57,60,64]],[40,[55,59,62],45,[61,64,67]],[38,[53,57,60]],[43,[59,62,65]]];
    bars.forEach(([root,chord,root2,chord2],bar)=>{
      const at=bar*16,late=root2??root,fifth=r=>r+7;
      [[0,root,4],[6,fifth(root),2],[8,late,3],[14,late+12,2]].forEach(([s,m,len])=>put(at+s,{m,len,type:'triangle',vol:.12}));
      [[3,chord,2],[6,chord,2],[11,chord2||chord,3]].forEach(([s,notes,len])=>notes.forEach(m=>put(at+s,{m,len,type:'triangle',vol:.028})));
      [0,8].forEach(s=>put(at+s,{drum:'kick',vol:.2}));
      [4,12].forEach(s=>put(at+s,{drum:'rim',vol:.04}));
      [2,6,10,14].forEach(s=>put(at+s,{drum:'hat',vol:.025}));
    });
    [[0,69,3],[3,72,3],[6,76,4],[12,74,2],[14,72,2],[16,74,3],[19,71,3],[22,67,6],[30,69,2],
      [32,69,3],[35,72,3],[38,77,4],[44,76,2],[46,74,2],[48,74,4],[52,71,2],[54,67,2],[56,69,4],[60,71,4],
      [64,72,3],[67,76,3],[70,79,2],[72,76,4],[76,72,4],[80,71,3],[83,74,3],[86,67,2],[88,73,3],[91,76,3],[94,79,2],
      [96,77,4],[100,76,2],[102,74,2],[104,72,4],[108,69,4],[112,71,3],[115,74,3],[118,77,2],[120,74,4],[124,71,4]]
      .forEach(([step,m,len])=>put(step,{m,len,type:'square',vol:.045}));
    return {name:'TV',bpm:96,len:128,ev};
  }
  const tvTheme=theme();
  function createAudio(host){
    let bus=null,mech=null,buf=null,song=null;
    const ctx=()=>{const ac=host.ac?.();return ac&&ac.state==='running'&&host.mix?.()&&host.soundOn?.()?ac:null;};
    const ensure=ac=>{if(!bus||bus.context!==ac){bus=ac.createGain();bus.connect(host.mix());mech=ac.createGain();mech.gain.value=1;mech.connect(host.mix());bus.gain.value=gainFor(host.volume?.()??4);}return bus;};
    const tone=(out,f,dur,type,vol,at=0,to)=>{const ac=ctx();if(!ac)return;ensure(ac);const t0=ac.currentTime+at,o=ac.createOscillator(),gn=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);if(to)o.frequency.exponentialRampToValueAtTime(to,t0+dur);gn.gain.setValueAtTime(.0001,t0);gn.gain.exponentialRampToValueAtTime(vol,t0+.008);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(gn);gn.connect(out==='mech'?mech:bus);o.start(t0);o.stop(t0+dur+.03);};
    const noise=(out,dur,vol,at=0,freq=1200,type='lowpass')=>{const ac=ctx();if(!ac)return;ensure(ac);if(!buf||buf.sampleRate!==ac.sampleRate){buf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
      const t0=ac.currentTime+at,src=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain();src.buffer=buf;fl.type=type;fl.frequency.value=freq;gn.gain.setValueAtTime(vol,t0);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);src.connect(fl);fl.connect(gn);gn.connect(out==='mech'?mech:bus);src.start(t0);src.stop(t0+dur+.03);};
    const sounds={
      switch:()=>{noise('mech',.04,.07,0,900);tone('mech',96,.09,'triangle',.06,0,60);},
      degauss:()=>{tone('bus',60,1.1,'sine',.07,.1,48);tone('bus',120,.9,'triangle',.035,.1,58);noise('bus',.8,.03,.1,260);},
      dot:()=>noise('bus',.025,.03,0,1400,'bandpass'),
      crackle:()=>{for(const t of [0,.09,.23,.31,.46])noise('bus',.018,.024,t,2300,'bandpass');},
      snow:()=>noise('bus',1.0,.032,0,1800,'bandpass'),
      blup:()=>{tone('bus',620,.28,'sine',.12,0,62);tone('bus',150,.22,'triangle',.04,.02,46);tone('bus',74,.38,'sine',.04,.04,40);},
      off:()=>{tone('bus',300,.35,'sine',.06,0,40);noise('bus',.5,.03,0,1200,'bandpass');},
      tune:()=>noise('bus',.3,.035,0,1600,'bandpass'),
      knob:()=>{noise('mech',.015,.05,0,1800,'bandpass');tone('mech',420,.03,'square',.012);},
      vol:()=>tone('bus',520,.06,'square',.035),
      press:()=>{tone('mech',180,.06,'triangle',.05,0,120);noise('mech',.03,.05,0,700);},
      hit:()=>{noise('bus',.08,.09,0,900);tone('bus',110,.08,'square',.04,0,70);},
      fire:()=>{noise('bus',.35,.05,0,700,'bandpass');tone('bus',300,.3,'triangle',.03,0,150);},
      ko:()=>{[392,330,262].forEach((f,i)=>tone('bus',f,.16,'square',.03,i*.15));},
      blip:()=>tone('bus',660,.03,'square',.02),
      zap:()=>{noise('bus',.25,.06,0,2000,'bandpass');tone('bus',600,.2,'square',.025,0,200);},
      faint:()=>tone('bus',440,.4,'triangle',.04,0,110)
    };
    function play(events){
      for(const e of events){
        if(typeof e==='string'){sounds[e]?.();continue;}
        if(e.note)tone('bus',e.note,e.dur||.2,e.type||'square',e.vol||.03);
        else if(e.noise)noise('bus',e.noise,e.vol||.03,0,e.freq||1000,'bandpass');
        else if(e.chord)e.chord.forEach((f,i)=>tone('bus',f,1.2,'triangle',.03,i*.04));
      }
    }
    // The theme is scheduled a little ahead on the set's bus, so the volume knob and the power switch control it.
    // It starts over whenever the set comes back on, and stops for the entry and on channels with their own music.
    function music(state){
      const ac=ctx();
      if(!ac||state.power!=='on'||state.enter||channels[state.channel].score){song=null;return;}
      const spb=60/tvTheme.bpm/4;
      if(!song)song={next:ac.currentTime+.08,step:0};
      if(song.next<ac.currentTime-.3)song.next=ac.currentTime+.05;
      for(let guard=0;song.next<ac.currentTime+.15&&guard<16;guard++){
        const at=Math.max(0,song.next-ac.currentTime);
        for(const e of tvTheme.ev[song.step]){
          if(e.drum==='kick')tone('bus',140,.16,'sine',e.vol,at,42);
          else if(e.drum==='rim')noise('bus',.03,e.vol,at,2600,'bandpass');
          else if(e.drum==='hat')noise('bus',.04,e.vol,at,7000,'highpass');
          else tone('bus',440*Math.pow(2,(e.m-69)/12),e.len*spb,e.type,e.vol,at);
        }
        song.next+=spb;song.step=(song.step+1)%tvTheme.len;
      }
    }
    return {play,music,setVolume(v){const ac=host.ac?.();if(bus&&ac)bus.gain.setTargetAtTime(gainFor(v),ac.currentTime,.05);},destroy(){try{bus?.disconnect();mech?.disconnect();}catch{}bus=mech=song=null;}};
  }
  const gainFor=v=>v<=0?0:Math.pow(v/10,1.6)*.9;

  // ---------- assembly ----------
  // host: {ac, mix, soundOn, unlock, volume, reduced, onChange(state), onEntered()}.
  function create(container,host={}){
    const doc=g.document;if(!doc?.createElement)return null;
    const screen=makeCanvas(480,360),scene=makeCanvas(160,120),sctx=scene.getContext('2d'),octx=screen.getContext('2d');
    if(!sctx||!octx)return null;
    const glCanvas=doc.createElement('canvas');glCanvas.className='tv-gl';glCanvas.setAttribute('role','img');glCanvas.setAttribute('aria-label',T('Televisão 3D: arraste para girar a câmera'));
    container.appendChild(glCanvas);
    const textures=paintTextures({}),state=createState({aspect:(container.clientWidth||16)/(container.clientHeight||10),volume:host.initialVolume??4,channel:0});
    state.cam.dist=state.fit;
    let renderer=createRenderer(glCanvas,screen,textures),refresh=false,hover=null,raf=0,last=0,prevT=0,drag=null,entered=false,dead=false;
    if(!renderer)glCanvas.remove();
    doc.fonts?.load?.("16px 'DotGothic16'").then(()=>{if(!dead){paintTextures(textures);refresh=true;}},()=>{});
    const audio=createAudio({...host,volume:()=>state.volume});
    const changed=()=>host.onChange?.({power:state.power,channel:state.channel,volume:state.volume,channelName:channels[state.channel].name});
    function frame(now){
      if(dead)return;
      const dt=last?Math.min(64,now-last):16;last=now;
      if(renderer){const r=glCanvas.getBoundingClientRect(),aspect=(r.width||1)/(r.height||1);if(Math.abs(aspect-state.aspect)>1e-3){const ratio=state.cam.dist/state.fit;state.aspect=aspect;state.fit=fitDistance(aspect);if(!state.enter)state.cam.dist=state.fit*ratio;}}
      const prev=state.t;step(state,dt);
      const ev=state.events.splice(0);paintScreen(octx,sctx,scene,state,prev,ev);audio.play(ev);audio.music(state);
      if(renderer){renderer.render(state,hover,refresh);refresh=false;}
      if(state.enter?.stage==='done'&&!entered){entered=true;host.onEntered?.();}
      raf=g.requestAnimationFrame(frame);
    }
    raf=g.requestAnimationFrame(frame);
    const ndc=e=>{const r=glCanvas.getBoundingClientRect();return [((e.clientX-r.left)/r.width)*2-1,1-((e.clientY-r.top)/r.height)*2,r.width/r.height];};
    const act=name=>{if(press(state,name)){changed();if(name.startsWith('volume'))audio.setVolume(state.volume);if(name==='enter')host.onEnterRequest?.();}};
    const onDown=e=>{
      host.unlock?.();if(state.enter||e.button>0)return;
      const [x,y,aspect]=ndc(e);drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,control:controlAction(pickPoint(state.cam,aspect,x,y)),t:performance.now()};
      glCanvas.setPointerCapture?.(e.pointerId);state.cam.vy=state.cam.vp=0;
    };
    const onMove=e=>{
      const [x,y,aspect]=ndc(e);
      if(!drag||drag.id!==e.pointerId){const h=state.enter?null:pick(state.cam,aspect,x,y);if(h!==hover){hover=h;glCanvas.style.cursor=h?'pointer':'grab';}return;}
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;
      drag.moved=true;state.dragging=true;glCanvas.style.cursor='grabbing';
      const now=performance.now(),dtm=Math.max(1,now-drag.t),ky=dx*.008,kp=dy*.006;
      state.cam.yaw-=ky;state.cam.pitch=clamp(state.cam.pitch+kp,-1.45,1.45);state.cam.vy=-ky/dtm;state.cam.vp=kp/dtm;
      drag.x=e.clientX;drag.y=e.clientY;drag.t=now;
    };
    const onUp=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      if(!drag.moved&&drag.control)act(drag.control);
      if(drag.moved&&performance.now()-drag.t>80)state.cam.vy=state.cam.vp=0;
      state.dragging=false;drag=null;glCanvas.style.cursor=hover?'pointer':'grab';
    };
    const onWheel=e=>{if(state.enter)return;e.preventDefault();state.cam.dist=clamp(state.cam.dist*Math.exp(e.deltaY*.0012),state.fit*.55,state.fit*1.6);};
    const listeners=[['pointerdown',onDown],['pointermove',onMove],['pointerup',onUp],['pointercancel',onUp],['wheel',onWheel,{passive:false}]];
    if(renderer)for(const [type,fn,opts] of listeners)glCanvas.addEventListener(type,fn,opts);
    changed();
    return {
      gl:!!renderer,screen,state,
      press:act,
      orbit(dyaw,dpitch){if(state.enter)return;state.cam.yaw+=dyaw;state.cam.pitch=clamp(state.cam.pitch+dpitch,-1.45,1.45);},
      enter(opts={}){
        if(!beginEnter(state,opts.reduced||!renderer))return false;
        if(opts.cardPx)state.cardPx=opts.cardPx;
        else if(renderer){const r=glCanvas.getBoundingClientRect(),d=finalDistance(state.aspect),projected=(r.height||1)*screenH/(2*d*TAN);state.cardPx=48*screen.height/projected;}
        return true;
      },
      setCardPx(px){state.cardPx=px;},
      destroy(){dead=true;g.cancelAnimationFrame(raf);for(const [type,fn] of listeners)glCanvas.removeEventListener(type,fn);audio.destroy();renderer?.destroy();glCanvas.remove();screen.remove?.();}
    };
  }
  g.PortfolioTV={channels,layout,createState,step,press,beginEnter,pick,pickPoint,controlAction,hitControl,orbitEye,fitDistance,finalDistance,knobTargets,gainFor,theme:tvTheme,createAudio,create,durations:{POWER_ON,POWER_OFF,CALM_ON,TUNE,ALIGN,DOLLY}};
})(window);
