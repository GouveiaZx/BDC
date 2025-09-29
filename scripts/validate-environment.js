#!/usr/bin/env node
/**
 * Script para validar variáveis de ambiente antes de build/deploy
 */

const fs = require('fs');
const path = require('path');

// Simular a função de validação (versão JS)
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Variáveis obrigatórias por ambiente
  const requiredVars = {
    development: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ],
    production: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'ASAAS_API_KEY',
      'ASAAS_WEBHOOK_SECRET'
    ]
  };

  const required = requiredVars[nodeEnv] || requiredVars.development;

  // Verificar variáveis obrigatórias
  for (const varName of required) {
    const value = process.env[varName];

    if (!value) {
      errors.push(`❌ Variável obrigatória não configurada: ${varName}`);
      continue;
    }

    // Validações específicas
    switch (varName) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        if (!value.includes('supabase.co') && !value.includes('localhost')) {
          errors.push(`❌ URL do Supabase inválida: ${varName}`);
        }
        break;

      case 'JWT_SECRET':
        if (value.length < 32) {
          errors.push(`❌ JWT_SECRET muito curto (mínimo 32 caracteres)`);
        }
        break;

      case 'ASAAS_API_KEY':
        if (value.length < 10) {
          errors.push(`❌ ASAAS_API_KEY muito curta`);
        }
        break;
    }
  }

  // Variáveis recomendadas
  const recommendedVars = nodeEnv === 'development' ? ['ASAAS_API_KEY'] : ['RESEND_API_KEY'];

  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      warnings.push(`⚠️  Variável recomendada não configurada: ${varName}`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function main() {
  console.log('🔍 Validando configuração de ambiente...\n');

  // Verificar se .env.local existe
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  Arquivo .env.local não encontrado');
    console.log('   Certifique-se de ter as variáveis de ambiente configuradas\n');
  }

  const validation = validateEnvironment();
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Mostrar informações do ambiente
  console.log(`📊 Ambiente: ${nodeEnv.toUpperCase()}`);
  console.log(`🌐 URL Base: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`);
  console.log(`🔗 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado'}`);
  console.log('');

  // Mostrar resultados
  if (validation.errors.length > 0) {
    console.log('🚫 ERROS CRÍTICOS:');
    validation.errors.forEach(error => console.log(`   ${error}`));
    console.log('');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  AVISOS:');
    validation.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  if (validation.isValid) {
    console.log('✅ Configuração de ambiente válida!');
    console.log('🚀 Sistema pronto para execução\n');
    process.exit(0);
  } else {
    console.log('❌ Configuração de ambiente inválida!');
    console.log('');
    console.log('📋 Para corrigir:');
    console.log('   1. Crie o arquivo .env.local na raiz do projeto');
    console.log('   2. Configure as variáveis obrigatórias');
    console.log('   3. Execute novamente este script');
    console.log('');
    console.log('📖 Documentação: https://docs.supabase.com/guides/getting-started');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvironment };