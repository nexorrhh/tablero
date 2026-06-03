// app.jsx — componente raíz y routing

const { useState, useRef } = React;

const SECTIONS = [
  { id:'inicio',      label:'Inicio',            icon:'home',      group:null,          tabs:[] },
  { id:'rrhh',        label:'RRHH',              subtitle:'Recursos Humanos', icon:'users',    group:'Personas',    tabs:['Panel','Plantel','Permisos y solicitudes','Sábados y feriados','Postulantes y candidatos'] },
  { id:'presupuesto', label:'Presupuesto',        subtitle:'Comercial',        icon:'receipt',  group:'Comercial',   tabs:['Panel','Presupuestos','Ventas'] },
  { id:'ingenieria',  label:'Ingeniería',         subtitle:'Técnica',          icon:'compass',  group:'Técnica',     tabs:['Panel','Proyectos'] },
  { id:'compras',     label:'Compras',            subtitle:'Abastecimiento',   icon:'cart',     group:'Operaciones', tabs:['Panel','Órdenes de compra','Proveedores'] },
  { id:'produccion',  label:'Producción',         subtitle:'Operaciones',      icon:'factory',  group:'Operaciones', tabs:['Resumen','Órdenes','Obras'] },
  { id:'calidad',     label:'Calidad',            icon:'medal',    group:'Calidad',     tabs:['Panel','Inspecciones y ensayos','Conformidad'] },
  { id:'flota',       label:'Flota',              subtitle:'Operaciones',      icon:'truck',    group:'Operaciones', tabs:['Estado','Vencimientos','Mantenimiento'] },
  { id:'nc',          label:'No conformidades',   subtitle:'Calidad',          icon:'alert',    group:'Calidad',     tabs:['Listado','Análisis'] },
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
  const [section, setSection] = useState(() => {
    return localStorage.getItem('cmt_section') || 'inicio';
  });
  const [tab, setTab] = useState(0);
  const contentRef = useRef(null);

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
      <Sidebar sections={SECTIONS} active={section} onSelect={handleSectionChange} />
      <div className="main">
        <Header section={currentSection} />
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
          {ViewComp && <ViewComp tab={tab} onTabChange={handleTabChange} />}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
