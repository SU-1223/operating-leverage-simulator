// Preset financial data for EV companies (all dollar amounts in $M, volumes in units)
// Sources: 10-K filings, SEC EDGAR, earnings releases

export const PRESET_COMPANIES = [
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    years: {
      2024: { revenue: 97690, cogs: 76642, rd: 4610, sga: 6070, deliveries: 1789226, capacity: 2350000 },
      2023: { revenue: 96773, cogs: 79113, rd: 3969, sga: 4800, deliveries: 1808581, capacity: 2350000 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'RIVN',
    name: 'Rivian Automotive, Inc.',
    years: {
      2024: { revenue: 4971, cogs: 5803, rd: 1846, sga: 1014, deliveries: 51579, capacity: 150000 },
      2023: { revenue: 4434, cogs: 6442, rd: 2203, sga: 1109, deliveries: 50122, capacity: 150000 },
      2022: { revenue: 1658, cogs: 4734, rd: 1951, sga: 913, deliveries: 20332, capacity: 150000 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'LCID',
    name: 'Lucid Group, Inc.',
    years: {
      2024: { revenue: 807, cogs: 1673, rd: 788, sga: 536, deliveries: 10241, capacity: 34000 },
      2023: { revenue: 595, cogs: 1578, rd: 886, sga: 569, deliveries: 6001, capacity: 34000 },
      2022: { revenue: 608, cogs: 1637, rd: 1105, sga: 547, deliveries: 4369, capacity: 34000 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'NKLA',
    name: 'Nikola Corporation',
    note: 'Filed Chapter 11 bankruptcy Sept 2024',
    years: {
      2024: { revenue: 62, cogs: 110, rd: 68, sga: 92, deliveries: 200, capacity: 2500 },
      2023: { revenue: 36, cogs: 158, rd: 215, sga: 181, deliveries: 79, capacity: 2500 },
      2022: { revenue: 50, cogs: 234, rd: 271, sga: 206, deliveries: 131, capacity: 2500 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'WKHS',
    name: 'Workhorse Group, Inc.',
    years: {
      2024: { revenue: 3, cogs: 20, rd: 12, sga: 28, deliveries: 30, capacity: 5000 },
      2023: { revenue: 9, cogs: 37, rd: 19, sga: 36, deliveries: 75, capacity: 5000 },
      2022: { revenue: 4, cogs: 28, rd: 29, sga: 47, deliveries: 36, capacity: 1000 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'GOEV',
    name: 'Canoo Inc.',
    note: 'Filed Chapter 7 bankruptcy Feb 2025',
    years: {
      2024: { revenue: 1, cogs: 10, rd: 40, sga: 50, deliveries: 70, capacity: 3300 },
      2023: { revenue: 1, cogs: 9, rd: 105, sga: 100, deliveries: 22, capacity: 3300 },
      2022: { revenue: 0, cogs: 0, rd: 198, sga: 135, deliveries: 0, capacity: 0 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
];
