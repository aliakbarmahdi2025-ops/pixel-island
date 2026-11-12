(() => {
"use strict";
const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
const WORLD = { w: 3200, h: 2400, tile: 48 };
const CAVE = { w: 1600, h: 1200 };
const SAVE_KEY = "pixelIsland_adventure_save_v1";
let viewW = innerWidth, viewH = innerHeight, dpr = 1;
const camera = { x: 0, y: 0 };
const player = { x: 1200, y: 900, speed: 190, size: 22, health: 5, maxHealth: 5, level: 1, xp: 0, skillPoints: 0, attackPower: 1, armorLevel: 0, coins: 0 };
const bag = { wood: 0, stone: 0, iron: 0, crystal: 0, potion: 0, seeds: 0, wheat: 0, carrot: 0, strawberry: 0, fiber: 0, sand: 0, marble: 0, plank: 0, brick: 0, rope: 0, nail: 0, glass: 0, cloth: 0, marbleSlab: 0, ironParts: 0, templeFoundation: 0, templeColumn: 0, templeBeam: 0, templeMosaic: 0, templeBanner: 0 };
const stations = { workbench: false, furnace: false, sawmill: false };
const toolLevels = { axe: 0, pickaxe: 0, shovel: 0 };
let bridgeStage = 0; // 0 broken, 1 stone piers, 2 timber deck, 3 ancient seal complete
const TEMPLE={w:2200,h:1500,floors:5};
const TEMPLE_TRAPS=[{x:520,y:740,r:78,phase:0},{x:1450,y:740,r:78,phase:1.7},{x:1080,y:350,r:72,phase:3.1},{x:1080,y:1130,r:72,phase:4.6}];
let templeMode=false,templeFloor=1,templeUnlocked=1,templePuzzleSolved={},templeBosses={},templeRuneProgress={},templeRuneSolved={},templeSecrets={},templeEnemies=[],templeReturn={x:3040,y:1710},templeTrapCooldown=0;
let harvested = new Set(), caveHarvested = new Set();
let caveMode = false, caveReturn = {x:1200,y:900}, openedChests = [];
let caveResources = [], caveChests = [];
let resources = [];
let quests = { wood: 0, slime: 0, iron: 0, claimed: { wood: false, slime: false, iron: false } };
let npcMet = false, npcTalkIndex = 0;
let npcQuest = { accepted: false, progress: 0, claimed: false };
let homeLevel = 0, homeInterior = false, homeReturn = { x: 760, y: 590 };

let townMode = false, townReturn = {x:2240,y:900}, townNpcIndex = 0;
let backpackTier = 0, furnitureOwned = {bed:false,table:false,chair:false};
const backpackCaps = [30,45,60];
const townFriendship = {mina:0,hana:0,nahid:0,saeed:0,rezaei:0,naderi:0};
const townStock = {bread:0,seeds:0,apple:0};
const TOWN = {w:1600,h:1200};
const townPeople = [
{id:"mina",name:"مینا",role:"همسایه مهربان",x:470,y:560,color:"#d94f91",hair:"#693b39"},
{id:"hana",name:"حنا",role:"خواهر مینا",x:560,y:590,color:"#348fc0",hair:"#292431"},
{id:"nahid",name:"ناهید",role:"مادر مینا و حنا",x:420,y:650,color:"#9b3e60",hair:"#673b40"},
{id:"saeed",name:"سعید",role:"نگهبان شهر",x:180,y:590,color:"#33465b",hair:"#28252b"},
{id:"rezaei",name:"خانم رضایی",role:"نجار روستا",x:1120,y:530,color:"#4b8b50",hair:"#74483a"},
{id:"naderi",name:"آقای نادری",role:"فروشنده و بذر‌فروش",x:1370,y:530,color:"#52677a",hair:"#302b2b"}
];

let worldClock = 9 * 60, worldDay = 1, selectedFarmPlot = -1, selectedCrop = "carrot";
let inventoryOrder = [], inventorySelected = null;
const FARM_CROPS = {
 wheat:{name:"گندم",icon:"🌾",season:"spring",days:3,price:8,seed:4,color:"#d8bf70"},
 carrot:{name:"هویج",icon:"🥕",season:"spring",days:2,price:10,seed:5,color:"#e58a42"},
 potato:{name:"سیب‌زمینی",icon:"🥔",season:"spring",days:4,price:18,seed:8,color:"#b68a54"},
 cauliflower:{name:"گل‌کلم",icon:"🥦",season:"spring",days:6,price:35,seed:13,color:"#d8dfb5"},
 strawberry:{name:"توت‌فرنگی",icon:"🍓",season:"spring",days:5,regrow:3,price:22,seed:12,color:"#dc5265"},
 tomato:{name:"گوجه‌فرنگی",icon:"🍅",season:"summer",days:5,regrow:3,price:20,seed:10,color:"#d94d3f"},
 corn:{name:"ذرت",icon:"🌽",season:"summer",days:7,regrow:4,price:28,seed:14,color:"#e5c64b"},
 melon:{name:"خربزه",icon:"🍈",season:"summer",days:8,price:45,seed:18,color:"#83b86b"},
 pepper:{name:"فلفل",icon:"🫑",season:"summer",days:4,regrow:3,price:18,seed:9,color:"#4f9b53"},
 pumpkin:{name:"کدوحلوایی",icon:"🎃",season:"autumn",days:9,price:60,seed:22,color:"#e58b35"},
 grape:{name:"انگور",icon:"🍇",season:"autumn",days:6,regrow:3,price:30,seed:15,color:"#7656a5"},
 eggplant:{name:"بادمجان",icon:"🍆",season:"autumn",days:5,regrow:3,price:25,seed:12,color:"#7652a0"},
 snowturnip:{name:"شلغم برفی",icon:"❄️",season:"winter",days:6,price:40,seed:16,color:"#d9e4e8"}
};
const FARM_SEASONS={spring:"بهار 🌸",summer:"تابستان ☀️",autumn:"پاییز 🍂",winter:"زمستان ❄️"};
let farmSeedStock=Object.fromEntries(Object.keys(FARM_CROPS).map(k=>[k,0]));
const farmPlots = [];

const playerHome = { x: 700, y: 520 };
const samanHome = { x: 1900, y: 450 };
const forestNpc = { x: 1320, y: 1010, name: "سامان", role: "پیر دانای جنگل" };
let enemies = [], caveEnemies = [], lootDrops = [];
let attackCooldown = 0, attackFlash = 0, damageCooldown = 0;
let move = { x: 0, y: 0 };
let moveTarget = null, selectedTool = "axe", interactionTimer = 0;
const TOOL_INFO = {
 axe:{icon:"🪓",label:"تبر"}, pickaxe:{icon:"⛏️",label:"کلنگ"},
 shovel:{icon:"🪏",label:"بیل"}, watering:{icon:"💧",label:"آب‌پاش"},
 sword:{icon:"⚔️",label:"شمشیر"}, seeds:{icon:"🌱",label:"بذر"}
};
let toastTimer = 0;
let lastTime = 0;
let animTime = 0, playerMoving = false, playerFacing = "down";
let playerActionTimer = 0, playerActionDuration = 0.32, playerActionType = "";

/* Stage 38 — lightweight Web Audio soundscape. Audio starts only after a user gesture. */
const gameAudio = {ctx:null,master:null,ambience:null,noise:null,enabled:false,unlocked:false,stepTimer:0,birdTimer:4,musicTimer:0,lastZone:"",lastNight:false};
function audioReady(){
  if(!gameAudio.ctx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    const ctx=new AC(),master=ctx.createGain();master.gain.value=.92;master.connect(ctx.destination);
    const ambience=ctx.createGain();ambience.gain.value=0;ambience.connect(master);
    const low=ctx.createOscillator(),mid=ctx.createOscillator(),filter=ctx.createBiquadFilter(),toneGain=ctx.createGain();
    low.type="sine";low.frequency.value=72;mid.type="triangle";mid.frequency.value=108;
    filter.type="lowpass";filter.frequency.value=420;toneGain.gain.value=.14;
    low.connect(toneGain);mid.connect(toneGain);toneGain.connect(filter);filter.connect(ambience);
    low.start();mid.start();
    const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.22;
    const noise=ctx.createBufferSource(),noiseFilter=ctx.createBiquadFilter(),noiseGain=ctx.createGain();
    noise.buffer=buffer;noise.loop=true;noiseFilter.type="lowpass";noiseFilter.frequency.value=650;noiseGain.gain.value=.14;
    noise.connect(noiseFilter);noiseFilter.connect(noiseGain);noiseGain.connect(ambience);noise.start();
    gameAudio.ctx=ctx;gameAudio.master=master;gameAudio.ambience=ambience;gameAudio.noise=noiseGain;
  }
  if(gameAudio.ctx.state==="suspended")gameAudio.ctx.resume();
  gameAudio.unlocked=true;return true;
}
function setGameSound(on){
  if(on&&!audioReady()){showToast("مرورگرت از صدای بازی پشتیبانی نمی‌کند");return;}
  gameAudio.enabled=!!on;
  if(gameAudio.master)gameAudio.master.gain.setTargetAtTime(on ? 0.92 : 0,gameAudio.ctx.currentTime,.08);
  $("soundBtn").textContent=on?"🔊 صدا روشن":"🔇 صدا خاموش";
  $("soundBtn").setAttribute("aria-pressed",String(!!on));
  try{localStorage.setItem("pixelIsland_sound_enabled",on?"1":"0");}catch(e){}
  if(on){soundTone(660,.18,"sine",.18,180);showToast("صدای بازی فعال شد 🎵");}
}
function soundTone(freq,duration,type="sine",volume=.12,slide=0){
  if(!gameAudio.enabled||!audioReady())return;
  const ctx=gameAudio.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,ctx.currentTime);
  if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),ctx.currentTime+duration);
  gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(Math.max(.001,Math.min(.42,volume*2.2)),ctx.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
  osc.connect(gain);gain.connect(gameAudio.master);osc.start();osc.stop(ctx.currentTime+duration+.03);
}
function playGameSound(kind){
  if(!gameAudio.enabled)return;
  if(kind==="step"){soundTone(caveMode?105:155,.075,"triangle",.045,-35);}
  else if(kind==="gather"){soundTone(520,.09,"triangle",.10,-170);soundTone(760,.07,"sine",.045,-260);}
  else if(kind==="attack"){soundTone(180,.13,"sawtooth",.10,95);soundTone(90,.12,"triangle",.055,-35);}
  else if(kind==="pickup"){soundTone(660,.12,"sine",.09,210);}
  else if(kind==="water"){soundTone(900,.16,"sine",.055,-480);}
}
function audioEnvironment(dt){
  if(!gameAudio.enabled||!gameAudio.ctx)return;
  const cave=caveMode||templeMode,night=!cave&&!townMode&&!homeInterior&&(worldClock>=20*60||worldClock<6*60);
  const zone=cave?"cave":townMode?"town":homeInterior?"home":night?"night":"forest";
  if(zone!==gameAudio.lastZone||night!==gameAudio.lastNight){
    gameAudio.lastZone=zone;gameAudio.lastNight=night;
    const ctx=gameAudio.ctx;
    const level=cave ? 0.34 : night ? 0.17 : townMode ? 0.14 : homeInterior ? 0.09 : 0.25;
    gameAudio.ambience.gain.setTargetAtTime(level,ctx.currentTime,1.1);
    gameAudio.noise.gain.setTargetAtTime(cave ? 0.10 : night ? 0.11 : 0.24,ctx.currentTime,1.2);
  }
  if(playerMoving){
    gameAudio.stepTimer-=dt;
    if(gameAudio.stepTimer<=0){playGameSound("step");gameAudio.stepTimer=caveMode ? 0.48 : 0.38;}
  }else gameAudio.stepTimer=0;
  if(zone==="forest"||zone==="town"){
    gameAudio.birdTimer-=dt;
    if(gameAudio.birdTimer<=0){
      const f=zone==="town"?1100:1450;
      soundTone(f+Math.random()*650,.16,"sine",.025,Math.random()<.5?-400:350);
      gameAudio.birdTimer=5+Math.random()*9;
    }
  }else if(zone==="cave"&&Math.random()<dt*.12){
    soundTone(380+Math.random()*260,.28,"sine",.018,-180);
  }
  gameAudio.musicTimer-=dt;
  if(gameAudio.musicTimer<=0){
    if(!cave&&!night){soundTone(220,.9,"sine",.018,55);soundTone(330,1.1,"sine",.012,40);}
    else if(night){soundTone(164,.95,"sine",.018,24);}
    else if(cave){soundTone(82,.8,"sine",.022,-12);}
    gameAudio.musicTimer=zone==="cave"?7:10;
  }
}

function triggerPlayerAction(type, duration = 0.32) {
  playerActionType = type; playerActionDuration = duration; playerActionTimer = duration;
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  viewW = innerWidth; viewH = innerHeight;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

let seed = 20261109;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function makeWorld() {
  resources = [];
  for (let i = 0; i < 190; i++) {
    const x = 100 + rand() * (WORLD.w - 200);
    const y = 100 + rand() * (WORLD.h - 200);
    if (Math.abs(x-2700)<105 || Math.hypot(x - player.x, y - player.y) < 130 || Math.hypot(x-playerHome.x,y-playerHome.y)<155 || Math.hypot(x-samanHome.x,y-samanHome.y)<155) continue;
    const type = rand() < 0.72 ? "tree" : "stone";
    resources.push({ id: "node-" + i, x, y, type, hp: type === "tree" ? 3 : 4, max: type === "tree" ? 3 : 4 });
  }
  for (let i = 0; i < 30; i++) {
    const x = 120 + rand() * (WORLD.w - 240), y = 120 + rand() * (WORLD.h - 240);
    if (Math.abs(x-2700)<105 || Math.hypot(x-playerHome.x,y-playerHome.y)<145 || Math.hypot(x-samanHome.x,y-samanHome.y)<145) continue;
    resources.push({ id: "iron-" + i, x, y, type: "iron", hp: 5, max: 5 });
  }
  for (let i = 0; i < 48; i++) {
    const x=100+rand()*(WORLD.w-200),y=100+rand()*(WORLD.h-200);
    if(Math.abs(x-2700)<105||Math.hypot(x-playerHome.x,y-playerHome.y)<175||Math.hypot(x-samanHome.x,y-samanHome.y)<150)continue;
    resources.push({id:"fiber-bush-"+i,x,y,type:"bush",hp:2,max:2});
  }
  for (let i = 0; i < 24; i++) {
    const x=100+rand()*(WORLD.w-200),y=100+rand()*(WORLD.h-200);
    if(Math.abs(x-2700)<105||Math.hypot(x-playerHome.x,y-playerHome.y)<175)continue;
    resources.push({id:"sand-pile-"+i,x,y,type:"sand",hp:3,max:3});
  }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.player) {
      Object.assign(player, data.player);
      player.armorLevel = Math.max(0, Math.min(2, Number(data.player.armorLevel) || 0));
      if (!Object.prototype.hasOwnProperty.call(data.player, "skillPoints")) player.skillPoints = Math.max(0, player.level - 1);
    }
    if (data.bag) Object.assign(bag, data.bag);
    if(!Number.isFinite(Number(data.backpackTier))){const used=Object.values(bag).reduce((n,v)=>n+(Number(v)||0),0);backpackTier=used>45?2:used>30?1:0;}
    if (data.stations) Object.assign(stations, data.stations);
    if (data.toolLevels) Object.keys(toolLevels).forEach(k => toolLevels[k] = Math.max(0, Math.min(2, Number(data.toolLevels[k]) || 0)));
    bridgeStage = Math.max(0, Math.min(3, Number(data.bridgeStage) || 0));
    templeMode=!!data.templeMode;templeFloor=Math.max(1,Math.min(TEMPLE.floors,Number(data.templeFloor)||1));templeUnlocked=Math.max(1,Math.min(TEMPLE.floors,Number(data.templeUnlocked)||1));
    templePuzzleSolved=data.templePuzzleSolved&&typeof data.templePuzzleSolved==="object"?data.templePuzzleSolved:{};
    templeBosses=data.templeBosses&&typeof data.templeBosses==="object"?data.templeBosses:{};
    templeRuneProgress=data.templeRuneProgress&&typeof data.templeRuneProgress==="object"?data.templeRuneProgress:{};
    templeRuneSolved=data.templeRuneSolved&&typeof data.templeRuneSolved==="object"?data.templeRuneSolved:{};
    templeSecrets=data.templeSecrets&&typeof data.templeSecrets==="object"?data.templeSecrets:{};
    if(data.templeReturn)templeReturn=data.templeReturn;
    if (Array.isArray(data.harvested)) harvested = new Set(data.harvested);
    if (Array.isArray(data.caveHarvested)) caveHarvested = new Set(data.caveHarvested);
    if (Array.isArray(data.lootDrops)) lootDrops = data.lootDrops.filter(d => d && Number.isFinite(d.x) && Number.isFinite(d.y) && ["coin","stone","iron","crystal","potion"].includes(d.type));
    caveMode = !!data.caveMode; if(data.caveReturn)caveReturn=data.caveReturn; if(Array.isArray(data.openedChests))openedChests=data.openedChests;
    if(data.quests)quests={...quests,...data.quests,claimed:{...quests.claimed,...(data.quests.claimed||{})}};
    npcMet = !!data.npcMet; npcTalkIndex = Number.isInteger(data.npcTalkIndex) ? data.npcTalkIndex : 0;
    if (data.npcQuest) npcQuest = { ...npcQuest, ...data.npcQuest };
    homeLevel = Math.max(0, Math.min(3, Number(data.homeLevel) || 0));
    if(Number.isFinite(Number(data.backpackTier))) backpackTier=Math.max(0,Math.min(2,Number(data.backpackTier))); else { const used=Object.values(bag).reduce((n,v)=>n+(Number(v)||0),0)+Object.values(farmSeedStock).reduce((n,v)=>n+(Number(v)||0),0); backpackTier=used>45?2:used>30?1:0; }
    if(Array.isArray(data.inventoryOrder))inventoryOrder=data.inventoryOrder.filter(v=>typeof v==="string");
    if(data.furnitureOwned) furnitureOwned={...furnitureOwned,...data.furnitureOwned};
    homeInterior = !!data.homeInterior; if (data.homeReturn) homeReturn = data.homeReturn;
    townMode=!!data.townMode;if(data.townReturn)townReturn=data.townReturn;if(data.townFriendship)Object.assign(townFriendship,data.townFriendship);if(data.townStock)Object.assign(townStock,data.townStock);
    if(Number.isFinite(data.worldClock))worldClock=data.worldClock;if(Number.isFinite(data.worldDay))worldDay=data.worldDay;
    if(data.farmSeedStock&&typeof data.farmSeedStock==="object")Object.keys(farmSeedStock).forEach(k=>farmSeedStock[k]=Math.max(0,Number(data.farmSeedStock[k])||0));
    if((bag.seeds||0)>0){farmSeedStock.carrot+=(bag.seeds||0);bag.seeds=0;}
    if(Array.isArray(data.farmPlots)){farmPlots.length=0;data.farmPlots.forEach((p,i)=>{if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))farmPlots.push({...p,id:Number.isFinite(p.id)?p.id:i});});}
    selectedFarmPlot=farmPlots.length?0:-1;
  } catch (e) { console.warn("Save could not be loaded", e); }
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth, speed: player.speed, level: player.level, xp: player.xp, skillPoints: player.skillPoints, attackPower: player.attackPower, armorLevel: player.armorLevel || 0, coins: player.coins },
      bag, stations, toolLevels, inventoryOrder, bridgeStage, templeMode, templeFloor, templeUnlocked, templePuzzleSolved, templeBosses, templeRuneProgress, templeRuneSolved, templeSecrets, templeReturn, harvested: [...harvested], caveHarvested: [...caveHarvested], lootDrops, caveMode, caveReturn, openedChests, quests, npcMet, npcTalkIndex, npcQuest, homeLevel, backpackTier, furnitureOwned, homeInterior, homeReturn, townMode, townReturn, townFriendship, townStock, worldClock, worldDay, farmPlots, farmSeedStock
    }));
    showToast("پیشرفتت ذخیره شد 💾");
  } catch (e) { showToast("ذخیره انجام نشد؛ فضای مرورگر را بررسی کن"); }
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1700);
}
function xpNeeded() { return player.level * 50; }
function addXP(amount) {
  player.xp += amount;
  let leveled = false;
  while (player.xp >= xpNeeded()) {
    player.xp -= xpNeeded();
    player.level++;
    player.skillPoints++;
    leveled = true;
  }
  return leveled;
}
function updateUI() {
  $("health").textContent = (Number.isInteger(player.health) ? player.health : player.health.toFixed(1)) + "/" + player.maxHealth;
  $("level").textContent = player.level;
  $("coins").textContent = player.coins;
  $("wood").textContent = bag.wood;
  $("stone").textContent = bag.stone;
  $("iron").textContent = bag.iron;
  if ($("armorStatus")) $("armorStatus").textContent = ["بدون زره","زره آهنی","زره کریستالی"][Math.max(0,Math.min(2,player.armorLevel||0))];
  $("crystal").textContent = bag.crystal || 0;
  $("potion").textContent = bag.potion || 0;
  if($("seeds"))$("seeds").textContent=Object.values(farmSeedStock).reduce((n,v)=>n+v,0)+(bag.seeds||0);
  if($("farmCrops"))$("farmCrops").textContent=Object.entries(FARM_CROPS).filter(([k])=>(bag[k]||0)>0).map(([k,c])=>c.icon+" "+bag[k]).join(" • ")||"هنوز محصولی برداشت نکردی";
  ["fiber","sand","marble","plank","brick","rope","nail","glass","cloth","marbleSlab","ironParts","templeFoundation","templeColumn","templeBeam","templeMosaic","templeBanner"].forEach(k=>{const el=$(k);if(el)el.textContent=bag[k]||0;});
  if ($("toolStatus")) $("toolStatus").textContent = "تبر " + toolLevelName("axe") + " • کلنگ " + toolLevelName("pickaxe") + " • بیل " + toolLevelName("shovel");
  $("xpText").textContent = player.xp + " / " + xpNeeded() + " XP";
  $("xpFill").style.width = Math.min(100, player.xp / xpNeeded() * 100) + "%";
  renderInventory();
  renderHotbar();
  updateUpgradeUI();
  updateQuestUI();
  if ($("npcQuestStatus")) updateNpcQuestUI();
  if ($("craftPanel")) updateCraftUI();
  if ($("stationPanel")) updateToolUI();
}
load();
if(caveMode&&Math.hypot(player.x-800,player.y-1080)<8){player.x=800;player.y=1015;}
makeWorld();
makeCave();
function makeEnemies() {
  // Slimes no longer spawn in the forest; they live in the cave now.
  enemies = [];
}
makeEnemies();
if(templeMode)createTempleEnemies();
function makeCave(){
 caveResources=[
 {id:"cs1",x:250,y:250,type:"stone",hp:4,max:4},{id:"cs2",x:1320,y:250,type:"stone",hp:4,max:4},
 {id:"cs3",x:1080,y:880,type:"stone",hp:4,max:4},{id:"cs4",x:360,y:930,type:"stone",hp:4,max:4},
 {id:"ci1",x:420,y:450,type:"iron",hp:5,max:5},{id:"ci2",x:1320,y:650,type:"iron",hp:5,max:5},
 {id:"ci3",x:760,y:1020,type:"iron",hp:5,max:5},{id:"cc1",x:760,y:360,type:"crystal",hp:4,max:4},
 {id:"cc2",x:300,y:680,type:"crystal",hp:4,max:4},{id:"cc3",x:1450,y:950,type:"crystal",hp:4,max:4},
 {id:"cm1",x:560,y:560,type:"marble",hp:5,max:5},{id:"cm2",x:980,y:860,type:"marble",hp:5,max:5},{id:"cm3",x:1450,y:300,type:"marble",hp:5,max:5},
 {id:"cm4",x:180,y:560,type:"marble",hp:5,max:5},{id:"cm5",x:880,y:170,type:"marble",hp:5,max:5},{id:"cm6",x:1180,y:180,type:"marble",hp:5,max:5},{id:"cm7",x:250,y:1040,type:"marble",hp:5,max:5},{id:"cm8",x:520,y:1080,type:"marble",hp:5,max:5},{id:"cm9",x:960,y:520,type:"marble",hp:5,max:5},{id:"cm10",x:1240,y:760,type:"marble",hp:5,max:5},{id:"cm11",x:1480,y:1080,type:"marble",hp:5,max:5},{id:"cm12",x:760,y:680,type:"marble",hp:5,max:5},{id:"cm13",x:1120,y:1040,type:"marble",hp:5,max:5},{id:"cm14",x:180,y:820,type:"marble",hp:5,max:5},{id:"cm15",x:1380,y:160,type:"marble",hp:5,max:5},{id:"cm16",x:1040,y:240,type:"marble",hp:5,max:5},{id:"cm17",x:400,y:180,type:"marble",hp:5,max:5},{id:"cm18",x:900,y:1120,type:"marble",hp:5,max:5}];
 caveChests=[{id:"cave-chest-0",x:590,y:230,opened:!!openedChests[0]},{id:"cave-chest-1",x:1370,y:420,opened:!!openedChests[1]},{id:"cave-chest-2",x:790,y:790,opened:!!openedChests[2]}];
 const slimeSpots=[[650,470],[960,470],[640,820],[980,820],[800,930]];
 caveEnemies=slimeSpots.map((p,i)=>({id:"cave-slime-"+i,kind:"slime",x:p[0],y:p[1],spawnX:p[0],spawnY:p[1],hp:3,max:3,alive:true,respawnTimer:0}));
 caveEnemies.push({id:"crystal-guardian",kind:"guardian",x:960,y:650,spawnX:960,spawnY:650,hp:5,max:5,alive:true,respawnTimer:0});
}
function activeNodes(){return caveMode?caveResources.filter(r=>!caveHarvested.has(r.id)):resources.filter(r=>!harvested.has(r.id));}
function syncCameraToPlayer(){
 const mw=caveMode?CAVE.w:WORLD.w,mh=caveMode?CAVE.h:WORLD.h;
 camera.x=Math.max(0,Math.min(Math.max(0,mw-viewW),player.x-viewW/2));
 camera.y=Math.max(0,Math.min(Math.max(0,mh-viewH),player.y-viewH/2));
}
function resetCaveMotion(){
 move.x=0;move.y=0;moveTarget=null;playerMoving=false;playerActionTimer=0;playerActionType="";
 if(typeof keys!=="undefined"&&keys&&typeof keys.clear==="function")keys.clear();
}
function toggleCave(){
 if(templeMode||townMode||homeInterior)return;
 if(!caveMode){
  caveReturn={x:player.x,y:player.y};caveMode=true;player.x=800;player.y=1015;
  showToast("وارد غار جنگلی شدی 🕯️");
 }else{
  caveMode=false;player.x=caveReturn.x;player.y=caveReturn.y;
  showToast("به جنگل برگشتی 🌲");
 }
 resetCaveMotion();
 syncCameraToPlayer();
 $("caveBtn").textContent=caveMode?"🚪 خروج از غار":"🕳️ ورود به غار";
 $("caveBtn").hidden=true;
 saveQuietly();updateUI();
}


const bridgeRecipes = [
 {name:"پایه‌های سنگی",cost:{brick:30,marbleSlab:5,ironParts:3},hint:"۳۰ آجر سنگی • ۵ تخته مرمر • ۳ قطعه آهنی"},
 {name:"عرشه چوبی و مهارها",cost:{plank:45,nail:18,rope:14},hint:"۴۵ تخته • ۱۸ میخ • ۱۴ طناب"},
 {name:"مهر باستانی معبد",cost:{crystal:6,glass:6,cloth:6,templeFoundation:2,templeColumn:1,templeBeam:1},hint:"۶ کریستال • ۶ شیشه • ۶ پارچه • ۲ پایه • ۱ ستون • ۱ تیر معبد"}
];
function bridgeCanBuild(stage){
 const recipe=bridgeRecipes[stage];return !!recipe&&Object.values(stations).every(Boolean)&&Object.entries(recipe.cost).every(([k,v])=>(bag[k]||0)>=v);
}
function updateBridgeUI(){
 const title=$("bridgeStatus"),btn=$("bridgeBuildBtn"),detail=$("bridgeRecipe");
 if(bridgeStage>=3){title.textContent="پل باستانی بازسازی شد؛ راه معبد باز است!";detail.textContent="آن‌سوی رودخانه، جاده سنگی تا دروازه معبد ادامه دارد.";btn.hidden=true;return;}
 const r=bridgeRecipes[bridgeStage];
 title.textContent="مرحله "+(bridgeStage+1)+" از ۳: "+r.name;
 detail.textContent="نیازمندی‌ها: "+r.hint+"\nبرای ساخت این بخش، هر سه ایستگاه کارگاه باید ساخته شده باشند.";
 btn.hidden=false;btn.disabled=!bridgeCanBuild(bridgeStage);
 btn.textContent=bridgeCanBuild(bridgeStage)?"ساخت این بخش از پل":"هنوز همه مصالح آماده نیست";
}
function openBridgePanel(){
 $("bridgePanel").hidden=false;updateBridgeUI();syncXpPanel();
}
function buildBridgeStage(){
 if(bridgeStage>=3)return;
 if(!Object.values(stations).every(Boolean)){showToast("اول میزکار، کوره و اره‌کاری را بساز");return;}
 const r=bridgeRecipes[bridgeStage];
 if(!bridgeCanBuild(bridgeStage)){showToast("مصالح این مرحله هنوز کامل نیست");return;}
 Object.entries(r.cost).forEach(([k,v])=>bag[k]=(bag[k]||0)-v);
 bridgeStage++;updateUI();updateBridgeUI();saveQuietly();
 showToast(bridgeStage===3?"پل باستانی کامل شد! مسیر معبد باز شد 🏛️":"بخش تازه‌ای از پل ساخته شد! 🪵");
}


