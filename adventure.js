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
const bag = { wood: 0, stone: 0, iron: 0, crystal: 0, potion: 0, seeds: 0, wheat: 0, carrot: 0, strawberry: 0 };
let harvested = new Set(), caveHarvested = new Set();
let caveMode = false, caveReturn = {x:1200,y:900}, openedChests = [];
let caveResources = [], caveChests = [];
let resources = [];
let quests = { wood: 0, slime: 0, iron: 0, claimed: { wood: false, slime: false, iron: false } };
let npcMet = false, npcTalkIndex = 0;
let npcQuest = { accepted: false, progress: 0, claimed: false };
let homeLevel = 0, homeInterior = false, homeReturn = { x: 760, y: 590 };

let townMode = false, townReturn = {x:2240,y:900}, townNpcIndex = 0;
const townFriendship = {mina:0,hana:0,nahid:0,saeed:0,rezaei:0};
const townStock = {bread:0,seeds:0,apple:0};
const TOWN = {w:1600,h:1200};
const townPeople = [
{id:"mina",name:"مینا",role:"همسایه مهربان",x:470,y:560,color:"#d94f91",hair:"#693b39"},
{id:"hana",name:"حنا",role:"خواهر مینا",x:560,y:590,color:"#348fc0",hair:"#292431"},
{id:"nahid",name:"ناهید",role:"مادر مینا و حنا",x:420,y:650,color:"#9b3e60",hair:"#673b40"},
{id:"saeed",name:"سعید",role:"نگهبان شهر",x:180,y:590,color:"#33465b",hair:"#28252b"},
{id:"rezaei",name:"خانم رضایی",role:"صاحب خواربارفروشی",x:1120,y:530,color:"#4b8b50",hair:"#74483a"}
];

let worldClock = 9 * 60, worldDay = 1, selectedFarmPlot = 0, selectedCrop = "carrot";
const farmPlots = Array.from({length:4},(_,i)=>({id:i,x:900+(i%2)*78,y:650+Math.floor(i/2)*72,state:"empty",crop:null,growth:0,wateredDay:-1}));
const playerHome = { x: 700, y: 520 };
const samanHome = { x: 1900, y: 450 };
const forestNpc = { x: 1320, y: 1010, name: "سامان", role: "جنگلبان" };
let enemies = [], caveEnemies = [], lootDrops = [];
let attackCooldown = 0, attackFlash = 0, damageCooldown = 0;
let move = { x: 0, y: 0 };
let toastTimer = 0;
let lastTime = 0;
let animTime = 0, playerMoving = false, playerFacing = "down";

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
    if (Math.hypot(x - player.x, y - player.y) < 130 || Math.hypot(x-playerHome.x,y-playerHome.y)<155 || Math.hypot(x-samanHome.x,y-samanHome.y)<155) continue;
    const type = rand() < 0.72 ? "tree" : "stone";
    resources.push({ id: "node-" + i, x, y, type, hp: type === "tree" ? 3 : 4, max: type === "tree" ? 3 : 4 });
  }
  for (let i = 0; i < 30; i++) {
    const x = 120 + rand() * (WORLD.w - 240), y = 120 + rand() * (WORLD.h - 240);
    if (Math.hypot(x-playerHome.x,y-playerHome.y)<145 || Math.hypot(x-samanHome.x,y-samanHome.y)<145) continue;
    resources.push({ id: "iron-" + i, x, y, type: "iron", hp: 5, max: 5 });
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
    if (Array.isArray(data.harvested)) harvested = new Set(data.harvested);
    if (Array.isArray(data.caveHarvested)) caveHarvested = new Set(data.caveHarvested);
    if (Array.isArray(data.lootDrops)) lootDrops = data.lootDrops.filter(d => d && Number.isFinite(d.x) && Number.isFinite(d.y) && ["coin","stone","iron","crystal","potion"].includes(d.type));
    caveMode = !!data.caveMode; if(data.caveReturn)caveReturn=data.caveReturn; if(Array.isArray(data.openedChests))openedChests=data.openedChests;
    if(data.quests)quests={...quests,...data.quests,claimed:{...quests.claimed,...(data.quests.claimed||{})}};
    npcMet = !!data.npcMet; npcTalkIndex = Number.isInteger(data.npcTalkIndex) ? data.npcTalkIndex : 0;
    if (data.npcQuest) npcQuest = { ...npcQuest, ...data.npcQuest };
    homeLevel = Math.max(0, Math.min(3, Number(data.homeLevel) || 0));
    homeInterior = !!data.homeInterior; if (data.homeReturn) homeReturn = data.homeReturn;
    townMode=!!data.townMode;if(data.townReturn)townReturn=data.townReturn;if(data.townFriendship)Object.assign(townFriendship,data.townFriendship);if(data.townStock)Object.assign(townStock,data.townStock);
    if(Number.isFinite(data.worldClock))worldClock=data.worldClock;if(Number.isFinite(data.worldDay))worldDay=data.worldDay;if(Array.isArray(data.farmPlots))data.farmPlots.forEach((p,i)=>{if(farmPlots[i])Object.assign(farmPlots[i],p);});
  } catch (e) { console.warn("Save could not be loaded", e); }
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth, speed: player.speed, level: player.level, xp: player.xp, skillPoints: player.skillPoints, attackPower: player.attackPower, armorLevel: player.armorLevel || 0, coins: player.coins },
      bag, harvested: [...harvested], caveHarvested: [...caveHarvested], lootDrops, caveMode, caveReturn, openedChests, quests, npcMet, npcTalkIndex, npcQuest, homeLevel, homeInterior, homeReturn, townMode, townReturn, townFriendship, townStock, worldClock, worldDay, farmPlots
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
  if($("seeds"))$("seeds").textContent=bag.seeds||0;
  if($("farmCrops"))$("farmCrops").textContent="🌾 "+(bag.wheat||0)+" • 🥕 "+(bag.carrot||0)+" • 🍓 "+(bag.strawberry||0);
  $("xpText").textContent = player.xp + " / " + xpNeeded() + " XP";
  $("xpFill").style.width = Math.min(100, player.xp / xpNeeded() * 100) + "%";
  updateUpgradeUI();
  updateQuestUI();
  if ($("npcQuestStatus")) updateNpcQuestUI();
  if ($("craftPanel")) updateCraftUI();
}
load();
makeWorld();
makeCave();
function makeEnemies() {
  // Slimes no longer spawn in the forest; they live in the cave now.
  enemies = [];
}
makeEnemies();
function makeCave(){
 caveResources=[
 {id:"cs1",x:250,y:250,type:"stone",hp:4,max:4},{id:"cs2",x:1320,y:250,type:"stone",hp:4,max:4},
 {id:"cs3",x:1080,y:880,type:"stone",hp:4,max:4},{id:"cs4",x:360,y:930,type:"stone",hp:4,max:4},
 {id:"ci1",x:420,y:450,type:"iron",hp:5,max:5},{id:"ci2",x:1320,y:650,type:"iron",hp:5,max:5},
 {id:"ci3",x:760,y:1020,type:"iron",hp:5,max:5},{id:"cc1",x:760,y:360,type:"crystal",hp:4,max:4},
 {id:"cc2",x:300,y:680,type:"crystal",hp:4,max:4},{id:"cc3",x:1450,y:950,type:"crystal",hp:4,max:4}];
 caveChests=[{x:590,y:230,opened:!!openedChests[0]},{x:1370,y:420,opened:!!openedChests[1]},{x:790,y:790,opened:!!openedChests[2]}];
 const slimeSpots=[[300,430],[920,330],[1450,570],[600,850],[1190,930]];
 caveEnemies=slimeSpots.map((p,i)=>({id:"cave-slime-"+i,kind:"slime",x:p[0],y:p[1],spawnX:p[0],spawnY:p[1],hp:3,max:3,alive:true,respawnTimer:0}));
 caveEnemies.push({id:"crystal-guardian",kind:"guardian",x:1120,y:570,spawnX:1120,spawnY:570,hp:5,max:5,alive:true,respawnTimer:0});
}
function activeNodes(){return caveMode?caveResources.filter(r=>!caveHarvested.has(r.id)):resources.filter(r=>!harvested.has(r.id));}
function toggleCave(){
 if(!caveMode){caveReturn={x:player.x,y:player.y};caveMode=true;player.x=800;player.y=1080;showToast("وارد غار جنگلی شدی 🕯️");}
 else{caveMode=false;player.x=caveReturn.x;player.y=caveReturn.y;showToast("به جنگل برگشتی 🌲");}
 saveQuietly();
}

