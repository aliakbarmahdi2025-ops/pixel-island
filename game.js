const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let currentIsland = 'forest';

const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    size: 28,
    speed: 4,
    speedLvl: 1,
    coins: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
    toolTier: 1,
    toolName: 'تبر چوبی 🪵',
    power: 1
};

let workers = [];
let workerCost = 150;
let toolCost = 200;

const toolsData = [
    { name: 'تبر چوبی 🪵', power: 1, cost: 200 },
    { name: 'تبر سنگی 🪨', power: 2.2, cost: 600 },
    { name: 'تبر آهنی ⚙️', power: 5, cost: 1800 },
    { name: 'تبر الماسی 💎', power: 12, cost: 5000 }
];

function loadGame() {
    try {
        const savedData = localStorage.getItem('pixelIsland_crafting_save');
        if (savedData) {
            const data = JSON.parse(savedData);
            player.coins = data.coins || 0;
            player.level = data.level || 1;
            player.xp = data.xp || 0;
            player.xpToNextLevel = data.xpToNextLevel || 50;
            player.speed = data.speed || 4;
            player.speedLvl = data.speedLvl || 1;
            player.toolTier = data.toolTier || 1;
            workerCost = data.workerCost || 150;
            toolCost = data.toolCost || 200;
            
            player.toolName = toolsData[player.toolTier - 1].name;
            player.power = toolsData[player.toolTier - 1].power;

            if (data.workerCount) {
                for (let i = 0; i < data.workerCount; i++) {
                    workers.push({
                        x: canvas.width / 2 + (Math.random() * 40 - 20),
                        y: canvas.height / 2 + (Math.random() * 40 - 20),
                        size: 20,
                        speed: 2 + Math.random() * 0.5
                    });
                }
            }
        }
    } catch(e) {
        console.log('Load error');
    }
}

function saveGame() {
    try {
        const data = {
            coins: player.coins,
            level: player.level,
            xp: player.xp,
            xpToNextLevel: player.xpToNextLevel,
            speed: player.speed,
            speedLvl: player.speedLvl,
            toolTier: player.toolTier,
            workerCount: workers.length,
            workerCost: workerCost,
            toolCost: toolCost
        };
        localStorage.setItem('pixelIsland_crafting_save', JSON.stringify(data));
    } catch(e) {
        console.log('Save error');
    }
}

function manualSave() {
    saveGame();
    addFloatingText('پیشرفت ذخیره شد! 💾', player.x, player.y - 30, '#2ecc71');
}

loadGame();

const forestResources = [
    { x: 100, y: 150, type: 'tree', hp: 5, maxHp: 5, coins: 10, xp: 15, size: 36 },
    { x: 250, y: 250, type: 'tree', hp: 5, maxHp: 5, coins: 10, xp: 15, size: 36 },
    { x: 180, y: 380, type: 'rock', hp: 15, maxHp: 15, coins: 30, xp: 35, size: 32 },
    { x: 300, y: 450, type: 'gold', hp: 30, maxHp: 30, coins: 100, xp: 80, size: 28 }
];

const volcanoResources = [
    { x: 120, y: 180, type: 'crystal', hp: 25, maxHp: 25, coins: 80, xp: 60, size: 34 },
    { x: 280, y: 280, type: 'crystal', hp: 25, maxHp: 25, coins: 80, xp: 60, size: 34 },
    { x: 200, y: 420, type: 'lava_rock', hp: 60, maxHp: 60, coins: 250, xp: 120, size: 36 }
];

let activeResources = forestResources;
const floatingTexts = [];
let touchX = null;
let touchY = null;

window.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (touchX !== null && e.target.tagName !== 'BUTTON') {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
    }
}, { passive: false });

window.addEventListener('touchend', () => {
    touchX = null;
    touchY = null;
});

