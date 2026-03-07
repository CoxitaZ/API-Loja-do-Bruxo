export function notFoundHandler(_req, res, _next) {
  res.status(404).json({ error: { message: "Rota não encontrada." } });
}