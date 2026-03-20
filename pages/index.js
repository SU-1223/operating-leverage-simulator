import { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import FinancialInputs from '../components/FinancialInputs';
import CostSliders from '../components/CostSliders';
import ResultsTable from '../components/ResultsTable';
import { SCALE_MULTIPLIERS } from '../lib/constants';
import { calculateScenario, parseInputValue } from '../lib/calculations';
import { PRESET_COMPANIES, loadPresetYear, getInitialCompanies } from '../lib/presetData';

const ComparisonChart = dynamic(() => import('../components/ComparisonChart'), { ssr: false });

const initialCompanies = getInitialCompanies();

export default function Home() {
  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('opIncome');

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

  const handleYearChange = useCallback((year) => {
    setCompanies((prev) => {
      const company = prev[selectedIndex];
      if (!company.ticker) return prev;
      const preset = PRESET_COMPANIES.find((p) => p.ticker === company.ticker);
      if (!preset) return prev;
      const loaded = loadPresetYear(preset, year);
      if (!loaded) return prev;
      const updated = [...prev];
      updated[selectedIndex] = loaded;
      return updated;
    });
  }, [selectedIndex]);

  return (
    <>
      <Head>
        <title>Operating Leverage Simulator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header />

      <main className="container">
        <section className="section input-panel">
          <div className="input-grid">
            <FinancialInputs
              company={currentCompany}
              companies={companies}
              selectedIndex={selectedIndex}
              onChange={updateCompany}
              onSelectCompany={handleSelectCompany}
              onYearChange={handleYearChange}
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
