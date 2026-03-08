const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already taken');
  }

  // Create user
  const user = await User.create({ username, email, password });
  
  // Generate token
  const token = signToken(user._id);

  // Convert to object and remove password (though select: false handles queries, create returns full doc)
  const userData = user.toObject();
  delete userData.password;

  success(res, { user: userData, token }, 'User registered successfully', 201);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  // Explicitly select password since it's set to select: false in schema
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  const token = signToken(user._id);
  
  const userData = user.toObject();
  delete userData.password;

  success(res, { user: userData, token }, 'Login successful');
});

module.exports = {
  register,
  login
};
