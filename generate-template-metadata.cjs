// Simple Template Metadata Generator
// Scans uploaded files and creates metadata automatically - No complex APIs needed!

const fs = require('fs');
const path = require('path');

console.log('🎨 GENERATING TEMPLATE METADATA FROM YOUR UPLOADED FILES');
console.log('=' .repeat(60));

class SimpleMetadataGenerator {
  constructor() {
    this.templatesPath = path.join(process.cwd(), 'backend-assets', 'templates', 'universal');
    this.audioPath = path.join(process.cwd(), 'backend-assets', 'audio', 'universal');
    this.metadataPath = path.join(process.cwd(), 'backend-assets', 'metadata');
  }

  async generateAllMetadata() {
    console.log('\n🚀 Starting Simple Metadata Generation...');
    
    try {
      // Create metadata directory if it doesn't exist
      if (!fs.existsSync(this.metadataPath)) {
        fs.mkdirSync(this.metadataPath, { recursive: true });
        console.log('✅ Created metadata directory');
      }
      
      // Generate template metadata
      const templates = await this.scanTemplateFiles();
      await this.saveTemplateMetadata(templates);
      
      // Generate audio metadata
      const audio = await this.scanAudioFiles();
      await this.saveAudioMetadata(audio);
      
      console.log('\n🎉 METADATA GENERATION COMPLETE!');
      console.log('✅ Your backend template system is now ready to use!');
      console.log('\n📋 Summary:');
      console.log(`   📸 Templates: ${templates.length} files processed`);
      console.log(`   🎵 Audio: ${audio.length} files processed`);
      console.log('\n🚀 You can now test the system in the admin panel!');
      
    } catch (error) {
      console.error('❌ Error generating metadata:', error.message);
    }
  }

  async scanTemplateFiles() {
    console.log('\n📸 Scanning Template Files...');
    
    if (!fs.existsSync(this.templatesPath)) {
      console.log('⚠️  Templates folder not found, creating it...');
      fs.mkdirSync(this.templatesPath, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(this.templatesPath);
    const templateFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)$/i.test(file)
    );
    
    console.log(`   Found ${templateFiles.length} template files`);
    
    const templates = templateFiles.map((filename, index) => {
      const ext = path.extname(filename).toLowerCase();
      const isVideo = ['.mp4', '.webm'].includes(ext);
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      
      console.log(`   📄 Processing: ${filename}`);
      
      return {
        id: `template_${index + 1}`,
        filename: filename,
        type: isVideo ? 'video' : 'image',
        format: ext.replace('.', ''),
        characteristics: {
          style: this.guessStyle(filename),
          mood: this.guessMood(filename),
          colors: this.guessColors(filename),
          category: this.guessCategory(filename)
        },
        compatibility: {
          electronics: 0.8,
          fashion: 0.7,
          food: 0.6,
          travel: 0.7,
          general: 0.9
        },
        performance: {
          usage_count: 0,
          avg_engagement: 0,
          last_used: null
        },
        created_at: Date.now()
      };
    });
    
    return templates;
  }

  async scanAudioFiles() {
    console.log('\n🎵 Scanning Audio Files...');
    
    if (!fs.existsSync(this.audioPath)) {
      console.log('⚠️  Audio folder not found, creating it...');
      fs.mkdirSync(this.audioPath, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(this.audioPath);
    const audioFiles = files.filter(file => 
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file)
    );
    
    console.log(`   Found ${audioFiles.length} audio files`);
    
    const audio = audioFiles.map((filename, index) => {
      const ext = path.extname(filename).toLowerCase();
      
      console.log(`   🎵 Processing: ${filename}`);
      
      return {
        id: `audio_${index + 1}`,
        filename: filename,
        format: ext.replace('.', ''),
        characteristics: {
          genre: this.guessGenre(filename),
          mood: this.guessAudioMood(filename),
          tempo: this.guessTempo(filename),
          energy: this.guessEnergy(filename)
        },
        duration: 30, // Default duration in seconds
        compatibility: {
          electronics: 0.8,
          fashion: 0.9,
          food: 0.6,
          travel: 0.8,
          general: 0.7
        },
        performance: {
          usage_count: 0,
          avg_engagement: 0,
          last_used: null
        },
        created_at: Date.now()
      };
    });
    
    return audio;
  }

  async saveTemplateMetadata(templates) {
    const metadata = {
      templates: templates,
      usage_history: [],
      last_updated: Date.now(),
      version: '1.0.0'
    };
    
    const filePath = path.join(this.metadataPath, 'templates.json');
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`✅ Template metadata saved: ${filePath}`);
  }

