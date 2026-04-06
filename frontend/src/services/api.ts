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
  screenshot_path: string | null;
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

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:5000";

function buildApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const endpoint = buildApiUrl("/api/health");

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const failureBody = (await response.text()) || "Unknown error";
      throw new Error(`Health request failed: ${response.status} - ${failureBody}`);
    }

    return response.json() as Promise<HealthResponse>;
  } catch (error) {
    throw new Error(`Health fetch failed for ${endpoint}. Check API URL, CORS, and backend logs. Original error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createRun(payload: CreateRunRequest): Promise<CreateRunResponse> {
  const response = await fetch(buildApiUrl("/api/tests/run"), {
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
  const endpoint = buildApiUrl("/api/runs");

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const failureBody = (await response.text()) || "Unknown error";
      throw new Error(`Fetch runs request failed: ${response.status} - ${failureBody}`);
    }

    const data = (await response.json()) as ListRunsResponse;
    return data.items;
  } catch (error) {
    throw new Error(`Fetch runs failed for ${endpoint}. Original error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getRunScreenshotUrl(runId: number): string {
  return buildApiUrl(`/api/runs/${runId}/screenshot`);
}
