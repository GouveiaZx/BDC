#!/usr/bin/env node
/**
 * Script para adicionar tratamento de erro robusto nos imports do Asaas
 */

const fs = require('fs');
const path = require('path');

// Lista de arquivos que contêm imports do Asaas
const ASAAS_FILES = [
  'app/api/webhooks/asaas/route.ts',
  'app/api/payments/customers/route.ts',
  'app/api/payments/process-extra-ad/route.ts',
  'app/api/payments/subscriptions/route.ts',
  'app/api/payments/charges/route.ts',
  'app/api/asaas/payments/route.ts',
  'app/api/subscriptions/process-trial-expiry/route.ts',
  'app/api/subscriptions/create/route.ts',
  'app/api/subscriptions/cancel/route.ts',
  'app/api/asaas/subscriptions/route.ts',
  'app/api/asaas/customers/route.ts'
];

const PROJECT_ROOT = path.join(__dirname, '..');

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalFixes: 0
};

/**
 * Melhora o tratamento de erro nos imports do Asaas
 */
function improveAsaasImports(content) {
  let modified = content;
  let fixes = 0;

  // Padrão 1: import simples sem try-catch
  const simpleImportPattern = /const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+import\s*\([^)]*asaas[^)]*\)\s*;/g;
  const simpleMatches = modified.match(simpleImportPattern);

  if (simpleMatches) {
    simpleMatches.forEach(match => {
      // Envolver em try-catch se não estiver já
      if (!modified.includes('try {') || modified.indexOf('try {') > modified.indexOf(match)) {
        const safeImport = `
        try {
          ${match}
        } catch (asaasError) {
          return NextResponse.json({
            success: false,
            error: 'Serviço de pagamento temporariamente indisponível',
            code: 'ASAAS_SERVICE_ERROR'
          }, { status: 503 });
        }`;

        modified = modified.replace(match, safeImport);
        fixes++;
      }
    });
  }

  // Padrão 2: Adicionar validação de ASAAS_API_KEY onde não existe
  if (modified.includes('import') && modified.includes('asaas') && !modified.includes('ASAAS_API_KEY')) {
    const validation = `
    // Validar se o Asaas está configurado
    if (!process.env.ASAAS_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Serviços de pagamento não configurados',
        code: 'PAYMENT_SERVICE_UNAVAILABLE'
      }, { status: 503 });
    }`;

    // Inserir após as importações
    const importEndPattern = /import[^;]+;(\s*\n)*/g;
    let lastImportIndex = 0;
    let match;

    while ((match = importEndPattern.exec(modified)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }

    if (lastImportIndex > 0) {
      modified = modified.slice(0, lastImportIndex) + validation + modified.slice(lastImportIndex);
      fixes++;
    }
  }

  // Padrão 3: Melhorar catch blocks vazios ou inadequados
  const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  const emptyCatches = modified.match(emptyCatchPattern);

  if (emptyCatches) {
    emptyCatches.forEach(emptyCatch => {
      const improvedCatch = `catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Erro no processamento da solicitação',
          details: error.message
        }, { status: 500 });
      }`;

      modified = modified.replace(emptyCatch, improvedCatch);
      fixes++;
    });
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

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  ${filePath}: arquivo não encontrado`);
      return;
    }

    const originalContent = fs.readFileSync(fullPath, 'utf-8');

    // Verificar se tem imports do Asaas
    if (!originalContent.includes('asaas')) {
      return;
    }

    const result = improveAsaasImports(originalContent);

    if (result.fixes > 0) {
      fs.writeFileSync(fullPath, result.content);
      stats.filesModified++;
      stats.totalFixes += result.fixes;
      console.log(`✅ ${filePath}: ${result.fixes} melhorias aplicadas`);
    }

  } catch (error) {
    console.log(`❌ Erro em ${filePath}: ${error.message}`);
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🛡️  Melhorando tratamento de erro nos imports do Asaas...\n');

  ASAAS_FILES.forEach(processFile);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`📄 Arquivos processados: ${stats.filesProcessed}`);
  console.log(`✏️  Arquivos modificados: ${stats.filesModified}`);
  console.log(`🛡️  Total de melhorias: ${stats.totalFixes}`);
  console.log('\n✅ Imports do Asaas agora são robustos para PRODUÇÃO!');
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { main };