import { Router } from "express";
import { getDB } from "../db/index.js";
import { validateClientePayload } from "../utils/validators.js";

export const clientesRouter = Router();

// LISTAR
clientesRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDB();
    const { page = 1, limit = 20, q } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push("LOWER(nome) LIKE ?");
      params.push(`%${q.toLowerCase()}%`);
    }

    const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

    const p = Number(page);
    const l = Number(limit);
    const offset = (p - 1) * l;

    const clientes = await db.all(
      `SELECT * FROM clientes ${whereSQL} LIMIT ? OFFSET ?`,
      ...params,
      l,
      offset
    );

    const total = await db.get(
      `SELECT COUNT(*) as count FROM clientes ${whereSQL}`,
      ...params
    );

    res.json({
      data: clientes,
      pagination: {
        total: total.count,
        page: p,
        pages: Math.ceil(total.count / l),
      },
    });
  } catch (err) {
    next(err);
  }
});

// DETALHAR
clientesRouter.get("/:id", async (req, res, next) => {
  try {
    const db = await getDB();
    const id = Number(req.params.id);

    const cliente = await db.get("SELECT * FROM clientes WHERE id = ?", id);
    if (!cliente) {
      return res.status(404).json({ error: { message: "Cliente não encontrado." } });
    }

    res.json({ data: cliente });
  } catch (err) {
    next(err);
  }
});

// CRIAR
clientesRouter.post("/", async (req, res, next) => {
  try {
    const erros = validateClientePayload(req.body);
    if (erros.length > 0) {
      return res.status(400).json({ error: { message: erros.join(" ") } });
    }

    const { nome, email, telefone = null, endereco = null } = req.body;
    const agora = new Date().toISOString();

    const db = await getDB();
    const result = await db.run(
      `INSERT INTO clientes (nome, email, telefone, endereco, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
      nome.trim(),
      email.trim(),
      telefone,
      endereco,
      agora,
      agora
    );

    const criado = await db.get("SELECT * FROM clientes WHERE id = ?", result.lastID);

    res.status(201).json({ data: criado });
  } catch (err) {
    next(err);
  }
});

// ATUALIZAR
clientesRouter.put("/:id", async (req, res, next) => {
  try {
    const erros = validateClientePayload(req.body);
    if (erros.length > 0) {
      return res.status(400).json({ error: { message: erros.join(" ") } });
    }

    const db = await getDB();
    const id = Number(req.params.id);
    const existe = await db.get("SELECT id FROM clientes WHERE id = ?", id);

    if (!existe) {
      return res.status(404).json({ error: { message: "Cliente não encontrado." } });
    }

    const { nome, email, telefone = null, endereco = null } = req.body;
    const agora = new Date().toISOString();

    await db.run(
      `UPDATE clientes
       SET nome = ?, email = ?, telefone = ?, endereco = ?, atualizado_em = ?
       WHERE id = ?`,
      nome.trim(),
      email.trim(),
      telefone,
      endereco,
      agora,
      id
    );

    const atualizado = await db.get("SELECT * FROM clientes WHERE id = ?", id);

    res.json({ data: atualizado });
  } catch (err) {
    next(err);
  }
});

// EXCLUIR
clientesRouter.delete("/:id", async (req, res, next) => {
  try {
    const db = await getDB();
    const id = Number(req.params.id);

    const existe = await db.get("SELECT id FROM clientes WHERE id = ?", id);

    if (!existe) {
      return res.status(404).json({ error: { message: "Cliente não encontrado." } });
    }

    await db.run("DELETE FROM clientes WHERE id = ?", id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});