/* =========================================================
   MÓDULO: SERVIÇOS
   ========================================================= */

const ServicosModule = {
  recurso: 'servicos',

  init() {
    const form = document.getElementById('form-servicos');
    const btnNovo = document.querySelector('[data-new="servicos"]');

    btnNovo.addEventListener('click', () => {
      UI.resetarFormulario(form);
      form.querySelector('button[type=submit]').textContent = 'Salvar serviço';
      UI.alternarFormulario('servicos', true);
    });

    form.querySelector('[data-cancel]').addEventListener('click', () => {
      UI.alternarFormulario('servicos', false);
      UI.resetarFormulario(form);
    });

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.carregar();
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!Validation.validarForm(form)) return;

    const payload = {
      nome: form.nome.value.trim(),
      preco: parseFloat(form.preco.value),
      duracaoMinutos: parseInt(form.duracaoMinutos.value, 10),
      categoria: form.categoria.value,
    };

    const editId = form.dataset.editId;
    const resp = editId
      ? await Api.atualizar(this.recurso, editId, payload)
      : await Api.criar(this.recurso, payload);

    if (!resp.ok) {
      UI.toast(resp.data.message || 'Erro ao salvar serviço.', 'error');
      return;
    }

    UI.toast(editId ? 'Serviço atualizado.' : 'Serviço cadastrado.', 'success');
    UI.alternarFormulario('servicos', false);
    UI.resetarFormulario(form);
    this.carregar();

    if (window.AgendamentosModule) AgendamentosModule.atualizarSelects();
  },

  async editar(id) {
    const resp = await Api.buscarPorId(this.recurso, id);
    if (!resp.ok) { UI.toast('Erro ao carregar serviço.', 'error'); return; }
    const s = resp.data.data;

    const form = document.getElementById('form-servicos');
    form.nome.value = s.nome || '';
    form.preco.value = s.preco ?? '';
    form.duracaoMinutos.value = s.duracaoMinutos ?? '';
    form.categoria.value = s.categoria || 'cabelo';
    form.dataset.editId = id;
    form.querySelector('button[type=submit]').textContent = 'Atualizar serviço';

    UI.alternarFormulario('servicos', true);
  },

  async remover(id) {
    if (!confirm('Remover este serviço? Esta ação não pode ser desfeita.')) return;
    const resp = await Api.remover(this.recurso, id);
    if (!resp.ok) { UI.toast(resp.data.message || 'Erro ao remover.', 'error'); return; }
    UI.toast('Serviço removido.', 'success');
    this.carregar();
    if (window.AgendamentosModule) AgendamentosModule.atualizarSelects();
  },

  async carregar() {
    const resp = await Api.listar(this.recurso);
    const container = document.querySelector('[data-list="servicos"]');
    const registros = resp.ok ? resp.data.data : [];

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">💈</span>
          <strong>Nenhum serviço cadastrado</strong>
          <p>Clique em "Novo serviço" para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = registros.map(s => `
      <div class="record-card">
        <div class="record-main">
          <span class="record-title">${this.escape(s.nome)}</span>
          <span class="record-meta">${this.formatarPreco(s.preco)} · ${s.duracaoMinutos} min</span>
        </div>
        <div class="record-tags">
          <span class="tag tag-neutral">${this.escape(s.categoria || '')}</span>
        </div>
        <div class="record-actions">
          <button class="btn btn-text" onclick="ServicosModule.editar(${s.id})" aria-label="Editar ${this.escape(s.nome)}">Editar</button>
          <button class="btn btn-danger-text" onclick="ServicosModule.remover(${s.id})" aria-label="Remover ${this.escape(s.nome)}">Remover</button>
        </div>
      </div>
    `).join('');
  },

  formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  },
};
