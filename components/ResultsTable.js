import { METRICS } from '../lib/constants';
import { formatCurrency, formatPercent } from '../lib/calculations';

export default function ResultsTable({ scenarios, companyName }) {
  return (
    <section className="section">
      <h2>{companyName ? `Scale Scenarios — ${companyName}` : 'Scale Scenarios'}</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>1x (Base)</th>
              <th>2x</th>
              <th>4x</th>
              <th>10x</th>
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
                    <td colSpan="4" style={{ textAlign: 'center', fontWeight: 600, color: '#2563eb', fontSize: '13px', letterSpacing: '0.5px' }}></td>
                  </tr>
                );
              }

              return (
                <tr key={metric.key} className={rowClass.trim()}>
                  <td>{metric.label}</td>
                  {scenarios.map((s, i) => {
                    const value = s[metric.key] ?? 0;
                    let formatted;
                    let colorClass = '';

                    if (metric.format === 'currency') {
                      formatted = formatCurrency(value);
                      if (metric.key === 'opIncome' || metric.key === 'grossProfit') {
                        colorClass = value >= 0 ? 'positive' : 'negative';
                      }
                    } else if (metric.format === 'percent') {
                      formatted = formatPercent(value);
                      colorClass = value >= 0 ? 'positive' : 'negative';
                    } else if (metric.format === 'number') {
                      formatted = Math.round(value).toLocaleString('en-US');
                    } else if (metric.format === 'dollars') {
                      const absVal = Math.abs(value);
                      if (absVal >= 1000) {
                        formatted = (value < 0 ? '-' : '') + '$' + Math.round(absVal).toLocaleString('en-US');
                      } else {
                        formatted = (value < 0 ? '-' : '') + '$' + absVal.toFixed(0);
                      }
                      if (metric.key === 'grossProfitPerUnit' || metric.key === 'opIncomePerUnit') {
                        colorClass = value >= 0 ? 'positive' : 'negative';
                      }
                    } else {
                      formatted = String(value);
                    }

                    return <td key={i} className={colorClass}>{formatted}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
