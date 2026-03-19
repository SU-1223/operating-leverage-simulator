import { useCallback } from 'react';
import { formatCurrency, formatPercent, formatInputValue } from '../lib/calculations';

export default function FinancialInputs({
  company,
  companies,
  selectedIndex,
  onChange,
  onSelectCompany,
  onAdd,
  onRemove,
  scenario
}) {
  const handleValueChange = useCallback((field, value) => {
    onChange(field, value);
  }, [onChange]);

  const handleBlur = useCallback((field, value) => {
    onChange(field, formatInputValue(value));
  }, [onChange]);

  const incomeClass = scenario ? (scenario.opIncome >= 0 ? 'positive' : 'negative') : '';
  const marginClass = scenario ? (scenario.opMargin >= 0 ? 'positive' : 'negative') : '';

  return (
    <div className="card">
      <h2>Financial Inputs ($M)</h2>

      <div className="input-group">
        <label htmlFor="companySelect">Company</label>
        <div className="company-select-row">
          <select
            id="companySelect"
            className="company-select"
            value={selectedIndex}
            onChange={(e) => onSelectCompany(parseInt(e.target.value))}
          >
            {companies.map((c, i) => (
              <option key={i} value={i}>{c.name}</option>
            ))}
          </select>
          <button className="company-action-btn" onClick={onAdd} title="Add company">+</button>
          <button className="company-action-btn danger" onClick={onRemove} title="Remove company">&times;</button>
        </div>
      </div>

      <InputField label="Revenue" field="revenue" value={company.revenue} prefix="$" suffix="M" onChange={handleValueChange} onBlur={handleBlur} />
      <InputField label="COGS" field="cogs" value={company.cogs} prefix="$" suffix="M" onChange={handleValueChange} onBlur={handleBlur} />
      <InputField label="R&D" field="rd" value={company.rd} prefix="$" suffix="M" onChange={handleValueChange} onBlur={handleBlur} />
      <InputField label="SG&A" field="sga" value={company.sga} prefix="$" suffix="M" onChange={handleValueChange} onBlur={handleBlur} />
      <InputField label="Delivery Volume" field="deliveries" value={company.deliveries} suffix="units" onChange={handleValueChange} onBlur={handleBlur} />

      {scenario && (
        <div className="current-summary">
          <div className="summary-item">
            <div className="summary-label">Operating Income</div>
            <div className={`summary-value ${incomeClass}`}>{formatCurrency(scenario.opIncome)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Operating Margin</div>
            <div className={`summary-value ${marginClass}`}>{formatPercent(scenario.opMargin)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, field, value, prefix, suffix, onChange, onBlur }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="input-wrapper">
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          type="text"
          inputMode="numeric"
          value={typeof value === 'number' ? formatInputValue(value) : value}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={(e) => onBlur(field, e.target.value)}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
    </div>
  );
}
