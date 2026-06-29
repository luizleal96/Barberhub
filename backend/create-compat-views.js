import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barber_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function objectExists(type, name) {
  const sql = type === 'view'
    ? 'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
    : 'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?';
  const [[row]] = await db.query(sql, [name]);
  return row.count > 0;
}

async function columnExists(table, column) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0].count > 0;
}

async function addColumnIfMissing(table, columnDef) {
  const [columnName] = columnDef.split(' ');
  if (!(await columnExists(table, columnName))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${columnDef}`);
    console.log(`Added column ${columnName} to ${table}`);
  } else {
    console.log(`Column ${columnName} already exists on ${table}`);
  }
}

async function renameTableIfNeeded(oldName) {
  if (await objectExists('table', oldName)) {
    let newName = `${oldName}_old`;
    let idx = 1;
    while (await objectExists('table', newName)) {
      newName = `${oldName}_old_${idx}`;
      idx += 1;
    }
    await db.query(`RENAME TABLE \`${oldName}\` TO \`${newName}\``);
    console.log(`Renamed table ${oldName} to ${newName}`);
    return newName;
  }
  return null;
}

async function run() {
  try {
    console.log('Starting compatibility view creation...');

    const renamed = {};
    const tablesToRename = ['clientes', 'barbeiros', 'servicos', 'agendamentos', 'pagamentos'];
    for (const table of tablesToRename) {
      renamed[table] = await renameTableIfNeeded(table);
    }

    await addColumnIfMissing('cliente', 'observacoes TEXT NULL');
    await addColumnIfMissing('barbeiro', 'especialidade VARCHAR(100) NULL');
    await addColumnIfMissing('barbeiro', 'turno VARCHAR(50) NULL');
    await addColumnIfMissing('servico', 'categoria VARCHAR(100) NULL');

    if (renamed.clientes) {
      await db.query(`
        UPDATE cliente AS c
        JOIN \`${renamed.clientes}\` AS o ON (c.email IS NOT NULL AND c.email = o.email) OR (c.telefone IS NOT NULL AND c.telefone = o.telefone)
        SET c.observacoes = COALESCE(c.observacoes, o.observacoes),
            c.data_nascimento = COALESCE(c.data_nascimento, o.dataNascimento)
      `);
      console.log('Updated cliente compatibility fields from old data.');
    }

    if (renamed.barbeiros) {
      await db.query(`
        UPDATE barbeiro AS b
        JOIN \`${renamed.barbeiros}\` AS o ON (b.telefone IS NOT NULL AND b.telefone = o.telefone)
        SET b.especialidade = COALESCE(b.especialidade, o.especialidade),
            b.turno = COALESCE(b.turno, o.turno)
      `);
      console.log('Updated barbeiro compatibility fields from old data.');
    }

    if (renamed.servicos) {
      await db.query(`
        UPDATE servico AS s
        JOIN \`${renamed.servicos}\` AS o ON s.nome = o.nome
        SET s.categoria = COALESCE(s.categoria, o.categoria)
      `);
      console.log('Updated servico compatibility fields from old data.');
    }

    const viewDefinitions = {
      clientes: `CREATE OR REPLACE VIEW \`clientes\` AS
        SELECT
          id_cliente AS id,
          nome,
          telefone,
          email,
          data_nascimento AS dataNascimento,
          observacoes,
          data_cadastro AS criadoEm
        FROM \`cliente\``,

      barbeiros: `CREATE OR REPLACE VIEW \`barbeiros\` AS
        SELECT
          id_barbeiro AS id,
          nome,
          telefone,
          email,
          especialidade,
          turno,
          data_admissao AS criadoEm,
          status
        FROM \`barbeiro\``,

      servicos: `CREATE OR REPLACE VIEW \`servicos\` AS
        SELECT
          id_servico AS id,
          nome,
          valor AS preco,
          duracao_minutos AS duracaoMinutos,
          categoria AS categoria
        FROM \`servico\``,

      agendamentos: `CREATE OR REPLACE VIEW \`agendamentos\` AS
        SELECT
          id_agendamento AS id,
          id_cliente AS clienteId,
          id_barbeiro AS barbeiroId,
          id_servico AS servicoId,
          data_agendamento AS data,
          hora_inicio AS hora,
          status,
          observacoes,
          data_criacao AS criadoEm
        FROM \`agendamento\``,

      pagamentos: `CREATE OR REPLACE VIEW \`pagamentos\` AS
        SELECT
          id_pagamento AS id,
          id_agendamento AS agendamentoId,
          valor,
          forma_pagamento AS formaPagamento,
          status,
          data_pagamento AS dataPagamento,
          observacoes
        FROM \`pagamento\``,
    };

    for (const [viewName, sql] of Object.entries(viewDefinitions)) {
      await db.query(sql);
      console.log(`Created/updated view ${viewName}`);
    }

    console.log('Compatibility views created successfully.');
    await db.end();
  } catch (error) {
    console.error('Error creating compatibility views:', error.message);
    process.exit(1);
  }
}

await run();
