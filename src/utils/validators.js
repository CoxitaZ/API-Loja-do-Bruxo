export function validateItemPayload(body, { partial = false } = {}) {
  const errors = [];

  const isNumber = (v) => typeof v === "number" && !Number.isNaN(v);

  if (!partial || body.nome !== undefined) {
    if (typeof body.nome !== "string" || body.nome.trim().length < 2) {
      errors.push("Campo 'nome' é obrigatório e deve ter pelo menos 2 caracteres.");
    }
  }

  if (!partial || body.preco !== undefined) {
    if (!isNumber(body.preco) || body.preco < 0) {
      errors.push("Campo 'preco' é obrigatório e deve ser um número ≥ 0.");
    }
  }

  if (!partial || body.estoque !== undefined) {
    if (!Number.isInteger(body.estoque) || body.estoque < 0) {
      errors.push("Campo 'estoque' é obrigatório e deve ser um inteiro ≥ 0.");
    }
  }

  if (body.descricao !== undefined && body.descricao !== null) {
    if (typeof body.descricao !== "string") errors.push("Campo 'descricao' deve ser texto.");
  }

  if (body.categoria !== undefined && body.categoria !== null) {
    if (typeof body.categoria !== "string") errors.push("Campo 'categoria' deve ser texto.");
  }

  return errors;
}