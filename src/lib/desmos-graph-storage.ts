import type { DesmosGraphState } from "@/src/data/desmos-example-graphs";

export type StoredDesmosGraph = {
  id: string;
  title: string;
  state: DesmosGraphState;
  savedAt: string;
  attemptId?: string;
};

const LIBRARY_KEY = "desmos_graph_library";

export function listSavedGraphs(): StoredDesmosGraph[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as StoredDesmosGraph[];
    return Array.isArray(list)
      ? list.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
        )
      : [];
  } catch {
    return [];
  }
}

export function upsertSavedGraph(entry: StoredDesmosGraph): void {
  if (typeof window === "undefined") return;
  const list = listSavedGraphs().filter((g) => g.id !== entry.id);
  list.unshift(entry);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(list.slice(0, 50)));
}

export function removeSavedGraph(id: string): void {
  if (typeof window === "undefined") return;
  const list = listSavedGraphs().filter((g) => g.id !== id);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
}

export function getAttemptGraphKey(attemptId: string) {
  return {
    graph: `desmos_graph_state_${attemptId}`,
    title: `desmos_graph_title_${attemptId}`,
  };
}

export function loadAttemptGraph(
  attemptId: string,
): { title: string; state: DesmosGraphState } | null {
  if (typeof window === "undefined") return null;
  const keys = getAttemptGraphKey(attemptId);
  try {
    const raw = localStorage.getItem(keys.graph);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      title?: string;
      state?: DesmosGraphState;
    };
    if (!parsed.state) return null;
    return {
      title:
        parsed.title ||
        localStorage.getItem(keys.title) ||
        "Untitled Graph",
      state: parsed.state,
    };
  } catch {
    return null;
  }
}

export function saveAttemptGraph(
  attemptId: string,
  title: string,
  state: DesmosGraphState,
): void {
  if (typeof window === "undefined") return;
  const keys = getAttemptGraphKey(attemptId);
  const payload = {
    title,
    state,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(keys.graph, JSON.stringify(payload));
  localStorage.setItem(keys.title, title);
  upsertSavedGraph({
    id: `attempt-${attemptId}`,
    title,
    state,
    savedAt: payload.savedAt,
    attemptId,
  });
}
