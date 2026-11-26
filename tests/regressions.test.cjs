const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.PIXEL_SOURCE_DIR || path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'adventure.js'), 'utf8');
const SAVE_KEY = 'pixelIsland_adventure_save_v1';

// Execute the actual game startup/save/load code, with drawing and timers disabled.
// The inspection hook exists only in this isolated test context, never in the game.
function startGame(saved) {
  const storage = new Map(saved ? [[SAVE_KEY, saved]] : []);
  const nodes = new Map();
  const noop = () => {};
  const drawing = new Proxy({}, { get: () => noop });
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {
      hidden: true, style: {}, dataset: {}, innerHTML: '', textContent: '', scrollLeft: 0,
      classList: { add: noop, remove: noop, toggle: noop },
      addEventListener: noop, setAttribute: noop, appendChild: noop, remove: noop,
      querySelectorAll: () => [], getBoundingClientRect: () => ({ bottom: 70 }),
      getContext: () => drawing
    });
    return nodes.get(id);
  }
  const context = vm.createContext({
    console, innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    // The main game loads optional farm artwork with Image; keep the VM headless.
    Image: class { constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; this.src = ""; } },
    document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null,
      createElement: () => element(Symbol()), body: { appendChild: noop } },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) },
    addEventListener: noop, requestAnimationFrame: noop, setTimeout: noop,
    clearTimeout: noop, setInterval: noop, clearInterval: noop
  });
  context.window = context;
  const end = source.lastIndexOf('})();');
  assert.ok(end >= 0, 'game wrapper found');
  vm.runInContext(source.slice(0, end) + '\nglobalThis.inspectGame = code => eval(code);\n' + source.slice(end), context);
  return {
    run: code => context.inspectGame(code),
    json: code => JSON.parse(context.inspectGame(`JSON.stringify(${code})`)),
    saved: () => storage.get(SAVE_KEY)
  };
}

test('world regeneration is independent of player position and previous RNG use', () => {
  const game = startGame();
  const original = game.json('resources');
  assert.equal(original.length, 269, 'preserves original new-game resource layout');
  for (const [x, y] of [[2200, 1500], [160, 750], [800, 1015], [3100, 2200]]) {
    game.run(`player.x=${x};player.y=${y};rand();rand();makeWorld()`);
    assert.deepEqual(game.json('resources'), original);
  }
});

test('save/reload keeps resource IDs, layout and harvested state', () => {
  const game = startGame();
  const original = game.json('resources');
  game.run('harvested.add(resources[7].id);player.x=2200;player.y=1500;bag.wood=6;saveQuietly()');
  const restored = startGame(game.saved());
  assert.deepEqual(restored.json('resources'), original);
  assert.deepEqual(restored.json('[...harvested]'), [original[7].id]);
  assert.equal(restored.json('bag.wood'), 6);
  assert.equal(restored.json('activeNodes().some(r=>harvested.has(r.id))'), false);
});

test('manual and quiet saves serialize identical data including temple and forecast', () => {
  const game = startGame();
  game.run(`templeMode=true;templeFloor=3;templeUnlocked=3;worldDay=7;
    houseHeaterOn=true;currentWeather='snow';
    tvForecast={day:7,weather:'snow',mineLuck:'lucky'};
    activeMineLuck='lucky';activeMineLuckDay=7;save()`);
  const manual = JSON.parse(game.saved());
  game.run('saveQuietly()');
  assert.deepEqual(JSON.parse(game.saved()), manual);
  assert.equal(manual.templeMode, true);
  assert.equal(manual.houseHeaterOn, true);
  assert.equal(manual.currentWeather, 'snow');
  assert.equal(manual.activeMineLuck, 'lucky');
  assert.deepEqual(manual.tvForecast, { day: 7, weather: 'snow', mineLuck: 'lucky' });
});

