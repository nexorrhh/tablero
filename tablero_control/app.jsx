// app.jsx — componente raíz y routing

const { useState, useRef, useEffect, useCallback } = React;

/* ===== LOGIN SCREEN ===== */
function LoginScreen({ onLogin }) {
  const [step,        setStep]       = useState('select'); // select | create | confirm | login
  const [selected,    setSelected]   = useState(null);
  const [pin,         setPin]        = useState('');
  const [firstPin,    setFirstPin]   = useState('');
  const [error,       setError]      = useState('');
  const [pinesMap,    setPinesMap]   = useState(null); // null = cargando
  const [pinesSaving, setPinesSaving] = useState(false);
  const containerRef = useRef(null);

  // Carga PINs desde Supabase al montar
  useEffect(() => {
    const { url, key } = window.SUPABASE_CONFIG;
    fetch(`${url}/directorio_pines?select=user_id,pin`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    })
      .then(r => r.json())
      .then(rows => {
        const map = {};
        if (Array.isArray(rows)) rows.forEach(r => { map[r.user_id] = r.pin; });
        setPinesMap(map);
      })
      .catch(() => setPinesMap({}));
  }, []);

  const hasPin = uid => !!(pinesMap && pinesMap[uid]);

  useEffect(() => {
    if (step !== 'select') containerRef.current?.focus();
  }, [step, selected]);

  const goToPin = uid => {
    if (!pinesMap) return; // todavía cargando
    setSelected(uid);
    setPin('');
    setFirstPin('');
    setError('');
    setStep(hasPin(uid) ? 'login' : 'create');
  };

  const doLogin = uid => {
    const user = window.USERS.find(u => u.id === (uid || selected));
    localStorage.setItem('cmt_user', JSON.stringify(user));
    localStorage.setItem('cmt_section', 'inicio');
    onLogin(user);
  };

  const submitPin = async (val, currentStep, currentFirst, currentSelected) => {
    if (currentStep === 'create') {
      setFirstPin(val);
      setPin('');
      setStep('confirm');
    } else if (currentStep === 'confirm') {
      if (val === currentFirst) {
        setPinesSaving(true);
        try {
          const { url, key } = window.SUPABASE_CONFIG;
          const res = await fetch(`${url}/directorio_pines`, {
            method: 'POST',
            headers: {
              apikey: key, Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({ user_id: currentSelected, pin: val, updated_at: new Date().toISOString() }),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          setPinesMap(m => ({ ...m, [currentSelected]: val }));
          doLogin(currentSelected);
        } catch {
          setError('No se pudo guardar el PIN. Verificá tu conexión.');
          setFirstPin('');
          setPin('');
          setStep('create');
          setPinesSaving(false);
        }
      } else {
        setError('Los PINs no coinciden. Intentá de nuevo.');
        setFirstPin('');
        setPin('');
        setStep('create');
      }
    } else {
      if (val === pinesMap?.[currentSelected]) {
        doLogin(currentSelected);
      } else {
        setError('PIN incorrecto. Intentá de nuevo.');
        setPin('');
      }
    }
  };

  const addDigit = d => {
    if (pinesSaving || pin.length >= 4) return;
    const next = pin + String(d);
    setPin(next);
    setError('');
    if (next.length === 4) setTimeout(() => submitPin(next, step, firstPin, selected), 150);
  };

  const delDigit = () => { if (!pinesSaving) setPin(p => p.slice(0, -1)); };

  const handleKeyDown = e => {
    if (/^\d$/.test(e.key)) addDigit(e.key);
    else if (e.key === 'Backspace') delDigit();
  };

  const selectedUser = window.USERS.find(u => u.id === selected);

  const STEP_TITLE = {
    create:  'Creá tu PIN de 4 dígitos',
    confirm: 'Confirmá tu PIN',
    login:   'Ingresá tu PIN',
  };
  const STEP_SUB = {
    create:  'Primera vez — elegí un PIN personal',
    confirm: 'Volvé a ingresar el mismo PIN',
    login:   '',
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', background:'var(--bg)', padding:24 }}>
      <div ref={containerRef} tabIndex={0} onKeyDown={step !== 'select' ? handleKeyDown : undefined}
           style={{ outline:'none', width:'100%', maxWidth:460, background:'var(--sf1)',
                    border:'1px solid var(--bd)', borderRadius:16,
                    boxShadow:'0 24px 64px rgba(0,0,0,0.4)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'32px 32px 24px', textAlign:'center', borderBottom:'1px solid var(--bd)' }}>
          <div style={{ fontSize:30, fontWeight:700, fontFamily:'DM Serif Display, serif',
                        color:'var(--accent)', letterSpacing:'-0.5px' }}>
            Cimo<span style={{ color:'var(--t1)' }}>met</span>
          </div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:6,
                        letterSpacing:'0.1em', textTransform:'uppercase' }}>Tablero de Control</div>
        </div>

        <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>

          {step === 'select' ? (
            <>
              <div style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase',
                            letterSpacing:'0.07em' }}>Seleccioná tu perfil</div>
              {pinesMap === null ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:'var(--t3)', fontSize:13 }}>
                  Cargando...
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {window.USERS.map(u => (
                    <button key={u.id} onClick={() => goToPin(u.id)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                               borderRadius:8, cursor:'pointer', textAlign:'left',
                               border:'1px solid var(--bd)', background:'var(--sf2)',
                               color:'var(--t1)', transition:'all .12s' }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                                    background:'var(--sf1)', border:'1px solid var(--bd)',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:11, fontWeight:700, color:'var(--t2)' }}>
                        {u.initials}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, lineHeight:1.3 }}>{u.name}</div>
                        {!hasPin(u.id) && (
                          <div style={{ fontSize:10, color:'var(--warn)', marginTop:2, fontWeight:500 }}>
                            Crear PIN →
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Volver + avatar */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={() => { setStep('select'); setPin(''); setError(''); }}
                  style={{ background:'var(--sf2)', border:'1px solid var(--bd)', borderRadius:6,
                           padding:'6px 12px', cursor:'pointer', color:'var(--t2)', fontSize:12, flexShrink:0 }}>
                  ← Volver
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
                                background:'var(--accent)', color:'#fff',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:12, fontWeight:700 }}>{selectedUser?.initials}</div>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--t1)' }}>{selectedUser?.name}</span>
                </div>
              </div>

              {/* Título */}
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--t1)', marginBottom:4 }}>
                  {pinesSaving ? 'Guardando PIN...' : STEP_TITLE[step]}
                </div>
                {STEP_SUB[step] && !pinesSaving && (
                  <div style={{ fontSize:12, color:'var(--t3)' }}>{STEP_SUB[step]}</div>
                )}
              </div>

              {/* Puntos PIN */}
              {pinesSaving ? (
                <div style={{ textAlign:'center', padding:'16px 0', color:'var(--t3)', fontSize:13 }}>
                  Guardando en base de datos...
                </div>
              ) : (
                <div style={{ display:'flex', justifyContent:'center', gap:14 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      width:54, height:62, borderRadius:12,
                      border:`2px solid ${pin.length > i ? 'var(--accent)' : 'var(--bd)'}`,
                      background:'var(--sf2)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:26, color:'var(--accent)', transition:'border-color .1s',
                    }}>{pin.length > i ? '●' : ''}</div>
                  ))}
                </div>
              )}

              {!pinesSaving && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:4 }}>
                  {[1,2,3,4,5,6,7,8,9].map(d => (
                    <button key={d} onClick={() => addDigit(d)}
                      style={{ padding:'15px 0', fontSize:20, fontWeight:600, borderRadius:10,
                               border:'1px solid var(--bd)', background:'var(--sf2)',
                               color:'var(--t1)', cursor:'pointer', transition:'background .1s' }}>
                      {d}
                    </button>
                  ))}
                  <div />
                  <button onClick={() => addDigit(0)}
                    style={{ padding:'15px 0', fontSize:20, fontWeight:600, borderRadius:10,
                             border:'1px solid var(--bd)', background:'var(--sf2)',
                             color:'var(--t1)', cursor:'pointer', transition:'background .1s' }}>
                    0
                  </button>
                  <button onClick={delDigit}
                    style={{ padding:'15px 0', fontSize:20, borderRadius:10,
                             border:'1px solid var(--bd)', background:'var(--sf2)',
                             color:'var(--t2)', cursor:'pointer', transition:'background .1s' }}>
                    ⌫
                  </button>
                </div>
              )}

              {error && (
                <div style={{ fontSize:12, color:'var(--err)', padding:'8px 12px', borderRadius:6,
                              background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
                              textAlign:'center' }}>
                  {error}
                </div>
              )}
            </>
          )}
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
  { id:'calidad',     label:'Calidad',           icon:'medal',   group:'Calidad',     live:true,  tabs:['Panel','Inspecciones y ensayos','Conformidad','Actividad diaria'] },
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

