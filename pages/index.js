import { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import FinancialInputs from '../components/FinancialInputs';
import CostSliders from '../components/CostSliders';
import ResultsTable from '../components/ResultsTable';
import { calculateScenario, parseInputValue } from '../lib/calculations';
import { PRESET_COMPANIES, loadPresetYear, getInitialCompanies } from '../lib/presetData';

const ComparisonChart = dynamic(() => import('../components/ComparisonChart'), { ssr: false });

const initialCompanies = getInitialCompanies();

export default function Home() {
  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('opMargin');
  const [scaleValue, setScaleValue] = useState(1);

  const currentCompany = companies[selectedIndex];

  // Max scale = capacity / deliveries (how much room to grow)
  const maxScale = useMemo(() => {
    if (!currentCompany || !currentCompany.capacity || !currentCompany.deliveries) return 2;
    return Math.max(1, currentCompany.capacity / currentCompany.deliveries);
  }, [currentCompany]);

  // Clamp scaleValue to maxScale when company changes
  const effectiveScale = Math.min(scaleValue, maxScale);

  const baseScenario = useMemo(() => {
    if (!currentCompany) return null;
    return calculateScenario(currentCompany, 1);
  }, [currentCompany]);

  const scaledScenario = useMemo(() => {
    if (!currentCompany) return null;
    return calculateScenario(currentCompany, effectiveScale);
  }, [currentCompany, effectiveScale]);

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
    setScaleValue(1);
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
    setScaleValue(1);
  }, [selectedIndex]);

  const handleScaleChange = useCallback((value) => {
    setScaleValue(value);
  }, []);

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
              scenario={baseScenario}
            />
            <CostSliders
              cogsFix={currentCompany.cogsFix}
              rdFix={currentCompany.rdFix}
              sgaFix={currentCompany.sgaFix}
              onChange={handleSliderChange}
            />
          </div>
        </section>

        <ResultsTable
          baseScenario={baseScenario}
          scaledScenario={scaledScenario}
          companyName={currentCompany?.name}
          scaleValue={effectiveScale}
          maxScale={maxScale}
          onScaleChange={handleScaleChange}
        />

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
