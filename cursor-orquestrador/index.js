require('dotenv').config();
const { getNextPrompt, updatePromptStatus } = require('./supabase');
const { executarPromptNoClaude } = require('./claudeWorker');
const delay = require('./utils/delay');

(async () => {
  console.log("Iniciando orquestrador de prompts...");
  while (true) {
    try {
      const prompt = await getNextPrompt();
      if (prompt) {
        console.log("Executando prompt:", prompt.prompt_text);
        const resposta = await executarPromptNoClaude(prompt.prompt_text);
        await updatePromptStatus(prompt.id, resposta);
        console.log("Resposta salva com sucesso.");
      } else {
        console.log("Nenhum prompt pendente.");
      }
    } catch (e) {
      console.error("Erro no loop:", e);
    }
    await delay(30000); // espera 30s
  }
})();