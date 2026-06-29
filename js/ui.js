/* =========================================================
   UI — funções genéricas de interface: toast, abas do
   ledger, menu mobile. Sem regras de negócio aqui.
   ========================================================= */

const UI = {
  /** Exibe uma notificação flutuante temporária. */
  toast(mensagem, tipo = 'success') {
    const region = document.getElementById('toast-region');
    const el = document.createElement('div');
    el.className = `toast toast-${tipo}`;
    el.setAttribute('role', 'status');
    el.textContent = mensagem;
    region.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  },

  /** Alterna a aba ativa do ledger (painel de cadastros). */
  abrirAba(nomeAba) {
    document.querySelectorAll('.ledger-tab').forEach(tab => {
      const ativa = tab.dataset.tab === nomeAba;
      tab.classList.toggle('is-active', ativa);
      tab.setAttribute('aria-selected', String(ativa));
    });
    document.querySelectorAll('.ledger-panel').forEach(panel => {
      const ativo = panel.id === `panel-${nomeAba}`;
      panel.classList.toggle('is-active', ativo);
      panel.hidden = !ativo;
    });
  },

  /** Mostra/esconde o formulário de cadastro de um módulo. */
  alternarFormulario(recurso, mostrar) {
    const form = document.getElementById(`form-${recurso}`);
    if (!form) return;
    form.hidden = !mostrar;
    if (mostrar) {
      const primeiroCampo = form.querySelector('input, select, textarea');
      if (primeiroCampo) primeiroCampo.focus();
    }
  },

  /** Reseta um formulário e limpa estado de edição/erros. */
  resetarFormulario(formEl) {
    formEl.reset();
    Validation.limparErros(formEl);
    delete formEl.dataset.editId;
  },

  /** Menu mobile: abre/fecha. */
  initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const aberto = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!aberto));
      menu.classList.toggle('is-open', !aberto);
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      });
    });
  },

  /** Liga as abas do ledger e os atalhos de teclado (setas). */
  initLedgerTabs() {
    const tabs = Array.from(document.querySelectorAll('.ledger-tab'));
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => UI.abrirAba(tab.dataset.tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = e.key === 'ArrowRight'
            ? tabs[(index + 1) % tabs.length]
            : tabs[(index - 1 + tabs.length) % tabs.length];
          next.focus();
          UI.abrirAba(next.dataset.tab);
        }
      });
    });

    // Cards de módulo na seção "Módulos" abrem a aba correspondente
    document.querySelectorAll('[data-open-tab]').forEach(card => {
      card.addEventListener('click', () => {
        UI.abrirAba(card.dataset.openTab);
      });
    });
  },
};
