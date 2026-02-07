-- =============================================================================
-- SCGMEX - Sistema de Contabilidad Gubernamental de Mexico
-- Migracion Batches 3-6: Adquisiciones, Nomina, Obra Publica, Recaudacion,
--   Obligaciones, Portal Transparencia, CFDI, e.Firma y Anomalias
-- Compatible con Supabase SQL Editor (esquema public)
-- =============================================================================
-- NOTA: Los Batches 1 y 2 ya existen en migration.sql.
--       Este archivo crea SOLO las tablas nuevas de los Batches 3 a 6.
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- FUNCION AUXILIAR: update_updated_at (idempotente)
-- Dispara la actualizacion automatica de la columna updated_at.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Actualiza automaticamente updated_at en cada UPDATE (alias de fn_updated_at)';


-- ═══════════════════════════════════════════════════════════════════════
-- BATCH 3: ADQUISICIONES + NOMINA
-- Modulos de proveedores, requisiciones, ordenes de compra,
-- empleados, conceptos de nomina, tabuladores y periodos de nomina.
-- ═══════════════════════════════════════════════════════════════════════


-- ---------------------------------------------
-- B3.1 Proveedor
-- Catalogo maestro de proveedores del ente publico.
-- Incluye datos fiscales, contacto y cuenta bancaria.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS proveedor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  rfc VARCHAR(13) NOT NULL,
  razon_social VARCHAR(300) NOT NULL,
  nombre_comercial VARCHAR(200),
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(200),
  contacto VARCHAR(200),
  tipo_proveedor VARCHAR(30) NOT NULL DEFAULT 'general'
    CHECK (tipo_proveedor IN ('general','servicios','materiales','construccion','tecnologia','otro')),
  cuenta_bancaria VARCHAR(20),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, rfc)
);

COMMENT ON TABLE proveedor IS 'Catalogo de proveedores del ente publico con datos fiscales y de contacto';

-- ---------------------------------------------
-- B3.2 Requisicion
-- Solicitudes de adquisicion de bienes o servicios
-- emitidas por las areas del ente publico.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS requisicion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  numero VARCHAR(30) NOT NULL,
  fecha DATE NOT NULL,
  area_solicitante VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  justificacion TEXT,
  monto_estimado NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','solicitada','autorizada','en_proceso','completada','cancelada')),
  partida_id UUID REFERENCES partida_egreso(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, numero)
);

COMMENT ON TABLE requisicion IS 'Solicitudes de adquisicion de bienes o servicios por area solicitante';

-- ---------------------------------------------
-- B3.3 Orden de Compra
-- Ordenes de compra formalizadas a partir de requisiciones,
-- vinculadas a proveedor con montos de subtotal, IVA y total.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS orden_compra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  numero VARCHAR(30) NOT NULL,
  fecha DATE NOT NULL,
  proveedor_id UUID NOT NULL REFERENCES proveedor(id),
  requisicion_id UUID REFERENCES requisicion(id),
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','emitida','parcial','recibida','cancelada')),
  fecha_entrega DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, numero)
);

COMMENT ON TABLE orden_compra IS 'Ordenes de compra formalizadas con proveedor, montos y seguimiento de entrega';

-- ---------------------------------------------
-- B3.4 Empleado
-- Catalogo de empleados del ente publico con datos
-- personales, laborales y fiscales.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS empleado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  numero_empleado VARCHAR(20) NOT NULL,
  rfc VARCHAR(13) NOT NULL,
  curp VARCHAR(18) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  puesto VARCHAR(200),
  area VARCHAR(200),
  tipo_contrato VARCHAR(30) NOT NULL DEFAULT 'base'
    CHECK (tipo_contrato IN ('base','confianza','eventual','honorarios','otro')),
  fecha_ingreso DATE NOT NULL,
  sueldo_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, numero_empleado)
);

COMMENT ON TABLE empleado IS 'Catalogo de empleados con datos personales, laborales y fiscales';

-- ---------------------------------------------
-- B3.5 Concepto de Nomina
-- Catalogo de percepciones y deducciones utilizadas
-- en la nomina, con vinculacion contable.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS concepto_nomina (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  clave VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('percepcion','deduccion')),
  formula TEXT,
  cuenta_contable_id UUID REFERENCES plan_de_cuentas(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, clave)
);

COMMENT ON TABLE concepto_nomina IS 'Percepciones y deducciones de nomina con formula de calculo y cuenta contable';

-- ---------------------------------------------
-- B3.6 Tabulador
-- Niveles de remuneracion por puesto, con rangos
-- de sueldo minimo y maximo por zona.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS tabulador (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  nivel VARCHAR(20) NOT NULL,
  puesto VARCHAR(200) NOT NULL,
  sueldo_minimo NUMERIC(18,2) NOT NULL DEFAULT 0,
  sueldo_maximo NUMERIC(18,2) NOT NULL DEFAULT 0,
  zona VARCHAR(50),
  vigente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, nivel, puesto)
);

COMMENT ON TABLE tabulador IS 'Tabulador de sueldos por nivel y puesto con rangos minimo y maximo';

-- ---------------------------------------------
-- B3.7 Periodo de Nomina
-- Periodos de pago de nomina (quincenal, mensual, etc.)
-- con totales consolidados de percepciones y deducciones.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS periodo_nomina (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('quincenal','mensual','extraordinaria','aguinaldo','finiquito')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  fecha_pago DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','calculada','autorizada','pagada','cancelada')),
  total_percepciones NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_deducciones NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_neto NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, numero, tipo)
);

COMMENT ON TABLE periodo_nomina IS 'Periodos de pago de nomina con totales de percepciones, deducciones y neto';

