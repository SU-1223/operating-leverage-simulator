import { useState, useCallback, useRef } from 'react';
import { searchCompanies, getFilings, getCompanyFacts } from '../lib/secClient';
import { INDUSTRY_PROFILES } from '../lib/constants';

function toMillions(value) {
  if (value > 1000000) return Math.round(value / 1000000);
  if (value > 10000) return Math.round(value / 1000);
  return Math.round(value);
}

function detectIndustryFromSic(sic, sicDescription) {
  const desc = (sicDescription || '').toLowerCase();
  if (desc.includes('motor') || desc.includes('vehicle') || desc.includes('auto')) return 'automotive';
  if (desc.includes('software') || desc.includes('computer') || desc.includes('data processing')) return 'software';
  if (desc.includes('pharma') || desc.includes('drug') || desc.includes('biolog')) return 'pharma';
  if (desc.includes('retail') || desc.includes('store')) return 'retail';
  if (desc.includes('oil') || desc.includes('gas') || desc.includes('energy') || desc.includes('petrol')) return 'energy';
  if (desc.includes('bank') || desc.includes('financ') || desc.includes('insur')) return 'financial';
  if (desc.includes('broadcast') || desc.includes('motion picture') || desc.includes('entertain')) return 'media';
  if (desc.includes('semiconductor') || desc.includes('electronic')) return 'tech_hardware';
  return 'default';
}

export default function CompanySearch({ onCompanyLoaded, onStatusChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(null);
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
      // Step 1: Get filing info (for date display)
      const filingsData = await getFilings(company.cik);
      const filingDate = filingsData.filings?.[0]?.filingDate || 'N/A';

      // Step 2: Get XBRL financial facts
      onStatusChange('Extracting financial data for ' + company.name + '...', 'loading');
      const factsData = await getCompanyFacts(company.cik);
      const financials = factsData.financials;

      // Step 3: Determine industry from SIC code
      const industryKey = detectIndustryFromSic(
        filingsData.company?.sic,
        filingsData.company?.sicDescription
      );
      const profile = INDUSTRY_PROFILES[industryKey];

      // Delivery volume: use XBRL data only, error if not available
      let deliveries = null;
      let volumeSource = null;
      if (financials.volume && financials.volume.value) {
        deliveries = financials.volume.value;
        volumeSource = financials.volume.concept;
      }

      const newCompany = {
        name: filingsData.company?.name || factsData.entityName || company.name,
        revenue: financials.revenue ? toMillions(financials.revenue) : 1000,
        cogs: financials.cogs ? toMillions(financials.cogs) : 800,
        rd: financials.rd ? toMillions(financials.rd) : 150,
        sga: financials.sga ? toMillions(financials.sga) : 100,
        deliveries: deliveries || 0,
        cogsFix: financials.estimatedSplits?.cogsFix ?? profile.cogsFix,
        rdFix: financials.estimatedSplits?.rdFix ?? profile.rdFix,
        sgaFix: financials.estimatedSplits?.sgaFix ?? profile.sgaFix,
      };

      onCompanyLoaded(newCompany);

      const found = [financials.revenue, financials.cogs, financials.rd, financials.sga]
        .filter((v) => v !== null);
      let msg = '<strong>' + newCompany.name + '</strong> loaded from SEC EDGAR (10-K: ' + filingDate + '). Extracted ' + found.length + '/4 financial figures.';
      if (volumeSource) {
        msg += '<div class="detected-industry">📦 Delivery volume: ' + deliveries.toLocaleString() + ' units (from XBRL: ' + volumeSource + ')</div>';
      } else {
        msg += '<div class="detected-industry" style="color:#dc2626;">⚠️ Delivery volume not found in SEC filing. Please enter manually.</div>';
      }
      if (financials.estimatedSplits) {
        msg += '<div class="detected-industry">Fixed/Variable split estimated via High-Low method: ' +
          'COGS ' + newCompany.cogsFix + '% fixed, R&D ' + newCompany.rdFix + '% fixed, SG&A ' + newCompany.sgaFix + '% fixed</div>';
      } else {
        msg += '<div class="detected-industry">Industry: <strong>' + profile.label + '</strong> (' + (filingsData.company?.sicDescription || '') + ')</div>';
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
