#!/usr/bin/env node
/**
 * Script para remover TODOS os console.logs das APIs para produção
 * Remove console.log, console.error, console.warn, console.info, console.debug
 */

const fs = require('fs');
const path = require('path');

// Configurações
const API_DIR = path.join(__dirname, '..', 'app', 'api');
const BACKUP_DIR = path.join(__dirname, '..', 'backups-console-logs');

// Estatísticas
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalRemovals: 0,
  errorFiles: []
};

// Padrões para remover console statements
const CONSOLE_PATTERNS = [
  // console.log(...), console.error(...), etc.
  /console\.(log|error|warn|info|debug)\s*\([^)]*\)\s*;?\s*$/gm,

  // console.log multiline
  /console\.(log|error|warn|info|debug)\s*\(\s*[\s\S]*?\)\s*;?\s*$/gm,

  // Linhas que só contém console + whitespace
  /^\s*console\.(log|error|warn|info|debug)\s*\([^)]*\)\s*;?\s*$/gm,

  // console.log com template literals multiline
  /console\.(log|error|warn|info|debug)\s*\(\s*`[\s\S]*?`\s*\)\s*;?\s*$/gm,

  // console dentro de comentários de debug
  /\/\/\s*console\.(log|error|warn|info|debug).*$/gm,

  // console em if statements de debug
  /if\s*\(\s*.*\)\s*console\.(log|error|warn|info|debug)\s*\([^)]*\)\s*;?\s*$/gm
];

/**
 * Verifica se um arquivo é TypeScript/JavaScript
 */
function isValidFile(filePath) {
  return /\.(ts|js|tsx|jsx)$/.test(filePath) && !filePath.includes('node_modules');
}

/**
 * Conta quantos console.* existem no conteúdo
 */
function countConsoleLogs(content) {
  let count = 0;
  CONSOLE_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });
  return count;
}

/**
 * Remove todos os console statements do conteúdo
 */
function removeConsoleLogs(content) {
  let modifiedContent = content;
  let totalRemovals = 0;

  CONSOLE_PATTERNS.forEach(pattern => {
    const beforeCount = countConsoleLogs(modifiedContent);
    modifiedContent = modifiedContent.replace(pattern, '');
    const afterCount = countConsoleLogs(modifiedContent);
    totalRemovals += (beforeCount - afterCount);
  });

  // Limpar linhas vazias duplicadas deixadas pela remoção
  modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  return {
    content: modifiedContent,
    removals: totalRemovals
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
    const originalConsoleCount = countConsoleLogs(originalContent);

    if (originalConsoleCount === 0) {
      return; // Nenhum console.log encontrado
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

    // Remover console.logs
    const result = removeConsoleLogs(originalContent);

    if (result.content !== originalContent) {
      fs.writeFileSync(filePath, result.content);
      stats.filesModified++;
      stats.totalRemovals += originalConsoleCount;

      console.log(`✅ ${relativePath}: removidos ${originalConsoleCount} console.logs`);
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
  console.log('🧹 Iniciando remoção COMPLETA de console.logs das APIs...\n');
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
  console.log(`🗑️  Total de console.logs removidos: ${stats.totalRemovals}`);

  if (stats.errorFiles.length > 0) {
    console.log(`❌ Arquivos com erro: ${stats.errorFiles.length}`);
    stats.errorFiles.forEach(error => {
      console.log(`   - ${error.file}: ${error.error}`);
    });
  }

  console.log('\n✅ Processo concluído!');

  if (stats.totalRemovals > 0) {
    console.log(`\n🎉 Sistema agora está limpo para PRODUÇÃO!`);
    console.log(`   Removidos ${stats.totalRemovals} console.logs que poluiriam os logs de produção.`);
  } else {
    console.log('\n✨ Nenhum console.log encontrado - sistema já estava limpo!');
  }
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { main, removeConsoleLogs, countConsoleLogs };