function templePuzzleCost(f){return [null,{templeMosaic:2,templeBanner:1},{templeMosaic:3,templeBanner:1},{templeMosaic:4,templeBanner:2},{templeMosaic:5,templeBanner:2},{templeMosaic:6,templeBanner:3}][f];}
const TEMPLE_RUNES=[null,[0,2,1],[1,0,2],[2,1,0],[1,2,0],[2,0,1]];
const TEMPLE_RUNE_NAMES=["ماه","خورشید","ستاره"];
const TEMPLE_RUNE_POINTS=[{x:760,y:820},{x:1040,y:930},{x:1320,y:820}];
function templeRuneClue(){return (TEMPLE_RUNES[templeFloor]||TEMPLE_RUNES[1]).map(i=>TEMPLE_RUNE_NAMES[i]).join(" ← ");}
function templeCanSolve(){return Object.entries(templePuzzleCost(templeFloor)).every(([k,v])=>(bag[k]||0)>=v);}
function createTempleEnemies(){
 templeEnemies=[];const f=templeFloor;
 [[650,370],[850,1030],[1220,360],[1510,1080]].forEach((p,i)=>{const hp=3+f*2;templeEnemies.push({id:"temple-sentinel-"+f+"-"+i,kind:"templeSentinel",x:p[0],y:p[1],spawnX:p[0],spawnY:p[1],hp,max:hp,alive:true,respawnTimer:0});});
 if(!templeBosses[f]){const hp=14+f*5;templeEnemies.push({id:"temple-warden-"+f,kind:"templeBoss",x:1660,y:750,spawnX:1660,spawnY:750,hp,max:hp,alive:true,respawnTimer:0});}
}
function templeTrapActive(trap){return Math.sin(animTime*1.45+trap.phase+templeFloor*.38)>.12;}
function templeDefeatPlayer(){
 const lost=Math.min(60,Math.floor(Math.max(0,player.coins)*.1));player.coins=Math.max(0,player.coins-lost);player.health=player.maxHealth;player.x=160;player.y=750;moveTarget=null;damageCooldown=1.2;templeTrapCooldown=1.2;updateUI();saveQuietly();showToast("در معبد از پا افتادی؛ "+lost+" سکه از دست رفت. پیشرفت طبقه حفظ شد.");
}
function openTemplePanel(){
 $("templePanel").hidden=false;
 $("templeStatus").textContent="پیشرفت: طبقه "+templeUnlocked+" از "+TEMPLE.floors+" باز شده است.";
 $("templeRuneHint").textContent="سرنخ تالار فعلی: "+templeRuneClue()+"؛ سه نقش را به همین ترتیب لمس کن.";
 $("templeEnterBtn").textContent=templeMode?"ادامه‌ی کاوش":"ورود به معبد";syncXpPanel();
}
function enterTemple(){
 if(bridgeStage<3){showToast("اول پل باستانی را کامل کن");return;}
 templeReturn={x:player.x,y:player.y};templeMode=true;caveMode=false;townMode=false;homeInterior=false;
 templeFloor=Math.min(templeFloor,templeUnlocked,TEMPLE.floors);player.x=160;player.y=750;createTempleEnemies();
 $("templePanel").hidden=true;showToast("به تالار نخست معبد خوش آمدی؛ مراقب نگهبان‌ها باش 🏛️");saveQuietly();syncXpPanel();
}
function leaveTemple(){
 templeMode=false;player.x=templeReturn.x;player.y=templeReturn.y;$("templePanel").hidden=true;
 showToast("از معبد خارج شدی؛ پیشرفتت ذخیره شد 🌲");saveQuietly();syncXpPanel();
}
function templeInteract(runeIndex=null){
 const exitD=Math.hypot(player.x-145,player.y-750),sealD=Math.hypot(player.x-1040,player.y-520),gateD=Math.hypot(player.x-2020,player.y-750);
 if(runeIndex==="secret"){
  if(!templeRuneSolved[templeFloor]){showToast("اتاقک هنوز قفل است؛ اول سه نقش را درست فعال کن.");return;}
  if(templeSecrets[templeFloor]){showToast("این صندوق باستانی قبلاً گشوده شده است.");return;}
  if(!bagCanAdd(templeFloor+2)){showToast("برای برداشتن گنج، کمی جای خالی در کوله‌پشتی باز کن 🎒");return;}
  templeSecrets[templeFloor]=true;const coins=30+templeFloor*15,crystals=1+templeFloor;player.coins+=coins;bag.crystal=(bag.crystal||0)+crystals;bag.templeMosaic=(bag.templeMosaic||0)+1;addXP(20+templeFloor*10);updateUI();saveQuietly();showToast("گنج پنهان طبقه "+templeFloor+"! +"+coins+" سکه، "+crystals+" کریستال و یک موزاییک ✨");return;
 }
 if(Number.isInteger(runeIndex)&&runeIndex>=0&&runeIndex<3){
  if(templeRuneSolved[templeFloor]){showToast("هر سه نقش این تالار روشن شده‌اند.");return;}
  const sequence=TEMPLE_RUNES[templeFloor]||TEMPLE_RUNES[1],progress=Math.max(0,Number(templeRuneProgress[templeFloor])||0);
  if(runeIndex===sequence[progress]){const next=progress+1;templeRuneProgress[templeFloor]=next;if(next>=sequence.length){templeRuneSolved[templeFloor]=true;player.coins+=15+templeFloor*5;addXP(20+templeFloor*5);updateUI();saveQuietly();showToast("معما حل شد! اتاقک مخفی باز شد؛ صندوق را پیدا کن 🗝️");}else{saveQuietly();showToast("نقش درست بود! "+next+" از ۳ ✨");}}
  else{templeRuneProgress[templeFloor]=0;saveQuietly();showToast("ترتیب اشتباه بود؛ سرنخ بالای تالار را دوباره بخوان.");}
  return;
 }
 if(exitD<115){leaveTemple();return;}
 if(sealD<125){
  if(!templeRuneSolved[templeFloor]&&!templePuzzleSolved[templeFloor]){showToast("اول معمای سه نقش را حل کن تا مهر مرکزی فعال شود.");return;}
  if(templePuzzleSolved[templeFloor]){showToast("مهر این طبقه قبلاً فعال شده.");return;}
  const cost=templePuzzleCost(templeFloor);
  if(!templeCanSolve()){showToast("موزاییک و پرچم کافی نداری؛ مواد لازم: "+Object.entries(cost).map(([k,v])=>(k==="templeMosaic"?"موزاییک ":"پرچم ")+v).join(" و "));return;}
  Object.entries(cost).forEach(([k,v])=>bag[k]-=v);templePuzzleSolved[templeFloor]=true;updateUI();saveQuietly();showToast("مهر باستانی روشن شد! ✨");return;
 }
 if(gateD<135){
  if(!templeBosses[templeFloor]){showToast("اول نگهبان این طبقه را شکست بده!");return;}
  if(!templePuzzleSolved[templeFloor]){showToast("اول مهر مرکزی را فعال کن.");return;}
  if(templeFloor===TEMPLE.floors){
   player.coins+=250;bag.crystal=(bag.crystal||0)+12;bag.templeMosaic=(bag.templeMosaic||0)+5;templeMode=false;player.x=templeReturn.x;player.y=templeReturn.y;updateUI();saveQuietly();showToast("راز معبد را کشف کردی! +۲۵۰ سکه و ۱۲ کریستال 🏆");return;
  }
  templeFloor++;templeUnlocked=Math.max(templeUnlocked,templeFloor);player.x=160;player.y=750;createTempleEnemies();saveQuietly();showToast("طبقه‌ی "+templeFloor+" از ۵ باز شد؛ ماجراجویی ادامه دارد…");return;
 }
 showToast("به محراب، نگهبان یا دروازه نزدیک‌تر شو.");
}
function drawTempleGround(){
 ctx.save();ctx.translate(-camera.x,-camera.y);
 const f=templeFloor,base=["#292b2b","#302b32","#26343a","#34302a","#252733"][f-1];ctx.fillStyle=base;ctx.fillRect(0,0,TEMPLE.w,TEMPLE.h);
 for(let y=0;y<TEMPLE.h;y+=64)for(let x=0;x<TEMPLE.w;x+=64){const h=terrainHash(x/64+f*17,y/64+f*31);ctx.fillStyle=h>.5?"rgba(190,166,119,.08)":"rgba(0,0,0,.12)";ctx.fillRect(x+3,y+3,58,58);if(h>.83){ctx.fillStyle="rgba(218,190,137,.16)";ctx.fillRect(x+12,y+14,18,3);ctx.fillRect(x+12,y+14,3,14);}}
 ctx.fillStyle="#15191c";ctx.fillRect(0,0,TEMPLE.w,54);ctx.fillRect(0,TEMPLE.h-54,TEMPLE.w,54);ctx.fillRect(0,0,54,TEMPLE.h);ctx.fillRect(TEMPLE.w-54,0,54,TEMPLE.h);
 ctx.fillStyle="#84785f";ctx.fillRect(60,60,TEMPLE.w-120,10);ctx.fillRect(60,TEMPLE.h-70,TEMPLE.w-120,10);
 ctx.fillStyle=f===5?"#4d2635":"#55432f";ctx.fillRect(770,220,470,1050);
 for(let i=0;i<10;i++){const x=250+(i%5)*420,y=i<5?210:1290;ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(x-30,y-18,60,48);ctx.fillStyle="#45494a";ctx.fillRect(x-25,y-90,50,170);ctx.fillStyle="#77766a";ctx.fillRect(x-19,y-84,38,150);ctx.fillStyle="#aaa184";ctx.fillRect(x-30,y-96,60,16);ctx.fillRect(x-30,y+62,60,18);}
 for(let i=0;i<18;i++){const x=180+(i*137)%1800,y=170+(i*223)%1120;ctx.fillStyle="#191d20";ctx.fillRect(x,y,24,12);ctx.fillStyle="#77736a";ctx.fillRect(x+3,y-4,14,8);}
 const px=1040,py=520;ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(px,py+30,105,42,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=templePuzzleSolved[f]?"#71e6d5":"#b79b67";ctx.lineWidth=8;ctx.beginPath();ctx.arc(px,py,78,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#776348";ctx.lineWidth=3;
 for(let a=0;a<8;a++){const an=a*Math.PI/4;ctx.beginPath();ctx.moveTo(px+Math.cos(an)*28,py+Math.sin(an)*28);ctx.lineTo(px+Math.cos(an)*70,py+Math.sin(an)*70);ctx.stroke();}
 ctx.fillStyle=templePuzzleSolved[f]?"#76e9dc":"#b48b50";ctx.beginPath();ctx.arc(px,py,22,0,Math.PI*2);ctx.fill();
 const gx=2020;ctx.fillStyle="#171a1b";ctx.fillRect(gx-70,620,140,190);ctx.fillStyle="#8e8065";ctx.fillRect(gx-82,600,164,22);ctx.fillRect(gx-82,790,164,20);ctx.fillRect(gx-66,620,18,170);ctx.fillRect(gx+48,620,18,170);ctx.fillStyle=templeBosses[f]&&templePuzzleSolved[f]?"#77d9c6":"#403b34";ctx.fillRect(gx-34,660,68,130);
 ctx.fillStyle="#b59b6d";ctx.fillRect(91,620,108,18);ctx.fillRect(97,790,96,18);ctx.fillStyle="#25282a";ctx.fillRect(110,638,70,152);
 ctx.fillStyle="#e8d5a5";ctx.font="bold 24px Tahoma";ctx.textAlign="center";ctx.fillText("تالار "+f+" • از ۵",1100,115);ctx.font="bold 15px Tahoma";ctx.fillText("مهر باستانی",px,py-112);ctx.fillText("دروازه‌ی طبقه‌ی بعد",gx,585);ctx.textAlign="start";
 for(const [x,y] of [[360,520],[1710,520],[360,990],[1710,990]]){const g=ctx.createRadialGradient(x,y,3,x,y,105);g.addColorStop(0,"rgba(255,174,75,.24)");g.addColorStop(1,"rgba(255,174,75,0)");ctx.fillStyle=g;ctx.fillRect(x-110,y-110,220,220);ctx.fillStyle="#b47b42";ctx.fillRect(x-9,y-5,18,22);ctx.fillStyle="#ffd27b";ctx.fillRect(x-4,y-20,8,17);}
  const accents=["#7d9b72","#6ba9b6","#c49a58","#a76b87","#79d5ca"],accent=accents[f-1];
  if(f===1){for(let i=0;i<14;i++){const x=170+(i*113)%1840,y=150+(i*197)%1180;ctx.fillStyle="#526c4b";ctx.fillRect(x,y,26,7);ctx.fillRect(x+7,y-5,13,6);}}
  if(f===2){for(let i=0;i<7;i++){const x=180+i*285,y=390+(i%2)*410;ctx.fillStyle="rgba(73,157,174,.18)";ctx.fillRect(x,y,110,30);ctx.fillStyle="rgba(137,216,222,.28)";ctx.fillRect(x+18,y+7,64,4);}}
  if(f===3){for(let i=0;i<6;i++){const x=130+i*350;ctx.fillStyle="#4a3930";ctx.fillRect(x,150,58,150);ctx.fillRect(x,1190,58,150);ctx.fillStyle="#b58a55";for(let k=0;k<5;k++)ctx.fillRect(x+8,165+k*24,42,3);}}
  if(f===4){for(let i=0;i<5;i++){const x=300+i*390;ctx.fillStyle="#5c3445";ctx.fillRect(x,90,54,150);ctx.fillRect(x,1260,54,150);ctx.fillStyle="#c49a75";ctx.fillRect(x+23,90,7,150);}}
  if(f===5){ctx.strokeStyle="rgba(125,218,211,.24)";ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(1040,750,170+i*75,0,Math.PI*2);ctx.stroke();}}
  for(let i=0;i<3;i++){const p=TEMPLE_RUNE_POINTS[i],x=p.x,y=p.y,lit=templeRuneSolved[f]||(Number(templeRuneProgress[f])||0)>TEMPLE_RUNES[f].indexOf(i);ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(x,y+20,42,15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#343b3b";ctx.fillRect(x-27,y-26,54,48);ctx.fillStyle=lit?accent:"#82745e";ctx.fillRect(x-21,y-22,42,38);ctx.fillStyle=lit?"#e4f5d5":"#d7c69c";ctx.font="bold 18px Tahoma";ctx.textAlign="center";ctx.fillText(["☾","☼","✦"][i],x,y+4);ctx.font="bold 12px Tahoma";ctx.fillStyle="#e9dfc4";ctx.fillText(TEMPLE_RUNE_NAMES[i],x,y-42);}
  if(templeRuneSolved[f]&&!templeSecrets[f]){const x=1780,y=1080;ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(x,y+18,44,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#5a3825";ctx.fillRect(x-32,y-24,64,42);ctx.fillStyle="#b88b4c";ctx.fillRect(x-36,y-30,72,12);ctx.fillStyle="#e4c777";ctx.fillRect(x-5,y-25,10,28);ctx.fillStyle="#f4d98c";ctx.fillRect(x-8,y-39,16,9);ctx.fillStyle="#f1d18b";ctx.font="bold 12px Tahoma";ctx.fillText("گنج پنهان",x,y-48);}
  ctx.fillStyle="#e8d5a5";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("ترتیب نقش‌ها: "+templeRuneClue(),1100,145);ctx.textAlign="start";
 for(const trap of TEMPLE_TRAPS){const active=templeTrapActive(trap),x=trap.x,y=trap.y;ctx.fillStyle=active?"rgba(190,48,52,.23)":"rgba(190,145,76,.12)";ctx.beginPath();ctx.arc(x,y,trap.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=active?"rgba(242,91,78,.85)":"rgba(205,177,118,.45)";ctx.lineWidth=active?5:3;ctx.setLineDash(active?[]:[9,8]);ctx.beginPath();ctx.arc(x,y,trap.r*.78,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=active?"#e77a68":"#c7a66b";ctx.font="bold 22px Tahoma";ctx.textAlign="center";ctx.fillText(active?"✹":"◇",x,y+8);}
 ctx.restore();
}
function drawTempleEnemy(e){
 const x=e.x-camera.x,y=e.y-camera.y,boss=e.kind==="templeBoss",ratio=e.hp/e.max,phase=ratio<=.34?3:ratio<=.68?2:1,sc=boss?(phase===3?1.9:1.7):1;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
 ctx.fillStyle="rgba(0,0,0,.32)";ctx.beginPath();ctx.ellipse(0,18,27,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=boss?(phase===3?"#9c3f53":phase===2?"#765080":"#5d3c68"):"#566b63";ctx.fillRect(-19,-30,38,43);ctx.fillStyle=boss?(phase===3?"#e06a65":phase===2?"#ad7ac0":"#9a6aa6"):"#8ba18a";ctx.fillRect(-15,-27,30,29);ctx.fillStyle="#d9c69a";ctx.fillRect(-23,-36,46,9);ctx.fillStyle="#f5c86c";ctx.fillRect(-9,-19,5,5);ctx.fillRect(4,-19,5,5);ctx.fillStyle="#33383b";ctx.fillRect(-13,8,10,15);ctx.fillRect(3,8,10,15);if(boss){ctx.fillStyle="#77e6dc";ctx.fillRect(-5,-10,10,11);}ctx.restore();
 if(boss){ctx.fillStyle="#17191c";ctx.fillRect(x-42,y-62,84,8);ctx.fillStyle="#d85f59";ctx.fillRect(x-41,y-61,82*Math.max(0,e.hp/e.max),6);ctx.fillStyle="#f1d7aa";ctx.font="bold 11px Tahoma";ctx.textAlign="center";ctx.fillText("فاز "+phase,x,y-70);}
}

function harvest(targetId=null) {
  if(templeMode){templeInteract();return;}
  triggerPlayerAction("gather",0.36);
  playGameSound("gather");
  if(caveMode){const chest=caveChests.find(c=>!c.opened&&(targetId?c.id===targetId:Math.hypot(player.x-c.x,player.y-c.y)<76));if(chest){if(!bagCanAdd(1)){showToast("کوله‌پشتی پره! اول ظرفیتش رو ارتقا بده 🎒");return;}chest.opened=true;openedChests=caveChests.map(c=>c.opened);player.coins+=15;const leveled=addXP(25);bag.crystal=(bag.crystal||0)+1;progressNpcCrystal(1);updateUI();saveQuietly();showToast(leveled?"سطح جدید! یک امتیاز مهارت گرفتی ⭐":"صندوق گنج! +۱۵ سکه، ۲۵ تجربه و کریستال 💎");return;}}
  const dropIndex=lootDrops.findIndex(d=>targetId?d.id===targetId:Math.hypot(player.x-d.x,player.y-d.y)<62);
  if(dropIndex>=0){const preview=lootDrops[dropIndex];if(preview.type!=="coin"&&!bagCanAdd(preview.qty)){showToast("کوله‌پشتی پره! اول ظرفیتش رو ارتقا بده 🎒");return;}const drop=lootDrops.splice(dropIndex,1)[0];spawnPickupFx(drop.x,drop.y,drop.type);if(drop.type==="coin")player.coins+=drop.qty;else if(drop.type==="stone")bag.stone=(bag.stone||0)+drop.qty;else if(drop.type==="iron")bag.iron=(bag.iron||0)+drop.qty;else if(drop.type==="crystal"){bag.crystal=(bag.crystal||0)+drop.qty;progressNpcCrystal(drop.qty);}else if(drop.type==="potion")bag.potion=(bag.potion||0)+drop.qty;updateUI();saveQuietly();playGameSound("pickup");showToast(({coin:"🪙 سکه",stone:"🪨 سنگ",iron:"⛏️ آهن",crystal:"💎 کریستال",potion:"🧪 معجون"})[drop.type]+" ×"+drop.qty+" برداشتی!");return;}
  let nearest = null, best = 76;
  for (const r of activeNodes()) {
    if(targetId&&r.id!==targetId)continue;
    const d = Math.hypot(player.x - r.x, player.y - r.y);
    if (d < best) { best = d; nearest = r; }
  }
  if (!nearest) { if(!targetId)showToast("به درخت یا سنگ نزدیک‌تر شو"); return; }
  const toolType = nearest.type === "tree" || nearest.type === "bush" ? "axe" : nearest.type === "sand" ? "shovel" : "pickaxe";
  const damage=1+(toolLevels[toolType]||0);
  const amount=nearest.type==="tree"?3:(nearest.type==="stone"||nearest.type==="bush"||nearest.type==="sand")?2:1;
  if(nearest.hp-damage<=0&&!bagCanAdd(amount)){showToast("کوله‌پشتی پره! برای ظرفیت بیشتر برو پیش آقای نادری 🎒");return;}
  nearest.hp -= damage;
  spawnGatherFx(nearest.type,nearest.x,nearest.y,nearest.hp<=0);
  if (nearest.hp <= 0) {
    (caveMode ? caveHarvested : harvested).add(nearest.id);
    if (nearest.type === "tree") { bag.wood += 3; quests.wood = Math.min(10, quests.wood + 3); }
    if (nearest.type === "stone") bag.stone += 2;
    if (nearest.type === "iron") { bag.iron += 1; quests.iron = Math.min(5, quests.iron + 1); }
    if (nearest.type === "crystal") { bag.crystal = (bag.crystal||0)+1; progressNpcCrystal(1); }
    if (nearest.type === "bush") bag.fiber = (bag.fiber||0) + 2;
    if (nearest.type === "sand") bag.sand = (bag.sand||0) + 2;
    if (nearest.type === "marble") bag.marble = (bag.marble||0) + 1;
    const leveled = addXP(10);
    if (leveled) showToast("سطح جدید! یک امتیاز مهارت گرفتی ⭐");
    else showToast(nearest.type === "tree" ? "۳ چوب جمع کردی 🪵" : nearest.type === "stone" ? "۲ سنگ جمع کردی 🪨" : nearest.type === "iron" ? "۱ آهن جمع کردی ⛏️" : nearest.type === "crystal" ? "۱ کریستال جمع کردی 💎" : nearest.type === "bush" ? "۲ الیاف جمع کردی 🧵" : nearest.type === "sand" ? "۲ شن جمع کردی 🏖️" : "۱ مرمر استخراج کردی ⬜");
    updateUI();
    saveQuietly();
    playGameSound("pickup");
  } else {
    showToast("در حال جمع‌آوری...");
  }
}
function attack(targetId=null) {
  if (attackCooldown > 0) return;
  triggerPlayerAction("attack",0.34);
  playGameSound("attack");
  attackCooldown = 0.32; attackFlash = 0.18;
  let target = null, best = 104;
  const targets = templeMode ? templeEnemies : caveMode ? caveEnemies : enemies;
  for (const e of targets) { if (!e.alive || (targetId&&e.id!==targetId)) continue; const d=Math.hypot(player.x-e.x,player.y-e.y); if(d<best){best=d;target=e;} }
  if (!target) { showToast("برای حمله به موجود نزدیک‌تر شو"); return; }
  target.hp -= player.attackPower;
  if (target.hp <= 0) {
    target.alive=false;
    target.respawnTimer=target.kind==="guardian"?28:18;
    const roll=Math.random();
    if(target.kind==="templeBoss"){templeBosses[templeFloor]=true;player.coins+=25+templeFloor*10;bag.crystal=(bag.crystal||0)+2+templeFloor;bag.templeMosaic=(bag.templeMosaic||0)+1;progressNpcCrystal(2+templeFloor);addXP(35+templeFloor*10);updateUI();saveQuietly();showToast("نگهبان معبد شکست خورد! غنیمت کمیاب گرفتی 🏛️");}
    else if(target.kind==="templeSentinel"){addXP(10+templeFloor*2);if(Math.random()<.45)bag.crystal=(bag.crystal||0)+1;updateUI();saveQuietly();showToast("نگهبان تالار شکست خورد!");}
    else if(target.kind==="guardian"){lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+18,y:target.y+12,type:"crystal",qty:2,rarity:"rare"});player.coins+=10;bag.crystal=(bag.crystal||0)+2;progressNpcCrystal(2);const leveled=addXP(25);updateUI();saveQuietly();showToast(leveled?"نگهبان کریستالی شکست خورد! +۱۰ سکه و ۲ کریستال؛ سطح جدید ⭐":"نگهبان کریستالی شکست خورد! +۱۰ سکه، ۲ کریستال و ۲۵ تجربه 💎");}
    else {quests.slime=Math.min(3,quests.slime+1);const leveled=addXP(15);if(roll<0.38)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"coin",qty:3+Math.floor(Math.random()*5),rarity:"common"});else if(roll<0.62)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"stone",qty:1,rarity:"common"});else if(roll<0.82)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"iron",qty:1,rarity:"uncommon"});else if(roll<0.94)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"potion",qty:1,rarity:"rare"});else lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"crystal",qty:1,rarity:"rare"});updateUI();saveQuietly();showToast(leveled?"اسلایم غار شکست خورد! سطح جدید ⭐":"اسلایم غار شکست خورد! +۱۵ تجربه؛ شاید غنیمت انداخته باشد 💎");}
  } else showToast("ضربه زدی! ❤️ جان دشمن: "+target.hp);
}

function saveQuietly() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth, speed: player.speed, level: player.level, xp: player.xp, skillPoints: player.skillPoints, attackPower: player.attackPower, armorLevel: player.armorLevel || 0, coins: player.coins },
      bag, stations, toolLevels, inventoryOrder, bridgeStage, templeMode, templeFloor, templeUnlocked, templePuzzleSolved, templeBosses, templeRuneProgress, templeRuneSolved, templeSecrets, templeReturn, harvested: [...harvested], caveHarvested: [...caveHarvested], lootDrops, caveMode, caveReturn, openedChests, quests, npcMet, npcTalkIndex, npcQuest, homeLevel, backpackTier, furnitureOwned, homeInterior, homeReturn, townMode, townReturn, townFriendship, townStock, worldClock, worldDay, farmPlots, farmSeedStock
    }));
  } catch (e) {}
}

const keys = new Set();
addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(e.key.toLowerCase()))moveTarget=null;
  keys.add(e.key.toLowerCase());
});
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

function updateHotbar(){
  document.querySelectorAll("#toolHotbar [data-tool]").forEach(btn=>{
    btn.classList.toggle("selected",btn.dataset.tool===selectedTool);
    btn.setAttribute("aria-pressed",btn.dataset.tool===selectedTool?"true":"false");
  });
}
function chooseTool(tool){
  if(!TOOL_INFO[tool])return;
  selectedTool=tool;updateHotbar();
  if(tool==="seeds")openFarmPanel();
  else showToast(TOOL_INFO[tool].label+" انتخاب شد");
}

$("soundBtn").addEventListener("click",()=>{
  const next=!gameAudio.enabled;
  setGameSound(next);
});
try{if(localStorage.getItem("pixelIsland_sound_enabled")==="1")$("soundBtn").textContent="🔈 برای فعال‌سازی صدا لمس کن";}catch(e){}

$("toolHotbar").addEventListener("click",e=>{
 const btn=e.target.closest("button");if(!btn)return;
 if(btn.dataset.tool){chooseTool(btn.dataset.tool);return;}
 const id=btn.dataset.hotItem;if(!id)return;
 if(id==="bag:potion"){usePotion();return;}
 if(id.startsWith("seed:")){selectedCrop=id.slice(5);chooseTool("seeds");return;}
 inventorySelected=id;renderInventory();renderHotbar();
 const item=inventoryItems().find(v=>v.id===id);if(item)showToast(item.name+" انتخاب شد");

});
$("inventoryGrid").addEventListener("click",e=>{
 const discard=e.target.closest("[data-discard]");if(discard){e.stopPropagation();discardInventoryItem(discard.dataset.discard);return;}
 const equip=e.target.closest("[data-equip]");
 if(equip){chooseTool(equip.dataset.equip);inventorySelected=null;renderInventory();return;}
 const card=e.target.closest("[data-item]");if(!card)return;
 const id=card.dataset.item;
 if(!inventorySelected){inventorySelected=id;renderInventory();return;}
 if(inventorySelected===id){inventorySelected=null;renderInventory();return;}
 swapInventoryItems(inventorySelected,id);
});

