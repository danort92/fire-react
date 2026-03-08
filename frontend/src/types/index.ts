export interface ExpenseItem {
  name: string;
  frequency: 'Monthly' | 'Quarterly' | 'Semi-annual' | 'Annual';
  amount: number;
}

export type ExpensesState = Record<string, ExpenseItem[]>;

export interface ScenarioParams {
  current_age: number;
  target_age: number;
  age_started_working: number;
  ral: number;
  company_benefits: number;
  inps_employee_rate: number;
  surcharges_rate: number;
  etf_value: number;
  monthly_pac: number;
  ter: number;
  ivafe: number;
  expected_gross_return: number;
  capital_gains_tax: number;
  bank_balance: number;
  bank_interest: number;
  emergency_fund: number;
  stamp_duty: number;
  tfr_destination: 'fund' | 'company';
  pf_value: number;
  tfr_contribution: number;
  tfr_company_value: number;
  employer_contribution: number;
  personal_contribution: number;
  voluntary_extra: number;
  max_deductible: number;
  fund_return: number;
  annuity_rate: number;
  age_joined_fund: number;
  inflation: number;
  ral_growth: number;
  inps_contribution_rate: number;
  gdp_revaluation_rate: number;
  stop_working_age: number;
  part_time: boolean;
  part_time_salary: number;
  part_time_monthly_gross: number;
  part_time_until_age: number;
  swr: number;
  defer_to_71: boolean;
  early_pension_enabled: boolean;
  early_pension_years: number;
  le_adjustment: boolean;
  vecchiaia_age: number;
  n_simulations: number;
  etf_volatility: number;
  pf_volatility: number;
  inflation_std: number;
  mc_scenario: string;
}

export interface TaxResult {
  inps: number;
  taxable_income: number;
  irpef: number;
  deductions: number;
  trattamento_integrativo: number;
  surcharges: number;
  net_irpef: number;
  net_annual_salary: number;
  net_monthly_13: number;
  net_monthly_12: number;
  marginal_rate: number;
}

export interface PensionInfo {
  pension_age: number;
  contribution_years: number;
  eligible: boolean;
  montante: number;
  gross_annual: number;
  net_annual_nominal: number;
  net_monthly_nominal: number;
}

export interface PensionFundInfo {
  total_base_contribution: number;
  total_with_voluntary: number;
  actual_deductible: number;
  tax_savings: number;
  marginal_rate: number;
  fund_return: number;
  annuity_rate: number;
  age_joined: number;
}

export interface ProjectionRow {
  age: number;
  yr: number;
  bank: number;
  etf: number;
  pf: number;
  tfr_company: number;
  bank_real: number;
  etf_real: number;
  pf_real: number;
  tfr_real: number;
  cost_basis: number;
  total_nominal: number;
  total_real: number;
  max_pac: number;
  vol_pen: number;
  working: boolean;
  part_time: boolean;
  expenses_annual: number;
  pension_income: number;
}

export interface BaseComputeResult {
  tax_result: TaxResult;
  pension_info: PensionInfo;
  pension_fund_info: PensionFundInfo;
  rows: ProjectionRow[];
  monthly_expenses: number;
  net_monthly_salary: number;
  etf_net_return: number;
}

export interface FireResult {
  scenario_result: {
    rows: ProjectionRow[];
    solvent_to_target: boolean;
    assets_at_target_real: number;
    effective_avg_monthly_pac: number;
  };
  earliest_retirement: number;
  optimal_pac: number;
  scenario_sweep: Array<{ age: number; wealth: number; solvent: boolean }>;
}

export interface MCPercentiles {
  p5: number[]; p10: number[]; p25: number[];
  p50: number[]; p75: number[]; p90: number[]; p95: number[];
}

export interface MonteCarloResult {
  ages: number[];
  percentiles: MCPercentiles;
  probability_solvent: number;
  avg_broke_age: number | null;
  terminal_wealth: number[];
  scenario: string;
  n_simulations: number;
}

export interface SensitivityResult {
  matrix: (number | null)[][];
  x_labels: string[];
  y_labels: string[];
  x_var: string;
  y_var: string;
  axis_variables: string[];
  output_metrics: string[];
}

export interface NpvResult {
  pension_fund_npv: number;
  etf_npv: number;
  npv_difference: number;
  winner: string;
  montante_pf: number;
  montante_etf: number;
  rendita_annual: number;
  net_withdrawal_annual: number;
}

export interface ETFRecord {
  isin: string;
  ticker: string;
  name: string;
  ter: number;
  asset_class: string;
  sub_category: string;
  issuer: string;
  benchmark: string;
  domicile: string;
  dist_policy: string;
}

export interface ETFLiveData {
  info: {
    aum: number | null;
    nav: number | null;
    currency: string;
    yield_12m: number | null;
    ytd_return: number | null;
    wk52_hi: number | null;
    wk52_lo: number | null;
    live_ter: number | null;
  };
  history: { dates: string[]; closes: number[] };
  funds: {
    top_holdings: any[] | null;
    sector_weightings: any[] | null;
    asset_classes: any | null;
  };
}

