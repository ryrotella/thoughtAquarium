let tank;
let voiceInput;

function init() {
    const canvas = document.getElementById('aquarium');
    tank = new Tank(canvas);
    tank.start();
    
    // Initialize voice input
    voiceInput = new VoiceInput(tank);
    
    const thoughtInput = document.getElementById('thoughtInput');
    thoughtInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addThought();
        }
    });
    
    console.log('smAqua initialized - Phase 3: Voice integration ready');
}

function addThought() {
    const input = document.getElementById('thoughtInput');
    const text = input.value.trim();
    
    if (text) {
        tank.addThought(text);
        input.value = '';
        console.log(`Added thought: "${text}"`);
    }
}

function clearTank() {
    tank.clearThoughts();
    console.log('Tank cleared');
}

function changeMood(mood) {
    tank.setMood(mood);
    console.log(`Mood changed to: ${mood}`);
}

function toggleVoice() {
    if (voiceInput) {
        voiceInput.startListening();
    }
}

function toggleBreathing() {
    if (tank.isBreathingMode) {
        tank.stopBreathingMode();
        document.getElementById('breathingBtn').textContent = '🧘‍♂️ Start Breathing';
    } else {
        tank.startBreathingMode();
        document.getElementById('breathingBtn').textContent = '🛑 Stop Breathing';
    }
}

function togglePollution() {
    if (tank.isPollutionMode) {
        tank.stopPollutionMode();
        document.getElementById('pollutionBtn').textContent = '📱 Start Pollution';
        document.getElementById('pollutionBtn').style.backgroundColor = '#0066cc';
    } else {
        tank.startPollutionMode();
        document.getElementById('pollutionBtn').textContent = '🛑 Stop Pollution';
        document.getElementById('pollutionBtn').style.backgroundColor = '#cc4444';
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            tank.addImageThought(imageUrl, file.name);
            console.log(`Added image thought: ${file.name}`);
        };
        reader.readAsDataURL(file);
    }
    
    // Reset the file input
    event.target.value = '';
}

window.addEventListener('load', init);

window.addThought = addThought;
window.clearTank = clearTank;
window.changeMood = changeMood;
window.toggleVoice = toggleVoice;
window.toggleBreathing = toggleBreathing;
window.togglePollution = togglePollution;
window.handleImageUpload = handleImageUpload;