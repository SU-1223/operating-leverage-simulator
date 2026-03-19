// SEC EDGAR API proxy — only for endpoints that block browser CORS
// Company search is now client-side using /public/company_tickers.json
//
// Endpoints:
//   GET /api/sec?action=filings&cik=0001318605 — get 10-K filing list
//   GET /api/sec?action=filing&url=...         — fetch filing content

const SEC_USER_AGENT = 'OperatingLeverageSimulator/1.0 (columbia-business-school@edu)';

async function fetchSEC(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': SEC_USER_AGENT,
      'Accept': 'application/json, text/html, */*',
    },
  });
  if (!res.ok) {
    throw new Error(`SEC API returned ${res.status}: ${res.statusText}`);
  }
  return res;
}

export default async function handler(req, res) {
  const { action, cik, url } = req.query;

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
              primaryDocDescription: recent.primaryDocDescription?.[i] || '10-K',
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

    if (action === 'filing' && url) {
      if (!url.startsWith('https://www.sec.gov/') && !url.startsWith('https://sec.gov/')) {
        return res.status(400).json({ error: 'Only sec.gov URLs are allowed' });
      }
      const secRes = await fetchSEC(url);
      const contentType = secRes.headers.get('content-type') || '';

      if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        const text = await secRes.text();
        return res.status(200).json({ content: text, contentType });
      } else {
        return res.status(400).json({ error: 'Unsupported content type: ' + contentType });
      }
    }

    return res.status(400).json({
      error: 'Invalid action. Use: filings or filing',
    });
  } catch (err) {
    console.error('SEC API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
