"""Pydantic models for the FIRE Planning API."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ExpenseItem(BaseModel):
    name: str
    frequency: str  # Monthly | Quarterly | Semi-annual | Annual
    amount: float


class ScenarioParams(BaseModel):
    # Personal
    current_age: int = 33
    target_age: int = 90
    age_started_working: int = 26
    # Salary
    ral: float = 35600.0
    company_benefits: float = 2000.0
    inps_employee_rate: float = 9.19   # stored as %
    surcharges_rate: float = 2.0        # stored as %
    # ETF / PAC
    etf_value: float = 85000.0
    monthly_pac: float = 1300.0
    ter: float = 0.3                    # stored as %
    ivafe: float = 0.2                  # stored as %
    expected_gross_return: float = 6.0  # stored as %
    capital_gains_tax: float = 26.0     # stored as %
    # Bank
    bank_balance: float = 35000.0
    bank_interest: float = 1.0          # stored as %
    emergency_fund: float = 20000.0
    stamp_duty: float = 34.2
    # Pension Fund & TFR
    tfr_destination: str = "fund"
    pf_value: float = 22000.0
    tfr_contribution: float = 1993.0
    tfr_company_value: float = 0.0
    employer_contribution: float = 1079.0
    personal_contribution: float = 228.0
    voluntary_extra: float = 3850.0
    max_deductible: float = 5164.57
    fund_return: float = 4.0            # stored as %
    annuity_rate: float = 5.0           # stored as %
    age_joined_fund: int = 30
    # Macro
    inflation: float = 2.0              # stored as %
    ral_growth: float = 0.5             # stored as %
    inps_contribution_rate: float = 33.0  # stored as %
    gdp_revaluation_rate: float = 2.0   # stored as %
    # FIRE
    stop_working_age: int = 50
    part_time: bool = True
    part_time_salary: float = 900.0
    part_time_monthly_gross: float = 0.0
    part_time_until_age: int = 60
    swr: float = 3.5                    # stored as %
    # Early Pension
    defer_to_71: bool = False
    early_pension_enabled: bool = False
    early_pension_years: int = 41
    le_adjustment: bool = False
    vecchiaia_age: int = 67
    # Monte Carlo
    n_simulations: int = 1000
    etf_volatility: float = 16.0        # stored as %
    pf_volatility: float = 5.0          # stored as %
    inflation_std: float = 1.0          # stored as %
    mc_scenario: str = "Hybrid"

    def to_p(self) -> dict:
        """Convert to the 'p' dict format (all rates as fractions)."""
        return {
            "current_age": self.current_age,
            "target_age": self.target_age,
            "age_started_working": self.age_started_working,
            "ral": self.ral,
            "company_benefits": self.company_benefits,
            "inps_employee_rate": self.inps_employee_rate / 100,
            "surcharges_rate": self.surcharges_rate / 100,
            "etf_value": self.etf_value,
            "monthly_pac": self.monthly_pac,
            "ter": self.ter / 100,
            "ivafe": self.ivafe / 100,
            "expected_gross_return": self.expected_gross_return / 100,
            "capital_gains_tax": self.capital_gains_tax / 100,
            "bank_balance": self.bank_balance,
            "bank_interest": self.bank_interest / 100,
            "emergency_fund": self.emergency_fund,
            "stamp_duty": self.stamp_duty,
            "tfr_destination": self.tfr_destination,
            "pf_value": self.pf_value,
            "tfr_contribution": self.tfr_contribution,
            "tfr_company_value": self.tfr_company_value,
            "employer_contribution": self.employer_contribution,
            "personal_contribution": self.personal_contribution,
            "voluntary_extra": self.voluntary_extra,
            "max_deductible": self.max_deductible,
            "fund_return": self.fund_return / 100,
            "annuity_rate": self.annuity_rate / 100,
            "age_joined_fund": self.age_joined_fund,
            "inflation": self.inflation / 100,
            "ral_growth": self.ral_growth / 100,
            "inps_contribution_rate": self.inps_contribution_rate / 100,
            "gdp_revaluation_rate": self.gdp_revaluation_rate / 100,
            "stop_working_age": self.stop_working_age,
            "part_time": self.part_time,
            "part_time_salary": self.part_time_salary,
            "part_time_monthly_gross": self.part_time_monthly_gross,
            "part_time_until_age": self.part_time_until_age,
            "swr": self.swr / 100,
            "defer_to_71": self.defer_to_71,
            "early_pension_enabled": self.early_pension_enabled,
            "early_pension_years": self.early_pension_years,
            "le_adjustment": self.le_adjustment,
            "vecchiaia_age": self.vecchiaia_age,
            "n_simulations": self.n_simulations,
            "etf_volatility": self.etf_volatility / 100,
            "pf_volatility": self.pf_volatility / 100,
            "inflation_std": self.inflation_std / 100,
            "mc_scenario": self.mc_scenario,
        }


class ComputeBaseRequest(BaseModel):
    params: ScenarioParams = ScenarioParams()
    expenses: Dict[str, List[ExpenseItem]] = {}


class FireRequest(BaseModel):
    params: ScenarioParams
    net_monthly_salary: float
    monthly_expenses: float
    pension_info: Dict[str, Any]


class MonteCarloRequest(BaseModel):
    params: ScenarioParams
    net_monthly_salary: float
    monthly_expenses: float
    pension_info: Dict[str, Any]


class ScenarioConfig(BaseModel):
    label: str
    stop_working_age: int
    monthly_pac: float
    monthly_expenses: float
    etf_net_return: float   # user % (e.g. 5.5 for 5.5%)
    inflation: float        # user % (e.g. 2.0)
    ral: float


class ScenariosCompareRequest(BaseModel):
    params: ScenarioParams
    net_monthly_salary: float
    monthly_expenses: float
    pension_info: Dict[str, Any]
    scenarios: List[ScenarioConfig]
    run_mc: bool = False


class SensitivityRequest(BaseModel):
    params: ScenarioParams
    net_monthly_salary: float
    monthly_expenses: float
    pension_info: Dict[str, Any]
    x_var: str = "ETF net return"
    y_var: str = "Monthly expenses"
    output_metric: str = "Earliest retirement age"


class NpvRequest(BaseModel):
    params: ScenarioParams
    net_monthly_salary: float
    monthly_expenses: float
    pension_info: Dict[str, Any]
