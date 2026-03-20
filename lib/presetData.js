// Preset financial data for EV companies (all dollar amounts in $M, volumes in units)
// Sources: 10-K filings, SEC EDGAR, earnings releases, company investor relations
//
// cogsFix per year: derived from D&A included in cost of revenue / total COGS
// (depreciation is a fixed cost regardless of production volume)
// rdFix, sgaFix: industry defaults (R&D and SGA are largely fixed-cost activities)

export const PRESET_COMPANIES = [
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    years: {
      2025: { revenue: 94827, cogs: 77733, rd: 6411, sga: 5834, deliveries: 1636129, capacity: 2350000, cogsFix: 5 },
      2024: { revenue: 97690, cogs: 76642, rd: 4610, sga: 6070, deliveries: 1789226, capacity: 2350000, cogsFix: 5 },
      2023: { revenue: 96773, cogs: 79113, rd: 3969, sga: 4800, deliveries: 1808581, capacity: 2350000, cogsFix: 4 },
    },
    rdFix: 100, sgaFix: 80,
  },
  {
    ticker: 'RIVN',
    name: 'Rivian Automotive, Inc.',
    years: {
      2025: { revenue: 5387, cogs: 5243, rd: 1729, sga: 2000, deliveries: 42247, capacity: 150000, cogsFix: 9 },
      2024: { revenue: 4971, cogs: 5803, rd: 1846, sga: 1014, deliveries: 51579, capacity: 150000, cogsFix: 9 },
      2023: { revenue: 4434, cogs: 6442, rd: 2203, sga: 1109, deliveries: 50122, capacity: 150000, cogsFix: 10 },
    },
    rdFix: 100, sgaFix: 80,
  },
  {
    ticker: 'LCID',
    name: 'Lucid Group, Inc.',
    years: {
      2025: { revenue: 1354, cogs: 2610, rd: 1211, sga: 1034, deliveries: 15841, capacity: 34000, cogsFix: 12 },
      2024: { revenue: 807, cogs: 1673, rd: 788, sga: 536, deliveries: 10241, capacity: 34000, cogsFix: 16 },
      2023: { revenue: 595, cogs: 1578, rd: 886, sga: 569, deliveries: 6001, capacity: 34000, cogsFix: 14 },
    },
    rdFix: 100, sgaFix: 80,
  },
];

// Load a preset company for a given year
export function loadPresetYear(preset, year) {
  const yearData = preset.years[year];
  if (!yearData) return null;
  return {
    name: preset.name,
    ticker: preset.ticker,
    note: preset.note || null,
    revenue: yearData.revenue,
    cogs: yearData.cogs,
    rd: yearData.rd,
    sga: yearData.sga,
    deliveries: yearData.deliveries,
    capacity: yearData.capacity,
    cogsFix: yearData.cogsFix,
    rdFix: preset.rdFix,
    sgaFix: preset.sgaFix,
    availableYears: Object.keys(preset.years).sort((a, b) => b - a),
    selectedYear: String(year),
  };
}

// Initialize all preset companies with their latest year
export function getInitialCompanies() {
  return PRESET_COMPANIES.map((p) => {
    const latestYear = Object.keys(p.years).sort((a, b) => b - a)[0];
    return loadPresetYear(p, latestYear);
  });
}