function harvest() {
  if(caveMode){const chest=caveChests.find(c=>!c.opened&&Math.hypot(player.x-c.x,player.y-c.y)<76);if(chest){chest.opened=true;openedChests=caveChests.map(c=>c.opened);player.coins+=15;const leveled=addXP(25);bag.crystal=(bag.crystal||0)+1;progressNpcCrystal(1);updateUI();saveQuietly();showToast(leveled?"سطح جدید! یک امتیاز مهارت گرفتی ⭐":"صندوق گنج! +۱۵ سکه، ۲۵ تجربه و کریستال 💎");return;}}
  const dropIndex=lootDrops.findIndex(d=>Math.hypot(player.x-d.x,player.y-d.y)<62);
  if(dropIndex>=0){const drop=lootDrops.splice(dropIndex,1)[0];if(drop.type==="coin")player.coins+=drop.qty;else if(drop.type==="stone")bag.stone=(bag.stone||0)+drop.qty;else if(drop.type==="iron")bag.iron=(bag.iron||0)+drop.qty;else if(drop.type==="crystal"){bag.crystal=(bag.crystal||0)+drop.qty;progressNpcCrystal(drop.qty);}else if(drop.type==="potion")bag.potion=(bag.potion||0)+drop.qty;updateUI();saveQuietly();showToast(({coin:"🪙 سکه",stone:"🪨 سنگ",iron:"⛏️ آهن",crystal:"💎 کریستال",potion:"🧪 معجون"})[drop.type]+" ×"+drop.qty+" برداشتی!");return;}
  let nearest = null, best = 76;
  for (const r of activeNodes()) {
    const d = Math.hypot(player.x - r.x, player.y - r.y);
    if (d < best) { best = d; nearest = r; }
  }
  if (!nearest) { showToast("به درخت یا سنگ نزدیک‌تر شو"); return; }
  nearest.hp--;
  if (nearest.hp <= 0) {
    (caveMode ? caveHarvested : harvested).add(nearest.id);
    if (nearest.type === "tree") { bag.wood += 3; quests.wood = Math.min(10, quests.wood + 3); }
    if (nearest.type === "stone") bag.stone += 2;
    if (nearest.type === "iron") { bag.iron += 1; quests.iron = Math.min(5, quests.iron + 1); }
    if (nearest.type === "crystal") { bag.crystal = (bag.crystal||0)+1; progressNpcCrystal(1); }
    const leveled = addXP(10);
    if (leveled) showToast("سطح جدید! یک امتیاز مهارت گرفتی ⭐");
    else showToast(nearest.type === "tree" ? "۳ چوب جمع کردی 🪵" : nearest.type === "stone" ? "۲ سنگ جمع کردی 🪨" : nearest.type === "iron" ? "۱ آهن جمع کردی ⛏️" : "۱ کریستال جمع کردی 💎");
    updateUI();
    saveQuietly();
  } else {
    showToast("در حال جمع‌آوری...");
  }
}
function attack() {
  if (attackCooldown > 0) return;
  attackCooldown = 0.32; attackFlash = 0.18;
  let target = null, best = 104;
  const targets = caveMode ? caveEnemies : enemies;
  for (const e of targets) { if (!e.alive) continue; const d=Math.hypot(player.x-e.x,player.y-e.y); if(d<best){best=d;target=e;} }
  if (!target) { showToast("برای حمله به موجود نزدیک‌تر شو"); return; }
  target.hp -= player.attackPower;
  if (target.hp <= 0) {
    target.alive=false;
    target.respawnTimer=target.kind==="guardian"?28:18;
    const roll=Math.random();
    if(target.kind==="guardian"){lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+18,y:target.y+12,type:"crystal",qty:2,rarity:"rare"});player.coins+=10;bag.crystal=(bag.crystal||0)+2;progressNpcCrystal(2);const leveled=addXP(25);updateUI();saveQuietly();showToast(leveled?"نگهبان کریستالی شکست خورد! +۱۰ سکه و ۲ کریستال؛ سطح جدید ⭐":"نگهبان کریستالی شکست خورد! +۱۰ سکه، ۲ کریستال و ۲۵ تجربه 💎");}
    else {quests.slime=Math.min(3,quests.slime+1);const leveled=addXP(15);if(roll<0.38)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"coin",qty:3+Math.floor(Math.random()*5),rarity:"common"});else if(roll<0.62)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"stone",qty:1,rarity:"common"});else if(roll<0.82)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"iron",qty:1,rarity:"uncommon"});else if(roll<0.94)lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"potion",qty:1,rarity:"rare"});else lootDrops.push({id:"drop-"+Date.now()+"-"+Math.random(),x:target.x+12,y:target.y+10,type:"crystal",qty:1,rarity:"rare"});updateUI();saveQuietly();showToast(leveled?"اسلایم غار شکست خورد! سطح جدید ⭐":"اسلایم غار شکست خورد! +۱۵ تجربه؛ شاید غنیمت انداخته باشد 💎");}
  } else showToast("ضربه زدی! ❤️ جان دشمن: "+target.hp);
}