let inventoryDragId=null;
$("inventoryGrid").addEventListener("dragstart",e=>{const card=e.target.closest("[data-item]");if(!card)return;inventoryDragId=card.dataset.item;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",inventoryDragId);});
$("inventoryGrid").addEventListener("dragover",e=>{if(e.target.closest("[data-item]"))e.preventDefault();});
$("inventoryGrid").addEventListener("drop",e=>{const card=e.target.closest("[data-item]");if(!card)return;e.preventDefault();const from=inventoryDragId||e.dataTransfer.getData("text/plain");swapInventoryItems(from,card.dataset.item);inventoryDragId=null;});
$("inventoryGrid").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-item]")){e.preventDefault();e.target.click();}});
function setWorldTarget(type,x,y,extra={}){
  moveTarget={type,x,y,...extra};interactionTimer=0;
}
function canvasWorldTap(e){
  if(document.querySelector(".panel:not([hidden])"))return;
  e.preventDefault();
  const wx=e.clientX+camera.x,wy=e.clientY+camera.y;
  if(homeInterior){
    const doorY=Math.max(35,(viewH-520)/2)+Math.min(viewH-80,520)-9;
    if(Math.abs(e.clientX-viewW/2)<66&&Math.abs(e.clientY-doorY)<52)handleHomeButton();
    return;
  }
  if(townMode&&Math.hypot(wx-800,wy-1110)<92){transitionTown(false);return;}
  if(caveMode&&Math.hypot(wx-800,wy-1080)<78){toggleCave();return;}
  if(!templeMode&&!townMode&&!caveMode&&!homeInterior){
    if(Math.hypot(wx-2080,wy-1450)<88){toggleCave();return;}
    if(Math.hypot(wx-2310,wy-900)<92){transitionTown(true);return;}
    if(Math.hypot(wx-playerHome.x,wy-playerHome.y)<92){if(homeLevel>0)enterPlayerHome();else openHomePanel();return;}
    const stationsHere=[];
    if(stations.workbench)stationsHere.push({x:playerHome.x-108,y:playerHome.y+104});
    if(stations.sawmill)stationsHere.push({x:playerHome.x+8,y:playerHome.y+145});
    if(stations.furnace)stationsHere.push({x:playerHome.x+112,y:playerHome.y+104});
    const station=stationsHere.find(p=>Math.hypot(wx-p.x,wy-p.y)<68);
    if(station){setWorldTarget("workshop",station.x,station.y);return;}
  }
  const near=(items,radius,fn)=>items.find(o=>Math.hypot(wx-o.x,wy-o.y)<radius&&(!fn||fn(o)));
  if(templeMode){
    const enemy=near(templeEnemies,48,o=>o.alive);
    if(enemy){setWorldTarget("enemy",enemy.x,enemy.y,{id:enemy.id});return;}
    if(templeRuneSolved[templeFloor]&&!templeSecrets[templeFloor]&&Math.hypot(wx-1780,wy-1080)<62){setWorldTarget("temple",1780,1080,{rune:"secret"});return;}
    const rune=near(TEMPLE_RUNE_POINTS,62);
    if(rune){setWorldTarget("temple",rune.x,rune.y,{rune:TEMPLE_RUNE_POINTS.indexOf(rune)});return;}
    setWorldTarget("temple",wx,wy);return;
  }
  const townPerson=townMode?near(townPeople,46):null;
  if(townPerson){setWorldTarget("townNpc",townPerson.x,townPerson.y,{id:townPerson.id});return;}
  if(!townMode&&!caveMode&&!homeInterior){
    const saman=near([forestNpc],52);
    if(saman){setWorldTarget("forestNpc",saman.x,saman.y);return;}
  }
  const enemiesHere=caveMode?caveEnemies:enemies;
  const enemy=near(enemiesHere,48,o=>o.alive);
  if(enemy){setWorldTarget("enemy",enemy.x,enemy.y,{id:enemy.id});return;}
  const drop=near(lootDrops,34);
  if(drop){setWorldTarget("loot",drop.x,drop.y,{id:drop.id});return;}
  if(caveMode){
    const chest=near(caveChests,40,o=>!o.opened);
    if(chest){setWorldTarget("chest",chest.x,chest.y,{id:chest.id});return;}
  }
  if(!caveMode&&!townMode&&!homeInterior){
    const node=near(activeNodes(),48);
    if(node){setWorldTarget("resource",node.x,node.y,{id:node.id});return;}
    const plot=near(farmPlots,38);
    if(plot){
      selectedFarmPlot=farmPlots.indexOf(plot);
      if(selectedTool==="watering")setWorldTarget("farmWater",plot.x,plot.y,{id:plot.id});
      else if(selectedTool==="seeds")setWorldTarget("farmPlant",plot.x,plot.y,{id:plot.id});
      else if(plot.state==="growing"&&plot.crop){
        const crop=FARM_CROPS[plot.crop],goal=plot.harvests>0&&crop.regrow?crop.regrow:crop.days;
        if(plot.growth>=goal)setWorldTarget("farmHarvest",plot.x,plot.y,{id:plot.id});
        else if(selectedTool==="shovel")setWorldTarget("farmTill",plot.x,plot.y,{id:plot.id});
        else setWorldTarget("ground",wx,wy);
      }else if(selectedTool==="shovel")setWorldTarget("farmTill",plot.x,plot.y,{id:plot.id});
      else setWorldTarget("ground",wx,wy);
      return;
    }
    if(selectedTool==="shovel"){setWorldTarget("farmTill",wx,wy);return;}
    if(selectedTool==="watering"||selectedTool==="seeds"){showToast("روی یکی از زمین‌های مزرعه بزن 🌱");return;}
  }
  setWorldTarget("ground",wx,wy);
}
canvas.addEventListener("pointerdown",canvasWorldTap);
function tickWorldInteraction(dt){
  if(!moveTarget)return;
  const t=moveTarget;
  if(t.type==="enemy"){
    const live=(templeMode?templeEnemies:caveMode?caveEnemies:enemies).find(e=>e.id===t.id&&e.alive);
    if(live){t.x=live.x;t.y=live.y;}
  }else if(t.type==="townNpc"){
    const person=townPeople.find(p=>p.id===t.id);
    if(person){t.x=person.x;t.y=person.y;}
  }else if(t.type==="forestNpc"){t.x=forestNpc.x;t.y=forestNpc.y;}
  const d=Math.hypot(player.x-t.x,player.y-t.y);
  const stops={resource:58,enemy:76,townNpc:38,forestNpc:42,loot:34,chest:42,farmWater:32,farmPlant:32,farmHarvest:32,farmTill:8,ground:9,temple:12,workshop:48};
  if(d>(stops[t.type]??10))return;
  playerMoving=false;
  if(t.type==="ground"){moveTarget=null;return;}
  if(t.type==="resource"){
    const node=activeNodes().find(r=>r.id===t.id);
    if(!node){moveTarget=null;return;}
    if(interactionTimer<=0){
      const amount=node.type==="tree"?3:(node.type==="stone"||node.type==="bush"||node.type==="sand")?2:1;
      if(!bagCanAdd(amount)){showToast("کوله‌پشتی پره؛ اول ظرفیتش رو بیشتر کن 🎒");moveTarget=null;return;}
      harvest(t.id);interactionTimer=.48;
    }
    if(!activeNodes().some(r=>r.id===t.id))moveTarget=null;
  }else if(t.type==="enemy"){
    const target=(templeMode?templeEnemies:caveMode?caveEnemies:enemies).find(e=>e.id===t.id&&e.alive);
    if(!target){moveTarget=null;return;}
    if(interactionTimer<=0){attack(t.id);interactionTimer=.12;}
  }else if(t.type==="loot"||t.type==="chest"){
    harvest(t.id);moveTarget=null;
  }else if(t.type==="forestNpc"){
    openNpcDialogue();moveTarget=null;
  }else if(t.type==="townNpc"){
    const idx=townPeople.findIndex(p=>p.id===t.id);
    if(idx>=0){townNpcIndex=idx;openTownNpc();}
    moveTarget=null;
  }else if(t.type==="farmWater"){farmWater();playGameSound("water");moveTarget=null;}
  else if(t.type==="farmPlant"){farmPlant();moveTarget=null;}
  else if(t.type==="farmHarvest"){farmHarvest();moveTarget=null;}
  else if(t.type==="farmTill"){farmTill(t.x,t.y);moveTarget=null;}
  else if(t.type==="workshop"){openStationPanel();moveTarget=null;}
  else if(t.type==="temple"){templeInteract(t.rune??null);moveTarget=null;}
}

$("farmBtn").addEventListener("click",openFarmPanel);$("farmClose").addEventListener("click",()=>{$("farmPanel").hidden=true;syncXpPanel();});$("farmPlotsGrid").addEventListener("click",e=>{const b=e.target.closest("[data-plot]");if(!b)return;selectedFarmPlot=Number(b.dataset.plot);updateFarmUI();});
$("farmTill").addEventListener("click",farmTill);$("farmPlant").addEventListener("click",farmPlant);$("farmWater").addEventListener("click",farmWater);$("farmHarvest").addEventListener("click",farmHarvest);
$("farmCrop").addEventListener("change",e=>{selectedCrop=e.target.value;updateFarmUI();});$("sellCrops").addEventListener("click",sellFarmCrops);
$("npcBtn").addEventListener("click", openNpcDialogue);
$("townBtn").addEventListener("click",()=>transitionTown(true));$("townExitBtn").addEventListener("click",()=>transitionTown(false));$("townNpcBtn").addEventListener("click",openTownNpc);$("townNpcTalk").addEventListener("click",nextTownDialogue);$("townNpcShop").addEventListener("click",openTownShop);$("carpenterClose").addEventListener("click",()=>{$("carpenterPanel").hidden=true;syncXpPanel();});$("carpenterBuild").addEventListener("click",carpenterBuild);$("carpenterUpgrade").addEventListener("click",carpenterUpgrade);$("furnitureBed").addEventListener("click",()=>buildFurniture("bed"));$("furnitureTable").addEventListener("click",()=>buildFurniture("table"));$("furnitureChair").addEventListener("click",()=>buildFurniture("chair"));$("backpackUpgrade").addEventListener("click",upgradeBackpack);$("townNpcClose").addEventListener("click",()=>{$("townNpcPanel").hidden=true;syncXpPanel();});$("townShopClose").addEventListener("click",()=>{$("townShopPanel").hidden=true;syncXpPanel();});$("buyBread").addEventListener("click",()=>buyTownItem("bread"));$("buySeeds").addEventListener("click",()=>buyCropSeed(selectedCrop));$("seedShopList").addEventListener("click",e=>{const b=e.target.closest("[data-seed]");if(!b)return;selectedCrop=b.dataset.seed;updateTownShop();});$("buyApple").addEventListener("click",()=>buyTownItem("apple"));
$("eatBread").addEventListener("click",()=>consumeTownFood("bread"));
$("eatApple").addEventListener("click",()=>consumeTownFood("apple"));
$("npcNext").addEventListener("click", advanceNpcDialogue);
 $("npcAskStart").addEventListener("click",()=>askSaman("start"));
 $("npcAskCave").addEventListener("click",()=>askSaman("cave"));
 $("npcAskGear").addEventListener("click",()=>askSaman("gear"));
 $("npcAskWorld").addEventListener("click",()=>askSaman("world"));
$("npcQuestAccept").addEventListener("click", acceptNpcQuest);
$("npcQuestClaim").addEventListener("click", claimNpcQuest);
$("homeBtn").addEventListener("click", handleHomeButton);
$("homeClose").addEventListener("click", () => { $("homePanel").hidden = true; syncXpPanel(); });
$("buildHome").addEventListener("click", buildPlayerHome);
$("enterHome").addEventListener("click", enterPlayerHome);
$("upgradeHome").addEventListener("click", upgradePlayerHome);
$("npcClose").addEventListener("click", () => { $("npcPanel").hidden = true; syncXpPanel(); });
$("saveBtn").addEventListener("click", save);
$("bagBtn").addEventListener("click", () => { $("inventory").hidden = false; updateUI(); syncXpPanel(); });
$("closeBag").addEventListener("click", () => { $("inventory").hidden = true; syncXpPanel(); });
$("caveBtn").addEventListener("click",toggleCave);
$("bridgeBtn").addEventListener("click",()=>{if(bridgeStage>=3)openTemplePanel();else openBridgePanel();});
$("templeEnterBtn").addEventListener("click",enterTemple);
$("templeClose").addEventListener("click",()=>{$("templePanel").hidden=true;syncXpPanel();});
$("bridgeBuildBtn").addEventListener("click",buildBridgeStage);
$("bridgeClose").addEventListener("click",()=>{$("bridgePanel").hidden=true;syncXpPanel();});
$("craftBtn").addEventListener("click", () => { $("craftPanel").hidden = false; updateCraftUI(); syncXpPanel(); });
$("closeCraft").addEventListener("click", () => { $("craftPanel").hidden = true; syncXpPanel(); });
$("craftSword").addEventListener("click", () => craft("sword"));
$("craftBoots").addEventListener("click", () => craft("boots"));
$("craftPotion").addEventListener("click", () => craft("potion"));
  $("craftIronArmor").addEventListener("click", () => craft("ironArmor"));
  $("craftCrystalArmor").addEventListener("click", () => craft("crystalArmor"));
$("buildWorkbench").addEventListener("click",()=>buildStation("workbench"));
$("buildFurnace").addEventListener("click",()=>buildStation("furnace"));
$("buildSawmill").addEventListener("click",()=>buildStation("sawmill"));
$("openStations").addEventListener("click",openStationPanel);
$("workshopBtn").addEventListener("click",openStationPanel);
$("closeStations").addEventListener("click",()=>{$("stationPanel").hidden=true;syncXpPanel();});
["planks","bricks","rope","nails","glass","cloth","marbleSlabs","ironParts","templeFoundation","templeColumn","templeBeam","templeMosaic","templeBanner"].forEach(type=>$("make_"+type).addEventListener("click",()=>craftWorkshopItem(type)));
["axe","pickaxe","shovel"].forEach(type=>$("upgradeTool_"+type).addEventListener("click",()=>upgradeTool(type)));
$("usePotion").addEventListener("click", usePotion);
$("questBtn").addEventListener("click", () => { $("questPanel").hidden = false; updateQuestUI(); syncXpPanel(); });
$("closeQuests").addEventListener("click", () => { $("questPanel").hidden = true; syncXpPanel(); });
$("claimWood").addEventListener("click", () => claimQuest("wood"));
$("claimSlime").addEventListener("click", () => claimQuest("slime"));
$("claimIron").addEventListener("click", () => claimQuest("iron"));
$("upgradeBtn").addEventListener("click", () => { $("upgradePanel").hidden = false; updateUpgradeUI(); syncXpPanel(); });
$("closeUpgrades").addEventListener("click", () => { $("upgradePanel").hidden = true; syncXpPanel(); });
$("upgradeHealth").addEventListener("click", () => buyUpgrade("health"));
$("upgradeSpeed").addEventListener("click", () => buyUpgrade("speed"));
$("upgradeAttack").addEventListener("click", () => buyUpgrade("attack"));
$("mapBtn").addEventListener("click", () => { $("mapPanel").hidden = false; drawWorldMap(); syncXpPanel(); });
$("closeMap").addEventListener("click", () => { $("mapPanel").hidden = true; syncXpPanel(); });


function getWorldMapState(){
  if(templeMode){
    const points=[
      {x:145,y:750,label:"ورودی",color:"#d8c18c",kind:"exit"},
      {x:1040,y:520,label:"مهر مرکزی",color:"#7bd6c9"},
      {x:2020,y:750,label:"دروازه",color:"#d8c18c"},
      {x:1780,y:1080,label:"گنج پنهان",color:"#e9c66f",kind:"treasure"},
      ...templeEnemies.filter(e=>e.alive).map(e=>({x:e.x,y:e.y,label:e.kind==="templeBoss"?"باس":"نگهبان",color:e.kind==="templeBoss"?"#f06c63":"#dc9b79",kind:e.kind==="templeBoss"?"boss":"enemy"}))
    ];
    return {key:"temple",title:"معبد باستانی • طبقه "+templeFloor,w:TEMPLE.w,h:TEMPLE.h,points,legend:"🟡 تو • 🔴 دشمن‌ها • 🟨 گنج • 🚪 ورودی و دروازه"};
  }
  if(homeInterior){
    return {key:"home",title:"داخل خانه",w:760,h:520,points:[],legend:"🟡 موقعیت تو داخل خانه"};
  }
  if(townMode){
    const points=townPeople.map(p=>({x:p.x,y:p.y,label:p.name,color:p.id==="naderi"?"#e6c477":p.id==="rezaei"?"#8ed08d":"#9dc7d7",kind:"npc"}));
    points.push({x:800,y:1110,label:"خروج جنگل",color:"#d8c18c",kind:"exit"});
    return {key:"town",title:"شهر سبز",w:TOWN.w,h:TOWN.h,points,legend:"🟡 تو • 🔵 اهالی شهر • 🟨 فروشگاه‌ها و خروجی"};
  }
  if(caveMode){
    const points=[
      {x:800,y:1080,label:"خروج",color:"#d8c18c",kind:"exit"},
      ...caveChests.map(ch=>({x:ch.x,y:ch.y,label:ch.opened?"صندوق باز":"صندوق",color:ch.opened?"#8f9b86":"#e6c477",kind:"treasure"})),
      ...caveResources.filter(r=>r.type==="crystal"&&r.hp>0).map(r=>({x:r.x,y:r.y,label:"کریستال",color:"#78d9df",kind:"crystal"})),
      ...caveEnemies.filter(e=>e.alive).map(e=>({x:e.x,y:e.y,label:"موجود",color:"#ee7770",kind:"enemy"}))
    ];
    return {key:"cave",title:"غار جنگلی",w:CAVE.w,h:CAVE.h,points,legend:"🟡 تو • 🔴 دشمن • 🟦 کریستال • 🟨 صندوق • 🚪 خروج"};
  }
  const points=[
    {x:700,y:520,label:"خانه",color:"#e5c77f",kind:"home"},
    {x:1900,y:450,label:"سامان",color:"#91c99b",kind:"npc"},
    {x:2310,y:900,label:"شهر سبز",color:"#8fc5d4",kind:"town"},
    {x:2080,y:1450,label:"غار",color:"#80cbd4",kind:"cave"},
    {x:bridgeStage>=3?3000:2525,y:1710,label:bridgeStage>=3?"دروازه معبد":"پل باستانی",color:"#e2bd78",kind:"temple"}
  ];
  return {key:"forest",title:"جنگل بزرگ",w:WORLD.w,h:WORLD.h,points,riverX:2700,legend:"🟡 تو • 🏡 خانه • 🧙 سامان • 🏘️ شهر • 🕳️ غار • 🌉 پل و معبد"};
}
function drawWorldMap(){
  const canvas=$("mapCanvas"),mapCtx=canvas.getContext("2d");
  if(!mapCtx)return;
  const w=canvas.width,h=canvas.height,state=getWorldMapState(),pad=24;
  const scale=Math.min((w-pad*2)/state.w,(h-pad*2)/state.h);
  const rw=state.w*scale,rh=state.h*scale,ox=(w-rw)/2,oy=(h-rh)/2;
  const colors={forest:"#355b3d",cave:"#343a40",town:"#b8a276",temple:"#383536",home:"#765238"};
  mapCtx.clearRect(0,0,w,h);
  mapCtx.fillStyle="#111916";mapCtx.fillRect(0,0,w,h);
  mapCtx.fillStyle=colors[state.key]||colors.forest;mapCtx.fillRect(ox,oy,rw,rh);
  mapCtx.save();
  mapCtx.beginPath();mapCtx.rect(ox,oy,rw,rh);mapCtx.clip();
  mapCtx.strokeStyle="rgba(235,226,194,.13)";mapCtx.lineWidth=1;
  for(let i=1;i<8;i++){const gx=ox+rw*i/8,gy=oy+rh*i/6;mapCtx.beginPath();mapCtx.moveTo(gx,oy);mapCtx.lineTo(gx,oy+rh);mapCtx.stroke();mapCtx.beginPath();mapCtx.moveTo(ox,gy);mapCtx.lineTo(ox+rw,gy);mapCtx.stroke();}
  if(state.key==="forest"){
    const rx=ox+state.riverX*scale;mapCtx.fillStyle="#245b68";mapCtx.fillRect(rx-3,oy,6,rh);
    const bridgeY=oy+1710*scale;mapCtx.fillStyle="#b99a66";mapCtx.fillRect(rx-8,bridgeY-3,16,6);
  }else if(state.key==="town"){
    mapCtx.strokeStyle="rgba(244,226,184,.55)";mapCtx.lineWidth=Math.max(3,rw*.018);
    mapCtx.beginPath();mapCtx.moveTo(ox+rw*.5,oy+rh);mapCtx.lineTo(ox+rw*.5,oy+rh*.55);mapCtx.lineTo(ox+rw*.82,oy+rh*.45);mapCtx.stroke();
  }else if(state.key==="temple"){
    mapCtx.strokeStyle="rgba(220,196,150,.35)";mapCtx.lineWidth=2;mapCtx.strokeRect(ox+rw*.08,oy+rh*.08,rw*.84,rh*.84);
    mapCtx.fillStyle="rgba(119,164,153,.16)";mapCtx.fillRect(ox+rw*.35,oy+rh*.22,rw*.3,rh*.56);
  }else if(state.key==="home"){
    mapCtx.strokeStyle="#d7b37a";mapCtx.lineWidth=5;mapCtx.strokeRect(ox+8,oy+8,rw-16,rh-16);
    mapCtx.fillStyle="#9a7048";mapCtx.fillRect(ox+rw*.28,oy+rh*.25,rw*.44,rh*.48);
  }
  const pos=p=>({x:ox+p.x*scale,y:oy+p.y*scale});
  for(const p of state.points){
    const q=pos(p),r=p.kind==="boss"?6:p.kind==="treasure"?5:4;
    mapCtx.fillStyle=p.color;mapCtx.beginPath();
    if(p.kind==="treasure"){mapCtx.rect(q.x-r,q.y-r,r*2,r*2);}else mapCtx.arc(q.x,q.y,r,0,Math.PI*2);
    mapCtx.fill();
    if(p.label){mapCtx.font="bold 11px Tahoma";mapCtx.textAlign="center";mapCtx.textBaseline="bottom";mapCtx.direction="rtl";mapCtx.fillStyle="#fff4d7";mapCtx.shadowColor="#111";mapCtx.shadowBlur=3;mapCtx.fillText(p.label,q.x,q.y-r-3);mapCtx.shadowBlur=0;}
  }
  const playerPos=pos(player);
  mapCtx.fillStyle="#ffe56b";mapCtx.beginPath();mapCtx.arc(playerPos.x,playerPos.y,6,0,Math.PI*2);mapCtx.fill();
  mapCtx.strokeStyle="#fff7c8";mapCtx.lineWidth=2;mapCtx.beginPath();mapCtx.arc(playerPos.x,playerPos.y,10,0,Math.PI*2);mapCtx.stroke();
  mapCtx.restore();
  mapCtx.strokeStyle="#b7a273";mapCtx.lineWidth=2;mapCtx.strokeRect(ox,oy,rw,rh);
  $("mapLocation").textContent=state.title+" • "+Math.round(player.x)+", "+Math.round(player.y);
  $("mapLegend").textContent=state.legend;
}

function syncXpPanel() {
  const panelIds = ["inventory", "upgradePanel", "craftPanel", "stationPanel", "questPanel", "npcPanel", "homePanel", "townNpcPanel", "townShopPanel", "farmPanel", "bridgePanel", "templePanel", "mapPanel"];
  const hud = $("hud");
  const xp = $("xpPanel");
  xp.hidden = panelIds.some(id => !$(id).hidden);
  // Place the XP bar below the complete, possibly wrapped mobile HUD.
  xp.style.top = Math.ceil(hud.getBoundingClientRect().bottom + 8) + "px";
}
addEventListener("resize", syncXpPanel);
const npcLines = [
  "خوش اومدی، مسافر. من سامانم؛ سال‌های زیادیه که از این جنگل مراقبت می‌کنم. هر وقت راه رو گم کردی یا پرسشی داشتی، پیش من بیا.",
  "اگر تازه شروع کردی، اول از درخت‌ها چوب و از سنگ‌ها مصالح جمع کن. با منابع می‌تونی تجهیزاتت رو بهتر کنی.",
  "غار در بخش شرقی جنگله. با آمادگی واردش شو؛ کریستال‌های کمیاب اونجا پیدا می‌شن.",
  "برای قوی‌تر شدن، شمشیر و زره‌ات رو ارتقا بده. زره آهنی و بعد زره کریستالی آسیب دشمن‌ها رو کمتر می‌کنن.",
  "اگر دنبال کار تازه‌ای هستی، مأموریت تخته‌اعلان رو بررسی کن و گاهی هم سری به اهالی شهر سبز بزن.",
  "یادت باشه مزرعه‌ات رو هر روز آب بدی. محصول رسیده رو می‌تونی پیش خانم رضایی ببری و بفروشی.",
  "هر سفر بزرگی با قدم‌های کوچیک شروع می‌شه. اول خوب آماده شو، بعد برو سراغ ماجراجویی بعدی."
];
function updateNpcQuestUI() {
  const status = $("npcQuestStatus");
  const accept = $("npcQuestAccept");
  const claim = $("npcQuestClaim");
  if (!npcQuest.accepted) {
    status.textContent = "سامان: سه کریستال از غار برام پیدا می‌کنی؟ پاداشش با من!";
    accept.hidden = false;
    claim.hidden = true;
  } else if (npcQuest.claimed) {
    status.textContent = "این مأموریت رو با موفقیت انجام دادی. ممنون قهرمان! ✓";
    accept.hidden = true;
    claim.hidden = true;
  } else {
    status.textContent = (npcQuest.progress >= 3 ? "هر سه کریستال پیدا شد! برگرد پیش سامان 🎉  " : "جمع‌آوری کریستال: ") + Math.min(3, npcQuest.progress) + " / 3";
    accept.hidden = true;
    claim.hidden = npcQuest.progress < 3;
  }
}
function acceptNpcQuest() {
  if (npcQuest.accepted || npcQuest.claimed) return;
  npcQuest.accepted = true;
  // Count crystals already collected so the quest never feels stuck after acceptance.
  npcQuest.progress = Math.max(npcQuest.progress || 0, Math.min(3, bag.crystal || 0));
  updateNpcQuestUI();
  saveQuietly();
  showToast(npcQuest.progress >= 3 ? "مأموریت آماده تحویل است! برگرد پیش سامان 🎉" : "مأموریت سامان شروع شد: ۳ کریستال پیدا کن 💎");
}
function progressNpcCrystal(amount) {
  if (!npcQuest.accepted || npcQuest.claimed) return;
  const before = npcQuest.progress;
  npcQuest.progress = Math.min(3, npcQuest.progress + amount);
  if (npcQuest.progress !== before) {
    updateNpcQuestUI();
    if (npcQuest.progress >= 3) showToast("مأموریت سامان کامل شد! برگرد پیشش 🎉");
  }
}
function claimNpcQuest() {
  if (!npcQuest.accepted || npcQuest.claimed || npcQuest.progress < 3) return;
  npcQuest.claimed = true;
  player.coins += 40;
  const leveled = addXP(50);
  updateUI();
  updateNpcQuestUI();
  saveQuietly();
  showToast(leveled ? "پاداش سامان رو گرفتی! +۴۰ سکه و ارتقای سطح ⭐" : "پاداش سامان: +۴۰ سکه و +۵۰ تجربه 🎁");
}
function openNpcDialogue() {
  if (!npcMet) {
    npcMet = true;
    player.coins += 10;
    const leveled = addXP(15);
    showToast(leveled ? "با سامان آشنا شدی؛ جایزه خوش‌آمدگویی و ارتقای سطح! ⭐" : "با سامان آشنا شدی؛ ۱۰ سکه جایزه گرفتی! 🎁");
  }
  $("npcPanel").hidden = false;
  updateNpcQuestUI();
  advanceNpcDialogue();
  updateUI();
  saveQuietly();
  syncXpPanel();
}
function askSaman(topic) {
  const answers = {
    start: "سامان: اول از اطراف جنگل چوب و سنگ جمع کن، ابزار بساز و مأموریت‌های تخته‌اعلان رو انجام بده. عجله نکن؛ قدم‌به‌قدم قوی‌تر می‌شی.",
    cave: "سامان: ورودی غار در شرق جنگله. داخل غار مراقب اسلایم‌ها و نگهبان کریستالی باش. کریستال‌ها رو جمع کن؛ برای ساخت زره و تجهیزات ارزش دارن.",
    gear: "سامان: منابع لازم رو جمع کن و از میز ساخت استفاده کن. اول زره آهنی بساز و بعد برای زره کریستالی آماده شو؛ زره بهتر آسیب کمتری بهت می‌رسونه.",
    world: "سامان: بذر از خانم رضایی بخر و هر روز مزرعه رو آب بده. محصول رسیده رو بفروش. توی شهر هم با مینا، حنا، ناهید، سعید و خانم رضایی حرف بزن؛ شاید کمکت کنن."
  };
  $("npcDialogue").textContent = answers[topic] || "سامان: هر وقت پرسشی داشتی، یکی از موضوع‌ها رو انتخاب کن.";
  saveQuietly();
}
function advanceNpcDialogue() {
  $("npcDialogue").textContent = npcLines[npcTalkIndex % npcLines.length];
  npcTalkIndex++;
  saveQuietly();
}
function updateQuestUI() {
  const rows = [
    { key: "wood", text: "questWoodText", button: "claimWood", goal: 10, unit: "چوب" },
    { key: "slime", text: "questSlimeText", button: "claimSlime", goal: 3, unit: "موجود" },
    { key: "iron", text: "questIronText", button: "claimIron", goal: 5, unit: "آهن" }
  ];
  for (const q of rows) {
    $(q.text).textContent = Math.min(q.goal, quests[q.key]) + " / " + q.goal + " " + q.unit;
    $(q.button).disabled = quests.claimed[q.key] || quests[q.key] < q.goal;
    $(q.button).textContent = quests.claimed[q.key] ? "انجام شد ✓" : "دریافت جایزه (+۲۰ سکه، +۳۰ XP)";
  }
}
function claimQuest(key) {
  const goals = { wood: 10, slime: 3, iron: 5 };
  if (!goals[key] || quests.claimed[key] || quests[key] < goals[key]) { showToast("این مأموریت هنوز کامل نشده"); return; }
  quests.claimed[key] = true;
  player.coins += 20;
  const leveled = addXP(30);
  updateUI(); saveQuietly();
  showToast(leveled ? "مأموریت کامل شد! سطح جدید ⭐ +۲۰ سکه" : "مأموریت کامل شد! +۲۰ سکه و ۳۰ تجربه 🎉");
}
function updateCraftUI() {
  const wb=$("buildWorkbench"),fu=$("buildFurnace"),sm=$("buildSawmill");
  wb.disabled=stations.workbench||bag.wood<8||bag.stone<4;wb.textContent=stations.workbench?"🪚 میزکار ساخته شده":"🪚 میزکار — ۸ چوب + ۴ سنگ";
  fu.disabled=stations.furnace||bag.stone<8||bag.iron<3;fu.textContent=stations.furnace?"🔥 کوره ساخته شده":"🔥 کوره — ۸ سنگ + ۳ آهن";
  sm.disabled=stations.sawmill||bag.wood<10||bag.iron<4;sm.textContent=stations.sawmill?"🪵 اره‌کاری ساخته شده":"🪵 اره‌کاری — ۱۰ چوب + ۴ آهن";
  $("craftSword").disabled = player.attackPower >= 5 || bag.iron < 5 || bag.wood < 3;
  $("craftBoots").disabled = player.speed >= 320 || bag.iron < 4 || bag.wood < 6;
  $("craftPotion").disabled = bag.crystal < 2 || bag.iron < 1;
  $("craftIronArmor").disabled = (player.armorLevel||0) >= 1 || bag.iron < 8 || bag.wood < 10;
  $("craftCrystalArmor").disabled = (player.armorLevel||0) >= 2 || (player.armorLevel||0) < 1 || bag.crystal < 5 || bag.iron < 10;
  $("craftSword").textContent = player.attackPower >= 5 ? "⚔️ شمشیر فولادی (حداکثر)" : "⚔️ شمشیر فولادی — ۵ آهن + ۳ چوب";
  $("craftBoots").textContent = player.speed >= 320 ? "👟 چکمه تندرو (حداکثر)" : "👟 چکمه تندرو — ۴ آهن + ۶ چوب";
  $("craftPotion").textContent = "🧪 معجون سلامتی — ۲ کریستال + ۱ آهن";
  $("craftIronArmor").textContent = (player.armorLevel||0) >= 1 ? "🛡️ زره آهنی (ساخته شده)" : "🛡️ زره آهنی — ۸ آهن + ۱۰ چوب";
  $("craftCrystalArmor").textContent = (player.armorLevel||0) >= 2 ? "💎 زره کریستالی (حداکثر)" : "💎 زره کریستالی — ۵ کریستال + ۱۰ آهن";
  $("usePotion").disabled = (bag.potion || 0) < 1 || player.health >= player.maxHealth;
  $("usePotion").textContent = "نوشیدن معجون (" + (bag.potion || 0) + ")";
  updateStationUI();
}
function craft(type) {
  if (type === "sword" && player.attackPower < 5 && bag.iron >= 5 && bag.wood >= 3) {
    bag.iron -= 5; bag.wood -= 3; player.attackPower++;
  } else if (type === "boots" && player.speed < 320 && bag.iron >= 4 && bag.wood >= 6) {
    bag.iron -= 4; bag.wood -= 6; player.speed = Math.min(320, player.speed + 20);
  } else if (type === "potion" && bag.crystal >= 2 && bag.iron >= 1) {
    bag.crystal -= 2; bag.iron -= 1; bag.potion = (bag.potion || 0) + 1;
  } else if (type === "ironArmor" && (player.armorLevel||0) < 1 && bag.iron >= 8 && bag.wood >= 10) {
    bag.iron -= 8; bag.wood -= 10; player.armorLevel = 1;
  } else if (type === "crystalArmor" && (player.armorLevel||0) === 1 && bag.crystal >= 5 && bag.iron >= 10) {
    bag.crystal -= 5; bag.iron -= 10; player.armorLevel = 2;
  } else { showToast("مواد کافی نداری یا این وسیله به حداکثر رسیده"); return; }
  updateUI(); updateCraftUI(); saveQuietly(); showToast("ساخت وسیله با موفقیت انجام شد! 🛠️");
}
const workshopRecipes = {
  planks:{station:"sawmill",cost:{wood:2},gain:{plank:3},label:"۳ تخته چوب"},
  bricks:{station:"furnace",cost:{stone:2},gain:{brick:2},label:"۲ آجر سنگی"},
  rope:{station:"workbench",cost:{fiber:2},gain:{rope:1},label:"۱ طناب"},
  nails:{station:"workbench",cost:{iron:1},gain:{nail:4},label:"۴ میخ"},
  glass:{station:"furnace",cost:{sand:2},gain:{glass:2},label:"۲ شیشه"},
  cloth:{station:"workbench",cost:{fiber:3},gain:{cloth:1},label:"۱ پارچه"},
  marbleSlabs:{station:"sawmill",cost:{marble:2},gain:{marbleSlab:1},label:"۱ تخته مرمر"},
  ironParts:{station:"workbench",cost:{iron:2,nail:2},gain:{ironParts:1},label:"۱ قطعه آهنی"},
  templeFoundation:{station:"furnace",cost:{brick:4,marbleSlab:1},gain:{templeFoundation:1},label:"۱ پایه معبد"},
  templeColumn:{station:"workbench",cost:{marbleSlab:2,ironParts:2},gain:{templeColumn:1},label:"۱ ستون معبد"},
  templeBeam:{station:"sawmill",cost:{plank:3,nail:2},gain:{templeBeam:1},label:"۱ تیر سقف"},
  templeMosaic:{station:"furnace",cost:{glass:1,marbleSlab:1},gain:{templeMosaic:1},label:"۱ کاشی موزاییک"},
  templeBanner:{station:"workbench",cost:{cloth:2,rope:1},gain:{templeBanner:1},label:"۱ پرچم تزئینی"}
};
function buildStation(type){
 const recipes={workbench:{wood:8,stone:4},furnace:{stone:8,iron:3},sawmill:{wood:10,iron:4}};
 const cost=recipes[type];if(!cost||stations[type])return;
 if(Object.entries(cost).some(([k,v])=>(bag[k]||0)<v)){showToast("مواد کافی برای ساخت این ایستگاه نداری");return;}
 Object.entries(cost).forEach(([k,v])=>bag[k]-=v);stations[type]=true;
 updateUI();saveQuietly();showToast(({workbench:"میزکار",furnace:"کوره",sawmill:"اره‌کاری"})[type]+" کنار خانه ساخته شد! 🛠️");
}
function updateStationUI(){
 const labels={planks:"تخته چوب",bricks:"آجر سنگی",rope:"طناب",nails:"میخ",glass:"شیشه",cloth:"پارچه",marbleSlabs:"تخته مرمر",ironParts:"قطعه آهنی",templeFoundation:"پایه معبد",templeColumn:"ستون معبد",templeBeam:"تیر سقف معبد",templeMosaic:"کاشی موزاییک",templeBanner:"پرچم تزئینی"};
 for(const [type,r] of Object.entries(workshopRecipes)){
  const b=$("make_"+type);if(!b)continue;
  const ready=!!stations[r.station]&&Object.entries(r.cost).every(([k,v])=>(bag[k]||0)>=v);
  b.disabled=!ready;b.textContent=(stations[r.station]?"":"🔒 ")+labels[type]+" — "+r.label;
 }
}
function toolLevelName(type){return ["چوبی","آهنی","کریستالی"][Math.max(0,Math.min(2,toolLevels[type]||0))];}
function toolUpgradeCost(type){
 const level=toolLevels[type]||0;
 if(level===0){return type==="axe"?{iron:4,plank:3,nail:2}:type==="pickaxe"?{iron:5,plank:2,ironParts:1}:{iron:3,plank:2,ironParts:1};}
 if(level===1)return type==="axe"?{crystal:3,ironParts:2,marbleSlab:1}:type==="pickaxe"?{crystal:4,ironParts:2,marbleSlab:1}:{crystal:2,ironParts:1,marbleSlab:1};
 return null;
}
function toolCostLabel(cost){return Object.entries(cost).map(([k,v])=>v+" "+({iron:"آهن",plank:"تخته",nail:"میخ",ironParts:"قطعه آهنی",crystal:"کریستال",marbleSlab:"تخته مرمر"}[k]||k)).join(" + ");}
function updateToolUI(){
 const names={axe:"تبر",pickaxe:"کلنگ",shovel:"بیل"};
 for(const type of Object.keys(names)){
  const b=$("upgradeTool_"+type);if(!b)continue;
  const level=toolLevels[type]||0,cost=toolUpgradeCost(type);
  b.disabled=!stations.workbench||!cost||Object.entries(cost).some(([k,v])=>(bag[k]||0)<v);
  b.textContent=level>=2?"✨ "+names[type]+" کریستالی (حداکثر)":(level===0?"⚒️ ارتقای "+names[type]+" چوبی به آهنی":"💎 ارتقای "+names[type]+" آهنی به کریستالی")+" — "+toolCostLabel(cost||{});
 }
}
function upgradeTool(type){
 if(!Object.prototype.hasOwnProperty.call(toolLevels,type))return;
 if(!stations.workbench){showToast("برای ارتقای ابزار به میزکار نیاز داری");return;}
 const cost=toolUpgradeCost(type);if(!cost){showToast("این ابزار به بالاترین سطح رسیده");return;}
 if(Object.entries(cost).some(([k,v])=>(bag[k]||0)<v)){showToast("برای ارتقای این ابزار مواد کافی نداری");return;}
 Object.entries(cost).forEach(([k,v])=>bag[k]-=v);toolLevels[type]++;
 updateUI();saveQuietly();showToast(({axe:"تبر",pickaxe:"کلنگ",shovel:"بیل"})[type]+" به سطح "+toolLevelName(type)+" ارتقا پیدا کرد! 🛠️");
}
function openStationPanel(){
 if(caveMode||townMode||homeInterior||Math.hypot(player.x-playerHome.x,player.y-playerHome.y)>235){showToast("برای کار با ایستگاه‌ها کنار خانه‌ات بیا");return;}
 if(!Object.values(stations).some(Boolean)){showToast("اول از بخش ساخت، یک ایستگاه بساز");return;}
 $("stationPanel").hidden=false;updateStationUI();syncXpPanel();
}
function craftWorkshopItem(type){
 const r=workshopRecipes[type];if(!r||!stations[r.station]){showToast("برای این دستور به ایستگاه مناسب نیاز داری");return;}
 if(Object.entries(r.cost).some(([k,v])=>(bag[k]||0)<v)){showToast("مواد اولیه کافی نداری");return;}
 Object.entries(r.cost).forEach(([k,v])=>bag[k]-=v);
 Object.entries(r.gain).forEach(([k,v])=>bag[k]=(bag[k]||0)+v);
 updateUI();saveQuietly();showToast("ساخته شد: "+r.label+" ✨");
}
function usePotion() {
  if (!(bag.potion > 0) || player.health >= player.maxHealth) { showToast("معجون نداری یا جانت پر است"); return; }
  bag.potion--; player.health = Math.min(player.maxHealth, player.health + 3);
  updateUI(); updateCraftUI(); saveQuietly(); showToast("معجون استفاده شد؛ جانت بازیابی شد 🧪");
}
function updateUpgradeUI() {
  const points = player.skillPoints || 0;
  $("skillPoints").textContent = points;
  $("upgradeHealth").disabled = points < 1 || player.maxHealth >= 10;
  $("upgradeSpeed").disabled = points < 1 || player.speed >= 280;
  $("upgradeAttack").disabled = points < 1 || player.attackPower >= 3;
  $("upgradeHealth").textContent = player.maxHealth >= 10 ? "❤️ جان (حداکثر)" : "❤️ افزایش جان " + player.maxHealth + " ← " + (player.maxHealth + 1);
  $("upgradeSpeed").textContent = player.speed >= 280 ? "👟 سرعت (حداکثر)" : "👟 افزایش سرعت " + player.speed + " ← " + Math.min(280, player.speed + 15);
  $("upgradeAttack").textContent = player.attackPower >= 3 ? "⚔️ قدرت حمله (حداکثر)" : "⚔️ افزایش قدرت حمله " + player.attackPower + " ← " + (player.attackPower + 1);
}
function buyUpgrade(type) {
  if (player.skillPoints < 1) { showToast("برای ارتقا امتیاز مهارت نداری"); return; }
  if (type === "health" && player.maxHealth < 10) { player.maxHealth++; player.health = Math.min(player.maxHealth, player.health + 1); }
  else if (type === "speed" && player.speed < 280) player.speed = Math.min(280, player.speed + 15);
  else if (type === "attack" && player.attackPower < 3) player.attackPower++;
  else { showToast("این قابلیت به حداکثر رسیده"); return; }
  player.skillPoints--;
  updateUI(); saveQuietly();
  showToast("ارتقا با موفقیت انجام شد! 💪");
}

function update(dt) {
  worldClock += dt * 8;
  if(worldClock >= 1440){worldClock -= 1440;worldDay++;onNewFarmDay();saveQuietly();}
  if(townMode)townSchedule(dt);
  attackCooldown=Math.max(0,attackCooldown-dt); attackFlash=Math.max(0,attackFlash-dt); damageCooldown=Math.max(0,damageCooldown-dt); templeTrapCooldown=Math.max(0,templeTrapCooldown-dt);
  const activeEnemies = templeMode ? templeEnemies : (caveMode || homeInterior || townMode) ? (caveMode ? caveEnemies : []) : enemies;
  for(const enemy of activeEnemies){
    if(!enemy.alive){
      enemy.respawnTimer = Math.max(0, enemy.respawnTimer - dt);
      if(enemy.respawnTimer <= 0 && enemy.kind!=="templeBoss"){ enemy.alive = true; enemy.hp = enemy.max; enemy.x = enemy.spawnX; enemy.y = enemy.spawnY; }
      continue;
    }
    const ex=player.x-enemy.x,ey=player.y-enemy.y,distance=Math.hypot(ex,ey)||1;
    const chaseSpeed = templeMode ? 56+templeFloor*6+(enemy.kind==="templeBoss"?12:0) : caveMode ? 48 : 72;
    if(distance<300&&distance>30){enemy.x+=ex/distance*chaseSpeed*dt;enemy.y+=ey/distance*chaseSpeed*dt;}
    else if(distance<=30&&damageCooldown<=0){
      const armorLevel=Math.max(0,Math.min(2,player.armorLevel||0));
      const baseDamage=templeMode?(enemy.kind==="templeBoss"?1.15+templeFloor*.24:.8+templeFloor*.13):1;
      const incomingDamage=baseDamage*(armorLevel===0?1:armorLevel===1?0.7:0.4);
      player.health=Math.max(0,Math.round((player.health-incomingDamage)*10)/10);
      damageCooldown=1;updateUI();saveQuietly();
      if(player.health<=0){if(templeMode)templeDefeatPlayer();else{player.health=player.maxHealth;player.x=caveMode?800:1200;player.y=caveMode?1015:900;showToast("انرژیت تمام شد؛ جانت بازیابی شد");updateUI();}}
      else showToast(caveMode?"نگهبان کریستالی بهت ضربه زد! 💎":"موجود بهت ضربه زد! ❤️");
    }
  }
  if(templeMode&&templeTrapCooldown<=0){
    const trap=TEMPLE_TRAPS.find(t=>templeTrapActive(t)&&Math.hypot(player.x-t.x,player.y-t.y)<t.r*.62);
    if(trap){const armorLevel=Math.max(0,Math.min(2,player.armorLevel||0)),damage=(.85+templeFloor*.12)*(armorLevel===0?1:armorLevel===1?.7:.4);player.health=Math.max(0,Math.round((player.health-damage)*10)/10);templeTrapCooldown=1.35;updateUI();saveQuietly();if(player.health<=0)templeDefeatPlayer();else showToast("تله‌ی باستانی فعال شد! از نشان‌های سرخ دور شو ⚠️");}
  }
  if (!templeMode && !caveMode && !homeInterior && !townMode) {
    const night = worldClock >= 20 * 60 || worldClock < 6 * 60;
    const targetX = night ? samanHome.x : 1690;
    const targetY = night ? samanHome.y + 72 : 650;
    const sx = targetX - forestNpc.x, sy = targetY - forestNpc.y, sd = Math.hypot(sx, sy);
    forestNpc.walking=sd>8;
    if(forestNpc.walking){forestNpc.facing=Math.abs(sx)>Math.abs(sy)?(sx>0?"right":"left"):(sy>0?"down":"up");forestNpc.x += sx / sd * Math.min(sd, 42 * dt); forestNpc.y += sy / sd * Math.min(sd, 42 * dt);}
  }
  let dx = move.x, dy = move.y;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if(moveTarget){
    const tx=moveTarget.x-player.x,ty=moveTarget.y-player.y,dist=Math.hypot(tx,ty);
    const stop={resource:58,enemy:76,townNpc:38,forestNpc:42,loot:34,chest:42,farmWater:32,farmPlant:32,farmHarvest:32,farmTill:8,ground:9,temple:12,workshop:48}[moveTarget.type]??10;
    if(dist>stop){dx=tx/dist;dy=ty/dist;}else{dx=0;dy=0;}
  }
  const oldX=player.x,oldY=player.y;
  const len = Math.hypot(dx, dy);
  playerMoving = len > 0.08;
  if (playerMoving) {
    if (Math.abs(dx) > Math.abs(dy)) playerFacing = dx > 0 ? "right" : "left";
    else playerFacing = dy > 0 ? "down" : "up";
    player.x += dx / len * player.speed * dt;
    player.y += dy / len * player.speed * dt;
    // A deep river divides the forest. Only the completed ancient bridge permits crossing.
    const crossedRiver=(oldX<2700&&player.x>=2700)||(oldX>2700&&player.x<=2700);
    if(!townMode&&!caveMode&&!homeInterior&&crossedRiver&&!(bridgeStage>=3&&player.y>=1620&&player.y<=1800)) player.x=oldX<2700?2648:2752;
  }
  if(interactionTimer>0)interactionTimer=Math.max(0,interactionTimer-dt);
  if(playerActionTimer>0)playerActionTimer=Math.max(0,playerActionTimer-dt);
  tickWorldInteraction(dt);
  audioEnvironment(dt);
  animTime += dt;
  const mw = templeMode ? TEMPLE.w : caveMode ? CAVE.w : homeInterior ? 900 : townMode ? TOWN.w : WORLD.w;
  const mh = templeMode ? TEMPLE.h : caveMode ? CAVE.h : homeInterior ? 650 : townMode ? TOWN.h : WORLD.h;
  player.x=Math.max((caveMode || homeInterior || townMode)?55:24,Math.min(mw-((caveMode || homeInterior || townMode)?55:24),player.x));
  player.y=Math.max((caveMode || homeInterior || townMode)?55:24,Math.min(mh-((caveMode || homeInterior || townMode)?55:24),player.y));
  camera.x=Math.max(0,Math.min(mw-viewW,player.x-viewW/2));
  camera.y=Math.max(0,Math.min(mh-viewH,player.y-viewH/2));
  $("caveBtn").hidden=true;$("homeBtn").hidden=true;$("townBtn").hidden=true;$("townExitBtn").hidden=true;$("workshopBtn").hidden=true;
  const bridgeDistance=Math.hypot(player.x-2525,player.y-1710),gateDistance=Math.hypot(player.x-3000,player.y-1710);
  $("bridgeBtn").hidden=templeMode||townMode||caveMode||homeInterior||(bridgeStage>=3?gateDistance>125:bridgeDistance>145);
  $("bridgeBtn").textContent=bridgeStage>=3?"🏛️ دروازه معبد":"🌉 پل باستانی";
  $("townClock").hidden=templeMode||homeInterior||caveMode;
  {const hh=Math.floor(worldClock/60),mm=Math.floor(worldClock%60),night=hh>=20||hh<6;$("townClock").textContent=(night?"🌙 ":"☀️ ")+String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+" • روز "+worldDay;}
  $("farmBtn").hidden=true;
  const nearTownPerson=townMode?townPeople.find(p=>Math.hypot(player.x-p.x,player.y-p.y)<115):null;
  $("townNpcBtn").hidden=true;
  $("townNpcBtn").textContent=nearTownPerson?"💬 صحبت با "+nearTownPerson.name:"💬 صحبت با اهالی";
  $("caveBtn").textContent=caveMode?"🚪 خروج از غار":"🕳️ ورود به غار";
  $("npcBtn").hidden = true;
  $("homeBtn").hidden = templeMode || townMode || caveMode || (!homeInterior && Math.hypot(player.x-playerHome.x,player.y-(playerHome.y+45)) > 145);
  $("homeBtn").textContent = homeInterior ? "🚪 خروج از خانه" : "🏡 خانه";
  const nearWorkshop=!templeMode&&!townMode&&!caveMode&&!homeInterior&&Math.hypot(player.x-playerHome.x,player.y-playerHome.y)<235&&Object.values(stations).some(Boolean);
  $("workshopBtn").hidden=!nearWorkshop;
}

function transitionTown(enter){
 $("townFade").classList.add("active");
 setTimeout(()=>{if(enter){townReturn={x:player.x,y:player.y};townMode=true;caveMode=false;homeInterior=false;player.x=800;player.y=875;showToast("به شهر سبز خوش اومدی! 🏘️");}else{townMode=false;player.x=townReturn.x;player.y=townReturn.y;showToast("به جنگل برگشتی 🌲");}$("townFade").classList.remove("active");saveQuietly();},240);
}
function townSchedule(dt=0){
 const hour=worldClock/60,night=hour>=21||hour<7;
 const plans={
  mina: night?[470,500]:hour<12?[470,560]:hour<17?[690,540]:[950,670],
  hana: night?[570,520]:hour<11?[620,480]:hour<16?[920,590]:[720,740],
  nahid: night?[420,650]:hour<9?[420,650]:hour<18?[535,420]:[420,650],
  saeed: night?[180,590]:hour<12?[240,570]:hour<17?[800,1060]:[240,570],
  rezaei: night?[1120,610]:hour<20?[1120,530]:[1120,610]
 };
 townPeople.forEach(p=>{const target=plans[p.id];if(!target)return;const dx=target[0]-p.x,dy=target[1]-p.y,d=Math.hypot(dx,dy);if(d>2&&dt>0){const step=Math.min(d,48*dt);p.x+=dx/d*step;p.y+=dy/d*step;p.walking=true;}else p.walking=false;});
 // Keep residents from walking through one another; a small personal-space force separates nearby NPCs.
 for(let a=0;a<townPeople.length;a++)for(let b=a+1;b<townPeople.length;b++){
  const p=townPeople[a],q=townPeople[b],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);
  if(d>0&&d<44){const push=(44-d)*0.5;p.x-=dx/d*push;p.y-=dy/d*push;q.x+=dx/d*push;q.y+=dy/d*push;}
 }
}
function bagUsed(){return Object.values(bag).reduce((sum,v)=>sum+(Number(v)||0),0)+Object.values(farmSeedStock).reduce((sum,v)=>sum+(Number(v)||0),0);}
function bagCanAdd(amount=1){return bagUsed()+amount<=backpackCaps[backpackTier];}
function bagAdd(key,amount){if(!bagCanAdd(amount)){showToast("کوله‌پشتی پره! پیش آقای نادری ظرفیتش رو ارتقا بده 🎒");return false;}bag[key]=(bag[key]||0)+amount;return true;}

