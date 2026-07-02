
const KEY="ras_v5_6_0";
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

function bossDamageForObjective(o){
  return Math.max(6,Math.round(o.xp/12));
}
function damageBoss(amount){
  if(state.bossProgress>=100) return;
  state.bossProgress=Math.min(100,(state.bossProgress||0)+amount);
  if(state.bossProgress>=100){
    defeatBoss();
  }
  save();
}
function healBoss(amount){
  if(state.bossProgress>=100) return;
  state.bossProgress=Math.max(0,(state.bossProgress||0)-amount);
  save();
}
function defeatBoss(){
  const bossName=bosses[state.bossIndex][0];
  state.totalXp+=150;
  state.glory+=75;
  if(!state.defeatedBosses) state.defeatedBosses=[];
  state.defeatedBosses.push({name:bossName,date:new Date().toISOString().slice(0,10)});
  save();
  setTimeout(()=>showBossDefeated(bossName),120);
}
function showBossDefeated(name){
  if(document.getElementById("bossDefeatedName")) bossDefeatedName.textContent=name;
  if(document.getElementById("bossDefeatedOverlay")){
    bossDefeatedOverlay.classList.add("show");
    companionSpeak("boss");
    playSound("level");
    setTimeout(()=>bossDefeatedOverlay.classList.remove("show"),2600);
  }
}

