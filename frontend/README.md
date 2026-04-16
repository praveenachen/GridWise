# Frontend

This is the Next.js UI for the Growth Readiness Dashboard.

## Run Locally
```powershell
npm run dev
```

## Optional Assistant Setup
- Copy `.env.example` to `.env.local`
- Set `OPENAI_API_KEY` if you want live assistant responses
- If no key is provided, the assistant falls back to deterministic guidance
- The assistant now reads grounded policy excerpts from `data/evidence/`

## Notes
- The dashboard supports City and Developer lenses.
- City priorities are shown as a read-only dropdown rather than sliders.
- The Developer project profile lives inside the assistant sidebar and feeds the feasibility score.
- The assistant sidebar uses the same selected area and lens context as the main UI.
