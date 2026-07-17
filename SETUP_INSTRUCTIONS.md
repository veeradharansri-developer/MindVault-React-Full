# MindVault AI - Full React + FastAPI Version

This replaces the Streamlit app. All 3 features are wired up:
Ask, Risk Check, and Insights Dashboard - through a real REST API and a
real React frontend.

## Folder layout expected

    your-project/
      backend_api/
        main.py
        retriever.py
        reasoning.py
        experts.py
        utils/
          risk_analyzer.py
          knowledge_gap.py
        hr_docs/     <- copy your real hr_docs/ folder here
        data/        <- copy your real data/ folder here (embeddings.npy, metadata.pkl)
      frontend_react/
        src/
          App.jsx
          api.js
          styles.js
          components/
            AskTab.jsx
            RiskTab.jsx
            InsightsTab.jsx

## 1. Run the FastAPI backend

    cd backend_api
    pip install fastapi uvicorn groq sentence-transformers numpy
    export GROQ_API_KEY="gsk_your_real_key"      # Linux/macOS
    $env:GROQ_API_KEY="gsk_your_real_key"        # Windows PowerShell

    uvicorn main:app --reload --port 8000

Confirm it's alive: open http://localhost:8000/api/health
You should see {"status":"ok","documents_indexed": <some number > 0>}.
If documents_indexed is 0, your data/ folder is missing embeddings.npy
and metadata.pkl - copy them from your original project's backend/data/.

## 2. Run the React frontend

In a SECOND terminal:

    cd frontend_react
    npm install
    npm run dev

Open the URL it prints (usually http://localhost:5173).

## 3. Test all three tabs

- Ask MindVault: type a question, check answer + confidence + sources + experts
- Risk Check: describe a situation (e.g. "planning a layoff in engineering"),
  check it returns a matched past report + risk summary
- Insights Dashboard: click Refresh, confirm document count, query count,
  expert table, and gap log all display

## Notes on this version vs the Streamlit version

- Session state (query count, knowledge gaps) is stored in-memory on the
  FastAPI server, not per-browser-session. It resets if you restart
  uvicorn. This is fine for a single-demo hackathon presentation.
- Deployment: this is NOT yet configured for cloud deployment (Streamlit
  Community Cloud doesn't run FastAPI/React this way). If you need a live
  URL and not just localhost, that is a separate, bigger step - do this
  well before your actual deadline, not last minute.
- If you present live from localhost, that's normal and fine for a
  hackathon demo - just be ready to explain both servers are running
  locally on your machine.

## If something breaks

- CORS error in browser console: confirm FastAPI is on port 8000 and
  React on port 5173.
- "No indexed documents found": copy embeddings.npy + metadata.pkl into
  backend_api/data/.
- 400 error about API key: set GROQ_API_KEY before starting uvicorn, or
  type it into the password field in the React UI.
- Insights tab shows all zeros: that's correct until you've asked at
  least one question in the Ask tab during this server session.
