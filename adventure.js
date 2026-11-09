(() => {
"use strict";
const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
const WORLD = { w: 2400, h: 1800, tile: 48 };
const SAVE_KEY = "pixelIsland_adventure_save_v1";
let viewW = innerWidth, viewH = innerHeight, dpr = 1;
const camera = { x: 0, y: 0 };
const player = { x: 1200, y: 900, speed: 190, size: 22, health: 5, maxHealth: 5, level: 1, xp: 0, skillPoints: 0, attackPower: 1, coins: 0 };
const bag = { wood: 0, stone: 0, iron: 0, crystal: 0, potion: 0 };
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

let worldClock = 9 * 60;
const playerHome = { x: 700, y: 520 };
const samanHome = { x: 1900, y: 450 };
const forestNpc = { x: 1320, y: 1010, name: "سامان", role: "جنگلبان" };
let enemies = [], caveEnemies = [];
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
  for (let i = 0; i < 115; i++) {
    const x = 100 + rand() * (WORLD.w - 200);
    const y = 100 + rand() * (WORLD.h - 200);
    if (Math.hypot(x - player.x, y - player.y) < 130 || Math.hypot(x-playerHome.x,y-playerHome.y)<155 || Math.hypot(x-samanHome.x,y-samanHome.y)<155) continue;
    const type = rand() < 0.72 ? "tree" : "stone";
    resources.push({ id: "node-" + i, x, y, type, hp: type === "tree" ? 3 : 4, max: type === "tree" ? 3 : 4 });
  }
  for (let i = 0; i < 18; i++) {
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
      if (!Object.prototype.hasOwnProperty.call(data.player, "skillPoints")) player.skillPoints = Math.max(0, player.level - 1);
    }
    if (data.bag) Object.assign(bag, data.bag);
    if (Array.isArray(data.harvested)) harvested = new Set(data.harvested);
    if (Array.isArray(data.caveHarvested)) caveHarvested = new Set(data.caveHarvested);
    caveMode = !!data.caveMode; if(data.caveReturn)caveReturn=data.caveReturn; if(Array.isArray(data.openedChests))openedChests=data.openedChests;
    if(data.quests)quests={...quests,...data.quests,claimed:{...quests.claimed,...(data.quests.claimed||{})}};
    npcMet = !!data.npcMet; npcTalkIndex = Number.isInteger(data.npcTalkIndex) ? data.npcTalkIndex : 0;
    if (data.npcQuest) npcQuest = { ...npcQuest, ...data.npcQuest };
    homeLevel = Math.max(0, Math.min(3, Number(data.homeLevel) || 0));
    homeInterior = !!data.homeInterior; if (data.homeReturn) homeReturn = data.homeReturn;
    townMode=!!data.townMode;if(data.townReturn)townReturn=data.townReturn;if(data.townFriendship)Object.assign(townFriendship,data.townFriendship);if(data.townStock)Object.assign(townStock,data.townStock);
  } catch (e) { console.warn("Save could not be loaded", e); }
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth, speed: player.speed, level: player.level, xp: player.xp, skillPoints: player.skillPoints, attackPower: player.attackPower, coins: player.coins },
      bag, harvested: [...harvested], caveHarvested: [...caveHarvested], caveMode, caveReturn, openedChests, quests, npcMet, npcTalkIndex, npcQuest, homeLevel, homeInterior, homeReturn, townMode, townReturn, townFriendship, townStock
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
  $("health").textContent = player.health + "/" + player.maxHealth;
  $("level").textContent = player.level;
  $("coins").textContent = player.coins;
  $("wood").textContent = bag.wood;
  $("stone").textContent = bag.stone;
  $("iron").textContent = bag.iron;
  $("crystal").textContent = bag.crystal || 0;
  $("potion").textContent = bag.potion || 0;
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
  const spots = [[1450,900],[900,650],[1580,1120],[760,1120],[1740,760],[1120,1320],[620,820]];
  enemies = spots.map((p,i)=>({id:"slime-"+i,x:p[0],y:p[1],spawnX:p[0],spawnY:p[1],hp:3,max:3,alive:true,respawnTimer:0}));
}
makeEnemies();
function makeCave(){
 caveResources=[
 {id:"cs1",x:250,y:250,type:"stone",hp:4,max:4},{id:"cs2",x:900,y:250,type:"stone",hp:4,max:4},
 {id:"ci1",x:420,y:450,type:"iron",hp:5,max:5},{id:"ci2",x:970,y:650,type:"iron",hp:5,max:5},
 {id:"cc1",x:760,y:360,type:"crystal",hp:4,max:4},{id:"cc2",x:300,y:680,type:"crystal",hp:4,max:4}];
 caveChests=[{x:590,y:230,opened:!!openedChests[0]},{x:1030,y:420,opened:!!openedChests[1]}];
 caveEnemies=[{id:"crystal-guardian",x:870,y:470,spawnX:870,spawnY:470,hp:5,max:5,alive:true,respawnTimer:0}];
}
function activeNodes(){return caveMode?caveResources.filter(r=>!caveHarvested.has(r.id)):resources.filter(r=>!harvested.has(r.id));}
function toggleCave(){
 if(!caveMode){caveReturn={x:player.x,y:player.y};caveMode=true;player.x=600;player.y=790;showToast("وارد غار جنگلی شدی 🕯️");}
 else{caveMode=false;player.x=caveReturn.x;player.y=caveReturn.y;showToast("به جنگل برگشتی 🌲");}
 saveQuietly();
}

