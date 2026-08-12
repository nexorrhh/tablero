// sections.jsx — todas las vistas de secciones

const { useState: _us, useMemo: _um, useEffect: _ue, useRef: _ur } = React;
const D = window.DATA;

/* =========================================================
   HELPERS LOCALES
   ========================================================= */
function SectionGrid({ children, cols = 4 }) {
  return <div className={`g${cols} mb24`}>{children}</div>;
}

function Avatar({ nombre, color, size = 32 }) {
  const initials = nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div className="avatar" style={{ background: color + '28', color, width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function ObraCard({ obra }) {
  const color = obra.avance >= 80 ? '#3ecf8e' : obra.avance >= 50 ? '#e0218a' : '#f5b740';
  return (
    <div className="obra-card">
      <div className="obra-header">
        <div>
          <div className="obra-nombre">{obra.nombre}</div>
          <div className="obra-cliente">{obra.cliente}</div>
        </div>
        <div className="obra-pct" style={{ color }}>{obra.avance}%</div>
      </div>
      <ProgBar value={obra.avance} color={color} />
    </div>
  );
}

/* =========================================================
   VISTA INICIO
   ========================================================= */
const _PUESTOS_MENSUALES = [
  'calidad','ingenieria','gerencia','administracion',
  'responsable de produccion','rrhh','coordinacion de produccion',
  'recepcion y despacho','presupuestos','seguridad & higiene',
];
const _normStr = s => s ? s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'') : '';
const _esMensual = puesto => _PUESTOS_MENSUALES.includes(_normStr(puesto));

window.ViewInicio = function ViewInicio() {
  const [empData, setEmpData] = _us({ mensuales:0, quincenales:0, loaded:false });

  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(`${url}/empleados?select=desc_puesto&activo=eq.true`, {
      headers: { apikey:key, Authorization:`Bearer ${key}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const m = data.filter(e => _esMensual(e.desc_puesto)).length;
        setEmpData({ mensuales:m, quincenales:data.length-m, loaded:true });
      })
      .catch(() => {});
  }, []);

  const prod = D.produccion;
  const lastT = prod.toneladas[prod.toneladas.length - 1];
  const prevT = prod.toneladas[prod.toneladas.length - 2];
  const deltaT = (((lastT - prevT) / prevT) * 100).toFixed(1);

  const lastV = D.ventas.valores[D.ventas.valores.length - 1];
  const prevV = D.ventas.valores[D.ventas.valores.length - 2];
  const deltaV = (((lastV - prevV) / prevV) * 100).toFixed(1);

  return (
    <div className="fade-in">
      {/* KPIs */}
      <div className="g4 mb24">
        <Kpi icon="factory" label="Producción Mayo" value={`${lastT.toLocaleString('es-AR')} t`}
             delta={deltaT} note={`Obj. ${prod.objetivo} t`}
             progress={(lastT / prod.objetivo) * 100}
             sparkData={prod.toneladas.slice(-6)} />
        <Kpi icon="trend" label="Ventas Mayo" value={`$${lastV}M`}
             delta={deltaV} note="vs abril"
             sparkData={D.ventas.valores} color="#3ecf8e" />
        <Kpi icon="medal" label="Conformidad" value="96.5%"
             delta={0.3} note="Calidad / Inspección"
             sparkData={D.conformidad.conforme.slice(-6)} color="#5aa9f5" />
        <Kpi icon="users" label="Presentismo" value="96.5%"
             delta={-0.3} deltaUnit="%" note="vs mes anterior" inverse={true}
             sparkData={D.ausentismo.valores.map(v => 100 - v).slice(-6)} color="#f5b740" />
      </div>

      {/* Charts row */}
      <div className="g2 mb24">
        <Card title="Producción mensual (ton)" icon="factory">
          <div className="card-body" style={{ paddingBottom: 12 }}>
            <AreaChart data={prod.toneladas} labels={prod.meses}
                       height={200} objetivo={prod.objetivo} unit=" t" />
          </div>
        </Card>
        <Card title="Plantel · Modalidad de pago" icon="users">
          <div className="card-body" style={{ display:'flex', gap:24, alignItems:'center' }}>
            {!empData.loaded
              ? <div style={{ flex:1, textAlign:'center', color:'var(--t2)', fontSize:13,
                              padding:'24px 0' }}>Cargando...</div>
              : (() => {
                  const total = empData.mensuales + empData.quincenales;
                  const rows = [
                    { label:'Mensuales',   val:empData.mensuales,   color:'var(--accent)' },
                    { label:'Quincenales', val:empData.quincenales, color:'#5aa9f5'       },
                  ];
                  return (
                    <>
                      <DonutChart
                        segments={total===0
                          ? [{ valor:1, color:'var(--bd)' }]
                          : rows.map(r => ({ nombre:r.label, valor:r.val, color:r.color }))
                        }
                        size={160} thickness={24} centerLabel={`${total}`} />
                      <div style={{ flex:1 }}>
                        {rows.map(r => {
                          const pct = total===0 ? 0 : Math.round((r.val/total)*100);
                          return (
                            <div key={r.label} className="stat-row">
                              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                                <div style={{ width:8, height:8, borderRadius:'50%',
                                              background:r.color, flexShrink:0 }} />
                                <span className="stat-label f12">{r.label}</span>
                              </div>
                              <span style={{ fontSize:11, color:'var(--t3)',
                                             marginRight:10 }}>{pct}%</span>
                              <span className="stat-val">{r.val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()
            }
          </div>
        </Card>
      </div>

      {/* Obras + Feed */}
      <div className="g2">
        <Card title="Avance de obras" icon="layers">
          <div className="card-body-sm">
            {D.obras.map((o, i) => <ObraCard key={i} obra={o} />)}
          </div>
        </Card>
        <Card title="Novedades y alertas" icon="inbox">
          <div className="card-body-sm">
            {D.feed.map((item, i) => (
              <FeedItem key={i} {...item} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

/* =========================================================
   RRHH — datos en vivo desde Supabase
   ========================================================= */

const PUESTO_COLORS = ['#5aa9f5','#3ecf8e','#f5b740','#a78bfa','#fb923c','#ff7ab8','#34d399','#f2585d','#60c0dc','#c084fc','#fbbf24','#86efac','#f87171','#818cf8','#fdba74','#6ee7b7'];

function _colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PUESTO_COLORS[Math.abs(h) % PUESTO_COLORS.length];
}

/* Normaliza variantes del mismo puesto (ej: "Rrhh" y "RRHH" → "RRHH") */
function _normalizePuesto(name) {
  if (!name) return 'Sin puesto';
  const t = name.trim();
  if (t.toLowerCase() === 'rrhh') return 'RRHH';
  return t;
}

/* Puestos con liquidación mensual (el resto es quincenal) */
const MENSUALES_PUESTOS = new Set([
  'calidad', 'gerencia',
  'administracion', 'administración',
  'responsable de produccion', 'responsable de producción',
  'coordinacion de produccion', 'coordinación de producción', 'coordinación de produccion',
  'rrhh',
  'recepcion y despacho', 'recepción y despacho',
  'presupuestos', 'presupuesto',
  'seguridad & higiene', 'seguridad e higiene',
]);

const _MESES_ABR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function RRHHPanel({ onNavigate, empleados, loading }) {
  const [horas,        setHoras]        = _us(undefined); // undefined=cargando, null=sin datos, {..}=ok
  const [sabados,      setSabados]      = _us(null);
  const [loadingSab,   setLoadingSab]   = _us(true);

  /* ── Ausentismo / cumplimiento de horas (rrhh_horas_mensual — carga mensual manual) ── */
  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    const h = { apikey: key, Authorization: `Bearer ${key}` };
    fetch(`${url}/rrhh_horas_mensual?select=periodo&order=periodo.desc`, { headers: h })
      .then(r => r.json())
      .then(rows => {
        const periodos = [...new Set((Array.isArray(rows) ? rows : []).map(r => r.periodo))];
        if (!periodos.length) { setHoras(null); return; }
        const periodoActivo = periodos[0];
        return Promise.all([
          fetch(
            `${url}/rrhh_horas_mensual?periodo=eq.${periodoActivo}&select=dias_presentes,dias_ausentes_nojust,hs_esperadas,hs_normales,hs_extra50,hs_extra100`,
            { headers: h }
          ).then(r => r.json()),
          fetch(
            `${url}/rrhh_horas_detalle?periodo=eq.${periodoActivo}&or=(tipo_hora.eq.HSEXT,tipo_hora.eq.HSEXT50,tipo_hora.eq.HS%2050%20VAC)&select=fecha,hs_trabajadas`,
            { headers: h }
          ).then(r => r.json()).catch(() => []),
        ]).then(([datos, detalleExt50]) => {
          const rows2 = Array.isArray(datos) ? datos : [];
          const sum = f => rows2.reduce((s, d) => s + (Number(d[f]) || 0), 0);
          const diasPres   = sum('dias_presentes');
          const diasNojust = sum('dias_ausentes_nojust');
          const hsEsp      = sum('hs_esperadas');
          const hsNorm     = sum('hs_normales');

          let ext50Semana = 0, ext50Sabado = 0;
          (Array.isArray(detalleExt50) ? detalleExt50 : []).forEach(d => {
            const horasD = Number(d.hs_trabajadas) || 0;
            const esSabado = new Date(d.fecha + 'T00:00:00').getDay() === 6;
            if (esSabado) ext50Sabado += horasD; else ext50Semana += horasD;
          });

          setHoras({
            periodo:     periodoActivo,
            presentismo: (diasPres + diasNojust) > 0 ? (diasPres / (diasPres + diasNojust)) * 100 : null,
            cumplHoras:  hsEsp > 0 ? (hsNorm / hsEsp) * 100 : null,
            extra50:     sum('hs_extra50'),
            extra100:    sum('hs_extra100'),
            ext50Semana: Math.round(ext50Semana),
            ext50Sabado: Math.round(ext50Sabado),
          });
        });
      })
      .catch(() => setHoras(null));
  }, []);

  /* ── Cumplimiento de sábados/convocatorias (v_resumen_fecha — en vivo) ── */
  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(`${url}/v_resumen_fecha?order=fecha.desc&limit=12`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } })
      .then(r => r.json())
      .then(rows => { setSabados(Array.isArray(rows) ? [...rows].reverse() : []); setLoadingSab(false); })
      .catch(() => setLoadingSab(false));
  }, []);

  const _now       = new Date();
  const mesActual   = _now.getMonth() + 1;
  const anioActual  = _now.getFullYear();

  const activos = _um(() => empleados.filter(e => e.activo), [empleados]);
  const cimomet = activos.filter(e => e.empresa === 'CIMOMET').length;
  const comoing = activos.filter(e => e.empresa === 'COMOING').length;

  const antiguedadPromedio = _um(() => {
    const conIngreso = activos.filter(e => e.fecha_ingreso);
    if (!conIngreso.length) return null;
    const totalAnios = conIngreso.reduce((sum, e) => {
      const ingreso = new Date(e.fecha_ingreso + 'T00:00:00');
      return sum + (_now - ingreso) / (365.25 * 86400000);
    }, 0);
    return totalAnios / conIngreso.length;
  }, [activos]);

  const ingresosPorMes = _um(() => {
    const meses = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(anioActual, mesActual - 1 - i, 1);
      meses.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
                   label: `${_MESES_ABR[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` });
    }
    const counts = {};
    empleados.forEach(e => {
      if (!e.fecha_ingreso) return;
      const k = e.fecha_ingreso.slice(0, 7);
      counts[k] = (counts[k] || 0) + 1;
    });
    return { labels: meses.map(m => m.label), data: meses.map(m => counts[m.key] || 0) };
  }, [empleados, anioActual, mesActual]);

  const _pctReal = r => Math.min(100, Math.max(0, parseFloat(r.pct_cumplimiento || 0)));
  const sabChart = _um(() => {
    if (!sabados) return { labels: [], data: [] };
    return { labels: sabados.map(r => _fmtFecha(r.fecha)), data: sabados.map(_pctReal) };
  }, [sabados]);
  const sabCumplGlobal = sabados && sabados.length
    ? sabChart.data.reduce((s, v) => s + v, 0) / sabChart.data.length
    : null;

  const colorPct = (v, umbralOk = 95, umbralWarn = 90) =>
    v >= umbralOk ? 'var(--ok)' : v >= umbralWarn ? 'var(--warn)' : 'var(--err)';

  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <HubButton icon="external" title="Nexo RRHH"
                   subtitle="Portal de Recursos Humanos"
                   onClick={() => window.open('https://portal.cimomet.com.ar', '_blank')} />
        <HubButton icon="external" title="Tablero de RRHH"
                   subtitle="Gestión y seguimiento de personal — datos detallados"
                   onClick={() => window.open('https://nexorrhh.github.io/tablerorrhh/Tablero_RRHH/', '_blank')} />
      </div>

      <Card title="Plantel e ingresos" icon="userplus"
            action={
              <span className="f12 t2">
                <b>{loading ? '—' : activos.length}</b> activos
                {!loading && ` (${cimomet} CIMOMET · ${comoing} COMOING)`}
                {antiguedadPromedio !== null && <> · antigüedad promedio <b>{antiguedadPromedio.toFixed(1)} años</b></>}
              </span>
            }>
        <div className="card-body" style={{ paddingBottom:12 }}>
          <AreaChart data={ingresosPorMes.data} labels={ingresosPorMes.labels}
                     height={150} color="#3ecf8e" showDots />
        </div>
      </Card>

      <div style={{ fontSize:11, color:'var(--t3)', fontWeight:600, textTransform:'uppercase',
                    letterSpacing:'0.1em', margin:'24px 0 10px' }}>
        Ausentismo y horas
        {horas?.periodo && (
          <span style={{ textTransform:'none', letterSpacing:'normal', fontWeight:400 }}>
            {' '}· {(() => { const [y,m] = horas.periodo.split('-'); return `${_MESES_ABR[+m-1]} ${y}`; })()}
          </span>
        )}
      </div>
      {horas === undefined ? (
        <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>
          Cargando...
        </div>
      ) : horas === null ? (
        <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>
          Sin datos de horas cargados todavía este período — se cargan mensualmente en Tablero RRHH.
        </div>
      ) : (
        <div className="g4">
          <Kpi icon="heart" label="Presentismo (días)"
               value={horas.presentismo === null ? '—' : `${horas.presentismo.toFixed(1)}%`}
               note="días presente / laborables"
               color={horas.presentismo === null ? undefined : colorPct(horas.presentismo)} />
          <Kpi icon="check" label="Cumplimiento de horas"
               value={horas.cumplHoras === null ? '—' : `${horas.cumplHoras.toFixed(1)}%`}
               note="horas trabajadas / esperadas"
               color={horas.cumplHoras === null ? undefined : colorPct(horas.cumplHoras)} />
          <Kpi icon="trend" label="Horas extra 50%"
               value={`${horas.extra50.toFixed(0)}h`}
               note={`En semana: ${horas.ext50Semana}h · Sábados: ${horas.ext50Sabado}h`} color="#9b8cff" />
          <Kpi icon="alert" label="Horas extra 100%"
               value={`${horas.extra100.toFixed(0)}h`}
               note="del período" color={horas.extra100 > 0 ? 'var(--err)' : 'var(--t3)'} />
        </div>
      )}

      <div style={{ fontSize:11, color:'var(--t3)', fontWeight:600, textTransform:'uppercase',
                    letterSpacing:'0.1em', margin:'24px 0 10px' }}>
        Cumplimiento de convocatorias (sábados y feriados)
      </div>
      <div className="g2">
        <Kpi icon="trend" label="Cumplimiento global"
             value={loadingSab ? '—' : sabCumplGlobal === null ? '—' : `${sabCumplGlobal.toFixed(1)}%`}
             note="promedio últimos operativos"
             progress={sabCumplGlobal === null ? 0 : sabCumplGlobal}
             color={sabCumplGlobal === null ? undefined : _cumColor(sabCumplGlobal)} />
        <Card title="Últimos operativos (%)" icon="trend">
          <div className="card-body" style={{ paddingBottom:8 }}>
            {loadingSab ? (
              <div style={{ textAlign:'center', padding:'24px', color:'var(--t2)', fontSize:13 }}>Cargando...</div>
            ) : sabChart.data.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px', color:'var(--t2)', fontSize:13 }}>Sin operativos registrados.</div>
            ) : (
              <AreaChart data={sabChart.data} labels={sabChart.labels}
                         height={130} objetivo={80} color="#e0218a" unit="%"
                         showDots={sabChart.data.length <= 16} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function RRHHPlantel({ empleados, loading }) {
  const [empresa,    setEmpresa]    = _us('Todos');
  const [puesto,     setPuesto]     = _us('Todos');
  const [liquidacion,setLiquidacion]= _us('Todos');
  const [busqueda,   setBusqueda]   = _us('');

  const activos = _um(() => empleados.filter(e => e.activo), [empleados]);

  const puestosUnicos = _um(() => {
    const set = new Set(activos.map(e => _normalizePuesto(e.desc_puesto)).filter(p => p !== 'Sin puesto'));
    return ['Todos', ...Array.from(set).sort()];
  }, [activos]);

  const rows = _um(() => activos.filter(e => {
    const norm = _normalizePuesto(e.desc_puesto);
    if (empresa     !== 'Todos' && e.empresa !== empresa)  return false;
    if (puesto      !== 'Todos' && norm !== puesto)        return false;
    if (liquidacion === 'Mensuales'   && !MENSUALES_PUESTOS.has(norm.toLowerCase())) return false;
    if (liquidacion === 'Quincenales' &&  MENSUALES_PUESTOS.has(norm.toLowerCase())) return false;
    if (busqueda && !e.apellido_y_nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [activos, empresa, puesto, liquidacion, busqueda]);

  const donutSegments = _um(() => {
    const counts = {};
    activos.forEach(e => {
      const p = _normalizePuesto(e.desc_puesto);
      counts[p] = (counts[p] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.map(([nombre, valor], i) => ({
      nombre, valor, color: PUESTO_COLORS[i % PUESTO_COLORS.length]
    }));
  }, [activos]);

  const cimomet = activos.filter(e => e.empresa === 'CIMOMET').length;
  const comoing = activos.filter(e => e.empresa === 'COMOING').length;
  const puestosDistintos = _um(() =>
    new Set(activos.map(e => _normalizePuesto(e.desc_puesto)).filter(p => p !== 'Sin puesto')).size, [activos]);

  const hayFiltros = empresa !== 'Todos' || puesto !== 'Todos' || liquidacion !== 'Todos' || busqueda !== '';


  if (loading) return (
    <div className="fade-in card" style={{ textAlign:'center', padding:'48px', color:'var(--t2)' }}>
      Cargando plantel desde Supabase…
    </div>
  );

  return (
    <div className="fade-in">

      {/* ── KPIs ───────────────────────────────────── */}
      <div className="g4 mb24">
        <Kpi icon="users"     label="Plantel activo"
             value={String(activos.length)}
             note={`${cimomet} CIMOMET · ${comoing} COMOING`}
             progress={100} />
        <Kpi icon="factory"   label="CIMOMET"
             value={String(cimomet)}
             note={activos.length ? `${Math.round((cimomet/activos.length)*100)}% del total` : ''}
             progress={activos.length ? Math.round((cimomet/activos.length)*100) : 0}
             color="#5aa9f5" />
        <Kpi icon="layers"    label="COMOING"
             value={String(comoing)}
             note={activos.length ? `${Math.round((comoing/activos.length)*100)}% del total` : ''}
             progress={activos.length ? Math.round((comoing/activos.length)*100) : 0}
             color="#3ecf8e" />
        <Kpi icon="clipboard" label="Puestos distintos"
             value={String(puestosDistintos)}
             note="Categorías registradas" color="#a78bfa" />
      </div>

      {/* ── Gráficos ───────────────────────────────── */}
      <div className="g2 mb24">
        <Card title="Distribución por puesto" icon="pie">
          <div className="card-body" style={{ display:'flex', gap:28, alignItems:'flex-start' }}>
            <DonutChart segments={donutSegments} size={210} thickness={26} centerLabel="activos" />
            <div style={{ flex:1 }}>
              {donutSegments.map((s, i) => (
                <div key={i} className="stat-row"
                     style={{ cursor:'pointer', borderRadius:4, padding:'2px 4px',
                              background: puesto === s.nombre ? 'var(--sf3)' : 'transparent' }}
                     onClick={() => setPuesto(puesto === s.nombre ? 'Todos' : s.nombre === 'Otros' ? 'Todos' : s.nombre)}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                    <span className="stat-label f12">{s.nombre}</span>
                  </div>
                  <span className="stat-val">{s.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Distribución por empresa" icon="layers">
          <div className="card-body">
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span className="f12 t2">CIMOMET</span>
                <span className="f12">{cimomet} personas · {activos.length ? Math.round((cimomet/activos.length)*100) : 0}%</span>
              </div>
              <ProgBar value={cimomet} max={activos.length} color="#5aa9f5" />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span className="f12 t2">COMOING</span>
                <span className="f12">{comoing} personas · {activos.length ? Math.round((comoing/activos.length)*100) : 0}%</span>
              </div>
              <ProgBar value={comoing} max={activos.length} color="#3ecf8e" />
            </div>
            <div style={{ borderTop:'1px solid var(--bd)', paddingTop:16 }}>
              <div className="f12 t2" style={{ marginBottom:10 }}>Top 5 puestos</div>
              {donutSegments.slice(0, 5).map((s, i) => (
                <div key={i} className="stat-row">
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                    <span className="stat-label f12">{s.nombre}</span>
                  </div>
                  <span className="stat-val">{s.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Barra de filtros ───────────────────────── */}
      <div className="card" style={{ padding:'10px 16px', marginBottom:12 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom:8 }}>
          <FilterChips options={['Todos','CIMOMET','COMOING']}
                       active={empresa} onChange={setEmpresa} />
          <div style={{ borderLeft:'1px solid var(--bd)', paddingLeft:10 }}>
            <FilterChips options={['Todos','Mensuales','Quincenales']}
                         active={liquidacion} onChange={setLiquidacion} />
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
          <Select value={puesto} onChange={setPuesto} options={puestosUnicos} />
          <div style={{ flex:1, minWidth:180 }}>
            <input type="text" placeholder="Buscar por nombre…"
                   value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          {hayFiltros && (
            <button onClick={() => { setEmpresa('Todos'); setPuesto('Todos'); setLiquidacion('Todos'); setBusqueda(''); }}
                    style={{ fontSize:11, color:'var(--t2)', background:'none', border:'none',
                             cursor:'pointer', padding:'2px 6px', whiteSpace:'nowrap' }}>
              ✕ limpiar
            </button>
          )}
          <span className="f12 t2" style={{ marginLeft:'auto', whiteSpace:'nowrap' }}>
            {rows.length} de {activos.length} personas
          </span>
        </div>
      </div>

      {/* ── Tabla ──────────────────────────────────── */}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th></th>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Puesto</th>
              <th>Legajo</th>
              <th>CUIL</th>
            </tr></thead>
            <tbody>
              {rows.map(e => (
                <tr key={e.id}>
                  <td style={{ width:40 }}>
                    <Avatar nombre={e.apellido_y_nombre} color={_colorFromName(e.apellido_y_nombre)} />
                  </td>
                  <td className="cell-strong">{e.apellido_y_nombre}</td>
                  <td><Badge>{e.empresa}</Badge></td>
                  <td className="t2">{_normalizePuesto(e.desc_puesto)}</td>
                  <td className="cell-id">{e.legajo}</td>
                  <td className="t3 f12">{e.cuil}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>
                  No hay resultados para los filtros aplicados.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* helpers privados del módulo de sábados */
function _fmtFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}
function _turno(m, t) {
  if (m && t) return 'Ambos';
  if (m)      return '07 a 12';
  if (t)      return '12 a 16';
  return '—';
}
function _cumColor(pct) {
  if (pct >= 80) return '#3ecf8e';
  if (pct >= 60) return '#f5b740';
  return '#f2585d';
}
function _tipoLabel(tipo) {
  if (tipo === 'Sabado') return 'Sábado';
  return tipo;
}

const MESES_ES = {
  '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril',
  '05':'Mayo','06':'Junio','07':'Julio','08':'Agosto',
  '09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre'
};


function RRHHSabados() {
  const [resumen,    setResumen]    = _us([]);
  const [citMap,     setCitMap]     = _us({});
  const [loading,    setLoading]    = _us(true);
  const [tipoFiltro, setTipoFiltro] = _us('Todos');
  const [año,        setAño]        = _us(String(new Date().getFullYear()));
  const [mes,        setMes]        = _us('Todos');
  const [selected,   setSelected]   = _us(null);
  const [detalle,    setDetalle]    = _us(null);
  const [loadDet,    setLoadDet]    = _us(false);

  /* ── carga inicial ─────────────────────────── */
  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    const h = { apikey: key, Authorization: `Bearer ${key}` };
    Promise.all([
      fetch(`${url}/v_resumen_fecha?order=fecha.desc`, { headers: h }).then(r => r.json()),
      fetch(`${url}/citaciones?select=id,fecha,tipo`,  { headers: h }).then(r => r.json()),
    ]).then(([res, cits]) => {
      setResumen(Array.isArray(res) ? res : []);
      const map = {};
      if (Array.isArray(cits)) cits.forEach(c => { map[`${c.fecha}__${c.tipo}`] = c.id; });
      setCitMap(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ── carga detalle ───────────────────────── */
  _ue(() => {
    if (!selected) { setDetalle(null); return; }
    setLoadDet(true);
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(
      `${url}/citacion_detalle?citacion_id=eq.${selected.citacion_id}&order=apellido_y_nombre`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
      .then(r => r.json())
      .then(data => { setDetalle(Array.isArray(data) ? data : []); setLoadDet(false); })
      .catch(() => setLoadDet(false));
  }, [selected]);

  /* ── KPIs globales (todo el historial) ─────── */
  /* La vista puede devolver pct_cumplimiento > 100 por datos edge-case;
     lo capeamos en 100 ya que el máximo teórico es presentes/convocados = 1 */
  const _pctReal = (r) => Math.min(100, Math.max(0, parseFloat(r.pct_cumplimiento || 0)));

  const sabCount       = resumen.filter(r => r.tipo === 'Sabado').length;
  const otrosCount     = resumen.filter(r => r.tipo !== 'Sabado').length;
  const cumGlobal      = resumen.length
    ? (resumen.reduce((s, r) => s + _pctReal(r), 0) / resumen.length).toFixed(1)
    : null;
  const totalPresentes = resumen.reduce((s, r) => s + (r.presentes || 0), 0);
  const totalAusentes  = resumen.reduce((s, r) => s + (r.ausentes  || 0), 0);

  /* ── datos para gráficos (ascendente, sin filtro) ── */
  const chartData = _um(() => {
    const sorted = [...resumen].sort((a, b) => a.fecha.localeCompare(b.fecha));
    return {
      labels:       sorted.map(r => _fmtFecha(r.fecha)),
      cumplimiento: sorted.map(r => _pctReal(r)),
      presentes:    sorted.map(r => r.presentes || 0),
    };
  }, [resumen]);

  /* ── selectores año / mes ──────────────────── */
  const años = _um(() => {
    const set = new Set(resumen.map(r => r.fecha.slice(0, 4)));
    return ['Todos', ...Array.from(set).sort().reverse()];
  }, [resumen]);

  const mesesDisp = _um(() => {
    if (año === 'Todos') return [];
    const nums = new Set(
      resumen.filter(r => r.fecha.startsWith(año)).map(r => r.fecha.slice(5, 7))
    );
    return Array.from(nums).sort();
  }, [resumen, año]);

  const handleAño = (val) => { setAño(val); setMes('Todos'); };

  /* ── filas filtradas ───────────────────────── */
  const filas = _um(() => resumen.filter(r => {
    if (tipoFiltro === 'Sábados'         && r.tipo !== 'Sabado') return false;
    if (tipoFiltro === 'Dom. y Feriados' && r.tipo === 'Sabado') return false;
    if (año !== 'Todos' && !r.fecha.startsWith(año))             return false;
    if (mes !== 'Todos' && r.fecha.slice(5, 7) !== mes)          return false;
    return true;
  }), [resumen, tipoFiltro, año, mes]);

  const handleFila = (r) => {
    const cid = citMap[`${r.fecha}__${r.tipo}`];
    if (!cid) return;
    setSelected({ fecha: r.fecha, tipo: r.tipo, citacion_id: cid });
  };

  /* ── separación en detalle ───────────────── */
  const citados      = (detalle || []).filter(d => d.situacion !== 'No convocado');
  const noConvocados = (detalle || []).filter(d => d.situacion === 'No convocado');

  const selCumPct = selected && resumen.find(r => r.fecha === selected.fecha && r.tipo === selected.tipo);

  if (loading) return (
    <div className="fade-in card" style={{ textAlign:'center', padding:'48px', color:'var(--t2)' }}>
      Cargando operativos desde Supabase…
    </div>
  );

  return (
    <div className="fade-in">

      {/* ── KPIs globales ────────────────────── */}
      <div className="g4 mb24">
        <Kpi icon="calendar" label="Operativos totales"
             value={String(resumen.length)}
             note={`${sabCount} sábados · ${otrosCount} dom./feriados`} />
        <Kpi icon="trend"    label="Cumplimiento global"
             value={cumGlobal ? `${cumGlobal}%` : '—'}
             note="Promedio histórico"
             progress={cumGlobal ? parseFloat(cumGlobal) : 0}
             color={cumGlobal ? _cumColor(parseFloat(cumGlobal)) : undefined} />
        <Kpi icon="check"    label="Presentes acum."
             value={totalPresentes.toLocaleString('es-AR')}
             note="Total histórico" color="#3ecf8e" />
        <Kpi icon="alert"    label="Ausentes acum."
             value={totalAusentes.toLocaleString('es-AR')}
             note="Total histórico" color="#f2585d" />
      </div>

      {/* ── Gráficos históricos ───────────────── */}
      <div className="g2 mb24">
        <Card title="Cumplimiento histórico (%)" icon="trend">
          <div className="card-body" style={{ paddingBottom:12 }}>
            <AreaChart
              data={chartData.cumplimiento}
              labels={chartData.labels}
              height={180}
              objetivo={80}
              color="#e0218a"
              unit="%"
              showDots={chartData.cumplimiento.length <= 16} />
          </div>
        </Card>
        <Card title="Presentes por operativo" icon="users">
          <div className="card-body" style={{ paddingBottom:12 }}>
            <AreaChart
              data={chartData.presentes}
              labels={chartData.labels}
              height={180}
              color="#3ecf8e"
              showDots={chartData.presentes.length <= 16} />
          </div>
        </Card>
      </div>

      {/* ── Filtros ───────────────────────────── */}
      <div className="card" style={{ padding:'10px 16px', marginBottom:12,
                                     display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <FilterChips options={['Todos','Sábados','Dom. y Feriados']}
                     active={tipoFiltro}
                     onChange={v => { setTipoFiltro(v); }} />
        <div style={{ borderLeft:'1px solid var(--bd)', paddingLeft:12, display:'flex', gap:8 }}>
          <Select
            value={año}
            onChange={handleAño}
            options={años.map(a => ({ val: a, label: a === 'Todos' ? 'Todo el historial' : a }))}
          />
          {año !== 'Todos' && (
            <Select
              value={mes}
              onChange={setMes}
              options={[
                { val: 'Todos', label: 'Todos los meses' },
                ...mesesDisp.map(m => ({ val: m, label: MESES_ES[m] || m }))
              ]}
            />
          )}
        </div>
        <span className="f12 t2" style={{ marginLeft:'auto', whiteSpace:'nowrap' }}>
          {filas.length} operativo{filas.length !== 1 ? 's' : ''} · clic para ver detalle
        </span>
      </div>

      {/* ── Tabla de operativos ──────────────── */}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Fecha</th>
              <th>Día</th>
              <th>Tipo</th>
              <th style={{ textAlign:'right' }}>Convocados</th>
              <th style={{ textAlign:'right' }}>Presentes</th>
              <th style={{ textAlign:'right' }}>Ausentes</th>
              <th style={{ textAlign:'right' }}>No convoc.</th>
              <th style={{ minWidth:150 }}>Cumplimiento</th>
            </tr></thead>
            <tbody>
              {filas.map((r, i) => {
                const pct      = _pctReal(r);
                const cumColor = _cumColor(pct);
                return (
                  <tr key={i} onClick={() => handleFila(r)} style={{ cursor:'pointer' }}>
                    <td className="cell-strong">{_fmtFecha(r.fecha)}</td>
                    <td className="t2 f12">{r.dia_semana}</td>
                    <td><Badge tipo={r.tipo}>{_tipoLabel(r.tipo)}</Badge></td>
                    <td className="cell-num">{r.convocados}</td>
                    <td className="cell-num" style={{ color:'#3ecf8e', fontWeight:600 }}>{r.presentes}</td>
                    <td className="cell-num" style={{ color: r.ausentes > 0 ? '#f2585d' : 'var(--t2)' }}>{r.ausentes}</td>
                    <td className="cell-num t2">{r.no_convocados}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:6, borderRadius:3, background:'var(--sf3)' }}>
                          <div style={{ width:`${Math.min(100, pct)}%`, height:'100%',
                                        borderRadius:3, background:cumColor, transition:'width .3s' }} />
                        </div>
                        <span style={{ fontSize:11, color:cumColor, fontWeight:600,
                                       whiteSpace:'nowrap', minWidth:36, textAlign:'right' }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>
                  No hay operativos para los filtros seleccionados.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de detalle ─────────────────── */}
      {selected && (
        <div onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
             style={{ position:'fixed', inset:0, zIndex:1000,
                      background:'rgba(0,0,0,0.72)', backdropFilter:'blur(3px)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      padding:24 }}>
          <div style={{ background:'var(--sf1)', border:'1px solid var(--bd)',
                        borderRadius:12, width:'100%', maxWidth:980, maxHeight:'88vh',
                        display:'flex', flexDirection:'column', overflow:'hidden',
                        boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>

            {/* cabecera del modal */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'16px 20px', borderBottom:'1px solid var(--bd)',
                          flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Badge tipo={selected.tipo}>{_tipoLabel(selected.tipo)}</Badge>
                <span style={{ fontWeight:600, fontSize:15 }}>{_fmtFecha(selected.fecha)}</span>
                {!loadDet && detalle && selCumPct && (
                  <span style={{ fontSize:12, color: _cumColor(_pctReal(selCumPct)),
                                 fontWeight:700 }}>
                    {_pctReal(selCumPct).toFixed(1)}% cumplimiento
                  </span>
                )}
                {!loadDet && detalle && (
                  <span className="f12 t2">
                    · {citados.length} citados
                    {noConvocados.length > 0 && ` · ${noConvocados.length} sin citar`}
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                      style={{ background:'var(--sf2)', border:'none',
                               borderRadius:6, cursor:'pointer', color:'inherit',
                               width:28, height:28, fontSize:16, display:'flex',
                               alignItems:'center', justifyContent:'center' }}>
                ×
              </button>
            </div>

            {/* contenido scrolleable */}
            <div style={{ overflowY:'auto', flex:1 }}>
              {loadDet ? (
                <div style={{ textAlign:'center', padding:'48px', color:'var(--t2)' }}>
                  Cargando detalle…
                </div>
              ) : (
                <>
                  {/* ── Citados ── */}
                  <div style={{ padding:'14px 20px 6px', fontSize:11, fontWeight:700,
                                letterSpacing:'0.1em', color:'var(--t3)' }}>
                    CITADOS ({citados.length})
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--bd)' }}>
                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                     color:'var(--t3)', fontWeight:500, width:48 }}></th>
                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                     color:'var(--t3)', fontWeight:500 }}>Nombre</th>
                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                     color:'var(--t3)', fontWeight:500 }}>Empresa</th>
                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                     color:'var(--t3)', fontWeight:500 }}>Puesto</th>
                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                     color:'var(--t3)', fontWeight:500 }}>Turno</th>
                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                     color:'var(--t3)', fontWeight:500 }}>Situación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citados.map(d => (
                        <tr key={d.id}
                            style={{ borderBottom:'1px solid var(--bd)' }}>
                          <td style={{ padding:'8px 12px' }}>
                            <Avatar nombre={d.apellido_y_nombre}
                                    color={_colorFromName(d.apellido_y_nombre)} />
                          </td>
                          <td style={{ padding:'8px 12px', fontWeight:600, fontSize:13 }}>
                            {d.apellido_y_nombre}
                          </td>
                          <td style={{ padding:'8px 12px' }}><Badge>{d.empresa}</Badge></td>
                          <td style={{ padding:'8px 12px', fontSize:12, color:'var(--t2)' }}>
                            {d.desc_puesto}
                          </td>
                          <td style={{ padding:'8px 12px', fontSize:12 }}>
                            {_turno(d.turno_manana, d.turno_tarde)}
                          </td>
                          <td style={{ padding:'8px 12px' }}><Badge>{d.situacion}</Badge></td>
                        </tr>
                      ))}
                      {citados.length === 0 && (
                        <tr><td colSpan={6}
                                style={{ padding:'24px', textAlign:'center',
                                         color:'var(--t3)', fontSize:13 }}>
                          Sin citados en este operativo.
                        </td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* ── No convocados ── */}
                  {noConvocados.length > 0 && (
                    <>
                      <div style={{ margin:'8px 0 0', padding:'14px 20px 6px',
                                    fontSize:11, fontWeight:700, letterSpacing:'0.1em',
                                    color:'var(--t3)',
                                    borderTop:'1px solid var(--bd)' }}>
                        SIN CITAR — Presentados fuera de nómina ({noConvocados.length})
                      </div>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom:'1px solid var(--bd)' }}>
                            <th style={{ padding:'8px 12px', width:48 }}></th>
                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                         color:'var(--t3)', fontWeight:500 }}>Nombre</th>
                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                         color:'var(--t3)', fontWeight:500 }}>Empresa</th>
                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                                         color:'var(--t3)', fontWeight:500 }}>Puesto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {noConvocados.map(d => (
                            <tr key={d.id}
                                style={{ borderBottom:'1px solid var(--bd)' }}>
                              <td style={{ padding:'8px 12px' }}>
                                <Avatar nombre={d.apellido_y_nombre}
                                        color={_colorFromName(d.apellido_y_nombre)} />
                              </td>
                              <td style={{ padding:'8px 12px', fontWeight:600, fontSize:13 }}>
                                {d.apellido_y_nombre}
                              </td>
                              <td style={{ padding:'8px 12px' }}><Badge>{d.empresa}</Badge></td>
                              <td style={{ padding:'8px 12px', fontSize:12,
                                           color:'var(--t2)' }}>
                                {d.desc_puesto}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRESENTISMO Y HORAS (rrhh_horas_mensual — carga manual mensual,
   se hace desde Tablero RRHH. Acá solo se lee y se muestra.)
   ========================================================= */
const _EMPRESAS_PRES  = ['CIMOMET', 'COMOING'];
const _EMP_COLOR_PRES = { CIMOMET: '#5aa9f5', COMOING: '#3ecf8e' };
const _EMP_LABEL_PRES = { CIMOMET: 'Cimomet', COMOING: 'Co.mo.ing' };
const _thStylePres = { padding:'8px 12px', textAlign:'left', fontSize:11, color:'var(--t3)', fontWeight:500 };

function _fmtPeriodo(p) { const [y, m] = p.split('-'); return `${_MESES_ABR[+m - 1]} ${y}`; }
function _fmtNumPres(n) { return Math.round(n || 0).toLocaleString('es-AR'); }

async function _fetchPaginadoPres(url, headers) {
  const PAGE = 1000;
  let offset = 0, out = [];
  for (;;) {
    const sep = url.includes('?') ? '&' : '?';
    const r = await fetch(`${url}${sep}limit=${PAGE}&offset=${offset}`, { headers });
    if (!r.ok) break;
    const rows = await r.json();
    if (!Array.isArray(rows)) break;
    out = out.concat(rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

function _tipoPuestoPres(descPuesto, mapa) {
  return mapa.get((descPuesto || '').trim()) || 'sin_asignar';
}

function _colorAltoPres(v, okMin, warnMin) {
  return v == null ? 'var(--t3)' : v >= okMin ? 'var(--ok)' : v >= warnMin ? 'var(--warn)' : 'var(--err)';
}
function _colorIdxAusPres(v) {
  return v == null ? 'var(--t3)' : v < 5 ? 'var(--ok)' : v < 8 ? 'var(--warn)' : 'var(--err)';
}

function _calcularGrupoPresentismo(rows, allPeriodos, activosSet) {
  const agg = new Map();
  rows.forEach(d => {
    const emp = _EMPRESAS_PRES.includes(d.empresa) ? d.empresa : null;
    if (!emp) return;
    const k = `${d.periodo}|${emp}`;
    if (!agg.has(k)) agg.set(k, { hs_norm: 0, hs_esp: 0, ext50: 0, ext100: 0, hs_aus: 0, dias_pres: 0, dias_nojust: 0 });
    const v = agg.get(k);
    v.hs_norm += +d.hs_normales || 0;
    v.ext50   += +d.hs_extra50  || 0;
    v.ext100  += +d.hs_extra100 || 0;
    if ((+d.hs_esperadas || 0) > 0) {
      v.hs_esp     += +d.hs_esperadas         || 0;
      v.hs_aus     += +d.hs_ausencias         || 0;
      v.dias_pres   += +d.dias_presentes       || 0;
      v.dias_nojust += +d.dias_ausentes_nojust || 0;
    }
  });
  const get = (p, e, f) => agg.get(`${p}|${e}`)?.[f] || 0;

  const horasCIM  = allPeriodos.map(p => Math.round(get(p, 'CIMOMET', 'hs_norm')));
  const horasCOM  = allPeriodos.map(p => Math.round(get(p, 'COMOING', 'hs_norm')));
  const horasTot  = allPeriodos.map((_, i) => horasCIM[i] + horasCOM[i]);
  const ausPct    = allPeriodos.map(p => {
    let trab = 0, aus = 0;
    _EMPRESAS_PRES.forEach(e => { trab += get(p, e, 'hs_norm'); aus += get(p, e, 'hs_aus'); });
    return trab + aus > 0 ? +((aus / (trab + aus)) * 100).toFixed(1) : 0;
  });
  const espTot    = allPeriodos.map(p => Math.round(_EMPRESAS_PRES.reduce((s, e) => s + get(p, e, 'hs_esp'), 0)));
  const ext50Tot  = allPeriodos.map(p => Math.round(_EMPRESAS_PRES.reduce((s, e) => s + get(p, e, 'ext50'), 0)));
  const ext100Tot = allPeriodos.map(p => Math.round(_EMPRESAS_PRES.reduce((s, e) => s + get(p, e, 'ext100'), 0)));
  const cumplPct  = allPeriodos.map((_, i) => espTot[i] > 0 ? +((horasTot[i] / espTot[i]) * 100).toFixed(1) : 0);
  const diasPresPorPeriodo   = allPeriodos.map(p => _EMPRESAS_PRES.reduce((s, e) => s + get(p, e, 'dias_pres'), 0));
  const diasNojustPorPeriodo = allPeriodos.map(p => _EMPRESAS_PRES.reduce((s, e) => s + get(p, e, 'dias_nojust'), 0));
  const presPctPorPeriodo    = allPeriodos.map((_, i) =>
    (diasPresPorPeriodo[i] + diasNojustPorPeriodo[i]) > 0
      ? +((diasPresPorPeriodo[i] / (diasPresPorPeriodo[i] + diasNojustPorPeriodo[i])) * 100).toFixed(1) : 0);

  const validRows = rows.filter(d => _EMPRESAS_PRES.includes(d.empresa));
  const totalTrab       = validRows.reduce((s, d) => s + (+d.hs_normales || 0), 0);
  const totalAus        = validRows.reduce((s, d) => (+d.hs_esperadas || 0) > 0 ? s + (+d.hs_ausencias || 0) : s, 0);
  const totalEsp        = validRows.reduce((s, d) => s + (+d.hs_esperadas || 0), 0);
  const totalExt50      = validRows.reduce((s, d) => s + (+d.hs_extra50 || 0), 0);
  const totalExt100     = validRows.reduce((s, d) => s + (+d.hs_extra100 || 0), 0);
  const totalDiasPres   = validRows.reduce((s, d) => (+d.hs_esperadas || 0) > 0 ? s + (+d.dias_presentes || 0) : s, 0);
  const totalDiasNojust = validRows.reduce((s, d) => (+d.hs_esperadas || 0) > 0 ? s + (+d.dias_ausentes_nojust || 0) : s, 0);

  const idxAus       = totalTrab + totalAus > 0 ? +((totalAus / (totalTrab + totalAus)) * 100).toFixed(1) : null;
  const cumplimiento = totalEsp > 0 ? +((totalTrab / totalEsp) * 100).toFixed(1) : null;
  const presGlobal   = (totalDiasPres + totalDiasNojust) > 0 ? +((totalDiasPres / (totalDiasPres + totalDiasNojust)) * 100).toFixed(1) : null;

  const totCIM = horasCIM.reduce((s, v) => s + v, 0);
  const totCOM = horasCOM.reduce((s, v) => s + v, 0);
  const legajosPeriodo   = new Set(validRows.map(d => d.legajo));
  const empleadosPeriodo = legajosPeriodo.size;
  const empleadosActivos = activosSet ? [...legajosPeriodo].filter(l => activosSet.has(String(l))).length : empleadosPeriodo;

  return {
    horasCIM, horasCOM, horasTot, ausPct, espTot, ext50Tot, ext100Tot, cumplPct, presPctPorPeriodo,
    totalTrab, totalAus, totalEsp, totalExt50, totalExt100,
    idxAus, cumplimiento, presGlobal,
    colorIdx: _colorIdxAusPres(idxAus), colorCumpl: _colorAltoPres(cumplimiento, 95, 90), colorPres: _colorAltoPres(presGlobal, 95, 90),
    totCIM, totCOM, totGen: totCIM + totCOM,
    empleadosPeriodo, empleadosActivos, empleadosDesvinculados: empleadosPeriodo - empleadosActivos,
    totalDiasPres, diasPresPorPeriodo,
  };
}

function _resumenTardanzasPres(rawTardGroup, periodos) {
  const filas = rawTardGroup.filter(t => periodos.includes(t.periodo));
  const diasTarde    = filas.filter(t => t.tipo === 'tarde').length;
  const diasTemprano = filas.filter(t => t.tipo === 'temprano').length;
  const diasConIncidente = new Set(filas.map(t => `${t.legajo}|${t.fecha}`)).size;
  return { diasTarde, diasTemprano, diasConIncidente };
}

function _puntualidadPorPeriodo(rawTardGroup, allPeriodos, diasPresPorPeriodo) {
  return allPeriodos.map((p, i) => {
    if (!diasPresPorPeriodo[i]) return 0;
    const diasConIncidente = new Set(
      rawTardGroup.filter(t => t.periodo === p).map(t => `${t.legajo}|${t.fecha}`)
    ).size;
    return +(((diasPresPorPeriodo[i] - diasConIncidente) / diasPresPorPeriodo[i]) * 100).toFixed(1);
  });
}

function _desgloseExt50Pres(detalle, legajosSet, periodos) {
  let semana = 0, sabado = 0;
  detalle.forEach(d => {
    if (!legajosSet.has(String(d.legajo))) return;
    if (periodos && !periodos.includes(d.periodo)) return;
    const horas = +d.hs_trabajadas || 0;
    const esSabado = new Date(d.fecha + 'T00:00:00').getDay() === 6;
    if (esSabado) sabado += horas; else semana += horas;
  });
  return { semana: Math.round(semana), sabado: Math.round(sabado) };
}

function _buildDepStatsPres(rawGroup, periodo) {
  const rows = rawGroup.filter(d => d.periodo === periodo && _EMPRESAS_PRES.includes(d.empresa));
  const porDep = new Map();
  rows.forEach(d => {
    const dep = d.departamento || 'Sin sector';
    if (!porDep.has(dep)) porDep.set(dep, { diasPres: 0, diasNojust: 0, hsNorm: 0, hsEsp: 0, ext50: 0, ext100: 0, count: 0 });
    const x = porDep.get(dep);
    x.diasPres   += +d.dias_presentes       || 0;
    x.diasNojust += +d.dias_ausentes_nojust || 0;
    x.hsNorm     += +d.hs_normales          || 0;
    x.hsEsp      += +d.hs_esperadas         || 0;
    x.ext50      += +d.hs_extra50           || 0;
    x.ext100     += +d.hs_extra100          || 0;
    x.count++;
  });
  return [...porDep.entries()].map(([dep, v]) => ({
    dep,
    pres: (v.diasPres + v.diasNojust) > 0 ? +((v.diasPres / (v.diasPres + v.diasNojust)) * 100).toFixed(1) : 100,
    ext50: +v.ext50.toFixed(1), ext100: +v.ext100.toFixed(1), count: v.count,
  })).sort((a, b) => a.pres - b.pres);
}

function _filasAusentismoPres(rawGroup, periodos, filtroEmpresa, activosSet) {
  return rawGroup
    .filter(d => periodos.includes(d.periodo) && _EMPRESAS_PRES.includes(d.empresa)
                 && (!filtroEmpresa || d.empresa === filtroEmpresa) && (+d.hs_esperadas || 0) > 0)
    .map(d => {
      const total = +d.hs_ausencias || 0;
      const just  = Math.min(+d.hs_justificadas || 0, total);
      return {
        legajo: d.legajo, periodo: d.periodo,
        nombre: `${d.apellido || ''}, ${d.nombre || ''}`.trim().replace(/^,\s*/, ''),
        sector: d.departamento || '—', empresa: d.empresa,
        just, nojust: total - just, total,
        activo: !activosSet || activosSet.has(String(d.legajo)),
      };
    })
    .filter(d => Math.round(d.total) > 0)
    .sort((a, b) => b.total - a.total);
}

function _filasTardanzasPres(rawGroup, rawTardGroup, periodos, filtroEmpresa, activosSet) {
  const personaPorLegajo = new Map();
  rawGroup.forEach(d => {
    if (!periodos.includes(d.periodo)) return;
    personaPorLegajo.set(String(d.legajo), {
      nombre: `${d.apellido || ''}, ${d.nombre || ''}`.trim().replace(/^,\s*/, ''),
      sector: d.departamento || '—', empresa: d.empresa,
    });
  });
  const eventosPorLegajo = new Map();
  rawTardGroup.filter(t => periodos.includes(t.periodo)).forEach(t => {
    const key = String(t.legajo);
    if (!eventosPorLegajo.has(key)) eventosPorLegajo.set(key, []);
    eventosPorLegajo.get(key).push({ tipo: t.tipo, fecha: t.fecha, periodo: t.periodo,
      minutos: +t.minutos || 0, justificacion: t.descripcion_justificacion || '' });
  });
  return [...eventosPorLegajo.entries()].map(([legajo, eventos]) => {
    const p = personaPorLegajo.get(legajo);
    if (!p || (filtroEmpresa && p.empresa !== filtroEmpresa)) return null;
    return {
      legajo, nombre: p.nombre, sector: p.sector, empresa: p.empresa,
      diasTarde: eventos.filter(e => e.tipo === 'tarde').length,
      diasTemprano: eventos.filter(e => e.tipo === 'temprano').length,
      eventos: [...eventos].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      activo: !activosSet || activosSet.has(legajo),
    };
  }).filter(Boolean).sort((a, b) => (b.diasTarde + b.diasTemprano) - (a.diasTarde + a.diasTemprano));
}

function _exportarExcelPres(nombreArchivo, hojas) {
  if (typeof XLSX === 'undefined') { alert('La librería de Excel no está disponible. Verificá la conexión a internet.'); return; }
  const wb = XLSX.utils.book_new();
  hojas.forEach(({ nombre, filas }) => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), nombre);
  });
  XLSX.writeFile(wb, nombreArchivo);
}

function _Leyenda({ items }) {
  return (
    <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:4, flexWrap:'wrap' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--t2)' }}>
          <div style={{ width:9, height:9, borderRadius:2, background:it.c, flexShrink:0 }} />
          {it.l}
        </div>
      ))}
    </div>
  );
}

function _FilaAusentismo({ d, expandido, onToggle }) {
  const [dias, setDias] = _us(null);
  const [loadingDias, setLoadingDias] = _us(false);

  const abrir = () => {
    onToggle();
    if (!expandido && dias === null) {
      setLoadingDias(true);
      const { url, key } = window.SUPABASE_CONFIG;
      fetch(`${url}/rrhh_horas_detalle?legajo=eq.${d.legajo}&periodo=eq.${d.periodo}&tipo_hora=eq.HSNOR&select=fecha,descripcion_tipo_hora,hs_reales,hs_esperadas,hs_justificadas,hs_no_justificadas&order=fecha.asc`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } })
        .then(r => r.json())
        .then(rows => { setDias(Array.isArray(rows) ? rows : []); setLoadingDias(false); })
        .catch(() => { setDias([]); setLoadingDias(false); });
    }
  };

  const conAus = (dias || []).filter(x => (+x.hs_reales || 0) < 0.005 && (+x.hs_esperadas || 0) > 0.005);

  return (
    <>
      <tr onClick={abrir} style={{ cursor:'pointer', borderBottom:'1px solid var(--bd)', opacity: d.activo ? 1 : 0.55 }}>
        <td style={{ padding:'8px 12px', fontSize:11, color:'var(--t3)' }}>{expandido ? '▾' : '▸'}</td>
        <td style={{ padding:'8px 12px' }}>
          <span style={{ fontWeight:600, fontSize:13 }}>{d.nombre || d.legajo}</span>
          <span style={{ marginLeft:6, fontSize:11, color:'var(--t3)' }}>{d.legajo}</span>
          {!d.activo && <span style={{ marginLeft:6, fontSize:10, color:'var(--t3)', fontStyle:'italic' }}>desvinculado</span>}
        </td>
        <td style={{ padding:'8px 12px', fontSize:12, color:_EMP_COLOR_PRES[d.empresa] }}>{_EMP_LABEL_PRES[d.empresa] || d.empresa}</td>
        <td style={{ padding:'8px 12px', textAlign:'right', fontSize:12, color: d.just > 0 ? 'var(--warn)' : 'var(--t3)' }}>{d.just > 0 ? _fmtNumPres(d.just) : '—'}</td>
        <td style={{ padding:'8px 12px', textAlign:'right', fontSize:12, color: d.nojust > 0 ? 'var(--err)' : 'var(--t3)' }}>{d.nojust > 0 ? _fmtNumPres(d.nojust) : '—'}</td>
        <td style={{ padding:'8px 12px', textAlign:'right', fontSize:12, fontWeight:600 }}>{_fmtNumPres(d.total)}</td>
      </tr>
      {expandido && (
        <tr>
          <td colSpan={6} style={{ padding:0, background:'var(--sf2)' }}>
            {loadingDias ? (
              <div style={{ padding:'12px 20px', fontSize:12, color:'var(--t2)' }}>Cargando días…</div>
            ) : !conAus.length ? (
              <div style={{ padding:'12px 20px', fontSize:12, color:'var(--t2)' }}>Sin días con ausentismo en este período.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  <th style={{ ..._thStylePres, padding:'6px 20px' }}>Fecha</th>
                  <th style={_thStylePres}>Tipo de novedad</th>
                  <th style={{ ..._thStylePres, textAlign:'right' }}>Hs. Just.</th>
                  <th style={{ ..._thStylePres, textAlign:'right' }}>Hs. No just.</th>
                </tr></thead>
                <tbody>
                  {conAus.map((x, i) => (
                    <tr key={i}>
                      <td style={{ padding:'6px 20px', fontSize:12 }}>{_fmtFecha(x.fecha)}</td>
                      <td style={{ padding:'6px 12px', fontSize:12, color:'var(--t2)' }}>{x.descripcion_tipo_hora || '—'}</td>
                      <td style={{ padding:'6px 12px', textAlign:'right', fontSize:12, color: (+x.hs_justificadas || 0) > 0 ? 'var(--warn)' : 'var(--t3)' }}>
                        {(+x.hs_justificadas || 0) > 0.005 ? _fmtNumPres(x.hs_justificadas) : '—'}
                      </td>
                      <td style={{ padding:'6px 12px', textAlign:'right', fontSize:12, color: (+x.hs_no_justificadas || 0) > 0 ? 'var(--err)' : 'var(--t3)' }}>
                        {(+x.hs_no_justificadas || 0) > 0.005 ? _fmtNumPres(x.hs_no_justificadas) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function _ModalAusentismo({ rawGroup, allPeriodos, periodoInicial, activosSet, nombreGrupo, onClose }) {
  const [periodo, setPeriodo] = _us(periodoInicial || 'todos');
  const [filtroEmpresa, setFiltroEmpresa] = _us('');
  const [expandido, setExpandido] = _us(null);

  const periodos = periodo === 'todos' ? allPeriodos : [periodo];
  const filas = _um(() => _filasAusentismoPres(rawGroup, periodos, filtroEmpresa, activosSet),
                     [rawGroup, periodo, filtroEmpresa, activosSet]);

  const porSector = _um(() => {
    const m = new Map();
    filas.forEach(d => {
      if (!m.has(d.sector)) m.set(d.sector, { just:0, nojust:0, count:0, filas:[] });
      const s = m.get(d.sector);
      s.just += d.just; s.nojust += d.nojust; s.count++; s.filas.push(d);
    });
    return [...m.entries()].sort((a, b) => (b[1].just + b[1].nojust) - (a[1].just + a[1].nojust));
  }, [filas]);

  const totalJust   = filas.reduce((s, d) => s + d.just, 0);
  const totalNojust = filas.reduce((s, d) => s + d.nojust, 0);

  const exportar = () => {
    const filasExport = filas.map(d => [_fmtPeriodo(d.periodo), d.sector, d.legajo, d.nombre,
      _EMP_LABEL_PRES[d.empresa] || d.empresa, d.activo ? 'Sí' : 'No',
      +d.just.toFixed(2), +d.nojust.toFixed(2), +d.total.toFixed(2)]);
    _exportarExcelPres(`Ausentismo_${nombreGrupo}_${periodo}.xlsx`, [
      { nombre:'Detalle', filas:[['Período','Sector','Legajo','Nombre','Empresa','Activo','Hs. Just.','Hs. No just.','Total'], ...filasExport] },
    ]);
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
         style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(3px)',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:12, width:'100%', maxWidth:900,
                    maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px',
                      borderBottom:'1px solid var(--bd)', flexShrink:0, gap:12, flexWrap:'wrap' }}>
          <span style={{ fontWeight:600, fontSize:15 }}>Detalle de ausentismo — {nombreGrupo}</span>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <FilterChips options={['Todas','CIMOMET','COMOING']} active={filtroEmpresa || 'Todas'}
                         onChange={v => setFiltroEmpresa(v === 'Todas' ? '' : v)} />
            <Select value={periodo} onChange={setPeriodo}
                    options={[{ val:'todos', label:'Todos los períodos' }, ...allPeriodos.map(p => ({ val:p, label:_fmtPeriodo(p) }))]} />
            <button onClick={exportar}
                    style={{ padding:'6px 12px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--sf2)',
                             color:'var(--t2)', fontSize:12, cursor:'pointer' }}>
              ⬇ Excel
            </button>
            <button onClick={onClose}
                    style={{ background:'var(--sf2)', border:'none', borderRadius:6, cursor:'pointer', color:'inherit',
                             width:28, height:28, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ×
            </button>
          </div>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {filas.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center', color:'var(--t2)' }}>Sin ausentismo registrado para el filtro seleccionado.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ borderBottom:'1px solid var(--bd)' }}>
                <th style={{ ..._thStylePres, width:28 }}></th>
                <th style={_thStylePres}>Empleado</th>
                <th style={_thStylePres}>Empresa</th>
                <th style={{ ..._thStylePres, textAlign:'right' }}>Hs. Just.</th>
                <th style={{ ..._thStylePres, textAlign:'right' }}>Hs. No just.</th>
                <th style={{ ..._thStylePres, textAlign:'right' }}>Total</th>
              </tr></thead>
              <tbody>
                {porSector.map(([sector, st]) => (
                  <React.Fragment key={sector}>
                    <tr style={{ background:'var(--sf2)' }}>
                      <td colSpan={6} style={{ padding:'8px 12px', fontSize:11, fontWeight:700, color:'var(--t2)' }}>
                        {sector} <span style={{ fontWeight:400, color:'var(--t3)' }}>· {st.count} empleado{st.count !== 1 ? 's' : ''} · {_fmtNumPres(st.just + st.nojust)}h total</span>
                      </td>
                    </tr>
                    {st.filas.map(d => {
                      const k = `${d.legajo}|${d.periodo}`;
                      return <_FilaAusentismo key={k} d={d} expandido={expandido === k} onToggle={() => setExpandido(expandido === k ? null : k)} />;
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:'1px solid var(--bd)', fontWeight:600 }}>
                  <td colSpan={3} style={{ padding:'10px 12px', fontSize:12 }}>Total ({filas.length} empleados)</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{_fmtNumPres(totalJust)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{_fmtNumPres(totalNojust)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{_fmtNumPres(totalJust + totalNojust)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function _FilaTardanza({ d, expandido, onToggle }) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor:'pointer', borderBottom:'1px solid var(--bd)', opacity: d.activo ? 1 : 0.55 }}>
        <td style={{ padding:'8px 12px', fontSize:11, color:'var(--t3)' }}>{expandido ? '▾' : '▸'}</td>
        <td style={{ padding:'8px 12px' }}>
          <span style={{ fontWeight:600, fontSize:13 }}>{d.nombre || d.legajo}</span>
          <span style={{ marginLeft:6, fontSize:11, color:'var(--t3)' }}>{d.legajo}</span>
        </td>
        <td style={{ padding:'8px 12px', fontSize:12, color:_EMP_COLOR_PRES[d.empresa] }}>{_EMP_LABEL_PRES[d.empresa] || d.empresa}</td>
        <td style={{ padding:'8px 12px', textAlign:'right', fontSize:12, color: d.diasTarde > 0 ? 'var(--warn)' : 'var(--t3)' }}>{d.diasTarde > 0 ? d.diasTarde : '—'}</td>
        <td style={{ padding:'8px 12px', textAlign:'right', fontSize:12, color: d.diasTemprano > 0 ? 'var(--warn)' : 'var(--t3)' }}>{d.diasTemprano > 0 ? d.diasTemprano : '—'}</td>
        <td style={{ padding:'8px 12px', textAlign:'right', fontSize:12, fontWeight:600 }}>{d.diasTarde + d.diasTemprano}</td>
      </tr>
      {expandido && (
        <tr><td colSpan={6} style={{ padding:0, background:'var(--sf2)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={{ ..._thStylePres, padding:'6px 20px' }}>Fecha</th>
              <th style={_thStylePres}>Tipo</th>
              <th style={{ ..._thStylePres, textAlign:'right' }}>Minutos</th>
              <th style={_thStylePres}>Justificación</th>
            </tr></thead>
            <tbody>
              {d.eventos.map((e, i) => (
                <tr key={i}>
                  <td style={{ padding:'6px 20px', fontSize:12 }}>{_fmtFecha(e.fecha)}</td>
                  <td style={{ padding:'6px 12px', fontSize:12 }}>
                    <Badge tipo={e.tipo === 'tarde' ? 'warning' : 'info'}>{e.tipo === 'tarde' ? 'Tarde' : 'Salida ant.'}</Badge>
                  </td>
                  <td style={{ padding:'6px 12px', textAlign:'right', fontSize:12 }}>{e.minutos} min</td>
                  <td style={{ padding:'6px 12px', fontSize:12, color:'var(--t2)' }}>{e.justificacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </td></tr>
      )}
    </>
  );
}

function _ModalTardanzas({ rawGroup, rawTardGroup, allPeriodos, periodoInicial, activosSet, nombreGrupo, onClose }) {
  const [periodo, setPeriodo] = _us(periodoInicial || 'todos');
  const [filtroEmpresa, setFiltroEmpresa] = _us('');
  const [expandido, setExpandido] = _us(null);

  const periodos = periodo === 'todos' ? allPeriodos : [periodo];
  const filas = _um(() => _filasTardanzasPres(rawGroup, rawTardGroup, periodos, filtroEmpresa, activosSet),
                     [rawGroup, rawTardGroup, periodo, filtroEmpresa, activosSet]);

  const porSector = _um(() => {
    const m = new Map();
    filas.forEach(d => {
      if (!m.has(d.sector)) m.set(d.sector, { tarde:0, temprano:0, count:0, filas:[] });
      const s = m.get(d.sector);
      s.tarde += d.diasTarde; s.temprano += d.diasTemprano; s.count++; s.filas.push(d);
    });
    return [...m.entries()].sort((a, b) => (b[1].tarde + b[1].temprano) - (a[1].tarde + a[1].temprano));
  }, [filas]);

  const totalTarde    = filas.reduce((s, d) => s + d.diasTarde, 0);
  const totalTemprano = filas.reduce((s, d) => s + d.diasTemprano, 0);

  const exportar = () => {
    const filasExport = [];
    filas.forEach(d => d.eventos.forEach(e => filasExport.push([
      _fmtPeriodo(e.periodo), d.sector, d.legajo, d.nombre, _EMP_LABEL_PRES[d.empresa] || d.empresa,
      e.tipo === 'tarde' ? 'Tarde' : 'Salida anticipada', _fmtFecha(e.fecha), e.minutos, e.justificacion,
    ])));
    _exportarExcelPres(`TardanzasSalidas_${nombreGrupo}_${periodo}.xlsx`, [
      { nombre:'Detalle', filas:[['Período','Sector','Legajo','Nombre','Empresa','Tipo','Fecha','Minutos','Justificación'], ...filasExport] },
    ]);
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
         style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(3px)',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:12, width:'100%', maxWidth:900,
                    maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px',
                      borderBottom:'1px solid var(--bd)', flexShrink:0, gap:12, flexWrap:'wrap' }}>
          <span style={{ fontWeight:600, fontSize:15 }}>Detalle de tardanzas y salidas anticipadas — {nombreGrupo}</span>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <FilterChips options={['Todas','CIMOMET','COMOING']} active={filtroEmpresa || 'Todas'}
                         onChange={v => setFiltroEmpresa(v === 'Todas' ? '' : v)} />
            <Select value={periodo} onChange={setPeriodo}
                    options={[{ val:'todos', label:'Todos los períodos' }, ...allPeriodos.map(p => ({ val:p, label:_fmtPeriodo(p) }))]} />
            <button onClick={exportar}
                    style={{ padding:'6px 12px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--sf2)',
                             color:'var(--t2)', fontSize:12, cursor:'pointer' }}>
              ⬇ Excel
            </button>
            <button onClick={onClose}
                    style={{ background:'var(--sf2)', border:'none', borderRadius:6, cursor:'pointer', color:'inherit',
                             width:28, height:28, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ×
            </button>
          </div>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {filas.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center', color:'var(--t2)' }}>Sin tardanzas ni salidas anticipadas para el filtro seleccionado.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ borderBottom:'1px solid var(--bd)' }}>
                <th style={{ ..._thStylePres, width:28 }}></th>
                <th style={_thStylePres}>Empleado</th>
                <th style={_thStylePres}>Empresa</th>
                <th style={{ ..._thStylePres, textAlign:'right' }}>Tardanzas</th>
                <th style={{ ..._thStylePres, textAlign:'right' }}>Salidas ant.</th>
                <th style={{ ..._thStylePres, textAlign:'right' }}>Total</th>
              </tr></thead>
              <tbody>
                {porSector.map(([sector, st]) => (
                  <React.Fragment key={sector}>
                    <tr style={{ background:'var(--sf2)' }}>
                      <td colSpan={6} style={{ padding:'8px 12px', fontSize:11, fontWeight:700, color:'var(--t2)' }}>
                        {sector} <span style={{ fontWeight:400, color:'var(--t3)' }}>· {st.count} empleado{st.count !== 1 ? 's' : ''} · {st.tarde} tarde · {st.temprano} temprano</span>
                      </td>
                    </tr>
                    {st.filas.map(d => (
                      <_FilaTardanza key={d.legajo} d={d} expandido={expandido === d.legajo} onToggle={() => setExpandido(expandido === d.legajo ? null : d.legajo)} />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:'1px solid var(--bd)', fontWeight:600 }}>
                  <td colSpan={3} style={{ padding:'10px 12px', fontSize:12 }}>Total ({filas.length} empleados)</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{totalTarde}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{totalTemprano}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{totalTarde + totalTemprano}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function _PanelSector({ rawGroup, allPeriodos }) {
  const [abierto, setAbierto] = _us(false);
  const [periodo, setPeriodo] = _us(allPeriodos[allPeriodos.length - 1]);
  const deps = _um(() => abierto ? _buildDepStatsPres(rawGroup, periodo) : [], [abierto, rawGroup, periodo]);
  const minPres = deps.length ? Math.max(0, Math.min(...deps.map(d => d.pres)) - 3) : 0;
  const conExtras = deps.filter(d => d.ext50 + d.ext100 > 0).sort((a, b) => (b.ext50 + b.ext100) - (a.ext50 + a.ext100));

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom: abierto ? 12 : 0 }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Presentismo y extras por sector
        </span>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {abierto && (
            <Select value={periodo} onChange={setPeriodo} options={[...allPeriodos].reverse().map(p => ({ val:p, label:_fmtPeriodo(p) }))} />
          )}
          <button onClick={() => setAbierto(a => !a)}
                  style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--sf2)',
                           color:'var(--t2)', fontSize:12, cursor:'pointer' }}>
            {abierto ? '▾ Ocultar sectores' : '▸ Ver por sector'}
          </button>
        </div>
      </div>
      {abierto && (
        <div className="g2">
          <Card title="Presentismo por sector (% días presente)" icon="pie">
            <div className="card-body" style={{ paddingBottom:8 }}>
              {deps.length
                ? <HorizontalBarChart rows={deps.map(d => ({ label:d.dep, value:d.pres, color:_colorAltoPres(d.pres, 95, 90) }))} unit="%" min={minPres} max={100} />
                : <div style={{ padding:24, textAlign:'center', color:'var(--t2)', fontSize:13 }}>Sin datos para este período.</div>}
            </div>
          </Card>
          <Card title="Horas extra por sector" icon="clock">
            <div className="card-body" style={{ paddingBottom:8 }}>
              {conExtras.length
                ? <HorizontalBarChart rows={conExtras.map(d => ({ label:d.dep, value:+(d.ext50 + d.ext100).toFixed(0), color:'#9b8cff' }))} unit="h" />
                : <div style={{ padding:24, textAlign:'center', color:'var(--t2)', fontSize:13 }}>Sin horas extra en este período.</div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function _ModalTendencia({ titulo, labels, data, unit, color, objetivo, onClose }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
         style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(3px)',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:12, width:'100%', maxWidth:960,
                    maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px',
                      borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
          <span style={{ fontWeight:600, fontSize:15 }}>{titulo} — tendencia mensual</span>
          <button onClick={onClose}
                  style={{ background:'var(--sf2)', border:'none', borderRadius:6, cursor:'pointer', color:'inherit',
                           width:28, height:28, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
            ×
          </button>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
          <AreaChart data={data} labels={labels} height={280} color={color} unit={unit}
                     objetivo={objetivo} maxLabels={12} showDots />
          <div className="tbl-wrap" style={{ marginTop:16 }}>
            <table>
              <thead><tr><th>Período</th><th style={{ textAlign:'right' }}>Valor</th></tr></thead>
              <tbody>
                {labels.map((l, i) => ({ l, v:data[i], i })).reverse().map(row => (
                  <tr key={row.i}>
                    <td className="cell-strong">{row.l}</td>
                    <td className="cell-num">{row.v}{unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function _SeccionPresentismo({ titulo, acento, g, rawGroup, rawTardGroup, legajosSet, detalleExt50, allPeriodos, activosSet, nombreGrupo }) {
  const [periodoSel, setPeriodoSel] = _us('todos');
  const [modalAus, setModalAus]   = _us(false);
  const [modalTard, setModalTard] = _us(false);
  const [modalTend, setModalTend] = _us(null);

  const periodos = periodoSel === 'todos' ? allPeriodos : [periodoSel];
  const gF = _um(() => periodoSel === 'todos' ? g : _calcularGrupoPresentismo(rawGroup.filter(d => d.periodo === periodoSel), [periodoSel], activosSet),
                 [periodoSel, g, rawGroup, activosSet]);
  const ext50F = _um(() => _desgloseExt50Pres(detalleExt50, legajosSet, periodoSel === 'todos' ? null : periodos), [periodoSel, detalleExt50, legajosSet]);
  const tardF  = _um(() => _resumenTardanzasPres(rawTardGroup, periodos), [periodoSel, rawTardGroup]);
  const indicePuntualidad = gF.totalDiasPres > 0 ? +(((gF.totalDiasPres - tardF.diasConIncidente) / gF.totalDiasPres) * 100).toFixed(1) : null;
  const colorPunt = _colorAltoPres(indicePuntualidad, 95, 90);
  const labels = allPeriodos.map(_fmtPeriodo);
  const totalExt50F = ext50F.semana + ext50F.sabado;
  const puntualidadPorPeriodo = _um(() => _puntualidadPorPeriodo(rawTardGroup, allPeriodos, g.diasPresPorPeriodo),
                                     [rawTardGroup, allPeriodos, g]);

  return (
    <div className="card" style={{ padding:20, marginBottom:24, borderLeft:`3px solid ${acento}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:15 }}>{titulo}</span>
          <Badge tipo="success">{g.empleadosActivos} activos</Badge>
          {g.empleadosDesvinculados > 0 && <Badge tipo="neutral">{g.empleadosDesvinculados} desvinculado{g.empleadosDesvinculados !== 1 ? 's' : ''}</Badge>}
        </div>
        <Select value={periodoSel} onChange={setPeriodoSel}
                options={[{ val:'todos', label:`Últimos ${allPeriodos.length} meses` }, ...allPeriodos.map(p => ({ val:p, label:_fmtPeriodo(p) }))]} />
      </div>

      <div className="g3 mb24">
        <div onClick={() => setModalTend({ titulo:'Horas trabajadas', data:g.horasTot, unit:'h', color:acento })} style={{ cursor:'pointer' }}>
          <Kpi icon="clock" label="Horas trabajadas · Ver tendencia" value={_fmtNumPres(gF.totalTrab)}
               note={periodoSel === 'todos' ? `${_fmtPeriodo(allPeriodos[0])} – ${_fmtPeriodo(allPeriodos[allPeriodos.length - 1])}` : _fmtPeriodo(periodoSel)} />
        </div>
        <div onClick={() => setModalTend({ titulo:'Horas esperadas', data:g.espTot, unit:'h', color:'#7c7589' })} style={{ cursor:'pointer' }}>
          <Kpi icon="clipboard" label="Horas esperadas · Ver tendencia" value={_fmtNumPres(gF.totalEsp)} note="Según planilla Tango" color="var(--t3)" />
        </div>
        <div onClick={() => setModalTend({ titulo:'Cumplimiento de horas', data:g.cumplPct, unit:'%', color:acento, objetivo:100 })} style={{ cursor:'pointer' }}>
          <Kpi icon="check" label="Cumplimiento de horas · Ver tendencia"
               value={gF.cumplimiento == null ? '—' : `${gF.cumplimiento}%`} note="Trabajadas / Esperadas" color={gF.colorCumpl} />
        </div>
      </div>

      <div className="g4 mb24">
        <div onClick={() => setModalAus(true)} style={{ cursor:'pointer' }}>
          <Kpi icon="alert" label="Hs. ausentismo · Ver detalle" value={_fmtNumPres(gF.totalAus)} note="Justificadas + sin justificar" color="var(--err)" />
        </div>
        <div onClick={() => setModalTend({ titulo:'Índice de ausentismo', data:g.ausPct, unit:'%', color:'#f5b740' })} style={{ cursor:'pointer' }}>
          <Kpi icon="pulse" label="Índice de ausentismo · Ver tendencia" value={gF.idxAus == null ? '—' : `${gF.idxAus}%`} note="Aus / (Trab + Aus)" color={gF.colorIdx} />
        </div>
        <div onClick={() => setModalTend({ titulo:'Presentismo (días)', data:g.presPctPorPeriodo, unit:'%', color:'#3ecf8e', objetivo:95 })} style={{ cursor:'pointer' }}>
          <Kpi icon="heart" label="Presentismo (días) · Ver tendencia" value={gF.presGlobal == null ? '—' : `${gF.presGlobal}%`} note="Días presentes / Días lab." color={gF.colorPres} />
        </div>
        {totalExt50F > 0 && (
          <Kpi icon="trend" label="Horas extra 50%" value={`${_fmtNumPres(totalExt50F)}h`}
               note={`En semana: ${_fmtNumPres(ext50F.semana)}h · Sábados: ${_fmtNumPres(ext50F.sabado)}h`} color="#9b8cff" />
        )}
      </div>

      <div className="g3 mb24">
        {gF.totalExt100 > 0 && (
          <Kpi icon="alert" label="Horas extra 100%" value={`${_fmtNumPres(gF.totalExt100)}h`} note="del período" color="var(--err)" />
        )}
        <div onClick={() => setModalTard(true)} style={{ cursor:'pointer' }}>
          <Kpi icon="clock" label="Tardanzas y salidas · Ver detalle" value={String(tardF.diasTarde + tardF.diasTemprano)}
               note={`${tardF.diasTarde} tarde${tardF.diasTarde !== 1 ? 's' : ''} · ${tardF.diasTemprano} salida${tardF.diasTemprano !== 1 ? 's' : ''} anticipada${tardF.diasTemprano !== 1 ? 's' : ''}`}
               color="var(--warn)" />
        </div>
        <div onClick={() => setModalTend({ titulo:'Índice de puntualidad', data:puntualidadPorPeriodo, unit:'%', color:'#a78bfa', objetivo:95 })} style={{ cursor:'pointer' }}>
          <Kpi icon="medal" label="Índice de puntualidad · Ver tendencia" value={indicePuntualidad == null ? '—' : `${indicePuntualidad}%`}
               note="Días sin tardanza ni salida / días presentes" color={colorPunt} />
        </div>
      </div>

      <div className="g2 mb24">
        <Card title="Horas trabajadas por empresa" icon="factory">
          <div className="card-body" style={{ paddingBottom:8 }}>
            <GroupedBarChart categories={labels} height={170} series={[
              { label:'Cimomet',   data:g.horasCIM, color:'#5aa9f5' },
              { label:'Co.mo.ing', data:g.horasCOM, color:'#3ecf8e' },
            ]} />
            <_Leyenda items={[{ c:'#5aa9f5', l:'Cimomet' }, { c:'#3ecf8e', l:'Co.mo.ing' }]} />
          </div>
        </Card>
        <Card title="Esperadas vs. Trabajadas" icon="trend">
          <div className="card-body" style={{ paddingBottom:8 }}>
            <GroupedBarChart categories={labels} height={170} series={[
              { label:'Esperadas',  data:g.espTot,   color:'#7c7589' },
              { label:'Trabajadas', data:g.horasTot, color:acento },
            ]} />
            <_Leyenda items={[{ c:'#7c7589', l:'Esperadas' }, { c:acento, l:'Trabajadas' }]} />
          </div>
        </Card>
      </div>

      <div className="g2">
        <Card title="Ausentismo vs. Horas trabajadas" icon="alert">
          <div className="card-body" style={{ paddingBottom:8 }}>
            <DualAxisChart categories={labels} height={170}
                           bar={{ label:'Horas trabajadas', data:g.horasTot, color:acento }}
                           line={{ label:'% Ausentismo', data:g.ausPct, color:'#f5b740', unit:'%' }} />
          </div>
        </Card>
        <Card title="Horas extra por período" icon="clock">
          <div className="card-body" style={{ paddingBottom:8 }}>
            {(g.ext50Tot.some(v => v > 0) || g.ext100Tot.some(v => v > 0)) ? (
              <>
                <StackedBarChart categories={labels} height={170} series={[
                  ...(g.ext50Tot.some(v => v > 0)  ? [{ label:'Extra 50%',  data:g.ext50Tot,  color:'#9b8cff' }] : []),
                  ...(g.ext100Tot.some(v => v > 0) ? [{ label:'Extra 100%', data:g.ext100Tot, color:'var(--err)' }] : []),
                ]} />
                <_Leyenda items={[
                  ...(g.ext50Tot.some(v => v > 0)  ? [{ c:'#9b8cff', l:'Extra 50%' }] : []),
                  ...(g.ext100Tot.some(v => v > 0) ? [{ c:'var(--err)', l:'Extra 100%' }] : []),
                ]} />
              </>
            ) : <div style={{ padding:24, textAlign:'center', color:'var(--t2)', fontSize:13 }}>Sin horas extra en este período.</div>}
          </div>
        </Card>
      </div>

      <_PanelSector rawGroup={rawGroup} allPeriodos={allPeriodos} />

      {modalAus && (
        <_ModalAusentismo rawGroup={rawGroup} allPeriodos={allPeriodos}
                           periodoInicial={periodoSel === 'todos' ? allPeriodos[allPeriodos.length - 1] : periodoSel}
                           activosSet={activosSet} nombreGrupo={nombreGrupo} onClose={() => setModalAus(false)} />
      )}
      {modalTard && (
        <_ModalTardanzas rawGroup={rawGroup} rawTardGroup={rawTardGroup} allPeriodos={allPeriodos}
                          periodoInicial={periodoSel === 'todos' ? allPeriodos[allPeriodos.length - 1] : periodoSel}
                          activosSet={activosSet} nombreGrupo={nombreGrupo} onClose={() => setModalTard(false)} />
      )}
      {modalTend && (
        <_ModalTendencia titulo={modalTend.titulo} labels={labels} data={modalTend.data}
                          unit={modalTend.unit} color={modalTend.color} objetivo={modalTend.objetivo}
                          onClose={() => setModalTend(null)} />
      )}
    </div>
  );
}

function _ComposicionNomina({ empleados, clasifMap }) {
  const tipoDe = e => _tipoPuestoPres(e.desc_puesto, clasifMap);
  const activos = empleados.filter(e => e.activo);
  const CIM_T = activos.filter(e => e.empresa === 'CIMOMET' && tipoDe(e) === 'quincenal').length;
  const CIM_M = activos.filter(e => e.empresa === 'CIMOMET' && tipoDe(e) === 'mensual').length;
  const CIM_S = activos.filter(e => e.empresa === 'CIMOMET' && tipoDe(e) === 'sin_asignar').length;
  const COM_T = activos.filter(e => e.empresa === 'COMOING' && tipoDe(e) === 'quincenal').length;
  const COM_M = activos.filter(e => e.empresa === 'COMOING' && tipoDe(e) === 'mensual').length;
  const COM_S = activos.filter(e => e.empresa === 'COMOING' && tipoDe(e) === 'sin_asignar').length;
  const totalSinAsignar = CIM_S + COM_S;

  const segments = [
    { nombre:'Taller Cimomet',     valor:CIM_T, color:'#5aa9f5' },
    { nombre:'Taller Co.mo.ing',   valor:COM_T, color:'#3ecf8e' },
    { nombre:'Mensual Cimomet',    valor:CIM_M, color:'#5aa9f588' },
    { nombre:'Mensual Co.mo.ing',  valor:COM_M, color:'#3ecf8e88' },
    ...(totalSinAsignar > 0 ? [{ nombre:'Sin clasificar', valor:totalSinAsignar, color:'#7c7589' }] : []),
  ].filter(s => s.valor > 0);

  return (
    <Card title="Composición de nómina (activos)" icon="users">
      <div className="card-body" style={{ display:'flex', gap:28, alignItems:'center', flexWrap:'wrap' }}>
        <DonutChart segments={segments} size={160} thickness={24} centerLabel="activos" />
        <div style={{ flex:1, minWidth:220, display:'flex', gap:24, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>Cimomet — {CIM_T + CIM_M + CIM_S}</div>
            <div className="f12 t2">Taller: <b>{CIM_T}</b></div>
            <div className="f12 t2">Mensual: <b>{CIM_M}</b></div>
            {CIM_S > 0 && <div className="f12" style={{ color:'var(--warn)' }}>Sin clasificar: <b>{CIM_S}</b></div>}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>Co.mo.ing — {COM_T + COM_M + COM_S}</div>
            <div className="f12 t2">Taller: <b>{COM_T}</b></div>
            <div className="f12 t2">Mensual: <b>{COM_M}</b></div>
            {COM_S > 0 && <div className="f12" style={{ color:'var(--warn)' }}>Sin clasificar: <b>{COM_S}</b></div>}
          </div>
        </div>
      </div>
      {totalSinAsignar > 0 && (
        <div style={{ padding:'0 20px 16px', fontSize:12, color:'var(--warn)' }}>
          ⚠ Hay {totalSinAsignar} empleado{totalSinAsignar === 1 ? '' : 's'} con puesto sin clasificar — no se cuentan en Quincenales ni Mensuales.
        </div>
      )}
    </Card>
  );
}

function _AusentismoPorTipo({ rawAusTipo, allPeriodos }) {
  const tipoTotales = new Map(), tipoPorPeriodo = new Map();
  rawAusTipo.forEach(d => {
    tipoTotales.set(d.tipo, (tipoTotales.get(d.tipo) || 0) + (+d.hs_total || 0));
    tipoPorPeriodo.set(`${d.tipo}|${d.periodo}`, +d.hs_total || 0);
  });
  const tipos = [...tipoTotales.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  if (!tipos.length) return null;
  const totalGen = [...tipoTotales.values()].reduce((s, v) => s + v, 0);

  return (
    <Card title="Ausentismo por tipo de novedad" icon="alert">
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>Tipo</th>
            {allPeriodos.map(p => <th key={p} style={{ textAlign:'right' }}>{_fmtPeriodo(p)}</th>)}
            <th style={{ textAlign:'right' }}>Total</th>
          </tr></thead>
          <tbody>
            {tipos.map(t => (
              <tr key={t}>
                <td className="cell-strong">{t}</td>
                {allPeriodos.map(p => {
                  const v = tipoPorPeriodo.get(`${t}|${p}`) || 0;
                  return <td key={p} className="cell-num t2">{v > 0 ? _fmtNumPres(v) : '—'}</td>;
                })}
                <td className="cell-num" style={{ fontWeight:600 }}>{_fmtNumPres(tipoTotales.get(t))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight:700 }}>
              <td>Total general</td>
              {allPeriodos.map(p => {
                const v = Math.round(rawAusTipo.filter(d => d.periodo === p).reduce((s, d) => s + (+d.hs_total || 0), 0));
                return <td key={p} className="cell-num">{v > 0 ? v.toLocaleString('es-AR') : '—'}</td>;
              })}
              <td className="cell-num">{_fmtNumPres(totalGen)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function RRHHPresentismo({ empleados, loadingEmpleados }) {
  const [rawHoras,         setRawHoras]         = _us([]);
  const [rawExt50Detalle,  setRawExt50Detalle]  = _us([]);
  const [rawTard,          setRawTard]          = _us([]);
  const [rawAusTipo,       setRawAusTipo]       = _us([]);
  const [clasifMap,        setClasifMap]        = _us(null);
  const [loading,          setLoading]          = _us(true);
  const [errorMsg,         setErrorMsg]         = _us(null);

  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    const h = { apikey: key, Authorization: `Bearer ${key}` };
    Promise.all([
      fetch(`${url}/rrhh_horas_mensual?select=legajo,apellido,nombre,departamento,periodo,empresa,hs_normales,hs_esperadas,hs_extra50,hs_extra100,hs_justificadas,hs_no_justificadas,hs_ausencias,dias_laborables,dias_presentes,dias_ausentes_nojust&order=periodo.asc`, { headers: h }).then(r => r.json()),
      _fetchPaginadoPres(`${url}/rrhh_horas_detalle?or=(tipo_hora.eq.HSEXT,tipo_hora.eq.HSEXT50,tipo_hora.eq.HS%2050%20VAC)&select=legajo,periodo,fecha,hs_trabajadas`, h),
      _fetchPaginadoPres(`${url}/rrhh_tardanzas_salidas?select=legajo,periodo,fecha,tipo,minutos,descripcion_justificacion`, h),
      fetch(`${url}/v_ausentismo_tipo?select=periodo,tipo,hs_total&order=periodo.asc`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${url}/rrhh_puestos_config?select=desc_puesto,tipo`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([horas, ext50det, tard, ausTipo, puestosCfg]) => {
      setRawHoras(Array.isArray(horas) ? horas : []);
      setRawExt50Detalle(ext50det);
      setRawTard(tard.filter(t => t.tipo !== 'ausente'));
      setRawAusTipo(Array.isArray(ausTipo) ? ausTipo : []);
      setClasifMap(new Map((Array.isArray(puestosCfg) ? puestosCfg : []).map(f => [f.desc_puesto, f.tipo])));
      setLoading(false);
    }).catch(e => { setErrorMsg(e.message || 'Error al cargar'); setLoading(false); });
  }, []);

  const activosSet = _um(() => new Set(empleados.filter(e => e.activo).map(e => String(e.legajo))), [empleados]);

  if (loading || loadingEmpleados || clasifMap === null) return (
    <div className="fade-in card" style={{ textAlign:'center', padding:'48px', color:'var(--t2)' }}>Cargando indicadores de presentismo…</div>
  );
  if (errorMsg) return (
    <div className="fade-in card" style={{ textAlign:'center', padding:'48px', color:'var(--err)' }}>Error al cargar: {errorMsg}</div>
  );
  if (!rawHoras.length) return (
    <div className="fade-in card" style={{ textAlign:'center', padding:'48px', color:'var(--t2)' }}>
      Sin datos cargados todavía. Se cargan mensualmente desde Tablero RRHH ("Horas y Presentismo → Cargar datos").
    </div>
  );

  const empMap = new Map(empleados.map(e => [String(e.legajo), _tipoPuestoPres(e.desc_puesto, clasifMap)]));
  const rawQ = rawHoras.filter(d => empMap.get(String(d.legajo)) === 'quincenal');
  const rawM = rawHoras.filter(d => empMap.get(String(d.legajo)) === 'mensual');
  const rawTardQ = rawTard.filter(t => empMap.get(String(t.legajo)) === 'quincenal');
  const rawTardM = rawTard.filter(t => empMap.get(String(t.legajo)) === 'mensual');
  const legajosQ = new Set(rawQ.map(d => String(d.legajo)));
  const legajosM = new Set(rawM.map(d => String(d.legajo)));

  const allPeriodos = [...new Set(rawHoras.filter(d => _EMPRESAS_PRES.includes(d.empresa)).map(d => d.periodo))].sort();
  const gQ = _calcularGrupoPresentismo(rawQ, allPeriodos, activosSet);
  const gM = _calcularGrupoPresentismo(rawM, allPeriodos, activosSet);

  return (
    <div className="fade-in">
      <_SeccionPresentismo titulo="Personal de taller — Quincenales" acento="#5aa9f5" g={gQ}
                            rawGroup={rawQ} rawTardGroup={rawTardQ} legajosSet={legajosQ}
                            detalleExt50={rawExt50Detalle} allPeriodos={allPeriodos} activosSet={activosSet}
                            nombreGrupo="Quincenales" />
      <_SeccionPresentismo titulo="Personal administrativo — Mensuales" acento="#3ecf8e" g={gM}
                            rawGroup={rawM} rawTardGroup={rawTardM} legajosSet={legajosM}
                            detalleExt50={rawExt50Detalle} allPeriodos={allPeriodos} activosSet={activosSet}
                            nombreGrupo="Mensuales" />
      <div style={{ marginBottom:24 }}>
        <_ComposicionNomina empleados={empleados} clasifMap={clasifMap} />
      </div>
      <_AusentismoPorTipo rawAusTipo={rawAusTipo} allPeriodos={allPeriodos} />
    </div>
  );
}

window.ViewRRHH = function ViewRRHH({ tab, onTabChange }) {
  const [empleados,        setEmpleados]        = _us([]);
  const [loading,          setLoading]          = _us(true);

  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(
      `${url}/empleados?select=id,legajo,empresa,apellido_y_nombre,cuil,desc_puesto,activo,fecha_ingreso,fecha_nacimiento&order=apellido_y_nombre`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
      .then(r => r.json())
      .then(data => { setEmpleados(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const views = [
    <RRHHPanel onNavigate={onTabChange} empleados={empleados} loading={loading} />,
    <RRHHPlantel empleados={empleados} loading={loading} />,
    <RRHHSabados />,
    <RRHHPresentismo empleados={empleados} loadingEmpleados={loading} />,
  ];
  return views[tab] || views[0];
};

/* =========================================================
   PRESUPUESTO
   ========================================================= */
function PresupuestoPanel({ onNavigate }) {
  const adjudicados = D.presupuestos.filter(p => p.estado === 'Adjudicado').length;
  const efectividad = Math.round((adjudicados / D.presupuestos.length) * 100);
  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Vital label="Efectividad Comercial" value={efectividad}
               segments={[
                 { label: 'Adjudicado', pct: efectividad, color: '#3ecf8e' },
                 { label: 'Otros', pct: 100 - efectividad, color: '#241f2c' }
               ]}
               delta={5} note="sobre presupuestos emitidos"
               sparkData={[48, 52, 57, 50, 60, efectividad]} />
        <div>
          <HubButton icon="receipt" title="Presupuestos" subtitle={`${D.presupuestos.length} emitidos`}
                     onClick={() => onNavigate(1)} />
          <HubButton icon="trend" title="Ventas" subtitle="$206M en mayo"
                     onClick={() => onNavigate(2)} color="#3ecf8e" />
        </div>
      </div>
      <div className="g4">
        <Kpi icon="receipt" label="Presupuestos activos" value="7" note="Jun–May 2026" />
        <Kpi icon="check" label="Adjudicados" value="3" note="$132M total" color="#3ecf8e" />
        <Kpi icon="trend" label="Ventas mayo" value="$206M" delta={18.4} note="vs abril" color="#3ecf8e" />
        <Kpi icon="star" label="Tasa adjud." value={`${efectividad}%`} delta={5} note="vs mes anterior" />
      </div>
    </div>
  );
}

function PresupuestoList() {
  const [filter, setFilter] = _us('Todos');
  const opts = ['Todos', 'Enviado', 'En análisis', 'Adjudicado', 'Rechazado'];
  const rows = filter === 'Todos' ? D.presupuestos : D.presupuestos.filter(p => p.estado === filter);
  return (
    <div className="fade-in card">
      <FilterChips options={opts} active={filter} onChange={setFilter} />
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Cliente</th><th>Descripción</th><th className="cell-num">Monto</th><th>Estado</th>
          </tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td className="cell-id">{p.id}</td>
                <td className="cell-strong">{p.cliente}</td>
                <td className="t2">{p.desc}</td>
                <td className="cell-num fw5 t1">{p.monto}</td>
                <td><Badge>{p.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PresupuestoVentas() {
  return (
    <div className="fade-in">
      <div className="g4 mb24">
        <Kpi icon="trend" label="Ventas mayo" value="$206M" delta={18.4} note="récord del período" color="#3ecf8e" />
        <Kpi icon="star" label="Promedio 6 meses" value="$172M" note="Dic–May" color="#3ecf8e" />
        <Kpi icon="check" label="Facturas emitidas" value="14" note="mayo 2026" />
        <Kpi icon="barChart" label="Mejor mes" value="$206M" note="mayo 2026" color="#f5b740" />
      </div>
      <Card title="Ventas mensuales (millones $AR)" icon="trend">
        <div className="card-body">
          <AreaChart data={D.ventas.valores} labels={D.ventas.meses} height={220} color="#3ecf8e" />
        </div>
      </Card>
    </div>
  );
}

window.ViewPresupuesto = function ViewPresupuesto({ tab, onTabChange }) {
  const views = [
    <PresupuestoPanel onNavigate={onTabChange} />,
    <PresupuestoList />,
    <PresupuestoVentas />
  ];
  return views[tab] || views[0];
};

/* =========================================================
   INGENIERÍA
   ========================================================= */
function IngenieriaPanel({ onNavigate }) {
  const aprobados = D.proyectos.filter(p => p.avance === 100).length;
  const total = D.proyectos.length;
  const avgAvance = Math.round(D.proyectos.reduce((s, p) => s + p.avance, 0) / total);
  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Vital label="Avance promedio" value={avgAvance}
               segments={[
                 { label: 'Avanzado', pct: avgAvance, color: '#5aa9f5' },
                 { label: 'Pendiente', pct: 100 - avgAvance, color: '#241f2c' }
               ]}
               delta={4} note={`${aprobados}/${total} proyectos aprobados`}
               sparkData={[65, 68, 72, 74, 75, avgAvance]} />
        <div>
          <HubButton icon="compass" title="Proyectos" subtitle={`${total} en curso`}
                     onClick={() => onNavigate(1)} color="#5aa9f5" />
        </div>
      </div>
      <div className="g4">
        <Kpi icon="compass" label="Proyectos activos" value={total - aprobados} note="en ejecución" color="#5aa9f5" />
        <Kpi icon="check" label="Aprobados" value={aprobados} note="completos" color="#3ecf8e" />
        <Kpi icon="doc" label="Planos totales" value="175" note="todos los proyectos" color="#5aa9f5" />
        <Kpi icon="clock" label="Próx. vencimiento" value="03/06" note="ING-512 Torre agua" color="#f5b740" />
      </div>
    </div>
  );
}

function IngenieriaProyectos() {
  return (
    <div className="fade-in card">
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Proyecto</th><th>Responsable</th><th>Avance</th><th>Planos</th><th>Fecha</th>
          </tr></thead>
          <tbody>
            {D.proyectos.map(p => (
              <tr key={p.id}>
                <td className="cell-id">{p.id}</td>
                <td className="cell-strong">{p.nombre}</td>
                <td className="t2">{p.responsable}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProgBar value={p.avance} color={p.avance === 100 ? '#3ecf8e' : '#5aa9f5'} />
                    <span className="f12 fw5" style={{ color: p.avance === 100 ? '#3ecf8e' : 'var(--t2)', minWidth: 36 }}>{p.avance}%</span>
                  </div>
                </td>
                <td className="cell-id">{p.planos}</td>
                <td><Badge>{p.fecha === 'Aprobado' ? 'Aprobado' : null}</Badge>{p.fecha !== 'Aprobado' && <span className="t3 f12">{p.fecha}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.ViewIngenieria = function ViewIngenieria({ tab, onTabChange }) {
  const views = [
    <IngenieriaPanel onNavigate={onTabChange} />,
    <IngenieriaProyectos />
  ];
  return views[tab] || views[0];
};

/* =========================================================
   COMPRAS
   ========================================================= */
function ComprasPanel({ onNavigate }) {
  const recibidas = D.oc.filter(o => o.estado === 'Recibida').length;
  const otif = Math.round((recibidas / D.oc.length) * 100);
  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Vital label="OTIF Compras" value={otif}
               segments={[
                 { label: 'A tiempo', pct: otif, color: '#9b8cff' },
                 { label: 'Demoradas', pct: 100 - otif, color: '#f2585d' }
               ]}
               delta={-5} note="On Time In Full" inverse={true}
               sparkData={[75, 71, 78, 80, 72, otif]} />
        <div>
          <HubButton icon="cart" title="Órdenes de compra" subtitle={`${D.oc.length} órdenes`}
                     onClick={() => onNavigate(1)} color="#9b8cff" />
          <HubButton icon="users" title="Proveedores" subtitle={`${D.proveedores.length} activos`}
                     onClick={() => onNavigate(2)} color="#9b8cff" />
        </div>
      </div>
      <div className="g4">
        <Kpi icon="cart" label="OC abiertas" value="4" note="en proceso" color="#9b8cff" />
        <Kpi icon="check" label="OC recibidas" value={recibidas} note="mayo" color="#3ecf8e" />
        <Kpi icon="alert" label="Demoradas" value="1" note="OC-7808 Acindar" color="#f2585d" />
        <Kpi icon="trend" label="Total compras" value="$54M" note="mayo 2026" color="#9b8cff" />
      </div>
    </div>
  );
}

function ComprasOrdenes() {
  const [filter, setFilter] = _us('Todos');
  const opts = ['Todos', 'Recibida', 'En tránsito', 'Pendiente', 'Demorada'];
  const rows = filter === 'Todos' ? D.oc : D.oc.filter(o => o.estado === filter);
  return (
    <div className="fade-in card">
      <FilterChips options={opts} active={filter} onChange={setFilter} />
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Proveedor</th><th>Descripción</th><th className="cell-num">Monto</th><th>Estado</th>
          </tr></thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id}>
                <td className="cell-id">{o.id}</td>
                <td className="cell-strong">{o.proveedor}</td>
                <td className="t2">{o.desc}</td>
                <td className="cell-num fw5 t1">{o.monto}</td>
                <td><Badge>{o.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComprasProveedores() {
  return (
    <div className="fade-in ga">
      {D.proveedores.map((p, i) => (
        <div key={i} className="prov-card">
          <div className="prov-name">{p.nombre}</div>
          <div className="prov-rubro">{p.rubro}</div>
          <div className="prov-row"><Icon name="user" size={12} />{p.contacto}</div>
          <div className="prov-row"><Icon name="phone" size={12} />{p.tel}</div>
          <div style={{ marginTop: 10 }}><Badge>{p.estado}</Badge></div>
        </div>
      ))}
    </div>
  );
}

window.ViewCompras = function ViewCompras({ tab, onTabChange }) {
  const views = [
    <ComprasPanel onNavigate={onTabChange} />,
    <ComprasOrdenes />,
    <ComprasProveedores />
  ];
  return views[tab] || views[0];
};

/* =========================================================
   PRODUCCIÓN
   ========================================================= */
function ProduccionResumen() {
  const prod = D.produccion;
  const last = prod.toneladas[prod.toneladas.length - 1];
  const prev = prod.toneladas[prod.toneladas.length - 2];
  const delta = (((last - prev) / prev) * 100).toFixed(1);
  const enProceso = D.ordenesProd.filter(o => o.estado === 'En proceso').length;
  return (
    <div className="fade-in">
      <div className="g4 mb24">
        <Kpi icon="factory" label="Producción Mayo" value={`${last.toLocaleString('es-AR')} t`}
             delta={delta} note={`Obj. ${prod.objetivo} t`}
             progress={(last / prod.objetivo) * 100}
             sparkData={prod.toneladas.slice(-6)} />
        <Kpi icon="layers" label="OP en proceso" value={enProceso} note="órdenes activas" color="#5aa9f5" />
        <Kpi icon="check" label="OP entregadas" value="2" note="mayo 2026" color="#3ecf8e" />
        <Kpi icon="clock" label="Próx. entrega" value="05/06" note="OP-1180 Torre Agua" color="#f5b740" />
      </div>
      <Card title="Producción mensual (toneladas)" icon="factory">
        <div className="card-body">
          <AreaChart data={prod.toneladas} labels={prod.meses}
                     height={220} objetivo={prod.objetivo} unit=" t" />
        </div>
      </Card>
    </div>
  );
}

function ProduccionOrdenes() {
  const [filter, setFilter] = _us('Todos');
  const opts = ['Todos', 'En proceso', 'Entregada'];
  const rows = filter === 'Todos' ? D.ordenesProd : D.ordenesProd.filter(o => o.estado === filter);
  return (
    <div className="fade-in card">
      <FilterChips options={opts} active={filter} onChange={setFilter} />
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Descripción</th><th>Cliente</th><th>Avance</th><th>Entrega</th><th>Estado</th>
          </tr></thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id}>
                <td className="cell-id">{o.id}</td>
                <td className="cell-strong">{o.desc}</td>
                <td className="t2">{o.cliente}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProgBar value={o.avance} color={o.avance === 100 ? '#3ecf8e' : 'var(--accent)'} />
                    <span className="f12 fw5 t2" style={{ minWidth: 36 }}>{o.avance}%</span>
                  </div>
                </td>
                <td className="t3 f12">{o.fecha}</td>
                <td><Badge>{o.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProduccionObras() {
  return (
    <div className="fade-in">
      <div className="g2">
        {D.obras.map((o, i) => <ObraCard key={i} obra={o} />)}
      </div>
    </div>
  );
}

window.ViewProduccion = function ViewProduccion({ tab }) {
  const views = [<ProduccionResumen />, <ProduccionOrdenes />, <ProduccionObras />];
  return views[tab] || views[0];
};

/* =========================================================
   CALIDAD — helpers y carga de datos
   ========================================================= */
const _CAL_MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function _calFetch(path) {
  const { url, key } = window.CALIDAD_CONFIG;
  return fetch(`${url}${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Range-Unit': 'items',
      Range: '0-9999',
    }
  }).then(r => r.json()).then(d => Array.isArray(d) ? d : []);
}

async function _loadCalidad() {
  const hace12 = new Date();
  hace12.setMonth(hace12.getMonth() - 12);
  const hace12iso = hace12.toISOString();

  const [procesos, ots, piezas, subpiezas, inspecciones, eventos, lotes, lotePiezas, usuarios] =
    await Promise.all([
      _calFetch('/procesos?select=id,codigo,area,activo'),
      _calFetch('/ots?select=id,numero,fecha_entrega_global,proyecto_id,proyectos(nombre)'),
      _calFetch('/piezas?select=id,ot_id,pos,denom,qty,peso_unit,peso_total,es_borrador&es_borrador=eq.false'),
      _calFetch('/subpiezas?select=id,pieza_id,numero'),
      _calFetch('/inspecciones?select=id,subpieza_id,proceso_id,estado,inspector_id,observaciones'),
      _calFetch(`/inspeccion_eventos?select=id,inspeccion_id,fecha,accion,inspector_id,texto&fecha=gte.${hace12iso}&order=fecha.desc`),
      _calFetch('/lotes?select=id,ot_id,tipo,estado'),
      _calFetch('/lote_piezas?select=lote_id,subpieza_id,estado_en_lote'),
      _calFetch('/usuarios?select=id,nombre'),
    ]);

  const procsById = {};
  procesos.forEach(p => { procsById[p.id] = p; });
  const piezasById = {};
  piezas.forEach(p => { piezasById[p.id] = p; });
  const otsById = {};
  ots.forEach(o => { otsById[o.id] = o; });
  const usuariosById = {};
  usuarios.forEach(u => { usuariosById[u.id] = u; });
  const insMap = {};
  inspecciones.forEach(i => { insMap[`${i.subpieza_id}_${i.proceso_id}`] = i; });
  const insByInsId = {};
  inspecciones.forEach(i => { insByInsId[i.id] = i; });
  const lotesById = {};
  lotes.forEach(l => { lotesById[l.id] = l; });
  const lpBySp = {};
  lotePiezas.forEach(lp => {
    if (!lpBySp[lp.subpieza_id]) lpBySp[lp.subpieza_id] = [];
    lpBySp[lp.subpieza_id].push(lp);
  });

  const cdProc   = procesos.find(p => p.codigo === 'cd');
  const apProc   = procesos.find(p => p.codigo === 'ap');
  const pintProc = procesos.find(p => p.codigo === 'pint' || p.codigo === 'pintura');

  return { procesos, procsById, cdProc, apProc, pintProc,
           ots, otsById, piezas, piezasById,
           subpiezas, inspecciones, insMap, insByInsId,
           eventos, lotes, lotesById, lotePiezas, lpBySp,
           usuarios, usuariosById };
}

function _calPintEst(spId, lotesById, lpBySp) {
  const lps = lpBySp[spId] || [];
  if (!lps.length) return 'pending';
  if (lps.some(lp => lp.estado_en_lote === 'rejected')) return 'rejected';
  const lotesRel = lps.map(lp => lotesById[lp.lote_id]).filter(Boolean);
  if (lotesRel.some(l => l.estado === 'rechazado')) return 'rejected';
  if (lps.some(lp => lp.estado_en_lote === 'approved') || lotesRel.some(l => l.estado === 'aprobado')) return 'approved';
  return 'pending';
}

function _calBadge(e) {
  return { approved:'success', rejected:'danger', partial:'warning', pending:'neutral', anulado:'neutral' }[e] || 'neutral';
}
function _calLbl(e) {
  return { approved:'Aprobado', rejected:'Rechazado', partial:'Parcial', pending:'Pendiente', anulado:'Anulado' }[e] || (e || 'Pendiente');
}
function _calFmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

/* =========================================================
   CALIDAD — Panel general
   ========================================================= */
function CalidadPanel({ data, onNavigate }) {
  if (!data) return (
    <div className="fade-in" style={{ padding:60, textAlign:'center', color:'var(--t3)' }}>
      Cargando datos de calidad…
    </div>
  );

  const { cdProc, apProc, pintProc, subpiezas, piezasById, insMap,
          lotesById, lpBySp, otsById, ots, eventos, insByInsId, procsById } = data;

  const sps = subpiezas.filter(sp => piezasById[sp.pieza_id]);
  const total = sps.length;

  function cntProc(procId, usePint) {
    let ok = 0, err = 0, pend = 0;
    sps.forEach(sp => {
      const e = usePint
        ? _calPintEst(sp.id, lotesById, lpBySp)
        : (insMap[`${sp.id}_${procId}`]?.estado || 'pending');
      if (e === 'approved') ok++;
      else if (e === 'rejected') err++;
      else pend++;
    });
    return { ok, err, pend };
  }

  const cd   = cdProc   ? cntProc(cdProc.id, false) : { ok:0, err:0, pend:total };
  const ap   = apProc   ? cntProc(apProc.id, false) : { ok:0, err:0, pend:total };
  const pint = { ...cntProc(null, true) };

  let kgTotal = 0, kgOk = 0;
  sps.forEach(sp => {
    const p = piezasById[sp.pieza_id];
    if (!p) return;
    const kg = p.peso_unit || 0;
    kgTotal += kg;
    const est = cdProc ? (insMap[`${sp.id}_${cdProc.id}`]?.estado || 'pending') : 'pending';
    if (est === 'approved') kgOk += kg;
  });

  const reprocesos = eventos.filter(ev => {
    if (ev.accion !== 'rejected') return false;
    const ins = insByInsId[ev.inspeccion_id];
    if (!ins) return false;
    const p = procsById[ins.proceso_id];
    return p && (p.codigo === 'cd' || p.codigo === 'ap');
  }).length;

  const tasaCD = total > 0 ? (cd.ok / total * 100).toFixed(1) : '0.0';
  const tasaAP = total > 0 ? (ap.ok / total * 100).toFixed(1) : '0.0';
  const tasaPINT = total > 0 ? (pint.ok / total * 100).toFixed(1) : '0.0';

  // Top OTs con más rechazos CD
  const otErr = {}, otTot = {};
  sps.forEach(sp => {
    const p = piezasById[sp.pieza_id]; if (!p) return;
    const id = p.ot_id;
    if (!otTot[id]) { otTot[id] = 0; otErr[id] = 0; }
    otTot[id]++;
    const e = cdProc ? (insMap[`${sp.id}_${cdProc.id}`]?.estado || 'pending') : 'pending';
    if (e === 'rejected') otErr[id]++;
  });
  const rankOTs = Object.keys(otErr)
    .filter(id => otErr[id] > 0)
    .sort((a, b) => otErr[b] - otErr[a])
    .slice(0, 6)
    .map(id => ({ id, numero: otsById[id]?.numero || '—',
                  rechazos: otErr[id], total: otTot[id],
                  tasa: (otErr[id] / otTot[id] * 100).toFixed(1) }));

  // Tendencia mensual CD (12 meses)
  const now = new Date();
  const mesesD = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { key:`${d.getFullYear()}-${d.getMonth()}`, lbl:_CAL_MESES[d.getMonth()], ok:0, tot:0 };
  });
  const mIdx = {};
  mesesD.forEach((m, i) => { mIdx[m.key] = i; });
  eventos.forEach(ev => {
    const ins = insByInsId[ev.inspeccion_id]; if (!ins) return;
    const proc = procsById[ins.proceso_id]; if (!proc || proc.codigo !== 'cd') return;
    const d = new Date(ev.fecha);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const i = mIdx[k]; if (i === undefined) return;
    if (ev.accion === 'approved' || ev.accion === 'rejected') {
      mesesD[i].tot++;
      if (ev.accion === 'approved') mesesD[i].ok++;
    }
  });
  const confData = mesesD.map(m => m.tot > 0 ? parseFloat((m.ok/m.tot*100).toFixed(1)) : null);
  const confFilt = confData.filter(v => v !== null);
  const lblsFilt = mesesD.map(m => m.lbl).filter((_, i) => confData[i] !== null);

  const fmtKg = v => v >= 1000 ? `${(v/1000).toFixed(1)} t` : `${v.toFixed(0)} kg`;

  return (
    <div className="fade-in">
      <div className="g4 mb24">
        <Kpi icon="check" label="CD — Conformidad"
             value={`${cd.ok} / ${total}`} note={`${tasaCD}% aprobadas`}
             progress={total > 0 ? cd.ok/total*100 : 0} color="var(--ok)" />
        <Kpi icon="check" label="AP — Conformidad"
             value={`${ap.ok} / ${total}`} note={`${tasaAP}% aprobadas`}
             progress={total > 0 ? ap.ok/total*100 : 0} color="var(--ok)" />
        <Kpi icon="factory" label="KG aprobados (CD)"
             value={fmtKg(kgOk)} note={`de ${fmtKg(kgTotal)} totales`}
             progress={kgTotal > 0 ? kgOk/kgTotal*100 : 0} color="var(--accent)" />
        <Kpi icon="alert" label="Reprocesos"
             value={reprocesos} note="eventos de rechazo CD+AP" color="var(--err)" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="mb24">
        <Vital label="Control Dimensional (CD)" value={tasaCD} unit="%"
               segments={[
                 { label:'Aprobado', pct: total>0?parseFloat((cd.ok/total*100).toFixed(1)):0, color:'var(--ok)' },
                 { label:'Rechazado', pct: total>0?parseFloat((cd.err/total*100).toFixed(1)):0, color:'var(--err)' },
                 { label:'Pendiente', pct: total>0?parseFloat((cd.pend/total*100).toFixed(1)):0, color:'var(--sf2)' },
               ]}
               note={`${cd.ok} aprobadas · ${cd.err} rechazadas · ${cd.pend} pendientes`} />
        <Vital label="Apto Pintura (AP)" value={tasaAP} unit="%"
               segments={[
                 { label:'Aprobado', pct: total>0?parseFloat((ap.ok/total*100).toFixed(1)):0, color:'var(--ok)' },
                 { label:'Rechazado', pct: total>0?parseFloat((ap.err/total*100).toFixed(1)):0, color:'var(--err)' },
                 { label:'Pendiente', pct: total>0?parseFloat((ap.pend/total*100).toFixed(1)):0, color:'var(--sf2)' },
               ]}
               note={`${ap.ok} aprobadas · ${ap.err} rechazadas · ${ap.pend} pendientes`} />
        <Vital label="Pintura (PINT)" value={tasaPINT} unit="%"
               segments={[
                 { label:'Aprobado', pct: total>0?parseFloat((pint.ok/total*100).toFixed(1)):0, color:'var(--ok)' },
                 { label:'Rechazado', pct: total>0?parseFloat((pint.err/total*100).toFixed(1)):0, color:'var(--err)' },
                 { label:'Pendiente', pct: total>0?parseFloat((pint.pend/total*100).toFixed(1)):0, color:'var(--sf2)' },
               ]}
               note={`${pint.ok} aprobadas · ${pint.err} rechazadas · ${pint.pend} pendientes`} />
      </div>

      <div className="g2 mb24">
        <Card title="Conformidad CD — 12 meses (%)" icon="pulse">
          <div className="card-body">
            {confFilt.length > 0
              ? <AreaChart data={confFilt} labels={lblsFilt} height={200}
                           color="var(--ok)" objetivo={90} unit="%" />
              : <div style={{padding:32,textAlign:'center',color:'var(--t3)',fontSize:13}}>Sin eventos en el período</div>
            }
          </div>
        </Card>
        <Card title="OTs con más rechazos (CD)" icon="alert">
          {rankOTs.length === 0
            ? <div style={{padding:24,textAlign:'center',color:'var(--t3)',fontSize:13}}>Sin rechazos registrados</div>
            : <div className="tbl-wrap">
                <table>
                  <thead><tr>
                    <th>OT</th>
                    <th style={{textAlign:'right'}}>Rechazos</th>
                    <th style={{textAlign:'right'}}>Total</th>
                    <th>Tasa</th>
                  </tr></thead>
                  <tbody>
                    {rankOTs.map(o => (
                      <tr key={o.id}>
                        <td className="cell-strong">{o.numero}</td>
                        <td style={{textAlign:'right',color:'var(--err)',fontWeight:700}}>{o.rechazos}</td>
                        <td style={{textAlign:'right'}} className="t3 f12">{o.total}</td>
                        <td><Badge tipo={o.tasa > 10 ? 'danger' : o.tasa > 5 ? 'warning' : 'neutral'}>{o.tasa}%</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </Card>
      </div>

      <div className="g2">
        <HubButton icon="clipboard" title="Inspecciones por OT"
                   subtitle={`${total} subpiezas · ${ots.length} OTs`}
                   onClick={() => onNavigate(1)} color="var(--ok)" />
        <HubButton icon="pulse" title="Tendencia de conformidad"
                   subtitle="Serie mensual 12 meses"
                   onClick={() => onNavigate(2)} color="var(--ok)" />
      </div>
    </div>
  );
}

/* =========================================================
   CALIDAD — Inspecciones por OT (drill-down)
   ========================================================= */
function CalidadInspecciones({ data }) {
  const [otSel,      setOtSel]      = _us(null);
  const [piezaSel,   setPiezaSel]   = _us(null);
  const [filtroProc, setFiltroProc] = _us('Todos');
  const [filtroEst,  setFiltroEst]  = _us('Todos');

  if (!data) return (
    <div className="fade-in" style={{ padding:60, textAlign:'center', color:'var(--t3)' }}>
      Cargando datos de calidad…
    </div>
  );

  const { ots, otsById, piezas, piezasById, subpiezas, insMap,
          cdProc, apProc, lpBySp, lotesById } = data;

  // Mapa sp.id → subpieza para trazabilidad evento → OT
  const spById = {};
  subpiezas.forEach(sp => { spById[sp.id] = sp; });

  // Rechazos históricos acumulados por OT (eventos CD+AP, no el estado actual)
  const rechazosPerOT = {};
  data.eventos.forEach(ev => {
    if (ev.accion !== 'rejected') return;
    const ins = data.insByInsId[ev.inspeccion_id];
    if (!ins) return;
    const proc = data.procsById[ins.proceso_id];
    if (!proc || (proc.codigo !== 'cd' && proc.codigo !== 'ap')) return;
    const sp = spById[ins.subpieza_id];
    if (!sp) return;
    const pieza = piezasById[sp.pieza_id];
    if (!pieza) return;
    rechazosPerOT[pieza.ot_id] = (rechazosPerOT[pieza.ot_id] || 0) + 1;
  });

  // Tabla de OTs con stats agregados
  const otStats = ots.map(ot => {
    const otPiezas = piezas.filter(p => p.ot_id === ot.id);
    if (!otPiezas.length) return null;
    const otPIds = new Set(otPiezas.map(p => p.id));
    const otSps = subpiezas.filter(sp => otPIds.has(sp.pieza_id));
    const total = otSps.length;
    if (!total) return null;
    let cdOk=0, apOk=0, pintOk=0;
    otSps.forEach(sp => {
      const cdE   = cdProc ? (insMap[`${sp.id}_${cdProc.id}`]?.estado||'pending') : 'pending';
      const apE   = apProc ? (insMap[`${sp.id}_${apProc.id}`]?.estado||'pending') : 'pending';
      const pintE = _calPintEst(sp.id, lotesById, lpBySp);
      if (cdE   === 'approved') cdOk++;
      if (apE   === 'approved') apOk++;
      if (pintE === 'approved') pintOk++;
    });
    const cdErr = rechazosPerOT[ot.id] || 0;
    return { ...ot, total, cdOk, apOk, pintOk, cdErr,
             tasaCD: (cdOk/total*100).toFixed(0) };
  }).filter(Boolean);

  // Vista detalle de una PIEZA (eventos de inspección)
  if (otSel && piezaSel) {
    const ot    = otsById[otSel];
    const pieza = piezasById[piezaSel];
    const spsDePieza = subpiezas.filter(sp => sp.pieza_id === piezaSel);
    const spIds = new Set(spsDePieza.map(sp => sp.id));

    // Construir mapa inspección → subpieza+proceso
    const insDesPieza = data.inspecciones.filter(i => spIds.has(i.subpieza_id));
    const insIdSet = new Set(insDesPieza.map(i => i.id));
    const insDesPiezaById = {};
    insDesPieza.forEach(i => { insDesPiezaById[i.id] = i; });

    // Eventos de esas inspecciones, más recientes primero
    const evts = data.eventos
      .filter(ev => insIdSet.has(ev.inspeccion_id))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Mapa subpieza_id → numero
    const spNumero = {};
    spsDePieza.forEach(sp => { spNumero[sp.id] = sp.numero || sp.id; });

    return (
      <div className="fade-in">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={() => setPiezaSel(null)}
                  style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:6,
                           padding:'5px 14px', color:'var(--t2)', cursor:'pointer', fontSize:12 }}>
            ← Volver
          </button>
          <span className="t3 f12">OT</span>
          <span style={{ fontWeight:700, color:'var(--t1)' }}>{ot?.numero}</span>
          <span className="t3 f12">›</span>
          <span style={{ fontWeight:600, color:'var(--t1)' }}>{pieza?.pos}</span>
          <span className="t3 f12">—</span>
          <span className="t3 f12">{pieza?.denom}</span>
        </div>

        {evts.length === 0
          ? <div className="card" style={{ padding:32, textAlign:'center', color:'var(--t3)', fontSize:13 }}>
              Sin eventos de inspección registrados para esta pieza en los últimos 12 meses
            </div>
          : <div className="card">
              <div className="tbl-wrap">
                <table>
                  <thead><tr>
                    <th>Subpieza</th>
                    <th>Proceso</th>
                    <th>Fecha</th>
                    <th>Inspector</th>
                    <th>Estado</th>
                    <th>Observación</th>
                  </tr></thead>
                  <tbody>
                    {evts.map(ev => {
                      const ins   = insDesPiezaById[ev.inspeccion_id];
                      const proc  = ins ? data.procsById[ins.proceso_id] : null;
                      const insp  = ev.inspector_id ? data.usuariosById[String(ev.inspector_id)] : null;
                      const nota  = ev.texto || ins?.observaciones || '';
                      return (
                        <tr key={ev.id}>
                          <td className="cell-id">{spNumero[ins?.subpieza_id] || '—'}</td>
                          <td style={{ fontWeight:600, textTransform:'uppercase', fontSize:11 }}>
                            {proc?.codigo?.toUpperCase() || '—'}
                          </td>
                          <td className="t3 f12">{_calFmtFecha(ev.fecha)}</td>
                          <td className="t2">{insp?.nombre || `#${ev.inspector_id}`}</td>
                          <td><Badge tipo={_calBadge(ev.accion)}>{_calLbl(ev.accion)}</Badge></td>
                          <td style={{ color:'var(--t2)', fontSize:12, maxWidth:300 }}>
                            {nota || <span className="t3">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        }
      </div>
    );
  }

  // Vista detalle de una OT
  if (otSel) {
    const ot = otsById[otSel];
    const otPiezas = piezas
      .filter(p => p.ot_id === otSel)
      .sort((a, b) => (a.pos||'').localeCompare(b.pos||''));

    const estNorm = { 'Aprobado':'approved', 'Rechazado':'rejected', 'Pendiente':'pending' };

    function aggrPieza(pieza, procId, usePint) {
      const sps = subpiezas.filter(sp => sp.pieza_id === pieza.id);
      if (!sps.length) return 'pending';
      const estados = sps.map(sp =>
        usePint
          ? _calPintEst(sp.id, lotesById, lpBySp)
          : (insMap[`${sp.id}_${procId}`]?.estado||'pending')
      );
      if (estados.every(e => e === 'approved')) return 'approved';
      if (estados.some(e => e === 'rejected'))  return 'rejected';
      if (estados.some(e => e === 'approved'))  return 'partial';
      return 'pending';
    }

    // KPIs de la OT
    const otSps = subpiezas.filter(sp => {
      const p = piezasById[sp.pieza_id];
      return p && p.ot_id === otSel;
    });
    const otTotal = otSps.length;
    let otCdOk=0, otApOk=0, otPintOk=0;
    otSps.forEach(sp => {
      if (cdProc && insMap[`${sp.id}_${cdProc.id}`]?.estado === 'approved') otCdOk++;
      if (apProc && insMap[`${sp.id}_${apProc.id}`]?.estado === 'approved') otApOk++;
      if (_calPintEst(sp.id, lotesById, lpBySp) === 'approved') otPintOk++;
    });

    return (
      <div className="fade-in">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => { setOtSel(null); setPiezaSel(null); setFiltroProc('Todos'); setFiltroEst('Todos'); }}
                  style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:6,
                           padding:'5px 14px', color:'var(--t2)', cursor:'pointer', fontSize:12 }}>
            ← Volver
          </button>
          <span className="t3 f12">OT</span>
          <span style={{ fontWeight:700, color:'var(--t1)' }}>{ot?.numero}</span>
          {ot?.proyectos?.nombre && <span className="t3 f12">· {ot.proyectos.nombre}</span>}
        </div>

        <div className="g3 mb24">
          <Kpi icon="check" label="CD" value={`${otCdOk} / ${otTotal}`}
               note={`${otTotal > 0 ? (otCdOk/otTotal*100).toFixed(0) : 0}% aprobadas`}
               progress={otTotal > 0 ? otCdOk/otTotal*100 : 0} color="var(--ok)" />
          <Kpi icon="check" label="AP" value={`${otApOk} / ${otTotal}`}
               note={`${otTotal > 0 ? (otApOk/otTotal*100).toFixed(0) : 0}% aprobadas`}
               progress={otTotal > 0 ? otApOk/otTotal*100 : 0} color="var(--ok)" />
          <Kpi icon="factory" label="PINT" value={`${otPintOk} / ${otTotal}`}
               note={`${otTotal > 0 ? (otPintOk/otTotal*100).toFixed(0) : 0}% aprobadas`}
               progress={otTotal > 0 ? otPintOk/otTotal*100 : 0} color="var(--accent)" />
        </div>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
          <FilterChips options={['Todos','CD','AP','PINT']} active={filtroProc} onChange={setFiltroProc} />
          <FilterChips options={['Todos','Aprobado','Rechazado','Pendiente']} active={filtroEst} onChange={setFiltroEst} />
        </div>

        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Pos</th><th>Denominación</th>
                <th style={{textAlign:'center'}}>Qty</th>
                <th>CD</th><th>AP</th><th>PINT</th>
                <th style={{textAlign:'right'}}>KG/u</th>
              </tr></thead>
              <tbody>
                {otPiezas.map(pieza => {
                  const cdE   = cdProc ? aggrPieza(pieza, cdProc.id, false) : 'pending';
                  const apE   = apProc ? aggrPieza(pieza, apProc.id, false) : 'pending';
                  const pintE = aggrPieza(pieza, null, true);

                  if (filtroProc !== 'Todos') {
                    const pE = filtroProc === 'CD' ? cdE : filtroProc === 'AP' ? apE : pintE;
                    if (filtroEst !== 'Todos' && pE !== estNorm[filtroEst]) return null;
                  } else if (filtroEst !== 'Todos') {
                    const t = estNorm[filtroEst];
                    if (cdE !== t && apE !== t && pintE !== t) return null;
                  }

                  const spCnt = subpiezas.filter(sp => sp.pieza_id === pieza.id).length;
                  return (
                    <tr key={pieza.id} onClick={() => setPiezaSel(pieza.id)} style={{ cursor:'pointer' }}>
                      <td className="cell-id">{pieza.pos || '—'}</td>
                      <td className="cell-strong">{pieza.denom || '—'}</td>
                      <td style={{textAlign:'center'}} className="t3 f12">{spCnt}</td>
                      <td><Badge tipo={_calBadge(cdE)}>{_calLbl(cdE)}</Badge></td>
                      <td><Badge tipo={_calBadge(apE)}>{_calLbl(apE)}</Badge></td>
                      <td><Badge tipo={_calBadge(pintE)}>{_calLbl(pintE)}</Badge></td>
                      <td style={{textAlign:'right'}} className="t3 f12">
                        {pieza.peso_unit ? `${pieza.peso_unit} kg` : '—'}
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Lista de OTs
  return (
    <div className="fade-in card">
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>OT</th><th>Subpiezas</th>
            <th style={{minWidth:80}}>CD</th>
            <th style={{minWidth:80}}>AP</th>
            <th style={{minWidth:80}}>PINT</th>
            <th style={{textAlign:'right'}}>Rechazos</th>
            <th>Tasa CD</th>
          </tr></thead>
          <tbody>
            {otStats.map(ot => (
              <tr key={ot.id} onClick={() => setOtSel(ot.id)} style={{ cursor:'pointer' }}>
                <td className="cell-strong">{ot.numero}</td>
                <td className="t3 f12">{ot.total}</td>
                <td><ProgBar value={ot.cdOk} max={ot.total} color="var(--ok)" /></td>
                <td><ProgBar value={ot.apOk} max={ot.total} color="var(--ok)" /></td>
                <td><ProgBar value={ot.pintOk} max={ot.total} color="var(--ok)" /></td>
                <td style={{ textAlign:'right',
                             color: ot.cdErr > 0 ? 'var(--err)' : 'var(--t3)',
                             fontWeight: ot.cdErr > 0 ? 700 : 400 }}>
                  {ot.cdErr || '—'}
                </td>
                <td>
                  <Badge tipo={ot.tasaCD >= 90 ? 'success' : ot.tasaCD >= 70 ? 'warning' : 'danger'}>
                    {ot.tasaCD}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   CALIDAD — Conformidad (tendencia + inspectores)
   ========================================================= */
function CalidadConformidad({ data }) {
  if (!data) return (
    <div className="fade-in" style={{ padding:60, textAlign:'center', color:'var(--t3)' }}>
      Cargando datos de calidad…
    </div>
  );

  const { eventos, insByInsId, procsById, usuariosById } = data;

  const now = new Date();
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { key:`${d.getFullYear()}-${d.getMonth()}`, lbl:_CAL_MESES[d.getMonth()],
             cd:{ok:0,tot:0}, ap:{ok:0,tot:0} };
  });
  const mIdx = {};
  meses.forEach((m, i) => { mIdx[m.key] = i; });

  eventos.forEach(ev => {
    const ins = insByInsId[ev.inspeccion_id]; if (!ins) return;
    const proc = procsById[ins.proceso_id];
    if (!proc || (proc.codigo !== 'cd' && proc.codigo !== 'ap')) return;
    const d = new Date(ev.fecha);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const i = mIdx[k]; if (i === undefined) return;
    const b = proc.codigo === 'cd' ? meses[i].cd : meses[i].ap;
    if (ev.accion === 'approved' || ev.accion === 'rejected') {
      b.tot++;
      if (ev.accion === 'approved') b.ok++;
    }
  });

  const confCD = meses.map(m => m.cd.tot > 0 ? parseFloat((m.cd.ok/m.cd.tot*100).toFixed(1)) : null);
  const lbls   = meses.map(m => m.lbl);
  const cdVals = confCD.filter(v => v !== null);
  const cdLbls = lbls.filter((_, i) => confCD[i] !== null);

  const best  = cdVals.length ? Math.max(...cdVals) : null;
  const worst = cdVals.length ? Math.min(...cdVals) : null;
  const bestLbl  = best  !== null ? lbls[confCD.indexOf(best)]  : '—';
  const worstLbl = worst !== null ? lbls[confCD.indexOf(worst)] : '—';

  // Ranking inspectores — agrupado por OT+proceso+inspector+minuto+acción
  // para que un lote de N piezas del mismo OT cuente como una sola inspección
  const spByIdConf = {};
  data.subpiezas.forEach(sp => { spByIdConf[sp.id] = sp; });

  const inspGrupos = {};
  eventos.forEach(ev => {
    const ins = insByInsId[ev.inspeccion_id]; if (!ins) return;
    const proc = procsById[ins.proceso_id];
    if (!proc || (proc.codigo !== 'cd' && proc.codigo !== 'ap')) return;
    if (!ev.inspector_id) return;
    const sp    = spByIdConf[ins.subpieza_id];
    const pieza = sp ? data.piezasById[sp.pieza_id] : null;
    const d     = new Date(ev.fecha);
    const min   = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    const gk    = `${pieza?.ot_id||'?'}_${ins.proceso_id}_${ev.inspector_id}_${min}_${ev.accion}`;
    inspGrupos[gk] = { uid: String(ev.inspector_id), accion: ev.accion };
  });

  const inspStats = {};
  Object.values(inspGrupos).forEach(({ uid, accion }) => {
    if (!inspStats[uid]) inspStats[uid] = {
      id:uid, nombre: usuariosById[uid]?.nombre || `Inspector ${uid}`, tot:0, rej:0
    };
    inspStats[uid].tot++;
    if (accion === 'rejected') inspStats[uid].rej++;
  });
  const rankInsp = Object.values(inspStats).sort((a, b) => b.tot - a.tot).slice(0, 10);

  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Kpi icon="check" label="Mejor mes (CD)"
             value={best !== null ? `${best}%` : '—'} note={bestLbl} color="var(--ok)" />
        <Kpi icon="alert" label="Peor mes (CD)"
             value={worst !== null ? `${worst}%` : '—'} note={worstLbl} color="var(--err)" />
      </div>

      <Card title="Conformidad CD — 12 meses (%)" icon="pulse">
        <div className="card-body">
          {cdVals.length > 0
            ? <AreaChart data={cdVals} labels={cdLbls} height={220}
                         color="var(--ok)" objetivo={90} unit="%" />
            : <div style={{padding:32,textAlign:'center',color:'var(--t3)',fontSize:13}}>
                Sin eventos de inspección en el período
              </div>
          }
        </div>
      </Card>

      {rankInsp.length > 0 && (
        <div style={{ marginTop:20 }}>
          <Card title="Inspectores — actividad últimos 12 meses" icon="users">
            <div className="tbl-wrap">
              <table>
                <thead><tr>
                  <th>Inspector</th>
                  <th style={{textAlign:'right'}}>Inspecciones</th>
                  <th style={{textAlign:'right'}}>Rechazos</th>
                  <th>Tasa rechazo</th>
                </tr></thead>
                <tbody>
                  {rankInsp.map(ins => {
                    const tasa = ins.tot > 0 ? (ins.rej/ins.tot*100).toFixed(1) : '0.0';
                    return (
                      <tr key={ins.id}>
                        <td className="cell-strong">{ins.nombre}</td>
                        <td style={{textAlign:'right'}}>{ins.tot}</td>
                        <td style={{textAlign:'right', color: ins.rej>0 ? 'var(--warn)' : 'var(--t3)'}}>
                          {ins.rej}
                        </td>
                        <td>
                          <Badge tipo={tasa>20?'danger':tasa>5?'warning':'neutral'}>{tasa}%</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CALIDAD — Actividad diaria
   ========================================================= */
function CalidadActividad({ data }) {
  const _fmtKey = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const [fechaSel, setFechaSel] = _us(_fmtKey(hoy));

  if (!data) return (
    <div className="fade-in" style={{ padding:60, textAlign:'center', color:'var(--t3)' }}>
      Cargando datos de calidad…
    </div>
  );

  const { eventos, insByInsId, procsById, usuariosById, subpiezas, piezasById, otsById } = data;

  const spById = {};
  subpiezas.forEach(sp => { spById[sp.id] = sp; });

  // Agrupar eventos por fecha
  const byDate = {};
  eventos.forEach(ev => {
    const k = _fmtKey(new Date(ev.fecha));
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(ev);
  });

  // Últimos 30 días para el calendario
  const dias30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(hoy); d.setDate(d.getDate() - 29 + i);
    const k = _fmtKey(d);
    return { key:k, dia:d.getDate(), cnt: byDate[k]?.length || 0 };
  });

  // Eventos del día seleccionado
  const evtsDia = (byDate[fechaSel] || [])
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Agrupar por OT+proceso+inspector+minuto+acción — un lote de N piezas del mismo OT = 1 inspección
  const evtGrupos = [];
  const grupoIdx  = {};
  evtsDia.forEach(ev => {
    const ins   = insByInsId[ev.inspeccion_id];
    const sp    = ins ? spById[ins.subpieza_id] : null;
    const pieza = sp ? piezasById[sp.pieza_id] : null;
    const d     = new Date(ev.fecha);
    const min   = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    const gk    = `${pieza?.ot_id||'?'}_${ins?.proceso_id||'?'}_${ev.inspector_id||'?'}_${min}_${ev.accion}`;
    if (grupoIdx[gk] !== undefined) {
      evtGrupos[grupoIdx[gk]].cnt++;
    } else {
      grupoIdx[gk] = evtGrupos.length;
      evtGrupos.push({ ev, cnt: 1 });
    }
  });

  // KPIs del día — contamos grupos/inspecciones reales, no subpiezas individuales
  let diaOk = 0, diaErr = 0, diaOkSubs = 0, diaErrSubs = 0;
  const porProc = {};
  evtGrupos.forEach(({ ev, cnt }) => {
    const ins  = insByInsId[ev.inspeccion_id]; if (!ins) return;
    const proc = procsById[ins.proceso_id];    if (!proc) return;
    const cod  = proc.codigo;
    if (!porProc[cod]) porProc[cod] = { ok:0, err:0 };
    if (ev.accion === 'approved') { diaOk++; diaOkSubs += cnt; porProc[cod].ok++; }
    if (ev.accion === 'rejected') { diaErr++; diaErrSubs += cnt; porProc[cod].err++; }
  });

  const ayer = new Date(hoy); ayer.setDate(ayer.getDate()-1);
  const esHoy  = fechaSel === _fmtKey(hoy);
  const esAyer = fechaSel === _fmtKey(ayer);
  const [y, mo, d] = fechaSel.split('-');
  const fmtDiaLabel = esHoy ? 'Hoy' : esAyer ? 'Ayer' : `${d}/${mo}/${y}`;
  const fmtFechaSub = `${d}/${mo}/${y}`;

  const navDir = dir => {
    const nd = new Date(fechaSel + 'T00:00:00');
    nd.setDate(nd.getDate() + dir);
    if (_fmtKey(nd) <= _fmtKey(hoy)) setFechaSel(_fmtKey(nd));
  };

  const heatColor = cnt => {
    if (!cnt) return 'var(--sf2)';
    if (cnt < 5)  return 'rgba(62,207,142,0.22)';
    if (cnt < 15) return 'rgba(62,207,142,0.55)';
    return 'rgba(62,207,142,0.88)';
  };
  const heatTxt = cnt => cnt >= 5 ? (cnt < 15 ? 'var(--t1)' : '#fff') : 'var(--t3)';

  return (
    <div className="fade-in">
      {/* Calendario de actividad */}
      <Card title="Actividad — últimos 30 días" icon="pulse">
        <div style={{ padding:'12px 16px 4px', display:'flex', flexWrap:'wrap', gap:5 }}>
          {dias30.map(d => (
            <div key={d.key} onClick={() => setFechaSel(d.key)}
                 title={`${d.key}: ${d.cnt} eventos`}
                 style={{
                   width:30, height:30, borderRadius:5, cursor:'pointer',
                   background: d.key === fechaSel ? 'var(--accent)' : heatColor(d.cnt),
                   border: `1px solid ${d.key === fechaSel ? 'transparent' : 'var(--bd)'}`,
                   display:'flex', alignItems:'center', justifyContent:'center',
                   fontSize:10, fontWeight:600,
                   color: d.key === fechaSel ? '#fff' : heatTxt(d.cnt),
                   transition:'all .1s',
                 }}>
              {d.dia}
            </div>
          ))}
        </div>
        <div style={{ padding:'6px 16px 12px', fontSize:11, color:'var(--t3)', display:'flex', gap:14 }}>
          <span>Sin actividad</span>
          <span style={{color:'rgba(62,207,142,0.7)'}}>● Baja (1–4)</span>
          <span style={{color:'rgba(62,207,142,0.9)'}}>● Media (5–14)</span>
          <span style={{color:'var(--ok)'}}>● Alta (15+)</span>
        </div>
      </Card>

      {/* Navegación de día */}
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0 16px' }}>
        <button onClick={() => navDir(-1)}
                style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:6,
                         padding:'6px 14px', cursor:'pointer', color:'var(--t2)', fontSize:15 }}>‹</button>
        <div style={{ fontWeight:700, fontSize:20, color:'var(--t1)', minWidth:80 }}>{fmtDiaLabel}</div>
        <button onClick={() => navDir(1)} disabled={esHoy}
                style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:6,
                         padding:'6px 14px', cursor: esHoy ? 'default' : 'pointer',
                         color: esHoy ? 'var(--t3)' : 'var(--t2)', fontSize:15 }}>›</button>
        <span className="t3 f12">{fmtFechaSub}</span>
        {evtGrupos.length > 0 && (
          <span className="t3 f12">
            · {evtGrupos.length} {evtGrupos.length === 1 ? 'inspección' : 'inspecciones'}
            {evtsDia.length > evtGrupos.length && ` (${evtsDia.length} subpiezas)`}
          </span>
        )}
      </div>

      {evtGrupos.length === 0
        ? <div className="card" style={{ padding:48, textAlign:'center', color:'var(--t3)', fontSize:14 }}>
            Sin actividad de inspección registrada para este día
          </div>
        : <>
            {/* KPIs del día — inspecciones reales (grupos), no subpiezas */}
            <div className="g4 mb24">
              <Kpi icon="check" label="Aprobadas"
                   value={diaOk}
                   note={diaOkSubs > diaOk ? `${diaOkSubs} subpiezas en total` : 'inspecciones aprobadas'}
                   color="var(--ok)" />
              <Kpi icon="alert" label="Rechazadas"
                   value={diaErr}
                   note={diaErrSubs > diaErr ? `${diaErrSubs} subpiezas en total` : 'inspecciones rechazadas'}
                   color="var(--err)" />
              <Kpi icon="clipboard" label="CD"
                   value={porProc['cd'] ? `${porProc['cd'].ok} ✓  ${porProc['cd'].err} ✗` : '—'}
                   note="control dimensional" color="var(--accent)" />
              <Kpi icon="check" label="AP"
                   value={porProc['ap'] ? `${porProc['ap'].ok} ✓  ${porProc['ap'].err} ✗` : '—'}
                   note="apto pintura" color="var(--accent)" />
            </div>

            {/* Feed del día — una fila por grupo/inspección, ×N si es lote */}
            <div className="card">
              <div className="tbl-wrap">
                <table>
                  <thead><tr>
                    <th>Hora</th>
                    <th>OT</th>
                    <th>Pieza</th>
                    <th>Proc.</th>
                    <th>Inspector</th>
                    <th>Estado</th>
                    <th>Observación</th>
                  </tr></thead>
                  <tbody>
                    {evtGrupos.map(({ ev, cnt }) => {
                      const ins   = insByInsId[ev.inspeccion_id];
                      const proc  = ins ? procsById[ins.proceso_id] : null;
                      const sp    = ins ? spById[ins.subpieza_id] : null;
                      const pieza = sp ? piezasById[sp.pieza_id] : null;
                      const ot    = pieza ? otsById[pieza.ot_id] : null;
                      const insp  = ev.inspector_id ? usuariosById[String(ev.inspector_id)] : null;
                      const hora  = new Date(ev.fecha);
                      const horaStr = `${hora.getHours().toString().padStart(2,'0')}:${hora.getMinutes().toString().padStart(2,'0')}`;
                      return (
                        <tr key={ev.id}>
                          <td className="cell-id">{horaStr}</td>
                          <td className="cell-strong">{ot?.numero || '—'}</td>
                          <td className="t2" style={{fontSize:12}}>
                            <span>{pieza ? `${pieza.pos} — ${pieza.denom}` : '—'}</span>
                            {cnt > 1 && (
                              <span style={{ marginLeft:6, fontSize:10, fontWeight:700,
                                             background:'rgba(90,169,245,0.12)', color:'var(--info)',
                                             borderRadius:4, padding:'1px 6px', display:'inline-block' }}>
                                ×{cnt}
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight:700, textTransform:'uppercase', fontSize:11,
                                       color:'var(--accent)' }}>
                            {proc?.codigo?.toUpperCase() || '—'}
                          </td>
                          <td className="t2">{insp?.nombre || (ev.inspector_id ? `#${ev.inspector_id}` : '—')}</td>
                          <td><Badge tipo={_calBadge(ev.accion)}>{_calLbl(ev.accion)}</Badge></td>
                          <td style={{ color:'var(--t2)', fontSize:12, maxWidth:280 }}>
                            {ev.texto || <span className="t3">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
      }
    </div>
  );
}

/* =========================================================
   CALIDAD — entry point
   ========================================================= */
window.ViewCalidad = function ViewCalidad({ tab, onTabChange }) {
  const [data,  setData]  = _us(null);
  const [error, setError] = _us(null);

  _ue(() => {
    _loadCalidad()
      .then(setData)
      .catch(err => { console.error('[Calidad]', err); setError(String(err)); });
  }, []);

  if (error) return (
    <div className="fade-in" style={{ padding:40, textAlign:'center' }}>
      <div style={{ color:'var(--err)', fontSize:14, marginBottom:8 }}>Error cargando datos de calidad</div>
      <div style={{ color:'var(--t3)', fontSize:12 }}>{error}</div>
    </div>
  );

  if (tab === 0) return <CalidadPanel data={data} onNavigate={onTabChange} />;
  if (tab === 1) return <CalidadInspecciones data={data} />;
  if (tab === 2) return <CalidadConformidad data={data} />;
  if (tab === 3) return <CalidadActividad data={data} />;
  return <CalidadPanel data={data} onNavigate={onTabChange} />;
};

/* =========================================================
   FLOTA
   ========================================================= */
function FlotaEstado() {
  const [filter, setFilter] = _us('Todos');
  const opts = ['Todos', 'Operativo', 'En taller', 'Inactivo'];
  const rows = filter === 'Todos' ? D.flota : D.flota.filter(v => v.estado === filter);
  return (
    <div className="fade-in">
      <div className="g4 mb24">
        <Kpi icon="truck" label="Total flota" value="7" note="vehículos y equipos" color="#5aa9f5" />
        <Kpi icon="check" label="Operativos" value="5" note="en servicio" color="#3ecf8e" />
        <Kpi icon="wrench" label="En taller" value="1" note="AE-007 service" color="#f5b740" />
        <Kpi icon="alert" label="Alertas activas" value="4" note="VTV y mantenimiento" color="#f2585d" />
      </div>
      <div className="card fade-in">
        <FilterChips options={opts} active={filter} onChange={setFilter} />
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>ID</th><th>Modelo</th><th>Estado</th><th>Km / Hs</th><th>VTV</th><th>Alerta</th>
            </tr></thead>
            <tbody>
              {rows.map(v => (
                <tr key={v.id}>
                  <td className="cell-id">{v.id}</td>
                  <td className="cell-strong">{v.modelo}</td>
                  <td><Badge>{v.estado}</Badge></td>
                  <td className="cell-id">{v.km}</td>
                  <td className="t3 f12">{v.vtv}</td>
                  <td>
                    {v.alertaMsg
                      ? <Badge tipo={v.alerta}>{v.alertaMsg}</Badge>
                      : <span className="t3 f12">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FlotaVencimientos() {
  const lvMap = { danger: 'venc-danger', warning: 'venc-warning', info: 'venc-info-lv' };
  return (
    <div className="fade-in">
      <div className="venc-grid">
        {D.vencimientos.map((v, i) => (
          <div key={i} className={`venc-card ${lvMap[v.nivel] || ''}`}>
            <div className="venc-days">
              {v.dias}<span className="venc-days-unit">días</span>
            </div>
            <div className="venc-info">
              <div className="venc-item">{v.item}</div>
              <div className="venc-tipo">{v.tipo}</div>
              <div style={{ marginTop: 8 }}><Badge tipo={v.nivel}>{v.nivel === 'danger' ? 'Urgente' : v.nivel === 'warning' ? 'Próximo' : 'Próximo'}</Badge></div>
            </div>
          </div>
        ))}
        {/* Extra: seguro CH-220 y habilitacion CH-221 como demo */}
        <div className="venc-card">
          <div className="venc-days" style={{ color: 'var(--ok)' }}>59<span className="venc-days-unit">días</span></div>
          <div className="venc-info">
            <div className="venc-item">VTV CH-220</div>
            <div className="venc-tipo">VTV</div>
            <div style={{ marginTop: 8 }}><Badge tipo="success">Al día</Badge></div>
          </div>
        </div>
        <div className="venc-card">
          <div className="venc-days" style={{ color: 'var(--ok)' }}>120<span className="venc-days-unit">días</span></div>
          <div className="venc-info">
            <div className="venc-item">VTV CH-221</div>
            <div className="venc-tipo">VTV</div>
            <div style={{ marginTop: 8 }}><Badge tipo="success">Al día</Badge></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlotaMantenimiento() {
  const items = [
    { fecha:'28/05/26', vehiculo:'AE-007', desc:'Service 500hs — motor y filtros', tipo:'Correctivo', estado:'En curso' },
    { fecha:'15/05/26', vehiculo:'CH-221', desc:'Cambio de aceite y correas', tipo:'Preventivo', estado:'Realizado' },
    { fecha:'02/05/26', vehiculo:'FD-118', desc:'Frenos y neumáticos delanteros', tipo:'Correctivo', estado:'Realizado' },
    { fecha:'18/04/26', vehiculo:'GR-301', desc:'Revisión cable y pluma', tipo:'Preventivo', estado:'Realizado' },
    { fecha:'05/04/26', vehiculo:'CH-220', desc:'Service 50.000 km', tipo:'Preventivo', estado:'Realizado' },
  ];
  return (
    <div className="fade-in card">
      <div className="card-header">
        <div className="card-title"><Icon name="wrench" size={15} style={{ marginRight: 6 }} />Historial de mantenimiento</div>
      </div>
      <div className="card-body">
        {items.map((item, i) => (
          <div key={i} className="maint-item">
            <div className="maint-date">{item.fecha}</div>
            <div className="maint-body">
              <div className="maint-title">{item.vehiculo} — {item.desc}</div>
              <div className="maint-sub">{item.tipo}</div>
            </div>
            <Badge>{item.estado}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ViewFlota = function ViewFlota({ tab }) {
  const views = [<FlotaEstado />, <FlotaVencimientos />, <FlotaMantenimiento />];
  return views[tab] || views[0];
};

/* =========================================================
   NO CONFORMIDADES — Google Sheets (live)
   ========================================================= */
const _NC_SHEET = '1DUU8NaPtaatgMZ8jXJdGwTgIZM0jHU68lW14x8B4sKY';
const _NC_GID   = '2143908756';

function _parseNCDate(v) {
  if (!v) return null;
  const m = String(v).match(/Date\((\d+),(\d+),(\d+)/);
  return m ? new Date(+m[1], +m[2], +m[3]) : null;
}

const _NC_CLASIF_CLR = {
  'No conformidad':        '#f2585d',
  'Observacion':           '#f5b740',
  'Oportunidad de mejora': '#5aa9f5',
};
const _NC_SECTOR_CLR = {
  'Produccion':         '#e0218a', 'Calidad':           '#3ecf8e',
  'Cliente':            '#f2585d', 'Cliente (TERCERO)': '#f2585d',
  'Ingenieria':         '#f5b740', 'Compras':           '#5aa9f5',
  'SGC':                '#a78bfa', 'Directorio':        '#c084fc',
  'Auditoria Interna':  '#fb923c', 'Auditoria Externa': '#4ade80',
};

function NCPanel({ rows }) {
  const now = new Date();

  const abiertas          = rows.filter(r => r.estado === 'Abierta');
  const cerradas          = rows.filter(r => r.estado === 'Cerrada');
  const ncPurasAbiertas   = abiertas.filter(r => r.clasif === 'No conformidad');
  const deCliente         = rows.filter(r => r.sector === 'Cliente' || r.sector === 'Cliente (TERCERO)');
  const deClienteAbiertas = deCliente.filter(r => r.estado === 'Abierta');
  const tasaCierre        = rows.length > 0 ? Math.round((cerradas.length / rows.length) * 100) : 0;

  // Tendencia: 12 meses
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({
      label:   d.toLocaleDateString('es-AR', { month: 'short' }),
      count:   rows.filter(r => r.fecha && `${r.fecha.getFullYear()}-${r.fecha.getMonth()}` === k).length,
      current: i === 0,
    });
  }
  const maxMonth = Math.max(...months.map(m => m.count), 1);

  // Por clasificación
  const byClasif = {};
  rows.forEach(r => { if (r.clasif) byClasif[r.clasif] = (byClasif[r.clasif] || 0) + 1; });

  // Por sector (abiertas)
  const bySector = {};
  abiertas.forEach(r => { if (r.sector) bySector[r.sector] = (bySector[r.sector] || 0) + 1; });
  const topSectores = Object.entries(bySector).sort((a,b) => b[1]-a[1]).slice(0, 7);
  const maxSector   = topSectores[0]?.[1] || 1;

  // 5 últimas abiertas
  const ultimasAbiertas = [...abiertas]
    .sort((a,b) => (b.fecha?.getTime()||0) - (a.fecha?.getTime()||0))
    .slice(0, 5);

  const BAR_W = 30, BAR_GAP = 5, PAD_L = 26, PAD_R = 8, PAD_T = 10, CHART_H = 90;
  const svgW  = months.length * (BAR_W + BAR_GAP) + PAD_L + PAD_R;
  const _d    = d => d ? d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';

  return (
    <div className="fade-in">
      <div className="g4 mb20">
        <Kpi icon="alert" label="NC abiertas"
             value={abiertas.length} note={`de ${rows.length} históricas`} color="#f2585d" />
        <Kpi icon="alert" label="No conformidades"
             value={ncPurasAbiertas.length} note="abiertas · tipo crítico" color="var(--err)" />
        <Kpi icon="users" label="De cliente"
             value={deClienteAbiertas.length} note={`${deCliente.length} históricas`} color="#f5b740" />
        <Kpi icon="check" label="Tasa de cierre"
             value={`${tasaCierre}%`} note={`${cerradas.length} cerradas`}
             color="#3ecf8e" progress={tasaCierre} />
      </div>

      <div className="g2 mb20">
        <Card title="Registros por mes · últimos 12 meses" icon="barChart">
          <div className="card-body">
            <svg width={svgW} height={CHART_H + PAD_T + 24}
                 style={{ display:'block', minWidth:'100%' }}>
              {[0.25, 0.5, 0.75, 1].map(p => {
                const y = PAD_T + (1-p) * CHART_H;
                return (
                  <g key={p}>
                    <line x1={PAD_L} x2={svgW-PAD_R} y1={y} y2={y}
                          stroke="var(--bd)" strokeWidth={0.5} />
                    <text x={PAD_L-4} y={y+3} textAnchor="end"
                          fill="var(--t3)" fontSize={8}>
                      {Math.round(p * maxMonth)}
                    </text>
                  </g>
                );
              })}
              {months.map((m, i) => {
                const x = PAD_L + i * (BAR_W + BAR_GAP);
                const h = (m.count / maxMonth) * CHART_H;
                const y = PAD_T + CHART_H - h;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={BAR_W} height={Math.max(h, 1)}
                          fill={m.current ? '#3ecf8e' : 'var(--accent)'}
                          opacity={0.8} rx={2} />
                    {m.count > 0 && (
                      <text x={x+BAR_W/2} y={y-3} textAnchor="middle"
                            fill="var(--t2)" fontSize={8}>{m.count}</text>
                    )}
                    <text x={x+BAR_W/2} y={CHART_H+PAD_T+14} textAnchor="middle"
                          fill="var(--t3)" fontSize={8}>{m.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        <Card title="Por clasificación · histórico" icon="pie">
          <div className="card-body" style={{ display:'flex', gap:20, alignItems:'center' }}>
            <DonutChart
              segments={Object.entries(byClasif).map(([k,v]) => ({
                nombre:k, valor:v, color: _NC_CLASIF_CLR[k]||'#7c7589'
              }))}
              size={130} thickness={20} centerLabel={rows.length} />
            <div style={{ flex:1 }}>
              {Object.entries(byClasif).sort((a,b) => b[1]-a[1]).map(([k,v]) => (
                <div key={k} className="stat-row">
                  <div style={{ display:'flex', alignItems:'center', gap:7, flex:1 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%',
                                  background: _NC_CLASIF_CLR[k]||'#7c7589', flexShrink:0 }} />
                    <span className="stat-label f12">{k}</span>
                  </div>
                  <div className="stat-bar-w">
                    <div className="stat-bar-f"
                         style={{ width:`${(v/rows.length)*100}%`,
                                  background: _NC_CLASIF_CLR[k]||'#7c7589' }} />
                  </div>
                  <span className="stat-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="g2">
        <Card title="Abiertas por sector" icon="users">
          <div className="card-body">
            {topSectores.length === 0
              ? <div style={{ padding:'24px 0', textAlign:'center',
                              color:'var(--t2)', fontSize:13 }}>Sin NC abiertas</div>
              : topSectores.map(([sector, count]) => (
                  <div key={sector} className="stat-row">
                    <div style={{ display:'flex', alignItems:'center', gap:7, flex:1 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%',
                                    background: _NC_SECTOR_CLR[sector]||'#7c7589',
                                    flexShrink:0 }} />
                      <span className="stat-label f12">{sector}</span>
                    </div>
                    <div className="stat-bar-w">
                      <div className="stat-bar-f"
                           style={{ width:`${(count/maxSector)*100}%`,
                                    background: _NC_SECTOR_CLR[sector]||'#7c7589' }} />
                    </div>
                    <span className="stat-val">{count}</span>
                  </div>
                ))
            }
          </div>
        </Card>

        <Card title="Últimas NC abiertas" icon="alert">
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Nº</th><th>Fecha</th><th>Sector</th><th>Descripción</th><th>Tipo</th>
              </tr></thead>
              <tbody>
                {ultimasAbiertas.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign:'center', padding:24,
                                                  color:'var(--t2)' }}>Sin NC abiertas</td></tr>
                  : ultimasAbiertas.map(r => (
                      <tr key={r.id}>
                        <td className="cell-id">#{r.id}</td>
                        <td className="f12 t2">{_d(r.fecha)}</td>
                        <td className="f12">{r.sector}</td>
                        <td>
                          <div title={r.desc}
                               style={{ overflow:'hidden', textOverflow:'ellipsis',
                                        whiteSpace:'nowrap', maxWidth:200, fontSize:12 }}>
                            {r.desc}
                          </div>
                          {r.ref && <div className="f11 t3">{r.ref}</div>}
                        </td>
                        <td>
                          <Badge tipo={
                            r.clasif==='No conformidad' ? 'danger' :
                            r.clasif==='Observacion'    ? 'warning' : 'info'
                          }>{r.clasif||'—'}</Badge>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NCListado({ rows }) {
  const [fEstado, setFEstado] = _us('Todos');
  const [fClasif, setFClasif] = _us('Todas');
  const [fSector, setFSector] = _us('Todos');
  const [page,    setPage]    = _us(0);
  const PER_PAGE = 30;

  _ue(() => { setPage(0); }, [fEstado, fClasif, fSector]);

  const sectores = _um(() =>
    ['Todos', ...[...new Set(rows.map(r => r.sector).filter(Boolean))].sort()],
    [rows]
  );

  const filtered = _um(() =>
    rows.filter(r =>
      (fEstado === 'Todos' || r.estado === fEstado) &&
      (fClasif === 'Todas' || r.clasif === fClasif) &&
      (fSector === 'Todos' || r.sector === fSector)
    ).sort((a,b) => (b.fecha?.getTime()||0) - (a.fecha?.getTime()||0)),
    [rows, fEstado, fClasif, fSector]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE);
  const _d = d => d ? d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';

  return (
    <div className="fade-in">
      <div className="card" style={{ padding:'12px 16px', marginBottom:12 }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <div className="f11 t3 fw6" style={{ textTransform:'uppercase',
                                                   letterSpacing:'0.5px', marginBottom:5 }}>Estado</div>
            <FilterChips options={['Todos','Abierta','Cerrada']}
                         active={fEstado} onChange={setFEstado} />
          </div>
          <div>
            <div className="f11 t3 fw6" style={{ textTransform:'uppercase',
                                                   letterSpacing:'0.5px', marginBottom:5 }}>Clasificación</div>
            <FilterChips options={['Todas','No conformidad','Observacion','Oportunidad de mejora']}
                         active={fClasif} onChange={setFClasif} />
          </div>
          <div>
            <div className="f11 t3 fw6" style={{ textTransform:'uppercase',
                                                   letterSpacing:'0.5px', marginBottom:5 }}>Sector</div>
            <Select value={fSector} onChange={setFSector}
                    options={sectores.map(s => ({ val:s, label:s }))} />
          </div>
          <div style={{ marginLeft:'auto', fontSize:12, color:'var(--t2)', paddingBottom:2 }}>
            {filtered.length} registros
          </div>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Nº</th><th>Fecha</th><th>Sector</th><th>Descripción</th>
              <th>Clasificación</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {pageRows.map(r => (
                <tr key={r.id}>
                  <td className="cell-id">#{r.id}</td>
                  <td className="f12 t2">{_d(r.fecha)}</td>
                  <td className="f12">{r.sector||'—'}</td>
                  <td>
                    <div title={r.desc}
                         style={{ overflow:'hidden', textOverflow:'ellipsis',
                                  whiteSpace:'nowrap', maxWidth:340, fontSize:12 }}>
                      {r.desc}
                    </div>
                    {r.ref && <div className="f11 t3">{r.ref}</div>}
                  </td>
                  <td>
                    <Badge tipo={
                      r.clasif==='No conformidad' ? 'danger' :
                      r.clasif==='Observacion'    ? 'warning' : 'info'
                    }>{r.clasif||'—'}</Badge>
                  </td>
                  <td><Badge>{r.estado||'—'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'10px 16px', borderTop:'1px solid var(--bd)', fontSize:12 }}>
            <button onClick={() => setPage(p => Math.max(0, p-1))}
                    disabled={page===0} className="chip">← Anterior</button>
            <span className="t2">Página {page+1} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))}
                    disabled={page===totalPages-1} className="chip">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.ViewNC = function ViewNC({ tab }) {
  const [rows,    setRows]    = _us([]);
  const [loading, setLoading] = _us(true);
  const [errNC,   setErrNC]   = _us(null);

  _ue(() => {
    fetch(`https://docs.google.com/spreadsheets/d/${_NC_SHEET}/gviz/tq?tqx=out:json&gid=${_NC_GID}`)
      .then(r => r.text())
      .then(txt => {
        const json   = JSON.parse(txt.replace(/^[^\(]+\(/, '').replace(/\);\s*$/, ''));
        const parsed = (json.table?.rows || []).map(r => ({
          id:     r.c[0]?.v  || 0,
          fecha:  _parseNCDate(r.c[1]?.v),
          sector: r.c[3]?.v  || '',
          proceso: r.c[4]?.v || '',
          desc:   r.c[5]?.v  || '',
          ref:    r.c[6]?.v  || '',
          clasif: r.c[9]?.v  || '',
          estado: r.c[15]?.v || '',
          obs:    r.c[16]?.v || '',
        })).filter(r => r.id > 0 && r.desc);
        setRows(parsed);
        setLoading(false);
      })
      .catch(e => { setErrNC(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="card fade-in" style={{ padding:'48px', textAlign:'center', color:'var(--t2)' }}>
      Cargando No Conformidades...
    </div>
  );
  if (errNC) return (
    <div className="card fade-in" style={{ padding:'48px', textAlign:'center', color:'var(--err)' }}>
      Error al cargar: {errNC}
    </div>
  );
  return tab === 1 ? <NCListado rows={rows} /> : <NCPanel rows={rows} />;
};
