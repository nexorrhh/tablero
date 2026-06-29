// app.jsx — componente raíz y routing

const { useState, useRef, useEffect, useCallback } = React;

/* ===== LOGIN SCREEN ===== */
function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState(null);
  const [pwd,      setPwd]      = useState('');
  const [error,    setError]    = useState('');

  const handleLogin = () => {
    if (!selected) { setError('Seleccioná un perfil.'); return; }
    if (pwd !== window.APP_PASSWORD) { setError('Clave incorrecta.'); setPwd(''); return; }
    const user = window.USERS.find(u => u.id === selected);
    localStorage.setItem('cmt_user', JSON.stringify(user));
    localStorage.setItem('cmt_section', 'inicio');
    onLogin(user);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', background:'var(--bg)', padding:24 }}>
      <div style={{ width:'100%', maxWidth:500, background:'var(--sf1)',
                    border:'1px solid var(--bd)', borderRadius:16,
                    boxShadow:'0 24px 64px rgba(0,0,0,0.4)', overflow:'hidden' }}>
        <div style={{ padding:'32px 32px 24px', textAlign:'center',
                      borderBottom:'1px solid var(--bd)' }}>
          <div style={{ fontSize:30, fontWeight:700, fontFamily:'DM Serif Display, serif',
                        color:'var(--accent)', letterSpacing:'-0.5px' }}>
            Cimo<span style={{ color:'var(--t1)' }}>met</span>
          </div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:6,
                        letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Tablero de Control
          </div>
        </div>

        <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase',
                          letterSpacing:'0.07em', marginBottom:10 }}>
              Seleccioná tu perfil
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {window.USERS.map(u => {
                const active = selected === u.id;
                return (
                  <button key={u.id} onClick={() => { setSelected(u.id); setError(''); }}
                    style={{ display:'flex', alignItems:'center', gap:10,
                             padding:'10px 14px', borderRadius:8, cursor:'pointer',
                             textAlign:'left',
                             border: active ? '1.5px solid var(--accent)' : '1px solid var(--bd)',
                             background: active ? 'rgba(224,33,138,0.1)' : 'var(--sf2)',
                             color:'var(--t1)', transition:'all .12s' }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                                  background: active ? 'var(--accent)' : 'var(--sf1)',
                                  border:'1px solid var(--bd)',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontSize:11, fontWeight:700,
                                  color: active ? '#fff' : 'var(--t2)' }}>
                      {u.initials}
                    </div>
                    <span style={{ fontSize:13, fontWeight: active ? 600 : 400,
                                   lineHeight:1.3 }}>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase',
                          letterSpacing:'0.07em', marginBottom:6 }}>
              Clave de acceso
            </div>
            <input type="password" value={pwd} placeholder="••••"
              onChange={e => { setPwd(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width:'100%', boxSizing:'border-box', background:'var(--sf2)',
                       border:'1px solid var(--bd)', borderRadius:8,
                       padding:'10px 14px', color:'var(--t1)', fontSize:15,
                       outline:'none', fontFamily:'inherit' }} />
          </div>

          {error && (
            <div style={{ fontSize:12, color:'var(--err)', padding:'8px 12px',
                          borderRadius:6, background:'rgba(239,68,68,0.1)',
                          border:'1px solid rgba(239,68,68,0.25)' }}>
              {error}
            </div>
          )}

          <button onClick={handleLogin}
            style={{ padding:'12px', borderRadius:8, border:'none',
                     background:'var(--accent)', color:'#fff', fontWeight:600,
                     fontSize:14, cursor:'pointer', transition:'opacity .15s',
                     opacity: (!selected || !pwd) ? 0.5 : 1 }}>
            Ingresar al tablero
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== SECCIONES ===== */
const SECTIONS = [
  { id:'inicio',      label:'Inicio',           icon:'home',    group:null,           live:false, tabs:[] },
  { id:'rrhh',        label:'Recursos Humanos', icon:'users',   group:'Personas',     live:true,  tabs:['Panel','Plantel','Permisos y solicitudes','Sábados y feriados','Postulantes y candidatos','Vencimientos'] },
  { id:'presupuesto', label:'Presupuesto',       icon:'receipt', group:'Comercial',   live:false, tabs:['Panel','Presupuestos','Ventas'] },
  { id:'ingenieria',  label:'Ingeniería',        icon:'compass', group:'Técnica',     live:false, tabs:['Panel','Proyectos'] },
  { id:'compras',     label:'Compras',           icon:'cart',    group:'Operaciones', live:false, tabs:['Panel','Órdenes de compra','Proveedores'] },
  { id:'produccion',  label:'Producción',        icon:'factory', group:'Operaciones', live:false, tabs:['Resumen','Órdenes','Obras'] },
  { id:'calidad',     label:'Calidad',           icon:'medal',   group:'Calidad',     live:false, tabs:['Panel','Inspecciones y ensayos','Conformidad'] },
  { id:'flota',       label:'Flota',             icon:'truck',   group:'Operaciones', live:false, tabs:['Estado','Vencimientos','Mantenimiento'] },
  { id:'nc',          label:'No conformidades',  icon:'alert',   group:'Calidad',     live:true,  tabs:['Panel','Listado'] },
];

const VIEW_MAP = {
  inicio:      () => window.ViewInicio,
  rrhh:        () => window.ViewRRHH,
  presupuesto: () => window.ViewPresupuesto,
  ingenieria:  () => window.ViewIngenieria,
  compras:     () => window.ViewCompras,
  produccion:  () => window.ViewProduccion,
  calidad:     () => window.ViewCalidad,
  flota:       () => window.ViewFlota,
  nc:          () => window.ViewNC,
};

/* helpers para badge fetch */
function _countPending(txt, approvalCol, nameCol) {
  try {
    const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}')+1));
    return (json.table?.rows || []).filter(r => {
      const c = r.c || [];
      return c[nameCol]?.v && c[approvalCol]?.v !== true;
    }).length;
  } catch(_) { return 0; }
}

/* ===== APP ===== */
function App() {
  const [user,    setUser]    = useState(() => window.getCurrentUser());
  const [section, setSection] = useState(() => localStorage.getItem('cmt_section') || 'inicio');
  const [tab,     setTab]     = useState(0);
  const [theme,   setTheme]   = useState(() => localStorage.getItem('cmt_theme') || 'dark');
  const [badges,  setBadges]  = useState({});
  const contentRef = useRef(null);

  const fetchBadges = useCallback(() => {
    Promise.all([
      fetch('https://docs.google.com/spreadsheets/d/1SA0AphMQCf5biub1EqkfL1HgSoseFgUUdbJjaZED5Ug/gviz/tq?tqx=out:json&gid=1524672113').then(r=>r.text()).catch(()=>''),
      fetch('https://docs.google.com/spreadsheets/d/1hzYW7WnnZbc2v1B0WABrK8Slr0F5AE7h-j4GO4jeVEs/gviz/tq?tqx=out:json&gid=1140348609').then(r=>r.text()).catch(()=>''),
    ]).then(([permTxt, faltaTxt]) => {
      const perm = permTxt ? _countPending(permTxt, 11, 1) : 0;
      const falt = faltaTxt ? _countPending(faltaTxt, 7, 2) : 0;
      const total = perm + falt;
      setBadges(total > 0 ? { rrhh: { total, tabs: { 2: total } } } : {});
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cmt_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchBadges();
      window._refreshBadges = fetchBadges;
    }
    return () => { window._refreshBadges = null; };
  }, [user, fetchBadges]);

  const handleLogout = () => {
    localStorage.removeItem('cmt_user');
    setUser(null);
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  const currentSection = SECTIONS.find(s => s.id === section) || SECTIONS[0];
  const ViewComp = (VIEW_MAP[section] || (() => null))();

  const handleSectionChange = (id) => {
    setSection(id);
    setTab(0);
    localStorage.setItem('cmt_section', id);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const handleTabChange = (i) => {
    setTab(i);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  return (
    <div className="app">
      <Sidebar sections={SECTIONS} active={section} onSelect={handleSectionChange} badges={badges} />
      <div className="main">
        <Header section={currentSection} theme={theme}
                onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                user={user} onLogout={handleLogout} />
        {currentSection.tabs.length > 0 && (
          <div className="tabs-bar">
            {currentSection.tabs.map((t, i) => {
              const tabBadge = badges[section]?.tabs?.[i] || 0;
              return (
                <button key={t} className={`tab-btn${tab === i ? ' active' : ''}`}
                        onClick={() => handleTabChange(i)}>
                  {t}
                  {tabBadge > 0 && (
                    <span style={{
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      minWidth:16, height:16, borderRadius:8,
                      background:'var(--err)', color:'#fff',
                      fontSize:9, fontWeight:700, padding:'0 4px',
                      marginLeft:6, verticalAlign:'middle', lineHeight:1,
                    }}>{tabBadge > 99 ? '99+' : tabBadge}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <div className="content" ref={contentRef}>
          <ErrorBoundary>
            {ViewComp && <ViewComp tab={tab} onTabChange={handleTabChange} />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