test('both save paths round-trip temple, weather, luck, heater and inventory', () => {
  for (const saveFunction of ['save', 'saveQuietly']) {
    const game = startGame();
    game.run(`templeMode=true;templeFloor=3;templeUnlocked=4;bridgeStage=3;
      player.x=160;player.y=750;player.coins=42;bag.wood=6;
      houseHeaterOn=true;worldDay=7;currentWeather='snow';
      tvForecast={day:7,weather:'snow',mineLuck:'lucky'};
      activeMineLuck='lucky';activeMineLuckDay=7;${saveFunction}()`);
    const restored = startGame(game.saved());
    assert.deepEqual(restored.json('({templeMode,templeFloor,templeUnlocked,houseHeaterOn,currentWeather,activeMineLuck,activeMineLuckDay,tvForecast,wood:bag.wood,coins:player.coins})'), {
      templeMode: true, templeFloor: 3, templeUnlocked: 4, houseHeaterOn: true,
      currentWeather: 'snow', activeMineLuck: 'lucky', activeMineLuckDay: 7,
      tvForecast: { day: 7, weather: 'snow', mineLuck: 'lucky' }, wood: 6, coins: 42
    }, saveFunction);
  }
});

test('older saves without the corrected fields still load', () => {
  const restored = startGame(JSON.stringify({ player: { x: 2200, y: 1500, coins: 19 }, bag: { wood: 3 }, harvested: ['node-7'] }));
  assert.deepEqual(restored.json('({templeMode,houseHeaterOn,currentWeather,coins:player.coins,wood:bag.wood})'), {
    templeMode: false, houseHeaterOn: false, currentWeather: 'sunny', coins: 19, wood: 3
  });
  assert.deepEqual(restored.json('[...harvested]'), ['node-7']);
});

test('entry page links to both games without removing classic save access', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /href="adventure\.html"/);
  assert.match(index, /href="classic\.html"/);
  const classic = fs.readFileSync(path.join(root, 'classic.html'), 'utf8');
  assert.match(classic, /src="game\.js"/);
  assert.match(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), /pixelIsland_crafting_save/);
});

test('forest boars spawn safely, stay on the map, and appear in the world map', () => {
  const game = startGame();
  for (const [x, y] of [[1200, 900], [1480, 690], [2200, 1500], [3100, 2200], [160, 750]]) {
    game.run(`player.x=${x};player.y=${y};makeEnemies()`);
    const boars = game.json('enemies.filter(e => e.kind === "forestBoar")');
    assert.equal(boars.length, 3, `three boars spawn from player position ${x},${y}`);
    assert.ok(boars.every(e => e.alive && e.hp === 3 && e.max === 3));
    for (let i = 0; i < boars.length; i++) {
      for (let j = i + 1; j < boars.length; j++) {
        assert.ok(Math.hypot(boars[i].x - boars[j].x, boars[i].y - boars[j].y) >= 300);
      }
    }
    assert.equal(game.json('getWorldMapState().points.filter(p => p.kind === "enemy").length'), 3);
  }
});

test('defeating a forest boar grants XP, coins and the configured potion drop', () => {
  const game = startGame();
  const before = game.json('({coins: player.coins, xp: player.xp})');
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    playGameSound=()=>{}; triggerPlayerAction=()=>{}; useEnergy=()=>true;
    spawnDamageText=()=>{}; spawnHitSpark=()=>{}; Math.random=()=>0.1;
    attackCooldown=0; player.attackPower=3;
    const boar=enemies.find(e=>e.kind==="forestBoar");
    player.x=boar.x; player.y=boar.y; boar.hp=1;
    attack(boar.id);
  `);
  const after = game.json('({coins: player.coins, xp: player.xp, alive: enemies.find(e=>e.kind==="forestBoar").alive, potionDrops: lootDrops.filter(d=>d.type==="potion").length})');
  assert.equal(after.coins, before.coins + 6);
  assert.equal(after.xp, before.xp + 12);
  assert.equal(after.alive, false);
  assert.equal(after.potionDrops, 1);
});

test('mobile help text explains tapping forest boars', () => {
  const html = fs.readFileSync(path.join(root, 'adventure.html'), 'utf8');
  assert.match(html, /گرازهای جنگلی/);
});

test('tapping a forest boar selects it and attacks through the canvas interaction', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    playGameSound=()=>{}; triggerPlayerAction=()=>{}; useEnergy=()=>true;
    spawnDamageText=()=>{}; spawnHitSpark=()=>{};
    attackCooldown=0; player.attackPower=1;
    const boar=enemies.find(e=>e.kind==="forestBoar");
    player.x=boar.x-76; player.y=boar.y;
    camera.x=0; camera.y=0;
    canvasWorldTap({clientX:boar.x,clientY:boar.y,preventDefault(){}});
    tickWorldInteraction(0.01);
  `);
  const result = game.json('({target:moveTarget?.type,id:moveTarget?.id,hp:enemies.find(e=>e.kind==="forestBoar").hp,energy:player.energy})');
  assert.equal(result.target, 'enemy');
  assert.ok(result.id.startsWith('forest-boar-'));
  assert.equal(result.hp, 2, 'the tap interaction reaches attack() and applies one hit');
});


