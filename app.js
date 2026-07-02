
const KEY="ras_v5_3_7";
const skillsMap={force:"⚔ Force",discipline:"🛡 Discipline",intelligence:"🧠 Intelligence",domination:"👑 Domination",sante:"❤️ Santé"};
const bosses=[["HYROX — Être prêt pour le 12 juillet","Boss majeur","force"],["Training — 6 séances validées cette semaine","Mini Boss","force"],["RAS — Lancer une offre coaching claire","Boss business","domination"],["PHF — Structurer menu + catalogue + ventes","Boss business","domination"],["APEX — 6h formation dans la semaine","Boss savoir","intelligence"],["Hygiène — 30 jours brossage dents","Boss discipline","discipline"],["Nutrition — 5 repas/jour sur 7 jours","Boss santé","sante"]];
const dailyMissions={0:["Training + Batch + Weekly Reset"],1:["Livraison PHF 8h-11h"],2:["Développement RAS"],3:["Batch cooking personnel"],4:["Vente PHF 11h-14h"],5:["Programmation sportive"],6:["Production PHF journée entière"]};
const defaultObjectives=[
{id:"morning",period:"🌅 MATIN",title:"Protocole matin",desc:"Réveil 6h · visage dans la glace · soin visage · coiffure/barbe · préparation mentale",xp:45,glory:9,skill:"discipline"},
{id:"meal1",period:"🍽️ REPAS",title:"Repas 1 + dents",desc:"Petit-déjeuner validé · brossage dents après repas",xp:25,glory:5,skill:"sante",streak:"nutrition"},
{id:"study",period:"🧠 SAVOIR",title:"Bloc savoir",desc:"APEX · lecture · développement personnel",xp:60,glory:12,skill:"intelligence",streak:"apex"},
{id:"training",period:"⚔️ TRAINING",title:"Épreuve physique",desc:"Training du jour · séance notée · douche salle · repas post-training",xp:120,glory:24,skill:"force",streak:"training"},
{id:"meal2",period:"🍽️ REPAS",title:"Repas 2 + dents",desc:"Déjeuner / post-training validé · brossage dents après repas",xp:25,glory:5,skill:"sante",streak:"nutrition"},
{id:"work",period:"👑 DOMINATION",title:"Bloc business",desc:"RAS · PHF · programmation · coaching · messages clients",xp:80,glory:16,skill:"domination"},
{id:"meal3",period:"🍽️ REPAS",title:"Repas 3 + dents",desc:"Collation validée · brossage dents après repas",xp:20,glory:4,skill:"sante",streak:"nutrition"},
{id:"meal4",period:"🍽️ REPAS",title:"Repas 4 + dents",desc:"Collation validée · brossage dents après repas",xp:20,glory:4,skill:"sante",streak:"nutrition"},
{id:"meal5",period:"🍽️ REPAS",title:"Repas 5 + dents",desc:"Dîner validé · brossage dents après repas",xp:25,glory:5,skill:"sante",streak:"nutrition"},
{id:"evening",period:"🌙 SOIR",title:"Protocole soir",desc:"Douche si nécessaire · rangement rapide · prière · CBD chill canapé · coucher 22h30",xp:60,glory:12,skill:"discipline",streak:"sommeil"},
{id:"journal",period:"📜 DÉBRIEF",title:"Rapport de mission",desc:"Journée clôturée · notes rapides · préparation de demain",xp:30,glory:6,skill:"discipline",streak:"journal"}
];
const achievements=[["Premier jour joué",s=>s.history.length>=1],["7 journées sauvegardées",s=>s.history.length>=7],["Level 10 atteint",s=>lvl(s.totalXp).level>=10],["250 Glory gagnées",s=>s.history.reduce((a,b)=>a+b.glory,0)>=250],["Série Training 7 jours",s=>s.streaks.training>=7],["Série Sommeil 7 jours",s=>s.streaks.sommeil>=7],["Journée parfaite 100%",s=>s.history.some(h=>h.pct===100)],["5 journées à 80%+",s=>s.history.filter(h=>h.pct>=80).length>=5],["Domination Lv.10",s=>Math.floor(s.skills.domination/100)+1>=10]];
const defaultState={version:"5.0.1",totalXp:0,glory:0,skills:{force:0,discipline:0,intelligence:0,domination:0,sante:0},streaks:{training:0,lecture:0,sommeil:0,priere:0,apex:0,nutrition:0,journal:0},done:{},history:[],gloryLog:[],bossIndex:0,bossProgress:0,sound:false,music:false,player:null,onboarded:false};
let state=load(), displayXp=0, displayGlory=0, displayLevel=1;
function need(l){return Math.round(100*Math.pow(l,1.35))}
function lvl(xp){let level=1,x=xp;while(x>=need(level)){x-=need(level);level++}return{level,current:x,needed:need(level)}}
function load(){try{return {...structuredClone(defaultState),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function show(id,btn){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".navbtn,.mobileNav button").forEach(b=>b.classList.remove("active"));if(btn)btn.classList.add("active");render();if(id==="qg"){setTimeout(()=>setCompanionDialogue("qg"),80)}updateSoundButton();updateMusicButton()}

function toggleMoreMenu(force){
  if(!document.getElementById("moreMenu")) return;
  const show = typeof force==="boolean" ? force : !moreMenu.classList.contains("show");
  moreMenu.classList.toggle("show",show);
}

function showById(id){show(id,null)}
function init(){renderBossSelect();prefillToday();displayXp=state.totalXp;displayGlory=state.glory;displayLevel=lvl(state.totalXp).level;render()}
function prefillToday(){missionTitle.textContent=dailyMissions[new Date().getDay()][0]}
function nextActiveObjective(){
  return defaultObjectives.find(o=>!state.done[o.id]) || null;
}
function renderMissionCards(){
  const active=defaultObjectives.filter(o=>!state.done[o.id]);
  const done=defaultObjectives.filter(o=>state.done[o.id]);
  const current=nextActiveObjective();

  if(document.getElementById("currentMissionZone")){
    currentMissionZone.innerHTML=current?`
      <div class="currentMissionCard">
        <div class="companionMini">${pickDialogue("mission")}</div><div class="missionPeriod">${current.period}</div>
        <h2>${current.title}</h2>
        <p>${current.desc}</p>
        <div class="currentMissionReward">+${current.xp} XP · +${current.glory} ⚜</div>
        <button class="primary" onclick="toggleObjective('${current.id}')">ACCOMPLIR LA MISSION</button>
      </div>`:
      `<div class="currentMissionCard">
        <div class="companionMini">${pickDialogue("complete")}</div><div class="missionPeriod">✅ JOURNÉE COMPLÈTE</div>
        <h2>Toutes les missions sont accomplies.</h2>
        <p>Retourne au QG et termine officiellement la mission du jour.</p>
        <button class="primary" onclick="showById('home')">Retour aux Ordres</button>
      </div>`;
  }

  missionCards.innerHTML=active.length?active.slice(1).map(cardHTML).join(""):"<div class='muted'>Aucune mission restante.</div>";
  completedMissions.innerHTML=done.length?renderPeriodGroups(done):"<div class='muted'>Aucune mission accomplie pour le moment.</div>";
}
function renderPeriodGroups(list){
  const periods=[...new Set(list.map(o=>o.period))];
  return periods.map(period=>{
    const cards=list.filter(o=>o.period===period).map(cardHTML).join("");
    return `<div class="card span-12 periodGroup"><h2>${period}</h2><div class="grid">${cards}</div></div>`;
  }).join("");
}
function cardHTML(o){
  return `<div class="missionCard span-6 ${state.done[o.id]?'done':''}"><div class="rank">${skillsMap[o.skill]}</div><h2>${o.title}</h2><p class="muted">${o.desc}</p><div class="reward">+${o.xp} XP · +${o.glory} ⚜</div><button class="${state.done[o.id]?'secondary':'primary'}" onclick="toggleObjective('${o.id}')">${state.done[o.id]?'Annuler':'ACCOMPLIR'}</button></div>`;
}
function toggleObjective(id){
  const was=!!state.done[id];
  state.done[id]=!was;
  const o=defaultObjectives.find(x=>x.id===id);
  if(state.done[id]){
    setCompanionDialogue("success");
    companionSpeak("success");
    playDialogueSound();
    playSound("cling");
    flash(`+${o.xp} XP  +${o.glory} ⚜`);
    floatReward.textContent=`+${o.xp} XP   +${o.glory} ⚜`;
    floatReward.classList.remove('show');
    void floatReward.offsetWidth;
    floatReward.classList.add('show');
    if(navigator.vibrate) navigator.vibrate(45);
  }
  save();render();
}
function calc(){
  let xp=0,glory=0,done=0,ids=[],sg={force:0,discipline:0,intelligence:0,domination:0,sante:0};
  defaultObjectives.forEach(o=>{if(state.done[o.id]){done++;ids.push(o.id);xp+=o.xp;glory+=o.glory;sg[o.skill]+=o.xp}});
  return{xp,glory,done,total:defaultObjectives.length,ids,sg}
}
function animateNumber(from,to,duration,onUpdate,onDone){
  const start=performance.now();
  function tick(now){
    const p=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-p,3);
    onUpdate(Math.round(from+(to-from)*eased));
    if(p<1)requestAnimationFrame(tick); else if(onDone)onDone();
  }
  requestAnimationFrame(tick);
}

const companionDialogues={
  morning:[
    "Une nouvelle journée commence.",
    "Tes ordres sont prêts.",
    "Aujourd’hui, avance sans négocier avec la faiblesse.",
    "Chaque mission accomplie renforce ton personnage.",
    "Un Roi ne gagne pas par hasard. Il répète ses protocoles.",
    "Lève-toi, respire, exécute.",
    "Le royaume se construit dès les premières actions.",
    "Commence proprement. Le reste suivra.",
    "Aujourd’hui, tu n’as pas besoin d’être parfait. Tu dois avancer.",
    "Ton futur toi observe ce que tu fais maintenant.",
    "Une journée claire vaut mieux qu’une journée subie.",
    "Le premier pas est souvent le plus important.",
    "Tu ouvres les portes. À toi de conquérir la journée.",
    "Prépare-toi. Les petites actions forgent les grandes victoires.",
    "La discipline commence avant l’envie."
  ],
  qg:[
    "Tes ordres sont prêts.",
    "Le royaume se construit mission après mission.",
    "Tu n’as pas besoin d’être parfait. Tu dois avancer.",
    "La discipline est ton arme principale.",
    "Le Boss ne tombera pas tout seul.",
    "Regarde ton niveau. Il raconte tes choix.",
    "La Glory se gagne. Elle ne se réclame pas.",
    "Chaque retour au QG doit servir à repartir plus fort.",
    "Ne confonds pas repos et fuite.",
    "Tu es ici pour structurer la journée, pas pour la subir.",
    "Un système solide bat une motivation fragile.",
    "Le QG est calme. La mission ne l’est pas.",
    "Tes habitudes sont ton armure invisible.",
    "Chaque protocole validé fortifie le royaume.",
    "Tu es plus proche du prochain niveau que tu ne le crois."
  ],
  mission:[
    "Une mission à la fois.",
    "Concentre-toi sur celle-ci. Le reste attendra.",
    "Valide proprement. Puis passe à la suivante.",
    "C’est ici que l’XP se gagne.",
    "La prochaine victoire est juste devant toi.",
    "Ne regarde pas toute la montagne. Pose le pied suivant.",
    "Une action claire. Pas de négociation.",
    "Chaque mission terminée retire du pouvoir au chaos.",
    "La constance est plus brutale que l’intensité.",
    "Tu n’as pas besoin d’être motivé. Tu dois exécuter.",
    "Ce n’est pas énorme. C’est nécessaire.",
    "Le jeu avance quand tu agis.",
    "Une case de plus, un niveau plus proche.",
    "Fais simple. Fais propre. Fais maintenant.",
    "La mission actuelle est la seule qui compte."
  ],
  success:[
    "Bien joué.",
    "Mission accomplie.",
    "Une de moins. Continue.",
    "Le système fonctionne quand tu l’appliques.",
    "Ton personnage progresse.",
    "Voilà. C’est comme ça qu’on gagne.",
    "XP méritée.",
    "Ce petit geste compte plus que tu ne le crois.",
    "La série respire encore.",
    "Le Boss vient de perdre du terrain.",
    "Tu viens de renforcer ton identité.",
    "Encore une preuve que tu peux tenir.",
    "Reste dans le rythme.",
    "La prochaine mission t’attend.",
    "Ce n’était pas spectaculaire. C’était efficace."
  ],
  complete:[
    "Toutes les missions sont accomplies.",
    "Retourne au QG. La journée est presque scellée.",
    "Le Boss a senti le coup passer.",
    "Belle exécution.",
    "Mission complète. Reviens demain plus fort.",
    "La journée est validée. Respecte le travail accompli.",
    "Tu as gagné ton repos.",
    "Le royaume avance.",
    "C’est ce genre de journée qui change une trajectoire.",
    "Demain, on recommence.",
    "Aujourd’hui, tu as nourri le personnage.",
    "Tu peux clôturer la journée proprement.",
    "Le système a été respecté.",
    "C’est une victoire réelle, même si personne ne l’a vue.",
    "Fin de mission. Retour au calme."
  ],
  streak:[
    "La série continue. Ne la casse pas.",
    "Chaque jour validé rend le suivant plus facile.",
    "Tu construis une dynamique dangereuse pour tes anciennes excuses.",
    "La série est une lame. Garde-la affûtée.",
    "Un jour raté peut arriver. Deux deviennent une habitude.",
    "Protège ta série comme un trésor.",
    "La continuité est ta plus grosse arme.",
    "Tu n’es plus en train d’essayer. Tu construis.",
    "La série parle pour toi.",
    "Reste fidèle au protocole."
  ],
  idle:[
    "Je surveille la progression.",
    "On avance quand tu avances.",
    "Pas besoin de bruit. Juste de l’exécution.",
    "Je reste là. À toi d’agir.",
    "Le prochain niveau attend.",
    "Chaque choix laisse une trace.",
    "Ton personnage devient ce que tu répètes.",
    "Le royaume n’aime pas l’improvisation.",
    "Une bonne journée commence par une bonne décision.",
    "Le calme avant la prochaine mission."
  ]
};
function pickDialogue(type="qg"){
  const list=companionDialogues[type]||companionDialogues.qg;
  return list[Math.floor(Math.random()*list.length)];
}
function setCompanionDialogue(type="qg"){
  const text=pickDialogue(type);
  if(document.getElementById("companionBubble")){
    companionBubble.textContent=text;
    companionBubble.classList.remove("dialoguePulse");
    void companionBubble.offsetWidth;
    companionBubble.classList.add("dialoguePulse");
  }
  return text;
}
function playDialogueSound(){
  if(typeof tone==="function" && state.sound){
    tone(740,0,.035,"square",.018);
    tone(620,.045,.035,"square",.015);
  }
}


function dialogueTypeForScreen(id){
  if(id==="home") return "morning";
  if(id==="qg") return "qg";
  if(id==="mission") return "mission";
  if(id==="boss") return "qg";
  if(id==="shop") return "qg";
  if(id==="achievements") return "success";
  if(id==="weekly") return "complete";
  return "qg";
}
function renderGlobalCompanion(){
  if(!document.getElementById("globalCompanion")) return;
  globalAvatarMini.innerHTML=avatarHTML();
  const active=document.querySelector(".screen.active");
  const isQG=active && active.id==="qg";
  document.body.classList.toggle("qg-active",isQG);
  if(!globalDialogue.dataset.ready){
    globalDialogue.dataset.ready="1";
    globalDialogue.textContent=pickDialogue("idle");
  }
}
function companionSpeak(type="qg"){
  const text=pickDialogue(type);
  if(document.body.classList.contains("qg-active") && document.getElementById("qgHeroDialogue")){
    qgHeroDialogue.textContent=text;
    qgHeroDialogue.classList.remove("speak");
    void qgHeroDialogue.offsetWidth;
    qgHeroDialogue.classList.add("speak");
  }else if(document.getElementById("globalDialogue")){
    globalDialogue.textContent=text;
    globalDialogue.classList.remove("speak");
    void globalDialogue.offsetWidth;
    globalDialogue.classList.add("speak");
  }
  playDialogueSound();
  return text;
}

function render(){
  let c=calc(), targetXp=state.totalXp+c.xp, targetGlory=state.glory+c.glory, l=lvl(targetXp);
  animateNumber(displayXp,targetXp,450,v=>{displayXp=v;const dl=lvl(v);level.textContent=dl.level;xpText.textContent=`${dl.current} / ${dl.needed}`;xpFill.style.width=`${Math.round(dl.current/dl.needed*100)}%`;},()=>{if(l.level>displayLevel)showLevelUp(l.level);displayLevel=l.level});
  animateNumber(displayGlory,targetGlory,450,v=>{displayGlory=v;gloryText.textContent=v+" ⚜"});
  let pct=c.total?Math.round(c.done/c.total*100):0;dayPct.textContent=pct+"%";dayFill.style.width=pct+"%";
  mainStreak.textContent=Math.max(...Object.values(state.streaks))+" j";homeBoss.textContent=bosses[state.bossIndex][0];
  if(document.getElementById("ordersGreeting")){
    const p=state.player||{name:"Robin"};
    ordersGreeting.textContent=`Bonjour ${p.name||"Robin"}.`;
    ordersMissionCount.textContent=defaultObjectives.filter(o=>!state.done[o.id]).length;
    ordersBoss.textContent=bosses[state.bossIndex][0];
    ordersStreak.textContent=Math.max(...Object.values(state.streaks))+" j";
    const nxt=nextActiveObjective();
    ordersNextMission.textContent=nxt?nxt.title:"Journée complète";
  }

  if(document.getElementById("qgLevel")) qgLevel.textContent=l.level;
  if(document.getElementById("qgXpFill")) qgXpFill.style.width=`${Math.round(l.current/l.needed*100)}%`;
  if(document.getElementById("qgGlory")) qgGlory.textContent=(state.glory+c.glory)+" ⚜";
  if(document.getElementById("qgBoss")) qgBoss.textContent=bosses[state.bossIndex][0];
  if(document.getElementById("qgAvatarMount")) qgAvatarMount.innerHTML=avatarHTML();
  if(document.getElementById("companionBubble") && !companionBubble.dataset.ready){companionBubble.dataset.ready="1";setCompanionDialogue("qg");}
  if(document.getElementById("qgHeroDialogue") && !qgHeroDialogue.dataset.ready){qgHeroDialogue.dataset.ready="1";qgHeroDialogue.textContent=pickDialogue("qg");}

  renderGlobalCompanion();renderMissionCards();renderStats();renderBoss();renderShop();renderAchievements();renderWeekly();
}
function renderStats(){
  skills.innerHTML=Object.entries(skillsMap).map(([k,label])=>`<div class="stat"><span>${label}</span><strong>Lv. ${Math.floor(state.skills[k]/100)+1}</strong></div><div class="bar"><div class="fill" style="width:${state.skills[k]%100}%"></div></div>`).join("");
  streaks.innerHTML=Object.entries(state.streaks).map(([k,v])=>`<div class="stat"><span>🔥 ${cap(k)}</span><strong>${v} j</strong></div>`).join("");
  if(document.getElementById("skills2")) skills2.innerHTML=skills.innerHTML;
  if(document.getElementById("streaks2")) streaks2.innerHTML=streaks.innerHTML;
  renderTrackers();
  history.innerHTML=state.history.length?state.history.slice().reverse().map(h=>`<div class="item"><span>${h.date}<br><span class="muted">${h.mainQuest||""}</span></span><strong>${h.pct}% • +${h.xp} XP • +${h.glory} ⚜</strong></div>`).join(""):"<div class='muted'>Aucune chronique.</div>";
}
function renderBossSelect(){bossSelect.innerHTML=bosses.map((b,i)=>`<option value="${i}">${b[0]}</option>`).join("");bossSelect.value=state.bossIndex;bossProgress.value=state.bossProgress;bossSelect.oninput=()=>{state.bossIndex=+bossSelect.value;save();render()};bossProgress.oninput=()=>{state.bossProgress=+bossProgress.value;save();render()}}
function renderBoss(){bossFill.style.width=(state.bossProgress||0)+"%";bossList.innerHTML=bosses.map((b,i)=>`<div class="item ${i==state.bossIndex?"":"locked"}"><span><strong>${b[0]}</strong><br><span class="muted">${b[1]} • ${skillsMap[b[2]]}</span></span><button class="secondary" onclick="state.bossIndex=${i};save();render()">Activer</button></div>`).join("")}
function renderShop(){let items=[["🍺 Petite bière",100],["🎮 1h Geek",200],["🍔 Restaurant",500],["🏍 Balade moto",700]];shopList.innerHTML=items.map(([n,c])=>`<div class="item"><span>${n}</span><button class="primary" onclick="buy('${n}',${c})">${c} ⚜</button></div>`).join("");gloryLog.innerHTML=state.gloryLog.length?state.gloryLog.slice().reverse().map(x=>`<div class="stat"><span>${x.date} — ${x.name}</span><strong>-${x.cost} ⚜</strong></div>`).join(""):"<div class='muted'>Aucune transaction.</div>"}
function renderAchievements(){achievementList.innerHTML=achievements.map(([n,test])=>`<div class="item ${test(state)?"":"locked"}"><span>${test(state)?"🏆":"🔒"} ${n}</span><strong>${test(state)?"Débloqué":"Verrouillé"}</strong></div>`).join("")}
function renderTrackers(){let last=state.history.slice(-31),last7=state.history.slice(-7);circle.innerHTML="";mandala.innerHTML="";for(let i=0;i<31;i++){let d=last[i];circle.innerHTML+=`<div class="dayDot ${d&&d.pct>=80?'done':''}">${i+1}</div>`;mandala.innerHTML+=`<div class="petal ${d&&d.pct>=80?'done':''}"></div>`}disciplineGraph.innerHTML=last7.map(d=>`<div class="stat"><span>${d.date}</span><strong>${d.pct}%</strong></div><div class="graphBar"><div style="width:${d.pct}%"></div></div>`).join("")||"<div class='muted'>Aucune donnée.</div>"}
function renderWeekly(){let last7=state.history.slice(-7),xp=last7.reduce((a,b)=>a+b.xp,0),g=last7.reduce((a,b)=>a+b.glory,0),avg=last7.length?Math.round(last7.reduce((a,b)=>a+b.pct,0)/last7.length):0;weeklyStats.innerHTML=`<div class="stat"><span>Missions</span><strong>${last7.length}/7</strong></div><div class="stat"><span>XP</span><strong>+${xp}</strong></div><div class="stat"><span>Glory</span><strong>+${g} ⚜</strong></div><div class="stat"><span>Moyenne</span><strong>${avg}%</strong></div>`;weeklyStreaks.innerHTML=Object.entries(state.streaks).map(([k,v])=>`<div class="stat"><span>🔥 ${cap(k)}</span><strong>${v} j</strong></div>`).join("")}
function saveDay(){let c=calc(),pct=c.total?Math.round(c.done/c.total*100):0,before=lvl(state.totalXp).level;state.totalXp+=c.xp;state.glory+=c.glory;Object.keys(c.sg).forEach(k=>state.skills[k]+=c.sg[k]);defaultObjectives.forEach(o=>{if(o.streak){if(state.done[o.id])state.streaks[o.streak]=(state.streaks[o.streak]||0)+1;else if(["training","sommeil","apex"].includes(o.streak))state.streaks[o.streak]=0}});state.history.push({date:new Date().toISOString().slice(0,10),xp:c.xp,glory:c.glory,pct,done:c.done,total:c.total,doneIds:c.ids,mainQuest:missionTitle.textContent||""});state.done={};save();displayXp=state.totalXp-c.xp;displayGlory=state.glory-c.glory;render();showMissionComplete(c.xp,c.glory);if(lvl(state.totalXp).level>before)setTimeout(()=>showLevelUp(lvl(state.totalXp).level),1800)}
function resetDay(){state.done={};save();render()}
function buy(n,c){if(state.glory<c){alert("Pas assez de Glory.");return}state.glory-=c;state.gloryLog.push({date:new Date().toISOString().slice(0,10),name:n,cost:c});save();playSound("buy");flash("ACHAT CONFIRMÉ");render()}
function flash(msg){toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1200)}

