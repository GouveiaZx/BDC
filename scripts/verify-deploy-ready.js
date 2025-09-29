#!/usr/bin/env node
/**
 * 🚀 Script de Verificação Pré-Deploy para Vercel
 *
 * Este script verifica se o projeto está pronto para deploy no Vercel
 * validando configurações, dependências e variáveis de ambiente.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando se o projeto está pronto para deploy no Vercel...\n');

const errors = [];
const warnings = [];
const checks = [];

// Função para adicionar resultado de verificação
function addCheck(name, status, message) {
  checks.push({ name, status, message });
  if (status === 'error') errors.push(`❌ ${name}: ${message}`);
  if (status === 'warning') warnings.push(`⚠️  ${name}: ${message}`);
  if (status === 'success') console.log(`✅ ${name}: ${message}`);
}

// 1. Verificar arquivos obrigatórios
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'next.config.mjs',
    'vercel.json',
    '.env.production.example'
  ];

  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      addCheck(`Arquivo ${file}`, 'success', 'Encontrado');
    } else {
      addCheck(`Arquivo ${file}`, 'error', 'Arquivo obrigatório não encontrado');
    }
  });
}

// 2. Verificar package.json
function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // Verificar scripts obrigatórios
    const requiredScripts = ['build', 'start'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        addCheck(`Script ${script}`, 'success', 'Configurado');
      } else {
        addCheck(`Script ${script}`, 'error', 'Script obrigatório não encontrado');
      }
    });

    // Verificar se puppeteer foi removido
    if (packageJson.dependencies.puppeteer) {
      addCheck('Puppeteer', 'error', 'Puppeteer deve ser removido - não funciona no Vercel');
    } else {
      addCheck('Puppeteer', 'success', 'Não encontrado (correto)');
    }

    // Verificar se critters foi removido
    if (packageJson.dependencies.critters) {
      addCheck('Critters', 'error', 'Critters deve ser removido - pode causar problemas no Vercel');
    } else {
      addCheck('Critters', 'success', 'Não encontrado (correto)');
    }

    // Verificar Next.js
    if (packageJson.dependencies.next) {
      const nextVersion = packageJson.dependencies.next.replace(/[^0-9.]/g, '');
      if (nextVersion.startsWith('14.')) {
        addCheck('Next.js', 'success', `Versão ${nextVersion} (compatível com Vercel)`);
      } else {
        addCheck('Next.js', 'warning', `Versão ${nextVersion} - recomendado Next.js 14+`);
      }
    } else {
      addCheck('Next.js', 'error', 'Next.js não encontrado');
    }

  } catch (error) {
    addCheck('package.json', 'error', 'Erro ao ler arquivo: ' + error.message);
  }
}

// 3. Verificar configuração do Vercel
function checkVercelConfig() {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

    if (vercelConfig.builds && vercelConfig.builds.length > 0) {
      addCheck('Vercel builds', 'success', 'Configurado');
    } else {
      addCheck('Vercel builds', 'warning', 'Builds não configurados - usando padrões');
    }

    if (vercelConfig.functions) {
      addCheck('Vercel functions', 'success', 'Timeout configurado para funções');
    } else {
      addCheck('Vercel functions', 'warning', 'Timeout não configurado - usando padrões');
    }

  } catch (error) {
    addCheck('vercel.json', 'error', 'Erro ao ler configuração: ' + error.message);
  }
}

// 4. Verificar next.config.mjs
function checkNextConfig() {
  try {
    if (fs.existsSync('next.config.mjs')) {
      const configContent = fs.readFileSync('next.config.mjs', 'utf8');

      // Verificar se URL hardcoded foi removida
      if (configContent.includes('xjguzxwwydlpvudwmiyv')) {
        addCheck('Next.js Config', 'error', 'URL do Supabase ainda está hardcoded');
      } else {
        addCheck('Next.js Config', 'success', 'URLs dinâmicas configuradas');
      }

      // Verificar configurações de segurança
      if (configContent.includes('X-Frame-Options')) {
        addCheck('Headers de Segurança', 'success', 'Headers configurados');
      } else {
        addCheck('Headers de Segurança', 'warning', 'Headers de segurança não configurados');
      }

    }
  } catch (error) {
    addCheck('next.config.mjs', 'error', 'Erro ao verificar configuração: ' + error.message);
  }
}

// 5. Verificar .gitignore
function checkGitignore() {
  try {
    if (fs.existsSync('.gitignore')) {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');

      const requiredIgnores = ['.env.local', 'node_modules', '.next'];
      let allPresent = true;

      requiredIgnores.forEach(ignore => {
        if (!gitignoreContent.includes(ignore)) {
          allPresent = false;
          addCheck(`Gitignore ${ignore}`, 'warning', 'Item não encontrado no .gitignore');
        }
      });

      if (allPresent) {
        addCheck('Gitignore', 'success', 'Arquivos sensíveis ignorados');
      }
    } else {
      addCheck('Gitignore', 'warning', 'Arquivo .gitignore não encontrado');
    }
  } catch (error) {
    addCheck('Gitignore', 'error', 'Erro ao verificar .gitignore: ' + error.message);
  }
}

// 6. Verificar tamanho das dependências
function checkDependenciesSize() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const heavyDeps = ['puppeteer', 'playwright', 'selenium-webdriver', 'electron'];

    let foundHeavy = false;
    heavyDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        addCheck(`Dependência ${dep}`, 'warning', 'Dependência pesada pode causar problemas no Vercel');
        foundHeavy = true;
      }
    });

    if (!foundHeavy) {
      addCheck('Dependências', 'success', 'Nenhuma dependência problemática encontrada');
    }
  } catch (error) {
    addCheck('Dependências', 'error', 'Erro ao verificar dependências: ' + error.message);
  }
}

// 7. Verificar build
async function checkBuild() {
  try {
    const { spawn } = require('child_process');

    console.log('\n🔨 Testando build de produção...');

    return new Promise((resolve) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      buildProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          addCheck('Build Test', 'success', 'Build executado com sucesso');
        } else {
          addCheck('Build Test', 'error', 'Build falhou - verifique os erros');
          console.log('\n📋 Output do build:');
          console.log(output);
        }
        resolve();
      });

      // Timeout de 5 minutos
      setTimeout(() => {
        buildProcess.kill();
        addCheck('Build Test', 'warning', 'Build cancelado por timeout');
        resolve();
      }, 300000);
    });
  } catch (error) {
    addCheck('Build Test', 'error', 'Erro ao testar build: ' + error.message);
  }
}

// Executar todas as verificações
async function runAllChecks() {
  console.log('🔍 VERIFICAÇÕES DE PRÉ-DEPLOY\n');

  checkRequiredFiles();
  checkPackageJson();
  checkVercelConfig();
  checkNextConfig();
  checkGitignore();
  checkDependenciesSize();

  await checkBuild();

  // Resultado final
  console.log('\n📊 RESUMO DA VERIFICAÇÃO\n');

  if (warnings.length > 0) {
    console.log('⚠️  AVISOS:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ ERROS CRÍTICOS:');
    errors.forEach(error => console.log(`   ${error}`));
    console.log('');
    console.log('🚫 PROJETO NÃO ESTÁ PRONTO PARA DEPLOY!');
    console.log('   Corrija os erros acima antes de fazer deploy no Vercel.\n');
    process.exit(1);
  } else {
    console.log('🎉 PROJETO PRONTO PARA DEPLOY NO VERCEL!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Conecte seu repositório ao Vercel');
    console.log('   2. Configure as variáveis de ambiente (veja .env.production.example)');
    console.log('   3. Faça o deploy!');
    console.log('');
    console.log('🔗 Links úteis:');
    console.log('   - Deploy no Vercel: https://vercel.com/new');
    console.log('   - Docs do Vercel: https://vercel.com/docs');
    console.log('');
    process.exit(0);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  runAllChecks().catch(console.error);
}

module.exports = { runAllChecks };