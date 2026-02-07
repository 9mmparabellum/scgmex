// ═══════════════════════════════════════════════════════════════════════
// Plan de Cuentas CONAC — Niveles 1 (Genero), 2 (Grupo), 3 (Rubro)
// Fuente: CONAC — Capitulo III del Manual de Contabilidad Gubernamental
// DOF 22-nov-2010, con reformas vigentes
// ═══════════════════════════════════════════════════════════════════════

// tipo_cuenta values: activo, pasivo, hacienda, ingresos, gastos, cierre, orden_contable, orden_presupuestario
// naturaleza: deudora | acreedora

const CONAC_PLAN_CUENTAS = [
  // ────────────────────────────────────────────────────────────────────
  // GENERO 1: ACTIVO
  // ────────────────────────────────────────────────────────────────────
  { codigo: '1', nombre: 'Activo', nivel: 1, tipo: 'activo', nat: 'deudora' },

  { codigo: '1.1', nombre: 'Activo Circulante', nivel: 2, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.1', nombre: 'Efectivo y Equivalentes', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.2', nombre: 'Derechos a Recibir Efectivo o Equivalentes', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.3', nombre: 'Derechos a Recibir Bienes o Servicios', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.4', nombre: 'Inventarios', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.5', nombre: 'Almacenes', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.6', nombre: 'Estimaciones y Provisiones', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.1.7', nombre: 'Otros Activos Circulantes', nivel: 3, tipo: 'activo', nat: 'deudora' },

  { codigo: '1.2', nombre: 'Activo No Circulante', nivel: 2, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.1', nombre: 'Inversiones Financieras a Largo Plazo', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.2', nombre: 'Derechos a Recibir Efectivo o Equivalentes a Largo Plazo', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.3', nombre: 'Bienes Inmuebles, Infraestructura y Construcciones en Proceso', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.4', nombre: 'Bienes Muebles', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.5', nombre: 'Activos Intangibles', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.6', nombre: 'Depreciacion, Deterioro y Amortizacion Acumulada de Bienes', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.7', nombre: 'Activos Diferidos', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.8', nombre: 'Estimaciones y Provisiones a Largo Plazo', nivel: 3, tipo: 'activo', nat: 'deudora' },
  { codigo: '1.2.9', nombre: 'Otros Activos No Circulantes', nivel: 3, tipo: 'activo', nat: 'deudora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 2: PASIVO
  // ────────────────────────────────────────────────────────────────────
  { codigo: '2', nombre: 'Pasivo', nivel: 1, tipo: 'pasivo', nat: 'acreedora' },

  { codigo: '2.1', nombre: 'Pasivo Circulante', nivel: 2, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.1', nombre: 'Cuentas por Pagar a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.2', nombre: 'Documentos por Pagar a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.3', nombre: 'Porcion a Corto Plazo de la Deuda Publica a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.4', nombre: 'Titulos y Valores a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.5', nombre: 'Pasivos Diferidos a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.6', nombre: 'Fondos y Bienes de Terceros en Garantia y/o Administracion a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.7', nombre: 'Provisiones a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.1.9', nombre: 'Otros Pasivos a Corto Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },

  { codigo: '2.2', nombre: 'Pasivo No Circulante', nivel: 2, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.2.1', nombre: 'Cuentas por Pagar a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.2.2', nombre: 'Documentos por Pagar a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.2.3', nombre: 'Deuda Publica a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.2.4', nombre: 'Pasivos Diferidos a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.2.5', nombre: 'Fondos y Bienes de Terceros en Garantia y/o Administracion a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },
  { codigo: '2.2.6', nombre: 'Provisiones a Largo Plazo', nivel: 3, tipo: 'pasivo', nat: 'acreedora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 3: HACIENDA PUBLICA CONTRIBUIDA
  // ────────────────────────────────────────────────────────────────────
  { codigo: '3', nombre: 'Hacienda Publica Contribuida', nivel: 1, tipo: 'hacienda', nat: 'acreedora' },

  { codigo: '3.1', nombre: 'Hacienda Publica Contribuida', nivel: 2, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.1.1', nombre: 'Contribuciones de Capital', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.1.2', nombre: 'Donaciones de Capital', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.1.3', nombre: 'Actualizacion de la Hacienda Publica', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },

  { codigo: '3.2', nombre: 'Hacienda Publica Generada', nivel: 2, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.2.1', nombre: 'Resultados del Ejercicio (Ahorro/Desahorro)', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.2.2', nombre: 'Resultados de Ejercicios Anteriores', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.2.3', nombre: 'Revaluos', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.2.4', nombre: 'Reservas', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.2.5', nombre: 'Rectificaciones de Resultados de Ejercicios Anteriores', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },

  { codigo: '3.3', nombre: 'Exceso o Insuficiencia en la Actualizacion de la Hacienda Publica', nivel: 2, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.3.1', nombre: 'Resultado por Posicion Monetaria', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },
  { codigo: '3.3.2', nombre: 'Resultado por Tenencia de Activos No Monetarios', nivel: 3, tipo: 'hacienda', nat: 'acreedora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 4: INGRESOS Y OTROS BENEFICIOS
  // ────────────────────────────────────────────────────────────────────
  { codigo: '4', nombre: 'Ingresos y Otros Beneficios', nivel: 1, tipo: 'ingresos', nat: 'acreedora' },

  { codigo: '4.1', nombre: 'Ingresos de Gestion', nivel: 2, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.1', nombre: 'Impuestos', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.2', nombre: 'Cuotas y Aportaciones de Seguridad Social', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.3', nombre: 'Contribuciones de Mejoras', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.4', nombre: 'Derechos', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.5', nombre: 'Productos de Tipo Corriente', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.6', nombre: 'Aprovechamientos de Tipo Corriente', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.7', nombre: 'Ingresos por Venta de Bienes, Prestacion de Servicios y Otros Ingresos', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.1.9', nombre: 'Ingresos No Comprendidos en las Fracciones de la Ley de Ingresos', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },

  { codigo: '4.2', nombre: 'Participaciones, Aportaciones, Transferencias, Asignaciones, Subsidios y Otras Ayudas', nivel: 2, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.2.1', nombre: 'Participaciones y Aportaciones', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.2.2', nombre: 'Transferencias, Asignaciones, Subsidios y Subvenciones, y Pensiones y Jubilaciones', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.2.3', nombre: 'Transferencias del Fondo Mexicano del Petroleo', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },

  { codigo: '4.3', nombre: 'Otros Ingresos y Beneficios', nivel: 2, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.3.1', nombre: 'Ingresos Financieros', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.3.2', nombre: 'Incremento por Variacion de Inventarios', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.3.3', nombre: 'Disminucion del Exceso de Estimaciones por Perdida o Deterioro u Obsolescencia', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.3.4', nombre: 'Disminucion del Exceso de Provisiones', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.3.5', nombre: 'Otros Ingresos y Beneficios Varios', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },
  { codigo: '4.3.9', nombre: 'Otros Ingresos Contables No Presupuestarios', nivel: 3, tipo: 'ingresos', nat: 'acreedora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 5: GASTOS Y OTRAS PERDIDAS
  // ────────────────────────────────────────────────────────────────────
  { codigo: '5', nombre: 'Gastos y Otras Perdidas', nivel: 1, tipo: 'gastos', nat: 'deudora' },

  { codigo: '5.1', nombre: 'Gastos de Funcionamiento', nivel: 2, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.1.1', nombre: 'Servicios Personales', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.1.2', nombre: 'Materiales y Suministros', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.1.3', nombre: 'Servicios Generales', nivel: 3, tipo: 'gastos', nat: 'deudora' },

  { codigo: '5.2', nombre: 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', nivel: 2, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.1', nombre: 'Transferencias Internas y Asignaciones al Sector Publico', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.2', nombre: 'Transferencias al Resto del Sector Publico', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.3', nombre: 'Subsidios y Subvenciones', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.4', nombre: 'Ayudas Sociales', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.5', nombre: 'Pensiones y Jubilaciones', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.6', nombre: 'Transferencias a Fideicomisos, Mandatos y Contratos Analogos', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.7', nombre: 'Transferencias a la Seguridad Social', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.8', nombre: 'Donativos', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.2.9', nombre: 'Transferencias al Exterior', nivel: 3, tipo: 'gastos', nat: 'deudora' },

  { codigo: '5.3', nombre: 'Participaciones y Aportaciones', nivel: 2, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.3.1', nombre: 'Participaciones de la Federacion a Entidades Federativas y Municipios', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.3.2', nombre: 'Aportaciones de la Federacion a Entidades Federativas y Municipios', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.3.3', nombre: 'Participaciones de las Entidades Federativas a los Municipios', nivel: 3, tipo: 'gastos', nat: 'deudora' },

  { codigo: '5.4', nombre: 'Intereses, Comisiones y Otros Gastos de la Deuda Publica', nivel: 2, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.4.1', nombre: 'Intereses de la Deuda Publica', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.4.2', nombre: 'Comisiones de la Deuda Publica', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.4.3', nombre: 'Gastos de la Deuda Publica', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.4.4', nombre: 'Costo por Coberturas', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.4.5', nombre: 'Apoyos Financieros', nivel: 3, tipo: 'gastos', nat: 'deudora' },

  { codigo: '5.5', nombre: 'Otros Gastos y Perdidas Extraordinarias', nivel: 2, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.5.1', nombre: 'Estimaciones, Depreciaciones, Deterioros, Obsolescencias y Amortizaciones', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.5.2', nombre: 'Provisiones', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.5.3', nombre: 'Disminucion de Inventarios', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.5.4', nombre: 'Aumento por Insuficiencia de Estimaciones por Perdida o Deterioro u Obsolescencia', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.5.5', nombre: 'Aumento por Insuficiencia de Provisiones', nivel: 3, tipo: 'gastos', nat: 'deudora' },
  { codigo: '5.5.9', nombre: 'Otros Gastos', nivel: 3, tipo: 'gastos', nat: 'deudora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 6: CUENTAS DE CIERRE CONTABLE
  // ────────────────────────────────────────────────────────────────────
  { codigo: '6', nombre: 'Cuentas de Cierre Contable', nivel: 1, tipo: 'cierre', nat: 'deudora' },

  { codigo: '6.1', nombre: 'Resumen de Ingresos y Gastos', nivel: 2, tipo: 'cierre', nat: 'deudora' },
  { codigo: '6.1.1', nombre: 'Resumen de Ingresos', nivel: 3, tipo: 'cierre', nat: 'acreedora' },
  { codigo: '6.1.2', nombre: 'Resumen de Gastos', nivel: 3, tipo: 'cierre', nat: 'deudora' },

  { codigo: '6.2', nombre: 'Ahorro de la Gestion', nivel: 2, tipo: 'cierre', nat: 'acreedora' },
  { codigo: '6.2.1', nombre: 'Ahorro de la Gestion', nivel: 3, tipo: 'cierre', nat: 'acreedora' },

  { codigo: '6.3', nombre: 'Desahorro de la Gestion', nivel: 2, tipo: 'cierre', nat: 'deudora' },
  { codigo: '6.3.1', nombre: 'Desahorro de la Gestion', nivel: 3, tipo: 'cierre', nat: 'deudora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 7: CUENTAS DE ORDEN CONTABLES
  // ────────────────────────────────────────────────────────────────────
  { codigo: '7', nombre: 'Cuentas de Orden Contables', nivel: 1, tipo: 'orden_contable', nat: 'deudora' },

  { codigo: '7.1', nombre: 'Valores', nivel: 2, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.1.1', nombre: 'Valores en Custodia', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.1.2', nombre: 'Custodia de Valores', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },

  { codigo: '7.2', nombre: 'Emprestitos y Deuda Publica', nivel: 2, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.2.1', nombre: 'Autorizacion de Emprestitos y Deuda Publica', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.2.2', nombre: 'Contratos de Emprestitos y Deuda Publica', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },

  { codigo: '7.3', nombre: 'Avales y Garantias', nivel: 2, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.3.1', nombre: 'Avales Autorizados', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.3.2', nombre: 'Avales Firmados', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },
  { codigo: '7.3.3', nombre: 'Fianzas y Garantias Recibidas', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.3.4', nombre: 'Fianzas y Garantias Otorgadas', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },

  { codigo: '7.4', nombre: 'Juicios', nivel: 2, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.4.1', nombre: 'Demandas Judiciales en Proceso de Resolucion', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.4.2', nombre: 'Resolucion de Demandas en Proceso Judicial', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },

  { codigo: '7.5', nombre: 'Bienes en Concesion o Comodato', nivel: 2, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.5.1', nombre: 'Bienes Bajo Contrato en Concesion', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.5.2', nombre: 'Contrato de Concesion por Bienes', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },
  { codigo: '7.5.3', nombre: 'Bienes Bajo Contrato en Comodato', nivel: 3, tipo: 'orden_contable', nat: 'deudora' },
  { codigo: '7.5.4', nombre: 'Contrato de Comodato por Bienes', nivel: 3, tipo: 'orden_contable', nat: 'acreedora' },

  // ────────────────────────────────────────────────────────────────────
  // GENERO 8: CUENTAS DE ORDEN PRESUPUESTARIAS
  // ────────────────────────────────────────────────────────────────────
  { codigo: '8', nombre: 'Cuentas de Orden Presupuestarias', nivel: 1, tipo: 'orden_presupuestario', nat: 'deudora' },

  { codigo: '8.1', nombre: 'Ley de Ingresos', nivel: 2, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.1.1', nombre: 'Ley de Ingresos Estimada', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.1.2', nombre: 'Ley de Ingresos por Ejecutar', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.1.3', nombre: 'Modificaciones a la Ley de Ingresos Estimada', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.1.4', nombre: 'Ley de Ingresos Devengada', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.1.5', nombre: 'Ley de Ingresos Recaudada', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },

  { codigo: '8.2', nombre: 'Presupuesto de Egresos', nivel: 2, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.1', nombre: 'Presupuesto de Egresos Aprobado', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.2', nombre: 'Presupuesto de Egresos por Ejercer', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.3', nombre: 'Modificaciones al Presupuesto de Egresos Aprobado', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.4', nombre: 'Presupuesto de Egresos Comprometido', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.5', nombre: 'Presupuesto de Egresos Devengado', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.6', nombre: 'Presupuesto de Egresos Ejercido', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
  { codigo: '8.2.7', nombre: 'Presupuesto de Egresos Pagado', nivel: 3, tipo: 'orden_presupuestario', nat: 'deudora' },
];

export default CONAC_PLAN_CUENTAS;
