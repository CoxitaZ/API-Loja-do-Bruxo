import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance;

/** Retorna conexão única (singleton) com o banco. */
export async function getDB() {
  if (dbInstance) return dbInstance;

  const dbFile = process.env.DATABASE_FILE || "database.sqlite";

  dbInstance = await open({
    filename: path.resolve(__dirname, "..", "..", dbFile),
    driver: sqlite3.Database,
  });

  await dbInstance.exec("PRAGMA foreign_keys = ON;");
  return dbInstance;
}