function toggleObjective(id){
  const was=!!state.done[id];
  state.done[id]=!was;
  const o=defaultObjectives.find(x=>x.id===id);
  if(state.done[id]){
    damageBoss(bossDamageForObjective(o));
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
  }else{
    healBoss(bossDamageForObjective(o));
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
    "Le royaume ne se construit pas en un jour. Il se construit aujourd'hui.",
    "Tu n'as pas besoin d'aller vite. Tu dois avancer.",
    "La discipline ouvre les portes que la motivation laisse fermées.",
    "Commence par une victoire simple.",
    "Une journée claire commence par un ordre clair.",
    "Tu n'es pas obligé d'être prêt. Tu dois commencer.",
    "Le matin appartient à celui qui agit avant de négocier.",
    "Ton premier choix donne le ton de la journée.",
    "Le chaos attend que tu hésites.",
    "Aujourd'hui, tu joues ton personnage.",
    "Ne cherche pas l'envie. Cherche l'action.",
    "La première mission est souvent la plus importante.",
    "Un protocole respecté vaut mieux qu'une intention parfaite.",
    "Le niveau suivant commence maintenant.",
    "Ce que tu fais aujourd'hui renforce ou affaiblit ton royaume.",
    "Tu es réveillé. Maintenant prouve-le.",
    "Le corps suit l'ordre que l'esprit accepte.",
    "Un Roi commence par gouverner sa matinée.",
    "Tu ne subis pas la journée. Tu l'ouvres.",
    "Ton ancien toi attend que tu repousses. Ne lui donne pas ça.",
    "La constance est silencieuse. Mais elle gagne.",
    "Rien d'héroïque. Juste le premier pas.",
    "Lève-toi avec calme. Exécute avec précision.",
    "Ta journée est une quête. Pas une suite d'obligations.",
    "Le monde ne te doit rien. Mais tu peux te construire.",
    "Chaque matin est une sauvegarde nouvelle.",
    "Tu n'as pas besoin de tout contrôler. Tu dois tenir tes ordres.",
    "La force commence par une décision minuscule.",
    "Sois sobre. Sois clair. Sois fiable.",
    "Le personnage que tu veux devenir observe ce que tu fais maintenant.",
    "Ne dramatise pas. Lance la mission.",
    "Un jour solide vaut mieux qu'un discours puissant.",
    "La matinée est ton terrain d'entraînement mental.",
    "Un bon départ ne garantit pas la victoire. Mais il l'autorise.",
    "Ton royaume n'aime pas l'improvisation.",
    "Aujourd'hui encore, tu as une chance de te respecter.",
    "La discipline n'a pas besoin d'applaudissements.",
    "Tu n'as pas besoin de motivation pour faire ce qui est prévu.",
    "Exécute le plan. Puis juge après.",
    "La journée commence quand tu acceptes la première contrainte.",
    "Le confort parle fort. Ignore-le.",
    "Ne commence pas par chercher une excuse.",
    "Le matin est court. L'impact est long.",
    "Chaque case validée devient une pierre du royaume.",
    "Le système ne marche que si tu l'honores.",
    "Ton niveau ne montera pas par accident.",
    "Une mission à la fois. Dès maintenant.",
    "Tu connais l'ordre. Applique-le.",
    "Le corps veut négocier. Le Roi décide.",
    "Tu n'as pas besoin d'être exceptionnel aujourd'hui. Tu dois être fidèle.",
    "La journée est ouverte. Entre proprement.",
    "L'ennemi du matin, c'est le flou.",
    "Le premier protocole casse l'inertie.",
    "Tu peux perdre du temps ou gagner de l'identité.",
    "Le royaume attend son ordre.",
    "Rien ne t'oblige à rester le même.",
    "Une nouvelle journée. Une nouvelle preuve.",
    "L'expérience réelle commence hors de l'écran.",
    "Tu n'es pas ici pour rêver ta progression.",
    "Tu es ici pour la construire."
  ],
  qg:[
    "Tes ordres sont prêts.",
    "Le royaume se construit mission après mission.",
    "Tu n'as pas besoin d'être parfait. Tu dois avancer.",
    "La discipline est ton arme principale.",
    "Le Boss ne tombera pas tout seul.",
    "Regarde ton niveau. Il raconte tes choix.",
    "La Glory se gagne. Elle ne se réclame pas.",
    "Chaque retour au QG doit servir à repartir plus fort.",
    "Ne confonds pas repos et fuite.",
    "Tu es ici pour structurer la journée, pas pour la subir.",
    "Un système solide bat une motivation fragile.",
    "Le QG est calme. La mission ne l'est pas.",
    "Tes habitudes sont ton armure invisible.",
    "Chaque protocole validé fortifie le royaume.",
    "Tu es plus proche du prochain niveau que tu ne le crois.",
    "Le QG n'est pas une cachette. C'est une base.",
    "Prépare-toi. Puis pars.",
    "Un Roi consulte ses ordres. Il ne demande pas au hasard.",
    "Ton royaume grandit avec tes répétitions.",
    "La stratégie sans exécution est une décoration.",
    "Tu as assez réfléchi. Choisis la prochaine action.",
    "Ici, tu reprends le contrôle.",
    "Le QG ne sert qu'à une chose : repartir mieux armé.",
    "Chaque statistique est une trace de ton comportement.",
    "Le prochain niveau n'a pas besoin de promesses.",
    "Ton personnage ne ment pas. Il affiche tes actions.",
    "Si tu veux un meilleur royaume, valide de meilleures missions.",
    "La carte est ouverte. Le chemin est simple.",
    "Le plan est là. L'exécution t'appartient.",
    "Ne cherche pas une journée parfaite. Cherche une journée tenue.",
    "Le calme du QG précède l'effort.",
    "Tu peux choisir la fatigue utile ou la fatigue vide.",
    "Le système est prêt.",
    "La prochaine mission t'attend.",
    "Les Boss aiment les joueurs désorganisés.",
    "Tu n'en fais pas trop. Tu construis.",
    "Les petits ordres respectés gagnent les longues guerres.",
    "Rien ici n'est décoratif. Tout doit servir l'action.",
    "Ton royaume se mesure à ce que tu répètes quand personne ne regarde.",
    "Rentre au QG. Reprends ton axe. Repars."
  ],
  mission:[
    "Une mission à la fois.",
    "Concentre-toi sur celle-ci. Le reste attendra.",
    "Valide proprement. Puis passe à la suivante.",
    "C'est ici que l'XP se gagne.",
    "La prochaine victoire est juste devant toi.",
    "Ne regarde pas toute la montagne. Pose le pied suivant.",
    "Une action claire. Pas de négociation.",
    "Chaque mission terminée retire du pouvoir au chaos.",
    "La constance est plus brutale que l'intensité.",
    "Tu n'as pas besoin d'être motivé. Tu dois exécuter.",
    "Ce n'est pas énorme. C'est nécessaire.",
    "Le jeu avance quand tu agis.",
    "Une case de plus, un niveau plus proche.",
    "Fais simple. Fais propre. Fais maintenant.",
    "La mission actuelle est la seule qui compte.",
    "Laisse le reste hors champ.",
    "Chaque mission est une attaque contre ton ancien fonctionnement.",
    "Tu n'as pas à aimer cette mission. Tu dois la terminer.",
    "La résistance baisse quand l'action commence.",
    "Une tâche évitée devient plus lourde.",
    "Tu peux la faire maintenant ou la traîner toute la journée.",
    "L'XP n'est pas dans l'intention.",
    "Avance petit. Mais avance.",
    "Le protocole bat l'humeur.",
    "Rien de magique. Juste de l'exécution.",
    "La mission est courte. Le bénéfice est long.",
    "Fais-le sans théâtre.",
    "La difficulté n'est pas une excuse. C'est le prix.",
    "Ne cherche pas à ressentir. Cherche à valider.",
    "Une action tenue vaut une pensée brillante.",
    "Le joueur progresse quand l'humain agit.",
    "Chaque mission finie réduit le bruit mental.",
    "Tu gagnes contre le flou.",
    "Ne laisse pas cette mission devenir un poids.",
    "Tu as lu. Maintenant fais.",
    "Coche après l'action, pas avant.",
    "Le personnage n'avance pas par imagination.",
    "La prochaine minute peut changer l'élan.",
    "La mission n'a pas besoin d'être parfaite.",
    "Elle doit être accomplie.",
    "Le prochain clic doit être mérité.",
    "Valide avec honnêteté.",
    "Tu n'es pas ici pour faire semblant.",
    "Une mission propre donne une journée plus droite.",
    "L'ordre est simple. Exécute.",
    "Chaque accomplissement crée une preuve.",
    "Ton cerveau apprend ce que tu répètes.",
    "Cette mission est une brique.",
    "Pas d'excuse. Pas de drame.",
    "L'action d'abord. Le confort ensuite.",
    "Tu n'as qu'une chose à faire : celle-ci.",
    "La victoire est souvent très peu spectaculaire.",
    "Le progrès aime les gestes ordinaires.",
    "Finis cette mission. Puis respire.",
    "Le Boss perd quand tu tiens les petites choses.",
    "Tu n'as pas besoin d'un grand moment.",
    "Tu as besoin d'une petite victoire.",
    "La mission suivante n'existe pas encore.",
    "Le royaume s'améliore ici.",
    "La case attend une preuve."
  ],
  success:[
    "Bien joué.",
    "Mission accomplie.",
    "Une de moins. Continue.",
    "Le système fonctionne quand tu l'appliques.",
    "Ton personnage progresse.",
    "Voilà. C'est comme ça qu'on gagne.",
    "XP méritée.",
    "Ce petit geste compte plus que tu ne le crois.",
    "La série respire encore.",
    "Le Boss vient de perdre du terrain.",
    "Tu viens de renforcer ton identité.",
    "Encore une preuve que tu peux tenir.",
    "Reste dans le rythme.",
    "La prochaine mission t'attend.",
    "Ce n'était pas spectaculaire. C'était efficace.",
    "Propre.",
    "C'est validé. Passe à la suite.",
    "Une action réelle. Une récompense réelle.",
    "Tu viens de gagner contre l'inertie.",
    "Le niveau suivant se rapproche.",
    "Le royaume prend forme.",
    "C'est exactement ça.",
    "Continue sans t'emballer.",
    "La constance vient de marquer un point.",
    "Ton ancien toi vient de perdre une manche.",
    "Ne célèbre pas trop longtemps. Continue.",
    "La preuve est faite.",
    "Ton système vient de respirer.",
    "Tu peux être satisfait. Et continuer.",
    "Une victoire simple reste une victoire.",
    "Cette mission ne te suit plus.",
    "Tu l'as terminée. Bien.",
    "Le clic était mérité.",
    "Garde cette trajectoire.",
    "Le personnage s'améliore parce que tu as agi.",
    "Encore une pierre posée.",
    "Tu viens de rendre demain plus facile.",
    "Le chaos vient de reculer.",
    "Rien à ajouter. Continue.",
    "La prochaine action décidera si l'élan tient."
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
    "C'est ce genre de journée qui change une trajectoire.",
    "Demain, on recommence.",
    "Aujourd'hui, tu as nourri le personnage.",
    "Tu peux clôturer la journée proprement.",
    "Le système a été respecté.",
    "C'est une victoire réelle, même si personne ne l'a vue.",
    "Fin de mission. Retour au calme.",
    "La journée ne t'a pas échappé.",
    "Tu as fait ce que tu avais dit.",
    "Ce soir, le personnage est plus fort.",
    "Le royaume dort mieux après une journée tenue.",
    "Tu as gagné de l'XP dans la vraie vie.",
    "Le score ne ment pas.",
    "La discipline a gagné aujourd'hui.",
    "Tu peux fermer les portes du QG.",
    "La série a été protégée.",
    "Tu as prouvé quelque chose de simple : tu peux tenir.",
    "Le repos est meilleur quand il est mérité.",
    "Archive cette journée. Elle compte.",
    "Le Boss reviendra. Toi aussi.",
    "Tu as avancé. Pas parfaitement. Réellement.",
    "Demain demandera encore une preuve."
  ],
  streak:[
    "La série continue. Ne la casse pas.",
    "Chaque jour validé rend le suivant plus facile.",
    "Tu construis une dynamique dangereuse pour tes anciennes excuses.",
    "La série est une lame. Garde-la affûtée.",
    "Un jour raté peut arriver. Deux deviennent une habitude.",
    "Protège ta série comme un trésor.",
    "La continuité est ta plus grosse arme.",
    "Tu n'es plus en train d'essayer. Tu construis.",
    "La série parle pour toi.",
    "Reste fidèle au protocole.",
    "Une série ne se négocie pas. Elle se protège.",
    "Chaque jour ajouté augmente le prix de l'abandon.",
    "Tu n'as pas envie de casser ça.",
    "La série devient ton identité visible.",
    "Plus elle grandit, plus tu dois la respecter.",
    "Le vrai danger arrive quand tu crois que c'est acquis.",
    "Une série longue se casse par une petite excuse.",
    "Garde la chaîne intacte.",
    "Elle ne vaut rien si tu la trahis facilement.",
    "Tu as construit l'élan. Ne le gaspille pas.",
    "La série est un Boss inversé : plus elle vit, plus tu gagnes.",
    "Aujourd'hui compte parce qu'hier a compté.",
    "Ne recommence pas à zéro pour une humeur.",
    "La série n'a pas besoin d'émotion.",
    "Elle a besoin de fidélité.",
    "Tiens aujourd'hui. Le reste suivra.",
    "Tu n'as pas fait tout ça pour lâcher maintenant.",
    "La série raconte ta constance mieux que tes paroles.",
    "Protège ce feu.",
    "Reste dangereux pour tes mauvaises habitudes."
  ],
  boss:[
    "Le Boss ne ressent pas la pitié.",
    "Chaque mission lui retire un peu de pouvoir.",
    "Tu ne bats pas un Boss avec une intention.",
    "Le Boss attend ta faiblesse. Déçois-le.",
    "Il ne tombera pas aujourd'hui. Mais il peut saigner.",
    "Une attaque propre vaut mieux qu'un discours.",
    "Chaque protocole est un coup porté.",
    "Ne regarde pas sa taille. Regarde sa barre.",
    "Le Boss aime les joueurs irréguliers.",
    "Tu ne combats pas un monstre. Tu combats une habitude.",
    "Il a l'air grand parce que tu l'as laissé grandir.",
    "Frappe avec tes routines.",
    "Un Boss se bat sur la durée.",
    "La patience est une arme lourde.",
    "Tu gagnes quand tu reviens.",
    "Un coup par jour suffit à fissurer l'armure.",
    "Le Boss n'a pas peur de ta motivation. Il craint ta constance.",
    "Il tombera si tu continues.",
    "Ne lui rends pas de terrain.",
    "Chaque journée tenue est une attaque.",
    "Ce Boss porte le nom de ton ancienne limite.",
    "Ne cherche pas le combat parfait.",
    "Attaque avec ce que tu as aujourd'hui.",
    "La barre descendra quand les actions monteront.",
    "Tu n'as pas besoin de rage. Tu as besoin de répétition."
  ],
  level:[
    "Tu n'es plus celui d'hier.",
    "Ce niveau est permanent.",
    "Tu viens de franchir un seuil.",
    "Le personnage change parce que l'humain a tenu.",
    "Nouveau niveau. Nouvelles exigences.",
    "Ne redeviens pas trop petit pour ton niveau.",
    "Ce niveau a été gagné. Pas offert.",
    "La montée est réelle.",
    "Le titre suivra les actes.",
    "Tu viens d'augmenter ta preuve.",
    "Un niveau gagné impose une meilleure tenue.",
    "Tu montes parce que tu répètes.",
    "Le niveau n'est pas un cadeau. C'est une trace.",
    "Garde le rang.",
    "Ce niveau demande maintenant d'agir comme tel.",
    "Ton ancien standard ne suffit plus.",
    "Tu as changé la barre.",
    "Ne traite pas ce niveau comme une décoration.",
    "Chaque niveau est une responsabilité.",
    "Tu viens d'ouvrir une nouvelle porte."
  ],
  chest:[
    "Ouvre-le.",
    "Tu l'as mérité.",
    "Le royaume récompense les actions tenues.",
    "Un coffre ne tombe pas du ciel. Il tombe d'une série.",
    "Regarde ce que la constance rapporte.",
    "Prends la récompense. Puis retourne au travail.",
    "La Glory aime les joueurs fiables.",
    "Chaque coffre raconte une journée tenue.",
    "Ce n'est pas un cadeau. C'est un paiement.",
    "Les récompenses suivent les preuves.",
    "Ouvre. Observe. Continue.",
    "Le coffre attend celui qui agit.",
    "Ne confonds pas récompense et relâchement.",
    "Tu as gagné le droit d'ouvrir.",
    "Le royaume n'oublie pas les efforts."
  ],
  idle:[
    "Je surveille la progression.",
    "On avance quand tu avances.",
    "Pas besoin de bruit. Juste de l'exécution.",
    "Je reste là. À toi d'agir.",
    "Le prochain niveau attend.",
    "Chaque choix laisse une trace.",
    "Ton personnage devient ce que tu répètes.",
    "Le royaume n'aime pas l'improvisation.",
    "Une bonne journée commence par une bonne décision.",
    "Le calme avant la prochaine mission.",
    "Tu réfléchis ou tu repousses ?",
    "Le royaume attend toujours.",
    "Les Boss adorent ceux qui attendent.",
    "Ne laisse pas l'écran devenir une cachette.",
    "La prochaine action n'a pas besoin d'être parfaite.",
    "Tu peux reprendre maintenant.",
    "Le temps passe. L'XP ne tombe pas seule.",
    "Un joueur inactif reste au même niveau.",
    "Le silence peut être utile. L'évitement non.",
    "Si tu ne sais pas quoi faire, reviens à la mission.",
    "Le système est là pour éviter le flou.",
    "Tu n'as pas besoin d'une nouvelle idée.",
    "Tu as besoin d'une action.",
    "Les grandes transformations meurent dans les longues hésitations.",
    "Reviens à l'ordre du jour."
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
  if(document.getElementById("heroRankQG")) heroRankQG.textContent=heroRank(l.level).name;
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
function renderBossSelect(){bossSelect.innerHTML=bosses.map((b,i)=>`<option value="${i}">${b[0]}</option>`).join("");bossSelect.value=state.bossIndex;bossProgress.value=state.bossProgress;bossSelect.oninput=()=>{state.bossIndex=+bossSelect.value;state.bossProgress=0;save();render()};bossProgress.oninput=()=>{}}
function renderBoss(){bossFill.style.width=(state.bossProgress||0)+"%";bossFill.classList.toggle("defeated",(state.bossProgress||0)>=100);bossList.innerHTML=bosses.map((b,i)=>`<div class="item ${i==state.bossIndex?"":"locked"}"><span><strong>${b[0]}</strong><br><span class="muted">${b[1]} • ${skillsMap[b[2]]}</span></span><button class="secondary" onclick="state.bossIndex=${i};state.bossProgress=0;save();render();flash('NOUVEAU BOSS ACTIVÉ')">Activer</button></div>`).join("")}
function renderShop(){let items=[["🍺 Petite bière",100],["🎮 1h Geek",200],["🍔 Restaurant",500],["🏍 Balade moto",700]];shopList.innerHTML=items.map(([n,c])=>`<div class="item"><span>${n}</span><button class="primary" onclick="buy('${n}',${c})">${c} ⚜</button></div>`).join("");gloryLog.innerHTML=state.gloryLog.length?state.gloryLog.slice().reverse().map(x=>`<div class="stat"><span>${x.date} — ${x.name}</span><strong>-${x.cost} ⚜</strong></div>`).join(""):"<div class='muted'>Aucune transaction.</div>"}
function renderAchievements(){achievementList.innerHTML=achievements.map(([n,test])=>`<div class="item ${test(state)?"":"locked"}"><span>${test(state)?"🏆":"🔒"} ${n}</span><strong>${test(state)?"Débloqué":"Verrouillé"}</strong></div>`).join("")}
function renderTrackers(){let last=state.history.slice(-31),last7=state.history.slice(-7);circle.innerHTML="";mandala.innerHTML="";for(let i=0;i<31;i++){let d=last[i];circle.innerHTML+=`<div class="dayDot ${d&&d.pct>=80?'done':''}">${i+1}</div>`;mandala.innerHTML+=`<div class="petal ${d&&d.pct>=80?'done':''}"></div>`}disciplineGraph.innerHTML=last7.map(d=>`<div class="stat"><span>${d.date}</span><strong>${d.pct}%</strong></div><div class="graphBar"><div style="width:${d.pct}%"></div></div>`).join("")||"<div class='muted'>Aucune donnée.</div>"}
function renderWeekly(){let last7=state.history.slice(-7),xp=last7.reduce((a,b)=>a+b.xp,0),g=last7.reduce((a,b)=>a+b.glory,0),avg=last7.length?Math.round(last7.reduce((a,b)=>a+b.pct,0)/last7.length):0;weeklyStats.innerHTML=`<div class="stat"><span>Missions</span><strong>${last7.length}/7</strong></div><div class="stat"><span>XP</span><strong>+${xp}</strong></div><div class="stat"><span>Glory</span><strong>+${g} ⚜</strong></div><div class="stat"><span>Moyenne</span><strong>${avg}%</strong></div>`;weeklyStreaks.innerHTML=Object.entries(state.streaks).map(([k,v])=>`<div class="stat"><span>🔥 ${cap(k)}</span><strong>${v} j</strong></div>`).join("")}
function saveDay(){let c=calc(),pct=c.total?Math.round(c.done/c.total*100):0,before=lvl(state.totalXp).level,beforeRank=heroRank(before).key;state.totalXp+=c.xp;state.glory+=c.glory;Object.keys(c.sg).forEach(k=>state.skills[k]+=c.sg[k]);defaultObjectives.forEach(o=>{if(o.streak){if(state.done[o.id])state.streaks[o.streak]=(state.streaks[o.streak]||0)+1;else if(["training","sommeil","apex"].includes(o.streak))state.streaks[o.streak]=0}});state.history.push({date:new Date().toISOString().slice(0,10),xp:c.xp,glory:c.glory,pct,done:c.done,total:c.total,doneIds:c.ids,mainQuest:missionTitle.textContent||""});state.done={};save();displayXp=state.totalXp-c.xp;displayGlory=state.glory-c.glory;render();showMissionComplete(c.xp,c.glory);if(lvl(state.totalXp).level>before){
  const afterLevel=lvl(state.totalXp).level;
  const afterRank=heroRank(afterLevel);
  setTimeout(()=>showLevelUp(afterLevel),1800);
  if(afterRank.key!==beforeRank) setTimeout(()=>showHeroEvolution(afterRank),3400);
}}
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

  // V5.3.8 — previous better air + current heroic 16-bit fanfare/glock instrument
  const lead=[659,784,988,1174,988,784,659,587,659,784,880,988,880,784,659,523];
  const harmony=[330,392,494,587,494,392,330,294,330,392,440,494,440,392,330,262];
  const bass=[165,165,196,196,147,147,174,174];

  let step=0;
  function loop(){
    if(!state.music) return;
    const i=step%lead.length;
    const m=lead[i];
    const h=harmony[i];
    const b=bass[Math.floor(step/2)%bass.length];

    // heroic synth trumpet lead
    playTrumpet(m,0,.16,.026);

    // light harmony, less invasive than V5.3.7
    if(step%2===0) playTrumpet(h,.055,.12,.010);

    // soft bass foundation
    if(step%2===0) playMusicTone(b,0,.30,"triangle",.014);

    // crystalline glockenspiel echo
    if(step%4===0) playGlock(m*2,.10,.16,.016);
    if(step%8===7) playGlock(1318,.05,.18,.014);

    step++;
    musicTimer=setTimeout(loop,310);
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

function heroRank(level){
  if(level>=100) return {key:"rank-king",name:"Roi",desc:"Armure royale débloquée."};
  if(level>=75) return {key:"rank-legend",name:"Légende",desc:"Équipement légendaire débloqué."};
  if(level>=50) return {key:"rank-lord",name:"Seigneur",desc:"Armure noble débloquée."};
  if(level>=30) return {key:"rank-commander",name:"Commandant",desc:"Armure noire et or débloquée."};
  if(level>=20) return {key:"rank-champion",name:"Champion",desc:"Armure renforcée débloquée."};
  if(level>=10) return {key:"rank-warrior",name:"Guerrier",desc:"Cape et cuir renforcé débloqués."};
  if(level>=5) return {key:"rank-scout",name:"Éclaireur",desc:"Brassards et ceinture débloqués."};
  return {key:"rank-adventurer",name:"Aventurier",desc:"Tenue simple d'aventurier."};
}
function heroRankForXp(xp){
  return heroRank(lvl(xp).level);
}
function showHeroEvolution(rank){
  if(!document.getElementById("heroEvolutionOverlay")) return;
  heroEvolutionRank.textContent=rank.name;
  heroEvolutionDesc.textContent=rank.desc;
  heroEvolutionOverlay.classList.add("show");
  playSound("level");
  companionSpeak("level");
  setTimeout(()=>heroEvolutionOverlay.classList.remove("show"),2600);
}

function avatarHTML(){
  const p=state.player||{name:"Robin",gender:"gender-male",skin:"skin-light",hair:"hair-dark",beard:"beard-full",beardColor:"beard-dark",eyes:"eyes-brown",tattoos:"tattoos-yes"};
  const rank=heroRankForXp(state.totalXp);
  return `<div class="avatar pixelHero ${rank.key} ${p.gender||'gender-male'} ${p.skin} ${p.hair} ${p.beard} ${p.beardColor||'beard-dark'} ${p.eyes} ${p.tattoos}">
    <div class="px aura"></div>
    <div class="px cape"></div>
    <div class="px hair"></div><div class="px head"></div><div class="px ear left"></div><div class="px ear right"></div>
    <div class="px eye left"></div><div class="px eye right"></div><div class="px beard"></div><div class="px neck"></div>
    <div class="px torso"></div><div class="px chestArmor"></div><div class="px belt"></div>
    <div class="px shoulder left"></div><div class="px shoulder right"></div>
    <div class="px arm left"></div><div class="px arm right"></div>
    <div class="px bracer left"></div><div class="px bracer right"></div>
    <div class="px tattoo left"></div><div class="px tattoo right"></div><div class="px legs"></div><div class="px legGap"></div>
    <div class="px boot left"></div><div class="px boot right"></div>
    <div class="px crown"></div>
  </div><div class="avatarName">${p.name||"Robin"}</div><div class="avatarRank">${rank.name}</div>`;
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
