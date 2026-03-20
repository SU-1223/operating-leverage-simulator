// Preset financial data for EV companies (all dollar amounts in $M, volumes in units)
// Sources: 10-K filings, SEC EDGAR, earnings releases, company investor relations

export const PRESET_COMPANIES = [
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    years: {
      2025: { revenue: 94827, cogs: 77733, rd: 6411, sga: 5834, deliveries: 1636129, capacity: 2350000 },
      2024: { revenue: 97690, cogs: 76642, rd: 4610, sga: 6070, deliveries: 1789226, capacity: 2350000 },
      2023: { revenue: 96773, cogs: 79113, rd: 3969, sga: 4800, deliveries: 1808581, capacity: 2350000 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'RIVN',
    name: 'Rivian Automotive, Inc.',
    years: {
      2025: { revenue: 5387, cogs: 5243, rd: 1729, sga: 2000, deliveries: 42247, capacity: 150000 },
      2024: { revenue: 4971, cogs: 5803, rd: 1846, sga: 1014, deliveries: 51579, capacity: 150000 },
      2023: { revenue: 4434, cogs: 6442, rd: 2203, sga: 1109, deliveries: 50122, capacity: 150000 },
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'LCID',
    name: 'Lucid Group, Inc.',
    years: {
      2025: { revenue: 1354, cogs: 2610, rd: 1211, sga: 1034, deliveries: 15841, capacity: 34000 },
      2024: { revenue: 807, cogs: 1673, rd: 788, sga: 536, deliveries: 10241, capacity: 34000 },
      2023: { revenue: 595, cogs: 1578, rd: 886, sga: 569, deliveries: 6001, capacity: 34000 },
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
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
  {
    ticker: 'WKHS',
    name: 'Workhorse Group, Inc.',
    note: 'Pursuing merger with Motiv Electric; severe financial distress',
    years: {
      2024: { revenue: 3, cogs: 20, rd: 12, sga: 28, deliveries: 30, capacity: 5000 },
      2023: { revenue: 9, cogs: 37, rd: 19, sga: 36, deliveries: 75, capacity: 5000 },
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
    },
    cogsFix: 30, rdFix: 80, sgaFix: 45,
  },
];
