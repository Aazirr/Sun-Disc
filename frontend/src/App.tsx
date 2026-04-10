import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import {
  createRun,
  fetchHealth,
  fetchRuns,
  getRunScreenshotUrl,
  type HealthResponse,
  type TestRun,
} from "./services/api";

type HealthState = "loading" | "online" | "offline";

function healthBadgeClass(state: HealthState): string {
  if (state === "online") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (state === "offline") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}

function runStatusClass(status: TestRun["status"]): string {
  if (status === "PASS") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "FAIL") {
    return "bg-rose-100 text-rose-700";
  }
  if (status === "RUNNING") {
    return "bg-sky-100 text-sky-700";
  }
  return "bg-slate-200 text-slate-700";
}

function App() {
  const [healthState, setHealthState] = useState<HealthState>("loading");
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string>("");
  const [runsError, setRunsError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [testName, setTestName] = useState<string>("login_test");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [environment, setEnvironment] = useState<string>("staging");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadHealth() {
      try {
        const data = await fetchHealth();
        if (!isMounted) {
          return;
        }
        setHealthData(data);
        setHealthState("online");
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error("Health load failed", err);
        setHealthState("offline");
        setHealthError(err instanceof Error ? err.message : "Unknown health check error");
      }
    }

    async function loadRuns() {
      try {
        const data = await fetchRuns();
        if (!isMounted) {
          return;
        }
        setRuns(data);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error("Run list load failed", err);
        setRunsError(err instanceof Error ? err.message : "Unknown runs fetch error");
      }
    }

    void loadHealth();
    void loadRuns();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRunSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await createRun({
        test_name: testName,
        base_url: baseUrl || undefined,
        environment: environment || undefined,
        username: username || undefined,
        password: password || undefined,
      });

      const updatedRuns = await fetchRuns();
      setRuns(updatedRuns);
    } catch (err) {
      console.error("Run submit failed", err);
      setSubmitError(err instanceof Error ? err.message : "Unknown run create error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_55%)] px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-panel backdrop-blur md:p-8">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Sun Disc</h1>
        <p className="mt-1 text-sm font-medium uppercase tracking-[0.14em] text-slate-500">QA Automation Dashboard</p>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">Backend Health</span>
          <span
            className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-extrabold tracking-wider ${healthBadgeClass(healthState)}`}
          >
            {healthState.toUpperCase()}
          </span>
        </div>

        {healthData && (
          <p className="mt-3 text-sm text-slate-600">
            Service: <strong>{healthData.service}</strong> | Status: <strong>{healthData.status}</strong>
          </p>
        )}

        {healthError && <p className="mt-2 text-sm text-rose-700">{healthError}</p>}

        <hr className="my-6 border-slate-200" />

        <h2 className="mb-3 text-xl font-bold text-slate-800">Run Test</h2>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleRunSubmit}>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Test Name
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              value={testName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTestName(event.target.value)}
              placeholder="login_test"
              required
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Base URL
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              value={baseUrl}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Environment
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              value={environment}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEnvironment(event.target.value)}
              placeholder="staging"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Username (optional)
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              value={username}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
              placeholder="qa@example.com"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Password (optional)
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              placeholder="******"
            />
          </label>

          <button
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Run Test"}
          </button>
        </form>

        {submitError && <p className="mt-2 text-sm text-rose-700">{submitError}</p>}

        <hr className="my-6 border-slate-200" />

        <h2 className="mb-3 text-xl font-bold text-slate-800">Recent Runs</h2>
        {runsError && <p className="mb-2 text-sm text-rose-700">{runsError}</p>}
        {runs.length === 0 ? (
          <p className="text-sm text-slate-600">No test runs yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Test</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Environment</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Duration</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Created</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Screenshot</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-slate-200 bg-white">
                    <td className="px-3 py-2 text-sm text-slate-700">{run.id}</td>
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">{run.test_name}</td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide ${runStatusClass(run.status)}`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">{run.environment || "-"}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{run.duration_ms !== null ? `${run.duration_ms} ms` : "-"}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{run.created_at}</td>
                    <td className="px-3 py-2 text-sm">
                      {run.screenshot_path ? (
                        <a
                          className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
                          href={getRunScreenshotUrl(run.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="max-w-[260px] px-3 py-2 text-sm text-rose-700 break-words">{run.error_message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
