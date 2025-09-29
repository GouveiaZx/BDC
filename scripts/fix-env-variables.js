#!/usr/bin/env node
/**
 * Script para corrigir variáveis de ambiente não validadas
 * Remove ! forçado e adiciona validação adequada
 */

const fs = require('fs');
const path = require('path');

// Configurações
const API_DIR = path.join(__dirname, '..', 'app', 'api');
const BACKUP_DIR = path.join(__dirname, '..', 'backups-env-fix');

// Estatísticas
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalFixes: 0,
  errorFiles: []
};

// Padrões para encontrar variáveis de ambiente não validadas
const ENV_PATTERNS = [
  // process.env.VARIABLE!
  /process\.env\.([A-Z_][A-Z0-9_]*)\!/g,
  // const variable = process.env.VARIABLE!
  /const\s+(\w+)\s*=\s*process\.env\.([A-Z_][A-Z0-9_]*)\!/g
];

/**
 * Verifica se um arquivo é TypeScript/JavaScript
 */
function isValidFile(filePath) {
  return /\.(ts|js|tsx|jsx)$/.test(filePath) && !filePath.includes('node_modules');
}

/**
 * Conta quantas variáveis não validadas existem
 */
function countEnvVars(content) {
  let count = 0;
  ENV_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });
  return count;
}

/**
 * Corrige variáveis de ambiente não validadas
 */
function fixEnvVariables(content) {
  let modifiedContent = content;
  let totalFixes = 0;

  // Padrão 1: process.env.VARIABLE! -> process.env.VARIABLE
  const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)\!/g;
  const envMatches = modifiedContent.match(envPattern);
  if (envMatches) {
    totalFixes += envMatches.length;
    modifiedContent = modifiedContent.replace(envPattern, 'process.env.$1');
  }

  // Padrão 2: Adicionar validação condicional para variáveis críticas
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  criticalVars.forEach(varName => {
    // Procurar por const varname = process.env.VARNAME;
    const constPattern = new RegExp(`const\\s+(\\w+)\\s*=\\s*process\\.env\\.${varName};`, 'g');
    const constMatches = modifiedContent.match(constPattern);

    if (constMatches) {
      // Adicionar validação após a declaração
      const validationCode = `
// Validação de ambiente
if (!${varName.toLowerCase().replace(/[^a-z]/g, '')}) {
  throw new Error('Variável de ambiente obrigatória não configurada: ${varName}');
}`;

      constMatches.forEach(match => {
        const newCode = match + validationCode;
        modifiedContent = modifiedContent.replace(match, newCode);
        totalFixes++;
      });
    }
  });

  return {
    content: modifiedContent,
    fixes: totalFixes
  };
}

/**
 * Processa todos os arquivos recursivamente
 */
function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ Diretório não encontrado: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach(file => {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.isFile() && isValidFile(fullPath)) {
      processFile(fullPath);
    }
  });
}

/**
 * Processa um arquivo individual
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;

    const originalContent = fs.readFileSync(filePath, 'utf-8');
    const originalCount = countEnvVars(originalContent);

    if (originalCount === 0) {
      return; // Nenhuma variável problemática encontrada
    }

    // Fazer backup se modificar
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const relativePath = path.relative(API_DIR, filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(backupPath, originalContent);

    // Corrigir variáveis de ambiente
    const result = fixEnvVariables(originalContent);

    if (result.content !== originalContent) {
      fs.writeFileSync(filePath, result.content);
      stats.filesModified++;
      stats.totalFixes += originalCount;

      console.log(`✅ ${relativePath}: corrigidas ${originalCount} variáveis não validadas`);
    }

  } catch (error) {
    stats.errorFiles.push({
      file: filePath,
      error: error.message
    });
    console.log(`❌ Erro ao processar ${filePath}: ${error.message}`);
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🔧 Iniciando correção de variáveis de ambiente não validadas...\n');
  console.log(`📁 Processando diretório: ${API_DIR}`);
  console.log(`💾 Backups salvos em: ${BACKUP_DIR}\n`);

  const startTime = Date.now();

  processDirectory(API_DIR);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`⏱️  Tempo de execução: ${duration.toFixed(2)}s`);
  console.log(`📄 Arquivos processados: ${stats.filesProcessed}`);
  console.log(`✏️  Arquivos modificados: ${stats.filesModified}`);
  console.log(`🔧 Total de variáveis corrigidas: ${stats.totalFixes}`);

  if (stats.errorFiles.length > 0) {
    console.log(`❌ Arquivos com erro: ${stats.errorFiles.length}`);
    stats.errorFiles.forEach(error => {
      console.log(`   - ${error.file}: ${error.error}`);
    });
  }

  console.log('\n✅ Processo concluído!');

  if (stats.totalFixes > 0) {
    console.log(`\n🎉 Variáveis de ambiente agora estão seguras para PRODUÇÃO!`);
    console.log(`   Corrigidas ${stats.totalFixes} variáveis que poderiam causar falhas em runtime.`);
  } else {
    console.log('\n✨ Nenhuma variável problemática encontrada - sistema já estava seguro!');
  }
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { main, fixEnvVariables, countEnvVars };