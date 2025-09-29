-- ==========================================
-- SCRIPT DE CORREÇÃO: VALORES DOS PLANOS ADMIN
-- ==========================================
-- Este script corrige os valores dos planos que estão aparecendo
-- errados no portal administrativo

-- 1. Verificar valores atuais dos planos
SELECT 'VALORES ATUAIS DOS PLANOS:' as status;
SELECT id, name, slug, price_monthly, price_yearly, description
FROM plans 
ORDER BY price_monthly;

-- 2. Atualizar valores corretos dos planos
-- Baseado na especificação do BDC:

-- Plano Gratuito
UPDATE plans 
SET 
  price_monthly = 0.00,
  price_yearly = 0.00,
  description = 'Plano gratuito com funcionalidades básicas'
WHERE slug = 'free';

-- Plano Básico  
UPDATE plans 
SET 
  price_monthly = 14.90,
  price_yearly = 149.00,
  description = 'Plano básico para usuários individuais'
WHERE slug = 'basic';

-- Plano Pro
UPDATE plans 
SET 
  price_monthly = 29.90,
  price_yearly = 299.00,
  description = 'Plano profissional com recursos avançados'
WHERE slug = 'pro';

-- Plano Premium
UPDATE plans 
SET 
  price_monthly = 49.90,
  price_yearly = 499.00,
  description = 'Plano premium com todos os recursos'
WHERE slug = 'premium';

-- Plano Business
UPDATE plans 
SET 
  price_monthly = 89.90,
  price_yearly = 899.00,
  description = 'Plano empresarial com recursos ilimitados'
WHERE slug = 'business';

-- 3. Verificar valores após correção
SELECT 'VALORES APÓS CORREÇÃO:' as status;
SELECT id, name, slug, price_monthly, price_yearly, description
FROM plans 
ORDER BY price_monthly;

-- 4. Garantir que os planos estão ativos
UPDATE plans SET is_active = true WHERE is_active = false;

-- 5. Reordenar os planos por preço
UPDATE plans SET sort_order = 0 WHERE slug = 'free';
UPDATE plans SET sort_order = 1 WHERE slug = 'basic';
UPDATE plans SET sort_order = 2 WHERE slug = 'pro';
UPDATE plans SET sort_order = 3 WHERE slug = 'premium';
UPDATE plans SET sort_order = 4 WHERE slug = 'business';

SELECT 'PLANOS ORDENADOS:' as status;
SELECT id, name, slug, price_monthly, sort_order, is_active
FROM plans 
ORDER BY sort_order; 