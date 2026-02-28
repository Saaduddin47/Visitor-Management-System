export const notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  if (res.headersSent) return next(err);

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
