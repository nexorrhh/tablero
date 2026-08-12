window.DATA = {
  produccion: {
    meses: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    toneladas: [1080,1125,1190,1042,1210,1255,980,1130,1175,1220,1198,1240],
    objetivo: 1300
  },
  plantel: {
    sectores: [
      { nombre:'Producción', valor:118, color:'#e0218a' },
      { nombre:'Mantenimiento', valor:34, color:'#ff7ab8' },
      { nombre:'Logística', valor:28, color:'#5aa9f5' },
      { nombre:'Calidad', valor:19, color:'#3ecf8e' },
      { nombre:'Ingeniería', valor:21, color:'#f5b740' },
      { nombre:'Administración', valor:28, color:'#9b8cff' }
    ],
    total: 248
  },
  obras: [
    { nombre:'Nave Ind. Pilar', avance:86, cliente:'Logística Pilar' },
    { nombre:'Estr. Puente RP6', avance:64, cliente:'Vialidad RP6' },
    { nombre:'Galpón Zárate', avance:48, cliente:'Frigorífico Zárate' },
    { nombre:'Torre Agua Luján', avance:92, cliente:'Aguas de Luján' },
    { nombre:'Pasarela Tigre', avance:31, cliente:'Municipio Tigre' }
  ],
  feed: [
    { tipo:'danger', icono:'alert', titulo:'No conformidad crítica abierta', mensaje:'Lote 2241, desviación en soldadura', tiempo:'hace 2h' },
    { tipo:'warning', icono:'truck', titulo:'Vencimiento de VTV próximo', mensaje:'Camión Iveco AC-482, 6 días', tiempo:'hace 4h' },
    { tipo:'success', icono:'check', titulo:'Orden OP-1180 completada', mensaje:'Torre Agua Luján, 92%', tiempo:'hace 6h' },
    { tipo:'info', icono:'users', titulo:'2 altas de personal', mensaje:'Producción y Calidad', tiempo:'ayer' },
    { tipo:'warning', icono:'wrench', titulo:'Mantenimiento programado', mensaje:'Autoelevador Toyota AE-007', tiempo:'ayer' },
    { tipo:'info', icono:'doc', titulo:'Reporte mensual disponible', mensaje:'Cierre de producción Mayo', tiempo:'hace 2d' }
  ],
  flota: [
    { id:'AC-482', modelo:'Iveco Tector', estado:'Operativo', km:'184.200', vtv:'04/06/26', alerta:'warning', alertaMsg:'VTV en 6 días' },
    { id:'FD-118', modelo:'Ford F-4000', estado:'Operativo', km:'142.850', vtv:'11/06/26', alerta:'warning', alertaMsg:'VTV en 12 días' },
    { id:'AE-007', modelo:'Toyota 8FD25', estado:'En taller', km:'8.940 hs', vtv:'—', alerta:'danger', alertaMsg:'Requiere service' },
    { id:'GR-301', modelo:'Grúa Grove RT540', estado:'Operativo', km:'62.100', vtv:'20/06/26', alerta:'info', alertaMsg:'VTV en 21 días' },
    { id:'CH-220', modelo:'Mercedes Atego', estado:'Operativo', km:'210.430', vtv:'02/08/26', alerta:'neutral', alertaMsg:'' },
    { id:'UT-055', modelo:'Renault Kangoo', estado:'Inactivo', km:'98.700', vtv:'15/07/26', alerta:'danger', alertaMsg:'Fuera de servicio' },
    { id:'CH-221', modelo:'Scania P310', estado:'Operativo', km:'156.000', vtv:'28/09/26', alerta:'neutral', alertaMsg:'' }
  ],
  nc: [
    { id:'NC-2241', desc:'Desviación en soldadura', sector:'Producción', origen:'Auditoría', estado:'Abierta', prioridad:'Alta' },
    { id:'NC-2238', desc:'Material fuera de tolerancia', sector:'Calidad', origen:'Recepción', estado:'En proceso', prioridad:'Media' },
    { id:'NC-2235', desc:'Demora en entrega', sector:'Logística', origen:'Proveedor', estado:'En proceso', prioridad:'Media' },
    { id:'NC-2230', desc:'Falta de EPP', sector:'Producción', origen:'Inspección', estado:'Cerrada', prioridad:'Alta' },
    { id:'NC-2226', desc:'Error en plano', sector:'Ingeniería', origen:'Cliente', estado:'Cerrada', prioridad:'Baja' },
    { id:'NC-2222', desc:'No conformidad en pintura', sector:'Producción', origen:'Auditoría', estado:'Abierta', prioridad:'Media' },
    { id:'NC-2219', desc:'Desvío en torque', sector:'Calidad', origen:'Inspección', estado:'Cerrada', prioridad:'Alta' }
  ],
  presupuestos: [
    { id:'PR-3052', cliente:'Aguas de Luján', desc:'Torre elevada', monto:'$48.200.000', estado:'Enviado' },
    { id:'PR-3051', cliente:'Logística Pilar', desc:'Nave 480m²', monto:'$96.500.000', estado:'En análisis' },
    { id:'PR-3049', cliente:'Vialidad RP6', desc:'Vigas (24u)', monto:'$31.800.000', estado:'Adjudicado' },
    { id:'PR-3047', cliente:'Frigorífico Zárate', desc:'Galpón 620m²', monto:'$72.400.000', estado:'Adjudicado' },
    { id:'PR-3045', cliente:'Municipio Tigre', desc:'Pasarela', monto:'$18.900.000', estado:'Rechazado' },
    { id:'PR-3043', cliente:'Edenor', desc:'Columnas (60u)', monto:'$27.600.000', estado:'Adjudicado' },
    { id:'PR-3041', cliente:'Metalúrgica San Justo', desc:'Bastidores', monto:'$14.200.000', estado:'Enviado' }
  ],
  ventas: {
    meses: ['Dic','Ene','Feb','Mar','Abr','May'],
    valores: [142,168,151,189,174,206]
  },
  proyectos: [
    { id:'ING-512', nombre:'Torre agua', responsable:'F. Ibarra', avance:78, planos:'24/30', fecha:'03/06/26' },
    { id:'ING-509', nombre:'Nave Pilar', responsable:'M. Luna', avance:92, planos:'46/48', fecha:'06/06/26' },
    { id:'ING-507', nombre:'Galpón Zárate', responsable:'F. Ibarra', avance:54, planos:'17/34', fecha:'20/06/26' },
    { id:'ING-505', nombre:'Pasarela Tigre', responsable:'D. Sosa', avance:35, planos:'8/22', fecha:'12/07/26' },
    { id:'ING-501', nombre:'Columnas Edenor', responsable:'M. Luna', avance:100, planos:'12/12', fecha:'Aprobado' },
    { id:'ING-498', nombre:'Bastidores', responsable:'F. Ibarra', avance:100, planos:'9/9', fecha:'Aprobado' }
  ],
  oc: [
    { id:'OC-7821', proveedor:'Acindar', desc:'Chapa naval 6mm', monto:'$18.400.000', estado:'Recibida' },
    { id:'OC-7819', proveedor:'Tenaris', desc:'Caños estructurales', monto:'$12.700.000', estado:'En tránsito' },
    { id:'OC-7817', proveedor:'Air Liquide', desc:'Gas para soldadura', monto:'$3.200.000', estado:'Recibida' },
    { id:'OC-7815', proveedor:'Sika Argentina', desc:'Pintura epoxi', monto:'$5.600.000', estado:'Pendiente' },
    { id:'OC-7813', proveedor:'Bulonfer', desc:'Bulonería alta resist.', monto:'$2.900.000', estado:'En tránsito' },
    { id:'OC-7810', proveedor:'Distribuidora Norte', desc:'Electrodos', monto:'$1.800.000', estado:'Recibida' },
    { id:'OC-7808', proveedor:'Acindar', desc:'Perfiles UPN', monto:'$9.400.000', estado:'Demorada' }
  ],
  inspecciones: [
    { id:'INS-1190', lote:'Lote 2245', tipo:'Dimensional', resultado:'Conforme', inspector:'V. Ríos', fecha:'28/05/26' },
    { id:'INS-1189', lote:'Lote 2244', tipo:'Soldadura', resultado:'No conforme', inspector:'M. Luna', fecha:'27/05/26' },
    { id:'INS-1188', lote:'Lote 2243', tipo:'Pintura', resultado:'Conforme', inspector:'V. Ríos', fecha:'26/05/26' },
    { id:'INS-1187', lote:'Lote 2242', tipo:'Dimensional', resultado:'Observado', inspector:'S. Olivera', fecha:'24/05/26' },
    { id:'INS-1186', lote:'Lote 2241', tipo:'Soldadura', resultado:'Conforme', inspector:'M. Luna', fecha:'22/05/26' },
    { id:'INS-1185', lote:'Lote 2240', tipo:'Torque', resultado:'Conforme', inspector:'V. Ríos', fecha:'20/05/26' }
  ],
  ordenesProd: [
    { id:'OP-1180', desc:'Estructura Torre Agua', cliente:'Aguas de Luján', avance:92, fecha:'05/06/26', estado:'En proceso' },
    { id:'OP-1178', desc:'Nave industrial', cliente:'Logística Pilar', avance:86, fecha:'18/06/26', estado:'En proceso' },
    { id:'OP-1175', desc:'Vigas reticuladas', cliente:'Vialidad RP6', avance:64, fecha:'30/06/26', estado:'En proceso' },
    { id:'OP-1172', desc:'Galpón metálico', cliente:'Frigorífico Zárate', avance:48, fecha:'15/07/26', estado:'En proceso' },
    { id:'OP-1170', desc:'Pasarela peatonal', cliente:'Municipio Tigre', avance:31, fecha:'28/07/26', estado:'En proceso' },
    { id:'OP-1165', desc:'Columnas alumbrado', cliente:'Edenor', avance:100, fecha:'12/05/26', estado:'Entregada' },
    { id:'OP-1160', desc:'Bastidores soldados', cliente:'Metalúrgica San Justo', avance:100, fecha:'02/05/26', estado:'Entregada' }
  ],
  empleados: [
    { id:'E-001', nombre:'Carlos Méndez', sector:'Producción', puesto:'Jefe de Planta', antiguedad:'8 años', estado:'Activo', email:'c.mendez@cimomet.com.ar', color:'#e0218a' },
    { id:'E-002', nombre:'Ana Rodríguez', sector:'Calidad', puesto:'Analista de Calidad', antiguedad:'4 años', estado:'Activo', email:'a.rodriguez@cimomet.com.ar', color:'#3ecf8e' },
    { id:'E-003', nombre:'Martín López', sector:'Ingeniería', puesto:'Proyectista Sr.', antiguedad:'6 años', estado:'Activo', email:'m.lopez@cimomet.com.ar', color:'#5aa9f5' },
    { id:'E-004', nombre:'Verónica Ríos', sector:'Calidad', puesto:'Inspectora', antiguedad:'3 años', estado:'Activo', email:'v.rios@cimomet.com.ar', color:'#f5b740' },
    { id:'E-005', nombre:'Facundo Ibarra', sector:'Ingeniería', puesto:'Proyectista Jr.', antiguedad:'2 años', estado:'Activo', email:'f.ibarra@cimomet.com.ar', color:'#9b8cff' },
    { id:'E-006', nombre:'Diego Sosa', sector:'Ingeniería', puesto:'Proyectista Jr.', antiguedad:'1 año', estado:'Activo', email:'d.sosa@cimomet.com.ar', color:'#ff7ab8' },
    { id:'E-007', nombre:'Sergio Olivera', sector:'Calidad', puesto:'Inspector Jr.', antiguedad:'2 años', estado:'Licencia', email:'s.olivera@cimomet.com.ar', color:'#5aa9f5' },
    { id:'E-008', nombre:'Patricia Gómez', sector:'Administración', puesto:'Contadora', antiguedad:'11 años', estado:'Activo', email:'p.gomez@cimomet.com.ar', color:'#3ecf8e' },
    { id:'E-009', nombre:'Roberto Fernández', sector:'Producción', puesto:'Soldador Especialista', antiguedad:'9 años', estado:'Activo', email:'r.fernandez@cimomet.com.ar', color:'#e0218a' },
    { id:'E-010', nombre:'Laura Suárez', sector:'Logística', puesto:'Coordinadora', antiguedad:'5 años', estado:'Activo', email:'l.suarez@cimomet.com.ar', color:'#f5b740' },
    { id:'E-011', nombre:'Jorge Herrera', sector:'Mantenimiento', puesto:'Técnico Eléctrico', antiguedad:'7 años', estado:'Activo', email:'j.herrera@cimomet.com.ar', color:'#9b8cff' },
    { id:'E-012', nombre:'Silvina Castro', sector:'Administración', puesto:'RRHH', antiguedad:'3 años', estado:'Activo', email:'s.castro@cimomet.com.ar', color:'#ff7ab8' },
    { id:'E-013', nombre:'Nicolás Pérez', sector:'Producción', puesto:'Operario', antiguedad:'1 año', estado:'Vacaciones', email:'n.perez@cimomet.com.ar', color:'#e0218a' },
    { id:'E-014', nombre:'Marcela Torres', sector:'Logística', puesto:'Administrativa', antiguedad:'4 años', estado:'Activo', email:'m.torres@cimomet.com.ar', color:'#5aa9f5' },
    { id:'E-015', nombre:'Eduardo Vega', sector:'Producción', puesto:'Tornero', antiguedad:'12 años', estado:'Activo', email:'e.vega@cimomet.com.ar', color:'#f5b740' },
    { id:'E-016', nombre:'Florencia Medina', sector:'Calidad', puesto:'Documentación', antiguedad:'2 años', estado:'Activo', email:'f.medina@cimomet.com.ar', color:'#3ecf8e' }
  ],
  solicitudes: [
    { id:'SOL-0412', empleado:'Sergio Olivera', tipo:'Licencia médica', dias:5, estado:'Aprobada', fecha:'28/05/26' },
    { id:'SOL-0411', empleado:'Nicolás Pérez', tipo:'Vacaciones', dias:10, estado:'Aprobada', fecha:'25/05/26' },
    { id:'SOL-0410', empleado:'Facundo Ibarra', tipo:'Permiso particular', dias:1, estado:'Pendiente', fecha:'30/05/26' },
    { id:'SOL-0409', empleado:'Laura Suárez', tipo:'Cambio de turno', dias:1, estado:'Pendiente', fecha:'29/05/26' },
    { id:'SOL-0408', empleado:'Eduardo Vega', tipo:'Adelanto de sueldo', dias:0, estado:'Rechazada', fecha:'22/05/26' },
    { id:'SOL-0406', empleado:'Jorge Herrera', tipo:'Permiso por estudio', dias:2, estado:'Aprobada', fecha:'20/05/26' },
    { id:'SOL-0404', empleado:'Marcela Torres', tipo:'Vacaciones', dias:7, estado:'Pendiente', fecha:'18/05/26' }
  ],
  sabados: [
    { fecha:'31/05/26', sector:'Producción', personal:24, estado:'Programado', hs:8 },
    { fecha:'25/05/26', sector:'Mantenimiento', personal:8, estado:'Liquidado', hs:6 },
    { fecha:'07/06/26', sector:'Producción', personal:20, estado:'Confirmado', hs:8 },
    { fecha:'17/06/26', sector:'Logística', personal:6, estado:'Programado', hs:6 },
    { fecha:'18/05/26', sector:'Producción', personal:28, estado:'Liquidado', hs:8 }
  ],
  postulantes: [
    { id:'P-2641', nombre:'Tomás Villalba', puesto:'Soldador', etapa:'Evaluación', fecha:'28/05/26' },
    { id:'P-2639', nombre:'Romina Ábalos', puesto:'Analista de calidad', etapa:'Entrevista', fecha:'27/05/26' },
    { id:'P-2637', nombre:'Leandro Quiroga', puesto:'Operario', etapa:'Oferta', fecha:'25/05/26' },
    { id:'P-2635', nombre:'Daniela Font', puesto:'Proyectista', etapa:'Evaluación', fecha:'23/05/26' },
    { id:'P-2633', nombre:'Ramón Díaz', puesto:'Chofer', etapa:'Contratado', fecha:'20/05/26' },
    { id:'P-2631', nombre:'Cecilia Mora', puesto:'Administrativo', etapa:'Descartado', fecha:'18/05/26' }
  ],
  ausentismo: {
    meses: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    valores: [4.8,5.2,4.1,6.0,3.9,4.4,5.5,4.2,3.6,4.0,3.8,3.5]
  },
  conformidad: {
    meses: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    noConformidad: [3.2,4.1,3.8,5.0,3.5,3.9,4.6,3.7,3.4,3.6,3.8,3.5],
    conforme: [96.8,95.9,96.2,95.0,96.5,96.1,95.4,96.3,96.6,96.4,96.2,96.5]
  },
  vencimientos: [
    { item:'Service AE-007', tipo:'Mantenimiento', dias:3, nivel:'danger' },
    { item:'VTV AC-482', tipo:'VTV', dias:6, nivel:'warning' },
    { item:'Seguro FD-118', tipo:'Seguro', dias:12, nivel:'warning' },
    { item:'Habilitación GR-301', tipo:'Habilitación', dias:21, nivel:'info' }
  ],
  proveedores: [
    { nombre:'Acindar', rubro:'Aceros planos y perfiles', contacto:'Ing. Ruiz', tel:'0800-888-1234', estado:'Activo' },
    { nombre:'Tenaris', rubro:'Tubos de acero', contacto:'Lic. Vargas', tel:'(011) 4018-2100', estado:'Activo' },
    { nombre:'Air Liquide', rubro:'Gases industriales', contacto:'Sr. Bogado', tel:'(011) 5555-0001', estado:'Activo' },
    { nombre:'Sika Argentina', rubro:'Químicos y pinturas', contacto:'Sra. Núñez', tel:'(0230) 420-1000', estado:'Activo' },
    { nombre:'Bulonfer', rubro:'Fijaciones y bulonería', contacto:'Sr. Leguizamón', tel:'(011) 4672-4400', estado:'Activo' },
    { nombre:'Distribuidora Norte', rubro:'Consumibles soldadura', contacto:'Sr. Ávila', tel:'(011) 4555-7890', estado:'Activo' }
  ]
};
