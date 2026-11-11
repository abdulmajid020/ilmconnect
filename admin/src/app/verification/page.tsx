"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { TeacherProfile, TeacherStatus } from "@/lib/types";
import { CheckCircle2, XCircle, Clock, FileText, ExternalLink } from "lucide-react";

function statusLabel(s: string) {
  if (s === "UNDER_REVIEW") return "In review";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function statusClass(s: string) {
  if (s === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (s === "REJECTED") return "bg-red-50 text-red-600";
  if (s === "UNDER_REVIEW") return "bg-amber-50 text-amber-700";
  return "bg-zinc-100 text-zinc-500";
}

export default function VerificationPage() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [selected, setSelected] = useState<TeacherProfile | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getPendingTeachers()
      .then((d) => {
        const list = d ?? [];
        setTeachers(list);
        setSelected(list[0] ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load teacher applications.");
      })
      .finally(() => setLoading(false));
  }, []);

  const apply = async (status: TeacherStatus) => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.reviewTeacher(selected.id, status, notes);
    } catch {}
    const updated = teachers.map((t) =>
      t.id === selected.id ? { ...t, status, review_notes: notes } : t
    );
    setTeachers(updated);
    setSelected({ ...selected, status, review_notes: notes });
    setNotes("");
    setToast(`Marked as ${status}`);
    setBusy(false);
  };

  const visible = teachers.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      (t.full_name ?? "").toLowerCase().includes(q) ||
      t.islamic_education.toLowerCase().includes(q) ||
      t.expertise_areas.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Verification"
        description="Review scholar credentials before activating on the marketplace"
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-zinc-200 bg-white flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search name, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-zinc-200 rounded-md px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-56"
          />
          <div className="flex items-center gap-1">
            {["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === s
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {s === "ALL" ? "All" : s === "UNDER_REVIEW" ? "In review" : statusLabel(s)}
              </button>
            ))}
          </div>
          {toast && (
            <span className="ml-auto text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {toast}
              <button onClick={() => setToast(null)} className="ml-1 text-zinc-400 hover:text-zinc-600">
                ×
              </button>
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="w-5 h-5" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-3 max-w-sm text-center">
              {error}
            </p>
          </div>
        ) : (
          /* Split pane */
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left: list */}
            <div className="w-72 shrink-0 border-r border-zinc-200 overflow-y-auto bg-white">
              {visible.length === 0 ? (
                <p className="p-6 text-xs text-zinc-400">No applications match.</p>
              ) : (
                visible.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 transition-colors ${
                      selected?.id === t.id ? "bg-zinc-50" : "hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-zinc-900 truncate">
                        {t.full_name}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusClass(
                          t.status
                        )}`}
                      >
                        {t.status === "UNDER_REVIEW" ? "In review" : statusLabel(t.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {t.expertise_areas.join(", ")}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Right: detail */}
            <div className="flex-1 overflow-y-auto p-6">
              {selected ? (
                <div className="max-w-xl space-y-6 text-xs">
                  {/* Header */}
                  <div className="pb-4 border-b border-zinc-200 flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900">{selected.full_name}</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">{selected.expertise_areas.join(", ")}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusClass(selected.status)}`}>
                      {statusLabel(selected.status)}
                    </span>
                  </div>

                  {/* Islamic education */}
                  <div>
                    <p className="text-zinc-500 font-medium mb-1">Islamic Education</p>
                    <p className="text-zinc-800 leading-relaxed bg-zinc-50 border border-zinc-200 rounded-md p-3">
                      {selected.islamic_education}
                    </p>
                  </div>

                  {selected.bio && (
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Biography</p>
                      <p className="text-zinc-700 leading-relaxed">{selected.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Expertise</p>
                      <p className="text-zinc-800">{selected.expertise_areas.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Languages</p>
                      <p className="text-zinc-800">{selected.languages_spoken.join(", ")}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  {selected.credentials && selected.credentials.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-500">
                        Documents ({selected.credentials.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {selected.credentials.map((c) => (
                          <a
                            key={c.id}
                            href={c.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-xs"
                          >
                            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-800 truncate">{c.document_title}</p>
                              <p className="text-zinc-400">{c.document_type}</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-zinc-400 ml-auto shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Review notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ijazah chain verified with Sheikh… / Requested clearer transcript scan…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full text-xs border border-zinc-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={busy || selected.status === "APPROVED"}
                        onClick={() => apply("APPROVED")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#064e3b] text-white text-xs font-medium rounded-md hover:bg-[#053d2e] disabled:opacity-40 transition-colors"
                      >
                        {busy ? <Spinner className="border-white/40 border-t-white" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => apply("UNDER_REVIEW")}
                        className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" /> Mark in review
                      </button>
                      <button
                        disabled={busy || selected.status === "REJECTED"}
                        onClick={() => apply("REJECTED")}
                        className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-red-600 text-xs font-medium rounded-md hover:bg-red-50 disabled:opacity-40 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-8">Select an applicant to view their dossier.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