function harvest() {
  if(caveMode){const chest=caveChests.find(c=>!c.opened&&Math.hypot(player.x-c.x,player.y-c.y)<76);if(chest){chest.opened=true;openedChests=caveChests.map(c=>c.opened);player.coins+=15;const leveled=addXP(25);bag.crystal=(bag.crystal||0)+1;progressNpcCrystal(1);updateUI();saveQuietly();showToast(leveled?"سطح جدید! یک امتیاز مهارت گرفتی ⭐":"صندوق گنج! +۱۵ سکه، ۲۵ تجربه و کریستال 💎");return;}}
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
    if (caveMode) {
      target.respawnTimer=20; player.coins+=10; bag.crystal=(bag.crystal||0)+2; progressNpcCrystal(2);
      const leveled=addXP(25); updateUI(); saveQuietly();
      showToast(leveled?"نگهبان کریستالی شکست خورد! +۱۰ سکه و ۲ کریستال؛ سطح جدید ⭐":"نگهبان کریستالی شکست خورد! +۱۰ سکه، ۲ کریستال و ۲۵ تجربه 💎");
    } else {
      target.respawnTimer=12; player.coins+=5; quests.slime=Math.min(3,quests.slime+1); const leveled=addXP(15);
      updateUI(); saveQuietly(); showToast(leveled?"موجود شکست خورد! سطح جدید و یک امتیاز مهارت ⭐":"موجود جنگلی شکست خورد! +۵ سکه و ۱۵ تجربه ⭐");
    }
  } else showToast("ضربه زدی! ❤️ جان دشمن: "+target.hp);
}

