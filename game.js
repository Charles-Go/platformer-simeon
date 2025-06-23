class Player {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocity = {
            x: 0,
            y: 0
        };
        this.gravity = 0.5;
        this.jumpForce = -12;
        this.isJumping = false;
        this.facingRight = true;
        this.hasKey = false;
        
        // Create image object
        this.image = new Image();
        this.image.src = 'player.png'; // Replace with your image file name
        
        // Add scoring system
        this.score = 0;
        this.totalTime = 0;
        this.levelStartTime = 0;
        this.levelTimes = [];
        this.fireballs = [];
        this.lastFireTime = 0;
        this.fireRate = 500; // Minimum time between shots in milliseconds
    }

    draw(ctx) {
        ctx.save();
        if (!this.facingRight) {
            // Translate to the player position
            ctx.translate(this.x + this.width, this.y);
            // Flip horizontally
            ctx.scale(-1, 1);
            // Draw image at origin (0,0) since we translated
            ctx.drawImage(this.image, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
        
        // Draw fireballs
        this.fireballs.forEach(fireball => fireball.draw(ctx));
    }

    update(platforms) {
        // Apply gravity
        this.velocity.y += this.gravity;
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Check platform collisions
        platforms.forEach(platform => {
            this.checkPlatformCollision(platform);
        });

        // Ground collision
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity.y = 0;
            this.isJumping = false;
        }

        // Update fireballs
        this.fireballs = this.fireballs.filter(fireball => fireball.active);
        this.fireballs.forEach(fireball => fireball.update());
    }

    jump() {
        if (!this.isJumping) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
        }
    }

    checkPlatformCollision(platform) {
        const isColliding = this.x < platform.x + platform.width &&
                          this.x + this.width > platform.x &&
                          this.y < platform.y + platform.height &&
                          this.y + this.height > platform.y;

        if (isColliding) {
            // Check if landing on top of platform
            if (this.velocity.y > 0 && this.y + this.height - this.velocity.y <= platform.y) {
                this.y = platform.y - this.height;
                this.velocity.y = 0;
                this.isJumping = false;
            }
            // Check for side collisions
            else if (this.velocity.x > 0 && this.x + this.width - this.velocity.x <= platform.x) {
                this.x = platform.x - this.width;
                this.velocity.x = 0;
            }
            else if (this.velocity.x < 0 && this.x - this.velocity.x >= platform.x + platform.width) {
                this.x = platform.x + platform.width;
                this.velocity.x = 0;
            }
        }
    }

    checkKeyCollision(key) {
        if (!key || !key.visible) return false;
        
        return this.x < key.x + key.width &&
               this.x + this.width > key.x &&
               this.y < key.y + key.height &&
               this.y + this.height > key.y;
    }

    resetPosition(startPos) {
        this.x = startPos.x;
        this.y = startPos.y;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.hasKey = false;
        this.levelStartTime = Date.now();
    }

    checkLevelComplete(nextLevelPos) {
        return this.hasKey && 
               this.x < nextLevelPos.x + nextLevelPos.width &&
               this.x + this.width > nextLevelPos.x &&
               this.y < nextLevelPos.y + nextLevelPos.height &&
               this.y + this.height > nextLevelPos.y;
    }

    addScore(points) {
        // Ensure points is a valid number
        if (typeof points !== 'number' || isNaN(points)) {
            points = 0;
        }
        // Ensure score is a valid number before adding
        if (typeof this.score !== 'number' || isNaN(this.score)) {
            this.score = 0;
        }
        this.score += points;
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= this.fireRate) {
            const fireballX = this.facingRight ? this.x + this.width : this.x;
            const fireballY = this.y + this.height / 2;
            this.fireballs.push(new Fireball(
                fireballX,
                fireballY,
                this.facingRight ? 1 : -1
            ));
            this.lastFireTime = currentTime;
        }
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Key {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.image = new Image();
        this.image.src = 'key.png';
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.collected = false;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    checkPlayerCollision(player) {
        return !this.collected &&
               player.x < this.x + this.radius &&
               player.x + player.width > this.x - this.radius &&
               player.y < this.y + this.radius &&
               player.y + player.height > this.y - this.radius;
    }
}

