-- ============================================
-- RJ Tubulação de Gás - Database Schema
-- ============================================

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) DEFAULT 'wrench',
    cover_image VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    caption VARCHAR(300),
    service_id INT REFERENCES services(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(200),
    service_interest VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Seed Data
-- ============================================

INSERT INTO services (title, description, icon, display_order) VALUES
(
    'Construção de Ponto de Gás',
    'Instalação das tubulações principais, conectando a central de distribuição ao local de consumo, seguida pela conexão das redes externas aos pontos de consumo internos, como fogões, aquecedores e outros aparelhos a gás.',
    'wrench',
    1
),
(
    'Individualização de Gás',
    'Serviço de individualização de medidores de gás em edifícios que utilizam uma tubulação coletiva. Com a individualização, cada apartamento passa a ter seu próprio medidor de consumo, permitindo um controle mais preciso e justo do uso de gás, além de aumentar a eficiência e segurança do sistema.',
    'flame',
    2
),
(
    'Instalação de Suporte de Ar Condicionado',
    'A instalação de suporte para ar condicionado envolve a fixação de um suporte adequado à parede ou estrutura externa, projetado para sustentar a unidade externa do ar condicionado. O serviço inclui a montagem do suporte, o nivelamento e a verificação da segurança e estabilidade para garantir o funcionamento correto do equipamento.',
    'wind',
    3
),
(
    'Recomposição de Pastilhas em Fachadas',
    'Reposição ou substituição de pastilhas danificadas ou soltas, restaurando a aparência e a integridade da fachada. O processo inclui a remoção das pastilhas deterioradas, preparação da superfície, aplicação de novas pastilhas e rejuntamento, garantindo um acabamento uniforme e duradouro.',
    'building',
    4
),
(
    'Prumada de Tubulação de Água e de Esgoto',
    'Instalação de encanamentos verticais que percorrem externamente o edifício, atendendo todos os andares. Esse trabalho garante a distribuição eficiente de água e o correto escoamento de esgoto em todas as unidades do prédio.',
    'droplets',
    5
),
(
    'Instalação de Chaminé de Aquecedores',
    'Instalação e manutenção de chaminés de aquecedores incluem a montagem do sistema de exaustão para direcionar os gases para fora do ambiente e a verificação periódica para garantir o funcionamento seguro e eficiente, prevenindo problemas como obstruções e vazamentos.',
    'factory',
    6
);