function saveQuietly() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth, speed: player.speed, level: player.level, xp: player.xp, skillPoints: player.skillPoints, attackPower: player.attackPower, coins: player.coins },
      bag, harvested: [...harvested], caveHarvested: [...caveHarvested], caveMode, caveReturn, openedChests, quests, npcMet, npcTalkIndex, npcQuest, homeLevel, homeInterior, homeReturn, townMode, townReturn, townFriendship, townStock
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
  const panelIds = ["inventory", "upgradePanel", "craftPanel", "questPanel", "npcPanel", "homePanel", "townNpcPanel", "townShopPanel"];
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
  $("craftSword").textContent = player.attackPower >= 5 ? "⚔️ شمشیر فولادی (حداکثر)" : "⚔️ شمشیر فولادی — ۵ آهن + ۳ چوب";
  $("craftBoots").textContent = player.speed >= 320 ? "👟 چکمه تندرو (حداکثر)" : "👟 چکمه تندرو — ۴ آهن + ۶ چوب";
  $("craftPotion").textContent = "🧪 معجون سلامتی — ۲ کریستال + ۱ آهن";
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
  worldClock = (worldClock + dt * 8) % 1440;
  if(townMode)townSchedule();
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
      player.health=Math.max(0,player.health-1);damageCooldown=1;updateUI();saveQuietly();
      if(player.health<=0){player.health=player.maxHealth;player.x=caveMode?600:1200;player.y=caveMode?790:900;showToast("انرژیت تمام شد؛ جانت بازیابی شد");updateUI();}
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
  const mw = caveMode ? 1200 : homeInterior ? 900 : townMode ? TOWN.w : WORLD.w;
  const mh = caveMode ? 900 : homeInterior ? 650 : townMode ? TOWN.h : WORLD.h;
  player.x=Math.max((caveMode || homeInterior || townMode)?55:24,Math.min(mw-((caveMode || homeInterior || townMode)?55:24),player.x));
  player.y=Math.max((caveMode || homeInterior || townMode)?55:24,Math.min(mh-((caveMode || homeInterior || townMode)?55:24),player.y));
  camera.x=Math.max(0,Math.min(mw-viewW,player.x-viewW/2));
  camera.y=Math.max(0,Math.min(mh-viewH,player.y-viewH/2));
  $("caveBtn").hidden = townMode || homeInterior || (caveMode ? false : Math.hypot(player.x-2080,player.y-1450)>115);
  $("townBtn").hidden=townMode||caveMode||homeInterior||Math.hypot(player.x-2310,player.y-900)>115;
  $("townExitBtn").hidden=!townMode || Math.hypot(player.x-800,player.y-1110)>105;
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
 setTimeout(()=>{if(enter){townReturn={x:player.x,y:player.y};townMode=true;caveMode=false;homeInterior=false;player.x=800;player.y=1015;showToast("به شهر سبز خوش اومدی! 🏘️");}else{townMode=false;player.x=townReturn.x;player.y=townReturn.y;showToast("به جنگل برگشتی 🌲");}$("townFade").classList.remove("active");saveQuietly();},240);
}
function townSchedule(){
 const night=worldClock>=21*60||worldClock<7*60;
 townPeople.forEach(p=>{if(p.id==="saeed"){p.x=night?180:240;p.y=night?590:570;}if(p.id==="mina"){p.x=night?500:470;p.y=night?620:560;}if(p.id==="hana"){p.x=night?570:560;p.y=night?640:590;}if(p.id==="nahid"){p.x=night?430:420;p.y=night?680:650;}if(p.id==="rezaei"){p.x=1120;p.y=night?610:530;}});
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
function openTownShop(){if(worldClock>=21*60||worldClock<7*60){showToast("مغازه بسته است؛ صبح برگرد! 🌙");return;} $("townNpcPanel").hidden=true;$("townShopPanel").hidden=false;updateTownShop();syncXpPanel();}
function updateTownShop(){$("townShopStock").textContent="موجودی: نان "+townStock.bread+" • بذر "+townStock.seeds+" • سیب "+townStock.apple+" | سکه: "+player.coins;$("buyBread").disabled=player.coins<8;$("buySeeds").disabled=player.coins<5;$("buyApple").disabled=player.coins<6;}
function consumeTownFood(type){if(!townStock[type]){showToast("از این خوراکی نداری!");return;}if(player.health>=player.maxHealth){showToast("جان تو کامله!");return;}townStock[type]--;player.health=Math.min(player.maxHealth,player.health+(type==="bread"?2:1));updateUI();updateTownShop();saveQuietly();showToast("خوراکی خوردی و جانت بیشتر شد ❤️");}
function buyTownItem(type){const item={bread:{price:8,label:"نان"},seeds:{price:5,label:"بذر"},apple:{price:6,label:"سیب"}}[type];if(player.coins<item.price){showToast("سکه کافی نداری! 🪙");return;}player.coins-=item.price;townStock[type]++;updateUI();updateTownShop();saveQuietly();showToast(item.label+" خریدی! 🛍️");}
function drawTown(){
  const w=TOWN.w,h=TOWN.h,tile=40;
  ctx.fillStyle="#bca77b";ctx.fillRect(0,0,viewW,viewH);
  const sx=Math.floor(camera.x/tile),sy=Math.floor(camera.y/tile),ex=Math.ceil((camera.x+viewW)/tile),ey=Math.ceil((camera.y+viewH)/tile);
  for(let gy=sy;gy<=ey;gy++)for(let gx=sx;gx<=ex;gx++){
    const n=(gx*31+gy*17+gx*gy*3)%11;
    ctx.fillStyle=n<3?"#c7b487":n<7?"#d1bd91":"#cbb78b";
    ctx.fillRect(gx*tile-camera.x,gy*tile-camera.y,tile+1,tile+1);
    if(n===2||n===8){ctx.fillStyle="#b39d73";ctx.fillRect(gx*tile+8-camera.x,gy*tile+13-camera.y,3,2);ctx.fillRect(gx*tile+27-camera.x,gy*tile+30-camera.y,2,3);}
  }
  // A winding, worn stone road connects the gate to the square.
  ctx.fillStyle="#a58c65";ctx.beginPath();ctx.moveTo(680-camera.x,1200-camera.y);ctx.lineTo(920-camera.x,1200-camera.y);ctx.lineTo(900-camera.x,810-camera.y);ctx.lineTo(880-camera.x,700-camera.y);ctx.lineTo(720-camera.x,700-camera.y);ctx.lineTo(700-camera.x,820-camera.y);ctx.closePath();ctx.fill();
  for(let y=730;y<1190;y+=42)for(let x=710;x<900;x+=48){const xx=x-camera.x,yy=y-camera.y;ctx.fillStyle=((x+y)%3)?"#c8b58d":"#bca77f";ctx.fillRect(xx,yy,42,31);ctx.strokeStyle="#a58e69";ctx.lineWidth=1;ctx.strokeRect(xx,yy,42,31);}
  // Main square, cobbles and decorative border.
  ctx.fillStyle="#a98f68";ctx.fillRect(500-camera.x,380-camera.y,620,450);
  ctx.fillStyle="#d1bd91";ctx.fillRect(514-camera.x,394-camera.y,592,422);
  for(let y=405;y<810;y+=34)for(let x=525;x<1090;x+=44){ctx.fillStyle=((x/44+y/34|0)%2)?"#c7b487":"#d9c69a";ctx.fillRect(x-camera.x,y-camera.y,39,28);ctx.strokeStyle="#b5a078";ctx.lineWidth=1;ctx.strokeRect(x-camera.x,y-camera.y,39,28);}
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
  ctx.textAlign="start";
}
function drawTownTree(x,y,i){
  ctx.fillStyle="#715039";ctx.fillRect(x-7,y-3,14,42);ctx.fillStyle="#244e34";ctx.beginPath();ctx.arc(x,y-16,34,0,Math.PI*2);ctx.fill();ctx.fillStyle=i%2?"#397747":"#46864b";ctx.beginPath();ctx.arc(x-5,y-26,27,0,Math.PI*2);ctx.fill();ctx.fillStyle="#72a95c";ctx.beginPath();ctx.arc(x-12,y-35,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#8bbd69";ctx.fillRect(x+7,y-25,6,5);
}
function drawFlowerPot(x,y,i){
  ctx.fillStyle="#9c583e";ctx.fillRect(x-8,y-2,16,10);ctx.fillStyle="#c57b51";ctx.fillRect(x-10,y-5,20,4);
  const colors=["#f0c36e","#df7890","#f5e6b4","#b9a0df"];ctx.fillStyle="#477d43";ctx.fillRect(x-2,y-14,3,12);ctx.fillRect(x+3,y-12,3,10);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(x-5,y-18,7,7);ctx.fillRect(x+1,y-16,7,7);
}
function drawBench(x,y){
  ctx.fillStyle="#61452f";ctx.fillRect(x-25,y-3,50,7);ctx.fillStyle="#a16b42";ctx.fillRect(x-25,y-12,50,9);ctx.fillRect(x-20,y+4,5,10);ctx.fillRect(x+15,y+4,5,10);
}
function drawTownLamp(x,y){
  ctx.fillStyle="#4d493e";ctx.fillRect(x-3,y-32,6,42);ctx.fillStyle="#6d5941";ctx.fillRect(x-10,y-38,20,8);ctx.fillStyle="#ffe5a0";ctx.fillRect(x-6,y-35,12,11);ctx.fillStyle="#fff5cf";ctx.fillRect(x-3,y-32,6,5);
  if(worldClock>=1080||worldClock<360){ctx.fillStyle="#ffe8a0";ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(x,y-28,34,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
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
  [-57,35].forEach(wx=>{ctx.fillStyle="#80583c";ctx.fillRect(sx+wx-15,sy+27,30,30);ctx.fillStyle="#80b8bb";ctx.fillRect(sx+wx-11,sy+31,22,22);ctx.fillStyle="#c7e2d7";ctx.fillRect(sx+wx-9,sy+33,7,7);ctx.fillStyle="#f1dfb5";ctx.fillRect(sx+wx-1,sy+31,3,22);ctx.fillRect(sx+wx-11,sy+41,22,3);});
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
  ctx.fillStyle="#b96d4b";ctx.fillRect(sx-30,sy+94,12,10);ctx.fillRect(sx+20,sy+94,12,10);ctx.fillStyle="#4d884b";ctx.fillRect(sx-27,sy+87,6,9);ctx.fillRect(sx+23,sy+87,6,9);
}
function drawTownPeople(){
  townPeople.forEach(p=>{
    const x=p.x-camera.x,y=p.y-camera.y;
    if(x< -65||x>viewW+65||y< -90||y>viewH+65)return;
    const bob=playerMoving?Math.sin(animTime*9+p.x*.01)*1.5:Math.sin(animTime*2.2+p.x*.01)*.7;
    const blink=(Math.floor(animTime*1.4+p.x*.03)%7===0);
    // soft ground shadow
    ctx.fillStyle="#54452f";ctx.globalAlpha=.24;ctx.beginPath();ctx.ellipse(x,y+2,20,6,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // legs, trousers and shoes
    const leg=Math.sin(animTime*4+p.x*.02)*1.2;
    ctx.fillStyle=p.id==="saeed"?"#303b48":"#55483e";ctx.fillRect(x-10,y+25+bob,8,15+leg);ctx.fillRect(x+2,y+25+bob,8,15-leg);
    ctx.fillStyle="#3a3029";ctx.fillRect(x-12,y+38+bob,11,5);ctx.fillRect(x+2,y+38+bob,12,5);
    if(p.id==="mina"){ctx.fillStyle="#30313d";ctx.fillRect(x-14,y+22+bob,28,9);}
    if(p.id==="hana"){ctx.fillStyle="#b9b9b0";ctx.fillRect(x-13,y+23+bob,26,8);}
    if(p.id==="nahid"||p.id==="rezaei"){ctx.fillStyle=p.id==="nahid"?"#633e45":"#4b6545";ctx.fillRect(x-14,y+20+bob,28,13);}
    // torso and sleeves
    const top=p.id==="mina"?"#d96c91":p.id==="hana"?"#367eae":p.id==="nahid"?"#8e4054":p.id==="saeed"?"#34485a":"#557b4b";
    ctx.fillStyle=top;ctx.fillRect(x-14,y+1+bob,28,25);ctx.fillRect(x-19,y+5+bob,7,17);ctx.fillRect(x+12,y+5+bob,7,17);
    ctx.fillStyle=p.id==="mina"?"#f2a2b8":p.id==="hana"?"#83c0d7":p.id==="nahid"?"#c47b89":p.id==="saeed"?"#62768a":"#91ad72";
    ctx.fillRect(x-11,y+4+bob,22,3);
    // collar, hands and accessories
    ctx.fillStyle="#eac09b";ctx.fillRect(x-4,y-3+bob,8,7);ctx.fillRect(x-20,y+20+bob,6,6);ctx.fillRect(x+14,y+20+bob,6,6);
    if(p.id==="mina"){ctx.fillStyle="#f4d68c";ctx.fillRect(x-2,y+9+bob,4,4);}
    if(p.id==="hana"){ctx.fillStyle="#e4d7b2";ctx.fillRect(x-3,y+8+bob,6,3);}
    if(p.id==="nahid"){ctx.fillStyle="#e6c37c";ctx.fillRect(x-3,y+9+bob,6,5);}
    if(p.id==="saeed"){ctx.fillStyle="#d8d0b7";ctx.fillRect(x-9,y+8+bob,18,3);}
    if(p.id==="rezaei"){ctx.fillStyle="#e6c47a";ctx.fillRect(x-7,y+12+bob,14,3);}
    // face and ears
    ctx.fillStyle="#d79b76";ctx.fillRect(x-11,y-29+bob,22,25);ctx.fillRect(x-14,y-21+bob,4,7);ctx.fillRect(x+10,y-21+bob,4,7);
    ctx.fillStyle="#efc6a0";ctx.fillRect(x-8,y-27+bob,16,19);ctx.fillRect(x-7,y-9+bob,14,3);
    // hair silhouette varies per resident
    const hair=p.id==="mina"?"#60372f":p.id==="hana"?"#211f2b":p.id==="nahid"?"#58383a":p.id==="saeed"?"#28262a":"#594039";
    ctx.fillStyle=hair;
    if(p.id==="saeed"){
      ctx.fillRect(x-13,y-34+bob,26,9);ctx.fillRect(x-14,y-30+bob,6,14);ctx.fillRect(x+8,y-30+bob,6,12);
      ctx.fillRect(x-10,y-38+bob,7,6);ctx.fillRect(x-2,y-40+bob,9,7);ctx.fillRect(x+5,y-36+bob,7,5);
    }else if(p.id==="nahid"||p.id==="rezaei"){
      ctx.fillRect(x-13,y-34+bob,26,10);ctx.fillRect(x-14,y-29+bob,6,17);ctx.fillRect(x+8,y-29+bob,6,16);ctx.beginPath();ctx.arc(x+10,y-36+bob,8,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillRect(x-14,y-34+bob,28,10);ctx.fillRect(x-15,y-29+bob,6,23);ctx.fillRect(x+9,y-29+bob,7,23);
      ctx.fillRect(x-13,y-38+bob,9,7);ctx.fillRect(x-4,y-40+bob,10,8);ctx.fillRect(x+5,y-37+bob,9,7);
      if(p.id==="mina"){ctx.fillRect(x-17,y-18+bob,5,23);ctx.fillRect(x+12,y-15+bob,6,22);}
      if(p.id==="hana"){ctx.fillRect(x-18,y-18+bob,6,29);ctx.fillRect(x+12,y-16+bob,7,30);}
    }
    // eyes, brows, nose and a subtle smile
    if(!blink){ctx.fillStyle="#29252a";ctx.fillRect(x-7,y-19+bob,4,4);ctx.fillRect(x+3,y-19+bob,4,4);ctx.fillStyle="#fff4df";ctx.fillRect(x-6,y-19+bob,1,1);ctx.fillRect(x+4,y-19+bob,1,1);}
    else{ctx.fillStyle="#65483d";ctx.fillRect(x-7,y-17+bob,4,1);ctx.fillRect(x+3,y-17+bob,4,1);}
    ctx.fillStyle=hair;ctx.fillRect(x-8,y-23+bob,5,2);ctx.fillRect(x+3,y-23+bob,5,2);
    ctx.fillStyle="#bd8067";ctx.fillRect(x,y-14+bob,2,3);
    ctx.fillStyle="#9d4f55";ctx.fillRect(x-3,y-8+bob,6,2);
    if(p.id==="saeed"){ctx.fillStyle="#49352f";ctx.fillRect(x-8,y-10+bob,16,5);ctx.fillRect(x-10,y-13+bob,4,4);ctx.fillRect(x+6,y-13+bob,4,4);}
    if(p.id==="mina"||p.id==="hana"){ctx.fillStyle="#e5b5a1";ctx.fillRect(x-12,y-12+bob,3,3);ctx.fillRect(x+9,y-12+bob,3,3);}
    if(p.id==="nahid"||p.id==="rezaei"){ctx.fillStyle="#d9b56f";ctx.fillRect(x-14,y-13+bob,3,4);ctx.fillRect(x+11,y-13+bob,3,4);}
    // label and talk marker
    ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#3d3429";ctx.strokeText(p.name,x,y-50+bob);ctx.fillStyle="#fff5d9";ctx.fillText(p.name,x,y-50+bob);
    if(Math.hypot(player.x-p.x,player.y-p.y)<115){ctx.fillStyle="#ffe58a";ctx.font="bold 18px Tahoma";ctx.fillText("…",x,y-65+bob);}
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
 for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){ctx.fillStyle=((x*13+y*19)%4===0)?"#292c30":"#35383b";ctx.fillRect(x*t-camera.x,y*t-camera.y,t+1,t+1);}
 ctx.fillStyle="#17191b";ctx.fillRect(-camera.x,-camera.y,1200,44);ctx.fillRect(-camera.x,856-camera.y,1200,44);ctx.fillRect(-camera.x,-camera.y,44,900);ctx.fillRect(1156-camera.x,-camera.y,44,900);
 ctx.fillStyle="#e0c58a";ctx.font="bold 15px Tahoma";ctx.fillText("غار جنگلی",520-camera.x,90-camera.y);
}
function drawCaveObjects(){for(const c of caveChests){let x=c.x-camera.x,y=c.y-camera.y;ctx.fillStyle=c.opened?"#59452d":"#a66a32";ctx.fillRect(x-17,y-12,34,24);ctx.fillStyle=c.opened?"#76634b":"#e5b75b";ctx.fillRect(x-17,y-12,34,7);}}
function drawHouse(x, y, level, isSaman) {
  const sx=x-camera.x, sy=y-camera.y;
  ctx.fillStyle="#1d3022"; ctx.fillRect(sx-76,sy+26,152,15);
  if (!isSaman && level === 0) {
    ctx.fillStyle="#8a7046"; ctx.fillRect(sx-54,sy+10,108,8);
    ctx.fillStyle="#d8bd78"; ctx.fillRect(sx-48,sy-8,96,18);
    ctx.fillStyle="#5b4930"; ctx.fillRect(sx-12,sy-24,24,18);
    ctx.fillStyle="#f0d99b"; ctx.font="bold 12px Tahoma"; ctx.textAlign="center"; ctx.fillText("زمین خانه",sx,sy-35); ctx.textAlign="start";
    return;
  }
  const scale = isSaman ? 1 : 1 + (level-1)*0.12;
  const w=112*scale,h=72*scale;
  ctx.fillStyle="#68472e"; ctx.fillRect(sx-w/2,sy-h/2,w,h);
  ctx.fillStyle="#b77a43"; ctx.fillRect(sx-w/2-9,sy-h/2-19,w+18,28);
  ctx.fillStyle="#d59a55"; ctx.fillRect(sx-w/2+3,sy-h/2-15,w-6,9);
  ctx.fillStyle="#75452c"; ctx.fillRect(sx-w/2+12,sy-h/2+12,w-24,h-12);
  ctx.fillStyle="#8ed0d0"; ctx.fillRect(sx-w/2+13,sy-h/2+5,19,17); ctx.fillRect(sx+w/2-32,sy-h/2+5,19,17);
  ctx.strokeStyle="#e8d5a0"; ctx.lineWidth=3; ctx.strokeRect(sx-w/2+13,sy-h/2+5,19,17); ctx.strokeRect(sx+w/2-32,sy-h/2+5,19,17);
  ctx.fillStyle="#4b3021"; ctx.fillRect(sx-12,sy+4,24,32);
  ctx.fillStyle="#d5a35f"; ctx.fillRect(sx+4,sy+17,3,3);
  ctx.fillStyle="#553b2a"; ctx.fillRect(sx+w/2-23,sy-h/2-39,13,27);
  ctx.fillStyle="#b6d6a1"; ctx.fillRect(sx+w/2-21,sy-h/2-36,9,5);
  ctx.fillStyle="#fff0c2"; ctx.font="bold 12px Tahoma"; ctx.textAlign="center";
  ctx.fillText(isSaman ? "کلبه سامان" : (level===1?"خانه من":level===2?"خانه بزرگ من":"خانه لوکس من"),sx,sy-h/2-48);
  ctx.textAlign="start";
  if (level >= 2 || isSaman) {
    ctx.fillStyle="#d8c28a"; ctx.fillRect(sx-66,sy+39,132,5);
    ctx.fillStyle="#4d8b4b"; ctx.fillRect(sx-57,sy+43,12,9); ctx.fillRect(sx+43,sy+43,12,9);
  }
  if (!isSaman && level >= 3) {
    ctx.fillStyle="#e9cf76"; ctx.fillRect(sx-3,sy-h/2-27,6,6);
    ctx.fillStyle="#6c9a55"; ctx.fillRect(sx-80,sy+12,12,22); ctx.fillRect(sx+68,sy+12,12,22);
  }
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
function drawGround() {
  const t = WORLD.tile;
  const sx = Math.floor(camera.x / t), sy = Math.floor(camera.y / t);
  const ex = Math.ceil((camera.x + viewW) / t), ey = Math.ceil((camera.y + viewH) / t);
  for (let y = sy; y <= ey; y++) for (let x = sx; x <= ex; x++) {
    const v = ((x * 17 + y * 31) % 7);
    ctx.fillStyle = v === 0 ? "#477b43" : v === 1 ? "#4b8045" : "#4e8548";
    ctx.fillRect(x * t - camera.x, y * t - camera.y, t + 1, t + 1);
    if (v === 2 || v === 5) {
      ctx.fillStyle = "#639456";
      ctx.fillRect(x * t + 12 - camera.x, y * t + 17 - camera.y, 3, 3);
      ctx.fillRect(x * t + 29 - camera.x, y * t + 31 - camera.y, 2, 5);
    }
    if ((x * 7 + y * 11) % 19 === 0) { ctx.fillStyle = "#e8d68b"; ctx.fillRect(x*t+34-camera.x,y*t+10-camera.y,4,4); ctx.fillStyle="#fff0c2"; ctx.fillRect(x*t+35-camera.x,y*t+8-camera.y,2,2); }
  }
}
function drawTree(r) {
  const x = r.x - camera.x, y = r.y - camera.y;
  ctx.fillStyle = "#203d29"; ctx.beginPath(); ctx.ellipse(x,y+16,27,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#68452c"; ctx.fillRect(x - 7, y + 2, 14, 25);
  ctx.fillStyle = "#245b36"; ctx.fillRect(x - 23, y - 22, 46, 34);
  ctx.fillStyle = "#347b42"; ctx.fillRect(x - 18, y - 34, 36, 22);
  ctx.fillStyle = "#4c9850"; ctx.fillRect(x - 10, y - 42, 20, 13);
  ctx.fillStyle = "#76b85b"; ctx.fillRect(x - 10, y - 32, 7, 6);
}
function drawRock(r) {
  const x = r.x - camera.x, y = r.y - camera.y;
  ctx.fillStyle = "#59635d"; ctx.fillRect(x - 17, y - 10, 34, 23);
  ctx.fillStyle = "#8b9890"; ctx.fillRect(x - 11, y - 16, 20, 10);
  ctx.fillStyle = "#b4c0b6"; ctx.fillRect(x - 7, y - 12, 6, 4);
}
function drawIron(r) {
  drawRock(r);
  const x = r.x - camera.x, y = r.y - camera.y;
  ctx.fillStyle = "#d18a54"; ctx.fillRect(x - 5, y - 5, 8, 7);
  ctx.fillRect(x + 5, y + 3, 5, 5);
}
function drawSlime(e) {
  const x=e.x-camera.x,y=e.y-camera.y;
  const bounce = Math.sin(animTime * 5 + e.spawnX * 0.01) * 2.2;
  ctx.fillStyle="#173d2b";ctx.fillRect(x-18,y+8,36,7);
  ctx.fillStyle="#6dbb59";ctx.fillRect(x-17,y-8+bounce,34,17-bounce*0.25);ctx.fillRect(x-11,y-15+bounce,22,9);
  ctx.fillStyle="#a4df72";ctx.fillRect(x-9,y-12,7,4);
  ctx.fillStyle="#17301f";ctx.fillRect(x-8,y-3,4,5);ctx.fillRect(x+5,y-3,4,5);
  ctx.fillStyle="#203b29";ctx.fillRect(x-18,y-25,36,5);
  ctx.fillStyle="#e8d36b";ctx.fillRect(x-18,y-25,36*(e.hp/e.max),5);
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
  const near = Math.hypot(player.x-forestNpc.x, player.y-forestNpc.y) < 145;
  const bob = Math.sin(animTime * 2.4) * 1.5;
  const wave = near ? Math.sin(animTime * 5) * 2.5 : 0;
  if(x < -60 || x > viewW+60 || y < -70 || y > viewH+60) return;
  ctx.fillStyle="#263b2b";ctx.fillRect(x-13,y+9,26,8);
  ctx.fillStyle="#4f7651";ctx.fillRect(x-12,y-7+bob,24,20);
  ctx.fillStyle="#e7bd91";ctx.fillRect(x-9,y-23+bob,18,16);
  ctx.fillStyle="#6b4a2e";ctx.fillRect(x-11,y-27,22,7);ctx.fillRect(x-15,y-22,30,4);
  ctx.fillStyle="#243021";ctx.fillRect(x-5,y-17+bob,3,3);ctx.fillRect(x+3,y-17+bob,3,3);
  ctx.fillStyle="#4f7651";ctx.fillRect(x+10,y-2+bob+wave,5,12);
  if (!npcQuest.claimed) { ctx.fillStyle="#ffe58a";ctx.font="bold 17px Tahoma";ctx.textAlign="center";ctx.fillText("!",x,y-53+bob); }
  ctx.fillStyle="#fff2c7";ctx.font="bold 12px Tahoma";ctx.textAlign="center";ctx.fillText(forestNpc.name+" • "+forestNpc.role,x,y-38+bob);ctx.textAlign="start";
}
function drawPlayer() {
  const x = player.x - camera.x, y = player.y - camera.y;
  const step = playerMoving ? Math.sin(animTime * 13) * 3 : Math.sin(animTime * 2.2) * 0.8;
  const legA = playerMoving ? step : 0, legB = -legA;
  ctx.fillStyle = "#243c28";
  ctx.fillRect(x - 9, y + 7 + legA, 7, 10);
  ctx.fillRect(x + 2, y + 7 + legB, 7, 10);
  ctx.fillStyle = "#3d75ad"; ctx.fillRect(x - 10, y - 5 + (playerMoving ? Math.abs(step)*0.25 : 0), 20, 19);
  ctx.fillStyle = "#edbd8c"; ctx.fillRect(x - 8, y - 18, 16, 15);
  ctx.fillStyle = "#553c2d"; ctx.fillRect(x - 9, y - 20, 18, 6);
  ctx.fillStyle = "#17251d";
  if(playerFacing === "left"){ctx.fillRect(x-6,y-12,3,3);} else if(playerFacing === "right"){ctx.fillRect(x+3,y-12,3,3);} else {ctx.fillRect(x-4,y-12,3,3);ctx.fillRect(x+3,y-12,3,3);}
  if (attackFlash > 0) { ctx.strokeStyle = "#fff0a8"; ctx.lineWidth = 3; ctx.beginPath(); const a = playerFacing === "left" ? Math.PI : playerFacing === "up" ? -Math.PI/2 : playerFacing === "down" ? Math.PI/2 : 0; ctx.arc(x,y,34,a-0.75,a+0.75); ctx.stroke(); }
}
function draw() {
  ctx.clearRect(0, 0, viewW, viewH);
  if (homeInterior) { drawInterior(); drawPlayer(); return; }
  if(townMode){drawTown();drawTownPeople();drawPlayer();return;}
  if(caveMode){drawCaveGround();drawCaveObjects();}else drawGround();
  if (!caveMode) { drawHouse(playerHome.x, playerHome.y, homeLevel, false); drawHouse(samanHome.x, samanHome.y, 1, true); }
  for (const r of activeNodes()) {
    if (r.x < camera.x - 60 || r.x > camera.x + viewW + 60 || r.y < camera.y - 60 || r.y > camera.y + viewH + 60) continue;
    if (r.type === "tree") drawTree(r);
    else if (r.type === "stone") drawRock(r);
    else if(r.type==="crystal"){drawRock(r);let cx=r.x-camera.x,cy=r.y-camera.y;ctx.fillStyle="#73e5df";ctx.fillRect(cx-5,cy-22,10,20);ctx.fillRect(cx-10,cy-12,6,10);ctx.fillRect(cx+5,cy-10,6,8);}
    else drawIron(r);
  }
  const visibleEnemies = caveMode ? caveEnemies : enemies;
  for(const e of visibleEnemies){if(!e.alive)continue;if(e.x<camera.x-60||e.x>camera.x+viewW+60||e.y<camera.y-60||e.y>camera.y+viewH+60)continue;if(caveMode)drawCrystalGuardian(e);else drawSlime(e);}
  if(!caveMode) drawForestNpc();
  if(!caveMode){const sx=2310-camera.x,sy=900-camera.y;ctx.fillStyle="#65452c";ctx.fillRect(sx-4,sy-2,8,50);ctx.fillStyle="#b77b3e";ctx.fillRect(sx-43,sy-38,86,34);ctx.strokeStyle="#f0d49a";ctx.lineWidth=3;ctx.strokeRect(sx-43,sy-38,86,34);ctx.fillStyle="#fff0c2";ctx.font="bold 13px Tahoma";ctx.textAlign="center";ctx.fillText("شهر سبز",sx,sy-16);ctx.textAlign="start";}
  drawPlayer();
  ctx.strokeStyle = "#d6f0a8"; ctx.lineWidth = 3;
  ctx.strokeRect(2-camera.x,2-camera.y,(caveMode?1200:WORLD.w)-4,(caveMode?900:WORLD.h)-4);
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