class RollingBall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.velocity = {
            x: Math.random() * 4 - 2,
            y: 0
        };
        this.gravity = 0.2;
        this.bounce = 0.6;
        this.rotation = 0;
        this.image = new Image();
        this.image.src = 'ball.png';
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (!this.image.complete) {
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.drawImage(
                this.image, 
                -this.radius, 
                -this.radius, 
                this.radius * 2, 
                this.radius * 2
            );
        }
        ctx.restore();
    }

    update(platforms, otherBalls) {
        // Update rotation based on horizontal movement
        this.rotation += this.velocity.x * 0.1;
        
        // Apply gravity
        this.velocity.y += this.gravity;
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Ball to ball collisions
        otherBalls.forEach(otherBall => {
            if (otherBall === this) return; // Skip self

            const dx = otherBall.x - this.x;
            const dy = otherBall.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + otherBall.radius;

            if (distance < minDistance) {
                // Collision detected - calculate new velocities
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);

                // Rotate velocities
                const vx1 = this.velocity.x * cos + this.velocity.y * sin;
                const vy1 = this.velocity.y * cos - this.velocity.x * sin;
                const vx2 = otherBall.velocity.x * cos + otherBall.velocity.y * sin;
                const vy2 = otherBall.velocity.y * cos - otherBall.velocity.x * sin;

                // Swap the x velocities
                this.velocity.x = vx2 * cos - vy1 * sin;
                this.velocity.y = vy1 * cos + vx2 * sin;
                otherBall.velocity.x = vx1 * cos - vy2 * sin;
                otherBall.velocity.y = vy2 * cos + vx1 * sin;

                // Move balls apart to prevent sticking
                const overlap = minDistance - distance;
                const moveX = (overlap * dx) / distance / 2;
                const moveY = (overlap * dy) / distance / 2;
                
                this.x -= moveX;
                this.y -= moveY;
                otherBall.x += moveX;
                otherBall.y += moveY;
            }
        });

        // Platform collisions
        platforms.forEach(platform => {
            if (this.y + this.radius > platform.y && 
                this.y - this.radius < platform.y + platform.height &&
                this.x + this.radius > platform.x && 
                this.x - this.radius < platform.x + platform.width) {
                
                if (this.velocity.y > 0 && this.y < platform.y) {
                    this.y = platform.y - this.radius;
                    this.velocity.y = -this.velocity.y * this.bounce;
                }
            }
        });

        // Wall collisions
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.velocity.x *= -this.bounce;
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.velocity.x *= -this.bounce;
        }

        // Ground collision
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.velocity.y = -this.velocity.y * this.bounce;
        }
    }

    checkPlayerCollision(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const distance = Math.sqrt(
            Math.pow(this.x - playerCenterX, 2) + 
            Math.pow(this.y - playerCenterY, 2)
        );
        return distance < this.radius + Math.min(player.width, player.height) / 2;
    }
}

class Fireball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = 10;
        this.direction = direction; // 1 for right, -1 for left
        this.active = true;
    }

    draw(ctx) {
        ctx.save();
        // Create gradient for fire effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#ff4');
        gradient.addColorStop(0.6, '#f42');
        gradient.addColorStop(1, 'rgba(255,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.speed * this.direction;
        
        // Deactivate if off screen
        if (this.x < 0 || this.x > canvas.width) {
            this.active = false;
        }
    }

    checkBallCollision(ball) {
        const dx = this.x - ball.x;
        const dy = this.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + ball.radius;
    }

    checkSpinnerCollision(spinner) {
        const dx = this.x - spinner.x;
        const dy = this.y - spinner.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + spinner.radius;
    }

    checkSoldierCollision(soldier) {
        return this.x < soldier.x + soldier.width &&
               this.x + this.radius * 2 > soldier.x &&
               this.y < soldier.y + soldier.height &&
               this.y + this.radius * 2 > soldier.y;
    }
}

