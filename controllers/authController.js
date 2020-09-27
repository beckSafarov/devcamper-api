const asyncHandler = require('../middleware/async'),
  Bootcamp = require('../models/btcModel'),
  User = require('../models/userModel'),
  ErrorResponse = require('../utils/errorResponse');

//@desc      Register User
//@route     POST/api/v1/auth/register
//@access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  //create user
  const user = await User.create({
    name, //equivalent to: name = name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

//@desc      Login User
//@route     POST/api/v1/auth/login
//@access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //validate email and password fields
  if (!email || !password) {
    return next(new ErrorResponse(`Please provide an email and password`, 400));
  }

  //check for user
  const user = await User.findOne({ email }).select('+password');
  //doing +password because password was excluded from select function in the model
  if (!user) {
    return next(new ErrorResponse(`Such user does not exist`, 401));
  }

  //check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse(`Password is wrong`, 401));
  }

  sendTokenResponse(user, 200, res);
});

//get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //create token
  const token = user.getSignedJwtToken(),
    options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

//@desc      Get logged in user
//@route     GET/api/v1/auth/me
//@access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await req.user;
  res.status(200).json({ success: true, data: user });
});