import React from "react";
import { Paper } from "../types";
import { Bookmark, Trash2, History, BookOpen, ChevronRight, ListCollapse } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  bookmarks: Paper[];
  history: string[];
  currentQuery: string;
  onSelectPaper: (paper: Paper) => void;
  onSelectQuery: (query: string) => void;
  onRemoveBookmark: (paperId: string, e: React.MouseEvent) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const SidebarBookmarks: React.FC<SidebarProps> = ({
  bookmarks,
  history,
  onSelectPaper,
  onSelectQuery,
  onRemoveBookmark,
  onClearHistory,
  isOpen,
  onToggle,
}) => {
  return (
    <div
      id="sidebar-container"
      className={`fixed sm:relative z-40 top-0 bottom-0 left-0 transition-all duration-300 ${
        isOpen ? "w-80" : "w-0 sm:w-16"
      } flex shrink-0`}
    >
      {/* Sliding Drawer for Desktop or Mobile view */}
      <div
        className={`h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 w-80 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0 sm:w-16"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className={`flex items-center gap-2.5 overflow-hidden ${!isOpen && "sm:hidden"}`}>
            <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="font-bold text-sm tracking-wider whitespace-nowrap bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">
              学术控制台
            </span>
          </div>

          <button
            id="sidebar-toggle-btn"
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
            title={isOpen ? "折叠面板" : "展开面板"}
          >
            <ListCollapse className={`w-4 h-4 transition-transform duration-200 ${!isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Sidebar Body */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Bookmarks Section */}
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                  已收藏论文 ({bookmarks.length})
                </span>
              </div>

              {bookmarks.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                  暂无收藏，点击论文卡片右上角书签标志进行收藏
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {bookmarks.map((paper) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
                        onClick={() => onSelectPaper(paper)}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-blue-300">
                            {paper.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {paper.authors.join(", ")}
                          </p>
                        </div>
                        <button
                          id={`remove-bookmark-${paper.id}`}
                          onClick={(e) => onRemoveBookmark(paper.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-all shrink-0"
                          title="取消收藏"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* History Selections */}
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  最近搜索
                </span>
                {history.length > 0 && (
                  <button
                    id="clear-history-btn"
                    onClick={onClearHistory}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-0.5 normal-case font-normal"
                  >
                    <Trash2 className="w-3 h-3" />
                    清除
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                  暂无搜索记录
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {history.map((q, idx) => (
                    <button
                      key={idx}
                      id={`history-query-${idx}`}
                      onClick={() => onSelectQuery(q)}
                      className="flex items-center justify-between text-left px-3 py-2 text-xs text-slate-300 bg-slate-800/20 hover:bg-slate-800/75 rounded-lg border border-slate-800/40 hover:border-slate-800 transition-all truncate"
                    >
                      <span className="truncate">{q}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mini compact side bar icons */
          <div className="flex-1 flex flex-col items-center py-6 gap-6">
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onToggle}>
              <Bookmark className={`w-5 h-5 ${bookmarks.length > 0 ? "text-amber-400" : "text-slate-600"}`} />
              <span className="text-[10px] text-slate-500 font-mono">{bookmarks.length}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onToggle}>
              <History className="w-5 h-5 text-slate-600" />
              <span className="text-[10px] text-slate-500 font-mono">{history.length}</span>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        {isOpen && (
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
            Version 1.0.0 · Gemini 3.5 Ready
          </div>
        )}
      </div>

      {/* Background Overlay for mobile drawer */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={onToggle}
        />
      )}
    </div>
  );
};
