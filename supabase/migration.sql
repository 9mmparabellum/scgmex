-- =============================================================================
-- SCGMEX - Sistema de Contabilidad Gubernamental de Mexico
-- Migracion Fase 1: Tablas base, funciones, triggers y datos semilla
-- Compatible con Supabase SQL Editor (esquema public)
-- =============================================================================

-- =============================================
-- SECCION 1: CREACION DE TABLAS
-- =============================================

-- ---------------------------------------------
-- 1.1 Ente Publico
-- Representa la entidad gubernamental que opera el sistema.
-- Puede ser un municipio, estado, dependencia federal, etc.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ente_publico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  nombre_corto VARCHAR(100),
  nivel_gobierno VARCHAR(20) NOT NULL CHECK (nivel_gobierno IN ('federal', 'estatal', 'municipal')),
  tipo_ente VARCHAR(30) NOT NULL CHECK (tipo_ente IN ('ejecutivo', 'legislativo', 'judicial', 'autonomo', 'paraestatal', 'municipio', 'alcaldia')),
  entidad_federativa VARCHAR(100),
  municipio VARCHAR(100),
  rfc VARCHAR(13),
  domicilio TEXT,
  titular VARCHAR(200),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ente_publico IS 'Entidades publicas que utilizan el sistema contable gubernamental';

-- ---------------------------------------------
-- 1.2 Ejercicio Fiscal
-- Representa un ano fiscal completo para un ente publico.
-- Normalmente del 1 de enero al 31 de diciembre.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ejercicio_fiscal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_cierre', 'cerrado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, anio)
);

COMMENT ON TABLE ejercicio_fiscal IS 'Ejercicios fiscales anuales por ente publico';

-- ---------------------------------------------
-- 1.3 Periodo Contable
-- Cada ejercicio fiscal se divide en 13 periodos:
-- 12 meses naturales + 1 periodo de ajustes (periodo 13).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS periodo_contable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 13),
  nombre VARCHAR(50) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ejercicio_id, numero)
);

COMMENT ON TABLE periodo_contable IS 'Periodos contables mensuales dentro de cada ejercicio fiscal (12 meses + periodo de ajustes)';

-- ---------------------------------------------
-- 1.4 Plan de Cuentas (CONAC)
-- Catalogo de cuentas contables conforme al Plan de Cuentas
-- emitido por el CONAC. Estructura jerarquica de 5 niveles:
-- Nivel 1: Genero, Nivel 2: Grupo, Nivel 3: Rubro,
-- Nivel 4: Cuenta, Nivel 5: Subcuenta.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS plan_de_cuentas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 5),
  tipo_cuenta VARCHAR(30) NOT NULL CHECK (tipo_cuenta IN ('activo', 'pasivo', 'hacienda', 'ingresos', 'gastos', 'cierre', 'orden_contable', 'orden_presupuestario')),
  naturaleza VARCHAR(10) NOT NULL CHECK (naturaleza IN ('deudora', 'acreedora')),
  padre_id UUID REFERENCES plan_de_cuentas(id),
  es_detalle BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, codigo)
);

COMMENT ON TABLE plan_de_cuentas IS 'Plan de cuentas contables conforme al CONAC con estructura jerarquica de 5 niveles';

-- ---------------------------------------------
-- 1.5 Clasificador Presupuestal
-- Clasificadores presupuestales armonizados conforme a la LGCG:
-- Administrativo, Economico, Funcional, Programatico,
-- Objeto del Gasto, Geografico y Fuente de Financiamiento.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS clasificador_presupuestal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  tipo VARCHAR(40) NOT NULL CHECK (tipo IN ('administrativo', 'economico', 'funcional', 'programatico', 'objeto_gasto', 'geografico', 'fuente_financiamiento')),
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  padre_id UUID REFERENCES clasificador_presupuestal(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, tipo, codigo)
);

COMMENT ON TABLE clasificador_presupuestal IS 'Clasificadores presupuestales armonizados (COG, funcional, fuente de financiamiento, etc.)';

-- ---------------------------------------------
-- 1.6 Matriz de Conversion (Articulo 41 LGCG)
-- Vincula los clasificadores presupuestales con las cuentas
-- contables, permitiendo el registro automatico contable
-- a partir de los momentos presupuestarios.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS matriz_conversion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  clasificador_id UUID NOT NULL REFERENCES clasificador_presupuestal(id),
  momento VARCHAR(30) NOT NULL CHECK (momento IN ('aprobado', 'modificado', 'comprometido', 'devengado', 'ejercido', 'pagado', 'estimado', 'recaudado')),
  cuenta_cargo_id UUID NOT NULL REFERENCES plan_de_cuentas(id),
  cuenta_abono_id UUID NOT NULL REFERENCES plan_de_cuentas(id),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, clasificador_id, momento)
);

COMMENT ON TABLE matriz_conversion IS 'Matriz de conversion Art. 41 LGCG: vincula momentos presupuestarios con asientos contables';

-- ---------------------------------------------
-- 1.7 Bitacora (Log de Auditoria)
-- Registro de todas las operaciones de escritura
-- realizadas en el sistema para fines de auditoria.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID,
  usuario_email VARCHAR(200),
  accion VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  tabla VARCHAR(100) NOT NULL,
  registro_id TEXT,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE bitacora IS 'Bitacora de auditoria: registra todas las operaciones INSERT, UPDATE y DELETE del sistema';


-- =============================================
-- SECCION 2: INDICES
-- =============================================

-- Indices para plan_de_cuentas
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_ente_nivel ON plan_de_cuentas(ente_id, nivel);
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_padre ON plan_de_cuentas(padre_id);

-- Indices para clasificador_presupuestal
CREATE INDEX IF NOT EXISTS idx_clasificador_ente_tipo ON clasificador_presupuestal(ente_id, tipo);

