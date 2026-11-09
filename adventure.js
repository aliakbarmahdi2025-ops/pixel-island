(() => {
"use strict";
const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
const WORLD = { w: 2400, h: 1800, tile: 48 };
const SAVE_KEY = "pixelIsland_adventure_save_v1";
let viewW = innerWidth, viewH = innerHeight, dpr = 1;
const camera = { x: 0, y: 0 };
const player = { x: 1200, y: 900, speed: 190, size: 22, health: 5, level: 1, xp: 0, coins: 0 };
const bag = { wood: 0, stone: 0, iron: 0 };
let harvested = new Set(), caveHarvested = new Set();
let caveMode = false, caveReturn = {x:1200,y:900}, openedChests = [];
let caveResources = [], caveChests = [];
let resources = [];
let enemies = [];
let attackCooldown = 0, attackFlash = 0, damageCooldown = 0;
let move = { x: 0, y: 0 };
let toastTimer = 0;
let lastTime = 0;

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
    if (Math.hypot(x - player.x, y - player.y) < 130) continue;
    const type = rand() < 0.72 ? "tree" : "stone";
    resources.push({ id: "node-" + i, x, y, type, hp: type === "tree" ? 3 : 4, max: type === "tree" ? 3 : 4 });
  }
  for (let i = 0; i < 18; i++) {
    resources.push({ id: "iron-" + i, x: 120 + rand() * (WORLD.w - 240), y: 120 + rand() * (WORLD.h - 240), type: "iron", hp: 5, max: 5 });
  }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.player) Object.assign(player, data.player);
    if (data.bag) Object.assign(bag, data.bag);
    if (Array.isArray(data.harvested)) harvested = new Set(data.harvested);
    if (Array.isArray(data.caveHarvested)) caveHarvested = new Set(data.caveHarvested);
    caveMode = !!data.caveMode; if(data.caveReturn)caveReturn=data.caveReturn; if(Array.isArray(data.openedChests))openedChests=data.openedChests;
  } catch (e) { console.warn("Save could not be loaded", e); }
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, level: player.level, xp: player.xp, coins: player.coins },
      bag, harvested: [...harvested], caveHarvested:[...caveHarvested], caveMode, caveReturn, openedChests
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
function updateUI() {
  $("health").textContent = player.health;
  $("level").textContent = player.level;
  $("coins").textContent = player.coins;
  $("wood").textContent = bag.wood;
  $("stone").textContent = bag.stone;
  $("iron").textContent = bag.iron;
  $("crystal").textContent = bag.crystal || 0;
}
load();
makeWorld();
makeCave();
function makeEnemies() {
  const spots = [[1450,900],[900,650],[1580,1120],[760,1120],[1740,760],[1120,1320],[620,820]];
  enemies = spots.map((p,i)=>({id:"slime-"+i,x:p[0],y:p[1],hp:3,max:3,alive:true}));
}
makeEnemies();
function makeCave(){
 caveResources=[
 {id:"cs1",x:250,y:250,type:"stone",hp:4,max:4},{id:"cs2",x:900,y:250,type:"stone",hp:4,max:4},
 {id:"ci1",x:420,y:450,type:"iron",hp:5,max:5},{id:"ci2",x:970,y:650,type:"iron",hp:5,max:5},
 {id:"cc1",x:760,y:360,type:"crystal",hp:4,max:4},{id:"cc2",x:300,y:680,type:"crystal",hp:4,max:4}];
 caveChests=[{x:590,y:230,opened:!!openedChests[0]},{x:1030,y:420,opened:!!openedChests[1]}];
}
function activeNodes(){return caveMode?caveResources.filter(r=>!caveHarvested.has(r.id)):resources.filter(r=>!harvested.has(r.id));}
function toggleCave(){
 if(!caveMode){caveReturn={x:player.x,y:player.y};caveMode=true;player.x=600;player.y=790;showToast("وارد غار جنگلی شدی 🕯️");}
 else{caveMode=false;player.x=caveReturn.x;player.y=caveReturn.y;showToast("به جنگل برگشتی 🌲");}
 saveQuietly();
}

