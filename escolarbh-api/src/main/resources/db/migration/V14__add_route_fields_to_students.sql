-- Adiciona campos de logística de rota na tabela de students
ALTER TABLE students
ADD COLUMN turno VARCHAR(20) DEFAULT 'MANHA',
ADD COLUMN ordem_rota INTEGER;

COMMENT ON COLUMN students.turno IS 'Turno escolar do aluno (MANHA, TARDE, INTEGRAL)';
COMMENT ON COLUMN students.ordem_rota IS 'Posição do aluno na rota otimizada pelo sistema';
