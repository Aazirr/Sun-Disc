export type HealthResponse = {
  status: string;
  service: string;
};

const API_BASE_URL = "http://localhost:5000";

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health request failed: ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
