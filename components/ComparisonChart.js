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
import { COMPANY_COLORS, METRIC_INFO } from '../lib/constants';
import { calculateScenario, formatCurrency } from '../lib/calculations';

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

  const data = useMemo(() => {
    const labels = companies.map((c) => c.ticker || c.name);
    const values = companies.map((c) => calculateScenario(c, 1)[selectedMetric]);
    const colors = companies.map((_, i) => COMPANY_COLORS[i % COMPANY_COLORS.length]);

    return {
      labels,
      datasets: [
        {
          label: info.label,
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  }, [companies, selectedMetric, info]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => {
            const idx = ctx[0].dataIndex;
            return companies[idx]?.name || ctx[0].label;
          },
          label: (ctx) => info.label + ': ' + formatChartValue(ctx.raw, info.unit),
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { weight: 600 } },
      },
      y: {
        title: { display: true, text: info.yLabel },
        ticks: {
          callback: (v) => formatChartTick(v, info.unit),
        },
      },
    },
  }), [info, companies]);

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
