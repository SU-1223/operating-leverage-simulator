import { useState, useCallback } from 'react';
import { PRESET_COMPANIES } from '../lib/presetData';

export default function PresetSelector({ onCompanyLoaded, onStatusChange }) {
  const [selectedTicker, setSelectedTicker] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const company = PRESET_COMPANIES.find((c) => c.ticker === selectedTicker);
  const availableYears = company ? Object.keys(company.years).sort((a, b) => b - a) : [];

  const handleTickerChange = useCallback((e) => {
    const ticker = e.target.value;
    setSelectedTicker(ticker);
    const comp = PRESET_COMPANIES.find((c) => c.ticker === ticker);
    if (comp) {
      const years = Object.keys(comp.years).sort((a, b) => b - a);
      setSelectedYear(years[0] || '');
    } else {
      setSelectedYear('');
    }
  }, []);

  const handleYearChange = useCallback((e) => {
    setSelectedYear(e.target.value);
  }, []);

  const handleLoad = useCallback(() => {
    if (!company || !selectedYear) return;
    const yearData = company.years[selectedYear];
    if (!yearData) return;

    const newCompany = {
      name: company.name,
      revenue: yearData.revenue,
      cogs: yearData.cogs,
      rd: yearData.rd,
      sga: yearData.sga,
      deliveries: yearData.deliveries,
      capacity: yearData.capacity || 0,
      cogsFix: company.cogsFix,
      rdFix: company.rdFix,
      sgaFix: company.sgaFix,
    };

    onCompanyLoaded(newCompany);

    const utilization = yearData.capacity > 0
      ? ((yearData.deliveries / yearData.capacity) * 100).toFixed(1)
      : 'N/A';

    let msg = '<strong>' + company.name + '</strong> (FY' + selectedYear + ') loaded from preset data.';
    msg += '<div class="detected-industry">Deliveries: ' + yearData.deliveries.toLocaleString() + ' | Capacity: ' + yearData.capacity.toLocaleString() + ' | Utilization: ' + utilization + '%</div>';
    if (company.note) {
      msg += '<div class="detected-industry" style="color:#dc2626;">' + company.note + '</div>';
    }
    onStatusChange(msg, 'success');
  }, [company, selectedYear, onCompanyLoaded, onStatusChange]);

  return (
    <div className="preset-selector">
      <div className="preset-row">
        <select
          className="preset-select"
          value={selectedTicker}
          onChange={handleTickerChange}
        >
          <option value="">Select a company...</option>
          {PRESET_COMPANIES.map((c) => (
            <option key={c.ticker} value={c.ticker}>
              {c.ticker} — {c.name}
            </option>
          ))}
        </select>
        <select
          className="preset-select preset-year"
          value={selectedYear}
          onChange={handleYearChange}
          disabled={!selectedTicker}
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>FY{y}</option>
          ))}
        </select>
        <button
          className="preset-load-btn"
          onClick={handleLoad}
          disabled={!selectedTicker || !selectedYear}
        >
          Load
        </button>
      </div>
    </div>
  );
}
