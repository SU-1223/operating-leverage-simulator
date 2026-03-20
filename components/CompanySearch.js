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
  const [yearSelector, setYearSelector] = useState(null); // { company, filingsData, availableYears, selectedYear }
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

  const loadDataForYear = useCallback(async (company, filingsData, year) => {
    onStatusChange('Loading ' + (filingsData.company?.name || company.name) + ' FY' + year + ' data...', 'loading');

    try {
      const factsData = await getCompanyFacts(company.cik, year);
      const financials = factsData.financials;

      const industryKey = detectIndustryFromSic(
        filingsData.company?.sic,
        filingsData.company?.sicDescription
      );
      const profile = INDUSTRY_PROFILES[industryKey];

      // Delivery volume
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
      let msg = '<strong>' + newCompany.name + '</strong> loaded from SEC EDGAR (FY' + year + '). Extracted ' + found.length + '/4 financial figures.';
      if (volumeSource) {
        msg += '<div class="detected-industry">Delivery volume: ' + deliveries.toLocaleString() + ' units (from XBRL: ' + volumeSource + ')</div>';
      } else {
        msg += '<div class="detected-industry" style="color:#dc2626;">Delivery volume not found in SEC filing. Please enter manually.</div>';
      }
      if (financials.estimatedSplits) {
        msg += '<div class="detected-industry">Fixed/Variable split estimated via High-Low method: ' +
          'COGS ' + newCompany.cogsFix + '% fixed, R&D ' + newCompany.rdFix + '% fixed, SG&A ' + newCompany.sgaFix + '% fixed</div>';
      } else {
        msg += '<div class="detected-industry">Industry: <strong>' + profile.label + '</strong> (' + (filingsData.company?.sicDescription || '') + ')</div>';
      }
      onStatusChange(msg, 'success');
    } catch (err) {
      onStatusChange('Error loading FY' + year + ' data: ' + err.message, 'error');
    }
  }, [onCompanyLoaded, onStatusChange]);

  const handleSelect = useCallback(async (company) => {
    setLoading(company.ticker);
    setResults([]);
    setQuery('');
    setYearSelector(null);
    onStatusChange('Loading ' + company.name + ' (' + company.ticker + ') from SEC EDGAR...', 'loading');

    try {
      // Step 1: Get filing info
      const filingsData = await getFilings(company.cik);

      // Step 2: Get XBRL facts (default = most recent year) to discover available years
      onStatusChange('Extracting financial data for ' + company.name + '...', 'loading');
      const factsData = await getCompanyFacts(company.cik);
      const financials = factsData.financials;
      const availableYears = financials.availableYears || [];
      const selectedYear = financials.selectedYear || (availableYears.length > 0 ? availableYears[0] : null);

      // Show year selector if multiple years available
      if (availableYears.length > 1) {
        setYearSelector({ company, filingsData, availableYears, selectedYear });
      } else {
        setYearSelector(null);
      }

      // Load the default (most recent) year
      const industryKey = detectIndustryFromSic(
        filingsData.company?.sic,
        filingsData.company?.sicDescription
      );
      const profile = INDUSTRY_PROFILES[industryKey];

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
      const yearLabel = selectedYear ? 'FY' + selectedYear : '10-K';
      let msg = '<strong>' + newCompany.name + '</strong> loaded from SEC EDGAR (' + yearLabel + '). Extracted ' + found.length + '/4 financial figures.';
      if (volumeSource) {
        msg += '<div class="detected-industry">Delivery volume: ' + deliveries.toLocaleString() + ' units (from XBRL: ' + volumeSource + ')</div>';
      } else {
        msg += '<div class="detected-industry" style="color:#dc2626;">Delivery volume not found in SEC filing. Please enter manually.</div>';
      }
      if (financials.estimatedSplits) {
        msg += '<div class="detected-industry">Fixed/Variable split estimated via High-Low method: ' +
          'COGS ' + newCompany.cogsFix + '% fixed, R&D ' + newCompany.rdFix + '% fixed, SG&A ' + newCompany.sgaFix + '% fixed</div>';
      } else {
        msg += '<div class="detected-industry">Industry: <strong>' + profile.label + '</strong> (' + (filingsData.company?.sicDescription || '') + ')</div>';
      }
      if (availableYears.length > 1) {
        msg += '<div class="detected-industry">Available years: ' + availableYears.join(', ') + ' — use the selector above to change.</div>';
      }
      onStatusChange(msg, 'success');
    } catch (err) {
      onStatusChange('Error loading from SEC: ' + err.message, 'error');
    }
    setLoading(null);
  }, [onCompanyLoaded, onStatusChange, loadDataForYear]);

  const handleYearChange = useCallback(async (e) => {
    const year = e.target.value;
    if (!yearSelector) return;
    setYearSelector((prev) => ({ ...prev, selectedYear: year }));
    await loadDataForYear(yearSelector.company, yearSelector.filingsData, year);
  }, [yearSelector, loadDataForYear]);

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
      {yearSelector && yearSelector.availableYears.length > 1 && (
        <div className="year-selector">
          <label htmlFor="yearSelect">Fiscal Year: </label>
          <select
            id="yearSelect"
            className="year-select"
            value={yearSelector.selectedYear}
            onChange={handleYearChange}
          >
            {yearSelector.availableYears.map((y) => (
              <option key={y} value={y}>FY{y}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
