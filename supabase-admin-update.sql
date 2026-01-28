-- ==============================================
-- FUNCIÓN RPC PARA ACTUALIZAR PERFIL (Admin)
-- ==============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- Función para actualizar el perfil de un usuario (solo admins)
CREATE OR REPLACE FUNCTION admin_update_profile(
  target_user_id UUID,
  new_name TEXT,
  new_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin only.';
  END IF;
  
  -- Validar rol
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin.';
  END IF;
  
  -- Actualizar el perfil
  UPDATE profiles 
  SET name = new_name, role = new_role 
  WHERE id = target_user_id;
END;
$$;
