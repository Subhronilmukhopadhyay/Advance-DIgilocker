// Generate a random string for CAPTCHA
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

// Draw the CAPTCHA on the canvas
function drawCaptcha(captcha) {
    const canvas = document.getElementById('captchaCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 50;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add background noise
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw CAPTCHA text
    ctx.font = '30px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(captcha, 50, 35);

    // Add random lines for more security
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
}

// Initialize CAPTCHA
let captchaCode = generateCaptcha();
drawCaptcha(captchaCode);

// Refresh CAPTCHA and clear input field
document.getElementById('refreshButton').addEventListener('click', () => {
    captchaCode = generateCaptcha();
    drawCaptcha(captchaCode);
    document.getElementById('captchaInput').value = ''; // Clear the input field
});

// Validate CAPTCHA on form submit
document.getElementById('captchaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = document.getElementById('captchaInput').value;

    if (userInput === captchaCode) {
        alert('CAPTCHA verified successfully!');
    } else {
        alert('Incorrect CAPTCHA. Please try again.');
    }
});