function switchIsland() {
    if (currentIsland === 'forest') {
        currentIsland = 'volcano';
        activeResources = volcanoResources;
        canvas.style.background = '#3a1e1e';
        document.getElementById('travelBtn').innerText = '🌲 جنگل';
        addFloatingText('جزیره آتشفشان! 🌋', player.x, player.y - 30, '#e74c3c');
    } else {
        currentIsland = 'forest';
        activeResources = forestResources;
        canvas.style.background = '#2d5a27';
        document.getElementById('travelBtn').innerText = '🌋 آتشفشان';
        addFloatingText('بازگشت به جنگل! 🌲', player.x, player.y - 30, '#2ecc71');
    }
}

function toggleShop() {
    const menu = document.getElementById('shopMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    updateUI();
}

function upgradeTool() {
    if (player.toolTier < toolsData.length) {
        const currentCost = toolsData[player.toolTier - 1].cost;
        if (player.coins >= currentCost) {
            player.coins -= currentCost;
            player.toolTier++;
            player.toolName = toolsData[player.toolTier - 1].name;
            player.power = toolsData[player.toolTier - 1].power;
            addFloatingText(`ابزار جدید: ${player.toolName}! ⚡`, player.x, player.y - 30, '#f1c40f');
            saveGame();
            updateUI();
        }
    }
}

function buyUpgrade(type) {
    if (type === 'speed') {
        const cost = Math.floor(50 * Math.pow(1.5, player.speedLvl - 1));
        if (player.coins >= cost) {
            player.coins -= cost;
            player.speedLvl++;
            player.speed += 0.8;
            addFloatingText('سرعت زیاد شد! ⚡', player.x, player.y - 30, '#f1c40f');
        }
    } else if (type === 'worker') {
        if (player.coins >= workerCost) {
            player.coins -= workerCost;
            workers.push({
                x: player.x + (Math.random() * 40 - 20),
                y: player.y + (Math.random() * 40 - 20),
                size: 20,
                speed: 2 + Math.random() * 0.5
            });
            workerCost = Math.floor(workerCost * 1.8);
            addFloatingText('کارگر جدید! 🤖', player.x, player.y - 30, '#3498db');
        }
    }
    saveGame();
    updateUI();
}

function addFloatingText(text, x, y, color = '#f1c40f') {
    floatingTexts.push({ text, x, y, alpha: 1, color });
}

function updateUI() {
    document.getElementById('coins').innerText = Math.floor(player.coins);
    document.getElementById('level').innerText = player.level;
    document.getElementById('toolName').innerText = player.toolName;

    if (player.level >= 5) {
        document.getElementById('travelBtn').style.display = 'inline-block';
    }

    const speedCost = Math.floor(50 * Math.pow(1.5, player.speedLvl - 1));
    document.getElementById('speedLvl').innerText = `Lvl ${player.speedLvl}`;
    document.getElementById('buySpeed').innerText = `${speedCost} 💰`;
    document.getElementById('buySpeed').disabled = player.coins < speedCost;

    document.getElementById('workerLvl').innerText = `${workers.length} کارگر`;
    document.getElementById('buyWorker').innerText = `${workerCost} 💰`;
    document.getElementById('buyWorker').disabled = player.coins < workerCost;

    if (player.toolTier < toolsData.length) {
        const nextTool = toolsData[player.toolTier];
        document.getElementById('toolInfo').innerText = `${player.toolName} (ارتقا به ${nextTool.name})`;
        document.getElementById('buyTool').innerText = `${toolsData[player.toolTier - 1].cost} 💰`;
        document.getElementById('buyTool').disabled = player.coins < toolsData[player.toolTier - 1].cost;
    } else {
        document.getElementById('toolInfo').innerText = 'بهترین ابزار را دارید!';
        document.getElementById('buyTool').innerText = 'MAX';
        document.getElementById('buyTool').disabled = true;
    }
}

let saveTimer = 0;

function update() {
    if (touchX !== null && touchY !== null) {
        const dx = touchX - player.x;
        const dy = touchY - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            player.x += (dx / dist) * player.speed;
            player.y += (dy / dist) * player.speed;
        }
    }

    const half = player.size / 2;
    if (player.x - half < 0) player.x = half;
    if (player.x + half > canvas.width) player.x = canvas.width - half;
    if (player.y - half < 0) player.y = half;
    if (player.y + half > canvas.height) player.y = canvas.height - half;

    workers.forEach(w => {
        let nearestRes = activeResources[0];
        let minDist = Infinity;
        activeResources.forEach(res => {
            const d = Math.hypot(w.x - res.x, w.y - res.y);
            if (d < minDist) {
                minDist = d;
                nearestRes = res;
            }
        });

        if (nearestRes) {
            const dx = nearestRes.x - w.x;
            const dy = nearestRes.y - w.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 5) {
                w.x += (dx / dist) * w.speed;
                w.y += (dy / dist) * w.speed;
            }
        }
    });

    activeResources.forEach(res => {
        const distP = Math.hypot(player.x - res.x, player.y - res.y);
        if (distP < (player.size / 2 + res.size / 2)) {
            res.hp -= 0.04 * player.power;
        }

        workers.forEach(w => {
            const distW = Math.hypot(w.x - res.x, w.y - res.y);
            if (distW < (w.size / 2 + res.size / 2)) {
                res.hp -= 0.03;
            }
        });

        if (res.hp <= 0) {
            player.coins += res.coins;
            player.xp += res.xp;

            addFloatingText(`+${res.coins} 💰`, res.x, res.y);

            if (player.xp >= player.xpToNextLevel) {
                player.xp -= player.xpToNextLevel;
                player.level++;
                player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.6);
                addFloatingText('LEVEL UP! ⭐', player.x, player.y - 20, '#2ecc71');
            }

            updateUI();

            res.x = Math.random() * (canvas.width - 80) + 40;
            res.y = Math.random() * (canvas.height - 120) + 60;
            res.hp = res.maxHp;
        }
    });

    saveTimer++;
    if (saveTimer > 300) {
        saveGame();
        saveTimer = 0;
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 0.8;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
}