const INVENTORY_LABELS={wood:"چوب",stone:"سنگ",iron:"آهن",crystal:"کریستال",potion:"معجون",fiber:"الیاف",sand:"شن",marble:"مرمر",plank:"تخته چوب",brick:"آجر",rope:"طناب",nail:"میخ",glass:"شیشه",cloth:"پارچه",marbleSlab:"تخته مرمر",ironParts:"قطعه آهنی",templeFoundation:"پایه معبد",templeColumn:"ستون معبد",templeBeam:"تیر معبد",templeMosaic:"موزاییک",templeBanner:"پرچم معبد"};
const INVENTORY_ICONS={wood:"🪵",stone:"🪨",iron:"⛓️",crystal:"💎",potion:"🧪",fiber:"🧵",sand:"🏖️",marble:"⬜",plank:"🪚",brick:"🧱",rope:"🪢",nail:"🔩",glass:"🪟",cloth:"🧶",marbleSlab:"◻️",ironParts:"⚙️",templeFoundation:"🏛️",templeColumn:"🏛️",templeBeam:"🪵",templeMosaic:"🎨",templeBanner:"🚩"};
function inventoryItems(){
 const items=[];
 for(const [key,value] of Object.entries(bag)){
  if(key==="seeds"||!(Number(value)>0))continue;
  const crop=FARM_CROPS[key];
  items.push({id:"bag:"+key,name:crop?crop.name:(INVENTORY_LABELS[key]||key),icon:crop?crop.icon:(INVENTORY_ICONS[key]||"📦"),count:value,kind:crop?"محصول":"منبع",detail:"در کوله‌پشتی"});
 }
 for(const [key,value] of Object.entries(farmSeedStock)){
  if(Number(value)>0){const crop=FARM_CROPS[key];items.push({id:"seed:"+key,name:"بذر "+crop.name,icon:crop.icon,count:value,kind:"بذر",detail:FARM_SEASONS[crop.season]});}
 }
 const tiers=["چوبی","آهنی","کریستالی"];
 items.push(
  {id:"gear:axe",name:"تبر",icon:"🪓",count:tiers[toolLevels.axe]||"چوبی",kind:"ابزار",detail:"برای درخت و الیاف",equip:"axe"},
  {id:"gear:pickaxe",name:"کلنگ",icon:"⛏️",count:tiers[toolLevels.pickaxe]||"چوبی",kind:"ابزار",detail:"برای سنگ و معدن",equip:"pickaxe"},
  {id:"gear:shovel",name:"بیل",icon:"🪏",count:tiers[toolLevels.shovel]||"چوبی",kind:"ابزار",detail:"برای شخم و شن",equip:"shovel"},
  {id:"gear:watering",name:"آب‌پاش",icon:"💧",count:"ابزار",kind:"ابزار",detail:"برای آبیاری",equip:"watering"},
  {id:"gear:sword",name:"شمشیر",icon:"⚔️",count:"قدرت "+player.attackPower,kind:"سلاح",detail:"برای نبرد",equip:"sword"},
  {id:"gear:armor",name:"زره",icon:"🛡️",count:["بدون زره","آهنی","کریستالی"][Math.max(0,Math.min(2,player.armorLevel||0))],kind:"تجهیزات",detail:"کاهش آسیب دریافتی"},
  {id:"gear:boots",name:"چکمه",icon:"🥾",count:"سرعت "+player.speed,kind:"تجهیزات",detail:"افزایش سرعت حرکت"}
 );
 return items;
}
function renderInventory(){
 const grid=$("inventoryGrid");if(!grid)return;
 const items=inventoryItems(),ids=items.map(v=>v.id);
 inventoryOrder=[...inventoryOrder.filter(id=>ids.includes(id)),...ids.filter(id=>!inventoryOrder.includes(id))];
 const byId=new Map(items.map(v=>[v.id,v]));
 const ordered=inventoryOrder.map(id=>byId.get(id)).filter(Boolean);
 grid.innerHTML=ordered.map(item=>{
  let action="";
  if(item.equip)action='<button type="button" class="inventory-equip" data-equip="'+item.equip+'">انتخاب</button>';
  else if(item.id.startsWith("bag:")||item.id.startsWith("seed:"))action='<button type="button" class="inventory-discard" data-discard="'+item.id+'" aria-label="حذف '+item.name+'">🗑 حذف</button>';
  return '<div class="inventory-item '+(inventorySelected===item.id?"selected":"") + '" data-item="'+item.id+'" draggable="true" role="button" tabindex="0"><span class="inventory-item-icon">'+item.icon+'</span><span class="inventory-item-name">'+item.name+'</span><small>'+item.kind+'</small><b class="inventory-item-count">'+item.count+'</b><span class="inventory-item-detail">'+item.detail+'</span>'+action+'</div>';
 }).join("");
 $("inventorySummary").textContent="ظرفیت کوله: "+bagUsed()+" / "+backpackCaps[backpackTier]+" • "+items.length+" نوع وسیله";
}
function renderHotbar(){
 const bar=$("toolHotbar");if(!bar)return;
 const items=inventoryItems(),byId=new Map(items.map(v=>[v.id,v]));
 inventoryOrder=[...inventoryOrder.filter(id=>byId.has(id)),...items.map(v=>v.id).filter(id=>!inventoryOrder.includes(id))];
 const scroll=bar.scrollLeft;
 bar.innerHTML=inventoryOrder.map(id=>byId.get(id)).filter(Boolean).map(item=>{
  const tool=item.equip||"",selected=tool?tool===selectedTool:inventorySelected===item.id;
  return '<button type="button" class="hotbar-item '+(selected?"selected":"")+'" '+(tool?'data-tool="'+tool+'"':'data-hot-item="'+item.id+'"')+' title="'+item.name+'"><span>'+item.icon+'</span><small>'+item.name+'</small><b class="hotbar-count">'+item.count+'</b></button>';
 }).join("");
 bar.scrollLeft=scroll;
}
function discardInventoryItem(id){
 if(!id||(!id.startsWith("bag:")&&!id.startsWith("seed:")))return;
 const item=inventoryItems().find(v=>v.id===id);if(!item)return;
 if(!window.confirm("همه‌ی "+item.name+"ها ("+item.count+") از کوله حذف بشن؟"))return;
 if(id.startsWith("bag:"))bag[id.slice(4)]=0;else farmSeedStock[id.slice(5)]=0;
 inventorySelected=null;updateUI();saveQuietly();showToast(item.name+" از کوله حذف شد");
}
function swapInventoryItems(a,b){
 if(!a||!b||a===b)return;
 const ia=inventoryOrder.indexOf(a),ib=inventoryOrder.indexOf(b);
 if(ia<0||ib<0)return;
 [inventoryOrder[ia],inventoryOrder[ib]]=[inventoryOrder[ib],inventoryOrder[ia]];
 inventorySelected=null;renderInventory();saveQuietly();
}