function saveQuietly() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth, speed: player.speed, level: player.level, xp: player.xp, skillPoints: player.skillPoints, attackPower: player.attackPower, armorLevel: player.armorLevel || 0, coins: player.coins },
      bag, harvested: [...harvested], caveHarvested: [...caveHarvested], lootDrops, caveMode, caveReturn, openedChests, quests, npcMet, npcTalkIndex, npcQuest, homeLevel, homeInterior, homeReturn, townMode, townReturn, townFriendship, townStock, worldClock, worldDay, farmPlots
    }));
  } catch (e) {}
}

const keys = new Set();
addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
});
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

const joy = $("joystick"), stick = $("stick");
let joyPointer = null;
function setJoy(e) {
  const rect = joy.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  const dy = e.clientY - (rect.top + rect.height / 2);
  const max = 38, len = Math.hypot(dx, dy) || 1, scale = Math.min(1, max / len);
  move.x = dx / max * scale;
  move.y = dy / max * scale;
  stick.style.transform = "translate(" + (move.x * max) + "px," + (move.y * max) + "px)";
}
joy.addEventListener("pointerdown", e => {
  joyPointer = e.pointerId;
  joy.setPointerCapture(e.pointerId);
  setJoy(e);
});
joy.addEventListener("pointermove", e => { if (e.pointerId === joyPointer) setJoy(e); });
function releaseJoy(e) {
  if (e.pointerId !== joyPointer) return;
  joyPointer = null; move.x = 0; move.y = 0; stick.style.transform = "translate(0,0)";
}
joy.addEventListener("pointerup", releaseJoy);
joy.addEventListener("pointercancel", releaseJoy);
$("actionBtn").addEventListener("pointerdown", e => { e.preventDefault(); harvest(); });
$("farmBtn").addEventListener("click",openFarmPanel);$("farmClose").addEventListener("click",()=>{$("farmPanel").hidden=true;syncXpPanel();});$("farmPlotsGrid").addEventListener("click",e=>{const b=e.target.closest("[data-plot]");if(!b)return;selectedFarmPlot=Number(b.dataset.plot);updateFarmUI();});
$("farmTill").addEventListener("click",farmTill);$("farmPlant").addEventListener("click",farmPlant);$("farmWater").addEventListener("click",farmWater);$("farmHarvest").addEventListener("click",farmHarvest);
$("farmCrop").addEventListener("change",e=>{selectedCrop=e.target.value;updateFarmUI();});$("sellCrops").addEventListener("click",sellFarmCrops);
$("attackBtn").addEventListener("pointerdown", e => { e.preventDefault(); attack(); });
$("npcBtn").addEventListener("click", openNpcDialogue);
$("townBtn").addEventListener("click",()=>transitionTown(true));$("townExitBtn").addEventListener("click",()=>transitionTown(false));$("townNpcBtn").addEventListener("click",openTownNpc);$("townNpcTalk").addEventListener("click",nextTownDialogue);$("townNpcShop").addEventListener("click",openTownShop);$("townNpcClose").addEventListener("click",()=>{$("townNpcPanel").hidden=true;syncXpPanel();});$("townShopClose").addEventListener("click",()=>{$("townShopPanel").hidden=true;syncXpPanel();});$("buyBread").addEventListener("click",()=>buyTownItem("bread"));$("buySeeds").addEventListener("click",()=>buyTownItem("seeds"));$("buyApple").addEventListener("click",()=>buyTownItem("apple"));
$("eatBread").addEventListener("click",()=>consumeTownFood("bread"));
$("eatApple").addEventListener("click",()=>consumeTownFood("apple"));
$("npcNext").addEventListener("click", advanceNpcDialogue);
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
$("craftBtn").addEventListener("click", () => { $("craftPanel").hidden = false; updateCraftUI(); syncXpPanel(); });
$("closeCraft").addEventListener("click", () => { $("craftPanel").hidden = true; syncXpPanel(); });
$("craftSword").addEventListener("click", () => craft("sword"));
$("craftBoots").addEventListener("click", () => craft("boots"));
$("craftPotion").addEventListener("click", () => craft("potion"));
  $("craftIronArmor").addEventListener("click", () => craft("ironArmor"));
  $("craftCrystalArmor").addEventListener("click", () => craft("crystalArmor"));
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

