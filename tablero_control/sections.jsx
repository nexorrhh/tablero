// sections.jsx — todas las vistas de secciones

const { useState: _us, useMemo: _um, useEffect: _ue } = React;
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
window.ViewInicio = function ViewInicio() {
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
        <Card title="Plantel por sector" icon="users">
          <div className="card-body" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <DonutChart segments={D.plantel.sectores} size={160} thickness={24} centerLabel="personas" />
            <div style={{ flex: 1 }}>
              {D.plantel.sectores.map((s, i) => (
                <div key={i} className="stat-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span className="stat-label f12">{s.nombre}</span>
                  </div>
                  <span className="stat-val">{s.valor}</span>
                </div>
              ))}
            </div>
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

const PUESTO_COLORS = ['#5aa9f5','#3ecf8e','#f5b740','#a78bfa','#fb923c','#ff7ab8','#34d399','#f2585d'];

function _colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PUESTO_COLORS[Math.abs(h) % PUESTO_COLORS.length];
}

function RRHHPanel({ onNavigate, empleados, loading }) {
  const ausActual = D.ausentismo.valores[D.ausentismo.valores.length - 1];
  const presActual = (100 - ausActual).toFixed(1);
  const activos  = empleados.filter(e => e.activo).length;
  const total    = empleados.length;
  const progress = total > 0 ? Math.round((activos / total) * 100) : 0;
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ingresosEsteMes = empleados.filter(e => new Date(e.creado_en) >= firstOfMonth).length;

  return (
    <div className="fade-in">
      <div className="g2 mb24">
        <Vital label="Presentismo Mayo" value={presActual}
               segments={[
                 { label: 'Presente', pct: parseFloat(presActual), color: '#3ecf8e' },
                 { label: 'Ausente',  pct: ausActual,              color: '#f2585d' }
               ]}
               delta={0.3} note="vs abril"
               sparkData={D.ausentismo.valores.map(v => 100 - v)} />
        <div>
          <HubButton icon="users"    title="Plantel"
                     subtitle={loading ? 'Cargando…' : `${total} registros`}
                     onClick={() => onNavigate(1)} />
          <HubButton icon="clipboard" title="Permisos y solicitudes" subtitle="3 pendientes"
                     onClick={() => onNavigate(2)} />
          <HubButton icon="calendar"  title="Sábados y feriados"     subtitle="1 turno programado"
                     onClick={() => onNavigate(3)} />
          <HubButton icon="userplus"  title="Postulantes y candidatos" subtitle="6 en proceso"
                     onClick={() => onNavigate(4)} />
          <HubButton icon="external"  title="Portal RRHH"            subtitle="Acceder al portal"
                     onClick={() => window.open('https://nexorrhh.github.io/index/', '_blank')} />
        </div>
      </div>
      <div className="g4">
        <Kpi icon="users" label="Plantel activo"
             value={loading ? '—' : String(activos)}
             note={loading ? '' : `de ${total} totales`}
             progress={progress} />
        <Kpi icon="heart"    label="Ausentismo"       value={`${ausActual}%`} delta={-0.3} note="meta < 4%" color="#f5b740" />
        <Kpi icon="inbox"    label="Solicitudes pend." value="3"               note="Permisos y licencias" color="#5aa9f5" />
        <Kpi icon="userplus" label="Ingresos este mes"
             value={loading ? '—' : String(ingresosEsteMes)}
             note="Altas del mes en curso" color="#3ecf8e" />
      </div>
    </div>
  );
}

