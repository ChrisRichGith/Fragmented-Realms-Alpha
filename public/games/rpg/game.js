// Game configuration
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 3,
    playerSize: 30
};

// Game objects
let player, enemies = [];
let canvas, ctx, gameLoop, keys = {};

// UI Elements
const ui = {
    // Screens
    titleScreen: document.getElementById('title-screen'),
    gameScreen: document.getElementById('game-screen'),
    highscoresScreen: document.getElementById('highscores-screen'),
    gameOverScreen: document.getElementById('game-over'),
    
    // Buttons
    startBtn: document.getElementById('start-btn'),
    highscoresBtn: document.getElementById('highscores-btn'),
    backBtn: document.getElementById('back-btn'),
    restartBtn: document.getElementById('restart-btn'),
    toHighscoresBtn: document.getElementById('to-highscores-btn'),
    exitBtn: document.getElementById('exit-btn'),
    exitToMenuBtn: document.getElementById('exit-to-menu-btn'),
    
    // Game UI
    levelEl: document.getElementById('level'),
    experienceEl: document.getElementById('experience'),
    healthEl: document.getElementById('health'),
    finalLevelEl: document.getElementById('final-level'),
    finalExpEl: document.getElementById('final-exp'),
    newHighscoreEl: document.getElementById('new-highscore'),
    playerNameInput: document.getElementById('player-name'),
    personalHighscoresEl: document.getElementById('personal-highscores'),
    globalHighscoresEl: document.getElementById('global-highscores')
};

// Game state
let gameState = {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    health: 100,
    maxHealth: 100,
    isGameOver: false,
    playerName: 'Player'
};

// Initialize game
function init() {
    // Set up canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set up event listeners
    setupEventListeners();
    
    // Show title screen
    showScreen('title');
    
    // Start game loop (paused until game starts)
    gameLoop = requestAnimationFrame(update);
}

// Set up all event listeners
function setupEventListeners() {
    // Game controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // UI Buttons
    ui.startBtn.addEventListener('click', () => showScreen('game'));
    ui.highscoresBtn.addEventListener('click', () => showScreen('highscores'));
    ui.backBtn.addEventListener('click', () => showScreen('title'));
    ui.exitBtn.addEventListener('click', () => window.close());
    ui.exitToMenuBtn.addEventListener('click', () => window.close());

    ui.restartBtn.addEventListener('click', () => {
        if (ui.newHighscoreEl.style.display === 'block') {
            const name = ui.playerNameInput.value.trim() || 'Player';
            submitHighscore(name, gameState.level, gameState.experience).then(() => {
                resetGame();
                showScreen('game');
            });
        } else {
            resetGame();
            showScreen('game');
        }
    });

    ui.toHighscoresBtn.addEventListener('click', () => {
        if (ui.newHighscoreEl.style.display === 'block') {
            const name = ui.playerNameInput.value.trim() || 'Player';
            submitHighscore(name, gameState.level, gameState.experience).then(() => {
                showScreen('highscores');
            });
        } else {
            showScreen('highscores');
        }
    });
}

