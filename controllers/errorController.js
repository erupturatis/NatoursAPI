const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value} `;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const val = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  console.log(value);

  const message = `Duplicate field value: x. Please input other value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err = new AppError(
  'invalid token, login again',
  401
));

handleJWTExpiredError = err = new AppError(
  'expired token, login again',
  401
);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if ((error.name = 'CastError')) {
      error = handleCastErrorDB(error);
    }
    if ((error.code = 11000)) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error, res);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError(error);
    }

    sendErrorProd(error, res);
  }
};
