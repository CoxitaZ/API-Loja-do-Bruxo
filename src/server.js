import express from "express";
import cors from "cors";
import "dotenv/config.js";
import { itemsRouter } from "./routes/items.routes.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/error.js";

const app = express();

app.use(cors());
app.use(express.json());

// Servir a UI estática
app.use(express.static("public"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Rotas da API
app.use("/items", itemsRouter);

// 404 e erro
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🧙 API da Loja do Feiticeiro rodando em http://localhost:${port}`);
});