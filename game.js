const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 24,
    speed: 4,
    color: '#e74c3c',
    coins: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
    power: 1,
    toolTier: 1
};

const resources = [
    { x: 80, y: 120, type: 'tree', color: '#27ae60', hp: 5, maxHp: 5, coins: 10, xp: 15, size: 30 },
    { x: 250, y: 220, type: 'tree', color: '#27ae60', hp: 5, maxHp: 5, coins: 10, xp: 15, size: 30 },
    { x: 150, y: 380, type: 'rock', color: '#7f8c8d', hp: 12, maxHp: 12, coins: 30, xp: 35, size: 26 },
    { x: 300, y: 450, type: 'gold', color: '#f1c40f', hp: 25, maxHp: 25, coins: 100, xp: 80, size: 24 }
];

const floatingTexts = [];
let touchX = null;
let touchY = null;

canvas.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', () => {
    touchX = null;
    touchY = null;
});

function addFloatingText(text, x, y, color = '#f1c40f') {
    floatingTexts.push({ text, x, y, alpha: 1, color });
}

function updateUI() {
    const coinsElem = document.getElementById('coins');
    const toolElem = document.getElementById('toolTier');
    if (coinsElem) coinsElem.innerText = `${Math.floor(player.coins)} | Lvl ${player.level}`;
    if (toolElem) toolElem.innerText = `ابزار T${player.toolTier}`;
}

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

    resources.forEach(res => {
        const dist = Math.hypot(player.x - res.x, player.y - res.y);
        if (dist < (player.size / 2 + res.size / 2)) {
            res.hp -= 0.04 * player.power;
            if (res.hp <= 0) {
                player.coins += res.coins;
                player.xp += res.xp;

                addFloatingText(`+${res.coins} 💰`, res.x, res.y);

                if (player.xp >= player.xpToNextLevel) {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.6);
                    player.power += 0.3;
                    addFloatingText('LEVEL UP! ⭐', player.x, player.y - 20, '#2ecc71');
                }

                const upgradeCost = player.toolTier * 80;
                if (player.coins >= upgradeCost) {
                    player.coins -= upgradeCost;
                    player.toolTier++;
                    player.power += 1.2;
                    addFloatingText(`ارتقای ابزار! ⛏️`, player.x, player.y - 40, '#3498db');
                }

                updateUI();

                res.x = Math.random() * (canvas.width - 60) + 30;
                res.y = Math.random() * (canvas.height - 100) + 50;
                res.hp = res.maxHp;
            }
        }
    });

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 0.8;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    resources.forEach(res => {
        ctx.fillStyle = res.color;
        ctx.fillRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
        
        const hpPercent = Math.max(0, res.hp / res.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(res.x - 15, res.y - res.size / 2 - 8, 30, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(res.x - 15, res.y - res.size / 2 - 8, 30 * hpPercent, 4);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
    });

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

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

updateUI();
loop();
