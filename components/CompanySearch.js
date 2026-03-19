import { useState, useCallback, useRef } from 'react';
import { searchCompanies, getFilings, fetchFilingContent, htmlToText } from '../lib/secClient';
import { extractFinancials, detectIndustry, toMillions } from '../lib/pdfParser';
import { INDUSTRY_PROFILES } from '../lib/constants';

export default function CompanySearch({ onCompanyLoaded, onStatusChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(null); // ticker being loaded
  const debounceRef = useRef(null);

  const handleSearch = useCallback(async (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const matches = await searchCompanies(value);
        setResults(matches);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      }
      setSearching(false);
    }, 400);
  }, []);

  const handleSelect = useCallback(async (company) => {
    setLoading(company.ticker);
    setResults([]);
    setQuery('');
    onStatusChange('Loading ' + company.name + ' (' + company.ticker + ') from SEC EDGAR...', 'loading');

    try {
      // Step 1: Get filing list
      const filingsData = await getFilings(company.cik);
      if (!filingsData.filings || filingsData.filings.length === 0) {
        onStatusChange('No 10-K filings found for ' + company.name, 'error');
        setLoading(null);
        return;
      }

      // Step 2: Fetch the most recent 10-K
      const filing = filingsData.filings[0];
      onStatusChange(
        'Downloading 10-K (' + filing.filingDate + ') for ' + company.name + '...',
        'loading'
      );

      const html = await fetchFilingContent(
        filing.accessionNumber,
        filing.primaryDocument,
        company.cik
      );

      // Step 3: Convert HTML to text and extract financials
      const text = htmlToText(html);
      if (text.length < 100) {
        onStatusChange('Could not extract text from 10-K filing.', 'error');
        setLoading(null);
        return;
      }

      const industryKey = detectIndustry(text);
      const profile = INDUSTRY_PROFILES[industryKey];
      const financials = extractFinancials(text);

      const newCompany = {
        name: filingsData.company?.name || company.name,
        revenue: financials.revenue !== null ? toMillions(financials.revenue) : 1000,
        cogs: financials.cogs !== null ? toMillions(financials.cogs) : 800,
        rd: financials.rd !== null ? toMillions(financials.rd) : 150,
        sga: financials.sga !== null ? toMillions(financials.sga) : 100,
        deliveries: financials.deliveries !== null ? financials.deliveries : 50000,
        cogsFix: (financials.estimatedSplits?.cogsFix !== null && financials.estimatedSplits?.cogsFix !== undefined)
          ? financials.estimatedSplits.cogsFix : profile.cogsFix,
        rdFix: (financials.estimatedSplits?.rdFix !== null && financials.estimatedSplits?.rdFix !== undefined)
          ? financials.estimatedSplits.rdFix : profile.rdFix,
        sgaFix: (financials.estimatedSplits?.sgaFix !== null && financials.estimatedSplits?.sgaFix !== undefined)
          ? financials.estimatedSplits.sgaFix : profile.sgaFix,
      };

      onCompanyLoaded(newCompany, financials, profile);

      const found = [financials.revenue, financials.cogs, financials.rd, financials.sga, financials.deliveries]
        .filter((v) => v !== null);
      let msg = '<strong>' + newCompany.name + '</strong> loaded from SEC EDGAR (10-K: ' + filing.filingDate + '). Extracted ' + found.length + '/5 figures.';
      if (financials.estimatedSplits) {
        msg += '<div class="detected-industry">Fixed/Variable split estimated via High-Low method: ' +
          'COGS ' + newCompany.cogsFix + '% fixed, R&D ' + newCompany.rdFix + '% fixed, SG&A ' + newCompany.sgaFix + '% fixed</div>';
      } else {
        msg += '<div class="detected-industry">Industry: <strong>' + profile.label + '</strong> (split estimated from industry averages)</div>';
      }
      onStatusChange(msg, 'success');
    } catch (err) {
      onStatusChange('Error loading from SEC: ' + err.message, 'error');
    }
    setLoading(null);
  }, [onCompanyLoaded, onStatusChange]);

  return (
    <div className="search-section">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search by company name or ticker (e.g. TSLA, Rivian)..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searching && <span className="search-spinner">...</span>}
      </div>
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li
              key={i}
              className="search-result-item"
              onClick={() => handleSelect(r)}
            >
              <span className="search-ticker">{r.ticker}</span>
              <span className="search-name">{r.name}</span>
              {loading === r.ticker && <span className="search-loading">Loading...</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