-- Indices para bitacora
CREATE INDEX IF NOT EXISTS idx_bitacora_created_at ON bitacora(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_tabla ON bitacora(tabla);

-- Indices para ejercicio_fiscal
CREATE INDEX IF NOT EXISTS idx_ejercicio_ente ON ejercicio_fiscal(ente_id);

-- Indices para periodo_contable
CREATE INDEX IF NOT EXISTS idx_periodo_ejercicio ON periodo_contable(ejercicio_id);


-- =============================================
-- SECCION 3: FUNCIONES Y TRIGGERS
-- =============================================

-- ---------------------------------------------
-- 3.1 Funcion para actualizar updated_at automaticamente
-- Se dispara antes de cada UPDATE en tablas que tienen
-- la columna updated_at.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_updated_at() IS 'Actualiza automaticamente la columna updated_at en cada UPDATE';

-- Aplicar trigger de updated_at a las tablas correspondientes
CREATE OR REPLACE TRIGGER trg_ente_publico_updated_at
  BEFORE UPDATE ON ente_publico
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE OR REPLACE TRIGGER trg_ejercicio_fiscal_updated_at
  BEFORE UPDATE ON ejercicio_fiscal
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE OR REPLACE TRIGGER trg_plan_de_cuentas_updated_at
  BEFORE UPDATE ON plan_de_cuentas
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ---------------------------------------------
-- 3.2 Funcion de auditoria (bitacora)
-- Registra automaticamente las operaciones INSERT, UPDATE
-- y DELETE en la tabla bitacora. Captura los datos anteriores
-- y nuevos en formato JSONB.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_registro_id TEXT;
  v_usuario_id UUID;
  v_usuario_email VARCHAR(200);
BEGIN
  -- Intentar obtener el usuario autenticado de Supabase
  BEGIN
    v_usuario_id := auth.uid();
    v_usuario_email := auth.email();
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
    v_usuario_email := NULL;
  END;

  -- Determinar el ID del registro afectado
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id::TEXT;
  ELSE
    v_registro_id := NEW.id::TEXT;
  END IF;

  -- Insertar en bitacora segun la operacion
  IF TG_OP = 'INSERT' THEN
    INSERT INTO bitacora (usuario_id, usuario_email, accion, tabla, registro_id, datos_anteriores, datos_nuevos)
    VALUES (v_usuario_id, v_usuario_email, 'INSERT', TG_TABLE_NAME, v_registro_id, NULL, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO bitacora (usuario_id, usuario_email, accion, tabla, registro_id, datos_anteriores, datos_nuevos)
    VALUES (v_usuario_id, v_usuario_email, 'UPDATE', TG_TABLE_NAME, v_registro_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO bitacora (usuario_id, usuario_email, accion, tabla, registro_id, datos_anteriores, datos_nuevos)
    VALUES (v_usuario_id, v_usuario_email, 'DELETE', TG_TABLE_NAME, v_registro_id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_audit_log() IS 'Funcion generica de auditoria: registra operaciones en la tabla bitacora';

-- Aplicar trigger de auditoria a todas las tablas principales
CREATE OR REPLACE TRIGGER trg_audit_ente_publico
  AFTER INSERT OR UPDATE OR DELETE ON ente_publico
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_ejercicio_fiscal
  AFTER INSERT OR UPDATE OR DELETE ON ejercicio_fiscal
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_periodo_contable
  AFTER INSERT OR UPDATE OR DELETE ON periodo_contable
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_plan_de_cuentas
  AFTER INSERT OR UPDATE OR DELETE ON plan_de_cuentas
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_clasificador_presupuestal
  AFTER INSERT OR UPDATE OR DELETE ON clasificador_presupuestal
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_matriz_conversion
  AFTER INSERT OR UPDATE OR DELETE ON matriz_conversion
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();


-- =============================================
-- SECCION 4: DATOS SEMILLA (SEED DATA)
-- =============================================

-- Se utiliza un bloque DO $$ para poder referenciar el ID
-- del ente publico en todas las inserciones posteriores.

DO $$
DECLARE
  v_ente_id UUID;
  v_ejercicio_id UUID;
  -- Variables para IDs de cuentas de Nivel 1 (Genero)
  v_c1_id UUID;  -- 1 Activo
  v_c2_id UUID;  -- 2 Pasivo
  v_c3_id UUID;  -- 3 Hacienda
  v_c4_id UUID;  -- 4 Ingresos
  v_c5_id UUID;  -- 5 Gastos
  v_c6_id UUID;  -- 6 Cierre
  v_c8_id UUID;  -- 8 Orden Presupuestario
  -- Variables para IDs de cuentas de Nivel 2 (Grupo)
  v_c11_id UUID; v_c12_id UUID;
  v_c21_id UUID; v_c22_id UUID;
  v_c31_id UUID; v_c32_id UUID; v_c33_id UUID;
  v_c41_id UUID; v_c42_id UUID; v_c43_id UUID;
  v_c51_id UUID; v_c52_id UUID; v_c53_id UUID; v_c54_id UUID; v_c55_id UUID;
  v_c61_id UUID;
  v_c81_id UUID; v_c82_id UUID;
BEGIN

  -- -----------------------------------------
  -- 4.1 Insertar Ente Publico de ejemplo
  -- -----------------------------------------
  INSERT INTO ente_publico (clave, nombre, nombre_corto, nivel_gobierno, tipo_ente, entidad_federativa, municipio, titular)
  VALUES ('MUN-001', 'Municipio de Ejemplo', 'Mun. Ejemplo', 'municipal', 'municipio', 'Estado de Mexico', 'Municipio de Ejemplo', 'Presidente Municipal')
  RETURNING id INTO v_ente_id;

  RAISE NOTICE 'Ente publico creado con ID: %', v_ente_id;

  -- -----------------------------------------
  -- 4.2 Insertar Ejercicio Fiscal 2026
  -- -----------------------------------------
  INSERT INTO ejercicio_fiscal (ente_id, anio, fecha_inicio, fecha_fin, estado)
  VALUES (v_ente_id, 2026, '2026-01-01', '2026-12-31', 'abierto')
  RETURNING id INTO v_ejercicio_id;

  RAISE NOTICE 'Ejercicio fiscal 2026 creado con ID: %', v_ejercicio_id;

  -- -----------------------------------------
  -- 4.3 Insertar 13 Periodos Contables para 2026
  -- Meses 1 a 12 + Periodo 13 de Ajustes
  -- -----------------------------------------
  INSERT INTO periodo_contable (ejercicio_id, numero, nombre, fecha_inicio, fecha_fin) VALUES
    (v_ejercicio_id,  1, 'Enero',      '2026-01-01', '2026-01-31'),
    (v_ejercicio_id,  2, 'Febrero',    '2026-02-01', '2026-02-28'),
    (v_ejercicio_id,  3, 'Marzo',      '2026-03-01', '2026-03-31'),
    (v_ejercicio_id,  4, 'Abril',      '2026-04-01', '2026-04-30'),
    (v_ejercicio_id,  5, 'Mayo',       '2026-05-01', '2026-05-31'),
    (v_ejercicio_id,  6, 'Junio',      '2026-06-01', '2026-06-30'),
    (v_ejercicio_id,  7, 'Julio',      '2026-07-01', '2026-07-31'),
    (v_ejercicio_id,  8, 'Agosto',     '2026-08-01', '2026-08-31'),
    (v_ejercicio_id,  9, 'Septiembre', '2026-09-01', '2026-09-30'),
    (v_ejercicio_id, 10, 'Octubre',    '2026-10-01', '2026-10-31'),
    (v_ejercicio_id, 11, 'Noviembre',  '2026-11-01', '2026-11-30'),
    (v_ejercicio_id, 12, 'Diciembre',  '2026-12-01', '2026-12-31'),
    (v_ejercicio_id, 13, 'Ajustes',    '2026-12-01', '2026-12-31');

  RAISE NOTICE 'Periodos contables 1-13 creados para ejercicio 2026';

  -- -----------------------------------------
  -- 4.4 Plan de Cuentas CONAC
  -- Estructura jerarquica de 3 niveles:
  --   Nivel 1: Genero
  --   Nivel 2: Grupo
  --   Nivel 3: Rubro
  -- -----------------------------------------

  -- ========== NIVEL 1: GENERO ==========

  -- 1 - ACTIVO
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '1', 'Activo', 1, 'activo', 'deudora', NULL, false)
  RETURNING id INTO v_c1_id;

  -- 2 - PASIVO
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '2', 'Pasivo', 1, 'pasivo', 'acreedora', NULL, false)
  RETURNING id INTO v_c2_id;

  -- 3 - HACIENDA PUBLICA CONTRIBUIDA
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '3', 'Hacienda Publica Contribuida', 1, 'hacienda', 'acreedora', NULL, false)
  RETURNING id INTO v_c3_id;

  -- 4 - INGRESOS Y OTROS BENEFICIOS
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '4', 'Ingresos y Otros Beneficios', 1, 'ingresos', 'acreedora', NULL, false)
  RETURNING id INTO v_c4_id;

  -- 5 - GASTOS Y OTRAS PERDIDAS
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '5', 'Gastos y Otras Perdidas', 1, 'gastos', 'deudora', NULL, false)
  RETURNING id INTO v_c5_id;

  -- 6 - CUENTAS DE CIERRE CONTABLE
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '6', 'Cuentas de Cierre Contable', 1, 'cierre', 'deudora', NULL, false)
  RETURNING id INTO v_c6_id;

  -- 8 - CUENTAS DE ORDEN PRESUPUESTARIAS
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '8', 'Cuentas de Orden Presupuestarias', 1, 'orden_presupuestario', 'deudora', NULL, false)
  RETURNING id INTO v_c8_id;

  -- ========== NIVEL 2: GRUPO ==========

  -- --- 1. ACTIVO ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '1.1', 'Activo Circulante', 2, 'activo', 'deudora', v_c1_id, false)
  RETURNING id INTO v_c11_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '1.2', 'Activo No Circulante', 2, 'activo', 'deudora', v_c1_id, false)
  RETURNING id INTO v_c12_id;

  -- --- 2. PASIVO ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '2.1', 'Pasivo Circulante', 2, 'pasivo', 'acreedora', v_c2_id, false)
  RETURNING id INTO v_c21_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '2.2', 'Pasivo No Circulante', 2, 'pasivo', 'acreedora', v_c2_id, false)
  RETURNING id INTO v_c22_id;

  -- --- 3. HACIENDA ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '3.1', 'Hacienda Publica Contribuida', 2, 'hacienda', 'acreedora', v_c3_id, false)
  RETURNING id INTO v_c31_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '3.2', 'Hacienda Publica Generada', 2, 'hacienda', 'acreedora', v_c3_id, false)
  RETURNING id INTO v_c32_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '3.3', 'Exceso o Insuficiencia en la Actualizacion de la Hacienda Publica', 2, 'hacienda', 'acreedora', v_c3_id, false)
  RETURNING id INTO v_c33_id;

  -- --- 4. INGRESOS ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '4.1', 'Ingresos de Gestion', 2, 'ingresos', 'acreedora', v_c4_id, false)
  RETURNING id INTO v_c41_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '4.2', 'Participaciones, Aportaciones, Convenios, Incentivos Derivados de la Colaboracion Fiscal y Fondos Distintos de Aportaciones', 2, 'ingresos', 'acreedora', v_c4_id, false)
  RETURNING id INTO v_c42_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '4.3', 'Otros Ingresos y Beneficios', 2, 'ingresos', 'acreedora', v_c4_id, false)
  RETURNING id INTO v_c43_id;

  -- --- 5. GASTOS ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '5.1', 'Gastos de Funcionamiento', 2, 'gastos', 'deudora', v_c5_id, false)
  RETURNING id INTO v_c51_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '5.2', 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', 2, 'gastos', 'deudora', v_c5_id, false)
  RETURNING id INTO v_c52_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '5.3', 'Participaciones y Aportaciones', 2, 'gastos', 'deudora', v_c5_id, false)
  RETURNING id INTO v_c53_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '5.4', 'Intereses, Comisiones y Otros Gastos de la Deuda Publica', 2, 'gastos', 'deudora', v_c5_id, false)
  RETURNING id INTO v_c54_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '5.5', 'Otros Gastos y Perdidas', 2, 'gastos', 'deudora', v_c5_id, false)
  RETURNING id INTO v_c55_id;

  -- --- 6. CIERRE ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '6.1', 'Resumen de Ingresos y Gastos', 2, 'cierre', 'deudora', v_c6_id, false)
  RETURNING id INTO v_c61_id;

  -- --- 8. ORDEN PRESUPUESTARIO ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '8.1', 'Ley de Ingresos', 2, 'orden_presupuestario', 'deudora', v_c8_id, false)
  RETURNING id INTO v_c81_id;

  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle)
  VALUES (v_ente_id, '8.2', 'Presupuesto de Egresos', 2, 'orden_presupuestario', 'deudora', v_c8_id, false)
  RETURNING id INTO v_c82_id;

  -- ========== NIVEL 3: RUBRO ==========

  -- --- 1.1 Activo Circulante ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '1.1.1', 'Efectivo y Equivalentes', 3, 'activo', 'deudora', v_c11_id, false),
    (v_ente_id, '1.1.2', 'Derechos a Recibir Efectivo o Equivalentes', 3, 'activo', 'deudora', v_c11_id, false),
    (v_ente_id, '1.1.3', 'Derechos a Recibir Bienes o Servicios', 3, 'activo', 'deudora', v_c11_id, false),
    (v_ente_id, '1.1.4', 'Inventarios', 3, 'activo', 'deudora', v_c11_id, false),
    (v_ente_id, '1.1.5', 'Almacenes', 3, 'activo', 'deudora', v_c11_id, false),
    (v_ente_id, '1.1.6', 'Estimaciones y Provisiones', 3, 'activo', 'deudora', v_c11_id, false);

  -- --- 1.2 Activo No Circulante ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '1.2.1', 'Inversiones Financieras a Largo Plazo', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.2', 'Derechos a Recibir Efectivo o Equivalentes a Largo Plazo', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.3', 'Bienes Inmuebles, Infraestructura y Construcciones en Proceso', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.4', 'Bienes Muebles', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.5', 'Activos Intangibles', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.6', 'Depreciacion, Deterioro y Amortizacion Acumulada', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.7', 'Activos Diferidos', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.8', 'Estimaciones y Provisiones a Largo Plazo', 3, 'activo', 'deudora', v_c12_id, false),
    (v_ente_id, '1.2.9', 'Otros Activos No Circulantes', 3, 'activo', 'deudora', v_c12_id, false);

  -- --- 2.1 Pasivo Circulante ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '2.1.1', 'Cuentas por Pagar a Corto Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.2', 'Documentos por Pagar a Corto Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.3', 'Porcion a Corto Plazo de la Deuda Publica a Largo Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.4', 'Titulos y Valores a Corto Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.5', 'Pasivos Diferidos a Corto Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.6', 'Fondos y Bienes de Terceros en Garantia', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.7', 'Provisiones a Corto Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false),
    (v_ente_id, '2.1.9', 'Otros Pasivos a Corto Plazo', 3, 'pasivo', 'acreedora', v_c21_id, false);

  -- --- 2.2 Pasivo No Circulante ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '2.2.1', 'Cuentas por Pagar a Largo Plazo', 3, 'pasivo', 'acreedora', v_c22_id, false),
    (v_ente_id, '2.2.2', 'Documentos por Pagar a Largo Plazo', 3, 'pasivo', 'acreedora', v_c22_id, false),
    (v_ente_id, '2.2.3', 'Deuda Publica a Largo Plazo', 3, 'pasivo', 'acreedora', v_c22_id, false),
    (v_ente_id, '2.2.4', 'Pasivos Diferidos a Largo Plazo', 3, 'pasivo', 'acreedora', v_c22_id, false),
    (v_ente_id, '2.2.5', 'Fondos y Bienes de Terceros en Garantia a Largo Plazo', 3, 'pasivo', 'acreedora', v_c22_id, false),
    (v_ente_id, '2.2.6', 'Provisiones a Largo Plazo', 3, 'pasivo', 'acreedora', v_c22_id, false);

  -- --- 3.1 Hacienda Publica Contribuida ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '3.1.1', 'Contribuciones de Capital', 3, 'hacienda', 'acreedora', v_c31_id, false),
    (v_ente_id, '3.1.2', 'Donaciones de Capital', 3, 'hacienda', 'acreedora', v_c31_id, false),
    (v_ente_id, '3.1.3', 'Actualizacion de la Hacienda Publica', 3, 'hacienda', 'acreedora', v_c31_id, false);

  -- --- 3.2 Hacienda Publica Generada ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '3.2.1', 'Resultados del Ejercicio (Ahorro/Desahorro)', 3, 'hacienda', 'acreedora', v_c32_id, false),
    (v_ente_id, '3.2.2', 'Resultados de Ejercicios Anteriores', 3, 'hacienda', 'acreedora', v_c32_id, false),
    (v_ente_id, '3.2.3', 'Revaluas', 3, 'hacienda', 'acreedora', v_c32_id, false),
    (v_ente_id, '3.2.4', 'Reservas', 3, 'hacienda', 'acreedora', v_c32_id, false),
    (v_ente_id, '3.2.5', 'Rectificaciones de Resultados de Ejercicios Anteriores', 3, 'hacienda', 'acreedora', v_c32_id, false);

  -- --- 3.3 Exceso o Insuficiencia ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '3.3.1', 'Resultado por Posicion Monetaria', 3, 'hacienda', 'acreedora', v_c33_id, false),
    (v_ente_id, '3.3.2', 'Resultado por Tenencia de Activos No Monetarios', 3, 'hacienda', 'acreedora', v_c33_id, false);

  -- --- 4.1 Ingresos de Gestion ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '4.1.1', 'Impuestos', 3, 'ingresos', 'acreedora', v_c41_id, false),
    (v_ente_id, '4.1.2', 'Cuotas y Aportaciones de Seguridad Social', 3, 'ingresos', 'acreedora', v_c41_id, false),
    (v_ente_id, '4.1.3', 'Contribuciones de Mejoras', 3, 'ingresos', 'acreedora', v_c41_id, false),
    (v_ente_id, '4.1.4', 'Derechos', 3, 'ingresos', 'acreedora', v_c41_id, false),
    (v_ente_id, '4.1.5', 'Productos de Tipo Corriente', 3, 'ingresos', 'acreedora', v_c41_id, false),
    (v_ente_id, '4.1.6', 'Aprovechamientos de Tipo Corriente', 3, 'ingresos', 'acreedora', v_c41_id, false),
    (v_ente_id, '4.1.7', 'Ingresos por Venta de Bienes, Prestacion de Servicios y Otros', 3, 'ingresos', 'acreedora', v_c41_id, false);

  -- --- 4.2 Participaciones, Aportaciones, etc. ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '4.2.1', 'Participaciones y Aportaciones', 3, 'ingresos', 'acreedora', v_c42_id, false),
    (v_ente_id, '4.2.2', 'Transferencias, Asignaciones, Subsidios y Subvenciones', 3, 'ingresos', 'acreedora', v_c42_id, false),
    (v_ente_id, '4.2.3', 'Pensiones y Jubilaciones', 3, 'ingresos', 'acreedora', v_c42_id, false),
    (v_ente_id, '4.2.4', 'Transferencias del Fondo Mexicano del Petroleo', 3, 'ingresos', 'acreedora', v_c42_id, false);

  -- --- 4.3 Otros Ingresos y Beneficios ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '4.3.1', 'Ingresos Financieros', 3, 'ingresos', 'acreedora', v_c43_id, false),
    (v_ente_id, '4.3.2', 'Incremento por Variacion de Inventarios', 3, 'ingresos', 'acreedora', v_c43_id, false),
    (v_ente_id, '4.3.3', 'Disminucion del Exceso de Estimaciones por Perdida o Deterioro', 3, 'ingresos', 'acreedora', v_c43_id, false),
    (v_ente_id, '4.3.9', 'Otros Ingresos y Beneficios Varios', 3, 'ingresos', 'acreedora', v_c43_id, false);

  -- --- 5.1 Gastos de Funcionamiento ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '5.1.1', 'Servicios Personales', 3, 'gastos', 'deudora', v_c51_id, false),
    (v_ente_id, '5.1.2', 'Materiales y Suministros', 3, 'gastos', 'deudora', v_c51_id, false),
    (v_ente_id, '5.1.3', 'Servicios Generales', 3, 'gastos', 'deudora', v_c51_id, false);

  -- --- 5.2 Transferencias, Asignaciones, Subsidios y Otras Ayudas ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '5.2.1', 'Transferencias Internas y Asignaciones al Sector Publico', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.2', 'Transferencias al Resto del Sector Publico', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.3', 'Subsidios y Subvenciones', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.4', 'Ayudas Sociales', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.5', 'Pensiones y Jubilaciones', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.6', 'Transferencias a Fideicomisos, Mandatos y Contratos Analogos', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.7', 'Transferencias a la Seguridad Social', 3, 'gastos', 'deudora', v_c52_id, false),
    (v_ente_id, '5.2.9', 'Donativos', 3, 'gastos', 'deudora', v_c52_id, false);

  -- --- 5.3 Participaciones y Aportaciones ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '5.3.1', 'Participaciones', 3, 'gastos', 'deudora', v_c53_id, false),
    (v_ente_id, '5.3.2', 'Aportaciones', 3, 'gastos', 'deudora', v_c53_id, false),
    (v_ente_id, '5.3.3', 'Convenios', 3, 'gastos', 'deudora', v_c53_id, false);

  -- --- 5.4 Intereses, Comisiones y Otros Gastos de la Deuda Publica ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '5.4.1', 'Intereses de la Deuda Publica', 3, 'gastos', 'deudora', v_c54_id, false),
    (v_ente_id, '5.4.2', 'Comisiones de la Deuda Publica', 3, 'gastos', 'deudora', v_c54_id, false),
    (v_ente_id, '5.4.3', 'Gastos de la Deuda Publica', 3, 'gastos', 'deudora', v_c54_id, false),
    (v_ente_id, '5.4.4', 'Costo por Coberturas', 3, 'gastos', 'deudora', v_c54_id, false),
    (v_ente_id, '5.4.5', 'Apoyos Financieros', 3, 'gastos', 'deudora', v_c54_id, false);

  -- --- 5.5 Otros Gastos y Perdidas ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '5.5.1', 'Estimaciones, Depreciaciones, Deterioros, Obsolescencia y Amortizaciones', 3, 'gastos', 'deudora', v_c55_id, false),
    (v_ente_id, '5.5.2', 'Provisiones', 3, 'gastos', 'deudora', v_c55_id, false),
    (v_ente_id, '5.5.3', 'Disminucion de Inventarios', 3, 'gastos', 'deudora', v_c55_id, false),
    (v_ente_id, '5.5.4', 'Aumento del Exceso de Estimaciones por Perdida o Deterioro', 3, 'gastos', 'deudora', v_c55_id, false),
    (v_ente_id, '5.5.9', 'Otros Gastos Varios', 3, 'gastos', 'deudora', v_c55_id, false);

  -- --- 6.1 Resumen de Ingresos y Gastos ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '6.1.1', 'Resumen de Ingresos y Gastos', 3, 'cierre', 'deudora', v_c61_id, false);

  -- --- 8.1 Ley de Ingresos ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '8.1.1', 'Ley de Ingresos Estimada', 3, 'orden_presupuestario', 'deudora', v_c81_id, false),
    (v_ente_id, '8.1.2', 'Ley de Ingresos por Ejecutar', 3, 'orden_presupuestario', 'deudora', v_c81_id, false),
    (v_ente_id, '8.1.3', 'Modificaciones a la Ley de Ingresos Estimada', 3, 'orden_presupuestario', 'deudora', v_c81_id, false),
    (v_ente_id, '8.1.4', 'Ley de Ingresos Devengada', 3, 'orden_presupuestario', 'deudora', v_c81_id, false),
    (v_ente_id, '8.1.5', 'Ley de Ingresos Recaudada', 3, 'orden_presupuestario', 'deudora', v_c81_id, false);

  -- --- 8.2 Presupuesto de Egresos ---
  INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
    (v_ente_id, '8.2.1', 'Presupuesto de Egresos Aprobado', 3, 'orden_presupuestario', 'deudora', v_c82_id, false),
    (v_ente_id, '8.2.2', 'Presupuesto de Egresos por Ejercer', 3, 'orden_presupuestario', 'deudora', v_c82_id, false),
    (v_ente_id, '8.2.3', 'Modificaciones al Presupuesto de Egresos Aprobado', 3, 'orden_presupuestario', 'deudora', v_c82_id, false),
    (v_ente_id, '8.2.4', 'Presupuesto de Egresos Comprometido', 3, 'orden_presupuestario', 'deudora', v_c82_id, false),
    (v_ente_id, '8.2.5', 'Presupuesto de Egresos Devengado', 3, 'orden_presupuestario', 'deudora', v_c82_id, false),
    (v_ente_id, '8.2.6', 'Presupuesto de Egresos Ejercido', 3, 'orden_presupuestario', 'deudora', v_c82_id, false),
    (v_ente_id, '8.2.7', 'Presupuesto de Egresos Pagado', 3, 'orden_presupuestario', 'deudora', v_c82_id, false);

  RAISE NOTICE 'Plan de cuentas CONAC insertado exitosamente (3 niveles: Genero, Grupo, Rubro)';

  -- -----------------------------------------
  -- 4.5 Clasificador por Objeto del Gasto (COG) - Nivel 1
  -- Conforme al Clasificador por Objeto del Gasto emitido por el CONAC
  -- -----------------------------------------
  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel) VALUES
    (v_ente_id, 'objeto_gasto', '1000', 'Servicios Personales', 1),
    (v_ente_id, 'objeto_gasto', '2000', 'Materiales y Suministros', 1),
    (v_ente_id, 'objeto_gasto', '3000', 'Servicios Generales', 1),
    (v_ente_id, 'objeto_gasto', '4000', 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', 1),
    (v_ente_id, 'objeto_gasto', '5000', 'Bienes Muebles, Inmuebles e Intangibles', 1),
    (v_ente_id, 'objeto_gasto', '6000', 'Inversion Publica', 1),
    (v_ente_id, 'objeto_gasto', '7000', 'Inversiones Financieras y Otras Provisiones', 1),
    (v_ente_id, 'objeto_gasto', '8000', 'Participaciones y Aportaciones', 1),
    (v_ente_id, 'objeto_gasto', '9000', 'Deuda Publica', 1);

  RAISE NOTICE 'Clasificador por Objeto del Gasto (COG) insertado';

  -- -----------------------------------------
  -- 4.6 Clasificador Funcional del Gasto
  -- Conforme a la Clasificacion Funcional del Gasto del CONAC
  -- -----------------------------------------
  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel) VALUES
    (v_ente_id, 'funcional', '1', 'Gobierno', 1),
    (v_ente_id, 'funcional', '2', 'Desarrollo Social', 1),
    (v_ente_id, 'funcional', '3', 'Desarrollo Economico', 1),
    (v_ente_id, 'funcional', '4', 'Otras No Clasificadas en Funciones Anteriores', 1);

  RAISE NOTICE 'Clasificador Funcional del Gasto insertado';

  -- -----------------------------------------
  -- 4.7 Clasificador por Fuente de Financiamiento
  -- -----------------------------------------
  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel) VALUES
    (v_ente_id, 'fuente_financiamiento', '1', 'Recursos Fiscales', 1),
    (v_ente_id, 'fuente_financiamiento', '2', 'Financiamientos Internos', 1),
    (v_ente_id, 'fuente_financiamiento', '3', 'Financiamientos Externos', 1),
    (v_ente_id, 'fuente_financiamiento', '4', 'Ingresos Propios', 1),
    (v_ente_id, 'fuente_financiamiento', '5', 'Recursos Federales', 1),
    (v_ente_id, 'fuente_financiamiento', '6', 'Recursos Estatales', 1),
    (v_ente_id, 'fuente_financiamiento', '7', 'Otros Recursos', 1);

  RAISE NOTICE 'Clasificador por Fuente de Financiamiento insertado';

  -- -----------------------------------------
  -- Resumen final
  -- -----------------------------------------
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRACION FASE 1 COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tablas creadas: 7';
  RAISE NOTICE 'Ente publico: Municipio de Ejemplo (MUN-001)';
  RAISE NOTICE 'Ejercicio fiscal: 2026';
  RAISE NOTICE 'Periodos contables: 13';
  RAISE NOTICE 'Cuentas CONAC: 3 niveles (Genero, Grupo, Rubro)';
  RAISE NOTICE 'Clasificadores: COG (9), Funcional (4), Fuente (7)';
  RAISE NOTICE '============================================';