function showMissionComplete(xp,glory){
  missionCompleteReward.textContent=`+${xp} XP · +${glory} ⚜`;
  particleLayer.innerHTML="";
  for(let i=0;i<28;i++){
    const p=document.createElement("div");
    p.className="particle";
    p.style.left=Math.random()*100+"%";
    p.style.bottom=(Math.random()*40)+"px";
    p.style.animationDelay=(Math.random()*1.1)+"s";
    p.style.animationDuration=(1.4+Math.random()*1.3)+"s";
    particleLayer.appendChild(p);
  }
  playSound("complete");
  missionCompleteOverlay.classList.add("show");
  setTimeout(()=>missionCompleteOverlay.classList.remove("show"),2600);
}

function showLevelUp(n){levelUpNumber.textContent=n;playSound("level");
  levelOverlay.classList.add("show");setTimeout(()=>levelOverlay.classList.remove("show"),1500)}


let audioCtx=null;
function getAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function toggleSound(){
  state.sound=!state.sound;
  save();
  updateSoundButton();
  if(state.sound) playSound("king");
}
function updateSoundButton(){
  if(!document.getElementById("soundToggleBtn")) return;
  soundToggleBtn.textContent=state.sound?"🔊 Son ON":"🔇 Son OFF";
}

let musicTimer=null;
let musicGain=null;
function toggleMusic(){
  state.music=!state.music;
  save();
  updateMusicButton();
  if(state.music) startMusic();
  else stopMusic();
}
function updateMusicButton(){
  if(!document.getElementById("musicToggleBtn")) return;
  musicToggleBtn.textContent=state.music?"🎺 Music ON":"🎺 Music OFF";
}
function playMusicTone(freq,start,duration,type="square",gain=.035){
  if(!state.music) return;
  const ctx=getAudio();
  const osc=ctx.createOscillator();
  const g=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,ctx.currentTime+start);
  g.gain.setValueAtTime(0,ctx.currentTime+start);
  g.gain.linearRampToValueAtTime(gain,ctx.currentTime+start+.008);
  g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+start+duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime+start);
  osc.stop(ctx.currentTime+start+duration+.04);
}
function playTrumpet(freq,start,duration,gain=.026){
  playMusicTone(freq,start,duration,"sawtooth",gain);
  playMusicTone(freq*2,start+.004,duration*.82,"square",gain*.25);
}
function playGlock(freq,start,duration=.16,gain=.018){
  playMusicTone(freq,start,duration,"sine",gain);
  playMusicTone(freq,start+.11,duration*.70,"sine",gain*.38);
  playMusicTone(freq,start+.22,duration*.45,"sine",gain*.18);
}
function startMusic(){
  if(!state.music) return;
  stopMusic(false);

  // Heroic 16-bit fanfare / glockenspiel loop
  const trumpet=[523,659,784,1046,784,659,587,659,784,988,1174,988,784,659,523,392];
  const glock=[1046,1318,1568,2093,1568,1318,1174,1318,1568,1976,2349,1976,1568,1318,1046,784];
  const bass=[130,130,196,196,174,174,146,146];

  let step=0;
  function loop(){
    if(!state.music) return;
    const i=step%trumpet.length;
    const t=trumpet[i];
    const g=glock[i];
    const b=bass[Math.floor(step/2)%bass.length];

    playTrumpet(t,0,.18,.030);
    playTrumpet(t*0.75,.035,.16,.010);

    if(step%2===0) playMusicTone(b,0,.32,"triangle",.016);

    // glockenspiel crystalline echo
    playGlock(g,.08,.12,.020);
    playGlock(g,.20,.09,.010);
    playGlock(g,.32,.07,.006);

    step++;
    musicTimer=setTimeout(loop,360);
  }
  loop();
}
function stopMusic(update=true){
  if(musicTimer) clearTimeout(musicTimer);
  musicTimer=null;
}
function tone(freq,start,duration,type="square",gain=.08){
  if(!state.sound) return;
  const ctx=getAudio();
  const osc=ctx.createOscillator();
  const g=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,ctx.currentTime+start);
  g.gain.setValueAtTime(0,ctx.currentTime+start);
  g.gain.linearRampToValueAtTime(gain,ctx.currentTime+start+.015);
  g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+start+duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime+start);
  osc.stop(ctx.currentTime+start+duration+.03);
}
function playSound(name){
  if(!state.sound) return;
  try{
    getAudio();
    if(name==="cling"){
      tone(659,0,.09,"square",.07);
      tone(988,.08,.11,"square",.06);
      tone(1318,.16,.16,"triangle",.05);
    }
    if(name==="complete"){
      tone(523,0,.12,"square",.07);
      tone(659,.11,.12,"square",.07);
      tone(784,.22,.16,"square",.07);
      tone(1046,.38,.28,"triangle",.06);
    }
    if(name==="level"){
      tone(523,0,.09,"square",.07);
      tone(659,.09,.09,"square",.07);
      tone(784,.18,.09,"square",.07);
      tone(1046,.27,.14,"square",.07);
      tone(1318,.43,.28,"triangle",.06);
    }
    if(name==="wrong"){
      tone(160,0,.13,"sawtooth",.06);
      tone(120,.12,.18,"sawtooth",.05);
    }
    if(name==="king"){
      tone(392,0,.08,"triangle",.05);
      tone(523,.08,.10,"triangle",.05);
      tone(784,.18,.16,"triangle",.05);
    }
    if(name==="buy"){
      tone(988,0,.07,"square",.055);
      tone(784,.08,.07,"square",.05);
      tone(1174,.17,.11,"triangle",.05);
    }
  }catch(e){}
}


