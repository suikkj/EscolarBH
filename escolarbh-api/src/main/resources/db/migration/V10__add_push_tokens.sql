-- ============================================================
-- V10: Adição do Push Token em USERS
-- ============================================================

-- Adiciona a coluna push_token para armazenar o token do Firebase Cloud Messaging (FCM)
ALTER TABLE users ADD COLUMN push_token VARCHAR(255);

-- Opcional: comentário na coluna
COMMENT ON COLUMN users.push_token IS 'Token do aparelho para recebimento de Push Notifications (Firebase/Expo)';
