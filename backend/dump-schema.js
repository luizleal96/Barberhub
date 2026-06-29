import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barberhub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

try {
  const tables = ['clientes', 'barbeiros', 'servicos', 'agendamentos', 'pagamentos'];
  
  for (const table of tables) {
    const [result] = await db.query(`SHOW CREATE TABLE ${table}`);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TABLE: ${table}`);
    console.log('='.repeat(80));
    console.log(result[0]['Create Table']);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('DUMP COMPLETO');
  console.log('='.repeat(80));
  
} catch (error) {
  console.error('Erro ao buscar schema:', error.message);
  process.exit(1);
} finally {
  await db.end();
}
