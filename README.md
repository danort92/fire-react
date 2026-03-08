# FIRE Planning Tool — React + FastAPI

React frontend + FastAPI backend port of the Streamlit FIRE Planning Tool.

## Structure

```
fire_react/
├── backend/          # FastAPI (Python)
│   ├── main.py       # All API endpoints
│   ├── models.py     # Pydantic request models
│   └── requirements.txt
└── frontend/         # React + TypeScript + Vite
    ├── src/
    │   ├── App.tsx
    │   ├── types/index.ts
    │   ├── api/client.ts
    │   ├── store/useStore.ts
    │   ├── components/
    │   │   ├── Sidebar.tsx       # All ~50 sidebar inputs
    │   │   ├── MetricCard.tsx
    │   │   └── tabs/             # 9 tab components
    │   └── plotly-override.d.ts  # Plotly type shims
    └── package.json
```

## Running

**Backend** (requires Python modules from `../fire_app`):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/compute/base` | Tax + pension + projection (called on every param change) |
| POST | `/api/compute/fire` | Earliest retirement age, optimal PAC, scenario sweep |
| POST | `/api/compute/monte-carlo` | Monte Carlo simulation (1 000 runs) |
| POST | `/api/compute/sensitivity` | 5×5 sensitivity heatmap |
| POST | `/api/compute/npv` | NPV: Pension Fund vs ETF |
| POST | `/api/compute/scenarios` | Multi-scenario comparison with optional MC |
| GET  | `/api/etf` | ETF catalogue search |
| GET  | `/api/etf/live/{ticker}` | Live yfinance data (1 h cache) |
| GET  | `/api/health` | Health check |
