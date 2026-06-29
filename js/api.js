/* =========================================================
   API — camada única de comunicação com o backend.

   Todo módulo (clientes, barbeiros, etc.) chama SOMENTE
   estas funções. Isso significa que, na hora de integrar
   com o banco de dados real, você só precisa editar ESTE
   arquivo (e config.js) — nenhum outro código muda.

   Contrato esperado de cada endpoint REST:
     GET    /recurso          -> lista de registros
     POST   /recurso          -> cria um registro, retorna o criado
     PUT    /recurso/:id      -> atualiza, retorna o atualizado
     DELETE /recurso/:id      -> remove

   Formato de resposta esperado (igual ao projeto News CMS):
     { success: true,  data: [...] | {...} }
     { success: false, message: "texto do erro" }
   ========================================================= */

const Api = {
  /**
   * Lista todos os registros de um recurso.
   * @param {string} recurso - chave em API_CONFIG.endpoints (ex: 'clientes')
   * @param {object} filtros - query params opcionais, ex: { categoriaId: 2 }
   */
  async listar(recurso, filtros = {}) {
    if (API_CONFIG.useMock) {
      return Storage.listar(recurso, filtros);
    }
    const qs = new URLSearchParams(filtros).toString();
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[recurso]}${qs ? `?${qs}` : ''}`;
    return this._fetch(url, { method: 'GET' });
  },

  /** Busca um único registro pelo id. */
  async buscarPorId(recurso, id) {
    if (API_CONFIG.useMock) {
      return Storage.buscarPorId(recurso, id);
    }
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[recurso]}/${id}`;
    return this._fetch(url, { method: 'GET' });
  },

  /** Cria um novo registro. */
  async criar(recurso, payload) {
    if (API_CONFIG.useMock) {
      return Storage.criar(recurso, payload);
    }
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[recurso]}`;
    return this._fetch(url, { method: 'POST', body: JSON.stringify(payload) });
  },

  /** Atualiza um registro existente. */
  async atualizar(recurso, id, payload) {
    if (API_CONFIG.useMock) {
      return Storage.atualizar(recurso, id, payload);
    }
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[recurso]}/${id}`;
    return this._fetch(url, { method: 'PUT', body: JSON.stringify(payload) });
  },

  /** Remove um registro. */
  async remover(recurso, id) {
    if (API_CONFIG.useMock) {
      return Storage.remover(recurso, id);
    }
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[recurso]}/${id}`;
    return this._fetch(url, { method: 'DELETE' });
  },

  /** Wrapper interno de fetch — usado só quando useMock = false. */
  async _fetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { success: false, message: 'Erro de conexão com o servidor.' } };
    }
  },
};