class Spinner {
    constructor(x, y, radius = 20) {
        this.x = x;
        this.y = y;
        this.startY = y;  // Store initial Y position
        this.radius = radius;
        this.rotation = 0;
        this.speed = 0.1;
        this.spikes = 8;
        this.innerRadius = radius * 0.4;
        
        // Add vertical movement
        this.verticalSpeed = 2;
        this.verticalRange = 100;  // How far it moves up and down
        this.verticalDirection = 1; // 1 for down, -1 for up
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw the spinner
        ctx.beginPath();
        for (let i = 0; i < this.spikes; i++) {
            const angle = (i / this.spikes) * Math.PI * 2;
            const nextAngle = ((i + 1) / this.spikes) * Math.PI * 2;
            
            // Outer point
            ctx.lineTo(
                Math.cos(angle) * this.radius,
                Math.sin(angle) * this.radius
            );
            
            // Inner point
            ctx.lineTo(
                Math.cos(angle + Math.PI/this.spikes) * this.innerRadius,
                Math.sin(angle + Math.PI/this.spikes) * this.innerRadius
            );
        }
        ctx.closePath();

        // Create metallic effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#FFF');
        gradient.addColorStop(0.5, '#AAA');
        gradient.addColorStop(1, '#666');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    update() {
        // Rotate the spinner
        this.rotation += this.speed;

        // Move vertically
        this.y += this.verticalSpeed * this.verticalDirection;

        // Change direction when reaching limits
        if (this.y > this.startY + this.verticalRange) {
            this.y = this.startY + this.verticalRange;
            this.verticalDirection = -1;
        } else if (this.y < this.startY - this.verticalRange) {
            this.y = this.startY - this.verticalRange;
            this.verticalDirection = 1;
        }
    }

    checkPlayerCollision(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const distance = Math.sqrt(
            Math.pow(this.x - playerCenterX, 2) + 
            Math.pow(this.y - playerCenterY, 2)
        );
        return distance < this.radius + Math.min(player.width, player.height) / 2;
    }
}

class Arrow {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 5;
        this.speed = 7;
        this.direction = direction; // 1 for right, -1 for left
        this.active = true;
        this.rotation = direction === 1 ? 0 : Math.PI;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw arrow
        ctx.beginPath();
        // Arrow head
        ctx.moveTo(this.width, 0);
        ctx.lineTo(this.width - 5, -5);
        ctx.lineTo(this.width - 5, 5);
        ctx.closePath();
        // Arrow body
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width - 5, 0);
        
        ctx.strokeStyle = '#654321';
        ctx.fillStyle = '#654321';
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    update() {
        this.x += this.speed * this.direction;
        
        // Deactivate if off screen
        if (this.x < 0 || this.x > canvas.width) {
            this.active = false;
        }
    }

    checkPlayerCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
}

class Soldier {
    constructor(platform) {
        // Position initiale sur la plateforme
        this.platform = platform;
        this.width = 40;
        this.height = 60;
        this.x = platform.x;
        this.y = platform.y - this.height; // Place soldier on top of platform
        
        // Patrol limits based on platform
        this.patrolStart = platform.x;
        this.patrolEnd = platform.x + platform.width - this.width;
        
        this.direction = 1;
        this.speed = 2;
        this.arrows = [];
        this.lastShootTime = 0;
        this.shootInterval = 2000;
        
        this.image = new Image();
        this.image.src = 'soldier.png';
    }

