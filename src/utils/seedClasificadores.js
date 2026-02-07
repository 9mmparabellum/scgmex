import { supabase } from '../config/supabase';

// =============================================================================
// Clasificador por Objeto del Gasto (COG) - CONAC Standard
// Estructura: 9 capitulos (1000-9000), conceptos (XX00), partidas genericas (XXX0)
// =============================================================================
export const COG_DATA = [
  // =========================================================================
  // Capitulo 1000 - Servicios Personales
  // =========================================================================
  { codigo: '1000', nombre: 'Servicios Personales', nivel: 1, padre_codigo: null },
  { codigo: '1100', nombre: 'Remuneraciones al Personal de Caracter Permanente', nivel: 2, padre_codigo: '1000' },
  { codigo: '1110', nombre: 'Dietas', nivel: 3, padre_codigo: '1100' },
  { codigo: '1120', nombre: 'Haberes', nivel: 3, padre_codigo: '1100' },
  { codigo: '1130', nombre: 'Sueldos Base al Personal Permanente', nivel: 3, padre_codigo: '1100' },
  { codigo: '1140', nombre: 'Remuneraciones por Adscripcion Laboral en el Extranjero', nivel: 3, padre_codigo: '1100' },
  { codigo: '1200', nombre: 'Remuneraciones al Personal de Caracter Transitorio', nivel: 2, padre_codigo: '1000' },
  { codigo: '1210', nombre: 'Honorarios Asimilables a Salarios', nivel: 3, padre_codigo: '1200' },
  { codigo: '1220', nombre: 'Sueldos Base al Personal Eventual', nivel: 3, padre_codigo: '1200' },
  { codigo: '1230', nombre: 'Retribuciones por Servicios de Caracter Social', nivel: 3, padre_codigo: '1200' },
  { codigo: '1300', nombre: 'Remuneraciones Adicionales y Especiales', nivel: 2, padre_codigo: '1000' },
  { codigo: '1310', nombre: 'Primas por Anios de Servicios Efectivos Prestados', nivel: 3, padre_codigo: '1300' },
  { codigo: '1320', nombre: 'Primas de Vacaciones, Dominical y Gratificacion de Fin de Anio', nivel: 3, padre_codigo: '1300' },
  { codigo: '1330', nombre: 'Horas Extraordinarias', nivel: 3, padre_codigo: '1300' },
  { codigo: '1340', nombre: 'Compensaciones', nivel: 3, padre_codigo: '1300' },
  { codigo: '1350', nombre: 'Sobrehaberes', nivel: 3, padre_codigo: '1300' },
  { codigo: '1360', nombre: 'Asignaciones de Tecnico, de Mando, por Comision, de Vuelo y de Tecnico Especial', nivel: 3, padre_codigo: '1300' },
  { codigo: '1370', nombre: 'Honorarios Especiales', nivel: 3, padre_codigo: '1300' },
  { codigo: '1380', nombre: 'Participaciones por Vigilancia en el Cumplimiento de las Leyes y Custodia de Valores', nivel: 3, padre_codigo: '1300' },
  { codigo: '1400', nombre: 'Seguridad Social', nivel: 2, padre_codigo: '1000' },
  { codigo: '1410', nombre: 'Aportaciones de Seguridad Social', nivel: 3, padre_codigo: '1400' },
  { codigo: '1420', nombre: 'Aportaciones a Fondos de Vivienda', nivel: 3, padre_codigo: '1400' },
  { codigo: '1430', nombre: 'Aportaciones al Sistema para el Retiro', nivel: 3, padre_codigo: '1400' },
  { codigo: '1440', nombre: 'Aportaciones para Seguros', nivel: 3, padre_codigo: '1400' },
  { codigo: '1500', nombre: 'Otras Prestaciones Sociales y Economicas', nivel: 2, padre_codigo: '1000' },
  { codigo: '1510', nombre: 'Cuotas para el Fondo de Ahorro y Fondo de Trabajo', nivel: 3, padre_codigo: '1500' },
  { codigo: '1520', nombre: 'Indemnizaciones', nivel: 3, padre_codigo: '1500' },
  { codigo: '1530', nombre: 'Prestaciones y Haberes de Retiro', nivel: 3, padre_codigo: '1500' },
  { codigo: '1540', nombre: 'Prestaciones Contractuales', nivel: 3, padre_codigo: '1500' },
  { codigo: '1550', nombre: 'Apoyos a la Capacitacion de los Servidores Publicos', nivel: 3, padre_codigo: '1500' },
  { codigo: '1560', nombre: 'Otras Prestaciones Sociales y Economicas', nivel: 3, padre_codigo: '1500' },
  { codigo: '1600', nombre: 'Previsiones', nivel: 2, padre_codigo: '1000' },
  { codigo: '1610', nombre: 'Previsiones de Caracter Laboral, Economica y de Seguridad Social', nivel: 3, padre_codigo: '1600' },
  { codigo: '1700', nombre: 'Pago de Estimulos a Servidores Publicos', nivel: 2, padre_codigo: '1000' },
  { codigo: '1710', nombre: 'Estimulos', nivel: 3, padre_codigo: '1700' },
  { codigo: '1720', nombre: 'Recompensas', nivel: 3, padre_codigo: '1700' },

  // =========================================================================
  // Capitulo 2000 - Materiales y Suministros
  // =========================================================================
  { codigo: '2000', nombre: 'Materiales y Suministros', nivel: 1, padre_codigo: null },
  { codigo: '2100', nombre: 'Materiales de Administracion, Emision de Documentos y Articulos Oficiales', nivel: 2, padre_codigo: '2000' },
  { codigo: '2110', nombre: 'Materiales, Utiles y Equipos Menores de Oficina', nivel: 3, padre_codigo: '2100' },
  { codigo: '2120', nombre: 'Materiales y Utiles de Impresion y Reproduccion', nivel: 3, padre_codigo: '2100' },
  { codigo: '2130', nombre: 'Material Estadistico y Geografico', nivel: 3, padre_codigo: '2100' },
  { codigo: '2140', nombre: 'Materiales, Utiles y Equipos Menores de Tecnologias de la Informacion y Comunicaciones', nivel: 3, padre_codigo: '2100' },
  { codigo: '2150', nombre: 'Material Impreso e Informacion Digital', nivel: 3, padre_codigo: '2100' },
  { codigo: '2160', nombre: 'Material de Limpieza', nivel: 3, padre_codigo: '2100' },
  { codigo: '2170', nombre: 'Materiales y Utiles de Ensenanza', nivel: 3, padre_codigo: '2100' },
  { codigo: '2180', nombre: 'Materiales para el Registro e Identificacion de Bienes y Personas', nivel: 3, padre_codigo: '2100' },
  { codigo: '2200', nombre: 'Alimentos y Utensilios', nivel: 2, padre_codigo: '2000' },
  { codigo: '2210', nombre: 'Productos Alimenticios para Personas', nivel: 3, padre_codigo: '2200' },
  { codigo: '2220', nombre: 'Productos Alimenticios para Animales', nivel: 3, padre_codigo: '2200' },
  { codigo: '2230', nombre: 'Utensilios para el Servicio de Alimentacion', nivel: 3, padre_codigo: '2200' },
  { codigo: '2300', nombre: 'Materias Primas y Materiales de Produccion y Comercializacion', nivel: 2, padre_codigo: '2000' },
  { codigo: '2310', nombre: 'Productos Alimenticios, Agropecuarios y Forestales Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2320', nombre: 'Insumos Textiles Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2330', nombre: 'Productos de Papel, Carton e Impresos Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2340', nombre: 'Combustibles, Lubricantes, Aditivos, Carbon y sus Derivados Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2350', nombre: 'Productos Quimicos, Farmaceuticos y de Laboratorio Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2360', nombre: 'Productos Metalicos y a Base de Minerales No Metalicos Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2370', nombre: 'Productos de Cuero, Piel, Plastico y Hule Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2380', nombre: 'Mercancias Adquiridas para su Comercializacion', nivel: 3, padre_codigo: '2300' },
  { codigo: '2390', nombre: 'Otros Productos Adquiridos como Materia Prima', nivel: 3, padre_codigo: '2300' },
  { codigo: '2400', nombre: 'Materiales y Articulos de Construccion y de Reparacion', nivel: 2, padre_codigo: '2000' },
  { codigo: '2410', nombre: 'Productos Minerales No Metalicos', nivel: 3, padre_codigo: '2400' },
  { codigo: '2420', nombre: 'Cemite y Productos de Concreto', nivel: 3, padre_codigo: '2400' },
  { codigo: '2430', nombre: 'Cal, Yeso y Productos de Yeso', nivel: 3, padre_codigo: '2400' },
  { codigo: '2440', nombre: 'Madera y Productos de Madera', nivel: 3, padre_codigo: '2400' },
  { codigo: '2450', nombre: 'Vidrio y Productos de Vidrio', nivel: 3, padre_codigo: '2400' },
  { codigo: '2460', nombre: 'Material Electrico y Electronico', nivel: 3, padre_codigo: '2400' },
  { codigo: '2470', nombre: 'Articulos Metalicos para la Construccion', nivel: 3, padre_codigo: '2400' },
  { codigo: '2480', nombre: 'Materiales Complementarios', nivel: 3, padre_codigo: '2400' },
  { codigo: '2490', nombre: 'Otros Materiales y Articulos de Construccion y Reparacion', nivel: 3, padre_codigo: '2400' },
  { codigo: '2500', nombre: 'Productos Quimicos, Farmaceuticos y de Laboratorio', nivel: 2, padre_codigo: '2000' },
  { codigo: '2510', nombre: 'Productos Quimicos Basicos', nivel: 3, padre_codigo: '2500' },
  { codigo: '2520', nombre: 'Fertilizantes, Pesticidas y Otros Agroquimicos', nivel: 3, padre_codigo: '2500' },
  { codigo: '2530', nombre: 'Medicinas y Productos Farmaceuticos', nivel: 3, padre_codigo: '2500' },
  { codigo: '2540', nombre: 'Materiales, Accesorios y Suministros Medicos', nivel: 3, padre_codigo: '2500' },
  { codigo: '2550', nombre: 'Materiales, Accesorios y Suministros de Laboratorio', nivel: 3, padre_codigo: '2500' },
  { codigo: '2560', nombre: 'Fibras Sinteticas, Hules, Plasticos y Derivados', nivel: 3, padre_codigo: '2500' },
  { codigo: '2590', nombre: 'Otros Productos Quimicos', nivel: 3, padre_codigo: '2500' },
  { codigo: '2600', nombre: 'Combustibles, Lubricantes y Aditivos', nivel: 2, padre_codigo: '2000' },
  { codigo: '2610', nombre: 'Combustibles, Lubricantes y Aditivos', nivel: 3, padre_codigo: '2600' },
  { codigo: '2620', nombre: 'Carbon y sus Derivados', nivel: 3, padre_codigo: '2600' },
  { codigo: '2700', nombre: 'Vestuario, Blancos, Prendas de Proteccion y Articulos Deportivos', nivel: 2, padre_codigo: '2000' },
  { codigo: '2710', nombre: 'Vestuario y Uniformes', nivel: 3, padre_codigo: '2700' },
  { codigo: '2720', nombre: 'Prendas de Seguridad y Proteccion Personal', nivel: 3, padre_codigo: '2700' },
  { codigo: '2730', nombre: 'Articulos Deportivos', nivel: 3, padre_codigo: '2700' },
  { codigo: '2740', nombre: 'Productos Textiles', nivel: 3, padre_codigo: '2700' },
  { codigo: '2750', nombre: 'Blancos y Otros Productos Textiles, Excepto Prendas de Vestir', nivel: 3, padre_codigo: '2700' },
  { codigo: '2800', nombre: 'Materiales y Suministros para Seguridad', nivel: 2, padre_codigo: '2000' },
  { codigo: '2810', nombre: 'Sustancias y Materiales Explosivos', nivel: 3, padre_codigo: '2800' },
  { codigo: '2820', nombre: 'Materiales de Seguridad Publica', nivel: 3, padre_codigo: '2800' },
  { codigo: '2830', nombre: 'Prendas de Proteccion para Seguridad Publica y Nacional', nivel: 3, padre_codigo: '2800' },
  { codigo: '2900', nombre: 'Herramientas, Refacciones y Accesorios Menores', nivel: 2, padre_codigo: '2000' },
  { codigo: '2910', nombre: 'Herramientas Menores', nivel: 3, padre_codigo: '2900' },
  { codigo: '2920', nombre: 'Refacciones y Accesorios Menores de Edificios', nivel: 3, padre_codigo: '2900' },
  { codigo: '2930', nombre: 'Refacciones y Accesorios Menores de Mobiliario y Equipo de Administracion, Educacional y Recreativo', nivel: 3, padre_codigo: '2900' },
  { codigo: '2940', nombre: 'Refacciones y Accesorios Menores de Equipo de Computo y Tecnologias de la Informacion', nivel: 3, padre_codigo: '2900' },
  { codigo: '2950', nombre: 'Refacciones y Accesorios Menores de Equipo e Instrumental Medico y de Laboratorio', nivel: 3, padre_codigo: '2900' },
  { codigo: '2960', nombre: 'Refacciones y Accesorios Menores de Equipo de Transporte', nivel: 3, padre_codigo: '2900' },
  { codigo: '2970', nombre: 'Refacciones y Accesorios Menores de Equipo de Defensa y Seguridad', nivel: 3, padre_codigo: '2900' },
  { codigo: '2980', nombre: 'Refacciones y Accesorios Menores de Maquinaria y Otros Equipos', nivel: 3, padre_codigo: '2900' },
  { codigo: '2990', nombre: 'Refacciones y Accesorios Menores Otros Bienes Muebles', nivel: 3, padre_codigo: '2900' },

  // =========================================================================
  // Capitulo 3000 - Servicios Generales
  // =========================================================================
  { codigo: '3000', nombre: 'Servicios Generales', nivel: 1, padre_codigo: null },
  { codigo: '3100', nombre: 'Servicios Basicos', nivel: 2, padre_codigo: '3000' },
  { codigo: '3110', nombre: 'Energia Electrica', nivel: 3, padre_codigo: '3100' },
  { codigo: '3120', nombre: 'Gas', nivel: 3, padre_codigo: '3100' },
  { codigo: '3130', nombre: 'Agua', nivel: 3, padre_codigo: '3100' },
  { codigo: '3140', nombre: 'Telefonia Tradicional', nivel: 3, padre_codigo: '3100' },
  { codigo: '3150', nombre: 'Telefonia Celular', nivel: 3, padre_codigo: '3100' },
  { codigo: '3160', nombre: 'Servicios de Telecomunicaciones y Satelites', nivel: 3, padre_codigo: '3100' },
  { codigo: '3170', nombre: 'Servicios de Acceso de Internet, Redes y Procesamiento de Informacion', nivel: 3, padre_codigo: '3100' },
  { codigo: '3180', nombre: 'Servicios Postales y Telegraficos', nivel: 3, padre_codigo: '3100' },
  { codigo: '3190', nombre: 'Servicios Integrales y Otros Servicios', nivel: 3, padre_codigo: '3100' },
  { codigo: '3200', nombre: 'Servicios de Arrendamiento', nivel: 2, padre_codigo: '3000' },
  { codigo: '3210', nombre: 'Arrendamiento de Terrenos', nivel: 3, padre_codigo: '3200' },
  { codigo: '3220', nombre: 'Arrendamiento de Edificios', nivel: 3, padre_codigo: '3200' },
  { codigo: '3230', nombre: 'Arrendamiento de Mobiliario y Equipo de Administracion, Educacional y Recreativo', nivel: 3, padre_codigo: '3200' },
  { codigo: '3240', nombre: 'Arrendamiento de Equipo e Instrumental Medico y de Laboratorio', nivel: 3, padre_codigo: '3200' },
  { codigo: '3250', nombre: 'Arrendamiento de Equipo de Transporte', nivel: 3, padre_codigo: '3200' },
  { codigo: '3260', nombre: 'Arrendamiento de Maquinaria, Otros Equipos y Herramientas', nivel: 3, padre_codigo: '3200' },
  { codigo: '3270', nombre: 'Arrendamiento de Activos Intangibles', nivel: 3, padre_codigo: '3200' },
  { codigo: '3280', nombre: 'Arrendamiento Financiero', nivel: 3, padre_codigo: '3200' },
  { codigo: '3290', nombre: 'Otros Arrendamientos', nivel: 3, padre_codigo: '3200' },
  { codigo: '3300', nombre: 'Servicios Profesionales, Cientificos, Tecnicos y Otros Servicios', nivel: 2, padre_codigo: '3000' },
  { codigo: '3310', nombre: 'Servicios Legales, de Contabilidad, Auditoria y Relacionados', nivel: 3, padre_codigo: '3300' },
  { codigo: '3320', nombre: 'Servicios de Diseno, Arquitectura, Ingenieria y Actividades Relacionadas', nivel: 3, padre_codigo: '3300' },
  { codigo: '3330', nombre: 'Servicios de Consultoria Administrativa, Procesos, Tecnica y en Tecnologias de la Informacion', nivel: 3, padre_codigo: '3300' },
  { codigo: '3340', nombre: 'Servicios de Capacitacion', nivel: 3, padre_codigo: '3300' },
  { codigo: '3350', nombre: 'Servicios de Investigacion Cientifica y Desarrollo', nivel: 3, padre_codigo: '3300' },
  { codigo: '3360', nombre: 'Servicios de Apoyo Administrativo, Traduccion, Fotocopiado e Impresion', nivel: 3, padre_codigo: '3300' },
  { codigo: '3370', nombre: 'Servicios de Proteccion y Seguridad', nivel: 3, padre_codigo: '3300' },
  { codigo: '3380', nombre: 'Servicios de Vigilancia', nivel: 3, padre_codigo: '3300' },
  { codigo: '3390', nombre: 'Servicios Profesionales, Cientificos y Tecnicos Integrales', nivel: 3, padre_codigo: '3300' },
  { codigo: '3400', nombre: 'Servicios Financieros, Bancarios y Comerciales', nivel: 2, padre_codigo: '3000' },
  { codigo: '3410', nombre: 'Servicios Financieros y Bancarios', nivel: 3, padre_codigo: '3400' },
  { codigo: '3420', nombre: 'Servicios de Cobranza, Investigacion Crediticia y Similar', nivel: 3, padre_codigo: '3400' },
  { codigo: '3430', nombre: 'Servicios de Recaudacion, Traslado y Custodia de Valores', nivel: 3, padre_codigo: '3400' },
  { codigo: '3440', nombre: 'Seguros de Responsabilidad Patrimonial y Fianzas', nivel: 3, padre_codigo: '3400' },
  { codigo: '3450', nombre: 'Seguro de Bienes Patrimoniales', nivel: 3, padre_codigo: '3400' },
  { codigo: '3460', nombre: 'Almacenaje, Envase y Embalaje', nivel: 3, padre_codigo: '3400' },
  { codigo: '3470', nombre: 'Fletes y Maniobras', nivel: 3, padre_codigo: '3400' },
  { codigo: '3480', nombre: 'Comisiones por Ventas', nivel: 3, padre_codigo: '3400' },
  { codigo: '3490', nombre: 'Servicios Financieros, Bancarios y Comerciales Integrales', nivel: 3, padre_codigo: '3400' },
  { codigo: '3500', nombre: 'Servicios de Instalacion, Reparacion, Mantenimiento y Conservacion', nivel: 2, padre_codigo: '3000' },
  { codigo: '3510', nombre: 'Conservacion y Mantenimiento Menor de Inmuebles', nivel: 3, padre_codigo: '3500' },
  { codigo: '3520', nombre: 'Instalacion, Reparacion y Mantenimiento de Mobiliario y Equipo de Administracion, Educacional y Recreativo', nivel: 3, padre_codigo: '3500' },
  { codigo: '3530', nombre: 'Instalacion, Reparacion y Mantenimiento de Equipo de Computo y Tecnologias de la Informacion', nivel: 3, padre_codigo: '3500' },
  { codigo: '3540', nombre: 'Instalacion, Reparacion y Mantenimiento de Equipo e Instrumental Medico y de Laboratorio', nivel: 3, padre_codigo: '3500' },
  { codigo: '3550', nombre: 'Reparacion y Mantenimiento de Equipo de Transporte', nivel: 3, padre_codigo: '3500' },
  { codigo: '3560', nombre: 'Reparacion y Mantenimiento de Equipo de Defensa y Seguridad', nivel: 3, padre_codigo: '3500' },
  { codigo: '3570', nombre: 'Instalacion, Reparacion y Mantenimiento de Maquinaria, Otros Equipos y Herramientas', nivel: 3, padre_codigo: '3500' },
  { codigo: '3580', nombre: 'Servicios de Limpieza y Manejo de Desechos', nivel: 3, padre_codigo: '3500' },
  { codigo: '3590', nombre: 'Servicios de Jardineria y Fumigacion', nivel: 3, padre_codigo: '3500' },
  { codigo: '3600', nombre: 'Servicios de Comunicacion Social y Publicidad', nivel: 2, padre_codigo: '3000' },
  { codigo: '3610', nombre: 'Difusion por Radio, Television y Otros Medios de Mensajes Sobre Programas y Actividades Gubernamentales', nivel: 3, padre_codigo: '3600' },
  { codigo: '3620', nombre: 'Difusion por Radio, Television y Otros Medios de Mensajes Comerciales para Promover la Venta de Bienes o Servicios', nivel: 3, padre_codigo: '3600' },
  { codigo: '3630', nombre: 'Servicios de Creatividad, Preproduccion y Produccion de Publicidad, Excepto Internet', nivel: 3, padre_codigo: '3600' },
  { codigo: '3640', nombre: 'Servicios de Revelado de Fotografias', nivel: 3, padre_codigo: '3600' },
  { codigo: '3650', nombre: 'Servicios de la Industria Filmica, del Sonido y del Video', nivel: 3, padre_codigo: '3600' },
  { codigo: '3660', nombre: 'Servicio de Creacion y Difusion de Contenido Exclusivamente a traves de Internet', nivel: 3, padre_codigo: '3600' },
  { codigo: '3690', nombre: 'Otros Servicios de Informacion', nivel: 3, padre_codigo: '3600' },
  { codigo: '3700', nombre: 'Servicios de Traslado y Viaticos', nivel: 2, padre_codigo: '3000' },
  { codigo: '3710', nombre: 'Pasajes Aereos', nivel: 3, padre_codigo: '3700' },
  { codigo: '3720', nombre: 'Pasajes Terrestres', nivel: 3, padre_codigo: '3700' },
  { codigo: '3730', nombre: 'Pasajes Maritimos, Lacustres y Fluviales', nivel: 3, padre_codigo: '3700' },
  { codigo: '3740', nombre: 'Autotransporte', nivel: 3, padre_codigo: '3700' },
  { codigo: '3750', nombre: 'Viaticos en el Pais', nivel: 3, padre_codigo: '3700' },
  { codigo: '3760', nombre: 'Viaticos en el Extranjero', nivel: 3, padre_codigo: '3700' },
  { codigo: '3770', nombre: 'Gastos de Instalacion y Traslado de Menaje', nivel: 3, padre_codigo: '3700' },
  { codigo: '3780', nombre: 'Servicios Integrales de Traslado y Viaticos', nivel: 3, padre_codigo: '3700' },
  { codigo: '3790', nombre: 'Otros Servicios de Traslado y Hospedaje', nivel: 3, padre_codigo: '3700' },
  { codigo: '3800', nombre: 'Servicios Oficiales', nivel: 2, padre_codigo: '3000' },
  { codigo: '3810', nombre: 'Gastos de Ceremonial', nivel: 3, padre_codigo: '3800' },
  { codigo: '3820', nombre: 'Gastos de Orden Social y Protocolo', nivel: 3, padre_codigo: '3800' },
  { codigo: '3830', nombre: 'Congresos y Convenciones', nivel: 3, padre_codigo: '3800' },
  { codigo: '3840', nombre: 'Exposiciones', nivel: 3, padre_codigo: '3800' },
  { codigo: '3850', nombre: 'Gastos de Representacion', nivel: 3, padre_codigo: '3800' },
  { codigo: '3900', nombre: 'Otros Servicios Generales', nivel: 2, padre_codigo: '3000' },
  { codigo: '3910', nombre: 'Servicios Funerarios y de Cementerios', nivel: 3, padre_codigo: '3900' },
  { codigo: '3920', nombre: 'Impuestos y Derechos', nivel: 3, padre_codigo: '3900' },
  { codigo: '3930', nombre: 'Impuestos y Derechos de Importacion', nivel: 3, padre_codigo: '3900' },
  { codigo: '3940', nombre: 'Sentencias y Resoluciones por Autoridad Competente', nivel: 3, padre_codigo: '3900' },
  { codigo: '3950', nombre: 'Penas, Multas, Accesorios y Actualizaciones', nivel: 3, padre_codigo: '3900' },
  { codigo: '3960', nombre: 'Otros Gastos por Responsabilidades', nivel: 3, padre_codigo: '3900' },
  { codigo: '3970', nombre: 'Utilidades', nivel: 3, padre_codigo: '3900' },
  { codigo: '3980', nombre: 'Impuesto Sobre Nominas y Otros que se Deriven de una Relacion Laboral', nivel: 3, padre_codigo: '3900' },
  { codigo: '3990', nombre: 'Otros Servicios Generales', nivel: 3, padre_codigo: '3900' },

  // =========================================================================
  // Capitulo 4000 - Transferencias, Asignaciones, Subsidios y Otras Ayudas
  // =========================================================================
  { codigo: '4000', nombre: 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', nivel: 1, padre_codigo: null },
  { codigo: '4100', nombre: 'Transferencias Internas y Asignaciones al Sector Publico', nivel: 2, padre_codigo: '4000' },
  { codigo: '4110', nombre: 'Asignaciones Presupuestarias al Poder Ejecutivo', nivel: 3, padre_codigo: '4100' },
  { codigo: '4120', nombre: 'Asignaciones Presupuestarias al Poder Legislativo', nivel: 3, padre_codigo: '4100' },
  { codigo: '4130', nombre: 'Asignaciones Presupuestarias al Poder Judicial', nivel: 3, padre_codigo: '4100' },
  { codigo: '4140', nombre: 'Asignaciones Presupuestarias a Organos Autonomos', nivel: 3, padre_codigo: '4100' },
  { codigo: '4150', nombre: 'Transferencias Internas Otorgadas a Entidades Paraestatales No Empresariales y No Financieras', nivel: 3, padre_codigo: '4100' },
  { codigo: '4160', nombre: 'Transferencias Internas Otorgadas a Entidades Paraestatales Empresariales y No Financieras', nivel: 3, padre_codigo: '4100' },
  { codigo: '4170', nombre: 'Transferencias Internas Otorgadas a Fideicomisos Publicos Empresariales y No Financieros', nivel: 3, padre_codigo: '4100' },
  { codigo: '4180', nombre: 'Transferencias Internas Otorgadas a Instituciones Paraestatales Publicas Financieras', nivel: 3, padre_codigo: '4100' },
  { codigo: '4190', nombre: 'Transferencias Internas Otorgadas a Fideicomisos Publicos Financieros', nivel: 3, padre_codigo: '4100' },
  { codigo: '4200', nombre: 'Transferencias al Resto del Sector Publico', nivel: 2, padre_codigo: '4000' },
  { codigo: '4210', nombre: 'Transferencias Otorgadas a Entidades Paraestatales No Empresariales y No Financieras', nivel: 3, padre_codigo: '4200' },
  { codigo: '4220', nombre: 'Transferencias Otorgadas a Entidades Paraestatales Empresariales y No Financieras', nivel: 3, padre_codigo: '4200' },
  { codigo: '4230', nombre: 'Transferencias Otorgadas a Instituciones Paraestatales Publicas Financieras', nivel: 3, padre_codigo: '4200' },
  { codigo: '4240', nombre: 'Transferencias Otorgadas a Entidades Federativas y Municipios', nivel: 3, padre_codigo: '4200' },
  { codigo: '4250', nombre: 'Transferencias a Fideicomisos de Entidades Federativas y Municipios', nivel: 3, padre_codigo: '4200' },
  { codigo: '4300', nombre: 'Subsidios y Subvenciones', nivel: 2, padre_codigo: '4000' },
  { codigo: '4310', nombre: 'Subsidios a la Produccion', nivel: 3, padre_codigo: '4300' },
  { codigo: '4320', nombre: 'Subsidios a la Distribucion', nivel: 3, padre_codigo: '4300' },
  { codigo: '4330', nombre: 'Subsidios a la Inversion', nivel: 3, padre_codigo: '4300' },
  { codigo: '4340', nombre: 'Subsidios a la Prestacion de Servicios Publicos', nivel: 3, padre_codigo: '4300' },
  { codigo: '4350', nombre: 'Subsidios para Cubrir Diferenciales de Tasas de Interes', nivel: 3, padre_codigo: '4300' },
  { codigo: '4360', nombre: 'Subsidios a la Vivienda', nivel: 3, padre_codigo: '4300' },
  { codigo: '4370', nombre: 'Subvenciones al Consumo', nivel: 3, padre_codigo: '4300' },
  { codigo: '4380', nombre: 'Subsidios a Entidades Federativas y Municipios', nivel: 3, padre_codigo: '4300' },
  { codigo: '4390', nombre: 'Otros Subsidios', nivel: 3, padre_codigo: '4300' },
  { codigo: '4400', nombre: 'Ayudas Sociales', nivel: 2, padre_codigo: '4000' },
  { codigo: '4410', nombre: 'Ayudas Sociales a Personas', nivel: 3, padre_codigo: '4400' },
  { codigo: '4420', nombre: 'Becas y Otras Ayudas para Programas de Capacitacion', nivel: 3, padre_codigo: '4400' },
  { codigo: '4430', nombre: 'Ayudas Sociales a Instituciones de Ensenanza', nivel: 3, padre_codigo: '4400' },
  { codigo: '4440', nombre: 'Ayudas Sociales a Actividades Cientificas o Academicas', nivel: 3, padre_codigo: '4400' },
  { codigo: '4450', nombre: 'Ayudas Sociales a Instituciones Sin Fines de Lucro', nivel: 3, padre_codigo: '4400' },
  { codigo: '4460', nombre: 'Ayudas Sociales a Cooperativas', nivel: 3, padre_codigo: '4400' },
  { codigo: '4470', nombre: 'Ayudas Sociales a Entidades de Interes Publico', nivel: 3, padre_codigo: '4400' },
  { codigo: '4480', nombre: 'Ayudas por Desastres Naturales y Otros Siniestros', nivel: 3, padre_codigo: '4400' },
  { codigo: '4500', nombre: 'Pensiones y Jubilaciones', nivel: 2, padre_codigo: '4000' },
  { codigo: '4510', nombre: 'Pensiones', nivel: 3, padre_codigo: '4500' },
  { codigo: '4520', nombre: 'Jubilaciones', nivel: 3, padre_codigo: '4500' },
  { codigo: '4530', nombre: 'Otras Pensiones y Jubilaciones', nivel: 3, padre_codigo: '4500' },
  { codigo: '4600', nombre: 'Transferencias a Fideicomisos, Mandatos y Otros Analogos', nivel: 2, padre_codigo: '4000' },
  { codigo: '4610', nombre: 'Transferencias a Fideicomisos del Poder Ejecutivo', nivel: 3, padre_codigo: '4600' },
  { codigo: '4620', nombre: 'Transferencias a Fideicomisos del Poder Legislativo', nivel: 3, padre_codigo: '4600' },
  { codigo: '4630', nombre: 'Transferencias a Fideicomisos del Poder Judicial', nivel: 3, padre_codigo: '4600' },
  { codigo: '4640', nombre: 'Transferencias a Fideicomisos Publicos de Entidades Paraestatales', nivel: 3, padre_codigo: '4600' },
  { codigo: '4650', nombre: 'Transferencias a Fideicomisos de Instituciones Publicas Financieras', nivel: 3, padre_codigo: '4600' },
  { codigo: '4700', nombre: 'Transferencias a la Seguridad Social', nivel: 2, padre_codigo: '4000' },
  { codigo: '4710', nombre: 'Transferencias por Obligacion de Ley', nivel: 3, padre_codigo: '4700' },
  { codigo: '4800', nombre: 'Donativos', nivel: 2, padre_codigo: '4000' },
  { codigo: '4810', nombre: 'Donativos a Instituciones Sin Fines de Lucro', nivel: 3, padre_codigo: '4800' },
  { codigo: '4820', nombre: 'Donativos a Entidades Federativas', nivel: 3, padre_codigo: '4800' },
  { codigo: '4830', nombre: 'Donativos a Fideicomisos Privados', nivel: 3, padre_codigo: '4800' },
  { codigo: '4840', nombre: 'Donativos a Fideicomisos Estatales', nivel: 3, padre_codigo: '4800' },
  { codigo: '4850', nombre: 'Donativos Internacionales', nivel: 3, padre_codigo: '4800' },
  { codigo: '4900', nombre: 'Transferencias al Exterior', nivel: 2, padre_codigo: '4000' },
  { codigo: '4910', nombre: 'Transferencias para Gobiernos Extranjeros', nivel: 3, padre_codigo: '4900' },
  { codigo: '4920', nombre: 'Transferencias para Organismos Internacionales', nivel: 3, padre_codigo: '4900' },
  { codigo: '4930', nombre: 'Transferencias para el Sector Privado Externo', nivel: 3, padre_codigo: '4900' },

  // =========================================================================
  // Capitulo 5000 - Bienes Muebles, Inmuebles e Intangibles
  // =========================================================================
  { codigo: '5000', nombre: 'Bienes Muebles, Inmuebles e Intangibles', nivel: 1, padre_codigo: null },
  { codigo: '5100', nombre: 'Mobiliario y Equipo de Administracion', nivel: 2, padre_codigo: '5000' },
  { codigo: '5110', nombre: 'Muebles de Oficina y Estanteria', nivel: 3, padre_codigo: '5100' },
  { codigo: '5120', nombre: 'Muebles, Excepto de Oficina y Estanteria', nivel: 3, padre_codigo: '5100' },
  { codigo: '5130', nombre: 'Bienes Artisticos, Culturales y Cientificos', nivel: 3, padre_codigo: '5100' },
  { codigo: '5140', nombre: 'Objetos de Valor', nivel: 3, padre_codigo: '5100' },
  { codigo: '5150', nombre: 'Equipo de Computo y de Tecnologias de la Informacion', nivel: 3, padre_codigo: '5100' },
  { codigo: '5190', nombre: 'Otros Mobiliarios y Equipos de Administracion', nivel: 3, padre_codigo: '5100' },
  { codigo: '5200', nombre: 'Mobiliario y Equipo Educacional y Recreativo', nivel: 2, padre_codigo: '5000' },
  { codigo: '5210', nombre: 'Equipos y Aparatos Audiovisuales', nivel: 3, padre_codigo: '5200' },
  { codigo: '5220', nombre: 'Aparatos Deportivos', nivel: 3, padre_codigo: '5200' },
  { codigo: '5230', nombre: 'Camaras Fotograficas y de Video', nivel: 3, padre_codigo: '5200' },
  { codigo: '5290', nombre: 'Otro Mobiliario y Equipo Educacional y Recreativo', nivel: 3, padre_codigo: '5200' },
  { codigo: '5300', nombre: 'Equipo e Instrumental Medico y de Laboratorio', nivel: 2, padre_codigo: '5000' },
  { codigo: '5310', nombre: 'Equipo Medico y de Laboratorio', nivel: 3, padre_codigo: '5300' },
  { codigo: '5320', nombre: 'Instrumental Medico y de Laboratorio', nivel: 3, padre_codigo: '5300' },
  { codigo: '5400', nombre: 'Vehiculos y Equipo de Transporte', nivel: 2, padre_codigo: '5000' },
  { codigo: '5410', nombre: 'Vehiculos y Equipo Terrestre', nivel: 3, padre_codigo: '5400' },
  { codigo: '5420', nombre: 'Carrocerias y Remolques', nivel: 3, padre_codigo: '5400' },
  { codigo: '5430', nombre: 'Equipo Aeroespacial', nivel: 3, padre_codigo: '5400' },
  { codigo: '5440', nombre: 'Equipo Ferroviario', nivel: 3, padre_codigo: '5400' },
  { codigo: '5450', nombre: 'Embarcaciones', nivel: 3, padre_codigo: '5400' },
  { codigo: '5490', nombre: 'Otros Equipos de Transporte', nivel: 3, padre_codigo: '5400' },
  { codigo: '5500', nombre: 'Equipo de Defensa y Seguridad', nivel: 2, padre_codigo: '5000' },
  { codigo: '5510', nombre: 'Equipo de Defensa y Seguridad', nivel: 3, padre_codigo: '5500' },
  { codigo: '5600', nombre: 'Maquinaria, Otros Equipos y Herramientas', nivel: 2, padre_codigo: '5000' },
  { codigo: '5610', nombre: 'Maquinaria y Equipo Agropecuario', nivel: 3, padre_codigo: '5600' },
  { codigo: '5620', nombre: 'Maquinaria y Equipo Industrial', nivel: 3, padre_codigo: '5600' },
  { codigo: '5630', nombre: 'Maquinaria y Equipo de Construccion', nivel: 3, padre_codigo: '5600' },
  { codigo: '5640', nombre: 'Sistemas de Aire Acondicionado, Calefaccion y de Refrigeracion Industrial y Comercial', nivel: 3, padre_codigo: '5600' },
  { codigo: '5650', nombre: 'Equipo de Comunicacion y Telecomunicacion', nivel: 3, padre_codigo: '5600' },
  { codigo: '5660', nombre: 'Equipos de Generacion Electrica, Aparatos y Accesorios Electricos', nivel: 3, padre_codigo: '5600' },
  { codigo: '5670', nombre: 'Herramientas y Maquinas-Herramienta', nivel: 3, padre_codigo: '5600' },
  { codigo: '5690', nombre: 'Otros Equipos', nivel: 3, padre_codigo: '5600' },
  { codigo: '5700', nombre: 'Activos Biologicos', nivel: 2, padre_codigo: '5000' },
  { codigo: '5710', nombre: 'Bovinos', nivel: 3, padre_codigo: '5700' },
  { codigo: '5720', nombre: 'Porcinos', nivel: 3, padre_codigo: '5700' },
  { codigo: '5730', nombre: 'Aves', nivel: 3, padre_codigo: '5700' },
  { codigo: '5740', nombre: 'Ovinos y Caprinos', nivel: 3, padre_codigo: '5700' },
  { codigo: '5750', nombre: 'Peces y Acuicultura', nivel: 3, padre_codigo: '5700' },
  { codigo: '5760', nombre: 'Equinos', nivel: 3, padre_codigo: '5700' },
  { codigo: '5770', nombre: 'Especies Menores y de Zoologico', nivel: 3, padre_codigo: '5700' },
  { codigo: '5780', nombre: 'Arboles y Plantas', nivel: 3, padre_codigo: '5700' },
  { codigo: '5790', nombre: 'Otros Activos Biologicos', nivel: 3, padre_codigo: '5700' },
  { codigo: '5800', nombre: 'Bienes Inmuebles', nivel: 2, padre_codigo: '5000' },
  { codigo: '5810', nombre: 'Terrenos', nivel: 3, padre_codigo: '5800' },
  { codigo: '5820', nombre: 'Viviendas', nivel: 3, padre_codigo: '5800' },
  { codigo: '5830', nombre: 'Edificios No Habitacionales', nivel: 3, padre_codigo: '5800' },
  { codigo: '5890', nombre: 'Otros Bienes Inmuebles', nivel: 3, padre_codigo: '5800' },
  { codigo: '5900', nombre: 'Activos Intangibles', nivel: 2, padre_codigo: '5000' },
  { codigo: '5910', nombre: 'Software', nivel: 3, padre_codigo: '5900' },
  { codigo: '5920', nombre: 'Patentes', nivel: 3, padre_codigo: '5900' },
  { codigo: '5930', nombre: 'Marcas', nivel: 3, padre_codigo: '5900' },
  { codigo: '5940', nombre: 'Derechos', nivel: 3, padre_codigo: '5900' },
  { codigo: '5950', nombre: 'Concesiones', nivel: 3, padre_codigo: '5900' },
  { codigo: '5960', nombre: 'Franquicias', nivel: 3, padre_codigo: '5900' },
  { codigo: '5970', nombre: 'Licencias Informaticas e Intelectuales', nivel: 3, padre_codigo: '5900' },
  { codigo: '5980', nombre: 'Licencias Industriales, Comerciales y Otras', nivel: 3, padre_codigo: '5900' },
  { codigo: '5990', nombre: 'Otros Activos Intangibles', nivel: 3, padre_codigo: '5900' },

  // =========================================================================
  // Capitulo 6000 - Inversion Publica
  // =========================================================================
  { codigo: '6000', nombre: 'Inversion Publica', nivel: 1, padre_codigo: null },
  { codigo: '6100', nombre: 'Obra Publica en Bienes de Dominio Publico', nivel: 2, padre_codigo: '6000' },
  { codigo: '6110', nombre: 'Edificacion Habitacional', nivel: 3, padre_codigo: '6100' },
  { codigo: '6120', nombre: 'Edificacion No Habitacional', nivel: 3, padre_codigo: '6100' },
  { codigo: '6130', nombre: 'Construccion de Obras para el Abastecimiento de Agua, Petroleo, Gas, Electricidad y Telecomunicaciones', nivel: 3, padre_codigo: '6100' },
  { codigo: '6140', nombre: 'Division de Terrenos y Construccion de Obras de Urbanizacion', nivel: 3, padre_codigo: '6100' },
  { codigo: '6150', nombre: 'Construccion de Vias de Comunicacion', nivel: 3, padre_codigo: '6100' },
  { codigo: '6160', nombre: 'Otras Construcciones de Ingenieria Civil u Obra Pesada', nivel: 3, padre_codigo: '6100' },
  { codigo: '6170', nombre: 'Instalaciones y Equipamiento en Construcciones', nivel: 3, padre_codigo: '6100' },
  { codigo: '6190', nombre: 'Trabajos de Acabados en Edificaciones y Otros Trabajos Especializados', nivel: 3, padre_codigo: '6100' },
  { codigo: '6200', nombre: 'Obra Publica en Bienes Propios', nivel: 2, padre_codigo: '6000' },
  { codigo: '6210', nombre: 'Edificacion Habitacional', nivel: 3, padre_codigo: '6200' },
  { codigo: '6220', nombre: 'Edificacion No Habitacional', nivel: 3, padre_codigo: '6200' },
  { codigo: '6230', nombre: 'Construccion de Obras para el Abastecimiento de Agua, Petroleo, Gas, Electricidad y Telecomunicaciones', nivel: 3, padre_codigo: '6200' },
  { codigo: '6240', nombre: 'Division de Terrenos y Construccion de Obras de Urbanizacion', nivel: 3, padre_codigo: '6200' },
  { codigo: '6250', nombre: 'Construccion de Vias de Comunicacion', nivel: 3, padre_codigo: '6200' },
  { codigo: '6260', nombre: 'Otras Construcciones de Ingenieria Civil u Obra Pesada', nivel: 3, padre_codigo: '6200' },
  { codigo: '6270', nombre: 'Instalaciones y Equipamiento en Construcciones', nivel: 3, padre_codigo: '6200' },
  { codigo: '6290', nombre: 'Trabajos de Acabados en Edificaciones y Otros Trabajos Especializados', nivel: 3, padre_codigo: '6200' },
  { codigo: '6300', nombre: 'Proyectos Productivos y de Fomento', nivel: 2, padre_codigo: '6000' },
  { codigo: '6310', nombre: 'Estudios, Formulacion y Evaluacion de Proyectos Productivos No Incluidos en Conceptos Anteriores', nivel: 3, padre_codigo: '6300' },
  { codigo: '6320', nombre: 'Ejecucion de Proyectos Productivos No Incluidos en Conceptos Anteriores', nivel: 3, padre_codigo: '6300' },

  // =========================================================================
  // Capitulo 7000 - Inversiones Financieras y Otras Provisiones
  // =========================================================================
  { codigo: '7000', nombre: 'Inversiones Financieras y Otras Provisiones', nivel: 1, padre_codigo: null },
  { codigo: '7100', nombre: 'Inversiones para el Fomento de Actividades Productivas', nivel: 2, padre_codigo: '7000' },
  { codigo: '7110', nombre: 'Creditos Otorgados por Entidades Federativas y Municipios al Sector Social y Privado para el Fomento de Actividades Productivas', nivel: 3, padre_codigo: '7100' },
  { codigo: '7120', nombre: 'Creditos Otorgados por el Gobierno Federal al Sector Social y Privado para el Fomento de Actividades Productivas', nivel: 3, padre_codigo: '7100' },
  { codigo: '7200', nombre: 'Acciones y Participaciones de Capital', nivel: 2, padre_codigo: '7000' },
  { codigo: '7210', nombre: 'Acciones y Participaciones de Capital en Entidades Paraestatales No Empresariales y No Financieras con Fines de Politica Economica', nivel: 3, padre_codigo: '7200' },
  { codigo: '7220', nombre: 'Acciones y Participaciones de Capital en Entidades Paraestatales Empresariales y No Financieras con Fines de Politica Economica', nivel: 3, padre_codigo: '7200' },
  { codigo: '7230', nombre: 'Acciones y Participaciones de Capital en Instituciones Paraestatales Publicas Financieras con Fines de Politica Economica', nivel: 3, padre_codigo: '7200' },
  { codigo: '7240', nombre: 'Acciones y Participaciones de Capital en el Sector Privado con Fines de Politica Economica', nivel: 3, padre_codigo: '7200' },
  { codigo: '7250', nombre: 'Acciones y Participaciones de Capital en Organismos Internacionales con Fines de Politica Economica', nivel: 3, padre_codigo: '7200' },
  { codigo: '7260', nombre: 'Acciones y Participaciones de Capital en el Sector Externo con Fines de Politica Economica', nivel: 3, padre_codigo: '7200' },
  { codigo: '7290', nombre: 'Otras Acciones y Participaciones de Capital', nivel: 3, padre_codigo: '7200' },
  { codigo: '7300', nombre: 'Compra de Titulos y Valores', nivel: 2, padre_codigo: '7000' },
  { codigo: '7310', nombre: 'Bonos', nivel: 3, padre_codigo: '7300' },
  { codigo: '7320', nombre: 'Valores Representativos de Deuda Adquiridos con Fines de Politica Economica', nivel: 3, padre_codigo: '7300' },
  { codigo: '7330', nombre: 'Obligaciones Negociables Adquiridas con Fines de Politica Economica', nivel: 3, padre_codigo: '7300' },
  { codigo: '7390', nombre: 'Otros Valores', nivel: 3, padre_codigo: '7300' },
  { codigo: '7400', nombre: 'Concesion de Prestamos', nivel: 2, padre_codigo: '7000' },
  { codigo: '7410', nombre: 'Concesion de Prestamos a Entidades Paraestatales No Empresariales y No Financieras con Fines de Politica Economica', nivel: 3, padre_codigo: '7400' },
  { codigo: '7420', nombre: 'Concesion de Prestamos a Entidades Paraestatales Empresariales y No Financieras con Fines de Politica Economica', nivel: 3, padre_codigo: '7400' },
  { codigo: '7430', nombre: 'Concesion de Prestamos a Instituciones Paraestatales Publicas Financieras con Fines de Politica Economica', nivel: 3, padre_codigo: '7400' },
  { codigo: '7440', nombre: 'Concesion de Prestamos a Entidades Federativas y Municipios con Fines de Politica Economica', nivel: 3, padre_codigo: '7400' },
  { codigo: '7450', nombre: 'Concesion de Prestamos al Sector Privado con Fines de Politica Economica', nivel: 3, padre_codigo: '7400' },
  { codigo: '7460', nombre: 'Concesion de Prestamos al Sector Externo con Fines de Politica Economica', nivel: 3, padre_codigo: '7400' },
  { codigo: '7470', nombre: 'Concesion de Prestamos al Sector Publico con Fines de Gestion de Liquidez', nivel: 3, padre_codigo: '7400' },
  { codigo: '7480', nombre: 'Concesion de Prestamos al Sector Privado con Fines de Gestion de Liquidez', nivel: 3, padre_codigo: '7400' },
  { codigo: '7490', nombre: 'Concesion de Prestamos al Sector Externo con Fines de Gestion de Liquidez', nivel: 3, padre_codigo: '7400' },
  { codigo: '7500', nombre: 'Inversiones en Fideicomisos, Mandatos y Otros Analogos', nivel: 2, padre_codigo: '7000' },
  { codigo: '7510', nombre: 'Inversiones en Fideicomisos del Poder Ejecutivo', nivel: 3, padre_codigo: '7500' },
  { codigo: '7520', nombre: 'Inversiones en Fideicomisos del Poder Legislativo', nivel: 3, padre_codigo: '7500' },
  { codigo: '7530', nombre: 'Inversiones en Fideicomisos del Poder Judicial', nivel: 3, padre_codigo: '7500' },
  { codigo: '7540', nombre: 'Inversiones en Fideicomisos Publicos No Empresariales y No Financieros', nivel: 3, padre_codigo: '7500' },
  { codigo: '7550', nombre: 'Inversiones en Fideicomisos Publicos Empresariales y No Financieros', nivel: 3, padre_codigo: '7500' },
  { codigo: '7560', nombre: 'Inversiones en Fideicomisos Publicos Financieros', nivel: 3, padre_codigo: '7500' },
  { codigo: '7570', nombre: 'Inversiones en Fideicomisos de Entidades Federativas', nivel: 3, padre_codigo: '7500' },
  { codigo: '7580', nombre: 'Inversiones en Fideicomisos de Municipios', nivel: 3, padre_codigo: '7500' },
  { codigo: '7590', nombre: 'Otras Inversiones en Fideicomisos', nivel: 3, padre_codigo: '7500' },
  { codigo: '7600', nombre: 'Otras Inversiones Financieras', nivel: 2, padre_codigo: '7000' },
  { codigo: '7610', nombre: 'Depositos a Largo Plazo en Moneda Nacional', nivel: 3, padre_codigo: '7600' },
  { codigo: '7620', nombre: 'Depositos a Largo Plazo en Moneda Extranjera', nivel: 3, padre_codigo: '7600' },
  { codigo: '7900', nombre: 'Provisiones para Contingencias y Otras Erogaciones Especiales', nivel: 2, padre_codigo: '7000' },
  { codigo: '7910', nombre: 'Contingencias por Fenomenos Naturales', nivel: 3, padre_codigo: '7900' },
  { codigo: '7920', nombre: 'Contingencias Socioeconomicas', nivel: 3, padre_codigo: '7900' },
  { codigo: '7990', nombre: 'Otras Erogaciones Especiales', nivel: 3, padre_codigo: '7900' },

  // =========================================================================
  // Capitulo 8000 - Participaciones y Aportaciones
  // =========================================================================
  { codigo: '8000', nombre: 'Participaciones y Aportaciones', nivel: 1, padre_codigo: null },
  { codigo: '8100', nombre: 'Participaciones', nivel: 2, padre_codigo: '8000' },
  { codigo: '8110', nombre: 'Fondo General de Participaciones', nivel: 3, padre_codigo: '8100' },
  { codigo: '8120', nombre: 'Fondo de Fomento Municipal', nivel: 3, padre_codigo: '8100' },
  { codigo: '8130', nombre: 'Participaciones de las Entidades Federativas a los Municipios', nivel: 3, padre_codigo: '8100' },
  { codigo: '8140', nombre: 'Otros Conceptos Participables de la Federacion a Entidades Federativas', nivel: 3, padre_codigo: '8100' },
  { codigo: '8150', nombre: 'Otros Conceptos Participables de la Federacion a Municipios', nivel: 3, padre_codigo: '8100' },
  { codigo: '8160', nombre: 'Convenios de Colaboracion Administrativa', nivel: 3, padre_codigo: '8100' },
  { codigo: '8200', nombre: 'Aportaciones', nivel: 2, padre_codigo: '8000' },
  { codigo: '8210', nombre: 'Fondo de Aportaciones para la Nomina Educativa y Gasto Operativo (FONE)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8220', nombre: 'Fondo de Aportaciones para los Servicios de Salud (FASSA)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8230', nombre: 'Fondo de Aportaciones para la Infraestructura Social (FAIS)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8240', nombre: 'Fondo de Aportaciones para el Fortalecimiento de los Municipios y de las Demarcaciones Territoriales del Distrito Federal (FORTAMUNDF)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8250', nombre: 'Fondo de Aportaciones Multiples (FAM)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8260', nombre: 'Fondo de Aportaciones para la Educacion Tecnologica y de Adultos (FAETA)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8270', nombre: 'Fondo de Aportaciones para la Seguridad Publica de los Estados y del Distrito Federal (FASP)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8280', nombre: 'Fondo de Aportaciones para el Fortalecimiento de las Entidades Federativas (FAFEF)', nivel: 3, padre_codigo: '8200' },
  { codigo: '8300', nombre: 'Convenios', nivel: 2, padre_codigo: '8000' },
  { codigo: '8310', nombre: 'Convenios de Reasignacion', nivel: 3, padre_codigo: '8300' },
  { codigo: '8320', nombre: 'Convenios de Descentralizacion', nivel: 3, padre_codigo: '8300' },
  { codigo: '8330', nombre: 'Otros Convenios', nivel: 3, padre_codigo: '8300' },

  // =========================================================================
  // Capitulo 9000 - Deuda Publica
  // =========================================================================
  { codigo: '9000', nombre: 'Deuda Publica', nivel: 1, padre_codigo: null },
  { codigo: '9100', nombre: 'Amortizacion de la Deuda Interna', nivel: 2, padre_codigo: '9000' },
  { codigo: '9110', nombre: 'Amortizacion de la Deuda Interna con Instituciones de Credito', nivel: 3, padre_codigo: '9100' },
  { codigo: '9120', nombre: 'Amortizacion de la Deuda Interna por Emision de Titulos y Valores', nivel: 3, padre_codigo: '9100' },
  { codigo: '9130', nombre: 'Amortizacion de Arrendamientos Financieros Nacionales', nivel: 3, padre_codigo: '9100' },
  { codigo: '9200', nombre: 'Intereses de la Deuda Interna', nivel: 2, padre_codigo: '9000' },
  { codigo: '9210', nombre: 'Intereses de la Deuda Interna con Instituciones de Credito', nivel: 3, padre_codigo: '9200' },
  { codigo: '9220', nombre: 'Intereses Derivados de la Colocacion de Titulos y Valores', nivel: 3, padre_codigo: '9200' },
  { codigo: '9230', nombre: 'Intereses por Arrendamientos Financieros Nacionales', nivel: 3, padre_codigo: '9200' },
  { codigo: '9300', nombre: 'Comisiones de la Deuda Interna', nivel: 2, padre_codigo: '9000' },
  { codigo: '9310', nombre: 'Comisiones de la Deuda Interna', nivel: 3, padre_codigo: '9300' },
  { codigo: '9400', nombre: 'Gastos de la Deuda Interna', nivel: 2, padre_codigo: '9000' },
  { codigo: '9410', nombre: 'Gastos de la Deuda Interna', nivel: 3, padre_codigo: '9400' },
  { codigo: '9500', nombre: 'Costo por Coberturas', nivel: 2, padre_codigo: '9000' },
  { codigo: '9510', nombre: 'Costos por Coberturas', nivel: 3, padre_codigo: '9500' },
  { codigo: '9600', nombre: 'Apoyos Financieros', nivel: 2, padre_codigo: '9000' },
  { codigo: '9610', nombre: 'Apoyos a Intermediarios Financieros', nivel: 3, padre_codigo: '9600' },
  { codigo: '9620', nombre: 'Apoyos a Ahorradores y Deudores del Sistema Financiero', nivel: 3, padre_codigo: '9600' },
  { codigo: '9700', nombre: 'Amortizacion de la Deuda Externa', nivel: 2, padre_codigo: '9000' },
  { codigo: '9710', nombre: 'Amortizacion de la Deuda Externa con Instituciones de Credito', nivel: 3, padre_codigo: '9700' },
  { codigo: '9720', nombre: 'Amortizacion de la Deuda Externa por Emision de Titulos y Valores', nivel: 3, padre_codigo: '9700' },
  { codigo: '9730', nombre: 'Amortizacion de Arrendamientos Financieros Internacionales', nivel: 3, padre_codigo: '9700' },
  { codigo: '9800', nombre: 'Intereses de la Deuda Externa', nivel: 2, padre_codigo: '9000' },
  { codigo: '9810', nombre: 'Intereses de la Deuda Externa con Instituciones de Credito', nivel: 3, padre_codigo: '9800' },
  { codigo: '9820', nombre: 'Intereses Derivados de la Colocacion de Titulos y Valores en el Exterior', nivel: 3, padre_codigo: '9800' },
  { codigo: '9830', nombre: 'Intereses por Arrendamientos Financieros Internacionales', nivel: 3, padre_codigo: '9800' },
  { codigo: '9900', nombre: 'Adeudos de Ejercicios Fiscales Anteriores (ADEFAS)', nivel: 2, padre_codigo: '9000' },
  { codigo: '9910', nombre: 'Adeudos de Ejercicios Fiscales Anteriores', nivel: 3, padre_codigo: '9900' },
];

// =============================================================================
// Clasificador Funcional CONAC
// =============================================================================
export const FUNCIONAL_DATA = [
  { codigo: '1', nombre: 'Gobierno', nivel: 1, padre_codigo: null },
  { codigo: '1.1', nombre: 'Legislacion', nivel: 2, padre_codigo: '1' },
  { codigo: '1.2', nombre: 'Justicia', nivel: 2, padre_codigo: '1' },
  { codigo: '1.3', nombre: 'Coordinacion de la Politica de Gobierno', nivel: 2, padre_codigo: '1' },
  { codigo: '1.4', nombre: 'Relaciones Exteriores', nivel: 2, padre_codigo: '1' },
  { codigo: '1.5', nombre: 'Asuntos Financieros y Hacendarios', nivel: 2, padre_codigo: '1' },
  { codigo: '1.6', nombre: 'Seguridad Nacional', nivel: 2, padre_codigo: '1' },
  { codigo: '1.7', nombre: 'Asuntos de Orden Publico y de Seguridad Interior', nivel: 2, padre_codigo: '1' },
  { codigo: '1.8', nombre: 'Otros Servicios Generales', nivel: 2, padre_codigo: '1' },
  { codigo: '2', nombre: 'Desarrollo Social', nivel: 1, padre_codigo: null },
  { codigo: '2.1', nombre: 'Proteccion Ambiental', nivel: 2, padre_codigo: '2' },
  { codigo: '2.2', nombre: 'Vivienda y Servicios a la Comunidad', nivel: 2, padre_codigo: '2' },
  { codigo: '2.3', nombre: 'Salud', nivel: 2, padre_codigo: '2' },
  { codigo: '2.4', nombre: 'Recreacion, Cultura y Otras Manifestaciones Sociales', nivel: 2, padre_codigo: '2' },
  { codigo: '2.5', nombre: 'Educacion', nivel: 2, padre_codigo: '2' },
  { codigo: '2.6', nombre: 'Proteccion Social', nivel: 2, padre_codigo: '2' },
  { codigo: '2.7', nombre: 'Otros Asuntos Sociales', nivel: 2, padre_codigo: '2' },
  { codigo: '3', nombre: 'Desarrollo Economico', nivel: 1, padre_codigo: null },
  { codigo: '3.1', nombre: 'Asuntos Economicos, Comerciales y Laborales en General', nivel: 2, padre_codigo: '3' },
  { codigo: '3.2', nombre: 'Agropecuaria, Silvicultura, Pesca y Caza', nivel: 2, padre_codigo: '3' },
  { codigo: '3.3', nombre: 'Combustibles y Energia', nivel: 2, padre_codigo: '3' },
  { codigo: '3.4', nombre: 'Mineria, Manufacturas y Construccion', nivel: 2, padre_codigo: '3' },
  { codigo: '3.5', nombre: 'Transporte', nivel: 2, padre_codigo: '3' },
  { codigo: '3.6', nombre: 'Comunicaciones', nivel: 2, padre_codigo: '3' },
  { codigo: '3.7', nombre: 'Turismo', nivel: 2, padre_codigo: '3' },
  { codigo: '3.8', nombre: 'Ciencia, Tecnologia e Innovacion', nivel: 2, padre_codigo: '3' },
  { codigo: '3.9', nombre: 'Otras Industrias y Otros Asuntos Economicos', nivel: 2, padre_codigo: '3' },
  { codigo: '4', nombre: 'Otras No Clasificadas en Funciones Anteriores', nivel: 1, padre_codigo: null },
  { codigo: '4.1', nombre: 'Transacciones de la Deuda Publica / Costo Financiero de la Deuda', nivel: 2, padre_codigo: '4' },
  { codigo: '4.2', nombre: 'Transferencias, Participaciones y Aportaciones entre Diferentes Niveles y Ordenes de Gobierno', nivel: 2, padre_codigo: '4' },
  { codigo: '4.3', nombre: 'Saneamiento del Sistema Financiero', nivel: 2, padre_codigo: '4' },
  { codigo: '4.4', nombre: 'Adeudos de Ejercicios Fiscales Anteriores', nivel: 2, padre_codigo: '4' },
];

// =============================================================================
// Clasificador Economico (Tipo de Gasto)
// =============================================================================
export const ECONOMICO_DATA = [
  { codigo: '1', nombre: 'Gasto Corriente', nivel: 1, padre_codigo: null },
  { codigo: '2', nombre: 'Gasto de Capital', nivel: 1, padre_codigo: null },
  { codigo: '3', nombre: 'Amortizacion de la Deuda y Disminucion de Pasivos', nivel: 1, padre_codigo: null },
  { codigo: '4', nombre: 'Pensiones y Jubilaciones', nivel: 1, padre_codigo: null },
  { codigo: '5', nombre: 'Participaciones', nivel: 1, padre_codigo: null },
];

// =============================================================================
// Clasificador por Fuente de Financiamiento
// =============================================================================
export const FUENTE_FINANCIAMIENTO_DATA = [
  { codigo: '1', nombre: 'Recursos Fiscales', nivel: 1, padre_codigo: null },
  { codigo: '1.1', nombre: 'Recursos Fiscales Ordinarios', nivel: 2, padre_codigo: '1' },
  { codigo: '1.2', nombre: 'Recursos Fiscales Extraordinarios', nivel: 2, padre_codigo: '1' },
  { codigo: '2', nombre: 'Financiamientos Internos', nivel: 1, padre_codigo: null },
  { codigo: '2.1', nombre: 'Emprestitos', nivel: 2, padre_codigo: '2' },
  { codigo: '2.2', nombre: 'Otros Financiamientos Internos', nivel: 2, padre_codigo: '2' },
  { codigo: '3', nombre: 'Financiamientos Externos', nivel: 1, padre_codigo: null },
  { codigo: '3.1', nombre: 'Emprestitos Externos', nivel: 2, padre_codigo: '3' },
  { codigo: '3.2', nombre: 'Otros Financiamientos Externos', nivel: 2, padre_codigo: '3' },
  { codigo: '4', nombre: 'Ingresos Propios', nivel: 1, padre_codigo: null },
  { codigo: '4.1', nombre: 'Ingresos por Ventas de Bienes y Servicios', nivel: 2, padre_codigo: '4' },
  { codigo: '4.2', nombre: 'Ingresos Diversos', nivel: 2, padre_codigo: '4' },
  { codigo: '5', nombre: 'Recursos Federales', nivel: 1, padre_codigo: null },
  { codigo: '5.1', nombre: 'Participaciones Federales', nivel: 2, padre_codigo: '5' },
  { codigo: '5.2', nombre: 'Aportaciones Federales', nivel: 2, padre_codigo: '5' },
  { codigo: '5.3', nombre: 'Convenios', nivel: 2, padre_codigo: '5' },
  { codigo: '6', nombre: 'Recursos Estatales', nivel: 1, padre_codigo: null },
  { codigo: '6.1', nombre: 'Participaciones Estatales', nivel: 2, padre_codigo: '6' },
  { codigo: '6.2', nombre: 'Aportaciones Estatales', nivel: 2, padre_codigo: '6' },
];

// =============================================================================
// Clasificador Geografico (32 Entidades Federativas de Mexico)
// =============================================================================
export const GEOGRAFICO_DATA = [
  { codigo: '01', nombre: 'Aguascalientes' },
  { codigo: '02', nombre: 'Baja California' },
  { codigo: '03', nombre: 'Baja California Sur' },
  { codigo: '04', nombre: 'Campeche' },
  { codigo: '05', nombre: 'Coahuila de Zaragoza' },
  { codigo: '06', nombre: 'Colima' },
  { codigo: '07', nombre: 'Chiapas' },
  { codigo: '08', nombre: 'Chihuahua' },
  { codigo: '09', nombre: 'Ciudad de Mexico' },
  { codigo: '10', nombre: 'Durango' },
  { codigo: '11', nombre: 'Guanajuato' },
  { codigo: '12', nombre: 'Guerrero' },
  { codigo: '13', nombre: 'Hidalgo' },
  { codigo: '14', nombre: 'Jalisco' },
  { codigo: '15', nombre: 'Mexico' },
  { codigo: '16', nombre: 'Michoacan de Ocampo' },
  { codigo: '17', nombre: 'Morelos' },
  { codigo: '18', nombre: 'Nayarit' },
  { codigo: '19', nombre: 'Nuevo Leon' },
  { codigo: '20', nombre: 'Oaxaca' },
  { codigo: '21', nombre: 'Puebla' },
  { codigo: '22', nombre: 'Queretaro' },
  { codigo: '23', nombre: 'Quintana Roo' },
  { codigo: '24', nombre: 'San Luis Potosi' },
  { codigo: '25', nombre: 'Sinaloa' },
  { codigo: '26', nombre: 'Sonora' },
  { codigo: '27', nombre: 'Tabasco' },
  { codigo: '28', nombre: 'Tamaulipas' },
  { codigo: '29', nombre: 'Tlaxcala' },
  { codigo: '30', nombre: 'Veracruz de Ignacio de la Llave' },
  { codigo: '31', nombre: 'Yucatan' },
  { codigo: '32', nombre: 'Zacatecas' },
];

// =============================================================================
// Clasificador por Tipo de Gasto (CTP)
// =============================================================================
export const TIPO_GASTO_DATA = [
  { codigo: '1', nombre: 'Gasto Corriente', nivel: 1, padre_codigo: null },
  { codigo: '1.1', nombre: 'Gasto No Etiquetado', nivel: 2, padre_codigo: '1' },
  { codigo: '1.2', nombre: 'Gasto Etiquetado', nivel: 2, padre_codigo: '1' },
  { codigo: '2', nombre: 'Gasto de Capital', nivel: 1, padre_codigo: null },
  { codigo: '2.1', nombre: 'Gasto No Etiquetado', nivel: 2, padre_codigo: '2' },
  { codigo: '2.2', nombre: 'Gasto Etiquetado', nivel: 2, padre_codigo: '2' },
  { codigo: '3', nombre: 'Amortizacion de la Deuda y Disminucion de Pasivos', nivel: 1, padre_codigo: null },
  { codigo: '3.1', nombre: 'Gasto No Etiquetado', nivel: 2, padre_codigo: '3' },
  { codigo: '3.2', nombre: 'Gasto Etiquetado', nivel: 2, padre_codigo: '3' },
];

// =============================================================================
// Map of clasificador types to their data
// =============================================================================
const CLASIFICADOR_MAP = {
  objeto_gasto: COG_DATA,
  funcional: FUNCIONAL_DATA,
  economico: ECONOMICO_DATA,
  fuente_financiamiento: FUENTE_FINANCIAMIENTO_DATA,
  geografico: GEOGRAFICO_DATA,
  tipo_gasto: TIPO_GASTO_DATA,
};

/**
 * Load CONAC clasificadores presupuestales for a given ente into Supabase.
 *
 * @param {string} enteId - UUID of the ente publico
 * @param {'objeto_gasto'|'funcional'|'economico'|'fuente_financiamiento'|'geografico'|'tipo_gasto'|'all'} tipo
 * @returns {Promise<{ok: boolean, inserted: number, errors: string[]}>}
 */
export async function seedClasificadores(enteId, tipo = 'all') {
  if (!supabase) {
    return { ok: false, inserted: 0, errors: ['Supabase not configured'] };
  }

  if (!enteId) {
    return { ok: false, inserted: 0, errors: ['enteId is required'] };
  }

  const tipos = tipo === 'all' ? Object.keys(CLASIFICADOR_MAP) : [tipo];
  let totalInserted = 0;
  const errors = [];

  for (const t of tipos) {
    const data = CLASIFICADOR_MAP[t];
    if (!data) {
      errors.push(`Unknown clasificador type: ${t}`);
      continue;
    }

    // Prepare rows for Supabase
    const rows = data.map((item) => ({
      ente_id: enteId,
      tipo_clasificador: t,
      codigo: item.codigo,
      nombre: item.nombre,
      nivel: item.nivel || 1,
      padre_codigo: item.padre_codigo || null,
      activo: true,
    }));

    // Upsert in batches of 100 to avoid payload limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { data: result, error } = await supabase
        .from('clasificador_presupuestal')
        .upsert(batch, {
          onConflict: 'ente_id,tipo_clasificador,codigo',
          ignoreDuplicates: true,
        });

      if (error) {
        errors.push(`Error in ${t} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        totalInserted += batch.length;
      }
    }
  }

  return {
    ok: errors.length === 0,
    inserted: totalInserted,
    errors,
  };
}

/**
 * Get counts of existing clasificadores for an ente (useful for UI display).
 *
 * @param {string} enteId
 * @returns {Promise<Record<string, number>>}
 */
export async function getClasificadorCounts(enteId) {
  if (!supabase || !enteId) return {};

  const counts = {};
  for (const tipo of Object.keys(CLASIFICADOR_MAP)) {
    const { count, error } = await supabase
      .from('clasificador_presupuestal')
      .select('*', { count: 'exact', head: true })
      .eq('ente_id', enteId)
      .eq('tipo_clasificador', tipo);

    counts[tipo] = error ? 0 : (count || 0);
  }
  return counts;
}

/**
 * Get the static data for a given clasificador type (no Supabase needed).
 *
 * @param {'objeto_gasto'|'funcional'|'economico'|'fuente_financiamiento'|'geografico'|'tipo_gasto'} tipo
 * @returns {Array}
 */
export function getClasificadorData(tipo) {
  return CLASIFICADOR_MAP[tipo] || [];
}
