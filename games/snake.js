const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoopInterval = null;
let animationFrame = null;
let isPaused = true;
let isGameOver = false;
let speed = 150;
let isGameStarted = false;
let currentDifficulty = 1;

// 初始化难度选择器
function initDifficulty() {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const level = parseInt(star.dataset.level);
            setDifficulty(level);
        });
    });
    setDifficulty(1); // 设置默认难度
}

// 设置难度等级
function setDifficulty(level) {
    currentDifficulty = level;
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        const starLevel = parseInt(star.dataset.level);
        star.classList.toggle('active', starLevel <= level);
    });

    // 设置对应的游戏速度
    const speeds = {
        1: 200, // 简单
        2: 150, // 普通
        3: 100, // 中等
        4: 75,  // 困难
        5: 50   // 专家
    };
    speed = speeds[level];

    // 如果游戏正在进行，更新游戏循环
    if (isGameStarted && !isPaused && !isGameOver) {
        resetGameLoop();
    }
}

// 初始化游戏
function initGame() {
    isPaused = false;
    isGameOver = false;
    isGameStarted = true;
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    
    // 初始化蛇的位置在中间
    const middleY = Math.floor(tileCount / 2);
    const startX = Math.floor(tileCount / 4);
    snake = [
        {x: startX + 2, y: middleY},
        {x: startX + 1, y: middleY},
        {x: startX, y: middleY}
    ];
    
    spawnFood();
    updateScore();
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startBtn').textContent = '重新开始';
}

// 生成食物
function spawnFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (tileCount - 2)) + 1,
            y: Math.floor(Math.random() * (tileCount - 2)) + 1
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = '#34495e';
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // 如果游戏还没开始，显示提示文字
    if (!isGameStarted) {
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('按开始游戏按钮开始', canvas.width/2, canvas.height/2);
        return;
    }
    
    // 绘制食物
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        // 计算颜色渐变
        const hue = (120 + index * 2) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        
        // 绘制身体段
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
        
        // 为头部添加眼睛
        if (index === 0) {
            ctx.fillStyle = '#fff';
            const eyeSize = 4;
            
            // 根据方向确定眼睛位置
            let leftEye, rightEye;
            switch(direction) {
                case 'up':
                    leftEye = {x: gridSize/4, y: gridSize/4};
                    rightEye = {x: 3*gridSize/4, y: gridSize/4};
                    break;
                case 'down':
                    leftEye = {x: gridSize/4, y: 3*gridSize/4};
                    rightEye = {x: 3*gridSize/4, y: 3*gridSize/4};
                    break;
                case 'left':
                    leftEye = {x: gridSize/4, y: gridSize/4};
                    rightEye = {x: gridSize/4, y: 3*gridSize/4};
                    break;
                case 'right':
                    leftEye = {x: 3*gridSize/4, y: gridSize/4};
                    rightEye = {x: 3*gridSize/4, y: 3*gridSize/4};
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + leftEye.x,
                segment.y * gridSize + leftEye.y,
                eyeSize/2,
                0,
                Math.PI * 2
            );
            ctx.arc(
                segment.x * gridSize + rightEye.x,
                segment.y * gridSize + rightEye.y,
                eyeSize/2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });

    // 如果游戏暂停，显示暂停文字
    if (isPaused && !isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('已暂停', canvas.width/2, canvas.height/2);
    }
}

// 更新游戏状态
function update() {
    if (!isGameStarted || isPaused || isGameOver) return;
    
    // 更新方向
    direction = nextDirection;
    
    // 获取蛇头
    const head = {...snake[0]};
    
    // 根据方向移动蛇头
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // 检查碰撞
    if (
        head.x < 0 || head.x >= tileCount ||
        head.y < 0 || head.y >= tileCount ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        gameOver();
        return;
    }
    
    // 在蛇头位置插入新的节点
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();
        // 加快游戏速度
        speed = Math.max(50, speed - 2);
        resetGameLoop();
    } else {
        // 如果没有吃到食物，删除尾部
        snake.pop();
    }
}

// 游戏主循环
function gameLoop() {
    draw();
    animationFrame = requestAnimationFrame(gameLoop);
}

// 重置游戏循环
function resetGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    gameLoopInterval = setInterval(update, speed);
}

// 开始游戏
function startGame() {
    // 清理之前的游戏循环
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    
    // 初始化游戏
    initGame();
    
    // 启动游戏循环
    resetGameLoop();
    gameLoop();
}

// 暂停/继续游戏
function togglePause() {
    if (!isGameStarted || isGameOver) return;
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? '继续' : '暂停';
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    isGameStarted = false;
    
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    
    // 显示游戏结束界面
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('startBtn').textContent = '开始游戏';
}

// 重置游戏
function resetGame() {
    startGame();
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!isGameStarted || isGameOver) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            togglePause();
            break;
    }
});

// 初始化难度选择器
initDifficulty();

// 初始化显示
updateScore();
gameLoop();  // 启动初始绘制循环
