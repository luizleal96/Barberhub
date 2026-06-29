/* =========================================================
   MÓDULO: AGENDAMENTOS
   Depende dos cadastros de clientes, barbeiros e serviços
   para popular os <select> do formulário.
   ========================================================= */

const AgendamentosModule = {
  recurso: 'agendamentos',

  statusLabel: {
    agendado: { texto: 'Agendado', tag: 'tag-neutral' },
    confirmado: { texto: 'Confirmado', tag: 'tag-warning' },
    concluido: { texto: 'Concluído', tag: 'tag-success' },
    cancelado: { texto: 'Cancelado', tag: 'tag-error' },
  },

  init() {
    const form = document.getElementById('form-agendamentos');
    const btnNovo = document.querySelector('[data-new="agendamentos"]');

    btnNovo.addEventListener('click', async () => {
      UI.resetarFormulario(form);
      form.querySelector('button[type=submit]').textContent = 'Salvar agendamento';
      await this.atualizarSelects();
      UI.alternarFormulario('agendamentos', true);
    });

    form.querySelector('[data-cancel]').addEventListener('click', () => {
      UI.alternarFormulario('agendamentos', false);
      UI.resetarFormulario(form);
    });

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.atualizarSelects();
    this.carregar();
  },

  /** Repovoa os <select> de cliente, barbeiro e serviço com dados atuais. */
  async atualizarSelects() {
    const [clientesResp, barbeirosResp, servicosResp] = await Promise.all([
      Api.listar('clientes'),
      Api.listar('barbeiros'),
      Api.listar('servicos'),
    ]);

    this.popularSelect('ag-cliente', clientesResp.data?.data || [], c => c.nome);
    this.popularSelect('ag-barbeiro', barbeirosResp.data?.data || [], b => b.nome);
    this.popularSelect('ag-servico', servicosResp.data?.data || [], s => `${s.nome} — ${ServicosModule.formatarPreco(s.preco)}`);
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
      clienteId: form.clienteId.value,
      barbeiroId: form.barbeiroId.value,
      servicoId: form.servicoId.value,
      data: form.data.value,
      hora: form.hora.value,
      status: form.status.value,
    };

    const editId = form.dataset.editId;
    const resp = editId
      ? await Api.atualizar(this.recurso, editId, payload)
      : await Api.criar(this.recurso, payload);

    if (!resp.ok) {
      UI.toast(resp.data.message || 'Erro ao salvar agendamento.', 'error');
      return;
    }

    UI.toast(editId ? 'Agendamento atualizado.' : 'Agendamento criado.', 'success');
    UI.alternarFormulario('agendamentos', false);
    UI.resetarFormulario(form);
    this.carregar();

    if (window.PagamentosModule) PagamentosModule.atualizarSelects();
  },

  async editar(id) {
    const resp = await Api.buscarPorId(this.recurso, id);
    if (!resp.ok) { UI.toast('Erro ao carregar agendamento.', 'error'); return; }
    const a = resp.data.data;

    await this.atualizarSelects();

    const form = document.getElementById('form-agendamentos');
    form.clienteId.value = a.clienteId || '';
    form.barbeiroId.value = a.barbeiroId || '';
    form.servicoId.value = a.servicoId || '';
    form.data.value = a.data || '';
    form.hora.value = a.hora || '';
    form.status.value = a.status || 'agendado';
    form.dataset.editId = id;
    form.querySelector('button[type=submit]').textContent = 'Atualizar agendamento';

    UI.alternarFormulario('agendamentos', true);
  },

  async remover(id) {
    if (!confirm('Remover este agendamento? Esta ação não pode ser desfeita.')) return;
    const resp = await Api.remover(this.recurso, id);
    if (!resp.ok) { UI.toast(resp.data.message || 'Erro ao remover.', 'error'); return; }
    UI.toast('Agendamento removido.', 'success');
    this.carregar();
    if (window.PagamentosModule) PagamentosModule.atualizarSelects();
  },

  async carregar() {
    const [resp, clientesResp, barbeirosResp, servicosResp] = await Promise.all([
      Api.listar(this.recurso),
      Api.listar('clientes'),
      Api.listar('barbeiros'),
      Api.listar('servicos'),
    ]);

    const clientes = clientesResp.data?.data || [];
    const barbeiros = barbeirosResp.data?.data || [];
    const servicos = servicosResp.data?.data || [];

    const container = document.querySelector('[data-list="agendamentos"]');
    const registros = resp.ok ? resp.data.data : [];

    if (registros.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">📅</span>
          <strong>Nenhum agendamento cadastrado</strong>
          <p>Clique em "Novo agendamento" para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = registros.map(a => {
      const cliente = clientes.find(c => String(c.id) === String(a.clienteId));
      const barbeiro = barbeiros.find(b => String(b.id) === String(a.barbeiroId));
      const servico = servicos.find(s => String(s.id) === String(a.servicoId));
      const status = this.statusLabel[a.status] || this.statusLabel.agendado;

      return `
        <div class="record-card">
          <div class="record-main">
            <span class="record-title">${this.escape(cliente?.nome || 'Cliente')} com ${this.escape(barbeiro?.nome || 'barbeiro')}</span>
            <span class="record-meta">${this.escape(servico?.nome || 'Serviço')} · ${this.formatarData(a.data)} às ${a.hora || ''}</span>
          </div>
          <div class="record-tags">
            <span class="tag ${status.tag}">${status.texto}</span>
          </div>
          <div class="record-actions">
            <button class="btn btn-text" onclick="AgendamentosModule.editar(${a.id})" aria-label="Editar agendamento">Editar</button>
            <button class="btn btn-danger-text" onclick="AgendamentosModule.remover(${a.id})" aria-label="Remover agendamento">Remover</button>
          </div>
        </div>
      `;
    }).join('');
  },

  formatarData(iso) {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  },
};
