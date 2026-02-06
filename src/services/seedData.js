import { supabase } from '../config/supabase';

const LS_PREFIX = 'scgmex_';
const SEED_VERSION = '1.0';

function isSeeded() {
  return localStorage.getItem(LS_PREFIX + 'seed_version') === SEED_VERSION;
}

function setSeeded() {
  localStorage.setItem(LS_PREFIX + 'seed_version', SEED_VERSION);
}

function seed(table, data) {
  localStorage.setItem(LS_PREFIX + table, JSON.stringify(data));
}

export function initSeedData() {
  // Skip if Supabase is configured or already seeded
  if (supabase) return;
  if (isSeeded()) return;

  const enteId = crypto.randomUUID();
  const ejercicioId = crypto.randomUUID();

  // Ente publico
  seed('ente_publico', [{
    id: enteId,
    clave: 'MUN-001',
    nombre: 'Municipio de Ejemplo',
    nombre_corto: 'Mun. Ejemplo',
    nivel_gobierno: 'municipal',
    tipo_ente: 'municipio',
    entidad_federativa: 'Estado de Mexico',
    municipio: 'Municipio de Ejemplo',
    rfc: 'MEJ010101AAA',
    domicilio: 'Palacio Municipal S/N, Centro',
    titular: 'C. Presidente Municipal',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }]);

  // Ejercicio fiscal
  seed('ejercicio_fiscal', [{
    id: ejercicioId,
    ente_id: enteId,
    anio: 2026,
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    estado: 'abierto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }]);

  // Periodos contables (13 periods)
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre','Ajustes'];
  const periodos = meses.map((nombre, i) => ({
    id: crypto.randomUUID(),
    ejercicio_id: ejercicioId,
    numero: i + 1,
    nombre,
    fecha_inicio: i < 12 ? `2026-${String(i+1).padStart(2,'0')}-01` : '2026-12-01',
    fecha_fin: i < 11 ? `2026-${String(i+1).padStart(2,'0')}-${new Date(2026, i+1, 0).getDate()}` : '2026-12-31',
    estado: 'abierto',
    created_at: new Date().toISOString(),
  }));
  seed('periodo_contable', periodos);

  // Plan de cuentas CONAC - 3 levels
  const cuentas = [];
  const addCuenta = (codigo, nombre, nivel, tipo, naturaleza, padreIdx) => {
    cuentas.push({
      id: crypto.randomUUID(),
      ente_id: enteId,
      codigo,
      nombre,
      nivel,
      tipo_cuenta: tipo,
      naturaleza,
      padre_id: padreIdx !== undefined ? cuentas[padreIdx].id : null,
      es_detalle: false,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return cuentas.length - 1;
  };

  // 1. ACTIVO
  const i1 = addCuenta('1', 'Activo', 1, 'activo', 'deudora');
  const i11 = addCuenta('1.1', 'Activo Circulante', 2, 'activo', 'deudora', i1);
  addCuenta('1.1.1', 'Efectivo y Equivalentes', 3, 'activo', 'deudora', i11);
  addCuenta('1.1.2', 'Derechos a Recibir Efectivo o Equivalentes', 3, 'activo', 'deudora', i11);
  addCuenta('1.1.3', 'Derechos a Recibir Bienes o Servicios', 3, 'activo', 'deudora', i11);
  addCuenta('1.1.4', 'Inventarios', 3, 'activo', 'deudora', i11);
  addCuenta('1.1.5', 'Almacenes', 3, 'activo', 'deudora', i11);
  addCuenta('1.1.6', 'Estimaciones y Provisiones', 3, 'activo', 'deudora', i11);
  const i12 = addCuenta('1.2', 'Activo No Circulante', 2, 'activo', 'deudora', i1);
  addCuenta('1.2.1', 'Inversiones Financieras a Largo Plazo', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.2', 'Derechos a Recibir Efectivo o Equivalentes a Largo Plazo', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.3', 'Bienes Inmuebles, Infraestructura y Construcciones en Proceso', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.4', 'Bienes Muebles', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.5', 'Activos Intangibles', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.6', 'Depreciacion, Deterioro y Amortizacion Acumulada', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.7', 'Activos Diferidos', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.8', 'Estimaciones y Provisiones a Largo Plazo', 3, 'activo', 'deudora', i12);
  addCuenta('1.2.9', 'Otros Activos No Circulantes', 3, 'activo', 'deudora', i12);

  // 2. PASIVO
  const i2 = addCuenta('2', 'Pasivo', 1, 'pasivo', 'acreedora');
  const i21 = addCuenta('2.1', 'Pasivo Circulante', 2, 'pasivo', 'acreedora', i2);
  addCuenta('2.1.1', 'Cuentas por Pagar a Corto Plazo', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.2', 'Documentos por Pagar a Corto Plazo', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.3', 'Porcion a Corto Plazo de la Deuda Publica a Largo Plazo', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.4', 'Titulos y Valores a Corto Plazo', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.5', 'Pasivos Diferidos a Corto Plazo', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.6', 'Fondos y Bienes de Terceros en Garantia', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.7', 'Provisiones a Corto Plazo', 3, 'pasivo', 'acreedora', i21);
  addCuenta('2.1.9', 'Otros Pasivos a Corto Plazo', 3, 'pasivo', 'acreedora', i21);
  const i22 = addCuenta('2.2', 'Pasivo No Circulante', 2, 'pasivo', 'acreedora', i2);
  addCuenta('2.2.1', 'Cuentas por Pagar a Largo Plazo', 3, 'pasivo', 'acreedora', i22);
  addCuenta('2.2.2', 'Documentos por Pagar a Largo Plazo', 3, 'pasivo', 'acreedora', i22);
  addCuenta('2.2.3', 'Deuda Publica a Largo Plazo', 3, 'pasivo', 'acreedora', i22);
  addCuenta('2.2.4', 'Pasivos Diferidos a Largo Plazo', 3, 'pasivo', 'acreedora', i22);
  addCuenta('2.2.5', 'Fondos y Bienes de Terceros en Garantia a Largo Plazo', 3, 'pasivo', 'acreedora', i22);
  addCuenta('2.2.6', 'Provisiones a Largo Plazo', 3, 'pasivo', 'acreedora', i22);

  // 3. HACIENDA PUBLICA
  const i3 = addCuenta('3', 'Hacienda Publica Contribuida', 1, 'hacienda', 'acreedora');
  const i31 = addCuenta('3.1', 'Hacienda Publica Contribuida', 2, 'hacienda', 'acreedora', i3);
  addCuenta('3.1.1', 'Contribuciones de Capital', 3, 'hacienda', 'acreedora', i31);
  addCuenta('3.1.2', 'Donaciones de Capital', 3, 'hacienda', 'acreedora', i31);
  addCuenta('3.1.3', 'Actualizacion de la Hacienda Publica', 3, 'hacienda', 'acreedora', i31);
  const i32 = addCuenta('3.2', 'Hacienda Publica Generada', 2, 'hacienda', 'acreedora', i3);
  addCuenta('3.2.1', 'Resultados del Ejercicio (Ahorro/Desahorro)', 3, 'hacienda', 'acreedora', i32);
  addCuenta('3.2.2', 'Resultados de Ejercicios Anteriores', 3, 'hacienda', 'acreedora', i32);
  addCuenta('3.2.3', 'Revaluas', 3, 'hacienda', 'acreedora', i32);
  addCuenta('3.2.4', 'Reservas', 3, 'hacienda', 'acreedora', i32);
  addCuenta('3.2.5', 'Rectificaciones de Resultados de Ejercicios Anteriores', 3, 'hacienda', 'acreedora', i32);
  const i33 = addCuenta('3.3', 'Exceso o Insuficiencia en la Actualizacion', 2, 'hacienda', 'acreedora', i3);
  addCuenta('3.3.1', 'Resultado por Posicion Monetaria', 3, 'hacienda', 'acreedora', i33);
  addCuenta('3.3.2', 'Resultado por Tenencia de Activos No Monetarios', 3, 'hacienda', 'acreedora', i33);

  // 4. INGRESOS
  const i4 = addCuenta('4', 'Ingresos y Otros Beneficios', 1, 'ingresos', 'acreedora');
  const i41 = addCuenta('4.1', 'Ingresos de Gestion', 2, 'ingresos', 'acreedora', i4);
  addCuenta('4.1.1', 'Impuestos', 3, 'ingresos', 'acreedora', i41);
  addCuenta('4.1.2', 'Cuotas y Aportaciones de Seguridad Social', 3, 'ingresos', 'acreedora', i41);
  addCuenta('4.1.3', 'Contribuciones de Mejoras', 3, 'ingresos', 'acreedora', i41);
  addCuenta('4.1.4', 'Derechos', 3, 'ingresos', 'acreedora', i41);
  addCuenta('4.1.5', 'Productos de Tipo Corriente', 3, 'ingresos', 'acreedora', i41);
  addCuenta('4.1.6', 'Aprovechamientos de Tipo Corriente', 3, 'ingresos', 'acreedora', i41);
  addCuenta('4.1.7', 'Ingresos por Venta de Bienes, Prestacion de Servicios y Otros', 3, 'ingresos', 'acreedora', i41);
  const i42 = addCuenta('4.2', 'Participaciones, Aportaciones, Convenios, Incentivos y Otros Ingresos', 2, 'ingresos', 'acreedora', i4);
  addCuenta('4.2.1', 'Participaciones y Aportaciones', 3, 'ingresos', 'acreedora', i42);
  addCuenta('4.2.2', 'Transferencias, Asignaciones, Subsidios y Subvenciones', 3, 'ingresos', 'acreedora', i42);
  addCuenta('4.2.3', 'Pensiones y Jubilaciones', 3, 'ingresos', 'acreedora', i42);
  addCuenta('4.2.4', 'Transferencias del Fondo Mexicano del Petroleo', 3, 'ingresos', 'acreedora', i42);
  const i43 = addCuenta('4.3', 'Otros Ingresos y Beneficios', 2, 'ingresos', 'acreedora', i4);
  addCuenta('4.3.1', 'Ingresos Financieros', 3, 'ingresos', 'acreedora', i43);
  addCuenta('4.3.2', 'Incremento por Variacion de Inventarios', 3, 'ingresos', 'acreedora', i43);
  addCuenta('4.3.3', 'Disminucion del Exceso de Estimaciones', 3, 'ingresos', 'acreedora', i43);
  addCuenta('4.3.9', 'Otros Ingresos y Beneficios Varios', 3, 'ingresos', 'acreedora', i43);

  // 5. GASTOS
  const i5 = addCuenta('5', 'Gastos y Otras Perdidas', 1, 'gastos', 'deudora');
  const i51 = addCuenta('5.1', 'Gastos de Funcionamiento', 2, 'gastos', 'deudora', i5);
  addCuenta('5.1.1', 'Servicios Personales', 3, 'gastos', 'deudora', i51);
  addCuenta('5.1.2', 'Materiales y Suministros', 3, 'gastos', 'deudora', i51);
  addCuenta('5.1.3', 'Servicios Generales', 3, 'gastos', 'deudora', i51);
  const i52 = addCuenta('5.2', 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', 2, 'gastos', 'deudora', i5);
  addCuenta('5.2.1', 'Transferencias Internas y Asignaciones al Sector Publico', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.2', 'Transferencias al Resto del Sector Publico', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.3', 'Subsidios y Subvenciones', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.4', 'Ayudas Sociales', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.5', 'Pensiones y Jubilaciones', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.6', 'Transferencias a Fideicomisos, Mandatos y Contratos Analogos', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.7', 'Transferencias a la Seguridad Social', 3, 'gastos', 'deudora', i52);
  addCuenta('5.2.9', 'Donativos', 3, 'gastos', 'deudora', i52);
  const i53 = addCuenta('5.3', 'Participaciones y Aportaciones', 2, 'gastos', 'deudora', i5);
  addCuenta('5.3.1', 'Participaciones', 3, 'gastos', 'deudora', i53);
  addCuenta('5.3.2', 'Aportaciones', 3, 'gastos', 'deudora', i53);
  addCuenta('5.3.3', 'Convenios', 3, 'gastos', 'deudora', i53);
  const i54 = addCuenta('5.4', 'Intereses, Comisiones y Otros Gastos de la Deuda Publica', 2, 'gastos', 'deudora', i5);
  addCuenta('5.4.1', 'Intereses de la Deuda Publica', 3, 'gastos', 'deudora', i54);
  addCuenta('5.4.2', 'Comisiones de la Deuda Publica', 3, 'gastos', 'deudora', i54);
  addCuenta('5.4.3', 'Gastos de la Deuda Publica', 3, 'gastos', 'deudora', i54);
  addCuenta('5.4.4', 'Costo por Coberturas', 3, 'gastos', 'deudora', i54);
  addCuenta('5.4.5', 'Apoyos Financieros', 3, 'gastos', 'deudora', i54);
  const i55 = addCuenta('5.5', 'Otros Gastos y Perdidas', 2, 'gastos', 'deudora', i5);
  addCuenta('5.5.1', 'Estimaciones, Depreciaciones, Deterioros, Obsolescencia y Amortizaciones', 3, 'gastos', 'deudora', i55);
  addCuenta('5.5.2', 'Provisiones', 3, 'gastos', 'deudora', i55);
  addCuenta('5.5.3', 'Disminucion de Inventarios', 3, 'gastos', 'deudora', i55);
  addCuenta('5.5.4', 'Aumento del Exceso de Estimaciones', 3, 'gastos', 'deudora', i55);
  addCuenta('5.5.9', 'Otros Gastos Varios', 3, 'gastos', 'deudora', i55);

  // 6. CIERRE
  const i6 = addCuenta('6', 'Cuentas de Cierre Contable', 1, 'cierre', 'deudora');
  const i61 = addCuenta('6.1', 'Resumen de Ingresos y Gastos', 2, 'cierre', 'deudora', i6);
  addCuenta('6.1.1', 'Resumen de Ingresos y Gastos', 3, 'cierre', 'deudora', i61);

  // 8. ORDEN PRESUPUESTARIAS
  const i8 = addCuenta('8', 'Cuentas de Orden Presupuestarias', 1, 'orden_presupuestario', 'deudora');
  const i81 = addCuenta('8.1', 'Ley de Ingresos', 2, 'orden_presupuestario', 'deudora', i8);
  addCuenta('8.1.1', 'Ley de Ingresos Estimada', 3, 'orden_presupuestario', 'deudora', i81);
  addCuenta('8.1.2', 'Ley de Ingresos por Ejecutar', 3, 'orden_presupuestario', 'deudora', i81);
  addCuenta('8.1.3', 'Modificaciones a la Ley de Ingresos Estimada', 3, 'orden_presupuestario', 'deudora', i81);
  addCuenta('8.1.4', 'Ley de Ingresos Devengada', 3, 'orden_presupuestario', 'deudora', i81);
  addCuenta('8.1.5', 'Ley de Ingresos Recaudada', 3, 'orden_presupuestario', 'deudora', i81);
  const i82 = addCuenta('8.2', 'Presupuesto de Egresos', 2, 'orden_presupuestario', 'deudora', i8);
  addCuenta('8.2.1', 'Presupuesto de Egresos Aprobado', 3, 'orden_presupuestario', 'deudora', i82);
  addCuenta('8.2.2', 'Presupuesto de Egresos por Ejercer', 3, 'orden_presupuestario', 'deudora', i82);
  addCuenta('8.2.3', 'Modificaciones al Presupuesto de Egresos Aprobado', 3, 'orden_presupuestario', 'deudora', i82);
  addCuenta('8.2.4', 'Presupuesto de Egresos Comprometido', 3, 'orden_presupuestario', 'deudora', i82);
  addCuenta('8.2.5', 'Presupuesto de Egresos Devengado', 3, 'orden_presupuestario', 'deudora', i82);
  addCuenta('8.2.6', 'Presupuesto de Egresos Ejercido', 3, 'orden_presupuestario', 'deudora', i82);
  addCuenta('8.2.7', 'Presupuesto de Egresos Pagado', 3, 'orden_presupuestario', 'deudora', i82);

  seed('plan_de_cuentas', cuentas);

  // Clasificadores presupuestales
  const clasificadores = [];
  const addClasif = (tipo, codigo, nombre, nivel, padreIdx) => {
    clasificadores.push({
      id: crypto.randomUUID(),
      ente_id: enteId,
      tipo,
      codigo,
      nombre,
      nivel,
      padre_id: padreIdx !== undefined ? clasificadores[padreIdx].id : null,
      activo: true,
      created_at: new Date().toISOString(),
    });
    return clasificadores.length - 1;
  };

  // Objeto del Gasto
  addClasif('objeto_gasto', '1000', 'Servicios Personales', 1);
  addClasif('objeto_gasto', '2000', 'Materiales y Suministros', 1);
  addClasif('objeto_gasto', '3000', 'Servicios Generales', 1);
  addClasif('objeto_gasto', '4000', 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', 1);
  addClasif('objeto_gasto', '5000', 'Bienes Muebles, Inmuebles e Intangibles', 1);
  addClasif('objeto_gasto', '6000', 'Inversion Publica', 1);
  addClasif('objeto_gasto', '7000', 'Inversiones Financieras y Otras Provisiones', 1);
  addClasif('objeto_gasto', '8000', 'Participaciones y Aportaciones', 1);
  addClasif('objeto_gasto', '9000', 'Deuda Publica', 1);

  // Funcional
  addClasif('funcional', '1', 'Gobierno', 1);
  addClasif('funcional', '2', 'Desarrollo Social', 1);
  addClasif('funcional', '3', 'Desarrollo Economico', 1);
  addClasif('funcional', '4', 'Otras No Clasificadas en Funciones Anteriores', 1);

  // Fuente de Financiamiento
  addClasif('fuente_financiamiento', '1', 'Recursos Fiscales', 1);
  addClasif('fuente_financiamiento', '2', 'Financiamientos Internos', 1);
  addClasif('fuente_financiamiento', '3', 'Financiamientos Externos', 1);
  addClasif('fuente_financiamiento', '4', 'Ingresos Propios', 1);
  addClasif('fuente_financiamiento', '5', 'Recursos Federales', 1);
  addClasif('fuente_financiamiento', '6', 'Recursos Estatales', 1);
  addClasif('fuente_financiamiento', '7', 'Otros Recursos', 1);

  seed('clasificador_presupuestal', clasificadores);

  // Empty tables
  seed('matriz_conversion', []);
  seed('bitacora', []);

  setSeeded();
  console.log('SCGMEX: Datos semilla inicializados (modo demo)');
}
