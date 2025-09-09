class Tank {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.setupCanvasInteraction();
        
        this.thoughts = [];
        this.animationSystem = new AnimationSystem();
        
        this.mood = 'calm';
        this.moodColors = {
            calm: '#002244',
            hunger: '#441122', 
            fear: '#84994F',
            desire: '#FF4499',
            sad: '#333333',
            ecstatic: '#FF00FF', // Base color for rainbow effect
            anger: '#CC0000',
            tired: '#663399' // Purple for tired mood
        };
        
        this.moodIntensity = 0.5;
        this.targetMoodIntensity = 0.5;
        this.moodTransitionSpeed = 2.0;
        
        this.waterTime = 0;
        this.waveAmplitude = 5;
        this.waveFrequency = 0.02;
        
        this.backgroundBubbles = [];
        this.initBackgroundBubbles();
        
        this.sparkles = [];
        this.initSparkles();
        
        this.focusedThought = null;
        this.focusRadius = 0;
        this.targetFocusRadius = 0;
        this.focusWaves = [];
        
        this.autoThoughtTimer = 0;
        this.moodThoughts = this.initMoodThoughts();
        this.moodShiftTimer = 0;
        this.setNextMoodShiftInterval();
        
        this.memoryTimer = 0;
        this.memories = this.initMemories();
        
        this.isBreathingMode = false;
        this.breathingPhase = 'inhale'; // 'inhale', 'hold', 'exhale'
        this.breathingTimer = 0;
        this.breathingCycle = { inhale: 4, hold: 4, exhale: 6 }; // 4-4-6 breathing
        this.isMousePressed = false;
        this.setupBreathingInteraction();
        
        // Phase 5: Social Media Pollution Mode
        this.isPollutionMode = false;
        this.pollutionTimer = 0;
        this.pollutionContent = this.initPollutionContent();
        this.waterClarityLevel = 1.0; // 1.0 = crystal clear, 0.0 = murky
        this.targetWaterClarity = 1.0;
        
        // Phase 5: Performance Optimizations
        this.maxThoughts = 50; // Limit total thoughts for performance
        this.cullDistantThoughts = true; // Remove thoughts that venture too far
        this.renderDistance = Math.max(this.width, this.height) * 1.2;
        this.performanceMode = false; // Reduces visual effects when enabled
        this.frameSkipCounter = 0; // For frame skipping in performance mode
        
        this.isRunning = false;
    }
    
    initMoodThoughts() {
        return {
            hunger: [
                "food",
                "i want food", 
                "jesus christ, can i eat already",
                "FEEED ME",
                "so hungry...",
                "when's lunch?",
                "starving over here",
                "thats cool and all but im hungrrrrry",
                "my stomach is growling",
                "pizza sounds good right now",
                "literally anything edible"
            ],
            fear: [
                "oh no whats happening",
                "something's wrong",
                "i'm scared",
                "danger everywhere",
                "can't breathe",
                "everything's falling apart",
                "need to hide",
                "not safe here"
            ],
            anger: [
                "this is BULLSHIT",
                "so angry right now",
                "why is everything broken?",
                "I HATE THIS",
                "furious",
                "want to scream",
                "nothing works",
            ],
            sad: [
                "everything hurts",
                "so alone",
                "why me?",
                "can't stop crying",
                "empty inside",
                "hopeless",
            ],
            desire: [
                "want it so bad",
                "need this now",
                "craving intensifies",
                "must have it",
                "can't stop thinking about it",
                "obsessed",
                "yearning deeply"
            ],
            tired: [
                "so exhausted...",
                "need sleep",
                "can't keep my eyes open",
                "running on empty",
                "too tired to function",
                "just want to rest",
                "brain fog everywhere",
                "dragging myself along",
                "five more minutes...",
                "coffee isn't working anymore",
                "mentally drained"
            ]
        };
    }
    
    setupCanvasInteraction() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleClick(x, y);
        });
        
        this.canvas.addEventListener('dblclick', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleDoubleClick(x, y);
        });
        
        // Add triple-click detection for thought splitting
        this.clickCount = 0;
        this.clickTimer = 0;
        this.lastClickPosition = { x: 0, y: 0 };
        
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Check if click is in same general area as previous clicks
            const distance = Math.sqrt(Math.pow(x - this.lastClickPosition.x, 2) + Math.pow(y - this.lastClickPosition.y, 2));
            
            if (distance < 50 && this.clickTimer < 1000) { // Within 50px and 1 second
                this.clickCount++;
            } else {
                this.clickCount = 1;
            }
            
            this.lastClickPosition = { x, y };
            this.clickTimer = 0;
            
            if (this.clickCount === 3) {
                this.handleTripleClick(x, y);
                this.clickCount = 0;
            }
        });
    }
    
    setupBreathingInteraction() {
        const breathingCircle = document.getElementById('breathingCircle');
        
        if (breathingCircle) {
            breathingCircle.addEventListener('mousedown', (event) => {
                event.preventDefault();
                this.isMousePressed = true;
            });
            
            document.addEventListener('mouseup', () => {
                this.isMousePressed = false;
            });
            
            // Also handle touch events for mobile
            breathingCircle.addEventListener('touchstart', (event) => {
                event.preventDefault();
                this.isMousePressed = true;
            });
            
            document.addEventListener('touchend', () => {
                this.isMousePressed = false;
            });
        }
    }
    
    handleClick(x, y) {
        // Find closest thought to click position
        let closestThought = null;
        let closestDistance = Infinity;
        
        this.thoughts.forEach(thought => {
            const distance = Math.sqrt(
                Math.pow(x - thought.position.x, 2) + 
                Math.pow(y - thought.position.y, 2)
            );
            
            if (distance < closestDistance && distance < thought.size * 1.5) {
                closestDistance = distance;
                closestThought = thought;
            }
        });
        
        if (closestThought) {
            this.focusOnThought(closestThought);
        } else {
            this.clearFocus();
        }
    }
    
    handleDoubleClick(x, y) {
        // Double click to release thoughts
        let thoughtToRelease = null;
        let closestDistance = Infinity;
        
        this.thoughts.forEach(thought => {
            const distance = Math.sqrt(
                Math.pow(x - thought.position.x, 2) + 
                Math.pow(y - thought.position.y, 2)
            );
            
            if (distance < closestDistance && distance < thought.size * 1.5) {
                closestDistance = distance;
                thoughtToRelease = thought;
            }
        });
        
        if (thoughtToRelease) {
            this.releaseThought(thoughtToRelease);
        }
    }
    
    handleTripleClick(x, y) {
        // Triple click to split thoughts
        let thoughtToSplit = null;
        let closestDistance = Infinity;
        
        this.thoughts.forEach(thought => {
            const distance = Math.sqrt(
                Math.pow(x - thought.position.x, 2) + 
                Math.pow(y - thought.position.y, 2)
            );
            
            if (distance < closestDistance && distance < thought.size * 1.5) {
                closestDistance = distance;
                thoughtToSplit = thought;
            }
        });
        
        if (thoughtToSplit && thoughtToSplit.canSplit) {
            this.splitThought(thoughtToSplit);
        }
    }
    
    splitThought(thought) {
        const splitThoughts = thought.split();
        
        if (splitThoughts) {
            // Add the new thoughts to the tank
            this.thoughts.push(...splitThoughts);
            
            // Create split effect
            this.createSplitEffect(thought.position.x, thought.position.y);
            
            console.log(`Thought split successfully`);
            this.updateUI();
        }
    }
    
    createSplitEffect(x, y) {
        // Create splitting animation effect
        const splitWaves = [];
        for (let i = 0; i < 6; i++) {
            splitWaves.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 80 + (i * 15),
                alpha: 0.7,
                speed: 2.5 + (i * 0.4),
                life: 1.0,
                decay: 0.015,
                color: `hsl(${120 + Math.random() * 60}, 60%, ${60 + Math.random() * 20}%)` // Green-yellow sparkles
            });
        }
        
        // Add to split effects array
        this.splitWaves = (this.splitWaves || []).concat(splitWaves);
    }
    
    focusOnThought(thought) {
        this.focusedThought = thought;
        this.targetFocusRadius = 80;
        
        // Hide all other thoughts by making them fade out
        this.thoughts.forEach(t => {
            if (t !== thought) {
                t.targetAlpha = 0; // Make other thoughts invisible
                t.velocity.multiply(0.1); // Slow them way down
            } else {
                t.targetAlpha = 1; // Keep focused thought visible
            }
        });
        
        // Create focus waves
        this.focusWaves = [];
        for (let i = 0; i < 3; i++) {
            this.focusWaves.push({
                radius: 0,
                maxRadius: 100 + (i * 30),
                alpha: 0.8,
                speed: 2 + (i * 0.5)
            });
        }
        
        console.log(`Focused on thought: "${thought.text || thought.filename || 'unknown'}" - other thoughts hidden`);
    }
    
    clearFocus() {
        this.focusedThought = null;
        this.targetFocusRadius = 0;
        this.focusWaves = [];
        
        // Restore all thoughts to normal visibility and speed
        this.thoughts.forEach(thought => {
            thought.targetAlpha = 1; // Make all thoughts visible again
            thought.velocity.multiply(10); // Restore normal speed (compensate for 0.1x)
        });
        
        console.log('Focus cleared - all thoughts restored');
    }
    
    releaseThought(thought) {
        console.log(`Releasing thought: "${thought.text}"`);
        
        // Create release effect
        const releaseWaves = [];
        for (let i = 0; i < 5; i++) {
            releaseWaves.push({
                x: thought.position.x,
                y: thought.position.y,
                radius: 0,
                maxRadius: 150 + (i * 20),
                alpha: 0.6,
                speed: 3 + (i * 0.3),
                life: 1.0,
                decay: 0.02
            });
        }
        
        // Add release waves to background effects
        this.releaseWaves = (this.releaseWaves || []).concat(releaseWaves);
        
        // Mark thought for removal
        thought.isAlive = false;
        
        // Clear focus if this was the focused thought
        if (this.focusedThought === thought) {
            this.clearFocus();
        }
    }
    
    initBackgroundBubbles() {
        for (let i = 0; i < 8; i++) {
            this.backgroundBubbles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 4 + 2,
                velocity: new Vector2(
                    (Math.random() - 0.5) * 0.3,
                    -Math.random() * 0.5 - 0.2
                ),
                life: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    initSparkles() {
        for (let i = 0; i < 15; i++) {
            this.sparkles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.01,
                brightness: Math.random() * 0.8 + 0.2,
                velocity: new Vector2(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                )
            });
        }
    }
    
    start() {
        this.isRunning = true;
        this.animationSystem.start((deltaTime) => this.update(deltaTime));
    }
    
    stop() {
        this.isRunning = false;
        this.animationSystem.stop();
    }
    
    addThought(text) {
        if (!text || text.trim() === '') return;
        
        const x = Math.random() * (this.width - 100) + 50;
        const y = Math.random() * (this.height - 100) + 50;
        
        const thought = new Thought(text.trim(), x, y);
        this.thoughts.push(thought);
        
        this.updateUI();
    }
    
    addImageThought(imageUrl, filename) {
        if (!imageUrl) return;
        
        const x = Math.random() * (this.width - 100) + 50;
        const y = Math.random() * (this.height - 100) + 50;
        
        const imageThought = new ImageThought(imageUrl, filename, x, y);
        this.thoughts.push(imageThought);
        
        this.updateUI();
    }
    
    clearThoughts() {
        this.thoughts = [];
        this.updateUI();
    }
    
    setMood(newMood, intensity = 0.7) {
        if (this.moodColors[newMood]) {
            this.mood = newMood;
            this.targetMoodIntensity = Math.max(0.2, Math.min(1.0, intensity));
            this.updateUI();
        }
    }
    
    getMoodInfluences() {
        // Random mood selection including tired
        const moods = ['calm', 'hunger', 'fear', 'desire', 'sad', 'ecstatic', 'anger', 'tired'];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        
        // Random intensity between 0.3 and 1.0
        const randomIntensity = 0.3 + (Math.random() * 0.7);
        
        return { mood: randomMood, intensity: randomIntensity };
    }
    
    setNextMoodShiftInterval() {
        // Random interval between 20-30 seconds
        this.moodShiftInterval = 20 + (Math.random() * 10);
    }
    
    initMemories() {
        return {
            memes: [
                "this is fine 🔥",
                "galaxy brain moment",
                "stonks 📈",
                "it's free real estate",
                "but wait, there's more",
                "sdiybt",
                "big brain time",
                "we need to go deeper",
                "always has been 🔫"
            ],
            songs: [
                "🎵 never gonna give you up 🎵",
                "🎶 somebody once told me 🎶",
                "🎵 is this the real life? 🎵",
                "🎶 hello darkness my old friend 🎶",
                "🎵 ANOTHER LOVE TKOOOOO🎵",
                "🎶 MANY MEN... WISH DEATH UPON ME 🎶",
                "🎵 don't stop believin' 🎵",
                "🎶 everyyybody wants to rule the wooooorld 🎶",
                "🎵 HOLY DIIIIVER 🎵",
                "🎶 eating seeeeeds is a pasttime activity🎶"
            ],
            randomFacts: [
                "octopuses have 3 hearts",
                "honey never spoils",
                "bananas are berries",
                "wombat poop is cube-shaped",
                "sharks are older than trees",
                "butterflies taste with their feet",
                "a group of flamingos is called a flamboyance"
            ]
        };
    }
    
    initPollutionContent() {
        return {
            shortFormVideos: [
                "WATCH THIS 10 SECOND HACK!!!",
                "you won't BELIEVE what happens next",
                "VIRAL DANCE TREND #347",
                "RATE MY OUTFIT 1-10",
                "POV: you're scrolling at 3AM",
                "THIS CHANGED MY LIFE!!",
                "day in my life as a...",
                "nobody talks about this...",
                "STORY TIME: something random happened",
                "GET READY WITH ME but make it CHAOS"
            ],
            clickbait: [
                "DOCTORS HATE THIS ONE TRICK",
                "99% CAN'T SOLVE THIS PUZZLE",
                "CELEBRITIES BEFORE THEY WERE FAMOUS",
                "WHAT HAPPENS WHEN YOU...",
                "TOP 10 THINGS THAT WILL SHOCK YOU",
                "THIS WILL BLOW YOUR MIND",
                "INSTANT REGRET COMPILATION",
                "THINGS ONLY 90s KIDS REMEMBER",
                "LIFE HACKS THAT ACTUALLY WORK?!",
                "WAIT UNTIL THE END..."
            ],
            socialMedia: [
                "just posted a selfie, feeling cute",
                "anyone else having a Monday?",
                "coffee + anxiety = productivity???",
                "why is everyone getting married",
                "WHO ELSE IS PROCRASTINATING RN",
                "update: still broke lol",
                "when the weekend hits different",
                "scrolling instead of sleeping again",
                "another notification... ignore",
                "comparison is the thief of joy but here we are"
            ],
            advertisements: [
                "BUY NOW! LIMITED TIME OFFER!",
                "LOSE 10 POUNDS IN 2 WEEKS",
                "MAKE MONEY FROM HOME $$$",
                "HOT SINGLES IN YOUR AREA",
                "YOUR COMPUTER MAY BE INFECTED",
                "CONGRATULATIONS! YOU'VE WON!",
                "CRYPTO EXPERTS HATE THIS TRICK",
                "INSURANCE COMPANIES DON'T WANT YOU TO KNOW",
                "FINAL NOTICE: ACT NOW!",
                "INFLUENCER APPROVED PRODUCT"
            ]
        };
    }
    
    generateMoodThoughts() {
        // Only generate for non-calm moods with sufficient intensity
        if (this.mood === 'calm' || this.moodIntensity < 0.6) return;
        
        // Don't generate if we don't have thoughts for this mood
        if (!this.moodThoughts[this.mood]) return;
        
        // Frequency based on mood intensity (higher intensity = more frequent thoughts)
        const baseInterval = 8; // seconds
        const intensityMultiplier = (1 - this.moodIntensity) + 0.3; // 0.3 to 1.3
        const thoughtInterval = baseInterval * intensityMultiplier;
        
        if (this.autoThoughtTimer >= thoughtInterval) {
            this.autoThoughtTimer = 0;
            
            // Pick random thought from mood category
            const moodThoughtList = this.moodThoughts[this.mood];
            const randomThought = moodThoughtList[Math.floor(Math.random() * moodThoughtList.length)];
            
            // Add the thought with a visual indicator that it's auto-generated
            this.addThought(randomThought);
            
            console.log(`Auto-generated ${this.mood} thought: "${randomThought}"`);
        }
    }
    
    generateMemories() {
        // Random memory popups every 45-90 seconds
        const memoryInterval = 45 + (Math.random() * 45);
        
        if (this.memoryTimer >= memoryInterval) {
            this.memoryTimer = 0;
            
            // Choose random memory type
            const memoryTypes = ['memes', 'songs', 'randomFacts'];
            const randomType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)];
            const memoryList = this.memories[randomType];
            const randomMemory = memoryList[Math.floor(Math.random() * memoryList.length)];
            
            // Add memory as a special thought
            this.addThought(randomMemory);
            console.log(`Random memory popped up: "${randomMemory}"`);
        }
    }
    
    generatePollutionContent() {
        if (!this.isPollutionMode) return;
        
        // Very frequent pollution - every 0.5-2 seconds
        const pollutionInterval = 0.5 + (Math.random() * 1.5);
        
        if (this.pollutionTimer >= pollutionInterval) {
            this.pollutionTimer = 0;
            
            // Choose random pollution type with weighted distribution
            const pollutionTypes = ['shortFormVideos', 'clickbait', 'socialMedia', 'advertisements'];
            const weights = [0.4, 0.3, 0.2, 0.1]; // Short form content dominates
            
            let randomValue = Math.random();
            let selectedType = pollutionTypes[0];
            
            for (let i = 0; i < weights.length; i++) {
                if (randomValue < weights[i]) {
                    selectedType = pollutionTypes[i];
                    break;
                }
                randomValue -= weights[i];
            }
            
            const contentList = this.pollutionContent[selectedType];
            const randomContent = contentList[Math.floor(Math.random() * contentList.length)];
            
            // Add pollution thought with special properties
            const pollutionThought = this.addPollutionThought(randomContent, selectedType);
            console.log(`Pollution content added: "${randomContent}" (${selectedType})`);
            
            // Degrade water clarity
            this.targetWaterClarity = Math.max(0.1, this.targetWaterClarity - 0.02);
        }
    }
    
    addPollutionThought(text, type) {
        if (!text || text.trim() === '') return;
        
        const x = Math.random() * (this.width - 100) + 50;
        const y = Math.random() * (this.height - 100) + 50;
        
        const thought = new Thought(text.trim(), x, y);
        
        // Make pollution thoughts more chaotic
        thought.velocity.multiply(1.5); // Faster movement
        thought.wanderStrength *= 2; // More erratic
        thought.maxAge *= 0.3; // Shorter lifespan but more frequent
        
        // Visual indicators for pollution
        const pollutionColors = {
            shortFormVideos: '#FF1744', // Bright red
            clickbait: '#FF9800',        // Orange
            socialMedia: '#E91E63',      // Pink
            advertisements: '#9C27B0'    // Purple
        };
        
        thought.color = pollutionColors[type] || '#FF5722';
        thought.isPollution = true;
        thought.pollutionType = type;
        
        this.thoughts.push(thought);
        this.updateUI();
        
        return thought;
    }
    
    startPollutionMode() {
        this.isPollutionMode = true;
        this.pollutionTimer = 0;
        
        // Set agitated mood
        this.setMood('anger', 0.8);
        
        console.log('Pollution mode activated - social media chaos incoming!');
    }
    
    stopPollutionMode() {
        this.isPollutionMode = false;
        
        // Clear existing pollution thoughts
        this.thoughts = this.thoughts.filter(thought => !thought.isPollution);
        
        // Restore water clarity
        this.targetWaterClarity = 1.0;
        
        // Return to calm mood
        this.setMood('calm', 0.5);
        
        console.log('Pollution mode deactivated - mind clearing...');
        this.updateUI();
    }
    
    startBreathingMode() {
        this.isBreathingMode = true;
        this.breathingPhase = 'inhale';
        this.breathingTimer = 0;
        this.setMood('calm', 0.3);
        
        // Slow down existing thoughts
        this.thoughts.forEach(thought => {
            thought.velocity.multiply(0.3);
        });
        
        // Show breathing overlay
        const breathingOverlay = document.getElementById('breathingOverlay');
        if (breathingOverlay) {
            breathingOverlay.style.display = 'block';
        }
        
        console.log('Breathing mode activated - 4-4-6 breathing cycle started');
        this.updateBreathingUI();
    }
    
    stopBreathingMode() {
        this.isBreathingMode = false;
        
        // Restore normal thought speeds
        this.thoughts.forEach(thought => {
            thought.velocity.multiply(3.33); // Restore from 0.3x
        });
        
        // Hide breathing overlay
        const breathingOverlay = document.getElementById('breathingOverlay');
        if (breathingOverlay) {
            breathingOverlay.style.display = 'none';
        }
        
        console.log('Breathing mode deactivated');
        this.updateBreathingUI();
    }
    
    updateBreathingMode(deltaTime) {
        this.breathingTimer += deltaTime;
        
        const currentPhase = this.breathingPhase;
        const phaseDuration = this.breathingCycle[currentPhase];
        
        if (this.breathingTimer >= phaseDuration) {
            this.breathingTimer = 0;
            
            // Cycle through breathing phases
            switch(currentPhase) {
                case 'inhale':
                    this.breathingPhase = 'hold';
                    break;
                case 'hold':
                    this.breathingPhase = 'exhale';
                    break;
                case 'exhale':
                    this.breathingPhase = 'inhale';
                    
                    // Clean some thoughts on exhale completion
                    if (Math.random() < 0.3 && this.thoughts.length > 5) {
                        const randomThought = this.thoughts[Math.floor(Math.random() * this.thoughts.length)];
                        randomThought.isAlive = false;
                        console.log('Cleaned thought during breathing:', randomThought.text);
                    }
                    break;
            }
        }
        
        this.updateBreathingUI();
    }
    
    updateBreathingUI() {
        const breathingStatus = document.getElementById('breathingStatus');
        const breathingCircle = document.getElementById('breathingCircle');
        const breathingText = document.getElementById('breathingText');
        
        if (breathingStatus) {
            if (this.isBreathingMode) {
                const timeLeft = this.breathingCycle[this.breathingPhase] - this.breathingTimer;
                breathingStatus.textContent = `${this.breathingPhase.toUpperCase()}: ${Math.ceil(timeLeft)}s`;
                breathingStatus.style.display = 'block';
            } else {
                breathingStatus.style.display = 'none';
            }
        }
        
        // Update breathing circle animation and text
        if (this.isBreathingMode && breathingCircle && breathingText) {
            const timeLeft = this.breathingCycle[this.breathingPhase] - this.breathingTimer;
            
            // Remove all classes
            breathingCircle.className = 'breathing-circle';
            
            // Add appropriate class for current phase
            breathingCircle.classList.add(this.breathingPhase);
            
            // Update text based on phase
            let instructionText = '';
            let isCorrectAction = false;
            
            switch(this.breathingPhase) {
                case 'inhale':
                    instructionText = `INHALE<br><span style="font-size: 12px;">${Math.ceil(timeLeft)}s</span>`;
                    isCorrectAction = this.isMousePressed;
                    break;
                case 'hold':
                    instructionText = `HOLD<br><span style="font-size: 12px;">${Math.ceil(timeLeft)}s</span>`;
                    isCorrectAction = this.isMousePressed;
                    break;
                case 'exhale':
                    instructionText = `EXHALE<br><span style="font-size: 12px;">${Math.ceil(timeLeft)}s</span>`;
                    isCorrectAction = !this.isMousePressed;
                    break;
            }
            
            breathingText.innerHTML = instructionText;
            
            // Visual feedback for correct/incorrect breathing
            if (isCorrectAction) {
                breathingCircle.style.boxShadow = '0 0 20px rgba(135, 206, 235, 0.8)';
            } else {
                breathingCircle.style.boxShadow = '0 0 20px rgba(255, 100, 100, 0.5)';
            }
        }
    }
    
    update(deltaTime) {
        this.waterTime += deltaTime;
        
        // Update click timer for triple-click detection
        this.clickTimer += deltaTime * 1000; // Convert to milliseconds
        
        // Update mood intensity smoothly
        this.moodIntensity = Physics.lerp(
            this.moodIntensity, 
            this.targetMoodIntensity, 
            deltaTime * this.moodTransitionSpeed
        );
        
        // Update water clarity smoothly
        this.waterClarityLevel = Physics.lerp(
            this.waterClarityLevel,
            this.targetWaterClarity,
            deltaTime * 1.5
        );
        
        // Time-based mood shifts (disabled during pollution mode)
        if (!this.isPollutionMode) {
            this.moodShiftTimer += deltaTime;
            if (this.moodShiftTimer >= this.moodShiftInterval) {
                this.moodShiftTimer = 0;
                this.setNextMoodShiftInterval(); // Set next random interval
                
                const influences = this.getMoodInfluences();
                this.setMood(influences.mood, influences.intensity);
            }
        }
        
        // Auto-generate mood-specific thoughts
        this.autoThoughtTimer += deltaTime;
        this.generateMoodThoughts();
        
        // Random memory popups (reduced during pollution mode)
        if (!this.isPollutionMode) {
            this.memoryTimer += deltaTime;
            this.generateMemories();
        }
        
        // Generate pollution content
        this.pollutionTimer += deltaTime;
        this.generatePollutionContent();
        
        // Handle breathing mode
        if (this.isBreathingMode) {
            this.updateBreathingMode(deltaTime);
        }
        
        // Performance management
        this.enforceThoughtLimit();
        this.cullDistantThoughtsIfEnabled();
        
        // Auto-enable performance mode if needed
        if (!this.performanceMode && this.shouldEnablePerformanceMode()) {
            this.togglePerformanceMode();
        }
        
        this.updateBackgroundBubbles(deltaTime);
        this.updateSparkles(deltaTime);
        this.updateFocusEffects(deltaTime);
        
        const moodInfluence = { mood: this.mood, intensity: this.moodIntensity };
        
        this.thoughts = this.thoughts.filter(thought => {
            thought.update(deltaTime, this.width, this.height, this.thoughts, moodInfluence);
            return thought.isAlive;
        });
        
        this.draw();
        this.updateUI();
    }
    
    updateBackgroundBubbles(deltaTime) {
        this.backgroundBubbles.forEach(bubble => {
            bubble.x += bubble.velocity.x;
            bubble.y += bubble.velocity.y;
            
            if (bubble.y < -10) {
                bubble.y = this.height + 10;
                bubble.x = Math.random() * this.width;
            }
            
            if (bubble.x < -10 || bubble.x > this.width + 10) {
                bubble.x = Math.random() * this.width;
            }
        });
    }
    
    updateSparkles(deltaTime) {
        this.sparkles.forEach(sparkle => {
            sparkle.x += sparkle.velocity.x;
            sparkle.y += sparkle.velocity.y;
            sparkle.twinkle += sparkle.speed;
            
            // Wrap around screen edges
            if (sparkle.x < 0) sparkle.x = this.width;
            if (sparkle.x > this.width) sparkle.x = 0;
            if (sparkle.y < 0) sparkle.y = this.height;
            if (sparkle.y > this.height) sparkle.y = 0;
        });
    }
    
    updateFocusEffects(deltaTime) {
        // Smooth focus radius transition
        this.focusRadius = Physics.lerp(this.focusRadius, this.targetFocusRadius, deltaTime * 5);
        
        // Update focus waves
        if (this.focusedThought && this.focusWaves.length > 0) {
            this.focusWaves.forEach(wave => {
                wave.radius += wave.speed;
                if (wave.radius > wave.maxRadius) {
                    wave.radius = 0;
                    wave.alpha = Math.max(0.2, wave.alpha * 0.8);
                }
            });
        }
        
        // Update release waves
        if (this.releaseWaves) {
            this.releaseWaves = this.releaseWaves.filter(wave => {
                wave.radius += wave.speed;
                wave.life -= wave.decay;
                wave.alpha = wave.life * 0.6;
                return wave.life > 0 && wave.radius < wave.maxRadius;
            });
        }
        
        // Update destruction waves
        if (this.destructionWaves) {
            this.destructionWaves = this.destructionWaves.filter(wave => {
                wave.radius += wave.speed;
                wave.life -= wave.decay;
                wave.alpha = wave.life * 0.8;
                return wave.life > 0 && wave.radius < wave.maxRadius;
            });
        }
        
        // Update split waves
        if (this.splitWaves) {
            this.splitWaves = this.splitWaves.filter(wave => {
                wave.radius += wave.speed;
                wave.life -= wave.decay;
                wave.alpha = wave.life * 0.7;
                return wave.life > 0 && wave.radius < wave.maxRadius;
            });
        }
        
        // Clear focus if focused thought is gone
        if (this.focusedThought && !this.thoughts.includes(this.focusedThought)) {
            this.clearFocus();
        }
        
        // Remove thoughts that enter the magnified thought's range
        if (this.focusedThought) {
            this.checkFocusCollisions();
        }
    }
    
    checkFocusCollisions() {
        if (!this.focusedThought) return;
        
        const focusPosition = this.focusedThought.position;
        const destructionRadius = this.focusRadius + 20; // Slightly larger than visible focus ring
        
        // Check all thoughts except the focused one
        this.thoughts.forEach(thought => {
            if (thought === this.focusedThought) return;
            
            const distance = focusPosition.distance(thought.position);
            
            // If thought enters the focus zone, destroy it
            if (distance < destructionRadius) {
                // Create destruction effect
                this.createDestructionEffect(thought.position.x, thought.position.y);
                
                // Mark thought for removal
                thought.isAlive = false;
                
                console.log(`Thought destroyed by focus field: "${thought.text || thought.filename}"`);
            }
        });
    }
    
    createDestructionEffect(x, y) {
        // Create sparkling destruction particles
        const destructionWaves = [];
        for (let i = 0; i < 8; i++) {
            destructionWaves.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 60 + (i * 10),
                alpha: 0.8,
                speed: 4 + (i * 0.5),
                life: 1.0,
                decay: 0.03,
                color: `hsl(${Math.random() * 60 + 180}, 70%, ${50 + Math.random() * 30}%)` // Blue-cyan sparkles
            });
        }
        
        // Add to destruction effects array
        this.destructionWaves = (this.destructionWaves || []).concat(destructionWaves);
    }
    
    drawFocusEffects() {
        if (!this.focusedThought || this.focusRadius < 5) return;
        
        this.ctx.save();
        
        // Draw focus ring around selected thought
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(
            this.focusedThought.position.x,
            this.focusedThought.position.y,
            this.focusRadius,
            0, Math.PI * 2
        );
        this.ctx.stroke();
        
        // Draw expanding focus waves
        this.focusWaves.forEach(wave => {
            if (wave.radius > 0 && wave.alpha > 0) {
                this.ctx.globalAlpha = wave.alpha * 0.4;
                this.ctx.strokeStyle = '#87CEEB';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(
                    this.focusedThought.position.x,
                    this.focusedThought.position.y,
                    wave.radius,
                    0, Math.PI * 2
                );
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }
    
    drawReleaseEffects() {
        if (!this.releaseWaves || this.releaseWaves.length === 0) return;
        
        this.ctx.save();
        
        this.releaseWaves.forEach(wave => {
            if (wave.alpha > 0) {
                this.ctx.globalAlpha = wave.alpha;
                this.ctx.strokeStyle = '#FF6B6B';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }
    
    drawDestructionEffects() {
        if (!this.destructionWaves || this.destructionWaves.length === 0) return;
        
        this.ctx.save();
        
        this.destructionWaves.forEach(wave => {
            if (wave.alpha > 0) {
                this.ctx.globalAlpha = wave.alpha;
                this.ctx.strokeStyle = wave.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Add sparkle effect
                if (Math.random() < 0.3) {
                    this.ctx.fillStyle = wave.color;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        wave.x + (Math.random() - 0.5) * wave.radius * 2,
                        wave.y + (Math.random() - 0.5) * wave.radius * 2,
                        2,
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        });
        
        this.ctx.restore();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawWater();
        this.drawBackgroundBubbles();
        
        // Draw sparkles only in desire mood
        if (this.mood === 'desire') {
            this.drawSparkles();
        }
        
        this.thoughts.forEach(thought => {
            thought.draw(this.ctx);
        });
        
        // Draw focus effects
        this.drawFocusEffects();
        this.drawReleaseEffects();
        this.drawDestructionEffects();
        this.drawSplitEffects();
        
        this.drawWaterSurface();
    }
    
    drawWater() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        if (this.mood === 'ecstatic') {
            // Rainbow gradient for ecstatic mood
            const time = this.waterTime * 2;
            const colors = [
                `hsl(${(time * 60) % 360}, 70%, 40%)`,
                `hsl(${(time * 60 + 60) % 360}, 70%, 45%)`,
                `hsl(${(time * 60 + 120) % 360}, 70%, 50%)`,
                `hsl(${(time * 60 + 180) % 360}, 70%, 45%)`,
                `hsl(${(time * 60 + 240) % 360}, 70%, 40%)`
            ];
            
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(0.25, colors[1]);
            gradient.addColorStop(0.5, colors[2]);
            gradient.addColorStop(0.75, colors[3]);
            gradient.addColorStop(1, colors[4]);
        } else {
            // Standard mood colors with water clarity effects
            const baseColor = this.moodColors[this.mood];
            
            // Adjust opacity based on mood intensity and water clarity
            const clarityMultiplier = this.waterClarityLevel;
            const baseOpacity = Math.floor((128 + (this.moodIntensity * 127)) * clarityMultiplier); // 128-255, reduced by clarity
            const midOpacity = Math.floor((170 + (this.moodIntensity * 85)) * clarityMultiplier);   // 170-255, reduced by clarity
            const fullOpacity = Math.floor(255 * clarityMultiplier).toString(16).padStart(2, '0');
            
            gradient.addColorStop(0, baseColor + baseOpacity.toString(16).padStart(2, '0'));
            gradient.addColorStop(0.3, baseColor + midOpacity.toString(16).padStart(2, '0'));
            gradient.addColorStop(1, baseColor + fullOpacity);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add murky overlay when water clarity is low (pollution mode)
        if (this.waterClarityLevel < 0.8) {
            const murkyOpacity = (0.8 - this.waterClarityLevel) * 0.6; // Up to 0.6 alpha when very murky
            this.ctx.fillStyle = `rgba(50, 50, 50, ${murkyOpacity})`; // Dark muddy overlay
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Dynamic wave effects based on mood
        const moodWaveMultiplier = this.getMoodWaveEffect();
        const layerOpacity = Math.floor(32 + (this.moodIntensity * 48)); // 32-80
        
        for (let i = 0; i < 3; i++) {
            const wavePath = new Path2D();
            wavePath.moveTo(0, this.height * (0.3 + i * 0.2));
            
            // Create wave path
            for (let x = 0; x <= this.width; x += 10) {
                const wave = Math.sin((x * this.waveFrequency * moodWaveMultiplier) + (this.waterTime * (i + 1) * moodWaveMultiplier)) * 
                            this.waveAmplitude * (1 + this.moodIntensity);
                wavePath.lineTo(x, this.height * (0.3 + i * 0.2) + wave);
            }
            
            wavePath.lineTo(this.width, this.height);
            wavePath.lineTo(0, this.height);
            wavePath.closePath();
            
            // Fill wave
            if (this.mood === 'ecstatic') {
                // Shifting rainbow colors for wave layers
                const hue = ((this.waterTime * 120) + (i * 60)) % 360;
                this.ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${layerOpacity / 255})`;
            } else {
                const baseColor = this.moodColors[this.mood];
                this.ctx.fillStyle = baseColor + layerOpacity.toString(16).padStart(2, '0');
            }
            this.ctx.fill(wavePath);
            
            // Add outline to waves
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-over';
            
            if (this.mood === 'ecstatic') {
                const outlineHue = ((this.waterTime * 120) + (i * 60) + 180) % 360;
                this.ctx.strokeStyle = `hsla(${outlineHue}, 80%, 60%, 0.4)`;
            } else {
                // Create lighter version of mood color for outline
                const baseColor = this.moodColors[this.mood];
                this.ctx.strokeStyle = baseColor + '60'; // Semi-transparent
            }
            
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height * (0.3 + i * 0.2));
            
            // Draw just the wave outline (not the filled area)
            for (let x = 0; x <= this.width; x += 10) {
                const wave = Math.sin((x * this.waveFrequency * moodWaveMultiplier) + (this.waterTime * (i + 1) * moodWaveMultiplier)) * 
                            this.waveAmplitude * (1 + this.moodIntensity);
                this.ctx.lineTo(x, this.height * (0.3 + i * 0.2) + wave);
            }
            
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    getMoodWaveEffect() {
        switch(this.mood) {
            case 'hunger': return 1.5; // Faster, more agitated waves
            case 'fear': return 2.8;   // Very fast, anxious waves
            case 'desire': return 1.8; // Very active waves
            case 'sad': return 0.4;    // Very slow, minimal waves
            case 'ecstatic': return 3.0; // Extremely fast, chaotic waves
            case 'anger': return 2.5;  // Very aggressive, violent waves
            case 'tired': return 0.2;  // Almost still, very lethargic waves
            case 'calm': 
            default: return 1.0;       // Normal waves
        }
    }
    
    drawBackgroundBubbles() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        this.backgroundBubbles.forEach(bubble => {
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    drawSparkles() {
        this.ctx.save();
        
        this.sparkles.forEach(sparkle => {
            const twinkle = Math.sin(sparkle.twinkle) * 0.5 + 0.5;
            const alpha = sparkle.brightness * twinkle * this.moodIntensity;
            
            this.ctx.globalAlpha = alpha;
            
            // Create sparkle gradient
            const gradient = this.ctx.createRadialGradient(
                sparkle.x, sparkle.y, 0,
                sparkle.x, sparkle.y, sparkle.size * 2
            );
            gradient.addColorStop(0, '#FFD700'); // Gold center
            gradient.addColorStop(0.3, '#FF69B4'); // Hot pink
            gradient.addColorStop(0.6, '#DDA0DD'); // Plum
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            
            // Draw sparkle as a star shape
            this.drawStar(sparkle.x, sparkle.y, sparkle.size);
        });
        
        this.ctx.restore();
    }
    
    drawStar(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x1 = x + Math.cos(angle) * size;
            const y1 = y + Math.sin(angle) * size;
            const x2 = x + Math.cos(angle + Math.PI / 4) * (size * 0.3);
            const y2 = y + Math.sin(angle + Math.PI / 4) * (size * 0.3);
            
            if (i === 0) {
                this.ctx.moveTo(x1, y1);
            } else {
                this.ctx.lineTo(x1, y1);
            }
            this.ctx.lineTo(x2, y2);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawSplitEffects() {
        if (!this.splitWaves || this.splitWaves.length === 0) return;
        
        this.ctx.save();
        
        this.splitWaves.forEach(wave => {
            if (wave.alpha > 0) {
                this.ctx.globalAlpha = wave.alpha;
                this.ctx.strokeStyle = wave.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Add split particles
                if (Math.random() < 0.4) {
                    this.ctx.fillStyle = wave.color;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        wave.x + (Math.random() - 0.5) * wave.radius * 2,
                        wave.y + (Math.random() - 0.5) * wave.radius * 2,
                        1.5,
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        });
        
        this.ctx.restore();
    }
    
    drawWaterSurface() {
        this.ctx.save();
        this.ctx.strokeStyle = '#4488AA';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 20);
        
        for (let x = 0; x <= this.width; x += 5) {
            const wave = Math.sin((x * 0.01) + (this.waterTime * 2)) * 3;
            this.ctx.lineTo(x, 20 + wave);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    updateUI() {
        const thoughtCountElement = document.getElementById('thoughtCount');
        const moodElement = document.getElementById('currentMood');
        const intensityElement = document.getElementById('moodIntensity');
        
        if (thoughtCountElement) {
            thoughtCountElement.textContent = this.thoughts.length;
        }
        
        if (moodElement) {
            moodElement.textContent = this.mood.charAt(0).toUpperCase() + this.mood.slice(1);
        }
        
        if (intensityElement) {
            intensityElement.textContent = Math.floor(this.moodIntensity * 100);
        }
        
        // Update active mood button
        document.querySelectorAll('#moodControls button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(this.mood + 'Btn');
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    getThoughts() {
        return this.thoughts.map(thought => thought.getInfo());
    }
    
    // Performance Management
    enforceThoughtLimit() {
        if (this.thoughts.length > this.maxThoughts) {
            // Remove oldest thoughts first, but preserve focused thought
            const sortedByAge = this.thoughts
                .filter(t => t !== this.focusedThought)
                .sort((a, b) => b.age - a.age);
            
            const toRemove = sortedByAge.slice(0, this.thoughts.length - this.maxThoughts);
            
            toRemove.forEach(thought => {
                thought.isAlive = false;
            });
            
            console.log(`Performance: Culled ${toRemove.length} old thoughts (limit: ${this.maxThoughts})`);
        }
    }
    
    cullDistantThoughtsIfEnabled() {
        if (!this.cullDistantThoughts) return;
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        let culledCount = 0;
        this.thoughts.forEach(thought => {
            if (thought === this.focusedThought) return; // Never cull focused thought
            
            const distance = Math.sqrt(
                Math.pow(thought.position.x - centerX, 2) + 
                Math.pow(thought.position.y - centerY, 2)
            );
            
            if (distance > this.renderDistance) {
                thought.isAlive = false;
                culledCount++;
            }
        });
        
        if (culledCount > 0) {
            console.log(`Performance: Culled ${culledCount} distant thoughts`);
        }
    }
    
    togglePerformanceMode() {
        this.performanceMode = !this.performanceMode;
        
        if (this.performanceMode) {
            // Reduce limits for better performance
            this.maxThoughts = 25;
            this.cullDistantThoughts = true;
            this.renderDistance = Math.max(this.width, this.height) * 0.8;
            
            // Reduce visual effects
            this.backgroundBubbles = this.backgroundBubbles.slice(0, 4);
            this.sparkles = this.sparkles.slice(0, 8);
            
            console.log('Performance mode ENABLED - reduced effects and limits');
        } else {
            // Restore normal limits
            this.maxThoughts = 50;
            this.renderDistance = Math.max(this.width, this.height) * 1.2;
            
            // Restore visual effects
            if (this.backgroundBubbles.length < 8) {
                this.initBackgroundBubbles();
            }
            if (this.sparkles.length < 15) {
                this.initSparkles();
            }
            
            console.log('Performance mode DISABLED - restored normal effects');
        }
        
        this.updateUI();
    }
    
    // Auto-detect performance needs
    shouldEnablePerformanceMode() {
        const highThoughtCount = this.thoughts.length > 40;
        const highPollutionMode = this.isPollutionMode && this.thoughts.length > 30;
        const manyEffects = (this.focusWaves.length + (this.releaseWaves?.length || 0) + 
                            (this.destructionWaves?.length || 0) + (this.splitWaves?.length || 0)) > 20;
        
        return highThoughtCount || highPollutionMode || manyEffects;
    }
}