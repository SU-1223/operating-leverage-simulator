import { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import PresetSelector from '../components/PresetSelector';
import FinancialInputs from '../components/FinancialInputs';
import CostSliders from '../components/CostSliders';
import ResultsTable from '../components/ResultsTable';
import { SCALE_MULTIPLIERS, DEFAULT_COMPANY } from '../lib/constants';
import { calculateScenario, parseInputValue } from '../lib/calculations';

const ComparisonChart = dynamic(() => import('../components/ComparisonChart'), { ssr: false });

export default function Home() {
  const [companies, setCompanies] = useState([{ ...DEFAULT_COMPANY }]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('opIncome');
  const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });

  const currentCompany = companies[selectedIndex];

  const scenarios = useMemo(() => {
    if (!currentCompany) return [];
    return SCALE_MULTIPLIERS.map((s) => calculateScenario(currentCompany, s));
  }, [currentCompany]);

  const updateCompany = useCallback((field, value) => {
    setCompanies((prev) => {
      const updated = [...prev];
      const numericFields = ['revenue', 'cogs', 'rd', 'sga', 'deliveries', 'capacity', 'cogsFix', 'rdFix', 'sgaFix'];
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

  const handleStatusChange = useCallback((message, type) => {
    setStatusMessage({ message, type });
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
          <h2>Load Company Data</h2>
          <PresetSelector
            onCompanyLoaded={handleCompanyLoaded}
            onStatusChange={handleStatusChange}
          />
          {statusMessage.message && (
            <div className={`upload-status ${statusMessage.type}`} dangerouslySetInnerHTML={{ __html: statusMessage.message }} />
          )}
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
        <p>Built for Columbia Business School &mdash; Technology Strategy, Spring 2026</p>
        <p className="footer-sub">Inspired by Rivian &amp; Tesla operating leverage analyses</p>
      </footer>
    </>
  );
}