function RRHHPlantel({ empleados, loading }) {
  const [empresa,   setEmpresa]   = _us('Todos');
  const [puesto,    setPuesto]    = _us('Todos');
  const [busqueda,  setBusqueda]  = _us('');

  const activos = _um(() => empleados.filter(e => e.activo), [empleados]);

  const puestosUnicos = _um(() => {
    const set = new Set(activos.map(e => e.desc_puesto).filter(Boolean));
    return ['Todos', ...Array.from(set).sort()];
  }, [activos]);

  const rows = _um(() => activos.filter(e => {
    if (empresa  !== 'Todos' && e.empresa    !== empresa)  return false;
    if (puesto   !== 'Todos' && e.desc_puesto !== puesto)  return false;
    if (busqueda && !e.apellido_y_nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [activos, empresa, puesto, busqueda]);

  const donutSegments = _um(() => {
    const counts = {};
    activos.forEach(e => {
      const p = e.desc_puesto || 'Sin puesto';
      counts[p] = (counts[p] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top    = sorted.slice(0, 7);
    const otros  = sorted.slice(7).reduce((sum, [, v]) => sum + v, 0);
    const segs   = top.map(([nombre, valor], i) => ({ nombre, valor, color: PUESTO_COLORS[i] }));
    if (otros > 0) segs.push({ nombre: 'Otros', valor: otros, color: '#4a4555' });
    return segs;
  }, [activos]);

  const cimomet = activos.filter(e => e.empresa === 'CIMOMET').length;
  const comoing = activos.filter(e => e.empresa === 'COMOING').length;
  const puestosDistintos = _um(() =>
    new Set(activos.map(e => e.desc_puesto).filter(Boolean)).size, [activos]);

  const hayFiltros = empresa !== 'Todos' || puesto !== 'Todos' || busqueda !== '';

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', color: 'inherit',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
    padding: '5px 10px', fontSize: 12, outline: 'none', width: '100%'
  };

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
          <div className="card-body" style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
            <DonutChart segments={donutSegments} size={160} thickness={24} centerLabel="activos" />
            <div style={{ flex:1, overflowY:'auto', maxHeight:180 }}>
              {donutSegments.map((s, i) => (
                <div key={i} className="stat-row"
                     style={{ cursor:'pointer', borderRadius:4, padding:'2px 4px',
                              background: puesto === s.nombre ? 'rgba(255,255,255,0.06)' : 'transparent' }}
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
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16 }}>
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
      <div className="card" style={{ padding:'10px 16px', marginBottom:12,
                                     display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <FilterChips options={['Todos','CIMOMET','COMOING']} active={empresa} onChange={setEmpresa} />
        <div style={{ borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:12 }}>
          <select value={puesto} onChange={e => setPuesto(e.target.value)} style={inputStyle}>
            {puestosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:12, flex:1, minWidth:180 }}>
          <input type="text" placeholder="Buscar por nombre…"
                 value={busqueda} onChange={e => setBusqueda(e.target.value)}
                 style={inputStyle} />
        </div>
        {hayFiltros && (
          <button onClick={() => { setEmpresa('Todos'); setPuesto('Todos'); setBusqueda(''); }}
                  style={{ fontSize:11, color:'var(--t2)', background:'none', border:'none',
                           cursor:'pointer', padding:'2px 6px', whiteSpace:'nowrap' }}>
            ✕ limpiar
          </button>
        )}
        <span className="f12 t2" style={{ marginLeft:'auto', whiteSpace:'nowrap' }}>
          {rows.length} de {activos.length} personas
        </span>
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
                  <td className="t2">{e.desc_puesto}</td>
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
  const [filter, setFilter] = _us('Todos');
  const opts = ['Todos', 'Pendiente', 'Aprobada', 'Rechazada'];
  const rows = filter === 'Todos' ? D.solicitudes : D.solicitudes.filter(s => s.estado === filter);
  return (
    <div className="fade-in card">
      <FilterChips options={opts} active={filter} onChange={setFilter} />
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Empleado</th><th>Tipo</th><th>Días</th><th>Estado</th><th>Fecha</th>
          </tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id}>
                <td className="cell-id">{s.id}</td>
                <td className="cell-strong">{s.empleado}</td>
                <td>{s.tipo}</td>
                <td className="cell-num">{s.dias > 0 ? s.dias : '—'}</td>
                <td><Badge>{s.estado}</Badge></td>
                <td className="t3 f12">{s.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RRHHSabados() {
  return (
    <div className="fade-in card">
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>Fecha</th><th>Sector</th><th>Personal</th><th>Horas</th><th>Estado</th>
          </tr></thead>
          <tbody>
            {D.sabados.map((s, i) => (
              <tr key={i}>
                <td className="cell-strong">{s.fecha}</td>
                <td>{s.sector}</td>
                <td className="cell-num">{s.personal} pers.</td>
                <td className="cell-num">{s.hs} hs</td>
                <td><Badge>{s.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RRHHPostulantes() {
  const [filter, setFilter] = _us('Todos');
  const etapas = ['Todos', 'Recibido', 'Entrevista', 'Evaluación', 'Oferta', 'Contratado', 'Descartado'];
  const rows = filter === 'Todos' ? D.postulantes : D.postulantes.filter(p => p.etapa === filter);
  return (
    <div className="fade-in card">
      <FilterChips options={etapas} active={filter} onChange={setFilter} />
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Nombre</th><th>Puesto</th><th>Etapa</th><th>Fecha</th>
          </tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td className="cell-id">{p.id}</td>
                <td className="cell-strong">{p.nombre}</td>
                <td>{p.puesto}</td>
                <td><Badge>{p.etapa}</Badge></td>
                <td className="t3 f12">{p.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.ViewRRHH = function ViewRRHH({ tab, onTabChange }) {
  const [empleados, setEmpleados] = _us([]);
  const [loading, setLoading] = _us(true);

  _ue(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(
      `${url}/empleados?select=id,legajo,empresa,apellido_y_nombre,cuil,desc_puesto,activo,creado_en&order=apellido_y_nombre`,
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
    <RRHHPostulantes />
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
   NO CONFORMIDADES
   ========================================================= */
function NCListado() {
  const [filterEstado, setFilterEstado] = _us('Todos');
  const [filterPrioridad, setFilterPrioridad] = _us('Todos');
  const estadoOpts = ['Todos', 'Abierta', 'En proceso', 'Cerrada'];
  const priorOpts  = ['Todos', 'Alta', 'Media', 'Baja'];

  const rows = D.nc.filter(n => {
    const okE = filterEstado === 'Todos' || n.estado === filterEstado;
    const okP = filterPrioridad === 'Todos' || n.prioridad === filterPrioridad;
    return okE && okP;
  });

  return (
    <div className="fade-in">
      <div className="g4 mb20">
        <Kpi icon="alert" label="NC abiertas" value="2" note="requieren acción" color="#f2585d" />
        <Kpi icon="clock" label="En proceso" value="2" note="investigación" color="#f5b740" />
        <Kpi icon="check" label="Cerradas" value="3" note="mayo 2026" color="#3ecf8e" />
        <Kpi icon="pulse" label="Tasa NC" value="3.5%" delta={-0.3} note="target < 4%" color="#5aa9f5" />
      </div>
      <div className="card">
        <div style={{ padding: '12px 20px 0', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingBottom: 12 }}>
            <div>
              <span className="f11 t3 fw6" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</span>
              <div className="tbl-filters" style={{ padding: '6px 0 0', border: 'none' }}>
                {estadoOpts.map(o => (
                  <button key={o} className={`chip${filterEstado === o ? ' active' : ''}`} onClick={() => setFilterEstado(o)}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="f11 t3 fw6" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prioridad</span>
              <div className="tbl-filters" style={{ padding: '6px 0 0', border: 'none' }}>
                {priorOpts.map(o => (
                  <button key={o} className={`chip${filterPrioridad === o ? ' active' : ''}`} onClick={() => setFilterPrioridad(o)}>{o}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>ID</th><th>Descripción</th><th>Sector</th><th>Origen</th><th>Estado</th><th>Prioridad</th>
            </tr></thead>
            <tbody>
              {rows.map(n => (
                <tr key={n.id}>
                  <td className="cell-id">{n.id}</td>
                  <td className="cell-strong">{n.desc}</td>
                  <td>{n.sector}</td>
                  <td className="t2">{n.origen}</td>
                  <td><Badge>{n.estado}</Badge></td>
                  <td><Badge>{n.prioridad}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NCAnalisis() {
  const bySector = {};
  const byEstado = {};
  D.nc.forEach(n => {
    bySector[n.sector] = (bySector[n.sector] || 0) + 1;
    byEstado[n.estado] = (byEstado[n.estado] || 0) + 1;
  });
  const total = D.nc.length;
  const sectorColors = { Producción: '#e0218a', Calidad: '#3ecf8e', Logística: '#5aa9f5', Ingeniería: '#f5b740' };
  const estadoColors = { Abierta: '#f2585d', 'En proceso': '#f5b740', Cerrada: '#3ecf8e' };

  return (
    <div className="fade-in">
      <div className="g2">
        <Card title="Por sector" icon="pie">
          <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <DonutChart
              segments={Object.entries(bySector).map(([k, v]) => ({ nombre: k, valor: v, color: sectorColors[k] || '#7c7589' }))}
              size={150} thickness={22} centerLabel="NC" />
            <div style={{ flex: 1 }}>
              {Object.entries(bySector).map(([k, v]) => (
                <div key={k} className="stat-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sectorColors[k] || '#7c7589', flexShrink: 0 }} />
                    <span className="stat-label f12">{k}</span>
                  </div>
                  <div className="stat-bar-w"><div className="stat-bar-f" style={{ width: `${(v/total)*100}%`, background: sectorColors[k] || '#7c7589' }} /></div>
                  <span className="stat-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Por estado" icon="barChart">
          <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <DonutChart
              segments={Object.entries(byEstado).map(([k, v]) => ({ nombre: k, valor: v, color: estadoColors[k] || '#7c7589' }))}
              size={150} thickness={22} centerLabel="NC" />
            <div style={{ flex: 1 }}>
              {Object.entries(byEstado).map(([k, v]) => (
                <div key={k} className="stat-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: estadoColors[k] || '#7c7589', flexShrink: 0 }} />
                    <span className="stat-label f12">{k}</span>
                  </div>
                  <div className="stat-bar-w"><div className="stat-bar-f" style={{ width: `${(v/total)*100}%`, background: estadoColors[k] || '#7c7589' }} /></div>
                  <span className="stat-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

window.ViewNC = function ViewNC({ tab }) {
  const views = [<NCListado />, <NCAnalisis />];
  return views[tab] || views[0];
};
