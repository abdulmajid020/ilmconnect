"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { LearningRequest } from "@/lib/types";
import { CheckCircle2, XCircle, X } from "lucide-react";

function statusClass(s: string) {
  if (s === "ACCEPTED") return "bg-emerald-50 text-emerald-700";
  if (s === "DECLINED") return "bg-red-50 text-red-600";
  if (s === "PENDING") return "bg-amber-50 text-amber-700";
  return "bg-zinc-100 text-zinc-500";
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<LearningRequest[]>([]);
  const [selected, setSelected] = useState<LearningRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccept, setShowAccept] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [meetSchedule, setMeetSchedule] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getReceivedRequests()
      .then((d) => {
        const list = d ?? [];
        setRequests(list);
        setSelected(list[0] ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load requests.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.respondToRequest(selected.id, {
        status: "ACCEPTED",
        meeting_schedule: meetSchedule,
        google_meet_link: meetLink,
      });
    } catch {}
    const up = requests.map((r) =>
      r.id === selected.id ? { ...r, status: "ACCEPTED" as const } : r
    );
    setRequests(up);
    setSelected({ ...selected, status: "ACCEPTED" });
    setShowAccept(false);
    setMeetSchedule("");
    setMeetLink("");
    setToast(`Accepted request from ${selected.learner_name}`);
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.respondToRequest(selected.id, {
        status: "DECLINED",
        decline_reason: declineReason,
      });
    } catch {}
    const up = requests.map((r) =>
      r.id === selected.id
        ? { ...r, status: "DECLINED" as const, decline_reason: declineReason }
        : r
    );
    setRequests(up);
    setSelected({ ...selected, status: "DECLINED", decline_reason: declineReason });
    setShowDecline(false);
    setDeclineReason("");
    setToast(`Declined request from ${selected.learner_name}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="1-on-1 Requests"
        description="Accept or decline individual mentorship requests from learners"
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
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
          <>
            {/* Left: request list */}
            <div className="w-72 shrink-0 border-r border-zinc-200 overflow-y-auto bg-white">
              <div className="px-4 py-3 border-b border-zinc-100">
                <span className="text-xs font-medium text-zinc-500">{requests.length} requests</span>
              </div>
              {requests.length === 0 ? (
                <p className="p-6 text-xs text-zinc-400">No requests received yet.</p>
              ) : (
                requests.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 transition-colors ${
                      selected?.id === r.id ? "bg-zinc-50" : "hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-zinc-900 truncate">
                        {r.learner_name}
                      </span>
                      <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusClass(r.status)}`}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">{r.subject}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Right: request detail */}
            <div className="flex-1 overflow-y-auto p-6">
              {toast && (
                <div className="mb-4 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {toast}
                  <button onClick={() => setToast(null)} className="ml-1 text-zinc-400">×</button>
                </div>
              )}

              {selected ? (
                <div className="max-w-xl space-y-6">
                  {/* Header */}
                  <div className="pb-4 border-b border-zinc-200 flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900">{selected.learner_name}</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">{selected.subject}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusClass(selected.status)}`}>
                      {selected.status.charAt(0) + selected.status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Message</p>
                    <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 border border-zinc-200 rounded-md p-4">
                      {selected.learner_message ?? "—"}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Availability</p>
                      <p className="text-zinc-800">{selected.meeting_schedule || "—"}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Submitted</p>
                      <p className="text-zinc-800">{new Date(selected.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Existing decision */}
                  {selected.status !== "PENDING" && (
                    <div className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-md p-3">
                      {selected.status === "ACCEPTED" ? (
                        <>
                          <span className="font-medium text-emerald-700">Accepted.</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-red-600">Declined.</span>{" "}
                          {selected.decline_reason}
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {selected.status === "PENDING" && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setShowAccept(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#064e3b] text-white text-xs font-medium rounded-md hover:bg-[#053d2e] transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => setShowDecline(true)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-red-600 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-8">Select a request to view details.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Accept modal */}
      {showAccept && selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-zinc-900">Accept mentorship</h3>
              <button onClick={() => setShowAccept(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAccept} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Weekly schedule *</label>
                <input
                  required
                  value={meetSchedule}
                  onChange={(e) => setMeetSchedule(e.target.value)}
                  placeholder="Mondays &amp; Thursdays 6:00 PM GMT"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Google Meet link *</label>
                <input
                  required
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/…"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <p className="text-zinc-400">
                Accepting registers a subject lock on {selected.subject} for this learner.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAccept(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-[#064e3b] text-white rounded-md hover:bg-[#053d2e]"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline modal */}
      {showDecline && selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-zinc-900">Decline request</h3>
              <button onClick={() => setShowDecline(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDecline} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Schedule is currently full; consider applying for the upcoming Tajweed group circle…"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowDecline(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
