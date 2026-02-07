#!/usr/bin/env node
// =============================================================================
// SCGMEX - Seed de Operacion Diaria Ficticia
// Simula operacion real: cuentas detalle, polizas, presupuesto, patrimonio, deuda
// =============================================================================

const TOKEN = 'sbp_70a80fd26d34ce96ab4e1b23b4104c37f7884469';
const REF = 'pfmiwusneqjplwwwlvyh';

async function sql(query) {
  const resp = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const text = await resp.text();
  if (!resp.ok) { console.error(`SQL ERROR: ${text}`); throw new Error(text); }
  try { return JSON.parse(text); } catch { return text; }
}

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

// ── IDs existentes ──────────────────────────────────────────────────
const ENTE = '3f0f3447-f5c5-448e-a919-a3573fcedaa6';
const EJERCICIO = '44ac52ac-6173-4c2a-8541-8f4d2b810b5b';
const P = { // periodo_id por numero
  1: 'e4f96ef9-256d-47d6-a501-6861c24220ac',
  2: '3a49d1ba-e311-4ea0-a204-a34ce6b66543',
  3: '18c3c7d0-83ff-40ad-9f66-f6fa04a26477',
  4: '5f0eb02e-2ab2-4901-9226-520b2b03e434',
  5: 'dec0fee1-b671-4005-979b-fb408dbd0347',
  6: '4ba7d1a6-4373-486c-8c6f-608ba15f9678',
};
// Cuentas nivel 3 clave
const C = {
  '1.1.1': '02cf1646-1f7d-4f81-a823-d184d2da3141', // Efectivo y Equivalentes
  '1.1.2': 'd343f70c-3585-4fe6-b19c-0cee9f36e33c', // Derechos a Recibir Efectivo
  '1.2.3': '534cf218-878c-4ecb-9e2f-0dcf4350e4f8', // Bienes Inmuebles
  '1.2.4': 'bfce99de-cdd4-4de0-88cd-09e4076eb4e2', // Bienes Muebles
  '2.1.1': 'a524d588-892d-4e3f-a128-06f09aa0e758', // CxP CP
  '2.2.3': '314d271a-afc2-43ae-a284-1b8ae71bc3b5', // Deuda Publica LP
  '3.2.1': '2e6a1298-af0a-4951-a74d-5ee66aad212c', // Resultado del Ejercicio
  '3.2.2': '2f55f2d6-19d1-4c98-ab52-015de4a9942d', // Resultados Ejercicios Anteriores
  '4.1.1': '732460a6-b7d9-4263-9e8c-a42802dab32b', // Impuestos
  '4.1.4': '0f100118-58c5-4a79-aee2-ff6e1edd58bc', // Derechos
  '4.2.1': '85de66ce-9369-44ba-823e-15120cc202d3', // Participaciones (ingreso)
  '5.1.1': '59e94057-edd9-4e96-b7e1-7fb29e4c5bf3', // Servicios Personales
  '5.1.2': '0a97933d-edba-4b1d-ac7c-ca4632e739b1', // Materiales
  '5.1.3': '6221a57d-a7a8-412e-b1d0-e8946fc48b7f', // Servicios Generales
  '5.4.1': 'c57b23df-4499-4554-b6b7-6767c95ebcd8', // Intereses Deuda
  '8.2.1': '97f5862d-3f17-4c9f-b8db-6382252b6f42', // PEF Aprobado
};
// Clasificadores
const CL = {
  sp:  '771cfeb5-c77b-4f43-9982-a7e63e585b9c', // 1000 Serv. Personales
  mat: 'b1f20b04-20dc-4eb5-8205-0139464c3ecf', // 2000 Materiales
  sg:  'b2c699e9-83f6-4f71-90bd-f631f33d9a08', // 3000 Serv. Generales
  f1:  '9fbdd5eb-3e10-456d-850e-2b4f1721075e', // Fuente: Recursos Fiscales
  f5:  'd7981165-ff44-4e2b-bc64-73bf58cdeb10', // Fuente: Recursos Federales
};

// Store IDs created during seed
const ids = {};