    draw(ctx) {
        ctx.save();
        
        if (this.image.complete) {
            // Draw image with correct direction
            if (this.direction === -1) {
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        } else {
            // Fallback soldier drawing if image isn't loaded
            ctx.fillStyle = '#8B4513';  // Body
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Head
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(this.x + 10, this.y - 10, 20, 20);
            
            // Bow
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            if (this.direction === 1) {
                ctx.arc(this.x + this.width, this.y + 20, 15, -Math.PI/2, Math.PI/2);
            } else {
                ctx.arc(this.x, this.y + 20, 15, Math.PI/2, 3*Math.PI/2);
            }
            ctx.stroke();
        }
        
        ctx.restore();

        // Draw arrows
        this.arrows.forEach(arrow => arrow.draw(ctx));
    }

    update() {
        // Move soldier
        this.x += this.speed * this.direction;

        // Change direction at patrol boundaries
        if (this.x > this.patrolEnd) {
            this.x = this.patrolEnd;
            this.direction = -1;
        } else if (this.x < this.patrolStart) {
            this.x = this.patrolStart;
            this.direction = 1;
        }

        // Shoot arrows
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootInterval) {
            this.shoot();
            this.lastShootTime = currentTime;
        }

        // Update arrows
        this.arrows = this.arrows.filter(arrow => arrow.active);
        this.arrows.forEach(arrow => arrow.update());
    }

    shoot() {
        const arrowX = this.direction === 1 ? this.x + this.width : this.x;
        const arrowY = this.y + this.height / 2;
        this.arrows.push(new Arrow(arrowX, arrowY, this.direction));
    }
}

class Level {
    constructor(platforms, playerStart, nextLevelPos, keyPosition,
                pointsForKey = 100, pointsForCompletion = 200, timeBonus = 100) {
        this.platforms = platforms;
        this.playerStart = playerStart;
        this.nextLevelPos = nextLevelPos;
        this.key = new Key(keyPosition.x, keyPosition.y);
        this.key.visible = true;

        // Scoring parameters
        this.pointsForKey = 100;
        this.pointsForCompletion = 500;
        this.timeBonus = 100;
        this.pointsForCoin = 20;

        // Coins for bonus points
        this.coins = [];
        for (let i = 0; i < 3; i++) {
            const plat = this.platforms[Math.floor(Math.random() * this.platforms.length)];
            const cx = plat.x + plat.width / 2;
            const cy = plat.y - 20;
            this.coins.push(new Coin(cx, cy));
        }

        
        // Door image
        this.doorImage = new Image();
        this.doorImage.src = 'door.png';
        
        // Create balls that fall from the sky
        this.balls = [];
        this.lastBallSpawnTime = Date.now();
        this.ballSpawnInterval = 3000; // Spawn a new ball every 3 seconds
        this.maxBalls = 5; // Maximum number of balls allowed at once
        
        // Add spinners
        this.spinners = [
            // Level-specific spinner positions
            new Spinner(300, 350),  // Adjust positions as needed
            new Spinner(500, 250),
            new Spinner(200, 150)
        ];

        // Add background
        this.background = new Image();
        this.background.src = 'background.png';

        // Initialize soldiers on platforms (corrected version)
        this.soldiers = [];
        platforms.forEach((platform, index) => {
            // Place a soldier on every third platform
            if (index % 3 === 1) {
                this.soldiers.push(new Soldier(platform));
            }
        });
    }