function checkOnboarding(){
  if(!state.player || !state.onboarded || state.version!=="5.0.1"){
    state.onboarded=false;
    onboarding.classList.add("show");
    if(document.getElementById("splash")) splash.style.display="none";
  }
}
function nextIntro(n){
  document.querySelectorAll(".onboardScreen").forEach(s=>s.classList.remove("active"));
  document.getElementById("intro"+n).classList.add("active");
  if(n===4) bindCreatorPreview();
}
function bindCreatorPreview(){
  ["charName","charGender","charSkin","charHair","charBeard","charBeardColor","charEyes","charTattoos"].forEach(id=>{
    const el=document.getElementById(id);
    if(el && !el.dataset.bound){
      el.dataset.bound="1";
      el.addEventListener("input",updateAvatarPreview);
    }
  });
  updateAvatarPreview();
}
function updateAvatarPreview(){
  if(!document.getElementById("avatarPreview")) return;
  avatarPreview.className=`avatar pixelHero ${charGender.value} ${charSkin.value} ${charHair.value} ${charBeard.value} ${charBeardColor.value} ${charEyes.value} ${charTattoos.value}`;
  avatarNamePreview.textContent=charName.value || "Aventurier";
}
function saveCharacter(){
  state.player={name:charName.value||"Robin",gender:charGender.value,skin:charSkin.value,hair:charHair.value,beard:charBeard.value,beardColor:charBeardColor.value,eyes:charEyes.value,tattoos:charTattoos.value};
  state.onboarded=true;
  state.version="5.0.1";
  save();
  onboarding.classList.remove("show");
  if(document.getElementById("splash")) splash.style.display="";
  render();
  renderGlobalCompanion();
  companionSpeak("qg");
  flash("PERSONNAGE CRÉÉ");
  setTimeout(()=>{if(document.getElementById("companionBubble")) companionBubble.textContent="Bienvenue dans ton aventure.";},400);
  if(typeof playSound==="function") playSound("king");
}
function modifyCharacter(){
  closeKingAccess();
  const p=state.player||{};
  onboarding.classList.add("show");
  nextIntro(4);
  setTimeout(()=>{
    charName.value=p.name||"Robin";
    charGender.value=p.gender||"gender-male";
    charSkin.value=p.skin||"skin-light";
    charHair.value=p.hair||"hair-dark";
    charBeard.value=p.beard||"beard-full";
    charBeardColor.value=p.beardColor||"beard-dark";
    charEyes.value=p.eyes||"eyes-brown";
    charTattoos.value=p.tattoos||"tattoos-yes";
    updateAvatarPreview();
  },50);
}
function avatarHTML(){
  const p=state.player||{name:"Robin",gender:"gender-male",skin:"skin-light",hair:"hair-dark",beard:"beard-full",beardColor:"beard-dark",eyes:"eyes-brown",tattoos:"tattoos-yes"};
  return `<div class="avatar pixelHero ${p.gender||'gender-male'} ${p.skin} ${p.hair} ${p.beard} ${p.beardColor||'beard-dark'} ${p.eyes} ${p.tattoos}">
    <div class="px hair"></div><div class="px head"></div><div class="px ear left"></div><div class="px ear right"></div>
    <div class="px eye left"></div><div class="px eye right"></div><div class="px beard"></div><div class="px neck"></div>
    <div class="px torso"></div><div class="px arm left"></div><div class="px arm right"></div>
    <div class="px tattoo left"></div><div class="px tattoo right"></div><div class="px legs"></div><div class="px legGap"></div>
    <div class="px boot left"></div><div class="px boot right"></div>
  </div><div class="avatarName">${p.name||"Robin"}</div>`;
}

