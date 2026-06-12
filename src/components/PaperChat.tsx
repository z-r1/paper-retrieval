import React, { useState, useRef, useEffect } from "react";
import { Paper, ChatMessage } from "../types";
import { Send, Sparkles, User, RefreshCw, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PaperChatProps {
  paper: Paper;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
  onClearChat: () => void;
}

const PRESET_QUESTIONS = [
  "用浅显易懂的大白话讲解这篇论文的创新点？",
  "这篇论文相比于以往的研究，具体有哪些改进？",
  "研究团队采用的具体实验方法和核心模型架构是怎样的？",
  "如果你作为同行评审，你会对这篇论文提出哪些局限性质疑？",
  "这篇论文的理论成果可以在当前的工业界如何落地应用？",
];

export const PaperChat: React.FC<PaperChatProps> = ({
  paper,
  messages,
  onSendMessage,
  isGenerating,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const textToSubmit = inputText;
    setInputText("");
    await onSendMessage(textToSubmit);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div id={`chat-terminal-${paper.id}`} className="flex flex-col h-[650px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Top Banner bar */}
      <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 text-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-inner animate-pulse">
            PI
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-200">学者智囊 Q&A</h4>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">{paper.title}</p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            id="clear-chat-top-btn"
            onClick={onClearChat}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all p-1.5 rounded-lg border border-slate-800"
          >
            <RefreshCw className="w-3 h-3" />
            清空对话
          </button>
        )}
      </div>

      {/* Messages listing space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950/60 font-sans">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
            </div>

            {/* Bubble */}
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed text-slate-100 ${
                msg.role === "user"
                  ? "bg-blue-600 rounded-tr-none text-right"
                  : "bg-slate-800 border border-slate-700/80 rounded-tl-none text-left shadow-md"
              }`}
            >
              {/* Render lines correctly */}
              <div className="whitespace-pre-wrap select-text text-justify">
                {msg.content}
              </div>
              <p className={`text-[9px] text-slate-500 mt-1 ${msg.role === "user" ? "text-blue-200" : ""}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {/* AI typing state indicator */}
        {isGenerating && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 shrink-0 flex items-center justify-center text-[10px] font-bold">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            </div>
            <div className="p-3 bg-slate-800 border border-slate-700/80 rounded-2xl rounded-tl-none flex items-center gap-1 text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[10px]">分析推理中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Questions Drawer */}
      {messages.length <= 1 && (
        <div className="bg-slate-900 border-t border-slate-800/80 p-3 shrink-0">
          <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2 font-semibold">
            <HelpCircle className="w-3 h-3 text-blue-400" />
            您可以通过快捷提问开启对话：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                id={`preset-chat-${idx}`}
                onClick={() => {
                  if (!isGenerating) onSendMessage(q);
                }}
                disabled={isGenerating}
                className="text-[10px] text-slate-300 bg-slate-800/50 hover:bg-slate-800 hover:text-white border border-slate-700/60 p-1.5 px-2.5 rounded-lg transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea inputs row */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center shrink-0"
      >
        <textarea
          id="chat-input-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="问问这个学者的看法... (支持 Enter 发送, Shift+Enter 换行)"
          rows={1}
          className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 text-slate-100 placeholder-slate-500 rounded-xl py-2 px-3.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-600/35 transition-all resize-none max-h-24 scrollbar-none"
        />

        <button
          id="chat-send-submit"
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className={`p-2.5 rounded-xl transition-all font-bold text-white shrink-0 ${
            inputText.trim() && !isGenerating
              ? "bg-blue-600 hover:bg-blue-500 cursor-pointer text-white"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
          title="发送消息"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
