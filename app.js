
const KEY="ras_v4_1_1";
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
const defaultState={totalXp:0,glory:0,skills:{force:0,discipline:0,intelligence:0,domination:0,sante:0},streaks:{training:0,lecture:0,sommeil:0,priere:0,apex:0,nutrition:0,journal:0},done:{},history:[],gloryLog:[],bossIndex:0,bossProgress:0};
let state=load(), displayXp=0, displayGlory=0, displayLevel=1;
function need(l){return Math.round(100*Math.pow(l,1.35))}
function lvl(xp){let level=1,x=xp;while(x>=need(level)){x-=need(level);level++}return{level,current:x,needed:need(level)}}
function load(){try{return {...structuredClone(defaultState),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function show(id,btn){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".navbtn,.mobileNav button").forEach(b=>b.classList.remove("active"));if(btn)btn.classList.add("active");render()}
function showById(id){show(id,null)}
function init(){renderBossSelect();prefillToday();displayXp=state.totalXp;displayGlory=state.glory;displayLevel=lvl(state.totalXp).level;render()}
function prefillToday(){missionTitle.textContent=dailyMissions[new Date().getDay()][0]}
function renderMissionCards(){
  const active=defaultObjectives.filter(o=>!state.done[o.id]);
  const done=defaultObjectives.filter(o=>state.done[o.id]);
  missionCards.innerHTML=renderPeriodGroups(active);
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
function render(){
  let c=calc(), targetXp=state.totalXp+c.xp, targetGlory=state.glory+c.glory, l=lvl(targetXp);
  animateNumber(displayXp,targetXp,450,v=>{displayXp=v;const dl=lvl(v);level.textContent=dl.level;xpText.textContent=`${dl.current} / ${dl.needed}`;xpFill.style.width=`${Math.round(dl.current/dl.needed*100)}%`;},()=>{if(l.level>displayLevel)showLevelUp(l.level);displayLevel=l.level});
  animateNumber(displayGlory,targetGlory,450,v=>{displayGlory=v;gloryText.textContent=v+" ⚜"});
  let pct=c.total?Math.round(c.done/c.total*100):0;dayPct.textContent=pct+"%";dayFill.style.width=pct+"%";
  mainStreak.textContent=Math.max(...Object.values(state.streaks))+" j";homeBoss.textContent=bosses[state.bossIndex][0];
  renderMissionCards();renderStats();renderBoss();renderShop();renderAchievements();renderWeekly();
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
function buy(n,c){if(state.glory<c){alert("Pas assez de Glory.");return}state.glory-=c;state.gloryLog.push({date:new Date().toISOString().slice(0,10),name:n,cost:c});save();flash("ACHAT CONFIRMÉ");render()}
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
  missionCompleteOverlay.classList.add("show");
  setTimeout(()=>missionCompleteOverlay.classList.remove("show"),2600);
}

function showLevelUp(n){levelUpNumber.textContent=n;levelOverlay.classList.add("show");setTimeout(()=>levelOverlay.classList.remove("show"),1500)}

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
    flash("ACCÈS DU ROI OUVERT");
  }else{
    void box.offsetWidth;
    box.classList.add("wrong");
    kingError.classList.add("show");
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

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
init();
