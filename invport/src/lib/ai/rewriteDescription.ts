import { apiFetchJson } from "@/lib/apiClient";

export type RewriteRequest = {
  description: string;
  previewOnly?: boolean;
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
};

export type RewriteResponse = {
  revisedText: string;
  confidence: number; // 0-1
  warnings?: string[];
  steps?: string[]; // optional staged rationale
  prompt?: string; // present when previewOnly=true
  status: 'complete' | 'error';
  stages: Array<{ name: string; at: string }>;
  promptBuilt?: string; // present when previewOnly=true
  rewrittenText?: string; // present when previewOnly=false
  meta?: { maxWords: number };
  error?: { message: string; details?: string };
};

export async function rewriteDescription(
  req: RewriteRequest,
  opts?: { signal?: AbortSignal }
): Promise<RewriteResponse> {
  const result = await apiFetchJson<RewriteResponse>("/ai/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: opts?.signal,
  });
  return result;
}
