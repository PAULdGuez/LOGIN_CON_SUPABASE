-- ==============================================
-- CORRECCIÓN DE POLÍTICAS RLS (Sin Recursión)
-- ==============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- para corregir el problema de recursión de políticas

-- 1. ELIMINAR POLÍTICAS ANTERIORES
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- 2. CREAR NUEVAS POLÍTICAS SIN RECURSIÓN
-- ============================================

-- Todos los usuarios autenticados pueden ver todos los perfiles
-- (Esto evita la recursión y es seguro para esta app de práctica)
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT 
  TO authenticated
  USING (true);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Cualquier usuario autenticado puede insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Solo el propio usuario puede eliminar su perfil
-- (Los admins usarán funciones RPC con SECURITY DEFINER)
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- NOTA: Las operaciones de admin (editar otros usuarios, 
-- cambiar roles, eliminar usuarios) se realizan mediante
-- funciones RPC con SECURITY DEFINER que ya creaste antes.
-- ============================================
