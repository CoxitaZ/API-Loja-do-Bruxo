import { Router } from "express";
import { getDB } from "../db/index.js";
import { validateItemPayload } from "../utils/validators.js";

export const itemsRouter = Router();

/** Listar com filtro opcional por nome/categoria e paginação simples */
itemsRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDB();
    const { q, categoria, page = 1, limit = 20 } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push("LOWER(nome) LIKE ?");
      params.push(`%${String(q).toLowerCase()}%`);
    }
    if (categoria) {
      where.push("LOWER(categoria) = ?");
      params.push(String(categoria).toLowerCase());
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const items = await db.all(
      `SELECT * FROM items ${whereSQL}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limitNum,
      offset
    );

    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM items ${whereSQL}`,
      ...params
    );

    res.json({
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

/** OBTER por ID */
itemsRouter.get("/:id", async (req, res, next) => {
  try {
    const db = await getDB();
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: { message: "ID inválido." } });

    const item = await db.get(`SELECT * FROM items WHERE id = ?`, id);
    if (!item) return res.status(404).json({ error: { message: "Item não encontrado." } });

    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

/** CRIAR */
itemsRouter.post("/", async (req, res, next) => {
  try {
    const errors = validateItemPayload(req.body);
    if (errors.length) return res.status(400).json({ error: { message: errors.join(" ") } });

    const db = await getDB();
    const { nome, descricao = null, preco, estoque, categoria = null } = req.body;
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO items (nome, descricao, preco, estoque, categoria, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      nome.trim(),
      descricao,
      Number(preco),
      Number(estoque),
      categoria,
      now,
      now
    );

    const created = await db.get(`SELECT * FROM items WHERE id = ?`, result.lastID);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

/** ATUALIZAR (PUT substitui todos os campos obrigatórios) */
itemsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: { message: "ID inválido." } });

    const errors = validateItemPayload(req.body);
    if (errors.length) return res.status(400).json({ error: { message: errors.join(" ") } });

    const db = await getDB();
    const exists = await db.get(`SELECT id FROM items WHERE id = ?`, id);
    if (!exists) return res.status(404).json({ error: { message: "Item não encontrado." } });

    const { nome, descricao = null, preco, estoque, categoria = null } = req.body;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE items
       SET nome = ?, descricao = ?, preco = ?, estoque = ?, categoria = ?, updated_at = ?
       WHERE id = ?`,
      nome.trim(),
      descricao,
      Number(preco),
      Number(estoque),
      categoria,
      now,
      id
    );

    const updated = await db.get(`SELECT * FROM items WHERE id = ?`, id);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

/** EXCLUIR */
itemsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: { message: "ID inválido." } });

    const db = await getDB();
    const exists = await db.get(`SELECT id FROM items WHERE id = ?`, id);
    if (!exists) return res.status(404).json({ error: { message: "Item não encontrado." } });

    await db.run(`DELETE FROM items WHERE id = ?`, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});