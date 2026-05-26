# GridWise Frontend

Next.js UI for GridWise, an independent portfolio prototype for AI-assisted growth and mobility readiness planning.

## Run Locally

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Optional Planning Copilot Setup

- Copy `.env.example` to `.env.local`.
- Set `OPENAI_API_KEY` if you want live copilot responses.
- If no key is provided, the Planning Copilot uses deterministic fallback guidance.
- Evidence snippets are read from the root `data/evidence/` directory.

## Notes

- The app supports City and Developer lenses.
- Mobility readiness is a first-class score dimension alongside market, infrastructure, policy, and strategic readiness.
- City priorities show transparent workflow weights for public-sector prioritization.
- The Developer project profile feeds the feasibility-oriented scoring lens.
- The Planning Copilot uses the selected area, active lens, scores, evidence, and recommended actions.
- This uses sample planning data and is not an official municipal planning tool.
