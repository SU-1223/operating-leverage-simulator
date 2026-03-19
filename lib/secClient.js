// Client-side functions for interacting with SEC data

let tickerCache = null;

async function loadTickers() {
  if (tickerCache) return tickerCache;
  const res = await fetch('/company_tickers.json');
  if (!res.ok) throw new Error('Failed to load company tickers');
  tickerCache = await res.json();
  return tickerCache;
}

export async function searchCompanies(query) {
  const tickers = await loadTickers();
  const queryLower = query.toLowerCase();

  const exactMatches = [];
  const nameMatches = [];
  for (const key of Object.keys(tickers)) {
    const entry = tickers[key];
    if (entry.ticker?.toLowerCase() === queryLower) {
      exactMatches.push({
        cik: String(entry.cik_str).padStart(10, '0'),
        ticker: entry.ticker,
        name: entry.title,
      });
    } else if (
      entry.ticker?.toLowerCase().includes(queryLower) ||
      entry.title?.toLowerCase().includes(queryLower)
    ) {
      nameMatches.push({
        cik: String(entry.cik_str).padStart(10, '0'),
        ticker: entry.ticker,
        name: entry.title,
      });
    }
    if (exactMatches.length + nameMatches.length >= 20) break;
  }
  return [...exactMatches, ...nameMatches].slice(0, 10);
}

export async function getFilings(cik) {
  const res = await fetch(`/api/sec?action=filings&cik=${encodeURIComponent(cik)}`);
  if (!res.ok) throw new Error('Failed to get filings');
  return await res.json();
}

export async function getCompanyFacts(cik) {
  const res = await fetch(`/api/sec?action=facts&cik=${encodeURIComponent(cik)}`);
  if (!res.ok) throw new Error('Failed to get financial data');
  return await res.json();
}
