const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// سیستم ذخیره‌سازی و بارگذاری اطلاعات
const savedData = JSON.parse(localStorage.getItem('pixel_island_save')) || {};

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 24,
    speed: savedData.speed || 4,
    color: '#e74c3c',
    coins: savedData.coins || 0,
    level: savedData.level || 1,
    xp: savedData.xp || 0,
    xpToNextLevel: savedData.xpToNextLevel || 50,
    power: savedData.power || 1,
    toolTier: savedData.toolTier || 1
};

// لیست انواع منابع
const resourceTypes = {
    tree: { color: '#27ae60', hp: 5, coins: 10, xp: 15, size: 30 },
    rock: { color: '#7f8c8d', hp: 12, coins: 30, xp: 35, size: 26 },
    gold: { color: '#f1c40f', hp: 25, coins: 100, xp: 80, size: 24 }
};

const resources = [
    { x: 80, y: 120, type: 'tree', ...resourceTypes.tree, currentHp: resourceTypes.tree.hp },
    { x: 250, y: 220, type: 'tree', ...resourceTypes.tree, currentHp: resourceTypes.tree.hp },
    { x: 150, y: 380, type: 'rock', ...resourceTypes.rock, currentHp: resourceTypes.rock.hp },
    { x: 300, y: 450, type: 'gold', ...resourceTypes.gold, currentHp: resourceTypes.gold.hp }
];

// متن‌های شناور سکه (Floating Text)
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

function saveGame() {
    const dataToSave = {
        coins: player.coins,
        level: player.level,
        xp: player.xp,
        xpToNextLevel: player.xpToNextLevel,
        speed: player.speed,
        power: player.power,
        toolTier: player.toolTier
    };
    localStorage.setItem('pixel_island_save', JSON.stringify(dataToSave));
}

function addFloatingText(text, x, y, color = '#f1c40f') {
    floatingTexts.push({ text, x, y, alpha: 1, color });
}

function updateUI() {
    document.getElementById('coins').innerText = `${Math.floor(player.coins)} | Lvl ${player.level} | ابزار: T${player.toolTier}`;
    saveGame();
}

function update() {
    // حرکت بازیکن
    if (touchX !== null && touchY !== null) {
        const dx = touchX - player.x;
        const dy = touchY - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            player.x += (dx / dist) * player.speed;
            player.y += (dy / dist) * player.speed;
        }
    }

    // مرزبندی صفحه
    const half = player.size / 2;
    if (player.x - half < 0) player.x = half;
    if (player.x + half > canvas.width) player.x = canvas.width - half;
    if (player.y - half < 0) player.y = half;
    if (player.y + half > canvas.height) player.y = canvas.height - half;

    // ضربه زدن به منابع
    resources.forEach(res => {
        const dist = Math.hypot(player.x - res.x, player.y - res.y);
        if (dist < (player.size / 2 + res.size / 2)) {
            res.currentHp -= 0.04 * player.power;
            if (res.currentHp <= 0) {
                player.coins += res.coins;
                player.xp += res.xp;

                addFloatingText(`+${res.coins} 💰`, res.x, res.y);

                // ارتقاء سطح بازیکن (Level Up)
                if (player.xp >= player.xpToNextLevel) {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.6);
                    player.power += 0.3; // افزایش قدرت طبیعی با لول آپ
                    addFloatingText('LEVEL UP! ⭐', player.x, player.y - 20, '#2ecc71');
                }

                // خرید خودکار ارتقای ابزار بر اساس سکه
                const upgradeCost = player.toolTier * 80;
                if (player.coins >= upgradeCost) {
                    player.coins -= upgradeCost;
                    player.toolTier++;
                    player.power += 1.2;
                    addFloatingText(`ابزار ارتقاء یافت! ⛏️`, player.x, player.y - 40, '#3498db');
                }

                updateUI();

                // اسپاون مجدد منبع
                res.x = Math.random() * (canvas.width - 60) + 30;
                res.y = Math.random() * (canvas.height - 100) + 50;
                res.currentHp = res.hp;
            }
        }
    });

    // به روزرسانی متن‌های شناور
    floatingTexts.forEach((ft, index) => {
        ft.y -= 0.8;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) floatingTexts.splice(index, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رسم منابع
    resources.forEach(res => {
        ctx.fillStyle = res.color;
        ctx.fillRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
        
        // نوار سلامتی منبع
        const hpPercent = Math.max(0, res.currentHp / res.
