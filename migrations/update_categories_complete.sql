-- ======================================
-- MIGRAÇÃO: ATUALIZAR CATEGORIAS COMPLETAS
-- ======================================

-- Limpar categorias existentes
DELETE FROM categories;

-- Inserir categorias completas reais
INSERT INTO categories (name, slug, icon, description, is_active, sort_order) VALUES
-- VEÍCULOS E TRANSPORTES
('Carros', 'carros', '🚗', 'Carros nacionais e importados, novos e usados', true, 1),
('Motos', 'motos', '🏍️', 'Motocicletas, scooters e triciclos', true, 2),
('Caminhões', 'caminhoes', '🚛', 'Caminhões, carretas e veículos comerciais', true, 3),
('Ônibus e Vans', 'onibus-vans', '🚌', 'Ônibus, vans e micro-ônibus', true, 4),
('Barcos e Lanchas', 'barcos-lanchas', '⛵', 'Embarcações, barcos, lanchas e jet skis', true, 5),
('Bicicletas', 'bicicletas', '🚲', 'Bicicletas, bikes elétricas e acessórios', true, 6),
('Peças e Acessórios', 'pecas-acessorios', '🔧', 'Peças, pneus, rodas e acessórios automotivos', true, 7),

-- IMÓVEIS
('Casas', 'casas', '🏠', 'Casas para venda e aluguel', true, 8),
('Apartamentos', 'apartamentos', '🏢', 'Apartamentos para venda e aluguel', true, 9),
('Terrenos', 'terrenos', '🌳', 'Terrenos urbanos e rurais', true, 10),
('Comercial', 'comercial', '🏪', 'Imóveis comerciais, salas e lojas', true, 11),
('Rural', 'rural', '🌾', 'Propriedades rurais, sítios e fazendas', true, 12),
('Temporada', 'temporada', '🏖️', 'Casas de temporada e hospedagem', true, 13),

-- ELETRÔNICOS E TECNOLOGIA
('Celulares', 'celulares', '📱', 'Smartphones, celulares e acessórios', true, 14),
('Computadores', 'computadores', '💻', 'Notebooks, desktops e componentes', true, 15),
('Games', 'games', '🎮', 'Videogames, jogos e consoles', true, 16),
('TV e Som', 'tv-som', '📺', 'Televisores, som automotivo e equipamentos de áudio', true, 17),
('Câmeras e Filmadoras', 'cameras-filmadoras', '📷', 'Câmeras fotográficas, filmadoras e acessórios', true, 18),
('Tablets', 'tablets', '📱', 'Tablets e acessórios', true, 19),

-- CASA E MÓVEIS
('Móveis', 'moveis', '🪑', 'Móveis para casa e escritório', true, 20),
('Decoração', 'decoracao', '🖼️', 'Itens de decoração e arte', true, 21),
('Eletrodomésticos', 'eletrodomesticos', '🔌', 'Eletrodomésticos em geral', true, 22),
('Ferramentas', 'ferramentas', '🔨', 'Ferramentas e equipamentos', true, 23),
('Jardim', 'jardim', '🌻', 'Plantas, jardim e paisagismo', true, 24),
('Materiais de Construção', 'materiais-construcao', '🏗️', 'Materiais para construção e reforma', true, 25),

-- MODA E BELEZA
('Roupas Femininas', 'roupas-femininas', '👗', 'Roupas e acessórios femininos', true, 26),
('Roupas Masculinas', 'roupas-masculinas', '👔', 'Roupas e acessórios masculinos', true, 27),
('Calçados', 'calcados', '👠', 'Sapatos, tênis e sandálias', true, 28),
('Bolsas e Acessórios', 'bolsas-acessorios', '👜', 'Bolsas, carteiras e acessórios', true, 29),
('Beleza e Perfumaria', 'beleza-perfumaria', '💄', 'Cosméticos, perfumes e produtos de beleza', true, 30),
('Joias e Relógios', 'joias-relogios', '💍', 'Joias, bijuterias e relógios', true, 31),

