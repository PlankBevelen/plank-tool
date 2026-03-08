const express = require('express');
const auth = require('../middlewares/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', auth, userController.getProfile);

module.exports = router;
