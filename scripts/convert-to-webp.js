const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const supportedExtensions = ['.jpg', '.jpeg', '.png'];

async function convertToWebP(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!supportedExtensions.includes(ext)) return;

    const webpPath = filePath.replace(ext, '.webp');
    
    // Skip if WebP version already exists
    try {
      await fs.access(webpPath);
      console.log(`WebP already exists for ${filePath}, skipping...`);
      return;
    } catch (err) {
      // File doesn't exist, proceed with conversion
    }

    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(webpPath);

    console.log(`Converted ${filePath} to WebP`);
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error);
  }
}

async function processDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else {
        await convertToWebP(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Start the conversion process
const publicDir = path.join(__dirname, '..', 'public');
processDirectory(publicDir)
  .then(() => console.log('Conversion complete!'))
  .catch(console.error);
