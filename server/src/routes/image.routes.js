const express = require('express');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const imageController = require('../controllers/image.controller');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const imageHeavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many image requests from this IP, please try again later.'
});

const zipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many zip requests from this IP, please try again later.'
});

const compressSchema = {
  body: Joi.object().keys({
    quality: Joi.number().min(10).max(100),
    maxWidth: Joi.number().min(100).max(8192),
    maxHeight: Joi.number().min(100).max(8192),
    format: Joi.string().valid('jpeg', 'jpg', 'png', 'webp', 'avif')
  })
};

const convertSchema = {
  body: Joi.object().keys({
    quality: Joi.number().min(10).max(100),
    maxWidth: Joi.number().min(100).max(8192),
    maxHeight: Joi.number().min(100).max(8192),
    format: Joi.string().valid('jpeg', 'jpg', 'png', 'webp', 'avif').required()
  })
};

const zipSchema = {
  body: Joi.object().keys({
    files: Joi.array().items(
      Joi.object().keys({
        filename: Joi.string().required(),
        originalName: Joi.string().optional()
      })
    ).required().min(1)
  })
};

const stripSchema = {
  body: Joi.object().keys({
    format: Joi.string().valid('jpeg', 'jpg', 'png', 'webp', 'avif')
  })
};

/**
 * @route POST /api/images/compress
 * @desc Compress an image
 * @access Public
 */
router.post(
  '/compress',
  imageHeavyLimiter,
  upload.single('image'),
  validate(compressSchema),
  imageController.compress
);

router.post(
  '/convert',
  imageHeavyLimiter,
  upload.single('image'),
  validate(convertSchema),
  imageController.convert
);

router.post(
  '/metadata',
  imageHeavyLimiter,
  upload.single('image'),
  imageController.metadata
);

router.post(
  '/strip-metadata',
  imageHeavyLimiter,
  upload.single('image'),
  validate(stripSchema),
  imageController.stripMetadata
);

/**
 * @route POST /api/images/zip
 * @desc Create a zip archive of multiple images
 * @access Public
 */
router.post(
  '/zip',
  zipLimiter,
  validate(zipSchema),
  imageController.downloadZip
);

module.exports = router;
