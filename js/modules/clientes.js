/* =========================================================
   MÓDULO: CLIENTES
   ========================================================= */

const ClientesModule = {
  recurso: 'clientes',

  init() {
    const form = document.getElementById('form-clientes');
    const btnNovo = document.querySelector('[data-new="clientes"]');

    btnNovo.addEventListener('click', () => {
      UI.resetarFormulario(form);
      document.getElementById('cli-nome').closest('.record-form').querySelector('button[type=submit]').textContent = 'Salvar cliente';
      UI.alternarFormulario('clientes', true);
    });

    form.querySelector('[data-cancel]').addEventListener('click', () => {
      UI.alternarFormulario('clientes', false);
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
      telefone: form.telefone.value.trim(),
      email: form.email.value.trim(),
      dataNascimento: form.dataNascimento.value,
      observacoes: form.observacoes.value.trim(),
    };

    const editId = form.dataset.editId;
    const resp = editId
      ? await Api.atualizar(this.recurso, editId, payload)
      : await Api.criar(this.recurso, payload);

    if (!resp.ok) {
      UI.toast(resp.data.message || 'Erro ao salvar cliente.', 'error');
      return;
    }

    UI.toast(editId ? 'Cliente atualizado.' : 'Cliente cadastrado.', 'success');
    UI.alternarFormulario('clientes', false);
    UI.resetarFormulario(form);
    this.carregar();

    // outros módulos dependem da lista de clientes (agendamentos)
    if (window.AgendamentosModule) AgendamentosModule.atualizarSelects();
  },

  async editar(id) {
    const resp = await Api.buscarPorId(this.recurso, id);
    if (!resp.ok) { UI.toast('Erro ao carregar cliente.', 'error'); return; }
    const c = resp.data.data;

    const form = document.getElementById('form-clientes');
    form.nome.value = c.nome || '';
    form.telefone.value = c.telefone || '';
    form.email.value = c.email || '';
    form.dataNascimento.value = c.dataNascimento || '';
    form.observacoes.value = c.observacoes || '';
    form.dataset.editId = id;
    form.querySelector('button[type=submit]').textContent = 'Atualizar cliente';

    UI.alternarFormulario('clientes', true);
  },

  async remover(id) {
    if (!confirm('Remover este cliente? Esta ação não pode ser desfeita.')) return;
    const resp = await Api.remover(this.recurso, id);
    if (!resp.ok) { UI.toast(resp.data.message || 'Erro ao remover.', 'error'); return; }
    UI.toast('Cliente removido.', 'success');
    this.carregar();
    if (window.AgendamentosModule) AgendamentosModule.atualizarSelects();
  },

  async carregar() {
    const resp = await Api.listar(this.recurso);
    const container = document.querySelector('[data-list="clientes"]');
    const registros = resp.ok ? resp.data.data : [];

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">👤</span>
          <strong>Nenhum cliente cadastrado</strong>
          <p>Clique em "Novo cliente" para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = registros.map(c => `
      <div class="record-card">
        <div class="record-main">
          <span class="record-title">${this.escape(c.nome)}</span>
          <span class="record-meta">${this.escape(c.telefone || '')} ${c.email ? '· ' + this.escape(c.email) : ''}</span>
        </div>
        <div class="record-actions">
          <button class="btn btn-text" onclick="ClientesModule.editar(${c.id})" aria-label="Editar ${this.escape(c.nome)}">Editar</button>
          <button class="btn btn-danger-text" onclick="ClientesModule.remover(${c.id})" aria-label="Remover ${this.escape(c.nome)}">Remover</button>
        </div>
      </div>
    `).join('');
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  },
};