function drawTree(x, y) {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(x - 4, y + 2, 8, 14);
    ctx.fillStyle = '#1e824c';
    ctx.fillRect(x - 16, y - 8, 32, 14);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x - 12, y - 18, 24, 14);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x - 8, y - 24, 16, 10);
}

function drawRock(x, y) {
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(x - 14, y - 10, 28, 20);
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(x - 14, y - 10, 20, 6);
}

function drawGold(x, y) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x - 12, y - 10, 24, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 8, y - 8, 4, 4);
}

function drawCrystal(x, y) {
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(x - 10, y - 14, 20, 28);
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(x - 4, y - 14, 14, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 10, 4, 8);
}

function drawLavaRock(x, y) {
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(x - 16, y - 12, 32, 24);
    ctx.fillStyle = '#d35400';
    ctx.fillRect(x - 8, y - 4, 20, 10);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x - 12, y - 8, 8, 8);
}

function drawPlayer(x, y) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x - 10, y - 4, 20, 16);
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(x - 8, y - 16, 16, 12);
    ctx.fillStyle = '#4a2c11';
    ctx.fillRect(x - 8, y - 18, 16, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 5, y - 12, 3, 3);
    ctx.fillRect(x + 2, y - 12, 3, 3);
}

function drawWorker(x, y) {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x - 8, y - 8, 16, 16);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x - 5, y - 4, 3, 3);
    ctx.fillRect(x + 2, y - 4, 3, 3);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    activeResources.forEach(res => {
        if (res.type === 'tree') drawTree(res.x, res.y);
        else if (res.type === 'rock') drawRock(res.x, res.y);
        else if (res.type === 'gold') drawGold(res.x, res.y);
        else if (res.type === 'crystal') drawCrystal(res.x, res.y);
        else if (res.type === 'lava_rock') drawLavaRock(res.x, res.y);

        const hpPercent = Math.max(0, res.hp / res.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(res.x - 15, res.y - res.size / 2 - 12, 30, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(res.x - 15, res.y - res.size / 2 - 12, 30 * hpPercent, 4);
    });

    workers.forEach(w => drawWorker(w.x, w.y));
    drawPlayer(player.x, player.y);

    floatingTexts.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 13px monospace';
        ctx.fillText(ft.text, ft.x - 15, ft.y);
        ctx.globalAlpha = 1;
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

resizeCanvas();
updateUI();
loop();
    
