import React from "react";
import { Paper, PaperAnalysis } from "../types";
import { 
  Sparkles, 
  Lightbulb, 
  FileCheck, 
  AlertTriangle, 
  ArrowRight, 
  Key, 
  Loader2, 
  BookOpen, 
  Download, 
  ExternalLink 
} from "lucide-react";
import { motion } from "motion/react";

interface AnalysisViewProps {
  paper: Paper;
  analysis: PaperAnalysis | null;
  isLoading: boolean;
  onRunAnalysis: () => void;
  error: string | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  paper,
  analysis,
  isLoading,
  onRunAnalysis,
  error,
}) => {
  // Format publish date
  const cleanDate = (() => {
    try {
      const d = new Date(paper.published);
      return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
    } catch {
      return paper.published.split("T")[0];
    }
  })();

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div id={`analysis-container-${paper.id}`} className="space-y-6">
      {/* Paper Main Header info */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>ArXiv ID: {paper.id}</span>
          <span className="text-slate-300">•</span>
          <span>发表于 {cleanDate}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3">
          {paper.title}
        </h2>
        
        <div className="text-xs text-slate-600 mb-4 font-medium">
          <span className="text-slate-400">作者成员：</span>
          {paper.authors.join(", ")}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            id={`open-pdf-btn-${paper.id}`}
            href={paper.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            阅读 PDF 原文
          </a>
          <a
            id={`open-abs-btn-${paper.id}`}
            href={`https://arxiv.org/abs/${paper.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 hover:bg-slate-200 text-slate-600 bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
          >
            ArXiv 页面
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Abstract display */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900 border-l-3 border-blue-500 pl-2">
          论文摘要 (Abstract)
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed text-justify bg-white p-4 rounded-xl border border-slate-100">
          {paper.summary}
        </p>
      </div>

      {/* Gemini AI Synthesis space */}
      <div className="pt-2">
        {/* If analysis is missing and not loading */}
        {!analysis && !isLoading && (
          <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/20 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-200 text-blue-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm">
                开启 Gemini AI 深度学术解析
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                研究员可以使用 Google Gemini 3.5 模型，对这篇论文的创新点、模型结构、实验结果及科学价值进行速读及学术提炼。
              </p>
            </div>
            
            {error && (
              <p className="text-xs text-red-500 font-medium bg-red-50/50 p-2.5 rounded-lg border border-red-100 max-w-md mx-auto">
                解析出错：{error}
              </p>
            )}

            <button
              id={`trigger-analysis-${paper.id}`}
              onClick={onRunAnalysis}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              立刻生成学术解读
            </button>
          </div>
        )}

        {/* Loading details state */}
        {isLoading && (
          <div className="p-10 rounded-2xl border border-slate-150 bg-slate-50/50 text-center space-y-4">
            <div className="relative inline-block">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">Gemini 学术智囊正在阅读该论文摘要...</p>
              <p className="text-slate-400 text-xs">正在分析创新点、推导研究方法、提炼核心成果并整理限制条件...</p>
            </div>
            {/* Visual step simulation */}
            <div className="max-w-xs mx-auto flex gap-1 justify-center">
              <div className="h-1 w-8 bg-blue-500 rounded-full animate-pulse" />
              <div className="h-1 w-8 bg-blue-400 rounded-full animate-pulse delay-75" />
              <div className="h-1 w-8 bg-blue-300 rounded-full animate-pulse delay-150" />
            </div>
          </div>
        )}

        {/* Analysis results Display */}
        {analysis && !isLoading && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Action panel to refresh */}
            <div className="flex items-center justify-between bg-slate-50 p-3 px-4 rounded-xl border border-slate-100/60">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                学术报告由 Gemini 3.5 倾力生成
              </span>
              <button
                id="refresh-analysis"
                onClick={onRunAnalysis}
                className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold p-1 px-2 rounded-lg transition-all"
              >
                重新分析
              </button>
            </div>

            {/* Grid structure for key analyses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contribution Card */}
              <motion.div
                variants={itemVariants}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/10 to-teal-50/20 border border-slate-100 shadow-xs flex gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">核心贡献与创新 (Contributions)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">
                    {analysis.contribution}
                  </p>
                </div>
              </motion.div>

              {/* Methodology Card */}
              <motion.div
                variants={itemVariants}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/10 to-indigo-50/20 border border-slate-100 shadow-xs flex gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 h-10 w-10 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">研究设计方法 (Methodology)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">
                    {analysis.methodology}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Findings & Gaps in columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Findings */}
              <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-slate-50/40 border border-slate-100">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5 mb-3.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  实验发现与关键成果
                </h4>
                <ul className="space-y-3">
                  {analysis.findings.map((finding, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                      <span className="text-blue-500 font-bold select-none shrink-0">0{idx + 1}.</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Limitations */}
              <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-slate-50/40 border border-slate-100">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5 mb-3.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  局限性与研究边界 (Limitations)
                </h4>
                <ul className="space-y-3">
                  {analysis.limitations.map((limit, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{limit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Future developments */}
            <motion.div
              variants={itemVariants}
              className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-2xs space-y-2"
            >
              <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                未来可延伸方向 (Future Directions)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysis.futureDirections}
              </p>
            </motion.div>

            {/* Concept Keywords (Visual tags) */}
            <motion.div variants={itemVariants} className="space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                核心科学词条提取 (AI Key Terms)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywords.map((key, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-default"
                  >
                    #{key}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