END $$;

-- =============================================================================
-- FASE 2: Motor Contable (Modulo M3)
-- Tablas: poliza, movimiento_contable, saldo_cuenta
-- Funciones: fn_siguiente_numero_poliza, fn_actualizar_saldos
-- =============================================================================

-- ---------------------------------------------
-- 2.1 Poliza Contable
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS poliza (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodo_contable(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'diario', 'ajuste', 'cierre')),
  numero_poliza INTEGER NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'pendiente', 'aprobada', 'cancelada')),
  total_debe NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_haber NUMERIC(18,2) NOT NULL DEFAULT 0,
  aprobado_por UUID,
  aprobado_en TIMESTAMPTZ,
  cancelado_por UUID,
  cancelado_en TIMESTAMPTZ,
  motivo_cancelacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, tipo, numero_poliza)
);

-- ---------------------------------------------
-- 2.2 Movimiento Contable
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS movimiento_contable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poliza_id UUID NOT NULL REFERENCES poliza(id) ON DELETE CASCADE,
  numero_linea INTEGER NOT NULL,
  cuenta_id UUID NOT NULL REFERENCES plan_de_cuentas(id),
  concepto VARCHAR(500) NOT NULL,
  debe NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (debe >= 0),
  haber NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (haber >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poliza_id, numero_linea),
  CHECK (debe > 0 OR haber > 0),
  CHECK (NOT (debe > 0 AND haber > 0))
);

