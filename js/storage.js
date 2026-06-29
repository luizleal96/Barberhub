/* =========================================================
   STORAGE (MOCK) — simula um banco de dados em memória.

   Usado apenas enquanto API_CONFIG.useMock === true.
   Imita exatamente o formato de resposta que o backend real
   deverá devolver, para que a troca seja transparente.

   Quando o banco estiver pronto, este arquivo pode ser
   removido do index.html — nada mais depende dele além
   de api.js.
   ========================================================= */

const Storage = (() => {
  const db = {
    clientes: [],
    barbeiros: [],
    servicos: [],
    agendamentos: [],
    pagamentos: [],
  };

  let nextId = 1;

  function ok(data) {
    return { ok: true, status: 200, data: { success: true, data } };
  }
  function fail(message, status = 400) {
    return { ok: false, status, data: { success: false, message } };
  }

  return {
    async listar(recurso, filtros = {}) {
      let registros = [...db[recurso]];

      // Filtro de busca textual simples (?busca=)
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        registros = registros.filter(r =>
          JSON.stringify(r).toLowerCase().includes(termo)
        );
      }

      return ok(registros);
    },

    async buscarPorId(recurso, id) {
      const registro = db[recurso].find(r => String(r.id) === String(id));
      if (!registro) return fail('Registro não encontrado.', 404);
      return ok(registro);
    },

    async criar(recurso, payload) {
      const registro = { id: nextId++, ...payload, criadoEm: new Date().toISOString() };
      db[recurso].push(registro);
      return ok(registro);
    },

    async atualizar(recurso, id, payload) {
      const idx = db[recurso].findIndex(r => String(r.id) === String(id));
      if (idx === -1) return fail('Registro não encontrado.', 404);
      db[recurso][idx] = { ...db[recurso][idx], ...payload, atualizadoEm: new Date().toISOString() };
      return ok(db[recurso][idx]);
    },

    async remover(recurso, id) {
      const idx = db[recurso].findIndex(r => String(r.id) === String(id));
      if (idx === -1) return fail('Registro não encontrado.', 404);
      db[recurso].splice(idx, 1);
      return ok({ removido: true });
    },
  };
})();
