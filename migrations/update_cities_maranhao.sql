-- ======================================
-- MIGRAÇÃO: ATUALIZAR CIDADES PARA MARANHÃO
-- ======================================

-- Limpar cidades existentes (de outros estados)
DELETE FROM cities WHERE state != 'MA';

-- Inserir cidades do Maranhão
INSERT INTO cities (name, state, is_active) VALUES
-- Principais cidades do Maranhão
('São Luís', 'MA', true),
('Imperatriz', 'MA', true),
('São José de Ribamar', 'MA', true),
('Timon', 'MA', true),
('Caxias', 'MA', true),
('Codó', 'MA', true),
('Paço do Lumiar', 'MA', true),
('Açailândia', 'MA', true),
('Bacabal', 'MA', true),
('Balsas', 'MA', true),
('Barra do Corda', 'MA', true),
('Chapadinha', 'MA', true),
('Santa Inês', 'MA', true),
('Pinheiro', 'MA', true),
('Pedreiras', 'MA', true),
('Viana', 'MA', true),
('Rosário', 'MA', true),
('Grajaú', 'MA', true),
('Presidente Dutra', 'MA', true),
('Vargem Grande', 'MA', true),
('Itapecuru Mirim', 'MA', true),
('Coroatá', 'MA', true),
('Carolina', 'MA', true),
('Santa Luzia', 'MA', true),
('Raposa', 'MA', true),
('Tutóia', 'MA', true),
('Araioses', 'MA', true),
('Dom Pedro', 'MA', true),
('Porto Franco', 'MA', true),
('Estreito', 'MA', true),
('Barreirinhas', 'MA', true),
('São Mateus do Maranhão', 'MA', true),
('Lago da Pedra', 'MA', true),
('Colinas', 'MA', true),
('Tuntum', 'MA', true),
('Governador Nunes Freire', 'MA', true),
('Pindaré-Mirim', 'MA', true),
('São João Batista', 'MA', true),
('Riachão', 'MA', true),
('Morros', 'MA', true),
('São Domingos do Maranhão', 'MA', true),
('Primeira Cruz', 'MA', true),
('Icatu', 'MA', true),
('Miranda do Norte', 'MA', true),
('São Bento', 'MA', true),
('Mata Roma', 'MA', true),
('Alcântara', 'MA', true),
('Humberto de Campos', 'MA', true),
('São João dos Patos', 'MA', true),
('Governador Archer', 'MA', true)
ON CONFLICT (name, state) DO NOTHING;

-- Verificar resultado
SELECT 
  COUNT(*) as total_cidades_ma,
  COUNT(CASE WHEN is_active = true THEN 1 END) as cidades_ativas
FROM cities 
WHERE state = 'MA';

-- Log da migração
INSERT INTO admin_logs (admin_id, action, entity_type, ip_address, user_agent)
SELECT 
  id as admin_id,
  'UPDATE_CITIES_MA' as action,
  'cities' as entity_type,
  '127.0.0.1'::inet as ip_address,
  'System Migration' as user_agent
FROM users 
WHERE user_type = 'admin' 
LIMIT 1; 