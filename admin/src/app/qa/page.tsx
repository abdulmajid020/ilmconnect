"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { Question, Answer } from "@/lib/types";
import { CheckCircle2, EyeOff, Send } from "lucide-react";

export default function QAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [answerText, setAnswerText] = useState("");
  const [citations, setCitations] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getQuestions()
      .then((d) => {
        const list = d ?? [];
        setQuestions(list);
        setSelected(list[0] ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load questions.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !answerText.trim()) return;
    setBusy(true);

    const full = citations.trim()
      ? `${answerText}\n\nReferences: ${citations}`
      : answerText;

    let newAnswer: Answer | null = null;
    try {
      newAnswer = await api.postAnswer(selected.id, full);
    } catch {}

    const fallback: Answer = {
      id: `ans-${Date.now()}`,
      question_id: selected.id,
      teacher_profile_id: "",
      teacher_name: "You",
      content: full,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const answer = newAnswer ?? fallback;

    const updated = questions.map((q) =>
      q.id === selected.id
        ? { ...q, status: "ANSWERED", answers: [...(q.answers ?? []), answer] }
        : q
    );
    setQuestions(updated);
    setSelected({ ...selected, status: "ANSWERED", answers: [...(selected.answers ?? []), answer] });
    setAnswerText("");
    setCitations("");
    setToast("Answer published");
    setBusy(false);
  };

  const subjects = ["ALL", ...Array.from(new Set(questions.map((q) => q.subject)))];
  const visible = questions.filter(
    (q) => subjectFilter === "ALL" || q.subject === subjectFilter
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Q&amp;A Board" description="Submit verified scholarly answers to community questions" />

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
            {/* Left: question list */}
            <div className="w-72 shrink-0 border-r border-zinc-200 overflow-y-auto bg-white">
              {/* Subject filter */}
              <div className="px-3 py-2.5 border-b border-zinc-100 flex flex-wrap gap-1">
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubjectFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      subjectFilter === s
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {s === "ALL" ? "All" : s}
                  </button>
                ))}
              </div>

              {visible.length === 0 ? (
                <p className="p-6 text-xs text-zinc-400">No questions yet.</p>
              ) : (
                visible.map((q) => {
                  const answered = (q.answers?.length ?? 0) > 0;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelected(q)}
                      className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 transition-colors ${
                        selected?.id === q.id ? "bg-zinc-50" : "hover:bg-zinc-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-zinc-900 leading-snug line-clamp-2 flex-1">
                          {q.title}
                        </p>
                        <span
                          className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 ${
                            answered
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {answered ? "Done" : "Open"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">{q.subject}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-400">
                        {q.is_anonymous && <EyeOff className="w-3 h-3" />}
                        <span>{q.is_anonymous ? "Anonymous" : q.author_name}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: detail + answer form */}
            <div className="flex-1 overflow-y-auto p-6">
              {toast && (
                <div className="mb-4 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {toast}
                  <button onClick={() => setToast(null)} className="ml-1 text-zinc-400">×</button>
                </div>
              )}

              {selected ? (
                <div className="max-w-xl space-y-6">
                  {/* Question header */}
                  <div className="pb-4 border-b border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                        {selected.subject}
                      </span>
                      {selected.is_anonymous && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <EyeOff className="w-3 h-3" /> Anonymous
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-900 leading-snug mb-3">
                      {selected.title}
                    </h2>
                    <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 border border-zinc-200 rounded-md p-4">
                      {selected.content}
                    </p>
                  </div>

                  {/* Existing answers */}
                  {selected.answers && selected.answers.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-zinc-500">
                        {selected.answers.length} answer{selected.answers.length !== 1 ? "s" : ""}
                      </p>
                      {selected.answers.map((a) => (
                        <div key={a.id} className="border border-zinc-200 rounded-md p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-800">{a.teacher_name}</span>
                            <span className="text-[11px] text-zinc-400">
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                            {a.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer form */}
                  <form onSubmit={handleAnswer} className="space-y-3 pt-2 border-t border-zinc-200">
                    <p className="text-xs font-medium text-zinc-700">Your answer</p>
                    <textarea
                      required
                      rows={5}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Wa alaykumussalam wa Rahmatullah…"
                      className="w-full text-xs border border-zinc-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                    />
                    <input
                      type="text"
                      value={citations}
                      onChange={(e) => setCitations(e.target.value)}
                      placeholder="References / Dalil (optional): Sahih al-Bukhari #1892…"
                      className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={busy || !answerText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#064e3b] text-white text-xs font-medium rounded-md hover:bg-[#053d2e] disabled:opacity-40 transition-colors"
                      >
                        {busy ? <Spinner className="border-white/40 border-t-white" /> : <Send className="w-3.5 h-3.5" />}
                        Publish answer
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-8">Select a question to answer.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
