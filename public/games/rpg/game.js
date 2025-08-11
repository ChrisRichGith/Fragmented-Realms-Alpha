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
let ui = {};

const CLASS_STATS = {
    warrior: { strength: 10, dexterity: 5, intelligence: 3, vitality: 12 },
    mage:    { strength: 3, dexterity: 6, intelligence: 12, vitality: 6 },
    rogue:   { strength: 5, dexterity: 12, intelligence: 5, vitality: 8 },
    priest:  { strength: 4, dexterity: 7, intelligence: 10, vitality: 9 },
    archer:  { strength: 6, dexterity: 11, intelligence: 6, vitality: 7 },
};

// Game state
let gameState = {
    player: {
        name: 'Player',
        class: null,
        gender: null,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        stats: {
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            vitality: 0
        },
        health: 0,
        maxHealth: 0,
    },
    isGameOver: false,
};

// Initialize game
function init() {
    // Set up canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Populate UI object
    ui = {
        // Screens
        titleScreen: document.getElementById('title-screen'),
        gameScreen: document.getElementById('game-screen'),
        optionsScreen: document.getElementById('options-screen'),
        characterCreationScreen: document.getElementById('character-creation-screen'),

        // Buttons
        newGameBtn: document.getElementById('new-game-btn'),
        loadGameBtn: document.getElementById('load-game-btn'),
        optionsBtn: document.getElementById('options-btn'),
        exitBtn: document.getElementById('exit-rpg-btn'),
        optionsBackBtn: document.getElementById('options-back-btn'),
        creationBackBtn: document.getElementById('creation-back-btn'),

        // Game UI
        levelEl: document.getElementById('level'),
        experienceEl: document.getElementById('experience'),
        healthEl: document.getElementById('health'),

    // Audio
    bgMusic: document.getElementById('bg-music'),
    sfxClick: document.getElementById('sfx-click'),
    musicVolumeSlider: document.getElementById('music-volume'),
    sfxVolumeSlider: document.getElementById('sfx-volume'),
    };
    
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

// Audio control functions
function playClickSound() {
    if (ui.sfxClick) {
        ui.sfxClick.currentTime = 0;
        ui.sfxClick.play();
    }
}

function playBgMusic() {
    if (ui.bgMusic) {
        ui.bgMusic.play().catch(e => console.error("Audio autoplay failed: ", e));
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Game controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // UI Buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', playClickSound);
    });

    ui.newGameBtn.addEventListener('click', () => showScreen('character-creation'));
    ui.loadGameBtn.addEventListener('click', () => {
        console.log('Load Game clicked - functionality to be implemented.');
        alert('Laden-Funktion noch nicht implementiert.');
    });
    ui.optionsBtn.addEventListener('click', () => {
        console.log("Options button clicked!");
        showScreen('options');
    });
    ui.optionsBackBtn.addEventListener('click', () => showScreen('title'));
    ui.creationBackBtn.addEventListener('click', () => showScreen('title'));
    ui.exitBtn.addEventListener('click', () => {
        window.close();
    });

    // Volume Sliders
    ui.musicVolumeSlider.addEventListener('input', (e) => {
        if(ui.bgMusic) ui.bgMusic.volume = e.target.value / 100;
    });
    ui.sfxVolumeSlider.addEventListener('input', (e) => {
        if(ui.sfxClick) ui.sfxClick.volume = e.target.value / 100;
    });

    // Character Creation Event Listeners
    const classCards = document.querySelectorAll('.class-card');
    classCards.forEach(card => {
        const genderButtons = card.querySelectorAll('.gender-btn');
        genderButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from sibling
                genderButtons.forEach(s => s.classList.remove('active'));
                // Add active class to clicked button
                e.currentTarget.classList.add('active');
            });
        });

        const chooseBtn = card.querySelector('.choose-class-btn');
        chooseBtn.addEventListener('click', () => {
            const chosenClass = card.dataset.class;
            const activeGenderBtn = card.querySelector('.gender-btn.active');
            if (!activeGenderBtn) {
                alert('Bitte wählen Sie ein Geschlecht.');
                return;
            }
            const chosenGender = activeGenderBtn.dataset.gender;
            initializePlayer(chosenClass, chosenGender);
        });
    });
}

// Show a specific screen
function showScreen(screenId) {
    console.log(`showScreen called with: ${screenId}`);
    // Hide all screens
    if (ui.titleScreen) ui.titleScreen.style.display = 'none';
    if (ui.gameScreen) ui.gameScreen.style.display = 'none';
    if (ui.optionsScreen) ui.optionsScreen.style.display = 'none';
    if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'none';
    
    // Show the requested screen
    switch(screenId) {
        case 'title':
            if (ui.titleScreen) ui.titleScreen.style.display = 'flex'; // Use flex to center content
            playBgMusic();
            break;
        case 'options':
            if (ui.optionsScreen) ui.optionsScreen.style.display = 'flex'; // Use flex to center content
            break;
        case 'character-creation':
            if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'flex';
            break;
        case 'game':
            if (ui.gameScreen) ui.gameScreen.style.display = 'block';
            resetGame();
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
                gameState.player.experience += 10;
                if (gameState.player.experience >= gameState.player.experienceToNext) {
                    gameState.player.level++;
                    gameState.player.experience -= gameState.player.experienceToNext;
                    gameState.player.experienceToNext = Math.floor(gameState.player.experienceToNext * 1.2);
                    // For simplicity, we'll just add to vitality on level up for now
                    gameState.player.stats.vitality++;
                    gameState.player.maxHealth = gameState.player.stats.vitality * 10; // Recalculate max health
                    gameState.player.health = gameState.player.maxHealth; // Full heal on level up
                }
                enemies.splice(i, 1);
            } else {
                // Enemy collision
                gameState.player.health -= 10;
                enemies.splice(i, 1);
                
                if (gameState.player.health <= 0) {
                    gameOver();
                }
            }
        }
    }
    
    // Update UI
    ui.levelEl.textContent = `Level: ${gameState.player.level}`;
    ui.experienceEl.textContent = `Erfahrung: ${gameState.player.experience}/${gameState.player.experienceToNext}`;
    ui.healthEl.textContent = `Leben: ${gameState.player.health}/${gameState.player.maxHealth}`;
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameOver() {
    gameState.isGameOver = true;
    console.log("Game Over!");
    // Later, this will show a game over screen with stats from gameState.player
    showScreen('title'); // Return to title screen for now
}

function resetGame() {
    // This function is now for resetting the in-game state, not the player character data.
    // The player object on the canvas is created in a new function after class selection.
    
    // Reset enemies
    enemies = [];
    
    // Ensure game loop is running for the game screen
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

function initializePlayer(chosenClass, chosenGender) {
    gameState.player.class = chosenClass;
    gameState.player.gender = chosenGender;
    gameState.player.stats = { ...CLASS_STATS[chosenClass] };

    // Calculate derived stats
    gameState.player.maxHealth = gameState.player.stats.vitality * 10;
    gameState.player.health = gameState.player.maxHealth;

    // Reset level-specific stats
    gameState.player.level = 1;
    gameState.player.experience = 0;
    gameState.player.experienceToNext = 100;
    gameState.isGameOver = false;

    // Create the player object for the canvas
    player = {
        x: canvas.width / 2 - config.playerSize / 2,
        y: canvas.height / 2 - config.playerSize / 2,
        width: config.playerSize,
        height: config.playerSize
    };

    console.log(`Character created: ${chosenGender} ${chosenClass}`);
    showScreen('game');
}

// Start the game
window.onload = init;
