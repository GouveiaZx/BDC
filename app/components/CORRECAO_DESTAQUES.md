# Correção do Erro de Destaques

## Problema Identificado

Identificamos um erro ao tentar criar destaques:

```
Could not find the 'moderated_at' column of 'destaques' in the schema cache
```

Este erro ocorre porque a tabela `destaques` no banco de dados Supabase não tem a coluna `moderated_at` ou o Supabase não atualizou seu cache de schema para reconhecer essa coluna.

## Solução

Implementamos duas soluções para resolver esse problema:

### 1. Melhoria no código da API

Modificamos a API de destaques para tentar uma abordagem alternativa quando encontrar esse erro. Agora, se a API encontrar um erro relacionado a coluna não encontrada, ela tentará uma versão simplificada do destaque sem os campos de moderação.

### 2. Script SQL para atualizar a tabela

Criamos um script SQL que pode ser executado no SQL Editor do Supabase para garantir que as colunas necessárias existam:

1. Acesse o painel administrativo do Supabase
2. Navegue até o SQL Editor
3. Copie o conteúdo do arquivo `app/sql/fix_destaques_users.sql`
4. Cole no editor e execute o script

O script faz o seguinte:
- Verifica se a coluna `moderated_at` existe e a adiciona se não existir
- Adiciona outras colunas relacionadas à moderação
- Atualiza o schema cache do Supabase para reconhecer as novas colunas
- Configura políticas de permissão para garantir que usuários possam criar destaques

## Como testar se o problema foi resolvido

1. Execute o script SQL no Supabase
2. Tente criar um novo destaque no painel do anunciante
3. Verifique se o destaque é criado com sucesso

Se você continuar tendo problemas, verifique os logs do console do navegador para entender melhor o erro.

## Solução temporária

Se mesmo após executar o script SQL o problema persistir, a API está configurada para usar uma abordagem alternativa que deve funcionar mesmo sem os campos de moderação. Os destaques criados desta forma não terão os campos de moderação, mas ainda serão inseridos no banco de dados e poderão ser visualizados e gerenciados normalmente.

Certifique-se de executar o script SQL adequadamente, pois isso corrigirá permanentemente o problema para todos os usuários do sistema. 