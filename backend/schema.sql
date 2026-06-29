CREATE DATABASE IF NOT EXISTS barber_db;
USE barber_db;


CREATE TABLE cliente (
id_cliente INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(120) NOT NULL,
cpf CHAR(11) NOT NULL UNIQUE,
telefone VARCHAR(20) NOT NULL,
email VARCHAR(120) UNIQUE,
data_nascimento DATE,
data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE barbeiro (
id_barbeiro INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(120) NOT NULL,
telefone VARCHAR(20),
email VARCHAR(120) UNIQUE,
data_admissao DATE,
status ENUM('ATIVO', 'INATIVO') DEFAULT 'ATIVO'
);


CREATE TABLE especialidade (
id_especialidade INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
descricao TEXT
);


CREATE TABLE barbeiro_especialidade (
id_barbeiro INT NOT NULL,
id_especialidade INT NOT NULL,


PRIMARY KEY (id_barbeiro, id_especialidade),

FOREIGN KEY (id_barbeiro)
    REFERENCES barbeiro(id_barbeiro)
    ON DELETE CASCADE,

FOREIGN KEY (id_especialidade)
    REFERENCES especialidade(id_especialidade)
    ON DELETE CASCADE
);


CREATE TABLE servico (
id_servico INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
descricao VARCHAR(255),
valor DECIMAL(10,2) NOT NULL,
duracao_minutos INT NOT NULL
);


CREATE TABLE agendamento (
id_agendamento INT AUTO_INCREMENT PRIMARY KEY,

id_cliente INT NOT NULL,
id_barbeiro INT NOT NULL,
id_servico INT NOT NULL,

data_agendamento DATE NOT NULL,
hora_inicio TIME NOT NULL,

status ENUM('AGENDADO', 'CONCLUIDO', 'CANCELADO')
    DEFAULT 'AGENDADO',

observacoes TEXT,

data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_ag_cliente
    FOREIGN KEY (id_cliente)
    REFERENCES cliente(id_cliente),

CONSTRAINT fk_ag_barbeiro
    FOREIGN KEY (id_barbeiro)
    REFERENCES barbeiro(id_barbeiro),

CONSTRAINT fk_ag_servico
    FOREIGN KEY (id_servico)
    REFERENCES servico(id_servico),

UNIQUE (id_barbeiro, data_agendamento, hora_inicio)
);


CREATE TABLE pagamento (
id_pagamento INT AUTO_INCREMENT PRIMARY KEY,

id_agendamento INT NOT NULL UNIQUE,

valor DECIMAL(10,2) NOT NULL,

forma_pagamento ENUM(
    'DINHEIRO',
    'PIX',
    'CARTAO_DEBITO',
    'CARTAO_CREDITO'
) NOT NULL,

status ENUM(
    'PENDENTE',
    'PAGO',
    'CANCELADO'
) DEFAULT 'PENDENTE',

data_pagamento DATETIME,
observacoes TEXT,

CONSTRAINT fk_pagamento_agendamento
    FOREIGN KEY (id_agendamento)
    REFERENCES agendamento(id_agendamento)
    ON DELETE CASCADE
);


CREATE TABLE produto (
id_produto INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
quantidade_estoque INT NOT NULL DEFAULT 0,
estoque_minimo INT NOT NULL DEFAULT 5,
valor DECIMAL(10,2)
);
