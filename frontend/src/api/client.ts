import axios from 'axios';
import type {
  ScenarioParams, ExpensesState, BaseComputeResult, FireResult,
  MonteCarloResult, SensitivityResult, NpvResult, ETFRecord, ETFLiveData,
  ScenarioConfig, ScenariosResult, PensionInfo
} from '../types';

const BASE_URL = 'http://localhost:8000';
const http = axios.create({ baseURL: BASE_URL });

interface BaseArgs {
  net_monthly_salary: number;
  monthly_expenses: number;
  pension_info: PensionInfo;
}

export const computeBase = (params: ScenarioParams, expenses: ExpensesState): Promise<BaseComputeResult> =>
  http.post('/api/compute/base', { params, expenses }).then(r => r.data);

export const computeFire = (params: ScenarioParams, base: BaseArgs): Promise<FireResult> =>
  http.post('/api/compute/fire', { params, ...base }).then(r => r.data);

export const computeMonteCarlo = (params: ScenarioParams, base: BaseArgs): Promise<MonteCarloResult> =>
  http.post('/api/compute/monte-carlo', { params, ...base }).then(r => r.data);

export const computeSensitivity = (
  params: ScenarioParams, base: BaseArgs,
  config: { x_var: string; y_var: string; output_metric: string }
): Promise<SensitivityResult> =>
  http.post('/api/compute/sensitivity', { params, ...base, ...config }).then(r => r.data);

export const computeNpv = (params: ScenarioParams, base: BaseArgs): Promise<NpvResult> =>
  http.post('/api/compute/npv', { params, ...base }).then(r => r.data);

export const computeScenarios = (
  params: ScenarioParams, base: BaseArgs,
  scenarios: ScenarioConfig[], run_mc: boolean
): Promise<ScenariosResult> =>
  http.post('/api/compute/scenarios', { params, ...base, scenarios, run_mc }).then(r => r.data);

export const searchEtfs = (filters: {
  q?: string; asset_classes?: string[]; issuers?: string[];
  domiciles?: string[]; dist_policies?: string[];
}): Promise<{ etfs: ETFRecord[]; asset_classes: string[]; issuers: string[]; domiciles: string[] }> =>
  http.get('/api/etf', { params: {
    q: filters.q || '',
    asset_classes: filters.asset_classes?.join(',') || '',
    issuers: filters.issuers?.join(',') || '',
    domiciles: filters.domiciles?.join(',') || '',
    dist_policies: filters.dist_policies?.join(',') || '',
  }}).then(r => r.data);

export const getEtfLive = (ticker: string): Promise<ETFLiveData> =>
  http.get(`/api/etf/live/${encodeURIComponent(ticker)}`).then(r => r.data);