function openKingAccess(){
  kingModal.classList.add("show");
  kingCode.value="";
  kingPanel.classList.remove("show");
}
function closeKingAccess(){
  kingModal.classList.remove("show");
}
function validateKingAccess(){
  const box=document.querySelector(".kingBox");
  kingError.classList.remove("show");
  box.classList.remove("wrong");
  if(kingCode.value==="2323"){
    kingPanel.classList.add("show");
    playSound("king");
    flash("ACCÈS DU ROI OUVERT");
  }else{
    void box.offsetWidth;
    box.classList.add("wrong");
    kingError.classList.add("show");
    playSound("wrong");
    flash("CODE REFUSÉ");
  }
}
function royalReset(){
  if(!confirm("Réinitialiser complètement RAS — The Game of Life ?")) return;
  if(!confirm("Dernière confirmation : cette action est irréversible.")) return;
  localStorage.removeItem(KEY);
  state=structuredClone(defaultState);
  displayXp=0;
  displayGlory=0;
  displayLevel=1;
  closeKingAccess();
  render();
  flash("APPLICATION RÉINITIALISÉE");
}


let companionTimer=null;
function scheduleCompanionAutoSpeak(){
  if(companionTimer) clearTimeout(companionTimer);
  const delay=70000+Math.floor(Math.random()*80000);
  companionTimer=setTimeout(()=>{
    const active=document.querySelector(".screen.active");
    const type=active?dialogueTypeForScreen(active.id):"idle";
    companionSpeak(type==="qg"?"idle":type);
    scheduleCompanionAutoSpeak();
  },delay);
}

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
init();
checkOnboarding();