    draw(ctx) {
        // Draw background first
        if (this.background.complete) {
            ctx.drawImage(this.background, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback color if image hasn't loaded
            ctx.fillStyle = '#87CEEB'; // Sky blue
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw platforms
        this.platforms.forEach(platform => platform.draw(ctx));
        
        // Draw balls
        this.balls.forEach(ball => ball.draw(ctx));
        
        // Draw door
        if (!player.hasKey) {
            ctx.globalAlpha = 0.5;
        }
        ctx.drawImage(
            this.doorImage,
            this.nextLevelPos.x,
            this.nextLevelPos.y,
            this.nextLevelPos.width,
            this.nextLevelPos.height
        );
        ctx.globalAlpha = 1.0;

        // Draw key if not collected
        if (this.key.visible) {
            this.key.draw(ctx);
        }

        // Draw coins
        this.coins.forEach(coin => coin.draw(ctx));

        // Draw spinners
        this.spinners.forEach(spinner => spinner.draw(ctx));

        // Draw soldiers
        this.soldiers.forEach(soldier => soldier.draw(ctx));
    }

    spawnNewBall() {
        if (this.balls.length < this.maxBalls) {
            this.balls.push(new RollingBall(
                Math.random() * canvas.width,
                -50 // Start just above the screen
            ));
        }
    }

    update() {
        // Check if it's time to spawn a new ball
        const currentTime = Date.now();
        if (currentTime - this.lastBallSpawnTime > this.ballSpawnInterval) {
            this.spawnNewBall();
            this.lastBallSpawnTime = currentTime;
        }

        // Update all balls with collision checking
        this.balls.forEach(ball => {
            ball.update(this.platforms, this.balls);
        });

        // Remove balls that are too high (cleanup)
        this.balls = this.balls.filter(ball => ball.y < canvas.height + 100);

        // Check fireball collisions with spinners
        player.fireballs.forEach(fireball => {
            this.spinners.forEach((spinner, index) => {
                if (fireball.checkSpinnerCollision(spinner)) {
                    // Remove both the fireball and the spinner
                    fireball.active = false;
                    this.spinners.splice(index, 1);
                    player.addScore(100); // Bonus points for destroying a spinner
                }
            });

            // Existing ball collision code
            this.balls.forEach((ball, index) => {
                if (fireball.checkBallCollision(ball)) {
                    fireball.active = false;
                    this.balls.splice(index, 1);
                    player.addScore(50);
                }
            });
        });

        // Update remaining spinners
        this.spinners.forEach(spinner => {
            spinner.update();
            if (spinner.checkPlayerCollision(player)) {
                this.resetLevel();
            }
        });

        // Check fireball collisions with soldiers
        player.fireballs.forEach(fireball => {
            this.soldiers.forEach((soldier, index) => {
                if (fireball.checkSoldierCollision(soldier)) {
                    // Remove both the fireball and the soldier
                    fireball.active = false;
                    this.soldiers.splice(index, 1);
                    player.addScore(150); // Bonus points for destroying a soldier
                }
            });

            // Existing ball collision code
            this.balls.forEach((ball, index) => {
                if (fireball.checkBallCollision(ball)) {
                    fireball.active = false;
                    this.balls.splice(index, 1);
                    player.addScore(50);
                }
            });
        });

        // Update remaining soldiers
        this.soldiers.forEach(soldier => {
            soldier.update();
            soldier.arrows.forEach(arrow => {
                if (arrow.checkPlayerCollision(player)) {
                    this.resetLevel();
                }
            });
        });

        // Check coin collection
        this.coins.forEach(coin => {
            if (coin.checkPlayerCollision(player)) {
                coin.collected = true;
                player.addScore(this.pointsForCoin);
            }
        });
    }

    resetLevel() {
        // Reset player position
        player.resetPosition(this.playerStart);
        // Reset key
        this.key.visible = true;
        player.hasKey = false;
        // Reset balls
        this.balls = [];
        // Reset coins
        this.coins.forEach(c => c.collected = false);
        // Reset score for this level
        player.score = Math.max(0, player.score - 100); // Penalty for dying
    }
}

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Create player
const player = new Player(100, 100, 50, 50);

// Handle keyboard input
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'ArrowUp') {
        player.jump();
    }
    if (e.key === 'f' || e.key === 'F') {
        player.shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls
if ('ontouchstart' in window) {
    const mapping = {
        leftBtn: 'ArrowLeft',
        rightBtn: 'ArrowRight',
        jumpBtn: 'ArrowUp',
        fireBtn: 'f'
    };
    Object.keys(mapping).forEach(id => {
        const key = mapping[id];
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[key] = true;
            if (key === 'ArrowUp') player.jump();
            if (key === 'f') player.shoot();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[key] = false;
        });
    });
}

