import { METRICS } from '../lib/constants';
import { formatCurrency, formatPercent } from '../lib/calculations';

function formatValue(value, metric) {
  if (value == null) return '—';
  if (metric.format === 'currency') return formatCurrency(value);
  if (metric.format === 'percent') return formatPercent(value);
  if (metric.format === 'number') return Math.round(value).toLocaleString('en-US');
  if (metric.format === 'dollars') {
    const absVal = Math.abs(value);
    if (absVal >= 1000) {
      return (value < 0 ? '-' : '') + '$' + Math.round(absVal).toLocaleString('en-US');
    }
    return (value < 0 ? '-' : '') + '$' + absVal.toFixed(0);
  }
  return String(value);
}

function getColorClass(value, metric) {
  if (metric.format === 'percent') return value >= 0 ? 'positive' : 'negative';
  if (metric.format === 'currency' && (metric.key === 'opIncome' || metric.key === 'grossProfit')) {
    return value >= 0 ? 'positive' : 'negative';
  }
  if (metric.format === 'dollars' && (metric.key === 'grossProfitPerUnit' || metric.key === 'opIncomePerUnit')) {
    return value >= 0 ? 'positive' : 'negative';
  }
  return '';
}

export default function ResultsTable({ baseScenario, scaledScenario, companyName, scaleValue, maxScale, onScaleChange }) {
  if (!baseScenario || !scaledScenario) return null;

  const scaleLabel = scaleValue.toFixed(2) + 'x';
  const utilizationAtScale = maxScale > 0 ? Math.round((scaleValue / maxScale) * 100) : 0;

  return (
    <section className="section">
      <h2>{companyName ? `Scale Scenario — ${companyName}` : 'Scale Scenario'}</h2>

      <div className="scale-slider-section">
        <div className="scale-slider-header">
          <span className="scale-label">Production Scale</span>
          <span className="scale-value">{scaleLabel} <span className="scale-util">({utilizationAtScale}% of capacity)</span></span>
        </div>
        <input
          type="range"
          className="scale-slider"
          min="1"
          max={maxScale}
          step="0.01"
          value={scaleValue}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
        />
        <div className="scale-slider-labels">
          <span>1x (Current)</span>
          <span>{maxScale.toFixed(2)}x (Full Capacity)</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>1x (Base)</th>
              <th>{scaleLabel}</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              let rowClass = '';
              if (metric.separator) rowClass += ' separator-row';
              if (metric.highlight) rowClass += ' highlight-row';

              if (metric.format === 'header') {
                return (
                  <tr key={metric.key} className={rowClass.trim()}>
                    <td>{metric.label}</td>
                    <td colSpan="3" style={{ textAlign: 'center', fontWeight: 600, color: '#2563eb', fontSize: '13px', letterSpacing: '0.5px' }}></td>
                  </tr>
                );
              }

              const baseVal = baseScenario[metric.key] ?? 0;
              const scaledVal = scaledScenario[metric.key] ?? 0;

              // Calculate change
              let changeStr = '';
              if (metric.format === 'percent') {
                const diff = scaledVal - baseVal;
                changeStr = (diff >= 0 ? '+' : '') + diff.toFixed(1) + 'pp';
              } else if (baseVal !== 0) {
                const pctChange = ((scaledVal - baseVal) / Math.abs(baseVal)) * 100;
                changeStr = (pctChange >= 0 ? '+' : '') + pctChange.toFixed(1) + '%';
              }

              const baseColor = getColorClass(baseVal, metric);
              const scaledColor = getColorClass(scaledVal, metric);
              const changeColor = scaledVal >= baseVal ? 'positive' : 'negative';

              return (
                <tr key={metric.key} className={rowClass.trim()}>
                  <td>{metric.label}</td>
                  <td className={baseColor}>{formatValue(baseVal, metric)}</td>
                  <td className={scaledColor}>{formatValue(scaledVal, metric)}</td>
                  <td className={scaleValue > 1 ? changeColor : ''} style={{ fontSize: '13px' }}>{scaleValue > 1 ? changeStr : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
