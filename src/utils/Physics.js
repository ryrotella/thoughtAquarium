class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
    
    distance(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    copy() {
        return new Vector2(this.x, this.y);
    }
}

class Physics {
    static applyBoundaries(position, velocity, width, height, margin = 50) {
        let bounced = false;
        
        if (position.x <= margin) {
            position.x = margin;
            velocity.x = Math.abs(velocity.x);
            bounced = true;
        }
        
        if (position.x >= width - margin) {
            position.x = width - margin;
            velocity.x = -Math.abs(velocity.x);
            bounced = true;
        }
        
        if (position.y <= margin) {
            position.y = margin;
            velocity.y = Math.abs(velocity.y);
            bounced = true;
        }
        
        if (position.y >= height - margin) {
            position.y = height - margin;
            velocity.y = -Math.abs(velocity.y);
            bounced = true;
        }
        
        return bounced;
    }
    
    static generateRandomVelocity(speed = 1) {
        const angle = Math.random() * Math.PI * 2;
        return new Vector2(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }
    
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
}