-- ESPORTES E LAZER
('Fitness', 'fitness', '🏋️', 'Equipamentos de academia e fitness', true, 32),
('Futebol', 'futebol', '⚽', 'Equipamentos e produtos de futebol', true, 33),
('Ciclismo', 'ciclismo', '🚴', 'Equipamentos para ciclismo', true, 34),
('Natação', 'natacao', '🏊', 'Equipamentos para natação e esportes aquáticos', true, 35),
('Camping', 'camping', '⛺', 'Equipamentos para camping e aventura', true, 36),
('Instrumentos Musicais', 'instrumentos-musicais', '🎸', 'Instrumentos musicais e equipamentos', true, 37),

-- ANIMAIS E PETS
('Cachorros', 'cachorros', '🐕', 'Cachorros de todas as raças', true, 38),
('Gatos', 'gatos', '🐱', 'Gatos de todas as raças', true, 39),
('Peixes', 'peixes', '🐠', 'Peixes ornamentais e aquarismo', true, 40),
('Aves', 'aves', '🐦', 'Aves domésticas e ornamentais', true, 41),
('Acessórios para Pets', 'acessorios-pets', '🦴', 'Acessórios, rações e produtos para pets', true, 42),
('Outros Animais', 'outros-animais', '🐾', 'Outros animais domésticos', true, 43),

-- BEBÊS E CRIANÇAS
('Roupas de Bebê', 'roupas-bebe', '👶', 'Roupas e acessórios para bebês', true, 44),
('Móveis de Bebê', 'moveis-bebe', '🍼', 'Berços, carrinhos e móveis infantis', true, 45),
('Brinquedos', 'brinquedos', '🧸', 'Brinquedos e jogos infantis', true, 46),
('Roupas Infantis', 'roupas-infantis', '👶', 'Roupas para crianças', true, 47),

-- LIVROS E EDUCAÇÃO
('Livros', 'livros', '📚', 'Livros de todos os gêneros', true, 48),
('Cursos', 'cursos', '🎓', 'Cursos e material didático', true, 49),
('Música e Filmes', 'musica-filmes', '🎬', 'CDs, DVDs e conteúdo digital', true, 50),

-- SERVIÇOS
('Serviços Automotivos', 'servicos-automotivos', '🔧', 'Mecânica, lavagem e serviços para veículos', true, 51),
('Reformas e Reparos', 'reformas-reparos', '🏠', 'Serviços de reforma e reparo', true, 52),
('Limpeza', 'limpeza', '🧽', 'Serviços de limpeza residencial e comercial', true, 53),
('Beleza e Estética', 'servicos-beleza', '💇', 'Salões, clínicas de estética e bem-estar', true, 54),
('Eventos', 'eventos', '🎉', 'Organização de eventos e festas', true, 55),
('Transporte', 'transporte', '🚚', 'Serviços de transporte e mudanças', true, 56),
('Consultoria', 'consultoria', '💼', 'Serviços de consultoria e assessoria', true, 57),

-- AGRICULTURA E PECUÁRIA
('Tratores', 'tratores', '🚜', 'Tratores e máquinas agrícolas', true, 58),
('Gado', 'gado', '🐄', 'Bovinos para corte e leite', true, 59),
('Cavalos', 'cavalos', '🐎', 'Cavalos e equinos', true, 60),
('Aves de Granja', 'aves-granja', '🐓', 'Aves para criação', true, 61),
('Sementes e Mudas', 'sementes-mudas', '🌱', 'Sementes, mudas e insumos agrícolas', true, 62),
('Equipamentos Rurais', 'equipamentos-rurais', '⚙️', 'Equipamentos e ferramentas rurais', true, 63),

-- NEGÓCIOS E INDÚSTRIA
('Máquinas Industriais', 'maquinas-industriais', '⚙️', 'Máquinas e equipamentos industriais', true, 64),
('Equipamentos Comerciais', 'equipamentos-comerciais', '🏭', 'Equipamentos para comércio', true, 65),
('Material de Escritório', 'material-escritorio', '📎', 'Móveis e materiais de escritório', true, 66),

-- OUTROS
('Antiguidades', 'antiguidades', '🏺', 'Objetos antigos e colecionáveis', true, 67),
('Artesanato', 'artesanato', '🎨', 'Produtos artesanais', true, 68),
('Outros', 'outros', '📦', 'Produtos diversos não categorizados', true, 69); 