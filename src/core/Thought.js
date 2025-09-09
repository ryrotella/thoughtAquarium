class Thought {
    constructor(text, x, y) {
        this.text = text;
        this.position = new Vector2(x, y);
        this.velocity = Physics.generateRandomVelocity(Math.random() * 2 + 0.5);
        this.originalSpeed = this.velocity.magnitude();
        
        // Calculate adaptive dimensions based on text length
        this.calculateDimensions();
        this.color = this.generateColor();
        this.alpha = 0;
        this.targetAlpha = 1;
        
        // Set randomized font size once per thought
        this.fontSize = this.calculateFontSize();
        
        this.age = 0;
        this.maxAge = 25 + Math.random() * 30;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderStrength = 0.1;
        
        // Lifecycle behaviors
        this.isHiding = false;
        this.hideTimer = 0;
        this.maxHideTime = 3 + Math.random() * 4;
        this.restingDepth = Math.random() * 0.3 + 0.7; // Bottom 30% of tank
        this.personality = Math.random(); // 0=shy, 1=bold
        
        this.bubbles = [];
        this.bubbleTimer = 0;
        
        this.isAlive = true;
        this.direction = Math.random() * Math.PI * 2;
        
        // Advanced interaction properties
        this.canMerge = true;
        this.mergeRadius = this.size * 0.8;
        this.splitTimer = 0;
        this.canSplit = text.split(' ').length > 2; // Only multi-word thoughts can split
    }
    
    calculateDimensions() {
        const textLength = this.text.length;
        const words = this.text.split(' ').length;
        
        // Increased base dimensions for better visibility
        const minWidth = 60;
        const minHeight = 40;
        const maxWidth = 300;
        const maxHeight = 100;
        
        // Calculate width based on text length, height based on word count - larger multipliers
        this.width = Math.min(Math.max(textLength * 6 + 30, minWidth), maxWidth);
        this.height = Math.min(Math.max(words * 12 + 25, minHeight), maxHeight);
        
        // For collision detection, use the larger dimension as radius
        this.size = Math.max(this.width, this.height) / 2;
        
        // Adjust for very long single words
        if (words === 1 && textLength > 15) {
            this.width = Math.min(textLength * 5, maxWidth);
            this.height = Math.min(this.height * 1.3, maxHeight);
        }
    }
    
    calculateFontSize() {
        // Calculate font size with larger base size for better readability
        const baseFontSize = Math.min(this.height / 2.2, this.width / (this.text.length * 0.5), 28);
        const randomMultiplier = 0.9 + (Math.random() * 0.4); // 0.9 to 1.3x variation (less random)
        return Math.max(Math.floor(baseFontSize * randomMultiplier), 14);
    }
    
    generateColor() {
        // Brighter, more vibrant colors for better visibility
        const colors = [
            '#FF4757', '#2ED573', '#1E90FF', '#FF6348',
            '#FFD700', '#FF69B4', '#00CED1', '#9B59B6',
            '#E74C3C', '#2ECC71', '#3498DB', '#F39C12',
            '#E67E22', '#1ABC9C', '#9013FE', '#00E676'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime, tankWidth, tankHeight, allThoughts, moodInfluence) {
        this.age += deltaTime;
        
        // Handle hiding behavior
        this.updateHidingBehavior(deltaTime, tankHeight, allThoughts);
        
        // Apply mood influence to movement
        this.applyMoodInfluence(moodInfluence, deltaTime);
        
        this.wander(deltaTime);
        this.avoidCollisions(allThoughts);
        
        // Check for merge opportunities
        this.checkMergeOpportunities(allThoughts, deltaTime);
        
        // Update split timer
        this.splitTimer += deltaTime;
        
        // Apply depth preference when hiding
        if (this.isHiding) {
            const targetY = tankHeight * this.restingDepth;
            const depthForce = new Vector2(0, (targetY - this.position.y) * 0.001);
            this.velocity.add(depthForce);
        }
        
        this.position.add(this.velocity.copy().multiply(deltaTime * 60));
        
        const bounced = Physics.applyBoundaries(
            this.position, 
            this.velocity, 
            tankWidth, 
            tankHeight, 
            Math.max(this.width, this.height) / 2
        );
        
        if (bounced) {
            this.wanderAngle += (Math.random() - 0.5) * 0.5;
        }
        
        // Adjust alpha based on hiding state
        const targetAlpha = this.isHiding ? 0.3 + (this.personality * 0.4) : 1.0;
        this.alpha = Physics.lerp(this.alpha, targetAlpha, deltaTime * 2);
        
        this.bubbleTimer -= deltaTime;
        const bubbleFrequency = this.isHiding ? 4 : 2; // Less bubbles when hiding
        if (this.bubbleTimer <= 0) {
            this.bubbles.push(...ParticleEffect.createBubbles(
                this.position.x, 
                this.position.y, 
                this.isHiding ? 1 : Math.floor(Math.random() * 2) + 1
            ));
            this.bubbleTimer = Math.random() * bubbleFrequency + 1;
        }
        
        this.bubbles = ParticleEffect.updateBubbles(this.bubbles, deltaTime);
        
        // Death with potential return
        if (this.age > this.maxAge) {
            if (Math.random() < 0.10) { // 10% chance to "return"
                this.age = 0;
                this.maxAge = 15 + Math.random() * 10; // Shorter second life
                this.position.x = Math.random() * tankWidth;
                this.position.y = Math.random() * tankHeight;
                this.alpha = 0;
            } else {
                this.targetAlpha = 0;
                if (this.alpha < 0.1) {
                    this.isAlive = false;
                }
            }
        }
    }
    
    updateHidingBehavior(deltaTime, tankHeight, allThoughts) {
        // Shy thoughts hide more often
        const hideChance = (1 - this.personality) * 0.003; // 0-0.3% per frame
        
        if (!this.isHiding && Math.random() < hideChance) {
            this.isHiding = true;
            this.hideTimer = 0;
        }
        
        if (this.isHiding) {
            this.hideTimer += deltaTime;
            
            // Check if crowded (more likely to hide longer)
            const nearbyThoughts = allThoughts.filter(t => 
                t !== this && this.position.distance(t.position) < this.size * 3
            ).length;
            
            const crowdingFactor = Math.min(nearbyThoughts * 0.5, 2);
            const adjustedHideTime = this.maxHideTime + crowdingFactor;
            
            if (this.hideTimer > adjustedHideTime) {
                this.isHiding = false;
                this.hideTimer = 0;
            }
        }
    }
    
    applyMoodInfluence(moodInfluence, deltaTime) {
        if (!moodInfluence) return;
        
        const { mood, intensity } = moodInfluence;
        
        switch(mood) {
            case 'fear':
                // Erratic, jittery movement
                const jitterForce = new Vector2(
                    (Math.random() - 0.5) * intensity * 2,
                    (Math.random() - 0.5) * intensity * 2
                );
                this.velocity.add(jitterForce.multiply(deltaTime));
                this.wanderStrength = 0.2 + (intensity * 0.3);
                break;
                
            case 'anger':
                // Fast, aggressive movement
                const currentSpeed = this.velocity.magnitude();
                this.velocity.normalize().multiply(currentSpeed * (1 + intensity * 0.8));
                this.wanderStrength = 0.15 + (intensity * 0.2);
                break;
                
            case 'sad':
                // Slow, heavy movement - thoughts sink
                this.velocity.multiply(0.7 - (intensity * 0.4));
                const sinkForce = new Vector2(0, intensity * 0.5);
                this.velocity.add(sinkForce.multiply(deltaTime));
                this.wanderStrength = 0.05;
                break;
                
            case 'ecstatic':
                // Bouncy, energetic movement
                const bounceForce = new Vector2(
                    Math.sin(this.age * 5) * intensity,
                    Math.cos(this.age * 3) * intensity
                );
                this.velocity.add(bounceForce.multiply(deltaTime * 0.5));
                this.wanderStrength = 0.25 + (intensity * 0.2);
                break;
                
            case 'desire':
                // Drawn towards other thoughts
                if (Math.random() < intensity * 0.1) {
                    // Occasionally move toward center or other thoughts
                    const centerX = 450; // Approximate tank center
                    const centerY = 300;
                    const attractForce = new Vector2(
                        (centerX - this.position.x) * 0.001,
                        (centerY - this.position.y) * 0.001
                    );
                    this.velocity.add(attractForce);
                }
                break;
                
            case 'hunger':
                // Searching, restless movement
                this.wanderStrength = 0.18 + (intensity * 0.15);
                if (Math.random() < 0.02) {
                    // Occasional quick direction changes
                    this.wanderAngle += (Math.random() - 0.5) * Math.PI;
                }
                break;
                
            case 'tired':
                // Very slow, lethargic movement
                this.velocity.multiply(0.4 - (intensity * 0.2)); // Even slower than sad
                const driftForce = new Vector2(0, intensity * 0.3); // Drift downward
                this.velocity.add(driftForce.multiply(deltaTime));
                this.wanderStrength = 0.02; // Minimal wandering
                break;
        }
    }
    
    wander(deltaTime) {
        this.wanderAngle += (Math.random() - 0.5) * this.wanderStrength;
        
        const wanderForce = new Vector2(
            Math.cos(this.wanderAngle) * 0.3,
            Math.sin(this.wanderAngle) * 0.3
        );
        
        this.velocity.add(wanderForce.multiply(deltaTime));
        
        const currentSpeed = this.velocity.magnitude();
        if (currentSpeed > this.originalSpeed * 1.5) {
            this.velocity.normalize().multiply(this.originalSpeed * 1.5);
        }
    }
    
    avoidCollisions(allThoughts) {
        const separationDistance = this.size * 1.8;
        const cohesionDistance = this.size * 4;
        const alignmentDistance = this.size * 3;
        
        const separationForce = new Vector2(0, 0);
        const cohesionForce = new Vector2(0, 0);
        const alignmentForce = new Vector2(0, 0);
        
        let separationCount = 0;
        let cohesionCount = 0;
        let alignmentCount = 0;
        
        allThoughts.forEach(other => {
            if (other === this) return;
            
            const distance = this.position.distance(other.position);
            
            // Separation: steer away from nearby thoughts
            if (distance < separationDistance && distance > 0) {
                const diff = this.position.copy();
                diff.x -= other.position.x;
                diff.y -= other.position.y;
                diff.normalize();
                diff.multiply(1 / distance); // Weight by distance
                
                separationForce.add(diff);
                separationCount++;
            }
            
            // Cohesion: steer towards average position of neighbors
            if (distance < cohesionDistance && distance > 0) {
                cohesionForce.add(other.position);
                cohesionCount++;
            }
            
            // Alignment: steer towards average velocity of neighbors
            if (distance < alignmentDistance && distance > 0) {
                alignmentForce.add(other.velocity);
                alignmentCount++;
            }
        });
        
        // Apply separation
        if (separationCount > 0) {
            separationForce.multiply(1 / separationCount);
            separationForce.multiply(0.8); // Strong separation
            this.velocity.add(separationForce);
        }
        
        // Apply cohesion
        if (cohesionCount > 0) {
            cohesionForce.multiply(1 / cohesionCount);
            cohesionForce.x -= this.position.x;
            cohesionForce.y -= this.position.y;
            cohesionForce.normalize();
            cohesionForce.multiply(0.1); // Gentle cohesion
            this.velocity.add(cohesionForce);
        }
        
        // Apply alignment
        if (alignmentCount > 0) {
            alignmentForce.multiply(1 / alignmentCount);
            alignmentForce.normalize();
            alignmentForce.multiply(0.15); // Moderate alignment
            this.velocity.add(alignmentForce);
        }
    }
    
    draw(ctx) {
        ParticleEffect.drawBubbles(ctx, this.bubbles);
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Create more vibrant elliptical gradient
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, Math.max(this.width, this.height) / 2
        );
        gradient.addColorStop(0, this.color + 'CC'); // More opaque center
        gradient.addColorStop(0.6, this.color + '88'); // Better mid-tone
        gradient.addColorStop(1, this.color + '22'); // Softer edge
        
        // Draw elliptical background with more prominent fill
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
            this.position.x, this.position.y,
            this.width / 2, this.height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw thicker, more visible elliptical border
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3; // Thicker border
        ctx.beginPath();
        ctx.ellipse(
            this.position.x, this.position.y,
            (this.width / 2) * 0.92, (this.height / 2) * 0.92,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Draw text with better fitting and visibility
        if (this.width > 35 && this.height > 25) {
            // Add text shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillStyle = 'white';
            ctx.font = `bold ${this.fontSize}px Arial`; // Bold for better visibility
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Word wrapping for multi-line text
            const words = this.text.split(' ');
            const maxWidth = this.width * 0.8;
            const lineHeight = this.fontSize * 1.2;
            
            if (words.length === 1) {
                // Single word - try to fit or truncate
                const displayText = this.text.length > (this.width / 6) 
                    ? this.text.substring(0, Math.floor(this.width / 6)) + '...'
                    : this.text;
                ctx.fillText(displayText, this.position.x, this.position.y);
            } else {
                // Multiple words - attempt wrapping
                const lines = this.wrapText(ctx, this.text, maxWidth);
                const totalHeight = lines.length * lineHeight;
                const startY = this.position.y - totalHeight / 2 + lineHeight / 2;
                
                lines.forEach((line, index) => {
                    ctx.fillText(line, this.position.x, startY + index * lineHeight);
                });
            }
        }
        
        ctx.restore();
    }
    
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Limit to 3 lines max
        return lines.slice(0, 3);
    }
    
    checkMergeOpportunities(allThoughts, deltaTime) {
        if (!this.canMerge || this.isPollution) return;
        
        allThoughts.forEach(other => {
            if (other === this || !other.canMerge || other.isPollution) return;
            
            const distance = this.position.distance(other.position);
            const mergeThreshold = (this.mergeRadius + other.mergeRadius) / 2;
            
            // Check if thoughts are close enough and moving slowly enough to merge
            if (distance < mergeThreshold && 
                this.velocity.magnitude() < 1.5 && 
                other.velocity.magnitude() < 1.5 &&
                Math.random() < 0.02) { // 2% chance per frame when conditions are met
                
                this.mergeWith(other, allThoughts);
                return;
            }
        });
    }
    
    mergeWith(otherThought, allThoughts) {
        // Create merged thought text
        const mergedText = this.combineToughts(this.text, otherThought.text);
        
        // Calculate merged position (weighted by size)
        const totalSize = this.size + otherThought.size;
        const newX = (this.position.x * this.size + otherThought.position.x * otherThought.size) / totalSize;
        const newY = (this.position.y * this.size + otherThought.position.y * otherThought.size) / totalSize;
        
        // Create the merged thought
        const mergedThought = new Thought(mergedText, newX, newY);
        
        // Blend properties
        mergedThought.age = Math.min(this.age, otherThought.age); // Take younger age
        mergedThought.personality = (this.personality + otherThought.personality) / 2;
        mergedThought.velocity = this.velocity.copy().add(otherThought.velocity).multiply(0.5);
        
        // Mark original thoughts for removal
        this.isAlive = false;
        otherThought.isAlive = false;
        
        // Add merged thought to tank (this will be handled by the tank)
        if (window.tank) {
            window.tank.thoughts.push(mergedThought);
            console.log(`Merged thoughts: "${this.text}" + "${otherThought.text}" = "${mergedText}"`);
        }
    }
    
    combineToughts(text1, text2) {
        // Simple combination strategies
        const strategies = [
            () => `${text1} + ${text2}`,
            () => `${text1}... ${text2}`,
            () => `${text1} & ${text2}`,
            () => `${text1}, ${text2}`,
            () => this.findCommonWords(text1, text2),
            () => this.createPortmanteau(text1, text2)
        ];
        
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        let result = strategy();
        
        // Ensure result isn't too long
        if (result.length > 100) {
            result = result.substring(0, 97) + '...';
        }
        
        return result;
    }
    
    findCommonWords(text1, text2) {
        const words1 = text1.toLowerCase().split(' ');
        const words2 = text2.toLowerCase().split(' ');
        const common = words1.filter(word => words2.includes(word));
        
        if (common.length > 0) {
            return `${common.join(' ')} (merged thought)`;
        }
        return `${text1} × ${text2}`;
    }
    
    createPortmanteau(text1, text2) {
        const word1 = text1.split(' ')[0];
        const word2 = text2.split(' ')[0];
        
        if (word1.length > 3 && word2.length > 3) {
            const part1 = word1.substring(0, Math.ceil(word1.length / 2));
            const part2 = word2.substring(Math.floor(word2.length / 2));
            return `${part1}${part2}`;
        }
        return `${text1} ⚡ ${text2}`;
    }
    
    canSplitInto() {
        if (!this.canSplit || this.splitTimer < 10) return null; // Can only split after existing for 10 seconds
        
        const words = this.text.split(' ');
        if (words.length < 3) return null;
        
        // Split into roughly equal parts
        const midPoint = Math.floor(words.length / 2);
        const part1 = words.slice(0, midPoint).join(' ');
        const part2 = words.slice(midPoint).join(' ');
        
        return { part1, part2 };
    }
    
    split() {
        const splitResult = this.canSplitInto();
        if (!splitResult) return null;
        
        // Create two new thoughts
        const offset = 30;
        const thought1 = new Thought(splitResult.part1, 
            this.position.x - offset, this.position.y - offset);
        const thought2 = new Thought(splitResult.part2, 
            this.position.x + offset, this.position.y + offset);
        
        // Give them different velocities
        thought1.velocity = Physics.generateRandomVelocity(1.5);
        thought2.velocity = Physics.generateRandomVelocity(1.5);
        
        // Inherit some properties
        thought1.age = this.age * 0.7;
        thought2.age = this.age * 0.7;
        thought1.personality = this.personality;
        thought2.personality = this.personality;
        
        // Mark original for removal
        this.isAlive = false;
        
        console.log(`Split thought: "${this.text}" → "${splitResult.part1}" & "${splitResult.part2}"`);
        
        return [thought1, thought2];
    }
    
    getInfo() {
        return {
            text: this.text,
            age: this.age.toFixed(1),
            position: `(${Math.floor(this.position.x)}, ${Math.floor(this.position.y)})`,
            canMerge: this.canMerge,
            canSplit: this.canSplit
        };
    }
}