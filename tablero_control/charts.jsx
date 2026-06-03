// charts.jsx — Sparkline, AreaChart, DonutChart (SVG puro, sin librerías)

const { useMemo: _useMemo } = React;

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
  color = '#e0218a', unit = '', showDots = true
}) {
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
              {unit ? `${v}${unit}` : v}
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

      {/* X axis labels */}
      {labels.map((lbl, i) => {
        // show every other label if too many
        if (labels.length > 8 && i % 2 !== 0) return null;
        return (
          <text key={i} x={px(i)} y={VH - 4} textAnchor="middle"
                fill="#7c7589" fontSize="11" fontFamily="DM Sans, sans-serif">
            {lbl}
          </text>
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
