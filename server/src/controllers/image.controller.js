const httpStatusRaw = require('http-status');
const httpStatus = httpStatusRaw.default || httpStatusRaw;
const catchAsync = require('../utils/catchAsync');
const { imageService } = require('../services');
const ApiError = require('../utils/ApiError');
const path = require('path');

const compress = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a file');
  }

  const options = {
    quality: req.body.quality ? parseInt(req.body.quality, 10) : 80,
    maxWidth: req.body.maxWidth ? parseInt(req.body.maxWidth, 10) : 1920,
    maxHeight: req.body.maxHeight ? parseInt(req.body.maxHeight, 10) : 1080,
    format: req.body.format
  };

  const result = await imageService.compressImage(req.file.buffer, options);

  const originalSize = req.file.size;
  const compressedSize = result.size;
  const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

  // Generate public URL
  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/uploads/${result.filename}`;

  res.status(httpStatus.OK).send({
    ...result,
    url,
    originalSize,
    compressedSize,
    reduction: parseFloat(reduction)
  });
});

const downloadZip = catchAsync(async (req, res) => {
  const { files } = req.body;
  
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide a list of files to download');
  }

  // Validate files exist and construct internal paths
  // Security check: ensure files are within the uploads directory to prevent path traversal
  // We assume files come with 'filename' property which is the name in uploads dir
  
  const UPLOADS_DIR = path.join(__dirname, '../../uploads');
  
  const filesToZip = files.map(file => {
    // Basic validation to prevent directory traversal
    const safeFilename = path.basename(file.filename);
    return {
      path: path.join(UPLOADS_DIR, safeFilename),
      name: file.originalName || safeFilename // Use original name for the zip entry if provided
    };
  });

  const zipResult = await imageService.createZipArchive(filesToZip);
  
  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/uploads/${zipResult.filename}`;

  res.status(httpStatus.OK).send({
    ...zipResult,
    url
  });
});

module.exports = {
  compress,
  downloadZip
};
