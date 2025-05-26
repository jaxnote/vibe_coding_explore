// 游戏配置
const BOARD_SIZE = 8;
const TOTAL_PAIRS = (BOARD_SIZE * BOARD_SIZE) / 2;
const GAME_TIME = 180; // 3分钟

// 游戏状态
let board = [];
let selectedTile = null;
let timeLeft = GAME_TIME;
let timerInterval = null;
let remainingPairs = TOTAL_PAIRS;
let isGameActive = false;

// 图案数组（使用emoji表情作为配对图案）
const patterns = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄',
                 '🦋', '🐙', '🦐', '🦞', '🦀', '🐌', '🦑', '🐠', '🐡', '🐬', '🦈', '🐳', '🐊', '🦖', '🦕', '🦘'];

// 初始化游戏板
function initializeBoard() {
    board = [];
    const patternPairs = [];
    
    // 创建配对
    for (let i = 0; i < TOTAL_PAIRS; i++) {
        patternPairs.push(patterns[i]);
        patternPairs.push(patterns[i]);
    }
    
    // 随机打乱
    for (let i = patternPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [patternPairs[i], patternPairs[j]] = [patternPairs[j], patternPairs[i]];
    }
    
    // 填充游戏板
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = {
                pattern: patternPairs[i * BOARD_SIZE + j],
                matched: false
            };
        }
    }
}

// 创建游戏板DOM
function createBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.row = i;
            tile.dataset.col = j;
            tile.textContent = board[i][j].pattern;
            
            if (board[i][j].matched) {
                tile.classList.add('matched');
            }
            
            tile.addEventListener('click', () => handleTileClick(tile, i, j));
            gameBoard.appendChild(tile);
        }
    }
}

// 处理点击事件
function handleTileClick(tile, row, col) {
    if (!isGameActive || board[row][col].matched) return;
    
    if (!selectedTile) {
        // 第一次选择
        selectedTile = {tile, row, col};
        tile.classList.add('selected');
    } else {
        // 第二次选择
        const firstTile = selectedTile;
        
        // 检查是否点击同一个格子
        if (firstTile.row === row && firstTile.col === col) {
            selectedTile.tile.classList.remove('selected');
            selectedTile = null;
            return;
        }
        
        // 检查是否匹配
        if (board[firstTile.row][firstTile.col].pattern === board[row][col].pattern) {
            // 检查是否可以连接
            if (canConnect(firstTile.row, firstTile.col, row, col)) {
                // 匹配成功
                board[firstTile.row][firstTile.col].matched = true;
                board[row][col].matched = true;
                
                firstTile.tile.classList.add('matched');
                tile.classList.add('matched');
                
                remainingPairs--;
                document.getElementById('remainingPairs').textContent = remainingPairs;
                
                // 显示连接路径
                showPath(firstTile.row, firstTile.col, row, col);

                // 处理方块掉落
                setTimeout(() => {
                    handleFalling();
                    // 检查游戏是否胜利
                    if (remainingPairs === 0) {
                        gameOver(true);
                    }
                }, 500);
            }
        }
        
        // 重置选择
        firstTile.tile.classList.remove('selected');
        selectedTile = null;
    }
}

// 检查两个点是否可以连接
function canConnect(row1, col1, row2, col2) {
    // 检查直线连接
    if (canConnectDirect(row1, col1, row2, col2)) {
        return true;
    }
    
    // 检查一次转弯
    if (canConnectOneCorner(row1, col1, row2, col2)) {
        return true;
    }
    
    // 检查两次转弯
    return canConnectTwoCorners(row1, col1, row2, col2);
}

// 检查直线连接
function canConnectDirect(row1, col1, row2, col2) {
    if (row1 === row2) {
        // 水平连接
        const minCol = Math.min(col1, col2);
        const maxCol = Math.max(col1, col2);
        
        for (let col = minCol + 1; col < maxCol; col++) {
            if (!board[row1][col].matched) {
                return false;
            }
        }
        return true;
    }
    
    if (col1 === col2) {
        // 垂直连接
        const minRow = Math.min(row1, row2);
        const maxRow = Math.max(row1, row2);
        
        for (let row = minRow + 1; row < maxRow; row++) {
            if (!board[row][col1].matched) {
                return false;
            }
        }
        return true;
    }
    
    return false;
}

