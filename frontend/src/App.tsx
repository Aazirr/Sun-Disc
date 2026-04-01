import { useEffect, useState } from "react";

import { fetchHealth, type HealthResponse } from "./services/api";

type HealthState = "loading" | "online" | "offline";

function App() {
  const [healthState, setHealthState] = useState<HealthState>("loading");
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string>("");

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
        setHealthState("offline");
        setError(err instanceof Error ? err.message : "Unknown health check error");
      }
    }

    void loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

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

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

export default App;
