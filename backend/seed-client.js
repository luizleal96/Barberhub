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
  await db.query(`CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(50),
    email VARCHAR(150),
    dataNascimento DATE,
    observacoes TEXT,
    criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS barbeiros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(50),
    especialidade VARCHAR(100),
    turno VARCHAR(50),
    criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS servicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    preco DECIMAL(10,2),
    duracaoMinutos INT,
    categoria VARCHAR(100),
    criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clienteId INT,
    barbeiroId INT,
    servicoId INT,
    data DATE,
    hora TIME,
    status VARCHAR(50),
    criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clienteId) REFERENCES clientes(id),
    FOREIGN KEY (barbeiroId) REFERENCES barbeiros(id),
    FOREIGN KEY (servicoId) REFERENCES servicos(id)
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agendamentoId INT,
    valor DECIMAL(10,2),
    formaPagamento VARCHAR(100),
    status VARCHAR(50),
    criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agendamentoId) REFERENCES agendamentos(id)
  )`);

  const [result] = await db.query(
    `INSERT INTO clientes (nome, telefone, email, dataNascimento, observacoes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'João da Silva',
      '(11) 99999-0000',
      'joao.silva@example.com',
      '1985-08-12',
      'Cadastro via API backend',
    ]
  );

  const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [result.insertId]);
  console.log('Cliente inserido:', rows[0]);
} catch (error) {
  console.error('Erro ao inserir cliente:', error.message);
  process.exit(1);
} finally {
  await db.end();
}