export interface ScenarioConfig {
  label: string;
  stop_working_age: number;
  monthly_pac: number;
  monthly_expenses: number;
  etf_net_return: number;
  inflation: number;
  ral: number;
}

export interface ScenariosResult {
  results: Array<{
    label: string;
    rows: ProjectionRow[];
    mc?: MonteCarloResult;
  }>;
}

export const DEFAULT_EXPENSES: ExpensesState = {
  "Housing": [
    { name: "Rent / Mortgage", frequency: "Monthly", amount: 175 },
    { name: "Condo fees", frequency: "Monthly", amount: 10 },
    { name: "Electricity", frequency: "Monthly", amount: 70 },
    { name: "Heating", frequency: "Monthly", amount: 100 },
    { name: "Water", frequency: "Quarterly", amount: 50 },
    { name: "Internet / Landline", frequency: "Monthly", amount: 25 },
    { name: "Home insurance", frequency: "Annual", amount: 0 },
    { name: "Other utilities", frequency: "Annual", amount: 120 },
    { name: "Furniture / Appliances", frequency: "Annual", amount: 50 },
  ],
  "Groceries": [
    { name: "Food shopping", frequency: "Monthly", amount: 150 },
    { name: "Restaurants / Takeaway", frequency: "Monthly", amount: 50 },
    { name: "Household / Cleaning products", frequency: "Monthly", amount: 20 },
  ],
  "Transport": [
    { name: "Car payment / Leasing", frequency: "Monthly", amount: 0 },
    { name: "Fuel", frequency: "Monthly", amount: 40 },
    { name: "Car insurance", frequency: "Annual", amount: 300 },
    { name: "Road tax", frequency: "Annual", amount: 100 },
    { name: "Car service / Maintenance", frequency: "Annual", amount: 300 },
    { name: "MOT / Inspection", frequency: "Annual", amount: 80 },
    { name: "Parking / Tolls", frequency: "Monthly", amount: 5 },
    { name: "Public transport", frequency: "Monthly", amount: 5 },
  ],
  "Health": [
    { name: "Medical visits", frequency: "Annual", amount: 150 },
    { name: "Medications", frequency: "Monthly", amount: 5 },
    { name: "Dentist", frequency: "Annual", amount: 50 },
    { name: "Health insurance", frequency: "Annual", amount: 0 },
  ],
  "Pet": [
    { name: "Pet food", frequency: "Monthly", amount: 25 },
    { name: "Vet / Care", frequency: "Annual", amount: 25 },
    { name: "Pet insurance", frequency: "Annual", amount: 0 },
  ],
  "Personal": [
    { name: "Clothing / Shoes", frequency: "Annual", amount: 100 },
    { name: "Personal care", frequency: "Monthly", amount: 10 },
    { name: "Mobile phone", frequency: "Monthly", amount: 10 },
    { name: "Gym / Sports", frequency: "Monthly", amount: 50 },
  ],
  "Entertainment & Social": [
    { name: "Travel / Holidays", frequency: "Annual", amount: 500 },
    { name: "Hobbies / Entertainment", frequency: "Monthly", amount: 10 },
    { name: "Gifts", frequency: "Annual", amount: 400 },
    { name: "Streaming subscriptions", frequency: "Monthly", amount: 10 },
  ],
  "Education": [
    { name: "Courses / Certifications", frequency: "Annual", amount: 1000 },
    { name: "Books", frequency: "Annual", amount: 30 },
  ],
  "Other": [
    { name: "Donations / Charity", frequency: "Annual", amount: 100 },
    { name: "Unexpected expenses", frequency: "Annual", amount: 300 },
    { name: "Other", frequency: "Monthly", amount: 10 },
  ],
};

export const DEFAULT_PARAMS: ScenarioParams = {
  current_age: 33, target_age: 90, age_started_working: 26,
  ral: 35600, company_benefits: 2000, inps_employee_rate: 9.19, surcharges_rate: 2.0,
  etf_value: 85000, monthly_pac: 1300, ter: 0.3, ivafe: 0.2,
  expected_gross_return: 6.0, capital_gains_tax: 26.0,
  bank_balance: 35000, bank_interest: 1.0, emergency_fund: 20000, stamp_duty: 34.2,
  tfr_destination: 'fund', pf_value: 22000, tfr_contribution: 1993, tfr_company_value: 0,
  employer_contribution: 1079, personal_contribution: 228, voluntary_extra: 3850, max_deductible: 5164.57,
  fund_return: 4.0, annuity_rate: 5.0, age_joined_fund: 30,
  inflation: 2.0, ral_growth: 0.5, inps_contribution_rate: 33.0, gdp_revaluation_rate: 2.0,
  stop_working_age: 50, part_time: true, part_time_salary: 900, part_time_monthly_gross: 0,
  part_time_until_age: 60, swr: 3.5,
  defer_to_71: false, early_pension_enabled: false, early_pension_years: 41,
  le_adjustment: false, vecchiaia_age: 67,
  n_simulations: 1000, etf_volatility: 16.0, pf_volatility: 5.0, inflation_std: 1.0,
  mc_scenario: 'Hybrid',
};
