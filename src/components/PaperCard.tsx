import React from "react";
import { Paper } from "../types";
import { getCategoryBadge } from "../data";
import { 
  FileText, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Calendar, 
  MessageSquare,
  User
} from "lucide-react";
import { motion } from "motion/react";

interface PaperCardProps {
  paper: Paper;
  isSelected: boolean;
  isBookmarked: boolean;
  onSelect: () => void;
  onToggleBookmark: (e: React.MouseEvent) => void;
  onAnalyze: (e: React.MouseEvent) => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  isSelected,
  isBookmarked,
  onSelect,
  onToggleBookmark,
  onAnalyze,
}) => {
  // Format publish date
  const cleanDate = (() => {
    try {
      const d = new Date(paper.published);
      return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return paper.published.split("T")[0];
    }
  })();

  // Main primary category
  const primaryCategory = paper.categories[0] || "General";
  const badgeInfo = getCategoryBadge(primaryCategory);

  return (
    <motion.div
      id={`paper-card-${paper.id.replace(/[^a-zA-Z0-9]/g, "-")}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-blue-500 bg-blue-50/40 shadow-md ring-1 ring-blue-500/25"
          : "border-slate-100 bg-white shadow-xs hover:shadow-md hover:border-slate-200"
      }`}
      onClick={onSelect}
    >
      {/* Accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSelected ? "bg-blue-600" : "bg-slate-200"}`} />

      <div className="pl-2">
        {/* Upper metadata row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${badgeInfo.bg}`}>
              {badgeInfo.label}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
              {primaryCategory}
            </span>
            {paper.categories.length > 1 && (
              <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5">
                +{paper.categories.length - 1} domains
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Bookmark button */}
            <button
              id={`bookmark-btn-${paper.id}`}
              onClick={onToggleBookmark}
              className={`p-1.5 rounded-lg border transition-all duration-150 ${
                isBookmarked
                  ? "bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600"
              }`}
              title={isBookmarked ? "取消收藏" : "加入收藏"}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Direct PDF Link */}
            <a
              id={`pdf-link-${paper.id}`}
              href={paper.pdfUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg border bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-blue-600 transition-all duration-150"
              title="查看 PDF 全文"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Paper title */}
        <h3 className="text-base font-semibold leading-snug text-slate-900 mb-2 group-hover:text-blue-600">
          {paper.title}
        </h3>

        {/* Authors short view */}
        <p className="text-xs font-medium text-slate-600 flex items-wrap items-center gap-1.5 mb-3">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="line-clamp-1">
            {paper.authors.length > 5 
              ? `${paper.authors.slice(0, 4).join(", ")} et al.` 
              : paper.authors.join(", ")}
          </span>
        </p>

        {/* Abstract preview */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {paper.summary}
        </p>

        {/* Card footer details */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {cleanDate}
          </span>

          <div className="flex items-center gap-2">
            <button
              id={`quick-ai-btn-${paper.id}`}
              onClick={onAnalyze}
              className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors border border-blue-100/50"
            >
              <Sparkles className="w-3 h-3" />
              AI 深度解析
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
