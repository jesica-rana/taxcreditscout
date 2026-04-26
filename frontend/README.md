# Tax Credit Finder — Frontend (Vite)

React + Vite app for the tax credit quiz UI. Talks to the Next.js agent pipeline at `localhost:3000` via a Vite dev proxy.

## Run

```bash
# 1. Start the agent pipeline (separate terminal)
cd ~/tax-credit-finder/taxcreditscout && npm run dev    # http://localhost:3000

# 2. Start this UI
npm install
npm run dev                                              # http://localhost:5173
```

Vite proxies `/api/*` → `http://localhost:3000/api/*`, so the quiz POSTs straight through to the real 4-stage agent pipeline.

## Flow

```
Landing (/)  →  Quiz (/quiz)  →  Loading (/loading)  →  Results (/results)
                store sessionStorage  POST /api/intake     read sessionStorage
                                      runs 4 agents
```

`Loading.jsx` calls `runIntake(answers)` from `src/lib/api.js`, which maps the quiz schema to the Next.js `RawIntake` shape. The full report is stashed in `sessionStorage` under `taxCreditReport` and rendered on `/results`.

## Folder structure

```
frontend/
├── src/
│   ├── App.jsx                react-router routes
│   ├── main.jsx               entry
│   ├── index.css, App.css     styles
│   ├── lib/
│   │   └── api.js             quiz → RawIntake mapping + fetch wrapper
│   └── pages/
│       ├── Landing.jsx
│       ├── Quiz.jsx
│       ├── Loading.jsx        runs the pipeline, shows live stages
│       └── Results.jsx        renders the real report
├── agents/                    build-time JSX generators (Python, optional)
│   ├── AGENTS.md              the design rules these agents follow
│   ├── ui_agent.py            v1
│   ├── ui_agent_v2.py         v2 with auto-fix loop
│   ├── ui_research_agent.py   research-only agent
│   ├── ui_build_agent.py      build-only agent
│   └── agent_memory.json      previous research outputs
├── vite.config.js             includes /api proxy → :3000
├── package.json
└── public/, index.html
```

## Build-time agents (optional)

The Python files in `agents/` are **build-time JSX generators** — they call OpenAI to research and write React components into `src/pages/`. They do **not** run at request time.

```bash
cd agents
source ../venv/bin/activate     # uses the existing venv at frontend/venv
python ui_agent_v2.py           # regenerates the pages from AGENTS.md rules
```

The runtime agents (the 4-stage pipeline that actually finds credits) live in the Next.js app at `~/tax-credit-finder/taxcreditscout/lib/`.
