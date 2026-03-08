const express = require('express');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const imageController = require('../controllers/image.controller');
const Joi = require('joi');

const router = express.Router();

const compressSchema = {
  body: Joi.object().keys({
    quality: Joi.number().min(10).max(100),
    maxWidth: Joi.number().min(100).max(8192),
    maxHeight: Joi.number().min(100).max(8192),
    format: Joi.string().valid('jpeg', 'jpg', 'png', 'webp')
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

/**
 * @route POST /api/images/compress
 * @desc Compress an image
 * @access Public
 */
router.post(
  '/compress',
  upload.single('image'),
  validate(compressSchema),
  imageController.compress
);

/**
 * @route POST /api/images/zip
 * @desc Create a zip archive of multiple images
 * @access Public
 */
router.post(
  '/zip',
  validate(zipSchema),
  imageController.downloadZip
);

module.exports = router;
