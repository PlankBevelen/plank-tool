const success = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    code: statusCode,
    message,
    data
  });
};

const error = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = {
    code: statusCode,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  res.status(statusCode).json(response);
};

module.exports = {
  success,
  error
};
