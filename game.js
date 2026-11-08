const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const toolTiers = [
    { name: 'چوبی (Tier 1)', cost: 0, power: 1, color: '#8b5a2b' },
    { name: 'سنگی (Tier 2)', cost: 50, power: 2.5, color: '#7f8c8d' },
    { name: 'آهنی (Tier 3)', cost: 200, power: 5, color: '#bdc3c7' },
    { name: 'طلایی (Tier 4)', cost: 600, power: 12, color: '#f1c40f' },
    { name: 'کیهانی (Tier 5)', cost: 2000, power: 30, color: '#9b59b6' }
];

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 24,
    speed: 4,
    color: '#e74c3c',
    coins: 0,
    tierIndex: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 50
};

const resources = [
    { x: 100, y: 150, type: 'tree', size: 30, hp: 5, maxHp: 5, color: '#27ae60' },
    { x: 250, y: 300, type: 'tree', size: 30, hp: 5, maxHp: 5, color: '#27ae60' },
    { x: 180, y: 450, type: 'rock', size: 26, hp: 10, maxHp: 10, color: '#7f8c8d' },
    { x: 320, y: 120, type: 'rock', size: 26, hp: 10, maxHp: 10, color: '#7f8c8d' }
];

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

function addXP(amount) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
    }
}

function updateUI() {
    const currentTier = toolTiers[player.tierIndex];
    const nextTier = toolTiers[player.tierIndex + 1];
    
    let tierText = currentTier.name;
    if (nextTier) {
        tierText += ` (ارتقاء: ${nextTier.cost} سکه)`;
    } else {
        tierText += ` (حداکثر)`;
    }
    
    document.getElementById('coins').innerText = `${player.coins} | Lvl ${player.level} (${player.xp}/${player.xpToNextLevel} XP)`;
    document.getElementById('toolTier').innerText = tierText;
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

    const halfSize = player.size / 2;
    if (player.x - halfSize < 0) player.x = halfSize;
    if (player.x + halfSize > canvas.width) player.x = canvas.width - halfSize;
    if (player.y - halfSize < 0) player.y = halfSize;
    if (player.y + halfSize > canvas.height) player.y = canvas.height - halfSize;

    const currentPower = toolTiers[player.tierIndex].power;
    
    resources.forEach((res) => {
        const dist = Math.hypot(player.x - res.x, player.y - res.y);
        if (dist < (player.size / 2 + res.size / 2)) {
            res.hp -= 0.03 * currentPower;
            if (res.hp <= 0) {
                const coinReward = res.type === 'tree' ? 10 : 25;
                const xpReward = res.type === 'tree' ? 15 : 30;
                
                player.coins += coinReward;
                addXP(xpReward);
                
                const nextTier = toolTiers[player.tierIndex + 1];
                if (nextTier && player.coins >= nextTier.cost) {
                    player.coins -= nextTier.cost;
                    player.tierIndex++;
                }

                updateUI();

                res.x = Math.random() * (canvas.width - 60) + 30;
                res.y = Math.random() * (canvas.height - 140) + 70;
                res.hp = res.maxHp;
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    resources.forEach(res => {
        ctx.fillStyle = res.color;
        ctx.fillRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
        
        const hpPercent = res.hp / res.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(res.x - 15, res.y - res.size / 2 - 8, 30, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(res.x - 15, res.y - res.size / 2 - 8, 30 * hpPercent, 4);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
    });

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    
    ctx.strokeStyle = toolTiers[player.tierIndex].color;
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

updateUI();
gameLoop();
