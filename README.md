# Join Quest

Join Quest is a gamified React + TypeScript web app for teaching data science students how SQL-style table relationships translate into real `pandas` work in Python.

Students play as an analyst answering stakeholder requests across:

- e-commerce operations
- HR analytics
- school analytics

The app teaches:

- SQL-to-pandas loading with `pd.read_sql(...)`
- join keys and relationship reasoning
- `merge()` with practical inner vs left join choices
- grouped summaries and multi-table business questions
- analyst-style interpretation after the code runs

## Experience

Each mission includes:

- a business request panel with why the question matters
- an interactive table explorer with schema, sample rows, and key hints
- a relationship map for join planning
- a Python editor powered by a Pyodide worker
- output previews for `merged` and `result`
- interpretation prompts, hints, and scoring

Progress is saved locally in the browser with unlocks, best scores, attempts, and hint usage.

## Stack

- React 19
- Vite
- TypeScript
- React Router
- CodeMirror 6
- Pyodide in a dedicated Web Worker
- Vitest + Testing Library
- Playwright smoke script

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL and start with `Boot the Warehouse Feed`.

## Scripts

```bash
npm run build
npm run lint
npm run test:run
npm run test:e2e
```

`test:e2e` runs a browser smoke flow that opens the onboarding mission, waits for Pyodide to initialize, grades the mission, and checks the progress screen.

## Deploy to Cloud Run

Join Quest is a static Vite SPA, so production deploys use `nginx` to serve the built files with an SPA fallback for React Router routes.

### Local container check

```bash
docker build -t join-quest .
docker run --rm -p 8080:8080 join-quest
```

Open `http://localhost:8080` and also test a deep link such as `http://localhost:8080/missions/sql-load-warehouse`.

### One-time Google Cloud setup

Set your project values locally:

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export PROJECT_NUMBER="YOUR_PROJECT_NUMBER"
export REGION="us-central1"
export REPOSITORY_NAME="join-quest"
export SERVICE_NAME="join-quest"
export SERVICE_ACCOUNT_NAME="github-cloud-run-deployer"
export GITHUB_ORG="dhar174"
export GITHUB_REPO="Insight-Hunter-EDA-Detective"
```

Enable the required APIs in your target project:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com
```

Create an Artifact Registry Docker repository if you do not already have one:

```bash
gcloud artifacts repositories create "${REPOSITORY_NAME}" \
  --repository-format=docker \
  --location="${REGION}"
```

Create a deploy service account:

```bash
gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
  --display-name="GitHub Cloud Run Deployer"
```

Grant the minimum roles used by this workflow:

```bash
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Create a GitHub Actions Workload Identity Pool and Provider:

```bash
gcloud iam workload-identity-pools create "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

export WORKLOAD_IDENTITY_POOL_ID="$(gcloud iam workload-identity-pools describe github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --format="value(name)")"

export WORKLOAD_IDENTITY_PROVIDER_ID="github-actions"

gcloud iam workload-identity-pools providers create-oidc "${WORKLOAD_IDENTITY_PROVIDER_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub Actions Provider for ${GITHUB_REPO}" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == '${GITHUB_ORG}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

gcloud iam service-accounts add-iam-policy-binding \
  "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}"

export WORKLOAD_IDENTITY_PROVIDER="$(gcloud iam workload-identity-pools providers describe "${WORKLOAD_IDENTITY_PROVIDER_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --format="value(name)")"
```

### GitHub repository settings

Add these repository variables in GitHub:

- `GCP_PROJECT_ID`
- `GCP_REGION` with value `us-central1` unless you want another region
- `GCP_ARTIFACT_REPOSITORY` with value `join-quest` unless you created another repo
- `CLOUD_RUN_SERVICE` with value `join-quest`

Add these as either repository variables or repository secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` with the `WORKLOAD_IDENTITY_PROVIDER` value printed above
- `GCP_SERVICE_ACCOUNT` with the value `${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com`

The workflow uses keyless auth through OIDC and does not need a JSON service-account key.

### GitHub Actions deploy flow

The workflow in `.github/workflows/deploy-cloud-run.yml` runs on pushes to `main` and on manual dispatch. It will:

1. install dependencies
2. run lint, unit tests, and a production build
3. authenticate to Google Cloud with OIDC
4. build and push a container image to Artifact Registry
5. deploy the image to Cloud Run

The deployed service is public and listens on port `8080`.

### Rollback

If a release is bad, either:

- redeploy a prior revision from the Cloud Run console, or
- run `gcloud run services update-traffic` to point traffic at an earlier revision, or
- temporarily disable the GitHub Actions workflow until the next fix is ready

### Production note

Pyodide still loads from `cdn.jsdelivr.net` in the browser, so production uptime depends partly on that CDN in v1.

## Notes

- The Python runtime is fully client-side. There is no backend or user account system in v1.
- Mission grading uses hidden expected outputs plus rubric-style interpretation checks; it does not use an LLM.
- Vite currently warns that the Pyodide bundle is large. That is expected for this version because the app ships a browser Python runtime.
