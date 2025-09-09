class ImageThought extends Thought {
    constructor(imageUrl, filename, x, y) {
        // Initialize with filename as text for base functionality
        super(filename || 'image', x, y);
        
        this.imageUrl = imageUrl;
        this.filename = filename;
        this.image = new Image();
        this.imageLoaded = false;
        this.imageSize = { width: 300, height: 300 }; // Max display size
        
        // Load the image
        this.image.onload = () => {
            this.imageLoaded = true;
            this.calculateImageSize();
        };
        
        this.image.onerror = () => {
            console.error('Failed to load image:', filename);
            this.imageLoaded = false;
        };
        
        this.image.src = imageUrl;
        
        // Adjust dimensions for image thoughts
        this.recalculateDimensions();
    }
    
    calculateImageSize() {
        const maxSize = 250;
        const minSize = 40;
        
        let width = this.image.naturalWidth;
        let height = this.image.naturalHeight;
        
        // Scale to fit within max size while maintaining aspect ratio
        const scale = Math.min(maxSize / width, maxSize / height);
        width *= scale;
        height *= scale;
        
        // Ensure minimum size
        if (width < minSize && height < minSize) {
            const minScale = Math.max(minSize / width, minSize / height);
            width *= minScale;
            height *= minScale;
        }
        
        this.imageSize = { width: Math.round(width), height: Math.round(height) };
        this.recalculateDimensions();
    }
    
    recalculateDimensions() {
        if (this.imageLoaded) {
            this.width = this.imageSize.width + 20; // Padding around image
            this.height = this.imageSize.height + 20;
        } else {
            // Use default size while loading
            this.width = 80;
            this.height = 80;
        }
        
        // Update collision size
        this.size = Math.max(this.width, this.height) / 2;
        
        // Recalculate font size for filename display
        this.fontSize = Math.min(this.height / 6, 10);
    }
    
    draw(ctx) {
        // Draw particle effects first
        ParticleEffect.drawBubbles(ctx, this.bubbles);
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Draw background circle/oval
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, Math.max(this.width, this.height) / 2
        );
        gradient.addColorStop(0, this.color + '40');
        gradient.addColorStop(0.7, this.color + '20');
        gradient.addColorStop(1, this.color + '10');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
            this.position.x, this.position.y,
            this.width / 2, this.height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
            this.position.x, this.position.y,
            (this.width / 2) * 0.9, (this.height / 2) * 0.9,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        if (this.imageLoaded) {
            // Draw the image
            ctx.drawImage(
                this.image,
                this.position.x - this.imageSize.width / 2,
                this.position.y - this.imageSize.height / 2 - 8, // Slightly above center
                this.imageSize.width,
                this.imageSize.height
            );
            
            // Draw filename below image
            ctx.fillStyle = 'white';
            ctx.font = `${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const displayName = this.filename.length > 12 
                ? this.filename.substring(0, 9) + '...'
                : this.filename;
            
            ctx.fillText(
                displayName, 
                this.position.x, 
                this.position.y + this.imageSize.height / 2 + 5
            );
        } else {
            // Show loading state
            ctx.fillStyle = 'white';
            ctx.font = `${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading...', this.position.x, this.position.y);
        }
        
        ctx.restore();
    }
    
    getInfo() {
        return {
            text: this.filename,
            type: 'image',
            imageUrl: this.imageUrl,
            age: this.age.toFixed(1),
            position: `(${Math.floor(this.position.x)}, ${Math.floor(this.position.y)})`
        };
    }
}