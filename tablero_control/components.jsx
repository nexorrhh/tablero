// components.jsx — Kpi, Badge, Delta, FeedItem, Sidebar, Header, Vital, HubButton, Card

const { useState: _useState2 } = React;

/* ===== BADGE ===== */
window.Badge = function Badge({ tipo, children }) {
  const map = {
    success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger',
    info: 'badge-info', neutral: 'badge-neutral', accent: 'badge-accent',
    // Aliases para datos reales
    'Conforme': 'badge-success', 'No conforme': 'badge-danger', 'Observado': 'badge-warning',
    'Activo': 'badge-success', 'Inactivo': 'badge-neutral', 'Operativo': 'badge-success',
    'CIMOMET': 'badge-info', 'COMOING': 'badge-accent',
    'Sabado': 'badge-info', 'Sábado': 'badge-info',
    'Domingo': 'badge-accent', 'Feriado': 'badge-warning',
    'Convocado': 'badge-warning', 'Presente': 'badge-success',
    'Ausente': 'badge-danger', 'No convocado': 'badge-neutral',
    'En taller': 'badge-warning', 'En proceso': 'badge-info', 'Abierta': 'badge-danger',
    'Cerrada': 'badge-neutral', 'Entregada': 'badge-success',
    'Adjudicado': 'badge-success', 'Enviado': 'badge-info', 'En análisis': 'badge-accent',
    'Rechazado': 'badge-danger', 'Rechazada': 'badge-danger',
    'Aprobada': 'badge-success', 'Pendiente': 'badge-warning', 'Demorada': 'badge-danger',
    'Recibida': 'badge-success', 'En tránsito': 'badge-info',
    'Vacaciones': 'badge-accent', 'Licencia': 'badge-warning',
    'Programado': 'badge-accent', 'Confirmado': 'badge-info', 'Liquidado': 'badge-success',
    'Alta': 'badge-danger', 'Media': 'badge-warning', 'Baja': 'badge-neutral',
    'Recibido': 'badge-neutral', 'Entrevista': 'badge-info', 'Evaluación': 'badge-accent',
    'Oferta': 'badge-warning', 'Contratado': 'badge-success', 'Descartado': 'badge-neutral',
  };
  const cls = map[tipo] || map[children] || 'badge-neutral';
  return <span className={`badge ${cls}`}>{children || tipo}</span>;
};

/* ===== DELTA ===== */
window.Delta = function Delta({ value, unit = '%', inverse = false }) {
  const num = parseFloat(value);
  const up = inverse ? num < 0 : num > 0;
  const down = inverse ? num > 0 : num < 0;
  const cls = up ? 'delta-up' : down ? 'delta-down' : 'delta-flat';
  const arrow = up ? '↑' : down ? '↓' : '→';
  const sign = num > 0 ? '+' : '';
  return (
    <span className={`delta ${cls}`}>
      {arrow} {sign}{value}{unit}
    </span>
  );
};

/* ===== KPI CARD ===== */
window.Kpi = function Kpi({ icon, label, value, delta, deltaUnit = '%', note, progress, sparkData, color = 'var(--accent)', inverse = false }) {
  return (
    <div className="kpi">
      {icon && (
        <div className="kpi-icon" style={{ color }}>
          <Icon name={icon} size={18} />
        </div>
      )}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-footer">
        <span className="kpi-note">{note}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {delta !== undefined && <Delta value={delta} unit={deltaUnit} inverse={inverse} />}
          {sparkData && <div className="kpi-sparkline"><Sparkline data={sparkData} color={color} /></div>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="kpi-prog">
          <div className="kpi-prog-fill" style={{ width: `${Math.min(100, progress)}%`, background: color }} />
        </div>
      )}
    </div>
  );
};

/* ===== FEED ITEM ===== */
window.FeedItem = function FeedItem({ tipo, icono, titulo, mensaje, tiempo }) {
  return (
    <div className="feed-item">
      <div className={`feed-ico feed-ico-${tipo}`}>
        <Icon name={icono} size={14} />
      </div>
      <div className="feed-body">
        <div className="feed-title">{titulo}</div>
        <div className="feed-msg">{mensaje}</div>
      </div>
      <div className="feed-time">{tiempo}</div>
    </div>
  );
};

