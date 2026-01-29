-- ==============================================
-- HABILITAR REALTIME EN TABLA PROFILES
-- ==============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Habilitar la publicación de Realtime para la tabla profiles
-- Esto permite que los clientes se suscriban a cambios en la tabla

-- Primero, verificar si la publicación existe
DO $$
BEGIN
  -- Agregar la tabla profiles a la publicación de realtime
  -- Si ya existe, esto no causará error
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    RAISE NOTICE 'Tabla profiles agregada a supabase_realtime';
  ELSE
    RAISE NOTICE 'Tabla profiles ya está en supabase_realtime';
  END IF;
END
$$;

-- 2. Verificar que la tabla está en la publicación
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ==============================================
-- NOTA: También puedes habilitar Realtime desde el Dashboard:
-- 1. Ve a Database -> Replication
-- 2. Encuentra la publicación "supabase_realtime"
-- 3. Agrega la tabla "profiles"
-- ==============================================
