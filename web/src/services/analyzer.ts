/**
 * Analyzer service client — HTTP calls to FastAPI analyzer microservice.
 * Types mirror api/schemas/analyze.py and api/schemas/test_points.py exactly.
 */

const ANALYZER_BASE_URL =
  process.env.NEXT_PUBLIC_ANALYZER_URL || "http://localhost:8001";

// ─── /analyze types ──────────────────────────────────

export interface AnalyzeContext {
  include_modules?: string[];
}

export interface AnalyzeRequest {
  project_id: string;
  requirement_text: string;
  context?: AnalyzeContext;
}

export interface AffectedModule {
  node_id: string;
  node_name: string;
  node_path: string;
  impact_level: "high" | "medium" | "low";
  reason: string;
}

export interface AnalysisMetadata {
  model: string;
  tokens_used: number;
  analysis_time_ms: number;
}

export interface AnalyzeResponse {
  affected_modules: AffectedModule[];
  completeness_issues: string[];
  suggestions: string[];
  metadata: AnalysisMetadata;
}

// ─── /test-points types ──────────────────────────────

export interface TestPointsRequest {
  project_id: string;
  requirement_text: string;
  affected_modules: string[];
  test_depth: "smoke" | "standard" | "comprehensive";
}

export interface TestPoint {
  id: string;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2";
  category: "functional" | "boundary" | "exception" | "performance";
  related_module: string;
}

export interface CoverageSummary {
  total: number;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
}

export interface TestPointsResponse {
  test_points: TestPoint[];
  coverage_summary: CoverageSummary;
}

// ─── /health types ───────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  db_connected: boolean;
}

// ─── Error wrapper ───────────────────────────────────

export type AnalyzerResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── API functions ───────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<AnalyzerResult<T>> {
  try {
    const resp = await fetch(`${ANALYZER_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${text}` };
    }
    const data = (await resp.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `分析服务不可用: ${(e as Error).message}` };
  }
}

export async function analyzeRequirement(
  req: AnalyzeRequest,
): Promise<AnalyzerResult<AnalyzeResponse>> {
  return post<AnalyzeResponse>("/api/analyze", req);
}

export async function generateTestPoints(
  req: TestPointsRequest,
): Promise<AnalyzerResult<TestPointsResponse>> {
  return post<TestPointsResponse>("/api/test-points", req);
}

export async function checkHealth(): Promise<AnalyzerResult<HealthResponse>> {
  try {
    const resp = await fetch(`${ANALYZER_BASE_URL}/health/`);
    if (!resp.ok) {
      return { ok: false, error: `HTTP ${resp.status}` };
    }
    const data = (await resp.json()) as HealthResponse;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `分析服务不可用: ${(e as Error).message}` };
  }
}
