import { useCallback } from 'react';

export default function CostSliders({ cogsFix, rdFix, sgaFix, onChange }) {
  return (
    <div className="card">
      <h2>Fixed / Variable Cost Split</h2>
      <p className="hint">Fixed costs stay constant as volume scales. Variable costs scale proportionally.</p>

      <SliderRow label="COGS" field="cogsFix" value={cogsFix} onChange={onChange} />
      <SliderRow label="R&D" field="rdFix" value={rdFix} onChange={onChange} />
      <SliderRow label="SG&A" field="sgaFix" value={sgaFix} onChange={onChange} />
    </div>
  );
}

function SliderRow({ label, field, value, onChange }) {
  const handleChange = useCallback((e) => {
    onChange(field, parseInt(e.target.value));
  }, [field, onChange]);

  return (
    <div className="slider-group">
      <label>{label}</label>
      <div className="slider-row">
        <span className="slider-label">Variable: <strong>{100 - value}%</strong></span>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          className="slider"
          onChange={handleChange}
        />
        <span className="slider-label">Fixed: <strong>{value}%</strong></span>
      </div>
    </div>
  );
}