-- ---------------------------------------------
-- 2.3 Saldo de Cuenta (materializado)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS saldo_cuenta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodo_contable(id) ON DELETE CASCADE,
  cuenta_id UUID NOT NULL REFERENCES plan_de_cuentas(id),
  saldo_inicial NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_debe NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_haber NUMERIC(18,2) NOT NULL DEFAULT 0,
  saldo_final NUMERIC(18,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, periodo_id, cuenta_id)
);

-- ---------------------------------------------
-- 2.4 Indices
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS idx_poliza_ente_ejercicio ON poliza(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_poliza_periodo ON poliza(periodo_id);
CREATE INDEX IF NOT EXISTS idx_poliza_estado ON poliza(estado);
CREATE INDEX IF NOT EXISTS idx_poliza_tipo ON poliza(tipo);
CREATE INDEX IF NOT EXISTS idx_poliza_fecha ON poliza(fecha);
CREATE INDEX IF NOT EXISTS idx_movimiento_poliza ON movimiento_contable(poliza_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_cuenta ON movimiento_contable(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_saldo_ente_ejercicio_periodo ON saldo_cuenta(ente_id, ejercicio_id, periodo_id);
CREATE INDEX IF NOT EXISTS idx_saldo_cuenta ON saldo_cuenta(cuenta_id);

-- ---------------------------------------------
-- 2.5 Funcion: Siguiente numero de poliza
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_siguiente_numero_poliza(
  p_ente_id UUID,
  p_ejercicio_id UUID,
  p_tipo VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_siguiente INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_poliza), 0) + 1
    INTO v_siguiente
    FROM poliza
   WHERE ente_id = p_ente_id
     AND ejercicio_id = p_ejercicio_id
     AND tipo = p_tipo;
  RETURN v_siguiente;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- 2.6 Funcion: Actualizar saldos al aprobar poliza
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_actualizar_saldos(p_poliza_id UUID)
RETURNS VOID AS $$
DECLARE
  v_poliza RECORD;
  v_mov RECORD;
BEGIN
  SELECT * INTO v_poliza FROM poliza WHERE id = p_poliza_id AND estado = 'aprobada';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poliza no encontrada o no aprobada: %', p_poliza_id;
  END IF;

  FOR v_mov IN
    SELECT mc.cuenta_id, mc.debe, mc.haber, pc.naturaleza
      FROM movimiento_contable mc
      JOIN plan_de_cuentas pc ON pc.id = mc.cuenta_id
     WHERE mc.poliza_id = p_poliza_id
  LOOP
    INSERT INTO saldo_cuenta (ente_id, ejercicio_id, periodo_id, cuenta_id, saldo_inicial, total_debe, total_haber, saldo_final)
    VALUES (v_poliza.ente_id, v_poliza.ejercicio_id, v_poliza.periodo_id, v_mov.cuenta_id, 0, v_mov.debe, v_mov.haber, 0)
    ON CONFLICT (ente_id, ejercicio_id, periodo_id, cuenta_id)
    DO UPDATE SET
      total_debe = saldo_cuenta.total_debe + EXCLUDED.total_debe,
      total_haber = saldo_cuenta.total_haber + EXCLUDED.total_haber,
      updated_at = now();

    UPDATE saldo_cuenta
       SET saldo_final = CASE
             WHEN v_mov.naturaleza = 'deudora'
             THEN saldo_inicial + total_debe - total_haber
             ELSE saldo_inicial - total_debe + total_haber
           END
     WHERE ente_id = v_poliza.ente_id
       AND ejercicio_id = v_poliza.ejercicio_id
       AND periodo_id = v_poliza.periodo_id
       AND cuenta_id = v_mov.cuenta_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- 2.7 Triggers
-- ---------------------------------------------
CREATE OR REPLACE TRIGGER trg_poliza_updated_at
  BEFORE UPDATE ON poliza
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE OR REPLACE TRIGGER trg_audit_poliza
  AFTER INSERT OR UPDATE OR DELETE ON poliza
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_movimiento_contable
  AFTER INSERT OR UPDATE OR DELETE ON movimiento_contable
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_saldo_cuenta
  AFTER INSERT OR UPDATE OR DELETE ON saldo_cuenta
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- =============================================================================
-- FASE 3: Presupuesto de Egresos (M4) e Ingresos (M5)
-- Tablas: partida_egreso, movimiento_presupuestal_egreso, concepto_ingreso, movimiento_presupuestal_ingreso
-- =============================================================================

-- ---------------------------------------------
-- 3.1 Partida de Egreso
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS partida_egreso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clasificador_id UUID NOT NULL REFERENCES clasificador_presupuestal(id),
  fuente_id UUID REFERENCES clasificador_presupuestal(id),
  clave VARCHAR(30) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, clave)
);

