-- Adicionar campo moderation_status na tabela ads se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ads' AND column_name='moderation_status'
    ) THEN
        ALTER TABLE ads ADD COLUMN moderation_status VARCHAR(50) DEFAULT 'pending';
        
        -- Atualizar registros existentes baseado no status atual
        UPDATE ads SET moderation_status = 'approved' WHERE status = 'approved';
        UPDATE ads SET moderation_status = 'rejected' WHERE status = 'rejected';
        UPDATE ads SET moderation_status = 'pending' WHERE status = 'pending';
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_ads_moderation_status ON ads(moderation_status);
        
        RAISE NOTICE 'Campo moderation_status adicionado à tabela ads';
    ELSE
        RAISE NOTICE 'Campo moderation_status já existe na tabela ads';
    END IF;
END $$; 