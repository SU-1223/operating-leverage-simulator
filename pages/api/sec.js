// SEC EDGAR API proxy — uses data.sec.gov (not blocked by SEC)
//
// Endpoints:
//   GET /api/sec?action=filings&cik=0001318605 — get 10-K filing list
//   GET /api/sec?action=facts&cik=0001318605    — get XBRL financial facts

const SEC_USER_AGENT = 'OperatingLeverageSimulator/1.0 (columbia-business-school@edu)';

async function fetchSEC(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': SEC_USER_AGENT,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`SEC API returned ${res.status}: ${res.statusText}`);
  }
  return res;
}

// Extract the most recent 10-K value for a given XBRL concept
function getLatest10KValue(factData) {
  if (!factData?.units) return null;
  // Try USD first, then other units
  const units = factData.units.USD || factData.units.shares || Object.values(factData.units)[0];
  if (!units) return null;

  // Filter to 10-K filings and get the most recent
  const annual = units
    .filter((d) => d.form === '10-K' && d.val !== undefined)
    .sort((a, b) => (b.end || '').localeCompare(a.end || ''));

  return annual.length > 0 ? annual[0].val : null;
}

// Get recent annual values for High-Low method (oldest to newest)
function getAnnualValues(factData, limit = 3) {
  if (!factData?.units) return null;
  const units = factData.units.USD || Object.values(factData.units)[0];
  if (!units) return null;

  const annual = units
    .filter((d) => d.form === '10-K' && d.val !== undefined && d.end)
    .sort((a, b) => (b.end || '').localeCompare(a.end || ''));

  const unique = [];
  const seen = new Set();
  for (const d of annual) {
    const year = d.end.substring(0, 4);
    if (!seen.has(year)) {
      seen.add(year);
      unique.push(d.val);
    }
    if (unique.length >= limit) break;
  }

  return unique.length >= 2 ? unique.reverse() : null; // oldest first
}

function extractFinancialsFromFacts(facts) {
  const usGaap = facts['us-gaap'] || {};

  // Revenue
  const revenueConcepts = [
    'Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet',
    'SalesRevenueGoodsNet', 'TotalRevenuesAndOtherIncome',
  ];
  let revenue = null;
  let revenueYears = null;
  for (const c of revenueConcepts) {
    if (usGaap[c]) {
      revenue = getLatest10KValue(usGaap[c]);
      revenueYears = getAnnualValues(usGaap[c]);
      if (revenue) break;
    }
  }

  // COGS
  const cogsConcepts = [
    'CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold',
    'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization',
  ];
  let cogs = null;
  let cogsYears = null;
  for (const c of cogsConcepts) {
    if (usGaap[c]) {
      cogs = getLatest10KValue(usGaap[c]);
      cogsYears = getAnnualValues(usGaap[c]);
      if (cogs) break;
    }
  }

  // R&D
  const rdConcepts = ['ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost'];
  let rd = null;
  let rdYears = null;
  for (const c of rdConcepts) {
    if (usGaap[c]) {
      rd = getLatest10KValue(usGaap[c]);
      rdYears = getAnnualValues(usGaap[c]);
      if (rd) break;
    }
  }

  // SG&A
  const sgaConcepts = [
    'SellingGeneralAndAdministrativeExpense', 'GeneralAndAdministrativeExpense',
    'SellingAndMarketingExpense',
  ];
  let sga = null;
  let sgaYears = null;
  for (const c of sgaConcepts) {
    if (usGaap[c]) {
      sga = getLatest10KValue(usGaap[c]);
      sgaYears = getAnnualValues(usGaap[c]);
      if (sga) break;
    }
  }

  // High-Low method for F/V split estimation
  let estimatedSplits = null;
  if (revenueYears && revenueYears.length >= 2) {
    let highIdx = 0, lowIdx = 0;
    for (let i = 1; i < revenueYears.length; i++) {
      if (revenueYears[i] > revenueYears[highIdx]) highIdx = i;
      if (revenueYears[i] < revenueYears[lowIdx]) lowIdx = i;
    }
    if (highIdx !== lowIdx && revenueYears[highIdx] !== revenueYears[lowIdx]) {
      const revDiff = revenueYears[highIdx] - revenueYears[lowIdx];
      estimatedSplits = {};

      function estimateFixed(costYears) {
        if (!costYears || costYears.length < 2) return null;
        const variableRate = (costYears[highIdx] - costYears[lowIdx]) / revDiff;
        const mostRecentCost = costYears[costYears.length - 1];
        const mostRecentRev = revenueYears[revenueYears.length - 1];
        const variablePortion = variableRate * mostRecentRev;
        const fixedPortion = mostRecentCost - variablePortion;
        let fixedPct = Math.round((fixedPortion / mostRecentCost) * 100);
        return Math.max(0, Math.min(100, fixedPct));
      }

      estimatedSplits.cogsFix = estimateFixed(cogsYears);
      estimatedSplits.rdFix = estimateFixed(rdYears);
      estimatedSplits.sgaFix = estimateFixed(sgaYears);
    }
  }

  return { revenue, cogs, rd, sga, estimatedSplits };
}

export default async function handler(req, res) {
  const { action, cik } = req.query;

  try {
    if (action === 'filings' && cik) {
      const paddedCik = cik.replace(/^0+/, '');
      const cik10 = paddedCik.padStart(10, '0');
      const filingsUrl = `https://data.sec.gov/submissions/CIK${cik10}.json`;
      const secRes = await fetchSEC(filingsUrl);
      const data = await secRes.json();

      const recent = data.filings?.recent || {};
      const filings10K = [];
      if (recent.form) {
        for (let i = 0; i < recent.form.length; i++) {
          if (recent.form[i] === '10-K') {
            filings10K.push({
              accessionNumber: recent.accessionNumber[i],
              filingDate: recent.filingDate[i],
              primaryDocument: recent.primaryDocument[i],
            });
          }
          if (filings10K.length >= 3) break;
        }
      }

      return res.status(200).json({
        company: {
          name: data.name,
          cik: cik10,
          tickers: data.tickers || [],
          sic: data.sic,
          sicDescription: data.sicDescription,
        },
        filings: filings10K,
      });
    }

    if (action === 'facts' && cik) {
      const paddedCik = cik.replace(/^0+/, '');
      const cik10 = paddedCik.padStart(10, '0');
      const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10}.json`;
      const secRes = await fetchSEC(factsUrl);
      const data = await secRes.json();

      const financials = extractFinancialsFromFacts(data.facts || {});

      return res.status(200).json({
        entityName: data.entityName,
        financials,
      });
    }

    return res.status(400).json({
      error: 'Invalid action. Use: filings or facts',
    });
  } catch (err) {
    console.error('SEC API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
