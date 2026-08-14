"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  SiteVersionHistoryEntry,
  SiteVersionOperationResult,
} from "@/lib/projects/types";

interface VersionHistoryProps {
  siteId: string;
  activeVersionId: string;
  refreshKey: number;
  hasUnsavedChanges: boolean;
  onActiveMetadata: (entry: SiteVersionHistoryEntry) => void;
  onRestored: (result: SiteVersionOperationResult) => void;
}

interface HistoryResponse {
  ok: boolean;
  error?: string;
  result?: SiteVersionHistoryEntry[];
}

interface RestoreResponse {
  ok: boolean;
  error?: string;
  result?: SiteVersionOperationResult;
}

export default function VersionHistory({
  siteId,
  activeVersionId,
  refreshKey,
  hasUnsavedChanges,
  onActiveMetadata,
  onRestored,
}: VersionHistoryProps) {
  const [entries, setEntries] = useState<SiteVersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/site-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list-versions", siteId }),
      });
      const data = (await response.json()) as HistoryResponse;

      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? "Unable to load version history.");
      }

      setEntries(data.result);
      const activeEntry = data.result.find((entry) => entry.isActive);
      if (activeEntry) {
        onActiveMetadata(activeEntry);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load version history.",
      );
    } finally {
      setLoading(false);
    }
  }, [onActiveMetadata, siteId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadHistory, refreshKey]);

  async function restoreVersion(entry: SiteVersionHistoryEntry) {
    const confirmed = window.confirm(
      `Restore Version ${entry.versionNumber} as a new version?\n\n` +
        "The current design will remain in history. " +
        `A new immutable version will be created from Version ${entry.versionNumber}.` +
        (hasUnsavedChanges
          ? "\n\nWarning: your unsaved rooftop edits will be discarded."
          : ""),
    );

    if (!confirmed) {
      return;
    }

    const summary = window.prompt(
      "Change summary for the restored version:",
      `Restored from Version ${entry.versionNumber}.`,
    );

    if (!summary?.trim()) {
      setError("A change summary is required to restore a version.");
      return;
    }

    if (summary.trim().length > 500) {
      setError("The change summary must not exceed 500 characters.");
      return;
    }

    setRestoringId(entry.versionId);
    setError("");

    try {
      const response = await fetch("/api/site-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore-version",
          siteId,
          sourceVersionId: entry.versionId,
          expectedActiveVersionId: activeVersionId,
          changeSummary: summary.trim(),
        }),
      });
      const data = (await response.json()) as RestoreResponse;

      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? "Unable to restore the version.");
      }

      onRestored(data.result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to restore the version.",
      );
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Version history</h2>
          <p className="text-sm text-slate-500">
            Historical configurations remain immutable.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading history…</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="p-2">Version</th>
                <th className="p-2">Created</th>
                <th className="p-2">Summary</th>
                <th className="p-2">Hash</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.versionId} className="border-b border-slate-100">
                  <td className="p-2 font-medium">
                    Version {entry.versionNumber}{" "}
                    {entry.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                        Active
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="max-w-md p-2">
                    {entry.changeSummary ?? "No summary recorded"}
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {entry.configurationHash?.slice(0, 12) ?? "—"}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      disabled={entry.isActive || restoringId !== null}
                      onClick={() => void restoreVersion(entry)}
                      className="rounded-lg border border-amber-300 px-3 py-2 text-xs disabled:opacity-40"
                    >
                      {restoringId === entry.versionId ? "Restoring…" : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