// Show a specific screen
function showScreen(screenId) {
    // Hide all screens
    Object.values(ui).forEach(element => {
        if (element && element.style) {
            element.style.display = 'none';
        }
    });
    
    // Show the requested screen
    switch(screenId) {
        case 'title':
            ui.titleScreen.style.display = 'block';
            break;
        case 'game':
            ui.gameScreen.style.display = 'block';
            resetGame();
            break;
        case 'highscores':
            ui.highscoresScreen.style.display = 'block';
            loadHighscores();
            break;
        case 'gameOver':
            ui.gameOverScreen.style.display = 'block';
            ui.finalLevelEl.textContent = gameState.level;
            ui.finalExpEl.textContent = gameState.experience;
            checkHighscore();
            break;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Game loop
function update(timestamp) {
    if (gameState.isGameOver) return;
    
    updatePlayer();
    updateEnemies();
    checkCollisions();
    draw();
    
    gameLoop = requestAnimationFrame(update);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    if (player) {
        ctx.fillStyle = '#8a6dff';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    // Draw experience orbs
    if (Math.random() < 0.01) {
        const orb = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 10,
            height: 10
        };
        enemies.push(orb);
    }
}

function updatePlayer() {
    if (!player) return;
    
    // Movement
    if (keys['ArrowLeft'] || keys['a']) {
        player.x = Math.max(0, player.x - config.playerSpeed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x = Math.min(canvas.width - player.width, player.x + config.playerSpeed);
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y = Math.max(0, player.y - config.playerSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y = Math.min(canvas.height - player.height, player.y + config.playerSpeed);
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        if (player) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * 1;
                enemy.y += (dy / distance) * 1;
            }
        }
        
        // Remove if off screen
        if (enemy.x < -50 || enemy.x > canvas.width + 50 || 
            enemy.y < -50 || enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (!player) return;
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (isColliding(player, enemy)) {
            // Check if it's an experience orb (smaller than enemies)
            if (enemy.width < 20) {
                // Experience orb
                gameState.experience += 10;
                if (gameState.experience >= gameState.experienceToNext) {
                    gameState.level++;
                    gameState.experience -= gameState.experienceToNext;
                    gameState.experienceToNext = Math.floor(gameState.experienceToNext * 1.2);
                    gameState.maxHealth += 10;
                    gameState.health = gameState.maxHealth;
                }
                enemies.splice(i, 1);
            } else {
                // Enemy collision
                gameState.health -= 10;
                enemies.splice(i, 1);
                
                if (gameState.health <= 0) {
                    gameOver();
                }
            }
        }
    }
    
    // Update UI
    ui.levelEl.textContent = `Level: ${gameState.level}`;
    ui.experienceEl.textContent = `Erfahrung: ${gameState.experience}/${gameState.experienceToNext}`;
    ui.healthEl.textContent = `Leben: ${gameState.health}/${gameState.maxHealth}`;
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameOver() {
    gameState.isGameOver = true;
    showScreen('gameOver');
}

function resetGame() {
    gameState = {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        health: 100,
        maxHealth: 100,
        isGameOver: false
    };
    
    player = {
        x: canvas.width / 2 - config.playerSize / 2,
        y: canvas.height / 2 - config.playerSize / 2,
        width: config.playerSize,
        height: config.playerSize
    };
    
    enemies = [];
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    gameLoop = requestAnimationFrame(update);
}

function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === 'Escape') window.close();
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// Highscore functions
function loadHighscores() {
    // Load personal highscores from localStorage
    const personalHighscores = JSON.parse(localStorage.getItem('rpgPersonalHighscores') || '[]');
    displayHighscores(personalHighscores, ui.personalHighscoresEl);

    // Load global highscores from server (placeholder for now)
    const globalHighscores = JSON.parse(localStorage.getItem('rpgGlobalHighscores') || '[]');
    displayHighscores(globalHighscores, ui.globalHighscoresEl);
}

function displayHighscores(highscores, element) {
    element.innerHTML = '';

    if (highscores.length === 0) {
        element.innerHTML = '<li>Keine Highscores verfügbar</li>';
        return;
    }

    // Sort by level and experience (highest first) and take top 10
    const topScores = highscores
        .sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.experience - a.experience;
        })
        .slice(0, 10);

    topScores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${index + 1}. ${entry.name}</span>
            <span>Level ${entry.level} (${entry.experience} XP)</span>
        `;
        element.appendChild(li);
    });
}

function checkHighscore() {
    const personalHighscores = JSON.parse(localStorage.getItem('rpgPersonalHighscores') || '[]');
    const currentScore = { level: gameState.level, experience: gameState.experience };

    const isNewPersonalHighscore = personalHighscores.length < 10 ||
        personalHighscores.some(h => h.level < currentScore.level ||
            (h.level === currentScore.level && h.experience < currentScore.experience));

    if (isNewPersonalHighscore) {
        ui.newHighscoreEl.style.display = 'block';
        ui.playerNameInput.focus();
    } else {
        ui.newHighscoreEl.style.display = 'none';
    }
}

async function submitHighscore(name, level, experience) {
    // Add to personal highscores
    const personalHighscores = JSON.parse(localStorage.getItem('rpgPersonalHighscores') || '[]');
    personalHighscores.push({ name, level, experience, date: new Date().toISOString() });

    // Keep only top 10
    personalHighscores.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.experience - a.experience;
    });
    const top10 = personalHighscores.slice(0, 10);

    localStorage.setItem('rpgPersonalHighscores', JSON.stringify(top10));

    // TODO: Submit to server for global highscores
    // For now, we'll use localStorage for global highscores too
    const globalHighscores = JSON.parse(localStorage.getItem('rpgGlobalHighscores') || '[]');
    globalHighscores.push({ name, level, experience, date: new Date().toISOString() });

    globalHighscores.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.experience - a.experience;
    });
    const top10Global = globalHighscores.slice(0, 10);

    localStorage.setItem('rpgGlobalHighscores', JSON.stringify(top10Global));

    return Promise.resolve();
}

// Start the game
window.onload = init;
