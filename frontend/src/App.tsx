import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useFireStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { OnboardingWizard } from './components/OnboardingWizard';
import * as api from './api/client';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { SalaryTab } from './components/tabs/SalaryTab';
import { ProjectionsTab } from './components/tabs/ProjectionsTab';
import { FireTab } from './components/tabs/FireTab';
import { PensionTab } from './components/tabs/PensionTab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { SensitivityTab } from './components/tabs/SensitivityTab';
import { ScenariosTab } from './components/tabs/ScenariosTab';
import { EtfTab } from './components/tabs/EtfTab';

const TABS = [
  { id: 'dashboard',    label: '📋 Overview' },
  { id: 'salary',       label: '💰 My Paycheck' },
  { id: 'expenses',     label: '💸 My Expenses' },
  { id: 'projections',  label: '📊 Wealth Projection' },
  { id: 'fire',         label: '🔥 When Can I Retire?' },
  { id: 'pension',      label: '🏛️ Pension' },
  { id: 'scenarios',    label: '🔀 Scenarios & Risk' },
  { id: 'sensitivity',  label: '🔬 What-If Analysis' },
  { id: 'etf',          label: '📈 ETF Explorer' },
] as const;

type TabId = typeof TABS[number]['id'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [initialLoading, setInitialLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(!localStorage.getItem('fire_onboarded'));
  const { params, expenses, setBaseResult } = useFireStore();

  useEffect(() => {
    api.computeBase(params, expenses)
      .then(result => {
        setBaseResult(result);
        setInitialLoading(false);
      })
      .catch(() => {
        setInitialLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWizardDone = () => {
    setShowWizard(false);
    // Re-run computation with new params
    api.computeBase(params, expenses).then(setBaseResult).catch(() => {});
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'expenses':    return <ExpensesTab />;
      case 'salary':      return <SalaryTab />;
      case 'projections': return <ProjectionsTab />;
      case 'fire':        return <FireTab />;
      case 'pension':     return <PensionTab />;
      case 'dashboard':   return <DashboardTab />;
      case 'sensitivity': return <SensitivityTab />;
      case 'scenarios':   return <ScenariosTab />;
      case 'etf':         return <EtfTab />;
      default:            return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      {showWizard && <OnboardingWizard onDone={handleWizardDone} />}

      {/* Sidebar */}
      <div className="w-72 min-w-72 overflow-y-auto bg-dark-card border-r border-dark-border flex flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b border-dark-border bg-dark-card flex items-center justify-between shrink-0">
          <h1 className="text-base font-semibold text-dark-text">
            🔥 FIRE Planner — Italian Edition
          </h1>
          <button
            onClick={() => { localStorage.removeItem('fire_onboarded'); setShowWizard(true); }}
            className="text-xs text-dark-muted hover:text-dark-text transition-colors"
            title="Restart setup wizard"
          >
            Setup wizard
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-dark-border px-4 bg-dark-card shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : 'inactive'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {initialLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-accent-blue" />
                <p className="text-dark-muted text-sm">Loading...</p>
              </div>
            </div>
          ) : (
            renderTab()
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
