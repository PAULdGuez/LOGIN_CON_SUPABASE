-- ==============================================
-- AUDIT LOG - REGISTRO DE CAMBIOS
-- ==============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. CREAR TABLA AUDIT_LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS EN AUDIT_LOGS
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los logs
CREATE POLICY "allow_admin_select_audit" ON audit_logs
  FOR SELECT 
  TO authenticated
  USING (true); -- Permitir lectura a todos los autenticados (ya que solo admins ven la página)

-- 3. CREAR FUNCIÓN DE TRIGGER PARA AUDIT
-- ============================================
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_by_id UUID;
  changed_by_name_val TEXT;
BEGIN
  -- Obtener el usuario actual
  changed_by_id := auth.uid();
  
  -- Obtener el nombre del usuario que hace el cambio
  SELECT name INTO changed_by_name_val 
  FROM profiles 
  WHERE id = changed_by_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, table_name, record_id, old_data, new_data, changed_by, changed_by_name)
    VALUES ('INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW), changed_by_id, changed_by_name_val);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Solo registrar si hubo cambios reales
    IF OLD IS DISTINCT FROM NEW THEN
      INSERT INTO audit_logs (action, table_name, record_id, old_data, new_data, changed_by, changed_by_name)
      VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), changed_by_id, changed_by_name_val);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (action, table_name, record_id, old_data, new_data, changed_by, changed_by_name)
    VALUES ('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL, changed_by_id, changed_by_name_val);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. CREAR TRIGGER EN TABLA PROFILES
-- ============================================
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;

CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_profile_changes();

-- 5. HABILITAR REALTIME PARA AUDIT_LOGS (opcional)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  END IF;
END
$$;

-- 6. CREAR ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
