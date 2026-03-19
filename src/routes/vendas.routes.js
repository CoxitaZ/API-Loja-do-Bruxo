import { Router } from "express";
import { getDB } from "../db/index.js";

export const vendasRouter = Router();

/*
  LISTAR VENDAS (com nome do cliente)
*/
vendasRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDB();

    const vendas = await db.all(`
      SELECT v.*, c.nome AS cliente_nome
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      ORDER BY v.criado_em DESC
    `);

    res.json({ data: vendas });
  } catch (err) {
    next(err);
  }
});

/*
  DETALHAR: venda + itens
*/
vendasRouter.get("/:id", async (req, res, next) => {
  try {
    const db = await getDB();
    const id = Number(req.params.id);

    const venda = await db.get(`
      SELECT v.*, c.nome AS cliente_nome
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      WHERE v.id = ?
    `, id);

    const itens = await db.all(`
      SELECT vi.*, i.nome 
      FROM vendas_itens vi
      JOIN items i ON i.id = vi.item_id
      WHERE venda_id = ?
    `, id);

    res.json({ venda, itens });
  } catch (err) {
    next(err);
  }
});

/*
  CRIAR VENDA
*/
vendasRouter.post("/", async (req, res, next) => {
  try {
    const db = await getDB();
    const { cliente_id, itens } = req.body;

    const agora = new Date().toISOString();

    // criar venda
    const venda = await db.run(
      `INSERT INTO vendas (cliente_id, total, criado_em, atualizado_em)
       VALUES (?, 0, ?, ?)`,
      cliente_id, agora, agora
    );

    let total = 0;

    for (const item of itens) {
      const produto = await db.get(`SELECT preco, estoque FROM items WHERE id = ?`, item.item_id);

      if (!produto) throw new Error("Item não encontrado.");
      if (produto.estoque < item.quantidade) {
        return res.status(400).json({
          error: { message: `Estoque insuficiente: disponível ${produto.estoque}.` }
        });
      }

      total += produto.preco * item.quantidade;

      // Inserir item na venda
      await db.run(
        `INSERT INTO vendas_itens (venda_id, item_id, quantidade, preco_unitario)
        VALUES (?, ?, ?, ?)`,
        venda.lastID, item.item_id, item.quantidade, produto.preco
      );

      // 🔥 Atualizar estoque
      await db.run(
        `UPDATE items SET estoque = estoque - ? WHERE id = ?`,
        item.quantidade,
        item.item_id
      );
    }

    // atualizar total
    await db.run(
      `UPDATE vendas SET total = ?, atualizado_em = ? WHERE id = ?`,
      total, agora, venda.lastID
    );

    res.status(201).json({ id: venda.lastID, total });
  } catch (err) {
    next(err);
  }
});

/*
  EXCLUIR VENDA
*/
vendasRouter.delete("/:id", async (req, res, next) => {
  try {
    const db = await getDB();
    const id = Number(req.params.id);

    await db.run("DELETE FROM vendas WHERE id = ?", id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});