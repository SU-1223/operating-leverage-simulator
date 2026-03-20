// SEC EDGAR API proxy — uses data.sec.gov (not blocked by SEC)
//
// Endpoints:
//   GET /api/sec?action=filings&cik=0001318605 — get 10-K filing list
//   GET /api/sec?action=facts&cik=0001318605    — get XBRL financial facts (all years)

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

// Get value for a specific fiscal year end from 10-K filings
function getValueForYear(factData, targetYear) {
  if (!factData?.units) return null;
  const units = factData.units.USD || factData.units.shares || Object.values(factData.units)[0];
  if (!units) return null;

  const match = units
    .filter((d) => d.form === '10-K' && d.val !== undefined && d.end && d.end.startsWith(targetYear))
    .sort((a, b) => (b.end || '').localeCompare(a.end || ''));

  return match.length > 0 ? match[0].val : null;
}

// Get all available fiscal years for a concept (from 10-K filings)
function getAvailableYears(factData) {
  if (!factData?.units) return [];
  const units = factData.units.USD || Object.values(factData.units)[0];
  if (!units) return [];

  const years = new Set();
  for (const d of units) {
    if (d.form === '10-K' && d.val !== undefined && d.end) {
      years.add(d.end.substring(0, 4));
    }
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a)); // newest first
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

// Search all namespaces for volume/delivery/unit concepts
function extractVolumeFromFacts(facts, targetYear) {
  const volumeKeywords = [
    'delivery', 'deliveries', 'unitssold', 'vehicledelivery', 'vehicledeliveries',
    'vehiclessold', 'production', 'unitsdelivered', 'unitsshipped',
    'subscriber', 'subscribers', 'customers', 'users', 'activeusers',
    'shipments', 'devicesold', 'hardwareunitssold',
  ];

  let bestMatch = null;
  let bestVal = null;

  for (const [namespace, concepts] of Object.entries(facts)) {
    if (!concepts || typeof concepts !== 'object') continue;
    for (const [conceptName, conceptData] of Object.entries(concepts)) {
      const lower = conceptName.toLowerCase().replace(/[^a-z]/g, '');
      const isVolumeRelated = volumeKeywords.some((kw) => lower.includes(kw));
      if (!isVolumeRelated) continue;

      if (!conceptData?.units) continue;
      const unitKeys = Object.keys(conceptData.units);
      const nonMonetary = unitKeys.find(
        (u) => u !== 'USD' && u !== 'USD/shares' && u !== 'shares'
      );
      const unitKey = nonMonetary || unitKeys.find((u) => u === 'pure') || null;
      if (!unitKey && conceptData.units.USD) continue;

      const entries = conceptData.units[unitKey || unitKeys[0]] || [];
      let annual = entries
        .filter((d) => d.form === '10-K' && d.val !== undefined && d.val > 0 && d.end)
        .sort((a, b) => (b.end || '').localeCompare(a.end || ''));

      // If targetYear specified, filter to that year
      if (targetYear) {
        annual = annual.filter((d) => d.end.startsWith(targetYear));
      }

      if (annual.length > 0) {
        const val = annual[0].val;
        if (!bestVal || val > bestVal) {
          bestVal = val;
          bestMatch = {
            concept: `${namespace}:${conceptName}`,
            value: val,
            period: annual[0].end,
            unit: unitKey || unitKeys[0],
          };
        }
      }
    }
  }

  return bestMatch;
}

// Find the matching XBRL concept for a category
function findConcept(usGaap, conceptNames) {
  for (const c of conceptNames) {
    if (usGaap[c]) return usGaap[c];
  }
  return null;
}

function extractFinancialsFromFacts(facts, targetYear) {
  const usGaap = facts['us-gaap'] || {};

  // Concept definitions
  const revenueConcepts = [
    'Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet',
    'SalesRevenueGoodsNet', 'TotalRevenuesAndOtherIncome',
  ];
  const cogsConcepts = [
    'CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold',
    'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization',
  ];
  const rdConcepts = [
    'ResearchAndDevelopmentExpense',
    'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost',
  ];
  const sgaConcepts = [
    'SellingGeneralAndAdministrativeExpense',
    'GeneralAndAdministrativeExpense',
    'SellingAndMarketingExpense',
  ];

  const revenueFact = findConcept(usGaap, revenueConcepts);
  const cogsFact = findConcept(usGaap, cogsConcepts);
  const rdFact = findConcept(usGaap, rdConcepts);
  const sgaFact = findConcept(usGaap, sgaConcepts);

  // Collect all available years from revenue (primary source)
  let availableYears = revenueFact ? getAvailableYears(revenueFact) : [];

  // If no targetYear, use the most recent
  const year = targetYear || (availableYears.length > 0 ? availableYears[0] : null);

  // Extract values for the target year
  const revenue = year && revenueFact ? getValueForYear(revenueFact, year) : null;
  const cogs = year && cogsFact ? getValueForYear(cogsFact, year) : null;
  const rd = year && rdFact ? getValueForYear(rdFact, year) : null;
  const sga = year && sgaFact ? getValueForYear(sgaFact, year) : null;

  // High-Low method for F/V split estimation (uses all years)
  const revenueYears = revenueFact ? getAnnualValues(revenueFact) : null;
  const cogsYears = cogsFact ? getAnnualValues(cogsFact) : null;
  const rdYears = rdFact ? getAnnualValues(rdFact) : null;
  const sgaYears = sgaFact ? getAnnualValues(sgaFact) : null;

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

      function estimateFixed(costYrs) {
        if (!costYrs || costYrs.length < 2) return null;
        const variableRate = (costYrs[highIdx] - costYrs[lowIdx]) / revDiff;
        const mostRecentCost = costYrs[costYrs.length - 1];
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

  // Volume / deliveries
  const volumeData = extractVolumeFromFacts(facts, year);

  return {
    revenue, cogs, rd, sga, estimatedSplits, volume: volumeData,
    selectedYear: year,
    availableYears,
  };
}

export default async function handler(req, res) {
  const { action, cik, year } = req.query;

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
          if (filings10K.length >= 10) break;
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

      // Pass targetYear if specified
      const financials = extractFinancialsFromFacts(data.facts || {}, year || null);

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
