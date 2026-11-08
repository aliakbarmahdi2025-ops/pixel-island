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
    xpToNextLevel: 50
};

const trees = [
    { x: 100, y: 150, size: 30, hp: 5, maxHp: 5 },
    { x: 250, y: 300, size: 30, hp: 5, maxHp: 5 },
    { x: 200, y: 400, size: 30, hp: 5, maxHp: 5 },
    { x: 300, y: 150, size: 30, hp: 5, maxHp: 5 }
];

let touchX = null;
let touchY = null;

canvas.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});

canvas.addEventListener('touch/move' || 'touchmove', (e) => {
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

    trees.forEach(tree => {
        const dist = Math.hypot(player.x - tree.x, player.y - tree.y);
        if (dist < 30) {
            tree.hp -= 0.05;
            if (tree.hp <= 0) {
                player.coins += 10;
                player.xp += 15;
                if (player.xp >= player.xpToNextLevel) {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                }
                document.getElementById('coins').innerText = `${player.coins} | Lvl ${player.level}`;
                
                tree.x = Math.random() * (canvas.width - 60) + 30;
                tree.y = Math.random() * (canvas.height - 60) + 30;
                tree.hp = tree.maxHp;
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trees.forEach(tree => {
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(tree.x - 15, tree.y - 15, 30, 30);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(tree.x - 15, tree.y - 15, 30, 30);
    });

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - 12, player.y - 12, 24, 24);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - 12, player.y - 12, 24, 24);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
