"""
FIRE Planning Tool — FastAPI backend.
Wraps the existing Python computation modules.
"""
import sys
sys.path.insert(0, "/home/user/fire_app")

import json
import time
from functools import lru_cache
from typing import Optional, List

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from modules.expenses import compute_total_monthly
from modules.tax import calculate_net_salary
from modules.pension_state import calculate_state_pension
from modules.pension_fund import calculate_pension_fund_info, pension_fund_tax_rate
from modules.projections import run_projection
from modules.fire_analysis import run_your_scenario, find_earliest_retirement, find_optimal_pac
from modules.monte_carlo import run_monte_carlo, SCENARIO_OPTIONS
from modules.sensitivity import run_sensitivity, AXIS_VARIABLES, OUTPUT_METRICS
from modules.npv_comparison import calculate_npv_comparison
from modules.etf_data import search_etfs, get_asset_classes, get_issuers, get_domiciles

from models import (
    ComputeBaseRequest, FireRequest, MonteCarloRequest,
    SensitivityRequest, NpvRequest, ScenariosCompareRequest, ScenarioParams
)

app = FastAPI(title="FIRE Planning API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Serialisation helper ─────────────────────────────────────────────────────

def _ser(obj):
    """Recursively convert numpy/pandas types to JSON-serialisable Python types."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient="records")
    if isinstance(obj, pd.Series):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: _ser(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_ser(i) for i in obj]
    return obj


# ── Common computation helper ────────────────────────────────────────────────

def _compute_common(params: ScenarioParams, expenses_dict: dict):
    """
    Compute tax, pension, and projection from ScenarioParams.
    Returns dict with all derived values.
    """
    p = params.to_p()

    # Expenses
    # expenses_dict: {category: [{"name":..,"frequency":..,"amount":..}]}
    expenses_native = {
        cat: [{"name": i.name, "frequency": i.frequency, "amount": i.amount}
              for i in items]
        for cat, items in expenses_dict.items()
    } if hasattr(next(iter(expenses_dict.values()), [None]), 'name') else expenses_dict
    monthly_expenses = compute_total_monthly(expenses_native) if expenses_native else 1297.0

    # Tax
    # Note: calculate_net_salary signature is (ral, company_benefits, inps_rate, surcharges_rate)
    tax_result = calculate_net_salary(
        p["ral"], p["company_benefits"],
        p["inps_employee_rate"], p["surcharges_rate"]
    )
    net_monthly_salary = float(tax_result["net_monthly_13"])

    # Derived
    etf_net_return = p["expected_gross_return"] - p["ter"] - p["ivafe"]

    if p["tfr_destination"] == "fund":
        total_annual_contribution = (
            p["tfr_contribution"] + p["employer_contribution"] + p["personal_contribution"]
        )
    else:
        total_annual_contribution = p["employer_contribution"] + p["personal_contribution"]

    # State pension
    pension_info = calculate_state_pension(
        ral=p["ral"],
        ral_growth=p["ral_growth"],
        inps_contribution_rate=p["inps_contribution_rate"],
        gdp_revaluation_rate=p["gdp_revaluation_rate"],
        current_age=p["current_age"],
        age_started_working=p["age_started_working"],
        stop_working_age=p["stop_working_age"],
        part_time=p["part_time"],
        part_time_salary=p["part_time_salary"],
        part_time_until_age=p["part_time_until_age"],
        net_monthly_salary=net_monthly_salary,
        age_joined_fund=p["age_joined_fund"],
        min_contribution_years=20,
        early_pension_years=p["early_pension_years"] if p["early_pension_enabled"] else 0,
        part_time_monthly_gross=p["part_time_monthly_gross"],
        defer_to_71=p["defer_to_71"],
        base_vecchiaia_age=p["vecchiaia_age"],
    )

    # Pension fund info
    pension_fund_info = calculate_pension_fund_info(
        current_value=p["pf_value"],
        tfr_contribution=p["tfr_contribution"],
        employer_contribution=p["employer_contribution"],
        personal_contribution=p["personal_contribution"],
        voluntary_extra=p["voluntary_extra"],
        max_deductible=p["max_deductible"],
        fund_return=p["fund_return"],
        annuity_rate=p["annuity_rate"],
        age_joined=p["age_joined_fund"],
        taxable_income=tax_result["taxable_income"],
    )

    # Projection
    rows = run_projection(
        current_age=p["current_age"],
        target_age=p["target_age"],
        net_monthly_salary=net_monthly_salary,
        monthly_expenses=monthly_expenses,
        age_started_working=p["age_started_working"],
        etf_value=p["etf_value"],
        monthly_pac=p["monthly_pac"],
        etf_net_return=etf_net_return,
        capital_gains_tax=p["capital_gains_tax"],
        bank_balance=p["bank_balance"],
        bank_interest=p["bank_interest"],
        emergency_fund=p["emergency_fund"],
        stamp_duty=p["stamp_duty"],
        pension_fund_value=p["pf_value"],
        total_annual_contribution=total_annual_contribution,
        voluntary_extra=p["voluntary_extra"],
        pension_fund_return=p["fund_return"],
        annuity_rate=p["annuity_rate"],
        age_joined_fund=p["age_joined_fund"],
        stop_working_age=p["stop_working_age"],
        part_time=p["part_time"],
        part_time_salary=p["part_time_salary"],
        part_time_until_age=p["part_time_until_age"],
        inflation=p["inflation"],
        state_pension_annual_net=pension_info["net_annual_nominal"],
        pension_start_age=pension_info["pension_age"],
        contribution_years=pension_info["contribution_years"],
        part_time_monthly_gross=p["part_time_monthly_gross"],
        inps_employee_rate=p["inps_employee_rate"],
        surcharges_rate=p["surcharges_rate"],
        tfr_destination=p["tfr_destination"],
        tfr_annual_accrual=p["tfr_contribution"],
        tfr_company_value=p["tfr_company_value"],
    )

    return {
        "p": p,
        "tax_result": tax_result,
        "pension_info": pension_info,
        "pension_fund_info": pension_fund_info,
        "rows": rows,
        "monthly_expenses": monthly_expenses,
        "net_monthly_salary": net_monthly_salary,
        "etf_net_return": etf_net_return,
        "total_annual_contribution": total_annual_contribution,
    }


def _fire_kwargs(p: dict, net_monthly_salary: float, monthly_expenses: float,
                 pension_info: dict, total_annual_contribution: float, etf_net_return: float) -> dict:
    """Build the common kwargs dict for fire_analysis functions."""
    return dict(
        current_age=p["current_age"],
        target_age=p["target_age"],
        net_monthly_salary=net_monthly_salary,
        monthly_expenses=monthly_expenses,
        age_started_working=p["age_started_working"],
        etf_value=p["etf_value"],
        monthly_pac=p["monthly_pac"],
        etf_net_return=etf_net_return,
        capital_gains_tax=p["capital_gains_tax"],
        bank_balance=p["bank_balance"],
        bank_interest=p["bank_interest"],
        emergency_fund=p["emergency_fund"],
        stamp_duty=p["stamp_duty"],
        pension_fund_value=p["pf_value"],
        total_annual_contribution=total_annual_contribution,
        voluntary_extra=p["voluntary_extra"],
        pension_fund_return=p["fund_return"],
        annuity_rate=p["annuity_rate"],
        age_joined_fund=p["age_joined_fund"],
        part_time=p["part_time"],
        part_time_salary=p["part_time_salary"],
        part_time_until_age=p["part_time_until_age"],
        inflation=p["inflation"],
        pension_start_age=pension_info["pension_age"],
        ral=p["ral"],
        ral_growth=p["ral_growth"],
        inps_contribution_rate=p["inps_contribution_rate"],
        gdp_revaluation_rate=p["gdp_revaluation_rate"],
        part_time_monthly_gross=p["part_time_monthly_gross"],
        inps_employee_rate=p["inps_employee_rate"],
        surcharges_rate=p["surcharges_rate"],
        tfr_destination=p["tfr_destination"],
        tfr_annual_accrual=p["tfr_contribution"],
        tfr_company_value=p["tfr_company_value"],
        early_pension_years=p["early_pension_years"] if p["early_pension_enabled"] else 0,
        defer_to_71=p["defer_to_71"],
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/compute/base")
def compute_base(req: ComputeBaseRequest):
    try:
        expenses_raw = {
            cat: [item.model_dump() for item in items]
            for cat, items in req.expenses.items()
        }
        res = _compute_common(req.params, expenses_raw)
        return _ser({
            "tax_result": res["tax_result"],
            "pension_info": res["pension_info"],
            "pension_fund_info": res["pension_fund_info"],
            "rows": res["rows"],
            "monthly_expenses": res["monthly_expenses"],
            "net_monthly_salary": res["net_monthly_salary"],
            "etf_net_return": res["etf_net_return"],
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compute/fire")
def compute_fire(req: FireRequest):
    try:
        p = req.params.to_p()
        etf_net_return = p["expected_gross_return"] - p["ter"] - p["ivafe"]
        total_annual_contribution = (
            p["tfr_contribution"] + p["employer_contribution"] + p["personal_contribution"]
            if p["tfr_destination"] == "fund"
            else p["employer_contribution"] + p["personal_contribution"]
        )
        pension_info = req.pension_info

        base_kwargs = _fire_kwargs(p, req.net_monthly_salary, req.monthly_expenses,
                                   pension_info, total_annual_contribution, etf_net_return)

        # Run base scenario
        scenario_result = run_your_scenario(
            **base_kwargs,
            stop_working_age=p["stop_working_age"],
            state_pension_annual_net=pension_info["net_annual_nominal"],
            contribution_years=pension_info["contribution_years"],
        )

        # Earliest retirement age
        earliest = find_earliest_retirement(**base_kwargs)

        # Optimal PAC
        optimal_pac = find_optimal_pac(
            **base_kwargs,
            global_earliest_age=earliest,
        )

        # Scenario sweep (ages current+1 to 65, step 2)
        sweep = []
        from modules.fire_analysis import _pension_for_stop_age, _is_solvent_to_target
        for test_age in range(p["current_age"] + 1, 66, 2):
            contrib_yrs, pension_net, p_start = _pension_for_stop_age(
                test_stop_age=test_age,
                current_age=p["current_age"],
                age_started_working=p["age_started_working"],
                ral=p["ral"], ral_growth=p["ral_growth"],
                inps_contribution_rate=p["inps_contribution_rate"],
                gdp_revaluation_rate=p["gdp_revaluation_rate"],
                part_time=p["part_time"], part_time_salary=p["part_time_salary"],
                part_time_until_age=p["part_time_until_age"],
                net_monthly_salary=req.net_monthly_salary,
                age_joined_fund=p["age_joined_fund"],
                part_time_monthly_gross=p["part_time_monthly_gross"],
                early_pension_years=p["early_pension_years"] if p["early_pension_enabled"] else 0,
                defer_to_71=p["defer_to_71"],
            )
            sweep_rows = run_projection(
                current_age=p["current_age"], target_age=p["target_age"],
                net_monthly_salary=req.net_monthly_salary,
                monthly_expenses=req.monthly_expenses,
                age_started_working=p["age_started_working"],
                etf_value=p["etf_value"], monthly_pac=p["monthly_pac"],
                etf_net_return=etf_net_return,
                capital_gains_tax=p["capital_gains_tax"],
                bank_balance=p["bank_balance"], bank_interest=p["bank_interest"],
                emergency_fund=p["emergency_fund"], stamp_duty=p["stamp_duty"],
                pension_fund_value=p["pf_value"],
                total_annual_contribution=total_annual_contribution,
                voluntary_extra=p["voluntary_extra"],
                pension_fund_return=p["fund_return"], annuity_rate=p["annuity_rate"],
                age_joined_fund=p["age_joined_fund"],
                stop_working_age=test_age,
                part_time=p["part_time"], part_time_salary=p["part_time_salary"],
                part_time_until_age=p["part_time_until_age"],
                inflation=p["inflation"],
                state_pension_annual_net=pension_net,
                pension_start_age=p_start, contribution_years=contrib_yrs,
                part_time_monthly_gross=p["part_time_monthly_gross"],
                inps_employee_rate=p["inps_employee_rate"],
                surcharges_rate=p["surcharges_rate"],
                tfr_destination=p["tfr_destination"],
                tfr_annual_accrual=p["tfr_contribution"],
                tfr_company_value=p["tfr_company_value"],
            )
            target_row = next((r for r in sweep_rows if r["age"] == p["target_age"]), None)
            wealth = float(target_row["total_real"]) if target_row else 0.0
            solvent = _is_solvent_to_target(sweep_rows, p["target_age"])
            sweep.append({"age": test_age, "wealth": wealth, "solvent": solvent})

        return _ser({
            "scenario_result": {
                "rows": scenario_result["rows"],
                "solvent_to_target": scenario_result["solvent_to_target"],
                "assets_at_target_real": scenario_result["assets_at_target_real"],
                "effective_avg_monthly_pac": scenario_result["effective_avg_monthly_pac"],
            },
            "earliest_retirement": earliest,
            "optimal_pac": optimal_pac,
            "scenario_sweep": sweep,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compute/monte-carlo")
def compute_monte_carlo(req: MonteCarloRequest):
    try:
        p = req.params.to_p()
        etf_net_return = p["expected_gross_return"] - p["ter"] - p["ivafe"]
        total_annual_contribution = (
            p["tfr_contribution"] + p["employer_contribution"] + p["personal_contribution"]
            if p["tfr_destination"] == "fund"
            else p["employer_contribution"] + p["personal_contribution"]
        )
        pension_info = req.pension_info

        result = run_monte_carlo(
            n_simulations=p["n_simulations"],
            current_age=p["current_age"],
            target_age=p["target_age"],
            net_monthly_salary=req.net_monthly_salary,
            monthly_expenses=req.monthly_expenses,
            age_started_working=p["age_started_working"],
            etf_value=p["etf_value"],
            monthly_pac=p["monthly_pac"],
            etf_net_return=etf_net_return,
            expected_gross_return=p["expected_gross_return"],
            etf_volatility=p["etf_volatility"],
            ter=p["ter"],
            ivafe=p["ivafe"],
            capital_gains_tax=p["capital_gains_tax"],
            bank_balance=p["bank_balance"],
            bank_interest=p["bank_interest"],
            emergency_fund=p["emergency_fund"],
            stamp_duty=p["stamp_duty"],
            pension_fund_value=p["pf_value"],
            total_annual_contribution=total_annual_contribution,
            voluntary_extra=p["voluntary_extra"],
            pension_fund_return=p["fund_return"],
            annuity_rate=p["annuity_rate"],
            age_joined_fund=p["age_joined_fund"],
            stop_working_age=p["stop_working_age"],
            part_time=p["part_time"],
            part_time_salary=p["part_time_salary"],
            part_time_until_age=p["part_time_until_age"],
            inflation=p["inflation"],
            inflation_std=p["inflation_std"],
            state_pension_annual_net=pension_info["net_annual_nominal"],
            pension_start_age=pension_info["pension_age"],
            contribution_years=pension_info["contribution_years"],
            scenario=p["mc_scenario"],
            seed=42,
            part_time_monthly_gross=p["part_time_monthly_gross"],
            inps_employee_rate=p["inps_employee_rate"],
            surcharges_rate=p["surcharges_rate"],
            tfr_destination=p["tfr_destination"],
            tfr_annual_accrual=p["tfr_contribution"],
            tfr_company_value=p["tfr_company_value"],
        )
        return _ser(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compute/sensitivity")
def compute_sensitivity(req: SensitivityRequest):
    try:
        p = req.params.to_p()
        etf_net_return = p["expected_gross_return"] - p["ter"] - p["ivafe"]
        total_annual_contribution = (
            p["tfr_contribution"] + p["employer_contribution"] + p["personal_contribution"]
            if p["tfr_destination"] == "fund"
            else p["employer_contribution"] + p["personal_contribution"]
        )
        pension_info = req.pension_info

        df = run_sensitivity(
            base_etf_net_return=etf_net_return,
            base_monthly_expenses=req.monthly_expenses,
            current_age=p["current_age"],
            target_age=p["target_age"],
            net_monthly_salary=req.net_monthly_salary,
            age_started_working=p["age_started_working"],
            etf_value=p["etf_value"],
            monthly_pac=p["monthly_pac"],
            capital_gains_tax=p["capital_gains_tax"],
            bank_balance=p["bank_balance"],
            bank_interest=p["bank_interest"],
            emergency_fund=p["emergency_fund"],
            stamp_duty=p["stamp_duty"],
            pension_fund_value=p["pf_value"],
            total_annual_contribution=total_annual_contribution,
            voluntary_extra=p["voluntary_extra"],
            pension_fund_return=p["fund_return"],
            annuity_rate=p["annuity_rate"],
            age_joined_fund=p["age_joined_fund"],
            part_time=p["part_time"],
            part_time_salary=p["part_time_salary"],
            part_time_until_age=p["part_time_until_age"],
            inflation=p["inflation"],
            pension_start_age=pension_info["pension_age"],
            ral=p["ral"],
            ral_growth=p["ral_growth"],
            inps_contribution_rate=p["inps_contribution_rate"],
            gdp_revaluation_rate=p["gdp_revaluation_rate"],
            stop_working_age=p["stop_working_age"],
            part_time_monthly_gross=p["part_time_monthly_gross"],
            inps_employee_rate=p["inps_employee_rate"],
            surcharges_rate=p["surcharges_rate"],
            tfr_destination=p["tfr_destination"],
            tfr_annual_accrual=p["tfr_contribution"],
            tfr_company_value=p["tfr_company_value"],
            early_pension_years=p["early_pension_years"] if p["early_pension_enabled"] else 0,
            defer_to_71=p["defer_to_71"],
            x_var=req.x_var,
            y_var=req.y_var,
            output_metric=req.output_metric,
        )
        return {
            "matrix": df.values.tolist(),
            "x_labels": list(df.columns),
            "y_labels": list(df.index),
            "x_var": req.x_var,
            "y_var": req.y_var,
            "axis_variables": list(AXIS_VARIABLES.keys()),
            "output_metrics": OUTPUT_METRICS,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compute/npv")
def compute_npv(req: NpvRequest):
    try:
        p = req.params.to_p()
        etf_net_return = p["expected_gross_return"] - p["ter"] - p["ivafe"]
        pension_info = req.pension_info
        tax_result = calculate_net_salary(
            p["ral"], p["company_benefits"],
            p["inps_employee_rate"], p["surcharges_rate"]
        )
        pf_tax_rate = pension_fund_tax_rate(
            age_at_payout=pension_info["pension_age"],
            age_joined=p["age_joined_fund"],
        )
        discount_rate = etf_net_return
        contribution_years = p["stop_working_age"] - p["current_age"]
        dormant_years = max(0, pension_info["pension_age"] - p["stop_working_age"])
        payout_years_pf = max(1, p["target_age"] - pension_info["pension_age"])
        payout_years_etf = max(1, p["target_age"] - p["current_age"] - contribution_years)
        pension_start_years = max(0, pension_info["pension_age"] - p["current_age"])

        from modules.pension_fund import calculate_pension_fund_info
        pf_info = calculate_pension_fund_info(
            current_value=p["pf_value"],
            tfr_contribution=p["tfr_contribution"],
            employer_contribution=p["employer_contribution"],
            personal_contribution=p["personal_contribution"],
            voluntary_extra=p["voluntary_extra"],
            max_deductible=p["max_deductible"],
            fund_return=p["fund_return"],
            annuity_rate=p["annuity_rate"],
            age_joined=p["age_joined_fund"],
            taxable_income=tax_result["taxable_income"],
        )

        result = calculate_npv_comparison(
            voluntary_extra=p["voluntary_extra"],
            tax_savings_annual=pf_info["tax_savings"],
            fund_return=p["fund_return"],
            etf_net_return=etf_net_return,
            annuity_rate=p["annuity_rate"],
            pension_tax_rate=pf_tax_rate,
            discount_rate=discount_rate,
            contribution_years=contribution_years,
            dormant_years=dormant_years,
            payout_years_pf=payout_years_pf,
            payout_years_etf=payout_years_etf,
            pension_start_years=pension_start_years,
            swr=p["swr"],
            capital_gains_tax=p["capital_gains_tax"],
        )
        return _ser(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compute/scenarios")
def compute_scenarios(req: ScenariosCompareRequest):
    try:
        p_base = req.params.to_p()
        pension_info = req.pension_info
        results = []
        for sc in req.scenarios:
            etf_net = sc.etf_net_return / 100
            infl = sc.inflation / 100
            # Recalculate pension for this scenario's stop age
            sc_pension = calculate_state_pension(
                ral=sc.ral,
                ral_growth=p_base["ral_growth"],
                inps_contribution_rate=p_base["inps_contribution_rate"],
                gdp_revaluation_rate=p_base["gdp_revaluation_rate"],
                current_age=p_base["current_age"],
                age_started_working=p_base["age_started_working"],
                stop_working_age=sc.stop_working_age,
                part_time=p_base["part_time"],
                part_time_salary=p_base["part_time_salary"],
                part_time_until_age=p_base["part_time_until_age"],
                net_monthly_salary=req.net_monthly_salary,
                age_joined_fund=p_base["age_joined_fund"],
                early_pension_years=p_base["early_pension_years"] if p_base["early_pension_enabled"] else 0,
                defer_to_71=p_base["defer_to_71"],
            )
            total_ac = (
                p_base["tfr_contribution"] + p_base["employer_contribution"] + p_base["personal_contribution"]
                if p_base["tfr_destination"] == "fund"
                else p_base["employer_contribution"] + p_base["personal_contribution"]
            )
            rows = run_projection(
                current_age=p_base["current_age"],
                target_age=p_base["target_age"],
                net_monthly_salary=req.net_monthly_salary,
                monthly_expenses=sc.monthly_expenses,
                age_started_working=p_base["age_started_working"],
                etf_value=p_base["etf_value"],
                monthly_pac=sc.monthly_pac,
                etf_net_return=etf_net,
                capital_gains_tax=p_base["capital_gains_tax"],
                bank_balance=p_base["bank_balance"],
                bank_interest=p_base["bank_interest"],
                emergency_fund=p_base["emergency_fund"],
                stamp_duty=p_base["stamp_duty"],
                pension_fund_value=p_base["pf_value"],
                total_annual_contribution=total_ac,
                voluntary_extra=p_base["voluntary_extra"],
                pension_fund_return=p_base["fund_return"],
                annuity_rate=p_base["annuity_rate"],
                age_joined_fund=p_base["age_joined_fund"],
                stop_working_age=sc.stop_working_age,
                part_time=p_base["part_time"],
                part_time_salary=p_base["part_time_salary"],
                part_time_until_age=p_base["part_time_until_age"],
                inflation=infl,
                state_pension_annual_net=sc_pension["net_annual_nominal"],
                pension_start_age=sc_pension["pension_age"],
                contribution_years=sc_pension["contribution_years"],
                part_time_monthly_gross=p_base["part_time_monthly_gross"],
                inps_employee_rate=p_base["inps_employee_rate"],
                surcharges_rate=p_base["surcharges_rate"],
                tfr_destination=p_base["tfr_destination"],
                tfr_annual_accrual=p_base["tfr_contribution"],
                tfr_company_value=p_base["tfr_company_value"],
            )
            entry = {"label": sc.label, "rows": rows}
            if req.run_mc:
                mc = run_monte_carlo(
                    n_simulations=min(p_base["n_simulations"], 500),
                    current_age=p_base["current_age"],
                    target_age=p_base["target_age"],
                    net_monthly_salary=req.net_monthly_salary,
                    monthly_expenses=sc.monthly_expenses,
                    age_started_working=p_base["age_started_working"],
                    etf_value=p_base["etf_value"],
                    monthly_pac=sc.monthly_pac,
                    etf_net_return=etf_net,
                    expected_gross_return=sc.etf_net_return / 100 + p_base["ter"] + p_base["ivafe"],
                    etf_volatility=p_base["etf_volatility"],
                    ter=p_base["ter"],
                    ivafe=p_base["ivafe"],
                    capital_gains_tax=p_base["capital_gains_tax"],
                    bank_balance=p_base["bank_balance"],
                    bank_interest=p_base["bank_interest"],
                    emergency_fund=p_base["emergency_fund"],
                    stamp_duty=p_base["stamp_duty"],
                    pension_fund_value=p_base["pf_value"],
                    total_annual_contribution=total_ac,
                    voluntary_extra=p_base["voluntary_extra"],
                    pension_fund_return=p_base["fund_return"],
                    annuity_rate=p_base["annuity_rate"],
                    age_joined_fund=p_base["age_joined_fund"],
                    stop_working_age=sc.stop_working_age,
                    part_time=p_base["part_time"],
                    part_time_salary=p_base["part_time_salary"],
                    part_time_until_age=p_base["part_time_until_age"],
                    inflation=infl,
                    inflation_std=p_base["inflation_std"],
                    state_pension_annual_net=sc_pension["net_annual_nominal"],
                    pension_start_age=sc_pension["pension_age"],
                    contribution_years=sc_pension["contribution_years"],
                    scenario=p_base["mc_scenario"],
                    seed=42,
                    part_time_monthly_gross=p_base["part_time_monthly_gross"],
                    inps_employee_rate=p_base["inps_employee_rate"],
                    surcharges_rate=p_base["surcharges_rate"],
                    tfr_destination=p_base["tfr_destination"],
                    tfr_annual_accrual=p_base["tfr_contribution"],
                    tfr_company_value=p_base["tfr_company_value"],
                )
                entry["mc"] = mc
            results.append(entry)
        return _ser({"results": results})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ETF endpoints ────────────────────────────────────────────────────────────

@app.get("/api/etf")
def get_etfs(
    q: str = Query(default=""),
    asset_classes: Optional[str] = Query(default=None),
    issuers: Optional[str] = Query(default=None),
    domiciles: Optional[str] = Query(default=None),
    dist_policies: Optional[str] = Query(default=None),
):
    try:
        ac_list = [x for x in asset_classes.split(",") if x] if asset_classes else None
        is_list = [x for x in issuers.split(",") if x] if issuers else None
        dom_list = [x for x in domiciles.split(",") if x] if domiciles else None
        dp_list = [x for x in dist_policies.split(",") if x] if dist_policies else None
        etfs = search_etfs(
            query=q, asset_classes=ac_list, issuers=is_list,
            domiciles=dom_list, dist_policies=dp_list,
        )
        return {
            "etfs": etfs,
            "asset_classes": get_asset_classes(),
            "issuers": get_issuers(),
            "domiciles": get_domiciles(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Simple in-memory cache for ETF live data (1-hour TTL)
_etf_live_cache: dict = {}
_ETF_CACHE_TTL = 3600


@app.get("/api/etf/live/{ticker}")
def get_etf_live(ticker: str):
    now = time.time()
    if ticker in _etf_live_cache:
        cached_at, data = _etf_live_cache[ticker]
        if now - cached_at < _ETF_CACHE_TTL:
            return data
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        info = t.info or {}

        hist = t.history(period="5y", interval="1mo")
        history_data = {
            "dates": [str(d.date()) for d in hist.index],
            "closes": [float(v) for v in hist["Close"].values] if "Close" in hist.columns else [],
        }

        funds_result = {"top_holdings": None, "sector_weightings": None, "asset_classes": None}
        try:
            fd = t.funds_data
            if fd.top_holdings is not None and not fd.top_holdings.empty:
                funds_result["top_holdings"] = fd.top_holdings.to_dict(orient="records")
            sector = fd.sector_weightings
            if sector is not None:
                funds_result["sector_weightings"] = sector if isinstance(sector, list) else (
                    [{"type": k, "recentTW": v} for k, v in sector.items()] if isinstance(sector, dict) else None
                )
            ac = fd.asset_classes
            if ac is not None:
                funds_result["asset_classes"] = ac if isinstance(ac, dict) else (
                    ac.to_dict() if hasattr(ac, "to_dict") else None
                )
        except Exception:
            pass

        result = {
            "info": {
                "aum": info.get("totalAssets"),
                "nav": info.get("navPrice") or info.get("previousClose"),
                "currency": info.get("currency", ""),
                "yield_12m": info.get("yield"),
                "ytd_return": info.get("ytdReturn"),
                "wk52_hi": info.get("fiftyTwoWeekHigh"),
                "wk52_lo": info.get("fiftyTwoWeekLow"),
                "live_ter": info.get("annualReportExpenseRatio"),
            },
            "history": history_data,
            "funds": funds_result,
        }
        result = _ser(result)
        _etf_live_cache[ticker] = (now, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
