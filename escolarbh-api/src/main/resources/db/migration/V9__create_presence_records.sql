-- V9__create_presence_records.sql

CREATE TABLE presence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    status VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8)
);

-- Habilitar RLS
ALTER TABLE presence_records ENABLE ROW LEVEL SECURITY;

-- Pai só vê registros de seus filhos (via join com student)
CREATE POLICY "Pai pode visualizar presenca de seus dependentes"
ON presence_records FOR SELECT
USING (
    student_id IN (
        SELECT id FROM students WHERE responsavel_id = (current_setting('app.current_user_id', TRUE)::UUID)
    )
);

-- Motorista pode visualizar registros que ele mesmo criou
CREATE POLICY "Motorista pode visualizar seus registros"
ON presence_records FOR SELECT
USING (driver_id = (current_setting('app.current_user_id', TRUE)::UUID));

-- Motorista pode inserir registros para si
CREATE POLICY "Motorista pode inserir registros"
ON presence_records FOR INSERT
WITH CHECK (driver_id = (current_setting('app.current_user_id', TRUE)::UUID));
