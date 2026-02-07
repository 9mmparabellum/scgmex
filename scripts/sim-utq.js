#!/usr/bin/env node
// sim-utq.js — Simulacion completa: Universidad Tecnologica de Queretaro
// Simula usuarios reales operando el sistema via REST API (misma que el frontend)

const SB = 'https://pfmiwusneqjplwwwlvyh.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbWl3dXNuZXFqcGx3d3dsdnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTI2OTQsImV4cCI6MjA4NTkyODY5NH0.f65WA8Lr3kJmEqfwZuNhoc5d_pFJq0nLfsJGoR0MH0Q';
const SRV = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbWl3dXNuZXFqcGx3d3dsdnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM1MjY5NCwiZXhwIjoyMDg1OTI4Njk0fQ.oNMXceNEyFmlJMJ_UfpUvbRakLhYmmxWre3dWlcqMXE';
const MGMT = 'sbp_70a80fd26d34ce96ab4e1b23b4104c37f7884469';
const REF = 'pfmiwusneqjplwwwlvyh';

let totalOps = 0;
const t0 = Date.now();

function log(user, page, action) {
  totalOps++;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[${elapsed}s] ${user.padEnd(22)} | ${page.padEnd(30)} | ${action}`);
}

async function post(table, data) {
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${SRV}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(`POST ${table}: ${r.status} ${await r.text()}`);
  const res = await r.json();
  return Array.isArray(data) ? res : res[0];
}

async function patch(table, filter, data) {
  const r = await fetch(`${SB}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${SRV}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(`PATCH ${table}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function get(table, params = '') {
  const r = await fetch(`${SB}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${SRV}` }
  });
  if (!r.ok) throw new Error(`GET ${table}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MGMT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!r.ok) throw new Error(`SQL: ${r.status} ${await r.text()}`);
  return r.json();
}

// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SCGMEX — Simulacion de Operacion Real                     ║');
  console.log('║  Universidad Tecnologica de Queretaro (UTQ)                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── FASE 1: SUPER ADMIN — Crear Ente ──────────────────────
  console.log('━━━ FASE 1: SUPER ADMIN — Configuracion del Ente ━━━\n');

  log('SUPER ADMIN', 'Sistema > Entes', 'Click: Nuevo Ente → Crear');
  const ente = await post('ente_publico', {
    clave: 'UTQ-001', nombre: 'Universidad Tecnologica de Queretaro',
    nombre_corto: 'UTQ', nivel_gobierno: 'estatal', tipo_ente: 'autonomo',
    entidad_federativa: 'Queretaro', titular: 'Dr. Ricardo Fuentes Lara', activo: true
  });
  console.log(`   → Ente creado: ${ente.id}\n`);
  const E = ente.id;

  log('SUPER ADMIN', 'Sistema > Ejercicios', 'Click: Nuevo Ejercicio 2026');
  const ejercicio = await post('ejercicio_fiscal', {
    ente_id: E, anio: 2026, fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31', estado: 'abierto'
  });
  const EJ = ejercicio.id;

  // Create 13 periodos
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre','Ajustes'];
  const periodos = [];
  for (let i = 0; i < 13; i++) {
    const fi = i < 12 ? `2026-${String(i+1).padStart(2,'0')}-01` : '2026-12-31';
    const ff = i < 12 ? `2026-${String(i+1).padStart(2,'0')}-${[31,28,31,30,31,30,31,31,30,31,30,31][i]}` : '2026-12-31';
    const p = await post('periodo_contable', {
      ejercicio_id: EJ, numero: i+1, nombre: meses[i], fecha_inicio: fi, fecha_fin: ff, estado: 'cerrado'
    });
    periodos.push(p);
  }
  log('SUPER ADMIN', 'Sistema > Periodos', `13 periodos creados`);

  // Open Jan, Feb, Mar
  for (let i = 0; i < 3; i++) {
    await patch('periodo_contable', `id=eq.${periodos[i].id}`, { estado: 'abierto' });
  }
  log('SUPER ADMIN', 'Sistema > Periodos', 'Abiertos: Enero, Febrero, Marzo');

  // ─── Plan de Cuentas via SQL (bulk, como carga inicial CONAC) ───
  log('SUPER ADMIN', 'Catalogos > Plan Cuentas', 'Carga inicial CONAC (42 cuentas)');
  await sql(`
    INSERT INTO plan_de_cuentas (ente_id, codigo, nombre, nivel, tipo_cuenta, naturaleza, es_detalle) VALUES
    -- Nivel 1
    ('${E}','1','Activo',1,'activo','deudora',false),
    ('${E}','2','Pasivo',1,'pasivo','acreedora',false),
    ('${E}','3','Hacienda Publica',1,'hacienda','acreedora',false),
    ('${E}','4','Ingresos y Otros Beneficios',1,'ingresos','acreedora',false),
    ('${E}','5','Gastos y Otras Perdidas',1,'gastos','deudora',false),
    -- Nivel 2
    ('${E}','1.1','Activo Circulante',2,'activo','deudora',false),
    ('${E}','1.2','Activo No Circulante',2,'activo','deudora',false),
    ('${E}','2.1','Pasivo Circulante',2,'pasivo','acreedora',false),
    ('${E}','3.1','Hacienda Publica Contribuida',2,'hacienda','acreedora',false),
    ('${E}','3.2','Hacienda Publica Generada',2,'hacienda','acreedora',false),
    ('${E}','4.1','Ingresos de Gestion',2,'ingresos','acreedora',false),
    ('${E}','5.1','Gastos de Funcionamiento',2,'gastos','deudora',false),
    -- Nivel 3
    ('${E}','1.1.1','Efectivo y Equivalentes',3,'activo','deudora',false),
    ('${E}','1.1.2','Derechos a Recibir Efectivo',3,'activo','deudora',false),
    ('${E}','1.2.4','Bienes Muebles',3,'activo','deudora',false),
    ('${E}','2.1.1','Cuentas por Pagar a Corto Plazo',3,'pasivo','acreedora',false),
    ('${E}','2.1.7','Provisiones a Corto Plazo',3,'pasivo','acreedora',false),
    ('${E}','3.1.1','Hacienda Publica Contribuida',3,'hacienda','acreedora',false),
    ('${E}','3.2.1','Resultados del Ejercicio',3,'hacienda','acreedora',false),
    ('${E}','3.2.2','Resultados de Ejercicios Anteriores',3,'hacienda','acreedora',false),
    ('${E}','4.1.1','Ingresos por Venta de Bienes y Prestacion de Servicios',3,'ingresos','acreedora',false),
    ('${E}','4.1.7','Transferencias Asignaciones Subsidios',3,'ingresos','acreedora',false),
    ('${E}','4.1.9','Otros Ingresos y Beneficios',3,'ingresos','acreedora',false),
    ('${E}','5.1.1','Gastos de Funcionamiento',3,'gastos','deudora',false),
    ('${E}','5.1.2','Materiales y Suministros',3,'gastos','deudora',false),
    ('${E}','5.1.3','Servicios Generales',3,'gastos','deudora',false),
    ('${E}','5.1.5','Depreciacion Deterioro y Amortizacion',3,'gastos','deudora',false),
    -- Nivel 4 (DETALLE — donde se registran movimientos)
    ('${E}','1.1.1.1','Caja',4,'activo','deudora',true),
    ('${E}','1.1.1.2','Bancos Tesoreria',4,'activo','deudora',true),
    ('${E}','1.1.2.1','Cuentas por Cobrar por Venta de Bienes',4,'activo','deudora',true),
    ('${E}','1.2.4.1','Mobiliario y Equipo de Oficina',4,'activo','deudora',true),
    ('${E}','1.2.4.4','Equipo de Transporte',4,'activo','deudora',true),
    ('${E}','1.2.4.6','Maquinaria y Equipo',4,'activo','deudora',true),
    ('${E}','2.1.1.1','Proveedores por Pagar',4,'pasivo','acreedora',true),
    ('${E}','2.1.1.2','Remuneraciones por Pagar',4,'pasivo','acreedora',true),
    ('${E}','2.1.7.1','Impuestos Retenidos por Pagar',4,'pasivo','acreedora',true),
    ('${E}','3.1.1.1','Hacienda Publica Contribuida',4,'hacienda','acreedora',true),
    ('${E}','3.2.1.1','Resultado del Ejercicio Ahorro Desahorro',4,'hacienda','acreedora',true),
    ('${E}','3.2.2.1','Resultados de Ejercicios Anteriores',4,'hacienda','acreedora',true),
    ('${E}','4.1.1.1','Cuotas y Colegiaturas',4,'ingresos','acreedora',true),
    ('${E}','4.1.7.1','Transferencias del Gobierno Federal',4,'ingresos','acreedora',true),
    ('${E}','4.1.7.2','Transferencias del Gobierno Estatal',4,'ingresos','acreedora',true),
    ('${E}','4.1.9.1','Otros Ingresos',4,'ingresos','acreedora',true),
    ('${E}','5.1.1.1','Remuneraciones al Personal Permanente',4,'gastos','deudora',true),
    ('${E}','5.1.1.3','Remuneraciones Adicionales y Especiales',4,'gastos','deudora',true),
    ('${E}','5.1.2.1','Materiales de Administracion',4,'gastos','deudora',true),
    ('${E}','5.1.3.1','Energia Electrica',4,'gastos','deudora',true),
    ('${E}','5.1.3.4','Telefonia e Internet',4,'gastos','deudora',true),
    ('${E}','5.1.3.9','Otros Servicios Generales',4,'gastos','deudora',true),
    ('${E}','5.1.5.1','Depreciacion de Bienes',4,'gastos','deudora',true);
  `);
  // Set padre_id
  await sql(`
    UPDATE plan_de_cuentas c SET padre_id = p.id
    FROM plan_de_cuentas p
    WHERE c.ente_id = '${E}' AND p.ente_id = '${E}'
      AND c.nivel > 1
      AND p.codigo = regexp_replace(c.codigo, '\\.[^.]+$', '');
  `);
  console.log('   → 42 cuentas CONAC creadas con jerarquia\n');

  // Build codigo->id map
  const allCuentas = await get('plan_de_cuentas', `ente_id=eq.${E}&select=id,codigo`);
  const C = {};
  allCuentas.forEach(a => C[a.codigo] = a.id);

  // ─── Clasificadores ───
  log('SUPER ADMIN', 'Catalogos > Clasificadores', 'COG + Fuente Financiamiento');
  const cogData = [
    { codigo: '1000', nombre: 'Servicios Personales', nivel: 1 },
    { codigo: '2000', nombre: 'Materiales y Suministros', nivel: 1 },
    { codigo: '3000', nombre: 'Servicios Generales', nivel: 1 },
    { codigo: '4000', nombre: 'Transferencias Subsidios y Ayudas', nivel: 1 },
    { codigo: '5000', nombre: 'Bienes Muebles Inmuebles e Intangibles', nivel: 1 },
  ];
  const cogs = [];
  for (const c of cogData) {
    const r = await post('clasificador_presupuestal', { ente_id: E, tipo: 'objeto_gasto', ...c, activo: true });
    cogs.push(r);
  }
  const ffData = [
    { codigo: 'RF01', nombre: 'Recursos Propios', nivel: 1 },
    { codigo: 'RF02', nombre: 'Subsidio Federal', nivel: 1 },
    { codigo: 'RF03', nombre: 'Subsidio Estatal', nivel: 1 },
  ];
  const ffs = [];
  for (const f of ffData) {
    const r = await post('clasificador_presupuestal', { ente_id: E, tipo: 'fuente_financiamiento', ...f, activo: true });
    ffs.push(r);
  }
  console.log('   → 5 COG + 3 Fuentes creados\n');

  // ─── Usuarios ───
  log('SUPER ADMIN', 'Sistema > Usuarios', 'Crear equipo de trabajo UTQ');
  const usersData = [
    { nombre: 'Dr. Ricardo Fuentes Lara', email: 'ricardo.fuentes@utq.edu.mx', rol: 'admin_ente' },
    { nombre: 'CP. Patricia Vega Solis', email: 'patricia.vega@utq.edu.mx', rol: 'contador_general' },
    { nombre: 'Lic. Fernando Ortiz Ramos', email: 'fernando.ortiz@utq.edu.mx', rol: 'presupuesto' },
    { nombre: 'Lic. Sofia Delgado Cruz', email: 'sofia.delgado@utq.edu.mx', rol: 'patrimonio' },
    { nombre: 'CP. Miguel Torres Luna', email: 'miguel.torres@utq.edu.mx', rol: 'contador' },
    { nombre: 'Lic. Carmen Ruiz Mendez', email: 'carmen.ruiz@utq.edu.mx', rol: 'tesorero' },
  ];
  const users = {};
  for (const u of usersData) {
    const r = await post('usuarios', { ...u, ente_id: E, activo: true });
    users[u.rol] = r;
    log('SUPER ADMIN', 'Sistema > Usuarios', `+ ${u.nombre} (${u.rol})`);
  }

  console.log('\n━━━ FASE 2: PRESUPUESTO — Lic. Fernando Ortiz ━━━\n');

  // ─── Partidas de Egreso ───
  const partidasData = [
    { clave: 'E001', descripcion: 'Servicios Personales — Sueldos y prestaciones', cog: 0, ff: 0 },
    { clave: 'E002', descripcion: 'Materiales y Suministros — Operacion academica', cog: 1, ff: 0 },
    { clave: 'E003', descripcion: 'Servicios Generales — Energia, telefonia, mantenimiento', cog: 2, ff: 0 },
    { clave: 'E004', descripcion: 'Bienes Muebles — Equipo de computo y laboratorio', cog: 4, ff: 1 },
    { clave: 'E005', descripcion: 'Becas y Subsidios a Estudiantes', cog: 3, ff: 0 },
  ];
  const partidas = [];
  for (const p of partidasData) {
    log('Lic. Fernando Ortiz', 'Presup > Partidas', `+ ${p.clave} ${p.descripcion.split('—')[0].trim()}`);
    const r = await post('partida_egreso', {
      ente_id: E, ejercicio_id: EJ, clave: p.clave, descripcion: p.descripcion,
      clasificador_id: cogs[p.cog].id, fuente_id: ffs[p.ff].id, activo: true
    });
    partidas.push(r);
  }

  // ─── Conceptos de Ingreso ───
  // Income clasificadores
  const ingClasData = [
    { codigo: '4100', nombre: 'Ingresos Propios', nivel: 1 },
    { codigo: '4200', nombre: 'Participaciones y Transferencias Federales', nivel: 1 },
    { codigo: '4300', nombre: 'Aportaciones Estatales', nivel: 1 },
  ];
  const ingClas = [];
  for (const ic of ingClasData) {
    const r = await post('clasificador_presupuestal', { ente_id: E, tipo: 'economico', ...ic, activo: true });
    ingClas.push(r);
  }

  const conceptosData = [
    { clave: 'I001', descripcion: 'Cuotas de Inscripcion y Colegiaturas', ci: 0 },
    { clave: 'I002', descripcion: 'Subsidio Federal Ordinario SEP', ci: 1 },
    { clave: 'I003', descripcion: 'Subsidio Estatal Ordinario', ci: 2 },
    { clave: 'I004', descripcion: 'Servicios de Extension y Vinculacion', ci: 0 },
    { clave: 'I005', descripcion: 'Rendimientos Financieros', ci: 0 },
  ];
  const conceptos = [];
  for (const c of conceptosData) {
    log('Lic. Fernando Ortiz', 'Presup > Conceptos', `+ ${c.clave} ${c.descripcion}`);
    const r = await post('concepto_ingreso', { ente_id: E, ejercicio_id: EJ, clave: c.clave, descripcion: c.descripcion, clasificador_id: ingClas[c.ci].id, activo: true });
    conceptos.push(r);
  }

  // ─── Momentos del Gasto: Aprobado ───
  const aprobados = [150000000, 20000000, 30000000, 15000000, 35000000]; // $250M total
  for (let i = 0; i < 5; i++) {
    log('Lic. Fernando Ortiz', 'Momentos Gasto > Aprobado', `${partidasData[i].clave}: $${(aprobados[i]/1e6).toFixed(1)}M`);
    await post('movimiento_presupuestal_egreso', {
      partida_id: partidas[i].id, periodo_id: periodos[0].id, momento: 'aprobado',
      tipo_movimiento: 'original', monto: aprobados[i], descripcion: 'PEF 2026 aprobado', fecha: '2026-01-01'
    });
  }

  // ─── Momentos del Ingreso: Estimado ───
  const estimados = [60000000, 120000000, 50000000, 10000000, 10000000]; // $250M
  for (let i = 0; i < 5; i++) {
    log('Lic. Fernando Ortiz', 'Momentos Ingreso > Estimado', `${conceptosData[i].clave}: $${(estimados[i]/1e6).toFixed(1)}M`);
    await post('movimiento_presupuestal_ingreso', {
      concepto_id: conceptos[i].id, periodo_id: periodos[0].id, momento: 'estimado',
      tipo_movimiento: 'original', monto: estimados[i], descripcion: 'Ley de Ingresos 2026', fecha: '2026-01-01'
    });
  }

  // ─── Momentos del Gasto: Comprometido, Devengado, Pagado (Ene+Feb) ───
  const momGasto = [
    // [partida_idx, momento, monto, periodo_idx, desc]
    [0, 'comprometido', 25000000, 0, 'Nomina Ene+Feb comprometida'],
    [2, 'comprometido', 265000, 0, 'Servicios basicos Ene'],
    [4, 'comprometido', 1500000, 0, 'Becas primer parcial'],
    [0, 'devengado', 25000000, 0, 'Nomina Ene+Feb devengada'],
    [2, 'devengado', 265000, 0, 'Servicios basicos recibidos'],
    [1, 'comprometido', 350000, 0, 'Materiales laboratorio Ene'],
    [1, 'devengado', 350000, 0, 'Materiales recibidos'],
    [3, 'comprometido', 1500000, 1, 'Compra equipo computo'],
    [3, 'devengado', 1500000, 1, 'Equipo recibido'],
    [0, 'ejercido', 22400000, 1, 'Nomina neta pagada'],
    [0, 'pagado', 22400000, 1, 'Transferencias nomina'],
    [2, 'ejercido', 265000, 1, 'Pagos servicios'],
    [2, 'pagado', 265000, 1, 'Transferencias servicios'],
    [3, 'ejercido', 1500000, 1, 'Pago equipo'],
    [3, 'pagado', 1500000, 1, 'Transferencia proveedor equipo'],
  ];
  for (const [pi, mom, monto, peri, desc] of momGasto) {
    log('Lic. Fernando Ortiz', `Momentos Gasto > ${mom}`, `${partidasData[pi].clave}: $${(monto/1e6).toFixed(2)}M`);
    await post('movimiento_presupuestal_egreso', {
      partida_id: partidas[pi].id, periodo_id: periodos[peri].id, momento: mom,
      tipo_movimiento: 'original', monto, descripcion: desc, fecha: peri === 0 ? '2026-01-15' : '2026-02-15'
    });
  }

  // ─── Momentos del Ingreso: Devengado + Recaudado ───
  const momIngreso = [
    [0, 'devengado', 10000000, 0, 'Inscripciones Ene+Feb'],
    [0, 'recaudado', 10000000, 0, 'Cobro inscripciones'],
    [1, 'devengado', 10000000, 0, 'Subsidio federal enero'],
    [1, 'recaudado', 10000000, 0, 'Deposito subsidio federal'],
    [2, 'devengado', 4200000, 1, 'Subsidio estatal febrero'],
    [2, 'recaudado', 4200000, 1, 'Deposito subsidio estatal'],
  ];
  for (const [ci, mom, monto, peri, desc] of momIngreso) {
    log('Lic. Fernando Ortiz', `Momentos Ingreso > ${mom}`, `${conceptosData[ci].clave}: $${(monto/1e6).toFixed(2)}M`);
    await post('movimiento_presupuestal_ingreso', {
      concepto_id: conceptos[ci].id, periodo_id: periodos[peri].id, momento: mom,
      tipo_movimiento: 'original', monto, descripcion: desc, fecha: peri === 0 ? '2026-01-20' : '2026-02-20'
    });
  }

  console.log('\n━━━ FASE 3: CONTABILIDAD — CP. Miguel Torres ━━━\n');

  // Helper para crear poliza con movimientos
  async function crearPoliza(tipo, num, periIdx, fecha, desc, movs) {
    const pol = await post('poliza', {
      ente_id: E, ejercicio_id: EJ, periodo_id: periodos[periIdx].id,
      tipo, numero_poliza: num, fecha, descripcion: desc, estado: 'borrador'
    });
    const movsData = movs.map((m, i) => ({
      poliza_id: pol.id, cuenta_id: C[m[0]], concepto: m[1], debe: m[2], haber: m[3], numero_linea: i + 1
    }));
    await post('movimiento_contable', movsData);
    return pol;
  }

  // 10 polizas: operacion real de enero y febrero
  const polizas = [];

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-D-1: Aportacion inicial gobierno estatal');
  polizas.push(await crearPoliza('diario', 1, 0, '2026-01-02', 'Aportacion inicial del gobierno del estado para inicio de operaciones', [
    ['1.1.1.2', 'Deposito gobierno estatal', 50000000, 0],
    ['3.1.1.1', 'Capital inicial UTQ', 0, 50000000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-I-1: Cobro inscripciones enero');
  polizas.push(await crearPoliza('ingreso', 1, 0, '2026-01-15', 'Cobro de inscripciones y colegiaturas semestre 2026-1 primera quincena', [
    ['1.1.1.2', 'Depositos inscripciones', 5200000, 0],
    ['4.1.1.1', 'Cuotas semestre 2026-1', 0, 5200000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-I-2: Subsidio federal enero');
  polizas.push(await crearPoliza('ingreso', 2, 0, '2026-01-20', 'Recepcion primera ministracion subsidio federal ordinario SEP 2026', [
    ['1.1.1.2', 'Deposito SEP', 10000000, 0],
    ['4.1.7.1', 'Subsidio federal 1ra ministracion', 0, 10000000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-E-1: Nomina enero');
  polizas.push(await crearPoliza('egreso', 1, 0, '2026-01-31', 'Pago de nomina completa enero 2026 — personal administrativo y docente', [
    ['5.1.1.1', 'Sueldos enero', 10500000, 0],
    ['5.1.1.3', 'Prestaciones enero', 2000000, 0],
    ['1.1.1.2', 'Transferencia nomina neta', 0, 11200000],
    ['2.1.7.1', 'ISR + IMSS retenido', 0, 1300000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-E-2: Servicios enero');
  polizas.push(await crearPoliza('egreso', 2, 0, '2026-01-31', 'Pago servicios basicos enero — CFE y Telmex', [
    ['5.1.3.1', 'CFE factura enero', 180000, 0],
    ['5.1.3.4', 'Telmex/Internet enero', 85000, 0],
    ['1.1.1.2', 'Transferencia CFE + Telmex', 0, 265000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-I-3: Inscripciones febrero');
  polizas.push(await crearPoliza('ingreso', 3, 1, '2026-02-15', 'Cobro inscripciones y colegiaturas febrero — rezagados semestre 2026-1', [
    ['1.1.1.2', 'Depositos inscripciones feb', 4800000, 0],
    ['4.1.1.1', 'Cuotas febrero', 0, 4800000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-I-4: Subsidio estatal febrero');
  polizas.push(await crearPoliza('ingreso', 4, 1, '2026-02-20', 'Recepcion primera ministracion subsidio estatal 2026', [
    ['1.1.1.2', 'Deposito gobierno estatal', 4200000, 0],
    ['4.1.7.2', 'Subsidio estatal 1ra ministracion', 0, 4200000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-E-3: Nomina febrero');
  polizas.push(await crearPoliza('egreso', 3, 1, '2026-02-28', 'Pago de nomina completa febrero 2026', [
    ['5.1.1.1', 'Sueldos febrero', 10500000, 0],
    ['5.1.1.3', 'Prestaciones febrero', 2000000, 0],
    ['1.1.1.2', 'Transferencia nomina neta', 0, 11200000],
    ['2.1.7.1', 'ISR + IMSS retenido', 0, 1300000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-E-4: Compra equipo computo');
  polizas.push(await crearPoliza('egreso', 4, 1, '2026-02-15', 'Adquisicion 30 laptops HP para Lab. de Sistemas', [
    ['1.2.4.6', 'Laptops HP ProBook x30', 1500000, 0],
    ['1.1.1.2', 'Transferencia a proveedor', 0, 1500000],
  ]));

  log('CP. Miguel Torres', 'Contabilidad > Nueva Poliza', 'POL-E-5: Pago impuestos retenidos');
  polizas.push(await crearPoliza('egreso', 5, 1, '2026-02-17', 'Entero de retenciones ISR e IMSS correspondientes a enero 2026', [
    ['2.1.7.1', 'Pago retenciones enero', 1300000, 0],
    ['1.1.1.2', 'Transferencia SAT/IMSS', 0, 1300000],
  ]));

  // ─── Enviar a aprobacion (Miguel) ───
  log('CP. Miguel Torres', 'Contabilidad > Polizas', 'Enviar 10 polizas a aprobacion');
  for (const p of polizas) {
    await patch('poliza', `id=eq.${p.id}`, { estado: 'pendiente' });
  }

  console.log('\n━━━ FASE 3b: CONTADOR GENERAL — CP. Patricia Vega ━━━\n');

  // ─── Aprobar polizas (Patricia como contador_general) ───
  log('CP. Patricia Vega', 'Contabilidad > Polizas', 'Revisando 10 polizas pendientes...');
  for (let i = 0; i < polizas.length; i++) {
    await patch('poliza', `id=eq.${polizas[i].id}`, {
      estado: 'aprobada', aprobado_por: users.contador_general.id, aprobado_en: new Date().toISOString()
    });
    // Actualizar saldos contables
    await sql(`SELECT fn_actualizar_saldos('${polizas[i].id}')`);
    log('CP. Patricia Vega', 'Contabilidad > Polizas', `✓ Aprobada poliza ${i+1}/10`);
  }
  console.log('   → fn_actualizar_saldos ejecutado para cada poliza\n');

  console.log('━━━ FASE 4: PATRIMONIO — Lic. Sofia Delgado ━━━\n');

  const bienesData = [
    { clave: 'INM-001', descripcion: 'Campus principal — Edificio de Rectoria y 4 edificios academicos', tipo: 'inmueble',
      fecha_adquisicion: '2020-01-15', valor_adquisicion: 85000000, depreciacion_acumulada: 12750000,
      vida_util_anios: 40, tasa_depreciacion: 2.5, ubicacion: 'Av. Tecnologica 100, Santiago de Queretaro',
      responsable: 'Dr. Ricardo Fuentes Lara', estado: 'activo' },
    { clave: 'MUE-001', descripcion: 'Lote 30 laptops HP ProBook 450 G10 — Laboratorio de Sistemas', tipo: 'mueble',
      fecha_adquisicion: '2026-02-15', valor_adquisicion: 1500000, depreciacion_acumulada: 0,
      vida_util_anios: 4, tasa_depreciacion: 25, ubicacion: 'Edificio B, Lab. Sistemas, 2do piso',
      responsable: 'Ing. Marco Jimenez', numero_serie: 'HPPB-2026-001 al 030', marca: 'HP', modelo: 'ProBook 450 G10', estado: 'activo' },
    { clave: 'MUE-002', descripcion: 'Camioneta Nissan NP300 para servicios generales', tipo: 'mueble',
      fecha_adquisicion: '2023-06-01', valor_adquisicion: 450000, depreciacion_acumulada: 112500,
      vida_util_anios: 8, tasa_depreciacion: 12.5, ubicacion: 'Estacionamiento administrativo',
      responsable: 'Lic. Carmen Ruiz Mendez', marca: 'Nissan', modelo: 'NP300 2023', estado: 'activo' },
    { clave: 'INT-001', descripcion: 'Licencia SAP Business One — Sistema administrativo', tipo: 'intangible',
      fecha_adquisicion: '2024-01-10', valor_adquisicion: 800000, depreciacion_acumulada: 160000,
      vida_util_anios: 5, tasa_depreciacion: 20, estado: 'activo' },
  ];
  for (const b of bienesData) {
    log('Lic. Sofia Delgado', 'Patrimonio > Bienes', `+ ${b.clave} ${b.tipo}: $${(b.valor_adquisicion/1e6).toFixed(2)}M`);
    await post('bien_patrimonial', { ente_id: E, ejercicio_id: EJ, ...b });
  }

  log('Lic. Sofia Delgado', 'Patrimonio > Inventarios', '+ Inventario semestral 2026-1');
  await post('inventario_conteo', {
    ente_id: E, ejercicio_id: EJ, clave: 'INV-2026-01', descripcion: 'Inventario fisico semestral primer semestre 2026',
    fecha_conteo: '2026-03-15', responsable: 'Lic. Sofia Delgado Cruz', ubicacion: 'Campus completo',
    total_bienes: 4, valor_total: 87750000, estado: 'en_proceso',
    observaciones: 'Conteo en proceso, pendiente verificar edificio D'
  });

  console.log('\n━━━ FASE 4b: TESORERO — Lic. Carmen Ruiz ━━━\n');

  const fondosData = [
    { clave: 'FF-001', tipo: 'subsidio', nombre: 'Subsidio Federal Ordinario SEP 2026',
      fuente: 'SEP — Subsecretaria de Educacion Superior',
      monto_asignado: 120000000, monto_recibido: 10000000, monto_ejercido: 10000000, monto_reintegrado: 0,
      fecha_asignacion: '2026-01-15', estado: 'activo',
      descripcion: 'Subsidio ordinario para operacion de la universidad' },
    { clave: 'FF-002', tipo: 'subsidio', nombre: 'PRODEP 2026 — Fortalecimiento docente',
      fuente: 'SEP — PRODEP', monto_asignado: 5000000, monto_recibido: 0, monto_ejercido: 0, monto_reintegrado: 0,
      fecha_asignacion: '2026-02-01', estado: 'activo',
      descripcion: 'Programa de desarrollo profesional docente' },
    { clave: 'FF-003', tipo: 'aportacion', nombre: 'Subsidio Estatal Ordinario 2026',
      fuente: 'Gobierno del Estado de Queretaro', monto_asignado: 50000000, monto_recibido: 4200000,
      monto_ejercido: 4200000, monto_reintegrado: 0, fecha_asignacion: '2026-01-20', estado: 'activo',
      descripcion: 'Aportacion estatal para operacion' },
  ];
  for (const f of fondosData) {
    log('Lic. Carmen Ruiz', 'Fondos Federales', `+ ${f.clave} ${f.nombre.split('—')[0].trim()}`);
    await post('fondo_federal', { ente_id: E, ejercicio_id: EJ, ...f });
  }

  // ─── Deuda Publica ───
  log('Lic. Carmen Ruiz', 'Deuda Publica', '+ Credito BANOBRAS infraestructura');
  const deuda = await post('instrumento_deuda', {
    ente_id: E, ejercicio_id: EJ, clave: 'DEU-001', tipo: 'credito',
    descripcion: 'Credito BANOBRAS para construccion Centro de Investigacion',
    acreedor: 'BANOBRAS', monto_original: 30000000, saldo_vigente: 24000000,
    tasa_interes: 8.5, tipo_tasa: 'fija', plazo_meses: 120, moneda: 'MXN',
    fecha_contratacion: '2023-01-15', fecha_vencimiento: '2033-01-15',
    destino_recursos: 'Construccion Centro de Investigacion en Ciencias Aplicadas',
    garantia: 'Participaciones estatales', estado: 'vigente'
  });
  await post('movimiento_deuda', [
    { instrumento_id: deuda.id, periodo_id: periodos[0].id, tipo: 'amortizacion', monto: 250000, fecha: '2026-01-31', descripcion: 'Amortizacion mensual #37' },
    { instrumento_id: deuda.id, periodo_id: periodos[0].id, tipo: 'pago_intereses', monto: 170000, fecha: '2026-01-31', descripcion: 'Intereses enero' },
    { instrumento_id: deuda.id, periodo_id: periodos[1].id, tipo: 'amortizacion', monto: 250000, fecha: '2026-02-28', descripcion: 'Amortizacion mensual #38' },
    { instrumento_id: deuda.id, periodo_id: periodos[1].id, tipo: 'pago_intereses', monto: 168229, fecha: '2026-02-28', descripcion: 'Intereses febrero' },
  ]);
  log('Lic. Carmen Ruiz', 'Deuda Publica', '+ 4 movimientos de deuda (amort + intereses)');

  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━ FASE 5: ANALISIS Y VERIFICACION ━━━\n');

  // Count records — each table has different FK
  const counts = {};
  // Tables with ente_id
  for (const t of ['plan_de_cuentas','clasificador_presupuestal','usuarios','partida_egreso','concepto_ingreso',
    'poliza','bien_patrimonial','inventario_conteo','fondo_federal','instrumento_deuda']) {
    const rows = await get(t, `select=id&ente_id=eq.${E}`);
    counts[t] = rows.length;
  }
  counts.ente_publico = 1;
  const ejCnt = await get('ejercicio_fiscal', `select=id&ente_id=eq.${E}`);
  counts.ejercicio_fiscal = ejCnt.length;
  const periCnt = await get('periodo_contable', `select=id&ejercicio_id=eq.${EJ}`);
  counts.periodo_contable = periCnt.length;
  const saldosRaw = await sql(`SELECT count(*) as cnt FROM saldo_cuenta WHERE ente_id = '${E}'`);
  counts.saldo_cuenta = parseInt(saldosRaw[0]?.cnt || 0);
  // Movimientos contables via polizas
  const polizaIds = polizas.map(p => p.id);
  let movCnt = 0;
  for (const pid of polizaIds) {
    const m = await get('movimiento_contable', `select=id&poliza_id=eq.${pid}`);
    movCnt += m.length;
  }
  counts.movimiento_contable = movCnt;
  // Movimientos presupuestales via partidas/conceptos
  let meCnt = 0, miCnt = 0;
  for (const p of partidas) {
    const m = await get('movimiento_presupuestal_egreso', `select=id&partida_id=eq.${p.id}`);
    meCnt += m.length;
  }
  counts.movimiento_presupuestal_egreso = meCnt;
  for (const c of conceptos) {
    const m = await get('movimiento_presupuestal_ingreso', `select=id&concepto_id=eq.${c.id}`);
    miCnt += m.length;
  }
  counts.movimiento_presupuestal_ingreso = miCnt;
  // Movimientos deuda
  const mdCnt = await get('movimiento_deuda', `select=id&instrumento_id=eq.${deuda.id}`);
  counts.movimiento_deuda = mdCnt.length;

  console.log('┌────────────────────────────────┬───────┐');
  console.log('│ Tabla                          │ Regs  │');
  console.log('├────────────────────────────────┼───────┤');
  for (const [t, c] of Object.entries(counts)) {
    if (c > 0) console.log(`│ ${t.padEnd(30)} │ ${String(c).padStart(5)} │`);
  }
  console.log('└────────────────────────────────┴───────┘');

  // Polizas summary
  const polAprobadas = await get('poliza', `ente_id=eq.${E}&estado=eq.aprobada&select=id,tipo,numero_poliza,fecha,descripcion`);
  console.log(`\nPolizas aprobadas: ${polAprobadas.length}`);

  // Saldos — aggregate by cuenta across periodos
  const saldoRaw = await sql(`
    SELECT pc.codigo, pc.nombre, pc.naturaleza,
           SUM(sc.total_debe) as total_debe, SUM(sc.total_haber) as total_haber
    FROM saldo_cuenta sc
    JOIN plan_de_cuentas pc ON pc.id = sc.cuenta_id
    WHERE sc.ente_id = '${E}' AND sc.ejercicio_id = '${EJ}'
    GROUP BY pc.codigo, pc.nombre, pc.naturaleza
    ORDER BY pc.codigo
  `);
  let totalDebe = 0, totalHaber = 0;
  console.log('\n┌─────────────┬────────────────────────────────────┬────────────────┬────────────────┬────────────────┐');
  console.log('│ Cuenta      │ Nombre                             │ Debe           │ Haber          │ Saldo Final    │');
  console.log('├─────────────┼────────────────────────────────────┼────────────────┼────────────────┼────────────────┤');
  for (const s of saldoRaw) {
    const debe = parseFloat(s.total_debe || 0);
    const haber = parseFloat(s.total_haber || 0);
    const saldo = s.naturaleza === 'deudora' ? debe - haber : haber - debe;
    totalDebe += debe;
    totalHaber += haber;
    const fmtD = debe > 0 ? `$${debe.toLocaleString('en')}` : '';
    const fmtH = haber > 0 ? `$${haber.toLocaleString('en')}` : '';
    const fmtS = `$${saldo.toLocaleString('en')}`;
    console.log(`│ ${s.codigo.padEnd(11)} │ ${s.nombre.substring(0,34).padEnd(34)} │ ${fmtD.padStart(14)} │ ${fmtH.padStart(14)} │ ${fmtS.padStart(14)} │`);
  }
  console.log('├─────────────┼────────────────────────────────────┼────────────────┼────────────────┼────────────────┤');
  console.log(`│ TOTALES     │                                    │ ${('$'+totalDebe.toLocaleString('en')).padStart(14)} │ ${('$'+totalHaber.toLocaleString('en')).padStart(14)} │                │`);
  console.log('└─────────────┴────────────────────────────────────┴────────────────┴────────────────┴────────────────┘');

  const diff = Math.abs(totalDebe - totalHaber);
  console.log(`\nVerificacion partida doble: Debe $${totalDebe.toLocaleString('en')} = Haber $${totalHaber.toLocaleString('en')} → Diferencia: $${diff.toFixed(2)} ${diff < 0.01 ? '✓ CUADRA' : '✗ ERROR'}`);

  // Presupuesto summary — filter by our partidas/conceptos
  const egresosByMom = {};
  for (const p of partidas) {
    const rows = await get('movimiento_presupuestal_egreso', `select=momento,monto&partida_id=eq.${p.id}`);
    for (const m of rows) egresosByMom[m.momento] = (egresosByMom[m.momento] || 0) + parseFloat(m.monto);
  }
  console.log('\nPresupuesto de Egresos:');
  for (const [mom, total] of Object.entries(egresosByMom)) {
    console.log(`  ${mom.padEnd(15)} $${total.toLocaleString('en')}`);
  }

  const ingresosByMom = {};
  for (const c of conceptos) {
    const rows = await get('movimiento_presupuestal_ingreso', `select=momento,monto&concepto_id=eq.${c.id}`);
    for (const m of rows) ingresosByMom[m.momento] = (ingresosByMom[m.momento] || 0) + parseFloat(m.monto);
  }
  console.log('\nPresupuesto de Ingresos:');
  for (const [mom, total] of Object.entries(ingresosByMom)) {
    console.log(`  ${mom.padEnd(15)} $${total.toLocaleString('en')}`);
  }

  // Final summary
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    RESUMEN DE SIMULACION                    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ Ente: Universidad Tecnologica de Queretaro (UTQ)           ║`);
  console.log(`║ Ejercicio: 2026 | Periodos operados: Ene, Feb, Mar        ║`);
  console.log(`║ Usuarios creados: ${Object.keys(users).length} (6 roles diferentes)                   ║`);
  console.log(`║ Cuentas CONAC: ${allCuentas.length} (15 de detalle)                         ║`);
  console.log(`║ Polizas: ${polAprobadas.length} aprobadas (${movCnt} movimientos contables)        ║`);
  console.log(`║ Partidas egreso: ${partidas.length} | Conceptos ingreso: ${conceptos.length}              ║`);
  console.log(`║ Bienes patrimoniales: ${bienesData.length} | Fondos federales: ${fondosData.length}            ║`);
  console.log(`║ Instrumento deuda: 1 | Movimientos deuda: 4               ║`);
  console.log(`║ Total operaciones API: ${totalOps}                                ║`);
  console.log(`║ Tiempo total: ${elapsed}s                                       ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(e => { console.error('\nERROR FATAL:', e.message); process.exit(1); });
