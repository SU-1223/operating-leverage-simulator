export function formatNumber(num) {
  return Math.abs(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatCurrency(num) {
  if (num < 0) return '-$' + formatNumber(num) + 'M';
  return '$' + formatNumber(num) + 'M';
}

export function formatPercent(num) {
  return num.toFixed(1) + '%';
}

export function formatInputValue(value) {
  const num = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function parseInputValue(str) {
  return parseFloat(String(str).replace(/[^0-9.\-]/g, '')) || 0;
}

export function scaleCost(baseCost, fixedPct, scale) {
  const fixed = baseCost * (fixedPct / 100);
  const variable = baseCost * (1 - fixedPct / 100);
  return fixed + variable * scale;
}

export function calculateScenario(inputs, scale) {
  const revenue = inputs.revenue * scale;
  const cogs = scaleCost(inputs.cogs, inputs.cogsFix, scale);
  const rd = scaleCost(inputs.rd, inputs.rdFix, scale);
  const sga = scaleCost(inputs.sga, inputs.sgaFix, scale);
  const grossProfit = revenue - cogs;
  const grossMargin = revenue === 0 ? 0 : (grossProfit / revenue) * 100;
  const opIncome = revenue - cogs - rd - sga;
  const opMargin = revenue === 0 ? 0 : (opIncome / revenue) * 100;
  const totalCosts = cogs + rd + sga;
  const deliveries = inputs.deliveries * scale;

  return {
    revenue, cogs,
    grossProfit, grossMargin,
    rd, sga,
    opIncome, opMargin,
    totalCosts, deliveries,
    revenuePerUnit: deliveries > 0 ? (revenue / deliveries) * 1000000 : 0,
    cogsPerUnit: deliveries > 0 ? (cogs / deliveries) * 1000000 : 0,
    grossProfitPerUnit: deliveries > 0 ? (grossProfit / deliveries) * 1000000 : 0,
    totalCostPerUnit: deliveries > 0 ? (totalCosts / deliveries) * 1000000 : 0,
    opIncomePerUnit: deliveries > 0 ? (opIncome / deliveries) * 1000000 : 0
  };
}
