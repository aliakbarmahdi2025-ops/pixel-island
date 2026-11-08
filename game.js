const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// وضعیت بازیکن
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 24,
    speed: 4,
    color: '#e74c3c',
    coins: 0,
    toolTier: 1
};

// لیست منابع روی مپ (درخت و سنگ)
const resources = [
    { x: 100, y: 150, type: 'tree', size: 30, hp: 3, color: '#27ae60' },
    { x: 250, y: 300, type: 'tree', size: 30, hp: 3, color: '#27ae60' },
    { x: 180, y: 450, type: 'rock', size: 26, hp: 5, color: '#7f8c8d' },
    { x: 320, y: 120, type: 'rock', size: 26, hp: 5, color: '#7f8c8d' }
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

function update() {
    // حرکت کاراکتر به سمت لمس
    if (touchX !== null && touchY !== null) {
        const dx = touchX - player.x;
        const dy = touchY - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            player.x += (dx / dist) * player.speed;
            player.y += (dy / dist) * player.speed;
        }
    }

    // جلوگیری از غیب شدن کاراکتر و قفل کردنش داخل حدود صفحه
    const halfSize = player.size / 2;
    if (player.x - halfSize < 0) player.x = halfSize;
    if (player.x + halfSize > canvas.width) player.x = canvas.width - halfSize;
    if (player.y - halfSize < 0) player.y = halfSize;
    if (player.y + halfSize > canvas.height) player.y = canvas.height - halfSize;

    // بررسی برخورد با منابع (قطع درخت / استخراج سنگ)
    resources.forEach((res, index) => {
        const dist = Math.hypot(player.x - res.x, player.y - res.y);
        if (dist < (player.size / 2 + res.size / 2)) {
            res.hp -= 0.05; // جمع‌آوری تدریجی
            if (res.hp <= 0) {
                player.coins += res.type === 'tree' ? 10 : 25;
                document.getElementById('coins').innerText = player.coins;
                // ظاهر شدن مجدد منبع در نقطه جدید
                res.x = Math.random() * (canvas.width - 60) + 30;
                res.y = Math.random() * (canvas.height - 120) + 60;
                res.hp = res.type === 'tree' ? 3 : 5;
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رندر منابع (درخت‌ها و سنگ‌ها)
    resources.forEach(res => {
        ctx.fillStyle = res.color;
        ctx.fillRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
    });

    // رندر کاراکتر بازیکن
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
