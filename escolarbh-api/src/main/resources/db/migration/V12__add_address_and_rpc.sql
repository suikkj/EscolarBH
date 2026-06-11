-- ============================================================
-- V4: Adição de Endereço em USERS e RPC para Login via CPF
-- ============================================================

-- Adicionar campos de endereço na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS cep VARCHAR(9),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS rua VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);

-- Comentários
COMMENT ON COLUMN users.cep IS 'CEP no formato 00000-000';

-- ============================================================
-- FUNÇÃO RPC: Buscar email pelo CPF ignorando RLS
-- ============================================================
-- Para permitir que um usuário anônimo no frontend consiga saber
-- qual o email atrelado a um CPF digitado na tela de login, e
-- então realizar o signInWithPassword.

CREATE OR REPLACE FUNCTION get_email_by_cpf(p_cpf VARCHAR)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Garante que roda com privilégios do dono (ignora RLS do 'users')
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.users
    WHERE cpf = p_cpf
    LIMIT 1;
    
    RETURN v_email;
END;
$$;

-- Permite acesso a esta funcao
GRANT EXECUTE ON FUNCTION get_email_by_cpf(VARCHAR) TO public;
