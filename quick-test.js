const https = require('https');

console.log('🧪 Testando sistemas BDC...\n');

// URLs corretas baseadas no .env
const urls = [
  'https://www.buscaaquibdc.com/api/test-systems',
  'https://buscaaquibdc.com/api/test-systems'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`🔍 Testando: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${url} - Status: ${res.statusCode}`);
          console.log(`📊 ASAAS: ${parsed.systems?.asaas?.status || 'N/A'} - ${parsed.systems?.asaas?.message || ''}`);
          console.log(`📊 Supabase: ${parsed.systems?.supabase?.status || 'N/A'} - ${parsed.systems?.supabase?.message || ''}`);
          console.log(`🎯 Overall: ${parsed.overallStatus || 'N/A'}`);
          console.log(`💬 Message: ${parsed.message || 'N/A'}\n`);
          
          if (parsed.systems?.asaas?.details) {
            console.log(`📋 ASAAS Details:`, parsed.systems.asaas.details);
          }
          if (parsed.systems?.supabase?.details) {
            console.log(`📋 Supabase Details:`, parsed.systems.supabase.details);
          }
          console.log('');
          
          resolve({ success: true, url, status: res.statusCode, data: parsed });
        } catch (e) {
          console.log(`✅ ${url} - Status: ${res.statusCode} (resposta não-JSON)`);
          console.log(`📝 Resposta: ${data.substring(0, 500)}...\n`);
          resolve({ success: true, url, status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Erro: ${err.message}\n`);
      resolve({ success: false, url, error: err.message });
    });
    
    req.setTimeout(15000, () => {
      console.log(`⏰ ${url} - Timeout\n`);
      req.destroy();
      resolve({ success: false, url, error: 'Timeout' });
    });
  });
}

async function runTests() {
  console.log('=== 🚀 TESTE FINAL DOS SISTEMAS BDC ===\n');
  
  let hasSuccess = false;
  let asaasWorking = false;
  let supabaseWorking = false;
  
  for (const url of urls) {
    const result = await testUrl(url);
    if (result.success && result.data && typeof result.data === 'object') {
      hasSuccess = true;
      if (result.data.systems?.asaas?.status === 'success') asaasWorking = true;
      if (result.data.systems?.supabase?.status === 'success') supabaseWorking = true;
    }
  }
  
  console.log('=== 🎯 DIAGNÓSTICO FINAL ===');
  console.log(`✅ Sistema acessível: ${hasSuccess ? 'SIM' : 'NÃO'}`);
  console.log(`🔑 ASAAS funcionando: ${asaasWorking ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log(`📊 Supabase funcionando: ${supabaseWorking ? 'SIM ✅' : 'NÃO ❌'}`);
  
  if (asaasWorking && supabaseWorking) {
    console.log('\n🎉 PARABÉNS! TODOS OS PROBLEMAS FORAM RESOLVIDOS!');
    console.log('✅ Nova chave ASAAS funcionando');
    console.log('✅ Migration Supabase aplicada');
    console.log('✅ Sistema de autenticação corrigido');
    console.log('\n🚀 Seu sistema está 100% operacional!');
  } else {
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    if (!asaasWorking) {
      console.log('❌ ASAAS: Verificar se a nova chave foi aplicada corretamente no Vercel');
    }
    if (!supabaseWorking) {
      console.log('❌ Supabase: Verificar se a migration foi aplicada corretamente');
    }
  }
}

runTests().catch(console.error); 