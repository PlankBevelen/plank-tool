const express = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const registerSchema = {
  body: Joi.object().keys({
    username: Joi.string().required().min(3).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6)
  })
};

const loginSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  })
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
