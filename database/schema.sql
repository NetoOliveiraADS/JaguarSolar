CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    consumo_mensal_kwh NUMERIC(10, 2) NOT NULL
);

CREATE TABLE proposta_solar (
    id_proposta SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    qtd_paineis INT NOT NULL,
    geracao_anual_kwh NUMERIC(10, 2) NOT NULL,
    valor_estimado NUMERIC(10, 2) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cliente 
        FOREIGN KEY (id_cliente) 
        REFERENCES cliente (id_cliente) 
        ON DELETE CASCADE
);

CREATE TABLE visita_tecnica (
    id_visita SERIAL PRIMARY KEY,
    id_proposta INT NOT NULL,
    data_visita DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendente',
    CONSTRAINT fk_proposta_visita
      FOREIGN KEY(id_proposta) 
      REFERENCES proposta_solar(id_proposta)
      ON DELETE CASCADE
);