// Centralized Express error handler. Must be registered last, after all routes.
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
};
