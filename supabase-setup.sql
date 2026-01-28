-- ==============================================
-- CONFIGURACIÓN DE SUPABASE PARA PRÁCTICA CRUD
-- ==============================================
-- Ejecutar este script en el SQL Editor de Supabase Dashboard

-- 1. CREAR TABLA DE PERFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURIDAD
-- ============================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins pueden insertar perfiles
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = id
  );

-- Admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. FUNCIONES RPC
-- ============================================

-- Función para obtener emails de usuarios (solo admins)
CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE(id UUID, email TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin only.';
  END IF;
  
  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au;
END;
$$;

-- Función para actualizar contraseña de usuario (solo admins)
CREATE OR REPLACE FUNCTION update_user_password(user_id UUID, new_password TEXT)
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
  
  -- Actualizar contraseña usando la API de auth
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id;
END;
$$;

-- Función para eliminar usuario (solo admins)
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
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
  
  -- No permitir que un admin se elimine a sí mismo
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself.';
  END IF;
  
  -- Eliminar de auth.users (el perfil se eliminará en cascada)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Función para cambiar rol de usuario (solo admins)
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
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
  
  UPDATE profiles SET role = new_role WHERE id = user_id;
END;
$$;

-- 5. TRIGGER PARA CREAR PERFIL AL REGISTRARSE
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Crear trigger (eliminar si existe primero)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. CREAR USUARIO ADMINISTRADOR INICIAL
-- ============================================
-- IMPORTANTE: Primero crea un usuario normalmente desde la app,
-- luego ejecuta este comando reemplazando 'TU_EMAIL' con el email del usuario:
-- 
-- UPDATE profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'TU_EMAIL'
-- );
