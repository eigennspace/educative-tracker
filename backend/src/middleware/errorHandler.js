export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  const statusCode = err?.statusCode || err?.status || 500;
  return res.status(statusCode).json({
    error: err?.message || 'Internal server error'
  });
}
