const express = require('express');
const auth = require('../middlewares/auth');
const userController = require('../controllers/user.controller');
const Joi = require('joi');
const validate = require('../middlewares/validate');

const router = express.Router();

const favoritesSchema = {
  body: Joi.object().keys({
    favorites: Joi.array().items(Joi.string().min(1).max(50)).required()
  })
};

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', auth, userController.getProfile);

router.put('/favorites', auth, validate(favoritesSchema), userController.updateFavorites);

module.exports = router;