  async saveAudioMetadata(audio) {
    const metadata = {
      music: audio,
      usage_history: [],
      last_updated: Date.now(),
      version: '1.0.0'
    };
    
    const filePath = path.join(this.metadataPath, 'audio.json');
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`✅ Audio metadata saved: ${filePath}`);
  }

  // Simple AI-like guessing functions based on filename
  guessStyle(filename) {
    const name = filename.toLowerCase();
    if (name.includes('modern') || name.includes('clean')) return 'modern';
    if (name.includes('vintage') || name.includes('retro')) return 'vintage';
    if (name.includes('minimal')) return 'minimal';
    if (name.includes('bold') || name.includes('strong')) return 'bold';
    return 'modern'; // default
  }

  guessMood(filename) {
    const name = filename.toLowerCase();
    if (name.includes('bright') || name.includes('happy')) return 'energetic';
    if (name.includes('calm') || name.includes('soft')) return 'calm';
    if (name.includes('dark') || name.includes('serious')) return 'serious';
    if (name.includes('fun') || name.includes('playful')) return 'playful';
    return 'neutral'; // default
  }

  guessColors(filename) {
    const name = filename.toLowerCase();
    if (name.includes('blue')) return ['blue', 'white'];
    if (name.includes('red')) return ['red', 'white'];
    if (name.includes('green')) return ['green', 'white'];
    if (name.includes('black')) return ['black', 'white'];
    if (name.includes('white')) return ['white', 'gray'];
    return ['blue', 'white']; // default
  }

  guessCategory(filename) {
    const name = filename.toLowerCase();
    if (name.includes('tech') || name.includes('gadget')) return 'electronics';
    if (name.includes('fashion') || name.includes('style')) return 'fashion';
    if (name.includes('food') || name.includes('recipe')) return 'food';
    if (name.includes('travel') || name.includes('trip')) return 'travel';
    return 'general'; // default
  }

  guessGenre(filename) {
    const name = filename.toLowerCase();
    if (name.includes('summer') || name.includes('beach')) return 'chill';
    if (name.includes('upbeat') || name.includes('energy')) return 'upbeat';
    if (name.includes('ambient') || name.includes('calm')) return 'ambient';
    if (name.includes('corporate') || name.includes('business')) return 'corporate';
    return 'background'; // default
  }

  guessAudioMood(filename) {
    const name = filename.toLowerCase();
    if (name.includes('happy') || name.includes('upbeat')) return 'uplifting';
    if (name.includes('calm') || name.includes('relax')) return 'relaxing';
    if (name.includes('energy') || name.includes('power')) return 'energetic';
    return 'neutral'; // default
  }

  guessTempo(filename) {
    const name = filename.toLowerCase();
    if (name.includes('fast') || name.includes('quick')) return 'fast';
    if (name.includes('slow') || name.includes('calm')) return 'slow';
    return 'medium'; // default
  }

  guessEnergy(filename) {
    const name = filename.toLowerCase();
    if (name.includes('high') || name.includes('energy')) return 'high';
    if (name.includes('low') || name.includes('calm')) return 'low';
    return 'medium'; // default
  }
}

// Run the generator
const generator = new SimpleMetadataGenerator();
generator.generateAllMetadata().catch(console.error);

// Export for use in other scripts
module.exports = SimpleMetadataGenerator;