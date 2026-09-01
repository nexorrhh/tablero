// charts.jsx — Sparkline, AreaChart, DonutChart (SVG puro, sin librerías)

const { useMemo: _useMemo, useState: _useState } = React;

/* ===== SPARKLINE ===== */
window.Sparkline = function Sparkline({ data = [], width = 80, height = 30, color = '#e0218a', strokeWidth = 1.75 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

/* ===== AREA CHART ===== */
window.AreaChart = function AreaChart({
  data = [], labels = [], height = 200, objetivo = null,
  color = '#e0218a', unit = '', showDots = true, maxLabels = 6, seriesLabel = '', fmt = v => v
}) {
  const [tooltip, setTooltip] = _useState(null);
  const VW = 600, VH = height;
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const W = VW - PAD.left - PAD.right;
  const H = VH - PAD.top - PAD.bottom;

  if (!data.length) return null;

  const allVals = objetivo ? [...data, objetivo] : [...data];
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  const pad = (dataMax - dataMin) * 0.1 || 10;
  const yMin = Math.max(0, dataMin - pad);
  const yMax = dataMax + pad;
  const yRange = yMax - yMin || 1;

  const px = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * W;
  const py = (v) => PAD.top + H - ((v - yMin) / yRange) * H;

  const linePts = data.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const areaD = data.length > 1
    ? `M ${px(0).toFixed(1)},${py(data[0]).toFixed(1)} ` +
      data.slice(1).map((v, i) => `L ${px(i+1).toFixed(1)},${py(v).toFixed(1)}`).join(' ') +
      ` L ${px(data.length-1).toFixed(1)},${(PAD.top+H).toFixed(1)} L ${px(0).toFixed(1)},${(PAD.top+H).toFixed(1)} Z`
    : '';

  const gradId = `ag_${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Y axis labels (3 ticks)
  const yTicks = [yMin, (yMin + yMax) / 2, yMax].map(v => Math.round(v));

  return (
    <>
    <svg width="100%" height={VH} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="85%" stopColor={color} stopOpacity="0.03" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y axis ticks */}
      {yTicks.map((v, i) => {
        const y = py(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + W} y2={y}
                  stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                  fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">
              {unit ? `${fmt(v)}${unit}` : fmt(v)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      {areaD && <path d={areaD} fill={`url(#${gradId})`} />}

      {/* Line */}
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round" />

      {/* Objetivo line */}
      {objetivo && (
        <g>
          <line x1={PAD.left} y1={py(objetivo)} x2={PAD.left + W} y2={py(objetivo)}
                stroke="#7c7589" strokeWidth="1.5" strokeDasharray="5,4" />
          <text x={PAD.left + W - 4} y={py(objetivo) - 5} textAnchor="end"
                fill="#7c7589" fontSize="10" fontFamily="DM Sans, sans-serif">
            Obj. {objetivo}{unit}
          </text>
        </g>
      )}

      {/* Dots */}
      {showDots && data.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r="3.5"
                fill={color} stroke="#0b090d" strokeWidth="2" />
      ))}

      {/* Punto resaltado al pasar el mouse */}
      {tooltip && (
        <circle cx={px(tooltip.idx)} cy={py(data[tooltip.idx])} r="6.5"
                fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      )}

      {/* X axis labels */}
      {labels.map((lbl, i) => {
        // show at most 6 evenly-spaced labels + always show the last one
        const skip = Math.max(1, Math.ceil(labels.length / maxLabels));
        const isLast = i === labels.length - 1;
        if (!isLast && i % skip !== 0) return null;
        return (
          <text key={i} x={px(i)} y={VH - 4} textAnchor="middle"
                fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">
            {lbl}
          </text>
        );
      })}

      {/* Áreas invisibles para detectar el hover por punto */}
      {data.map((v, i) => {
        const cx = px(i);
        const xStart = i === 0 ? PAD.left : (px(i - 1) + cx) / 2;
        const xEnd   = i === data.length - 1 ? PAD.left + W : (cx + px(i + 1)) / 2;
        return (
          <rect key={`hit${i}`} x={xStart} y={PAD.top} width={Math.max(0, xEnd - xStart)} height={H}
                fill="transparent"
                onMouseMove={e => setTooltip({ idx: i, clientX: e.clientX, clientY: e.clientY })}
                onMouseLeave={() => setTooltip(null)} />
        );
      })}
    </svg>

    {tooltip && ReactDOM.createPortal(
      <div style={{
        position:'fixed', left:tooltip.clientX + 14, top:Math.max(8, tooltip.clientY - 46),
        background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:8,
        padding:'8px 12px', fontSize:12, pointerEvents:'none', zIndex:9999,
        boxShadow:'0 6px 24px rgba(0,0,0,0.28)', whiteSpace:'nowrap', lineHeight:1.5,
      }}>
        <div style={{ fontWeight:700, color:'var(--t1)' }}>{labels[tooltip.idx]}</div>
        <div style={{ color:'var(--t2)' }}>
          {seriesLabel ? `${seriesLabel}: ` : ''}<b style={{ color:'var(--t1)' }}>{fmt(data[tooltip.idx])}{unit}</b>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

/* ===== GROUPED BAR CHART (series lado a lado) ===== */
window.GroupedBarChart = function GroupedBarChart({ categories = [], series = [], height = 200, unit = '', maxLabels = 6, fmt = v => v }) {
  const [tooltip, setTooltip] = _useState(null);
  const VW = 600, VH = height;
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const W = VW - PAD.left - PAD.right;
  const H = VH - PAD.top - PAD.bottom;
  if (!categories.length || !series.length) return null;

  const maxVal = Math.max(...series.flatMap(s => s.data), 1);
  const yMax = maxVal * 1.1;
  const n = categories.length;
  const groupW = W / n;
  const barGap = 2;
  const barW = Math.max(2, (groupW * 0.7 - barGap * (series.length - 1)) / series.length);
  const groupPad = (groupW - (barW * series.length + barGap * (series.length - 1))) / 2;
  const py = v => PAD.top + H - (v / yMax) * H;
  const yTicks = [0, yMax / 2, yMax].map(v => Math.round(v));
  const skip = Math.max(1, Math.ceil(n / maxLabels));

  return (
    <>
    <svg width="100%" height={VH} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
      {yTicks.map((v, i) => {
        const y = py(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + W} y2={y} stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">
              {fmt(v)}{unit}
            </text>
          </g>
        );
      })}
      {categories.map((cat, ci) => {
        const gx = PAD.left + ci * groupW + groupPad;
        const isLast = ci === n - 1;
        return (
          <g key={ci}>
            {tooltip?.idx === ci && (
              <rect x={PAD.left + ci * groupW} y={PAD.top} width={groupW} height={H} fill="rgba(255,255,255,0.045)" />
            )}
            {series.map((s, si) => {
              const val = s.data[ci] || 0;
              const bh = (val / yMax) * H;
              const bx = gx + si * (barW + barGap);
              const by = PAD.top + H - bh;
              return bh > 0 ? <rect key={si} x={bx} y={by} width={barW} height={bh} fill={s.color} rx="2" /> : null;
            })}
            {(isLast || ci % skip === 0) && (
              <text x={PAD.left + ci * groupW + groupW / 2} y={VH - 4} textAnchor="middle"
                    fill="#7c7589" fontSize="10" fontFamily="DM Sans, sans-serif">
                {cat}
              </text>
            )}
            <rect x={PAD.left + ci * groupW} y={PAD.top} width={groupW} height={H} fill="transparent"
                  onMouseMove={e => setTooltip({ idx: ci, clientX: e.clientX, clientY: e.clientY })}
                  onMouseLeave={() => setTooltip(null)} />
          </g>
        );
      })}
    </svg>

    {tooltip && ReactDOM.createPortal(
      <div style={{
        position:'fixed', left:tooltip.clientX + 14, top:Math.max(8, tooltip.clientY - 20 - series.length * 18),
        background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:8,
        padding:'8px 12px', fontSize:12, pointerEvents:'none', zIndex:9999,
        boxShadow:'0 6px 24px rgba(0,0,0,0.28)', whiteSpace:'nowrap', lineHeight:1.6,
      }}>
        <div style={{ fontWeight:700, color:'var(--t1)', marginBottom:2 }}>{categories[tooltip.idx]}</div>
        {series.map((s, si) => (
          <div key={si} style={{ display:'flex', alignItems:'center', gap:6, color:'var(--t2)' }}>
            <span style={{ width:8, height:8, borderRadius:2, background:s.color, display:'inline-block', flexShrink:0 }} />
            {s.label}: <b style={{ color:'var(--t1)' }}>{fmt(s.data[tooltip.idx] || 0)}{unit}</b>
          </div>
        ))}
      </div>,
      document.body
    )}
    </>
  );
};

/* ===== STACKED BAR CHART ===== */
window.StackedBarChart = function StackedBarChart({ categories = [], series = [], height = 200, unit = '', maxLabels = 6 }) {
  const [tooltip, setTooltip] = _useState(null);
  const VW = 600, VH = height;
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const W = VW - PAD.left - PAD.right;
  const H = VH - PAD.top - PAD.bottom;
  if (!categories.length || !series.length) return null;

  const totals = categories.map((_, ci) => series.reduce((s, ser) => s + (ser.data[ci] || 0), 0));
  const maxVal = Math.max(...totals, 1);
  const yMax = maxVal * 1.15;
  const n = categories.length;
  const groupW = W / n;
  const barW = groupW * 0.55;
  const py = v => PAD.top + H - (v / yMax) * H;
  const yTicks = [0, yMax / 2, yMax].map(v => Math.round(v));
  const skip = Math.max(1, Math.ceil(n / maxLabels));

  return (
    <>
    <svg width="100%" height={VH} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
      {yTicks.map((v, i) => {
        const y = py(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + W} y2={y} stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">
              {unit ? `${v}${unit}` : v}
            </text>
          </g>
        );
      })}
      {categories.map((cat, ci) => {
        const bx = PAD.left + ci * groupW + (groupW - barW) / 2;
        const isLast = ci === n - 1;
        let cum = 0;
        return (
          <g key={ci}>
            {tooltip?.idx === ci && (
              <rect x={PAD.left + ci * groupW} y={PAD.top} width={groupW} height={H} fill="rgba(255,255,255,0.045)" />
            )}
            {series.map((s, si) => {
              const val = s.data[ci] || 0;
              const h = (val / yMax) * H;
              const y = PAD.top + H - ((cum + val) / yMax) * H;
              cum += val;
              return h > 0 ? <rect key={si} x={bx} y={y} width={barW} height={h} fill={s.color} rx="2" /> : null;
            })}
            {(isLast || ci % skip === 0) && (
              <text x={PAD.left + ci * groupW + groupW / 2} y={VH - 4} textAnchor="middle"
                    fill="#7c7589" fontSize="10" fontFamily="DM Sans, sans-serif">
                {cat}
              </text>
            )}
            <rect x={PAD.left + ci * groupW} y={PAD.top} width={groupW} height={H} fill="transparent"
                  onMouseMove={e => setTooltip({ idx: ci, clientX: e.clientX, clientY: e.clientY })}
                  onMouseLeave={() => setTooltip(null)} />
          </g>
        );
      })}
    </svg>

    {tooltip && ReactDOM.createPortal(
      <div style={{
        position:'fixed', left:tooltip.clientX + 14, top:Math.max(8, tooltip.clientY - 20 - series.length * 18),
        background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:8,
        padding:'8px 12px', fontSize:12, pointerEvents:'none', zIndex:9999,
        boxShadow:'0 6px 24px rgba(0,0,0,0.28)', whiteSpace:'nowrap', lineHeight:1.6,
      }}>
        <div style={{ fontWeight:700, color:'var(--t1)', marginBottom:2 }}>{categories[tooltip.idx]}</div>
        {series.map((s, si) => (
          <div key={si} style={{ display:'flex', alignItems:'center', gap:6, color:'var(--t2)' }}>
            <span style={{ width:8, height:8, borderRadius:2, background:s.color, display:'inline-block', flexShrink:0 }} />
            {s.label}: <b style={{ color:'var(--t1)' }}>{s.data[tooltip.idx] || 0}{unit}</b>
          </div>
        ))}
      </div>,
      document.body
    )}
    </>
  );
};

/* ===== DUAL AXIS CHART (barras + línea con escala propia) ===== */
window.DualAxisChart = function DualAxisChart({ categories = [], bar, line, height = 200, maxLabels = 6 }) {
  const [tooltip, setTooltip] = _useState(null);
  const VW = 600, VH = height;
  const PAD = { top: 16, right: 40, bottom: 28, left: 44 };
  const W = VW - PAD.left - PAD.right;
  const H = VH - PAD.top - PAD.bottom;
  if (!categories.length) return null;

  const n = categories.length;
  const groupW = W / n;
  const barW = groupW * 0.5;
  const maxBar  = Math.max(...bar.data, 1) * 1.15;
  const maxLine = Math.max(...line.data, 1) * 1.25;
  const pyBar  = v => PAD.top + H - (v / maxBar) * H;
  const pyLine = v => PAD.top + H - (v / maxLine) * H;
  const px = i => PAD.left + i * groupW + groupW / 2;
  const linePts = line.data.map((v, i) => `${px(i).toFixed(1)},${pyLine(v).toFixed(1)}`).join(' ');
  const yTicksBar  = [0, maxBar / 2, maxBar].map(v => Math.round(v));
  const yTicksLine = [0, maxLine / 2, maxLine].map(v => +v.toFixed(1));
  const skip = Math.max(1, Math.ceil(n / maxLabels));

  return (
    <>
    <svg width="100%" height={VH} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
      {yTicksBar.map((v, i) => {
        const y = pyBar(v);
        return (
          <g key={`b${i}`}>
            <line x1={PAD.left} y1={y} x2={PAD.left + W} y2={y} stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">{v}</text>
          </g>
        );
      })}
      {yTicksLine.map((v, i) => (
        <text key={`l${i}`} x={PAD.left + W + 6} y={pyLine(v) + 4} textAnchor="start"
              fill={line.color} fontSize="11" fontFamily="DM Sans, sans-serif">
          {v}{line.unit || ''}
        </text>
      ))}
      {categories.map((cat, ci) => {
        const val = bar.data[ci] || 0;
        const bh = (val / maxBar) * H;
        const bx = px(ci) - barW / 2;
        const by = PAD.top + H - bh;
        const isLast = ci === n - 1;
        return (
          <g key={ci}>
            {tooltip?.idx === ci && (
              <rect x={PAD.left + ci * groupW} y={PAD.top} width={groupW} height={H} fill="rgba(255,255,255,0.045)" />
            )}
            {bh > 0 && <rect x={bx} y={by} width={barW} height={bh} fill={bar.color} rx="2" />}
            {(isLast || ci % skip === 0) && (
              <text x={px(ci)} y={VH - 4} textAnchor="middle" fill="#7c7589" fontSize="10" fontFamily="DM Sans, sans-serif">{cat}</text>
            )}
            <rect x={PAD.left + ci * groupW} y={PAD.top} width={groupW} height={H} fill="transparent"
                  onMouseMove={e => setTooltip({ idx: ci, clientX: e.clientX, clientY: e.clientY })}
                  onMouseLeave={() => setTooltip(null)} />
          </g>
        );
      })}
      <polyline points={linePts} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {line.data.map((v, i) => (
        <circle key={i} cx={px(i)} cy={pyLine(v)} r="3.5" fill={line.color} stroke="#0b090d" strokeWidth="2" />
      ))}
    </svg>

    {tooltip && ReactDOM.createPortal(
      <div style={{
        position:'fixed', left:tooltip.clientX + 14, top:Math.max(8, tooltip.clientY - 56),
        background:'var(--sf1)', border:'1px solid var(--bd)', borderRadius:8,
        padding:'8px 12px', fontSize:12, pointerEvents:'none', zIndex:9999,
        boxShadow:'0 6px 24px rgba(0,0,0,0.28)', whiteSpace:'nowrap', lineHeight:1.6,
      }}>
        <div style={{ fontWeight:700, color:'var(--t1)', marginBottom:2 }}>{categories[tooltip.idx]}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--t2)' }}>
          <span style={{ width:8, height:8, borderRadius:2, background:bar.color, display:'inline-block', flexShrink:0 }} />
          {bar.label}: <b style={{ color:'var(--t1)' }}>{bar.data[tooltip.idx] || 0}</b>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--t2)' }}>
          <span style={{ width:8, height:8, borderRadius:2, background:line.color, display:'inline-block', flexShrink:0 }} />
          {line.label}: <b style={{ color:'var(--t1)' }}>{line.data[tooltip.idx]}{line.unit || ''}</b>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

/* ===== HORIZONTAL BAR CHART (ranking, ej. por sector) ===== */
window.HorizontalBarChart = function HorizontalBarChart({ rows = [], unit = '', min = 0, max = null, rowHeight = 26, fmt = v => v }) {
  const VW = 600;
  const PAD = { top: 6, right: 54, bottom: 6, left: 130 };
  const W = VW - PAD.left - PAD.right;
  if (!rows.length) return null;
  const maxVal = max ?? Math.max(...rows.map(r => r.value), 1);
  const range = (maxVal - min) || 1;
  const VH = PAD.top + PAD.bottom + rows.length * rowHeight;
  const px = v => Math.max(0, ((v - min) / range) * W);

  return (
    <svg width="100%" height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{ display:'block' }}>
      {rows.map((r, i) => {
        const y = PAD.top + i * rowHeight;
        const barW = px(r.value);
        return (
          <g key={i}>
            <text x={PAD.left - 8} y={y + rowHeight / 2 + 4} textAnchor="end"
                  fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">
              {r.label}
            </text>
            <rect x={PAD.left} y={y + 5} width={W} height={rowHeight - 10} fill="rgba(255,255,255,0.045)" rx="3" />
            <rect x={PAD.left} y={y + 5} width={barW} height={rowHeight - 10} fill={r.color} rx="3" />
            <text x={PAD.left + barW + 6} y={y + rowHeight / 2 + 4}
                  fill="#f5f2f7" fontSize="11" fontFamily="DM Sans, sans-serif">
              {fmt(r.value)}{unit}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ===== DONUT CHART ===== */
window.DonutChart = function DonutChart({ segments = [], size = 180, thickness = 28, centerLabel = '' }) {
  const total = segments.reduce((s, seg) => s + (seg.valor || 0), 0) || 1;
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness * 2) / 2;
  const gap = 0.03; // gap in radians between segments

  let currentAngle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const fraction = seg.valor / total;
    const angle = fraction * 2 * Math.PI - gap;
    const startAngle = currentAngle + gap / 2;
    const endAngle = startAngle + angle;
    currentAngle = startAngle + angle + gap / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    return {
      ...seg,
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {/* Segments */}
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill="none"
              stroke={arc.color} strokeWidth={thickness}
              strokeLinecap="butt" />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle"
            fill="#f5f2f7" fontSize={size * 0.175}
            fontFamily="DM Serif Display, serif" fontWeight="400">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
            fill="#7c7589" fontSize="12"
            fontFamily="DM Sans, sans-serif">
        {centerLabel || 'total'}
      </text>
    </svg>
  );
};
