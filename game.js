const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// تنظیم اندازه‌ی صفحه مناسب مرورگر موبایل
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
    color: '#e74c3c', // کاراکتر پیکسلی قرمز
    coins: 0,
    toolTier: 1
};

// کنترل لمسی روی موبایل
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

// حلقه اصلی بازی (Game Loop)
function update() {
    // حرکت کاراکتر به سمت نقطه لمس‌شده روی صفحه
    if (touchX !== null && touchY !== null) {
        const dx = touchX - player.x;
        const dy = touchY - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            player.x += (dx / dist) * player.speed;
            player.y += (dy / dist) * player.speed;
        }
    }
}

function draw() {
    // پاکسازی صفحه
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // کشیدن بازیکن (کاراکتر پیکسلی)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

    // خط دور پیکسلی برای کاراکتر
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
