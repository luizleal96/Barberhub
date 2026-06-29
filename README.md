# 💈 BarberHub — Landing Page

Landing page 100% em **HTML, CSS e JavaScript puro** (sem frameworks) para gestão de barbearia, com 5 módulos de cadastro: **Clientes, Barbeiros, Serviços, Agendamentos e Pagamentos**.

O projeto já está **arquitetado para integração com banco de dados** — veja a seção abaixo.

---

## 📁 Estrutura de arquivos

```
barberhub/
├── index.html
├── css/
│   ├── tokens.css        # cores, tipografia, espaçamento (design system)
│   ├── base.css          # reset + acessibilidade
│   ├── layout.css        # header, hero, seções, footer
│   ├── components.css    # botões, formulários, toasts, cards
│   ├── ledger.css        # painel de cadastros (abas estilo "caderno")
│   └── responsive.css    # breakpoints mobile/tablet
└── js/
    ├── config.js              # ⚙️ configuração da API (mude aqui!)
    ├── api.js                 # camada única de comunicação com backend
    ├── storage.js             # banco "fake" em memória (mock)
    ├── validation.js          # validação de formulários
    ├── ui.js                  # toasts, abas, menu mobile
    ├── app.js                 # inicialização
    └── modules/
        ├── clientes.js
        ├── barbeiros.js
        ├── servicos.js
        ├── agendamentos.js
        └── pagamentos.js
```

---

## 🔌 Como integrar com o banco de dados depois

O front-end já está pronto para funcionar com uma API REST. Você **não precisa tocar em nenhum módulo** (`clientes.js`, `agendamentos.js`, etc.) — eles já chamam apenas `Api.listar()`, `Api.criar()`, `Api.atualizar()`, `Api.remover()`.

### Passo 1 — Construa sua API REST
Para cada recurso (`clientes`, `barbeiros`, `servicos`, `agendamentos`, `pagamentos`), crie estas rotas (igual ao padrão do seu projeto News CMS com Next.js + Prisma):

| Método | Rota                  | Função              |
|--------|------------------------|----------------------|
| GET    | `/api/clientes`         | Lista todos          |
| GET    | `/api/clientes/:id`     | Busca um             |
| POST   | `/api/clientes`         | Cria novo            |
| PUT    | `/api/clientes/:id`     | Atualiza             |
| DELETE | `/api/clientes/:id`     | Remove               |

(repita para `barbeiros`, `servicos`, `agendamentos`, `pagamentos`)

**Formato de resposta esperado:**
```json
{ "success": true, "data": [ ... ] }
```
ou em caso de erro:
```json
{ "success": false, "message": "Descrição do erro" }
```

### Passo 2 — Sugestão de schema (tabelas)

```
clientes        (id, nome, telefone, email, dataNascimento, observacoes, criadoEm)
barbeiros       (id, nome, telefone, especialidade, turno, criadoEm)
servicos        (id, nome, preco, duracaoMinutos, categoria, criadoEm)
agendamentos    (id, clienteId FK, barbeiroId FK, servicoId FK, data, hora, status, criadoEm)
pagamentos      (id, agendamentoId FK, valor, formaPagamento, status, criadoEm)
```

### Passo 3 — Ligue o front no banco real
Abra `js/config.js` e troque apenas isto:

```js
const API_CONFIG = {
  useMock: false,              // era true
  baseUrl: 'http://localhost:3000/api', // URL da sua API real
  ...
};
```

Pronto — todos os 5 módulos passam a usar o banco de dados real automaticamente, sem precisar editar mais nada.

### Passo 4 (opcional) — Remova o mock
Depois de confirmar que tudo funciona com o banco real, você pode remover a tag `<script src="js/storage.js">` do `index.html`, já que ela só existia para simular dados antes do banco existir.

---

## ✅ Checklist de UX atendido

- **Usabilidade:** navegação clara, formulários curtos (3–5 campos), rótulos objetivos, ícones com significado.
- **Responsividade:** menu hambúrguer no mobile, grid adaptável, formulários em coluna única em telas pequenas.
- **Acessibilidade:** skip link, foco visível, `aria-label`, `role="tablist"`/`tabpanel`, navegação por teclado nas abas (setas), contraste AA, mensagens de erro em `role="alert"`.
- **Design visual:** paleta consistente (carvão, creme, latão), tipografia com hierarquia clara (Fraunces + Inter), espaçamento generoso, uma tela por módulo (sem sobrecarga de informação).

---

## ▶️ Como testar agora (sem banco)

Basta abrir `index.html` no navegador. Os dados ficam em memória (mock) — ao recarregar a página, eles são perdidos, o que é esperado até a integração com o banco real.