-- ---------------------------------------------
-- B3.8 Detalle de Nomina
-- Lineas individuales de cada periodo de nomina:
-- montos de percepcion o deduccion por empleado y concepto.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_nomina (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo_nomina_id UUID NOT NULL REFERENCES periodo_nomina(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleado(id) ON DELETE CASCADE,
  concepto_id UUID NOT NULL REFERENCES concepto_nomina(id),
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('percepcion','deduccion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE detalle_nomina IS 'Detalle de nomina por empleado y concepto (percepcion o deduccion)';


-- ── Indices Batch 3 ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_proveedor_ente ON proveedor(ente_id);
CREATE INDEX IF NOT EXISTS idx_proveedor_rfc ON proveedor(rfc);
CREATE INDEX IF NOT EXISTS idx_proveedor_activo ON proveedor(activo);

CREATE INDEX IF NOT EXISTS idx_requisicion_ente_ejercicio ON requisicion(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_requisicion_estado ON requisicion(estado);
CREATE INDEX IF NOT EXISTS idx_requisicion_fecha ON requisicion(fecha);
CREATE INDEX IF NOT EXISTS idx_requisicion_partida ON requisicion(partida_id);

CREATE INDEX IF NOT EXISTS idx_orden_compra_ente_ejercicio ON orden_compra(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor ON orden_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_requisicion ON orden_compra(requisicion_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_estado ON orden_compra(estado);
CREATE INDEX IF NOT EXISTS idx_orden_compra_fecha ON orden_compra(fecha);

CREATE INDEX IF NOT EXISTS idx_empleado_ente ON empleado(ente_id);
CREATE INDEX IF NOT EXISTS idx_empleado_rfc ON empleado(rfc);
CREATE INDEX IF NOT EXISTS idx_empleado_activo ON empleado(activo);
CREATE INDEX IF NOT EXISTS idx_empleado_area ON empleado(area);

CREATE INDEX IF NOT EXISTS idx_concepto_nomina_ente ON concepto_nomina(ente_id);
CREATE INDEX IF NOT EXISTS idx_concepto_nomina_tipo ON concepto_nomina(tipo);

CREATE INDEX IF NOT EXISTS idx_tabulador_ente ON tabulador(ente_id);
CREATE INDEX IF NOT EXISTS idx_tabulador_vigente ON tabulador(vigente);

CREATE INDEX IF NOT EXISTS idx_periodo_nomina_ente_ejercicio ON periodo_nomina(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_periodo_nomina_estado ON periodo_nomina(estado);
CREATE INDEX IF NOT EXISTS idx_periodo_nomina_tipo ON periodo_nomina(tipo);
CREATE INDEX IF NOT EXISTS idx_periodo_nomina_fecha_pago ON periodo_nomina(fecha_pago);

CREATE INDEX IF NOT EXISTS idx_detalle_nomina_periodo ON detalle_nomina(periodo_nomina_id);
CREATE INDEX IF NOT EXISTS idx_detalle_nomina_empleado ON detalle_nomina(empleado_id);
CREATE INDEX IF NOT EXISTS idx_detalle_nomina_concepto ON detalle_nomina(concepto_id);
CREATE INDEX IF NOT EXISTS idx_detalle_nomina_tipo ON detalle_nomina(tipo);

-- ── Triggers updated_at Batch 3 ─────────────────────────────────────

CREATE TRIGGER trg_proveedor_updated_at
  BEFORE UPDATE ON proveedor FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_requisicion_updated_at
  BEFORE UPDATE ON requisicion FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_orden_compra_updated_at
  BEFORE UPDATE ON orden_compra FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_empleado_updated_at
  BEFORE UPDATE ON empleado FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_concepto_nomina_updated_at
  BEFORE UPDATE ON concepto_nomina FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_tabulador_updated_at
  BEFORE UPDATE ON tabulador FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_periodo_nomina_updated_at
  BEFORE UPDATE ON periodo_nomina FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── Triggers audit Batch 3 ──────────────────────────────────────────

CREATE TRIGGER trg_audit_proveedor
  AFTER INSERT OR UPDATE OR DELETE ON proveedor FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_requisicion
  AFTER INSERT OR UPDATE OR DELETE ON requisicion FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_orden_compra
  AFTER INSERT OR UPDATE OR DELETE ON orden_compra FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_empleado
  AFTER INSERT OR UPDATE OR DELETE ON empleado FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_concepto_nomina
  AFTER INSERT OR UPDATE OR DELETE ON concepto_nomina FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_tabulador
  AFTER INSERT OR UPDATE OR DELETE ON tabulador FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_periodo_nomina
  AFTER INSERT OR UPDATE OR DELETE ON periodo_nomina FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_detalle_nomina
  AFTER INSERT OR UPDATE OR DELETE ON detalle_nomina FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ── Row Level Security Batch 3 ──────────────────────────────────────

ALTER TABLE proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleado ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepto_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabulador ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodo_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_nomina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ente data" ON proveedor
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON proveedor
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON proveedor
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON proveedor
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON requisicion
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON requisicion
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON requisicion
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON requisicion
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON orden_compra
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON orden_compra
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON orden_compra
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON orden_compra
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON empleado
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON empleado
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON empleado
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON empleado
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON concepto_nomina
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON concepto_nomina
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON concepto_nomina
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON concepto_nomina
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON tabulador
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON tabulador
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON tabulador
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON tabulador
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON periodo_nomina
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON periodo_nomina
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON periodo_nomina
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON periodo_nomina
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON detalle_nomina
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON detalle_nomina
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON detalle_nomina
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON detalle_nomina
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════
-- BATCH 4: OBRA PUBLICA + RECAUDACION + OBLIGACIONES DE TRANSPARENCIA
-- Modulos de proyectos de obra, estimaciones, contribuyentes,
-- padron fiscal, cobros y envios de obligaciones.
-- ═══════════════════════════════════════════════════════════════════════


-- ---------------------------------------------
-- B4.1 Proyecto de Obra Publica
-- Registro maestro de obras publicas con seguimiento
-- de avance fisico y financiero.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS proyecto_obra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  clave VARCHAR(30) NOT NULL,
  nombre VARCHAR(300) NOT NULL,
  descripcion TEXT,
  tipo_obra VARCHAR(30) NOT NULL DEFAULT 'obra'
    CHECK (tipo_obra IN ('obra','adquisicion','servicio','mantenimiento','otro')),
  ubicacion VARCHAR(300),
  contratista VARCHAR(300),
  monto_contratado NUMERIC(18,2) NOT NULL DEFAULT 0,
  monto_ejercido NUMERIC(18,2) NOT NULL DEFAULT 0,
  avance_fisico NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (avance_fisico BETWEEN 0 AND 100),
  avance_financiero NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (avance_financiero BETWEEN 0 AND 100),
  fecha_inicio DATE,
  fecha_fin_programada DATE,
  fecha_fin_real DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'planeacion'
    CHECK (estado IN ('planeacion','en_proceso','suspendida','terminada','cancelada')),
  partida_id UUID REFERENCES partida_egreso(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, ejercicio_id, clave)
);

COMMENT ON TABLE proyecto_obra IS 'Proyectos de obra publica con avance fisico y financiero';

-- ---------------------------------------------
-- B4.2 Estimacion de Obra
-- Estimaciones periodicas de avance de obra para
-- efectos de pago al contratista.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS estimacion_obra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyecto_obra(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  fecha DATE NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  concepto TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','presentada','autorizada','pagada','rechazada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proyecto_id, numero)
);

COMMENT ON TABLE estimacion_obra IS 'Estimaciones de avance de obra para tramite de pago';

-- ---------------------------------------------
-- B4.3 Contribuyente
-- Catalogo de contribuyentes del ente publico
-- para el modulo de recaudacion de ingresos propios.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS contribuyente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  rfc VARCHAR(13),
  curp VARCHAR(18),
  nombre VARCHAR(300) NOT NULL,
  tipo_persona VARCHAR(10) NOT NULL DEFAULT 'fisica'
    CHECK (tipo_persona IN ('fisica','moral')),
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(200),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE contribuyente IS 'Catalogo de contribuyentes para recaudacion de ingresos propios';

-- ---------------------------------------------
-- B4.4 Padron Fiscal
-- Registro de contribuyentes en padrones fiscales
-- (predial, agua, licencias, etc.) con base gravable.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS padron_fiscal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  contribuyente_id UUID NOT NULL REFERENCES contribuyente(id) ON DELETE CASCADE,
  tipo_impuesto VARCHAR(50) NOT NULL,
  clave_catastral VARCHAR(50),
  base_gravable NUMERIC(18,2) NOT NULL DEFAULT 0,
  tasa NUMERIC(8,4) NOT NULL DEFAULT 0,
  monto_anual NUMERIC(18,2) NOT NULL DEFAULT 0,
  vigente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE padron_fiscal IS 'Padrones fiscales con tipo de impuesto, base gravable y tasas';

-- ---------------------------------------------
-- B4.5 Cobro
-- Registro de cobros realizados a contribuyentes
-- por conceptos de ingresos propios del ente.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS cobro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  contribuyente_id UUID NOT NULL REFERENCES contribuyente(id),
  padron_id UUID REFERENCES padron_fiscal(id),
  concepto TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  fecha_cobro DATE NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo'
    CHECK (metodo_pago IN ('efectivo','transferencia','cheque','tarjeta','otro')),
  referencia_pago VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'pagado'
    CHECK (estado IN ('pendiente','pagado','cancelado','devuelto')),
  concepto_ingreso_id UUID REFERENCES concepto_ingreso(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE cobro IS 'Cobros a contribuyentes por ingresos propios del ente publico';

-- ---------------------------------------------
-- B4.6 Envio de Obligacion de Transparencia
-- Control de envio de informacion a organos fiscalizadores
-- y plataformas de transparencia (CONAC, ASF, OSFEM, etc.).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS envio_obligacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodo_contable(id),
  tipo_obligacion VARCHAR(50) NOT NULL,
  destino VARCHAR(100) NOT NULL,
  fecha_envio DATE,
  fecha_limite DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','preparando','enviado','aceptado','rechazado','extemporaneo')),
  archivo_url TEXT,
  acuse_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE envio_obligacion IS 'Control de envio de obligaciones de transparencia y rendicion de cuentas';

-- ── Indices Batch 4 ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_proyecto_obra_ente_ejercicio ON proyecto_obra(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_obra_estado ON proyecto_obra(estado);
CREATE INDEX IF NOT EXISTS idx_proyecto_obra_tipo_obra ON proyecto_obra(tipo_obra);
CREATE INDEX IF NOT EXISTS idx_proyecto_obra_partida ON proyecto_obra(partida_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_obra_fecha_inicio ON proyecto_obra(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_estimacion_obra_proyecto ON estimacion_obra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_estimacion_obra_estado ON estimacion_obra(estado);
CREATE INDEX IF NOT EXISTS idx_estimacion_obra_fecha ON estimacion_obra(fecha);

CREATE INDEX IF NOT EXISTS idx_contribuyente_ente ON contribuyente(ente_id);
CREATE INDEX IF NOT EXISTS idx_contribuyente_rfc ON contribuyente(rfc);
CREATE INDEX IF NOT EXISTS idx_contribuyente_activo ON contribuyente(activo);

CREATE INDEX IF NOT EXISTS idx_padron_fiscal_ente ON padron_fiscal(ente_id);
CREATE INDEX IF NOT EXISTS idx_padron_fiscal_contribuyente ON padron_fiscal(contribuyente_id);
CREATE INDEX IF NOT EXISTS idx_padron_fiscal_tipo_impuesto ON padron_fiscal(tipo_impuesto);
CREATE INDEX IF NOT EXISTS idx_padron_fiscal_vigente ON padron_fiscal(vigente);

CREATE INDEX IF NOT EXISTS idx_cobro_ente_ejercicio ON cobro(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_cobro_contribuyente ON cobro(contribuyente_id);
CREATE INDEX IF NOT EXISTS idx_cobro_padron ON cobro(padron_id);
CREATE INDEX IF NOT EXISTS idx_cobro_fecha ON cobro(fecha_cobro);
CREATE INDEX IF NOT EXISTS idx_cobro_estado ON cobro(estado);
CREATE INDEX IF NOT EXISTS idx_cobro_concepto_ingreso ON cobro(concepto_ingreso_id);

CREATE INDEX IF NOT EXISTS idx_envio_obligacion_ente_ejercicio ON envio_obligacion(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_envio_obligacion_periodo ON envio_obligacion(periodo_id);
CREATE INDEX IF NOT EXISTS idx_envio_obligacion_estado ON envio_obligacion(estado);
CREATE INDEX IF NOT EXISTS idx_envio_obligacion_fecha_limite ON envio_obligacion(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_envio_obligacion_destino ON envio_obligacion(destino);

-- ── Triggers updated_at Batch 4 ─────────────────────────────────────

CREATE TRIGGER trg_proyecto_obra_updated_at
  BEFORE UPDATE ON proyecto_obra FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_estimacion_obra_updated_at
  BEFORE UPDATE ON estimacion_obra FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_contribuyente_updated_at
  BEFORE UPDATE ON contribuyente FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_padron_fiscal_updated_at
  BEFORE UPDATE ON padron_fiscal FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_cobro_updated_at
  BEFORE UPDATE ON cobro FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_envio_obligacion_updated_at
  BEFORE UPDATE ON envio_obligacion FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── Triggers audit Batch 4 ──────────────────────────────────────────

CREATE TRIGGER trg_audit_proyecto_obra
  AFTER INSERT OR UPDATE OR DELETE ON proyecto_obra FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_estimacion_obra
  AFTER INSERT OR UPDATE OR DELETE ON estimacion_obra FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_contribuyente
  AFTER INSERT OR UPDATE OR DELETE ON contribuyente FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_padron_fiscal
  AFTER INSERT OR UPDATE OR DELETE ON padron_fiscal FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_cobro
  AFTER INSERT OR UPDATE OR DELETE ON cobro FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_envio_obligacion
  AFTER INSERT OR UPDATE OR DELETE ON envio_obligacion FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ── Row Level Security Batch 4 ──────────────────────────────────────

ALTER TABLE proyecto_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE padron_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobro ENABLE ROW LEVEL SECURITY;
ALTER TABLE envio_obligacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ente data" ON proyecto_obra
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON proyecto_obra
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON proyecto_obra
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON proyecto_obra
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON estimacion_obra
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON estimacion_obra
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON estimacion_obra
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON estimacion_obra
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON contribuyente
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON contribuyente
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON contribuyente
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON contribuyente
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON padron_fiscal
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON padron_fiscal
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON padron_fiscal
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON padron_fiscal
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON cobro
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON cobro
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON cobro
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON cobro
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON envio_obligacion
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON envio_obligacion
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON envio_obligacion
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON envio_obligacion
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════
-- BATCH 5: PORTAL DE TRANSPARENCIA + CFDI + ANALYTICS
-- Publicaciones en portal de transparencia y gestion
-- de comprobantes fiscales digitales (CFDI).
-- ═══════════════════════════════════════════════════════════════════════


-- ---------------------------------------------
-- B5.1 Publicacion en Portal de Transparencia
-- Documentos y archivos publicados en el portal de
-- transparencia del ente publico conforme a la LGCG.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS publicacion_portal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  tipo VARCHAR(50) NOT NULL
    CHECK (tipo IN (
      'estado_financiero','presupuesto','cuenta_publica','indicador',
      'informe_trimestral','ley_ingresos','deuda','inventario','nomina',
      'armonizacion','otro'
    )),
  contenido TEXT,
  archivo_url TEXT,
  fecha_publicacion DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','publicado','actualizado','retirado')),
  visible_portal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE publicacion_portal IS 'Publicaciones de informacion financiera en el portal de transparencia';

-- ---------------------------------------------
-- B5.2 CFDI (Comprobante Fiscal Digital por Internet)
-- Registro de comprobantes fiscales digitales emitidos
-- y recibidos por el ente publico.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS cfdi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  uuid_fiscal VARCHAR(36) NOT NULL,
  serie VARCHAR(10),
  folio VARCHAR(20),
  fecha_emision TIMESTAMPTZ NOT NULL,
  tipo_comprobante VARCHAR(10) NOT NULL
    CHECK (tipo_comprobante IN ('I','E','T','P','N')),
  rfc_emisor VARCHAR(13) NOT NULL,
  nombre_emisor VARCHAR(300),
  rfc_receptor VARCHAR(13) NOT NULL,
  nombre_receptor VARCHAR(300),
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente'
    CHECK (estado IN ('vigente','cancelado','pendiente_cancelacion')),
  xml_url TEXT,
  pdf_url TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'recibido'
    CHECK (tipo IN ('emitido','recibido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, uuid_fiscal)
);

COMMENT ON TABLE cfdi IS 'Comprobantes Fiscales Digitales por Internet (emitidos y recibidos)';

-- ── Indices Batch 5 ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_publicacion_portal_ente_ejercicio ON publicacion_portal(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_publicacion_portal_tipo ON publicacion_portal(tipo);
CREATE INDEX IF NOT EXISTS idx_publicacion_portal_estado ON publicacion_portal(estado);
CREATE INDEX IF NOT EXISTS idx_publicacion_portal_fecha ON publicacion_portal(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_publicacion_portal_visible ON publicacion_portal(visible_portal);

CREATE INDEX IF NOT EXISTS idx_cfdi_ente_ejercicio ON cfdi(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_cfdi_uuid_fiscal ON cfdi(uuid_fiscal);
CREATE INDEX IF NOT EXISTS idx_cfdi_rfc_emisor ON cfdi(rfc_emisor);
CREATE INDEX IF NOT EXISTS idx_cfdi_rfc_receptor ON cfdi(rfc_receptor);
CREATE INDEX IF NOT EXISTS idx_cfdi_tipo_comprobante ON cfdi(tipo_comprobante);
CREATE INDEX IF NOT EXISTS idx_cfdi_estado ON cfdi(estado);
CREATE INDEX IF NOT EXISTS idx_cfdi_tipo ON cfdi(tipo);
CREATE INDEX IF NOT EXISTS idx_cfdi_fecha_emision ON cfdi(fecha_emision);

-- ── Triggers updated_at Batch 5 ─────────────────────────────────────

CREATE TRIGGER trg_publicacion_portal_updated_at
  BEFORE UPDATE ON publicacion_portal FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_cfdi_updated_at
  BEFORE UPDATE ON cfdi FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── Triggers audit Batch 5 ──────────────────────────────────────────

CREATE TRIGGER trg_audit_publicacion_portal
  AFTER INSERT OR UPDATE OR DELETE ON publicacion_portal FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_cfdi
  AFTER INSERT OR UPDATE OR DELETE ON cfdi FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ── Row Level Security Batch 5 ──────────────────────────────────────

ALTER TABLE publicacion_portal ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfdi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ente data" ON publicacion_portal
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON publicacion_portal
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON publicacion_portal
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON publicacion_portal
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON cfdi
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON cfdi
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON cfdi
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON cfdi
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════
-- BATCH 6: e.FIRMA + DETECCION DE ANOMALIAS
-- Certificados FIEL, firma de documentos y motor
-- de reglas para deteccion automatica de anomalias contables.
-- ═══════════════════════════════════════════════════════════════════════


-- ---------------------------------------------
-- B6.1 Certificado FIEL (e.Firma)
-- Registro de certificados de firma electronica avanzada
-- del SAT asociados a usuarios del sistema.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS certificado_fiel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  numero_serie VARCHAR(40) NOT NULL,
  rfc VARCHAR(13) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fin DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo','expirado','revocado')),
  cer_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, numero_serie)
);

COMMENT ON TABLE certificado_fiel IS 'Certificados de e.Firma (FIEL) del SAT asociados a usuarios';

-- ---------------------------------------------
-- B6.2 Documento Firmado
-- Documentos que han sido firmados electronicamente
-- con e.Firma, incluyendo hash y cadena de verificacion.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS documento_firma (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  tipo_documento VARCHAR(50) NOT NULL
    CHECK (tipo_documento IN (
      'poliza','estado_financiero','conciliacion','cuenta_publica',
      'presupuesto','nomina','contrato','oficio','otro'
    )),
  documento_url TEXT,
  firma_url TEXT,
  firmante_id UUID REFERENCES usuarios(id),
  certificado_id UUID REFERENCES certificado_fiel(id),
  fecha_firma TIMESTAMPTZ,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','firmado','rechazado','revocado')),
  hash_documento VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE documento_firma IS 'Documentos firmados electronicamente con e.Firma';

-- ---------------------------------------------
-- B6.3 Regla de Anomalia
-- Catalogo de reglas parametrizables para la deteccion
-- automatica de anomalias en los registros contables.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS regla_anomalia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(30) NOT NULL
    CHECK (tipo IN ('contable','presupuestal','tesoreria','nomina','patrimonio','general')),
  nivel_riesgo VARCHAR(20) NOT NULL DEFAULT 'medio'
    CHECK (nivel_riesgo IN ('bajo','medio','alto','critico')),
  umbral NUMERIC(18,4),
  activa BOOLEAN NOT NULL DEFAULT true,
  parametros JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ente_id, nombre)
);

COMMENT ON TABLE regla_anomalia IS 'Reglas parametrizables para deteccion automatica de anomalias contables';

-- ---------------------------------------------
-- B6.4 Anomalia Detectada
-- Registro de anomalias detectadas por el motor de reglas,
-- con evidencia, cuenta afectada y seguimiento de resolucion.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS anomalia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ente_id UUID NOT NULL REFERENCES ente_publico(id) ON DELETE CASCADE,
  ejercicio_id UUID NOT NULL REFERENCES ejercicio_fiscal(id) ON DELETE CASCADE,
  regla_id UUID REFERENCES regla_anomalia(id),
  tipo VARCHAR(30) NOT NULL
    CHECK (tipo IN ('contable','presupuestal','tesoreria','nomina','patrimonio','general')),
  nivel_riesgo VARCHAR(20) NOT NULL DEFAULT 'medio'
    CHECK (nivel_riesgo IN ('bajo','medio','alto','critico')),
  descripcion TEXT NOT NULL,
  evidencia TEXT,
  cuenta_afectada UUID REFERENCES plan_de_cuentas(id),
  poliza_referencia UUID REFERENCES poliza(id),
  monto NUMERIC(18,2),
  fecha_deteccion DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierta'
    CHECK (estado IN ('abierta','en_revision','resuelta','descartada')),
  notas TEXT,
  resuelto_por UUID REFERENCES usuarios(id),
  fecha_resolucion DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE anomalia IS 'Anomalias detectadas por el motor de reglas con seguimiento de resolucion';

-- ── Indices Batch 6 ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_certificado_fiel_ente ON certificado_fiel(ente_id);
CREATE INDEX IF NOT EXISTS idx_certificado_fiel_usuario ON certificado_fiel(usuario_id);
CREATE INDEX IF NOT EXISTS idx_certificado_fiel_estado ON certificado_fiel(estado);
CREATE INDEX IF NOT EXISTS idx_certificado_fiel_rfc ON certificado_fiel(rfc);

CREATE INDEX IF NOT EXISTS idx_documento_firma_ente ON documento_firma(ente_id);
CREATE INDEX IF NOT EXISTS idx_documento_firma_firmante ON documento_firma(firmante_id);
CREATE INDEX IF NOT EXISTS idx_documento_firma_certificado ON documento_firma(certificado_id);
CREATE INDEX IF NOT EXISTS idx_documento_firma_tipo ON documento_firma(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documento_firma_estado ON documento_firma(estado);
CREATE INDEX IF NOT EXISTS idx_documento_firma_fecha ON documento_firma(fecha_firma);

CREATE INDEX IF NOT EXISTS idx_regla_anomalia_ente ON regla_anomalia(ente_id);
CREATE INDEX IF NOT EXISTS idx_regla_anomalia_tipo ON regla_anomalia(tipo);
CREATE INDEX IF NOT EXISTS idx_regla_anomalia_nivel ON regla_anomalia(nivel_riesgo);
CREATE INDEX IF NOT EXISTS idx_regla_anomalia_activa ON regla_anomalia(activa);

CREATE INDEX IF NOT EXISTS idx_anomalia_ente_ejercicio ON anomalia(ente_id, ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_anomalia_regla ON anomalia(regla_id);
CREATE INDEX IF NOT EXISTS idx_anomalia_tipo ON anomalia(tipo);
CREATE INDEX IF NOT EXISTS idx_anomalia_nivel ON anomalia(nivel_riesgo);
CREATE INDEX IF NOT EXISTS idx_anomalia_estado ON anomalia(estado);
CREATE INDEX IF NOT EXISTS idx_anomalia_fecha_deteccion ON anomalia(fecha_deteccion);
CREATE INDEX IF NOT EXISTS idx_anomalia_cuenta ON anomalia(cuenta_afectada);
CREATE INDEX IF NOT EXISTS idx_anomalia_poliza ON anomalia(poliza_referencia);

-- ── Triggers updated_at Batch 6 ─────────────────────────────────────

CREATE TRIGGER trg_certificado_fiel_updated_at
  BEFORE UPDATE ON certificado_fiel FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_documento_firma_updated_at
  BEFORE UPDATE ON documento_firma FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_regla_anomalia_updated_at
  BEFORE UPDATE ON regla_anomalia FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_anomalia_updated_at
  BEFORE UPDATE ON anomalia FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── Triggers audit Batch 6 ──────────────────────────────────────────

CREATE TRIGGER trg_audit_certificado_fiel
  AFTER INSERT OR UPDATE OR DELETE ON certificado_fiel FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_documento_firma
  AFTER INSERT OR UPDATE OR DELETE ON documento_firma FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_regla_anomalia
  AFTER INSERT OR UPDATE OR DELETE ON regla_anomalia FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_anomalia
  AFTER INSERT OR UPDATE OR DELETE ON anomalia FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ── Row Level Security Batch 6 ──────────────────────────────────────

ALTER TABLE certificado_fiel ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_firma ENABLE ROW LEVEL SECURITY;
ALTER TABLE regla_anomalia ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ente data" ON certificado_fiel
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON certificado_fiel
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON certificado_fiel
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON certificado_fiel
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON documento_firma
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON documento_firma
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON documento_firma
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON documento_firma
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON regla_anomalia
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON regla_anomalia
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON regla_anomalia
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON regla_anomalia
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own ente data" ON anomalia
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ente data" ON anomalia
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ente data" ON anomalia
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own ente data" ON anomalia
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════
-- FUNCIONES RPC (Remote Procedure Calls)
-- Funciones invocables desde la aplicacion via supabase.rpc()
-- ═══════════════════════════════════════════════════════════════════════


-- ---------------------------------------------
-- fn_ejecutar_analisis: Ejecuta el motor de deteccion de anomalias
-- Recorre las reglas activas del ente y genera registros de anomalia.
-- (Stub inicial que retorna 0; la logica completa se implementa
--  conforme se definen las reglas de negocio.)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_ejecutar_analisis(
  p_ente_id UUID,
  p_ejercicio_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- ──────────────────────────────────────────────────────────
  -- STUB: En esta version inicial, la funcion no ejecuta
  -- reglas reales. Retorna 0 anomalias encontradas.
  --
  -- Futuras implementaciones iteraran sobre regla_anomalia
  -- WHERE ente_id = p_ente_id AND activa = true
  -- y evaluaran cada regla contra los datos del ejercicio.
  -- ──────────────────────────────────────────────────────────

  RAISE NOTICE 'fn_ejecutar_analisis: ente=%, ejercicio=% (stub - 0 anomalias)', p_ente_id, p_ejercicio_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_ejecutar_analisis(UUID, UUID) IS 'Ejecuta el motor de deteccion de anomalias para un ente y ejercicio (stub)';

-- ---------------------------------------------
-- fn_cierre_ejercicio: Genera polizas de cierre de ejercicio
-- Crea polizas de tipo "cierre" que saldan las cuentas de
-- resultados (ingresos y gastos) contra la cuenta de resumen.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_cierre_ejercicio(
  p_ente_id UUID,
  p_ejercicio_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_poliza_id UUID;
  v_periodo_id UUID;
  v_siguiente_num INTEGER;
  v_linea INTEGER := 0;
  v_cuenta RECORD;
  v_total_ingresos NUMERIC(18,2) := 0;
  v_total_gastos NUMERIC(18,2) := 0;
BEGIN
  -- Validar que el ejercicio exista y este abierto
  IF NOT EXISTS (
    SELECT 1 FROM ejercicio_fiscal
    WHERE id = p_ejercicio_id AND ente_id = p_ente_id AND estado = 'abierto'
  ) THEN
    RAISE EXCEPTION 'Ejercicio no encontrado, no pertenece al ente o no esta abierto';
  END IF;

  -- Obtener el periodo 13 (Ajustes) para las polizas de cierre
  SELECT id INTO v_periodo_id
  FROM periodo_contable
  WHERE ejercicio_id = p_ejercicio_id AND numero = 13;

  IF v_periodo_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el periodo 13 (Ajustes) para el ejercicio';
  END IF;

  -- Obtener siguiente numero de poliza de cierre
  SELECT COALESCE(MAX(numero_poliza), 0) + 1 INTO v_siguiente_num
  FROM poliza
  WHERE ente_id = p_ente_id AND ejercicio_id = p_ejercicio_id AND tipo = 'cierre';

  -- Crear la poliza de cierre
  INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado)
  VALUES (p_ente_id, p_ejercicio_id, v_periodo_id, 'cierre', v_siguiente_num,
          CURRENT_DATE, 'Poliza de cierre de ejercicio - Saldo de cuentas de resultados', 'borrador')
  RETURNING id INTO v_poliza_id;

  -- Recorrer cuentas de ingresos con saldo (tipo_cuenta = 'ingresos')
  -- y crear movimientos de cargo para saldarlas
  FOR v_cuenta IN
    SELECT sc.cuenta_id, sc.saldo_final, pc.nombre
    FROM saldo_cuenta sc
    JOIN plan_de_cuentas pc ON pc.id = sc.cuenta_id
    WHERE sc.ente_id = p_ente_id
      AND sc.ejercicio_id = p_ejercicio_id
      AND pc.tipo_cuenta = 'ingresos'
      AND pc.es_detalle = true
      AND sc.saldo_final <> 0
  LOOP
    v_linea := v_linea + 1;
    -- Las cuentas de ingreso son acreedoras, para saldarlas se cargan
    INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber)
    VALUES (v_poliza_id, v_linea, v_cuenta.cuenta_id,
            'Cierre de cuenta de ingreso: ' || v_cuenta.nombre,
            ABS(v_cuenta.saldo_final), 0);
    v_total_ingresos := v_total_ingresos + ABS(v_cuenta.saldo_final);
  END LOOP;

  -- Recorrer cuentas de gastos con saldo (tipo_cuenta = 'gastos')
  -- y crear movimientos de abono para saldarlas
  FOR v_cuenta IN
    SELECT sc.cuenta_id, sc.saldo_final, pc.nombre
    FROM saldo_cuenta sc
    JOIN plan_de_cuentas pc ON pc.id = sc.cuenta_id
    WHERE sc.ente_id = p_ente_id
      AND sc.ejercicio_id = p_ejercicio_id
      AND pc.tipo_cuenta = 'gastos'
      AND pc.es_detalle = true
      AND sc.saldo_final <> 0
  LOOP
    v_linea := v_linea + 1;
    -- Las cuentas de gasto son deudoras, para saldarlas se abonan
    INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber)
    VALUES (v_poliza_id, v_linea, v_cuenta.cuenta_id,
            'Cierre de cuenta de gasto: ' || v_cuenta.nombre,
            0, ABS(v_cuenta.saldo_final));
    v_total_gastos := v_total_gastos + ABS(v_cuenta.saldo_final);
  END LOOP;

  -- Movimiento de contrapartida en cuenta 6.1 (Resumen de Ingresos y Gastos)
  -- Si ingresos > gastos: abono a 6.1 por la diferencia (resultado positivo)
  -- Si gastos > ingresos: cargo a 6.1 por la diferencia (resultado negativo)
  IF v_total_ingresos > 0 OR v_total_gastos > 0 THEN
    DECLARE
      v_cuenta_resumen_id UUID;
      v_diferencia NUMERIC(18,2);
    BEGIN
      SELECT id INTO v_cuenta_resumen_id
      FROM plan_de_cuentas
      WHERE ente_id = p_ente_id AND codigo = '6.1';

      IF v_cuenta_resumen_id IS NOT NULL THEN
        v_diferencia := v_total_ingresos - v_total_gastos;
        v_linea := v_linea + 1;

        IF v_diferencia >= 0 THEN
          -- Resultado positivo: se abona a la cuenta de resumen
          INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber)
          VALUES (v_poliza_id, v_linea, v_cuenta_resumen_id,
                  'Resultado del ejercicio (superavit)', 0, v_diferencia);
        ELSE
          -- Resultado negativo: se carga a la cuenta de resumen
          INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber)
          VALUES (v_poliza_id, v_linea, v_cuenta_resumen_id,
                  'Resultado del ejercicio (deficit)', ABS(v_diferencia), 0);
        END IF;
      END IF;
    END;
  END IF;

  -- Actualizar totales de la poliza
  UPDATE poliza SET
    total_debe = (SELECT COALESCE(SUM(debe), 0) FROM movimiento_contable WHERE poliza_id = v_poliza_id),
    total_haber = (SELECT COALESCE(SUM(haber), 0) FROM movimiento_contable WHERE poliza_id = v_poliza_id)
  WHERE id = v_poliza_id;

  -- Marcar el ejercicio como en_cierre
  UPDATE ejercicio_fiscal SET estado = 'en_cierre' WHERE id = p_ejercicio_id;

  RAISE NOTICE 'fn_cierre_ejercicio: poliza_id=%, lineas=%, ingresos=%, gastos=%',
    v_poliza_id, v_linea, v_total_ingresos, v_total_gastos;

  RETURN v_poliza_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_cierre_ejercicio(UUID, UUID) IS 'Genera poliza de cierre saldando cuentas de resultados del ejercicio';

-- ---------------------------------------------
-- fn_apertura_ejercicio: Copia saldos de cuentas patrimoniales
-- del ejercicio origen al ejercicio destino, creando una
-- poliza de apertura con los saldos iniciales.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_apertura_ejercicio(
  p_ente_id UUID,
  p_ejercicio_origen UUID,
  p_ejercicio_destino UUID
)
RETURNS UUID AS $$
DECLARE
  v_poliza_id UUID;
  v_periodo_id UUID;
  v_apertura_id UUID;
  v_siguiente_num INTEGER;
  v_linea INTEGER := 0;
  v_cuenta RECORD;
  v_total_deudor NUMERIC(18,2) := 0;
  v_total_acreedor NUMERIC(18,2) := 0;
  v_cuentas_transferidas INTEGER := 0;
BEGIN
  -- Validar ejercicio origen (debe estar cerrado o en_cierre)
  IF NOT EXISTS (
    SELECT 1 FROM ejercicio_fiscal
    WHERE id = p_ejercicio_origen AND ente_id = p_ente_id
      AND estado IN ('cerrado', 'en_cierre')
  ) THEN
    RAISE EXCEPTION 'Ejercicio origen no encontrado, no pertenece al ente o no esta cerrado';
  END IF;

  -- Validar ejercicio destino (debe estar abierto)
  IF NOT EXISTS (
    SELECT 1 FROM ejercicio_fiscal
    WHERE id = p_ejercicio_destino AND ente_id = p_ente_id AND estado = 'abierto'
  ) THEN
    RAISE EXCEPTION 'Ejercicio destino no encontrado, no pertenece al ente o no esta abierto';
  END IF;

  -- Obtener periodo 1 (Enero) del ejercicio destino
  SELECT id INTO v_periodo_id
  FROM periodo_contable
  WHERE ejercicio_id = p_ejercicio_destino AND numero = 1;

  IF v_periodo_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el periodo 1 (Enero) para el ejercicio destino';
  END IF;

  -- Crear poliza de apertura
  SELECT COALESCE(MAX(numero_poliza), 0) + 1 INTO v_siguiente_num
  FROM poliza
  WHERE ente_id = p_ente_id AND ejercicio_id = p_ejercicio_destino AND tipo = 'diario';

  INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado)
  VALUES (p_ente_id, p_ejercicio_destino, v_periodo_id, 'diario', v_siguiente_num,
          CURRENT_DATE, 'Poliza de apertura de ejercicio - Traspaso de saldos patrimoniales', 'borrador')
  RETURNING id INTO v_poliza_id;

  -- Transferir saldos finales de cuentas patrimoniales
  -- (activo, pasivo, hacienda) del ultimo periodo del ejercicio origen
  FOR v_cuenta IN
    SELECT sc.cuenta_id, sc.saldo_final, pc.tipo_cuenta, pc.naturaleza, pc.nombre
    FROM saldo_cuenta sc
    JOIN plan_de_cuentas pc ON pc.id = sc.cuenta_id
    WHERE sc.ente_id = p_ente_id
      AND sc.ejercicio_id = p_ejercicio_origen
      AND pc.tipo_cuenta IN ('activo', 'pasivo', 'hacienda')
      AND pc.es_detalle = true
      AND sc.saldo_final <> 0
    ORDER BY pc.codigo
  LOOP
    v_linea := v_linea + 1;
    v_cuentas_transferidas := v_cuentas_transferidas + 1;

    IF v_cuenta.naturaleza = 'deudora' THEN
      -- Cuentas deudoras: cargo por el saldo final
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber)
      VALUES (v_poliza_id, v_linea, v_cuenta.cuenta_id,
              'Apertura: ' || v_cuenta.nombre, ABS(v_cuenta.saldo_final), 0);
      v_total_deudor := v_total_deudor + ABS(v_cuenta.saldo_final);
    ELSE
      -- Cuentas acreedoras: abono por el saldo final
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber)
      VALUES (v_poliza_id, v_linea, v_cuenta.cuenta_id,
              'Apertura: ' || v_cuenta.nombre, 0, ABS(v_cuenta.saldo_final));
      v_total_acreedor := v_total_acreedor + ABS(v_cuenta.saldo_final);
    END IF;
  END LOOP;

  -- Actualizar totales de la poliza
  UPDATE poliza SET
    total_debe = v_total_deudor,
    total_haber = v_total_acreedor
  WHERE id = v_poliza_id;

  -- Registrar la apertura
  INSERT INTO apertura_ejercicio (
    ente_id, ejercicio_origen_id, ejercicio_destino_id, fecha_apertura,
    estado, poliza_apertura_id, total_cuentas_transferidas,
    total_saldo_deudor, total_saldo_acreedor, observaciones
  ) VALUES (
    p_ente_id, p_ejercicio_origen, p_ejercicio_destino, CURRENT_DATE,
    'completado', v_poliza_id, v_cuentas_transferidas,
    v_total_deudor, v_total_acreedor,
    format('Apertura automatica: %s cuentas, deudor=%s, acreedor=%s',
           v_cuentas_transferidas, v_total_deudor, v_total_acreedor)
  )
  RETURNING id INTO v_apertura_id;

  RAISE NOTICE 'fn_apertura_ejercicio: poliza=%, cuentas=%, deudor=%, acreedor=%',
    v_poliza_id, v_cuentas_transferidas, v_total_deudor, v_total_acreedor;

  RETURN v_poliza_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_apertura_ejercicio(UUID, UUID, UUID) IS 'Genera poliza de apertura copiando saldos patrimoniales del ejercicio origen al destino';


-- ═══════════════════════════════════════════════════════════════════════
-- FIN DE MIGRACION BATCHES 3-6
-- Total de tablas nuevas: 20
--   Batch 3: proveedor, requisicion, orden_compra, empleado,
--            concepto_nomina, tabulador, periodo_nomina, detalle_nomina
--   Batch 4: proyecto_obra, estimacion_obra, contribuyente,
--            padron_fiscal, cobro, envio_obligacion
--   Batch 5: publicacion_portal, cfdi
--   Batch 6: certificado_fiel, documento_firma, regla_anomalia, anomalia
-- Total de funciones RPC: 3
--   fn_ejecutar_analisis, fn_cierre_ejercicio, fn_apertura_ejercicio
-- ═══════════════════════════════════════════════════════════════════════