async function main() {
  try {
    // ═══════════════════════════════════════════════════════════════
    // PASO 1: Crear cuentas detalle (nivel 4, es_detalle=true)
    // ═══════════════════════════════════════════════════════════════
    log('PASO 1: Creando cuentas detalle nivel 4...');

    const detailAccounts = await sql(`
      INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, padre_id, es_detalle) VALUES
        ('${ENTE}', '1.1.1.1', 'Caja', 4, 'activo', 'deudora', '${C['1.1.1']}', true),
        ('${ENTE}', '1.1.1.2', 'Bancos - Cuenta Operativa', 4, 'activo', 'deudora', '${C['1.1.1']}', true),
        ('${ENTE}', '1.1.1.3', 'Bancos - Cuenta de Inversiones', 4, 'activo', 'deudora', '${C['1.1.1']}', true),
        ('${ENTE}', '1.1.2.1', 'Cuentas por Cobrar por Impuestos', 4, 'activo', 'deudora', '${C['1.1.2']}', true),
        ('${ENTE}', '1.1.2.2', 'Cuentas por Cobrar por Derechos', 4, 'activo', 'deudora', '${C['1.1.2']}', true),
        ('${ENTE}', '1.2.3.1', 'Terrenos', 4, 'activo', 'deudora', '${C['1.2.3']}', true),
        ('${ENTE}', '1.2.3.2', 'Edificios y Locales', 4, 'activo', 'deudora', '${C['1.2.3']}', true),
        ('${ENTE}', '1.2.4.1', 'Mobiliario y Equipo de Oficina', 4, 'activo', 'deudora', '${C['1.2.4']}', true),
        ('${ENTE}', '1.2.4.2', 'Vehiculos y Equipo de Transporte', 4, 'activo', 'deudora', '${C['1.2.4']}', true),
        ('${ENTE}', '1.2.4.3', 'Equipo de Computo', 4, 'activo', 'deudora', '${C['1.2.4']}', true),
        ('${ENTE}', '2.1.1.1', 'Proveedores por Pagar CP', 4, 'pasivo', 'acreedora', '${C['2.1.1']}', true),
        ('${ENTE}', '2.1.1.2', 'Remuneraciones Pendientes de Pago', 4, 'pasivo', 'acreedora', '${C['2.1.1']}', true),
        ('${ENTE}', '2.1.1.3', 'Retenciones y Contribuciones por Pagar', 4, 'pasivo', 'acreedora', '${C['2.1.1']}', true),
        ('${ENTE}', '2.2.3.1', 'Creditos Bancarios LP', 4, 'pasivo', 'acreedora', '${C['2.2.3']}', true),
        ('${ENTE}', '4.1.1.1', 'Impuesto Predial', 4, 'ingresos', 'acreedora', '${C['4.1.1']}', true),
        ('${ENTE}', '4.1.1.2', 'Impuesto sobre Adquisicion de Inmuebles', 4, 'ingresos', 'acreedora', '${C['4.1.1']}', true),
        ('${ENTE}', '4.1.4.1', 'Derechos por Servicios de Agua Potable', 4, 'ingresos', 'acreedora', '${C['4.1.4']}', true),
        ('${ENTE}', '4.1.4.2', 'Derechos por Licencias y Permisos', 4, 'ingresos', 'acreedora', '${C['4.1.4']}', true),
        ('${ENTE}', '4.2.1.1', 'Fondo General de Participaciones', 4, 'ingresos', 'acreedora', '${C['4.2.1']}', true),
        ('${ENTE}', '4.2.1.2', 'FISM - Fondo de Infraestructura Social Municipal', 4, 'ingresos', 'acreedora', '${C['4.2.1']}', true),
        ('${ENTE}', '4.2.1.3', 'FORTAMUN - Fondo de Fortalecimiento Municipal', 4, 'ingresos', 'acreedora', '${C['4.2.1']}', true),
        ('${ENTE}', '5.1.1.1', 'Sueldos y Salarios', 4, 'gastos', 'deudora', '${C['5.1.1']}', true),
        ('${ENTE}', '5.1.1.2', 'Gratificaciones y Aguinaldos', 4, 'gastos', 'deudora', '${C['5.1.1']}', true),
        ('${ENTE}', '5.1.1.3', 'Cuotas al IMSS e ISSSTE', 4, 'gastos', 'deudora', '${C['5.1.1']}', true),
        ('${ENTE}', '5.1.2.1', 'Materiales de Oficina', 4, 'gastos', 'deudora', '${C['5.1.2']}', true),
        ('${ENTE}', '5.1.2.2', 'Combustibles y Lubricantes', 4, 'gastos', 'deudora', '${C['5.1.2']}', true),
        ('${ENTE}', '5.1.3.1', 'Energia Electrica', 4, 'gastos', 'deudora', '${C['5.1.3']}', true),
        ('${ENTE}', '5.1.3.2', 'Telefonia e Internet', 4, 'gastos', 'deudora', '${C['5.1.3']}', true),
        ('${ENTE}', '5.1.3.3', 'Servicio de Limpieza y Mantenimiento', 4, 'gastos', 'deudora', '${C['5.1.3']}', true),
        ('${ENTE}', '5.4.1.1', 'Intereses de Credito Bancario', 4, 'gastos', 'deudora', '${C['5.4.1']}', true)
      ON CONFLICT (ente_id, codigo) DO NOTHING
      RETURNING id, codigo
    `);
    log(`  -> ${detailAccounts.length} cuentas detalle creadas`);

    // Get IDs of detail accounts
    const accts = await sql(`SELECT id, codigo FROM plan_de_cuentas WHERE ente_id = '${ENTE}' AND nivel = 4`);
    const A = {};
    accts.forEach(a => A[a.codigo] = a.id);
    log(`  -> ${Object.keys(A).length} cuentas detalle disponibles`);

    // ═══════════════════════════════════════════════════════════════
    // PASO 2: Polizas de Enero 2026
    // ═══════════════════════════════════════════════════════════════
    log('PASO 2: Creando polizas de Enero 2026...');

    // --- Poliza D-1: Apertura del ejercicio ---
    const p1 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'diario', 1, '2026-01-02',
        'Asiento de apertura del ejercicio 2026 - Saldos iniciales', 'aprobada', 15500000, 15500000)
      RETURNING id
    `);
    const polD1 = p1[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polD1}', 1, '${A['1.1.1.2']}', 'Saldo inicial Bancos Operativa', 8500000, 0),
        ('${polD1}', 2, '${A['1.1.1.3']}', 'Saldo inicial Bancos Inversiones', 2000000, 0),
        ('${polD1}', 3, '${A['1.2.3.1']}', 'Saldo inicial Terrenos', 3500000, 0),
        ('${polD1}', 4, '${A['1.2.3.2']}', 'Saldo inicial Edificio Palacio Municipal', 1500000, 0),
        ('${polD1}', 5, '${A['2.1.1.1']}', 'Saldo inicial Proveedores', 0, 350000),
        ('${polD1}', 6, '${A['2.2.3.1']}', 'Saldo inicial Credito Bancario LP', 0, 2150000),
        ('${polD1}', 7, '${A['2.1.1.3']}', 'Retenciones pendientes dic 2025', 0, 85000),
        ('${polD1}', 8, '${C['3.2.2']}', 'Resultados de ejercicios anteriores', 0, 12915000)
    `);
    log('  -> Poliza D-1: Apertura creada');

    // --- Poliza I-1: Cobro Predial Enero ---
    const p2 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'ingreso', 1, '2026-01-15',
        'Cobro de impuesto predial primer bimestre 2026', 'aprobada', 1250000, 1250000)
      RETURNING id
    `);
    const polI1 = p2[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polI1}', 1, '${A['1.1.1.2']}', 'Deposito cobro predial', 1250000, 0),
        ('${polI1}', 2, '${A['4.1.1.1']}', 'Ingreso impuesto predial 1er bimestre', 0, 1250000)
    `);
    log('  -> Poliza I-1: Cobro predial creada');

    // --- Poliza I-2: Cobro Derechos Agua ---
    const p3 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'ingreso', 2, '2026-01-20',
        'Cobro derechos de agua potable enero 2026', 'aprobada', 380000, 380000)
      RETURNING id
    `);
    const polI2 = p3[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polI2}', 1, '${A['1.1.1.2']}', 'Deposito cobro agua potable', 380000, 0),
        ('${polI2}', 2, '${A['4.1.4.1']}', 'Derechos agua potable enero', 0, 380000)
    `);
    log('  -> Poliza I-2: Cobro agua creada');

    // --- Poliza I-3: Recepcion Participaciones Federales ---
    const p4 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'ingreso', 3, '2026-01-25',
        'Recepcion de participaciones federales enero 2026', 'aprobada', 4200000, 4200000)
      RETURNING id
    `);
    const polI3 = p4[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polI3}', 1, '${A['1.1.1.2']}', 'Deposito participaciones federales', 4200000, 0),
        ('${polI3}', 2, '${A['4.2.1.1']}', 'Fondo General de Participaciones enero', 0, 2800000),
        ('${polI3}', 3, '${A['4.2.1.2']}', 'FISM enero 2026', 0, 850000),
        ('${polI3}', 4, '${A['4.2.1.3']}', 'FORTAMUN enero 2026', 0, 550000)
    `);
    log('  -> Poliza I-3: Participaciones creada');

    // --- Poliza E-1: Nomina Enero ---
    const p5 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'egreso', 1, '2026-01-31',
        'Nomina quincenal 1ra y 2da quincena enero 2026', 'aprobada', 2850000, 2850000)
      RETURNING id
    `);
    const polE1 = p5[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polE1}', 1, '${A['5.1.1.1']}', 'Sueldos y salarios enero 2026', 2200000, 0),
        ('${polE1}', 2, '${A['5.1.1.3']}', 'Cuotas patronales IMSS enero', 650000, 0),
        ('${polE1}', 3, '${A['1.1.1.2']}', 'Pago nomina via bancaria', 0, 2350000),
        ('${polE1}', 4, '${A['2.1.1.3']}', 'Retenciones ISR e IMSS trabajadores', 0, 500000)
    `);
    log('  -> Poliza E-1: Nomina enero creada');

    // --- Poliza E-2: Pago Proveedores ---
    const p6 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'egreso', 2, '2026-01-28',
        'Pago a proveedores diversos enero 2026', 'aprobada', 520000, 520000)
      RETURNING id
    `);
    const polE2 = p6[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polE2}', 1, '${A['5.1.2.1']}', 'Materiales de oficina enero', 85000, 0),
        ('${polE2}', 2, '${A['5.1.2.2']}', 'Combustibles parque vehicular enero', 135000, 0),
        ('${polE2}', 3, '${A['5.1.3.1']}', 'Energia electrica enero', 180000, 0),
        ('${polE2}', 4, '${A['5.1.3.2']}', 'Telefonia e internet enero', 45000, 0),
        ('${polE2}', 5, '${A['5.1.3.3']}', 'Servicio de limpieza enero', 75000, 0),
        ('${polE2}', 6, '${A['1.1.1.2']}', 'Pago transferencia a proveedores', 0, 520000)
    `);
    log('  -> Poliza E-2: Proveedores enero creada');

    // --- Poliza E-3: Pago saldo proveedores dic 2025 ---
    const p7 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'egreso', 3, '2026-01-10',
        'Liquidacion saldos pendientes proveedores diciembre 2025', 'aprobada', 350000, 350000)
      RETURNING id
    `);
    const polE3 = p7[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polE3}', 1, '${A['2.1.1.1']}', 'Liquidacion proveedores dic 2025', 350000, 0),
        ('${polE3}', 2, '${A['1.1.1.2']}', 'Pago transferencia proveedores', 0, 350000)
    `);
    log('  -> Poliza E-3: Liquidacion proveedores creada');

    // ═══════════════════════════════════════════════════════════════
    // PASO 2b: Polizas de Febrero 2026
    // ═══════════════════════════════════════════════════════════════
    log('PASO 2b: Creando polizas de Febrero 2026...');

    // --- Poliza I-4 Feb: Cobro Licencias ---
    const p8 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[2]}', 'ingreso', 4, '2026-02-10',
        'Cobro licencias y permisos febrero 2026', 'aprobada', 290000, 290000)
      RETURNING id
    `);
    const polI1Feb = p8[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polI1Feb}', 1, '${A['1.1.1.2']}', 'Deposito cobro licencias', 290000, 0),
        ('${polI1Feb}', 2, '${A['4.1.4.2']}', 'Derechos licencias y permisos feb', 0, 290000)
    `);

    // --- Poliza I-5 Feb: Participaciones ---
    const p9 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[2]}', 'ingreso', 5, '2026-02-25',
        'Recepcion participaciones federales febrero 2026', 'aprobada', 4350000, 4350000)
      RETURNING id
    `);
    const polI2Feb = p9[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polI2Feb}', 1, '${A['1.1.1.2']}', 'Deposito participaciones feb', 4350000, 0),
        ('${polI2Feb}', 2, '${A['4.2.1.1']}', 'Fondo General Participaciones feb', 0, 2900000),
        ('${polI2Feb}', 3, '${A['4.2.1.2']}', 'FISM febrero 2026', 0, 880000),
        ('${polI2Feb}', 4, '${A['4.2.1.3']}', 'FORTAMUN febrero 2026', 0, 570000)
    `);

    // --- Poliza E-4 Feb: Nomina ---
    const p10 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[2]}', 'egreso', 4, '2026-02-28',
        'Nomina quincenal 1ra y 2da quincena febrero 2026', 'aprobada', 2850000, 2850000)
      RETURNING id
    `);
    const polE1Feb = p10[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polE1Feb}', 1, '${A['5.1.1.1']}', 'Sueldos y salarios febrero 2026', 2200000, 0),
        ('${polE1Feb}', 2, '${A['5.1.1.3']}', 'Cuotas patronales IMSS feb', 650000, 0),
        ('${polE1Feb}', 3, '${A['1.1.1.2']}', 'Pago nomina via bancaria feb', 0, 2350000),
        ('${polE1Feb}', 4, '${A['2.1.1.3']}', 'Retenciones ISR e IMSS feb', 0, 500000)
    `);

    // --- Poliza E-5 Feb: Servicios ---
    const p11 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[2]}', 'egreso', 5, '2026-02-20',
        'Pago servicios y materiales febrero 2026', 'aprobada', 495000, 495000)
      RETURNING id
    `);
    const polE2Feb = p11[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polE2Feb}', 1, '${A['5.1.2.1']}', 'Materiales de oficina feb', 70000, 0),
        ('${polE2Feb}', 2, '${A['5.1.2.2']}', 'Combustibles feb', 125000, 0),
        ('${polE2Feb}', 3, '${A['5.1.3.1']}', 'Energia electrica feb', 175000, 0),
        ('${polE2Feb}', 4, '${A['5.1.3.2']}', 'Telefonia e internet feb', 50000, 0),
        ('${polE2Feb}', 5, '${A['5.1.3.3']}', 'Limpieza y mantenimiento feb', 75000, 0),
        ('${polE2Feb}', 6, '${A['1.1.1.2']}', 'Pago transferencia proveedores feb', 0, 495000)
    `);

    // --- Poliza D-2 Feb: Compra equipo de computo ---
    const p12 = await sql(`
      INSERT INTO poliza (ente_id, ejercicio_id, periodo_id, tipo, numero_poliza, fecha, descripcion, estado, total_debe, total_haber)
      VALUES ('${ENTE}', '${EJERCICIO}', '${P[2]}', 'diario', 2, '2026-02-15',
        'Adquisicion 10 equipos de computo para Tesoreria', 'aprobada', 350000, 350000)
      RETURNING id
    `);
    const polD2Feb = p12[0].id;
    await sql(`
      INSERT INTO movimiento_contable (poliza_id, numero_linea, cuenta_id, concepto, debe, haber) VALUES
        ('${polD2Feb}', 1, '${A['1.2.4.3']}', 'Alta 10 equipos computo Tesoreria', 350000, 0),
        ('${polD2Feb}', 2, '${A['1.1.1.2']}', 'Pago equipos de computo', 0, 350000)
    `);
    log('  -> 5 polizas de Febrero creadas');

    // --- Actualizar saldos para todas las polizas aprobadas ---
    log('PASO 2c: Actualizando saldos...');
    const polizas = await sql(`SELECT id FROM poliza WHERE estado = 'aprobada' ORDER BY fecha`);
    for (const pol of polizas) {
      await sql(`SELECT fn_actualizar_saldos('${pol.id}')`);
    }
    log(`  -> Saldos actualizados para ${polizas.length} polizas`);

    // ═══════════════════════════════════════════════════════════════
    // PASO 3: Presupuesto de Egresos
    // ═══════════════════════════════════════════════════════════════
    log('PASO 3: Creando presupuesto de egresos...');

    // Crear partidas
    const partidas = await sql(`
      INSERT INTO partida_egreso (ente_id, ejercicio_id, clasificador_id, fuente_id, clave, descripcion) VALUES
        ('${ENTE}', '${EJERCICIO}', '${CL.sp}',  '${CL.f1}', '1000-RF', 'Servicios Personales - Recursos Fiscales'),
        ('${ENTE}', '${EJERCICIO}', '${CL.mat}', '${CL.f1}', '2000-RF', 'Materiales y Suministros - Recursos Fiscales'),
        ('${ENTE}', '${EJERCICIO}', '${CL.sg}',  '${CL.f1}', '3000-RF', 'Servicios Generales - Recursos Fiscales'),
        ('${ENTE}', '${EJERCICIO}', '${CL.sp}',  '${CL.f5}', '1000-FF', 'Servicios Personales - Fondos Federales'),
        ('${ENTE}', '${EJERCICIO}', '${CL.mat}', '${CL.f5}', '2000-FF', 'Materiales y Suministros - Fondos Federales')
      RETURNING id, clave
    `);
    const PE = {};
    partidas.forEach(p => PE[p.clave] = p.id);
    log(`  -> ${partidas.length} partidas de egreso creadas`);

    // Movimientos presupuestales: aprobado -> comprometido -> devengado -> ejercido -> pagado
    const momEgreso = [
      // Partida 1000-RF: Nomina
      { pid: PE['1000-RF'], per: 1, momento: 'aprobado',     monto: 34200000, desc: 'PEF Aprobado Serv. Personales' },
      { pid: PE['1000-RF'], per: 1, momento: 'comprometido', monto: 2850000,  desc: 'Compromiso nomina enero' },
      { pid: PE['1000-RF'], per: 1, momento: 'devengado',    monto: 2850000,  desc: 'Devengado nomina enero' },
      { pid: PE['1000-RF'], per: 1, momento: 'ejercido',     monto: 2850000,  desc: 'Ejercido nomina enero' },
      { pid: PE['1000-RF'], per: 1, momento: 'pagado',       monto: 2850000,  desc: 'Pagado nomina enero' },
      { pid: PE['1000-RF'], per: 2, momento: 'comprometido', monto: 2850000,  desc: 'Compromiso nomina febrero' },
      { pid: PE['1000-RF'], per: 2, momento: 'devengado',    monto: 2850000,  desc: 'Devengado nomina febrero' },
      { pid: PE['1000-RF'], per: 2, momento: 'ejercido',     monto: 2850000,  desc: 'Ejercido nomina febrero' },
      { pid: PE['1000-RF'], per: 2, momento: 'pagado',       monto: 2850000,  desc: 'Pagado nomina febrero' },
      // Partida 2000-RF: Materiales
      { pid: PE['2000-RF'], per: 1, momento: 'aprobado',     monto: 3600000, desc: 'PEF Aprobado Materiales' },
      { pid: PE['2000-RF'], per: 1, momento: 'comprometido', monto: 220000,  desc: 'Compromiso materiales enero' },
      { pid: PE['2000-RF'], per: 1, momento: 'devengado',    monto: 220000,  desc: 'Devengado materiales enero' },
      { pid: PE['2000-RF'], per: 1, momento: 'ejercido',     monto: 220000,  desc: 'Ejercido materiales enero' },
      { pid: PE['2000-RF'], per: 1, momento: 'pagado',       monto: 220000,  desc: 'Pagado materiales enero' },
      { pid: PE['2000-RF'], per: 2, momento: 'comprometido', monto: 195000,  desc: 'Compromiso materiales feb' },
      { pid: PE['2000-RF'], per: 2, momento: 'devengado',    monto: 195000,  desc: 'Devengado materiales feb' },
      { pid: PE['2000-RF'], per: 2, momento: 'ejercido',     monto: 195000,  desc: 'Ejercido materiales feb' },
      { pid: PE['2000-RF'], per: 2, momento: 'pagado',       monto: 195000,  desc: 'Pagado materiales feb' },
      // Partida 3000-RF: Servicios Generales
      { pid: PE['3000-RF'], per: 1, momento: 'aprobado',     monto: 4800000, desc: 'PEF Aprobado Servicios Grales' },
      { pid: PE['3000-RF'], per: 1, momento: 'comprometido', monto: 300000,  desc: 'Compromiso servicios enero' },
      { pid: PE['3000-RF'], per: 1, momento: 'devengado',    monto: 300000,  desc: 'Devengado servicios enero' },
      { pid: PE['3000-RF'], per: 1, momento: 'ejercido',     monto: 300000,  desc: 'Ejercido servicios enero' },
      { pid: PE['3000-RF'], per: 1, momento: 'pagado',       monto: 300000,  desc: 'Pagado servicios enero' },
      { pid: PE['3000-RF'], per: 2, momento: 'comprometido', monto: 300000,  desc: 'Compromiso servicios feb' },
      { pid: PE['3000-RF'], per: 2, momento: 'devengado',    monto: 300000,  desc: 'Devengado servicios feb' },
      { pid: PE['3000-RF'], per: 2, momento: 'ejercido',     monto: 300000,  desc: 'Ejercido servicios feb' },
      { pid: PE['3000-RF'], per: 2, momento: 'pagado',       monto: 300000,  desc: 'Pagado servicios feb' },
    ];

    const fechas = { 1: '2026-01-31', 2: '2026-02-28' };
    for (const m of momEgreso) {
      const f = m.momento === 'aprobado' ? '2026-01-01' : fechas[m.per];
      await sql(`
        INSERT INTO movimiento_presupuestal_egreso (partida_id, periodo_id, momento, monto, descripcion, fecha)
        VALUES ('${m.pid}', '${P[m.per]}', '${m.momento}', ${m.monto}, '${m.desc}', '${f}')
      `);
    }
    log(`  -> ${momEgreso.length} movimientos presupuestales de egreso creados`);

    // ═══════════════════════════════════════════════════════════════
    // PASO 4: Presupuesto de Ingresos
    // ═══════════════════════════════════════════════════════════════
    log('PASO 4: Creando presupuesto de ingresos...');

    // Clasificadores de ingreso: usamos los de fuente_financiamiento como proxy
    // (conceptos usan clasificador de objeto_gasto o funcional - usamos los COG)
    const conceptos = await sql(`
      INSERT INTO concepto_ingreso (ente_id, ejercicio_id, clasificador_id, clave, descripcion) VALUES
        ('${ENTE}', '${EJERCICIO}', '${CL.sp}', 'IMP-PRED', 'Impuesto Predial'),
        ('${ENTE}', '${EJERCICIO}', '${CL.mat}', 'DER-AGUA', 'Derechos de Agua Potable'),
        ('${ENTE}', '${EJERCICIO}', '${CL.sg}', 'DER-LIC', 'Derechos por Licencias y Permisos'),
        ('${ENTE}', '${EJERCICIO}', '${CL.sp}', 'PART-FGP', 'Fondo General de Participaciones'),
        ('${ENTE}', '${EJERCICIO}', '${CL.mat}', 'PART-FISM', 'FISM - Infraestructura Social'),
        ('${ENTE}', '${EJERCICIO}', '${CL.sg}', 'PART-FORT', 'FORTAMUN - Fortalecimiento Municipal')
      RETURNING id, clave
    `);
    const CI = {};
    conceptos.forEach(c => CI[c.clave] = c.id);
    log(`  -> ${conceptos.length} conceptos de ingreso creados`);

    const momIngreso = [
      // Predial
      { cid: CI['IMP-PRED'], per: 1, momento: 'estimado',  monto: 8500000, desc: 'LI Estimada Predial 2026' },
      { cid: CI['IMP-PRED'], per: 1, momento: 'devengado', monto: 1250000, desc: 'Devengado predial enero' },
      { cid: CI['IMP-PRED'], per: 1, momento: 'recaudado', monto: 1250000, desc: 'Recaudado predial enero' },
      // Agua
      { cid: CI['DER-AGUA'], per: 1, momento: 'estimado',  monto: 5200000, desc: 'LI Estimada Agua 2026' },
      { cid: CI['DER-AGUA'], per: 1, momento: 'devengado', monto: 380000,  desc: 'Devengado agua enero' },
      { cid: CI['DER-AGUA'], per: 1, momento: 'recaudado', monto: 380000,  desc: 'Recaudado agua enero' },
      // Licencias
      { cid: CI['DER-LIC'], per: 1, momento: 'estimado',  monto: 2800000, desc: 'LI Estimada Licencias 2026' },
      { cid: CI['DER-LIC'], per: 2, momento: 'devengado', monto: 290000,  desc: 'Devengado licencias feb' },
      { cid: CI['DER-LIC'], per: 2, momento: 'recaudado', monto: 290000,  desc: 'Recaudado licencias feb' },
      // Participaciones - FGP
      { cid: CI['PART-FGP'],  per: 1, momento: 'estimado',  monto: 35000000, desc: 'LI Estimada FGP 2026' },
      { cid: CI['PART-FGP'],  per: 1, momento: 'devengado', monto: 2800000,  desc: 'FGP devengado enero' },
      { cid: CI['PART-FGP'],  per: 1, momento: 'recaudado', monto: 2800000,  desc: 'FGP recaudado enero' },
      { cid: CI['PART-FGP'],  per: 2, momento: 'devengado', monto: 2900000,  desc: 'FGP devengado feb' },
      { cid: CI['PART-FGP'],  per: 2, momento: 'recaudado', monto: 2900000,  desc: 'FGP recaudado feb' },
      // FISM
      { cid: CI['PART-FISM'], per: 1, momento: 'estimado',  monto: 10200000, desc: 'LI Estimada FISM 2026' },
      { cid: CI['PART-FISM'], per: 1, momento: 'devengado', monto: 850000,   desc: 'FISM devengado enero' },
      { cid: CI['PART-FISM'], per: 1, momento: 'recaudado', monto: 850000,   desc: 'FISM recaudado enero' },
      { cid: CI['PART-FISM'], per: 2, momento: 'devengado', monto: 880000,   desc: 'FISM devengado feb' },
      { cid: CI['PART-FISM'], per: 2, momento: 'recaudado', monto: 880000,   desc: 'FISM recaudado feb' },
      // FORTAMUN
      { cid: CI['PART-FORT'], per: 1, momento: 'estimado',  monto: 6800000, desc: 'LI Estimada FORTAMUN 2026' },
      { cid: CI['PART-FORT'], per: 1, momento: 'devengado', monto: 550000,  desc: 'FORTAMUN devengado enero' },
      { cid: CI['PART-FORT'], per: 1, momento: 'recaudado', monto: 550000,  desc: 'FORTAMUN recaudado enero' },
      { cid: CI['PART-FORT'], per: 2, momento: 'devengado', monto: 570000,  desc: 'FORTAMUN devengado feb' },
      { cid: CI['PART-FORT'], per: 2, momento: 'recaudado', monto: 570000,  desc: 'FORTAMUN recaudado feb' },
    ];

    for (const m of momIngreso) {
      const f = m.momento === 'estimado' ? '2026-01-01' : fechas[m.per] || '2026-01-31';
      await sql(`
        INSERT INTO movimiento_presupuestal_ingreso (concepto_id, periodo_id, momento, monto, descripcion, fecha)
        VALUES ('${m.cid}', '${P[m.per]}', '${m.momento}', ${m.monto}, '${m.desc}', '${f}')
      `);
    }
    log(`  -> ${momIngreso.length} movimientos presupuestales de ingreso creados`);

    // ═══════════════════════════════════════════════════════════════
    // PASO 5: Patrimonio
    // ═══════════════════════════════════════════════════════════════
    log('PASO 5: Creando bienes patrimoniales...');

    await sql(`
      INSERT INTO bien_patrimonial (ente_id, ejercicio_id, clave, descripcion, tipo, fecha_adquisicion, valor_adquisicion, depreciacion_acumulada, vida_util_anios, tasa_depreciacion, ubicacion, responsable, numero_serie, marca, modelo, estado, cuenta_contable_id) VALUES
        ('${ENTE}', '${EJERCICIO}', 'VEH-001', 'Camioneta pickup Presidencia', 'mueble', '2024-03-15', 650000, 130000, 5, 20.00, 'Estacionamiento Palacio Municipal', 'Juan Perez Garcia', 'VIN123456789', 'Chevrolet', 'Silverado 2024', 'activo', '${A['1.2.4.2']}'),
        ('${ENTE}', '${EJERCICIO}', 'VEH-002', 'Camioneta recolectora residuos', 'mueble', '2023-06-01', 1200000, 480000, 5, 20.00, 'Base de Servicios Publicos', 'Miguel Lopez Ruiz', 'VIN987654321', 'International', 'DuraStar 2023', 'activo', '${A['1.2.4.2']}'),
        ('${ENTE}', '${EJERCICIO}', 'MOB-001', 'Escritorios ejecutivos (lote 15)', 'mueble', '2025-01-20', 225000, 22500, 10, 10.00, 'Palacio Municipal - Planta Alta', 'Maria Gonzalez Torres', NULL, 'OfficeMax', 'Ejecutivo Premium', 'activo', '${A['1.2.4.1']}'),
        ('${ENTE}', '${EJERCICIO}', 'MOB-002', 'Sillas ergonomicas (lote 30)', 'mueble', '2025-01-20', 180000, 18000, 10, 10.00, 'Palacio Municipal', 'Maria Gonzalez Torres', NULL, 'Herman Miller', 'Aeron', 'activo', '${A['1.2.4.1']}'),
        ('${ENTE}', '${EJERCICIO}', 'EQC-001', 'Servidores de red (2 unidades)', 'mueble', '2025-08-10', 420000, 35000, 4, 25.00, 'Centro de Datos', 'Roberto Sanchez Mendez', 'SRV-2025-001', 'Dell', 'PowerEdge R750', 'activo', '${A['1.2.4.3']}'),
        ('${ENTE}', '${EJERCICIO}', 'EQC-002', 'Equipos de computo Tesoreria (10)', 'mueble', '2026-02-15', 350000, 0, 4, 25.00, 'Tesoreria Municipal', 'Ana Martinez Luna', NULL, 'HP', 'ProDesk 400 G9', 'activo', '${A['1.2.4.3']}'),
        ('${ENTE}', '${EJERCICIO}', 'INM-001', 'Terreno Palacio Municipal', 'inmueble', '1990-01-01', 2500000, 0, NULL, NULL, 'Centro Historico', 'Municipio de Ejemplo', NULL, NULL, NULL, 'activo', '${A['1.2.3.1']}'),
        ('${ENTE}', '${EJERCICIO}', 'INM-002', 'Edificio Palacio Municipal', 'inmueble', '1995-06-15', 1500000, 450000, 50, 2.00, 'Centro Historico', 'Municipio de Ejemplo', NULL, NULL, NULL, 'activo', '${A['1.2.3.2']}'),
        ('${ENTE}', '${EJERCICIO}', 'INM-003', 'Terreno parque recreativo Norte', 'inmueble', '2020-04-01', 1000000, 0, NULL, NULL, 'Colonia Norte', 'Municipio de Ejemplo', NULL, NULL, NULL, 'activo', '${A['1.2.3.1']}')
      ON CONFLICT DO NOTHING
    `);
    log('  -> 9 bienes patrimoniales creados');

    // Inventario conteo
    await sql(`
      INSERT INTO inventario_conteo (ente_id, ejercicio_id, periodo_id, clave, descripcion, fecha_conteo, responsable, ubicacion, total_bienes, valor_total, estado, observaciones) VALUES
        ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'INV-2026-001', 'Inventario fisico anual 2026 - Mobiliario', '2026-01-15', 'Maria Gonzalez Torres', 'Palacio Municipal', 45, 405000, 'finalizado', 'Inventario completo sin diferencias'),
        ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'INV-2026-002', 'Inventario fisico anual 2026 - Equipo de Computo', '2026-01-16', 'Roberto Sanchez Mendez', 'Todas las areas', 32, 770000, 'finalizado', '2 equipos dados de baja por obsolescencia'),
        ('${ENTE}', '${EJERCICIO}', '${P[1]}', 'INV-2026-003', 'Inventario fisico anual 2026 - Vehiculos', '2026-01-17', 'Juan Perez Garcia', 'Base vehicular', 8, 4200000, 'finalizado', 'Todos los vehiculos en operacion')
      ON CONFLICT DO NOTHING
    `);
    log('  -> 3 conteos de inventario creados');

    // Fideicomiso
    await sql(`
      INSERT INTO fideicomiso (ente_id, ejercicio_id, clave, nombre, tipo, mandante, fiduciario, fideicomisario, monto_patrimonio, fecha_constitucion, vigencia_anios, objeto, estado) VALUES
        ('${ENTE}', '${EJERCICIO}', 'FID-001', 'Fideicomiso de Obra Publica Municipal', 'administracion', 'Municipio de Ejemplo', 'Banco Nacional de Mexico', 'Contratistas de obra', 5000000, '2024-06-01', 3, 'Administrar recursos para obras de infraestructura basica municipal 2024-2027', 'vigente')
      ON CONFLICT DO NOTHING
    `);
    log('  -> 1 fideicomiso creado');

    // ═══════════════════════════════════════════════════════════════
    // PASO 6: Deuda Publica
    // ═══════════════════════════════════════════════════════════════
    log('PASO 6: Creando instrumentos de deuda...');

    const deuda = await sql(`
      INSERT INTO instrumento_deuda (ente_id, ejercicio_id, clave, descripcion, tipo, acreedor, monto_original, saldo_vigente, tasa_interes, tipo_tasa, plazo_meses, fecha_contratacion, fecha_vencimiento, destino_recursos, garantia, estado, cuenta_contable_id) VALUES
        ('${ENTE}', '${EJERCICIO}', 'CRED-001', 'Credito para infraestructura hidraulica', 'credito', 'BANOBRAS', 3000000, 2150000, 8.5000, 'fija', 60, '2023-07-01', '2028-07-01', 'Construccion de red de agua potable Col. Sur', 'Participaciones federales', 'vigente', '${A['2.2.3.1']}'),
        ('${ENTE}', '${EJERCICIO}', 'CRED-002', 'Credito para pavimentacion', 'credito', 'Banco del Bajio', 1500000, 1350000, 9.2500, 'fija', 36, '2025-03-15', '2028-03-15', 'Pavimentacion de 5 calles principales', 'Participaciones federales', 'vigente', '${A['2.2.3.1']}')
      RETURNING id, clave
    `);
    const DEUDA = {};
    deuda.forEach(d => DEUDA[d.clave] = d.id);
    log(`  -> ${deuda.length} instrumentos de deuda creados`);

    // Movimientos de deuda
    await sql(`
      INSERT INTO movimiento_deuda (instrumento_id, periodo_id, tipo, monto, fecha, descripcion) VALUES
        ('${DEUDA['CRED-001']}', '${P[1]}', 'amortizacion', 50000, '2026-01-15', 'Pago mensual capital enero BANOBRAS'),
        ('${DEUDA['CRED-001']}', '${P[1]}', 'pago_intereses', 15229, '2026-01-15', 'Pago intereses enero BANOBRAS'),
        ('${DEUDA['CRED-001']}', '${P[2]}', 'amortizacion', 50000, '2026-02-15', 'Pago mensual capital feb BANOBRAS'),
        ('${DEUDA['CRED-001']}', '${P[2]}', 'pago_intereses', 14875, '2026-02-15', 'Pago intereses feb BANOBRAS'),
        ('${DEUDA['CRED-002']}', '${P[1]}', 'amortizacion', 41667, '2026-01-20', 'Pago mensual capital enero Bajio'),
        ('${DEUDA['CRED-002']}', '${P[1]}', 'pago_intereses', 10406, '2026-01-20', 'Pago intereses enero Bajio'),
        ('${DEUDA['CRED-002']}', '${P[2]}', 'amortizacion', 41667, '2026-02-20', 'Pago mensual capital feb Bajio'),
        ('${DEUDA['CRED-002']}', '${P[2]}', 'pago_intereses', 10085, '2026-02-20', 'Pago intereses feb Bajio')
    `);
    log('  -> 8 movimientos de deuda creados');

    // ═══════════════════════════════════════════════════════════════
    // PASO 7: Fondos Federales
    // ═══════════════════════════════════════════════════════════════
    log('PASO 7: Creando fondos federales...');

    await sql(`
      INSERT INTO fondo_federal (ente_id, ejercicio_id, clave, nombre, tipo, fuente, monto_asignado, monto_recibido, monto_ejercido, monto_reintegrado, fecha_asignacion, descripcion, estado, clasificador_id) VALUES
        ('${ENTE}', '${EJERCICIO}', 'FISM-2026', 'FISM - Fondo de Infraestructura Social Municipal 2026', 'aportacion', 'Ramo 33 - Aportaciones Federales', 10200000, 1730000, 850000, 0, '2026-01-01', 'Recursos para infraestructura social basica: agua potable, drenaje, electrificacion, pavimentacion en zonas de alta marginacion', 'activo', '${CL.f5}'),
        ('${ENTE}', '${EJERCICIO}', 'FORT-2026', 'FORTAMUN - Fondo de Fortalecimiento Municipal 2026', 'aportacion', 'Ramo 33 - Aportaciones Federales', 6800000, 1120000, 750000, 0, '2026-01-01', 'Recursos para obligaciones financieras, seguridad publica y necesidades directamente vinculadas', 'activo', '${CL.f5}'),
        ('${ENTE}', '${EJERCICIO}', 'FGP-2026', 'Fondo General de Participaciones 2026', 'participacion', 'Ramo 28 - Participaciones Federales', 35000000, 5700000, 4500000, 0, '2026-01-01', 'Participaciones federales de libre disposicion', 'activo', '${CL.f1}'),
        ('${ENTE}', '${EJERCICIO}', 'CONV-SEC', 'Convenio de Seguridad Publica 2026', 'convenio', 'Secretaria de Seguridad', 2500000, 0, 0, 0, '2026-02-15', 'Convenio para equipamiento de policia municipal y videovigilancia', 'activo', '${CL.f5}')
      ON CONFLICT DO NOTHING
    `);
    log('  -> 4 fondos federales creados');

    // ═══════════════════════════════════════════════════════════════
    // PASO 8: Verificacion final
    // ═══════════════════════════════════════════════════════════════
    log('PASO 8: Verificacion final...');

    const counts = await sql(`
      SELECT 'poliza' as tabla, count(*)::int as registros FROM poliza
      UNION ALL SELECT 'movimiento_contable', count(*)::int FROM movimiento_contable
      UNION ALL SELECT 'saldo_cuenta', count(*)::int FROM saldo_cuenta
      UNION ALL SELECT 'plan_de_cuentas (n4)', count(*)::int FROM plan_de_cuentas WHERE nivel = 4
      UNION ALL SELECT 'partida_egreso', count(*)::int FROM partida_egreso
      UNION ALL SELECT 'mov_pres_egreso', count(*)::int FROM movimiento_presupuestal_egreso
      UNION ALL SELECT 'concepto_ingreso', count(*)::int FROM concepto_ingreso
      UNION ALL SELECT 'mov_pres_ingreso', count(*)::int FROM movimiento_presupuestal_ingreso
      UNION ALL SELECT 'bien_patrimonial', count(*)::int FROM bien_patrimonial
      UNION ALL SELECT 'inventario_conteo', count(*)::int FROM inventario_conteo
      UNION ALL SELECT 'fideicomiso', count(*)::int FROM fideicomiso
      UNION ALL SELECT 'instrumento_deuda', count(*)::int FROM instrumento_deuda
      UNION ALL SELECT 'movimiento_deuda', count(*)::int FROM movimiento_deuda
      UNION ALL SELECT 'fondo_federal', count(*)::int FROM fondo_federal
      ORDER BY tabla
    `);

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  SEED DE OPERACION COMPLETADO            ║');
    console.log('╠══════════════════════════════════════════╣');
    counts.forEach(r => {
      const name = r.tabla.padEnd(25);
      console.log(`║  ${name} ${String(r.registros).padStart(5)} ║`);
    });
    console.log('╚══════════════════════════════════════════╝');

    // Verify balances
    const balance = await sql(`
      SELECT
        SUM(total_debe) as total_debe,
        SUM(total_haber) as total_haber,
        SUM(total_debe) - SUM(total_haber) as diferencia
      FROM poliza WHERE estado = 'aprobada'
    `);
    console.log(`\nBalance polizas: Debe=${balance[0].total_debe} Haber=${balance[0].total_haber} Diff=${balance[0].diferencia}`);

  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

main();