/* ===== SIDEBAR ===== */
window.Sidebar = function Sidebar({ sections, active, onSelect }) {
  // Group sections
  const groups = [];
  const seen = new Set();
  sections.forEach(s => {
    if (!seen.has(s.group)) {
      seen.add(s.group);
      groups.push({ group: s.group, items: sections.filter(x => x.group === s.group) });
    }
  });

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-mark">Cimo<span className="logo-dot">met</span></div>
        <div className="logo-sub">Tablero de Control</div>
      </div>
      <nav className="nav">
        {groups.map(({ group, items }) => (
          <div key={group || '_'} className="nav-group">
            {group && <div className="nav-group-label">{group}</div>}
            {items.map(s => (
              <div
                key={s.id}
                className={`nav-item${active === s.id ? ' active' : ''}`}
                onClick={() => onSelect(s.id)}
              >
                <span className="nav-icon"><Icon name={s.icon} size={16} /></span>
                <span className="nav-text">
                  <span className="nav-label">{s.label}</span>
                  {s.subtitle && <span className="nav-sub-label">{s.subtitle}</span>}
                </span>
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Icon name="settings" size={14} />
        Cimomet S.A. · v1.0
      </div>
    </div>
  );
};

/* ===== HEADER ===== */
window.Header = function Header({ section, theme, onThemeToggle }) {
  return (
    <div className="header">
      <div className="header-left">
        <div className="breadcrumb">Cimomet &rsaquo; <b>{section.label}</b></div>
        <div className="header-title">{section.label}</div>
      </div>
      <div className="header-right">
        <div className="alert-pill">
          <Icon name="alert" size={13} />
          3 alertas
        </div>
        {onThemeToggle && (
          <button className="theme-btn" onClick={onThemeToggle}
                  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
        )}
        <div className="avatar-sm">CM</div>
      </div>
    </div>
  );
};

/* ===== HUB BUTTON ===== */
window.HubButton = function HubButton({ icon, title, subtitle, onClick, color = 'var(--accent)' }) {
  return (
    <button className="hub-btn" onClick={onClick}>
      <div className="hub-btn-ico" style={{ background: `${color}18`, color }}>
        <Icon name={icon} size={20} />
      </div>
      <div className="hub-btn-body">
        <div className="hub-btn-title">{title}</div>
        {subtitle && <div className="hub-btn-sub">{subtitle}</div>}
      </div>
      <div className="hub-btn-arr"><Icon name="arrowRight" size={16} /></div>
    </button>
  );
};

/* ===== VITAL ===== */
window.Vital = function Vital({ label, value, unit = '%', segments = [], delta, note, sparkData }) {
  return (
    <div className="vital">
      <div className="vital-header">
        <div className="vital-label">{label}</div>
        <div className="vital-pct">
          {value}<sup>{unit}</sup>
        </div>
      </div>
      {segments.length > 0 && (
        <div className="vital-bar-wrap">
          {segments.map((seg, i) => (
            <div key={i} className="vital-bar-seg"
                 style={{ width: `${seg.pct}%`, background: seg.color }} />
          ))}
        </div>
      )}
      {segments.length > 0 && (
        <div className="vital-legend">
          {segments.map((seg, i) => (
            <div key={i} className="vital-legend-item">
              <div className="vital-legend-dot" style={{ background: seg.color }} />
              {seg.label} {seg.pct}%
            </div>
          ))}
        </div>
      )}
      <div className="vital-footer">
        <span className="vital-note">{note}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {delta !== undefined && <Delta value={delta} />}
          {sparkData && <Sparkline data={sparkData} height={28} />}
        </div>
      </div>
    </div>
  );
};

/* ===== CARD WRAPPER ===== */
window.Card = function Card({ title, icon, children, action }) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <div className="card-title">
            {icon && <span className="card-title-icon"><Icon name={icon} size={15} /></span>}
            {title}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

/* ===== FILTER CHIPS ===== */
window.FilterChips = function FilterChips({ options, active, onChange }) {
  return (
    <div className="tbl-filters">
      {options.map(opt => (
        <button key={opt} className={`chip${active === opt ? ' active' : ''}`}
                onClick={() => onChange(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
};

/* ===== PROGRESS BAR ===== */
window.ProgBar = function ProgBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const cls = color ? '' : pct >= 80 ? 'prog-fill-ok' : pct >= 50 ? '' : 'prog-fill-warn';
  return (
    <div className="prog" style={{ minWidth: 70 }}>
      <div className={`prog-fill ${cls}`}
           style={{ width: `${pct}%`, background: color || undefined }} />
    </div>
  );
};

/* ===== CUSTOM SELECT (portal-based, theme-aware) ===== */
window.Select = function Select({ value, onChange, options }) {
  const [open, setOpen]   = _useState2(false);
  const [coord, setCoord] = _useState2(null);
  const btnRef = React.useRef(null);

  const getVal = o => typeof o === 'object' ? o.val : o;
  const getLbl = o => typeof o === 'object' ? o.label : o;

  const current = options.find(o => getVal(o) === value);
  const label   = current ? getLbl(current) : (options[0] ? getLbl(options[0]) : '—');

  const handleToggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoord({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 160) });
    }
    setOpen(o => !o);
  };

  const portal = (open && coord) ? ReactDOM.createPortal(
    <React.Fragment>
      <div onClick={() => setOpen(false)}
           style={{ position:'fixed', inset:0, zIndex:9000 }} />
      <div className="sel-dropdown"
           style={{ position:'fixed', top:coord.top, left:coord.left,
                    width:coord.width, zIndex:9001 }}>
        {options.map((o, i) => (
          <div key={i} className={`sel-opt${getVal(o) === value ? ' active' : ''}`}
               onClick={() => { onChange(getVal(o)); setOpen(false); }}>
            {getLbl(o)}
          </div>
        ))}
      </div>
    </React.Fragment>,
    document.body
  ) : null;

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button ref={btnRef} onClick={handleToggle}
              className={`sel-trigger${open ? ' open' : ''}`}>
        <span>{label}</span>
        <span className="sel-chevron"><Icon name="chevronDown" size={12} /></span>
      </button>
      {portal}
    </div>
  );
};

/* ===== ERROR BOUNDARY ===== */
class _ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <Icon name="alert" size={28} style={{ color:'var(--err)' }} />
          <div className="error-boundary-title">Algo salió mal en esta sección</div>
          <div className="error-boundary-msg">{String(this.state.error)}</div>
          <button onClick={() => this.setState({ error: null })}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
window.ErrorBoundary = _ErrorBoundary;
