-- ==============================================
-- CORRECCIÓN COMPLETA DE RLS PARA TABLA PROFILES
-- ==============================================
-- IMPORTANTE: Ejecutar TODO este script en el SQL Editor de Supabase

-- 1. DESACTIVAR RLS TEMPORALMENTE (para limpiar)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;

-- 3. REACTIVAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICA SIMPLE: TODOS LOS AUTENTICADOS PUEDEN VER TODOS LOS PERFILES
-- Esta política NO causa recursión porque no consulta otras tablas
CREATE POLICY "allow_select_all" ON profiles
  FOR SELECT 
  TO authenticated
  USING (true);

-- 5. CREAR POLÍTICA: USUARIOS PUEDEN INSERTAR SU PROPIO PERFIL
CREATE POLICY "allow_insert_own" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6. CREAR POLÍTICA: USUARIOS PUEDEN ACTUALIZAR SU PROPIO PERFIL
CREATE POLICY "allow_update_own" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. CREAR POLÍTICA: USUARIOS PUEDEN ELIMINAR SU PROPIO PERFIL
CREATE POLICY "allow_delete_own" ON profiles
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar este script, las políticas deben ser:
-- - allow_select_all: SELECT para autenticados
-- - allow_insert_own: INSERT solo tu propio registro
-- - allow_update_own: UPDATE solo tu propio registro  
-- - allow_delete_own: DELETE solo tu propio registro

-- Las operaciones de ADMIN (editar/eliminar otros usuarios) 
-- se hacen mediante funciones RPC con SECURITY DEFINER
