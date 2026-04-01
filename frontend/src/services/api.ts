export type HealthResponse = {
  status: string;
  service: string;
};

export type TestRun = {
  id: number;
  test_name: string;
  status: "QUEUED" | "RUNNING" | "PASS" | "FAIL";
  base_url: string | null;
  environment: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
};

export type CreateRunRequest = {
  test_name: string;
  base_url?: string;
  environment?: string;
  username?: string;
  password?: string;
};

export type CreateRunResponse = {
  run_id: number;
  status: string;
  error_message?: string | null;
};

type ListRunsResponse = {
  items: TestRun[];
};

const API_BASE_URL = "http://localhost:5000";

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health request failed: ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

export async function createRun(payload: CreateRunRequest): Promise<CreateRunResponse> {
  const response = await fetch(`${API_BASE_URL}/api/tests/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const failureBody = (await response.text()) || "Unknown error";
    throw new Error(`Create run request failed: ${response.status} - ${failureBody}`);
  }

  return response.json() as Promise<CreateRunResponse>;
}

export async function fetchRuns(): Promise<TestRun[]> {
  const response = await fetch(`${API_BASE_URL}/api/runs`);

  if (!response.ok) {
    throw new Error(`Fetch runs request failed: ${response.status}`);
  }

  const data = (await response.json()) as ListRunsResponse;
  return data.items;
}
