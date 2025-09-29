#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para remover console.logs de arquivos TypeScript de forma segura
 */

const API_DIR = path.join(__dirname, '../app/api');

// Padrões de console.log para remover
const CONSOLE_PATTERNS = [
  /^\s*console\.(log|error|warn|debug)\([^)]*\);\s*$/gm,
  /^\s*console\.(log|error|warn|debug)\(/gm,
];

// Arquivos/diretórios para ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build'
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function removeConsoleLogs(content) {
  let modified = content;

  // Remover linhas completas com console.log/error/warn/debug
  modified = modified.replace(/^\s*console\.(log|error|warn|debug)\([^)]*\);\s*\n/gm, '');
  modified = modified.replace(/^\s*console\.(log|error|warn|debug)\([^)]*\);\s*$/gm, '');

  // Remover console.logs multi-linha básicos
  modified = modified.replace(/^\s*console\.(log|error|warn|debug)\(\s*$[\s\S]*?^\s*\);\s*$/gm, '');

  return modified;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = removeConsoleLogs(content);

    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ Processado: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Diretório não encontrado: ${dirPath}`);
    return { processed: 0, modified: 0 };
  }

  let processed = 0;
  let modified = 0;

  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);

      if (shouldIgnoreFile(fullPath)) {
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        processed++;
        if (processFile(fullPath)) {
          modified++;
        }
      }
    }
  }

  walkDir(dirPath);
  return { processed, modified };
}

// Executar o script
console.log('🧹 Iniciando remoção de console.logs...');
console.log(`📁 Processando diretório: ${API_DIR}`);

const result = processDirectory(API_DIR);

console.log('\n📊 Relatório Final:');
console.log(`   Arquivos processados: ${result.processed}`);
console.log(`   Arquivos modificados: ${result.modified}`);

// Contar console.logs restantes
try {
  const remaining = execSync('rg "console\\.(log|error|warn|debug)" app/api/ --type ts | wc -l', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  }).trim();

  console.log(`   Console.logs restantes: ${remaining}`);
} catch (error) {
  console.log('   Console.logs restantes: (não foi possível contar)');
}

console.log('\n✅ Limpeza concluída!');