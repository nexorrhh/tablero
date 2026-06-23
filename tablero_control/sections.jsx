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

function PostulantesChart() {
  const dataRef  = _ur(null);
  const [estado,   setEstado]   = _us('cargando');
  const [total,    setTotal]    = _us(0);
  const [tooltip,  setTooltip]  = _us(null);

  /* ── Fetch y procesamiento ─────────────────────────────── */
  _ue(() => {
    let destroyed = false;

    function _parseSheetDate(cell) {
      if (!cell) return null;
      if (cell.v && typeof cell.v === 'string') {
        const m = cell.v.match(/Date\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return new Date(+m[1], +m[2], +m[3]);
      }
      if (cell.f) {
        const pts = cell.f.split(' ')[0].split('/');
        if (pts.length === 3) return new Date(+pts[2], +pts[1] - 1, +pts[0]);
      }
      return null;
    }

    (async () => {
      try {
        const hoy = new Date();

        /* ── Google Sheets ── */
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1aFwMjW8eNG0d2Y7mKdDQvaySm-s2vtSLSO7HBWu7aTE/gviz/tq?tqx=out:json&sheet=Postulantes';
        const txt   = await (await fetch(sheetUrl)).text();
        const sData = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));

        const cols      = sData.table.cols;
        const iMarca    = cols.findIndex(c => /marca|timestamp/i.test(c.label));
        const iEmail    = cols.findIndex(c => /correo|email/i.test(c.label));
        const iNombre   = cols.findIndex(c => c.label.toLowerCase() === 'nombre');
        const iApellido = cols.findIndex(c => c.label.toLowerCase() === 'apellido');

        const DIRECTOR     = 'cimolay47@gmail.com';
        const firstByEmail = new Map();
        const sinEmail     = [];

        for (const row of sData.table.rows) {
          const c        = row.c || [];
          const nombre   = (c[iNombre]?.v   || '').trim();
          const apellido = (c[iApellido]?.v || '').trim();
          if (!nombre && !apellido) continue;

          const email = (c[iEmail]?.v || '').trim().toLowerCase();
          const fecha = _parseSheetDate(c[iMarca]);

          if (!email || email === DIRECTOR) {
            if (fecha) sinEmail.push({ fecha });
          } else {
            const prev = firstByEmail.get(email);
            if (!prev || (fecha && fecha < prev.fecha)) {
              firstByEmail.set(email, { fecha });
            }
          }
        }

        const totalHist    = firstByEmail.size + sinEmail.length;
        const porMesSheets = new Map();
        [...firstByEmail.values(), ...sinEmail]
          .filter(p => p.fecha)
          .forEach(p => {
            const k = `${p.fecha.getFullYear()}-${p.fecha.getMonth()}`;
            porMesSheets.set(k, (porMesSheets.get(k) || 0) + 1);
          });

        /* ── Supabase: preseleccionados ── */
        const { url: sUrl, key } = window.SUPABASE_CONFIG;
        const hace12 = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1).toISOString();
        const preselResp = await fetch(
          `${sUrl}/preseleccionados?select=estado,created_at&created_at=gte.${hace12}`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` } }
        );
        const presel = await preselResp.json();
        const porMesSupabase = new Map();
        if (Array.isArray(presel)) {
          presel.forEach(d => {
            const dt = new Date(d.created_at);
            const k  = `${dt.getFullYear()}-${dt.getMonth()}`;
            const e  = porMesSupabase.get(k) || { activo: 0, descartado: 0 };
            if (d.estado === 'activo') e.activo++;
            else if (d.estado === 'descartado') e.descartado++;
            porMesSupabase.set(k, e);
          });
        }

        /* ── Últimos 12 meses ── */
        const ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const meses = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
          meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${ABREV[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` });
        }

        const labels     = meses.map(m => m.label);
        const postArr    = meses.map(m => porMesSheets.get(m.key) ?? 0);
        const preselArr  = meses.map(m => porMesSupabase.get(m.key)?.activo ?? 0);
        const descartArr = meses.map(m => porMesSupabase.get(m.key)?.descartado ?? 0);
        const sinProcArr = meses.map((_, i) => Math.max(0, postArr[i] - preselArr[i] - descartArr[i]));

        if (destroyed) return;
        dataRef.current = { labels, postArr, preselArr, descartArr, sinProcArr };
        setTotal(totalHist);
        setEstado('ok');

      } catch (_) {
        if (!destroyed) setEstado('error');
      }
    })();

    return () => { destroyed = true; };
  }, []);

  /* ── Render SVG ────────────────────────────────────────── */
  if (estado === 'cargando') return (
    <Card title="Postulantes — Últimos 12 meses" icon="userplus">
      <div style={{ textAlign:'center', padding:'48px', color:'var(--t2)', fontSize:13 }}>Cargando postulantes…</div>
    </Card>
  );
  if (estado === 'error') return (
    <Card title="Postulantes — Últimos 12 meses" icon="userplus">
      <div style={{ textAlign:'center', padding:'48px', color:'var(--err)', fontSize:13 }}>Error al cargar datos.</div>
    </Card>
  );

  const { labels, postArr, preselArr, descartArr, sinProcArr } = dataRef.current;
  const datasets = [
    { label: 'Preseleccionados', data: preselArr,  color: '#16a34a' },
    { label: 'Descartados',      data: descartArr, color: '#dc2626' },
    { label: 'Sin procesar',     data: sinProcArr, color: '#a0aec0' },
  ];

  const VW = 600, VH = 210;
  const padL = 28, padR = 8, padT = 10, padB = 46;
  const cW = VW - padL - padR, cH = VH - padT - padB;
  const n  = labels.length;
  const maxVal = Math.max(...postArr, 1);
  const toH    = (v) => (v / maxVal) * cH;
  const groupW = cW / n;
  const barW   = groupW * 0.62;
  const barOff = (groupW - barW) / 2;

  const tickStep = Math.max(1, Math.ceil(maxVal / 4));
  const ticks = [];
  for (let t = 0; t <= Math.ceil(maxVal / tickStep) * tickStep; t += tickStep) ticks.push(t);

  return (
    <Card
      title="Postulantes — Últimos 12 meses"
      icon="userplus"
      action={<span style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>{total} en el sistema</span>}
    >
      <div className="card-body" style={{ paddingBottom:4 }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height={VH} style={{ display:'block', overflow:'visible' }}>
          {ticks.map(t => {
            const y = padT + cH - toH(t);
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={VW - padR} y2={y} stroke="var(--bd)" strokeWidth={t === 0 ? 1 : 0.5} />
                <text x={padL - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill="var(--t3)">{t}</text>
              </g>
            );
          })}
          {labels.map((label, i) => {
            const x = padL + i * groupW + barOff;
            let cumV = 0;
            const segs = [];
            datasets.forEach(ds => {
              const v = ds.data[i] || 0;
              segs.push({ v, h: toH(v), y: padT + cH - toH(cumV + v), color: ds.color });
              cumV += v;
            });
            const isHov = tooltip?.idx === i;
            return (
              <g key={i}
                 onMouseMove={e => setTooltip({
                   idx: i, clientX: e.clientX, clientY: e.clientY,
                   mes: label,
                   pre:     preselArr[i],
                   desc:    descartArr[i],
                   sinProc: sinProcArr[i],
                   total:   postArr[i],
                 })}
                 onMouseLeave={() => setTooltip(null)}>
                <rect x={x} y={padT} width={barW} height={cH} fill="transparent" />
                {segs.map((seg, si) => seg.h > 0.3 ? (
                  <rect key={si} x={x} y={seg.y} width={barW} height={seg.h} fill={seg.color} opacity={isHov ? 0.75 : 1} />
                ) : null)}
                <text x={x + barW / 2} y={VH - padB + 14} textAnchor="middle" fontSize={8.5} fill="var(--t3)">{label}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ display:'flex', gap:20, paddingBottom:14, justifyContent:'center', flexWrap:'wrap' }}>
          {datasets.map(ds => (
            <div key={ds.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--t2)' }}>
              <div style={{ width:10, height:10, borderRadius:2, background:ds.color, flexShrink:0 }} />
              {ds.label}
            </div>
          ))}
        </div>
      </div>
      {tooltip && ReactDOM.createPortal(
        <div style={{
          position:'fixed', left:tooltip.clientX+14, top:Math.max(8,tooltip.clientY-140),
          background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:10,
          padding:'11px 14px', fontSize:12, pointerEvents:'none', zIndex:9999,
          boxShadow:'0 6px 24px rgba(0,0,0,0.28)', whiteSpace:'nowrap', minWidth:175, lineHeight:1.5,
        }}>
          <div style={{ fontWeight:700, marginBottom:8, color:'var(--t1)', fontSize:13 }}>{tooltip.mes}</div>
          {[
            { color:'#16a34a', label:'Preseleccionados', val: tooltip.pre },
            { color:'#dc2626', label:'Descartados',      val: tooltip.desc },
            { color:'#a0aec0', label:'Sin procesar',     val: tooltip.sinProc },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ width:9, height:9, borderRadius:2, background:row.color, display:'inline-block', flexShrink:0 }} />
              <span style={{ color:'var(--t2)', flex:1 }}>{row.label}:</span>
              <span style={{ fontWeight:600, color:'var(--t1)' }}>{row.val}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid var(--bd)', marginTop:7, paddingTop:7,
                        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'var(--t3)', fontSize:11 }}>Total postulantes:</span>
            <span style={{ fontWeight:700, color:'var(--t1)', fontSize:13 }}>{tooltip.total}</span>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
}

function _ProximamenteVital({ titulo, descripcion }) {
  return (
    <div className="vital" style={{ display:'flex', flexDirection:'column',
                                     alignItems:'center', justifyContent:'center',
                                     gap:10, textAlign:'center', minHeight:140 }}>
      <Icon name="clock" size={26} style={{ color:'var(--t3)' }} />
      <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)' }}>{titulo}</div>
      <div style={{ fontSize:12, color:'var(--t3)' }}>{descripcion}</div>
      <div style={{ padding:'3px 12px', borderRadius:12, background:'var(--sf2)',
                    border:'1px solid var(--bd)', fontSize:10, color:'var(--t3)',
                    letterSpacing:'0.07em', textTransform:'uppercase', fontWeight:600 }}>
        Próximamente
      </div>
    </div>
  );
}

function RRHHPanel({ onNavigate, empleados, loading }) {
  const activos  = empleados.filter(e => e.activo).length;
  const _now = new Date();
  const ingresosEsteMes = empleados.filter(e => {
    if (!e.fecha_ingreso) return false;
    const [y, m] = e.fecha_ingreso.split('-').map(Number);
    return y === _now.getFullYear() && m === _now.getMonth() + 1;
  }).length;

  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <_ProximamenteVital
          titulo="Presentismo y Ausentismo"
          descripcion="Indicadores de asistencia mensual" />
        <div>
          <HubButton icon="external" title="Nexo RRHH"
                     subtitle="Portal de Recursos Humanos"
                     onClick={() => window.open('https://portal.cimomet.com.ar', '_blank')} />
          <HubButton icon="external" title="Tablero de RRHH"
                     subtitle="Gestión y seguimiento de personal"
                     onClick={() => window.open('https://nexorrhh.github.io/tablerorrhh/Tablero_RRHH/', '_blank')} />
        </div>
      </div>
      <div className="g4">
        <Kpi icon="users" label="Plantel activo"
             value={loading ? '—' : String(activos)}
             note={loading ? '' : 'empleados activos'} />
        <Kpi icon="heart"    label="Ausentismo"        value="—"
             note="Próximamente" color="var(--t3)" />
        <Kpi icon="inbox"    label="Permisos pend."    value="—"
             note="Próximamente" color="var(--t3)" />
        <Kpi icon="userplus" label="Ingresos este mes"
             value={loading ? '—' : String(ingresosEsteMes)}
             note="Altas del mes en curso" color="#3ecf8e" />
      </div>
      <div style={{ marginTop:24 }}>
        <PostulantesChart />
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

function RRHHPermisos() {
  return (
    <div className="fade-in card" style={{ display:'flex', flexDirection:'column',
                                            alignItems:'center', justifyContent:'center',
                                            padding:'64px 32px', gap:16, textAlign:'center' }}>
      <div style={{ width:60, height:60, borderRadius:16, background:'var(--sf2)',
                    border:'1px solid var(--bd)', display:'flex', alignItems:'center',
                    justifyContent:'center' }}>
        <Icon name="clipboard" size={28} style={{ color:'var(--t3)' }} />
      </div>
      <div style={{ fontSize:17, fontWeight:600, color:'var(--t1)' }}>
        Permisos y Solicitudes
      </div>
      <div style={{ fontSize:13, color:'var(--t2)', maxWidth:380, lineHeight:1.7 }}>
        La gestión digital de permisos, licencias y solicitudes de empleados estará disponible en esta sección.
      </div>
      <div style={{ padding:'5px 18px', borderRadius:20, background:'var(--sf2)',
                    border:'1px solid var(--bd)', fontSize:11, color:'var(--t3)',
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
        Próximamente
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

/* ── Solicitudes de personal ── */
const MOTIVOS_SP  = ['Baja / renuncia','Crecimiento','Nuevo puesto','Reemplazo temporal','Otro'];
const EMPRESAS_SP = [{val:'CIMOMET',label:'Cimomet S.A.'},{val:'COMOING',label:'Co.mo.ing S.R.L.'}];
const _inputSP    = {
  background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:8,
  padding:'8px 10px', color:'var(--t1)', fontSize:13,
  width:'100%', boxSizing:'border-box', outline:'none', fontFamily:'inherit',
};

function _fmtTS(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`;
}

function FormularioSolicitud({ onSuccess }) {
  const [form, setForm] = _us({
    puesto:'', area:'', empresa:'CIMOMET', cantidad:1,
    motivo:MOTIVOS_SP[0], descripcion:'', solicitado_por:(window.getCurrentUser()?.name || '')
  });
  const [saving, setSaving] = _us(false);
  const [ok,     setOk]     = _us(false);
  const [err,    setErr]    = _us(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.puesto.trim() || !form.area.trim() || !form.solicitado_por.trim()) {
      setErr('Completa los campos obligatorios: Puesto, Area y Solicitado por.');
      return;
    }
    setSaving(true); setErr(null);
    const { url, key } = window.SUPABASE_CONFIG;
    try {
      const r = await fetch(`${url}/solicitudes_personal`, {
        method: 'POST',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          puesto:         form.puesto.trim(),
          area:           form.area.trim(),
          empresa:        form.empresa,
          cantidad:       parseInt(form.cantidad) || 1,
          motivo:         form.motivo,
          descripcion:    form.descripcion.trim() || null,
          solicitado_por: form.solicitado_por.trim(),
        }),
      });
      if (!r.ok) throw new Error(`Error HTTP ${r.status}`);
      setOk(true);
      setForm({ puesto:'', area:'', empresa:'CIMOMET', cantidad:1, motivo:MOTIVOS_SP[0], descripcion:'', solicitado_por:'' });
      onSuccess();
      setTimeout(() => setOk(false), 4000);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const lbl = {
    fontSize:11, color:'var(--t3)', fontWeight:500,
    textTransform:'uppercase', letterSpacing:'0.06em',
    display:'block', marginBottom:4,
  };

  return (
    <div className="card" style={{ maxWidth:560 }}>
      <div className="card-header">
        <div className="card-title"><Icon name="userplus" size={15} />Nueva solicitud de personal</div>
      </div>
      <div style={{ padding:'0 20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
        {ok && (
          <div style={{ background:'rgba(61,207,142,0.12)', border:'1px solid #3ecf8e',
                        borderRadius:8, padding:'10px 14px', color:'#3ecf8e', fontSize:13 }}>
            Solicitud enviada correctamente.
          </div>
        )}
        {err && (
          <div style={{ background:'rgba(242,88,93,0.1)', border:'1px solid var(--err)',
                        borderRadius:8, padding:'10px 14px', color:'var(--err)', fontSize:13 }}>
            {err}
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Puesto solicitado *</label>
            <input type="text" placeholder="ej: Soldador" value={form.puesto}
                   onChange={e => set('puesto', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Area / Sector *</label>
            <input type="text" placeholder="ej: Produccion" value={form.area}
                   onChange={e => set('area', e.target.value)} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'end' }}>
          <div>
            <label style={lbl}>Empresa *</label>
            <Select value={form.empresa} onChange={v => set('empresa', v)} options={EMPRESAS_SP} />
          </div>
          <div>
            <label style={lbl}>Cantidad *</label>
            <input type="number" min={1} value={form.cantidad}
                   onChange={e => set('cantidad', e.target.value)}
                   style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:8,
                            padding:'8px 10px', color:'var(--t1)', fontSize:13, width:80,
                            boxSizing:'border-box', outline:'none', fontFamily:'inherit' }} />
          </div>
        </div>
        <div>
          <label style={lbl}>Motivo *</label>
          <Select value={form.motivo} onChange={v => set('motivo', v)} options={MOTIVOS_SP} />
        </div>
        <div>
          <label style={lbl}>Observaciones (opcional)</label>
          <textarea rows={3} placeholder="Detalles adicionales..."
                    value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                    style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:8,
                             padding:'8px 10px', color:'var(--t1)', fontSize:13, width:'100%',
                             boxSizing:'border-box', outline:'none', fontFamily:'inherit',
                             resize:'vertical' }} />
        </div>
        <div>
          <label style={lbl}>Solicitado por *</label>
          <input type="text" placeholder="Nombre del jefe de area" value={form.solicitado_por}
                 onChange={e => set('solicitado_por', e.target.value)}
                 readOnly={!!window.getCurrentUser()}
                 style={{ opacity: window.getCurrentUser() ? 0.75 : 1, cursor: window.getCurrentUser() ? 'default' : 'text' }} />
        </div>
        <button onClick={handleSubmit} disabled={saving}
                style={{ alignSelf:'flex-start', padding:'10px 24px', borderRadius:8,
                         border:'none', background:'var(--accent)', color:'#fff',
                         fontWeight:600, fontSize:13,
                         cursor: saving ? 'not-allowed' : 'pointer',
                         opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </div>
    </div>
  );
}

function PanelDirector({ pendientes, historial, onRefresh }) {
  const [modal,    setModal]    = _us(null);
  const [nombre,   setNombre]   = _us(window.getCurrentUser()?.name || '');
  const [nota,     setNota]     = _us('');
  const [saving,   setSaving]   = _us(false);
  const [errModal, setErrModal] = _us(null);

  const hoy  = new Date();
  const mesP = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
  const aprobMes  = historial.filter(s => s.estado==='aprobado'  && (s.fecha_aprobacion||'').startsWith(mesP)).length;
  const rechazMes = historial.filter(s => s.estado==='rechazado' && (s.fecha_aprobacion||'').startsWith(mesP)).length;
  const enBusq    = [...pendientes,...historial].filter(s => s.estado_busqueda==='en_busqueda').length;

  const cerrar = () => { setModal(null); setNombre(''); setNota(''); setErrModal(null); };

  const confirmar = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    setErrModal(null);
    const { url, key } = window.SUPABASE_CONFIG;
    try {
      const r = await fetch(`${url}/solicitudes_personal?id=eq.${modal.sol.id}`, {
        method: 'PATCH',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          estado:           modal.accion,
          aprobado_por:     nombre.trim(),
          fecha_aprobacion: new Date().toISOString(),
          notas_director:   nota.trim() || null,
        }),
      });
      if (!r.ok) {
        let msg = `Error ${r.status}`;
        try { const b = await r.json(); if (b.message) msg = b.message; } catch(_) {}
        throw new Error(msg);
      }
      cerrar();
      onRefresh();
    } catch(e) {
      setErrModal(e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        <Kpi icon="clock"  label="Pendientes"          value={String(pendientes.length)} note="esperan decision"  color="#f5b740" />
        <Kpi icon="check"  label="Aprobadas este mes"  value={String(aprobMes)}          note="autorizadas"       color="#3ecf8e" />
        <Kpi icon="alert"  label="Rechazadas este mes" value={String(rechazMes)}          note="denegadas"         color="#f2585d" />
        <Kpi icon="users"  label="En busqueda"         value={String(enBusq)}            note="RRHH buscando"     color="#5aa9f5" />
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:'var(--t3)', fontWeight:600, textTransform:'uppercase',
                      letterSpacing:'0.1em', marginBottom:12 }}>
          Pendientes de aprobacion ({pendientes.length})
        </div>
        {pendientes.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>
            No hay solicitudes pendientes.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pendientes.map(s => (
              <div key={s.id} className="card" style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                              alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center',
                                  marginBottom:6, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{s.puesto}</span>
                      <Badge>{s.empresa}</Badge>
                      <span className="f12 t2">· {s.area}</span>
                      {s.prioridad && (
                        <Badge tipo={s.prioridad==='Alta'?'danger':s.prioridad==='Media'?'warning':'neutral'}>
                          {s.prioridad}
                        </Badge>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12,
                                  color:'var(--t2)', marginBottom: s.descripcion ? 6 : 0 }}>
                      <span><b>{s.cantidad}</b> {s.cantidad===1?'persona':'personas'}</span>
                      <span>Motivo: {s.motivo}</span>
                      <span>Sol. por: <b>{s.solicitado_por}</b></span>
                      <span>{_fmtTS(s.created_at)}</span>
                    </div>
                    {s.descripcion && (
                      <div style={{ fontSize:12, color:'var(--t3)', fontStyle:'italic' }}>
                        {s.descripcion}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={() => setModal({ sol:s, accion:'rechazado' })}
                            style={{ padding:'7px 14px', borderRadius:7,
                                     border:'1px solid var(--err)', background:'transparent',
                                     color:'var(--err)', cursor:'pointer',
                                     fontSize:12, fontWeight:500 }}>
                      Rechazar
                    </button>
                    <button onClick={() => setModal({ sol:s, accion:'aprobado' })}
                            style={{ padding:'7px 14px', borderRadius:7, border:'none',
                                     background:'#16a34a', color:'#fff',
                                     cursor:'pointer', fontSize:12, fontWeight:600 }}>
                      Aprobar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {historial.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:'var(--t3)', fontWeight:600, textTransform:'uppercase',
                        letterSpacing:'0.1em', marginBottom:12 }}>
            Historial ({historial.length})
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr>
                  <th>Puesto</th><th>Area</th><th>Empresa</th><th>Prioridad</th>
                  <th>Sol. por</th><th>Apr. por</th><th>Fecha</th>
                  <th>Estado</th><th>Busqueda</th><th></th>
                </tr></thead>
                <tbody>
                  {historial.map(s => (
                    <tr key={s.id}>
                      <td className="cell-strong">{s.puesto}</td>
                      <td className="t2">{s.area}</td>
                      <td><Badge>{s.empresa}</Badge></td>
                      <td>{s.prioridad ? <Badge tipo={s.prioridad==='Alta'?'danger':s.prioridad==='Media'?'warning':'neutral'}>{s.prioridad}</Badge> : <span className="t3">—</span>}</td>
                      <td className="t2 f12">{s.solicitado_por}</td>
                      <td className="t2 f12">{s.aprobado_por||'—'}</td>
                      <td className="t3 f12">{_fmtTS(s.fecha_aprobacion)}</td>
                      <td>
                        <Badge tipo={s.estado==='aprobado'?'success':'danger'}>
                          {s.estado==='aprobado'?'Aprobado':'Rechazado'}
                        </Badge>
                      </td>
                      <td className="f12 t2">{s.estado_busqueda||'—'}</td>
                      <td>
                        <button
                          onClick={() => {
                            if (!window.confirm(`¿Eliminar la solicitud de ${s.puesto}?`)) return;
                            const { url, key } = window.SUPABASE_CONFIG;
                            fetch(`${url}/solicitudes_personal?id=eq.${s.id}`, {
                              method: 'DELETE',
                              headers: { apikey:key, Authorization:`Bearer ${key}`,
                                         Prefer:'return=minimal' },
                            }).then(() => onRefresh());
                          }}
                          title="Eliminar"
                          style={{ background:'none', border:'none', cursor:'pointer',
                                   color:'var(--t3)', padding:'4px 6px', borderRadius:4,
                                   lineHeight:1, fontSize:14 }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div onClick={e => { if (e.target===e.currentTarget) cerrar(); }}
             style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.72)',
                      backdropFilter:'blur(3px)', display:'flex', alignItems:'center',
                      justifyContent:'center', padding:24 }}>
          <div style={{ background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:12,
                        width:'100%', maxWidth:440,
                        boxShadow:'0 24px 64px rgba(0,0,0,0.5)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--bd)',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontSize:14 }}>
                {modal.accion==='aprobado' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
              </span>
              <button onClick={cerrar}
                      style={{ background:'var(--sf2)', border:'none', borderRadius:6,
                               cursor:'pointer', color:'inherit', width:28, height:28,
                               fontSize:18, lineHeight:1, display:'flex',
                               alignItems:'center', justifyContent:'center' }}>
                x
              </button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'var(--sf2)', borderRadius:8,
                            padding:'10px 14px', fontSize:13 }}>
                <b>{modal.sol.puesto}</b> · {modal.sol.area} · <Badge>{modal.sol.empresa}</Badge>
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--t3)', display:'block',
                                 marginBottom:4, textTransform:'uppercase',
                                 letterSpacing:'0.06em' }}>
                  {modal.accion==='aprobado' ? 'Aprobado por *' : 'Rechazado por *'}
                </label>
                <input type="text" placeholder="Nombre del director"
                       value={nombre} onChange={e => setNombre(e.target.value)}
                       readOnly={!!window.getCurrentUser()}
                       style={{ opacity: window.getCurrentUser() ? 0.75 : 1,
                                cursor: window.getCurrentUser() ? 'default' : 'text' }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--t3)', display:'block',
                                 marginBottom:4, textTransform:'uppercase',
                                 letterSpacing:'0.06em' }}>
                  Nota (opcional)
                </label>
                <textarea rows={3} placeholder="Observaciones..."
                          value={nota} onChange={e => setNota(e.target.value)}
                          style={{ background:'var(--sf2)', border:'1px solid var(--bd)',
                                   borderRadius:8, padding:'8px 10px', color:'var(--t1)',
                                   fontSize:13, fontFamily:'inherit', width:'100%',
                                   boxSizing:'border-box', resize:'vertical' }} />
              </div>
              {errModal && (
                <div style={{ background:'#7f1d1d22', border:'1px solid var(--err)',
                              borderRadius:8, padding:'8px 12px', fontSize:12,
                              color:'var(--err)' }}>
                  {errModal}
                </div>
              )}
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={cerrar}
                        style={{ padding:'8px 16px', borderRadius:7,
                                 border:'1px solid var(--bd)', background:'transparent',
                                 cursor:'pointer', color:'var(--t1)', fontSize:13 }}>
                  Cancelar
                </button>
                <button onClick={confirmar} disabled={saving || !nombre.trim()}
                        style={{ padding:'8px 16px', borderRadius:7, border:'none',
                                 fontSize:13, fontWeight:600, color:'#fff',
                                 background: modal.accion==='aprobado' ? '#16a34a' : '#dc2626',
                                 cursor: (!nombre.trim()||saving) ? 'not-allowed' : 'pointer',
                                 opacity: !nombre.trim() ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : modal.accion==='aprobado' ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BusquedasRRHH({ busquedas, candMap = {}, onRefresh }) {
  const [procesando, setProcesando] = _us(null);
  const [errBusq,    setErrBusq]    = _us(null);

  const cambiar = async (id, nuevoEstado) => {
    setProcesando(id);
    setErrBusq(null);
    const { url, key } = window.SUPABASE_CONFIG;
    try {
      const r = await fetch(`${url}/solicitudes_personal?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          estado_busqueda: nuevoEstado,
          ...(nuevoEstado === 'en_busqueda' && window.getCurrentUser()
            ? { responsable_busqueda: window.getCurrentUser().name }
            : {}),
        }),
      });
      if (!r.ok) {
        let msg = `Error ${r.status}`;
        try { const b = await r.json(); if (b.message) msg = b.message; } catch(_) {}
        setErrBusq(msg);
        return;
      }
      onRefresh();
    } catch(e) {
      setErrBusq(e.message);
    } finally { setProcesando(null); }
  };

  const COL = { pendiente:'#f5b740', en_busqueda:'#5aa9f5', cubierto:'#3ecf8e' };
  const LBL = { pendiente:'Pendiente', en_busqueda:'En busqueda', cubierto:'Cubierto' };

  if (busquedas.length === 0) return (
    <div className="card" style={{ textAlign:'center', padding:'48px', color:'var(--t2)' }}>
      No hay busquedas activas. Las solicitudes aprobadas apareceran aqui.
    </div>
  );

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {errBusq && (
        <div style={{ padding:'10px 14px', borderRadius:8, fontSize:13,
                      background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                      color:'var(--err)', display:'flex', justifyContent:'space-between' }}>
          <span>{errBusq}</span>
          <button onClick={() => setErrBusq(null)}
                  style={{ background:'none', border:'none', cursor:'pointer',
                           color:'var(--err)', fontWeight:700, padding:'0 4px' }}>✕</button>
        </div>
      )}
      {busquedas.map(s => {
        const eb          = s.estado_busqueda || 'pendiente';
        const busy        = procesando === s.id;
        const cands       = candMap[s.id] || [];
        const contratados = cands.filter(c => /contratad/i.test(c.estado || ''));
        const vacantes    = s.cantidad || 1;
        const pct         = Math.min(100, Math.round((contratados.length / vacantes) * 100));
        return (
          <div key={s.id} className="card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center',
                              marginBottom:6, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:700, fontSize:14 }}>{s.puesto}</span>
                  <Badge>{s.empresa}</Badge>
                  <span className="f12 t2">· {s.area}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:COL[eb] }}>
                    &#9679; {LBL[eb]}
                  </span>
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap',
                              fontSize:12, color:'var(--t2)' }}>
                  <span>Motivo: {s.motivo}</span>
                  <span>Sol. por: {s.solicitado_por}</span>
                  <span>Apr. por: {s.aprobado_por}</span>
                  <span>{_fmtTS(s.fecha_aprobacion)}</span>
                </div>
                {s.notas_director && (
                  <div style={{ fontSize:12, color:'var(--t3)', fontStyle:'italic', marginTop:4 }}>
                    Director: {s.notas_director}
                  </div>
                )}
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:6, borderRadius:3,
                                background:'var(--sf2)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, transition:'width .3s',
                                  background: pct >= 100 ? 'var(--ok)' : 'var(--accent)',
                                  width:`${pct}%` }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                                 color: pct >= 100 ? 'var(--ok)' : 'var(--t1)' }}>
                    {contratados.length}/{vacantes} contratado{vacantes!==1?'s':''}
                  </span>
                </div>
                {contratados.length > 0 && (
                  <div style={{ marginTop:6, fontSize:11, color:'var(--t2)',
                                display:'flex', gap:8, flexWrap:'wrap' }}>
                    {contratados.map((c, i) => (
                      <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:5, height:5, borderRadius:'50%',
                                       background:'var(--ok)', display:'inline-block' }} />
                        {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
                {eb === 'pendiente' && (
                  <button onClick={() => cambiar(s.id,'en_busqueda')} disabled={busy}
                          style={{ padding:'7px 12px', borderRadius:7, border:'none',
                                   background:'#5aa9f5', color:'#fff',
                                   cursor: busy ? 'not-allowed':'pointer',
                                   fontSize:12, fontWeight:500 }}>
                    Iniciar busqueda
                  </button>
                )}
                {eb === 'en_busqueda' && (
                  <>
                    <button onClick={() => cambiar(s.id,'pendiente')} disabled={busy}
                            style={{ padding:'7px 12px', borderRadius:7,
                                     border:'1px solid var(--bd)', background:'transparent',
                                     cursor: busy ? 'not-allowed':'pointer',
                                     fontSize:12, color:'var(--t2)' }}>
                      Pausar
                    </button>
                    <button onClick={() => cambiar(s.id,'cubierto')} disabled={busy}
                            style={{ padding:'7px 12px', borderRadius:7, border:'none',
                                     background:'#16a34a', color:'#fff',
                                     cursor: busy ? 'not-allowed':'pointer',
                                     fontSize:12, fontWeight:500 }}>
                      Marcar cubierta
                    </button>
                  </>
                )}
                {busy && <span className="f12 t2">...</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PanelPostulantes({ solicitudes }) {
  const dataRef = _ur(null);
  const [estado, setEstado] = _us('cargando');
  const [total,  setTotal]  = _us(0);

  _ue(() => {
    let destroyed = false;

    function _parseSheetDate(cell) {
      if (!cell) return null;
      if (cell.v && typeof cell.v === 'string') {
        const m = cell.v.match(/Date\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return new Date(+m[1], +m[2], +m[3]);
      }
      if (cell.f) {
        const pts = cell.f.split(' ')[0].split('/');
        if (pts.length === 3) return new Date(+pts[2], +pts[1]-1, +pts[0]);
      }
      return null;
    }

    (async () => {
      try {
        const hoy = new Date();
        const ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

        /* ── Google Sheets: total postulantes ── */
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1aFwMjW8eNG0d2Y7mKdDQvaySm-s2vtSLSO7HBWu7aTE/gviz/tq?tqx=out:json&sheet=Postulantes';
        const txt   = await (await fetch(sheetUrl)).text();
        const sData = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}')+1));
        const cols      = sData.table.cols;
        const iMarca    = cols.findIndex(c => /marca|timestamp/i.test(c.label));
        const iEmail    = cols.findIndex(c => /correo|email/i.test(c.label));
        const iNombre   = cols.findIndex(c => c.label.toLowerCase() === 'nombre');
        const iApellido = cols.findIndex(c => c.label.toLowerCase() === 'apellido');
        const DIRECTOR  = 'cimolay47@gmail.com';
        const firstByEmail = new Map();
        const sinEmail     = [];
        for (const row of sData.table.rows) {
          const c        = row.c || [];
          const nombre   = (c[iNombre]?.v   || '').trim();
          const apellido = (c[iApellido]?.v || '').trim();
          if (!nombre && !apellido) continue;
          const email = (c[iEmail]?.v || '').trim().toLowerCase();
          const fecha = _parseSheetDate(c[iMarca]);
          if (!email || email === DIRECTOR) {
            if (fecha) sinEmail.push({ fecha });
          } else {
            const prev = firstByEmail.get(email);
            if (!prev || (fecha && fecha < prev.fecha)) firstByEmail.set(email, { fecha });
          }
        }
        const totalHist = firstByEmail.size + sinEmail.length;
        const porMesSheets = new Map();
        [...firstByEmail.values(), ...sinEmail].filter(p => p.fecha).forEach(p => {
          const k = `${p.fecha.getFullYear()}-${p.fecha.getMonth()}`;
          porMesSheets.set(k, (porMesSheets.get(k) || 0) + 1);
        });

        /* ── Supabase: preseleccionados ── */
        const { url: sUrl, key } = window.SUPABASE_CONFIG;
        const hace12 = new Date(hoy.getFullYear(), hoy.getMonth()-11, 1).toISOString();
        const preselResp2 = await fetch(
          `${sUrl}/preseleccionados?select=estado,created_at&created_at=gte.${hace12}`,
          { headers: { apikey:key, Authorization:`Bearer ${key}` } }
        );
        const preselData2 = await preselResp2.json();
        const porMesPresel2 = new Map();
        if (Array.isArray(preselData2)) {
          preselData2.forEach(d => {
            const dt = new Date(d.created_at);
            const k  = `${dt.getFullYear()}-${dt.getMonth()}`;
            const e  = porMesPresel2.get(k) || { activo:0, descartado:0 };
            if (d.estado === 'activo')          e.activo++;
            else if (d.estado === 'descartado') e.descartado++;
            porMesPresel2.set(k, e);
          });
        }

        /* ── Armar meses ── */
        const meses = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(hoy.getFullYear(), hoy.getMonth()-i, 1);
          meses.push({ key:`${d.getFullYear()}-${d.getMonth()}`, label:`${ABREV[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` });
        }
        const postArr    = meses.map(m => porMesSheets.get(m.key) ?? 0);
        const preselArr  = meses.map(m => porMesPresel2.get(m.key)?.activo ?? 0);
        const descartArr = meses.map(m => porMesPresel2.get(m.key)?.descartado ?? 0);
        const sinProcArr = meses.map((_,i) => Math.max(0, postArr[i]-preselArr[i]-descartArr[i]));

        if (destroyed) return;
        dataRef.current = { meses, postArr, preselArr, descartArr, sinProcArr };
        setTotal(totalHist);
        setEstado('ok');
      } catch(_) {
        if (!destroyed) setEstado('error');
      }
    })();
    return () => { destroyed = true; };
  }, []);

  const pendAuth  = solicitudes.filter(s => s.estado === 'pendiente').length;
  const enBusq    = solicitudes.filter(s => s.estado === 'aprobado' && s.estado_busqueda === 'en_busqueda').length;
  const cubiertas = solicitudes.filter(s => s.estado_busqueda === 'cubierto').length;

  const totalPresel = estado==='ok' ? dataRef.current.preselArr.reduce((a,b)=>a+b,0) : 0;
  const totalDesc   = estado==='ok' ? dataRef.current.descartArr.reduce((a,b)=>a+b,0) : 0;
  const totalSinProc = Math.max(0, total - totalPresel - totalDesc);

  const CHART_H = 100;
  const BAR_W   = 32;
  const GAP     = 10;
  const maxVal  = estado==='ok' ? Math.max(...dataRef.current.postArr, 1) : 1;
  const svgW    = 12*(BAR_W+GAP)-GAP;
  const svgH    = CHART_H+40;

  const isLoading = estado === 'cargando';
  const isError   = estado === 'error';
  const [tooltip, setTooltip] = _us(null);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        <Kpi icon="users"   label="Total candidatos"     value={total}     note="en el sistema" />
        <Kpi icon="alert"   label="Pend. autorizacion"   value={pendAuth}  note="solicitudes internas" color="var(--warn)" />
        <Kpi icon="compass" label="En busqueda"          value={enBusq}    note="posiciones activas"   color="var(--accent)" />
        <Kpi icon="check"   label="Posiciones cubiertas" value={cubiertas} note="hist. total"           color="var(--ok)" />
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <div className="card-title">Procesamiento de CVs</div>
          <span style={{ fontSize:12, color:'var(--t3)' }}>Total recibidos: {total}</span>
        </div>
        {isLoading && <div style={{ padding:'28px', textAlign:'center', color:'var(--t2)', fontSize:13 }}>Cargando...</div>}
        {isError   && <div style={{ padding:'28px', textAlign:'center', color:'var(--err)', fontSize:13 }}>Error al cargar datos de postulantes.</div>}
        {!isLoading && !isError && (() => {
          const filas = [
            { label:'Sin procesar',     val:totalSinProc, color:'var(--t3)'  },
            { label:'Preseleccionados', val:totalPresel,  color:'var(--ok)'  },
            { label:'Descartados',      val:totalDesc,    color:'var(--err)' },
          ];
          return (
            <div style={{ padding:'0 20px 20px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
              <DonutChart size={140} thickness={24} centerLabel="CVs"
                segments={total===0
                  ? [{ valor:1, color:'var(--bd)' }]
                  : filas.map(f => ({ valor:f.val||0, color:f.color })).filter(s=>s.valor>0)
                }
              />
              <div style={{ flex:1, minWidth:200, display:'flex', flexDirection:'column', gap:12 }}>
                {filas.map(f => {
                  const pct = total===0 ? 0 : Math.round((f.val/total)*100);
                  return (
                    <div key={f.label}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ width:10, height:10, borderRadius:2, background:f.color,
                                         display:'inline-block', flexShrink:0 }} />
                          {f.label}
                        </span>
                        <span style={{ fontWeight:600, color:'var(--t1)' }}>
                          {f.val} <span style={{ fontWeight:400, color:'var(--t3)', fontSize:11 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height:6, background:'var(--sf2)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:f.color,
                                      borderRadius:3, transition:'width .4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Postulantes — Ultimos 12 meses</div>
          <span style={{ fontSize:12, color:'var(--t3)' }}>{total} en el sistema</span>
        </div>
        {isLoading && <div style={{ padding:'40px', textAlign:'center', color:'var(--t2)', fontSize:13 }}>Cargando...</div>}
        {isError   && <div style={{ padding:'40px', textAlign:'center', color:'var(--err)', fontSize:13 }}>Error al cargar.</div>}
        {!isLoading && !isError && (
          <div style={{ padding:'12px 20px 16px', overflowX:'auto' }}>
            <svg width={svgW} height={svgH} style={{ display:'block', minWidth:'100%' }}>
              {[0.25,0.5,0.75,1].map(f => (
                <line key={f} x1={0} y1={Math.round(CHART_H*(1-f))} x2={svgW} y2={Math.round(CHART_H*(1-f))}
                      stroke="var(--bd)" strokeWidth="0.5" />
              ))}
              {dataRef.current.meses.map((m,i) => {
                const t   = dataRef.current.postArr[i];
                const tH  = t===0 ? 0 : Math.round((t/maxVal)*CHART_H);
                const pPx = t===0 ? 0 : Math.round((dataRef.current.preselArr[i]/t)*tH);
                const dPx = t===0 ? 0 : Math.round((dataRef.current.descartArr[i]/t)*tH);
                const oPx = tH-pPx-dPx;
                const x   = i*(BAR_W+GAP);
                return (
                  <g key={m.key} style={{ cursor:'default' }}
                     onMouseMove={e => setTooltip({
                       clientX: e.clientX, clientY: e.clientY,
                       mes: m.label,
                       pre:     dataRef.current.preselArr[i],
                       desc:    dataRef.current.descartArr[i],
                       sinProc: dataRef.current.sinProcArr[i],
                       total:   t,
                     })}
                     onMouseLeave={() => setTooltip(null)}>
                    <rect x={x} y={0} width={BAR_W} height={CHART_H+20} fill="transparent" />
                    {oPx>0 && <rect x={x} y={CHART_H-oPx}      width={BAR_W} height={oPx} fill="var(--t3)" rx="2" />}
                    {dPx>0 && <rect x={x} y={CHART_H-oPx-dPx}  width={BAR_W} height={dPx} fill="var(--err)" />}
                    {pPx>0 && <rect x={x} y={CHART_H-tH}       width={BAR_W} height={pPx} fill="var(--ok)" />}
                    {t===0 && <rect x={x} y={CHART_H-2} width={BAR_W} height={2} fill="var(--bd)" rx="1" />}
                    {t>0 && <text x={x+BAR_W/2} y={CHART_H-tH-5} textAnchor="middle" fontSize="9" fill="var(--t2)">{t}</text>}
                    <text x={x+BAR_W/2} y={CHART_H+16} textAnchor="middle" fontSize="9" fill="var(--t3)">{m.label}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display:'flex', gap:14, marginTop:8, fontSize:11, color:'var(--t2)', flexWrap:'wrap' }}>
              {[['var(--ok)','Preseleccionados'],['var(--err)','Descartados'],['var(--t3)','Sin procesar']].map(([c,l]) => (
                <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:c, display:'inline-block', flexShrink:0 }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {tooltip && ReactDOM.createPortal(
        <div style={{
          position:'fixed',
          left: tooltip.clientX + 14,
          top:  Math.max(8, tooltip.clientY - 140),
          background:'var(--sf1)',
          border:'1px solid var(--bd)',
          borderRadius:10,
          padding:'11px 14px',
          fontSize:12,
          pointerEvents:'none',
          zIndex:9999,
          boxShadow:'0 6px 24px rgba(0,0,0,0.28)',
          whiteSpace:'nowrap',
          minWidth:175,
          lineHeight:1.5,
        }}>
          <div style={{ fontWeight:700, marginBottom:8, color:'var(--t1)', fontSize:13 }}>
            {tooltip.mes}
          </div>
          {[
            { color:'var(--ok)',  label:'Preseleccionados', val: tooltip.pre },
            { color:'var(--err)', label:'Descartados',      val: tooltip.desc },
            { color:'var(--t3)',  label:'Sin procesar',     val: tooltip.sinProc },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ width:9, height:9, borderRadius:2, background:row.color,
                             display:'inline-block', flexShrink:0 }} />
              <span style={{ color:'var(--t2)', flex:1 }}>{row.label}:</span>
              <span style={{ fontWeight:600, color:'var(--t1)' }}>{row.val}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid var(--bd)', marginTop:7, paddingTop:7,
                        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'var(--t3)', fontSize:11 }}>Total postulantes:</span>
            <span style={{ fontWeight:700, color:'var(--t1)', fontSize:13 }}>{tooltip.total}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function HistorialBusquedas({ solicitudes, candMap }) {
  const [filtro, setFiltro] = _us('Todas');
  const FILTROS = ['Todas','Activas','Cubiertas','Sin autorizar','Rechazadas'];

  const filas = _um(() => {
    return solicitudes.filter(s => {
      if (filtro === 'Activas')       return s.estado === 'aprobado' && s.estado_busqueda !== 'cubierto';
      if (filtro === 'Cubiertas')     return s.estado_busqueda === 'cubierto';
      if (filtro === 'Sin autorizar') return s.estado === 'pendiente';
      if (filtro === 'Rechazadas')    return s.estado === 'rechazado';
      return true;
    });
  }, [solicitudes, filtro]);

  const _estadoBadge = (s) => {
    if (s.estado === 'pendiente')  return <Badge tipo="warning">Pendiente</Badge>;
    if (s.estado === 'rechazado')  return <Badge tipo="danger">Rechazada</Badge>;
    if (s.estado_busqueda === 'cubierto')    return <Badge tipo="success">Cubierta ✓</Badge>;
    if (s.estado_busqueda === 'en_busqueda') return <Badge tipo="info">En busqueda</Badge>;
    return <Badge tipo="neutral">Autorizada</Badge>;
  };

  return (
    <div className="fade-in">
      <div className="card" style={{ padding:'10px 16px', marginBottom:12 }}>
        <FilterChips options={FILTROS} active={filtro} onChange={setFiltro} />
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Puesto · Área</th>
              <th style={{ textAlign:'center' }}>Vac.</th>
              <th>Solicitado por</th>
              <th>Autorizado por</th>
              <th>Estado</th>
              <th>Contratados</th>
            </tr></thead>
            <tbody>
              {filas.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>
                  Sin resultados para este filtro.
                </td></tr>
              )}
              {filas.map(s => {
                const cands      = candMap[s.id] || [];
                const contratados = cands.filter(c => /contratad/i.test(c.estado || ''));
                const vacantes    = s.cantidad || 1;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-strong">{s.puesto}</div>
                      <div className="f12 t3">{s.area} · <Badge>{s.empresa}</Badge></div>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontWeight:600 }}>{contratados.length}</span>
                      <span className="t3">/{vacantes}</span>
                    </td>
                    <td>
                      <div className="f12">{s.solicitado_por || '—'}</div>
                      <div className="f12 t3">{_fmtTS(s.created_at)}</div>
                    </td>
                    <td>
                      <div className="f12">{s.aprobado_por || '—'}</div>
                      <div className="f12 t3">{_fmtTS(s.fecha_aprobacion)}</div>
                    </td>
                    <td>{_estadoBadge(s)}</td>
                    <td>
                      {contratados.length === 0
                        ? <span className="t3 f12">—</span>
                        : <div style={{ fontSize:12, lineHeight:1.8 }}>
                            {contratados.map((c, i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                                <span style={{ width:6, height:6, borderRadius:'50%',
                                               background:'var(--ok)', display:'inline-block',
                                               flexShrink:0 }} />
                                {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre || '—'}
                              </div>
                            ))}
                          </div>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RRHHPostulantes() {
  const [vista,          setVista]          = _us('panel');
  const [solicitudes,    setSolicitudes]    = _us([]);
  const [candidatosVinc, setCandidatosVinc] = _us([]);
  const [loading,        setLoading]        = _us(true);
  const [tick,           setTick]           = _us(0);

  const refresh = () => setTick(t => t + 1);

  _ue(() => {
    setLoading(true);
    const { url, key } = window.SUPABASE_CONFIG;
    const h = { apikey:key, Authorization:`Bearer ${key}` };

    Promise.all([
      fetch(`${url}/solicitudes_personal?order=created_at.desc`, { headers:h }).then(r => r.json()),
      fetch(`${url}/candidatos?select=id,nombre,apellido,solicitud_id,estado&solicitud_id=not.is.null`, { headers:h })
        .then(r => r.json()).catch(() => []),
    ]).then(([sols, cands]) => {
      setSolicitudes(Array.isArray(sols) ? sols : []);
      setCandidatosVinc(Array.isArray(cands) ? cands : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tick]);

  const candMap = _um(() => {
    const m = {};
    candidatosVinc.forEach(c => {
      if (!c.solicitud_id) return;
      if (!m[c.solicitud_id]) m[c.solicitud_id] = [];
      m[c.solicitud_id].push(c);
    });
    return m;
  }, [candidatosVinc]);

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const historial  = solicitudes.filter(s => s.estado !== 'pendiente');
  const busquedas  = solicitudes.filter(s => s.estado === 'aprobado' && s.estado_busqueda !== 'cubierto');

  return (
    <div className="fade-in">
      <div className="card" style={{ padding:'10px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { id:'panel',     label:'Panel' },
            { id:'rrhh',      label:`Busquedas activas (${busquedas.length})` },
            { id:'historial', label:'Historial' },
            { id:'director',  label:`Autorizacion${pendientes.length>0 ? ' · '+pendientes.length+' pend.' : ''}` },
            { id:'solicitud', label:'Nueva solicitud' },
          ].map(v => (
            <button key={v.id} onClick={() => setVista(v.id)}
                    className={`chip${vista===v.id ? ' active' : ''}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {loading
        ? <div className="card" style={{ textAlign:'center', padding:'40px', color:'var(--t2)' }}>Cargando...</div>
        : vista === 'solicitud'
          ? <FormularioSolicitud onSuccess={refresh} />
          : vista === 'director'
            ? <PanelDirector pendientes={pendientes} historial={historial} onRefresh={refresh} />
            : vista === 'historial'
              ? <HistorialBusquedas solicitudes={solicitudes} candMap={candMap} />
              : vista === 'panel'
                ? <PanelPostulantes solicitudes={solicitudes} />
                : <BusquedasRRHH busquedas={busquedas} candMap={candMap} onRefresh={refresh} />
      }
    </div>
  );
}

window.ViewRRHH = function ViewRRHH({ tab, onTabChange }) {
  const [empleados, setEmpleados] = _us([]);
  const [loading, setLoading] = _us(true);

  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(
      `${url}/empleados?select=id,legajo,empresa,apellido_y_nombre,cuil,desc_puesto,activo,fecha_ingreso&order=apellido_y_nombre`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
      .then(r => r.json())
      .then(data => { setEmpleados(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const views = [
    <RRHHPanel onNavigate={onTabChange} empleados={empleados} loading={loading} />,
    <RRHHPlantel empleados={empleados} loading={loading} />,
    <RRHHPermisos />,
    <RRHHSabados />,
    <RRHHPostulantes />,
    <RRHHVencimientos />,
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
   CALIDAD
   ========================================================= */
function CalidadPanel({ onNavigate }) {
  const conf = D.conformidad;
  const last = conf.conforme[conf.conforme.length - 1];
  const prev = conf.conforme[conf.conforme.length - 2];
  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Vital label="Tasa de conformidad" value={last}
               segments={[
                 { label: 'Conforme', pct: last, color: '#3ecf8e' },
                 { label: 'No conforme', pct: parseFloat((100 - last).toFixed(1)), color: '#f2585d' }
               ]}
               delta={(last - prev).toFixed(1)} note="inspecciones mayo"
               sparkData={conf.conforme.slice(-6)} />
        <div>
          <HubButton icon="clipboard" title="Inspecciones y ensayos"
                     subtitle={`${D.inspecciones.length} registros`}
                     onClick={() => onNavigate(1)} color="#3ecf8e" />
          <HubButton icon="pulse" title="Conformidad"
                     subtitle="Tendencia 12 meses"
                     onClick={() => onNavigate(2)} color="#3ecf8e" />
        </div>
      </div>
      <div className="g4">
        <Kpi icon="check" label="Conforme" value="5/6" note="inspecciones mayo" color="#3ecf8e" />
        <Kpi icon="alert" label="NC abiertas" value="2" note="crítica + media" color="#f2585d" />
        <Kpi icon="pulse" label="Tasa NC" value="3.5%" delta={-0.3} note="target < 4%" inverse={true} color="#f5b740" />
        <Kpi icon="medal" label="Conformidad" value={`${last}%`} delta={(last - prev).toFixed(1)} note="mayo 2026" color="#3ecf8e" />
      </div>
    </div>
  );
}

function CalidadInspecciones() {
  const [filter, setFilter] = _us('Todos');
  const opts = ['Todos', 'Conforme', 'No conforme', 'Observado'];
  const rows = filter === 'Todos' ? D.inspecciones : D.inspecciones.filter(i => i.resultado === filter);
  return (
    <div className="fade-in card">
      <FilterChips options={opts} active={filter} onChange={setFilter} />
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Lote</th><th>Tipo</th><th>Resultado</th><th>Inspector</th><th>Fecha</th>
          </tr></thead>
          <tbody>
            {rows.map(ins => (
              <tr key={ins.id}>
                <td className="cell-id">{ins.id}</td>
                <td className="cell-strong">{ins.lote}</td>
                <td>{ins.tipo}</td>
                <td><Badge>{ins.resultado}</Badge></td>
                <td className="t2">{ins.inspector}</td>
                <td className="t3 f12">{ins.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalidadConformidad() {
  const conf = D.conformidad;
  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Kpi icon="pulse" label="Mejor mes" value="96.8%" note="jun 2025" color="#3ecf8e"
             sparkData={conf.conforme} />
        <Kpi icon="alert" label="Peor mes" value="95.0%" note="sep 2025" color="#f2585d"
             sparkData={conf.conforme} />
      </div>
      <Card title="Tasa de conformidad 12 meses (%)" icon="pulse">
        <div className="card-body">
          <AreaChart data={conf.conforme} labels={conf.meses} height={220} color="#3ecf8e"
                     objetivo={96} unit="%" />
        </div>
      </Card>
    </div>
  );
}

window.ViewCalidad = function ViewCalidad({ tab, onTabChange }) {
  const views = [
    <CalidadPanel onNavigate={onTabChange} />,
    <CalidadInspecciones />,
    <CalidadConformidad />
  ];
  return views[tab] || views[0];
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

/* =========================================================
   VENCIMIENTOS (solo lectura — tablero de Dirección)
   ========================================================= */
function _diasHasta(fecha) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return Math.round((new Date(fecha + 'T00:00:00') - hoy) / 86400000);
}

function _fmtFechaAR(f) {
  return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function _badgeVenc(fecha) {
  const d = _diasHasta(fecha);
  if (d < 0)   return <Badge tipo="danger">Vencido</Badge>;
  if (d <= 30) return <Badge tipo="warning">Vence en {d}d</Badge>;
  if (d <= 90) return <Badge tipo="info">Pronto ({d}d)</Badge>;
  return <Badge tipo="success">Vigente</Badge>;
}

function ResumenVenc({ items }) {
  const vencidos = items.filter(r => _diasHasta(r.fecha_vencimiento) < 0).length;
  const proximos = items.filter(r => { const d = _diasHasta(r.fecha_vencimiento); return d >= 0 && d <= 30; }).length;
  const vigentes = items.length - vencidos - proximos;

  if (vencidos === 0 && proximos === 0) {
    return (
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap',
                    padding:'12px 20px', borderBottom:'1px solid var(--bd)' }}>
        <Badge tipo="success">Todo al día</Badge>
        <span style={{ fontSize:12, color:'var(--t2)' }}>{vigentes} registro{vigentes !== 1 ? 's' : ''} activo{vigentes !== 1 ? 's' : ''}</span>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap',
                  padding:'12px 20px', borderBottom:'1px solid var(--bd)' }}>
      {vencidos > 0 && <Badge tipo="danger">{vencidos} vencido{vencidos !== 1 ? 's' : ''}</Badge>}
      {proximos > 0 && <Badge tipo="warning">{proximos} próximo{proximos !== 1 ? 's' : ''} a vencer</Badge>}
      {vigentes > 0 && <Badge tipo="success">{vigentes} vigente{vigentes !== 1 ? 's' : ''}</Badge>}
    </div>
  );
}

function RRHHVencimientos() {
  const [subtab,    setSubtab]    = _us('contratos');
  const [contratos, setContratos] = _us([]);
  const [licencias, setLicencias] = _us([]);
  const [loadC, setLoadC] = _us(true);
  const [loadL, setLoadL] = _us(true);
  const [errC,  setErrC]  = _us(false);
  const [errL,  setErrL]  = _us(false);

  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;

    fetch(`${url}/contratos_vencimiento?activo=eq.true&order=fecha_vencimiento.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.json())
      .then(d => { setContratos(Array.isArray(d) ? d : []); setLoadC(false); })
      .catch(() => { setErrC(true); setLoadC(false); });

    fetch(`${url}/licencias_vencimiento?activo=eq.true&order=fecha_vencimiento.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.json())
      .then(d => { setLicencias(Array.isArray(d) ? d : []); setLoadL(false); })
      .catch(() => { setErrL(true); setLoadL(false); });
  }, []);

  let content;
  if (subtab === 'contratos') {
    if (loadC)
      content = <div className="card" style={{ textAlign:'center', padding:'40px', color:'var(--t2)' }}>Cargando contratos...</div>;
    else if (errC)
      content = <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--err)' }}>No se pudieron cargar los datos.</div>;
    else if (contratos.length === 0)
      content = <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>No hay registros activos.</div>;
    else
      content = (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Icon name="alert" size={15} />Contratos activos</div>
          </div>
          <ResumenVenc items={contratos} />
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Nombre</th><th>Tipo</th><th>Empresa</th><th>Área</th>
                <th>Inicio</th><th>Vencimiento</th><th>Estado</th>
              </tr></thead>
              <tbody>
                {contratos.map(c => (
                  <tr key={c.id}>
                    <td className="cell-strong">{c.nombre}</td>
                    <td className="t2">{c.tipo}</td>
                    <td><Badge>{c.empresa}</Badge></td>
                    <td className="t2 f12">{c.area || '—'}</td>
                    <td className="t3 f12">{c.fecha_inicio ? _fmtFechaAR(c.fecha_inicio) : '—'}</td>
                    <td className="fw5">{_fmtFechaAR(c.fecha_vencimiento)}</td>
                    <td>{_badgeVenc(c.fecha_vencimiento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
  } else {
    if (loadL)
      content = <div className="card" style={{ textAlign:'center', padding:'40px', color:'var(--t2)' }}>Cargando licencias...</div>;
    else if (errL)
      content = <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--err)' }}>No se pudieron cargar los datos.</div>;
    else if (licencias.length === 0)
      content = <div className="card" style={{ textAlign:'center', padding:'32px', color:'var(--t2)' }}>No hay registros activos.</div>;
    else
      content = (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Icon name="users" size={15} />Licencias activas</div>
          </div>
          <ResumenVenc items={licencias} />
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Persona</th><th>Legajo</th><th>Empresa</th>
                <th>Tipo de licencia</th><th>N° doc.</th><th>Vencimiento</th><th>Estado</th>
              </tr></thead>
              <tbody>
                {licencias.map(l => (
                  <tr key={l.id}>
                    <td className="cell-strong">{l.apellido_y_nombre}</td>
                    <td className="cell-id">{l.legajo || '—'}</td>
                    <td><Badge>{l.empresa}</Badge></td>
                    <td className="t2">{l.tipo_licencia}</td>
                    <td className="t2 f12">{l.numero_doc || '—'}</td>
                    <td className="fw5">{_fmtFechaAR(l.fecha_vencimiento)}</td>
                    <td>{_badgeVenc(l.fecha_vencimiento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
  }

  return (
    <div className="fade-in">
      <div className="card" style={{ padding:'10px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { id:'contratos', label:'Contratos' },
            { id:'licencias', label:'Licencias' },
          ].map(v => (
            <button key={v.id} onClick={() => setSubtab(v.id)}
                    className={`chip${subtab===v.id ? ' active' : ''}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {content}
    </div>
  );
}

