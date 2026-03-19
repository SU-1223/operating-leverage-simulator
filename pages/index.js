import { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import UploadArea from '../components/UploadArea';
import CompanySearch from '../components/CompanySearch';
import FinancialInputs from '../components/FinancialInputs';
import CostSliders from '../components/CostSliders';
import ResultsTable from '../components/ResultsTable';
import { SCALE_MULTIPLIERS, DEFAULT_COMPANY, INDUSTRY_PROFILES } from '../lib/constants';
import { calculateScenario, parseInputValue } from '../lib/calculations';
import { extractTextFromPDF, extractFinancials, detectIndustry, extractCompanyName, toMillions } from '../lib/pdfParser';

const ComparisonChart = dynamic(() => import('../components/ComparisonChart'), { ssr: false });

export default function Home() {
  const [companies, setCompanies] = useState([{ ...DEFAULT_COMPANY }]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('opIncome');
  const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });

  const currentCompany = companies[selectedIndex];

  const scenarios = useMemo(() => {
    if (!currentCompany) return [];
    return SCALE_MULTIPLIERS.map((s) => calculateScenario(currentCompany, s));
  }, [currentCompany]);

  const updateCompany = useCallback((field, value) => {
    setCompanies((prev) => {
      const updated = [...prev];
      const numericFields = ['revenue', 'cogs', 'rd', 'sga', 'deliveries', 'cogsFix', 'rdFix', 'sgaFix'];
      if (numericFields.includes(field)) {
        updated[selectedIndex] = {
          ...updated[selectedIndex],
          [field]: typeof value === 'number' ? value : parseInputValue(value),
        };
      } else {
        updated[selectedIndex] = { ...updated[selectedIndex], [field]: value };
      }
      return updated;
    });
  }, [selectedIndex]);

  const handleSliderChange = useCallback((field, value) => {
    setCompanies((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], [field]: value };
      return updated;
    });
  }, [selectedIndex]);

  const handleSelectCompany = useCallback((idx) => {
    setSelectedIndex(idx);
  }, []);

  const handleAddCompany = useCallback(() => {
    setCompanies((prev) => [
      ...prev,
      { ...DEFAULT_COMPANY, name: 'Company ' + (prev.length + 1) },
    ]);
    setSelectedIndex((prev) => companies.length);
  }, [companies.length]);

  const handleRemoveCompany = useCallback(() => {
    if (companies.length <= 1) return;
    setCompanies((prev) => {
      const updated = prev.filter((_, i) => i !== selectedIndex);
      return updated;
    });
    setSelectedIndex((prev) => (prev >= companies.length - 1 ? companies.length - 2 : prev));
  }, [selectedIndex, companies.length]);

  const handleCompanyLoaded = useCallback((newCompany) => {
    setCompanies((prev) => {
      const existingIdx = prev.findIndex((c) => c.name === newCompany.name);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newCompany;
        setSelectedIndex(existingIdx);
        return updated;
      } else if (prev.length === 1 && prev[0].name.startsWith('Company ')) {
        setSelectedIndex(0);
        return [newCompany];
      } else {
        setSelectedIndex(prev.length);
        return [...prev, newCompany];
      }
    });
  }, []);

  const handleSearchStatus = useCallback((message, type) => {
    setUploadStatus({ message, type });
  }, []);

  const handleFilesSelected = useCallback(async (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setUploadStatus({ message: 'Please upload a PDF file.', type: 'error' });
        continue;
      }

      setUploadStatus({ message: 'Extracting data from ' + file.name + '...', type: 'loading' });

      try {
        const text = await extractTextFromPDF(file);
        if (text.length < 100) {
          setUploadStatus({ message: 'Could not extract text from this PDF.', type: 'error' });
          continue;
        }

        const industryKey = detectIndustry(text);
        const profile = INDUSTRY_PROFILES[industryKey];
        const financials = extractFinancials(text);
        const companyName = extractCompanyName(text, file.name);

        const newCompany = {
          name: companyName,
          revenue: financials.revenue !== null ? toMillions(financials.revenue) : 1000,
          cogs: financials.cogs !== null ? toMillions(financials.cogs) : 800,
          rd: financials.rd !== null ? toMillions(financials.rd) : 150,
          sga: financials.sga !== null ? toMillions(financials.sga) : 100,
          deliveries: financials.deliveries !== null ? financials.deliveries : 50000,
          cogsFix: (financials.estimatedSplits && financials.estimatedSplits.cogsFix !== null) ? financials.estimatedSplits.cogsFix : profile.cogsFix,
          rdFix: (financials.estimatedSplits && financials.estimatedSplits.rdFix !== null) ? financials.estimatedSplits.rdFix : profile.rdFix,
          sgaFix: (financials.estimatedSplits && financials.estimatedSplits.sgaFix !== null) ? financials.estimatedSplits.sgaFix : profile.sgaFix,
        };

        setCompanies((prev) => {
          const existingIdx = prev.findIndex((c) => c.name === companyName);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = newCompany;
            setSelectedIndex(existingIdx);
            return updated;
          } else if (prev.length === 1 && prev[0].name.startsWith('Company ')) {
            setSelectedIndex(0);
            return [newCompany];
          } else {
            setSelectedIndex(prev.length);
            return [...prev, newCompany];
          }
        });

        const found = [financials.revenue, financials.cogs, financials.rd, financials.sga, financials.deliveries]
          .filter((v) => v !== null);
        let msg = '<strong>' + companyName + '</strong> added. Extracted ' + found.length + '/5 figures.';
        if (financials.estimatedSplits) {
          msg += '<div class="detected-industry">Fixed/Variable split estimated from historical data (High-Low method): ' +
            'COGS ' + newCompany.cogsFix + '% fixed, R&D ' + newCompany.rdFix + '% fixed, SG&A ' + newCompany.sgaFix + '% fixed</div>';
        } else {
          msg += '<div class="detected-industry">Industry: <strong>' + profile.label + '</strong> (split estimated from industry averages)</div>';
        }
        setUploadStatus({ message: msg, type: 'success' });
      } catch (err) {
        setUploadStatus({ message: 'Error reading PDF: ' + err.message, type: 'error' });
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>Operating Leverage Simulator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header />

      <main className="container">
        <section className="section">
          <h2>Load 10-K Data</h2>
          <CompanySearch
            onCompanyLoaded={handleCompanyLoaded}
            onStatusChange={handleSearchStatus}
          />
          <div className="upload-divider">or</div>
          <UploadArea
            onFilesSelected={handleFilesSelected}
            statusMessage={uploadStatus.message}
            statusType={uploadStatus.type}
          />
        </section>

        <section className="section input-panel">
          <div className="input-grid">
            <FinancialInputs
              company={currentCompany}
              companies={companies}
              selectedIndex={selectedIndex}
              onChange={updateCompany}
              onSelectCompany={handleSelectCompany}
              onAdd={handleAddCompany}
              onRemove={handleRemoveCompany}
              scenario={scenarios[0]}
            />
            <CostSliders
              cogsFix={currentCompany.cogsFix}
              rdFix={currentCompany.rdFix}
              sgaFix={currentCompany.sgaFix}
              onChange={handleSliderChange}
            />
          </div>
        </section>

        <ResultsTable scenarios={scenarios} companyName={currentCompany?.name} />

        <ComparisonChart
          companies={companies}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
      </main>

      <footer className="footer">
        <div className="container">
          <p>Built for Columbia Business School &mdash; Technology Strategy, Spring 2026</p>
          <p className="muted">Inspired by Rivian &amp; Tesla operating leverage analyses</p>
        </div>
      </footer>
    </>
  );
}
