"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { TeacherProfile, MadrassaClass, LearningRequest, Question } from "@/lib/types";
import { ArrowRight, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [classes, setClasses] = useState<MadrassaClass[]>([]);
  const [requests, setRequests] = useState<LearningRequest[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPendingTeachers(),
      api.getClasses(),
      api.getReceivedRequests(),
      api.getQuestions(),
    ])
      .then(([t, c, r, q]) => {
        setTeachers(t ?? []);
        setClasses(c ?? []);
        setRequests(r ?? []);
        setQuestions(q ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingVerifications = teachers.filter(
    (t) => t.status === "SUBMITTED" || t.status === "UNDER_REVIEW"
  ).length;

  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;
  const unansweredQuestions = questions.filter(
    (q) => !q.answers || q.answers.length === 0
  ).length;

  const stats = [
    { label: "Pending verifications", value: pendingVerifications, href: "/verification" },
    { label: "Active classes", value: classes.length, href: "/classes" },
    { label: "Open 1-on-1 requests", value: pendingRequests, href: "/requests" },
    { label: "Unanswered questions", value: unansweredQuestions, href: "/qa" },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Header title="Overview" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-5 h-5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Header title="Overview" />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-3 max-w-sm text-center">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Overview" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-colors group"
            >
              <div className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              <div className="mt-3 flex items-center gap-1 text-xs text-[#064e3b] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Two-column tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Verification queue */}
          <div className="bg-white border border-zinc-200 rounded-lg">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900">Verification queue</h2>
              <Link href="/verification" className="text-xs text-[#064e3b] font-medium hover:underline">
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {teachers.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-xs text-zinc-400 text-center">No pending applications</td>
                  </tr>
                ) : (
                  teachers.slice(0, 4).map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-zinc-900 text-xs">{t.full_name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
                          {t.expertise_areas.join(", ")}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                            t.status === "UNDER_REVIEW"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {t.status === "UNDER_REVIEW" ? "In review" : "Submitted"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Active classes */}
          <div className="bg-white border border-zinc-200 rounded-lg">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900">Madrassa classes</h2>
              <Link href="/classes" className="text-xs text-[#064e3b] font-medium hover:underline">
                Manage
              </Link>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {classes.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-xs text-zinc-400 text-center">No classes yet</td>
                  </tr>
                ) : (
                  classes.slice(0, 4).map((cls) => {
                    const enrolled = cls.enrolled_count ?? 0;
                    const full = enrolled >= 20;
                    return (
                      <tr key={cls.id} className="hover:bg-zinc-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-zinc-900 text-xs">{cls.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{cls.subject}</div>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <span className={`text-xs font-medium ${full ? "text-red-600" : "text-zinc-600"}`}>
                            {enrolled}&thinsp;/&thinsp;20
                          </span>
                          {cls.default_meet_link && (
                            <a
                              href={cls.default_meet_link}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 inline-flex items-center text-[#064e3b] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Open 1-on-1 requests */}
          <div className="bg-white border border-zinc-200 rounded-lg">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900">1-on-1 requests</h2>
              <Link href="/requests" className="text-xs text-[#064e3b] font-medium hover:underline">
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {requests.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-xs text-zinc-400 text-center">No requests</td>
                  </tr>
                ) : (
                  requests.slice(0, 4).map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-zinc-900 text-xs">{r.learner_name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{r.subject}</div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            r.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : r.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Unanswered questions */}
          <div className="bg-white border border-zinc-200 rounded-lg">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900">Unanswered questions</h2>
              <Link href="/qa" className="text-xs text-[#064e3b] font-medium hover:underline">
                Answer
              </Link>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {questions.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-xs text-zinc-400 text-center">No questions yet</td>
                  </tr>
                ) : (
                  questions.slice(0, 4).map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-zinc-900 text-xs truncate max-w-[200px]">{q.title}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {q.subject} &middot; {q.is_anonymous ? "Anonymous" : q.author_name}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            q.answers && q.answers.length > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {q.answers && q.answers.length > 0 ? "Answered" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
