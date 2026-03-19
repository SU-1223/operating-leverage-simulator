// Client-side functions for interacting with our SEC API proxy

export async function searchCompanies(query) {
  const res = await fetch(`/api/sec?action=search&query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.results || [];
}

export async function getFilings(cik) {
  const res = await fetch(`/api/sec?action=filings&cik=${encodeURIComponent(cik)}`);
  if (!res.ok) throw new Error('Failed to get filings');
  return await res.json();
}

export async function fetchFilingContent(accessionNumber, primaryDocument, cik) {
  // Build the filing URL
  const accessionClean = accessionNumber.replace(/-/g, '');
  const url = `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, '')}/${accessionClean}/${primaryDocument}`;
  const res = await fetch(`/api/sec?action=filing&url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Failed to fetch filing');
  const data = await res.json();
  return data.content || '';
}

export function htmlToText(html) {
  // Strip HTML tags and decode entities to get plain text for our existing parser
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