// 检查一次转弯连接
function canConnectOneCorner(row1, col1, row2, col2) {
    // 检查两个转角点
    const corner1 = {row: row1, col: col2};
    const corner2 = {row: row2, col: col1};
    
    // 尝试第一个转角
    if (board[corner1.row][corner1.col].matched &&
        canConnectDirect(row1, col1, corner1.row, corner1.col) &&
        canConnectDirect(corner1.row, corner1.col, row2, col2)) {
        return true;
    }
    
    // 尝试第二个转角
    if (board[corner2.row][corner2.col].matched &&
        canConnectDirect(row1, col1, corner2.row, corner2.col) &&
        canConnectDirect(corner2.row, corner2.col, row2, col2)) {
        return true;
    }
    
    return false;
}

// 检查两次转弯连接
function canConnectTwoCorners(row1, col1, row2, col2) {
    // 检查所有可能的中间点
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 水平方向
        if (board[row1][i].matched && board[row2][i].matched &&
            canConnectDirect(row1, col1, row1, i) &&
            canConnectDirect(row1, i, row2, i) &&
            canConnectDirect(row2, i, row2, col2)) {
            return true;
        }
        
        // 垂直方向
        if (board[i][col1].matched && board[i][col2].matched &&
            canConnectDirect(row1, col1, i, col1) &&
            canConnectDirect(i, col1, i, col2) &&
            canConnectDirect(i, col2, row2, col2)) {
            return true;
        }
    }
    
    return false;
}

// 显示连接路径
function showPath(row1, col1, row2, col2) {
    // 创建临时路径元素
    const path = document.createElement('div');
    path.className = 'path-line';
    document.querySelector('.game-board').appendChild(path);
    
    // 设置路径样式
    const tile1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
    const tile2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
    const rect1 = tile1.getBoundingClientRect();
    const rect2 = tile2.getBoundingClientRect();
    
    // 计算路径位置和尺寸
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    path.style.width = `${length}px`;
    path.style.height = '2px';
    path.style.left = `${x1}px`;
    path.style.top = `${y1}px`;
    path.style.transform = `rotate(${angle}deg)`;
    path.style.transformOrigin = '0 0';
    
    // 动画结束后移除路径
    setTimeout(() => path.remove(), 500);
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    isGameActive = true;
    timeLeft = GAME_TIME;
    remainingPairs = TOTAL_PAIRS;
    document.getElementById('remainingPairs').textContent = remainingPairs;
    document.getElementById('gameOver').style.display = 'none';
    
    // 初始化游戏板
    initializeBoard();
    createBoard();
    
    // 启动计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            gameOver(false);
        }
    }, 1000);
}

// 游戏结束
function gameOver(isWin) {
    isGameActive = false;
    clearInterval(timerInterval);
    
    const message = isWin ? 
        `恭喜你赢了！用时${GAME_TIME - timeLeft}秒` : 
        '时间到！游戏结束';
    
    document.getElementById('gameOverMessage').textContent = message;
    document.getElementById('gameOver').style.display = 'block';
}

// 重新排列
function shuffleBoard() {
    if (!isGameActive) return;
    
    const unmatched = [];
    
    // 收集未匹配的图案
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!board[i][j].matched) {
                unmatched.push(board[i][j].pattern);
            }
        }
    }
    
    // 打乱未匹配的图案
    for (let i = unmatched.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unmatched[i], unmatched[j]] = [unmatched[j], unmatched[i]];
    }
    
    // 重新分配未匹配的图案
    let unmatchedIndex = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!board[i][j].matched) {
                board[i][j].pattern = unmatched[unmatchedIndex++];
            }
        }
    }
    
    // 重新创建游戏板
    createBoard();
}

// 处理方块掉落
function handleFalling() {
    let hasFallen = false;
    
    // 从底部开始，逐列处理
    for (let col = 0; col < BOARD_SIZE; col++) {
        // 从倒数第二行开始向上检查
        for (let row = BOARD_SIZE - 2; row >= 0; row--) {
            if (!board[row][col].matched) {
                // 查找当前方块下方的第一个空位
                let targetRow = row;
                while (targetRow + 1 < BOARD_SIZE && board[targetRow + 1][col].matched) {
                    targetRow++;
                }
                
                // 如果找到了空位，移动方块
                if (targetRow !== row) {
                    board[targetRow][col] = board[row][col];
                    board[row][col] = { pattern: '', matched: true };
                    hasFallen = true;
                }
            }
        }
    }
    
    // 如果有方块掉落，重新创建游戏板
    if (hasFallen) {
        createBoard();
    }
}

// 初始化游戏
startGame();
