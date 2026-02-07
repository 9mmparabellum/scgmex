-- =============================================================================
-- SCGMEX - Sistema de Contabilidad Gubernamental de Mexico
-- Datos Semilla: Clasificadores Presupuestales CONAC
-- =============================================================================
-- Este archivo contiene los datos de los 7 clasificadores presupuestales
-- armonizados conforme a la Ley General de Contabilidad Gubernamental (LGCG)
-- y los lineamientos del Consejo Nacional de Armonizacion Contable (CONAC).
--
-- IMPORTANTE: Reemplace el valor de v_ente_id con el UUID del ente publico
-- correspondiente antes de ejecutar este script. Cada ente debe tener
-- su propio juego de clasificadores.
--
-- Los 7 tipos de clasificadores:
--   1. Objeto del Gasto (COG)
--   2. Administrativo
--   3. Funcional
--   4. Programatico
--   5. Economico
--   6. Geografico
--   7. Fuente de Financiamiento
-- =============================================================================


DO $$
DECLARE
  -- ═══════════════════════════════════════════════════════════════════
  -- REEMPLACE ESTE UUID CON EL ID DEL ENTE PUBLICO CORRESPONDIENTE
  -- Puede obtenerlo con: SELECT id FROM ente_publico WHERE clave = 'MUN-001';
  -- ═══════════════════════════════════════════════════════════════════
  v_ente_id UUID;

  -- Variables auxiliares para IDs de nodos padre (clasificadores jerarquicos)
  v_cog_cap1 UUID; v_cog_cap2 UUID; v_cog_cap3 UUID;
  v_cog_cap4 UUID; v_cog_cap5 UUID; v_cog_cap6 UUID;
  v_cog_cap7 UUID; v_cog_cap8 UUID; v_cog_cap9 UUID;

  v_func_1 UUID; v_func_2 UUID; v_func_3 UUID; v_func_4 UUID;

  v_econ_1 UUID; v_econ_2 UUID; v_econ_3 UUID;

