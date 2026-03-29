import urllib.request, json

token = "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"
h = {"Authorization": f"token {token}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
repo = "buinhatducanh/LOOP"

def gh_get(path):
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}{path}", headers=h)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# Get CI workflow
wfs = gh_get("/actions/workflows")
ci_wf = next(w for w in wfs["workflows"] if w["name"] == "CI")

# Get CI #5 jobs
ci_runs = gh_get(f"/actions/workflows/{ci_wf['id']}/runs")
ci_run5 = next(r for r in ci_runs["workflow_runs"] if r["run_number"] == 5)
print(f"CI #5 | {ci_run5['head_sha'][:8]} | {ci_run5['status']} | {ci_run5.get('conclusion') or '---'}")

ci5_jobs = gh_get(f"/actions/runs/{ci_run5['id']}/jobs")
for job in ci5_jobs.get("jobs", []):
    fname = f"D:\\LOOP_COMPANY\\LOOP\\temp_job_{job['name'].replace(' ','_').replace('&','')}.json"
    with open(fname, "w", encoding="utf-8") as f:
        json.dump(job, f, indent=2)
    conc = job.get("conclusion") or "---"
    print(f"\n  Job: {job['name']} | {conc}")
    for step in job.get("steps", []):
        sc = step.get("conclusion") or "---"
        sn = step.get("status") or ""
        print(f"    Step {step['number']:>2}: {step['name']} | {sn} | {sc}")

# Check Deploy workflow run #5
deploy_wf = next(w for w in wfs["workflows"] if w["name"] == "Deploy")
deploy_runs = gh_get(f"/actions/workflows/{deploy_wf['id']}/runs")
dep5 = next((r for r in deploy_runs["workflow_runs"] if r["run_number"] == 5), None)
if dep5:
    print(f"\nDeploy #5 | {dep5['head_sha'][:8]} | {dep5['status']} | {dep5.get('conclusion') or '---'}")
    d5_jobs = gh_get(f"/actions/runs/{dep5['id']}/jobs")
    for j in d5_jobs.get("jobs", []):
        conc = j.get("conclusion") or "---"
        print(f"  Job: {j['name']} | {conc}")
        for s in j.get("steps", []):
            sc = s.get("conclusion") or "---"
            if sc == "failure":
                print(f"    FAIL: {s['name']}")