test('forest boars chase at the configured speed and respect the player damage cooldown', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    updateFurnaces=()=>{}; updateWeather=()=>{}; updateCombatEffects=()=>{};
    tickWorldInteraction=()=>{}; audioEnvironment=()=>{}; updateMineButton=()=>{};
    const boar=enemies.find(e=>e.kind==="forestBoar");
    enemies=[boar];
    moveTarget=null; move.x=0; move.y=0; keys.clear();
    player.x=boar.x-200; player.y=boar.y;
    const beforeX=boar.x;
    update(1);
    globalThis.boarChaseDistance=beforeX-boar.x;
    player.x=boar.x+20; player.y=boar.y; player.health=5; damageCooldown=0;
    update(0.01);
    globalThis.boarHealthAfterHit=player.health;
    update(0.1);
    globalThis.boarHealthAfterCooldown=player.health;
  `);
  const result = game.json('({chaseDistance:boarChaseDistance,afterHit:boarHealthAfterHit,afterCooldown:boarHealthAfterCooldown})');
  assert.equal(result.chaseDistance, 58, 'boar moves at 58 world units per second');
  assert.equal(result.afterHit, 4, 'boar contact removes one health point');
  assert.equal(result.afterCooldown, 4, 'damage cooldown prevents an immediate second hit');
});

test('defeated forest boars respawn after 18 seconds at their original spawn with full health', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    playGameSound=()=>{}; triggerPlayerAction=()=>{}; useEnergy=()=>true;
    spawnDamageText=()=>{}; spawnHitSpark=()=>{};
    updateFurnaces=()=>{}; updateWeather=()=>{}; updateCombatEffects=()=>{};
    tickWorldInteraction=()=>{}; audioEnvironment=()=>{}; updateMineButton=()=>{};
    const boar=enemies.find(e=>e.kind==="forestBoar");
    enemies=[boar];
    player.x=boar.x; player.y=boar.y; player.attackPower=3; attackCooldown=0;
    globalThis.boarSpawn={x:boar.spawnX,y:boar.spawnY};
    attack(boar.id);
    globalThis.boarRespawnRef=boar;
    player.x=1200;player.y=900;
  `);
  assert.deepEqual(game.json('({alive:boarRespawnRef.alive,hp:boarRespawnRef.hp,respawnTimer:boarRespawnRef.respawnTimer})'), {
    alive: false, hp: 0, respawnTimer: 18
  });

  game.run(`
    update(17.99);
    globalThis.boarBeforeRespawn={alive:boarRespawnRef.alive,timer:boarRespawnRef.respawnTimer};
    update(0.02);
    globalThis.boarAfterRespawn={
      alive:boarRespawnRef.alive,hp:boarRespawnRef.hp,
      x:boarRespawnRef.x,y:boarRespawnRef.y,
      spawnX:boarRespawnRef.spawnX,spawnY:boarRespawnRef.spawnY
    };
  `);
  const beforeRespawn = game.json('boarBeforeRespawn');
  assert.equal(beforeRespawn.alive, false);
  assert.ok(Math.abs(beforeRespawn.timer - 0.01) < 1e-9, 'boar remains defeated until the full 18-second timer elapses');
  assert.deepEqual(game.json('boarAfterRespawn'), {
    alive: true, hp: 3,
    x: game.json('boarSpawn.x'), y: game.json('boarSpawn.y'),
    spawnX: game.json('boarSpawn.x'), spawnY: game.json('boarSpawn.y')
  });
});