// Add after canvas initialization
const platforms = [
    // Ground level platforms
    new Platform(100, 500, 200, 20),
    new Platform(400, 500, 200, 20),
    new Platform(700, 500, 100, 20),

    // Middle level platforms
    new Platform(0, 400, 100, 20),
    new Platform(200, 400, 100, 20),
    new Platform(400, 400, 100, 20),
    new Platform(600, 400, 100, 20),

    // Upper level platforms
    new Platform(100, 300, 100, 20),
    new Platform(300, 300, 100, 20),
    new Platform(500, 300, 100, 20),
    new Platform(700, 300, 100, 20),

    // Top level platforms
    new Platform(200, 200, 100, 20),
    new Platform(400, 200, 100, 20),
    new Platform(600, 200, 100, 20),

    // Highest platforms
    new Platform(300, 100, 100, 20),
    new Platform(500, 100, 100, 20)
];

// Add these variables after canvas initialization
let currentLevelIndex = 0;
const levels = [
    // Level 1 - Tutorial level
    new Level(
        [
            // Ground platforms
            new Platform(0, 500, 200, 20),
            new Platform(300, 500, 200, 20),
            new Platform(600, 500, 200, 20),
            // Stepping stones
            new Platform(200, 400, 100, 20),
            new Platform(400, 300, 100, 20),
            new Platform(600, 200, 100, 20),
        ],
        { x: 50, y: 400 },
        { x: 650, y: 150, width: 50, height: 50 },
        { x: 250, y: 350 }
    ),

    // Level 2 - More challenging
    new Level(
        [
            // Lower platforms
            new Platform(0, 500, 150, 20),
            new Platform(200, 450, 100, 20),
            new Platform(400, 500, 150, 20),
            // Middle section
            new Platform(100, 350, 100, 20),
            new Platform(300, 300, 100, 20),
            new Platform(500, 350, 100, 20),
            // Upper platforms
            new Platform(200, 200, 100, 20),
            new Platform(400, 150, 100, 20),
            new Platform(600, 200, 100, 20),
        ],
        { x: 50, y: 400 },
        { x: 700, y: 150, width: 50, height: 50 },
        { x: 450, y: 100 }
    ),

    // Level 3 - Expert level
    new Level(
        [
            // Starting platform
            new Platform(0, 500, 100, 20),
            // Challenging jumps
            new Platform(200, 450, 80, 20),
            new Platform(400, 400, 80, 20),
            new Platform(600, 350, 80, 20),
            // Upper section
            new Platform(100, 300, 80, 20),
            new Platform(300, 250, 80, 20),
            new Platform(500, 200, 80, 20),
            // Final stretch
            new Platform(650, 150, 100, 20),
        ],
        { x: 50, y: 400 },
        { x: 700, y: 100, width: 50, height: 50 },
        { x: 150, y: 250 }
    )
];

// Add spinner positions in levels array for better vertical movement
levels[0].spinners = [
    new Spinner(300, 250, 20),  // Adjusted Y positions to allow room for movement
    new Spinner(450, 200, 20)
];

levels[1].spinners = [
    new Spinner(250, 250, 20),
    new Spinner(400, 150, 20),
    new Spinner(550, 350, 20)
];

levels[2].spinners = [
    new Spinner(200, 300, 20),
    new Spinner(400, 200, 20),
    new Spinner(600, 100, 20),
    new Spinner(300, 400, 20)
];

