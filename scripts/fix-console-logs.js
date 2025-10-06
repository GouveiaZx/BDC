/**
 * Script para substituir console.log com emojis por logger apropriado
 */
const fs = require('fs');
const path = require('path');

const emojis = ['🔥', '😊', '👍', '💪', '✅', '❌', '🎉', '🚀', '⚡', '🛡️', '📊', '🔄', '🎯', '📝', '🌐', '🔍'];

function fixConsoleLogsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Verificar se já importa o logger
  const hasLoggerImport = content.includes("from '../lib/logger'") ||
                          content.includes("from '../../lib/logger'") ||
                          content.includes("from '@/lib/logger'");

  // Adicionar import do logger se necessário e se houver console.log com emoji
  const hasEmojiLog = emojis.some(emoji => content.includes(`console.log`) && content.includes(emoji));

  if (hasEmojiLog && !hasLoggerImport) {
    // Detectar a profundidade do arquivo para usar o import correto
    const depth = filePath.split(path.sep).filter(p => p === 'app').length;
    const importPath = depth > 1 ? "'../../lib/logger'" : "'../lib/logger'";

    // Adicionar import após outros imports ou no início
    const lines = content.split('\n');
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      }
    }

    lines.splice(insertIndex, 0, `import { logger } from ${importPath};`);
    content = lines.join('\n');
    modified = true;
  }

  // Substituir console.log com emojis por logger.info
  const consoleLogWithEmojiRegex = /console\.(log|error|warn|info)\((.*?[🔥😊👍💪✅❌🎉🚀⚡🛡️📊🔄🎯📝🌐🔍].*?)\);?/g;

  content = content.replace(consoleLogWithEmojiRegex, (match, level, args) => {
    modified = true;
    // Remover emojis dos argumentos
    const cleanArgs = args.replace(/[🔥😊👍💪✅❌🎉🚀⚡🛡️📊🔄🎯📝🌐🔍]/g, '').trim();

    // Escolher o nível apropriado do logger
    const loggerLevel = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';

    return `logger.${loggerLevel}(${cleanArgs})`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Corrigido: ${filePath}`);
    return true;
  }

  return false;
}

// Processar todos os arquivos TypeScript/JavaScript recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      count += processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      if (fixConsoleLogsInFile(filePath)) {
        count++;
      }
    }
  }

  return count;
}

const appDir = path.join(__dirname, '..', 'app');
console.log('Iniciando correção de console.logs com emojis...\n');
const total = processDirectory(appDir);
console.log(`\n✓ Total de arquivos corrigidos: ${total}`);
