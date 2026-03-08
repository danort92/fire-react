import { create } from 'zustand';
import type { ScenarioParams, ExpensesState, BaseComputeResult } from '../types';
import { DEFAULT_PARAMS, DEFAULT_EXPENSES } from '../types';

interface FireStore {
  params: ScenarioParams;
  setParams: (patch: Partial<ScenarioParams>) => void;
  expenses: ExpensesState;
  setExpenses: (expenses: ExpensesState) => void;
  displayReal: boolean;
  toggleDisplayReal: () => void;
  baseResult: BaseComputeResult | null;
  setBaseResult: (result: BaseComputeResult) => void;
}

export const useFireStore = create<FireStore>((set) => ({
  params: DEFAULT_PARAMS,
  setParams: (patch) => set((s) => ({ params: { ...s.params, ...patch } })),
  expenses: DEFAULT_EXPENSES,
  setExpenses: (expenses) => set({ expenses }),
  displayReal: true,
  toggleDisplayReal: () => set((s) => ({ displayReal: !s.displayReal })),
  baseResult: null,
  setBaseResult: (result) => set({ baseResult: result }),
}));
