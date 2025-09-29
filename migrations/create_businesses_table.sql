-- Criar tabela businesses para classificados
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informações básicas da empresa
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Contato
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    
    -- Endereço
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    
    -- Mídia
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    
    -- Redes sociais
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    whatsapp VARCHAR(20),
    other_social JSONB,
    
    -- Categorias (array de strings)
    categories TEXT[] DEFAULT '{}',
    
    -- Status e moderação
    is_verified BOOLEAN DEFAULT false,
    moderation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderation_reason TEXT,
    moderation_date TIMESTAMP,
    moderated_by UUID REFERENCES users(id),
    
    -- Estatísticas
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_moderation_status ON businesses(moderation_status);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_state ON businesses(state);
CREATE INDEX IF NOT EXISTS idx_businesses_categories ON businesses USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);

-- Trigger para updated_at
CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Approved businesses are viewable by everyone" 
    ON businesses FOR SELECT 
    USING (moderation_status = 'approved');

CREATE POLICY "Users can manage their own businesses" 
    ON businesses FOR ALL 
    USING (auth.uid() = user_id); 