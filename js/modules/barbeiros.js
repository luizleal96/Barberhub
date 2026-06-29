/* =========================================================
   MÓDULO: BARBEIROS
   ========================================================= */

const BarbeirosModule = {
  recurso: 'barbeiros',

  especialidadeLabel: {
    corte: 'Corte masculino',
    barba: 'Barba',
    combo: 'Corte e barba',
    coloracao: 'Coloração',
  },

  init() {
    const form = document.getElementById('form-barbeiros');
    const btnNovo = document.querySelector('[data-new="barbeiros"]');

    btnNovo.addEventListener('click', () => {
      UI.resetarFormulario(form);
      form.querySelector('button[type=submit]').textContent = 'Salvar barbeiro';
      UI.alternarFormulario('barbeiros', true);
    });

    form.querySelector('[data-cancel]').addEventListener('click', () => {
      UI.alternarFormulario('barbeiros', false);
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
      especialidade: form.especialidade.value,
      turno: form.turno.value,
    };

    const editId = form.dataset.editId;
    const resp = editId
      ? await Api.atualizar(this.recurso, editId, payload)
      : await Api.criar(this.recurso, payload);

    if (!resp.ok) {
      UI.toast(resp.data.message || 'Erro ao salvar barbeiro.', 'error');
      return;
    }

    UI.toast(editId ? 'Barbeiro atualizado.' : 'Barbeiro cadastrado.', 'success');
    UI.alternarFormulario('barbeiros', false);
    UI.resetarFormulario(form);
    this.carregar();

    if (window.AgendamentosModule) AgendamentosModule.atualizarSelects();
  },

  async editar(id) {
    const resp = await Api.buscarPorId(this.recurso, id);
    if (!resp.ok) { UI.toast('Erro ao carregar barbeiro.', 'error'); return; }
    const b = resp.data.data;

    const form = document.getElementById('form-barbeiros');
    form.nome.value = b.nome || '';
    form.telefone.value = b.telefone || '';
    form.especialidade.value = b.especialidade || '';
    form.turno.value = b.turno || 'manha';
    form.dataset.editId = id;
    form.querySelector('button[type=submit]').textContent = 'Atualizar barbeiro';

    UI.alternarFormulario('barbeiros', true);
  },

  async remover(id) {
    if (!confirm('Remover este barbeiro? Esta ação não pode ser desfeita.')) return;
    const resp = await Api.remover(this.recurso, id);
    if (!resp.ok) { UI.toast(resp.data.message || 'Erro ao remover.', 'error'); return; }
    UI.toast('Barbeiro removido.', 'success');
    this.carregar();
    if (window.AgendamentosModule) AgendamentosModule.atualizarSelects();
  },

  async carregar() {
    const resp = await Api.listar(this.recurso);
    const container = document.querySelector('[data-list="barbeiros"]');
    const registros = resp.ok ? resp.data.data : [];

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">✂</span>
          <strong>Nenhum barbeiro cadastrado</strong>
          <p>Clique em "Novo barbeiro" para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = registros.map(b => `
      <div class="record-card">
        <div class="record-main">
          <span class="record-title">${this.escape(b.nome)}</span>
          <span class="record-meta">${this.escape(this.especialidadeLabel[b.especialidade] || b.especialidade || '')}</span>
        </div>
        <div class="record-tags">
          <span class="tag tag-neutral">${this.escape(b.turno || '')}</span>
        </div>
        <div class="record-actions">
          <button class="btn btn-text" onclick="BarbeirosModule.editar(${b.id})" aria-label="Editar ${this.escape(b.nome)}">Editar</button>
          <button class="btn btn-danger-text" onclick="BarbeirosModule.remover(${b.id})" aria-label="Remover ${this.escape(b.nome)}">Remover</button>
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
