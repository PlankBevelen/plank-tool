const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/response');

const getProfile = catchAsync(async (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  success(res, { user }, 'User profile retrieved successfully');
});

const updateFavorites = catchAsync(async (req, res) => {
  const { favorites } = req.body;
  req.user.favorites = favorites;
  await req.user.save();

  const user = req.user.toObject();
  delete user.password;
  success(res, { user }, 'Favorites updated successfully');
});

module.exports = {
  getProfile,
  updateFavorites
};
