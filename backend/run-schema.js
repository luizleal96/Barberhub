import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');

    const connConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
      // do not set database so CREATE DATABASE works
    };

    const connection = await mysql.createConnection(connConfig);
    console.log('Conectado ao MySQL, executando schema.sql...');

    // Execute statements one by one to tolerate existing objects
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (e) {
        // ignore 'already exists' errors, rethrow others
        if (e && e.message && /already exists/i.test(e.message)) {
          console.log('Ignorando erro (já existe):', e.message.split('\n')[0]);
          continue;
        }
        throw e;
      }
    }

    console.log('schema.sql processado (erros de existência foram ignorados).');

    await connection.end();
  } catch (err) {
    console.error('Erro ao executar schema.sql:', err.message);
    process.exit(1);
  }
})();