BEGIN

  -- Obtener el ID del ente publico de ejemplo (MUN-001)
  -- Cambie esta consulta si desea usar un ente diferente
  SELECT id INTO v_ente_id FROM ente_publico WHERE clave = 'MUN-001' LIMIT 1;

  IF v_ente_id IS NULL THEN
    RAISE NOTICE 'No se encontro el ente publico MUN-001. Asegurese de que exista antes de ejecutar este script.';
    RETURN;
  END IF;

  RAISE NOTICE 'Insertando clasificadores presupuestales para ente: %', v_ente_id;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 1. CLASIFICADOR POR OBJETO DEL GASTO (COG)
  -- Conforme al Acuerdo del CONAC para la clasificacion por objeto del gasto.
  -- Estructura: Capitulo (nivel 1) > Concepto (nivel 2) > Partida Generica (nivel 3)
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  1/7 Clasificador por Objeto del Gasto (COG)...';

  -- ── Capitulo 1000: Servicios Personales ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '1000', 'Servicios Personales', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap1;

  IF v_cog_cap1 IS NULL THEN
    SELECT id INTO v_cog_cap1 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '1000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '1100', 'Remuneraciones al Personal de Caracter Permanente', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1110', 'Dietas', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1120', 'Haberes', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1130', 'Sueldos Base al Personal Permanente', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1140', 'Remuneraciones por Adscripcion Laboral en el Extranjero', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1200', 'Remuneraciones al Personal de Caracter Transitorio', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1210', 'Honorarios Asimilables a Salarios', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1220', 'Sueldos Base al Personal Eventual', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1230', 'Retribuciones por Servicios de Caracter Social', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1300', 'Remuneraciones Adicionales y Especiales', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1310', 'Primas por Anos de Servicios Efectivos Prestados', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1320', 'Primas de Vacaciones, Dominical y Gratificacion de Fin de Ano', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1330', 'Horas Extraordinarias', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1340', 'Compensaciones', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1350', 'Sobrehaberes', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1360', 'Asignaciones de Tecnico, de Mando, por Comision, de Vuelo y de Tecnico Especial', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1370', 'Honorarios Especiales', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1380', 'Participaciones por Vigilancia en el Cumplimiento de las Leyes y Custodia de Valores', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1400', 'Seguridad Social', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1410', 'Aportaciones de Seguridad Social', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1420', 'Aportaciones a Fondos de Vivienda', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1430', 'Aportaciones al Sistema para el Retiro', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1440', 'Aportaciones para Seguros', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1500', 'Otras Prestaciones Sociales y Economicas', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1510', 'Cuotas para el Fondo de Ahorro y Fondo de Trabajo', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1520', 'Indemnizaciones', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1530', 'Prestaciones y Haberes de Retiro', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1540', 'Prestaciones Contractuales', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1550', 'Apoyos a la Capacitacion de los Servidores Publicos', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1590', 'Otras Prestaciones Sociales y Economicas', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1600', 'Previsiones', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1610', 'Previsiones de Caracter Laboral, Economica y de Seguridad Social', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1700', 'Pago de Estimulos a Servidores Publicos', 2, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1710', 'Estimulos', 3, v_cog_cap1, true),
    (v_ente_id, 'objeto_gasto', '1720', 'Recompensas', 3, v_cog_cap1, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 2000: Materiales y Suministros ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '2000', 'Materiales y Suministros', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap2;

  IF v_cog_cap2 IS NULL THEN
    SELECT id INTO v_cog_cap2 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '2000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '2100', 'Materiales de Administracion, Emision de Documentos y Articulos Oficiales', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2110', 'Materiales, Utiles y Equipos Menores de Oficina', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2120', 'Materiales y Utiles de Impresion y Reproduccion', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2130', 'Material Estadistico y Geografico', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2140', 'Materiales, Utiles y Equipos Menores de Tecnologias de la Informacion y Comunicaciones', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2150', 'Material Impreso e Informacion Digital', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2160', 'Material de Limpieza', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2170', 'Materiales y Utiles de Ensenanza', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2180', 'Materiales para el Registro e Identificacion de Bienes y Personas', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2200', 'Alimentos y Utensilios', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2210', 'Productos Alimenticios para Personas', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2220', 'Productos Alimenticios para Animales', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2230', 'Utensilios para el Servicio de Alimentacion', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2300', 'Materias Primas y Materiales de Produccion y Comercializacion', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2310', 'Productos Alimenticios, Agropecuarios y Forestales Adquiridos como Materia Prima', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2400', 'Materiales y Articulos de Construccion y de Reparacion', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2410', 'Productos Minerales no Metalicos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2420', 'Cemento y Productos de Concreto', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2430', 'Cal, Yeso y Productos de Yeso', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2440', 'Madera y Productos de Madera', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2450', 'Vidrio y Productos de Vidrio', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2460', 'Material Electrico y Electronico', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2470', 'Articulos Metalicos para la Construccion', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2480', 'Materiales Complementarios', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2490', 'Otros Materiales y Articulos de Construccion y Reparacion', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2500', 'Productos Quimicos, Farmaceuticos y de Laboratorio', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2510', 'Productos Quimicos Basicos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2520', 'Fertilizantes, Pesticidas y Otros Agroquimicos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2530', 'Medicinas y Productos Farmaceuticos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2540', 'Materiales, Accesorios y Suministros Medicos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2550', 'Materiales, Accesorios y Suministros de Laboratorio', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2560', 'Fibras Sinteticas, Hules, Plasticos y Derivados', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2600', 'Combustibles, Lubricantes y Aditivos', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2610', 'Combustibles, Lubricantes y Aditivos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2620', 'Carbon y sus Derivados', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2700', 'Vestuario, Blancos, Prendas de Proteccion y Articulos Deportivos', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2710', 'Vestuario y Uniformes', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2720', 'Prendas de Seguridad y Proteccion Personal', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2730', 'Articulos Deportivos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2740', 'Productos Textiles', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2750', 'Blancos y Otros Productos Textiles, Excepto Prendas de Vestir', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2800', 'Materiales y Suministros para Seguridad', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2810', 'Sustancias y Materiales Explosivos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2820', 'Materiales de Seguridad Publica', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2900', 'Herramientas, Refacciones y Accesorios Menores', 2, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2910', 'Herramientas Menores', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2920', 'Refacciones y Accesorios Menores de Edificios', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2930', 'Refacciones y Accesorios Menores de Mobiliario y Equipo de Administracion', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2940', 'Refacciones y Accesorios Menores de Equipo de Computo y Tecnologias de la Informacion', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2950', 'Refacciones y Accesorios Menores de Equipo e Instrumental Medico y de Laboratorio', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2960', 'Refacciones y Accesorios Menores de Equipo de Transporte', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2970', 'Refacciones y Accesorios Menores de Equipo de Defensa y Seguridad', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2980', 'Refacciones y Accesorios Menores de Maquinaria y Otros Equipos', 3, v_cog_cap2, true),
    (v_ente_id, 'objeto_gasto', '2990', 'Refacciones y Accesorios Menores Otros Bienes Muebles', 3, v_cog_cap2, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 3000: Servicios Generales ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '3000', 'Servicios Generales', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap3;

  IF v_cog_cap3 IS NULL THEN
    SELECT id INTO v_cog_cap3 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '3000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '3100', 'Servicios Basicos', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3110', 'Energia Electrica', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3120', 'Gas', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3130', 'Agua', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3140', 'Telefonia Tradicional', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3150', 'Telefonia Celular', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3160', 'Servicios de Telecomunicaciones y Satelites', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3170', 'Servicios de Acceso de Internet, Redes y Procesamiento de Informacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3180', 'Servicios Postales y Telegraficos', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3190', 'Servicios Integrales y Otros Servicios', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3200', 'Servicios de Arrendamiento', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3210', 'Arrendamiento de Terrenos', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3220', 'Arrendamiento de Edificios', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3230', 'Arrendamiento de Mobiliario y Equipo de Administracion, Educacional y Recreativo', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3240', 'Arrendamiento de Equipo e Instrumental Medico y de Laboratorio', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3250', 'Arrendamiento de Equipo de Transporte', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3260', 'Arrendamiento de Maquinaria, Otros Equipos y Herramientas', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3270', 'Arrendamiento de Activos Intangibles', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3280', 'Arrendamiento Financiero', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3290', 'Otros Arrendamientos', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3300', 'Servicios Profesionales, Cientificos, Tecnicos y Otros Servicios', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3310', 'Servicios Legales, de Contabilidad, Auditoria y Relacionados', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3320', 'Servicios de Diseno, Arquitectura, Ingenieria y Actividades Relacionadas', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3330', 'Servicios de Consultoria Administrativa, Procesos, Tecnica y en Tecnologias de la Informacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3340', 'Servicios de Capacitacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3350', 'Servicios de Investigacion Cientifica y Desarrollo', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3360', 'Servicios de Apoyo Administrativo, Traduccion, Fotocopiado e Impresion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3370', 'Servicios de Proteccion y Seguridad', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3380', 'Servicios de Vigilancia', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3390', 'Servicios Profesionales, Cientificos y Tecnicos Integrales', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3400', 'Servicios Financieros, Bancarios y Comerciales', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3410', 'Servicios Financieros y Bancarios', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3420', 'Servicios de Cobranza, Investigacion Crediticia y Similar', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3430', 'Servicios de Recaudacion, Traslado y Custodia de Valores', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3440', 'Seguros de Responsabilidad Patrimonial y Fianzas', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3450', 'Seguro de Bienes Patrimoniales', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3460', 'Almacenaje, Envase y Embalaje', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3470', 'Fletes y Maniobras', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3500', 'Servicios de Instalacion, Reparacion, Mantenimiento y Conservacion', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3510', 'Conservacion y Mantenimiento Menor de Inmuebles', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3520', 'Instalacion, Reparacion y Mantenimiento de Mobiliario y Equipo de Administracion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3530', 'Instalacion, Reparacion y Mantenimiento de Equipo de Computo y Tecnologias de la Informacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3540', 'Instalacion, Reparacion y Mantenimiento de Equipo e Instrumental Medico y de Laboratorio', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3550', 'Reparacion y Mantenimiento de Equipo de Transporte', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3560', 'Reparacion y Mantenimiento de Equipo de Defensa y Seguridad', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3570', 'Instalacion, Reparacion y Mantenimiento de Maquinaria, Otros Equipos y Herramientas', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3580', 'Servicios de Limpieza y Manejo de Desechos', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3590', 'Servicios de Jardineria y Fumigacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3600', 'Servicios de Comunicacion Social y Publicidad', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3610', 'Difusion por Radio, Television y Otros Medios de Mensajes sobre Programas y Actividades Gubernamentales', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3620', 'Difusion por Radio, Television y Otros Medios de Mensajes Comerciales para Promover la Venta de Bienes o Servicios', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3630', 'Servicios de Creatividad, Preproduccion y Produccion de Publicidad', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3700', 'Servicios de Traslado y Viaticos', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3710', 'Pasajes Aereos', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3720', 'Pasajes Terrestres', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3730', 'Pasajes Maritimos, Lacustres y Fluviales', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3740', 'Autotransporte', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3750', 'Viaticos en el Pais', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3760', 'Viaticos en el Extranjero', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3800', 'Servicios Oficiales', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3810', 'Gastos de Ceremonial', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3820', 'Gastos de Orden Social y Cultural', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3830', 'Congresos y Convenciones', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3840', 'Exposiciones', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3850', 'Gastos de Representacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3900', 'Otros Servicios Generales', 2, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3910', 'Servicios Funerarios y de Cementerios', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3920', 'Impuestos y Derechos', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3930', 'Impuestos y Derechos de Importacion', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3940', 'Sentencias y Resoluciones por Autoridad Competente', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3950', 'Penas, Multas, Accesorios y Actualizaciones', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3960', 'Otros Gastos por Responsabilidades', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3970', 'Utilidades', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3980', 'Impuesto sobre Nominas y Otros que se Deriven de una Relacion Laboral', 3, v_cog_cap3, true),
    (v_ente_id, 'objeto_gasto', '3990', 'Otros Servicios Generales', 3, v_cog_cap3, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 4000: Transferencias, Asignaciones, Subsidios y Otras Ayudas ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '4000', 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap4;

  IF v_cog_cap4 IS NULL THEN
    SELECT id INTO v_cog_cap4 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '4000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '4100', 'Transferencias Internas y Asignaciones al Sector Publico', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4110', 'Asignaciones Presupuestarias al Poder Ejecutivo', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4120', 'Asignaciones Presupuestarias al Poder Legislativo', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4130', 'Asignaciones Presupuestarias al Poder Judicial', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4140', 'Asignaciones Presupuestarias a Organos Autonomos', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4150', 'Transferencias Internas a Entidades Paraestatales', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4160', 'Transferencias Internas a Fideicomisos Publicos', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4200', 'Transferencias al Resto del Sector Publico', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4210', 'Transferencias a Entidades Paraestatales', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4220', 'Transferencias a Entidades Federativas y Municipios', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4300', 'Subsidios y Subvenciones', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4310', 'Subsidios a la Produccion', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4320', 'Subsidios a la Distribucion', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4330', 'Subsidios a la Inversion', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4340', 'Subsidios a la Prestacion de Servicios Publicos', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4350', 'Subsidios para Cubrir Diferenciales de Tasas de Interes', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4360', 'Subsidios a la Vivienda', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4370', 'Subvenciones al Consumo', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4390', 'Otros Subsidios', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4400', 'Ayudas Sociales', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4410', 'Ayudas Sociales a Personas', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4420', 'Becas y Otras Ayudas para Programas de Capacitacion', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4430', 'Ayudas Sociales a Instituciones de Ensenanza', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4440', 'Ayudas Sociales a Actividades Cientificas o Academicas', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4450', 'Ayudas Sociales a Instituciones Sin Fines de Lucro', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4460', 'Ayudas Sociales a Cooperativas', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4500', 'Pensiones y Jubilaciones', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4510', 'Pensiones', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4520', 'Jubilaciones', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4600', 'Transferencias a Fideicomisos, Mandatos y Otros Analogos', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4610', 'Transferencias a Fideicomisos del Poder Ejecutivo', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4700', 'Transferencias a la Seguridad Social', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4710', 'Transferencias por Obligacion de Ley', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4800', 'Donativos', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4810', 'Donativos a Instituciones Sin Fines de Lucro', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4820', 'Donativos a Entidades Federativas', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4830', 'Donativos a Fideicomisos Privados', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4840', 'Donativos a Fideicomisos Estatales', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4850', 'Donativos Internacionales', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4900', 'Transferencias al Exterior', 2, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4910', 'Transferencias para Gobiernos Extranjeros', 3, v_cog_cap4, true),
    (v_ente_id, 'objeto_gasto', '4920', 'Transferencias para Organismos Internacionales', 3, v_cog_cap4, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 5000: Bienes Muebles, Inmuebles e Intangibles ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '5000', 'Bienes Muebles, Inmuebles e Intangibles', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap5;

  IF v_cog_cap5 IS NULL THEN
    SELECT id INTO v_cog_cap5 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '5000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '5100', 'Mobiliario y Equipo de Administracion', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5110', 'Muebles de Oficina y Estanteria', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5120', 'Muebles, Excepto de Oficina y Estanteria', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5130', 'Bienes Artisticos, Culturales y Cientificos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5140', 'Objetos de Valor', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5150', 'Equipo de Computo y de Tecnologias de la Informacion', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5190', 'Otros Mobiliarios y Equipos de Administracion', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5200', 'Mobiliario y Equipo Educacional y Recreativo', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5210', 'Equipos y Aparatos Audiovisuales', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5220', 'Aparatos Deportivos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5230', 'Camaras Fotograficas y de Video', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5300', 'Equipo e Instrumental Medico y de Laboratorio', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5310', 'Equipo Medico y de Laboratorio', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5320', 'Instrumental Medico y de Laboratorio', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5400', 'Vehiculos y Equipo de Transporte', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5410', 'Vehiculos y Equipo Terrestre', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5420', 'Carrocerias y Remolques', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5430', 'Equipo Aeroespacial', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5440', 'Equipo Ferroviario', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5450', 'Embarcaciones', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5490', 'Otros Equipos de Transporte', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5500', 'Equipo de Defensa y Seguridad', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5510', 'Equipo de Defensa y Seguridad', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5600', 'Maquinaria, Otros Equipos y Herramientas', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5610', 'Maquinaria y Equipo Agropecuario', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5620', 'Maquinaria y Equipo Industrial', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5630', 'Maquinaria y Equipo de Construccion', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5640', 'Sistemas de Aire Acondicionado, Calefaccion y de Refrigeracion', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5650', 'Equipo de Comunicacion y Telecomunicacion', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5660', 'Equipos de Generacion Electrica, Aparatos y Accesorios Electricos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5670', 'Herramientas y Maquinas-Herramienta', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5690', 'Otros Equipos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5700', 'Activos Biologicos', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5710', 'Bovinos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5720', 'Porcinos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5730', 'Aves', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5740', 'Ovinos y Caprinos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5750', 'Peces y Acuicultura', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5760', 'Equinos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5770', 'Especies Menores y de Zoologico', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5780', 'Arboles y Plantas', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5790', 'Otros Activos Biologicos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5800', 'Bienes Inmuebles', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5810', 'Terrenos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5820', 'Viviendas', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5830', 'Edificios no Residenciales', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5890', 'Otros Bienes Inmuebles', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5900', 'Activos Intangibles', 2, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5910', 'Software', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5920', 'Patentes', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5930', 'Marcas', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5940', 'Derechos', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5950', 'Concesiones', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5960', 'Franquicias', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5970', 'Licencias Informaticas e Intelectuales', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5980', 'Licencias Industriales, Comerciales y Otras', 3, v_cog_cap5, true),
    (v_ente_id, 'objeto_gasto', '5990', 'Otros Activos Intangibles', 3, v_cog_cap5, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 6000: Inversion Publica ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '6000', 'Inversion Publica', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap6;

  IF v_cog_cap6 IS NULL THEN
    SELECT id INTO v_cog_cap6 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '6000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '6100', 'Obra Publica en Bienes de Dominio Publico', 2, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6110', 'Edificacion Habitacional', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6120', 'Edificacion no Habitacional', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6130', 'Construccion de Obras para el Abastecimiento de Agua, Petroleo, Gas, Electricidad y Telecomunicaciones', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6140', 'Division de Terrenos y Construccion de Obras de Urbanizacion', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6150', 'Construccion de Vias de Comunicacion', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6160', 'Otras Construcciones de Ingenieria Civil u Obra Pesada', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6170', 'Instalaciones y Equipamiento en Construcciones', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6200', 'Obra Publica en Bienes Propios', 2, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6210', 'Edificacion Habitacional', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6220', 'Edificacion no Habitacional', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6230', 'Construccion de Obras para el Abastecimiento de Agua, Petroleo, Gas, Electricidad y Telecomunicaciones', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6300', 'Proyectos Productivos y de Fomento', 2, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6310', 'Estudios, Formulacion y Evaluacion de Proyectos Productivos no Incluidos en Conceptos Anteriores', 3, v_cog_cap6, true),
    (v_ente_id, 'objeto_gasto', '6320', 'Ejecucion de Proyectos Productivos no Incluidos en Conceptos Anteriores', 3, v_cog_cap6, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 7000: Inversiones Financieras y Otras Provisiones ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '7000', 'Inversiones Financieras y Otras Provisiones', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap7;

  IF v_cog_cap7 IS NULL THEN
    SELECT id INTO v_cog_cap7 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '7000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '7100', 'Inversiones para el Fomento de Actividades Productivas', 2, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7110', 'Creditos Otorgados por Entidades Federativas y Municipios al Sector Social y Privado', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7200', 'Acciones y Participaciones de Capital', 2, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7210', 'Acciones y Participaciones de Capital en Entidades Paraestatales', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7300', 'Compra de Titulos y Valores', 2, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7310', 'Bonos', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7320', 'Valores Representativos de Deuda', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7400', 'Concesion de Prestamos', 2, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7410', 'Concesion de Prestamos a Entidades Paraestatales', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7500', 'Inversiones en Fideicomisos, Mandatos y Otros Analogos', 2, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7510', 'Inversiones en Fideicomisos del Poder Ejecutivo', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7900', 'Provisiones para Contingencias y Otras Erogaciones Especiales', 2, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7910', 'Contingencias por Fenomenos Naturales', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7920', 'Contingencias Socioeconomicas', 3, v_cog_cap7, true),
    (v_ente_id, 'objeto_gasto', '7990', 'Otras Erogaciones Especiales', 3, v_cog_cap7, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 8000: Participaciones y Aportaciones ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '8000', 'Participaciones y Aportaciones', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap8;

  IF v_cog_cap8 IS NULL THEN
    SELECT id INTO v_cog_cap8 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '8000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '8100', 'Participaciones', 2, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8110', 'Fondo General de Participaciones', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8120', 'Fondo de Fomento Municipal', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8130', 'Participaciones de las Entidades Federativas a los Municipios', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8140', 'Otros Conceptos Participables de la Federacion a Entidades Federativas', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8150', 'Otros Conceptos Participables de la Federacion a Municipios', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8200', 'Aportaciones', 2, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8210', 'Aportaciones de la Federacion a las Entidades Federativas y Municipios', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8300', 'Convenios', 2, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8310', 'Convenios de Reasignacion', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8320', 'Convenios de Descentralizacion', 3, v_cog_cap8, true),
    (v_ente_id, 'objeto_gasto', '8330', 'Otros Convenios', 3, v_cog_cap8, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Capitulo 9000: Deuda Publica ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'objeto_gasto', '9000', 'Deuda Publica', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_cog_cap9;

  IF v_cog_cap9 IS NULL THEN
    SELECT id INTO v_cog_cap9 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'objeto_gasto' AND codigo = '9000';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'objeto_gasto', '9100', 'Amortizacion de la Deuda Interna', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9110', 'Amortizacion de la Deuda Interna con Instituciones de Credito', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9120', 'Amortizacion de la Deuda Interna por Emision de Titulos y Valores', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9130', 'Amortizacion de Arrendamientos Financieros Nacionales', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9200', 'Intereses de la Deuda Interna', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9210', 'Intereses de la Deuda Interna con Instituciones de Credito', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9220', 'Intereses Derivados de la Colocacion de Titulos y Valores', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9230', 'Intereses por Arrendamientos Financieros Nacionales', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9300', 'Comisiones de la Deuda Interna', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9310', 'Comisiones de la Deuda Interna', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9400', 'Gastos de la Deuda Interna', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9410', 'Gastos de la Deuda Interna', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9500', 'Costo por Coberturas', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9510', 'Costos por Coberturas', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9600', 'Apoyos Financieros', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9610', 'Apoyos a Intermediarios Financieros', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9620', 'Apoyos a Ahorradores y Deudores del Sistema Financiero Nacional', 3, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9900', 'Adeudos de Ejercicios Fiscales Anteriores (ADEFAS)', 2, v_cog_cap9, true),
    (v_ente_id, 'objeto_gasto', '9910', 'ADEFAS', 3, v_cog_cap9, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 2. CLASIFICADOR ADMINISTRATIVO
  -- Estructura organica del ente publico para un municipio tipo.
  -- Cada ente debe personalizar este clasificador segun su organigrama.
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  2/7 Clasificador Administrativo...';

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'administrativo', '0100', 'Presidencia Municipal', 1, NULL, true),
    (v_ente_id, 'administrativo', '0200', 'Sindicatura', 1, NULL, true),
    (v_ente_id, 'administrativo', '0300', 'Regidurias', 1, NULL, true),
    (v_ente_id, 'administrativo', '0400', 'Secretaria del Ayuntamiento', 1, NULL, true),
    (v_ente_id, 'administrativo', '0500', 'Tesoreria Municipal', 1, NULL, true),
    (v_ente_id, 'administrativo', '0600', 'Contraloria Interna', 1, NULL, true),
    (v_ente_id, 'administrativo', '0700', 'Direccion de Obras Publicas', 1, NULL, true),
    (v_ente_id, 'administrativo', '0800', 'Direccion de Desarrollo Social', 1, NULL, true),
    (v_ente_id, 'administrativo', '0900', 'Direccion de Servicios Publicos', 1, NULL, true),
    (v_ente_id, 'administrativo', '1000', 'Direccion de Seguridad Publica', 1, NULL, true),
    (v_ente_id, 'administrativo', '1100', 'Direccion de Desarrollo Urbano', 1, NULL, true),
    (v_ente_id, 'administrativo', '1200', 'Direccion de Ecologia y Medio Ambiente', 1, NULL, true),
    (v_ente_id, 'administrativo', '1300', 'Direccion de Desarrollo Economico', 1, NULL, true),
    (v_ente_id, 'administrativo', '1400', 'Direccion de Administracion', 1, NULL, true),
    (v_ente_id, 'administrativo', '1500', 'Direccion Juridica', 1, NULL, true),
    (v_ente_id, 'administrativo', '1600', 'Direccion de Comunicacion Social', 1, NULL, true),
    (v_ente_id, 'administrativo', '1700', 'DIF Municipal', 1, NULL, true),
    (v_ente_id, 'administrativo', '1800', 'Instituto Municipal de la Mujer', 1, NULL, true),
    (v_ente_id, 'administrativo', '1900', 'Instituto Municipal de la Juventud', 1, NULL, true),
    (v_ente_id, 'administrativo', '2000', 'Instituto Municipal del Deporte', 1, NULL, true),
    (v_ente_id, 'administrativo', '2100', 'Instituto Municipal de Cultura', 1, NULL, true),
    (v_ente_id, 'administrativo', '2200', 'Organismo Operador de Agua', 1, NULL, true),
    (v_ente_id, 'administrativo', '9900', 'No Sectorizable', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 3. CLASIFICADOR FUNCIONAL (del Gasto)
  -- Conforme a los lineamientos CONAC para la clasificacion funcional.
  -- Estructura: Finalidad (nivel 1) > Funcion (nivel 2) > Subfuncion (nivel 3)
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  3/7 Clasificador Funcional...';

  -- ── Finalidad 1: Gobierno ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'funcional', '1', 'Gobierno', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_func_1;

  IF v_func_1 IS NULL THEN
    SELECT id INTO v_func_1 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'funcional' AND codigo = '1';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'funcional', '1.1', 'Legislacion', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.2', 'Justicia', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.3', 'Coordinacion de la Politica de Gobierno', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.4', 'Relaciones Exteriores', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.5', 'Asuntos Financieros y Hacendarios', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.6', 'Seguridad Nacional', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.7', 'Asuntos de Orden Publico y de Seguridad Interior', 2, v_func_1, true),
    (v_ente_id, 'funcional', '1.8', 'Otros Servicios Generales', 2, v_func_1, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Finalidad 2: Desarrollo Social ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'funcional', '2', 'Desarrollo Social', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_func_2;

  IF v_func_2 IS NULL THEN
    SELECT id INTO v_func_2 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'funcional' AND codigo = '2';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'funcional', '2.1', 'Proteccion Ambiental', 2, v_func_2, true),
    (v_ente_id, 'funcional', '2.2', 'Vivienda y Servicios a la Comunidad', 2, v_func_2, true),
    (v_ente_id, 'funcional', '2.3', 'Salud', 2, v_func_2, true),
    (v_ente_id, 'funcional', '2.4', 'Recreacion, Cultura y Otras Manifestaciones Sociales', 2, v_func_2, true),
    (v_ente_id, 'funcional', '2.5', 'Educacion', 2, v_func_2, true),
    (v_ente_id, 'funcional', '2.6', 'Proteccion Social', 2, v_func_2, true),
    (v_ente_id, 'funcional', '2.7', 'Otros Asuntos Sociales', 2, v_func_2, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Finalidad 3: Desarrollo Economico ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'funcional', '3', 'Desarrollo Economico', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_func_3;

  IF v_func_3 IS NULL THEN
    SELECT id INTO v_func_3 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'funcional' AND codigo = '3';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'funcional', '3.1', 'Asuntos Economicos, Comerciales y Laborales en General', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.2', 'Agropecuaria, Silvicultura, Pesca y Caza', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.3', 'Combustibles y Energia', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.4', 'Mineria, Manufacturas y Construccion', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.5', 'Transporte', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.6', 'Comunicaciones', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.7', 'Turismo', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.8', 'Ciencia, Tecnologia e Innovacion', 2, v_func_3, true),
    (v_ente_id, 'funcional', '3.9', 'Otras Industrias y Otros Asuntos Economicos', 2, v_func_3, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Finalidad 4: Otras No Clasificadas en Funciones Anteriores ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'funcional', '4', 'Otras No Clasificadas en Funciones Anteriores', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_func_4;

  IF v_func_4 IS NULL THEN
    SELECT id INTO v_func_4 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'funcional' AND codigo = '4';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'funcional', '4.1', 'Transacciones de la Deuda Publica / Costo Financiero de la Deuda', 2, v_func_4, true),
    (v_ente_id, 'funcional', '4.2', 'Transferencias, Participaciones y Aportaciones entre Diferentes Niveles y Ordenes de Gobierno', 2, v_func_4, true),
    (v_ente_id, 'funcional', '4.3', 'Saneamiento del Sistema Financiero', 2, v_func_4, true),
    (v_ente_id, 'funcional', '4.4', 'Adeudos de Ejercicios Fiscales Anteriores', 2, v_func_4, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 4. CLASIFICADOR PROGRAMATICO
  -- Tipologia programatica conforme al CONAC, utilizada para
  -- clasificar el gasto segun su finalidad programatica.
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  4/7 Clasificador Programatico...';

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'programatico', 'S', 'Sujetos a Reglas de Operacion (Subsidios)', 1, NULL, true),
    (v_ente_id, 'programatico', 'U', 'Otros Subsidios', 1, NULL, true),
    (v_ente_id, 'programatico', 'E', 'Prestacion de Servicios Publicos', 1, NULL, true),
    (v_ente_id, 'programatico', 'B', 'Provision de Bienes Publicos', 1, NULL, true),
    (v_ente_id, 'programatico', 'P', 'Planeacion, Seguimiento y Evaluacion de Politicas Publicas', 1, NULL, true),
    (v_ente_id, 'programatico', 'F', 'Promocion y Fomento', 1, NULL, true),
    (v_ente_id, 'programatico', 'G', 'Regulacion y Supervision', 1, NULL, true),
    (v_ente_id, 'programatico', 'A', 'Funciones de las Fuerzas Armadas (Unicamente Gobierno Federal)', 1, NULL, true),
    (v_ente_id, 'programatico', 'R', 'Especificos', 1, NULL, true),
    (v_ente_id, 'programatico', 'K', 'Proyectos de Inversion', 1, NULL, true),
    (v_ente_id, 'programatico', 'M', 'Apoyo al Proceso Presupuestario y para Mejorar la Eficiencia Institucional', 1, NULL, true),
    (v_ente_id, 'programatico', 'O', 'Apoyo a la Funcion Publica y al Mejoramiento de la Gestion', 1, NULL, true),
    (v_ente_id, 'programatico', 'W', 'Operaciones Ajenas', 1, NULL, true),
    (v_ente_id, 'programatico', 'L', 'Obligaciones de Cumplimiento de Resolucion Jurisdiccional', 1, NULL, true),
    (v_ente_id, 'programatico', 'N', 'Desastres Naturales', 1, NULL, true),
    (v_ente_id, 'programatico', 'J', 'Pensiones y Jubilaciones', 1, NULL, true),
    (v_ente_id, 'programatico', 'T', 'Aportaciones a la Seguridad Social', 1, NULL, true),
    (v_ente_id, 'programatico', 'Y', 'Aportaciones a Fondos de Estabilizacion', 1, NULL, true),
    (v_ente_id, 'programatico', 'Z', 'Aportaciones a Fondos de Inversion y Reestructura de Pensiones', 1, NULL, true),
    (v_ente_id, 'programatico', 'I', 'Gasto Federalizado', 1, NULL, true),
    (v_ente_id, 'programatico', 'C', 'Participaciones a Entidades Federativas y Municipios', 1, NULL, true),
    (v_ente_id, 'programatico', 'D', 'Costo Financiero, Deuda o Apoyos a Deudores y Ahorradores de la Banca', 1, NULL, true),
    (v_ente_id, 'programatico', 'H', 'Adeudos de Ejercicios Fiscales Anteriores', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 5. CLASIFICADOR ECONOMICO (del Gasto)
  -- Clasifica el gasto segun su naturaleza economica:
  -- corriente, de capital o amortizacion de deuda.
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  5/7 Clasificador Economico...';

  -- ── Tipo 1: Gasto Corriente ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'economico', '1', 'Gasto Corriente', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_econ_1;

  IF v_econ_1 IS NULL THEN
    SELECT id INTO v_econ_1 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'economico' AND codigo = '1';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'economico', '1.1', 'Gasto de Consumo (Servicios Personales + Materiales + Servicios Generales)', 2, v_econ_1, true),
    (v_ente_id, 'economico', '1.2', 'Transferencias Corrientes (Subsidios, Ayudas, Pensiones)', 2, v_econ_1, true),
    (v_ente_id, 'economico', '1.3', 'Participaciones y Aportaciones Corrientes', 2, v_econ_1, true),
    (v_ente_id, 'economico', '1.4', 'Intereses, Comisiones y Gastos de la Deuda', 2, v_econ_1, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Tipo 2: Gasto de Capital ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'economico', '2', 'Gasto de Capital', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_econ_2;

  IF v_econ_2 IS NULL THEN
    SELECT id INTO v_econ_2 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'economico' AND codigo = '2';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'economico', '2.1', 'Bienes Muebles, Inmuebles e Intangibles', 2, v_econ_2, true),
    (v_ente_id, 'economico', '2.2', 'Inversion Publica', 2, v_econ_2, true),
    (v_ente_id, 'economico', '2.3', 'Inversiones Financieras y Otras Provisiones', 2, v_econ_2, true),
    (v_ente_id, 'economico', '2.4', 'Transferencias de Capital', 2, v_econ_2, true),
    (v_ente_id, 'economico', '2.5', 'Participaciones y Aportaciones de Capital', 2, v_econ_2, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- ── Tipo 3: Amortizacion de la Deuda y Disminucion de Pasivos ──

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo)
  VALUES (v_ente_id, 'economico', '3', 'Amortizacion de la Deuda y Disminucion de Pasivos', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING
  RETURNING id INTO v_econ_3;

  IF v_econ_3 IS NULL THEN
    SELECT id INTO v_econ_3 FROM clasificador_presupuestal
    WHERE ente_id = v_ente_id AND tipo = 'economico' AND codigo = '3';
  END IF;

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'economico', '3.1', 'Amortizacion de la Deuda Interna', 2, v_econ_3, true),
    (v_ente_id, 'economico', '3.2', 'Amortizacion de la Deuda Externa', 2, v_econ_3, true),
    (v_ente_id, 'economico', '3.3', 'Adeudos de Ejercicios Fiscales Anteriores (ADEFAS)', 2, v_econ_3, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 6. CLASIFICADOR GEOGRAFICO
  -- Las 32 entidades federativas de Mexico con sus codigos INEGI.
  -- Util para entes que operan en multiples estados o
  -- para la clasificacion geografica del gasto.
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  6/7 Clasificador Geografico...';

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    (v_ente_id, 'geografico', '01', 'Aguascalientes', 1, NULL, true),
    (v_ente_id, 'geografico', '02', 'Baja California', 1, NULL, true),
    (v_ente_id, 'geografico', '03', 'Baja California Sur', 1, NULL, true),
    (v_ente_id, 'geografico', '04', 'Campeche', 1, NULL, true),
    (v_ente_id, 'geografico', '05', 'Coahuila de Zaragoza', 1, NULL, true),
    (v_ente_id, 'geografico', '06', 'Colima', 1, NULL, true),
    (v_ente_id, 'geografico', '07', 'Chiapas', 1, NULL, true),
    (v_ente_id, 'geografico', '08', 'Chihuahua', 1, NULL, true),
    (v_ente_id, 'geografico', '09', 'Ciudad de Mexico', 1, NULL, true),
    (v_ente_id, 'geografico', '10', 'Durango', 1, NULL, true),
    (v_ente_id, 'geografico', '11', 'Guanajuato', 1, NULL, true),
    (v_ente_id, 'geografico', '12', 'Guerrero', 1, NULL, true),
    (v_ente_id, 'geografico', '13', 'Hidalgo', 1, NULL, true),
    (v_ente_id, 'geografico', '14', 'Jalisco', 1, NULL, true),
    (v_ente_id, 'geografico', '15', 'Mexico', 1, NULL, true),
    (v_ente_id, 'geografico', '16', 'Michoacan de Ocampo', 1, NULL, true),
    (v_ente_id, 'geografico', '17', 'Morelos', 1, NULL, true),
    (v_ente_id, 'geografico', '18', 'Nayarit', 1, NULL, true),
    (v_ente_id, 'geografico', '19', 'Nuevo Leon', 1, NULL, true),
    (v_ente_id, 'geografico', '20', 'Oaxaca', 1, NULL, true),
    (v_ente_id, 'geografico', '21', 'Puebla', 1, NULL, true),
    (v_ente_id, 'geografico', '22', 'Queretaro', 1, NULL, true),
    (v_ente_id, 'geografico', '23', 'Quintana Roo', 1, NULL, true),
    (v_ente_id, 'geografico', '24', 'San Luis Potosi', 1, NULL, true),
    (v_ente_id, 'geografico', '25', 'Sinaloa', 1, NULL, true),
    (v_ente_id, 'geografico', '26', 'Sonora', 1, NULL, true),
    (v_ente_id, 'geografico', '27', 'Tabasco', 1, NULL, true),
    (v_ente_id, 'geografico', '28', 'Tamaulipas', 1, NULL, true),
    (v_ente_id, 'geografico', '29', 'Tlaxcala', 1, NULL, true),
    (v_ente_id, 'geografico', '30', 'Veracruz de Ignacio de la Llave', 1, NULL, true),
    (v_ente_id, 'geografico', '31', 'Yucatan', 1, NULL, true),
    (v_ente_id, 'geografico', '32', 'Zacatecas', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;


  -- ═══════════════════════════════════════════════════════════════════════
  -- 7. CLASIFICADOR POR FUENTE DE FINANCIAMIENTO
  -- Origen de los recursos que financian el gasto publico.
  -- Conforme a los lineamientos CONAC para la clasificacion
  -- por fuente de financiamiento.
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '  7/7 Clasificador por Fuente de Financiamiento...';

  INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
    -- Nivel 1: Fuentes principales
    (v_ente_id, 'fuente_financiamiento', '1', 'Recursos Fiscales', 1, NULL, true),
    (v_ente_id, 'fuente_financiamiento', '2', 'Financiamientos Internos', 1, NULL, true),
    (v_ente_id, 'fuente_financiamiento', '3', 'Financiamientos Externos', 1, NULL, true),
    (v_ente_id, 'fuente_financiamiento', '4', 'Ingresos Propios', 1, NULL, true),
    (v_ente_id, 'fuente_financiamiento', '5', 'Recursos Federales', 1, NULL, true),
    (v_ente_id, 'fuente_financiamiento', '6', 'Recursos Estatales', 1, NULL, true),
    (v_ente_id, 'fuente_financiamiento', '7', 'Otros Recursos', 1, NULL, true)
  ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;

  -- Nivel 2: Subcategorias de Recursos Fiscales
  -- (obtenemos el padre_id para vincular)
  DECLARE
    v_ff1 UUID; v_ff2 UUID; v_ff3 UUID; v_ff4 UUID; v_ff5 UUID; v_ff6 UUID; v_ff7 UUID;
  BEGIN
    SELECT id INTO v_ff1 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '1';
    SELECT id INTO v_ff2 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '2';
    SELECT id INTO v_ff3 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '3';
    SELECT id INTO v_ff4 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '4';
    SELECT id INTO v_ff5 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '5';
    SELECT id INTO v_ff6 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '6';
    SELECT id INTO v_ff7 FROM clasificador_presupuestal WHERE ente_id = v_ente_id AND tipo = 'fuente_financiamiento' AND codigo = '7';

    INSERT INTO clasificador_presupuestal (ente_id, tipo, codigo, nombre, nivel, padre_id, activo) VALUES
      -- Recursos Fiscales
      (v_ente_id, 'fuente_financiamiento', '1.1', 'Impuestos', 2, v_ff1, true),
      (v_ente_id, 'fuente_financiamiento', '1.2', 'Cuotas y Aportaciones de Seguridad Social', 2, v_ff1, true),
      (v_ente_id, 'fuente_financiamiento', '1.3', 'Contribuciones de Mejoras', 2, v_ff1, true),
      (v_ente_id, 'fuente_financiamiento', '1.4', 'Derechos', 2, v_ff1, true),
      (v_ente_id, 'fuente_financiamiento', '1.5', 'Productos', 2, v_ff1, true),
      (v_ente_id, 'fuente_financiamiento', '1.6', 'Aprovechamientos', 2, v_ff1, true),
      -- Financiamientos Internos
      (v_ente_id, 'fuente_financiamiento', '2.1', 'Endeudamiento Interno', 2, v_ff2, true),
      (v_ente_id, 'fuente_financiamiento', '2.2', 'Emision de Bonos y Valores', 2, v_ff2, true),
      -- Financiamientos Externos
      (v_ente_id, 'fuente_financiamiento', '3.1', 'Endeudamiento Externo', 2, v_ff3, true),
      (v_ente_id, 'fuente_financiamiento', '3.2', 'Organismos Financieros Internacionales', 2, v_ff3, true),
      -- Ingresos Propios
      (v_ente_id, 'fuente_financiamiento', '4.1', 'Ingresos por Ventas de Bienes y Servicios', 2, v_ff4, true),
      (v_ente_id, 'fuente_financiamiento', '4.2', 'Ingresos Diversos', 2, v_ff4, true),
      -- Recursos Federales
      (v_ente_id, 'fuente_financiamiento', '5.1', 'Participaciones Federales (Ramo 28)', 2, v_ff5, true),
      (v_ente_id, 'fuente_financiamiento', '5.2', 'Aportaciones Federales (Ramo 33)', 2, v_ff5, true),
      (v_ente_id, 'fuente_financiamiento', '5.3', 'Convenios Federales', 2, v_ff5, true),
      (v_ente_id, 'fuente_financiamiento', '5.4', 'Subsidios Federales', 2, v_ff5, true),
      (v_ente_id, 'fuente_financiamiento', '5.5', 'Fondos de Aportaciones Federales', 2, v_ff5, true),
      -- Recursos Estatales
      (v_ente_id, 'fuente_financiamiento', '6.1', 'Participaciones Estatales', 2, v_ff6, true),
      (v_ente_id, 'fuente_financiamiento', '6.2', 'Aportaciones Estatales', 2, v_ff6, true),
      (v_ente_id, 'fuente_financiamiento', '6.3', 'Convenios Estatales', 2, v_ff6, true),
      -- Otros Recursos
      (v_ente_id, 'fuente_financiamiento', '7.1', 'Donaciones', 2, v_ff7, true),
      (v_ente_id, 'fuente_financiamiento', '7.2', 'Remanentes de Ejercicios Anteriores', 2, v_ff7, true),
      (v_ente_id, 'fuente_financiamiento', '7.3', 'Otros Ingresos', 2, v_ff7, true)
    ON CONFLICT (ente_id, tipo, codigo) DO NOTHING;
  END;


  -- ═══════════════════════════════════════════════════════════════════════
  -- RESUMEN DE DATOS INSERTADOS
  -- ═══════════════════════════════════════════════════════════════════════

  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Datos semilla de clasificadores insertados exitosamente';
  RAISE NOTICE 'Ente: %', v_ente_id;
  RAISE NOTICE '  1. Objeto del Gasto (COG): 9 capitulos + conceptos + partidas genericas';
  RAISE NOTICE '  2. Administrativo: 23 unidades organicas (municipio tipo)';
  RAISE NOTICE '  3. Funcional: 4 finalidades + 28 funciones';
  RAISE NOTICE '  4. Programatico: 23 tipos programaticos CONAC';
  RAISE NOTICE '  5. Economico: 3 tipos + 12 subcategorias';
  RAISE NOTICE '  6. Geografico: 32 entidades federativas';
  RAISE NOTICE '  7. Fuente de Financiamiento: 7 fuentes + 23 subcategorias';
  RAISE NOTICE '=========================================';

END $$;
