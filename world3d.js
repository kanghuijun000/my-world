/* Continuous 3D world, autonomous citizens, settlements and minimap. */
(() => {
  "use strict";
  const WORLD=120, clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let host,renderer,scene,camera,root,people=[],settlements=[],mini,miniCtx,frame=0,clock=0,lastFrameTime=0,zoom=3.2,worldData=null,raycaster,mouse,lookX=0,lookZ=0,dragging=false,lastBuiltTech=-999,lastSettlementSignature="",lastVisualSignature="",weatherActors=[],soldierActors=[],projectileActors=[],epidemicActors=[];
  const mats={};
  function rand(n){const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);}
  function mat(color,roughness=.9,metalness=0){const k=color+"|"+roughness+"|"+metalness;if(!mats[k])mats[k]=new THREE.MeshStandardMaterial({color,roughness,metalness});return mats[k];}
  function mesh(parent,geo,material,x=0,y=0,z=0){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function init(container){
    if(!window.THREE||!container)return false;if(renderer)return true;
    host=container;
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.domElement.className="world3d-canvas";renderer.domElement.setAttribute("aria-label","넓은 3D 가상 세계");
      host.appendChild(renderer.domElement);
      scene=new THREE.Scene();scene.background=new THREE.Color("#b5d2dd");scene.fog=new THREE.Fog("#b5d2dd",65,155);
      camera=new THREE.PerspectiveCamera(48,1,.1,260);
      scene.add(new THREE.HemisphereLight(0xe8f5ff,0x65714d,2.05));
      const sun=new THREE.DirectionalLight(0xffedcf,2.8);sun.position.set(-35,55,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;scene.add(sun);
      root=group(scene);raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();
      makeMinimap();buildWorld();resize();host.parentElement.addEventListener("click",onClick);window.addEventListener("resize",resize);window.addEventListener("orientationchange",()=>setTimeout(resize,180));animate(0);return true;
    }catch(e){console.error("3D world initialization failed:",e);try{renderer?.dispose();renderer?.domElement.remove();}catch(_){}renderer=null;return false;}
  }
  function makeMinimap(){
    const box=document.createElement("div");box.className="world-minimap";
    box.innerHTML='<div class="world-minimap-head"><span>WORLD MAP</span><b id="worldMiniCount">정착지 0</b></div><canvas width="240" height="160" aria-label="세계 미니맵"></canvas><div class="world-minimap-foot"><span><i class="mini-village"></i> 정착지 <i class="mini-city"></i> 도시</span><span>터치 이동</span></div>';
    host.appendChild(box);mini=box.querySelector("canvas");miniCtx=mini.getContext("2d");
    mini.addEventListener("pointerdown",e=>{e.stopPropagation();const r=mini.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*WORLD-WORLD/2;const z=(e.clientY-r.top)/r.height*WORLD-WORLD/2;lookX=clamp(x,-WORLD/2,WORLD/2);lookZ=clamp(z,-WORLD/2,WORLD/2);zoom=Math.max(zoom,2.15);updateCamera();drawMinimap();});
  }
  function clearWorld(){while(root.children.length){const o=root.children[0];root.remove(o);o.traverse?.(n=>{n.geometry?.dispose?.();if(n.material&&!Object.values(mats).includes(n.material)){if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material.dispose();}});}people=[];settlements=[];weatherActors=[];soldierActors=[];projectileActors=[];epidemicActors=[];}
  function heightAt(x,z){return Math.sin(x*.075)*1.6+Math.cos(z*.08)*1.4+Math.sin((x+z)*.04)*2+Math.max(0,Math.sin(x*.035+1)*Math.cos(z*.045))*4;}
  function makeTerrain(){
    const geo=new THREE.PlaneGeometry(WORLD,WORLD,150,150);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,cols=[];
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);let y=heightAt(x,z);p.setY(i,y);
      const d=Math.sqrt((x+12)*(x+12)+(z-8)*(z-8));
      let color;
      if(z<-31&&x>-30){color=new THREE.Color("#d7d2bd");}
      else if(x>25&&z>5){color=new THREE.Color("#c5ad75");}
      else if(d<22){color=new THREE.Color("#6d9b55");}
      else if(z>29){color=new THREE.Color(y>3?"#d7e1dc":"#7c9a66");}
      else if(x<-25){color=new THREE.Color("#779a58");}
      else{color=new THREE.Color("#759f5b");}
      const variation=(rand(i+7)-.5)*.055;color.offsetHSL(0,0,variation);cols.push(color.r,color.g,color.b);
    }
    geo.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
    mesh(root,geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
    // Coastal water and river winding through the central valley.
    mesh(root,new THREE.PlaneGeometry(WORLD+35,WORLD+35),mat("#4b8fa7",.3),0,-3.8,0).rotation.x=-Math.PI/2;
    const riverPts=[];for(let i=0;i<=22;i++){const z=-WORLD/2+i*WORLD/22;riverPts.push(new THREE.Vector3(4+Math.sin(i*.42)*9,heightAt(4+Math.sin(i*.42)*9,z)+.1,z));}
    const river=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(riverPts),120,.65,7,false),mat("#5babc4",.3));river.castShadow=false;root.add(river);
    // Mountain range with snow caps and rocky foothills.
    for(let i=0;i<20;i++){const x=-48+i*4.9,z=-39+Math.sin(i*.62)*5,h=7+rand(i+50)*11;const m=mesh(root,new THREE.ConeGeometry(3.5+rand(i+3)*2,h,7),mat(i%3===0?"#65766f":"#84918a"),x,heightAt(x,z)+h*.42,z);m.rotation.y=rand(i+2);mesh(root,new THREE.ConeGeometry(1.4,h*.28,7),mat("#e0e7e1"),x,heightAt(x,z)+h*.78,z);}
    // Forests in humid belts; scattered scrub in dry lands.
    for(let i=0;i<390;i++){const x=(rand(i+100)-.5)*WORLD,z=(rand(i+300)-.5)*WORLD;if((x>25&&z>5)||(z<-31&&x>-30)||Math.abs(x)<10&&Math.abs(z)<9)continue;const s=.55+rand(i+500)*1.2;tree(x,z,s,rand(i+600)>.3?"forest":"dry");}
    // Distinct natural features make the large world continuous rather than separate map levels.
    for(let i=0;i<16;i++){const x=-53+rand(i+700)*20,z=-20+rand(i+800)*45;const b=mesh(root,new THREE.SphereGeometry(.9+rand(i+900)*1.7,9,7),mat("#8d9b70"),x,heightAt(x,z)+.2,z);b.scale.y=.28;}
    for(let i=0;i<25;i++){const x=25+rand(i+1000)*30,z=8+rand(i+1100)*30;const c=mesh(root,new THREE.ConeGeometry(.5+rand(i+1200)*.8,1.2,7),mat("#b9a05e"),x,heightAt(x,z)+.6,z);c.rotation.z=(rand(i+1300)-.5)*.25;}
  }
  function tree(x,z,s=1,type="forest"){
    const y=heightAt(x,z);const g=group(root,x,y,z);
    mesh(g,new THREE.CylinderGeometry(.09*s,.16*s,.85*s,7),mat("#6b5038"),0,.42*s,0);
    if(type==="forest"){const c=mesh(g,new THREE.ConeGeometry(.58*s,1.55*s,8),mat(rand(Math.round(x*5+z*7))>.5?"#3e7545":"#507f49"),0,1.35*s,0);c.castShadow=true;mesh(g,new THREE.ConeGeometry(.43*s,1.1*s,8),mat("#477c48"),0,1.8*s,0);}
    else{mesh(g,new THREE.SphereGeometry(.5*s,8,6),mat("#8a9c58"),0,.85*s,0).scale.set(1,.65,1);}
  }
  function house(x,z,s=1,style=0){
    const g=group(root,x,heightAt(x,z),z);const wall=mat(["#d6c4a3","#b7c3b6","#d0b49a","#c8c7b8"][style%4]),roof=mat(["#875c46","#565e61","#a66e4e","#65756b"][style%4]);
    mesh(g,new THREE.BoxGeometry(.95*s,.68*s,.85*s),wall,0,.36*s,0);
    const r=mesh(g,new THREE.ConeGeometry(.78*s,.48*s,4),roof,0,.91*s,0);r.rotation.y=Math.PI/4;
    mesh(g,new THREE.BoxGeometry(.15*s,.35*s,.03*s),mat("#4e382a"),.18*s,.18*s,.43*s);
    for(const wx of [-.27,.27])mesh(g,new THREE.BoxGeometry(.15*s,.15*s,.03*s),mat("#9fc8d0"),wx,.42*s,.43*s);
    return g;
  }
  function tallBuilding(x,z,s=1,style=0){
    const h=(1.8+rand(Math.round((x+50)*9+z))*4.5)*s,g=group(root,x,heightAt(x,z),z);
    mesh(g,new THREE.BoxGeometry(1.15*s,h,.95*s),mat(["#a9b7b7","#c3b8a4","#899fa7","#b8a18b"][style%4]),0,h/2,0);
    mesh(g,new THREE.BoxGeometry(1.22*s,.14*s,1.02*s),mat("#59676a"),0,h+.07*s,0);
    for(let y=.6*s;y<h;y+=.62*s)for(let xw of [-.3,.3])mesh(g,new THREE.BoxGeometry(.13*s,.18*s,.025*s),mat("#e5d7a5"),xw,y,.49*s).castShadow=false;
    return g;
  }
  function futureBuilding(x,z,s=1,style=0){
    const h=(5+rand(Math.round(x*4+z))*8)*s,g=group(root,x,heightAt(x,z),z),glass=new THREE.MeshStandardMaterial({color:["#7dcbd4","#8bb8ed","#9ae6dc","#b6d7ff"][style%4],roughness:.22,metalness:.55,emissive:["#123d54","#1c3260","#12483f","#223c62"][style%4],emissiveIntensity:.35});
    mesh(g,new THREE.CylinderGeometry(.48*s,.78*s,h,10),mat("#a6c5cb",.28,.65),0,h/2,0);mesh(g,new THREE.CylinderGeometry(.58*s,.62*s,.22*s,12),glass,0,h*.28,0);mesh(g,new THREE.CylinderGeometry(.55*s,.5*s,.2*s,12),glass,0,h*.62,0);
    mesh(g,new THREE.ConeGeometry(.48*s,1.2*s,8),glass,0,h+.55*s,0);for(let y=1.1*s;y<h;y+=1.35*s){const ring=mesh(g,new THREE.TorusGeometry(.54*s,.045*s,5,20),mat("#63e8f4",.25,.5),0,y,0);ring.rotation.x=Math.PI/2;}
    mesh(g,new THREE.CylinderGeometry(.035*s,.05*s,1.6*s,5),mat("#c8f6ff",.2,.4),0,h+1.25*s,0);mesh(g,new THREE.CylinderGeometry(1.05*s,1.2*s,.25*s,12),mat("#435f73",.35,.5),0,.15*s,0);return g;
  }
  function createSettlement(index,total,tech,data){
    const angle=index*2.39996,dist=10+Math.sqrt(index)*12,x=Number.isFinite(data?.x)?data.x:Math.cos(angle)*dist-7,z=Number.isFinite(data?.z)?data.z:Math.sin(angle)*dist+6;
    const level=Math.max(0,Number.isFinite(data?.level)?data.level:(index===0?Math.max(0,tech):tech>=5?Math.max(2,tech-2):tech>=3?1:0));
    const name=data?.name||(index===0?"첫 정착지":level>=2?"발전 도시 "+index:"정착지 "+(index+1));
    const g=group(root,x,heightAt(x,z),z);const radius=Number.isFinite(data?.radius)?data.radius:(level>=2?7:level===1?4.8:2.7);
    // Cleared land, roads and a central shared place.
    const nationIndex=Math.max(0,(worldData?.nations||[]).findIndex(n=>n.id===data?.nationId));const borderColors=["#d7c36f","#7db9c8","#c98779","#9e8bd1","#8bbd86","#d6a3d0"];const pad=mesh(g,new THREE.CylinderGeometry(radius,radius,.16,28),mat(level>=2?"#8f9d72":"#9c9b78"),0,.06,0);pad.scale.z=.72;pad.castShadow=false;const territory=mesh(g,new THREE.TorusGeometry(radius*.96,.12,5,48),mat(borderColors[nationIndex%borderColors.length]),0,.2,0);territory.rotation.x=Math.PI/2;
    const roadmat=mat("#d8c8a6");
    const road=new THREE.Mesh(new THREE.TorusGeometry(radius*.72,.12,5,32),roadmat);road.rotation.x=Math.PI/2;road.position.y=.17;g.add(road);
    const count=Math.max(3,Math.min(30,Math.round(radius*2.2)));
    if(level<=0){for(let b=0;b<count;b++){const a=b*Math.PI*2/count;house(x+Math.cos(a)*radius*.58,z+Math.sin(a)*radius*.48,1,b);}}
    else if(level<=2){for(let b=0;b<count;b++){const a=b*Math.PI*2/count;house(x+Math.cos(a)*radius*.65,z+Math.sin(a)*radius*.55,level===2?.95:.8,b);}}
    else if(tech<7){for(let b=0;b<count+8;b++){const a=b*Math.PI*2/(count+8),bx=x+Math.cos(a)*(radius*.55+rand(b+index)*2),bz=z+Math.sin(a)*(radius*.48+rand(b+index+50)*2);tallBuilding(bx,bz,.75+rand(b+index+80)*.65,b);}}
    else{for(let b=0;b<count+10;b++){const a=b*Math.PI*2/(count+10),r=radius*(.35+rand(b+index+40)*.48),bx=x+Math.cos(a)*r,bz=z+Math.sin(a)*r;futureBuilding(bx,bz,.7+rand(b+index+80)*.65,b);}
      for(let b=0;b<3;b++){const a=b*Math.PI*2/3,bx=x+Math.cos(a)*radius*.28,bz=z+Math.sin(a)*radius*.28;const dome=mesh(g,new THREE.SphereGeometry(1.3,14,9,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:"#7fe3ee",transparent:true,opacity:.65,metalness:.4,roughness:.18,emissive:"#1d8393",emissiveIntensity:.35}),bx-x,1.05,bz-z);dome.scale.set(1.1,.75,1.1);}
      for(let b=0;b<2;b++){const bridge=mesh(g,new THREE.BoxGeometry(radius*1.35,.12,.28),mat("#64e4ed",.25,.5),0,3+b*2,0);bridge.rotation.y=b*Math.PI/2;}}
    // A communal fire/market square anchors settlement life.
    const square=mesh(g,new THREE.CylinderGeometry(.65,.65,.14,12),mat("#c3ad83"),0,.2,0);
    if(level===0){const fire=mesh(g,new THREE.ConeGeometry(.23,.62,7),mat("#e87837"),0,.58,0);fire.rotation.z=.08;}
    const hit=mesh(g,new THREE.CircleGeometry(radius,32),new THREE.MeshBasicMaterial({color:"#ffffff",transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}),0,.24,0);hit.rotation.x=-Math.PI/2;
    return {id:data?.id||("settlement-"+index),x,z,level,radius,name,group:g,data};
  }
  function createPerson(c,i,x,z){
    const g=group(root,x,heightAt(x,z),z),tech=Number.isFinite(worldData?.techIndex)?worldData.techIndex:-1;
    if(Number(c.age)<13)g.scale.setScalar(.72);else if(Number(c.age)<18)g.scale.setScalar(.88);
    const skin=mat(["#b97953","#e0b18a","#8d6049","#d49a70"][i%4]);
    const primitive=tech<=0,earlyFarm=tech===1,iron=tech===2,modern=tech>=5;
    const cloth=mat(primitive?["#806044","#a17b54","#6e513e"][i%3]:earlyFarm?["#a88a61","#7f9b68","#a98f79"][i%3]:iron?["#8a765e","#6d7774","#9c8b70"][i%3]:["#557fa4","#bd6b55","#68976d","#c3a456","#8c79b2","#4f9692"][i%6]);
    const pants=mat(primitive?"#72563f":earlyFarm?"#8d785c":iron?"#555b5b":modern?"#354150":"#6f6557"),shoe=mat(primitive?"#654a36":"#252d35");
    mesh(g,new THREE.SphereGeometry(.14,12,9),skin,0,1.52,0);
    if(primitive){mesh(g,new THREE.ConeGeometry(.22,.48,7),cloth,0,1.13,0);mesh(g,new THREE.BoxGeometry(.13,.13,.025),mat("#d2b58b"),0,1.3,.15);}
    else{mesh(g,new THREE.CylinderGeometry(.12,.18,.48,9),cloth,0,1.18,0);if(earlyFarm){const wrap=mesh(g,new THREE.BoxGeometry(.25,.08,.22),mat("#b8a17b"),0,1.35,0);wrap.rotation.z=-.2;}if(iron){mesh(g,new THREE.BoxGeometry(.29,.25,.22),mat("#7d827d"),0,1.23,.02);}}
    const armL=group(g,-.16,1.37,0),armR=group(g,.16,1.37,0);
    mesh(armL,new THREE.CylinderGeometry(.045,.055,.39,7),primitive?skin:cloth,0,-.19,0).rotation.z=-.12;
    mesh(armR,new THREE.CylinderGeometry(.045,.055,.39,7),primitive?skin:cloth,0,-.19,0).rotation.z=.12;
    const legL=group(g,-.075,.94,0),legR=group(g,.075,.94,0);
    mesh(legL,new THREE.CylinderGeometry(.05,.06,.43,7),primitive?skin:pants,0,-.21,0);mesh(legR,new THREE.CylinderGeometry(.05,.06,.43,7),primitive?skin:pants,0,-.21,0);
    if(!primitive){mesh(legL,new THREE.BoxGeometry(.12,.075,.22),shoe,0,-.44,.05);mesh(legR,new THREE.BoxGeometry(.12,.075,.22),shoe,0,-.44,.05);}
    if(modern){mesh(g,new THREE.BoxGeometry(.035,.3,.035),mat("#d7dce0"),-.18,1.35,.03);}
    const halo=mesh(g,new THREE.CircleGeometry(.26,12),new THREE.MeshBasicMaterial({color:"#23302b",transparent:true,opacity:.22}),0,.02,0);halo.rotation.x=-Math.PI/2;halo.castShadow=false;
    const near=settlements.slice().sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
    const angle=rand(i+9)*Math.PI*2,rad=near?near.radius*.45:5;
    return {group:g,legL,legR,armL,armR,citizen:c,phase:rand(i+19)*Math.PI*2,speed:.5+rand(i+55)*.55,originX:x,originZ:z,targetX:x,targetZ:z,decision:0,nearby:null,chat:0,home:near,walkRadius:rad};
  }
  function buildWorld(){
    clearWorld();makeTerrain();
    const w=worldData||{},pop=Array.isArray(w.citizens)?w.citizens.length:12,tech=Math.max(0,w.techIndex||0);lastBuiltTech=Number.isFinite(w.techIndex)?w.techIndex:-1;
    const data=Array.isArray(w.settlementData)?w.settlementData.filter(a=>a.alive!==false):[];
    const settlementCount=clamp(data.length||Math.max(1,w.settlements||1,Math.floor(pop/18)+1,tech>=3?2:1),1,8);
    for(let i=0;i<settlementCount;i++)settlements.push(createSettlement(i,settlementCount,tech,data[i]));
    const citizens=Array.isArray(w.citizens)?w.citizens:[];
    const n=clamp(citizens.length,0,60);
    for(let i=0;i<n;i++){
      const c=citizens[i]||{id:"citizen-"+i,name:"시민 "+(i+1),trait:"주민",job:"주민"};
      const home=settlements.find(s=>s.id===c.homeSettlementId)||settlements[i%settlements.length],a=rand(i+500)*Math.PI*2,d=rand(i+600)*home.radius*.85;
      people.push(createPerson(c,i,home.x+Math.cos(a)*d,home.z+Math.sin(a)*d));
    }
    // Natural landmarks remain spread over one continuous map; no zoom-level swapping.
    const lake=mesh(root,new THREE.CircleGeometry(7,40),mat("#4b9db4",.25),-27,heightAt(-27,17)+.1,17);lake.rotation.x=-Math.PI/2;lake.scale.set(1,.75,1);
    for(let i=0;i<13;i++){const x=-42+rand(i+1500)*84,z=-38+rand(i+1600)*76;const rock=mesh(root,new THREE.DodecahedronGeometry(.5+rand(i+1700)*1.3),mat("#858e83"),x,heightAt(x,z)+.4,z);rock.scale.y=.6;}
    lastSettlementSignature=JSON.stringify((w.settlementData||[]).filter(a=>a.alive!==false).map(a=>[a.id,a.radius,a.level,a.population,a.nationId]));
    createWeatherEffects(w);createWarEffects(w);createEpidemicEffects(w);lastVisualSignature=visualSignature(w);
    if(!Number.isFinite(lookX)||!Number.isFinite(lookZ)){lookX=0;lookZ=0;}updateCamera();drawMinimap();
  }
  function visualSignature(w){return JSON.stringify({weather:w?.weather||"clear",epidemic:w?.epidemic?.active?w.epidemic.name:"",wars:(w?.wars||[]).map(x=>[x.id,x.active,x.visualAction&&Date.now()-Number(x.visualAction.at||0)<14000?x.visualAction.at:0])});}
  function createWeatherEffects(w){
    const type=w?.weather||"clear";scene.background=new THREE.Color("#b5d2dd");scene.fog.color=new THREE.Color("#b5d2dd");if(type==="clear"||type==="drought")return;
    const storm=type==="storm",snow=type==="snow",count=snow?42:storm?80:58;
    for(let i=0;i<count;i++){let obj;if(snow){obj=mesh(root,new THREE.SphereGeometry(.07+rand(i+4)*.07,6,5),new THREE.MeshStandardMaterial({color:"#f4fbff",roughness:.8}),(rand(i+2)-.5)*WORLD,8+rand(i+3)*35,(rand(i+8)-.5)*WORLD);weatherActors.push({obj,speed:1.2+rand(i+5)*1.8,snow:true,phase:rand(i+7)*6});}
      else{obj=mesh(root,new THREE.CylinderGeometry(storm?.025:.012,storm?.025:.012,storm?1.2:.75,4),new THREE.MeshBasicMaterial({color:storm?"#91a9ba":"#8dd7f1",transparent:true,opacity:storm?.5:.38}),(rand(i+2)-.5)*WORLD,8+rand(i+3)*40,(rand(i+8)-.5)*WORLD);obj.rotation.z=storm?-.25:.08;weatherActors.push({obj,speed:storm?18:12,snow:false,phase:rand(i+7)*6});}}
    scene.background.set(storm?"#8395a7":snow?"#c7d6dd":"#9fbecb");scene.fog.color.copy(scene.background);
  }
  function createWarEffects(w){
    (w?.wars||[]).filter(x=>x.visualAction&&Date.now()-Number(x.visualAction.at||0)<14000).forEach(wr=>{const v=wr.visualAction,from=v.from,to=v.to;if(!from||!to)return;
      if(v.type==="projectile"){for(let i=0;i<2;i++){const m=mesh(root,new THREE.ConeGeometry(.16,.8,7),new THREE.MeshStandardMaterial({color:"#e2e8ee",metalness:.65,roughness:.25,emissive:"#ff6b32",emissiveIntensity:.5}),from.x,3+i*.35,from.z);m.rotation.x=Math.PI/2;projectileActors.push({obj:m,from,to,start:clock+i*.28,duration:2.4});}}
      else{for(let i=0;i<5;i++){const a=i*Math.PI*2/5,c={id:"soldier-"+wr.id+"-"+i,name:"병사",age:25,job:"군인",trait:"훈련된",icon:"🪖"},p=createPerson(c,100+i,from.x+Math.cos(a)*2.3,from.z+Math.sin(a)*2.3);mesh(p.group,new THREE.BoxGeometry(.3,.38,.26),mat("#455a64"),0,1.2,.02);mesh(p.group,new THREE.BoxGeometry(.5,.08,.08),mat("#242d34"),.25,1.28,.1);p.targetX=to.x+(Math.random()-.5)*to.radius;p.targetZ=to.z+(Math.random()-.5)*to.radius;p.speed=2.2;p.decision=20;soldierActors.push(p);}}
    });
  }
  function createEpidemicEffects(w){
    if(!w?.epidemic?.active)return;const ids=[...new Set((w.citizens||[]).filter(c=>c.infected).map(c=>c.homeSettlementId))].slice(0,6);
    ids.forEach((id,i)=>{const a=settlements.find(x=>x.id===id);if(!a)return;const ring=mesh(root,new THREE.TorusGeometry(a.radius*.65,.16,6,24),new THREE.MeshBasicMaterial({color:"#8a66c9",transparent:true,opacity:.62}),a.x,heightAt(a.x,a.z)+.35,a.z);ring.rotation.x=Math.PI/2;epidemicActors.push({obj:ring,phase:i});});
  }
  function updateCamera(){if(!camera)return;const distance=42/zoom;camera.position.set(lookX+distance*.18,1.0+distance*.82,lookZ+distance*.58);camera.lookAt(lookX,1.8,lookZ);scene.fog.near=42/Math.sqrt(zoom);scene.fog.far=190/Math.sqrt(zoom);}
  function setZoom(v){zoom=clamp(v,.55,4.8);updateCamera();drawMinimap();return zoom;}
  function pan(dx,dy){const scale=34/zoom/Math.max(250,host?.clientHeight||500);lookX=clamp(lookX-dx*scale,-WORLD*.48,WORLD*.48);lookZ=clamp(lookZ-dy*scale,-WORLD*.48,WORLD*.48);updateCamera();drawMinimap();}
  function setScale(){/* Intentionally no separate world/country/city modes: one continuous world. */}
  function setWorld(w){worldData=w;if(root){const n=(w&&Array.isArray(w.citizens))?w.citizens.length:12,ds=Array.isArray(w?.settlementData)?w.settlementData.filter(a=>a.alive!==false):[],dc=ds.length,signature=JSON.stringify(ds.map(a=>[a.id,a.radius,a.level,a.population,a.nationId])),expected=clamp(n,0,60);if(people.length!==expected||lastBuiltTech!==(Number.isFinite(w.techIndex)?w.techIndex:-1)||settlements.length!==clamp(dc||Math.max(1,w.settlements||1,Math.floor(n/18)+1,(w.techIndex||0)>=3?2:1),1,8)||signature!==lastSettlementSignature||visualSignature(w)!==lastVisualSignature){buildWorld();return;}people.forEach((p,i)=>{if(w.citizens[i])p.citizen=w.citizens[i];});drawMinimap();}}
  function resize(){if(!renderer||!host||!camera)return;const r=host.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));renderer.setSize(Math.round(r.width),Math.round(r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();updateCamera();}
  function onClick(e){if(!renderer||e.target!==renderer.domElement)return;const rect=renderer.domElement.getBoundingClientRect();mouse.x=(e.clientX-rect.left)/rect.width*2-1;mouse.y=-(e.clientY-rect.top)/rect.height*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects([...people.map(p=>p.group),...settlements.map(p=>p.group)],true);if(!hits.length){window.dispatchEvent(new CustomEvent("world3dsettlementclear"));return;}let o=hits[0].object;while(o.parent&&!people.some(p=>p.group===o)&&!settlements.some(p=>p.group===o))o=o.parent;const p=people.find(p=>p.group===o);if(p?.citizen?.id){window.dispatchEvent(new CustomEvent("world3dcitizenclick",{detail:{id:p.citizen.id}}));return;}const a=settlements.find(p=>p.group===o);if(a?.id)window.dispatchEvent(new CustomEvent("world3dsettlementclick",{detail:{id:a.id}}));}
  function focusCitizen(id){const p=people.find(x=>x.citizen&&x.citizen.id===id);if(!p)return;lookX=p.group.position.x;lookZ=p.group.position.z;zoom=Math.max(zoom,3.1);updateCamera();drawMinimap();}
  function drawMinimap(){
    if(!miniCtx)return;const ctx=miniCtx,w=mini.width,h=mini.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#203c3d";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#6f9860";ctx.beginPath();ctx.ellipse(112,80,102,71,-.12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#557f49";ctx.beginPath();ctx.ellipse(65,78,43,57,-.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d2c59c";ctx.beginPath();ctx.ellipse(112,43,45,19,-.1,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9eb6bd";ctx.beginPath();ctx.ellipse(55,111,22,12,.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#c7b27b";ctx.beginPath();ctx.ellipse(194,106,37,28,.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#d6d7c4";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(240,0);ctx.lineTo(240,20);ctx.lineTo(160,14);ctx.lineTo(80,25);ctx.lineTo(0,18);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#58a8c4";ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<20;i++){const x=86+Math.sin(i*.38)*25,z=i*8;if(i===0)ctx.moveTo(x,z);else ctx.lineTo(x,z);}ctx.stroke();
    settlements.forEach((s,i)=>{const x=(s.x+WORLD/2)/WORLD*w,y=(s.z+WORLD/2)/WORLD*h;ctx.fillStyle=s.level>=2?"#ffcf75":s.level===1?"#e6e7b5":"#ffffff";ctx.beginPath();ctx.arc(x,y,s.level>=2?4.5:3.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#23302b";ctx.lineWidth=1;ctx.stroke();});
    const size=clamp(34/zoom/WORLD*w,14,95),cx=(lookX+WORLD/2)/WORLD*w,cy=(lookZ+WORLD/2)/WORLD*h;ctx.strokeStyle="#f4fbff";ctx.lineWidth=1.5;ctx.strokeRect(clamp(cx-size/2,0,w-size),clamp(cy-size/2,0,h-size),size,size);
    const label=host.querySelector("#worldMiniCount");if(label)label.textContent="정착지 "+settlements.length;
  }
  function socialStep(p,dt){
    p.decision-=dt;
    if(p.decision<=0){
      p.decision=2.5+Math.random()*5;
      const nearby=people.filter(q=>q!==p&&Math.hypot(q.group.position.x-p.group.position.x,q.group.position.z-p.group.position.z)<12);
      if(settlements.length>1&&Math.random()<.08)p.home=settlements[Math.floor(Math.random()*settlements.length)];
      if(nearby.length&&Math.random()<.62){const other=nearby[Math.floor(Math.random()*nearby.length)];p.nearby=other;p.chat=2.5+Math.random()*2;p.targetX=other.group.position.x+(Math.random()-.5)*1.8;p.targetZ=other.group.position.z+(Math.random()-.5)*1.8;}
      else{p.nearby=null;p.chat=0;const s=p.home||settlements[0],a=Math.random()*Math.PI*2,d=Math.random()*(s?s.radius*1.4:8);p.targetX=clamp((s?s.x:0)+Math.cos(a)*d,-WORLD/2+3,WORLD/2-3);p.targetZ=clamp((s?s.z:0)+Math.sin(a)*d,-WORLD/2+3,WORLD/2-3);}
    }
    const dx=p.targetX-p.group.position.x,dz=p.targetZ-p.group.position.z,d=Math.hypot(dx,dz);
    if(d>.12){const step=Math.min(d,p.speed*dt*1.5);p.group.position.x+=dx/d*step;p.group.position.z+=dz/d*step;p.group.rotation.y=Math.atan2(dx,dz);const a=clock*p.speed*7+p.phase;p.legL.rotation.x=Math.sin(a)*.55;p.legR.rotation.x=-Math.sin(a)*.55;p.armL.rotation.x=-Math.sin(a)*.32;p.armR.rotation.x=Math.sin(a)*.32;}
    else{p.legL.rotation.x*=.7;p.legR.rotation.x*=.7;p.armL.rotation.x=Math.sin(clock*3+p.phase)*.12;p.armR.rotation.x=-Math.sin(clock*3+p.phase)*.12;}
    p.group.position.y=heightAt(p.group.position.x,p.group.position.z);
    if(p.chat>0){p.chat-=dt;if(p.nearby){p.group.lookAt(p.nearby.group.position.x,p.group.position.y+1,p.nearby.group.position.z);}}
  }
  function animate(t){
    requestAnimationFrame(animate);const dt=Math.min(.04,Math.max(0,(t-lastFrameTime)/1000));lastFrameTime=t;clock+=dt;if(!renderer||!scene||!camera)return;
    try{people.forEach(p=>socialStep(p,dt));soldierActors.forEach(p=>socialStep(p,dt));
      weatherActors.forEach(a=>{a.obj.position.y-=a.speed*dt;if(a.snow){a.obj.position.x+=Math.sin(clock+a.phase)*dt*.8;a.obj.rotation.z+=dt*.3;}if(a.obj.position.y<.4){a.obj.position.y=8+Math.random()*35;a.obj.position.x=(Math.random()-.5)*WORLD;a.obj.position.z=(Math.random()-.5)*WORLD;}});
      projectileActors.forEach(a=>{const p=clamp((clock-a.start)/a.duration,0,1);a.obj.position.set(a.from.x+(a.to.x-a.from.x)*p,3+Math.sin(p*Math.PI)*10,a.from.z+(a.to.z-a.from.z)*p);a.obj.rotation.z=Math.atan2(a.to.x-a.from.x,a.to.z-a.from.z);a.obj.visible=p<1;});
      epidemicActors.forEach(a=>{const scale=1+Math.sin(clock*2+a.phase)*.12;a.obj.scale.set(scale,scale,scale);});renderer.render(scene,camera);
    }catch(e){console.error("3D world render failed:",e);}
  }
  window.World3D={init,setScale,setZoom,getZoom:()=>zoom,setWorld,pan,resize,focusCitizen};
})();