/* =========================================================
   MÓDULO: PRODUTOS
   ========================================================= */

const ProdutosModule = {
  recurso: 'produtos',

  init() {
    const form = document.getElementById('form-produtos');
    const btnNovo = document.querySelector('[data-new="produtos"]');

    btnNovo.addEventListener('click', () => {
      UI.resetarFormulario(form);
      form.querySelector('button[type=submit]').textContent = 'Salvar produto';
      UI.alternarFormulario('produtos', true);
    });

    form.querySelector('[data-cancel]').addEventListener('click', () => {
      UI.alternarFormulario('produtos', false);
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
      valor: parseFloat(form.valor.value) || 0,
      quantidade_estoque: parseInt(form.quantidade_estoque.value, 10) || 0,
      estoque_minimo: parseInt(form.estoque_minimo.value, 10) || 0,
    };

    const editId = form.dataset.editId;
    const resp = editId
      ? await Api.atualizar(this.recurso, editId, payload)
      : await Api.criar(this.recurso, payload);

    if (!resp.ok) {
      UI.toast(resp.data.message || 'Erro ao salvar produto.', 'error');
      return;
    }

    UI.toast(editId ? 'Produto atualizado.' : 'Produto cadastrado.', 'success');
    UI.alternarFormulario('produtos', false);
    UI.resetarFormulario(form);
    this.carregar();
  },

  async editar(id) {
    const resp = await Api.buscarPorId(this.recurso, id);
    if (!resp.ok) { UI.toast('Erro ao carregar produto.', 'error'); return; }
    const p = resp.data.data;

    const form = document.getElementById('form-produtos');
    form.nome.value = p.nome || '';
    form.valor.value = p.valor ?? '';
    form.quantidade_estoque.value = p.quantidade_estoque ?? 0;
    form.estoque_minimo.value = p.estoque_minimo ?? 0;
    form.dataset.editId = id;
    form.querySelector('button[type=submit]').textContent = 'Atualizar produto';

    UI.alternarFormulario('produtos', true);
  },

  async remover(id) {
    if (!confirm('Remover este produto? Esta ação não pode ser desfeita.')) return;
    const resp = await Api.remover(this.recurso, id);
    if (!resp.ok) { UI.toast(resp.data.message || 'Erro ao remover produto.', 'error'); return; }
    UI.toast('Produto removido.', 'success');
    this.carregar();
  },

  async carregar() {
    const resp = await Api.listar(this.recurso);
    const container = document.querySelector('[data-list="produtos"]');
    const registros = resp.ok ? resp.data.data : [];

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">🧴</span>
          <strong>Nenhum produto cadastrado</strong>
          <p>Clique em "Novo produto" para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = registros.map(p => `
      <div class="record-card">
        <div class="record-main">
          <span class="record-title">${this.escape(p.nome)}</span>
          <span class="record-meta">${this.formatarPreco(p.valor)} · estoque ${p.quantidade_estoque}</span>
        </div>
        <div class="record-tags">
          <span class="tag tag-neutral">Mínimo ${p.estoque_minimo}</span>
        </div>
        <div class="record-actions">
          <button class="btn btn-text" onclick="ProdutosModule.editar(${p.id})" aria-label="Editar ${this.escape(p.nome)}">Editar</button>
          <button class="btn btn-danger-text" onclick="ProdutosModule.remover(${p.id})" aria-label="Remover ${this.escape(p.nome)}">Remover</button>
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
