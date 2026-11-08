const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = { x: 100, y: 100, size: 20, color: '#e74c3c' };

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // کشیدن بازیکن
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    
    requestAnimationFrame(gameLoop);
}

gameLoop();
