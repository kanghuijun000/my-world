(() => {
  "use strict";
  const STORAGE_KEY = "my-world-data-v1";
  const $ = (id) => document.getElementById(id);
  let deferredInstallPrompt = null;
  const levelNames = {world:"연속 세계"};
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
    {id:"birth",name:"태초의 목격자",desc:"새로운 세계의 첫날을 맞이하세요.",icon:"🌌",test:w=>true},
    {id:"firstSteps",name:"발자국은 남는다",desc:"세계가 1년의 시간을 지나도록 지켜보세요.",icon:"👣",test:w=>w.elapsedDays>=365},
    {id:"people25",name:"열두 명으론 부족해",desc:"인구 25명에 도달하세요.",icon:"♟",test:w=>w.population>=25},
    {id:"people50",name:"이제 동네가 아니라 도시",desc:"인구 50명에 도달하세요.",icon:"🏘️",test:w=>w.population>=50},
    {id:"village",name:"이사 왔습니다!",desc:"이동 생활을 끝내고 두 번째 정착지를 만드세요.",icon:"🏡",test:w=>w.settlements>=2},
    {id:"fire",name:"불씨 지킴이",desc:"불을 다루는 법을 처음 익히세요.",icon:"🔥",test:w=>w.techIndex>=0},
    {id:"farming",name:"씨앗 투자자",desc:"농경 기술을 발견하세요.",icon:"🌾",test:w=>w.techIndex>=1},
    {id:"iron",name:"돌멩이와 작별",desc:"철기 시대의 문을 여세요.",icon:"⚒️",test:w=>w.techIndex>=2},
    {id:"writing",name:"까먹기 전에 적자",desc:"문자를 발명해 지식을 기록하세요.",icon:"📜",test:w=>w.techIndex>=3},
    {id:"science",name:"왜?를 멈추지 마",desc:"과학의 시대에 도달하세요.",icon:"🔭",test:w=>w.techIndex>=4},
    {id:"industry",name:"굴뚝이 늘어난다",desc:"산업 시대를 시작하세요.",icon:"⚙️",test:w=>w.techIndex>=5},
    {id:"electric",name:"어둠아, 잠깐 안녕",desc:"전기의 원리를 발견하세요.",icon:"⚡",test:w=>w.techIndex>=6},
    {id:"digital",name:"돌판에서 화면으로",desc:"디지털 시대에 도달하세요.",icon:"💻",test:w=>w.techIndex>=7},
    {id:"settlements3",name:"부동산이 뜨겁다",desc:"정착지 3곳을 보유하세요.",icon:"🗺️",test:w=>w.settlements>=3},
    {id:"environment",name:"자연과의 약속",desc:"환경 상태를 90 이상으로 유지하세요.",icon:"🌿",test:w=>w.environment>=90},
    {id:"food",name:"곳간이 든든해",desc:"식량을 100까지 확보하세요.",icon:"🧺",test:w=>w.food>=100},
    {id:"population100",name:"작은 나라의 탄생",desc:"인구 100명에 도달하세요.",icon:"🎉",test:w=>w.population>=100},
    {id:"research100",name:"연구실 불 꺼질 날 없음",desc:"연구 점수 100을 모으세요.",icon:"🧪",test:w=>w.research>=100},
    {id:"survive10",name:"꽤 오래 살았네",desc:"세계에서 10년을 보내세요.",icon:"⌛",test:w=>w.elapsedDays>=3650},
    {id:"city",name:"도시의 불빛",desc:"도시 수준의 정착지를 만들어 보세요.",icon:"🌆",test:w=>w.techIndex>=5&&w.settlements>=2}
  ];
  const firstNames = ["하린","도윤","서아","지호","유나","민준","시온","하윤","은우","서윤","이안","채원","지안","연우","수아","태오","다온","라온","준서","예린","가온","현우","소율","시우","아린","로운","나윤","건우","유진","민서"];
  const traits = ["호기심 많은","신중한","낙천적인","끈기 있는","관찰력이 뛰어난","상상력이 풍부한","협동적인","독립적인","차분한","모험을 좋아하는"];
  const jobs = ["채집가","사냥꾼","건축가","치유사","탐험가","농부","기록가","연구자","장인","교역가"];
  const icons = ["🧑‍🌾","🧑‍🔬","🧑‍🎨","🧑‍🏫","🧑‍🔧","🧑‍🚀","🧑‍⚕️","🧑‍🍳","🧑‍🌾","🧑‍💼"];
  let worlds = loadWorlds();
  let activeId = null;
  let selectedSettlementId = null;
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
  const settlementNames=["새벽들","강가마을","푸른언덕","돌개울","햇살터","바람골","은빛강","큰숲","별내","너른벌"];
  const nationNames=["해돋이 연맹","강물 왕국","푸른들 공화국","산맥 동맹","큰숲 연방","별빛 제국"];
  function makeSettlementRecord(i=0,tech=-1){const a=i*2.39996,d=10+Math.sqrt(i)*12;return {id:uid(),name:settlementNames[i%settlementNames.length],population:i?0:12,type:tech>=5?"발전 도시":tech>=1?"농경 마을":"수렵·채집 야영지",x:Math.cos(a)*d-7,z:Math.sin(a)*d+6,radius:tech>=5?7:tech>=1?4.8:2.7,level:Math.max(0,tech),nationId:"nation-0",alive:true,relations:{}};}
  function ensureSettlements(w){if(!Array.isArray(w.settlementData))w.settlementData=[];w.settlementData=w.settlementData.filter(x=>x&&x.id&&x.alive!==false);if(!w.settlementData.length)for(let i=0;i<Math.max(1,w.settlements||1);i++)w.settlementData.push(makeSettlementRecord(i,w.techIndex));if(!Array.isArray(w.nations)||!w.nations.length)w.nations=[{id:"nation-0",name:nationNames[0],settlementIds:w.settlementData.map(x=>x.id),atWarWith:[],alive:true}];w.nations.forEach(n=>{n.settlementIds=Array.isArray(n.settlementIds)?n.settlementIds:[];n.atWarWith=Array.isArray(n.atWarWith)?n.atWarWith:[];});w.settlementData.forEach(x=>{if(!x.nationId||!w.nations.some(n=>n.id===x.nationId))x.nationId=w.nations[0].id;});w.settlements=w.settlementData.length;}
  function makeWorld(name){
    const w={id:uid(),name:name.trim(),createdAt:Date.now(),elapsedDays:0,paused:false,speed:1,population:12,settlements:1,settlementData:[],nations:[],techIndex:-1,research:0,environment:100,food:100,resources:100,gravity:9.8,temperature:15,oxygen:21,weather:"clear",weatherUntilDay:0,wars:[],epidemic:null,events:[],reactions:[],citizens:[],achievements:[],filter:"all",manualResearch:0};
    w.settlementData=[makeSettlementRecord(0,-1)];w.nations=[{id:"nation-0",name:nationNames[0],settlementIds:[w.settlementData[0].id],atWarWith:[],alive:true}];
    for(let i=0;i<w.population;i++)w.citizens.push(newCitizen());
    syncSettlementPopulations(w);
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
    w.events=Array.isArray(w.events)?w.events:[];w.reactions=Array.isArray(w.reactions)?w.reactions:[];w.citizens=Array.isArray(w.citizens)?w.citizens:[];w.achievements=Array.isArray(w.achievements)?w.achievements:[];ensureSettlements(w);
    w.weather=["clear","rain","storm","snow","drought"].includes(w.weather)?w.weather:"clear";w.weatherUntilDay=Number(w.weatherUntilDay)||0;w.wars=Array.isArray(w.wars)?w.wars:[];w.epidemic=w.epidemic&&typeof w.epidemic==="object"?w.epidemic:null;
    w.paused=!!w.paused;w.manualResearch=Number(w.manualResearch)||0;syncSettlementPopulations(w);
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
    if(kind!=="discovery"&&!(kind==="nature"&&/(부족|위험|위기|붕괴|재난)/.test(title)))return;
    const people=w.citizens.length?[pick(w.citizens)]:[];
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
  function worldYearNumber(w){return Math.floor(Math.max(0,w.elapsedDays)/365);}
  function formatYear(w){return worldYearNumber(w).toLocaleString("ko-KR")+"년";}
  function formatDays(w){return (Math.floor(w.elapsedDays)+1).toLocaleString("ko-KR")+"일 차";}
  function techLabel(w){return w.techIndex>=0?techStages[Math.min(w.techIndex,techStages.length-1)].label:"구석기 시대";}
  function environmentLabel(w){return w.environment>=75?"안정적":w.environment>=45?"변화 중":"주의 필요";}
  function addPeople(w,count,jobType){
    const safeCount=Math.max(1,Math.min(100,Math.floor(Number(count)||1)));
    for(let i=0;i<safeCount&&w.citizens.length<1000;i++){const c=newCitizen(jobType);addCitizenToSettlement(w,c);}
    w.population=w.citizens.length;syncSettlementPopulations(w);w.food=Math.max(0,w.food-safeCount*0.35);w.resources=Math.max(0,w.resources-safeCount*0.12);
    if(w.population>30)w.environment=Math.max(0,w.environment-safeCount*0.06);
    addEvent(w,"새로운 시민 "+safeCount+"명 합류","새 주민들이 공동체에 합류했습니다. 실제 거주 정착지에 배정되어 마을별 인구에 반영됩니다.","♟","people");
    unlockAchievements(w);save();renderWorld();
  }
  function settlementEnvironment(w,a){const x=a.x||0,z=a.z||0;if(x>25&&z>5)return "건조 지대";if(z<-25||Math.abs(x)>40)return "산지";if(Math.abs(x-4)<18&&z>-28&&z<24)return "강변 비옥지";if(z>-28&&z<24&&x>-32&&x<28)return "초원 농경지";return "숲과 사냥터";}
  function settlementType(w,a){if(a.level>=5||a.population>=80)return "고도로 발전한 도시";if(a.level>=3||a.population>=45)return "산업·상업 도시";if(a.level>=2||a.population>=25)return "성장 중인 도시";if(a.level>=1)return /비옥지|농경지/.test(settlementEnvironment(w,a))?"농경 마을":"정착 마을";return "수렵·채집 야영지";}
  function syncSettlementPopulations(w){
    if(!w.settlementData||!w.settlementData.length)return;
    const valid=new Set(w.settlementData.map(a=>a.id));let next=0;
    w.citizens.forEach(c=>{if(!c.homeSettlementId||!valid.has(c.homeSettlementId)){c.homeSettlementId=w.settlementData[next%w.settlementData.length].id;next++;}});
    const counts=new Map(w.settlementData.map(a=>[a.id,0]));
    w.citizens.forEach(c=>counts.set(c.homeSettlementId,(counts.get(c.homeSettlementId)||0)+1));
    w.settlementData.forEach(a=>{a.population=counts.get(a.id)||0;});
    w.population=w.citizens.length;w.settlements=w.settlementData.length;
    (w.nations||[]).forEach(n=>{n.settlementIds=w.settlementData.filter(a=>a.nationId===n.id).map(a=>a.id);});
  }
  function createSettlementInWorld(w,city){
    const i=w.settlementData.length,a=makeSettlementRecord(i,w.techIndex);a.name=settlementNames[(i+Math.floor(Math.random()*settlementNames.length))%settlementNames.length];a.level=w.techIndex;a.radius=city?7:4.8;a.nationId=w.nations[0]?.id||"nation-0";w.settlementData.push(a);w.settlements=w.settlementData.length;
    const n=w.nations.find(n=>n.id===a.nationId);if(n)n.settlementIds.push(a.id);
    const donor=w.settlementData.filter(x=>x.id!==a.id).sort((x,y)=>y.population-x.population)[0];if(donor){let moved=0;for(const c of w.citizens){if(c.homeSettlementId===donor.id&&moved<Math.max(1,Math.floor(w.citizens.length*.12))&&donor.population>1){c.homeSettlementId=a.id;moved++;}}}
    syncSettlementPopulations(w);return a;
  }
  function addCitizenToSettlement(w,c){const a=w.settlementData.slice().sort((x,y)=>x.population-y.population)[0];c.homeSettlementId=a?.id||w.settlementData[0]?.id||null;w.citizens.push(c);}
  function simulateDemography(w,years){
    let births=0,deaths=0;const span=Math.max(1,Math.min(100,Math.floor(years)||1));
    for(let y=0;y<span;y++){const gone=new Set();w.citizens.forEach(c=>{c.age=Math.max(0,Number(c.age)||0)+1;const p=c.age>=105?0.32:c.age>=95?0.20:c.age>=85?0.10:c.age>=75?0.045:0.004;if(Math.random()<p)gone.add(c.id);});
      if(gone.size){w.citizens=w.citizens.filter(c=>!gone.has(c.id));deaths+=gone.size;}
      if(w.citizens.length&&w.food>12&&w.environment>15&&w.citizens.length<1000){const count=Math.min(8,Math.floor(w.citizens.length*.018)+(Math.random()<.22?1:0));for(let i=0;i<count&&w.citizens.length<1000;i++){const c=newCitizen("random");c.age=0;c.memory=["이 세계에서 태어났습니다."];addCitizenToSettlement(w,c);births++;}}
    }
    syncSettlementPopulations(w);if(births)addEvent(w,"새로운 세대의 탄생",births+"명의 아이가 태어났습니다. 각 마을의 거주 인구에 반영됩니다.","👶","people");if(deaths)addEvent(w,"자연사",deaths+"명의 시민이 나이와 생애주기에 따라 자연사했습니다.","🕯️","people");
  }
  function updateSettlements(w){
    ensureSettlements(w);syncSettlementPopulations(w);
    w.settlementData.forEach(a=>{a.environment=settlementEnvironment(w,a);a.level=Math.max(a.level||0,Math.max(0,w.techIndex));a.type=settlementType(w,a);a.radius=2.7+Math.min(12,Math.sqrt(a.population)*.72+(a.level>=5?2:0));});
    if(w.settlementData.length>=2&&w.nations.length===1&&w.techIndex>=2&&Math.random()<.08){const a=w.settlementData[w.settlementData.length-1],id="nation-"+uid(),n={id,name:nationNames[w.nations.length%nationNames.length],settlementIds:[a.id],atWarWith:[],alive:true};w.nations.push(n);a.nationId=id;syncSettlementPopulations(w);addEvent(w,"새로운 국가의 등장",n.name+"이 독립 세력으로 등장했습니다.","🏳️","milestone");}
  }
  function setWeather(w,type){
    if(!["clear","rain","storm","snow","drought"].includes(type))return false;w.weather=type;w.weatherUntilDay=type==="clear"?0:Math.floor(w.elapsedDays)+45;
    if(type==="rain"){w.food=Math.min(100,w.food+8);w.environment=Math.min(100,w.environment+5);}if(type==="storm"){w.environment=Math.max(0,w.environment-8);w.resources=Math.max(0,w.resources-4);}if(type==="drought"){w.food=Math.max(0,w.food-18);w.environment=Math.max(0,w.environment-6);}
    const names={clear:"맑은 날씨",rain:"강제 강우",storm:"폭풍우",snow:"폭설",drought:"가뭄"};addEvent(w,names[type],type==="rain"?"강제로 비가 내리기 시작해 토양 수분과 식량 생산에 영향을 줍니다.":type==="storm"?"폭풍우가 환경과 시설에 피해를 줄 수 있습니다.":type==="snow"?"폭설로 이동과 식량 확보가 어려워졌습니다.":type==="drought"?"가뭄으로 식량과 자연 환경이 악화됩니다.":"특수 기상 현상이 종료되었습니다.",type==="rain"?"🌧️":type==="storm"?"⛈️":type==="snow"?"❄️":type==="drought"?"☀️":"🌤️","nature");return true;
  }
  function startEpidemic(w,severity=2){
    const name=pick(["붉은 열병","회색 기침병","계절성 감염병","미지의 전염병"]);w.epidemic={name,active:true,severity:Math.max(1,Math.min(3,Number(severity)||2)),startedDay:Math.floor(w.elapsedDays)};const limit=Math.max(1,Math.ceil(w.citizens.length*.12));let count=0;
    for(const c of w.citizens){if(count>=limit)break;if(Math.random()<.8){c.infected=true;c.infectedDays=0;count++;}}w.epidemic.infectedCount=count;addEvent(w,"전염병 발생: "+name,name+"이 확산되기 시작했습니다. 감염·회복이 진행되며 인구에 영향을 줍니다.","🦠","nature");return true;
  }
  function simulateEpidemic(w,speed){
    if(!w.epidemic?.active)return;const infected=w.citizens.filter(c=>c.infected),healthy=w.citizens.filter(c=>!c.infected),spread=Math.min(.7,.06*w.epidemic.severity*speed),newly=[];healthy.forEach(c=>{if(Math.random()<spread*infected.length/Math.max(1,w.citizens.length))newly.push(c);});newly.forEach(c=>{c.infected=true;c.infectedDays=0;});
    const gone=new Set();w.citizens.forEach(c=>{if(c.infected){c.infectedDays=(c.infectedDays||0)+speed;if(Math.random()<Math.min(.8,.004*w.epidemic.severity*speed))gone.add(c.id);else if(c.infectedDays>14+Math.random()*12){c.infected=false;c.infectedDays=0;}}});
    if(gone.size){w.citizens=w.citizens.filter(c=>!gone.has(c.id));addEvent(w,"전염병으로 인한 사망",gone.size+"명의 시민이 "+w.epidemic.name+"으로 사망했습니다.","🕯️","nature");}
    const left=w.citizens.filter(c=>c.infected).length;w.epidemic.infectedCount=left;if(!left||Math.floor(w.elapsedDays)-w.epidemic.startedDay>180){w.citizens.forEach(c=>{c.infected=false;c.infectedDays=0;});w.epidemic.active=false;addEvent(w,"전염병 종식",w.epidemic.name+"의 확산이 잦아들었습니다.","🩺","milestone");}syncSettlementPopulations(w);
  }
  function findNation(w,id){return w.nations.find(n=>n.id===id)||null;}
  function ensureTwoNations(w){
    if(w.settlementData.length<2){if(w.citizens.length<2){showToast("전쟁을 시작하려면 시민이 최소 2명 필요해요.");return null;}createSettlementInWorld(w,false);}
    let a=w.nations[0],b=w.nations.find(n=>n.id!==a?.id);
    if(!b){const settlement=w.settlementData[w.settlementData.length-1],id="nation-"+uid();b={id,name:nationNames[w.nations.length%nationNames.length],settlementIds:[],atWarWith:[],alive:true};w.nations.push(b);settlement.nationId=id;syncSettlementPopulations(w);}
    return a&&b?[a,b]:null;
  }
  function forceWar(w,attackerId,defenderId){
    const pair=ensureTwoNations(w);if(!pair)return false;const a=findNation(w,attackerId)||pair[0],b=findNation(w,defenderId)||pair.find(n=>n.id!==a.id)||pair[1];if(!a||!b||a.id===b.id)return false;
    if(!a.atWarWith.includes(b.id))a.atWarWith.push(b.id);if(!b.atWarWith.includes(a.id))b.atWarWith.push(a.id);w.wars=Array.isArray(w.wars)?w.wars:[];
    if(!w.wars.some(x=>x.active&&((x.attackerId===a.id&&x.defenderId===b.id)||(x.attackerId===b.id&&x.defenderId===a.id))))w.wars.push({id:uid(),attackerId:a.id,defenderId:b.id,lastAttackDay:Math.floor(w.elapsedDays)-10,active:true});
    addEvent(w,"전쟁 선포",a.name+"이 "+b.name+"에 전쟁을 선포했습니다. 양측 병력이 이동하기 시작합니다.","⚔️","milestone");syncSettlementPopulations(w);return true;
  }
  function endWar(w){
    let count=0;(w.wars||[]).forEach(wr=>{if(!wr.active)return;wr.active=false;count++;const a=findNation(w,wr.attackerId),b=findNation(w,wr.defenderId);if(a)a.atWarWith=a.atWarWith.filter(id=>id!==wr.defenderId);if(b)b.atWarWith=b.atWarWith.filter(id=>id!==wr.attackerId);});
    if(count)addEvent(w,"휴전 협정","진행 중인 전쟁이 종료되고 군사 행동이 멈췄습니다.","🕊️","milestone");
  }
  function simulateWar(w,speed){
    const day=Math.floor(w.elapsedDays);for(const wr of (w.wars||[])){if(!wr.active||day-Number(wr.lastAttackDay||0)<Math.max(3,30/speed))continue;wr.lastAttackDay=day;const a=findNation(w,wr.attackerId),b=findNation(w,wr.defenderId);if(!a||!b)continue;
      const as=w.settlementData.filter(x=>x.nationId===a.id),bs=w.settlementData.filter(x=>x.nationId===b.id);if(!as.length||!bs.length){wr.active=false;continue;}
      const advanced=w.techIndex>=6,source=as[0],target=bs[0],side=Math.random()<.5?as:bs,victims=w.citizens.filter(c=>side.some(x=>x.id===c.homeSettlementId)),loss=Math.min(victims.length,Math.max(1,Math.floor(w.citizens.length*.015))),gone=new Set();
      for(let i=0;i<loss&&victims.length;i++){const ix=Math.floor(Math.random()*victims.length);gone.add(victims[ix].id);victims.splice(ix,1);}if(gone.size)w.citizens=w.citizens.filter(c=>!gone.has(c.id));
      wr.visualAction={type:advanced?"projectile":"soldiers",from:{x:source.x,z:source.z},to:{x:target.x,z:target.z},at:Date.now()};addEvent(w,advanced?"미사일 발사":"무장 병력의 진격",advanced?a.name+"의 미사일이 "+b.name+"의 거점을 향해 날아갑니다.":a.name+"의 무장 병력이 "+b.name+" 영토로 진격했습니다.",advanced?"🚀":"🪖","milestone");
      if(Math.random()<.12){target.nationId=a.id;addEvent(w,"영토 점령",a.name+"이 "+target.name+"을 점령했습니다.","🏳️","milestone");}
      if(Math.random()<.1||w.citizens.length<2){wr.active=false;a.atWarWith=a.atWarWith.filter(id=>id!==b.id);b.atWarWith=b.atWarWith.filter(id=>id!==a.id);addEvent(w,"전쟁 종결",a.name+"과 "+b.name+" 사이의 전쟁이 종료되었습니다.","🕊️","milestone");}
      syncSettlementPopulations(w);
    }
  }
  function settlementCurrentStatus(w,a){
    const nation=w.nations.find(n=>n.id===a.nationId);
    const population=Number(a.population||0);
    const physics=physicsRisk(w);
    if(population<=2||w.environment<=10||w.food<=5||physics.level>=3)return "멸망 위기";
    if(nation?.atWarWith?.length)return "전쟁 중";
    if(physics.level===2)return "위험 상태";
    if(physics.level===1)return "환경 악화";
    if(w.food<20||w.resources<15||population<5)return "빈곤";
    return "일상";
  }
  function renderSettlementInfo(w=activeWorld()){
    const title=$("settlementTitleBar"),populationInfo=$("worldPopulationInfo"),details=$("settlementDetails"),nameInput=$("settlementNameInput");
    if(!w){selectedSettlementId=null;title.classList.add("hidden");populationInfo.classList.remove("hidden");details.classList.add("hidden");return;}
    const a=w.settlementData.find(x=>x.id===selectedSettlementId);
    if(!a){
      selectedSettlementId=null;title.classList.add("hidden");populationInfo.classList.remove("hidden");details.classList.add("hidden");
      $("worldTotalPopulation").textContent=Number(w.population||0).toLocaleString("ko-KR")+"명";
      return;
    }
    title.classList.remove("hidden");populationInfo.classList.add("hidden");details.classList.remove("hidden");
    if(document.activeElement!==nameInput)nameInput.value=a.name||"이름 없는 마을";
    $("settlementPopulationValue").textContent=Number(a.population||0).toLocaleString("ko-KR")+"명";
    const nation=w.nations.find(n=>n.id===a.nationId),nationSettlementIds=new Set(w.settlementData.filter(x=>x.nationId===a.nationId).map(x=>x.id)),nationPopulation=w.citizens.filter(c=>nationSettlementIds.has(c.homeSettlementId)).length;
    const nationValue=$("settlementNationPopulationValue");if(nationValue)nationValue.textContent=(nation?.name||"국가 미정")+" · "+nationPopulation.toLocaleString("ko-KR")+"명";
    $("settlementTypeValue").textContent=a.type||settlementType(w,a);
    $("settlementEnvironmentValue").textContent=a.environment||settlementEnvironment(w,a);
    $("settlementStatusValue").textContent=settlementCurrentStatus(w,a);
  }
  function showSettlement(id){const w=activeWorld();if(!w?.settlementData?.some(x=>x.id===id))return;selectedSettlementId=id;renderSettlementInfo(w);}
  function physicsRisk(w){
    let risk=0;const issues=[];
    const g=Number(w.gravity),t=Number(w.temperature),o=Number(w.oxygen);
    if(g<1||g>20){risk+=0.10;issues.push(g<1?"극저중력":"초고중력");}
    else if(g<2||g>15){risk+=0.025;issues.push(g<2?"저중력":"고중력");}
    else if(g<3||g>12){risk+=0.008;issues.push(g<3?"낮은 중력":"높은 중력");}
    if(t<=-40||t>=60){risk+=0.22;issues.push(t<=-40?"극심한 혹한":"극심한 고온");}
    else if(t<=-20||t>=45){risk+=0.075;issues.push(t<=-20?"혹한":"폭염");}
    else if(t<=-10||t>=38){risk+=0.02;issues.push(t<=-10?"추위":"고온");}
    if(o<=2||o>=38){risk+=0.30;issues.push(o<=2?"산소 부족":"산소 과다");}
    else if(o<5||o>35){risk+=0.16;issues.push(o<5?"심각한 산소 부족":"높은 산소 농도");}
    else if(o<10||o>30){risk+=0.07;issues.push(o<10?"산소 부족":"산소 과다");}
    else if(o<15||o>26){risk+=0.015;issues.push(o<15?"낮은 산소 농도":"산소 농도 높음");}
    risk=Math.min(0.75,risk);
    return {riskPerDay:risk,issues,level:risk>=0.25?3:risk>=0.10?2:risk>0?1:0};
  }
  function updatePhysicsWarning(w,riskInfo=physicsRisk(w)){
    const previous=Number(w.physicsWarningLevel||0),next=riskInfo.level;
    if(previous===next)return;
    w.physicsWarningLevel=next;
    if(next===0){
      if(previous>0)addEvent(w,"물리 환경 회복","중력·기온·산소 조건이 주민에게 위험한 범위를 벗어났습니다. 생존 위험이 낮아지고 있습니다.","🌤️","nature");
      return;
    }
    const severity=next===3?"치명적":next===2?"위험":"주의";
    const description="현재 조건: 중력 "+Number(w.gravity).toFixed(1)+" m/s², 기온 "+w.temperature+"°C, 산소 "+w.oxygen+"%. 위험 요인: "+riskInfo.issues.join(", ")+". 주민 사망 위험이 증가하고 출생과 문명 발전이 둔화됩니다.";
    addEvent(w,"물리 환경 "+severity,description,"⚠️","nature");
    const c=w.citizens.length?pick(w.citizens):null;
    if(c)addReaction(w,"negative",c.name,c.trait,pick(["숨쉬기가 힘들고 몸이 버티기 어려워. 이 환경에 계속 노출되면 위험해!","기온과 중력, 대기 상태가 이상해. 빨리 환경을 바꿔야 해.","주변 환경이 생존에 위협이 되고 있어. 이대로라면 공동체가 위험해질 거야."]), "물리 환경 위험");
  }
  function applyPhysicsMortality(w,riskInfo,speed){
    const oldCount=w.citizens.length;
    if(!oldCount||riskInfo.riskPerDay<=0)return 0;
    const chance=1-Math.exp(-riskInfo.riskPerDay*speed);
    const survivors=[],dead=[];
    for(const c of w.citizens){if(Math.random()<chance)dead.push(c);else survivors.push(c);}
    if(!dead.length)return 0;
    w.citizens=survivors;w.population=survivors.length;
    const ratio=oldCount?survivors.length/oldCount:0;
    if(Array.isArray(w.settlementData))w.settlementData.forEach(a=>{a.population=Math.max(0,Math.floor(Number(a.population||0)*ratio));});
    const issue=riskInfo.issues.join(", ");
    addEvent(w,"극한 환경으로 인한 사망",dead.length+"명의 주민이 "+issue+"의 영향으로 사망했습니다. 생존자 "+survivors.length+"명. 물리 조건을 조정하지 않으면 인구가 계속 감소할 수 있습니다.","🆘","nature");
    if(survivors.length){
      const c=pick(survivors);
      addReaction(w,"negative",c.name,c.trait,"여러 이웃을 잃었어. "+issue+" 상태가 계속되면 우리 공동체가 사라질지도 몰라.","극한 환경으로 인한 사망");
    }
    if(survivors.length===0)addEvent(w,"문명 멸망","극한 물리 환경으로 모든 주민이 사망했습니다. 세계는 남아 있지만 문명은 더 이상 발전하지 않습니다. 물리 조건을 바꾸어도 사라진 주민은 자동으로 되살아나지 않습니다.","🏚️","nature");
    return dead.length;
  }
  function advanceOneTick(w){
    if(w.paused)return;
    const speed=w.speed||1;
    w.elapsedDays+=speed;
    let pop=w.citizens.length;
    const riskInfo=physicsRisk(w);updatePhysicsWarning(w,riskInfo);
    w.food=Math.max(0,Math.min(100,w.food+0.05*speed-pop*0.002*speed));
    w.resources=Math.max(0,Math.min(100,w.resources+0.008*speed-pop*0.0005*speed));
    if(riskInfo.riskPerDay>0)w.environment=Math.max(0,w.environment-(0.025+riskInfo.riskPerDay*0.35)*speed);
    else if(w.population<25&&w.food>25)w.environment=Math.min(100,w.environment+0.012*speed);
    else if(w.population>40)w.environment=Math.max(0,w.environment-0.012*speed);
    const physicsDeaths=applyPhysicsMortality(w,riskInfo,speed);pop=w.citizens.length;
    if(w.food<15&&pop>0&&Math.random()<Math.min(.35,.018*speed)){
      const c=w.citizens.pop();w.population=w.citizens.length;addEvent(w,"식량 부족","먹을거리가 부족해지며 공동체의 인구가 줄었습니다. 식량 생산이나 인구 규모를 살펴볼 필요가 있습니다.","🥀","nature");if(c)addReaction(w,"negative",c.name,c.trait,"먹을거리가 부족해지고 있어. 공동체가 식량을 확보해야 해.","식량 부족");
    }
    const oldDay=Math.floor(w.elapsedDays-speed),newDay=Math.floor(w.elapsedDays);
    if(w.weather!=="clear"&&w.weatherUntilDay>0&&newDay>=w.weatherUntilDay)setWeather(w,"clear");
    if(w.weather==="rain"){w.food=Math.min(100,w.food+.035*speed);w.environment=Math.min(100,w.environment+.025*speed);}if(w.weather==="drought"){w.food=Math.max(0,w.food-.05*speed);w.environment=Math.max(0,w.environment-.025*speed);}
    if(w.weather==="storm"&&Math.random()<.008*speed)w.resources=Math.max(0,w.resources-1);
    simulateEpidemic(w,speed);simulateWar(w,speed);
    if(newDay>0&&Math.floor(newDay/365)>Math.floor(Math.max(0,oldDay)/365))simulateDemography(w,Math.floor(newDay/365)-Math.floor(Math.max(0,oldDay)/365));
    syncSettlementPopulations(w);
    if(w.food<20&&Math.floor(newDay/30)>Math.floor(Math.max(0,oldDay)/30)){w.food=Math.min(100,w.food+5);addEvent(w,"식량 확보 활동","주민들이 주변에서 먹을거리를 찾아 식량을 조금 확보했습니다.","🫐","system");}
    const researchGain=pop>0?(0.025+pop*0.0018+(w.manualResearch?0.035:0))*Math.max(0,1-riskInfo.riskPerDay*2)*speed:0;
    w.research+=researchGain;
    if(pop>0&&w.techIndex+1<techStages.length&&w.research>=techStages[w.techIndex+1].need){
      w.techIndex++;
      const t=techStages[w.techIndex];
      addEvent(t.name+" 발견!",t.desc,t.icon,"discovery");reactToEvent(w,t.name+" 발견!","discovery");
      if(w.techIndex===1){w.food=Math.min(100,w.food+12);addEvent(w,"이동 생활의 끝, 첫 정착","씨앗을 심고 수확을 기다리기로 했습니다. 이제 이곳은 잠시 머무는 곳이 아니라 집입니다.","🏡","milestone");}
      if(w.techIndex===2){addEvent(w,"철기 시대의 시작","더 단단한 도구가 농사와 건축, 생활을 바꾸기 시작했습니다.","⚒️","milestone");}
      if(w.techIndex===3){if(w.settlementData.length<2&&w.population>=8)createSettlementInWorld(w,false);syncSettlementPopulations(w);addEvent(w,"문자로 남긴 첫 기록","이제 중요한 지식과 약속을 다음 세대에 전할 수 있습니다. 기록과 교류가 늘며 새로운 정착지가 생길 수 있습니다.","📜","milestone");}
      if(w.techIndex===5){w.environment=Math.max(0,w.environment-5);addEvent(w,"산업 활동의 확대","생산량이 늘기 시작했지만 자원 소비와 환경 부담도 커지고 있습니다.","🏭","nature");}
      if(w.techIndex===6){addEvent(w,"전기의 발견","자연의 전기 현상을 이해하기 시작했습니다. 불빛이 일상에 퍼지기까지는 더 많은 발명이 필요합니다.","⚡","milestone");}
      unlockAchievements(w);
    }
    const day=Math.floor(w.elapsedDays);
    const crossed90=Math.floor(day/90)>Math.floor(Math.max(0,oldDay)/90);
    const crossed365=Math.floor(day/365)>Math.floor(Math.max(0,oldDay)/365);
    if(day>0&&crossed90){
      updateSettlements(w);
      if(w.population>=12&&w.food>35&&w.environment>35&&riskInfo.riskPerDay<0.02&&Math.random()<.42){
        const count=Math.min(2,Math.floor((w.population/18)+Math.random()));
        if(count>0){for(let i=0;i<count;i++){const c=newCitizen("random");c.age=0;addCitizenToSettlement(w,c);}syncSettlementPopulations(w);addEvent(w,"공동체 인구 증가","식량과 환경 조건이 비교적 안정적이어서 새로운 주민이 태어나거나 합류했습니다.","👶","people");unlockAchievements(w);}
      }
      if(w.techIndex>=1&&w.settlements<2&&w.population>=18&&Math.random()<.5){createSettlementInWorld(w,false);addEvent(w,"새로운 마을 건설","주변 환경에 맞는 새 정착지가 만들어졌습니다.","🏡","milestone");unlockAchievements(w);}
      else if(w.techIndex>=5&&w.settlements>=2&&w.settlements<5&&w.population>=35&&Math.random()<.25){createSettlementInWorld(w,true);addEvent(w,"새로운 도시의 탄생","인구와 기술이 모인 정착지가 도시로 성장했습니다.","🌆","milestone");unlockAchievements(w);}
      if(w.environment<35&&Math.random()<.3){addEvent(w,"환경 부담 증가","자원 소비와 정착지 확장으로 자연 환경이 압박을 받고 있습니다.","🌫️","nature");}
    }
    if(day>0&&crossed365){unlockAchievements(w);}
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
    ensureSettlements(w);if(window.World3D){window.World3D.setWorld(w);window.World3D.resize();}
    $("activeWorldName").textContent=w.name;$("worldSubtitle").textContent=w.techIndex>=3?"지식과 정착지가 성장하고 있습니다.":"문명의 첫 장을 관찰하세요.";
    $("worldYear").textContent=formatYear(w);$("worldDay").textContent=formatDays(w);
    $("speedSlider").value=w.speed;$("speedLabel").textContent=w.speed+"×";
    $("playPauseBtn").textContent=w.paused?"▶":"Ⅱ";$("playPauseBtn").setAttribute("aria-label",w.paused?"시간 재개":"일시 정지");
    $("runState").classList.toggle("paused",w.paused);$("runState").innerHTML="<i></i>"+(w.paused?"일시 정지":"진행 중");
    $("populationStat").textContent=w.population.toLocaleString("ko-KR")+"명";$("techStat").textContent=techLabel(w);$("natureStat").textContent=environmentLabel(w);$("settlementStat").textContent=w.settlements+"곳";
    renderSettlementInfo(w);
    $("eventCount").textContent=w.events.length+"개 기록";
    const importantEvents=w.events.filter(e=>["milestone","achievement","nature","people"].includes(e.category)||/세계의 탄생|불의 활용|불의 시대|전기의 발견|철기 시대|새로운 도시|새로운 마을|정착|산업 혁명|디지털 시대|문자로 남긴/.test(e.title));
    $("eventFeed").innerHTML=importantEvents.slice(0,8).map(e=>'<div class="event-item"><div class="event-icon">'+esc(e.icon)+'</div><div class="event-content"><strong>'+esc(e.title)+(e.category==="achievement"?' <span class="event-tag">ACHIEVEMENT</span>':'')+'</strong><p>'+esc(e.description)+'</p><time>'+(Math.floor(Math.max(0,(e.day||1)-1)/365)).toLocaleString("ko-KR")+"년 · "+e.day+"일 차</time></div></div>").join("")||'<div class="empty-inline">아직 기록이 없습니다.</div>';
    const filtered=w.reactions.filter(r=>activeFilter==="all"||r.sentiment===activeFilter);
    $("reactionFeed").innerHTML=filtered.slice(0,6).map(r=>'<div class="reaction-item '+esc(r.sentiment)+'"><div class="avatar">'+(r.sentiment==="negative"?"💭":"🗨️")+'</div><div class="reaction-copy"><strong>'+esc(r.name)+'</strong><span>'+esc(r.trait)+'</span><p>'+esc(r.text)+' <span>· '+esc(r.eventTitle)+'</span></p></div></div>').join("")||'<div class="empty-inline">이 필터에 해당하는 반응이 없습니다.</div>';
    $("achievementCount").textContent=w.achievements.length+" / "+achievementDefs.length;$("achievementProgress").style.width=(w.achievements.length/achievementDefs.length*100)+"%";
    $("achievementList").innerHTML=achievementDefs.map(a=>{const got=w.achievements.includes(a.id);return '<div class="achievement-item '+(got?"":"locked")+'"><div class="achievement-badge">'+(got?a.icon:"🔒")+'</div><div><strong>'+esc(a.name)+'</strong><small>'+esc(got?"달성 완료":a.desc)+'</small></div></div>';}).join("");
    $("citizenList").innerHTML=w.citizens.slice(0,12).map(c=>'<div class="citizen-card" data-citizen="'+esc(c.id)+'" role="button" tabindex="0"><div class="avatar">'+esc(c.icon||"🧑")+'</div><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.job)+" · "+esc(c.trait)+'</small></div></div>').join("")+(w.citizens.length>12?'<div class="empty-inline">외 '+(w.citizens.length-12)+'명의 시민이 더 있습니다.</div>':"");
    $("mapCaption").textContent=({"world":"대륙의 전체 배치","continent":"대륙 내부의 국가 경계","country":"지역과 강의 흐름","city":"도시 구역과 도로망","village":"마을의 길과 개별 건물"})[activeScale]+(w.settlements>1?" · 정착지 "+w.settlements+"곳":"");
    $("mapHeading").textContent=w.techIndex>=5?"성장하는 문명":w.techIndex>=1?"살아가는 땅":"새로운 야생 세계";$("mapScaleBadge").textContent="연속 세계";$("worldMap").querySelector(".town-b").classList.toggle("hidden",w.settlements<2);
    save();
  }
  function renderMapCitizens(w){
    const layer=$("citizenLayer");if(!layer)return;
    const visible=w.citizens.slice(0,Math.min(36,w.citizens.length));
    const existing=new Map(Array.from(layer.children).map(el=>[el.dataset.citizen,el]));
    const keep=new Set();
    visible.forEach((c,i)=>{
      keep.add(c.id);
      let el=existing.get(c.id);
      if(!el){
        el=document.createElement("button");el.type="button";el.className="map-citizen";el.dataset.citizen=c.id;
        el.setAttribute("aria-label",c.name+" 시민 정보");
        el.innerHTML='<span class="citizen-shadow"></span><span class="citizen-body"></span>';
        el.addEventListener("click",e=>{e.stopPropagation();showCitizen(c.id);});
        layer.appendChild(el);
      }
      const seed=Array.from(c.id||String(i)).reduce((n,ch)=>n+ch.charCodeAt(0),i*17);
      el.style.setProperty("--person-x",(12+(seed*37%760)/10)+"%");
      el.style.setProperty("--person-y",(30+(seed*53%390)/10)+"%");
      el.style.setProperty("--walk-delay",(-((seed%90)/10))+"s");
      el.style.setProperty("--walk-duration",(7+(seed%9))+"s");
      el.querySelector(".citizen-body").textContent=(c.icon&&/👩|👨|🧑|🧒|👧|👦/.test(c.icon))?c.icon:"🧑";
      el.title=c.name+" · "+c.job;
    });
    existing.forEach((el,id)=>{if(!keep.has(id))el.remove();});
    layer.dataset.population=String(w.population);
  }
  function render(){renderHome();if(activeId)renderWorld();}
  function requestLandscape(){
    try{
      if(screen.orientation&&typeof screen.orientation.lock==="function"){
        const result=screen.orientation.lock("landscape");
        if(result&&typeof result.catch==="function")result.catch(()=>{});
      }
    }catch(e){}
  }
  function enterLandscapeMode(){
    requestLandscape();
    try{
      const root=document.documentElement;
      if(!document.fullscreenElement&&root&&typeof root.requestFullscreen==="function"){
        const result=root.requestFullscreen();
        if(result&&typeof result.then==="function")result.then(()=>requestLandscape()).catch(()=>{});
      }
    }catch(e){}
  }
  function openWorld(id){if(!worlds.some(w=>w.id===id))return;requestLandscape();selectedSettlementId=null;activeId=id;activeFilter="all";activeScale="world";if(window.World3D)window.World3D.setScale("world");document.body.classList.add("world-active");document.body.classList.remove("tools-open");$("toolToggleBtn").setAttribute("aria-expanded","false");$("toolToggleBtn").querySelector(".tool-toggle-label").textContent="도구 열기";$("homeView").classList.add("hidden");$("worldView").classList.remove("hidden");$("worldMenu").classList.add("hidden");$("reactionFilters").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));renderWorld();requestAnimationFrame(()=>{if(window.World3D){window.World3D.resize();window.World3D.setZoom(3.2);}});window.scrollTo({top:0,behavior:"smooth"});}
  function goHome(){selectedSettlementId=null;activeId=null;document.body.classList.remove("world-active","tools-open");$("worldView").classList.add("hidden");$("homeView").classList.remove("hidden");$("worldMenu").classList.add("hidden");renderHome();window.scrollTo({top:0,behavior:"smooth"});}
  function showModal(title,body,buttons,kicker="WORLD LAB"){
    $("modalTitle").textContent=title;$("modalKicker").textContent=kicker;$("modalBody").innerHTML=body;$("modalFooter").innerHTML="";
    buttons.forEach(b=>{const el=document.createElement("button");el.type="button";el.className=b.className||"secondary-btn";el.textContent=b.label;el.addEventListener("click",b.onClick);$("modalFooter").appendChild(el);});
    $("modalBackdrop").classList.remove("hidden");
  }
  function closeModal(){$("modalBackdrop").classList.add("hidden");}
  function createWorldModal(){
    if(worlds.length>=10){showToast("세계는 최대 10개까지 만들 수 있어요.");return;}
    showModal("새로운 세계 만들기",'<div class="form-field"><label for="newWorldName">세계 이름 *</label><input id="newWorldName" class="form-input" maxlength="32" placeholder="예: 푸른 별, 두 번째 지구" required><small>같은 이름의 세계도 만들 수 있습니다. 각 세계의 데이터는 서로 독립적으로 저장됩니다.</small></div><div class="modal-note">새 세계는 모두 평범한 물리 조건(중력 9.8 m/s², 평균 기온 15°C, 산소 21%)으로 시작합니다. 세계를 만든 뒤 물리법칙 메뉴에서 조건을 바꿀 수 있습니다.</div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"세계 탄생시키기",className:"primary-btn",onClick:()=>{
      const input=$("newWorldName");const name=input.value.trim();if(!name){input.focus();input.style.borderColor="var(--red)";return;}
      const w=makeWorld(name);
      worlds.push(w);save();closeModal();renderHome();openWorld(w.id);showToast("✦ "+name+" 세계가 탄생했습니다.");
    }}],"CREATE WORLD");
    setTimeout(()=>$("newWorldName")?.focus(),50);
  }
  function confirmAction(title,message,label,action,danger=false){
    showModal(title,'<p style="font-size:12px;line-height:1.8;color:#b8c6db;margin:0">'+esc(message)+'</p>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label,className:danger?"danger-btn":"primary-btn",onClick:()=>{closeModal();action();}}]);
  }
  function renameWorld(worldId=activeId){
    const w=worlds.find(x=>x.id===worldId);if(!w)return;
    showModal("세계 이름 수정하기",'<div class="form-field"><label for="renameInput">새 이름</label><input id="renameInput" class="form-input" maxlength="32" value="'+esc(w.name)+'"></div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"저장",className:"primary-btn",onClick:()=>{const name=$("renameInput").value.trim();if(!name){$("renameInput").focus();return;}w.name=name;closeModal();save();if(activeId===w.id)render();else renderHome();showToast("세계 이름을 변경했어요.");}}]);
  }
  function cloneWorld(){
    const w=activeWorld();if(!w)return;if(worlds.length>=10){showToast("세계는 최대 10개까지 만들 수 있어요.");return;}
    showModal("세계 복제하기",'<div class="form-field"><label for="cloneInput">복제할 세계의 이름</label><input id="cloneInput" class="form-input" maxlength="32" value="'+esc(w.name+"의 복제")+'"></div><div class="modal-note">현재 세계의 시민, 기술, 물리법칙, 사건과 도전과제 기록을 복사합니다. 복제본은 독립적으로 진행됩니다.</div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"복제",className:"primary-btn",onClick:()=>{const name=$("cloneInput").value.trim();if(!name){$("cloneInput").focus();return;}const copy=JSON.parse(JSON.stringify(w));copy.id=uid();copy.name=name;copy.createdAt=Date.now();copy.paused=false;copy.events.unshift({id:uid(),title:"세계 복제",description:"다른 세계의 현재 상태를 바탕으로 독립된 세계가 만들어졌습니다.",icon:"▣",category:"system",day:Math.floor(copy.elapsedDays)+1,year:worldYearNumber(copy)});worlds.push(copy);save();closeModal();renderHome();openWorld(copy.id);showToast("세계가 독립적으로 복제됐어요.");}}]);
  }
  function resetWorld(worldId=activeId){
    const w=worlds.find(x=>x.id===worldId);if(!w)return;
    confirmAction("세계를 초기화할까요?",'"'+w.name+'" 세계의 시민, 기술, 사건, 도전과제와 물리 조건이 처음 상태로 돌아갑니다. 세계 이름과 다른 세계의 데이터는 유지됩니다.',"초기화",()=>{const fresh=makeWorld(w.name);fresh.id=w.id;fresh.createdAt=w.createdAt;worlds=worlds.map(x=>x.id===w.id?fresh:x);save();if(activeId===w.id){selectedSettlementId=null;render();}else renderHome();showToast("이 세계를 처음 상태로 되돌렸어요.");},true);
  }
  function deleteWorld(worldId=activeId){
    const w=worlds.find(x=>x.id===worldId);if(!w)return;
    confirmAction("세계를 삭제할까요?",'"'+w.name+'" 세계와 그 안의 모든 시민 및 기록이 이 기기의 저장 데이터에서 삭제됩니다. 다른 세계에는 영향이 없습니다.',"삭제",()=>{worlds=worlds.filter(x=>x.id!==w.id);save();if(activeId===w.id)goHome();else renderHome();showToast("세계가 삭제됐어요.");},true);
  }
  function addPeopleModal(){
    showModal("시민 추가",'<div class="form-field"><label for="peopleCount">추가할 시민 수</label><input id="peopleCount" class="form-input" type="number" min="1" max="100" value="10"></div><div class="form-field"><label for="peopleType">시민 유형</label><select id="peopleType" class="form-select"><option value="random">무작위 주민</option><option value="농부">농부</option><option value="연구자">연구자</option><option value="건축가">건축가</option><option value="치유사">치유사</option><option value="탐험가">탐험가</option><option value="custom">특성 다양한 시민</option></select></div><div class="form-field"><label for="spawnMode">등장 방식</label><select id="spawnMode" class="form-select"><option value="natural">공동체에 자연스럽게 합류</option><option value="specific">특정 장소에 모여 등장</option></select><small>장소 선택 지도는 후속 버전에서 연결할 예정입니다. 특정 장소 옵션은 현재 정착지에 합류하는 방식으로 처리됩니다.</small></div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"시민 추가",className:"primary-btn",onClick:()=>{const n=Number($("peopleCount").value);if(!Number.isFinite(n)||n<1||n>100){$("peopleCount").focus();return;}const w=activeWorld();closeModal();if(w){addPeople(w,n,$("peopleType")?.value||"random");showToast(n+"명의 시민이 세계에 합류했어요.");}}}]);
  }
  function physicsModal(){
    const w=activeWorld();if(!w)return;
    showModal("물리법칙 설정",'<div class="physics-grid"><div class="physics-row"><label for="gravityInput">중력 강도</label><output id="gravityOut">'+w.gravity.toFixed(1)+' m/s²</output><input id="gravityInput" type="range" min="0.5" max="25" step="0.1" value="'+w.gravity+'"></div><div class="physics-row"><label for="tempInput">평균 기온</label><output id="tempOut">'+w.temperature+' °C</output><input id="tempInput" type="range" min="-80" max="80" step="1" value="'+w.temperature+'"></div><div class="physics-row"><label for="oxygenInput">대기 중 산소</label><output id="oxygenOut">'+w.oxygen+'%</output><input id="oxygenInput" type="range" min="0" max="40" step="1" value="'+w.oxygen+'"></div></div><div class="modal-note">현재 설정은 간단한 거주 가능성 모델에 반영됩니다. 실제 천체물리학이나 생물학 전체를 계산하는 모델은 아니며, 시민의 생존·환경 변화와 기술 발전에 영향을 주는 기초 규칙입니다.</div>',[{label:"취소",className:"secondary-btn",onClick:closeModal},{label:"법칙 적용",className:"primary-btn",onClick:()=>{const old=w.gravity+":"+w.temperature+":"+w.oxygen;w.gravity=Number($("gravityInput").value);w.temperature=Number($("tempInput").value);w.oxygen=Number($("oxygenInput").value);if(old!==w.gravity+":"+w.temperature+":"+w.oxygen){addEvent(w,"물리 조건 변경","중력 "+w.gravity.toFixed(1)+" m/s², 평균 기온 "+w.temperature+"°C, 산소 "+w.oxygen+"% 조건이 적용되었습니다. 생존 가능성과 환경 변화에 직접 영향을 줍니다.","⚛","system");const c=w.citizens[0];if(c)addReaction(w,"unusual",c.name,c.trait,"물리 조건이 바뀌었어. 이 환경에서 살아갈 수 있을지 걱정돼.","물리 조건 변경");updatePhysicsWarning(w,physicsRisk(w));}closeModal();save();renderWorld();showToast("새로운 물리 조건을 적용했어요.");}}],"PHYSICS LAB");
    const update=()=>{if(!$("gravityInput"))return;$("gravityOut").textContent=Number($("gravityInput").value).toFixed(1)+" m/s²";$("tempOut").textContent=$("tempInput").value+" °C";$("oxygenOut").textContent=$("oxygenInput").value+"%";};
    ["gravityInput","tempInput","oxygenInput"].forEach(id=>$(id)?.addEventListener("input",update));
  }
  function applyAIAction(w,data){
    if(!data||typeof data!=="object"||typeof data.action!=="string")return false;
    const action=data.action;
    if(action==="set_weather"){if(!setWeather(w,String(data.weather||"").toLowerCase())){showToast("날씨는 clear/rain/storm/snow/drought 중에서 선택해 주세요.");return true;}save();renderWorld();showToast("AI 명령 적용: 날씨를 변경했어요.");return true;}
    if(action==="outbreak"||action==="start_epidemic"){startEpidemic(w,data.severity||2);save();renderWorld();showToast("AI 명령 적용: 전염병이 발생했어요.");return true;}
    if(action==="end_epidemic"){if(w.epidemic)w.epidemic.active=false;w.citizens.forEach(c=>{c.infected=false;c.infectedDays=0;});addEvent(w,"전염병 치료","치료 조치로 전염병 확산을 강제로 중단했습니다.","🩺","milestone");save();renderWorld();showToast("AI 명령 적용: 전염병을 종식했어요.");return true;}
    if(action==="force_war"||action==="start_war"){const ok=forceWar(w,data.attackerId,data.defenderId);if(ok){save();renderWorld();showToast("AI 명령 적용: 국가 간 전쟁을 시작했어요.");}return true;}
    if(action==="end_war"||action==="peace"){endWar(w);save();renderWorld();showToast("AI 명령 적용: 휴전 협정을 맺었어요.");return true;}
    if(action==="add_citizens"){
      const count=Math.floor(Number(data.count));
      if(!Number.isFinite(count)||count<1||count>100){showToast("시민 추가는 한 번에 1~100명까지 가능해요.");return true;}
      addPeople(w,count,typeof data.job==="string"&&jobs.includes(data.job)?data.job:"random");showToast("AI 명령 적용: 시민 "+count+"명 추가");return true;
    }
    if(action==="create_settlement"){
      if(w.settlementData.length>=10){showToast("정착지는 최대 10곳까지 만들 수 있어요.");return true;}
      if(w.population<8){showToast("마을을 만들려면 시민이 최소 8명 필요해요.");return true;}
      createSettlementInWorld(w,false);addEvent(w,"새로운 마을 형성","AI 명령으로 실제 정착지가 만들어졌고 시민 일부가 새 마을에 거주하도록 배정되었습니다.","🏡","village");syncSettlementPopulations(w);unlockAchievements(w);save();renderWorld();showToast("AI 명령 적용: 새로운 마을 형성");return true;
    }
    if(action==="start_research"){
      w.manualResearch=1;addEvent(w,"연구 활동 시작","사용자 명령에 따라 연구 활동을 장려합니다. 연구 효과는 잠시 동안 적용됩니다.","🔭","discovery");save();renderWorld();showToast("AI 명령 적용: 연구 활동 시작");
      setTimeout(()=>{const current=worlds.find(x=>x.id===w.id);if(current){current.manualResearch=0;save();}},30000);return true;
    }
    if(action==="set_time"){
      if(typeof data.paused!=="boolean")return false;
      w.paused=data.paused;save();renderWorld();showToast(data.paused?"AI 명령 적용: 시간을 멈췄어요":"AI 명령 적용: 시간을 다시 흐르게 했어요");return true;
    }
    if(action==="set_speed"){
      const speed=Math.floor(Number(data.speed));if(!Number.isFinite(speed)||speed<1||speed>100){showToast("시간 배속은 1~100배 범위만 가능해요.");return true;}
      w.speed=speed;$("speedSlider").value=speed;$("speedLabel").textContent=speed+"×";save();renderWorld();showToast("AI 명령 적용: 시간 배속 "+speed+"배");return true;
    }
    if(action==="set_physics"){
      const changes=[];
      if(data.gravity!==undefined){const v=Number(data.gravity);if(!Number.isFinite(v)||v<0.5||v>25){showToast("중력은 0.5~25 m/s² 범위만 적용할 수 있어요.");return true;}if(v!==w.gravity){w.gravity=v;changes.push("중력 "+v.toFixed(1)+" m/s²");}}
      if(data.temperature!==undefined){const v=Number(data.temperature);if(!Number.isFinite(v)||v< -80||v>80){showToast("평균 기온은 -80~80°C 범위만 적용할 수 있어요.");return true;}if(v!==w.temperature){w.temperature=v;changes.push("기온 "+v+"°C");}}
      if(data.oxygen!==undefined){const v=Number(data.oxygen);if(!Number.isFinite(v)||v<0||v>40){showToast("산소 농도는 0~40% 범위만 적용할 수 있어요.");return true;}if(v!==w.oxygen){w.oxygen=v;changes.push("산소 "+v+"%");}}
      if(!changes.length){showToast("적용할 물리 조건의 변화가 없어요.");return true;}
      addEvent(w,"물리 조건 변경",changes.join(", ")+" 조건을 적용했습니다. 생존 가능성과 환경 변화가 달라질 수 있습니다.","⚛","system");save();renderWorld();showToast("AI 명령 적용: "+changes.join(", "));return true;
    }
    if(action==="adjust_world"){
      const key=data.variable;if(!["food","resources","environment"].includes(key))return false;
      const operation=data.operation,current=Number(w[key]),amount=Number(data.amount);if(!Number.isFinite(amount)||amount<=0||amount>100)return false;
      let next=operation==="set"?amount:operation==="decrease"?current-amount:operation==="increase"?current+amount:NaN;if(!Number.isFinite(next))return false;
      next=Math.max(0,Math.min(100,next));w[key]=next;const label=({food:"식량",resources:"자원",environment:"자연 환경"})[key];
      addEvent(w,label+" 변화",label+" 상태가 사용자 명령에 따라 "+Math.round(next)+" / 100으로 조정되었습니다.","⚖️","system");save();renderWorld();showToast("AI 명령 적용: "+label+" "+Math.round(next)+"/100");return true;
    }
    return false;
  }
  async function executeCommand(raw){
    const w=activeWorld();if(!w)return;const cmd=String(raw||"").trim();if(!cmd)return;
    if(!window.puter||!puter.ai||typeof puter.ai.chat!=="function"){showToast("AI 서비스에 연결할 수 없어 명령을 적용하지 못했어요.");return;}
    await interpretCommandWithAI(cmd);
  }
  async function interpretCommandWithAI(userText){
    const worldId=activeId,w=activeWorld();if(!w)return;
    if(!window.puter||!puter.ai||typeof puter.ai.chat!=="function"){showToast("AI 서비스를 불러오지 못했어요. 연결 상태를 확인해 주세요.");return;}
    const prompt=[
      "너는 문명 시뮬레이션의 안전한 명령 실행기다. 사용자 요청의 의도를 판단하고 아래 action JSON 하나만 반환한다.",
      '반드시 JSON 형식: {"action":string|null, ...}. 마크다운, 설명, 다른 텍스트는 금지한다.',
      '1) add_citizens: {"action":"add_citizens","count":1~100,"job":"직업명 또는 random"}. 시민을 추가/늘려 달라는 요청.',
      '2) create_settlement: {"action":"create_settlement"}. 마을/정착지를 만들라는 요청.',
      '3) start_research: {"action":"start_research"}. 과학/기술 연구를 시작하거나 촉진.',
      '4) set_time: {"action":"set_time","paused":true|false}. 시간을 멈추거나 다시 흐르게.',
      '5) set_speed: {"action":"set_speed","speed":1~100}. 시간 배속 변경.',
      '6) set_physics: {"action":"set_physics", optional gravity:0.5~25, temperature:-80~80, oxygen:0~40}. 명시된 물리 조건 변경. 단위는 중력 m/s², 기온 °C, 산소 %.',
      '7) adjust_world: {"action":"adjust_world","variable":"food"|"resources"|"environment","operation":"increase"|"decrease"|"set","amount":1~100}. 식량/자원/환경 수치를 조정. 현재 수치는 0~100.',
      '8) set_weather: {"action":"set_weather","weather":"clear"|"rain"|"storm"|"snow"|"drought"}. 비·폭풍·눈·가뭄·맑은 날씨를 적용한다.',
      '9) outbreak: {"action":"outbreak","severity":1|2|3}. 가상의 전염병 이벤트를 시작한다.',
      '10) end_epidemic: {"action":"end_epidemic"}. 전염병을 종료한다.',
      '11) force_war: {"action":"force_war"}. 필요하면 정착지를 분리해 두 국가를 만들고 전쟁을 시작한다.',
      '12) end_war: {"action":"end_war"}. 진행 중인 전쟁을 끝내고 휴전한다.',
      "지원 목록 밖의 요청은 action:null로 반환한다.",
      "현재 세계 상태: 이름="+w.name+", 인구="+w.population+", 정착지="+w.settlements+", 국가="+w.nations.map(n=>n.name).join(",")+", 진행 중 전쟁="+(w.wars||[]).filter(x=>x.active).length+", 날씨="+(w.weather||"clear")+", 전염병="+(w.epidemic?.active?w.epidemic.name:"없음")+", 연구="+Math.round(w.research)+", 기술="+techLabel(w)+", 배속="+w.speed+", 식량="+Math.round(w.food)+"/100, 자원="+Math.round(w.resources)+"/100, 환경="+Math.round(w.environment)+"/100, 중력="+w.gravity+"m/s², 기온="+w.temperature+"°C, 산소="+w.oxygen+"%.",
      "사용자 명령: "+userText
    ].join(String.fromCharCode(10));
    showToast("AI가 명령을 해석하고 있어요…");
    try{
      const response=await puter.ai.chat(prompt);if(activeId!==worldId)return;
      const answer=typeof response==="string"?response:(response?.message?.content??response?.text??response?.content??"");
      const clean=String(answer).replace(/\x60\x60\x60json|\x60\x60\x60/gi,"").trim(),data=JSON.parse(clean);
      if(!data||typeof data!=="object"||typeof data.action!=="string"){showToast("AI가 이 요청을 현재 시뮬레이션에 적용할 수 없다고 판단했어요.");return;}
      if(!applyAIAction(w,data))showToast("AI가 해석한 변화는 아직 시뮬레이션에서 지원하지 않아요.");
    }catch(error){console.error("AI command interpretation failed",error);showToast("AI 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");}
  }
  function showCitizen(id){
    const w=activeWorld();const c=w?.citizens.find(x=>x.id===id);if(!c)return;
    const memories=(c.memory||[]).map(m=>"<li>"+esc(m)+"</li>").join("")||"<li>아직 기록된 기억이 없습니다.</li>";
    showModal(c.name,"<div style='display:flex;gap:13px;align-items:center;margin-bottom:16px'><div class='avatar' style='width:54px;height:54px;font-size:24px'>"+esc(c.icon)+"</div><div><strong style='font-size:15px'>"+esc(c.name)+"</strong><p style='color:#a6b6cf;font-size:11px;margin:6px 0'>"+esc(c.job)+" · "+esc(c.age)+"세</p><span class='pill'>"+esc(c.trait)+"</span></div></div><div class='form-field'><label>개인 능력</label><div class='modal-note'>기술 숙련도 "+esc(c.skill)+"/5 · 사회적 관계 "+esc(c.relations)+"명</div></div><div class='form-field'><label>기억</label><ul style='margin:0;padding-left:19px;color:#b7c5d8;font-size:11px;line-height:1.8'>"+memories+"</ul></div><div class='modal-note'>시민의 상세한 감정·관계 시뮬레이션은 기초 단계입니다. 현재 기록은 실제 세계 사건과 시민 생성에 기반합니다.</div>",[{label:"닫기",className:"primary-btn",onClick:closeModal}],"CITIZEN PROFILE");
  }
  function bindMapGestures(){
    const map=$("worldMap");if(!map)return;
    const has3d=!!(window.World3D&&window.World3D.init($("world3dHost")));
    if(has3d)map.classList.add("has-world3d");
    const points=new Map();let startDistance=0,startZoom=3.2,startMid=null,lastMid=null,dragStart=null,dragged=false;
    let zoom=3.2;
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    const point=e=>({x:e.clientX,y:e.clientY});
    const applyZoom=value=>{zoom=clamp(value,.55,4.8);if(has3d)window.World3D.setZoom(zoom);else{const scene=$("mapScene");if(scene)scene.style.transform="translate3d(0,0,0) scale("+zoom+")";}};
    map.style.touchAction="none";
    map.addEventListener("pointerdown",e=>{
      if(e.target.closest("button,.map-toolbar,.map-overlay-head,.map-caption,.tool-toggle"))return;
      points.set(e.pointerId,point(e));try{map.setPointerCapture(e.pointerId);}catch(_){}
      dragged=false;
      if(points.size===1){dragStart=point(e);lastMid=point(e);}
      if(points.size===2){const a=[...points.values()];startDistance=distance(a[0],a[1]);startZoom=zoom;startMid=midpoint(a[0],a[1]);lastMid=startMid;}
    });
    map.addEventListener("pointermove",e=>{
      if(!points.has(e.pointerId))return;
      points.set(e.pointerId,point(e));
      if(points.size>=2){
        const a=[...points.values()],d=distance(a[0],a[1]),mid=midpoint(a[0],a[1]);
        if(startDistance>0)applyZoom(startZoom*d/startDistance);
        if(startMid&&lastMid&&has3d)window.World3D.pan(mid.x-lastMid.x,mid.y-lastMid.y);
        if(startMid&&lastMid&&!has3d){const scene=$("mapScene");if(scene){const dx=mid.x-startMid.x,dy=mid.y-startMid.y;scene.style.transform="translate3d("+dx+"px,"+dy+"px,0) scale("+zoom+")";}}
        lastMid=mid;dragged=true;e.preventDefault();
      }else if(points.size===1&&dragStart){
        const p=point(e),dx=p.x-lastMid.x,dy=p.y-lastMid.y;
        if(Math.abs(p.x-dragStart.x)+Math.abs(p.y-dragStart.y)>4)dragged=true;
        if(has3d)window.World3D.pan(dx,dy);
        else{const scene=$("mapScene");if(scene)scene.style.transform="translate3d("+(p.x-dragStart.x)+"px,"+(p.y-dragStart.y)+"px,0) scale("+zoom+")";}
        lastMid=p;e.preventDefault();
      }
    },{passive:false});
    const end=e=>{points.delete(e.pointerId);if(points.size<2){startDistance=0;startMid=null;}if(points.size===1){dragStart=[...points.values()][0];lastMid=dragStart;}else dragStart=null;};
    map.addEventListener("pointerup",end);map.addEventListener("pointercancel",end);map.addEventListener("lostpointercapture",end);
    map.addEventListener("wheel",e=>{if(e.target.closest(".map-toolbar,.map-overlay-head,.map-caption,.tool-toggle"))return;e.preventDefault();applyZoom(zoom*(e.deltaY<0?1.12:.89));},{passive:false});
    $("zoomInBtn").addEventListener("click",()=>applyZoom(zoom*1.22));
    $("zoomOutBtn").addEventListener("click",()=>applyZoom(zoom/1.22));
    window.addEventListener("world3dcitizenclick",e=>{if(e.detail&&e.detail.id){if(has3d)window.World3D.focusCitizen(e.detail.id);showCitizen(e.detail.id);}});
    window.addEventListener("world3dsettlementclick",e=>{if(e.detail&&e.detail.id)showSettlement(e.detail.id);});
    window.addEventListener("world3dsettlementclear",()=>{selectedSettlementId=null;renderSettlementInfo(activeWorld());});
    applyZoom(3.2);
  }
  function bind(){
    $("startBtn").addEventListener("click",()=>{enterLandscapeMode();$("welcomeView").classList.add("hidden");$("homeView").classList.remove("hidden");renderHome();window.scrollTo({top:0,behavior:"smooth"});});
    $("installAppBtn").addEventListener("click",async()=>{
      if(!deferredInstallPrompt)return;
      const installPrompt=deferredInstallPrompt;
      deferredInstallPrompt=null;
      $("installAppBtn").classList.add("hidden");
      try{await installPrompt.prompt();await installPrompt.userChoice;}
      catch(error){console.warn("PWA installation prompt failed:",error);}
    });
    $("createWorldBtn").addEventListener("click",createWorldModal);$("emptyCreateBtn").addEventListener("click",createWorldModal);
    $("worldList").addEventListener("click",e=>{const menu=e.target.closest("[data-card-menu]");if(menu){e.stopPropagation();const w=worlds.find(x=>x.id===menu.dataset.cardMenu);if(w){showModal(w.name,'<p style="font-size:12px;color:#b8c6db">이 세계에서 실행할 작업을 선택하세요. 초기화와 삭제는 이 세계에만 적용됩니다.</p>',[{label:"닫기",className:"secondary-btn",onClick:closeModal},{label:"열기",className:"primary-btn",onClick:()=>{closeModal();openWorld(w.id);}},{label:"이름 수정하기",className:"secondary-btn",onClick:()=>renameWorld(w.id)},{label:"초기화",className:"secondary-btn",onClick:()=>resetWorld(w.id)},{label:"삭제",className:"danger-btn",onClick:()=>deleteWorld(w.id)}]);}return;}const card=e.target.closest("[data-open-world]");if(card)openWorld(card.dataset.openWorld);});
    $("worldList").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-open-world]")){e.preventDefault();openWorld(e.target.dataset.openWorld);}});
    $("backHomeBtn").addEventListener("click",goHome);$("toolToggleBtn").addEventListener("click",()=>{const open=!document.body.classList.contains("tools-open");document.body.classList.toggle("tools-open",open);$("toolToggleBtn").setAttribute("aria-expanded",String(open));$("toolToggleBtn").querySelector(".tool-toggle-label").textContent=open?"도구 닫기":"도구 열기";});$("worldMenuBtn").addEventListener("click",()=>$("worldMenu").classList.toggle("hidden"));
    $("renameWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");renameWorld();});
    $("cloneWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");cloneWorld();});
    $("resetWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");resetWorld();});
    $("deleteWorldBtn").addEventListener("click",()=>{$("worldMenu").classList.add("hidden");deleteWorld();});
    $("playPauseBtn").addEventListener("click",()=>{const w=activeWorld();if(!w)return;w.paused=!w.paused;save();renderWorld();});
    $("speedSlider").addEventListener("input",e=>{const w=activeWorld();if(!w)return;w.speed=Number(e.target.value);$("speedLabel").textContent=w.speed+"×";save();});
    $("addPeopleBtn").addEventListener("click",addPeopleModal);$("physicsBtn").addEventListener("click",physicsModal);
    $("commandForm").addEventListener("submit",e=>{e.preventDefault();const input=$("commandInput");executeCommand(input.value);input.value="";});
    $("reactionFilters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;$("reactionFilters").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderWorld();});
    $("citizenRefreshBtn").addEventListener("click",()=>{renderWorld();showToast("시민 목록을 새로고침했어요.");});
    $("settlementNameInput").addEventListener("input",e=>{
      const w=activeWorld(),a=w?.settlementData?.find(x=>x.id===selectedSettlementId),value=e.currentTarget.value.trim();
      if(!a||!value)return;
      a.name=value;save();
    });
    $("settlementNameInput").addEventListener("change",e=>{
      const w=activeWorld(),a=w?.settlementData?.find(x=>x.id===selectedSettlementId);
      if(!a)return;
      const value=e.currentTarget.value.trim();
      if(value)a.name=value;else e.currentTarget.value=a.name||"이름 없는 마을";
      save();renderSettlementInfo(w);
    });
    $("settlementNameInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}});
    $("citizenList").addEventListener("click",e=>{const c=e.target.closest("[data-citizen]");if(c)showCitizen(c.dataset.citizen);});
    $("citizenList").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-citizen]")){e.preventDefault();showCitizen(e.target.dataset.citizen);}});
    $("modalCloseBtn").addEventListener("click",closeModal);$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();$("worldMenu").classList.add("hidden");}});
    $("helpBtn").addEventListener("click",()=>showModal("나의 세계 사용 안내",'<div class="form-field"><label>세계 만들기</label><small>최대 10개의 세계를 만들 수 있습니다. 이름과 시민, 물리법칙, 사건 기록은 세계마다 따로 저장됩니다.</small></div><div class="form-field"><label>시뮬레이션</label><small>시간 배속을 1~100배로 조절하거나 일시 정지할 수 있습니다. 이 화면을 열어 둔 동안에만 시간이 진행됩니다.</small></div><div class="form-field"><label>기술 발전</label><small>시민과 연구 축적에 따라 기술이 발전합니다. 실제 역사 전체를 완벽히 재현하는 모델이 아니라 규칙 기반 프로토타입입니다.</small></div><div class="form-field"><label>저장과 AI</label><small>데이터는 이 브라우저의 로컬 저장소에 저장됩니다. 외부 AI API, 계정 동기화, 서버 백그라운드 시뮬레이션은 아직 연결되지 않았습니다.</small></div>',[{label:"알겠어요",className:"primary-btn",onClick:closeModal}],"QUICK GUIDE"));
    window.addEventListener("beforeunload",save);
    bindMapGestures();
  }
  function setScale(scale){if(!levelNames[scale])return;activeScale=scale;if(window.World3D){window.World3D.setScale(scale);window.World3D.setZoom(1);}document.querySelectorAll("[data-scale]").forEach(b=>b.classList.toggle("active",b.dataset.scale===scale));if(activeWorld())renderWorld();}
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
    $("welcomeView").classList.remove("hidden");$("homeView").classList.add("hidden");$("worldView").classList.add("hidden");
    bind();renderHome();startSimulation();
  }
  window.addEventListener("beforeinstallprompt",(event)=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    const installButton=$("installAppBtn");
    if(installButton)installButton.classList.remove("hidden");
  });
  window.addEventListener("appinstalled",()=>{
    deferredInstallPrompt=null;
    const installButton=$("installAppBtn");
    if(installButton)installButton.classList.add("hidden");
  });
  init();
  requestLandscape();
  document.addEventListener("fullscreenchange",requestLandscape);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)requestLandscape();});
  window.addEventListener("pageshow",requestLandscape);
  window.addEventListener("focus",requestLandscape);
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();