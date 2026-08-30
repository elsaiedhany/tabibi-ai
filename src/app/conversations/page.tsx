"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { MessageSquare, UserCheck, Bot, Send, Search, User, ShieldAlert, CheckCheck, RefreshCw } from "lucide-react";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (!selectedId && data.conversations.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetch(`/api/conversations/${selectedId}`)
        .then((r) => r.json())
        .then((d) => setActiveConv(d.conversation))
        .catch(console.error);
    }
  }, [selectedId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    const res = await fetch(`/api/conversations/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handoffStatus: newStatus }),
    });
    if (res.ok) {
      fetchConversations();
      const updated = await res.json();
      setActiveConv(updated.conversation);
    }
  };

  const handleSendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    const res = await fetch(`/api/conversations/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageContent: replyText, handoffStatus: "HUMAN_ACTIVE" }),
    });

    if (res.ok) {
      setReplyText("");
      const updated = await res.json();
      setActiveConv(updated.conversation);
      fetchConversations();
    }
  };

  const filteredConvs = conversations.filter((c) => {
    if (filter === "HUMAN_ACTIVE") return c.handoffStatus === "HUMAN_ACTIVE";
    if (filter === "AI_ACTIVE") return c.handoffStatus === "AI_ACTIVE";
    return true;
  });

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">المحادثات المباشرة والتأطير البشري</h1>
            <p className="text-slate-400 text-sm">متابعة رسائل المرضى والتدخل المباشر عند استدعاء الاستقبال</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                filter === "ALL" ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              الكل ({conversations.length})
            </button>
            <button
              onClick={() => setFilter("HUMAN_ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                filter === "HUMAN_ACTIVE"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              تطلب تدخلاً بشرياً (
              {conversations.filter((c) => c.handoffStatus === "HUMAN_ACTIVE").length})
            </button>
          </div>
        </div>

        {/* Chat Grid: Conversations List (Left) vs Chat Window (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* List Sidebar (4 Cols) */}
          <div className="lg:col-span-4 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                <input
                  type="text"
                  placeholder="بحث باسم المريض أو الهاتف..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 text-white text-xs border border-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full p-4 text-right flex items-start gap-3 transition-colors ${
                    selectedId === conv.id ? "bg-slate-800/80 border-r-4 border-brand-500" : "hover:bg-slate-800/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-300 text-sm shrink-0">
                    {conv.patient?.name?.[0] || "م"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm truncate">{conv.patient?.name}</h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          conv.handoffStatus === "HUMAN_ACTIVE"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {conv.handoffStatus === "HUMAN_ACTIVE" ? "استقبال بشري" : "الـ AI نشط"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 truncate mt-1">
                      {conv.messages?.[0]?.content || "لا توجد رسائل سابقة"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Chat Window (8 Cols) */}
          <div className="lg:col-span-8 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            {activeConv ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-950 border border-brand-500/40 flex items-center justify-center font-bold text-brand-300">
                      {activeConv.patient?.name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{activeConv.patient?.name}</h3>
                      <p className="text-xs text-slate-400">{activeConv.patient?.whatsappNumber}</p>
                    </div>
                  </div>

                  {/* Handoff Toggle Button */}
                  <div className="flex items-center gap-2">
                    {activeConv.handoffStatus === "HUMAN_ACTIVE" ? (
                      <button
                        onClick={() => handleStatusChange("AI_ACTIVE")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Bot className="w-4 h-4" />
                        <span>إعادة التفعيل للـ AI</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange("HUMAN_ACTIVE")}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>استلام المحادثة يدويًا</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                  {activeConv.messages?.map((m: any) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === "PATIENT" ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.sender === "PATIENT"
                            ? "bg-slate-800 text-white rounded-tr-none"
                            : m.sender === "HUMAN_AGENT"
                            ? "bg-amber-600/90 text-white rounded-tl-none"
                            : "bg-brand-700/80 text-white rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <span className="text-[10px] text-slate-300/60 font-mono block text-left mt-1">
                          {m.sender === "PATIENT" ? "المريض" : m.sender === "HUMAN_AGENT" ? "الموظف" : "الـ AI"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input Box */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                    placeholder="اكتب رد موظف الاستقبال هنا لإرساله فوراً للمريض..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={handleSendReply}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                اختر محادثة من القائمة لعرض الرسائل وتأطير المريض.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
