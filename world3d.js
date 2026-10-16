/* World Lab 3D renderer. Three.js is loaded by index.html. */
(() => {
  "use strict";
  const SCALE = {world:0,continent:1,country:2,city:3,village:4};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let host,renderer,scene,camera,root,terrain,people=[],buildings=[],trees=[],frame=0,raf=0,scaleName="world",zoom=1,worldData=null,raycaster,mouse,baseCameraPosition=null,baseLookY=0;
  const clock={last:0};
  function seeded(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
  function mat(color,roughness=.88,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
  function addMesh(parent,geo,material,x,y,z){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function init(container){
    host=container;
    if(!window.THREE||!host)return false;
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.domElement.className="world3d-canvas";renderer.domElement.setAttribute("aria-label","3D 가상 세계");
      host.appendChild(renderer.domElement);
      scene=new THREE.Scene();scene.background=new THREE.Color("#a7c5d4");scene.fog=new THREE.Fog("#a7c5d4",24,72);
      camera=new THREE.PerspectiveCamera(43,1,.1,180);camera.position.set(0,9,17);
      scene.add(new THREE.HemisphereLight(0xeaf6ff,0x536447,2.0));
      const sun=new THREE.DirectionalLight(0xfff0d7,3.0);sun.position.set(-8,15,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;scene.add(sun);
      root=new THREE.Group();scene.add(root);raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();
      renderer.domElement.addEventListener("click",onClick);
      window.addEventListener("resize",resize);
      setScale("world");resize();animate(0);return true;
    }catch(e){if(renderer){renderer.dispose();renderer.domElement.remove();}renderer=null;return false;}
  }
  function clearRoot(){while(root&&root.children.length){const o=root.children[0];root.remove(o);o.traverse?.(n=>{n.geometry?.dispose?.();if(n.material){if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material.dispose();}});}people=[];buildings=[];trees=[];}
  function ground(size=42,detail=100){
    const geo=new THREE.PlaneGeometry(size,size,detail,detail);geo.rotateX(-Math.PI/2);
    const p=geo.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i);
      let h=(Math.sin(x*.31)*Math.cos(z*.25)+Math.sin((x+z)*.13)*.7)*.22;
      h+=Math.max(0,Math.sin(x*.19+1)*Math.cos(z*.17))*1.3;
      if(scaleName==="continent"||scaleName==="country")h*=1.7;
      p.setY(i,h);
      const moisture=(Math.sin(x*.21+z*.14)+1)/2;
      const c=new THREE.Color().setHSL(.27+moisture*.07,.30+moisture*.20,.24+moisture*.15);
      colors.push(c.r,c.g,c.b);
    }
    geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    const gmat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
    const g=addMesh(root,geo,gmat,0,-.15,0);g.receiveShadow=true;
    const water=addMesh(root,new THREE.PlaneGeometry(size*1.2,size*1.2),mat("#5d9caf",.25),0,-.52,0);water.rotation.x=0;water.receiveShadow=false;
    // Shoreline and layered earth make the terrain read as a real landform.
    const edge=addMesh(root,new THREE.BoxGeometry(size,.8,size),mat("#625744"),0,-.62,0);edge.material.color.set("#625744");
    return g;
  }
  function tree(x,z,s=1){
    const group=new THREE.Group();group.position.set(x,0,z);root.add(group);
    addMesh(group,new THREE.CylinderGeometry(.07*s,.12*s,.65*s,7),mat("#66503a"),0,.32*s,0);
    const green=mat(seeded(Math.round((x+30)*31+(z+30)*7))>.5?"#386b42":"#4c7b46");
    const crown=addMesh(group,new THREE.ConeGeometry(.48*s,.95*s,8),green,0,.95*s,0);
    crown.castShadow=true;trees.push(group);
  }
  function house(x,z,s=1,variant=0){
    const group=new THREE.Group();group.position.set(x,0,z);root.add(group);
    const wall=mat(["#c7b18b","#d6c8a9","#a9b4a7","#c8a08a"][variant%4]);
    const roof=mat(["#874f3e","#635b50","#9a6248","#5f6b70"][variant%4]);
    addMesh(group,new THREE.BoxGeometry(.85*s,.58*s,.72*s),wall,0,.31*s,0);
    const roofGeo=new THREE.ConeGeometry(.67*s,.43*s,4);roofGeo.rotateY(Math.PI/4);
    addMesh(group,roofGeo,roof,0,.79*s,0);
    const door=addMesh(group,new THREE.BoxGeometry(.13*s,.29*s,.025*s),mat("#49382b"),.12*s,.15*s,.37*s);
    door.castShadow=false;
    for(const wx of [-.24,.27]){addMesh(group,new THREE.BoxGeometry(.13*s,.14*s,.025*s),mat("#83b8c5"),wx,.39*s,.372*s).castShadow=false;}
    buildings.push(group);return group;
  }
  function person(c,i,x,z,s=1){
    const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(s);root.add(group);
    const skin=mat(["#b97953","#e0b18a","#8d6049","#d49a70"][i%4]);
    const shirt=mat(["#5c86a8","#c56d58","#6c9b71","#c7a75e","#8c79b2"][i%5]);
    const pants=mat("#344252");const shoes=mat("#252d35");
    addMesh(group,new THREE.SphereGeometry(.115,10,8),skin,0,1.48,0);
    addMesh(group,new THREE.CylinderGeometry(.12,.16,.42,8),shirt,0,1.15,0);
    const armL=new THREE.Group();armL.position.set(-.14,1.3,0);group.add(armL);
    addMesh(armL,new THREE.CylinderGeometry(.035,.045,.34,6),skin,0,-.17,0).rotation.z=-.12;
    const armR=new THREE.Group();armR.position.set(.14,1.3,0);group.add(armR);
    addMesh(armR,new THREE.CylinderGeometry(.035,.045,.34,6),skin,0,-.17,0).rotation.z=.12;
    const legL=new THREE.Group();legL.position.set(-.075,.95,0);group.add(legL);
    addMesh(legL,new THREE.CylinderGeometry(.045,.055,.42,6),pants,0,-.21,0);
    addMesh(legL,new THREE.BoxGeometry(.11,.07,.2),shoes,0,-.43,.045);
    const legR=new THREE.Group();legR.position.set(.075,.95,0);group.add(legR);
    addMesh(legR,new THREE.CylinderGeometry(.045,.055,.42,6),pants,0,-.21,0);
    addMesh(legR,new THREE.BoxGeometry(.11,.07,.2),shoes,0,-.43,.045);
    const shadow=addMesh(group,new THREE.CircleGeometry(.23,12),new THREE.MeshBasicMaterial({color:"#1d2c28",transparent:true,opacity:.28}),0,.015,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
    people.push({group,legL,legR,armL,armR,citizen:c,phase:seeded(i+19)*Math.PI*2,origin:new THREE.Vector3(x,0,z),radius:.4+seeded(i+81)*.9,speed:.4+seeded(i+55)*.6});
  }
  function path(points,color,width=.16,y=.02){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],y,p[1])));
    const mesh=addMesh(root,new THREE.TubeGeometry(curve,Math.max(20,points.length*8),width,5,false),mat(color),0,0,0);mesh.castShadow=false;
  }
  function terrainScene(){
    const level=SCALE[scaleName];const size=scaleName==="world"?54:scaleName==="continent"?42:scaleName==="country"?34:scaleName==="city"?26:19;
    scene.background=new THREE.Color(level<2?"#9bbfd0":level===2?"#a9c6d1":"#b7cbd1");
    scene.fog=new THREE.Fog(scene.background,level<2?35:level===2?27:20,level<2?95:level===2?65:48);
    ground(size,level<2?90:70);
    if(scaleName==="world"){
      // Globe: blue ocean sphere with raised green land masses on its visible hemisphere.
      const globe=new THREE.Group();root.add(globe);
      const ocean=addMesh(globe,new THREE.SphereGeometry(6.3,48,32),mat("#2d7897",.4),0,7,0);
      ocean.material.color.set("#347f9b");
      const landMat=mat("#5c9a65");const land2=mat("#7ba56b");
      const blobs=[[-2.1,8.1,1.35,.8],[-.8,7.1,.65,1.35],[1.1,8.2,1.45,.72],[2.4,7.2,.8,1.1],[.2,6.1,.65,.45]];
      blobs.forEach((b,i)=>{const m=addMesh(globe,new THREE.SphereGeometry(1,20,14),i%2?land2:landMat,b[0],b[1],b[2]);m.scale.set(b[2]*1.5,b[3]*1.2,.13);m.rotation.z=(i-2)*.17;});
      const clouds=mat("#e7f4f4",.9);for(let i=0;i<6;i++){const cloud=addMesh(globe,new THREE.SphereGeometry(.42+seeded(i)*.35,12,8),clouds,-3+i*1.1,9+seeded(i+5)*1.8,.4);cloud.scale.set(1.5,.35,.5);cloud.castShadow=false;}
      globe.rotation.x=-.12;globe.rotation.y=.22;
      camera.position.set(0,10,23);baseCameraPosition=camera.position.clone();baseLookY=6.5;camera.lookAt(0,baseLookY,0);
      for(let i=0;i<18;i++)tree((seeded(i+4)-.5)*size*.8,(seeded(i+18)-.5)*size*.8,.65+seeded(i+24)*.7);
    }else{
      // Broad-scale landscapes include mountain ridges, rivers and forest belts.
      for(let i=0;i<7;i++){
        const x=(i-3)*size*.115,z=-size*.28+seeded(i+40)*size*.12,h=1.4+seeded(i+7)*3;
        const mountain=addMesh(root,new THREE.ConeGeometry(2.2+seeded(i+9)*1.8,h,7),mat(i%2?"#718b88":"#8a9e96"),x,h*.35,z);mountain.scale.z=.8;mountain.rotation.y=seeded(i+8);
        const snow=addMesh(root,new THREE.ConeGeometry(.68+seeded(i)*.4,h*.25,7),mat("#dce5df"),x,h*.85,z);snow.position.y=h*.78;
      }
      path([[-size*.48,-size*.22],[-size*.2,-size*.05],[0,size*.02],[size*.16,size*.17],[size*.45,size*.25]],"#4b9bb7",.22);
      for(let i=0;i<80;i++){const x=(seeded(i+101)-.5)*size*.88,z=(seeded(i+201)-.5)*size*.82;if(Math.abs(x)<size*.18&&Math.abs(z)<size*.15)continue;tree(x,z,.45+seeded(i+301)*.8);}
      if(scaleName==="continent"||scaleName==="country"){
        for(let i=0;i<12;i++)house((seeded(i+500)-.5)*size*.62,(seeded(i+600)-.5)*size*.45,.7+seeded(i+700)*.6,i);
      }
      if(scaleName==="city"||scaleName==="village"){
        // Roads, paved square, varied low-rise buildings and a small civic centre.
        path([[-size*.47,0],[-size*.22,-.05],[0,.08],[size*.23,.03],[size*.48,.12]],"#d8c9a4",.28,.035);
        path([[0,-size*.46],[.1,-size*.22],[0,0],[-.08,size*.22],[.12,size*.45]],"#d8c9a4",.25,.04);
        for(let i=0;i<(scaleName==="city"?34:19);i++){
          const x=(seeded(i+800)-.5)*size*.68,z=(seeded(i+900)-.5)*size*.62;
          if(Math.abs(x)<1.2||Math.abs(z)<1.2)continue;
          const h=.55+seeded(i+1000)*(scaleName==="city"?3.2:1.2),w=.48+seeded(i+1100)*.75;
          const b=addMesh(root,new THREE.BoxGeometry(w,h,w*.8),mat(["#b6b4a4","#c6bda9","#9eafa9","#c7a18d"][i%4]),x,h/2,z);
          const roof=addMesh(root,new THREE.BoxGeometry(w*1.05,.1,w*.85),mat("#5c6364"),x,h+.04,z);b.castShadow=true;
          if(scaleName==="city"&&i%4===0){for(let wy=.4;wy<h-.1;wy+=.42){addMesh(root,new THREE.BoxGeometry(.06,.13,.015),mat("#e4d5a2"),x-w*.2,wy,z+w*.405);addMesh(root,new THREE.BoxGeometry(.06,.13,.015),mat("#e4d5a2"),x+w*.2,wy,z+w*.405);}}
          buildings.push(b);
        }
        for(let i=0;i<5;i++){const x=(i-2)*1.6,z=3+seeded(i+1300)*3;house(x,z,scaleName==="city"?.8:1.15,i);}
        // A park and a plaza provide recognisable city structure.
        const park=addMesh(root,new THREE.BoxGeometry(3,.09,2.5),mat("#47865a"),-size*.29,.03,size*.22);park.castShadow=false;
        for(let i=0;i<7;i++)tree(-size*.29+(seeded(i+1400)-.5)*2.5,size*.22+(seeded(i+1500)-.5)*1.8,.6);
      }
      const citizens=(worldData&&Array.isArray(worldData.citizens))?worldData.citizens:[];
      const count=scaleName==="city"?Math.min(28,citizens.length||18):scaleName==="village"?Math.min(22,citizens.length||12):Math.min(12,citizens.length||8);
      for(let i=0;i<count;i++){
        let x,z;
        if(scaleName==="city"){x=(seeded(i+150)*size*.42);z=(seeded(i+250)-.5)*size*.42;}
        else if(scaleName==="village"){x=(seeded(i+350)-.5)*size*.48;z=(seeded(i+450)-.5)*size*.4;}
        else{x=(seeded(i+550)-.5)*size*.55;z=(seeded(i+650)-.5)*size*.5;}
        if(Math.abs(x)<.8)x+=x<0?-1:1;if(Math.abs(z)<.8)z+=z<0?-1:1;
        person(citizens[i]||{name:"시민 "+(i+1),job:"주민",id:"citizen-"+i},i,x,z,scaleName==="city"?.65:scaleName==="village"?.9:.6);
      }
      camera.position.set(0,scaleName==="city"?15:scaleName==="village"?10:17,scaleName==="city"?17:scaleName==="village"?12:23);baseCameraPosition=camera.position.clone();baseLookY=0;camera.lookAt(0,baseLookY,0);
    }
    if(scaleName==="world"){
      const citizens=(worldData&&Array.isArray(worldData.citizens))?worldData.citizens:[];
      for(let i=0;i<8;i++)person(citizens[i]||{name:"시민 "+(i+1),job:"주민",id:"citizen-"+i},i,(seeded(i+31)-.5)*9,(seeded(i+51)-.5)*7,.38);
    }
    updateCamera();
  }
  function updateCamera(){if(!camera||!baseCameraPosition)return;const s=1/zoom;camera.position.set(baseCameraPosition.x*s,baseCameraPosition.y*s,baseCameraPosition.z*s);camera.lookAt(0,baseLookY,0);}
  function setScale(name){if(!(name in SCALE))return;scaleName=name;zoom=1;if(root){clearRoot();terrainScene();}document.querySelectorAll("[data-scale]").forEach(b=>b.classList.toggle("active",b.dataset.scale===name));}
  function setZoom(value){zoom=clamp(value,.8,5);updateCamera();return zoom;}
  function getZoom(){return zoom;}
  function setWorld(w){worldData=w;if(root){const list=(w&&Array.isArray(w.citizens))?w.citizens:[];people.forEach((p,i)=>{if(list[i])p.citizen=list[i];});}}
  function resize(){if(!renderer||!host)return;const r=host.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
  function onClick(e){if(!renderer||!people.length)return;const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(people.map(p=>p.group),true);if(hits.length){let o=hits[0].object;while(o.parent&& !people.some(p=>p.group===o))o=o.parent;const found=people.find(p=>p.group===o);if(found&&found.citizen&&found.citizen.id){const ev=new CustomEvent("world3dcitizenclick",{detail:{id:found.citizen.id}});window.dispatchEvent(ev);}}}
  function animate(t){raf=requestAnimationFrame(animate);if(!renderer||!scene)return;const dt=Math.min(.05,(t-clock.last)/1000||0);clock.last=t;frame+=dt;people.forEach(p=>{const a=frame*p.speed+p.phase;p.legL.rotation.x=Math.sin(a)*.5;p.legR.rotation.x=-Math.sin(a)*.5;p.armL.rotation.x=-Math.sin(a)*.35;p.armR.rotation.x=Math.sin(a)*.35;p.group.position.x=p.origin.x+Math.sin(a*.25)*p.radius;p.group.position.z=p.origin.z+Math.cos(a*.2)*p.radius*.6;});renderer.render(scene,camera);}
  window.World3D={init,setScale,setZoom,getZoom,setWorld,resize};
})();