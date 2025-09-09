class AnimationSystem {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
    }
    
    start(updateCallback) {
        this.isRunning = true;
        this.updateCallback = updateCallback;
        this.lastTime = performance.now();
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        
        if (this.deltaTime >= this.frameInterval) {
            this.updateCallback(this.deltaTime / 1000);
            this.lastTime = currentTime - (this.deltaTime % this.frameInterval);
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

class ParticleEffect {
    static createBubbles(x, y, count = 5) {
        const bubbles = [];
        for (let i = 0; i < count; i++) {
            bubbles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                size: Math.random() * 3 + 1,
                velocity: new Vector2(
                    (Math.random() - 0.5) * 0.5,
                    -Math.random() * 2 - 0.5
                ),
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01
            });
        }
        return bubbles;
    }
    
    static updateBubbles(bubbles, deltaTime) {
        return bubbles.filter(bubble => {
            bubble.x += bubble.velocity.x;
            bubble.y += bubble.velocity.y;
            bubble.life -= bubble.decay;
            bubble.velocity.y -= 0.1 * deltaTime;
            return bubble.life > 0;
        });
    }
    
    static drawBubbles(ctx, bubbles) {
        bubbles.forEach(bubble => {
            ctx.save();
            ctx.globalAlpha = bubble.life * 0.3;
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}