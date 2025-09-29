-- ==========================================
-- SCRIPT DE CORREÇÃO: CATEGORIAS FALTANDO
-- ==========================================
-- Este script corrige o problema de categorias não aparecendo
-- na hora de publicar anúncios

-- 1. Verificar categorias existentes
SELECT 'CATEGORIAS EXISTENTES:' as status;
SELECT id, name, slug, is_active, sort_order 
FROM categories 
ORDER BY sort_order, name;

-- 2. Ativar todas as categorias existentes (caso estejam inativas)
UPDATE categories SET is_active = true WHERE is_active = false;

-- 3. Inserir categorias principais se não existirem
INSERT INTO categories (name, slug, icon, description, sort_order, is_active) 
VALUES 
  ('Veículos', 'veiculos', 'car', 'Carros, motos, caminhões e outros veículos', 1, true),
  ('Imóveis', 'imoveis', 'home', 'Casas, apartamentos, terrenos e imóveis comerciais', 2, true),
  ('Eletrônicos', 'eletronicos', 'smartphone', 'Celulares, computadores, TVs e eletrônicos', 3, true),
  ('Móveis e Decoração', 'moveis-decoracao', 'sofa', 'Móveis para casa, decoração e utensílios', 4, true),
  ('Moda e Beleza', 'moda-beleza', 'shirt', 'Roupas, calçados, acessórios e cosméticos', 5, true),
  ('Esportes e Lazer', 'esportes-lazer', 'dumbbell', 'Equipamentos esportivos, bicicletas e lazer', 6, true),
  ('Animais de Estimação', 'pets', 'paw', 'Cães, gatos e acessórios para pets', 7, true),
  ('Bebês e Crianças', 'bebes-criancas', 'baby', 'Produtos infantis, brinquedos e roupas de bebê', 8, true),
  ('Serviços', 'servicos', 'tools', 'Prestação de serviços diversos', 9, true),
  ('Agro e Indústria', 'agro-industria', 'tractor', 'Máquinas agrícolas, ferramentas industriais', 10, true),
  ('Livros e Educação', 'livros-educacao', 'book', 'Livros, cursos e materiais educativos', 11, true),
  ('Empregos', 'empregos', 'briefcase', 'Vagas de emprego e oportunidades', 12, true),
  ('Outros', 'outros', 'more', 'Outros produtos e serviços', 13, true)
ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 4. Verificar resultado final
SELECT 'CATEGORIAS APÓS CORREÇÃO:' as status;
SELECT id, name, slug, is_active, sort_order 
FROM categories 
WHERE is_active = true
ORDER BY sort_order, name;

-- 5. Contar categorias ativas
SELECT COUNT(*) as total_categorias_ativas FROM categories WHERE is_active = true; 