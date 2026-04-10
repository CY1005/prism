/**
 * Search service client — HTTP calls to FastAPI search endpoints.
 * Types mirror api/schemas/search.py exactly.
 */

const ANALYZER_BASE_URL =
  process.env.ANALYZER_URL || "http://localhost:8001";

export interface SearchResultItem {
  id: string;
  type: "node" | "dimension" | "knowledge";
  title: string;
  content_snippet: string;
  project_id: string | null;
  project_name: string | null;
  node_path: string | null;
  dimension_type: string | null;
  relevance: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
}

export type SearchResult =
  | { ok: true; data: SearchResponse }
  | { ok: false; error: string };

export async function searchUnified(
  q: string,
  projectId?: string,
  limit?: number,
): Promise<SearchResult> {
  try {
    const params = new URLSearchParams({ q });
    if (projectId) params.set("project_id", projectId);
    if (limit) params.set("limit", String(limit));

    const resp = await fetch(
      `${ANALYZER_BASE_URL}/search/unified?${params.toString()}`,
    );
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${text}` };
    }
    const data = (await resp.json()) as SearchResponse;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `搜索服务不可用: ${(e as Error).message}` };
  }
}
