# Cursor Orquestrador 🤖

## Como usar:

1. Preencha o arquivo `.env` com os dados do Supabase:
```
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_XXXXXX
```

2. No terminal:
```
npm install
node index.js
```

3. Ele vai buscar prompts pendentes e colar no Claude (simulado por enquanto).

Pronto! Depois substituímos o `claudeWorker.js` para controlar o Cursor com Puppeteer.
