document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('rpgCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function init() {
        console.log('RPG Game Initialized.');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        draw();
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw placeholder text
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RPG World - Placeholder', canvas.width / 2, canvas.height / 2);
    }

    init();
});
