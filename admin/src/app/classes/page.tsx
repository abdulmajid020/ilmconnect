"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { MadrassaClass, RosterStudentItem } from "@/lib/types";
import { Plus, ExternalLink, CheckCircle2, X } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<MadrassaClass[]>([]);
  const [selected, setSelected] = useState<MadrassaClass | null>(null);
  const [roster, setRoster] = useState<RosterStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Create class form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [subject, setSubject] = useState("Tajweed");
  const [level, setLevel] = useState("BEGINNER");
  const [schedule, setSchedule] = useState("");
  const [meetLink, setMeetLink] = useState("");

  // Schedule session form state
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [sessionLink, setSessionLink] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getClasses()
      .then((d) => {
        const list = d ?? [];
        setClasses(list);
        if (list[0]) {
          setSelected(list[0]);
          fetchRoster(list[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load classes.");
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchRoster = (classId: string) => {
    setRosterLoading(true);
    api
      .getClassRoster(classId)
      .then((d) => setRoster(d ?? []))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  };

  const handleSelectClass = (cls: MadrassaClass) => {
    setSelected(cls);
    fetchRoster(cls.id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateBusy(true);
    try {
      const created = await api.createClass({
        title,
        description: desc,
        subject,
        language: "English",
        level,
        capacity: 20,
        recurring_schedule: schedule,
        default_meet_link: meetLink,
      });
      setClasses([created, ...classes]);
      setSelected(created);
      setRoster([]);
      setShowCreate(false);
      setTitle(""); setDesc(""); setSchedule(""); setMeetLink("");
      setToast(`Class "${created.title}" created`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setCreateBusy(false);
    }
  };

  const handleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSessionBusy(true);
    try {
      await api.createSession(selected.id, {
        title: sessionTitle,
        session_date: sessionDate
          ? new Date(sessionDate).toISOString()
          : new Date().toISOString(),
        duration_minutes: parseInt(sessionDuration) || 60,
        meet_link: sessionLink || selected.default_meet_link,
      });
      setShowSession(false);
      setSessionTitle(""); setSessionDate(""); setSessionLink("");
      setToast(`Session "${sessionTitle}" scheduled`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed to schedule session.");
    } finally {
      setSessionBusy(false);
    }
  };

  const enrolled = roster.filter((r) => r.status === "ENROLLED");
  const waitlisted = roster.filter((r) => r.status === "WAITLISTED");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Classes" description="Manage 20-seat group circles and Google Meet sessions" />

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
            {/* Left: class list */}
            <div className="w-72 shrink-0 border-r border-zinc-200 overflow-y-auto bg-white">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">{classes.length} classes</span>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1 text-xs text-[#064e3b] font-medium hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> New class
                </button>
              </div>

              {classes.length === 0 ? (
                <p className="p-6 text-xs text-zinc-400">No classes yet. Create the first one.</p>
              ) : (
                classes.map((cls) => {
                  const n = cls.enrolled_count ?? 0;
                  const full = n >= 20;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 transition-colors ${
                        selected?.id === cls.id ? "bg-zinc-50" : "hover:bg-zinc-50/60"
                      }`}
                    >
                      <p className="text-xs font-semibold text-zinc-900 truncate">{cls.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{cls.subject} &middot; {cls.level}</p>
                      <p className={`text-[11px] mt-0.5 font-medium ${full ? "text-red-600" : "text-zinc-400"}`}>
                        {n}&thinsp;/&thinsp;20 seats
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: class detail */}
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
                      <h2 className="text-base font-semibold text-zinc-900">{selected.title}</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {selected.subject} &middot; {selected.level} &middot; {selected.language}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {selected.status}
                    </span>
                  </div>

                  {/* Description */}
                  {selected.description && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Description</p>
                      <p className="text-xs text-zinc-700 leading-relaxed">{selected.description}</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Schedule</p>
                      <p className="text-zinc-800">{selected.recurring_schedule || "—"}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-medium mb-1">Enrollment</p>
                      <p className={`font-medium ${(selected.enrolled_count ?? 0) >= 20 ? "text-red-600" : "text-zinc-800"}`}>
                        {selected.enrolled_count ?? 0}&thinsp;/&thinsp;20 seats
                      </p>
                    </div>
                    {selected.default_meet_link && (
                      <div className="col-span-2">
                        <p className="text-zinc-500 font-medium mb-1">Google Meet</p>
                        <a
                          href={selected.default_meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#064e3b] hover:underline"
                        >
                          {selected.default_meet_link}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Roster */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-zinc-500">Roster</p>
                      <button
                        onClick={() => setShowSession(true)}
                        className="text-xs text-[#064e3b] font-medium hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Schedule session
                      </button>
                    </div>

                    {rosterLoading ? (
                      <div className="flex justify-center py-6">
                        <Spinner />
                      </div>
                    ) : (
                      <>
                        {enrolled.length === 0 && waitlisted.length === 0 ? (
                          <p className="text-xs text-zinc-400 py-4">No students enrolled yet.</p>
                        ) : (
                          <div className="border border-zinc-200 rounded-md divide-y divide-zinc-100 overflow-hidden">
                            {enrolled.map((s) => (
                              <div key={s.enrollment_id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                                <span className="font-medium text-zinc-800">{s.full_name}</span>
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  Enrolled
                                </span>
                              </div>
                            ))}
                            {waitlisted.map((s) => (
                              <div key={s.enrollment_id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                                <span className="font-medium text-zinc-800">{s.full_name}</span>
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  Waitlisted
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-8">Select a class to view details.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create class modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-zinc-900">New class</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Foundations of Tajweed"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="A weekly circle covering the rules of Tajweed…"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Subject *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    {["Tajweed", "Fiqh", "Aqeedah", "Arabic", "Tafsir", "Hadith", "Seerah"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Capacity</label>
                <div className="border border-zinc-200 rounded-md px-3 py-2 bg-zinc-50 text-zinc-500 font-mono">
                  20 seats (fixed)
                </div>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Schedule</label>
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Saturdays 7:00 PM GMT"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Default Google Meet link</label>
                <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-yyy-zzz"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBusy}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#064e3b] text-white rounded-md hover:bg-[#053d2e] disabled:opacity-60"
                >
                  {createBusy && <Spinner className="border-white/40 border-t-white" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule session modal */}
      {showSession && selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-zinc-900">Schedule session</h3>
              <button onClick={() => setShowSession(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Topic *</label>
                <input
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Session 4: Rules of Madd Lazim"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Date &amp; time</label>
                  <input
                    type="datetime-local"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Meet link</label>
                <input
                  type="url"
                  value={sessionLink}
                  onChange={(e) => setSessionLink(e.target.value)}
                  placeholder={selected.default_meet_link || "https://meet.google.com/…"}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowSession(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sessionBusy}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#064e3b] text-white rounded-md hover:bg-[#053d2e] disabled:opacity-60"
                >
                  {sessionBusy && <Spinner className="border-white/40 border-t-white" />}
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
