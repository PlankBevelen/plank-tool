const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/response');

const getProfile = catchAsync(async (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  success(res, { user }, 'User profile retrieved successfully');
});

module.exports = {
  getProfile
};
