class VoiceInput {
    constructor(tank) {
        this.tank = tank;
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        
        this.initSpeechRecognition();
    }
    
    initSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            this.updateUI(false);
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        // Current transcript accumulator
        this.currentTranscript = '';
        this.finalTranscript = '';
        
        this.setupEventListeners();
        this.isSupported = true;
        this.updateUI(true);
    }
    
    setupEventListeners() {
        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.finalTranscript = ''; // Reset final transcript for new session
            this.updateUI(true);
        };
        
        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
            
            // Now process all sentences when recording stops
            if (this.finalTranscript.trim()) {
                this.processSentencesOnStop(this.finalTranscript);
                this.finalTranscript = ''; // Clear for next session
            }
            
            this.updateUI(true);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateUI(true);
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update display only
            this.updateTranscriptDisplay(finalTranscript, interimTranscript);
            
            // Store final transcript but don't process until recording stops
            if (finalTranscript) {
                this.finalTranscript += finalTranscript + ' ';
            }
        };
    }
    
    processSentencesOnStop(text) {
        // Split by sentence endings and filter empty strings
        const sentences = text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`Processing ${sentences.length} sentences from voice recording`);
        
        sentences.forEach((sentence, index) => {
            if (sentence.length > 2) {
                // Add each sentence as a separate thought
                setTimeout(() => {
                    this.tank.addThought(sentence);
                    console.log(`Added voice thought: "${sentence}"`);
                    this.addVoiceVisualFeedback();
                }, index * 500); // Stagger by 500ms each
            }
        });
    }
    
    
    addVoiceVisualFeedback() {
        // Create a brief visual effect when voice input is processed
        const canvas = document.getElementById('aquarium');
        const rect = canvas.getBoundingClientRect();
        
        // Create temporary visual element
        const feedback = document.createElement('div');
        feedback.textContent = '🎤';
        feedback.style.position = 'absolute';
        feedback.style.left = (rect.left + rect.width - 50) + 'px';
        feedback.style.top = (rect.top + 20) + 'px';
        feedback.style.fontSize = '24px';
        feedback.style.pointerEvents = 'none';
        feedback.style.zIndex = '1000';
        feedback.style.transition = 'all 1s ease-out';
        
        document.body.appendChild(feedback);
        
        // Animate and remove
        setTimeout(() => {
            feedback.style.transform = 'translateY(-30px)';
            feedback.style.opacity = '0';
        }, 100);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 1100);
    }
    
    startListening() {
        if (!this.isSupported) {
            alert('Speech recognition is not supported in this browser. Try Chrome or Safari.');
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    updateTranscriptDisplay(finalText, interimText) {
        const display = document.getElementById('transcriptDisplay');
        if (display) {
            display.innerHTML = finalText + '<span style="color: #aaa;">' + interimText + '</span>';
        }
    }
    
    updateUI(isSupported) {
        const voiceBtn = document.getElementById('voiceBtn');
        const transcriptContainer = document.getElementById('transcriptContainer');
        
        if (!isSupported) {
            if (voiceBtn) {
                voiceBtn.disabled = true;
                voiceBtn.textContent = '🎤 Not Supported';
                voiceBtn.style.opacity = '0.5';
            }
            return;
        }
        
        if (voiceBtn) {
            voiceBtn.disabled = false;
            voiceBtn.textContent = this.isListening ? '🛑 Stop Listening' : '🎤 Start Voice';
            voiceBtn.style.backgroundColor = this.isListening ? '#cc4444' : '#0066cc';
        }
        
        if (transcriptContainer) {
            transcriptContainer.style.display = this.isListening ? 'block' : 'none';
        }
    }
}