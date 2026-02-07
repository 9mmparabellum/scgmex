export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  // M1: Configuracion
  CONFIGURACION: '/configuracion',
  ENTES: '/configuracion/entes',
  EJERCICIOS: '/configuracion/ejercicios',
  PERIODOS: '/configuracion/periodos',
  // M2: Catalogo
  CATALOGO: '/catalogo',
  PLAN_CUENTAS: '/catalogo/plan-cuentas',
  CLASIFICADORES: '/catalogo/clasificadores',
  MATRICES: '/catalogo/matrices',
  // M3: Contabilidad
  CONTABILIDAD: '/contabilidad',
  POLIZAS: '/contabilidad/polizas',
  POLIZA_NUEVA: '/contabilidad/polizas/nueva',
  POLIZA_DETALLE: '/contabilidad/polizas/:id',
  LIBRO_DIARIO: '/contabilidad/libro-diario',
  LIBRO_MAYOR: '/contabilidad/libro-mayor',
  BALANZA: '/contabilidad/balanza',
  // M4: Presupuesto Egresos
  PRESUPUESTO_EGRESOS: '/presupuesto-egresos',
  PARTIDAS: '/presupuesto-egresos/partidas',
  MOMENTOS_GASTO: '/presupuesto-egresos/momentos',
  // M5: Presupuesto Ingresos
  PRESUPUESTO_INGRESOS: '/presupuesto-ingresos',
  CONCEPTOS_INGRESO: '/presupuesto-ingresos/conceptos',
  MOMENTOS_INGRESO: '/presupuesto-ingresos/momentos',
  // M6: Patrimonio
  PATRIMONIO: '/patrimonio',
  BIENES: '/patrimonio/bienes',
  INVENTARIOS: '/patrimonio/inventarios',
  FIDEICOMISOS: '/patrimonio/fideicomisos',
  // M7: Deuda
  DEUDA: '/deuda',
  // M8: Reportes
  REPORTES: '/reportes',
  // M9: Cuenta Publica
  CUENTA_PUBLICA: '/cuenta-publica',
  // M10: Transparencia
  TRANSPARENCIA: '/transparencia',
  // M11: Fondos Federales
  FONDOS_FEDERALES: '/fondos-federales',
  // M12: Seguridad
  SEGURIDAD: '/seguridad',
  BITACORA: '/seguridad/bitacora',
  USUARIOS: '/seguridad/usuarios',
  PERFIL: '/perfil',
  // Conciliacion Contable-Presupuestal
  CONCILIACION: '/contabilidad/conciliacion',
  CONCILIACION_DETALLE: '/contabilidad/conciliacion/:id',
  // MIR / PbR
  PROGRAMAS: '/mir/programas',
  MIR_DETALLE: '/mir/:programaId',
  AVANCE_INDICADORES: '/mir/avances',
  REPORTE_PROGRAMATICO: '/mir/reporte',
  // Indicadores de Postura Fiscal
  INDICADORES_FISCALES: '/indicadores-fiscales',
  // Notas a los Estados Financieros
  NOTAS_EF: '/reportes/notas',
  // Apertura del Ejercicio
  APERTURA: '/configuracion/apertura',
  // Tesoreria
  TESORERIA: '/tesoreria',
  CUENTAS_BANCARIAS: '/tesoreria/bancos',
  MOVIMIENTOS_BANCARIOS: '/tesoreria/movimientos',
  CUENTAS_POR_COBRAR: '/tesoreria/cxc',
  CUENTAS_POR_PAGAR: '/tesoreria/cxp',
  FLUJO_EFECTIVO: '/tesoreria/flujo',
  // Conciliacion Bancaria
  CONCILIACION_BANCARIA: '/tesoreria/conciliacion-bancaria',
  CONCILIACION_BANCARIA_DETALLE: '/tesoreria/conciliacion-bancaria/:id',
  // Adquisiciones
  ADQUISICIONES: '/adquisiciones',
  PROVEEDORES: '/adquisiciones/proveedores',
  REQUISICIONES: '/adquisiciones/requisiciones',
  ORDENES_COMPRA: '/adquisiciones/ordenes',
  // Nomina
  NOMINA: '/nomina',
  EMPLEADOS: '/nomina/empleados',
  TABULADOR: '/nomina/tabulador',
  CONCEPTOS_NOMINA: '/nomina/conceptos',
  NOMINA_PERIODOS: '/nomina/periodos',
  NOMINA_DETALLE: '/nomina/periodos/:id',
  // Obra Publica
  OBRA_PUBLICA: '/obra-publica',
  PROYECTOS_OBRA: '/obra-publica/proyectos',
  PROYECTO_DETALLE: '/obra-publica/proyectos/:id',
  // Recaudacion
  RECAUDACION: '/recaudacion',
  CONTRIBUYENTES: '/recaudacion/contribuyentes',
  PADRON: '/recaudacion/padron',
  COBROS: '/recaudacion/cobros',
  // Envio Obligaciones
  OBLIGACIONES: '/obligaciones',
  // Portal Ciudadano
  PORTAL_CIUDADANO: '/portal-ciudadano',
  // CFDI
  CFDI: '/cfdi',
  CFDI_EMITIDOS: '/cfdi/emitidos',
  CFDI_RECIBIDOS: '/cfdi/recibidos',
  // Dashboard Realtime
  DASHBOARD_REALTIME: '/dashboard-realtime',
  // Benchmarking
  BENCHMARKING: '/benchmarking',
  // Reportes Avanzados
  REPORTES_AVANZADOS: '/reportes-avanzados',
};
