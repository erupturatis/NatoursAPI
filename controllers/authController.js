const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { decode } = require('punycode');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'succes',
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) checkk email and pass exist
  if (!email || !password) {
    next(new AppError('provide email and password', 400));
  }

  //2) check if user exists & pass correct
  const user = await User.findOne({ email }).select('+password');

  if (
    !user ||
    !(await user.correctPassword(password, user.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  console.log(user);
  //3) send or not token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1 getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const token = req.headers.authorization.split(' ')[1];
  }
  console.log(token);

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }
  // 2 Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  console.log(decoded);

  // 3 Check if user still exists

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The token does no longer exist', 401));
  }

  // 4 Check if user changed password after JWT was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently change pass', 401));
  }

  // grant acces to protected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user with email adress', 404)
    );
  }
  // 2 generate token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3 send it as an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch with your new password
  and confirm to : ${resetURL}. If you didnt  forget password, ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subejct: 'Your password reset token(valid 10 min) ',
      message,
    });

    res.status(200).json({
      status: 'succes',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false,
    });
    return next(
      new AppError(
        'THere was and error sending the email, try again later!'
      ),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  // 2 if token not exipred, and user, set new pass
  if (!user) {
    return next(new AppError('token expired or invalid', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3 update changed pass at property for user
  // 4 log in the user, send jwt
  createSendToken(useer, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2 check if posted current password
  if (
    !(await user.correctPassword(
      req.body.passwordCurrent,
      user.password
    ))
  ) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3 if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4 log user in, send jwt
  createSendToken(user, 200, res);
});
