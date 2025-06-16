const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getNextPrompt() {
  const { data, error } = await supabase
    .from('prompt_queue')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

async function updatePromptStatus(id, resposta) {
  await supabase
    .from('prompt_queue')
    .update({
      status: 'executado',
      executed_at: new Date().toISOString(),
      response_text: resposta,
    })
    .eq('id', id);
}

module.exports = { getNextPrompt, updatePromptStatus };
