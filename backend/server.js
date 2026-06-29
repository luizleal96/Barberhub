import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

const port = process.env.PORT || 3000;

const resources = {
  clientes: {
    table: 'clientes',
    fields: ['nome', 'telefone', 'email', 'dataNascimento', 'observacoes'],
  },
  barbeiros: {
    table: 'barbeiros',
    fields: ['nome', 'telefone', 'especialidade', 'turno'],
  },
  servicos: {
    table: 'servicos',
    fields: ['nome', 'preco', 'duracaoMinutos', 'categoria'],
  },
  agendamentos: {
    table: 'agendamentos',
    fields: ['clienteId', 'barbeiroId', 'servicoId', 'data', 'hora', 'status'],
  },
  pagamentos: {
    table: 'pagamentos',
    fields: ['agendamentoId', 'valor', 'formaPagamento', 'status'],
  },
  produtos: {
    table: 'produto',
    idColumn: 'id_produto',
    fields: ['nome', 'valor', 'quantidade_estoque', 'estoque_minimo'],
  },
};

function buildPayload(body, allowedFields) {
  return allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function buildUpdateClause(payload) {
  const fields = Object.keys(payload);
  const clause = fields.map(field => `\`${field}\` = ?`).join(', ');
  const values = fields.map(field => payload[field]);
  return { clause, values };
}

Object.entries(resources).forEach(([resource, meta]) => {
  const basePath = `/api/${resource}`;

  const idColumn = meta.idColumn || 'id';
  const selectColumns = idColumn === 'id' ? '*' : `*, \`${idColumn}\` AS id`;

  app.get(basePath, async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT ${selectColumns} FROM \`${meta.table}\` ORDER BY \`${idColumn}\` DESC`);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get(`${basePath}/:id`, async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT ${selectColumns} FROM \`${meta.table}\` WHERE \`${idColumn}\` = ?`, [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro não encontrado.' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post(basePath, async (req, res) => {
    try {
      const payload = buildPayload(req.body, meta.fields);
      const columns = Object.keys(payload).map(field => `\`${field}\``).join(', ');
      const placeholders = Object.keys(payload).map(() => '?').join(', ');
      const values = Object.values(payload);

      const [result] = await db.query(
        `INSERT INTO \`${meta.table}\` (${columns}) VALUES (${placeholders})`,
        values
      );

      const [rows] = await db.query(`SELECT ${selectColumns} FROM \`${meta.table}\` WHERE \`${idColumn}\` = ?`, [result.insertId]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put(`${basePath}/:id`, async (req, res) => {
    try {
      const payload = buildPayload(req.body, meta.fields);
      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum campo válido enviado.' });
      }

      const { clause, values } = buildUpdateClause(payload);
      const [result] = await db.query(
        `UPDATE \`${meta.table}\` SET ${clause} WHERE \`${idColumn}\` = ?`,
        [...values, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Registro não encontrado.' });
      }

      const [rows] = await db.query(`SELECT ${selectColumns} FROM \`${meta.table}\` WHERE \`${idColumn}\` = ?`, [req.params.id]);
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete(`${basePath}/:id`, async (req, res) => {
    try {
      const [result] = await db.query(`DELETE FROM \`${meta.table}\` WHERE \`${idColumn}\` = ?`, [req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Registro não encontrado.' });
      }
      res.json({ success: true, data: { removed: true } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: 'API BarberHub rodando' });
});

// Servir front-end estático
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`API BarberHub escutando em http://localhost:${port}`);
});