function openTownNpc(){
 const p=townPeople.find(q=>Math.hypot(player.x-q.x,player.y-q.y)<115);if(!p)return;
 townNpcIndex=townPeople.indexOf(p);
 const lines={mina:["سلام! چه خوب که اومدی شهر سبز. 🌸","امروز هوا برای قدم زدن توی میدان عالیه!"],hana:["سلام، چه خبر؟","من دوست دارم کوچه‌های قدیمی شهر رو بگردم."],nahid:["خوش اومدی عزیزم، مواظب خودت باش. ❤️","این شهر کوچیکه، اما مردمش دل بزرگی دارن."],saeed:["سلام! به شهر سبز خوش اومدی.","من مراقب ورودی و آرامش شهرم."],rezaei:["سلام! من نجار شهرم. 🪚","اگه خانه‌ات رو بزرگ‌تر یا مبلمانش رو عوض کنی، کمکت می‌کنم."],naderi:["سلام! آقای نادری هستم؛ بذر تازه و کوله‌پشتی بهتر دارم. 🎒","هرچی برای مزرعه لازم داری اینجا پیدا می‌شه."]};
 const n=townFriendship[p.id]||0;$("townNpcTitle").textContent=p.name+" • "+p.role;$("townNpcDialogue").textContent=lines[p.id][n%lines[p.id].length];$("townNpcHeart").textContent="💚 میزان آشنایی: "+n;$("townNpcShop").hidden=!["rezaei","naderi"].includes(p.id);$("townNpcShop").textContent=p.id==="rezaei"?"🪚 خدمات نجاری":"🛍️ فروشگاه نادری";$("townNpcPanel").hidden=false;townFriendship[p.id]=Math.min(20,n+1);saveQuietly();syncXpPanel();
}
function nextTownDialogue(){
 const p=townPeople[townNpcIndex];if(!p)return;
 const lines={mina:["از دیدنت خوشحال شدم. 💗","یه روز بیا با هم توی میدان قدم بزنیم!"],hana:["شهر رو بگرد، کلی جای قشنگ داره!","بعداً باز هم با هم حرف می‌زنیم."],nahid:["هر وقت خسته شدی، کمی استراحت کن.","خوشحالم که شهرمون رو دوست داری."],saeed:["مسیر جنگل از همون دروازه‌ایه که وارد شدی.","روز خوبی داشته باشی!"],rezaei:["برای ساخت و تغییر دکور خانه روی من حساب کن!","چوب و پارچه و شیشه‌ات رو بیار تا خانه‌ات رو قشنگ‌تر کنیم."],naderi:["ظرفیت کوله‌ات رو بالا ببر تا بیشتر جمع کنی.","بذر خوب، مزرعه خوب می‌سازه!"]};
 $("townNpcDialogue").textContent=lines[p.id][(townFriendship[p.id]||0)%lines[p.id].length];townFriendship[p.id]=Math.min(20,(townFriendship[p.id]||0)+1);$("townNpcHeart").textContent="💚 میزان آشنایی: "+townFriendship[p.id];saveQuietly();
}
function openTownShop(){const p=townPeople[townNpcIndex];if(!p)return;if(p.id==="rezaei"){$("townNpcPanel").hidden=true;$("carpenterPanel").hidden=false;updateCarpenterUI();syncXpPanel();return;}const hour=worldClock/60;const open=hour>=8&&hour<20;if(!open){const h=Math.floor(hour),m=Math.floor((hour-h)*60);showToast("مغازه نادری از ۸ صبح تا ۸ شب بازه؛ ساعت بازی "+String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+" است. 🌙");return;} $("townNpcPanel").hidden=true;$("townShopPanel").hidden=false;updateTownShop();syncXpPanel();}
function getFarmSeason(){return ["spring","summer","autumn","winter"][Math.floor((worldDay-1)/28)%4];}
function getFarmSeasonDay(){return ((worldDay-1)%28)+1;}
function getFarmTileAt(x,y){return farmPlots.findIndex(p=>Math.hypot(p.x-x,p.y-y)<42);}
function openFarmPanel(){selectedFarmPlot=farmPlots.length?Math.max(0,farmPlots.reduce((best,p,i)=>Math.hypot(p.x-player.x,p.y-player.y)<Math.hypot(farmPlots[best].x-player.x,farmPlots[best].y-player.y)?i:best,0)):-1;$("farmPanel").hidden=false;updateFarmUI();syncXpPanel();}
function onNewFarmDay(){
 const season=getFarmSeason(),seasonChanged=getFarmSeasonDay()===1;
 for(const p of farmPlots){
  if(p.state==="growing"&&p.crop&&p.wateredDay===worldDay-1){
   const crop=FARM_CROPS[p.crop],target=p.harvests>0&&crop.regrow?crop.regrow:crop.days;
   p.growth=Math.min(target,p.growth+1);
  }
  p.wateredDay=-1;
  if(seasonChanged&&p.state==="growing"&&p.crop&&FARM_CROPS[p.crop].season!==season){p.state="tilled";p.crop=null;p.growth=0;p.harvests=0;}
 }
 showToast("روز "+getFarmSeasonDay()+" از "+FARM_SEASONS[season]+" شروع شد! 🌅");
 updateFarmUI();
}
function updateFarmUI(){
 const season=getFarmSeason(),crop=FARM_CROPS[selectedCrop],p=farmPlots[selectedFarmPlot];
 $("farmSeason").textContent=FARM_SEASONS[season]+" • روز "+getFarmSeasonDay()+" از ۲۸";
 $("farmPlotsGrid").innerHTML=farmPlots.map((q,i)=>'<button type="button" data-plot="'+i+'" class="'+(i===selectedFarmPlot?'selected':'')+'">'+(q.crop?FARM_CROPS[q.crop].icon+" "+FARM_CROPS[q.crop].name:q.state==="tilled"?"زمین آماده کاشت":"زمین خالی")+(q.state==="growing"?" • "+q.growth+"/"+(q.harvests>0&&FARM_CROPS[q.crop].regrow?FARM_CROPS[q.crop].regrow:FARM_CROPS[q.crop].days)+" روز":"")+'</button>').join("");
 $("farmPlotStatus").textContent=!p?"برای ساخت مزرعه، کنار زمین دلخواهت بایست و «شخم زدن اینجا» را بزن.":p.state==="tilled"?"این زمین شخم خورده و آماده کاشت است.":p.state==="growing"?(FARM_CROPS[p.crop].name+" • رشد "+p.growth+"/"+(p.harvests>0&&FARM_CROPS[p.crop].regrow?FARM_CROPS[p.crop].regrow:FARM_CROPS[p.crop].days)+" روز • "+(p.growth>=(p.harvests>0&&FARM_CROPS[p.crop].regrow?FARM_CROPS[p.crop].regrow:FARM_CROPS[p.crop].days)?"آماده برداشت 🧺":p.wateredDay===worldDay?"امروز آبیاری شده 💧":"امروز هنوز آب نخورده 💧")):"زمین خالی است.";
 $("farmSeeds").textContent=Object.keys(FARM_CROPS).filter(k=>farmSeedStock[k]>0).map(k=>FARM_CROPS[k].icon+" "+farmSeedStock[k]).join(" • ")||"هنوز بذری نداری";
 $("farmCrop").value=selectedCrop;
 $("farmCropInfo").textContent=crop.icon+" "+crop.name+" • رشد "+crop.days+" روز • فروش "+crop.price+" سکه"+(crop.regrow?" • برداشت دوباره هر "+crop.regrow+" روز":"")+" • فصل "+FARM_SEASONS[crop.season];
 $("farmTill").textContent=p?"🪴 شخم زدن زمین انتخاب‌شده":"🪴 شخم زدن اینجا";
 $("farmTill").disabled=!!p&&p.state!=="empty";
 $("farmPlant").disabled=!p||p.state!=="tilled"||farmSeedStock[selectedCrop]<1||crop.season!==season;
 $("farmWater").disabled=!p||p.state!=="growing"||p.growth>=(p.harvests>0&&FARM_CROPS[p.crop].regrow?FARM_CROPS[p.crop].regrow:FARM_CROPS[p.crop].days)||p.wateredDay===worldDay;
 $("farmHarvest").disabled=!p||p.state!=="growing"||p.growth<(p.harvests>0&&FARM_CROPS[p.crop].regrow?FARM_CROPS[p.crop].regrow:FARM_CROPS[p.crop].days);
 $("farmPlant").textContent=crop.season===season?"🌱 کاشت "+crop.name:"🔒 مخصوص "+FARM_SEASONS[crop.season];
}
function farmTill(targetX=null,targetY=null){
 const offsets={up:[0,-64],down:[0,64],left:[-64,0],right:[64,0]},o=offsets[playerFacing]||offsets.down;
 const rawX=Number.isFinite(targetX)?targetX:player.x+o[0],rawY=Number.isFinite(targetY)?targetY:player.y+o[1];
 const x=Math.max(64,Math.min(WORLD.w-64,Math.round(rawX/64)*64)),y=Math.max(64,Math.min(WORLD.h-64,Math.round(rawY/64)*64));
 if(Math.abs(x-2700)<115||Math.hypot(x-playerHome.x,y-playerHome.y)<145||Math.hypot(x-samanHome.x,y-samanHome.y)<105||resources.some(r=>Math.hypot(r.x-x,r.y-y)<48)){showToast("اینجا برای کشاورزی مناسب نیست؛ کمی دورتر زمین بزن 🌿");return;}
 const existing=getFarmTileAt(x,y);
 if(existing>=0){if(farmPlots[existing].state==="empty"){selectedFarmPlot=existing;farmPlots[existing].state="tilled";}else{showToast("این زمین قبلاً آماده شده!");return;}}
 else{farmPlots.push({id:farmPlots.length,x,y,state:"tilled",crop:null,growth:0,wateredDay:-1,harvests:0});selectedFarmPlot=farmPlots.length-1;}
 updateFarmUI();saveQuietly();showToast("زمین جدیدت شخم خورد! 🪴");
}
function farmPlant(){
 const p=farmPlots[selectedFarmPlot],crop=FARM_CROPS[selectedCrop],season=getFarmSeason();
 if(!p||p.state!=="tilled"||farmSeedStock[selectedCrop]<1)return;
 if(crop.season!==season){showToast("این بذر مخصوص "+FARM_SEASONS[crop.season]+" است!");return;}
 farmSeedStock[selectedCrop]--;p.state="growing";p.crop=selectedCrop;p.growth=0;p.harvests=0;p.wateredDay=-1;
 updateUI();updateFarmUI();saveQuietly();showToast(crop.name+" کاشته شد! هر روز آبیاریش کن 🌱");
}
function farmWater(){
 const p=farmPlots[selectedFarmPlot];if(!p||p.state!=="growing"||p.wateredDay===worldDay)return;
 const crop=FARM_CROPS[p.crop],target=p.harvests>0&&crop.regrow?crop.regrow:crop.days;
 if(p.growth>=target)return;p.wateredDay=worldDay;updateFarmUI();saveQuietly();showToast("محصول آبیاری شد 💧 فردا رشد می‌کنه!");
}
function farmHarvest(){
 const p=farmPlots[selectedFarmPlot];if(!p||p.state!=="growing")return;
 const crop=FARM_CROPS[p.crop],target=p.harvests>0&&crop.regrow?crop.regrow:crop.days;
 if(p.growth<target)return;
 if(!bagCanAdd(1)){showToast("کوله‌پشتی پره! اول ظرفیتش رو ارتقا بده 🎒");return;}
 bag[p.crop]=(bag[p.crop]||0)+1;
 if(crop.regrow){p.harvests=(p.harvests||0)+1;p.growth=0;p.wateredDay=-1;}
 else{p.state="tilled";p.crop=null;p.growth=0;p.harvests=0;p.wateredDay=-1;}
 updateUI();updateFarmUI();saveQuietly();showToast(crop.name+" برداشت شد! 🧺");
}
function buyCropSeed(type){
 const crop=FARM_CROPS[type];if(!crop)return;
 if(crop.season!==getFarmSeason()){showToast("بذر "+crop.name+" فقط در فصل "+FARM_SEASONS[crop.season]+" فروخته می‌شه.");return;}
 if(player.coins<crop.seed){showToast("برای خرید "+crop.name+" به "+crop.seed+" سکه نیاز داری.");return;}
 if(!bagCanAdd(1)){showToast("کوله‌پشتی پره! ظرفیت فعلی "+bagUsed()+" از "+backpackCaps[backpackTier]+" است.");return;}
 player.coins-=crop.seed;farmSeedStock[type]=(farmSeedStock[type]||0)+1;selectedCrop=type;
 updateUI();updateTownShop();updateFarmUI();saveQuietly();showToast("یک بسته بذر "+crop.name+" خریدی 🌱");
}
function sellFarmCrops(){let count=0,total=0;for(const [key,crop] of Object.entries(FARM_CROPS)){const n=bag[key]||0;count+=n;total+=n*crop.price;bag[key]=0;}if(!count){showToast("محصولی برای فروش نداری");return;}player.coins+=total;updateUI();updateTownShop();saveQuietly();showToast("آقای نادری محصولاتت رو خرید! +"+total+" سکه 🪙");}
function updateTownShop(){
 $("townShopHours").textContent="ساعت کاری: ۰۸:۰۰ تا ۲۰:۰۰ • ساعت بازی: "+String(Math.floor(worldClock/60)).padStart(2,"0")+":"+String(Math.floor(worldClock%60)).padStart(2,"0");
 $("townShopStock").textContent="موجودی بذر: "+Object.values(farmSeedStock).reduce((n,v)=>n+v,0)+" • ظرفیت کوله: "+bagUsed()+"/"+backpackCaps[backpackTier]+" • سکه: "+player.coins;
 if($("naderiStatus"))updateNaderiUI();
 const cropCount=Object.keys(FARM_CROPS).reduce((n,k)=>n+(bag[k]||0),0);
 $("sellCrops").disabled=!cropCount;$("sellCrops").textContent="فروش محصولات برداشت‌شده • موجودی: "+cropCount;
 $("seedShopList").innerHTML=Object.entries(FARM_CROPS).map(([k,c])=>{
  const disabled=c.season!==getFarmSeason()||player.coins<c.seed||!bagCanAdd(1);
  return '<button type="button" data-seed="'+k+'" class="'+(selectedCrop===k?"selected":"")+'" '+(disabled?'disabled':'')+'><span>'+c.icon+" "+c.name+'</span><small>'+c.seed+" سکه • "+FARM_SEASONS[c.season]+'</small></button>';
 }).join("");
 $("buyBread").hidden=true;$("buyApple").hidden=true;$("eatBread").hidden=true;$("eatApple").hidden=true;
 const crop=FARM_CROPS[selectedCrop];
 $("buySeeds").disabled=!crop||crop.season!==getFarmSeason()||player.coins<crop.seed||!bagCanAdd(1);
 $("buySeeds").textContent="🌱 خرید "+(crop?.name||"بذر")+" • "+(crop?.seed||0)+" سکه";$("buySeeds").hidden=false;
}
function consumeTownFood(type){if(!townStock[type]){showToast("از این خوراکی نداری!");return;}if(player.health>=player.maxHealth){showToast("جان تو کامله!");return;}townStock[type]--;player.health=Math.min(player.maxHealth,player.health+(type==="bread"?2:1));updateUI();updateTownShop();saveQuietly();showToast("خوراکی خوردی و جانت بیشتر شد ❤️");}
function buyTownItem(type){const item={bread:{price:8,label:"نان"},seeds:{price:5,label:"بذر"},apple:{price:6,label:"سیب"}}[type];if(!item||player.coins<item.price){showToast("سکه کافی نداری! 🪙");return;}if(type==="seeds"&&!bagCanAdd(1)){showToast("کوله‌پشتی پره! اول ظرفیتش رو ارتقا بده 🎒");return;}player.coins-=item.price;if(type==="seeds")bag.seeds=(bag.seeds||0)+1;else townStock[type]++;updateUI();updateTownShop();saveQuietly();showToast(item.label+" خریدی! 🛍️");}
function updateCarpenterUI(){const title=homeLevel===0?"هنوز خانه‌ای نداری":homeLevel===1?"کلبه چوبی":homeLevel===2?"خانه بزرگ":"خانه لوکس";$("carpenterStatus").textContent=title+" • چوب "+bag.wood+" • سنگ "+bag.stone+" • تخته "+bag.plank+" • پارچه "+bag.cloth+" • سکه "+player.coins;$("carpenterBuild").hidden=homeLevel>0;$("carpenterUpgrade").hidden=homeLevel===0||homeLevel>=3;$("carpenterBuild").disabled=bag.wood<12||bag.stone<6;$("carpenterUpgrade").disabled=homeLevel===1?(bag.wood<18||bag.stone<10||player.coins<10):(bag.wood<30||bag.stone<20||player.coins<35);$("furnitureBed").disabled=furnitureOwned.bed||bag.plank<8||bag.cloth<3;$("furnitureTable").disabled=furnitureOwned.table||bag.plank<6||bag.nail<4;$("furnitureChair").disabled=furnitureOwned.chair||bag.plank<4||bag.nail<2;$("furnitureStatus").textContent="وسایل ساخته‌شده: "+Object.entries(furnitureOwned).filter(([k,v])=>v).map(([k])=>({bed:"تخت",table:"میز",chair:"صندلی"}[k])).join("، "||"") ;}
function carpenterBuild(){buildPlayerHome();updateCarpenterUI();}
function carpenterUpgrade(){upgradePlayerHome();updateCarpenterUI();}
function buildFurniture(type){const recipes={bed:{cost:{plank:8,cloth:3},label:"تخت"},table:{cost:{plank:6,nail:4},label:"میز"},chair:{cost:{plank:4,nail:2},label:"صندلی"}};const r=recipes[type];if(!r||furnitureOwned[type])return;if(!Object.entries(r.cost).every(([k,v])=>(bag[k]||0)>=v)){showToast("مصالح کافی نداری");return;}Object.entries(r.cost).forEach(([k,v])=>bag[k]-=v);furnitureOwned[type]=true;updateUI();updateCarpenterUI();saveQuietly();showToast(r.label+" برای خانه ساخته شد! 🪑");}
function upgradeBackpack(){
 const costs=[{coins:40,plank:8},{coins:100,plank:18,cloth:8}];
 if(backpackTier>=2){showToast("کوله‌پشتی به آخرین سطح رسیده!");return;}
 const cost=costs[backpackTier],missing=[];
 if(player.coins<cost.coins)missing.push((cost.coins-player.coins)+" سکه");
 if(bag.plank<cost.plank)missing.push((cost.plank-bag.plank)+" تخته");
 if(cost.cloth&&bag.cloth<cost.cloth)missing.push((cost.cloth-bag.cloth)+" پارچه");
 if(missing.length){showToast("برای ارتقا کم داری: "+missing.join("، "));updateNaderiUI();return;}
 player.coins-=cost.coins;bag.plank-=cost.plank;if(cost.cloth)bag.cloth-=cost.cloth;
 backpackTier=Math.min(2,backpackTier+1);updateUI();updateTownShop();updateNaderiUI();saveQuietly();
 showToast("کوله‌پشتی ارتقا پیدا کرد! ظرفیت: "+backpackCaps[backpackTier]+" 🎒");
}
function updateNaderiUI(){
 const costs=[{coins:40,plank:8},{coins:100,plank:18,cloth:8}],cost=costs[backpackTier],btn=$("backpackUpgrade");
 btn.hidden=backpackTier>=2;
 btn.disabled=!cost||player.coins<cost.coins||bag.plank<cost.plank||(cost.cloth&&bag.cloth<cost.cloth);
 btn.textContent=backpackTier===0?"🎒 ارتقا به ۴۵ خانه • ۴۰ سکه + ۸ تخته":backpackTier===1?"🎒 ارتقا به ۶۰ خانه • ۱۰۰ سکه + ۱۸ تخته + ۸ پارچه":"🎒 کوله‌پشتی در بالاترین سطح است";
 $("naderiStatus").textContent="ظرفیت: "+bagUsed()+" / "+backpackCaps[backpackTier]+" • سکه: "+player.coins+(cost?"\nارتقای بعدی: "+backpackCaps[backpackTier+1]+" خانه • "+cost.coins+" سکه، "+cost.plank+" تخته"+(cost.cloth?" و "+cost.cloth+" پارچه":""):"\nکوله‌پشتی به آخرین سطح رسیده است.");
}
function openNaderiShop(){const p=townPeople[townNpcIndex];if(!p||p.id!=="naderi")return;openTownShop();updateNaderiUI();}
function drawFarmPlots(){
 for(const p of farmPlots){
  const x=p.x-camera.x,y=p.y-camera.y;if(x<-80||x>viewW+80||y<-80||y>viewH+80)continue;
  ctx.fillStyle="rgba(25,20,14,.24)";ctx.beginPath();ctx.ellipse(x,y+20,29,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#4d3525";ctx.fillRect(x-28,y-20,56,40);
  ctx.fillStyle=p.wateredDay===worldDay?"#493a30":"#765033";ctx.fillRect(x-25,y-17,50,34);
  ctx.fillStyle="#a17a4e";for(let k=-1;k<=1;k++)ctx.fillRect(x-23,y+k*10,46,2);
  ctx.fillStyle="#382a21";for(let k=-1;k<=1;k++)ctx.fillRect(x-21,y+k*10+3,42,2);
  if(p.state==="growing"&&p.crop){
   const c=FARM_CROPS[p.crop],target=p.harvests>0&&c.regrow?c.regrow:c.days,ripe=p.growth>=target,stage=ripe?4:Math.max(1,Math.min(3,Math.floor(p.growth/target*3)+1));
   const plantColor=c.color;
   for(let stem=0;stem<Math.min(3,stage);stem++){
    const sx=x-11+stem*11,ht=9+stage*4;
    ctx.fillStyle="#285638";ctx.fillRect(sx-2,y-5-ht,4,ht);
    ctx.fillStyle="#397d43";ctx.beginPath();ctx.ellipse(sx-5,y-13-ht,7,3,-.45,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(sx+5,y-18-ht,7,3,.45,0,Math.PI*2);ctx.fill();
   }
   if(ripe){ctx.fillStyle=plantColor;ctx.fillRect(x-9,y-31,8,8);ctx.fillRect(x+2,y-35,9,9);ctx.fillStyle="#f5e5b1";ctx.fillRect(x-7,y-29,2,2);ctx.fillRect(x+4,y-33,2,2);}
   if(p.wateredDay===worldDay){ctx.fillStyle="#9bd5e2";ctx.fillRect(x-22,y+12,6,2);ctx.fillRect(x+16,y-10,6,2);}
   if(ripe){ctx.fillStyle="#fff1a6";ctx.fillRect(x-2,y-43,4,3);}
  }
 }
}
function drawTown(){
  const w=TOWN.w,h=TOWN.h,tile=40;
  ctx.fillStyle="#bca77b";ctx.fillRect(0,0,viewW,viewH);
  const sx=Math.floor(camera.x/tile),sy=Math.floor(camera.y/tile),ex=Math.ceil((camera.x+viewW)/tile),ey=Math.ceil((camera.y+viewH)/tile);
  for(let gy=sy;gy<=ey;gy++)for(let gx=sx;gx<=ex;gx++){
    const n=(gx*31+gy*17+gx*gy*3)%11;
    ctx.fillStyle=n<3?"#c7b487":n<7?"#d1bd91":"#cbb78b";
    ctx.fillRect(gx*tile-camera.x,gy*tile-camera.y,tile+1,tile+1);
    if(n===2||n===8){ctx.fillStyle="#b39d73";ctx.fillRect(gx*tile+8-camera.x,gy*tile+13-camera.y,3,2);ctx.fillRect(gx*tile+27-camera.x,gy*tile+30-camera.y,2,3);}
    if(n===1||n===6){ctx.fillStyle="#b09a72";ctx.fillRect(gx*tile+5-camera.x,gy*tile+6-camera.y,8,1);ctx.fillRect(gx*tile+26-camera.x,gy*tile+27-camera.y,6,1);}
    if(n===4){ctx.fillStyle="#e0cea5";ctx.fillRect(gx*tile+17-camera.x,gy*tile+9-camera.y,2,2);ctx.fillRect(gx*tile+31-camera.x,gy*tile+33-camera.y,3,2);}
  }
  // A winding, worn stone road connects the gate to the square.
  ctx.fillStyle="#a58c65";ctx.beginPath();ctx.moveTo(680-camera.x,1200-camera.y);ctx.lineTo(920-camera.x,1200-camera.y);ctx.lineTo(900-camera.x,810-camera.y);ctx.lineTo(880-camera.x,700-camera.y);ctx.lineTo(720-camera.x,700-camera.y);ctx.lineTo(700-camera.x,820-camera.y);ctx.closePath();ctx.fill();
  for(let y=730;y<1190;y+=42)for(let x=710;x<900;x+=48){const xx=x-camera.x,yy=y-camera.y;ctx.fillStyle=((x+y)%3)?"#c8b58d":"#bca77f";ctx.fillRect(xx,yy,42,31);ctx.strokeStyle="#a58e69";ctx.lineWidth=1;ctx.strokeRect(xx,yy,42,31);ctx.fillStyle="#e2d0a9";ctx.fillRect(xx+5,yy+5,12,2);ctx.fillStyle="#9d8866";ctx.fillRect(xx+30,yy+20,5,2);}
  // Main square, cobbles and decorative border.
  ctx.fillStyle="#a98f68";ctx.fillRect(500-camera.x,380-camera.y,620,450);
  ctx.fillStyle="#d1bd91";ctx.fillRect(514-camera.x,394-camera.y,592,422);
  for(let y=405;y<810;y+=34)for(let x=525;x<1090;x+=44){const xx=x-camera.x,yy=y-camera.y;ctx.fillStyle=((x/44+y/34|0)%2)?"#c7b487":"#d9c69a";ctx.fillRect(xx,yy,39,28);ctx.strokeStyle="#b5a078";ctx.lineWidth=1;ctx.strokeRect(xx,yy,39,28);ctx.fillStyle="#e5d4ae";ctx.fillRect(xx+4,yy+4,10,2);ctx.fillStyle="#ad9871";ctx.fillRect(xx+27,yy+20,5,2);}
  // Small grass gardens around the town.
  [[70,160,260,150],[1260,150,260,180],[90,850,300,260],[1200,880,300,220],[470,90,650,150]].forEach(g=>{ctx.fillStyle="#73965a";ctx.fillRect(g[0]-camera.x,g[1]-camera.y,g[2],g[3]);ctx.fillStyle="#8daf6b";for(let i=0;i<18;i++){const px=g[0]+(i*47)%g[2],py=g[1]+(i*31)%g[3];ctx.fillRect(px-camera.x,py-camera.y,8,5);}});
  // Fountain with stone lip, water highlights and animated ripples.
  const fx=810-camera.x,fy=590-camera.y,pulse=Math.sin(animTime*2.5);
  ctx.fillStyle="#76634c";ctx.beginPath();ctx.ellipse(fx,fy+8,103,68,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#e1d2ad";ctx.beginPath();ctx.ellipse(fx,fy,96,62,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#5da9b2";ctx.beginPath();ctx.ellipse(fx,fy-3,82,49,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#a6e2d8";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(fx,fy-4,48+Math.sin(animTime*2)*5,25+Math.cos(animTime*2)*3,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#d9cba8";ctx.fillRect(fx-12,fy-46,24,34);ctx.fillStyle="#7f9d91";ctx.fillRect(fx-17,fy-51,34,8);
  ctx.strokeStyle="#d9f7e9";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx,fy-50);ctx.quadraticCurveTo(fx-8,fy-70+pulse*3,fx,fy-82);ctx.quadraticCurveTo(fx+8,fy-70-pulse*3,fx,fy-50);ctx.stroke();
  // Iranian-inspired low-rise homes and shops.
  drawTownBuilding(340,350,"خانه مینا و حنا","#a65343","home");
  drawTownBuilding(535,300,"خانه ناهید","#b77c4c","home");
  drawTownBuilding(1160,345,"نجاری خانم رضایی","#a84e3e","shop");
  drawTownBuilding(1430,420,"فروشگاه نادری","#b86d3c","shop");
  drawTownBuilding(180,430,"اتاق نگهبانی","#637e78","guard");
  drawTownBuilding(1260,760,"خانه قدیمی","#9a6550","home");
  // Windowside flower pots, shrubs, street lamps, benches.
  [[270,470],[420,470],[475,420],[620,390],[1070,430],[1250,480],[1360,510],[1510,800]].forEach((p,i)=>drawFlowerPot(p[0]-camera.x,p[1]-camera.y,i));
  [[650,850],[1020,850],[280,740],[1320,670]].forEach(p=>drawBench(p[0]-camera.x,p[1]-camera.y));
  [[560,760],[1080,760],[760,340],[980,350],[250,650],[1450,650]].forEach(p=>drawTownLamp(p[0]-camera.x,p[1]-camera.y));
  [[100,260],[270,900],[450,920],[1080,930],[1500,900],[1500,230],[950,210],[650,180]].forEach((p,i)=>drawTownTree(p[0]-camera.x,p[1]-camera.y,i));
  // Town entrance gate and readable exit marker at the southern edge.
  const gx=800-camera.x,gy=1110-camera.y;
  ctx.fillStyle="#5e4029";ctx.fillRect(gx-66,gy-92,12,108);ctx.fillRect(gx+54,gy-92,12,108);ctx.fillRect(gx-66,gy-92,132,12);
  ctx.fillStyle="#9b673d";ctx.fillRect(gx-48,gy-78,96,55);ctx.strokeStyle="#e7c98d";ctx.lineWidth=3;ctx.strokeRect(gx-48,gy-78,96,55);
  ctx.fillStyle="#fff0cb";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("جنگل",gx,gy-45);
  ctx.fillStyle="#f5e7c6";ctx.font="bold 17px Tahoma";ctx.fillText("شهر سبز",800-camera.x,115-camera.y);
  const hour=worldClock/60;
  if(hour>=20||hour<6){ctx.fillStyle="rgba(22,35,70,.34)";ctx.fillRect(0,0,viewW,viewH);}
  else if(hour>=18){ctx.fillStyle="rgba(227,126,65,.14)";ctx.fillRect(0,0,viewW,viewH);}
  else if(hour<8){ctx.fillStyle="rgba(255,203,133,.10)";ctx.fillRect(0,0,viewW,viewH);}
  ctx.textAlign="start";
}
function drawTownTree(x,y,i){
 ctx.fillStyle="rgba(32,37,24,.28)";ctx.beginPath();ctx.ellipse(x+3,y+12,29,8,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#5a3b2b";ctx.fillRect(x-6,y-6,12,43);ctx.fillStyle="#8b6140";ctx.fillRect(x-2,y-3,3,32);
 ctx.fillStyle="#214c32";ctx.beginPath();ctx.moveTo(x-34,y-7);ctx.lineTo(x-30,y-32);ctx.lineTo(x-15,y-48);ctx.lineTo(x+4,y-55);ctx.lineTo(x+27,y-39);ctx.lineTo(x+35,y-16);ctx.lineTo(x+22,y+1);ctx.lineTo(x-23,y+2);ctx.closePath();ctx.fill();
 ctx.fillStyle=i%2?"#347344":"#3f8149";ctx.beginPath();ctx.moveTo(x-27,y-13);ctx.lineTo(x-23,y-35);ctx.lineTo(x-7,y-49);ctx.lineTo(x+13,y-46);ctx.lineTo(x+28,y-26);ctx.lineTo(x+21,y-7);ctx.lineTo(x-19,y-5);ctx.closePath();ctx.fill();
 ctx.fillStyle="#5a9850";ctx.fillRect(x-19,y-34,9,5);ctx.fillRect(x-3,y-47,9,4);ctx.fillRect(x+13,y-36,8,5);ctx.fillRect(x+1,y-20,11,4);
 ctx.fillStyle="#91b96a";ctx.fillRect(x-12,y-42,5,3);ctx.fillRect(x+7,y-31,4,3);ctx.fillRect(x+20,y-22,4,3);
 ctx.fillStyle="#d3b96d";if(i%3===0){ctx.fillRect(x-19,y-18,4,4);ctx.fillRect(x+17,y-42,4,4);}
}
function drawFlowerPot(x,y,i){
  ctx.fillStyle="#9c583e";ctx.fillRect(x-8,y-2,16,10);ctx.fillStyle="#c57b51";ctx.fillRect(x-10,y-5,20,4);
  const colors=["#f0c36e","#df7890","#f5e6b4","#b9a0df"];ctx.fillStyle="#477d43";ctx.fillRect(x-2,y-14,3,12);ctx.fillRect(x+3,y-12,3,10);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(x-5,y-18,7,7);ctx.fillRect(x+1,y-16,7,7);
}
function drawBench(x,y){
  ctx.fillStyle="#61452f";ctx.fillRect(x-25,y-3,50,7);ctx.fillStyle="#a16b42";ctx.fillRect(x-25,y-12,50,9);ctx.fillRect(x-20,y+4,5,10);ctx.fillRect(x+15,y+4,5,10);
}
function drawTownLamp(x,y){
 const night=worldClock>=1080||worldClock<360;
 if(night){
  const glow=ctx.createRadialGradient(x,y-28,3,x,y-28,58);
  glow.addColorStop(0,"rgba(255,226,151,.32)");glow.addColorStop(1,"rgba(255,207,112,0)");
  ctx.fillStyle=glow;ctx.fillRect(x-60,y-88,120,120);
 }
 ctx.fillStyle="#393b36";ctx.fillRect(x-3,y-32,6,43);ctx.fillStyle="#766047";ctx.fillRect(x-5,y-33,10,3);
 ctx.fillStyle="#4a4237";ctx.fillRect(x-13,y-44,26,7);ctx.fillRect(x-10,y-48,20,5);
 ctx.fillStyle=night?"#ffe39a":"#b8a57b";ctx.fillRect(x-7,y-39,14,13);
 ctx.fillStyle=night?"#fff4c8":"#d4c6a1";ctx.fillRect(x-4,y-37,8,9);
 ctx.fillStyle="#5b4b38";ctx.fillRect(x-15,y-46,30,3);ctx.fillRect(x-2,y-51,4,5);
}
function drawTownBuilding(x,y,label,roof,kind){
  const sx=x-camera.x,sy=y-camera.y;
  // cast shadow and foundation
  ctx.fillStyle="#746049";ctx.fillRect(sx-91,sy+6,182,112);
  ctx.fillStyle="#d4c09a";ctx.fillRect(sx-86,sy-2,172,108);
  ctx.fillStyle="#b98f68";ctx.fillRect(sx-86,sy+91,172,17);
  // textured plaster wall
  ctx.fillStyle=kind==="guard"?"#b5b59c":kind==="shop"?"#dfc18e":"#e5d0a8";ctx.fillRect(sx-80,sy+4,160,88);
  ctx.fillStyle="#f0dfbd";ctx.fillRect(sx-74,sy+10,148,76);
  for(let i=0;i<9;i++){ctx.fillStyle="#c8b38d";ctx.fillRect(sx-68+i*16,sy+16+(i%3)*17,4,2);}
  // deep tiled roof with eaves
  ctx.fillStyle="#704431";ctx.beginPath();ctx.moveTo(sx-98,sy+7);ctx.lineTo(sx,sy-62);ctx.lineTo(sx+98,sy+7);ctx.lineTo(sx+89,sy+16);ctx.lineTo(sx,sy-47);ctx.lineTo(sx-89,sy+16);ctx.closePath();ctx.fill();
  ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(sx-92,sy+3);ctx.lineTo(sx,sy-57);ctx.lineTo(sx+92,sy+3);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#e3a16e";ctx.lineWidth=2;for(let row=0;row<4;row++){const yy=sy-37+row*11;ctx.beginPath();ctx.moveTo(sx-65+row*20,yy);ctx.lineTo(sx+65-row*20,yy);ctx.stroke();}
  // wooden door with frame and handle
  ctx.fillStyle="#75472f";ctx.fillRect(sx-17,sy+42,34,54);ctx.fillStyle="#9b6841";ctx.fillRect(sx-13,sy+46,26,48);ctx.fillStyle="#e7c98a";ctx.fillRect(sx+7,sy+68,3,4);
  // blue glass windows, frames and crossbars
  [-57,35].forEach(wx=>{ctx.fillStyle="#80583c";ctx.fillRect(sx+wx-15,sy+27,30,30);ctx.fillStyle=(worldClock>=1080||worldClock<360)?"#e6b86e":"#80b8bb";ctx.fillRect(sx+wx-11,sy+31,22,22);ctx.fillStyle=(worldClock>=1080||worldClock<360)?"#fff0b6":"#c7e2d7";ctx.fillRect(sx+wx-9,sy+33,7,7);ctx.fillStyle="#f1dfb5";ctx.fillRect(sx+wx-1,sy+31,3,22);ctx.fillRect(sx+wx-11,sy+41,22,3);});
  // shop awning and signage
  if(kind==="shop"||kind==="bakery"){
    ctx.fillStyle=kind==="shop"?"#d85f4c":"#e6bd68";ctx.fillRect(sx-78,sy+4,156,17);
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?"#f3e2bd":"#fff1d0";ctx.fillRect(sx-78+i*19.5,sy+4,9,17);}
    ctx.fillStyle="#744a32";ctx.fillRect(sx-54,sy-17,108,22);ctx.strokeStyle="#edce91";ctx.lineWidth=2;ctx.strokeRect(sx-54,sy-17,108,22);
    ctx.fillStyle="#fff0cf";ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.fillText(label,sx,sy-2);ctx.textAlign="start";
    if(kind==="bakery"){ctx.fillStyle="#d69a48";ctx.beginPath();ctx.arc(sx+55,sy+72,9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f4d28c";ctx.fillRect(sx+47,sy+70,17,4);}
  }else{
    ctx.fillStyle="#754b34";ctx.fillRect(sx-52,sy-17,104,21);ctx.strokeStyle="#e5c995";ctx.lineWidth=2;ctx.strokeRect(sx-52,sy-17,104,21);ctx.fillStyle="#fff0cf";ctx.font="bold 11px Tahoma";ctx.textAlign="center";ctx.fillText(label,sx,sy-2);ctx.textAlign="start";
  }
  // small clay pots and step
  ctx.fillStyle="#70412f";ctx.fillRect(sx-31,sy+95,14,10);ctx.fillRect(sx+19,sy+95,14,10);ctx.fillStyle="#c17a53";ctx.fillRect(sx-30,sy+93,12,8);ctx.fillRect(sx+20,sy+93,12,8);ctx.fillStyle="#356c40";ctx.fillRect(sx-27,sy+83,3,12);ctx.fillRect(sx-23,sy+86,4,9);ctx.fillRect(sx+23,sy+83,3,12);ctx.fillRect(sx+27,sy+86,4,9);ctx.fillStyle="#80a85b";ctx.fillRect(sx-28,sy+82,4,3);ctx.fillRect(sx+24,sy+82,4,3);
}
const townSpriteCache = {};
function makePixelTownSprite(id, frame) {
 const c=document.createElement("canvas");c.width=80;c.height=112;
 const g=c.getContext("2d");
 const mina=id==="mina",hana=id==="hana",saeed=id==="saeed",naderi=id==="naderi";
 const walk=frame===1?-2:frame===2?2:0;
 const skin="#e9b99c",skinHi="#f7d4bb",skinShade="#c98f78";
 const hair=mina?"#65402f":hana?"#29232d":"#302b2b";
 const hairHi=mina?"#a36c49":hana?"#62515f":"#64504a";
 const top=mina?"#d94f91":hana?"#347fb6":"#52677a";
 const topHi=mina?"#f58bb5":hana?"#79b8dc":"#8da1ad";
 const topShade=mina?"#9f376b":hana?"#205b89":"#354b5b";
 const bottom=saeed?"#3c4148":mina?"#403447":"#d0d1d8";
 const boot="#292b32";
 const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
 // Ground shadow, boots and separated legs.
 g.fillStyle="rgba(26,24,23,.25)";g.beginPath();g.ellipse(40,103,17,4,0,0,Math.PI*2);g.fill();
 px(27,84+walk,9,13,bottom);px(44,84-walk,9,13,bottom);
 px(25,96+walk,13,6,boot);px(43,96-walk,14,6,boot);
 px(27,97+walk,7,2,"#77706a");px(45,97-walk,8,2,"#77706a");
 // Back hair and long side locks for the sisters; short hair for Saeed.
 if(!saeed&&!naderi){
  px(19,13,42,39,hair);px(15,27,8,43,hair);px(57,27,8,43,hair);
  px(17,54,8,19,hair);px(55,53,8,20,hair);
  px(22,16,12,4,hairHi);px(43,14,12,3,hairHi);
 }else{
  px(22,17,36,26,hair);px(19,25,5,16,hair);px(56,25,5,15,hair);
 }
 // Outfit silhouette: shaped shoulders, sleeves, torso and lower garment.
 px(23,43,34,35,topShade);px(18,48,8,22,topShade);px(54,48,8,22,topShade);
 px(25,43,30,32,top);px(20,49,6,17,top);px(54,49,6,17,top);
 px(28,45,23,5,topHi);px(21,51,3,10,topHi);px(56,51,3,10,topHi);
 px(29,73,22,3,mina?"#f2c36e":hana?"#e6e0d4":"#b8a98e");
 if(!saeed&&!naderi){
  // Modest skirt with a layered hem and subtle fabric folds.
  px(22,76,36,11,bottom);px(19,81,42,8,bottom);
  px(24,78,4,8,mina?"#67506a":"#e4e2e4");px(51,78,3,8,mina?"#67506a":"#e4e2e4");
  px(31,79,2,7,mina?"#59435d":"#adb2bd");px(45,79,2,7,mina?"#59435d":"#adb2bd");
 }else{
  // Civilian jacket, visible collar, buttons and trousers.
  px(27,45,26,27,top);px(37,45,3,28,topShade);px(29,46,7,5,"#d7d1c1");
  px(43,46,7,5,"#d7d1c1");px(39,53,2,2,"#e5d2a1");px(39,61,2,2,"#e5d2a1");
  px(28,75,8,12,bottom);px(44,75,8,12,bottom);
  px(28,78,3,2,"#666a6d");px(45,78,3,2,"#666a6d");
 }
 // Arms, hands, neck.
 px(17,56+walk,7,18,topShade);px(56,56-walk,7,18,topShade);
 px(18,58+walk,5,12,top);px(57,58-walk,5,12,top);
 px(18,72+walk,6,7,skin);px(56,72-walk,6,7,skin);
 px(33,36,14,11,skinShade);px(34,36,12,9,skin);
 // Face, ears and light planes.
 px(25,21,30,25,skinShade);px(27,19,26,27,skin);
 px(30,21,18,17,skinHi);px(24,28,4,10,skin);px(52,28,4,10,skin);
 px(28,35,5,4,"#d99d8c");px(47,35,5,4,"#d99d8c");
 // Hair cap and signature fringe, drawn around but not over the face.
 if(mina){
  px(20,12,40,14,hair);px(18,18,10,16,hair);px(52,17,10,17,hair);
  px(22,22,9,5,hair);px(31,18,11,6,hair);px(42,21,10,5,hair);
  px(17,37,8,30,hair);px(55,37,8,31,hair);
  px(20,15,12,3,hairHi);px(42,14,10,3,hairHi);px(18,44,3,12,hairHi);
 }else if(hana){
  px(20,12,40,15,hair);px(18,19,10,17,hair);px(52,18,10,18,hair);
  px(22,22,10,5,hair);px(33,18,10,6,hair);px(43,22,9,5,hair);
  px(17,38,8,30,hair);px(55,37,8,32,hair);
  px(22,15,9,3,hairHi);px(43,14,9,3,hairHi);px(57,43,3,11,hairHi);
 }else{
  px(21,14,38,12,hair);px(24,10,29,8,hair);px(20,20,7,8,hair);
  px(28,13,9,3,hairHi);px(45,12,8,3,hairHi);
 }
 // Eyes, brows, nose, mouth and cheek highlights.
 px(29,29,7,2,hair);px(46,29,7,2,hair);
 px(31,32,4,5,"#392d30");px(47,32,4,5,"#392d30");
 px(32,32,2,2,"#fff8ed");px(48,32,2,2,"#fff8ed");
 px(40,36,2,3,skinShade);px(37,41,7,2,"#a85f62");px(39,41,3,1,"#ffe4d5");
 if(!saeed&&!naderi){px(27,38,4,3,"#e8a1a0");px(51,38,4,3,"#e8a1a0");}
 else{px(31,43,22,3,hair);px(35,45,14,4,hair);}
 // Character-specific accents.
 if(mina){px(59,54,3,7,"#f3cf75");px(60,55,2,3,"#fff1b8");px(24,47,3,8,"#f6a6c6");}
 if(hana){px(38,47,5,5,"#e8edf4");px(39,48,3,3,"#f5d98d");px(54,77,3,5,"#7ba9d0");}
 if(saeed){px(34,48,4,5,"#d7d4c9");px(42,48,4,5,"#d7d4c9");}
  if(naderi){px(27,30,13,8,"#6d7778");px(45,30,13,8,"#6d7778");px(39,32,7,2,"#6d7778");px(29,32,9,4,"#b9dce0");px(47,32,9,4,"#b9dce0");}
 // Crisp outer silhouette accents.
 g.strokeStyle="#352b2d";g.lineWidth=1;g.strokeRect(18.5,42.5,43,37);
 // Extra pixel-art finish: fabric seams, hair strands, face lighting and grounded shoe shine.
 // Fine folds make the clothes read as fabric rather than flat blocks.
 px(25,54,2,12,topShade);px(53,55,2,10,topShade);
 px(28,62,3,2,topHi);px(48,66,4,2,topHi);
 px(24,77,4,2,topHi);px(51,80,4,2,topShade);
 // Hair strands frame the cheeks while keeping both faces clearly visible.
 if(!saeed){
  px(18,48,3,12,hairHi);px(59,45,2,14,hairHi);
  px(22,27,3,7,hairHi);px(55,28,2,6,hairHi);
 }else{
  px(23,22,4,2,hairHi);px(48,20,5,2,hairHi);
 }
 // Small warm facial planes and crisp eye highlights.
 px(27,26,2,5,skinHi);px(53,27,2,5,skinShade);
 px(33,33,2,2,"#fffdf2");px(49,33,2,2,"#fffdf2");
 px(35,44,8,1,"#f4c4ae");
 // Shoes, cuffs and tiny fabric highlights.
 px(26,99,5,2,"#9b9584");px(47,99,5,2,"#9b9584");
 px(22,70,3,3,topHi);px(56,70,3,3,topShade);
 if(mina){px(31,50,3,2,"#ffd1df");px(44,58,4,2,"#f6a4c5");}
 if(hana){px(31,55,3,2,"#9bc9e5");px(45,58,4,2,"#a9d2e7");}
 if(saeed){px(37,57,2,3,"#e8dfc9");px(42,64,3,2,"#b7c0c2");}
 return c;
}
function getTownSpriteFrames(id){
 if(!townSpriteCache[id]) townSpriteCache[id]=[makePixelTownSprite(id,0),makePixelTownSprite(id,1),makePixelTownSprite(id,2)];
 return townSpriteCache[id];
}
function drawTownPeople(){
 townPeople.forEach(p=>{
  const x=p.x-camera.x,y=p.y-camera.y;
  if(x< -60||x>viewW+60||y< -70||y>viewH+70)return;
  const walking=!!p.walking,phase=animTime*8+(p.x*.013);
  const frame=walking?(Math.floor(phase)%2+1):0;
  const bob=walking?Math.abs(Math.sin(phase))*1.1:Math.sin(animTime*2+p.x*.01)*.35;
  const frames=getTownSpriteFrames(p.id);
  ctx.fillStyle="#302923";ctx.globalAlpha=.28;ctx.beginPath();ctx.ellipse(x,y+2,9,3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(frames[frame],x-20,y-56+bob,40,56);ctx.restore();
  if(p.id==="mina"||p.id==="hana"){
   if(Math.floor(animTime*2.1+p.x*.017)%9===0){ctx.fillStyle="#fff7ed";ctx.fillRect(x-4,y-38+bob,2,1);ctx.fillRect(x+3,y-38+bob,2,1);}
  }
  ctx.font="bold 10px Tahoma";ctx.textAlign="center";ctx.lineWidth=2;ctx.strokeStyle="#44352f";ctx.strokeText(p.name,x,y-61+bob);ctx.fillStyle="#fff7df";ctx.fillText(p.name,x,y-61+bob);
  if(Math.hypot(player.x-p.x,player.y-p.y)<95){ctx.fillStyle="#ffe9a0";ctx.font="bold 13px Tahoma";ctx.fillText("✦",x,y-70+bob);}
  ctx.textAlign="start";
 });
}

function updateHomeUI() {
  const title = homeLevel === 0 ? "زمین خالی" : homeLevel === 1 ? "کلبه چوبی" : homeLevel === 2 ? "خانه بزرگ" : "خانه لوکس";
  $("homeStatus").textContent = title + " • سطح " + homeLevel + " | چوب: " + bag.wood + " • سنگ: " + bag.stone + " • سکه: " + player.coins;
  $("buildHome").hidden = homeLevel > 0;
  $("enterHome").hidden = homeLevel === 0;
  $("upgradeHome").hidden = homeLevel === 0 || homeLevel >= 3;
  $("buildHome").disabled = bag.wood < 12 || bag.stone < 6;
  $("upgradeHome").disabled = homeLevel === 1 ? (bag.wood < 18 || bag.stone < 10 || player.coins < 10) : (bag.wood < 30 || bag.stone < 20 || player.coins < 35);
  $("buildHome").textContent = "ساخت کلبه — ۱۲ چوب + ۶ سنگ";
  $("upgradeHome").textContent = homeLevel === 1 ? "ارتقا به خانه بزرگ — ۱۸ چوب + ۱۰ سنگ + ۱۰ سکه" : "ارتقا به خانه لوکس — ۳۰ چوب + ۲۰ سنگ + ۳۵ سکه";
}
function openHomePanel() {
  $("homePanel").hidden = false;
  updateHomeUI();
  syncXpPanel();
}
function handleHomeButton() {
  if (homeInterior) {
    homeInterior = false;
    player.x = homeReturn.x; player.y = homeReturn.y;
    $("homePanel").hidden = true;
    showToast("به جنگل برگشتی 🌲");
    saveQuietly();
    return;
  }
  if (Math.hypot(player.x-playerHome.x, player.y-(playerHome.y+45)) > 150) { showToast("به زمین خانه نزدیک‌تر شو"); return; }
  openHomePanel();
}
function buildPlayerHome() {
  if (homeLevel !== 0 || bag.wood < 12 || bag.stone < 6) { showToast("برای ساخت خانه ۱۲ چوب و ۶ سنگ لازم داری"); return; }
  bag.wood -= 12; bag.stone -= 6; homeLevel = 1;
  updateUI(); updateHomeUI(); saveQuietly();
  showToast("کلبه‌ات ساخته شد! 🏡");
}
function upgradePlayerHome() {
  if (homeLevel === 1 && bag.wood >= 18 && bag.stone >= 10 && player.coins >= 10) {
    bag.wood -= 18; bag.stone -= 10; player.coins -= 10; homeLevel = 2;
  } else if (homeLevel === 2 && bag.wood >= 30 && bag.stone >= 20 && player.coins >= 35) {
    bag.wood -= 30; bag.stone -= 20; player.coins -= 35; homeLevel = 3;
  } else { showToast("منابع یا سکه کافی نداری"); return; }
  updateUI(); updateHomeUI(); saveQuietly();
  showToast("خانه‌ات ارتقا پیدا کرد! ✨");
}
function enterPlayerHome() {
  if (homeLevel < 1) return;
  homeReturn = { x: player.x, y: player.y };
  homeInterior = true; player.x = 450; player.y = 500;
  $("homePanel").hidden = true;
  showToast("به خانه خودت خوش اومدی 🏡");
  saveQuietly(); syncXpPanel();
}
/* ===== Stage 1 — cached ground layer (performance foundation) =====
   The grass / cave floor, forest mounds, small props, cave ceiling formations and crystal glow pools are all
   deterministic (terrainHash of world coordinates), so they are painted ONCE into small offscreen "chunks"
   and then blitted every frame. The artwork code below is the same code that used to run per tile per frame.
   Nothing here reads or writes saved data, gameplay state or rand(). */
const GROUND_CHUNK_TILES = 6;                       // 6 tiles * 48px = 288px = exactly 3 detail cells of 96px
const groundCaches = { forest: new Map(), cave: new Map() };
let groundCacheDpr = 0;
function releaseGroundCaches(){
  for(const m of Object.values(groundCaches)){
    for(const c of m.values()){c.width=c.height=0;}
    m.clear();
  }
}
function getGroundChunk(kind, cx, cy, paintChunk){
  const cache = groundCaches[kind], key = cx + "," + cy;
  let c = cache.get(key);
  if(c){cache.delete(key);cache.set(key,c);return c;}   // re-insert = mark as recently used
  const size = GROUND_CHUNK_TILES * WORLD.tile;
  c = document.createElement("canvas");
  c.width = Math.ceil(size * dpr); c.height = Math.ceil(size * dpr);
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.rect(0, 0, size, size); g.clip();
  paintChunk(g, cx, cy, size);
  g.restore();
  cache.set(key, c);
  return c;
}
function drawGroundChunks(kind, paintChunk){
  if(groundCacheDpr !== dpr){releaseGroundCaches();groundCacheDpr = dpr;}
  for(const k of Object.keys(groundCaches)){if(k!==kind&&groundCaches[k].size){for(const c of groundCaches[k].values()){c.width=c.height=0;}groundCaches[k].clear();}}
  const size = GROUND_CHUNK_TILES * WORLD.tile, cache = groundCaches[kind];
  const cx0=Math.floor(camera.x/size), cx1=Math.floor((camera.x+viewW-.01)/size);
  const cy0=Math.floor(camera.y/size), cy1=Math.floor((camera.y+viewH-.01)/size);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
    const c = getGroundChunk(kind, cx, cy, paintChunk);
    // Snap to whole device pixels so chunk seams never show and the ground does not shimmer while scrolling.
    ctx.drawImage(c, Math.round((cx*size-camera.x)*dpr)/dpr, Math.round((cy*size-camera.y)*dpr)/dpr, c.width/dpr, c.height/dpr);
  }
  ctx.restore();
  // Warm up at most ONE chunk per frame in a one-chunk ring around the view, so scrolling never has to build several at once.
  let built = false;
  for(let cy=cy0-1;cy<=cy1+1&&!built;cy++)for(let cx=cx0-1;cx<=cx1+1&&!built;cx++){
    if(cx<0||cy<0||cx*size>=(kind==="cave"?CAVE.w:WORLD.w)||cy*size>=(kind==="cave"?CAVE.h:WORLD.h))continue;
    if(!cache.has(cx+","+cy)){getGroundChunk(kind, cx, cy, paintChunk);built = true;}
  }
  const maxChunks = (cx1-cx0+3)*(cy1-cy0+3)+2;
  while(cache.size>maxChunks){const oldest=cache.keys().next().value;const o=cache.get(oldest);o.width=o.height=0;cache.delete(oldest);}
}

// ----- forest -----
function paintForestTile(ctx,x,y,px,py,t){
  const h=terrainHash(x,y);
  // Stage 2: the base colour, ridge hills, paver squares and per-tile discs were replaced by paintForestField()/ponds below.
  // Tiny ground grain keeps the grass from reading as a flat repeating grid.
  for(let k=0;k<5;k++){
   const gx=px+4+((x*13+y*7+k*17)%39),gy=py+5+((x*5+y*19+k*11)%37);
   ctx.fillStyle=k%2?"rgba(27,61,35,.22)":"rgba(190,205,119,.18)";
   ctx.fillRect(gx,gy,k%3===0?4:2,1);
  }
  // Tufts, clover and little wildflowers are seeded by tile coordinates.
  if(h>.27&&h<.47){
   ctx.fillStyle="#315f38";ctx.fillRect(px+9,py+23,2,8);ctx.fillRect(px+14,py+19,2,12);ctx.fillRect(px+19,py+24,2,7);
   ctx.fillStyle="#83aa59";ctx.fillRect(px+8,py+21,3,2);ctx.fillRect(px+14,py+17,3,2);ctx.fillRect(px+19,py+22,3,2);
  }
  if((x*7+y*11)%23===0){
   const fx=px+34,fy=py+10;
   ctx.fillStyle="#3d7041";ctx.fillRect(fx+1,fy+3,2,8);
   ctx.fillStyle=(x+y)%2?"#e8d68b":"#df9ba0";ctx.fillRect(fx-2,fy,3,3);ctx.fillRect(fx+2,fy-1,3,3);ctx.fillRect(fx,fy-3,3,3);
   ctx.fillStyle="#fff0c2";ctx.fillRect(fx,fy,2,2);
  }
  if((x*3-y*5)%31===0){ctx.fillStyle="#b9a57c";ctx.fillRect(px+7,py+39,5,3);ctx.fillStyle="#e1d0a9";ctx.fillRect(px+8,py+39,2,1);}
  if((x*11+y*3)%47===0){ctx.fillStyle="#6e4937";ctx.fillRect(px+28,py+34,8,3);ctx.fillStyle="#a17a4c";ctx.fillRect(px+30,py+32,5,2);}
}
function paintForestMounds(ctx,ox,oy,w,h){
 // Broad, soft-edged forest mounds create depth without blocking movement.
 for(let i=0;i<7;i++){
  const wx=360+i*390,wy=300+(i%3)*610,sx=wx-ox,sy=wy-oy;
  if(sx>-260&&sx<w+260&&sy>-160&&sy<h+160){
   ctx.fillStyle="#294f34";ctx.beginPath();ctx.ellipse(sx,sy+8,154,58,.22,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#4c8046";ctx.beginPath();ctx.ellipse(sx-8,sy-5,143,48,.22,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#78a85c";ctx.beginPath();ctx.ellipse(sx-30,sy-20,83,19,.22,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#a0c276";ctx.fillRect(sx-53,sy-25,13,3);ctx.fillRect(sx+19,sy-13,10,2);
  }
 }
}
function paintForestDetailCell(ctx,gx,gy,x,y){
  const h=terrainHash(gx+517,gy+239);
  if(h>.12&&h<.19){
   ctx.fillStyle="rgba(19,39,25,.25)";ctx.beginPath();ctx.ellipse(x+49,y+66,23,7,-.2,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#315f3b";ctx.beginPath();ctx.moveTo(x+27,y+65);ctx.lineTo(x+34,y+43);ctx.lineTo(x+42,y+57);ctx.lineTo(x+49,y+36);ctx.lineTo(x+56,y+58);ctx.lineTo(x+67,y+46);ctx.lineTo(x+72,y+67);ctx.closePath();ctx.fill();
   ctx.fillStyle="#79a95e";ctx.fillRect(x+39,y+53,3,8);ctx.fillRect(x+52,y+48,3,10);ctx.fillRect(x+63,y+57,3,7);
  }else if(h>.31&&h<.36){
   ctx.fillStyle="rgba(27,37,24,.24)";ctx.beginPath();ctx.ellipse(x+48,y+70,28,6,-.15,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#563c2b";ctx.fillRect(x+25,y+58,47,9);ctx.fillStyle="#80583a";ctx.fillRect(x+29,y+56,39,5);
   ctx.fillStyle="#a17a50";ctx.fillRect(x+35,y+57,5,3);ctx.fillRect(x+56,y+57,4,3);
   ctx.fillStyle="#355d37";ctx.fillRect(x+28,y+52,9,5);ctx.fillRect(x+61,y+51,8,6);
  }else if(h>.57&&h<.63){
   ctx.fillStyle="#315f39";ctx.fillRect(x+47,y+55,2,11);ctx.fillRect(x+42,y+60,3,5);ctx.fillRect(x+52,y+60,3,5);
   ctx.fillStyle=h>.6?"#e6c7d1":"#e8d58b";ctx.fillRect(x+44,y+51,4,4);ctx.fillRect(x+49,y+49,4,4);ctx.fillRect(x+48,y+55,3,3);
   ctx.fillStyle="#fff0c1";ctx.fillRect(x+48,y+53,2,2);
  }else if(h>.91){
   ctx.fillStyle="rgba(23,34,21,.24)";ctx.beginPath();ctx.ellipse(x+52,y+69,13,4,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#ead9ad";ctx.fillRect(x+43,y+56,17,12);ctx.fillStyle="#b85f53";ctx.fillRect(x+42,y+53,19,6);
   ctx.fillStyle="#f3d9a4";ctx.fillRect(x+49,y+55,4,3);ctx.fillStyle="#6c4935";ctx.fillRect(x+46,y+66,2,3);
  }
  if((gx*7+gy*13)%17===0){
   ctx.fillStyle="rgba(37,74,42,.38)";ctx.fillRect(x+12,y+77,2,5);ctx.fillRect(x+18,y+73,2,9);ctx.fillRect(x+23,y+78,2,5);
   ctx.fillStyle="#9bb86b";ctx.fillRect(x+11,y+75,3,2);ctx.fillRect(x+17,y+71,3,2);ctx.fillRect(x+22,y+76,3,2);
  }
}
/* ===== Stage 2 — forest ground: continuous pixel-art terrain, dirt patches and real ponds =====
   Decoration only: nothing here is read by gameplay, saving or rand(). All values come from terrainHash(world coords). */
const FIELD_PX = 3;   // one "art pixel" of the terrain = 3 css px, so soft colour zones stay crisp and chunky
const BAYER4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16);
function hexRGB(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
const GRASS_RGB = ["#386637","#426f3e","#4b7d43","#568a4a","#629656"].map(hexRGB);
const DIRT_RGB  = ["#7a6845","#8a7650","#9a8659"].map(hexRGB);
const WATER_RGB = ["#1f5163","#2a6b7c","#4a98a4","#a4cdb8","#33572f"].map(hexRGB);   // deep, mid, shallow, shore, wet-bank
function vnoise(x,y){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=terrainHash(ix,iy),b=terrainHash(ix+1,iy),c=terrainHash(ix,iy+1),d=terrainHash(ix+1,iy+1);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
// One pond per chunk at most, always fully inside its chunk. Never near houses, the river, the cave entrance, the town sign,
// the temple gate, the big mounds, or any tree / rock / bush that makeWorld() already placed.
const FOREST_NO_POND = [[700,520,240],[1900,450,240],[1320,1010,120],[1200,900,130],[2310,900,150],[2080,1450,130],[3000,1710,200]];
const forestPondCache = new Map();
function forestPondForChunk(cx,cy){
  const key=cx+","+cy;
  if(forestPondCache.has(key))return forestPondCache.get(key);
  let pond=null;
  const size=GROUND_CHUNK_TILES*WORLD.tile;
  if(terrainHash(cx+701,cy+903)>.5){
    const rx=42+terrainHash(cx+11,cy+3)*34, ry=rx*(.55+terrainHash(cx+5,cy+17)*.3);
    const ext=Math.max(rx,ry)*1.38+4;
    if(ext*2<size){
      const px=cx*size+ext+terrainHash(cx+41,cy+59)*(size-2*ext), py=cy*size+ext+terrainHash(cx+67,cy+23)*(size-2*ext);
      let ok = px>120&&py>120&&px<WORLD.w-120&&py<WORLD.h-120&&Math.abs(px-2700)>rx*1.4+210;
      for(const z of FOREST_NO_POND){if(Math.hypot(px-z[0],py-z[1])<z[2]+rx)ok=false;}
      for(let i=0;i<7&&ok;i++){const wx=360+i*390,wy=300+(i%3)*610;if(((px-wx)/(154+rx))**2+((py-wy)/(58+ry+10))**2<1)ok=false;}
      for(const r of resources){if(!ok)break;if(((r.x-px)/(rx*1.4+22))**2+((r.y-py)/(ry*1.4+22))**2<1)ok=false;}
      if(ok)pond={x:Math.round(px),y:Math.round(py),rx,ry,seed:cx*31+cy*17};
    }
  }
  forestPondCache.set(key,pond);
  return pond;
}
let fieldCanvas=null,fieldCtx=null,fieldImg=null,fieldN=0;
function paintForestField(g,ox,oy,size,pond){
  const n=size/FIELD_PX;
  if(fieldN!==n){fieldCanvas=document.createElement("canvas");fieldCanvas.width=fieldCanvas.height=n;fieldCtx=fieldCanvas.getContext("2d");fieldImg=fieldCtx.createImageData(n,n);fieldN=n;}
  const d=fieldImg.data;
  for(let ay=0;ay<n;ay++)for(let ax=0;ax<n;ax++){
    const wx=ox+ax*FIELD_PX+1.5,wy=oy+ay*FIELD_PX+1.5,b=BAYER4[(ay&3)*4+(ax&3)];
    // grass: two noise scales -> five greens, ordered-dithered so zones blend like hand-placed pixel art
    const gv=(.6*vnoise(wx/220+11,wy/220+7)+.4*vnoise(wx/64+3,wy/64+29)-.5)*2.3+.5;
    let gi=Math.floor(gv*5+(b-.5)*.9);gi=gi<0?0:gi>4?4:gi;
    let c=GRASS_RGB[gi];
    // organic dirt patches
    if(vnoise(wx/140+53,wy/140+97)+(b-.5)*.09>.7){
      let di=Math.floor(vnoise(wx/22+5,wy/22+9)*3+(b-.5)*.8);di=di<0?0:di>2?2:di;c=DIRT_RGB[di];
    }
    // pond: wobbly outline, depth bands, light shore, dark wet bank
    if(pond){
      const dx=(wx-pond.x)/pond.rx,dy=(wy-pond.y)/pond.ry;
      let dd=Math.sqrt(dx*dx+dy*dy);
      if(dd<1.45){
        dd*=1+.4*(vnoise(wx/20+pond.seed,wy/20+pond.seed*.7)-.5);
        const q=dd+(b-.5)*.07;
        if(q<.5)c=WATER_RGB[0];else if(q<.78)c=WATER_RGB[1];else if(q<.94)c=WATER_RGB[2];else if(q<1.02)c=WATER_RGB[3];else if(q<1.14)c=WATER_RGB[4];
      }
    }
    const o=(ay*n+ax)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;
  }
  fieldCtx.putImageData(fieldImg,0,0);
  g.save();g.imageSmoothingEnabled=false;g.drawImage(fieldCanvas,0,0,size,size);g.restore();
}
function paintPondDecor(ctx,pond,ox,oy){
  const x=pond.x-ox,y=pond.y-oy,s=pond.seed;
  for(let k=0;k<3;k++){   // lily pads
    const a=terrainHash(s+k*7,91)*6.283,r=.15+terrainHash(s+k*13,47)*.3;
    const lx=Math.round(x+Math.cos(a)*pond.rx*r),ly=Math.round(y+Math.sin(a)*pond.ry*r);
    ctx.fillStyle="rgba(8,28,30,.35)";ctx.fillRect(lx-5,ly+3,12,3);
    ctx.fillStyle="#3f8a4b";ctx.fillRect(lx-5,ly-2,11,5);ctx.fillRect(lx-3,ly-3,7,7);
    ctx.fillStyle="#66b45f";ctx.fillRect(lx-3,ly-2,4,2);
    ctx.fillStyle="#2a6b7c";ctx.fillRect(lx+2,ly,3,1);
    if(k===0){ctx.fillStyle="#f2b6c8";ctx.fillRect(lx+1,ly-5,4,3);ctx.fillStyle="#fff0c8";ctx.fillRect(lx+2,ly-4,2,1);}
  }
  for(let k=0;k<7;k++){   // reeds and cattails on the bank
    const a=terrainHash(s+k*5,19)*6.283,bx=Math.round(x+Math.cos(a)*pond.rx*1.1),by=Math.round(y+Math.sin(a)*pond.ry*1.1);
    ctx.fillStyle="rgba(15,35,20,.3)";ctx.fillRect(bx-3,by+1,9,2);
    ctx.fillStyle="#2f5d33";ctx.fillRect(bx,by-10,2,11);ctx.fillRect(bx-3,by-7,2,8);ctx.fillRect(bx+3,by-8,2,9);
    ctx.fillStyle="#8fb860";ctx.fillRect(bx-3,by-8,1,2);ctx.fillRect(bx+3,by-9,1,2);
    if(k%2===0){ctx.fillStyle="#7a5238";ctx.fillRect(bx,by-14,3,5);ctx.fillStyle="#a77b55";ctx.fillRect(bx,by-14,1,5);}
  }
  for(let k=0;k<4;k++){   // shore stones
    const a=terrainHash(s+k*9,63)*6.283,sx=Math.round(x+Math.cos(a)*pond.rx*1.16),sy=Math.round(y+Math.sin(a)*pond.ry*1.16);
    ctx.fillStyle="rgba(10,25,20,.3)";ctx.fillRect(sx-5,sy+2,12,3);
    ctx.fillStyle="#5d6862";ctx.fillRect(sx-4,sy-3,9,6);ctx.fillStyle="#8c978c";ctx.fillRect(sx-3,sy-3,5,2);
  }
}
function paintForestChunk(g,cx,cy,size){
  const t=WORLD.tile,C=GROUND_CHUNK_TILES,x0=cx*C,y0=cy*C,ox=cx*size,oy=cy*size;
  const pond=forestPondForChunk(cx,cy);
  const near=(wx,wy,pad)=>pond&&((wx-pond.x)/(pond.rx*1.45+pad))**2+((wy-pond.y)/(pond.ry*1.45+pad))**2<1;
  paintForestField(g,ox,oy,size,pond);
  // small props never overflow their own tile now, so no neighbour ring is needed; skip anything that would sit in the water
  for(let y=y0;y<y0+C;y++)for(let x=x0;x<x0+C;x++){if(near(x*t+24,y*t+24,20))continue;paintForestTile(g,x,y,(x-x0)*t,(y-y0)*t,t);}
  paintForestMounds(g,ox,oy,size,size);
  if(pond)paintPondDecor(g,pond,ox,oy);
  const cells=size/96;
  for(let j=0;j<cells;j++)for(let i=0;i<cells;i++){if(near(ox+i*96+48,oy+j*96+48,40))continue;paintForestDetailCell(g,ox/96+i,oy/96+j,i*96,j*96);}
}
// Per-frame water life (only for ponds on screen): drifting ripple ring + a few glints. A handful of tiny draws.
function drawForestWaterFx(){
  const size=GROUND_CHUNK_TILES*WORLD.tile;
  const cx0=Math.floor(camera.x/size),cx1=Math.floor((camera.x+viewW)/size),cy0=Math.floor(camera.y/size),cy1=Math.floor((camera.y+viewH)/size);
  for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
    if(cx<0||cy<0)continue;
    const p=forestPondForChunk(cx,cy);if(!p)continue;
    const x=p.x-camera.x,y=p.y-camera.y;
    if(x<-120||x>viewW+120||y<-100||y>viewH+100)continue;
    const rp=(animTime*.35+p.seed*.13)%1;
    ctx.strokeStyle="rgba(190,230,230,"+(.3*(1-rp))+")";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(x-p.rx*.12,y-p.ry*.05,p.rx*(.16+.5*rp),p.ry*(.16+.5*rp),0,0,Math.PI*2);ctx.stroke();
    for(let k=0;k<5;k++){
      const a=Math.sin(animTime*1.1+k*1.9+p.seed);if(a<.35)continue;
      const ang=k*2.4+p.seed,r=.15+.5*terrainHash(p.seed+k,5);
      const gx=Math.round(x+Math.cos(ang)*p.rx*r),gy=Math.round(y+Math.sin(ang)*p.ry*r);
      ctx.fillStyle="rgba(235,252,248,"+(.2+.55*a)+")";ctx.fillRect(gx,gy,k%2?6:4,1);ctx.fillRect(gx+1,gy-1,2,3);
    }
  }
}
function drawGround(){drawGroundChunks("forest",paintForestChunk);}

// ----- cave -----
function paintCaveDetailCell(ctx,gx,gy,x,y){
  const h=terrainHash(gx+191,gy+73);
  if(h>.18&&h<.27){
   ctx.strokeStyle="rgba(116,139,142,.34)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+17,y+18);ctx.lineTo(x+29,y+29);ctx.lineTo(x+25,y+43);ctx.lineTo(x+42,y+58);ctx.stroke();
   ctx.strokeStyle="rgba(17,25,30,.42)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+29,y+29);ctx.lineTo(x+39,y+23);ctx.stroke();
  }
  if(h>.48&&h<.55){
   ctx.fillStyle="#252d32";ctx.fillRect(x+12,y+68,13,5);ctx.fillRect(x+56,y+23,8,4);
   ctx.fillStyle="#687276";ctx.fillRect(x+14,y+66,7,2);ctx.fillRect(x+58,y+21,4,2);
  }
  if(h>.83){
   ctx.fillStyle="rgba(17,28,33,.34)";ctx.beginPath();ctx.ellipse(x+48,y+52,25,8,.08,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#52646a";ctx.fillRect(x+34,y+43,19,8);ctx.fillRect(x+42,y+38,12,7);
   ctx.fillStyle="#87999a";ctx.fillRect(x+39,y+42,7,2);
  }
  if(h<.075){
   const cx=x+24,cy=y+25;
   ctx.save();ctx.globalAlpha=.22;ctx.fillStyle="#54d8df";ctx.beginPath();ctx.arc(cx,cy,32,0,Math.PI*2);ctx.fill();ctx.restore();
   ctx.fillStyle="#286b78";ctx.fillRect(cx-4,cy-12,8,19);ctx.fillRect(cx-10,cy-5,6,12);ctx.fillRect(cx+5,cy-7,6,10);
   ctx.fillStyle="#a4f3e9";ctx.fillRect(cx-2,cy-10,3,12);ctx.fillRect(cx-8,cy-3,2,7);
  }
}
function paintCaveChunk(g,cx,cy,size){
  const t=WORLD.tile,C=GROUND_CHUNK_TILES,x0=cx*C,y0=cy*C,ox=cx*size,oy=cy*size;
  const puddle=cavePuddleForChunk(cx,cy);
  paintCaveField(g,ox,oy,size,puddle);   // Stage 3: flagstone floor, moss and puddles replace the repeating tile blocks
  // layered rock shelves and shadowed ledges
  for(let i=0;i<8;i++){const x=170+i*185,y=180+(i%3)*290,sx=x-ox,sy=y-oy;if(sx>-180&&sx<size+180&&sy>-100&&sy<size+100){g.fillStyle="#20252b";g.beginPath();g.ellipse(sx,sy,105,35,.12,0,Math.PI*2);g.fill();g.fillStyle="#555d63";g.beginPath();g.ellipse(sx-5,sy-10,92,27,.12,0,Math.PI*2);g.fill();g.fillStyle="#858b8b";g.fillRect(sx-35,sy-25,28,5);}}
  g.fillStyle="#17191b";g.fillRect(-ox,-oy,CAVE.w,38);g.fillRect(-ox,CAVE.h-38-oy,CAVE.w,38);g.fillRect(-ox,-oy,38,CAVE.h);g.fillRect(CAVE.w-38-ox,-oy,38,CAVE.h);
  // Mineral seams, floor cracks and small stones
  const cells=size/96;
  // crystal glows spill ~8px outside their 96px cell, so paint one extra ring of cells (the chunk clip trims the rest)
  for(let j=-1;j<=cells;j++)for(let i=-1;i<=cells;i++){if(puddle&&inEllipse(puddle,ox+i*96+48,oy+j*96+48,40))continue;paintCaveDetailCell(g,ox/96+i,oy/96+j,i*96,j*96);}
  // Jagged ceiling formations frame the room without covering its playable floor.
  for(let wx=Math.floor((ox-20)/118)*118;wx<ox+size+20;wx+=118){
    const screenX=wx-ox,h=terrainHash(Math.floor(wx/118)+31,9);
    if(h>.24){
      const len=15+Math.floor(h*30);
      g.fillStyle="#252b30";g.beginPath();g.moveTo(screenX-10,38-oy);g.lineTo(screenX-5,38-oy);g.lineTo(screenX+2,38+len-oy);g.lineTo(screenX+8,38-oy);g.closePath();g.fill();
      g.fillStyle="#687176";g.fillRect(screenX-4,42-oy,2,Math.max(5,len-12));
    }
  }
  // Gentle crystal pools add depth while keeping the cave readable on mobile screens.
  const glows=[[330,390,105,"#3ab9c6"],[1130,720,125,"#56d9d0"],[1450,1030,95,"#5c9ec7"],[650,120,85,"#4b9da9"]];
  for(const gl of glows){
    const x=gl[0]-ox,y=gl[1]-oy;
    if(x<-gl[2]||x>size+gl[2]||y<-gl[2]||y>size+gl[2])continue;
    const grad=g.createRadialGradient(x,y,4,x,y,gl[2]);grad.addColorStop(0,gl[3]+"30");grad.addColorStop(1,gl[3]+"00");
    g.fillStyle=grad;g.fillRect(x-gl[2],y-gl[2],gl[2]*2,gl[2]*2);
  }
}
function drawCaveGround(){
  drawGroundChunks("cave",paintCaveChunk);
  drawCaveWaterFx();
  ctx.fillStyle="#e0c58a";ctx.font="bold 15px Tahoma";ctx.fillText("غار جنگلی • تالار کریستال",CAVE.w/2-camera.x,75-camera.y);
}
function drawCaveDetails(){}   // Stage 1: cave details are now part of the cached ground chunks
function drawCaveObjects(){
 for(const c of caveChests){let x=c.x-camera.x,y=c.y-camera.y;ctx.fillStyle=c.opened?"#59452d":"#a66a32";ctx.fillRect(x-17,y-12,34,24);ctx.fillStyle=c.opened?"#76634b":"#e5b75b";ctx.fillRect(x-17,y-12,34,7);}
 const x=800-camera.x,y=1080-camera.y;
 ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(x,y+28,58,13,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#343a3d";ctx.fillRect(x-43,y-58,86,84);ctx.fillStyle="#87908b";ctx.fillRect(x-37,y-53,74,73);
 ctx.fillStyle="#4a3830";ctx.fillRect(x-29,y-47,58,67);ctx.fillStyle="#171b1d";ctx.fillRect(x-23,y-40,46,60);
 ctx.fillStyle="#b5a078";ctx.fillRect(x-33,y-61,66,8);ctx.fillRect(x-46,y-55,10,79);ctx.fillRect(x+36,y-55,10,79);
 ctx.fillStyle="#d6bd82";ctx.fillRect(x-17,y-34,34,3);ctx.fillRect(x-17,y-34,3,45);ctx.fillRect(x+14,y-34,3,45);
 ctx.fillStyle="#e5c887";ctx.beginPath();ctx.arc(x+13,y-3,3,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#fff0c2";ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.fillText("در خروج",x,y-73);ctx.textAlign="start";
}
function drawHouse(x,y,level,isSaman){
 const sx=x-camera.x,sy=y-camera.y;
 ctx.fillStyle="rgba(18,27,20,.32)";ctx.beginPath();ctx.ellipse(sx,sy+27,82,14,0,0,Math.PI*2);ctx.fill();
 if(!isSaman&&level===0){
  ctx.fillStyle="#715337";ctx.fillRect(sx-58,sy+8,116,9);ctx.fillStyle="#b99a68";ctx.fillRect(sx-51,sy-10,102,18);ctx.fillStyle="#493626";ctx.fillRect(sx-13,sy-26,26,18);
  ctx.fillStyle="#f0d99b";ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.fillText("زمین خانه",sx,sy-37);ctx.textAlign="start";return;
 }
 const scale=isSaman?1:1+(level-1)*.12,w=118*scale,h=74*scale;
 // adobe walls, timber framing and shaded lower edge
 ctx.fillStyle="#68462f";ctx.fillRect(sx-w/2,sy-h/2,w,h);
 ctx.fillStyle="#b77c4b";ctx.fillRect(sx-w/2+4,sy-h/2+5,w-8,h-12);
 ctx.fillStyle="#9a613b";ctx.fillRect(sx-w/2+4,sy+17,w-8,8);
 ctx.fillStyle="#d49a5d";ctx.beginPath();ctx.moveTo(sx-w/2-13,sy-h/2+4);ctx.lineTo(sx,sy-h/2-34);ctx.lineTo(sx+w/2+13,sy-h/2+4);ctx.lineTo(sx+w/2+6,sy-h/2+14);ctx.lineTo(sx-w/2-6,sy-h/2+14);ctx.closePath();ctx.fill();
 ctx.fillStyle="#77452f";ctx.beginPath();ctx.moveTo(sx-w/2-8,sy-h/2+3);ctx.lineTo(sx,sy-h/2-27);ctx.lineTo(sx+w/2+8,sy-h/2+3);ctx.closePath();ctx.fill();
 ctx.fillStyle="#c88b51";ctx.beginPath();ctx.moveTo(sx-w/2+5,sy-h/2+2);ctx.lineTo(sx,sy-h/2-22);ctx.lineTo(sx+w/2-5,sy-h/2+2);ctx.closePath();ctx.fill();
 ctx.fillStyle="#70452f";ctx.fillRect(sx-w/2+13,sy-h/2+18,18,18);ctx.fillRect(sx+w/2-31,sy-h/2+18,18,18);
 ctx.fillStyle="#a8d0c6";ctx.fillRect(sx-w/2+16,sy-h/2+21,12,12);ctx.fillRect(sx+w/2-28,sy-h/2+21,12,12);
 ctx.strokeStyle="#e7d3a4";ctx.lineWidth=2;ctx.strokeRect(sx-w/2+13,sy-h/2+18,18,18);ctx.strokeRect(sx+w/2-31,sy-h/2+18,18,18);
 ctx.fillStyle="#4b3021";ctx.fillRect(sx-13,sy+1,26,36);ctx.fillStyle="#c18a50";ctx.fillRect(sx+6,sy+17,3,3);
 ctx.fillStyle="#583b2b";ctx.fillRect(sx+w/2-20,sy-h/2-43,12,26);ctx.fillStyle="#d5a16a";ctx.fillRect(sx+w/2-22,sy-h/2-45,16,5);
 ctx.fillStyle="#fff0c2";ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.fillText(isSaman?"کلبه سامان":(level===1?"خانه من":level===2?"خانه بزرگ من":"خانه لوکس من"),sx,sy-h/2-53);ctx.textAlign="start";
 if(level>=2||isSaman){ctx.fillStyle="#d8c28a";ctx.fillRect(sx-68,sy+40,136,5);ctx.fillStyle="#4d8b4b";ctx.fillRect(sx-58,sy+45,13,9);ctx.fillRect(sx+45,sy+45,13,9);}
 if(!isSaman&&level>=3){ctx.fillStyle="#e9cf76";ctx.fillRect(sx-3,sy-h/2-30,6,6);ctx.fillStyle="#6c9a55";ctx.fillRect(sx-82,sy+12,13,22);ctx.fillRect(sx+69,sy+12,13,22);}
}

function drawStations(){
 const sx=playerHome.x-camera.x,sy=playerHome.y-camera.y;
 if(stations.workbench){const x=sx-108,y=sy+104;ctx.fillStyle="#33271d";ctx.fillRect(x-30,y+8,60,8);ctx.fillStyle="#9b693b";ctx.fillRect(x-34,y-7,68,17);ctx.fillStyle="#d4a568";ctx.fillRect(x-29,y-10,58,5);ctx.fillStyle="#6b492d";ctx.fillRect(x-25,y+17,6,16);ctx.fillRect(x+19,y+17,6,16);ctx.fillStyle="#c6c7b8";ctx.fillRect(x+9,y-17,13,7);}
 if(stations.sawmill){const x=sx+8,y=sy+145;ctx.fillStyle="#45301f";ctx.fillRect(x-34,y-8,68,24);ctx.fillStyle="#a77743";ctx.fillRect(x-30,y-15,60,9);ctx.fillStyle="#d4b17a";ctx.fillRect(x-26,y-22,52,5);ctx.fillStyle="#59666a";ctx.fillRect(x-3,y-30,6,16);ctx.fillStyle="#d6d9d1";ctx.fillRect(x-1,y-33,2,22);}
 if(stations.furnace){const x=sx+112,y=sy+104;ctx.fillStyle="#3b3430";ctx.fillRect(x-25,y-26,50,50);ctx.fillStyle="#85523a";ctx.fillRect(x-20,y-22,40,40);ctx.fillStyle="#2b2422";ctx.fillRect(x-12,y-8,24,24);ctx.fillStyle="#ff9a42";ctx.fillRect(x-8,y+2,16,10);ctx.fillStyle="#ffd36c";ctx.fillRect(x-4,y-3,8,7);ctx.fillStyle="#5b5149";ctx.fillRect(x-8,y-35,16,8);}
}
function drawInterior() {
  ctx.fillStyle="#69472f"; ctx.fillRect(0,0,viewW,viewH);
  const ox=(viewW- Math.min(viewW-24,760))/2, oy= Math.max(35,(viewH-520)/2), w=Math.min(viewW-24,760), h=Math.min(viewH-80,520);
  ctx.fillStyle="#b98250"; ctx.fillRect(ox,oy,w,h);
  ctx.fillStyle="#d5a66d"; ctx.fillRect(ox+12,oy+12,w-24,h-24);  ctx.fillStyle="#7b5134"; ctx.fillRect(ox+18,oy+18,w-36,h-36);
  for(let x=ox+28;x<ox+w-28;x+=42){ctx.fillStyle="#96663e";ctx.fillRect(x,oy+24,3,h-48);}
  ctx.fillStyle="#e2bd82";ctx.fillRect(ox+28,oy+28,w-56,38);
  ctx.fillStyle="#6c432b";ctx.fillRect(ox+45,oy+88,Math.min(170,w*.28),78);
  ctx.fillStyle="#c28a56";ctx.fillRect(ox+54,oy+96,Math.min(152,w*.28-18),62);
  ctx.fillStyle="#e9d8aa";ctx.fillRect(ox+65,oy+101,Math.min(130,w*.28-35),25);
  ctx.fillStyle="#6e4830";ctx.fillRect(ox+w-180,oy+100,120,62);
  ctx.fillStyle="#b7864e";ctx.fillRect(ox+w-174,oy+106,108,10);
  ctx.fillStyle="#d9bd80";ctx.fillRect(ox+w-158,oy+162,78,9);
  ctx.fillStyle="#d1a45e";ctx.fillRect(ox+w/2-32,oy+h-94,64,46);
  ctx.fillStyle="#f2d78e";ctx.fillRect(ox+w/2-21,oy+h-84,42,27);
  if(homeLevel>=2){ctx.fillStyle="#a7c7d0";ctx.fillRect(ox+w-90,oy+215,42,58);ctx.fillStyle="#e4c276";ctx.fillRect(ox+65,oy+215,58,35);}
  if(homeLevel>=3){ctx.fillStyle="#d6bd8d";ctx.fillRect(ox+w/2-65,oy+190,130,28);ctx.fillStyle="#8e6844";ctx.fillRect(ox+w/2-58,oy+196,116,16);}
   if(furnitureOwned.bed){ctx.fillStyle="#65452f";ctx.fillRect(ox+65,oy+h-150,110,48);ctx.fillStyle="#e8d6b4";ctx.fillRect(ox+70,oy+h-145,100,25);ctx.fillStyle="#9a6a49";ctx.fillRect(ox+70,oy+h-120,100,15);}
   if(furnitureOwned.table){ctx.fillStyle="#6f492c";ctx.fillRect(ox+w-180,oy+h-160,85,12);ctx.fillRect(ox+w-174,oy+h-148,7,28);ctx.fillRect(ox+w-110,oy+h-148,7,28);}
   if(furnitureOwned.chair){ctx.fillStyle="#875b36";ctx.fillRect(ox+w-235,oy+h-145,35,8);ctx.fillRect(ox+w-235,oy+h-175,7,34);ctx.fillRect(ox+w-232,oy+h-137,5,18);ctx.fillRect(ox+w-207,oy+h-137,5,18);}
  ctx.fillStyle="#fff0c2";ctx.font="bold 16px Tahoma";ctx.textAlign="center";ctx.fillText("خانه من",viewW/2,oy-8);ctx.textAlign="start";
  ctx.fillStyle="#f0d18c";ctx.fillRect(viewW/2-32,oy+h-18,64,18);
}
function terrainHash(x,y){let n=(x*374761393+y*668265263)>>>0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;}
// Stage 1: forest ground + details are painted by paintForestChunk (see "cached ground layer" above)
function drawTree(r) {
 const x=r.x-camera.x,y=r.y-camera.y;
 // A grounded trunk and roots, with a layered, pixel-cut canopy.
 ctx.fillStyle="rgba(16,31,19,.36)";ctx.beginPath();ctx.ellipse(x+4,y+18,37,11,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#382c22";ctx.beginPath();ctx.moveTo(x-8,y+12);ctx.lineTo(x-6,y-17);ctx.lineTo(x-3,y-30);ctx.lineTo(x+7,y-30);ctx.lineTo(x+9,y+12);ctx.closePath();ctx.fill();
 ctx.fillStyle="#795238";ctx.fillRect(x-4,y-22,5,36);ctx.fillStyle="#a17a4d";ctx.fillRect(x+2,y-18,2,27);
 ctx.fillStyle="#4b3526";ctx.fillRect(x-15,y+9,11,4);ctx.fillRect(x+5,y+10,13,4);
 // Deep silhouette.
 ctx.fillStyle="#1e492f";ctx.beginPath();ctx.moveTo(x-38,y-14);ctx.lineTo(x-34,y-39);ctx.lineTo(x-20,y-56);ctx.lineTo(x-5,y-65);ctx.lineTo(x+17,y-59);ctx.lineTo(x+34,y-43);ctx.lineTo(x+39,y-20);ctx.lineTo(x+28,y-4);ctx.lineTo(x-29,y-3);ctx.closePath();ctx.fill();
 // Mid foliage planes.
 ctx.fillStyle="#2b6139";ctx.beginPath();ctx.moveTo(x-32,y-20);ctx.lineTo(x-29,y-42);ctx.lineTo(x-12,y-57);ctx.lineTo(x+5,y-60);ctx.lineTo(x+27,y-44);ctx.lineTo(x+32,y-22);ctx.lineTo(x+19,y-8);ctx.lineTo(x-24,y-8);ctx.closePath();ctx.fill();
 ctx.fillStyle="#397a45";ctx.beginPath();ctx.moveTo(x-20,y-35);ctx.lineTo(x-15,y-54);ctx.lineTo(x+1,y-65);ctx.lineTo(x+19,y-54);ctx.lineTo(x+27,y-36);ctx.lineTo(x+14,y-20);ctx.lineTo(x-13,y-19);ctx.closePath();ctx.fill();
 // Pixel highlights and leaf clusters.
 const leaves=[[-22,-43,8,5,"#5b944e"],[-7,-55,9,4,"#78a95b"],[10,-48,8,5,"#6ca052"],[22,-34,7,4,"#8ab965"],[-27,-23,7,4,"#4f8948"],[1,-30,9,4,"#75a957"],[16,-17,7,4,"#5e984d"],[-10,-16,8,3,"#80ad5b"]];
 for(const a of leaves){ctx.fillStyle=a[4];ctx.fillRect(x+a[0],y+a[1],a[2],a[3]);}
 ctx.fillStyle="#b2c978";ctx.fillRect(x-11,y-60,4,2);ctx.fillRect(x+5,y-52,5,2);ctx.fillRect(x+25,y-38,3,2);
 ctx.fillStyle="#244f32";ctx.fillRect(x-32,y-35,4,9);ctx.fillRect(x+29,y-29,4,8);
}
function drawFiberBush(r){
 const x=r.x-camera.x,y=r.y-camera.y;ctx.fillStyle="rgba(12,25,17,.3)";ctx.beginPath();ctx.ellipse(x,y+9,23,7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#345a35";ctx.beginPath();ctx.arc(x-9,y-5,12,0,Math.PI*2);ctx.arc(x+5,y-10,14,0,Math.PI*2);ctx.arc(x+14,y,10,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#6f9c55";ctx.fillRect(x-12,y-10,7,4);ctx.fillRect(x+1,y-16,7,4);ctx.fillRect(x+10,y-4,6,4);
 ctx.fillStyle="#d8c28a";ctx.fillRect(x-5,y-2,3,5);ctx.fillRect(x+6,y+1,3,4);
}
function drawSandPile(r){
 const x=r.x-camera.x,y=r.y-camera.y;ctx.fillStyle="rgba(31,26,17,.22)";ctx.beginPath();ctx.ellipse(x,y+9,25,7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#b99b64";ctx.beginPath();ctx.moveTo(x-24,y+7);ctx.lineTo(x-15,y-7);ctx.lineTo(x-3,y-14);ctx.lineTo(x+13,y-10);ctx.lineTo(x+24,y+7);ctx.closePath();ctx.fill();
 ctx.fillStyle="#e0c58a";ctx.fillRect(x-11,y-7,9,3);ctx.fillRect(x+5,y-4,10,3);ctx.fillStyle="#8c754c";ctx.fillRect(x-19,y+3,31,3);
}
function drawMarbleNode(r){
 drawRock(r);const x=r.x-camera.x,y=r.y-camera.y;ctx.fillStyle="#e8e5d9";ctx.fillRect(x-10,y-13,16,8);ctx.fillRect(x-4,y-19,8,5);ctx.fillStyle="#b9c4c1";ctx.fillRect(x-8,y-11,4,3);ctx.fillRect(x+3,y-17,3,3);ctx.fillStyle="#fff";ctx.fillRect(x-6,y-12,7,2);
}
function drawRock(r) {
 const x=r.x-camera.x,y=r.y-camera.y;
 ctx.fillStyle="rgba(15,22,22,.32)";ctx.beginPath();ctx.ellipse(x+3,y+13,25,8,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#333d3b";ctx.beginPath();ctx.moveTo(x-23,y+9);ctx.lineTo(x-20,y-5);ctx.lineTo(x-10,y-17);ctx.lineTo(x+4,y-22);ctx.lineTo(x+18,y-13);ctx.lineTo(x+24,y+1);ctx.lineTo(x+17,y+11);ctx.closePath();ctx.fill();
 ctx.fillStyle="#69756d";ctx.beginPath();ctx.moveTo(x-17,y-5);ctx.lineTo(x-9,y-16);ctx.lineTo(x+3,y-19);ctx.lineTo(x+1,y-7);ctx.lineTo(x-8,y+1);ctx.closePath();ctx.fill();
 ctx.fillStyle="#a2aa94";ctx.beginPath();ctx.moveTo(x-7,y-15);ctx.lineTo(x+4,y-19);ctx.lineTo(x+14,y-11);ctx.lineTo(x+5,y-7);ctx.closePath();ctx.fill();
 ctx.fillStyle="#c2c6a9";ctx.fillRect(x-5,y-15,6,2);ctx.fillRect(x-14,y-5,4,2);
 ctx.fillStyle="#252f2e";ctx.fillRect(x+10,y-2,8,8);ctx.fillRect(x-18,y+5,8,3);
 ctx.fillStyle="#477b48";ctx.fillRect(x-18,y-9,5,3);ctx.fillRect(x+9,y-17,5,2);
}
function drawIron(r) {
 drawRock(r);const x=r.x-camera.x,y=r.y-camera.y;
 ctx.fillStyle="#9b593e";ctx.fillRect(x-7,y-6,6,5);ctx.fillRect(x+5,y+1,7,5);
 ctx.fillStyle="#e0a06b";ctx.fillRect(x-6,y-7,3,3);ctx.fillRect(x+7,y,3,3);
 ctx.fillStyle="#5a3b35";ctx.fillRect(x-1,y-2,4,8);
}

function drawSlime(e) {
 const x=e.x-camera.x,y=e.y-camera.y,b=Math.sin(animTime*4.4+e.spawnX*.01)*1.6;
 ctx.fillStyle="rgba(10,28,19,.32)";ctx.beginPath();ctx.ellipse(x,y+10,21,7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#244b36";ctx.beginPath();ctx.moveTo(x-20,y+4);ctx.quadraticCurveTo(x-23,y-14+b,x-9,y-18+b);ctx.quadraticCurveTo(x,y-27+b,x+12,y-16+b);ctx.quadraticCurveTo(x+24,y-10+b,x+19,y+5);ctx.closePath();ctx.fill();
 ctx.fillStyle="#5c9c55";ctx.beginPath();ctx.moveTo(x-17,y+2);ctx.quadraticCurveTo(x-18,y-12+b,x-7,y-15+b);ctx.quadraticCurveTo(x+1,y-23+b,x+11,y-13+b);ctx.quadraticCurveTo(x+20,y-8+b,x+15,y+2);ctx.closePath();ctx.fill();
 ctx.fillStyle="#9dce78";ctx.fillRect(x-9,y-14+b,8,4);ctx.fillRect(x+3,y-17+b,6,3);
 ctx.fillStyle="#e7ead4";ctx.fillRect(x-9,y-5+b,5,6);ctx.fillRect(x+5,y-5+b,5,6);
 ctx.fillStyle="#26342b";ctx.fillRect(x-7,y-3+b,3,4);ctx.fillRect(x+7,y-3+b,3,4);
 ctx.fillStyle="#345e3c";ctx.fillRect(x-16,y+7,8,3);ctx.fillRect(x+9,y+7,8,3);
 ctx.fillStyle="#263d2e";ctx.fillRect(x-19,y-29,38,5);ctx.fillStyle="#e3c56d";ctx.fillRect(x-19,y-29,38*(e.hp/e.max),5);
}

function drawCrystalGuardian(e) {
  const x=e.x-camera.x,y=e.y-camera.y;
  const hover = Math.sin(animTime * 2.2) * 2.5;
  ctx.fillStyle="#182b39";ctx.fillRect(x-24,y+13,48,8);
  ctx.fillStyle="#536b86";ctx.fillRect(x-22,y-12+hover,44,28);ctx.fillRect(x-16,y-22+hover,32,12);
  ctx.fillStyle="#78dce8";ctx.fillRect(x-15,y-28,10,17);ctx.fillRect(x+5,y-25,10,14);ctx.fillRect(x-5,y-39,10,16);
  ctx.fillStyle="#b5f6ff";ctx.fillRect(x-11,y-8,6,6);ctx.fillRect(x+6,y-8,6,6);
  ctx.fillStyle="#17232e";ctx.fillRect(x-24,y-49,48,5);
  ctx.fillStyle="#55d9e8";ctx.fillRect(x-24,y-49,48*(e.hp/e.max),5);
}
function drawForestNpc() {
 const x=forestNpc.x-camera.x,y=forestNpc.y-camera.y;
 const near=Math.hypot(player.x-forestNpc.x,player.y-forestNpc.y)<145;
 if(x< -70||x>viewW+70||y< -90||y>viewH+70)return;
 drawPixelPerson(x,y+39,{hair:"#d8d4c9",hairHi:"#fff3d6",skin:"#c99475",skinLight:"#edc2a2",top:"#687653",topHi:"#aab78a",bottom:"#514a3b",boots:"#302d29",accent:"#d1b77e"},{step:forestNpc.walking?Math.sin(animTime*11)*2.1:Math.sin(animTime*2.2)*.35,armSwing:forestNpc.walking?Math.sin(animTime*11)*.34:Math.sin(animTime*1.7)*.025,bob:forestNpc.walking?Math.abs(Math.sin(animTime*11))*.8:Math.sin(animTime*2.4)*.6,facing:forestNpc.facing||"down",scale:.82,beard:true,beardColor:"#eee9dc",old:true});
 if(!npcQuest.claimed){ctx.fillStyle="#ffe58a";ctx.font="bold 17px Tahoma";ctx.textAlign="center";ctx.fillText("!",x,y-57);}
 ctx.fillStyle="#fff2c7";ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#34432e";ctx.strokeText(forestNpc.name+" • "+forestNpc.role,x,y-47);ctx.fillText(forestNpc.name+" • "+forestNpc.role,x,y-47);ctx.textAlign="start";
}

function drawPixelPerson(x,base,p,opts={}){
 const step=opts.step||0,bob=opts.bob||0,scale=opts.scale||1;
 ctx.save();ctx.translate(x,base);ctx.scale(scale,scale);x=0;base=0;
 ctx.fillStyle="rgba(14,20,17,.34)";ctx.beginPath();ctx.ellipse(x,base+1,13,4.5,0,0,Math.PI*2);ctx.fill();
 // legs, boots and small alternating stride
 ctx.fillStyle=p.bottom;ctx.fillRect(x-7,base-19+step,6,16);ctx.fillRect(x+1,base-19-step,6,16);
 ctx.fillStyle=p.boots;ctx.fillRect(x-9,base-5+step,9,5);ctx.fillRect(x+1,base-5-step,10,5);
 ctx.fillStyle="#77736a";ctx.fillRect(x-8,base-2+step,6,1);ctx.fillRect(x+2,base-2-step,6,1);
 // torso silhouette and sleeves
 ctx.fillStyle=p.top;ctx.beginPath();ctx.moveTo(x-8,base-46+bob);ctx.lineTo(x+8,base-46+bob);ctx.lineTo(x+12,base-21+bob);ctx.lineTo(x+8,base-17+bob);ctx.lineTo(x-8,base-17+bob);ctx.lineTo(x-12,base-21+bob);ctx.closePath();ctx.fill();
 ctx.fillStyle=p.topHi;ctx.fillRect(x-7,base-44+bob,14,3);ctx.fillRect(x-10,base-38+bob,3,13);ctx.fillRect(x+7,base-38+bob,3,13);
 const armSwing=opts.armSwing||0;
 ctx.save();ctx.translate(x-10,base-37+bob);ctx.rotate(armSwing);
 ctx.fillStyle=p.top;ctx.fillRect(-3,0,5,14);ctx.fillStyle=p.skin;ctx.fillRect(-3,12,5,7);ctx.restore();
 ctx.save();ctx.translate(x+10,base-37+bob);ctx.rotate(-armSwing);
 ctx.fillStyle=p.top;ctx.fillRect(-2,0,5,14);ctx.fillStyle=p.skin;ctx.fillRect(-2,12,5,7);ctx.restore();
 // seams, belt and small fabric highlights
 ctx.fillStyle=p.accent;ctx.fillRect(x-1,base-42+bob,2,12);ctx.fillRect(x-8,base-20+bob,16,2);
 ctx.fillStyle="rgba(20,27,25,.28)";ctx.fillRect(x-7,base-31+bob,2,8);ctx.fillRect(x+5,base-31+bob,2,8);
 // neck and face
 ctx.fillStyle=p.skin;ctx.fillRect(x-4,base-51+bob,8,7);
 ctx.fillStyle=p.skinLight||"#efc3a0";ctx.beginPath();ctx.roundRect(x-9,base-70+bob,18,20,4);ctx.fill();
 ctx.fillStyle=p.skin;ctx.fillRect(x-10,base-62+bob,2,6);ctx.fillRect(x+8,base-62+bob,2,6);
 // hair cap, fringe and side locks
 ctx.fillStyle=p.hair;ctx.beginPath();ctx.moveTo(x-10,base-60+bob);ctx.lineTo(x-10,base-68+bob);ctx.lineTo(x-5,base-74+bob);ctx.lineTo(x+5,base-74+bob);ctx.lineTo(x+11,base-68+bob);ctx.lineTo(x+10,base-57+bob);ctx.lineTo(x+6,base-63+bob);ctx.lineTo(x-4,base-62+bob);ctx.closePath();ctx.fill();
 ctx.fillStyle=p.hairHi||"#9a7658";ctx.fillRect(x-6,base-70+bob,5,2);ctx.fillRect(x+2,base-72+bob,4,2);
 ctx.fillStyle=p.hair;ctx.fillRect(x-10,base-63+bob,3,9);ctx.fillRect(x+7,base-63+bob,3,8);
 if(opts.longHair){ctx.fillRect(x-11,base-59+bob,3,17);ctx.fillRect(x+8,base-59+bob,3,16);}
 // Direction-aware eyes: side views show one centered eye, never a stray highlight.
 const eyeY=base-61+bob;
 if(opts.facing==="left"){ctx.fillStyle="#fff0d9";ctx.fillRect(x-6,eyeY,4,3);ctx.fillStyle="#49352f";ctx.fillRect(x-6,eyeY,2,3);ctx.fillStyle="#2c2522";ctx.fillRect(x-6,eyeY,1,2);}
 else if(opts.facing==="right"){ctx.fillStyle="#fff0d9";ctx.fillRect(x+2,eyeY,4,3);ctx.fillStyle="#49352f";ctx.fillRect(x+4,eyeY,2,3);ctx.fillStyle="#2c2522";ctx.fillRect(x+5,eyeY,1,2);}
 else{ctx.fillStyle="#49352f";ctx.fillRect(x-6,eyeY,2,2);ctx.fillRect(x+4,eyeY,2,2);ctx.fillStyle="#fff0d9";ctx.fillRect(x-6,eyeY,1,1);ctx.fillRect(x+4,eyeY,1,1);}
 ctx.fillStyle="#b77d65";ctx.fillRect(x-1,base-57+bob,2,2);ctx.fillStyle="#8f5552";ctx.fillRect(x-2,base-53+bob,4,1);
 if(opts.beard){
   const beard=opts.beardColor||p.hair;
   ctx.fillStyle=beard;ctx.fillRect(x-7,base-55+bob,14,5);ctx.fillRect(x-9,base-58+bob,4,6);ctx.fillRect(x+6,base-58+bob,4,6);ctx.fillRect(x-6,base-50+bob,12,4);ctx.fillRect(x-4,base-46+bob,8,3);
   ctx.fillStyle="rgba(255,255,245,.7)";ctx.fillRect(x-5,base-54+bob,3,2);ctx.fillRect(x+2,base-49+bob,3,2);
 }
 if(opts.old){
   ctx.fillStyle="#9c715f";ctx.fillRect(x-7,base-59+bob,3,1);ctx.fillRect(x+4,base-59+bob,3,1);ctx.fillRect(x-2,base-55+bob,4,1);
   ctx.fillStyle="#eee6d8";ctx.fillRect(x-7,base-72+bob,5,2);ctx.fillRect(x+2,base-72+bob,5,2);
 }
 ctx.restore();
}
function drawPlayer(){
 const x=player.x-camera.x,y=player.y-camera.y;
 const leg=playerMoving?Math.sin(animTime*13)*3.2:0;
 const actionPhase=playerActionTimer>0?1-playerActionTimer/playerActionDuration:0;
 const actionSwing=playerActionTimer>0?Math.sin(actionPhase*Math.PI):0;
 const idleBreath=Math.sin(animTime*1.8)*.45;
 const armSwing=playerActionTimer>0?actionSwing*(playerActionType==="attack"?1.12:.82):playerMoving?Math.sin(animTime*13)*.48:idleBreath*.08;
 drawPixelPerson(x,y+36,{hair:"#50382a",hairHi:"#98704f",skin:"#d7a17e",skinLight:"#f0c5a2",top:"#294967",topHi:"#5e8caf",bottom:"#393c46",boots:"#252b34",accent:"#d8c49a"},{step:leg,armSwing,bob:playerMoving?Math.abs(Math.sin(animTime*13))*1.2:idleBreath,facing:playerFacing,scale:.82});
 // Visible armor is drawn over the base outfit and follows the player animation.
 const armor=player.armorLevel||0;
 if(armor>0){
   const bob=playerMoving?Math.abs(Math.sin(animTime*13))*1.2:Math.sin(animTime*2.4)*.35;
   const by=y+36+bob;
   ctx.save();ctx.translate(x,by);ctx.scale(.82,.82);const ax=0,ay=0;
   if(armor===1){
     // Iron cuirass, shoulder guards and bracers.
     ctx.fillStyle="#58636d";ctx.fillRect(ax-9,ay-44,18,23);
     ctx.fillStyle="#aeb9c1";ctx.fillRect(ax-7,ay-43,14,3);ctx.fillRect(ax-7,ay-37,14,2);
     ctx.fillStyle="#77838d";ctx.fillRect(ax-10,ay-40,4,10);ctx.fillRect(ax+6,ay-40,4,10);
     ctx.fillStyle="#c7d0d5";ctx.fillRect(ax-12,ay-40,5,5);ctx.fillRect(ax+7,ay-40,5,5);
     ctx.fillStyle="#3d4851";ctx.fillRect(ax-8,ay-22,16,3);
     ctx.fillStyle="#d2b66e";ctx.fillRect(ax-2,ay-22,4,3);
   }else{
     // Crystal armor: bright cyan plates with a faceted chest gem.
     ctx.fillStyle="#236d83";ctx.fillRect(ax-10,ay-44,20,23);
     ctx.fillStyle="#58d4df";ctx.fillRect(ax-7,ay-43,14,3);ctx.fillRect(ax-7,ay-37,3,12);ctx.fillRect(ax+4,ay-37,3,12);
     ctx.fillStyle="#83f4ec";ctx.fillRect(ax-12,ay-41,5,6);ctx.fillRect(ax+7,ay-41,5,6);
     ctx.fillStyle="#17485e";ctx.fillRect(ax-8,ay-23,16,4);
     ctx.fillStyle="#d5ffff";ctx.beginPath();ctx.moveTo(ax,ay-39);ctx.lineTo(ax+4,ay-34);ctx.lineTo(ax,ay-29);ctx.lineTo(ax-4,ay-34);ctx.closePath();ctx.fill();
     ctx.fillStyle="#3c9caf";ctx.fillRect(ax-2,ay-35,2,2);
   }
   ctx.restore();
 }
 const tool=TOOL_INFO[selectedTool];
 if(tool){ctx.save();ctx.font="16px Tahoma";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(tool.icon,x+(playerFacing==="left"?-17:17),y+3);ctx.restore();}
 if(attackFlash>0){ctx.save();ctx.translate(x,y);ctx.scale(.82,.82);ctx.strokeStyle="#fff0a8";ctx.lineWidth=3;ctx.beginPath();const a=playerFacing==="left"?Math.PI:playerFacing==="up"?-Math.PI/2:playerFacing==="down"?Math.PI/2:0;ctx.arc(0,0,39,a-.75,a+.75);ctx.stroke();ctx.restore();}
}

function nightStrength(){const h=worldClock/60;const dusk=h>=18&&h<21?(h-18)/3:h>=21||h<5?1:h>=5&&h<7?(7-h)/2:0;return Math.max(0,Math.min(.68,dusk*.68));}
/* ===== Stage 3 — lighting, night cycle, cave floor and particles =====
   Visual only. Reads worldClock / positions / flags, never writes them. Cosmetic randomness uses Math.random only; the seeded world generator is never touched. */
function smooth01(t){t=t<0?0:t>1?1:t;return t*t*(3-2*t);}
function inEllipse(p,wx,wy,pad){return ((wx-p.x)/(p.rx*1.45+pad))**2+((wy-p.y)/(p.ry*1.45+pad))**2<1;}

// ---- Sky tint over 24h: [hour, r, g, b, darkness]. Smoothstep between keys = no visible steps, golden dusk and pink dawn.
const AMBIENT_KEYS=[[0,10,18,39,.68],[5,10,18,39,.68],[6.2,86,58,96,.40],[7.4,255,196,140,.07],[8.4,255,230,190,0],[16.5,255,225,170,0],[17.8,255,176,106,.09],[19,122,62,86,.32],[20.4,36,30,70,.55],[21.6,10,18,39,.68],[24,10,18,39,.68]];
const AMB={r:10,g:18,b:39,a:0};
const CAVE_AMB={r:7,g:12,b:22,a:.52};
function computeAmbient(){
  const h=(((worldClock/60)%24)+24)%24;
  let k=1;while(k<AMBIENT_KEYS.length-1&&h>AMBIENT_KEYS[k][0])k++;
  const a=AMBIENT_KEYS[k-1],b=AMBIENT_KEYS[k],t=smooth01((h-a[0])/(b[0]-a[0]));
  AMB.r=Math.round(a[1]+(b[1]-a[1])*t);AMB.g=Math.round(a[2]+(b[2]-a[2])*t);AMB.b=Math.round(a[3]+(b[3]-a[3])*t);AMB.a=a[4]+(b[4]-a[4])*t;
  return AMB;
}

// ---- Light layer: darkness is built on a tiny (1/4 size) canvas, light holes are cut with a pre-rendered soft sprite, then it is drawn once.
const LIGHT_SCALE=3;
const LIGHT_SMOOTH=false;
let lightCanvas=null,lightCtx=null,lightSprite=null,glowSprites=null;
const LIGHTS=[];let lightN=0;
function makeGlowSprite(rgb){
  const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");
  const gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,"rgba("+rgb+",1)");gr.addColorStop(.35,"rgba("+rgb+",.55)");gr.addColorStop(1,"rgba("+rgb+",0)");
  g.fillStyle=gr;g.fillRect(0,0,128,128);return c;
}
function ensureLightAssets(){
  if(lightCanvas)return;
  lightCanvas=document.createElement("canvas");lightCtx=lightCanvas.getContext("2d");
  lightSprite=makeGlowSprite("255,255,255");
  glowSprites=[makeGlowSprite("255,205,125"),makeGlowSprite("120,228,236"),makeGlowSprite("255,150,70"),makeGlowSprite("205,255,120")];   // warm, cool, fire, firefly
}
function pushLight(x,y,r,i,k){   // screen-space; k: 0 warm, 1 cool crystal, 2 fire
  if(x+r<0||x-r>viewW||y+r<0||y-r>viewH)return;
  const L=LIGHTS[lightN]||(LIGHTS[lightN]={});L.x=x;L.y=y;L.r=r;L.i=i;L.k=k;lightN++;
}
const TOWN_LAMPS=[[560,760],[1080,760],[760,340],[980,350],[250,650],[1450,650]];
const CAVE_GLOWS=[[330,390,105],[1130,720,125],[1450,1030,95],[650,120,85]];
function gatherForestLights(){
  lightN=0;
  const fl=1+Math.sin(animTime*7.3)*.025+Math.sin(animTime*13.1)*.015;
  pushLight(player.x-camera.x,player.y-camera.y-8,168*fl,.95,0);                                   // player's lantern
  if(homeLevel>0)pushLight(playerHome.x-camera.x,playerHome.y-camera.y+36,125,.8,0);               // own house
  pushLight(samanHome.x-camera.x,samanHome.y-camera.y+36,125,.8,0);                                // Saman's house
  if(stations.furnace)pushLight(playerHome.x+112-camera.x,playerHome.y+98-camera.y,95+Math.sin(animTime*9)*6,.85,2);
}
function gatherTownLights(){
  lightN=0;
  const fl=1+Math.sin(animTime*7.3)*.025;
  pushLight(player.x-camera.x,player.y-camera.y-8,150*fl,.8,0);
  for(const p of TOWN_LAMPS)pushLight(p[0]-camera.x,p[1]-camera.y-28,128+Math.sin(animTime*5+p[0])*3,.9,0);
}
function gatherCaveLights(){
  lightN=0;
  const fl=1+Math.sin(animTime*6.1)*.02+Math.sin(animTime*11.7)*.012;
  pushLight(player.x-camera.x,player.y-camera.y-6,215*fl,.95,0);
  for(const r of caveResources){if(r.type!=="crystal"||caveHarvested.has(r.id))continue;pushLight(r.x-camera.x,r.y-camera.y-10,125,.8,1);}
  for(const g of CAVE_GLOWS)pushLight(g[0]-camera.x,g[1]-camera.y,g[2]*1.15,.55,1);
  for(const c of caveChests){if(!c.opened)pushLight(c.x-camera.x,c.y-camera.y,52,.5,0);}
}
function drawLightLayer(amb){
  if(amb.a<.004)return;
  ensureLightAssets();
  const S=LIGHT_SCALE,lw=Math.ceil(viewW/S),lh=Math.ceil(viewH/S);
  if(lightCanvas.width!==lw||lightCanvas.height!==lh){lightCanvas.width=lw;lightCanvas.height=lh;}
  const g=lightCtx;
  g.globalCompositeOperation="source-over";g.globalAlpha=1;g.clearRect(0,0,lw,lh);
  g.globalAlpha=amb.a;g.fillStyle="rgb("+amb.r+","+amb.g+","+amb.b+")";g.fillRect(0,0,lw,lh);
  g.globalCompositeOperation="destination-out";
  for(let i=0;i<lightN;i++){const L=LIGHTS[i],r=L.r/S;g.globalAlpha=L.i;g.drawImage(lightSprite,L.x/S-r,L.y/S-r,r*2,r*2);}
  g.globalAlpha=1;g.globalCompositeOperation="source-over";
  // warm / cool tint of the lit area is painted into the SAME small canvas, so the whole light pass costs one full-screen blit
  g.globalCompositeOperation="source-over";
  const ga=Math.min(.3,amb.a*.45);
  for(let i=0;i<lightN;i++){const L=LIGHTS[i],r=L.r*.8/S;g.globalAlpha=L.i*ga;g.drawImage(glowSprites[L.k],L.x/S-r,L.y/S-r,r*2,r*2);}
  g.globalAlpha=1;
  ctx.save();ctx.imageSmoothingEnabled=LIGHT_SMOOTH;
  ctx.drawImage(lightCanvas,0,0,lw*S,lh*S);
  ctx.restore();
}
function drawNightOverlay(){
  if(caveMode){gatherCaveLights();drawLightLayer(CAVE_AMB);return;}
  computeAmbient();
  if(AMB.a>.004){if(townMode)gatherTownLights();else gatherForestLights();drawLightLayer(AMB);}
  if(!townMode)drawFireflies();
}

// ---- Particles: one small pooled list, hard-capped, auto-scaled. FX.level 2 = full, 1 = half, 0 = off (chosen from measured frame time).
const FX={level:2,avg:.0167,since:0,scene:"",stepT:0,fresh:true};
const PARTS=[],FLIES=[],PART_MAX=100;
const LEAF_COLORS=["#4f9a4a","#78b85f","#a7d46b","#c9b24a","#6f8f3a"];
const CHIP_COLORS={tree:["#7a5238","#a77b55","#4f9a4a","#78b85f"],stone:["#8c978c","#5d6862","#c4ccc4"],iron:["#d88c56","#ffcf7a","#8c978c"],crystal:["#68e5e8","#c9fbf4","#3aa8b4"],bush:["#4f9a4a","#78b85f","#a7d46b"],sand:["#d8c38a","#bba66b"],marble:["#e3e7e8","#bdc6c9"]};
function fxScene(){return (templeMode||homeInterior)?"none":caveMode?"cave":townMode?"town":"forest";}
function addPart(p){if(PARTS.length<PART_MAX)PARTS.push(p);}
function spawnGatherFx(type,x,y,done){
  if(FX.level<=0)return;
  const cols=CHIP_COLORS[type]||CHIP_COLORS.stone,n=Math.round((done?10:5)*(FX.level>1?1:.6)),oy=type==="tree"?-24:-10;
  for(let k=0;k<n;k++){
    const life=.45+Math.random()*.35;
    addPart({k:1,x:x+(Math.random()-.5)*16,y:y+oy+(Math.random()-.5)*8,vx:(Math.random()-.5)*120,vy:-(40+Math.random()*90),life:life,max:life,c:cols[k%cols.length],s:Math.random()<.3?3:2,glow:type==="iron"||type==="crystal"});
  }
}
function spawnPickupFx(x,y,type){
  if(FX.level<=0)return;
  const c=type==="coin"?"#ffe27a":type==="crystal"?"#9ff3ee":type==="potion"?"#e3a9ff":type==="iron"?"#ffcf9a":"#f2f2e8";
  for(let k=0;k<(FX.level>1?6:3);k++){const life=.55+Math.random()*.3;addPart({k:3,x:x+(Math.random()-.5)*22,y:y-4+(Math.random()-.5)*10,vx:(Math.random()-.5)*14,vy:-(18+Math.random()*26),life:life,max:life,c:c});}
}
function updateParticles(dt){
  // pick the effects level from the measured frame time (slow phones get fewer particles; it recovers if the game speeds up)
  FX.avg+=(dt-FX.avg)*.04;FX.since+=dt;
  if(FX.since>3&&FX.avg>.031&&FX.level>0){FX.level--;FX.since=0;}
  else if(FX.since>20&&FX.avg<.0215&&FX.level<2){FX.level++;FX.since=0;}
  const sc=fxScene();
  if(sc!==FX.scene){FX.scene=sc;PARTS.length=0;FLIES.length=0;FX.fresh=true;}
  if(sc==="none")return;
  const lvl=FX.level;
  // move / expire
  for(let i=PARTS.length-1;i>=0;i--){
    const p=PARTS[i];p.life-=dt;
    if(p.k===0){   // leaf
      p.ph+=dt*2.4;p.x+=(p.vx*(1+.5*Math.sin(animTime*.3))+Math.sin(p.ph)*14)*dt;p.y+=p.vy*dt;
      if(p.y>camera.y+viewH+40||p.x>camera.x+viewW+170||p.x<camera.x-230)p.life=0;
    }else if(p.k===1){p.vy+=260*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}                 // chips
    else if(p.k===2){p.x+=p.vx*dt;p.y+=p.vy*dt;}                                // dust puff
    else if(p.k===3){p.x+=p.vx*dt;p.y+=p.vy*dt;}                                // pickup sparkle
    else if(p.k===4){                                                           // cave mote (wraps around the view)
      p.ph+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<camera.x-20)p.x+=viewW+40;else if(p.x>camera.x+viewW+20)p.x-=viewW+40;
      if(p.y<camera.y-20)p.y+=viewH+40;else if(p.y>camera.y+viewH+20)p.y-=viewH+40;
    }
    if(p.life<=0){PARTS[i]=PARTS[PARTS.length-1];PARTS.pop();}
  }
  // ambient spawners
  let leaves=0,motes=0;for(const p of PARTS){if(p.k===0)leaves++;else if(p.k===4)motes++;}
  if(sc==="forest"){
    const night=computeAmbient().a,want=night<.25?(lvl>1?12:lvl>0?6:0):0;
    for(let n=0;leaves<want&&n<2;n++,leaves++){
      PARTS.push({k:0,x:camera.x+Math.random()*(viewW+260)-130,y:FX.fresh?camera.y+Math.random()*viewH:camera.y-24-Math.random()*50,vx:18+Math.random()*26,vy:16+Math.random()*20,ph:Math.random()*6.28,life:30,c:LEAF_COLORS[(Math.random()*LEAF_COLORS.length)|0]});
    }
    const wantF=night>.2?(lvl>1?14:lvl>0?7:0):0;
    while(FLIES.length<wantF)FLIES.push({x:camera.x+Math.random()*viewW,y:camera.y+Math.random()*viewH,a:Math.random()*6.28,sp:8+Math.random()*10,ph:Math.random()*6.28});
    while(FLIES.length>wantF)FLIES.pop();
    for(const f of FLIES){
      f.a+=Math.sin(animTime*.7+f.ph)*1.6*dt;f.x+=Math.cos(f.a)*f.sp*dt;f.y+=Math.sin(f.a)*f.sp*dt;
      if(f.x<camera.x-60)f.x+=viewW+120;else if(f.x>camera.x+viewW+60)f.x-=viewW+120;
      if(f.y<camera.y-60)f.y+=viewH+120;else if(f.y>camera.y+viewH+60)f.y-=viewH+120;
    }
  }else if(sc==="cave"){
    const want=lvl>1?16:lvl>0?8:0;
    for(let n=0;motes<want&&n<3;n++,motes++)PARTS.push({k:4,x:camera.x+Math.random()*viewW,y:camera.y+Math.random()*viewH,vx:(Math.random()-.5)*7,vy:-1-Math.random()*5,ph:Math.random()*6.28,life:1e9});
    if(motes>want){for(let i=PARTS.length-1;i>=0&&motes>want;i--){if(PARTS[i].k===4){PARTS.splice(i,1);motes--;}}}
  }
  FX.fresh=false;
  // footstep dust
  if(playerMoving&&lvl>0){
    FX.stepT-=dt;
    if(FX.stepT<=0){FX.stepT=.17;const life=.5;addPart({k:2,x:player.x+(Math.random()-.5)*8,y:player.y+11,vx:(Math.random()-.5)*14,vy:-(6+Math.random()*10),life:life,max:life,c:sc==="cave"?"#8f9aa0":sc==="town"?"#d9c9a0":"#cdbb8c"});}
  }else FX.stepT=0;
}
function drawParticles(){
  if(!PARTS.length)return;
  ctx.save();
  for(const p of PARTS){
    const x=Math.round(p.x-camera.x),y=Math.round(p.y-camera.y);
    if(x<-20||x>viewW+20||y<-20||y>viewH+20)continue;
    if(p.k===0){ctx.globalAlpha=p.life<1?p.life:1;ctx.fillStyle=p.c;if(Math.sin(p.ph)>0)ctx.fillRect(x,y,3,2);else ctx.fillRect(x,y,2,3);}
    else if(p.k===1){const a=Math.min(1,p.life/.2);if(p.glow){ctx.globalAlpha=a*.3;ctx.fillStyle=p.c;ctx.fillRect(x-2,y-2,p.s+4,p.s+4);}ctx.globalAlpha=a;ctx.fillStyle=p.c;ctx.fillRect(x,y,p.s,p.s);}
    else if(p.k===2){const t=1-p.life/p.max,s=2+t*3;ctx.globalAlpha=.38*(1-t);ctx.fillStyle=p.c;ctx.fillRect(Math.round(x-s/2),Math.round(y-s/2),Math.round(s),Math.round(s));}
    else if(p.k===3){const a=Math.min(1,p.life/.25);ctx.globalAlpha=a;ctx.fillStyle=p.c;ctx.fillRect(x,y-2,1,5);ctx.fillRect(x-2,y,5,1);}
    else if(p.k===4){ctx.globalAlpha=.12+.22*(.5+.5*Math.sin(p.ph*1.3));ctx.fillStyle="#bfeff0";ctx.fillRect(x,y,2,2);}
  }
  ctx.restore();
}
function drawFireflies(){
  if(!FLIES.length)return;
  const k=Math.min(1,Math.max(0,(AMB.a-.2)*4));if(k<=0)return;
  ensureLightAssets();
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const f of FLIES){
    const b=.5+.5*Math.sin(animTime*2.3+f.ph*3),a=b*k;if(a<.05)continue;
    const x=f.x-camera.x,y=f.y-camera.y,r=11+b*5;
    ctx.globalAlpha=a*.55;ctx.drawImage(glowSprites[3],x-r,y-r,r*2,r*2);
    ctx.globalAlpha=a;ctx.fillStyle="#f4ffb0";ctx.fillRect(Math.round(x),Math.round(y),2,2);
  }
  ctx.restore();
}

// ---- Cave floor: irregular flagstones (jittered-cell seams), mossy patches and a few puddles, painted once into cached chunks.
const CAVE_STONE_RGB=["#20252b","#292f36","#323941","#3c444d","#474f58"].map(hexRGB);
const CAVE_MOSS_RGB=["#26393c","#2e474a","#385558"].map(hexRGB);
const CAVE_SEAM_RGB=hexRGB("#171c21");
const CAVE_WATER_RGB=["#10303d","#1a4859","#2b6f80","#8fb8b4","#1b2a30"].map(hexRGB);
const CAVE_CELL=72;   // 72 * 4 = 288 = one chunk, so seam cells line up with chunk borders
const cavePuddleCache=new Map();
function cavePuddleForChunk(cx,cy){
  const key=cx+","+cy;
  if(cavePuddleCache.has(key))return cavePuddleCache.get(key);
  let p=null;const size=GROUND_CHUNK_TILES*WORLD.tile;
  if(terrainHash(cx+311,cy+523)>.55){
    const rx=24+terrainHash(cx+13,cy+71)*22,ry=rx*(.5+terrainHash(cx+97,cy+5)*.3),ext=Math.max(rx,ry)*1.38+4;
    if(ext*2<size){
      const px=cx*size+ext+terrainHash(cx+43,cy+61)*(size-2*ext),py=cy*size+ext+terrainHash(cx+79,cy+29)*(size-2*ext);
      let ok=px>100&&py>100&&px<CAVE.w-100&&py<CAVE.h-100&&Math.hypot(px-800,py-650)>120+rx&&Math.hypot(px-800,py-1080)>130+rx;
      for(const r of caveResources){if(!ok)break;if(((r.x-px)/(rx*1.4+24))**2+((r.y-py)/(ry*1.4+24))**2<1)ok=false;}
      for(const c of caveChests){if(!ok)break;if(((c.x-px)/(rx*1.4+30))**2+((c.y-py)/(ry*1.4+30))**2<1)ok=false;}
      if(ok)p={x:Math.round(px),y:Math.round(py),rx,ry,seed:cx*23+cy*41};
    }
  }
  cavePuddleCache.set(key,p);return p;
}
const caveFx=new Float32Array(7*7),caveFy=new Float32Array(7*7),caveFh=new Float32Array(7*7);
function paintCaveField(g,ox,oy,size,puddle){
  const n=size/FIELD_PX,cn=size/CAVE_CELL+3,c0x=Math.floor(ox/CAVE_CELL)-1,c0y=Math.floor(oy/CAVE_CELL)-1;
  if(fieldN!==n){fieldCanvas=document.createElement("canvas");fieldCanvas.width=fieldCanvas.height=n;fieldCtx=fieldCanvas.getContext("2d");fieldImg=fieldCtx.createImageData(n,n);fieldN=n;}
  for(let j=0;j<cn;j++)for(let i=0;i<cn;i++){
    const gi=c0x+i,gj=c0y+j,k=j*cn+i;
    caveFx[k]=(gi+.15+.7*terrainHash(gi+401,gj+17))*CAVE_CELL;caveFy[k]=(gj+.15+.7*terrainHash(gi+29,gj+433))*CAVE_CELL;caveFh[k]=terrainHash(gi+601,gj+77);
  }
  const d=fieldImg.data;
  for(let ay=0;ay<n;ay++)for(let ax=0;ax<n;ax++){
    const wx=ox+ax*FIELD_PX+1.5,wy=oy+ay*FIELD_PX+1.5,b=BAYER4[(ay&3)*4+(ax&3)];
    const i0=Math.floor(wx/CAVE_CELL)-c0x,j0=Math.floor(wy/CAVE_CELL)-c0y;
    let m1=1e9,m2=1e9,sh=.5;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
      const k=(j0+dj)*cn+(i0+di),dx=wx-caveFx[k],dy=wy-caveFy[k],dd=dx*dx+dy*dy;
      if(dd<m1){m2=m1;m1=dd;sh=caveFh[k];}else if(dd<m2)m2=dd;
    }
    const edge=Math.sqrt(m2)-Math.sqrt(m1);
    const v=(.55*vnoise(wx/200+5,wy/200+9)+.45*vnoise(wx/50+17,wy/50+3)-.5)*1.7+.5;
    let si=Math.floor(v*5+(sh-.5)*.7+(b-.5)*.8);si=si<0?0:si>4?4:si;
    let c;
    if(edge<2.2)c=CAVE_SEAM_RGB;
    else{
      if(edge<6&&b<.5)si=si>0?si-1:0;
      c=CAVE_STONE_RGB[si];
      if(edge>2.2&&vnoise(wx/120+211,wy/120+57)+(b-.5)*.08>.74){let mi=Math.floor(vnoise(wx/24+9,wy/24+31)*3+(b-.5)*.8);mi=mi<0?0:mi>2?2:mi;c=CAVE_MOSS_RGB[mi];}
    }
    if(puddle){
      const dx=(wx-puddle.x)/puddle.rx,dy=(wy-puddle.y)/puddle.ry;let dd=Math.sqrt(dx*dx+dy*dy);
      if(dd<1.45){
        dd*=1+.4*(vnoise(wx/18+puddle.seed,wy/18+puddle.seed*.7)-.5);const q=dd+(b-.5)*.07;
        if(q<.5)c=CAVE_WATER_RGB[0];else if(q<.78)c=CAVE_WATER_RGB[1];else if(q<.94)c=CAVE_WATER_RGB[2];else if(q<1.02)c=CAVE_WATER_RGB[3];else if(q<1.14)c=CAVE_WATER_RGB[4];
      }
    }
    const o=(ay*n+ax)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;
  }
  fieldCtx.putImageData(fieldImg,0,0);
  g.save();g.imageSmoothingEnabled=false;g.drawImage(fieldCanvas,0,0,size,size);g.restore();
}
function drawCaveWaterFx(){
  const size=GROUND_CHUNK_TILES*WORLD.tile;
  const cx0=Math.floor(camera.x/size),cx1=Math.floor((camera.x+viewW)/size),cy0=Math.floor(camera.y/size),cy1=Math.floor((camera.y+viewH)/size);
  for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
    if(cx<0||cy<0)continue;
    const p=cavePuddleForChunk(cx,cy);if(!p)continue;
    const x=p.x-camera.x,y=p.y-camera.y;if(x<-90||x>viewW+90||y<-70||y>viewH+70)continue;
    const rp=(animTime*.3+p.seed*.11)%1;
    ctx.strokeStyle="rgba(150,225,230,"+(.28*(1-rp))+")";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(x,y,p.rx*(.14+.5*rp),p.ry*(.14+.5*rp),0,0,Math.PI*2);ctx.stroke();
    for(let k=0;k<3;k++){
      const a=Math.sin(animTime*1.2+k*2.1+p.seed);if(a<.4)continue;
      const ang=k*2.7+p.seed,r=.15+.45*terrainHash(p.seed+k,7);
      ctx.fillStyle="rgba(210,250,250,"+(.2+.5*a)+")";ctx.fillRect(Math.round(x+Math.cos(ang)*p.rx*r),Math.round(y+Math.sin(ang)*p.ry*r),4,1);
    }
  }
}
function drawLootDrops(){for(const d of lootDrops){if(d.x<camera.x-40||d.x>camera.x+viewW+40||d.y<camera.y-40||d.y>camera.y+viewH+40)continue;const x=d.x-camera.x,y=d.y-camera.y+Math.sin(animTime*3+d.x*.02)*2;const colors={coin:"#f5c94b",stone:"#aab1b8",iron:"#d88c56",crystal:"#68e5e8",potion:"#c779ef"};ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(x,y+8,10,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors[d.type]||"#fff";if(d.type==="crystal"){ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x+7,y-2);ctx.lineTo(x+3,y+7);ctx.lineTo(x-4,y+6);ctx.lineTo(x-7,y-2);ctx.closePath();ctx.fill();}else if(d.type==="coin"){ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff0a8";ctx.fillRect(x-2,y-4,3,8);}else{ctx.fillRect(x-6,y-6,12,12);ctx.fillStyle="#fff";ctx.fillRect(x-3,y-4,3,3);}}}

function drawAncientBridge(){
 const rx=2700-camera.x;
 // A broad, animated river cuts across the eastern forest and reaches the map edges.
 ctx.fillStyle="#173f4b";ctx.fillRect(rx-76,-camera.y,152,WORLD.h);
 for(let y=0;y<WORLD.h;y+=64){const sy=y-camera.y;ctx.fillStyle="#245e68";ctx.fillRect(rx-68,sy+8,136,34);ctx.fillStyle="#4b9290";ctx.fillRect(rx-48+Math.sin(y*.03+animTime)*12,sy+17,42,3);ctx.fillRect(rx+12+Math.cos(y*.025+animTime)*10,sy+30,28,2);ctx.fillStyle="#183c49";ctx.fillRect(rx-75,sy+47,150,5);}
 // River banks
 ctx.fillStyle="#806c45";ctx.fillRect(rx-91,-camera.y,15,WORLD.h);ctx.fillRect(rx+76,-camera.y,15,WORLD.h);
 // Stone piers appear after the first construction phase.
 if(bridgeStage>=1){for(const side of [-1,1]){const x=rx+side*44;ctx.fillStyle="#26363a";ctx.fillRect(x-17,1650-camera.y,34,120);ctx.fillStyle="#89918a";ctx.fillRect(x-14,1653-camera.y,28,110);ctx.fillStyle="#c1bda4";ctx.fillRect(x-17,1647-camera.y,34,9);}}
 // The old broken span is visible even before repairs.
 const by=1710-camera.y;
 ctx.fillStyle="#3c2a20";ctx.fillRect(rx-154,by-13,308,26);
 if(bridgeStage>=2){
  ctx.fillStyle="#69452b";ctx.fillRect(rx-150,by-19,300,38);
  for(let i=0;i<12;i++){const x=rx-145+i*25;ctx.fillStyle=i%2?"#a87945":"#bd8d52";ctx.fillRect(x,by-17,20,34);ctx.fillStyle="#e0b879";ctx.fillRect(x+2,by-15,15,3);}
  ctx.fillStyle="#523a27";ctx.fillRect(rx-153,by-25,306,6);ctx.fillRect(rx-153,by+19,306,6);
  for(const side of [-1,1]){ctx.fillStyle="#8d6238";ctx.fillRect(rx+side*139,by-47,8,70);ctx.fillStyle="#d4ad70";ctx.fillRect(rx+side*136,by-49,14,5);}
 }else{
  ctx.fillStyle="#9b7043";ctx.fillRect(rx-130,by-9,92,8);ctx.fillRect(rx+34,by+4,86,8);ctx.fillStyle="#4b3021";ctx.fillRect(rx-44,by-24,8,50);ctx.fillRect(rx+58,by-28,8,49);
 }
 if(bridgeStage>=3){
  ctx.fillStyle="#e5d29b";ctx.fillRect(rx-8,by-12,16,24);ctx.fillStyle="#6dd8d2";ctx.fillRect(rx-4,by-8,8,16);
  ctx.fillStyle="#b7a77c";ctx.fillRect(2835-camera.x,by-13,180,26);ctx.fillStyle="#d8c99d";for(let i=0;i<7;i++)ctx.fillRect(2844-camera.x+i*25,by-10,13,3);
  const gx=3000-camera.x,gy=1710-camera.y;
  ctx.fillStyle="#493b30";ctx.fillRect(gx-48,gy-75,96,84);ctx.fillStyle="#b49a69";ctx.fillRect(gx-40,gy-69,80,76);ctx.fillStyle="#493b30";ctx.fillRect(gx-19,gy-5,38,50);ctx.fillStyle="#d5bd83";ctx.fillRect(gx-50,gy-83,100,12);ctx.fillRect(gx-57,gy-77,14,72);ctx.fillRect(gx+43,gy-77,14,72);ctx.fillStyle="#f0d99b";ctx.font="bold 14px Tahoma";ctx.textAlign="center";ctx.fillText("معبد باستانی",gx,gy-98);ctx.textAlign="start";
 }else{
  const gx=3000-camera.x,gy=1710-camera.y;ctx.fillStyle="#78684e";ctx.fillRect(gx-35,gy-38,70,48);ctx.fillStyle="#b5a47a";ctx.fillRect(gx-28,gy-32,56,42);ctx.fillStyle="#4a4135";ctx.fillRect(gx-12,gy-4,24,16);ctx.fillStyle="#e9d39d";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("راه معبد",gx,gy-50);ctx.textAlign="start";
 }
}

function drawCaveEntrance(){
 const x=2080-camera.x,y=1450-camera.y;
 if(x<-115||x>viewW+115||y<-115||y>viewH+115)return;
 ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(x,y+35,94,22,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#28312c";ctx.beginPath();ctx.moveTo(x-82,y+28);ctx.lineTo(x-78,y-22);ctx.lineTo(x-54,y-66);ctx.lineTo(x-20,y-86);ctx.lineTo(x+22,y-84);ctx.lineTo(x+62,y-58);ctx.lineTo(x+83,y-12);ctx.lineTo(x+88,y+29);ctx.closePath();ctx.fill();
 ctx.fillStyle="#68736a";ctx.beginPath();ctx.moveTo(x-70,y+22);ctx.lineTo(x-66,y-18);ctx.lineTo(x-45,y-53);ctx.lineTo(x-16,y-72);ctx.lineTo(x+19,y-70);ctx.lineTo(x+49,y-48);ctx.lineTo(x+69,y-10);ctx.lineTo(x+72,y+22);ctx.closePath();ctx.fill();
 ctx.fillStyle="#9aa18a";ctx.fillRect(x-54,y-46,17,7);ctx.fillRect(x+28,y-57,18,6);ctx.fillRect(x-75,y-7,12,6);ctx.fillRect(x+61,y-13,13,7);
 ctx.fillStyle="#111719";ctx.beginPath();ctx.moveTo(x-47,y+26);ctx.lineTo(x-42,y-16);ctx.lineTo(x-24,y-47);ctx.lineTo(x,y-58);ctx.lineTo(x+25,y-44);ctx.lineTo(x+43,y-12);ctx.lineTo(x+49,y+26);ctx.closePath();ctx.fill();
 ctx.fillStyle="#263a3c";ctx.fillRect(x-38,y+17,76,8);ctx.fillStyle="#4e6d68";ctx.fillRect(x-32,y+18,64,3);
 ctx.fillStyle="#76563b";ctx.fillRect(x-57,y-21,8,50);ctx.fillRect(x+49,y-21,8,50);ctx.fillStyle="#c29a62";ctx.fillRect(x-61,y-24,15,7);ctx.fillRect(x+46,y-24,15,7);
 ctx.fillStyle="#6ad5d0";ctx.fillRect(x-63,y-2,5,10);ctx.fillRect(x+58,y-2,5,10);ctx.fillStyle="#b6f3df";ctx.fillRect(x-62,y,3,4);ctx.fillRect(x+59,y,3,4);
 ctx.fillStyle="#d5c18c";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("غار جنگلی",x,y-100);ctx.textAlign="start";
}
function draw() {
  ctx.clearRect(0, 0, viewW, viewH);
  if (templeMode||townMode) releaseGroundCaches();
  if (templeMode) { drawTempleGround(); for(const e of templeEnemies){if(e.alive)drawTempleEnemy(e);} drawPlayer(); return; }
  if (homeInterior) { drawInterior(); drawPlayer(); return; }
  if(townMode){drawTown();drawTownPeople();drawPlayer();drawParticles();drawNightOverlay();return;}
  if(caveMode){drawCaveGround();drawCaveDetails();drawCaveObjects();}else {drawGround();drawForestWaterFx();drawAncientBridge();}
  if (!caveMode) { drawHouse(playerHome.x, playerHome.y, homeLevel, false); drawHouse(samanHome.x, samanHome.y, 1, true); drawFarmPlots(); drawStations(); }
  for (const r of activeNodes()) {
    if (r.x < camera.x - 60 || r.x > camera.x + viewW + 60 || r.y < camera.y - 60 || r.y > camera.y + viewH + 60) continue;
    if (r.type === "tree") drawTree(r);
    else if (r.type === "stone") drawRock(r);
    else if(r.type==="crystal"){drawRock(r);let cx=r.x-camera.x,cy=r.y-camera.y;ctx.fillStyle="#73e5df";ctx.fillRect(cx-5,cy-22,10,20);ctx.fillRect(cx-10,cy-12,6,10);ctx.fillRect(cx+5,cy-10,6,8);}
    else if(r.type==="iron") drawIron(r);
    else if(r.type==="bush") drawFiberBush(r);
    else if(r.type==="sand") drawSandPile(r);
    else if(r.type==="marble") drawMarbleNode(r);
  }
  const visibleEnemies = caveMode ? caveEnemies : enemies;
  for(const e of visibleEnemies){if(!e.alive)continue;if(e.x<camera.x-60||e.x>camera.x+viewW+60||e.y<camera.y-60||e.y>camera.y+viewH+60)continue;if(e.kind==="slime")drawSlime(e);else drawCrystalGuardian(e);}
  drawLootDrops();
  if(!caveMode) drawForestNpc();
  if(!caveMode){const sx=2310-camera.x,sy=900-camera.y;ctx.fillStyle="#65452c";ctx.fillRect(sx-4,sy-2,8,50);ctx.fillStyle="#b77b3e";ctx.fillRect(sx-43,sy-38,86,34);ctx.strokeStyle="#f0d49a";ctx.lineWidth=3;ctx.strokeRect(sx-43,sy-38,86,34);ctx.fillStyle="#fff0c2";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("شهر سبز",sx,sy-16);ctx.textAlign="start";}
  drawPlayer();
  drawParticles();
  drawNightOverlay();
  ctx.strokeStyle = "#d6f0a8"; ctx.lineWidth = 3;
  ctx.strokeRect(2-camera.x,2-camera.y,(caveMode?CAVE.w:WORLD.w)-4,(caveMode?CAVE.h:WORLD.h)-4);
  if(!caveMode)drawCaveEntrance();
}
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;
  update(dt);
  updateParticles(dt);
  draw();
  if (!$("mapPanel").hidden) drawWorldMap();
  requestAnimationFrame(loop);
}
updateUI();
updateHotbar();
syncXpPanel();
showToast("روی زمین بزن تا حرکت کنی؛ روی منابع بزن تا خودکار جمع‌آوری کنی 🌿");
requestAnimationFrame(loop);
addEventListener("pagehide", saveQuietly);
})();
// Stage 29 final validation marker: carpenter, merchant, furniture and backpack progression.

// Stage 30: five-floor ancient temple with persistent seals and guardians.