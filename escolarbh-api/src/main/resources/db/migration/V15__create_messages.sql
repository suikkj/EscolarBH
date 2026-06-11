CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_broadcast BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

-- RLS (Row Level Security) - Simplificado para Supabase
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages or broadcasts" ON messages
    FOR SELECT USING (
        current_setting('app.current_user_id', TRUE)::UUID = sender_id 
        OR current_setting('app.current_user_id', TRUE)::UUID = recipient_id 
        OR (is_broadcast = true AND current_setting('app.current_user_id', TRUE)::UUID IN (SELECT responsavel_id FROM contracts))
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (current_setting('app.current_user_id', TRUE)::UUID = sender_id);
