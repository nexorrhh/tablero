// app.jsx — componente raíz y routing

const { useState, useRef, useEffect } = React;

const SECTIONS = [
  { id:'inicio',      label:'Inicio',            icon:'home',      group:null,          tabs:[] },
  { id:'rrhh',        label:'Recursos Humanos',   icon:'users',    group:'Personas',    tabs:['Panel','Plantel','Permisos y solicitudes','Sábados y feriados','Postulantes y candidatos'] },
  { id:'presupuesto', label:'Presupuesto',        icon:'receipt',  group:'Comercial',   tabs:['Panel','Presupuestos','Ventas'] },
  { id:'ingenieria',  label:'Ingeniería',         icon:'compass',  group:'Técnica',     tabs:['Panel','Proyectos'] },
  { id:'compras',     label:'Compras',            icon:'cart',     group:'Operaciones', tabs:['Panel','Órdenes de compra','Proveedores'] },
  { id:'produccion',  label:'Producción',         icon:'factory',  group:'Operaciones', tabs:['Resumen','Órdenes','Obras'] },
  { id:'calidad',     label:'Calidad',            icon:'medal',    group:'Calidad',     tabs:['Panel','Inspecciones y ensayos','Conformidad'] },
  { id:'flota',       label:'Flota',              icon:'truck',    group:'Operaciones', tabs:['Estado','Vencimientos','Mantenimiento'] },
  { id:'nc',          label:'No conformidades',   icon:'alert',    group:'Calidad',     tabs:['Listado','Análisis'] },
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

function App() {
  const [section, setSection] = useState(() => localStorage.getItem('cmt_section') || 'inicio');
  const [tab,     setTab]     = useState(0);
  const [theme,   setTheme]   = useState(() => localStorage.getItem('cmt_theme') || 'dark');
  const contentRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cmt_theme', theme);
  }, [theme]);

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

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className="app">
      <Sidebar sections={SECTIONS} active={section} onSelect={handleSectionChange} />
      <div className="main">
        <Header section={currentSection} theme={theme} onThemeToggle={toggleTheme} />
        {currentSection.tabs.length > 0 && (
          <div className="tabs-bar">
            {currentSection.tabs.map((t, i) => (
              <button
                key={t}
                className={`tab-btn${tab === i ? ' active' : ''}`}
                onClick={() => handleTabChange(i)}
              >
                {t}
              </button>
            ))}
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
