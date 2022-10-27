const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  console.log(req.body);
  console.log(newUser);
  res.status(201).json({
    status: 'succes',
    data: {
      user: newUser,
    },
  });
});