function harvest() {
  if(caveMode){const chest=caveChests.find(c=>!c.opened&&Math.hypot(player.x-c.x,player.y-c.y)<76);if(chest){chest.opened=true;openedChests=caveChests.map(c=>c.opened);player.coins+=15;player.xp+=25;bag.crystal=(bag.crystal||0)+1;if(player.xp>=player.level*50){player.xp-=player.level*50;player.level++;}updateUI();saveQuietly();showToast("صندوق گنج! +۱۵ سکه، ۲۵ تجربه و کریستال 💎");return;}}
  let nearest = null, best = 76;
  for (const r of activeNodes()) {
    const d = Math.hypot(player.x - r.x, player.y - r.y);
    if (d < best) { best = d; nearest = r; }
  }
  if (!nearest) { showToast("به درخت یا سنگ نزدیک‌تر شو"); return; }
  nearest.hp--;
  if (nearest.hp <= 0) {
    harvested.add(nearest.id);
    if (nearest.type === "tree") bag.wood += 3;
    if (nearest.type === "stone") bag.stone += 2;
    if (nearest.type === "iron") bag.iron += 1;
    if (nearest.type === "crystal") bag.crystal = (bag.crystal||0)+1;
    player.xp += 10;
    if (player.xp >= player.level * 50) {
      player.xp -= player.level * 50;
      player.level++;
      showToast("سطح جدید! ⭐ سطح " + player.level);
    } else {
      showToast(nearest.type === "tree" ? "۳ چوب جمع کردی 🪵" : nearest.type === "stone" ? "۲ سنگ جمع کردی 🪨" : nearest.type === "iron" ? "۱ آهن جمع کردی ⛏️" : "۱ کریستال جمع کردی 💎");
    }
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
  for (const e of enemies) { if (!e.alive) continue; const d=Math.hypot(player.x-e.x,player.y-e.y); if(d<best){best=d;target=e;} }
  if (!target) { showToast("برای حمله به موجود نزدیک‌تر شو"); return; }
  target.hp--;
  if (target.hp <= 0) {
    target.alive=false; player.coins+=5; player.xp+=15;
    if(player.xp>=player.level*50){player.xp-=player.level*50;player.level++;}
    updateUI(); saveQuietly(); showToast("موجود جنگلی شکست خورد! +۵ سکه و ۱۵ تجربه ⭐");
  } else showToast("ضربه زدی! ❤️ جان دشمن: "+target.hp);
}

function saveQuietly() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, level: player.level, xp: player.xp, coins: player.coins },
      bag, harvested: [...harvested]
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
$("saveBtn").addEventListener("click", save);
$("bagBtn").addEventListener("click", () => { $("inventory").hidden = false; updateUI(); });
$("closeBag").addEventListener("click", () => $("inventory").hidden = true);
$("caveBtn").addEventListener("click",toggleCave);

