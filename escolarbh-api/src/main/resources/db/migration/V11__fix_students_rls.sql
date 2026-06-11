-- ============================================================
-- V11: Fix infinite recursion in students RLS
-- ============================================================
-- A política antiga fazia um SELECT id FROM students s dentro
-- da própria policy da tabela students, causando loop infinito.
-- Trocamos por um EXISTS que não refaz o SELECT na tabela.
-- ============================================================

DROP POLICY IF EXISTS students_driver_access ON students;

CREATE POLICY students_driver_access ON students
    FOR SELECT
    USING (
        current_setting('app.current_user_role', TRUE) = 'MOTORISTA'
        AND EXISTS (
            SELECT 1 FROM contracts c
            INNER JOIN drivers_profiles dp ON dp.id = c.driver_id
            WHERE c.responsavel_id = students.responsavel_id
            AND dp.user_id = current_setting('app.current_user_id', TRUE)::UUID
            AND c.status = 'ATIVO'
        )
    );
