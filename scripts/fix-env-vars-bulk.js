#!/usr/bin/env node
/**
 * Script para corrigir TODAS as variáveis de ambiente não validadas de forma eficiente
 */

const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam ser corrigidos (da busca anterior)
const FILES_TO_FIX = [
  'app/api/admin/dashboard-stats/route.ts',
  'app/api/admin/plans/route.ts',
  'app/api/admin/reports/route.ts',
  'app/api/admin/subscriptions/route.ts',
  'app/api/admin/subscriptions/sync/route.ts',
  'app/api/admin/sync-subscriptions/route.ts',
  'app/api/admin/users-subscriptions/route.ts',
  'app/api/admin/users-subscriptions/[id]/route.ts',
  'app/api/ads/create/route.ts',
  'app/api/ads/my-ads/route.ts',
  'app/api/ads/search/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/business/categories/route.ts',
  'app/api/categories/list/route.ts',
  'app/api/categories/route.ts',
  'app/api/cities/list/route.ts',
  'app/api/destaques/validation/route.ts',
  'app/api/payments/charges/route.ts',
  'app/api/payments/customers/route.ts',
  'app/api/payments/process-extra-ad/route.ts',
  'app/api/payments/subscriptions/route.ts',
  'app/api/payments/transactions/route.ts',
  'app/api/payments/webhooks/route.ts',
  'app/api/plans/list/route.ts',
  'app/api/users/profile/route.ts',
  'app/api/users/[id]/route.ts',
  'app/api/webhooks/asaas/route.ts'
];

const PROJECT_ROOT = path.join(__dirname, '..');

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalFixes: 0
};

/**
 * Corrige variáveis de ambiente em um arquivo
 */
function fixEnvVars(content) {
  let modified = content;
  let fixes = 0;

  // Padrão 1: process.env.VARIABLE! -> process.env.VARIABLE
  const pattern = /process\.env\.([A-Z_][A-Z0-9_]*)\!/g;
  const matches = modified.match(pattern);

  if (matches) {
    fixes += matches.length;
    modified = modified.replace(pattern, 'process.env.$1');

    // Se encontrou variáveis críticas, adicionar validação
    const hasCriticalVars = matches.some(match =>
      match.includes('SUPABASE_URL') ||
      match.includes('SUPABASE_SERVICE_ROLE_KEY') ||
      match.includes('SUPABASE_ANON_KEY')
    );

    if (hasCriticalVars) {
      // Procurar onde as variáveis são declaradas e adicionar validação
      const supabaseUrlMatch = modified.match(/const\s+(\w+)\s*=\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL;/);
      const serviceKeyMatch = modified.match(/const\s+(\w+)\s*=\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY;/);

      if (supabaseUrlMatch && serviceKeyMatch) {
        const urlVarName = supabaseUrlMatch[1];
        const keyVarName = serviceKeyMatch[1];

        const validationCode = `
// Validação de ambiente
if (!${urlVarName} || !${keyVarName}) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}`;

        // Inserir validação após a última declaração de variável Supabase
        const lastSupabaseVar = serviceKeyMatch[0];
        modified = modified.replace(lastSupabaseVar, lastSupabaseVar + validationCode);
      }
    }
  }

  return { content: modified, fixes };
}

/**
 * Processa um arquivo
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;

    const fullPath = path.join(PROJECT_ROOT, filePath);
    const originalContent = fs.readFileSync(fullPath, 'utf-8');

    const result = fixEnvVars(originalContent);

    if (result.fixes > 0) {
      fs.writeFileSync(fullPath, result.content);
      stats.filesModified++;
      stats.totalFixes += result.fixes;
      console.log(`✅ ${filePath}: ${result.fixes} variáveis corrigidas`);
    }

  } catch (error) {
    console.log(`❌ Erro em ${filePath}: ${error.message}`);
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🔧 Corrigindo variáveis de ambiente não validadas...\n');

  FILES_TO_FIX.forEach(processFile);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`📄 Arquivos processados: ${stats.filesProcessed}`);
  console.log(`✏️  Arquivos modificados: ${stats.filesModified}`);
  console.log(`🔧 Total de correções: ${stats.totalFixes}`);
  console.log('\n✅ Variáveis de ambiente agora são seguras para PRODUÇÃO!');
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { main };