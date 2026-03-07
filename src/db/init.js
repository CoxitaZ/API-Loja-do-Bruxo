
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { getDB } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  const db = await getDB();
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await db.exec(schema);

  // Seeds (opcionais)
  const now = new Date().toISOString();

  const existing = await db.get("SELECT COUNT(*) as count FROM items");
  if (existing.count === 0) {
    await db.run(
      `INSERT INTO items (nome, descricao, preco, estoque, categoria, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["Poção de Mana", "Restaura mana moderadamente.", 35.5, 10, "poções", now, now]
    );
    await db.run(
      `INSERT INTO items (nome, descricao, preco, estoque, categoria, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["Pergaminho de Fogo", "Lança uma bola de fogo.", 120, 3, "pergaminhos", now, now]
    );
  }

  console.log("Banco inicializado!");
  process.exit(0);
}

init().catch((err) => {
  console.error("Erro ao inicializar banco:", err);
  process.exit(1);
});
