/* =========================================================
   APP — ponto de entrada: inicializa UI e todos os módulos.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  UI.initMobileNav();
  UI.initLedgerTabs();

  ClientesModule.init();
  BarbeirosModule.init();
  ServicosModule.init();
  AgendamentosModule.init();
  PagamentosModule.init();
  ProdutosModule.init();
});

// Atualiza todas as listas quando a janela ganha foco ou quando a aba fica visível novamente.
function refreshAll() {
  if (window.ClientesModule) ClientesModule.carregar();
  if (window.BarbeirosModule) BarbeirosModule.carregar();
  if (window.ServicosModule) ServicosModule.carregar();
  if (window.AgendamentosModule) AgendamentosModule.carregar();
  if (window.PagamentosModule) PagamentosModule.carregar();
  if (window.ProdutosModule) ProdutosModule.carregar();
}

// Atualiza ao voltar ao foco/visibilidade
window.addEventListener('focus', () => {
  refreshAll();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshAll();
});

// Polling suave a cada 30s para capturar mudanças externas
setInterval(() => {
  refreshAll();
}, 30000);
