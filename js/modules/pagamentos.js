/* =========================================================
   MÓDULO: PAGAMENTOS
   Depende do cadastro de agendamentos para popular o
   <select> do formulário.
   ========================================================= */

const PagamentosModule = {
  recurso: 'pagamentos',

  formaLabel: {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    debito: 'Cartão de débito',
    credito: 'Cartão de crédito',
  },

  statusLabel: {
    pendente: { texto: 'Pendente', tag: 'tag-warning' },
    pago: { texto: 'Pago', tag: 'tag-success' },
    reembolsado: { texto: 'Reembolsado', tag: 'tag-error' },
  },

  init() {
    const form = document.getElementById('form-pagamentos');
    const btnNovo = document.querySelector('[data-new="pagamentos"]');

    btnNovo.addEventListener('click', async () => {
      UI.resetarFormulario(form);
      form.querySelector('button[type=submit]').textContent = 'Salvar pagamento';
      await this.atualizarSelects();
      UI.alternarFormulario('pagamentos', true);
    });

    form.querySelector('[data-cancel]').addEventListener('click', () => {
      UI.alternarFormulario('pagamentos', false);
      UI.resetarFormulario(form);
    });

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.atualizarSelects();
    this.carregar();
  },

  async atualizarSelects() {
    const [agendamentosResp, clientesResp, servicosResp] = await Promise.all([
      Api.listar('agendamentos'),
      Api.listar('clientes'),
      Api.listar('servicos'),
    ]);

    const clientes = clientesResp.data?.data || [];
    const servicos = servicosResp.data?.data || [];
    const agendamentos = agendamentosResp.data?.data || [];

    this.popularSelect('pag-agendamento', agendamentos, a => {
      const cliente = clientes.find(c => String(c.id) === String(a.clienteId));
      const servico = servicos.find(s => String(s.id) === String(a.servicoId));
      return `${cliente?.nome || 'Cliente'} — ${servico?.nome || 'Serviço'} (${AgendamentosModule.formatarData(a.data)})`;
    });
  },

  popularSelect(selectId, registros, labelFn) {
    const select = document.getElementById(selectId);
    const valorAtual = select.value;
    const placeholder = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (placeholder) select.appendChild(placeholder);

    registros.forEach(r => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = labelFn(r);
      select.appendChild(option);
    });

    if (valorAtual) select.value = valorAtual;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!Validation.validarForm(form)) return;

    const payload = {
      agendamentoId: form.agendamentoId.value,
      valor: parseFloat(form.valor.value),
      formaPagamento: form.formaPagamento.value,
      status: form.status.value,
    };

    const editId = form.dataset.editId;
    const resp = editId
      ? await Api.atualizar(this.recurso, editId, payload)
      : await Api.criar(this.recurso, payload);

    if (!resp.ok) {
      UI.toast(resp.data.message || 'Erro ao salvar pagamento.', 'error');
      return;
    }

    UI.toast(editId ? 'Pagamento atualizado.' : 'Pagamento registrado.', 'success');
    UI.alternarFormulario('pagamentos', false);
    UI.resetarFormulario(form);
    this.carregar();
  },

  async editar(id) {
    const resp = await Api.buscarPorId(this.recurso, id);
    if (!resp.ok) { UI.toast('Erro ao carregar pagamento.', 'error'); return; }
    const p = resp.data.data;

    await this.atualizarSelects();

    const form = document.getElementById('form-pagamentos');
    form.agendamentoId.value = p.agendamentoId || '';
    form.valor.value = p.valor ?? '';
    form.formaPagamento.value = p.formaPagamento || '';
    form.status.value = p.status || 'pendente';
    form.dataset.editId = id;
    form.querySelector('button[type=submit]').textContent = 'Atualizar pagamento';

    UI.alternarFormulario('pagamentos', true);
  },

  async remover(id) {
    if (!confirm('Remover este pagamento? Esta ação não pode ser desfeita.')) return;
    const resp = await Api.remover(this.recurso, id);
    if (!resp.ok) { UI.toast(resp.data.message || 'Erro ao remover.', 'error'); return; }
    UI.toast('Pagamento removido.', 'success');
    this.carregar();
  },

  async carregar() {
    const [resp, agendamentosResp, clientesResp, servicosResp] = await Promise.all([
      Api.listar(this.recurso),
      Api.listar('agendamentos'),
      Api.listar('clientes'),
      Api.listar('servicos'),
    ]);

    const agendamentos = agendamentosResp.data?.data || [];
    const clientes = clientesResp.data?.data || [];
    const servicos = servicosResp.data?.data || [];

    const container = document.querySelector('[data-list="pagamentos"]');
    const registros = resp.ok ? resp.data.data : [];

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">💳</span>
          <strong>Nenhum pagamento registrado</strong>
          <p>Clique em "Novo pagamento" para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = registros.map(p => {
      const agendamento = agendamentos.find(a => String(a.id) === String(p.agendamentoId));
      const cliente = agendamento ? clientes.find(c => String(c.id) === String(agendamento.clienteId)) : null;
      const servico = agendamento ? servicos.find(s => String(s.id) === String(agendamento.servicoId)) : null;
      const status = this.statusLabel[p.status] || this.statusLabel.pendente;

      return `
        <div class="record-card">
          <div class="record-main">
            <span class="record-title">${this.formatarPreco(p.valor)} — ${this.escape(cliente?.nome || 'Cliente')}</span>
            <span class="record-meta">${this.escape(servico?.nome || '')} · ${this.formaLabel[p.formaPagamento] || p.formaPagamento}</span>
          </div>
          <div class="record-tags">
            <span class="tag ${status.tag}">${status.texto}</span>
          </div>
          <div class="record-actions">
            <button class="btn btn-text" onclick="PagamentosModule.editar(${p.id})" aria-label="Editar pagamento">Editar</button>
            <button class="btn btn-danger-text" onclick="PagamentosModule.remover(${p.id})" aria-label="Remover pagamento">Remover</button>
          </div>
        </div>
      `;
    }).join('');
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