-- ---------------------------------------------
-- 3.2 Movimiento Presupuestal de Egreso
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS movimiento_presupuestal_egreso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partida_id UUID NOT NULL REFERENCES partida_egreso(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodo_contable(id),
  momento VARCHAR(20) NOT NULL CHECK (momento IN ('aprobado','modificado','comprometido','devengado','ejercido','pagado')),
  tipo_movimiento VARCHAR(20) NOT NULL DEFAULT 'original' CHECK (tipo_movimiento IN ('original','adicion','reduccion')),
  monto NUMERIC(18,2) NOT NULL CHECK (monto >= 0),
  descripcion VARCHAR(500),
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- 3.3 Concepto de Ingreso
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS concepto_ingreso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clasificador_id UUID NOT NULL REFERENCES clasificador_presupuestal(id),
  clave VARCHAR(30) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, clave)
);

-- ---------------------------------------------
-- 3.4 Movimiento Presupuestal de Ingreso
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS movimiento_presupuestal_ingreso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto_id UUID NOT NULL REFERENCES concepto_ingreso(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodo_contable(id),
  momento VARCHAR(20) NOT NULL CHECK (momento IN ('estimado','modificado','devengado','recaudado')),
  tipo_movimiento VARCHAR(20) NOT NULL DEFAULT 'original' CHECK (tipo_movimiento IN ('original','adicion','reduccion')),
  monto NUMERIC(18,2) NOT NULL CHECK (monto >= 0),
  descripcion VARCHAR(500),
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------
-- 3.5 Indices
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS idx_partida_egreso_ente_ejercicio ON partida_egreso(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_partida_egreso_clasificador ON partida_egreso(clasificador_id);
CREATE INDEX IF NOT EXISTS idx_mov_egreso_partida ON movimiento_presupuestal_egreso(partida_id);
CREATE INDEX IF NOT EXISTS idx_mov_egreso_periodo ON movimiento_presupuestal_egreso(periodo_id);
CREATE INDEX IF NOT EXISTS idx_concepto_ingreso_ente_ejercicio ON concepto_ingreso(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_concepto_ingreso_clasificador ON concepto_ingreso(clasificador_id);
CREATE INDEX IF NOT EXISTS idx_mov_ingreso_concepto ON movimiento_presupuestal_ingreso(concepto_id);
CREATE INDEX IF NOT EXISTS idx_mov_ingreso_periodo ON movimiento_presupuestal_ingreso(periodo_id);

-- ---------------------------------------------
-- 3.6 Triggers
-- ---------------------------------------------

-- updated_at para partida_egreso y concepto_ingreso
CREATE OR REPLACE TRIGGER trg_partida_egreso_updated_at
  BEFORE UPDATE ON partida_egreso
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE OR REPLACE TRIGGER trg_concepto_ingreso_updated_at
  BEFORE UPDATE ON concepto_ingreso
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- Auditoria para las 4 tablas de Fase 3
CREATE OR REPLACE TRIGGER trg_audit_partida_egreso
  AFTER INSERT OR UPDATE OR DELETE ON partida_egreso
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_movimiento_presupuestal_egreso
  AFTER INSERT OR UPDATE OR DELETE ON movimiento_presupuestal_egreso
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_concepto_ingreso
  AFTER INSERT OR UPDATE OR DELETE ON concepto_ingreso
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_movimiento_presupuestal_ingreso
  AFTER INSERT OR UPDATE OR DELETE ON movimiento_presupuestal_ingreso
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ═══════════════════════════════════════════════════════════════════════
-- FASE 4: PATRIMONIO, DEUDA, FONDOS FEDERALES
-- ═══════════════════════════════════════════════════════════════════════

-- ── M6: Patrimonio ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bien_patrimonial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clave VARCHAR(30) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('mueble', 'inmueble', 'intangible')),
  fecha_adquisicion DATE NOT NULL,
  valor_adquisicion NUMERIC(18,2) NOT NULL DEFAULT 0,
  depreciacion_acumulada NUMERIC(18,2) NOT NULL DEFAULT 0,
  vida_util_anios INTEGER,
  tasa_depreciacion NUMERIC(5,2),
  ubicacion VARCHAR(300),
  responsable VARCHAR(200),
  numero_serie VARCHAR(100),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'baja', 'transferido', 'en_comodato')),
  cuenta_contable_id UUID REFERENCES plan_de_cuentas(id),
  fecha_baja DATE,
  motivo_baja VARCHAR(500),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, clave)
);

