const express = require('express');
const authRoute = require('./auth.routes');
const userRoute = require('./user.routes');
const imageRoute = require('./image.routes');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/images', imageRoute);

module.exports = router;