function syncXpPanel() {
  const panelIds = ["inventory", "upgradePanel", "craftPanel", "questPanel", "npcPanel", "homePanel", "townNpcPanel", "townShopPanel", "farmPanel"];
  const hud = $("hud");
  const xp = $("xpPanel");
  xp.hidden = panelIds.some(id => !$(id).hidden);
  // Place the XP bar below the complete, possibly wrapped mobile HUD.
  xp.style.top = Math.ceil(hud.getBoundingClientRect().bottom + 8) + "px";
}
addEventListener("resize", syncXpPanel);
const npcLines = [
  "این جنگل قدیمی‌تر از چیزیه که به نظر میاد. مراقب موجودات سبز باش!",
  "اگر کریستال پیدا کردی، نگهش دار؛ توی غار به کارت میاد.",
  "برای قوی‌تر شدن، منابع جمع کن و از میز ساخت تجهیزات استفاده کن.",
  "راه غار از بخش شرقی جنگل می‌گذره. اونجا چیزهای ارزشمندی پیدا می‌کنی."
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
  attackCooldown=Math.max(0,attackCooldown-dt); attackFlash=Math.max(0,attackFlash-dt); damageCooldown=Math.max(0,damageCooldown-dt);
  const activeEnemies = (caveMode || homeInterior || townMode) ? (caveMode ? caveEnemies : []) : enemies;
  for(const enemy of activeEnemies){
    if(!enemy.alive){
      enemy.respawnTimer = Math.max(0, enemy.respawnTimer - dt);
      if(enemy.respawnTimer <= 0){ enemy.alive = true; enemy.hp = enemy.max; enemy.x = enemy.spawnX; enemy.y = enemy.spawnY; }
      continue;
    }
    const ex=player.x-enemy.x,ey=player.y-enemy.y,distance=Math.hypot(ex,ey)||1;
    const chaseSpeed = caveMode ? 48 : 72;
    if(distance<300&&distance>30){enemy.x+=ex/distance*chaseSpeed*dt;enemy.y+=ey/distance*chaseSpeed*dt;}
    else if(distance<=30&&damageCooldown<=0){
      const armorLevel=Math.max(0,Math.min(2,player.armorLevel||0));
      const incomingDamage=armorLevel===0?1:armorLevel===1?0.7:0.4;
      player.health=Math.max(0,Math.round((player.health-incomingDamage)*10)/10);
      damageCooldown=1;updateUI();saveQuietly();
      if(player.health<=0){player.health=player.maxHealth;player.x=caveMode?800:1200;player.y=caveMode?1080:900;showToast("انرژیت تمام شد؛ جانت بازیابی شد");updateUI();}
      else showToast(caveMode?"نگهبان کریستالی بهت ضربه زد! 💎":"موجود بهت ضربه زد! ❤️");
    }
  }
  if (!caveMode && !homeInterior && !townMode) {
    const night = worldClock >= 20 * 60 || worldClock < 6 * 60;
    const targetX = night ? samanHome.x : 1690;
    const targetY = night ? samanHome.y + 72 : 650;
    const sx = targetX - forestNpc.x, sy = targetY - forestNpc.y, sd = Math.hypot(sx, sy);
    if (sd > 8) { forestNpc.x += sx / sd * Math.min(sd, 42 * dt); forestNpc.y += sy / sd * Math.min(sd, 42 * dt); }
  }
  let dx = move.x, dy = move.y;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  const len = Math.hypot(dx, dy);
  playerMoving = len > 0.08;
  if (playerMoving) {
    if (Math.abs(dx) > Math.abs(dy)) playerFacing = dx > 0 ? "right" : "left";
    else playerFacing = dy > 0 ? "down" : "up";
    player.x += dx / len * player.speed * dt;
    player.y += dy / len * player.speed * dt;
  }
  animTime += dt;
  const mw = caveMode ? CAVE.w : homeInterior ? 900 : townMode ? TOWN.w : WORLD.w;
  const mh = caveMode ? CAVE.h : homeInterior ? 650 : townMode ? TOWN.h : WORLD.h;
  player.x=Math.max((caveMode || homeInterior || townMode)?55:24,Math.min(mw-((caveMode || homeInterior || townMode)?55:24),player.x));
  player.y=Math.max((caveMode || homeInterior || townMode)?55:24,Math.min(mh-((caveMode || homeInterior || townMode)?55:24),player.y));
  camera.x=Math.max(0,Math.min(mw-viewW,player.x-viewW/2));
  camera.y=Math.max(0,Math.min(mh-viewH,player.y-viewH/2));
  $("caveBtn").hidden = townMode || homeInterior || (caveMode ? false : Math.hypot(player.x-2080,player.y-1450)>115);
  $("townBtn").hidden=townMode||caveMode||homeInterior||Math.hypot(player.x-2310,player.y-900)>115;
  $("townExitBtn").hidden=!townMode || Math.hypot(player.x-800,player.y-1110)>105;
  $("townClock").hidden=homeInterior||caveMode;
  {const hh=Math.floor(worldClock/60),mm=Math.floor(worldClock%60),night=hh>=20||hh<6;$("townClock").textContent=(night?"🌙 ":"☀️ ")+String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+" • روز "+worldDay;}
  $("farmBtn").hidden=townMode||caveMode||homeInterior||Math.hypot(player.x-900,player.y-686)>190;
  const nearTownPerson=townMode?townPeople.find(p=>Math.hypot(player.x-p.x,player.y-p.y)<115):null;
  $("townNpcBtn").hidden=!nearTownPerson;
  $("townNpcBtn").textContent=nearTownPerson?"💬 صحبت با "+nearTownPerson.name:"💬 صحبت با اهالی";
  $("caveBtn").textContent=caveMode?"🚪 خروج از غار":"🕳️ ورود به غار";
  $("npcBtn").hidden = caveMode || homeInterior || Math.hypot(player.x-forestNpc.x,player.y-forestNpc.y) > 145;
  $("homeBtn").hidden = townMode || caveMode || (!homeInterior && Math.hypot(player.x-playerHome.x,player.y-(playerHome.y+45)) > 145);
  $("homeBtn").textContent = homeInterior ? "🚪 خروج از خانه" : "🏡 خانه";
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
function openTownNpc(){
 const p=townPeople.find(q=>Math.hypot(player.x-q.x,player.y-q.y)<115);if(!p)return;
 townNpcIndex=townPeople.indexOf(p);
 const lines={mina:["سلام! چه خوب که اومدی شهر سبز. 🌸","امروز هوا برای قدم زدن توی میدان عالیه!"],hana:["سلام، چه خبر؟","من دوست دارم کوچه‌های قدیمی شهر رو بگردم."],nahid:["خوش اومدی عزیزم، مواظب خودت باش. ❤️","این شهر کوچیکه، اما مردمش دل بزرگی دارن."],saeed:["سلام! به شهر سبز خوش اومدی.","من مراقب ورودی و آرامش شهرم."],rezaei:["سلام عزیزم! به خواربارفروشی من خوش اومدی.","نان تازه و خوراکی محلی دارم؛ هرچی لازم داری بگو. 🌼"]};
 const n=townFriendship[p.id]||0;$("townNpcTitle").textContent=p.name+" • "+p.role;$("townNpcDialogue").textContent=lines[p.id][n%lines[p.id].length];$("townNpcHeart").textContent="💚 میزان آشنایی: "+n;$("townNpcShop").hidden=p.id!=="rezaei";$("townNpcPanel").hidden=false;townFriendship[p.id]=Math.min(20,n+1);saveQuietly();syncXpPanel();
}
function nextTownDialogue(){
 const p=townPeople[townNpcIndex];if(!p)return;
 const lines={mina:["از دیدنت خوشحال شدم. 💗","یه روز بیا با هم توی میدان قدم بزنیم!"],hana:["شهر رو بگرد، کلی جای قشنگ داره!","بعداً باز هم با هم حرف می‌زنیم."],nahid:["هر وقت خسته شدی، کمی استراحت کن.","خوشحالم که شهرمون رو دوست داری."],saeed:["مسیر جنگل از همون دروازه‌ایه که وارد شدی.","روز خوبی داشته باشی!"],rezaei:["اگه خرید داشتی، مغازه بازه؛ بفرما.","برای آشنایان قدیمی همیشه پیشنهاد خوب دارم."]};
 $("townNpcDialogue").textContent=lines[p.id][(townFriendship[p.id]||0)%lines[p.id].length];townFriendship[p.id]=Math.min(20,(townFriendship[p.id]||0)+1);$("townNpcHeart").textContent="💚 میزان آشنایی: "+townFriendship[p.id];saveQuietly();
}
function openTownShop(){const hour=worldClock/60;const open=hour>=8&&hour<20;if(!open){const h=Math.floor(hour),m=Math.floor((hour-h)*60);showToast("خواربارفروشی از ۸ صبح تا ۸ شب بازه؛ ساعت بازی "+String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+" است. 🌙");return;} $("townNpcPanel").hidden=true;$("townShopPanel").hidden=false;$("townShopHours").textContent="ساعت کاری: ۰۸:۰۰ تا ۲۰:۰۰ • ساعت بازی: "+String(Math.floor(hour)).padStart(2,"0")+":"+String(Math.floor((hour%1)*60)).padStart(2,"0");updateTownShop();syncXpPanel();}
function openFarmPanel(){selectedFarmPlot=0;$("farmPanel").hidden=false;updateFarmUI();syncXpPanel();}
function onNewFarmDay(){const maxDays={wheat:3,carrot:2,strawberry:4};for(const p of farmPlots){if(p.state==="growing"&&p.crop&&p.wateredDay===worldDay-1){p.growth=Math.min(maxDays[p.crop]||3,p.growth+1);}p.wateredDay=-1;}showToast("روز جدید شروع شد! یادت نره مزرعه رو آبیاری کنی 🌅");}
function updateFarmUI(){const p=farmPlots[selectedFarmPlot],days={wheat:3,carrot:2,strawberry:4};$("farmPlotsGrid").innerHTML=farmPlots.map((q,i)=>'<button type="button" data-plot="'+i+'" class="'+(i===selectedFarmPlot?'selected':'')+'">زمین '+(i+1)+' • '+(q.state==="empty"?"خالی":q.state==="tilled"?"آماده کاشت":({wheat:"گندم",carrot:"هویج",strawberry:"توت‌فرنگی"}[q.crop]||"محصول"))+(q.state==="growing"?" • "+q.growth+"/"+days[q.crop]+" روز":"")+'</button>').join("");$("farmPlotStatus").textContent=p.state==="empty"?"این زمین هنوز آماده نشده.":p.state==="tilled"?"زمین شخم‌زده است؛ حالا بذر بکار.":("محصول: "+({wheat:"گندم",carrot:"هویج",strawberry:"توت‌فرنگی"}[p.crop])+" • رشد "+p.growth+"/"+days[p.crop]+" روز • "+(p.growth>=days[p.crop]?"آماده برداشت":p.wateredDay===worldDay?"امروز آبیاری شده 💧":"امروز هنوز آب نخورده 💧"));$("farmSeeds").textContent="بذرهای تو: "+(bag.seeds||0);$("farmTill").disabled=p.state!=="empty";$("farmPlant").disabled=p.state!=="tilled"||!(bag.seeds>0);$("farmWater").disabled=p.state!=="growing"||p.growth>=days[p.crop]||p.wateredDay===worldDay;$("farmHarvest").disabled=p.state!=="growing"||p.growth<days[p.crop];}
function farmTill(){const p=farmPlots[selectedFarmPlot];if(p.state!=="empty")return;p.state="tilled";updateFarmUI();saveQuietly();showToast("زمین آماده کاشت شد 🪴");}
function farmPlant(){const p=farmPlots[selectedFarmPlot];if(p.state!=="tilled"||bag.seeds<1)return;bag.seeds--;p.state="growing";p.crop=selectedCrop;p.growth=0;p.wateredDay=-1;updateUI();updateFarmUI();saveQuietly();showToast("بذر کاشته شد! هر روز آبیاریش کن 🌱");}
function farmWater(){const p=farmPlots[selectedFarmPlot],days={wheat:3,carrot:2,strawberry:4};if(p.state!=="growing"||p.wateredDay===worldDay||p.growth>=days[p.crop])return;p.wateredDay=worldDay;updateFarmUI();saveQuietly();showToast("محصول آبیاری شد 💧 فردا رشد می‌کنه!");}
function farmHarvest(){const p=farmPlots[selectedFarmPlot],days={wheat:3,carrot:2,strawberry:4};if(p.state!=="growing"||p.growth<days[p.crop])return;bag[p.crop]=(bag[p.crop]||0)+1;Object.assign(p,{state:"empty",crop:null,growth:0,wateredDay:-1});updateUI();updateFarmUI();saveQuietly();showToast("محصول برداشت شد! ببر پیش خانم رضایی 🌾");}
function sellFarmCrops(){const count=(bag.wheat||0)+(bag.carrot||0)+(bag.strawberry||0),total=(bag.wheat||0)*8+(bag.carrot||0)*10+(bag.strawberry||0)*16;if(!count){showToast("محصولی برای فروش نداری");return;}bag.wheat=bag.carrot=bag.strawberry=0;player.coins+=total;updateUI();updateTownShop();saveQuietly();showToast("خانم رضایی محصولاتت رو خرید! +"+total+" سکه 🪙");}
function updateTownShop(){$("townShopHours").textContent="ساعت کاری: ۰۸:۰۰ تا ۲۰:۰۰ • ساعت بازی: "+String(Math.floor(worldClock/60)).padStart(2,"0")+":"+String(Math.floor(worldClock%60)).padStart(2,"0");$("townShopStock").textContent="موجودی: نان "+townStock.bread+" • بذر "+(bag.seeds||0)+" • سیب "+townStock.apple+" | سکه: "+player.coins;
  $("sellCrops").disabled=!(bag.wheat||bag.carrot||bag.strawberry);$("sellCrops").textContent="فروش محصولات برداشت‌شده • موجودی: "+((bag.wheat||0)+(bag.carrot||0)+(bag.strawberry||0));$("buyBread").disabled=player.coins<8;$("buySeeds").disabled=player.coins<5;$("buyApple").disabled=player.coins<6;}
function consumeTownFood(type){if(!townStock[type]){showToast("از این خوراکی نداری!");return;}if(player.health>=player.maxHealth){showToast("جان تو کامله!");return;}townStock[type]--;player.health=Math.min(player.maxHealth,player.health+(type==="bread"?2:1));updateUI();updateTownShop();saveQuietly();showToast("خوراکی خوردی و جانت بیشتر شد ❤️");}
function buyTownItem(type){const item={bread:{price:8,label:"نان"},seeds:{price:5,label:"بذر"},apple:{price:6,label:"سیب"}}[type];if(player.coins<item.price){showToast("سکه کافی نداری! 🪙");return;}player.coins-=item.price;if(type==="seeds")bag.seeds=(bag.seeds||0)+1;else townStock[type]++;updateUI();updateTownShop();saveQuietly();showToast(item.label+" خریدی! 🛍️");}
function drawFarmPlots(){
 for(const p of farmPlots){
  const x=p.x-camera.x,y=p.y-camera.y;
  ctx.fillStyle="rgba(25,20,14,.28)";ctx.beginPath();ctx.ellipse(x,y+15,32,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#4d3525";ctx.fillRect(x-30,y-19,60,38);
  ctx.fillStyle=p.state==="empty"?"#87603b":p.wateredDay===worldDay?"#493a30":"#68472f";ctx.fillRect(x-27,y-16,54,32);
  ctx.fillStyle="#a17a4e";for(let k=-1;k<=1;k++)ctx.fillRect(x-24,y+k*9,48,2);
  ctx.fillStyle="#382a21";for(let k=-1;k<=1;k++)ctx.fillRect(x-22,y+k*9+3,44,2);
  if(p.state==="growing"&&p.crop){
   const max=({wheat:3,carrot:2,strawberry:4}[p.crop]||3),stage=Math.max(1,Math.min(4,p.growth+1));
   for(let stem=0;stem<Math.min(stage,3);stem++){
    const sx=x-12+stem*12,ht=10+stage*3+stem*2;
    ctx.fillStyle="#285638";ctx.fillRect(sx-2,y-5-ht,4,ht);
    ctx.fillStyle="#397d43";ctx.beginPath();ctx.ellipse(sx-5,y-13-ht,7,3,-.45,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(sx+5,y-18-ht,7,3,.45,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#83b65b";ctx.fillRect(sx-5,y-16-ht,3,2);
   }
   if(p.growth>=max){
    if(p.crop==="wheat"){for(let j=-1;j<=1;j++){const sx=x+j*9;ctx.fillStyle="#4e8140";ctx.fillRect(sx-2,y-35,4,23);ctx.fillStyle="#d8bf70";ctx.fillRect(sx-5,y-43,10,12);ctx.fillStyle="#f0d78b";ctx.fillRect(sx-2,y-45,3,8);}}
    else if(p.crop==="carrot"){ctx.fillStyle="#e17d35";ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x-7,y-25);ctx.lineTo(x+7,y-25);ctx.closePath();ctx.fill();ctx.fillStyle="#f5a34e";ctx.fillRect(x-2,y-22,4,11);ctx.fillStyle="#397447";ctx.fillRect(x-2,y-35,4,12);ctx.fillRect(x-9,y-31,8,3);ctx.fillRect(x+2,y-33,8,3);}
    else{ctx.fillStyle="#387a42";ctx.fillRect(x-13,y-29,26,19);ctx.fillStyle="#d94e60";ctx.fillRect(x-10,y-31,8,8);ctx.fillRect(x+3,y-34,8,8);ctx.fillStyle="#f5a1a2";ctx.fillRect(x-8,y-29,3,3);ctx.fillRect(x+5,y-32,3,3);}
   }
   if(p.wateredDay===worldDay){ctx.fillStyle="#9bd5e2";ctx.fillRect(x-23,y+11,7,2);ctx.fillRect(x+16,y-10,6,2);}
   else{ctx.fillStyle="#e1c17d";ctx.fillRect(x+20,y-14,4,4);}
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
  drawTownBuilding(1160,345,"خواربارفروشی","#a84e3e","shop");
  drawTownBuilding(1430,420,"نانوایی","#b86d3c","bakery");
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
 const mina=id==="mina",hana=id==="hana",saeed=id==="saeed";
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
 if(!saeed){
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
 if(!saeed){
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
 px(17,56,7,18,topShade);px(56,56,7,18,topShade);
 px(18,58,5,12,top);px(57,58,5,12,top);
 px(18,72,6,7,skin);px(56,72,6,7,skin);
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
 if(!saeed){px(27,38,4,3,"#e8a1a0");px(51,38,4,3,"#e8a1a0");}
 else{px(31,43,22,3,hair);px(35,45,14,4,hair);}
 // Character-specific accents.
 if(mina){px(59,54,3,7,"#f3cf75");px(60,55,2,3,"#fff1b8");px(24,47,3,8,"#f6a6c6");}
 if(hana){px(38,47,5,5,"#e8edf4");px(39,48,3,3,"#f5d98d");px(54,77,3,5,"#7ba9d0");}
 if(saeed){px(34,48,4,5,"#d7d4c9");px(42,48,4,5,"#d7d4c9");}
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
function drawCaveGround(){
 const t=WORLD.tile,sx=Math.floor(camera.x/t),sy=Math.floor(camera.y/t),ex=Math.ceil((camera.x+viewW)/t),ey=Math.ceil((camera.y+viewH)/t);
 for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){
  const h=terrainHash(x+81,y+37),px=x*t-camera.x,py=y*t-camera.y;
  ctx.fillStyle=h<.22?"#292d32":h<.72?"#353a40":"#41464a";ctx.fillRect(px,py,t+1,t+1);
  if(h>.76){ctx.fillStyle="#555b60";ctx.fillRect(px+5,py+7,31,24);ctx.fillStyle="#70777b";ctx.fillRect(px+10,py+7,18,7);ctx.fillStyle="#24282d";ctx.fillRect(px+5,py+27,31,5);}
  if(h<.08){ctx.fillStyle="#245568";ctx.beginPath();ctx.ellipse(px+24,py+25,21,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#6bb5c0";ctx.fillRect(px+12,py+21,15,3);}
  if(h>.48&&h<.53){ctx.fillStyle="#6d8b85";ctx.fillRect(px+19,py+13,4,20);ctx.fillRect(px+14,py+25,14,4);}
 }
 // layered rock shelves and shadowed ledges
 for(let i=0;i<8;i++){const x=170+i*185,y=180+(i%3)*290,sx=x-camera.x,sy=y-camera.y;if(sx>-180&&sx<viewW+180&&sy>-100&&sy<viewH+100){ctx.fillStyle="#20252b";ctx.beginPath();ctx.ellipse(sx,sy,105,35,.12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#555d63";ctx.beginPath();ctx.ellipse(sx-5,sy-10,92,27,.12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#858b8b";ctx.fillRect(sx-35,sy-25,28,5);}}
 ctx.fillStyle="#17191b";ctx.fillRect(-camera.x,-camera.y,CAVE.w,38);ctx.fillRect(-camera.x,CAVE.h-38-camera.y,CAVE.w,38);ctx.fillRect(-camera.x,-camera.y,38,CAVE.h);ctx.fillRect(CAVE.w-38-camera.x,-camera.y,38,CAVE.h);
 ctx.fillStyle="#e0c58a";ctx.font="bold 15px Tahoma";ctx.fillText("غار جنگلی • تالار کریستال",CAVE.w/2-camera.x,75-camera.y);
}
function drawCaveObjects(){for(const c of caveChests){let x=c.x-camera.x,y=c.y-camera.y;ctx.fillStyle=c.opened?"#59452d":"#a66a32";ctx.fillRect(x-17,y-12,34,24);ctx.fillStyle=c.opened?"#76634b":"#e5b75b";ctx.fillRect(x-17,y-12,34,7);}}
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

function drawInterior() {
  ctx.fillStyle="#69472f"; ctx.fillRect(0,0,viewW,viewH);
  const ox=(viewW- Math.min(viewW-24,760))/2, oy= Math.max(35,(viewH-520)/2), w=Math.min(viewW-24,760), h=Math.min(viewH-80,520);
  ctx.fillStyle="#b98250"; ctx.fillRect(ox,oy,w,h);
  ctx.fillStyle="#d5a66d"; ctx.fillRect(ox+12,oy+12,w-24,h-24);
  ctx.fillStyle="#7b5134"; ctx.fillRect(ox+18,oy+18,w-36,h-36);
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
  ctx.fillStyle="#fff0c2";ctx.font="bold 16px Tahoma";ctx.textAlign="center";ctx.fillText("خانه من",viewW/2,oy-8);ctx.textAlign="start";
  ctx.fillStyle="#f0d18c";ctx.fillRect(viewW/2-32,oy+h-18,64,18);
}
function terrainHash(x,y){let n=(x*374761393+y*668265263)>>>0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;}
function drawGround() {
 const t=WORLD.tile,sx=Math.floor(camera.x/t),sy=Math.floor(camera.y/t),ex=Math.ceil((camera.x+viewW)/t),ey=Math.ceil((camera.y+viewH)/t);
 for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){
  const h=terrainHash(x,y),px=x*t-camera.x,py=y*t-camera.y;
  const ridge=terrainHash(Math.floor(x/5),Math.floor(y/4));
  ctx.fillStyle=h<.18?"#426f3e":h<.55?"#4b7d43":"#568a4a";ctx.fillRect(px,py,t+1,t+1);
  // Tiny ground grain keeps the grass from reading as a flat repeating grid.
  for(let k=0;k<5;k++){
   const gx=px+4+((x*13+y*7+k*17)%39),gy=py+5+((x*5+y*19+k*11)%37);
   ctx.fillStyle=k%2?"rgba(27,61,35,.22)":"rgba(190,205,119,.18)";
   ctx.fillRect(gx,gy,k%3===0?4:2,1);
  }
  if(ridge>.77){
   ctx.fillStyle="#315b37";ctx.beginPath();ctx.moveTo(px+1,py+35);ctx.lineTo(px+7,py+13);ctx.lineTo(px+25,py+5);ctx.lineTo(px+46,py+17);ctx.lineTo(px+48,py+39);ctx.closePath();ctx.fill();
   ctx.fillStyle="#5f914f";ctx.beginPath();ctx.moveTo(px+5,py+29);ctx.lineTo(px+13,py+12);ctx.lineTo(px+27,py+9);ctx.lineTo(px+42,py+19);ctx.lineTo(px+39,py+35);ctx.closePath();ctx.fill();
   ctx.fillStyle="#8ab66a";ctx.fillRect(px+15,py+13,8,3);ctx.fillRect(px+29,py+19,7,2);
  }
  if(h>.58&&h<.67){
   ctx.fillStyle="#927b55";ctx.fillRect(px+5,py+11,35,24);ctx.fillStyle="#c1a779";ctx.fillRect(px+9,py+10,25,17);
   ctx.fillStyle="#dfc99a";ctx.fillRect(px+13,py+13,11,3);ctx.fillStyle="#6d6248";ctx.fillRect(px+8,py+31,27,3);
  }
  if(h>.91){
   ctx.fillStyle="#285f70";ctx.beginPath();ctx.ellipse(px+24,py+25,25,16,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#4a98a4";ctx.beginPath();ctx.ellipse(px+21,py+21,18,10,-.1,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#a0d5c8";ctx.fillRect(px+11,py+18,13,2);ctx.fillRect(px+29,py+26,7,2);
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
 // Broad, soft-edged forest mounds create depth without blocking movement.
 for(let i=0;i<7;i++){
  const wx=360+i*390,wy=300+(i%3)*610,sx=wx-camera.x,sy=wy-camera.y;
  if(sx>-260&&sx<viewW+260&&sy>-160&&sy<viewH+160){
   ctx.fillStyle="#294f34";ctx.beginPath();ctx.ellipse(sx,sy+8,154,58,.22,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#4c8046";ctx.beginPath();ctx.ellipse(sx-8,sy-5,143,48,.22,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#78a85c";ctx.beginPath();ctx.ellipse(sx-30,sy-20,83,19,.22,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#a0c276";ctx.fillRect(sx-53,sy-25,13,3);ctx.fillRect(sx+19,sy-13,10,2);
  }
 }
}
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
 drawPixelPerson(x,y+39,{hair:"#5b402c",hairHi:"#9a7048",skin:"#d7a17e",skinLight:"#f0c5a2",top:"#486d4b",topHi:"#8eaa70",bottom:"#4a493b",boots:"#2e302a",accent:"#c8ae77"},{step:Math.sin(animTime*2.2)*.5,bob:Math.sin(animTime*2.4)*.6});
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
 ctx.fillStyle=p.top;ctx.fillRect(x-13,base-38+bob,4,14);ctx.fillRect(x+9,base-38+bob,4,14);
 ctx.fillStyle=p.skin;ctx.fillRect(x-14,base-25+bob,5,6);ctx.fillRect(x+9,base-25+bob,5,6);
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
 // expressive eyes, brows, nose and mouth; face direction remains readable
 ctx.fillStyle="#49352f";
 if(opts.facing==="left")ctx.fillRect(x-6,base-61+bob,2,2);
 else if(opts.facing==="right")ctx.fillRect(x+4,base-61+bob,2,2);
 else{ctx.fillRect(x-6,base-61+bob,2,2);ctx.fillRect(x+4,base-61+bob,2,2);}
 ctx.fillStyle="#fff0d9";ctx.fillRect(x-6,base-61+bob,1,1);ctx.fillRect(x+4,base-61+bob,1,1);
 ctx.fillStyle="#b77d65";ctx.fillRect(x-1,base-57+bob,2,2);ctx.fillStyle="#8f5552";ctx.fillRect(x-2,base-53+bob,4,1);
 if(opts.beard){ctx.fillStyle=p.hair;ctx.fillRect(x-6,base-54+bob,12,5);ctx.fillRect(x-8,base-57+bob,3,4);ctx.fillRect(x+5,base-57+bob,3,4);}
 ctx.restore();
}
function drawPlayer(){
 const x=player.x-camera.x,y=player.y-camera.y;
 const leg=playerMoving?Math.sin(animTime*13)*3.2:0;
 drawPixelPerson(x,y+36,{hair:"#50382a",hairHi:"#98704f",skin:"#d7a17e",skinLight:"#f0c5a2",top:"#294967",topHi:"#5e8caf",bottom:"#393c46",boots:"#252b34",accent:"#d8c49a"},{step:leg,bob:playerMoving?Math.abs(Math.sin(animTime*13))*1.2:Math.sin(animTime*2.4)*.35,facing:playerFacing,scale:.82});
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
 if(attackFlash>0){ctx.save();ctx.translate(x,y);ctx.scale(.82,.82);ctx.strokeStyle="#fff0a8";ctx.lineWidth=3;ctx.beginPath();const a=playerFacing==="left"?Math.PI:playerFacing==="up"?-Math.PI/2:playerFacing==="down"?Math.PI/2:0;ctx.arc(0,0,39,a-.75,a+.75);ctx.stroke();ctx.restore();}
}

function nightStrength(){const h=worldClock/60;const dusk=h>=18&&h<21?(h-18)/3:h>=21||h<5?1:h>=5&&h<7?(7-h)/2:0;return Math.max(0,Math.min(.68,dusk*.68));}
function drawNightOverlay(){const a=nightStrength();if(a<=0)return;ctx.save();ctx.fillStyle="rgba(10,18,39,"+a+")";ctx.fillRect(0,0,viewW,viewH);const px=player.x-camera.x,py=player.y-camera.y;const glow=ctx.createRadialGradient(px,py,24,px,py,Math.max(viewW,viewH)*.48);glow.addColorStop(0,"rgba(255,220,145,"+(a*.32)+")");glow.addColorStop(.35,"rgba(255,210,130,"+(a*.12)+")");glow.addColorStop(1,"rgba(255,210,130,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,viewW,viewH);ctx.restore();}
function drawLootDrops(){for(const d of lootDrops){if(d.x<camera.x-40||d.x>camera.x+viewW+40||d.y<camera.y-40||d.y>camera.y+viewH+40)continue;const x=d.x-camera.x,y=d.y-camera.y+Math.sin(animTime*3+d.x*.02)*2;const colors={coin:"#f5c94b",stone:"#aab1b8",iron:"#d88c56",crystal:"#68e5e8",potion:"#c779ef"};ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(x,y+8,10,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors[d.type]||"#fff";if(d.type==="crystal"){ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x+7,y-2);ctx.lineTo(x+3,y+7);ctx.lineTo(x-4,y+6);ctx.lineTo(x-7,y-2);ctx.closePath();ctx.fill();}else if(d.type==="coin"){ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff0a8";ctx.fillRect(x-2,y-4,3,8);}else{ctx.fillRect(x-6,y-6,12,12);ctx.fillStyle="#fff";ctx.fillRect(x-3,y-4,3,3);}}}
function draw() {
  ctx.clearRect(0, 0, viewW, viewH);
  if (homeInterior) { drawInterior(); drawPlayer(); return; }
  if(townMode){drawTown();drawTownPeople();drawPlayer();drawNightOverlay();return;}
  if(caveMode){drawCaveGround();drawCaveObjects();}else drawGround();
  if (!caveMode) { drawHouse(playerHome.x, playerHome.y, homeLevel, false); drawHouse(samanHome.x, samanHome.y, 1, true); drawFarmPlots(); }
  for (const r of activeNodes()) {
    if (r.x < camera.x - 60 || r.x > camera.x + viewW + 60 || r.y < camera.y - 60 || r.y > camera.y + viewH + 60) continue;
    if (r.type === "tree") drawTree(r);
    else if (r.type === "stone") drawRock(r);
    else if(r.type==="crystal"){drawRock(r);let cx=r.x-camera.x,cy=r.y-camera.y;ctx.fillStyle="#73e5df";ctx.fillRect(cx-5,cy-22,10,20);ctx.fillRect(cx-10,cy-12,6,10);ctx.fillRect(cx+5,cy-10,6,8);}
    else drawIron(r);
  }
  const visibleEnemies = caveMode ? caveEnemies : enemies;
  for(const e of visibleEnemies){if(!e.alive)continue;if(e.x<camera.x-60||e.x>camera.x+viewW+60||e.y<camera.y-60||e.y>camera.y+viewH+60)continue;if(e.kind==="slime")drawSlime(e);else drawCrystalGuardian(e);}
  drawLootDrops();
  if(!caveMode) drawForestNpc();
  if(!caveMode){const sx=2310-camera.x,sy=900-camera.y;ctx.fillStyle="#65452c";ctx.fillRect(sx-4,sy-2,8,50);ctx.fillStyle="#b77b3e";ctx.fillRect(sx-43,sy-38,86,34);ctx.strokeStyle="#f0d49a";ctx.lineWidth=3;ctx.strokeRect(sx-43,sy-38,86,34);ctx.fillStyle="#fff0c2";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("شهر سبز",sx,sy-16);ctx.textAlign="start";}
  drawPlayer();
  if(!caveMode)drawNightOverlay();
  ctx.strokeStyle = "#d6f0a8"; ctx.lineWidth = 3;
  ctx.strokeRect(2-camera.x,2-camera.y,(caveMode?CAVE.w:WORLD.w)-4,(caveMode?CAVE.h:WORLD.h)-4);
  if(!caveMode){let x=2080-camera.x,y=1450-camera.y;ctx.fillStyle='#151719';ctx.beginPath();ctx.ellipse(x,y,42,27,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a9bd8d';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#fff';ctx.font='12px Tahoma';ctx.fillText('غار',x-12,y-36);}
}
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
updateUI();
syncXpPanel();
showToast("به جنگل خوش آمدی! 🌲");
requestAnimationFrame(loop);
addEventListener("pagehide", saveQuietly);
})();