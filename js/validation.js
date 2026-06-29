/* =========================================================
   VALIDATION — validação de formulários, acessível
   (mensagens via role="alert" para leitores de tela)
   ========================================================= */

const Validation = {
  rules: {
    required(value) {
      return value !== undefined && value !== null && String(value).trim() !== '';
    },
    email(value) {
      if (!value) return true; // opcional
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    telefone(value) {
      const digits = String(value).replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 11;
    },
    min(value, min) {
      return Number(value) >= min;
    },
  },

  messages: {
    required: 'Este campo é obrigatório.',
    email: 'Informe um e-mail válido.',
    telefone: 'Informe um telefone com DDD, ex: (24) 99999-0000.',
    min: (min) => `O valor deve ser maior ou igual a ${min}.`,
  },

  /**
   * Valida um <form>, exibindo erros nos elementos
   * .field-error correspondentes (id="err-<name-do-input>").
   * Retorna true se válido, false se houver erros.
   */
  validarForm(formEl) {
    let valido = true;
    const campos = formEl.querySelectorAll('input, select, textarea');

    campos.forEach(campo => {
      const fieldWrapper = campo.closest('.field');
      const errorEl = formEl.querySelector(`#err-${campo.id}`);
      let mensagemErro = '';

      if (campo.required && !this.rules.required(campo.value)) {
        mensagemErro = this.messages.required;
      } else if (campo.type === 'email' && !this.rules.email(campo.value)) {
        mensagemErro = this.messages.email;
      } else if (campo.type === 'tel' && campo.value && !this.rules.telefone(campo.value)) {
        mensagemErro = this.messages.telefone;
      } else if (campo.type === 'number' && campo.value !== '' && campo.min !== '' && !this.rules.min(campo.value, Number(campo.min))) {
        mensagemErro = this.messages.min(campo.min);
      }

      if (mensagemErro) {
        valido = false;
        if (fieldWrapper) fieldWrapper.classList.add('has-error');
        if (errorEl) errorEl.textContent = mensagemErro;
        campo.setAttribute('aria-invalid', 'true');
      } else {
        if (fieldWrapper) fieldWrapper.classList.remove('has-error');
        if (errorEl) errorEl.textContent = '';
        campo.removeAttribute('aria-invalid');
      }
    });

    return valido;
  },

  limparErros(formEl) {
    formEl.querySelectorAll('.field').forEach(f => f.classList.remove('has-error'));
    formEl.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; });
    formEl.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  },
};
