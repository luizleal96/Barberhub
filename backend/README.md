# BarberHub Backend

API REST para o front-end BarberHub, conectada ao MySQL.

## Instalação

1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo de exemplo e atualize os dados do seu MySQL:
   ```bash
   copy .env.example .env
   ```

## Banco de dados

A API espera que o banco use o nome definido em `backend/.env`:

```env
DB_NAME=barber_db
```

O esquema atual está em `backend/schema.sql`.

Para criar as tabelas e o banco de dados, execute:

```bash
mysql -u <usuario> -p < backend/schema.sql
```

Se precisar criar views de compatibilidade para os recursos antigos, use:

```bash
node create-compat-views.js
```

## Rodar o servidor

```bash
npm run dev
```

## Endpoints da API

A API expõe os seguintes recursos:

- `GET /api/clientes`
- `GET /api/clientes/:id`
- `POST /api/clientes`
- `PUT /api/clientes/:id`
- `DELETE /api/clientes/:id`

- `GET /api/barbeiros`
- `GET /api/barbeiros/:id`
- `POST /api/barbeiros`
- `PUT /api/barbeiros/:id`
- `DELETE /api/barbeiros/:id`

- `GET /api/servicos`
- `GET /api/servicos/:id`
- `POST /api/servicos`
- `PUT /api/servicos/:id`
- `DELETE /api/servicos/:id`

- `GET /api/agendamentos`
- `GET /api/agendamentos/:id`
- `POST /api/agendamentos`
- `PUT /api/agendamentos/:id`
- `DELETE /api/agendamentos/:id`

- `GET /api/pagamentos`
- `GET /api/pagamentos/:id`
- `POST /api/pagamentos`
- `PUT /api/pagamentos/:id`
- `DELETE /api/pagamentos/:id`

- `GET /api/produtos`
- `GET /api/produtos/:id`
- `POST /api/produtos`
- `PUT /api/produtos/:id`
- `DELETE /api/produtos/:id`
