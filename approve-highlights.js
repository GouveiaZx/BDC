const http = require('http');

console.log('Aprovando destaques pendentes...');

// Primeiro, vamos buscar os destaques pendentes
const getHighlights = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/highlights?status=all',
      method: 'GET',
      headers: {
        'Cookie': 'admin-auth=true',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch(e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Função para aprovar um destaque
const approveHighlight = (highlightId) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: 'approve',
      highlightId: highlightId
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/highlights/moderate',
      method: 'POST',
      headers: {
        'Cookie': 'admin-auth=true',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch(e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Executar o processo
async function main() {
  try {
    console.log('1. Buscando destaques...');
    const highlights = await getHighlights();

    console.log('Status:', highlights.success);
    console.log('Total highlights:', highlights.highlights ? highlights.highlights.length : 0);

    if (!highlights.highlights || highlights.highlights.length === 0) {
      console.log('❌ Nenhum destaque encontrado');
      return;
    }

    console.log('\n2. Destaques encontrados:');
    highlights.highlights.forEach((h, i) => {
      console.log(`${i+1}. ${h.title} (${h.id})`);
      console.log(`   Status: ${h.status}`);
      console.log(`   Moderation: ${h.moderation_status}`);
    });

    // Filtrar apenas destaques pendentes
    const pendingHighlights = highlights.highlights.filter(h =>
      h.status === 'pending_review' || h.moderation_status === 'pending'
    );

    if (pendingHighlights.length === 0) {
      console.log('\n✅ Não há destaques pendentes para aprovar');
      return;
    }

    console.log(`\n3. Aprovando ${pendingHighlights.length} destaques pendentes...`);

    for (const highlight of pendingHighlights) {
      try {
        console.log(`   Aprovando: ${highlight.title} (${highlight.id})`);
        const result = await approveHighlight(highlight.id);
        console.log(`   ✅ Resultado: ${result.success ? 'Sucesso' : 'Falha'}`);
        if (!result.success) {
          console.log(`   ❌ Erro: ${result.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao aprovar ${highlight.title}: ${error.message}`);
      }
    }

    console.log('\n4. Verificando resultado final...');
    const finalHighlights = await getHighlights();
    const approvedHighlights = finalHighlights.highlights.filter(h =>
      h.status === 'active' && h.moderation_status === 'approved'
    );

    console.log(`✅ Total aprovados: ${approvedHighlights.length}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();