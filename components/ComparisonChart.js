import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SCALE_MULTIPLIERS, COMPANY_COLORS, METRIC_INFO } from '../lib/constants';
import { calculateScenario, formatCurrency, formatPercent } from '../lib/calculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatChartValue(value, unit) {
  if (unit === 'currency') return formatCurrency(value);
  if (unit === 'percent') return value.toFixed(1) + '%';
  if (unit === 'dollars') {
    const absVal = Math.abs(value);
    return (value < 0 ? '-' : '') + '$' + Math.round(absVal).toLocaleString('en-US');
  }
  return String(value);
}

function formatChartTick(value, unit) {
  if (unit === 'currency') return '$' + value.toLocaleString() + 'M';
  if (unit === 'percent') return value + '%';
  if (unit === 'dollars') return '$' + value.toLocaleString();
  return String(value);
}

export default function ComparisonChart({ companies, selectedMetric, onMetricChange }) {
  const info = METRIC_INFO[selectedMetric];
  const labels = SCALE_MULTIPLIERS.map((s) => s + 'x');

  const data = useMemo(() => {
    const datasets = companies.map((c, i) => {
      const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
      const values = SCALE_MULTIPLIERS.map((scale) => calculateScenario(c, scale)[selectedMetric]);
      return {
        label: c.name,
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
      };
    });
    return { labels, datasets };
  }, [companies, selectedMetric, labels]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.dataset.label + ': ' + formatChartValue(ctx.raw, info.unit),
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: info.yLabel },
        ticks: {
          callback: (v) => formatChartTick(v, info.unit),
        },
      },
    },
  }), [info]);

  return (
    <section className="section">
      <div className="chart-header">
        <h2>Company Comparison</h2>
        <div className="chart-controls">
          <select
            className="metric-select"
            value={selectedMetric}
            onChange={(e) => onMetricChange(e.target.value)}
          >
            <optgroup label="Totals ($M)">
              <option value="revenue">Revenue</option>
              <option value="totalCosts">Total Costs</option>
              <option value="cogs">COGS</option>
              <option value="grossProfit">Gross Profit</option>
              <option value="opIncome">Operating Income</option>
            </optgroup>
            <optgroup label="Margins (%)">
              <option value="grossMargin">Gross Margin</option>
              <option value="opMargin">Operating Margin</option>
              <option value="utilization">Utilization Rate</option>
            </optgroup>
            <optgroup label="Per Unit ($)">
              <option value="revenuePerUnit">Revenue / Unit</option>
              <option value="cogsPerUnit">COGS / Unit</option>
              <option value="grossProfitPerUnit">Gross Profit / Unit</option>
              <option value="totalCostPerUnit">Total Cost / Unit</option>
              <option value="opIncomePerUnit">Op. Income / Unit</option>
            </optgroup>
          </select>
        </div>
      </div>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </section>
  );
}
