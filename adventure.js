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
let harvested = new Set();
let resources = [];
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
  } catch (e) { console.warn("Save could not be loaded", e); }
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: { x: player.x, y: player.y, health: player.health, level: player.level, xp: player.xp, coins: player.coins },
      bag, harvested: [...harvested]
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
}
load();
makeWorld();
function activeNodes() { return resources.filter(r => !harvested.has(r.id)); }

function harvest() {
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
    player.xp += 10;
    if (player.xp >= player.level * 50) {
      player.xp -= player.level * 50;
      player.level++;
      showToast("سطح جدید! ⭐ سطح " + player.level);
    } else {
      showToast(nearest.type === "tree" ? "۳ چوب جمع کردی 🪵" : nearest.type === "stone" ? "۲ سنگ جمع کردی 🪨" : "۱ آهن جمع کردی ⛏️");
    }
    updateUI();
    saveQuietly();
  } else {
    showToast("در حال جمع‌آوری...");
  }
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
$("saveBtn").addEventListener("click", save);
$("bagBtn").addEventListener("click", () => { $("inventory").hidden = false; updateUI(); });
$("closeBag").addEventListener("click", () => $("inventory").hidden = true);

function update(dt) {
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
  player.x = Math.max(24, Math.min(WORLD.w - 24, player.x));
  player.y = Math.max(24, Math.min(WORLD.h - 24, player.y));
  camera.x = Math.max(0, Math.min(WORLD.w - viewW, player.x - viewW / 2));
  camera.y = Math.max(0, Math.min(WORLD.h - viewH, player.y - viewH / 2));
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
  drawGround();
  for (const r of activeNodes()) {
    if (r.x < camera.x - 60 || r.x > camera.x + viewW + 60 || r.y < camera.y - 60 || r.y > camera.y + viewH + 60) continue;
    if (r.type === "tree") drawTree(r);
    else if (r.type === "stone") drawRock(r);
    else drawIron(r);
  }
  drawPlayer();
  ctx.strokeStyle = "#d6f0a8"; ctx.lineWidth = 3;
  ctx.strokeRect(2 - camera.x, 2 - camera.y, WORLD.w - 4, WORLD.h - 4);
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