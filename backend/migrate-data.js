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

function padCpf(id) {
  // produce an 11-digit numeric placeholder CPF like 9 + zero-padded 10 digits
  return '9' + String(id).padStart(10, '0');
}

(async () => {
  try {
    const stats = {
      clientes: { migrated: 0, skipped: 0 },
      barbeiros: { migrated: 0, skipped: 0 },
      servicos: { migrated: 0, skipped: 0 },
      agendamentos: { migrated: 0, skipped: 0 },
      pagamentos: { migrated: 0, skipped: 0 },
    };

    // helper to get existing columns for a table
    async function getColumns(table) {
      const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
      return cols.map(c => c.Field);
    }

    // build lookup maps for target tables by unique keys
    const clienteByEmail = new Map();
    const clienteByPhone = new Map();
    const clienteByName = new Map();

    const clienteCols = await getColumns('cliente');
    const clienteSelectCols = ['id_cliente', 'nome', 'cpf', 'telefone', 'email'].filter(c => clienteCols.includes(c));
    const [existingClientes] = await db.query(`SELECT ${clienteSelectCols.join(', ')} FROM cliente`);
    existingClientes.forEach(c => {
      if (clienteCols.includes('email') && c.email) clienteByEmail.set(c.email, c.id_cliente);
      if (clienteCols.includes('telefone') && c.telefone) clienteByPhone.set(c.telefone, c.id_cliente);
      if (clienteCols.includes('nome') && c.nome) clienteByName.set(c.nome, c.id_cliente);
    });

    const barbeiroByEmail = new Map();
    const barbeiroByPhone = new Map();
    const barbeiroByName = new Map();
    const barbeiroCols = await getColumns('barbeiro');
    const barbeiroSelectCols = ['id_barbeiro', 'nome', 'email', 'telefone'].filter(c => barbeiroCols.includes(c));
    const [existingBarbeiros] = await db.query(`SELECT ${barbeiroSelectCols.join(', ')} FROM barbeiro`);
    existingBarbeiros.forEach(b => {
      if (barbeiroCols.includes('email') && b.email) barbeiroByEmail.set(b.email, b.id_barbeiro);
      if (barbeiroCols.includes('telefone') && b.telefone) barbeiroByPhone.set(b.telefone, b.id_barbeiro);
      if (barbeiroCols.includes('nome') && b.nome) barbeiroByName.set(b.nome, b.id_barbeiro);
    });

    const servicoByName = new Map();
    const [existingServicos] = await db.query('SELECT id_servico, nome FROM servico');
    existingServicos.forEach(s => servicoByName.set(s.nome, s.id_servico));

    // Maps from old id -> new id
    const clienteIdMap = new Map();
    const barbeiroIdMap = new Map();
    const servicoIdMap = new Map();
    const agendamentoIdMap = new Map();

    // 1) Migrate clientes (select only existing columns)
    const oldClienteCols = await getColumns('clientes');
    const oldClienteSelect = ['id', 'nome', 'telefone', 'email', 'dataNascimento', 'observacoes', 'criadoEm'].filter(c => oldClienteCols.includes(c));
    const [oldClientes] = await db.query(`SELECT ${oldClienteSelect.join(', ')} FROM clientes`);
    for (const oc of oldClientes) {
      try {
        let targetId = null;
        if (oc.email && clienteByEmail.has(oc.email)) targetId = clienteByEmail.get(oc.email);
        else if (oc.telefone && clienteByPhone.has(oc.telefone)) targetId = clienteByPhone.get(oc.telefone);
        else if (oc.nome && clienteByName.has(oc.nome)) targetId = clienteByName.get(oc.nome);

        if (targetId) {
          clienteIdMap.set(oc.id, targetId);
          stats.clientes.skipped++;
          continue;
        }

        const cpf = padCpf(oc.id);
        const telefone = oc.telefone || '00000000000';
        const email = oc.email || null;
        const data_nascimento = oc.dataNascimento || null;

        const [res] = await db.query(
          'INSERT INTO cliente (nome, cpf, telefone, email, data_nascimento) VALUES (?, ?, ?, ?, ?)',
          [oc.nome, cpf, telefone, email, data_nascimento]
        );
        const newId = res.insertId;
        clienteIdMap.set(oc.id, newId);
        if (email) clienteByEmail.set(email, newId);
        if (telefone) clienteByPhone.set(telefone, newId);
        if (oc.nome) clienteByName.set(oc.nome, newId);
        stats.clientes.migrated++;
      } catch (e) {
        console.error('Erro migrando cliente id', oc.id, e.message);
        stats.clientes.skipped++;
      }
    }

    // 2) Migrate barbeiros (select only existing columns)
    const oldBarbeiroCols = await getColumns('barbeiros');
    const oldBarbeiroSelect = ['id', 'nome', 'telefone', 'email', 'criadoEm'].filter(c => oldBarbeiroCols.includes(c));
    const [oldBarbeiros] = await db.query(`SELECT ${oldBarbeiroSelect.join(', ')} FROM barbeiros`);
    for (const ob of oldBarbeiros) {
      try {
        let targetId = null;
        if (ob.email && barbeiroByEmail.has(ob.email)) targetId = barbeiroByEmail.get(ob.email);
        else if (ob.telefone && barbeiroByPhone.has(ob.telefone)) targetId = barbeiroByPhone.get(ob.telefone);
        else if (ob.nome && barbeiroByName.has(ob.nome)) targetId = barbeiroByName.get(ob.nome);

        if (targetId) {
          barbeiroIdMap.set(ob.id, targetId);
          stats.barbeiros.skipped++;
          continue;
        }

        const telefone = ob.telefone || null;
        const email = ob.email || null;
        const [res] = await db.query(
          'INSERT INTO barbeiro (nome, telefone, email) VALUES (?, ?, ?)',
          [ob.nome, telefone, email]
        );
        const newId = res.insertId;
        barbeiroIdMap.set(ob.id, newId);
        if (email) barbeiroByEmail.set(email, newId);
        if (telefone) barbeiroByPhone.set(telefone, newId);
        if (ob.nome) barbeiroByName.set(ob.nome, newId);
        stats.barbeiros.migrated++;
      } catch (e) {
        console.error('Erro migrando barbeiro id', ob.id, e.message);
        stats.barbeiros.skipped++;
      }
    }

    // 3) Migrate servicos (select only existing columns)
    const oldServicoCols = await getColumns('servicos');
    const oldServicoSelect = ['id', 'nome', 'preco', 'duracaoMinutos', 'categoria'].filter(c => oldServicoCols.includes(c));
    const [oldServicos] = await db.query(`SELECT ${oldServicoSelect.join(', ')} FROM servicos`);
    for (const os of oldServicos) {
      try {
        if (os.nome && servicoByName.has(os.nome)) {
          servicoIdMap.set(os.id, servicoByName.get(os.nome));
          stats.servicos.skipped++;
          continue;
        }
        const [res] = await db.query(
          'INSERT INTO servico (nome, descricao, valor, duracao_minutos) VALUES (?, ?, ?, ?)',
          [os.nome, os.categoria || null, os.preco || null, os.duracaoMinutos || null]
        );
        const newId = res.insertId;
        servicoIdMap.set(os.id, newId);
        servicoByName.set(os.nome, newId);
        stats.servicos.migrated++;
      } catch (e) {
        console.error('Erro migrando servico id', os.id, e.message);
        stats.servicos.skipped++;
      }
    }

    // 4) Migrate agendamentos (map FK ids using maps) - select only existing columns
    const oldAgCols = await getColumns('agendamentos');
    const oldAgSelect = ['id', 'clienteId', 'barbeiroId', 'servicoId', 'data', 'hora', 'status', 'criadoEm'].filter(c => oldAgCols.includes(c));
    const [oldAg] = await db.query(`SELECT ${oldAgSelect.join(', ')} FROM agendamentos`);
    for (const a of oldAg) {
      try {
        const newCliente = clienteIdMap.get(a.clienteId) || null;
        const newBarbeiro = barbeiroIdMap.get(a.barbeiroId) || null;
        const newServico = servicoIdMap.get(a.servicoId) || null;
        if (!newCliente || !newBarbeiro || !newServico) {
          console.log('Pulando agendamento', a.id, 'por falta de FK mapeada');
          stats.agendamentos.skipped++;
          continue;
        }
        try {
          const [res] = await db.query(
            'INSERT INTO agendamento (id_cliente, id_barbeiro, id_servico, data_agendamento, hora_inicio, status, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newCliente, newBarbeiro, newServico, a.data || null, a.hora || null, a.status || 'AGENDADO', null]
          );
          agendamentoIdMap.set(a.id, res.insertId);
          stats.agendamentos.migrated++;
        } catch (err) {
          // could be duplicate unique constraint, try to find existing
          console.log('Erro inserindo agendamento', a.id, err.message);
          stats.agendamentos.skipped++;
        }
      } catch (e) {
        console.error('Erro processando agendamento', a.id, e.message);
        stats.agendamentos.skipped++;
      }
    }

    // 5) Migrate pagamentos (select only existing columns)
    const oldPagCols = await getColumns('pagamentos');
    const oldPagSelect = ['id', 'agendamentoId', 'valor', 'formaPagamento', 'status', 'dataPagamento', 'observacoes', 'criadoEm'].filter(c => oldPagCols.includes(c));
    const [oldPag] = await db.query(`SELECT ${oldPagSelect.join(', ')} FROM pagamentos`);
    for (const p of oldPag) {
      try {
        const newAg = agendamentoIdMap.get(p.agendamentoId);
        if (!newAg) {
          console.log('Pulando pagamento', p.id, 'por agendamento não migrado');
          stats.pagamentos.skipped++;
          continue;
        }
        try {
          await db.query(
            'INSERT INTO pagamento (id_agendamento, valor, forma_pagamento, status, data_pagamento, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
            [
              newAg,
              p.valor || null,
              p.formaPagamento || 'DINHEIRO',
              p.status || 'PENDENTE',
              // prefer explicit dataPagamento, fallback to criadoEm if available
              (p.dataPagamento !== undefined ? p.dataPagamento : (p.criadoEm !== undefined ? p.criadoEm : null)),
              p.observacoes || null,
            ]
          );
          stats.pagamentos.migrated++;
        } catch (err) {
          console.log('Erro inserindo pagamento', p.id, err.message);
          stats.pagamentos.skipped++;
        }
      } catch (e) {
        console.error('Erro processando pagamento', p.id, e.message);
        stats.pagamentos.skipped++;
      }
    }

    console.log('\nMigração finalizada. Resumo:');
    console.log(stats);
    await db.end();
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  }
})();
