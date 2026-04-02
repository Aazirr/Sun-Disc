import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import {
  createRun,
  fetchHealth,
  fetchRuns,
  type HealthResponse,
  type TestRun,
} from "./services/api";

type HealthState = "loading" | "online" | "offline";

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
    <main className="page">
      <section className="card">
        <h1>Sun Disc</h1>
        <p>QA Automation Dashboard</p>

        <div className="health-row">
          <span className="label">Backend Health</span>
          <span className={`badge ${healthState}`}>{healthState.toUpperCase()}</span>
        </div>

        {healthData && (
          <p className="details">
            Service: <strong>{healthData.service}</strong> | Status: <strong>{healthData.status}</strong>
          </p>
        )}

        {healthError && <p className="error">{healthError}</p>}

        <hr className="separator" />

        <h2>Run Test</h2>
        <form className="run-form" onSubmit={handleRunSubmit}>
          <label>
            Test Name
            <input
              value={testName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTestName(event.target.value)}
              placeholder="login_test"
              required
            />
          </label>

          <label>
            Base URL
            <input
              value={baseUrl}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label>
            Environment
            <input
              value={environment}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEnvironment(event.target.value)}
              placeholder="staging"
            />
          </label>

          <label>
            Username (optional)
            <input
              value={username}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
              placeholder="qa@example.com"
            />
          </label>

          <label>
            Password (optional)
            <input
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              placeholder="******"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Run Test"}
          </button>
        </form>

        {submitError && <p className="error">{submitError}</p>}

        <hr className="separator" />

        <h2>Recent Runs</h2>
        {runsError && <p className="error">{runsError}</p>}
        {runs.length === 0 ? (
          <p className="details">No test runs yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Test</th>
                  <th>Status</th>
                  <th>Environment</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>{run.id}</td>
                    <td>{run.test_name}</td>
                    <td>
                      <span className={`run-status ${run.status.toLowerCase()}`}>{run.status}</span>
                    </td>
                    <td>{run.environment || "-"}</td>
                    <td>{run.duration_ms !== null ? `${run.duration_ms} ms` : "-"}</td>
                    <td>{run.created_at}</td>
                    <td className="error-cell">{run.error_message || "-"}</td>
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