/* ===== APP ===== */
function App() {
  const [user,    setUser]    = useState(() => window.getCurrentUser());
  const [section, setSection] = useState(() => localStorage.getItem('cmt_section') || 'inicio');
  const [tab,     setTab]     = useState(0);
  const [theme,   setTheme]   = useState(() => localStorage.getItem('cmt_theme') || 'dark');
  const [badges,  setBadges]  = useState({});
  const contentRef = useRef(null);

  const fetchBadges = useCallback(() => {
    const nexoCall = (tenant, action) => {
      const cfg = window.NEXO_CONFIG?.[tenant];
      if (!cfg?.url || !cfg?.apiKey || cfg.apiKey === 'CAMBIAR_ESTA_CLAVE') return Promise.resolve([]);
      return fetch(`${cfg.url}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: cfg.apiKey }),
      }).then(r => r.json()).then(d => d.permisos || []).catch(() => []);
    };
    Promise.all([
      nexoCall('cimomet', 'get_permisos_pendientes'),
      nexoCall('comoing', 'get_permisos_pendientes'),
    ]).then(([ci, co]) => {
      const total = ci.length + co.length;
      setBadges(total > 0 ? { rrhh: { total, tabs: { 2: total } } } : {});
    });
  }, []);

  // Deep link: ?goto=rrhh:2 navega a sección+tab después del login
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const goto = params.get('goto');
    if (goto) {
      const [sec, tabStr] = goto.split(':');
      const tabIdx = parseInt(tabStr, 10) || 0;
      if (sec) {
        setSection(sec);
        localStorage.setItem('cmt_section', sec);
        setTab(tabIdx);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

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
