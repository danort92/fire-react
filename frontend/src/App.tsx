import React, { useEffect } from 'react';
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

const [showWizardState, setShowWizardState] = [
  !localStorage.getItem('fire_onboarded'),
  (v: boolean) => { if (!v) localStorage.setItem('fire_onboarded', '1'); }
];

const renderTab = (tab: string) => {
  switch (tab) {
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

const App: React.FC = () => {
  const { params, expenses, setBaseResult, activeTab } = useFireStore();
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [showWizard, setShowWizard] = React.useState(showWizardState);

  useEffect(() => {
    api.computeBase(params, expenses)
      .then(result => { setBaseResult(result); setInitialLoading(false); })
      .catch(() => setInitialLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWizardDone = () => {
    setShowWizard(false);
    api.computeBase(params, expenses).then(setBaseResult).catch(() => {});
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      {showWizard && <OnboardingWizard onDone={handleWizardDone} />}

      {/* Left sidebar: nav + params */}
      <div className="w-72 min-w-72 overflow-y-auto bg-dark-card border-r border-dark-border flex flex-col">
        <Sidebar onOpenWizard={() => { localStorage.removeItem('fire_onboarded'); setShowWizard(true); }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {initialLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-accent-blue" />
                <p className="text-dark-muted text-sm">Loading…</p>
              </div>
            </div>
          ) : renderTab(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default App;