CREATE TABLE IF NOT EXISTS inventario_conteo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  periodo_id UUID REFERENCES periodo_contable(id),
  clave VARCHAR(30) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  fecha_conteo DATE NOT NULL,
  responsable VARCHAR(200),
  ubicacion VARCHAR(300),
  total_bienes INTEGER DEFAULT 0,
  valor_total NUMERIC(18,2) DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_proceso', 'finalizado')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, clave)
);

CREATE TABLE IF NOT EXISTS fideicomiso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clave VARCHAR(30) NOT NULL,
  nombre VARCHAR(300) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('administracion', 'inversion', 'garantia', 'traslativo', 'otro')),
  mandante VARCHAR(300),
  fiduciario VARCHAR(300),
  fideicomisario VARCHAR(300),
  monto_patrimonio NUMERIC(18,2) NOT NULL DEFAULT 0,
  fecha_constitucion DATE NOT NULL,
  fecha_extincion DATE,
  vigencia_anios INTEGER,
  objeto TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente', 'en_extincion', 'extinto')),
  cuenta_contable_id UUID REFERENCES plan_de_cuentas(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, clave)
);

-- ── M7: Deuda Publica ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS instrumento_deuda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clave VARCHAR(30) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('credito', 'emision', 'otro')),
  acreedor VARCHAR(300) NOT NULL,
  monto_original NUMERIC(18,2) NOT NULL,
  saldo_vigente NUMERIC(18,2) NOT NULL DEFAULT 0,
  tasa_interes NUMERIC(8,4),
  tipo_tasa VARCHAR(20) CHECK (tipo_tasa IN ('fija', 'variable', 'mixta')),
  plazo_meses INTEGER,
  fecha_contratacion DATE NOT NULL,
  fecha_vencimiento DATE,
  moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
  destino_recursos TEXT,
  garantia VARCHAR(300),
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente', 'pagado', 'reestructurado', 'refinanciado')),
  cuenta_contable_id UUID REFERENCES plan_de_cuentas(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, clave)
);

