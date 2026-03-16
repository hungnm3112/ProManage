exports.sendResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json(data);
};

exports.sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

exports.sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};