test('defeated forest boars disappear from the world map until they respawn', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    playGameSound=()=>{}; triggerPlayerAction=()=>{}; useEnergy=()=>true;
    spawnDamageText=()=>{}; spawnHitSpark=()=>{};
    updateFurnaces=()=>{}; updateWeather=()=>{}; updateCombatEffects=()=>{};
    tickWorldInteraction=()=>{}; audioEnvironment=()=>{}; updateMineButton=()=>{};
    const boar=enemies.find(e=>e.kind==="forestBoar");
    enemies=[boar];
    player.x=boar.x; player.y=boar.y; player.attackPower=3; attackCooldown=0;
    globalThis.mapBoarSpawn={x:boar.spawnX,y:boar.spawnY};
    globalThis.mapMarkersBefore= getWorldMapState().points.filter(p=>p.kind==="enemy").length;
    attack(boar.id);
    globalThis.mapMarkersDefeated= getWorldMapState().points.filter(p=>p.kind==="enemy").length;
    globalThis.mapBoarRef=boar;
    player.x=1200; player.y=900;
    update(18);
    globalThis.mapMarkersRespawned= getWorldMapState().points.filter(p=>p.kind==="enemy").length;
    globalThis.mapBoarRespawnState={alive:mapBoarRef.alive,hp:mapBoarRef.hp,x:mapBoarRef.x,y:mapBoarRef.y};
  `);
  assert.equal(game.json('mapMarkersBefore'), 1, 'living boar is visible on the forest map');
  assert.equal(game.json('mapMarkersDefeated'), 0, 'defeated boar is removed from the map');
  assert.equal(game.json('mapMarkersRespawned'), 1, 'respawned boar returns to the map');
  assert.deepEqual(game.json('mapBoarRespawnState'), {
    alive: true, hp: 3,
    x: game.json('mapBoarSpawn.x'), y: game.json('mapBoarSpawn.y')
  });
});

test('forest boar rewards survive save/reload while defeated boars respawn as runtime enemies', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; showToast=()=>{}; playGameSound=()=>{};
    triggerPlayerAction=()=>{}; spawnDamageText=()=>{}; spawnHitSpark=()=>{};
    useEnergy=()=>true; Math.random=()=>0.99;
    const boar=enemies.find(e=>e.kind==="forestBoar");
    player.x=boar.x; player.y=boar.y; player.attackPower=3; attackCooldown=0;
    attack(boar.id);
  `);

  const saved = JSON.parse(game.saved());
  assert.equal(saved.player.coins, 6, 'boar coins are included in the existing player save');
  assert.equal(saved.player.xp, 12, 'boar XP is included in the existing player save');
  assert.equal(Object.hasOwn(saved, 'forestBoars'), false, 'no boar-specific save field is introduced');

  const restored = startGame(game.saved());
  assert.deepEqual(restored.json('({coins:player.coins,xp:player.xp,alive:enemies.filter(e=>e.kind==="forestBoar"&&e.alive).length})'), {
    coins: 6, xp: 12, alive: 3
  });
});


test('forest boar spawn selection avoids saved farm plots, placed furnaces and nearby resources', () => {
  const game = startGame();
  game.run(`
    // Simulate persistent player-built objects occupying three preferred spawn points.
    farmPlots.push({id:"saved-plot",x:1480,y:690});
    furnaces.push({id:"placed-furnace",x:1760,y:1170});
    resources.push({id:"nearby-resource",x:2200,y:1240});
    player.x=1200;player.y=900;
    makeEnemies();
  `);

  const boars = game.json('enemies.filter(e=>e.kind==="forestBoar").map(e=>({x:e.x,y:e.y}))');
  assert.equal(boars.length, 3, 'the fallback candidate list still supplies three boars');
  for (const boar of boars) {
    assert.ok(Math.hypot(boar.x-1480,boar.y-690)>=100, 'boar avoids saved farm plots');
    assert.ok(Math.hypot(boar.x-1760,boar.y-1170)>=100, 'boar avoids placed furnaces');
    assert.ok(Math.hypot(boar.x-2200,boar.y-1240)>=58, 'boar avoids nearby harvestable resources');
  }
});

