(() => {
  "use strict";
  const STORAGE_KEY = "my-world-data-v1";
  const $ = (id) => document.getElementById(id);
  const levelNames = {world:"행성 전체",continent:"대륙",country:"국가",city:"도시",village:"마을"};
  const techStages = [
    {name:"불의 활용",label:"불의 시대",need:5,icon:"🔥",desc:"불을 다루는 법을 익혔습니다."},
    {name:"농경의 시작",label:"신석기 시대",need:20,icon:"🌾",desc:"식량을 재배하며 정착 생활이 시작됩니다."},
    {name:"금속 가공",label:"청동·철기 시대",need:48,icon:"⚒️",desc:"금속 도구가 생산과 건축을 바꿉니다."},
    {name:"문자의 발명",label:"초기 문명",need:85,icon:"📜",desc:"지식과 역사를 기록으로 남기기 시작합니다."},
    {name:"과학 혁명",label:"과학의 시대",need:140,icon:"🔭",desc:"관찰과 실험이 새로운 지식의 기반이 됩니다."},
    {name:"산업 혁명",label:"산업 시대",need:210,icon:"⚙️",desc:"기계와 공장이 생산 방식을 바꿉니다."},
    {name:"전기의 발견",label:"전기 시대",need:300,icon:"⚡",desc:"전기의 원리를 이해하기 시작했습니다. 전력망과 전등의 보급은 별도의 발전 과정이 필요합니다."},
    {name:"디지털 시대",label:"디지털 시대",need:410,icon:"💻",desc:"정보를 빠르게 기록하고 전달하는 기술이 등장합니다."}
  ];
  const achievementDefs = [
    {id:"birth",name:"창조주의 첫걸음",desc:"첫 번째 세계를 만드세요.",icon:"🌌",test:w=>true},
    {id:"people25",name:"작은 공동체",desc:"인구 25명에 도달하세요.",icon:"♟",test:w=>w.population>=25},
    {id:"people50",name:"북적이는 세상",desc:"인구 50명에 도달하세요.",icon:"🏘️",test:w=>w.population>=50},
    {id:"village",name:"정착의 시작",desc:"첫 마을을 형성하세요.",icon:"🏡",test:w=>w.settlements>=2},
    {id:"fire",name:"불을 다루는 자",desc:"불의 활용법을 발견하세요.",icon:"🔥",test:w=>w.techIndex>=0},
    {id:"farming",name:"씨앗의 약속",desc:"농경 기술을 발견하세요.",icon:"🌾",test:w=>w.techIndex>=1},
    {id:"science",name:"질문의 힘",desc:"과학 혁명에 도달하세요.",icon:"🔭",test:w=>w.techIndex>=4},
    {id:"electric",name:"밝아지는 미래",desc:"전기의 원리를 발견하세요.",icon:"⚡",test:w=>w.techIndex>=6}
  ];
  const firstNames = ["하린","도윤","서아","지호","유나","민준","시온","하윤","은우","서윤","이안","채원","지안","연우","수아","태오","다온","라온","준서","예린","가온","현우","소율","시우","아린","로운","나윤","건우","유진","민서"];
  const traits = ["호기심 많은","신중한","낙천적인","끈기 있는","관찰력이 뛰어난","상상력이 풍부한","협동적인","독립적인","차분한","모험을 좋아하는"];
  const jobs = ["채집가","사냥꾼","건축가","치유사","탐험가","농부","기록가","연구자","장인","교역가"];
  const icons = ["🧑‍🌾","🧑‍🔬","🧑‍🎨","🧑‍🏫","🧑‍🔧","🧑‍🚀","🧑‍⚕️","🧑‍🍳","🧑‍🌾","🧑‍💼"];
  let worlds = loadWorlds();
  let activeId = null;
  let activeFilter = "all";
  let activeScale = "world";
  let toastTimer = null;
  let tickTimer = null;

  function uid(){ return "w-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8); }
  function citizenId(){ return "c-" + Math.random().toString(36).slice(2,10); }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function esc(value){ return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function newCitizen(jobType){
    const job = jobType && jobType !== "random" && jobType !== "custom" ? jobType : pick(jobs);
    return {id:citizenId(),name:pick(firstNames)+pick(["","", "",""]),age:Math.floor(18+Math.random()*43),trait:pick(traits),job,skill:Math.floor(1+Math.random()*5),memory:["세상의 첫날을 기억합니다."],relations:Math.floor(Math.random()*4),icon:pick(icons)};
  }
  function makeWorld(name){
    const w={id:uid(),name:name.trim(),createdAt:Date.now(),elapsedDays:0,paused:false,speed:1,population:12,settlements:1,techIndex:-1,research:0,environment:100,food:100,resources:100,gravity:9.8,temperature:15,oxygen:21,events:[],reactions:[],citizens:[],achievements:[],filter:"all",manualResearch:0};
    for(let i=0;i<w.population;i++)w.citizens.push(newCitizen());
    addEvent(w,"세계의 탄생","새로운 세계가 모습을 드러냈습니다. 아직 모든 것이 시작 단계입니다.","🌍","system");
    addReaction(w,"positive","하린","호기심 많은","여긴 어떤 곳일까? 우리만의 이야기가 시작되겠지!","세계의 탄생");
    unlockAchievements(w);
    return w;
  }
  function loadWorlds(){
    try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");if(Array.isArray(parsed))return parsed.map(normalizeWorld).filter(Boolean).slice(0,10);}catch(e){}
    return [];
  }
  function normalizeWorld(w){
    if(!w||!w.id||!w.name)return null;
    w.elapsedDays=Number(w.elapsedDays)||0;w.population=Math.max(0,Number(w.population)||0);w.settlements=Math.max(1,Number(w.settlements)||1);
    w.speed=Math.max(1,Math.min(100,Number(w.speed)||1));w.techIndex=Number.isFinite(w.techIndex)?w.techIndex:-1;
    w.research=Number(w.research)||0;w.environment=Math.max(0,Math.min(100,Number(w.environment??100)));w.food=Math.max(0,Number(w.food??100));w.resources=Math.max(0,Number(w.resources??100));
    w.gravity=Number(w.gravity??9.8);w.temperature=Number(w.temperature??15);w.oxygen=Number(w.oxygen??21);
    w.events=Array.isArray(w.events)?w.events:[];w.reactions=Array.isArray(w.reactions)?w.reactions:[];w.citizens=Array.isArray(w.citizens)?w.citizens:[];w.achievements=Array.isArray(w.achievements)?w.achievements:[];
    w.paused=!!w.paused;w.manualResearch=Number(w.manualResearch)||0;
    return w;
  }
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(worlds));$("saveStatus").innerHTML="<i></i> 자동 저장";}catch(e){$("saveStatus").innerHTML="<i style='background:#ff8291'></i> 저장 공간 확인";}
  }
  function activeWorld(){return worlds.find(w=>w.id===activeId)||null;}
  function showToast(message,achievement=false){
    const t=$("toast");t.textContent=message;t.classList.toggle("achievement-toast",achievement);t.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600);
  }
  function addEvent(w,title,description,icon="✨",category="discovery"){
    w.events.unshift({id:uid(),title,description,icon,category,day:Math.floor(w.elapsedDays)+1,year:worldYearNumber(w)});
    if(w.events.length>80)w.events.length=80;
  }
  function addReaction(w,sentiment,name,trait,text,eventTitle){
    w.reactions.unshift({id:uid(),sentiment,name,trait,text,eventTitle,day:Math.floor(w.elapsedDays)+1});
    if(w.reactions.length>60)w.reactions.length=60;
  }
  function reactToEvent(w,title,kind){
    const people=w.citizens.slice(0,Math.min(3,w.citizens.length));
    if(!people.length)return;
    const lines={
      discovery:["대단해! 우리 삶이 조금 달라질지도 몰라.","이걸 어떻게 알아냈을까? 더 자세히 살펴보고 싶어.","다음에는 또 어떤 발견이 기다릴까?"],
      people:["새로운 이웃이 왔네. 함께 살아갈 방법을 찾아야겠어.","사람이 늘었으니 먹을거리와 집도 더 필요하겠지."],
      nature:["주변 환경이 달라지고 있어. 우리 생활도 살펴봐야겠어.","자연이 보내는 신호를 무시하면 안 될 것 같아."],
      village:["함께 모여 살면 서로 도울 수 있겠어!","새로운 집과 길이 생기면 생활이 편해지겠지."],
      science:["기록하고 실험하면 더 많은 걸 알 수 있겠어.","아직 모르는 것이 많아. 다음 연구를 시작하자!"],
      system:["오늘도 새로운 하루가 시작됐어.","이 세계에는 아직 발견할 것이 많아."]
    };
    people.forEach((c,i)=>addReaction(w,kind==="nature"?"negative":"positive",c.name,c.trait,pick(lines[kind]||lines.system),title));
  }
  function unlockAchievements(w){
    for(const a of achievementDefs){
      if(!w.achievements.includes(a.id)&&a.test(w)){
        w.achievements.push(a.id);
        addEvent(w,"도전과제 달성: "+a.name,"기록에 새로운 이정표가 추가되었습니다.",a.icon,"achievement");
        if(activeId===w.id)showToast("🏆 도전과제 달성: "+a.name,true);
      }
    }
  }
  function worldYearNumber(w){return -10000+Math.floor(w.elapsedDays/365);}
  function formatYear(w){
    const y=worldYearNumber(w);
    if(y<0)return "기원전 "+Math.abs(y).toLocaleString("ko-KR")+"년";
    if(y===0)return "기원전 1년";
    return y.toLocaleString("ko-KR")+"년";
  }
  function formatDays(w){return (Math.floor(w.elapsedDays)+1).toLocaleString("ko-KR")+"일 차";}
  function techLabel(w){return w.techIndex>=0?techStages[Math.min(w.techIndex,techStages.length-1)].label:"구석기 시대";}
  function environmentLabel(w){return w.environment>=75?"안정적":w.environment>=45?"변화 중":"주의 필요";}
  function addPeople(w,count,jobType){
    const safeCount=Math.max(1,Math.min(100,Math.floor(Number(count)||1)));
    for(let i=0;i<safeCount;i++)w.citizens.push(newCitizen(jobType));
    w.population=w.citizens.length;
    w.food=Math.max(0,w.food-safeCount*0.35);
    w.resources=Math.max(0,w.resources-safeCount*0.12);
    if(w.population>30)w.environment=Math.max(0,w.environment-safeCount*0.06);
    const title="새로운 시민 "+safeCount+"명 합류";
    addEvent(w,title,"새 주민들이 공동체에 합류했습니다. 인구 증가에 따라 식량과 거주 공간의 수요도 커졌습니다.","♟","people");
    reactToEvent(w,title,"people");unlockAchievements(w);save();renderWorld();
  }
  function advanceOneTick(w){
    if(w.paused)return;
    const speed=w.speed||1;
    w.elapsedDays+=speed;
    const pop=w.citizens.length;
    w.food=Math.max(0,Math.min(100,w.food+0.05*speed-pop*0.002*speed));
    w.resources=Math.max(0,Math.min(100,w.resources+0.008*speed-pop*0.0005*speed));
    const habitability=(w.gravity>=3&&w.gravity<=20&&w.temperature>-25&&w.temperature<48&&w.oxygen>=8&&w.oxygen<=35);
    if(!habitability)w.environment=Math.max(0,w.environment-0.035*speed);
    else if(w.population<25&&w.food>25)w.environment=Math.min(100,w.environment+0.012*speed);
    else if(w.population>40)w.environment=Math.max(0,w.environment-0.012*speed);
    if(w.food<15&&pop>0&&Math.random()<Math.min(.35,.018*speed)){
      const c=w.citizens.pop();w.population=w.citizens.length;addEvent(w,"식량 부족","먹을거리가 부족해지며 공동체의 인구가 줄었습니다. 식량 생산이나 인구 규모를 살펴볼 필요가 있습니다.","🥀","nature");addReaction(w,"negative",c?.name||"주민","걱정이 많은","먹을거리가 점점 부족해지고 있어. 이대로는 오래 버티기 힘들겠어.","식량 부족");
    }
    const oldDay=Math.floor(w.elapsedDays-speed);
    const newDay=Math.floor(w.elapsedDays);
    if(w.food<20&&Math.floor(newDay/30)>Math.floor(Math.max(0,oldDay)/30)){w.food=Math.min(100,w.food+5);addEvent(w,"식량 확보 활동","주민들이 주변에서 먹을거리를 찾아 식량을 조금 확보했습니다.","🫐","system");}
    const researchGain=(0.025+pop*0.0018+(w.manualResearch?0.035:0))*speed;
    w.research+=researchGain;
    if(w.techIndex+1<techStages.length&&w.research>=techStages[w.techIndex+1].need){
      w.techIndex++;
      const t=techStages[w.techIndex];
      addEvent(t.name+" 발견!",t.desc,t.icon,"discovery");reactToEvent(w,t.name+" 발견!","discovery");
      if(w.techIndex===1){w.food=Math.min(100,w.food+12);addEvent(w,"식량 생산 방식 개선","농경 지식이 식량 확보에 도움을 주기 시작했습니다.","🌾","system");}
      if(w.techIndex===3){w.settlements=Math.max(2,w.settlements);addEvent(w,"기록과 지식의 전승","기록 기술 덕분에 지식을 다음 세대에 전하기 쉬워졌습니다.","📜","civilization");}
      if(w.techIndex===5){w.environment=Math.max(0,w.environment-5);addEvent(w,"산업 활동의 확대","생산량이 늘기 시작했지만 자원 소비와 환경 부담도 커지고 있습니다.","🏭","nature");reactToEvent(w,"산업 활동의 확대","nature");}
      if(w.techIndex===6){addEvent(w,"전기 기술의 초기 발견","전기의 원리를 이해하기 시작했습니다. 아직 전력망이나 가정용 전등이 널리 보급된 것은 아닙니다.","⚡","discovery");}
      unlockAchievements(w);
    }
    const day=Math.floor(w.elapsedDays);
    const crossed90=Math.floor(day/90)>Math.floor(Math.max(0,oldDay)/90);
    const crossed365=Math.floor(day/365)>Math.floor(Math.max(0,oldDay)/365);
    if(day>0&&crossed90){
      if(w.population>=12&&w.food>35&&w.environment>35&&Math.random()<.42){
        const count=Math.min(2,Math.floor((w.population/18)+Math.random()));
        if(count>0){for(let i=0;i<count;i++)w.citizens.push(newCitizen("random"));w.population=w.citizens.length;addEvent(w,"공동체 인구 증가","식량과 환경 조건이 비교적 안정적이어서 새로운 주민이 태어나거나 합류했습니다.","👶","people");reactToEvent(w,"공동체 인구 증가","people");unlockAchievements(w);}
      }
      if(w.techIndex>=1&&w.settlements<2&&w.population>=18&&Math.random()<.5){w.settlements=2;addEvent(w,"새로운 마을 형성","인구와 농경 지식이 늘어나면서 일부 주민이 새로운 정착지를 만들었습니다.","🏡","village");reactToEvent(w,"새로운 마을 형성","village");unlockAchievements(w);}
      if(w.environment<35&&Math.random()<.3){addEvent(w,"환경 부담 증가","자원 소비와 정착지 확장으로 자연 환경이 압박을 받고 있습니다.","🌫️","nature");reactToEvent(w,"환경 부담 증가","nature");}
    }
    if(day>0&&crossed365){addEvent(w,"새로운 해","세계의 시간이 흐르고 있습니다. 주민들의 지식과 생활 방식은 환경과 자원에 영향을 받습니다.","⌛","system");}
  }
  function renderHome(){
    $("worldCount").textContent=worlds.length;
    $("worldList").innerHTML=worlds.map((w,i)=>'<article class="world-card" data-open-world="'+esc(w.id)+'" tabindex="0" role="button" aria-label="'+esc(w.name)+' 열기"><div class="world-card-top"><div class="world-mini-planet">'+(["🌍","🪐","🌏","🌒","🌎"][i%5])+'</div><button class="card-menu" data-card-menu="'+esc(w.id)+'" aria-label="세계 메뉴">•••</button></div><h3>'+esc(w.name)+'</h3><p>'+esc(techLabel(w))+' · '+(w.settlements>1?"정착지 "+w.settlements+"곳":"정착지 1곳")+'</p><div class="world-card-bottom"><span>인구 <strong>'+w.population.toLocaleString("ko-KR")+'명</strong></span><span>'+esc(formatYear(w))+'</span></div></article>').join("");
    $("emptyState").classList.toggle("hidden",worlds.length>0);
    $("createWorldBtn").disabled=worlds.length>=10;$("emptyCreateBtn").disabled=worlds.length>=10;
    $("createWorldBtn").style.opacity=worlds.length>=10?".5":"1";
  }
  function renderWorld(){
    const w=activeWorld();if(!w)return;
    $("activeWorldName").textContent=w.name;$("worldSubtitle").textContent=w.techIndex>=3?"지식과 정착지가 성장하고 있습니다.":"문명의 첫 장을 관찰하세요.";
    $("worldYear").textContent=formatYear(w);$("worldDay").textContent=formatDays(w);
    $("speedSlider").value=w.speed;$("speedLabel").textContent=w.speed+"×";
    $("playPauseBtn").textContent=w.paused?"▶":"Ⅱ";$("playPauseBtn").setAttribute("aria-label",w.paused?"시간 재개":"일시 정지");
    $("runState").classList.toggle("paused",w.paused);$("runState").innerHTML="<i></i>"+(w.paused?"일시 정지":"진행 중");
    $("populationStat").textContent=w.population.toLocaleString("ko-KR")+"명";$("techStat").textContent=techLabel(w);$("natureStat").textContent=environmentLabel(w);$("settlementStat").textContent=w.settlements+"곳";
    $("eventCount").textContent=w.events.length+"개 기록";
    $("eventFeed").innerHTML=w.events.slice(0,8).map(e=>'<div class="event-item"><div class="event-icon">'+esc(e.icon)+'</div><div class="event-content"><strong>'+esc(e.title)+(e.category==="achievement"?' <span class="event-tag">ACHIEVEMENT</span>':'')+'</strong><p>'+esc(e.description)+'</p><time>'+esc(e.year<0?"기원전 "+Math.abs(e.year)+"년":e.year+"년")+" · "+e.day+"일 차</time></div></div>").join("")||'<div class="empty-inline">아직 기록이 없습니다.</div>';
    const filtered=w.reactions.filter(r=>activeFilter==="all"||r.sentiment===activeFilter);
    $("reactionFeed").innerHTML=filtered.slice(0,6).map(r=>'<div class="reaction-item '+esc(r.sentiment)+'"><div class="avatar">'+(r.sentiment==="negative"?"💭":"🗨️")+'</div><div class="reaction-copy"><strong>'+esc(r.name)+'</strong><span>'+esc(r.trait)+'</span><p>'+esc(r.text)+' <span>· '+esc(r.eventTitle)+'</span></p></div></div>').join("")||'<div class="empty-inline">이 필터에 해당하는 반응이 없습니다.</div>';
    $("achievementCount").textContent=w.achievements.length+" / "+achievementDefs.length;$("achievementProgress").style.width=(w.achievements.length/achievementDefs.length*100)+"%";
    $("achievementList").innerHTML=achievementDefs.map(a=>{const got=w.achievements.includes(a.id);return '<div class="achievement-item '+(got?"":"locked")+'"><div class="achievement-badge">'+(got?a.icon:"🔒")+'</div><div><strong>'+esc(a.name)+'</strong><small>'+esc(got?"달성 완료":a.desc)+'</small></div></div>';}).join("");
    $("citizenList").innerHTML=w.citizens.slice(0,12).map(c=>'<div class="citizen-card" data-citizen="'+esc(c.id)+'" role="button" tabindex="0"><div class="avatar">'+esc(c.icon||"🧑")+'</div><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.job)+" · "+esc(c.trait)+'</small></div></div>').join("")+(w.citizens.length>12?'<div class="empty-inline">외 '+(w.citizens.length-12)+'명의 시민이 더 있습니다.</div>':"");
    $("mapCaption").textContent=w.settlements>1?"정착지가 "+w.settlements+"곳으로 늘었습니다.":w.techIndex>=1?"농경과 정착의 기반이 마련되고 있습니다.":"아직 국가는 형성되지 않았습니다.";
    $("mapHeading").textContent=w.techIndex>=3?"문명의 세계":"푸른 행성";$("worldMap").className="world-map scale-"+activeScale;$("mapScaleBadge").textContent=levelNames[activeScale];$("worldMap").querySelector(".town-b").classList.toggle("hidden",w.settlements<2);
    save();
  }
  function render(){renderHome();if(activeId)renderWorld();}
  function openWorld(id){if(!worlds.some(w=>w.id===id))return;activeId=id;activeFilter="all";activeScale="world";$("homeView").classList.add("hidden");$("worldView").classList.remove("hidden");$("worldMenu").classList.add("hidden");$("reactionFilters").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));renderWorld();window.scrollTo({top:0,behavior:"smooth"});}
  function goHome(){activeId=null;$("worldView").classList.add("hidden");$("homeView").classList.remove("hidden");$("worldMenu").classList.add("hidden");renderHome();window.scrollTo({top:0,behavior:"smooth"});}
  function showModal(title,body,buttons,kicker="WORLD LAB"){
    $("modalTitle").textContent=title;$("modalKicker").textContent=kicker;$("modalBody").innerHTML=body;$("modalFooter").innerHTML="";
    buttons.forEach(b=>{const el=document.createElement("button");el.type="button";el.className=b.className||"secondary-btn";el.textContent=b.label;el.addEventListener("click",b.onClick);$("modalFooter").appendChild(el);});
    $("modalBackdrop").classList.remove("hidden");
  }
  function closeModal(){$("modalBackdrop").classList.add("hidden");}
  function createWorldModal(){
    if(worlds.length>=10){showToast("세계는 최대 10개까지 만들 수 있어요.");return;}
    showModal("새로운 세계 만들기",'<div class="form-field"><label for="newWorldName">세계 이름 *</label><input id="newWorldName" class="form-input" maxlength="32" placeholder="예: 푸른 별, 두 번째 지구" required><small>같은 이름의 세계도 만들 수 있습니다. 각 세계의 데이터는 서로 독립적으로 저장됩니다.</small></div><div class="form-field"><label for="worldPreset">세계 유형</label><select id="worldPreset" class="form-select"><option value="normal">일반 세계 · 현실과 비슷한 물리법칙</option><option value="lowGravity">저중력 세계 · 중력 약화</option><option value="cold">빙하 세계 · 낮은 평균 기온</option><option value="thinAir">희박한 대기 · 산소 감소</option></select></div><div class="modal-note">기본 세계는 불, 농경, 금속 가공, 문자, 과학, 산업, 전기 순으로 발전할 수 있습니다. 발전 속도는 시민 수와 연구 진행에 따라 달라집니다.</div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"세계 탄생시키기",className:"primary-btn",onClick:()=>{
      const input=$("newWorldName");const name=input.value.trim();if(!name){input.focus();input.style.borderColor="var(--red)";return;}
      const w=makeWorld(name);const preset=$("worldPreset").value;if(preset==="lowGravity")w.gravity=3.2;if(preset==="cold")w.temperature=-12;if(preset==="thinAir")w.oxygen=8;
      if(preset!=="normal")addEvent(w,"특이한 물리 조건","이 세계는 "+({lowGravity:"낮은 중력",cold:"낮은 평균 기온",thinAir:"희박한 산소 농도"}[preset])+"에서 시작합니다. 생존과 기술 발전은 이 조건의 영향을 받습니다.","⚛","system");
      worlds.push(w);save();closeModal();renderHome();openWorld(w.id);showToast("✦ "+name+" 세계가 탄생했습니다.");
    }}],"CREATE WORLD");
    setTimeout(()=>$("newWorldName")?.focus(),50);
  }
  function confirmAction(title,message,label,action,danger=false){
    showModal(title,'<p style="font-size:12px;line-height:1.8;color:#b8c6db;margin:0">'+esc(message)+'</p>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label,className:danger?"danger-btn":"primary-btn",onClick:()=>{closeModal();action();}}]);
  }
  function renameWorld(){
    const w=activeWorld();if(!w)return;
    showModal("세계 이름 바꾸기",'<div class="form-field"><label for="renameInput">새 이름</label><input id="renameInput" class="form-input" maxlength="32" value="'+esc(w.name)+'"></div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"저장",className:"primary-btn",onClick:()=>{const name=$("renameInput").value.trim();if(!name){$("renameInput").focus();return;}w.name=name;closeModal();render();showToast("세계 이름을 변경했어요.");}}]);
  }
  function cloneWorld(){
    const w=activeWorld();if(!w)return;if(worlds.length>=10){showToast("세계는 최대 10개까지 만들 수 있어요.");return;}
    showModal("세계 복제하기",'<div class="form-field"><label for="cloneInput">복제할 세계의 이름</label><input id="cloneInput" class="form-input" maxlength="32" value="'+esc(w.name+"의 복제")+'"></div><div class="modal-note">현재 세계의 시민, 기술, 물리법칙, 사건과 도전과제 기록을 복사합니다. 복제본은 독립적으로 진행됩니다.</div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"복제",className:"primary-btn",onClick:()=>{const name=$("cloneInput").value.trim();if(!name){$("cloneInput").focus();return;}const copy=JSON.parse(JSON.stringify(w));copy.id=uid();copy.name=name;copy.createdAt=Date.now();copy.paused=false;copy.events.unshift({id:uid(),title:"세계 복제",description:"다른 세계의 현재 상태를 바탕으로 독립된 세계가 만들어졌습니다.",icon:"▣",category:"system",day:Math.floor(copy.elapsedDays)+1,year:worldYearNumber(copy)});worlds.push(copy);save();closeModal();renderHome();openWorld(copy.id);showToast("세계가 독립적으로 복제됐어요.");}}]);
  }
  function resetWorld(){
    const w=activeWorld();if(!w)return;confirmAction("세계를 초기화할까요?","이 세계의 시민, 기술, 사건, 도전과제와 물리 조건이 처음 상태로 돌아갑니다. 다른 세계에는 영향이 없습니다.","초기화",()=>{const fresh=makeWorld(w.name);fresh.id=w.id;fresh.createdAt=w.createdAt;worlds=worlds.map(x=>x.id===w.id?fresh:x);render();showToast("이 세계를 처음 상태로 되돌렸어요.");},true);
  }
  function deleteWorld(){
    const w=activeWorld();if(!w)return;confirmAction("세계를 삭제할까요?",'"'+w.name+'" 세계와 그 안의 모든 시민 및 기록이 이 기기의 저장 데이터에서 삭제됩니다. 다른 세계에는 영향이 없습니다.',"삭제",()=>{worlds=worlds.filter(x=>x.id!==w.id);save();goHome();showToast("세계가 삭제됐어요.");},true);
  }
  function addPeopleModal(){
    showModal("시민 추가",'<div class="form-field"><label for="peopleCount">추가할 시민 수</label><input id="peopleCount" class="form-input" type="number" min="1" max="100" value="10"></div><div class="form-field"><label for="peopleType">시민 유형</label><select id="peopleType" class="form-select"><option value="random">무작위 주민</option><option value="농부">농부</option><option value="연구자">연구자</option><option value="건축가">건축가</option><option value="치유사">치유사</option><option value="탐험가">탐험가</option><option value="custom">특성 다양한 시민</option></select></div><div class="form-field"><label for="spawnMode">등장 방식</label><select id="spawnMode" class="form-select"><option value="natural">공동체에 자연스럽게 합류</option><option value="specific">특정 장소에 모여 등장</option></select><small>장소 선택 지도는 후속 버전에서 연결할 예정입니다. 특정 장소 옵션은 현재 정착지에 합류하는 방식으로 처리됩니다.</small></div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"시민 추가",className:"primary-btn",onClick:()=>{const n=Number($("peopleCount").value);if(!Number.isFinite(n)||n<1||n>100){$("peopleCount").focus();return;}const w=activeWorld();closeModal();if(w){addPeople(w,n,$("peopleType")?.value||"random");showToast(n+"명의 시민이 세계에 합류했어요.");}}}]);
  }
  function physicsModal(){
    const w=activeWorld();if(!w)return;
    showModal("물리법칙 설정",'<div class="physics-grid"><div class="physics-row"><label for="gravityInput">중력 강도</label><output id="gravityOut">'+w.gravity.toFixed(1)+' m/s²</output><input id="gravityInput" type="range" min="0.5" max="25" step="0.1" value="'+w.gravity+'"></div><div class="physics-row"><label for="tempInput">평균 기온</label><output id="tempOut">'+w.temperature+' °C</output><input id="tempInput" type="range" min="-80" max="80" step="1" value="'+w.temperature+'"></div><div class="physics-row"><label for="oxygenInput">대기 중 산소</label><output id="oxygenOut">'+w.oxygen+'%</output><input id="oxygenInput" type="range" min="0" max="40" step="1" value="'+w.oxygen+'"></div></div><div class="modal-note">현재 설정은 간단한 거주 가능성 모델에 반영됩니다. 실제 천체물리학이나 생물학 전체를 계산하는 모델은 아니며, 시민의 생존·환경 변화와 기술 발전에 영향을 주는 기초 규칙입니다.</div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"법칙 적용",className:"primary-btn",onClick:()=>{const old=w.gravity+":"+w.temperature+":"+w.oxygen;w.gravity=Number($("gravityInput").value);w.temperature=Number($("tempInput").value);w.oxygen=Number($("oxygenInput").value);if(old!==w.gravity+":"+w.temperature+":"+w.oxygen)addEvent(w,"물리 조건 변경","중력 "+w.gravity.toFixed(1)+" m/s², 평균 기온 "+w.temperature+"°C, 산소 "+w.oxygen+"% 조건이 적용되었습니다. 생존 가능성과 환경 변화가 달라질 수 있습니다.","⚛","system");closeModal();save();renderWorld();showToast("새로운 물리 조건을 적용했어요.");}}],"PHYSICS LAB");
    const update=()=>{if(!$("gravityInput"))return;$("gravityOut").textContent=Number($("gravityInput").value).toFixed(1)+" m/s²";$("tempOut").textContent=$("tempInput").value+" °C";$("oxygenOut").textContent=$("oxygenInput").value+"%";};
    ["gravityInput","tempInput","oxygenInput"].forEach(id=>$(id)?.addEventListener("input",update));
  }
  function executeCommand(raw){
    const w=activeWorld();if(!w)return;const cmd=raw.trim();if(!cmd)return;
    let m=cmd.match(/(?:시민|주민|인구)\s*(\d+)\s*명/);
    if(m&&/(추가|늘려|합류|생성)/.test(cmd)){const n=Number(m[1]);if(n<1||n>100){showToast("시민은 한 번에 1~100명까지 추가할 수 있어요.");return;}addPeople(w,n,"random");showToast(n+"명의 시민을 추가했어요.");return;}
    if(/마을/.test(cmd)&&/(만들|생성|세우|추가)/.test(cmd)){
      if(w.settlements>=10){showToast("현재 시뮬레이션에서 정착지는 최대 10곳으로 제한돼요.");return;}
      if(w.population<8){showToast("마을을 만들려면 시민이 최소 8명 필요해요.");return;}
      w.settlements++;addEvent(w,"새로운 마을 형성","사용자 명령에 따라 시민들이 새로운 정착지를 만들었습니다. 인구와 자원 조건에 따라 마을이 유지됩니다.","🏡","village");reactToEvent(w,"새로운 마을 형성","village");unlockAchievements(w);save();renderWorld();showToast("새로운 마을을 만들었어요.");return;
    }
    if(/연구|과학/.test(cmd)&&/(시작|해|진행|추가|가속)/.test(cmd)){w.manualResearch=1;addEvent(w,"과학 연구 시작","연구 활동을 장려해 지식 축적 속도가 일시적으로 높아졌습니다.","🔭","discovery");reactToEvent(w,"과학 연구 시작","science");save();renderWorld();showToast("연구 활동을 시작했어요. 일정 시간이 지나면 효과가 반영됩니다.");setTimeout(()=>{w.manualResearch=0;save();},30000);return;}
    if(/시간/.test(cmd)&&/(멈|정지|일시 정지)/.test(cmd)){w.paused=true;save();renderWorld();showToast("세계의 시간을 멈췄어요.");return;}
    if(/시간/.test(cmd)&&/(재개|다시|흐르게)/.test(cmd)){w.paused=false;save();renderWorld();showToast("세계의 시간이 다시 흐릅니다.");return;}
    showToast("아직 지원하지 않는 명령이에요. 아래 예시 명령을 사용해 보세요.");
    addEvent(w,"명령 해석 실패","입력된 명령을 현재 규칙으로 해석하지 못했습니다. 지원하는 명령 예시를 사용해 주세요: 시민 추가, 마을 만들기, 과학 연구.","💬","system");save();renderWorld();
  }
  function showCitizen(id){
    const w=activeWorld();const c=w?.citizens.find(x=>x.id===id);if(!c)return;
    const memories=(c.memory||[]).map(m=>"<li>"+esc(m)+"</li>").join("")||"<li>아직 기록된 기억이 없습니다.</li>";
    showModal(c.name,"<div style='display:flex;gap:13px;align-items:center;margin-bottom:16px'><div class='avatar' style='width:54px;height:54px;font-size:24px'>"+esc(c.icon)+"</div><div><strong style='font-size:15px'>"+esc(c.name)+"</strong><p style='color:#a6b6cf;font-size:11px;margin:6px 0'>"+esc(c.job)+" · "+esc(c.age)+"세</p><span class='pill'>"+esc(c.trait)+"</span></div></div><div class='form-field'><label>개인 능력</label><div class='modal-note'>기술 숙련도 "+esc(c.skill)+"/5 · 사회적 관계 "+esc(c.relations)+"명</div></div><div class='form-field'><label>기억</label><ul style='margin:0;padding-left:19px;color:#b7c5d8;font-size:11px;line-height:1.8'>"+memories+"</ul></div><div class='modal-note'>시민의 상세한 감정·관계 시뮬레이션은 기초 단계입니다. 현재 기록은 실제 세계 사건과 시민 생성에 기반합니다.</div>",[{label:"닫기",className:"primary-btn",onClick:closeModal}],"CITIZEN PROFILE");
  }
  function bind(){
    $("createWorldBtn").addEventListener("click",createWorldModal);$("emptyCreateBtn").addEventListener("click",createWorldModal);
    $("worldList").addEventListener("click",e=>{const menu=e.target.closest("[data-card-menu]");if(menu){e.stopPropagation();const w=worlds.find(x=>x.id===menu.dataset.cardMenu);if(w){showModal(w.name,'<p style="font-size:12px;color:#b8c6db">이 세계를 열거나 이름을 바꾸고, 복제 또는 삭제할 수 있습니다.</p>',[{label:"닫기",className:"secondary-btn",onClick:closeModal},{label:"열기",className:"primary-btn",onClick:()=>{closeModal();openWorld(w.id);}}]);}return;}const card=e.target.closest("[data-open-world]");if(card)openWorld(card.dataset.openWorld);});
    $("worldList").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-open-world]")){e.preventDefault();openWorld(e.target.dataset.openWorld);}});
    $("backHomeBtn").addEventListener("click",goHome);$("worldMenuBtn").addEventListener("click",()=>$("worldMenu").classList.toggle("hidden"));
    $("renameWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");renameWorld();});
    $("cloneWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");cloneWorld();});
    $("resetWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");resetWorld();});
    $("deleteWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");deleteWorld();});
    $("playPauseBtn").addEventListener("click",()=>{const w=activeWorld();if(!w)return;w.paused=!w.paused;save();renderWorld();});
    $("speedSlider").addEventListener("input",e=>{const w=activeWorld();if(!w)return;w.speed=Number(e.target.value);$("speedLabel").textContent=w.speed+"×";save();});
    $("addPeopleBtn").addEventListener("click",addPeopleModal);$("physicsBtn").addEventListener("click",physicsModal);
    $("commandForm").addEventListener("submit",e=>{e.preventDefault();const input=$("commandInput");executeCommand(input.value);input.value="";});
    document.querySelectorAll("[data-command]").forEach(b=>b.addEventListener("click",()=>{ $("commandInput").value=b.dataset.command;$("commandInput").focus();}));
    $("reactionFilters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;$("reactionFilters").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderWorld();});
    document.querySelectorAll("[data-scale]").forEach(b=>b.addEventListener("click",()=>setScale(b.dataset.scale)));
    $("zoomInBtn").addEventListener("click",()=>{const keys=Object.keys(levelNames);setScale(keys[Math.min(keys.length-1,keys.indexOf(activeScale)+1)]);});
    $("zoomOutBtn").addEventListener("click",()=>{const keys=Object.keys(levelNames);setScale(keys[Math.max(0,keys.indexOf(activeScale)-1)]);});
    $("citizenRefreshBtn").addEventListener("click",()=>{renderWorld();showToast("시민 목록을 새로고침했어요.");});
    $("citizenList").addEventListener("click",e=>{const c=e.target.closest("[data-citizen]");if(c)showCitizen(c.dataset.citizen);});
    $("citizenList").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-citizen]")){e.preventDefault();showCitizen(e.target.dataset.citizen);}});
    $("modalCloseBtn").addEventListener("click",closeModal);$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();$("worldMenu").classList.add("hidden");}});
    $("helpBtn").addEventListener("click",()=>showModal("나의 세계 사용 안내",'<div class="form-field"><label>세계 만들기</label><small>최대 10개의 세계를 만들 수 있습니다. 이름과 시민, 물리법칙, 사건 기록은 세계마다 따로 저장됩니다.</small></div><div class="form-field"><label>시뮬레이션</label><small>시간 배속을 1~100배로 조절하거나 일시 정지할 수 있습니다. 이 화면을 열어 둔 동안에만 시간이 진행됩니다.</small></div><div class="form-field"><label>기술 발전</label><small>시민과 연구 축적에 따라 기술이 발전합니다. 실제 역사 전체를 완벽히 재현하는 모델이 아니라 규칙 기반 프로토타입입니다.</small></div><div class="form-field"><label>저장과 AI</label><small>데이터는 이 브라우저의 로컬 저장소에 저장됩니다. 외부 AI API, 계정 동기화, 서버 백그라운드 시뮬레이션은 아직 연결되지 않았습니다.</small></div>',[{label:"알겠어요",className:"primary-btn",onClick:closeModal}],"QUICK GUIDE"));
    window.addEventListener("beforeunload",save);
  }
  function setScale(scale){if(!levelNames[scale])return;activeScale=scale;document.querySelectorAll("[data-scale]").forEach(b=>b.classList.toggle("active",b.dataset.scale===scale));if(activeWorld())renderWorld();}
  function startSimulation(){
    clearInterval(tickTimer);
    tickTimer=setInterval(()=>{
      let changed=false;
      worlds.forEach(w=>{if(!w.paused){advanceOneTick(w);changed=true;}});
      if(changed){save();if(activeId)renderWorld();else renderHome();}
    },1000);
  }
  function init(){
    if(worlds.length===0){$("emptyState").classList.remove("hidden");}
    bind();renderHome();startSimulation();
    if(worlds.length===0){addEvent; /* keep the initial screen empty until the user creates a world */ }
  }
  init();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();