// Add this class for the victory screen
class VictoryScreen {
    constructor() {
        this.isVisible = false;
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3
            });
        }
    }

    draw(ctx, player) {
        if (!this.isVisible) return;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        ctx.fillStyle = '#FFD700';
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Victory text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Victoire !', canvas.width / 2, 150);

        // Score and time
        ctx.font = '24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Score Final: ${player.score}`, canvas.width / 2, 220);
        
        // Display times for each level
        ctx.font = '20px Arial';
        player.levelTimes.forEach((time, index) => {
            const minutes = Math.floor(time / 60000);
            const seconds = ((time % 60000) / 1000).toFixed(1);
            ctx.fillText(
                `Niveau ${index + 1}: ${minutes}m ${seconds}s`, 
                canvas.width / 2, 
                280 + (index * 30)
            );
        });

        // Total time
        const totalMinutes = Math.floor(player.totalTime / 60000);
        const totalSeconds = ((player.totalTime % 60000) / 1000).toFixed(1);
        ctx.fillText(
            `Temps Total: ${totalMinutes}m ${totalSeconds}s`,
            canvas.width / 2,
            280 + (player.levelTimes.length * 30)
        );

        // Play again prompt
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Appuyez sur ESPACE pour rejouer', canvas.width / 2, canvas.height - 100);
    }
}

// Create victory screen instance after canvas initialization
const victoryScreen = new VictoryScreen();

// Replace the gameLoop function
function gameLoop() {
    // Don't update game if victory screen is showing
    if (victoryScreen.isVisible) {
        victoryScreen.draw(ctx, player);
        
        if (keys[' ']) {
            victoryScreen.isVisible = false;
            currentLevelIndex = 0;
            player.score = 0;
            player.totalTime = 0;
            player.levelTimes = [];
            player.resetPosition(levels[0].playerStart);
        }
        requestAnimationFrame(gameLoop);
        return;
    }

    const currentLevel = levels[currentLevelIndex];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Handle movement
    if (keys['ArrowLeft']) {
        player.velocity.x = -5;
        player.facingRight = false;
    } else if (keys['ArrowRight']) {
        player.velocity.x = 5;
        player.facingRight = true;
    } else {
        player.velocity.x = 0;
    }

    // Update level (handles ball spawning)
    currentLevel.update();

    // Update and check ball collisions
    currentLevel.balls.forEach(ball => {
        ball.update(currentLevel.platforms, currentLevel.balls);
        if (ball.checkPlayerCollision(player) && player.hasKey) {
            player.hasKey = false;
            currentLevel.key.visible = true;
        }
    });

    // Check key collection
    if (currentLevel.key.visible && player.checkKeyCollision(currentLevel.key)) {
        currentLevel.key.visible = false;
        player.hasKey = true;
        player.addScore(currentLevel.pointsForKey);
    }

    // Update and draw level
    player.update(currentLevel.platforms);
    currentLevel.draw(ctx);
    
    // Draw player
    player.draw(ctx);

    // Update level completion
    if (player.checkLevelComplete(currentLevel.nextLevelPos)) {
        // Calculate level completion time
        const levelTime = Date.now() - player.levelStartTime;
        player.levelTimes.push(levelTime);
        player.totalTime += levelTime;

        // Add completion bonus
        player.addScore(currentLevel.pointsForCompletion);
        
        // Add time bonus (more bonus for faster completion)
        const timeBonus = Math.max(0, currentLevel.timeBonus - Math.floor(levelTime / 1000) * 10);
        player.addScore(timeBonus);

        currentLevelIndex++;
        if (currentLevelIndex < levels.length) {
            // Start next level
            const nextLevel = levels[currentLevelIndex];
            player.resetPosition(nextLevel.playerStart);
        } else {
            // Game complete - show victory screen
            victoryScreen.isVisible = true;
        }
    }

    // Draw score
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${player.score}`, 20, 30);

    // Draw level number
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${currentLevelIndex + 1}`, canvas.width / 2, 30);

    // Draw time
    const currentTime = Date.now() - player.levelStartTime;
    const minutes = Math.floor(currentTime / 60000);
    const seconds = ((currentTime % 60000) / 1000).toFixed(1);
    ctx.textAlign = 'right';
    ctx.fillText(`Time: ${minutes}m ${seconds}s`, canvas.width - 20, 30);

    requestAnimationFrame(gameLoop);
}

// Initialize player at first level's starting position
player.resetPosition(levels[0].playerStart);

// Initialize player with starting time
player.levelStartTime = Date.now();

// Start the game
gameLoop(); 
