export function errorHandler(err, req, res, _next) {
  console.error(err);

  const status = err.status || 500;
  const payload = {
    error: {
      message: err.message || "Erro interno do servidor.",
    },
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(status).json(payload);
}