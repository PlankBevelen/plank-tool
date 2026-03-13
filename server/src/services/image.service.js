const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const archiver = require('archiver');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const normalizeFormat = (format) => {
  if (!format) return undefined;
  const f = String(format).toLowerCase();
  if (f === 'jpg') return 'jpeg';
  if (f === 'tif') return 'tiff';
  return f;
};

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Compress image
 * @param {Buffer} fileBuffer - Image buffer
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} - Compressed image metadata
 */
const compressImage = async (fileBuffer, options = {}) => {
  try {
    const {
      quality = 80,
      maxWidth = 1920,
      maxHeight = 1080,
      format
    } = options;

    let pipeline = sharp(fileBuffer);
    const metadata = await pipeline.metadata();

    // Resize if needed
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize({
        width: metadata.width > maxWidth ? maxWidth : undefined,
        height: metadata.height > maxHeight ? maxHeight : undefined,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Determine format
    const targetFormat = normalizeFormat(format) || normalizeFormat(metadata.format) || 'jpeg';
    
    // Apply compression options based on format
    switch (targetFormat) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: Math.max(10, quality), compressionLevel: 9, palette: true });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      default:
        // Keep original format if supported, otherwise default to jpeg
        if (['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'].includes(targetFormat)) {
          // Special handling for other formats if needed, otherwise just pass quality
          // Note: toFormat might not support quality for all formats like gif in the same way
          pipeline = pipeline.toFormat(targetFormat);
        } else {
          pipeline = pipeline.jpeg({ quality });
        }
    }

    const filename = `compressed-${uuidv4()}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    const info = await pipeline.toFile(filepath);

    return {
      filename,
      path: filepath,
      size: info.size,
      width: info.width,
      height: info.height,
      format: info.format
    };
  } catch (error) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

/**
 * Create a ZIP archive from a list of files
 * @param {Array<{path: string, name: string}>} files - List of files to zip
 * @returns {Promise<string>} - Path to the created zip file
 */
const createZipArchive = async (files) => {
  return new Promise((resolve, reject) => {
    const zipName = `images-${uuidv4()}.zip`;
    const zipPath = path.join(UPLOADS_DIR, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
      resolve({
        filename: zipName,
        path: zipPath,
        size: archive.pointer()
      });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.name });
      }
    });

    archive.finalize();
  });
};

module.exports = {
  compressImage,
  createZipArchive
};