test('forest boar respawns at a safe alternate location when its original tile becomes a farm plot', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    playGameSound=()=>{}; triggerPlayerAction=()=>{}; useEnergy=()=>true;
    spawnDamageText=()=>{}; spawnHitSpark=()=>{};
    updateFurnaces=()=>{}; updateWeather=()=>{}; updateCombatEffects=()=>{};
    tickWorldInteraction=()=>{}; audioEnvironment=()=>{}; updateMineButton=()=>{};
    const boar=enemies.find(e=>e.kind==="forestBoar");
    enemies=[boar];
    player.x=boar.x; player.y=boar.y; player.attackPower=3; attackCooldown=0;
    attack(boar.id);
    farmPlots.push({id:"new-farm-plot",x:boar.spawnX,y:boar.spawnY});
    player.x=1200; player.y=900;
    update(18.01);
    globalThis.boarAfterBlockedRespawn={
      alive:boar.alive,hp:boar.hp,x:boar.x,y:boar.y,
      spawnX:boar.spawnX,spawnY:boar.spawnY,
      farmDistance:Math.hypot(boar.x-farmPlots[0].x,boar.y-farmPlots[0].y)
    };
  `);
  const result = game.json('boarAfterBlockedRespawn');
  assert.equal(result.alive, true, 'boar still respawns when another safe candidate exists');
  assert.equal(result.hp, 3, 'respawn restores full health');
  assert.deepEqual({x:result.spawnX,y:result.spawnY},{x:1760,y:1170},
    'boar relocates to the next safe deterministic candidate');
  assert.deepEqual({x:result.x,y:result.y},{x:1760,y:1170});
  assert.ok(result.farmDistance >= 100, 'boar does not overlap the newly placed farm plot');
});


test('forest boar keeps retrying a blocked respawn and returns when a safe tile opens', () => {
  const game = startGame();
  game.run(`
    updateUI=()=>{}; saveQuietly=()=>{}; showToast=()=>{};
    playGameSound=()=>{}; triggerPlayerAction=()=>{}; useEnergy=()=>true;
    spawnDamageText=()=>{}; spawnHitSpark=()=>{};
    updateFurnaces=()=>{}; updateWeather=()=>{}; updateCombatEffects=()=>{};
    tickWorldInteraction=()=>{}; audioEnvironment=()=>{}; updateMineButton=()=>{};
    const boar=enemies.find(e=>e.kind==="forestBoar");
    enemies=[boar];
    globalThis.boarOriginalSpawn={x:boar.spawnX,y:boar.spawnY};
    player.x=boar.x; player.y=boar.y; player.attackPower=3; attackCooldown=0;
    attack(boar.id);
    for (let i=0;i<FOREST_BOAR_SPAWN_CANDIDATES.length;i++) {
      const [x,y]=FOREST_BOAR_SPAWN_CANDIDATES[i];
      farmPlots.push({id:"blocked-spawn-"+i,x,y});
    }
    farmPlots.push({id:"blocked-original-spawn",x:boar.spawnX,y:boar.spawnY});
    player.x=1200;player.y=900;
    update(18.01);
    globalThis.boarWithNoSafeTile={
      alive:boar.alive,hp:boar.hp,timer:boar.respawnTimer
    };
    // Open the next deterministic fallback tile; the next update must retry.
    farmPlots.splice(farmPlots.findIndex(p=>p.id==="blocked-spawn-1"),1);
    update(0.01);
    globalThis.boarAfterSafeTileOpens={
      alive:boar.alive,hp:boar.hp,x:boar.x,y:boar.y,
      spawnX:boar.spawnX,spawnY:boar.spawnY
    };
  `);

  assert.deepEqual(game.json('boarWithNoSafeTile'), {
    alive:false,hp:0,timer:0
  });
  assert.deepEqual(game.json('boarAfterSafeTileOpens'), {
    alive:true,hp:3,x:1760,y:1170,spawnX:1760,spawnY:1170
  });
});