function update(dt) {
  attackCooldown=Math.max(0,attackCooldown-dt); attackFlash=Math.max(0,attackFlash-dt); damageCooldown=Math.max(0,damageCooldown-dt);
  if(!caveMode) for(const enemy of enemies){
    if(!enemy.alive)continue;
    const ex=player.x-enemy.x,ey=player.y-enemy.y,distance=Math.hypot(ex,ey)||1;
    if(distance<300&&distance>30){enemy.x+=ex/distance*72*dt;enemy.y+=ey/distance*72*dt;}
    else if(distance<=30&&damageCooldown<=0){
      player.health=Math.max(0,player.health-1);damageCooldown=1;updateUI();saveQuietly();
      if(player.health<=0){player.health=5;player.x=1200;player.y=900;showToast("انرژیت تمام شد؛ به جنگل برگشتی و جانت بازیابی شد");updateUI();}
      else showToast("موجود بهت ضربه زد! ❤️");
    }
  }
  let dx = move.x, dy = move.y;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    player.x += dx / len * player.speed * dt;
    player.y += dy / len * player.speed * dt;
  }
  const mw=caveMode?1200:WORLD.w,mh=caveMode?900:WORLD.h;
  player.x=Math.max(caveMode?55:24,Math.min(mw-(caveMode?55:24),player.x));
  player.y=Math.max(caveMode?55:24,Math.min(mh-(caveMode?55:24),player.y));
  camera.x=Math.max(0,Math.min(mw-viewW,player.x-viewW/2));
  camera.y=Math.max(0,Math.min(mh-viewH,player.y-viewH/2));
  $("caveBtn").hidden=caveMode?false:Math.hypot(player.x-2080,player.y-1450)>115;
  $("caveBtn").textContent=caveMode?"🚪 خروج از غار":"🕳️ ورود به غار";
}
function drawCaveGround(){
 const t=WORLD.tile,sx=Math.floor(camera.x/t),sy=Math.floor(camera.y/t),ex=Math.ceil((camera.x+viewW)/t),ey=Math.ceil((camera.y+viewH)/t);
 for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){ctx.fillStyle=((x*13+y*19)%4===0)?"#292c30":"#35383b";ctx.fillRect(x*t-camera.x,y*t-camera.y,t+1,t+1);}
 ctx.fillStyle="#17191b";ctx.fillRect(-camera.x,-camera.y,1200,44);ctx.fillRect(-camera.x,856-camera.y,1200,44);ctx.fillRect(-camera.x,-camera.y,44,900);ctx.fillRect(1156-camera.x,-camera.y,44,900);
 ctx.fillStyle="#e0c58a";ctx.font="bold 15px Tahoma";ctx.fillText("غار جنگلی",520-camera.x,90-camera.y);
}
function drawCaveObjects(){for(const c of caveChests){let x=c.x-camera.x,y=c.y-camera.y;ctx.fillStyle=c.opened?"#59452d":"#a66a32";ctx.fillRect(x-17,y-12,34,24);ctx.fillStyle=c.opened?"#76634b":"#e5b75b";ctx.fillRect(x-17,y-12,34,7);}}
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
    }
  }
}
function drawTree(r) {
  const x = r.x - camera.x, y = r.y - camera.y;
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
  ctx.fillStyle="#173d2b";ctx.fillRect(x-18,y+8,36,7);
  ctx.fillStyle="#6dbb59";ctx.fillRect(x-17,y-8,34,17);ctx.fillRect(x-11,y-15,22,9);
  ctx.fillStyle="#a4df72";ctx.fillRect(x-9,y-12,7,4);
  ctx.fillStyle="#17301f";ctx.fillRect(x-8,y-3,4,5);ctx.fillRect(x+5,y-3,4,5);
  ctx.fillStyle="#203b29";ctx.fillRect(x-18,y-25,36,5);
  ctx.fillStyle="#e8d36b";ctx.fillRect(x-18,y-25,36*(e.hp/e.max),5);
}
function drawPlayer() {
  const x = player.x - camera.x, y = player.y - camera.y;
  ctx.fillStyle = "#243c28"; ctx.fillRect(x - 11, y + 7, 22, 9);
  ctx.fillStyle = "#3d75ad"; ctx.fillRect(x - 10, y - 5, 20, 19);
  ctx.fillStyle = "#edbd8c"; ctx.fillRect(x - 8, y - 18, 16, 15);
  ctx.fillStyle = "#553c2d"; ctx.fillRect(x - 9, y - 20, 18, 6);
  ctx.fillStyle = "#17251d"; ctx.fillRect(x - 4, y - 12, 3, 3); ctx.fillRect(x + 3, y - 12, 3, 3);
}
function draw() {
  ctx.clearRect(0, 0, viewW, viewH);
  if(caveMode){drawCaveGround();drawCaveObjects();}else drawGround();
  for (const r of activeNodes()) {
    if (r.x < camera.x - 60 || r.x > camera.x + viewW + 60 || r.y < camera.y - 60 || r.y > camera.y + viewH + 60) continue;
    if (r.type === "tree") drawTree(r);
    else if (r.type === "stone") drawRock(r);
    else if(r.type==="crystal"){drawRock(r);let cx=r.x-camera.x,cy=r.y-camera.y;ctx.fillStyle="#73e5df";ctx.fillRect(cx-5,cy-22,10,20);ctx.fillRect(cx-10,cy-12,6,10);ctx.fillRect(cx+5,cy-10,6,8);}
    else drawIron(r);
  }
  if(!caveMode) for(const e of enemies){if(!e.alive)continue;if(e.x<camera.x-50||e.x>camera.x+viewW+50||e.y<camera.y-50||e.y>camera.y+viewH+50)continue;drawSlime(e);}
  drawPlayer();
  if(attackFlash>0){const px=player.x-camera.x,py=player.y-camera.y;ctx.strokeStyle="#fff0a8";ctx.lineWidth=4;ctx.beginPath();ctx.arc(px,py,43,-0.8,0.8);ctx.stroke();}
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
showToast("به جنگل خوش آمدی! 🌲");
requestAnimationFrame(loop);
addEventListener("pagehide", saveQuietly);
})();