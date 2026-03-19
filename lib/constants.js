export const SCALE_MULTIPLIERS = [1, 2, 4, 10];

export const METRICS = [
  { key: 'revenue', label: 'Revenue', format: 'currency' },
  { key: 'cogs', label: 'COGS', format: 'currency' },
  { key: 'grossProfit', label: 'Gross Profit', format: 'currency', separator: true },
  { key: 'grossMargin', label: 'Gross Margin', format: 'percent' },
  { key: 'rd', label: 'R&D', format: 'currency' },
  { key: 'sga', label: 'SG&A', format: 'currency' },
  { key: 'opIncome', label: 'Operating Income', format: 'currency', separator: true },
  { key: 'opMargin', label: 'Operating Margin', format: 'percent', highlight: true },
  { key: 'perUnitHeader', label: 'Per Unit Economics', format: 'header', separator: true },
  { key: 'deliveries', label: 'Delivery Volume', format: 'number' },
  { key: 'revenuePerUnit', label: 'Revenue / Unit', format: 'dollars' },
  { key: 'cogsPerUnit', label: 'COGS / Unit', format: 'dollars' },
  { key: 'grossProfitPerUnit', label: 'Gross Profit / Unit', format: 'dollars' },
  { key: 'totalCostPerUnit', label: 'Total Cost / Unit', format: 'dollars' },
  { key: 'opIncomePerUnit', label: 'Op. Income / Unit', format: 'dollars', highlight: true }
];

export const METRIC_INFO = {
  revenue:           { label: 'Revenue',            unit: 'currency', yLabel: 'Amount ($M)' },
  totalCosts:        { label: 'Total Costs',        unit: 'currency', yLabel: 'Amount ($M)' },
  cogs:              { label: 'COGS',               unit: 'currency', yLabel: 'Amount ($M)' },
  grossProfit:       { label: 'Gross Profit',       unit: 'currency', yLabel: 'Amount ($M)' },
  opIncome:          { label: 'Operating Income',   unit: 'currency', yLabel: 'Amount ($M)' },
  grossMargin:       { label: 'Gross Margin',       unit: 'percent',  yLabel: 'Margin (%)' },
  opMargin:          { label: 'Operating Margin',   unit: 'percent',  yLabel: 'Margin (%)' },
  revenuePerUnit:    { label: 'Revenue / Unit',     unit: 'dollars',  yLabel: 'Per Unit ($)' },
  cogsPerUnit:       { label: 'COGS / Unit',        unit: 'dollars',  yLabel: 'Per Unit ($)' },
  grossProfitPerUnit:{ label: 'Gross Profit / Unit',unit: 'dollars',  yLabel: 'Per Unit ($)' },
  totalCostPerUnit:  { label: 'Total Cost / Unit',  unit: 'dollars',  yLabel: 'Per Unit ($)' },
  opIncomePerUnit:   { label: 'Op. Income / Unit',  unit: 'dollars',  yLabel: 'Per Unit ($)' }
};

export const INDUSTRY_PROFILES = {
  software: {
    keywords: ['software', 'saas', 'subscription', 'cloud computing', 'platform', 'digital', 'license revenue', 'recurring revenue'],
    cogsFix: 75, rdFix: 85, sgaFix: 55, label: 'Software / SaaS'
  },
  tech_hardware: {
    keywords: ['semiconductor', 'chip', 'hardware', 'device', 'consumer electronics', 'iphone', 'mac'],
    cogsFix: 35, rdFix: 85, sgaFix: 50, label: 'Technology Hardware'
  },
  automotive: {
    keywords: ['vehicle', 'automotive', 'car', 'truck', 'electric vehicle', 'ev', 'deliveries', 'automobile', 'motor'],
    cogsFix: 30, rdFix: 80, sgaFix: 45, label: 'Automotive / Manufacturing'
  },
  pharma: {
    keywords: ['pharmaceutical', 'drug', 'clinical trial', 'fda', 'therapeutic', 'biotech', 'biologic', 'pipeline'],
    cogsFix: 60, rdFix: 90, sgaFix: 50, label: 'Pharmaceuticals / Biotech'
  },
  retail: {
    keywords: ['retail', 'store', 'merchandise', 'e-commerce', 'fulfillment', 'inventory', 'same-store'],
    cogsFix: 15, rdFix: 70, sgaFix: 40, label: 'Retail / E-Commerce'
  },
  media: {
    keywords: ['streaming', 'content', 'subscriber', 'advertising', 'media', 'entertainment', 'original programming'],
    cogsFix: 65, rdFix: 80, sgaFix: 50, label: 'Media / Streaming'
  },
  financial: {
    keywords: ['interest income', 'loan', 'deposit', 'banking', 'insurance', 'asset management', 'financial services'],
    cogsFix: 60, rdFix: 75, sgaFix: 55, label: 'Financial Services'
  },
  energy: {
    keywords: ['oil', 'gas', 'energy', 'exploration', 'drilling', 'refining', 'barrel', 'natural gas', 'renewable'],
    cogsFix: 40, rdFix: 75, sgaFix: 45, label: 'Energy'
  },
  default: {
    keywords: [], cogsFix: 40, rdFix: 75, sgaFix: 45, label: 'General Industry'
  }
};

export const COMPANY_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#be185d', '#4d7c0f', '#9333ea', '#ea580c'
];

export const DEFAULT_COMPANY = {
  name: 'Company 1',
  revenue: 1000, cogs: 800, rd: 150, sga: 100,
  cogsFix: 30, rdFix: 80, sgaFix: 50, deliveries: 50000
};