CREATE TABLE IF NOT EXISTS movimiento_deuda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instrumento_id UUID NOT NULL REFERENCES instrumento_deuda(id) ON DELETE CASCADE,
  periodo_id UUID REFERENCES periodo_contable(id),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('disposicion', 'amortizacion', 'pago_intereses', 'comision', 'reestructura', 'otro')),
  monto NUMERIC(18,2) NOT NULL CHECK (monto >= 0),
  fecha DATE NOT NULL,
  descripcion VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── M11: Fondos Federales ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fondo_federal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clave VARCHAR(30) NOT NULL,
  nombre VARCHAR(300) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('participacion', 'aportacion', 'subsidio', 'convenio', 'otro')),
  fuente VARCHAR(300),
  monto_asignado NUMERIC(18,2) NOT NULL DEFAULT 0,
  monto_recibido NUMERIC(18,2) NOT NULL DEFAULT 0,
  monto_ejercido NUMERIC(18,2) NOT NULL DEFAULT 0,
  monto_reintegrado NUMERIC(18,2) NOT NULL DEFAULT 0,
  fecha_asignacion DATE,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'reintegrado')),
  clasificador_id UUID REFERENCES clasificador_presupuestal(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, clave)
);

-- ── Indices Fase 4 ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bien_patrimonial_ente_ejercicio ON bien_patrimonial(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_bien_patrimonial_tipo ON bien_patrimonial(tipo);
CREATE INDEX IF NOT EXISTS idx_inventario_conteo_ente_ejercicio ON inventario_conteo(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_fideicomiso_ente_ejercicio ON fideicomiso(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_instrumento_deuda_ente_ejercicio ON instrumento_deuda(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_deuda_instrumento ON movimiento_deuda(instrumento_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_deuda_periodo ON movimiento_deuda(periodo_id);
CREATE INDEX IF NOT EXISTS idx_fondo_federal_ente_ejercicio ON fondo_federal(ente_id, ejercicio_id);

-- ── Triggers updated_at Fase 4 ──────────────────────────────────────

CREATE TRIGGER trg_bien_patrimonial_updated_at
  BEFORE UPDATE ON bien_patrimonial FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_inventario_conteo_updated_at
  BEFORE UPDATE ON inventario_conteo FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_fideicomiso_updated_at
  BEFORE UPDATE ON fideicomiso FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_instrumento_deuda_updated_at
  BEFORE UPDATE ON instrumento_deuda FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_fondo_federal_updated_at
  BEFORE UPDATE ON fondo_federal FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── Triggers audit Fase 4 ───────────────────────────────────────────

CREATE TRIGGER trg_audit_bien_patrimonial
  AFTER INSERT OR UPDATE OR DELETE ON bien_patrimonial FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_inventario_conteo
  AFTER INSERT OR UPDATE OR DELETE ON inventario_conteo FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_fideicomiso
  AFTER INSERT OR UPDATE OR DELETE ON fideicomiso FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_instrumento_deuda
  AFTER INSERT OR UPDATE OR DELETE ON instrumento_deuda FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_movimiento_deuda
  AFTER INSERT OR UPDATE OR DELETE ON movimiento_deuda FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_fondo_federal
  AFTER INSERT OR UPDATE OR DELETE ON fondo_federal FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
