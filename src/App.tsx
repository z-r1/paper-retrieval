import React, { useState, useEffect } from "react";
import { Paper, PaperAnalysis, ChatMessage, SearchQueryConfig } from "./types";
import { SidebarBookmarks } from "./components/SidebarBookmarks";
import { PaperCard } from "./components/PaperCard";
import { AnalysisView } from "./components/AnalysisView";
import { PaperChat } from "./components/PaperChat";
import { SEED_PAPERS, TRENDING_TOPICS, getCategoryBadge } from "./data";
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  ArrowRightLeft, 
  HelpCircle, 
  Cpu, 
  Globe, 
  Dna, 
  Atom, 
  Sparkle, 
  Orbit, 
  BookMarked,
  RotateCcw,
  BookOpen,
  ArrowUpDown,
  History,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Map string representation of icon names to Lucide icons
const IconComponentMap: Record<string, any> = {
  Cpu: Cpu,
  Atom: Atom,
  Globe: Globe,
  Dna: Dna,
  Sparkles: Sparkles,
  Orbit: Orbit,
};

export default function App() {
  // --- STATE DECLARATIONS ---
  const [query, setQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<Paper[]>([]);
  const [papers, setPapers] = useState<Paper[]>(SEED_PAPERS);
  
  const [selectedPaper, setSelectedPaper] = useState<Paper>(SEED_PAPERS[0]);
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");

  // Search setups
  const [sortBy, setSortBy] = useState<"relevance" | "lastUpdatedDate" | "submittedDate">("relevance");
  const [sortOrder, setSortOrder] = useState<"descending" | "ascending">("descending");
  const [maxResults, setMaxResults] = useState<number>(15);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sidebar Controls
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Gemini Synthesis states
  const [analysisCache, setAnalysisCache] = useState<Record<string, PaperAnalysis>>({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Paper chat histories (cached per paper ID to persist sessions)
  const [chatCache, setChatCache] = useState<Record<string, ChatMessage[]>>({});
  const [chatGenerating, setChatGenerating] = useState(false);

  // --- LOCAL PERSISTENCE ---
  useEffect(() => {
    // Load offline cache on mount
    try {
      const storedBookmarks = localStorage.getItem("arxiv_bookmarks");
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));

      const storedHistory = localStorage.getItem("arxiv_search_history");
      if (storedHistory) setSearchHistory(JSON.parse(storedHistory));

      const storedAnalysis = localStorage.getItem("arxiv_analysis_cache");
      if (storedAnalysis) setAnalysisCache(JSON.parse(storedAnalysis));

      const storedChats = localStorage.getItem("arxiv_chats_cache");
      if (storedChats) setChatCache(JSON.parse(storedChats));
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }, []);

  // Save Bookmarks
  const saveBookmarks = (newBookmarks: Paper[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem("arxiv_bookmarks", JSON.stringify(newBookmarks));
  };

  // Save History
  const saveSearchHistory = (newHistory: string[]) => {
    setSearchHistory(newHistory);
    localStorage.setItem("arxiv_search_history", JSON.stringify(newHistory));
  };

  // Save Analysis Cache
  const saveAnalysisCache = (newCache: Record<string, PaperAnalysis>) => {
    setAnalysisCache(newCache);
    localStorage.setItem("arxiv_analysis_cache", JSON.stringify(newCache));
  };

  // Save Chat Session Cache
  const saveChatCache = (newChats: Record<string, ChatMessage[]>) => {
    setChatCache(newChats);
    localStorage.setItem("arxiv_chats_cache", JSON.stringify(newChats));
  };

  const handleToggleBookmark = (paper: Paper, e: React.MouseEvent) => {
    e.stopPropagation();
    const isAlreadyBookmarked = bookmarks.some((b) => b.id === paper.id);
    if (isAlreadyBookmarked) {
      saveBookmarks(bookmarks.filter((b) => b.id !== paper.id));
    } else {
      saveBookmarks([paper, ...bookmarks]);
    }
  };

  const handleRemoveBookmark = (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveBookmarks(bookmarks.filter((b) => b.id !== paperId));
  };

  const handleClearHistory = () => {
    saveSearchHistory([]);
  };

  // --- SCIENTIFIC PAPER SEARCH ---
  const handleSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setIsLoading(true);
    setSearchError(null);

    // Save and update history array without duplicates
    const updatedHistory = [trimmedQuery, ...searchHistory.filter((h) => h !== trimmedQuery)].slice(0, 10);
    saveSearchHistory(updatedHistory);

    try {
      const response = await fetch(
        `/api/papers/search?query=${encodeURIComponent(trimmedQuery)}&maxResults=${maxResults}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      
      if (!response.ok) {
        throw new Error(`学术接口返回异常。错误码：${response.status}`);
      }

      const data = await response.json();
      if (data.papers && data.papers.length > 0) {
        setPapers(data.papers);
        setSelectedPaper(data.papers[0]); // Default focus on the top output
        setActiveTab("analysis"); // Default page back to key analysis
      } else {
        setSearchError("未找到与该检索词相关的学术论文，请换个词重试。");
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || "请求服务器处理学术信息失败。");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search on form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Trigger search from trending chips
  const handleTrendingSearch = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  // Select paper from Bookmarks or historical grids
  const handleSelectPaper = (paper: Paper) => {
    setSelectedPaper(paper);
    setActiveTab("analysis");
  };

  // --- GEMINI ACADEMIC SYNTHESIS ---
  const handleAnalyzePaper = async () => {
    if (!selectedPaper) return;
    
    // Check if cache already holds this
    if (analysisCache[selectedPaper.id]) {
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/papers/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedPaper.title,
          summary: selectedPaper.summary,
          authors: selectedPaper.authors,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI解析服务返回内部异常：状态码 ${response.status}`);
      }

      const report: PaperAnalysis = await response.json();
      const updatedCache = { ...analysisCache, [selectedPaper.id]: report };
      saveAnalysisCache(updatedCache);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "生成解读报告中途夭折，请稍候重试。");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Check state to trigger analysis if on analysis tab, easily fallback
  useEffect(() => {
    if (selectedPaper && activeTab === "analysis" && !analysisCache[selectedPaper.id]) {
      // We can either auto-start or let user click. Let's automatically trigger for immediate feedback!
      // This is very satisfying for the user!
      handleAnalyzePaper();
    }
  }, [selectedPaper, activeTab]);

  // --- CONVERSATION SERVICES ---
  const currentChatMessages = (() => {
    if (!selectedPaper) return [];
    
    // Return standard system welcoming if empty
    const history = chatCache[selectedPaper.id] || [];
    if (history.length === 0) {
      return [
        {
          role: "assistant",
          content: `你好！我是针对这篇论文的学术 AI 智囊。
          
我已对论文《${selectedPaper.title}》建立了知识库上下文。您可以向我咨询关于该研究的模型配置、创新边界、实验对比、公式或应用等任何问题。您也可以点击下方快捷提问开始。`,
          timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        },
      ] as ChatMessage[];
    }
    return history;
  })();

  const handleSendMessage = async (text: string) => {
    if (!selectedPaper || !text.trim() || chatGenerating) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };

    // Filter welcoming assistant speech from core history to keep context clean
    const localThread = currentChatMessages.filter((m) => m.content.indexOf("你好！我是针对这篇论文的学术") === -1);
    const updatedThread = [...currentChatMessages, userMsg];
    
    // Optimistic UI updates
    setChatCache((prev) => ({ ...prev, [selectedPaper.id]: updatedThread }));
    setChatGenerating(true);

    try {
      const response = await fetch("/api/papers/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedPaper.title,
          summary: selectedPaper.summary,
          authors: selectedPaper.authors,
          messages: localThread,
          userMessage: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Q&A 终端返回错误，状态码：${response.status}`);
      }

      const resJson = await response.json();
      
      const replyMsg: ChatMessage = {
        role: "assistant",
        content: resJson.reply,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };

      const finalThread = [...updatedThread, replyMsg];
      const newCache = { ...chatCache, [selectedPaper.id]: finalThread };
      saveChatCache(newCache);
    } catch (err: any) {
      console.error(err);
      const errReply: ChatMessage = {
        role: "assistant",
        content: `抱歉，智囊服务由于未连接通灵导致了通讯异常：${err.message || "请求服务器中断"}。请重试您的提问！`,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      const finalThread = [...updatedThread, errReply];
      setChatCache((prev) => ({ ...prev, [selectedPaper.id]: finalThread }));
    } finally {
      setChatGenerating(false);
    }
  };

  const handleClearChat = () => {
    if (!selectedPaper) return;
    const clearedCache = { ...chatCache };
    delete clearedCache[selectedPaper.id];
    saveChatCache(clearedCache);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 1. Sidebar bookmarks & hist */}
      <SidebarBookmarks
        bookmarks={bookmarks}
        history={searchHistory}
        currentQuery={query}
        onSelectPaper={handleSelectPaper}
        onSelectQuery={(q) => {
          setQuery(q);
          handleSearch(q);
        }}
        onRemoveBookmark={handleRemoveBookmark}
        onClearHistory={handleClearHistory}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 2. Main Space */}
      <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
        
        {/* Top Header Navigation */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="sm:hidden">
              <button
                id="sidebar-toggle-mobile"
                onClick={() => setSidebarOpen(true)}
                className="p-1 px-2 text-slate-500 rounded bg-slate-100"
              >
                列表
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Academic Intellect
              </h1>
              <span className="hidden sm:inline bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ArXiv 极联版
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick counters */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-100">
              <span className="flex items-center gap-1">
                已阅读: <span className="text-slate-800 font-bold">{Object.keys(analysisCache).length}</span> 篇
              </span>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1">
                已收藏: <span className="text-slate-800 font-bold">{bookmarks.length}</span> 篇
              </span>
            </div>

            {/* User credentials or info */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content scroll frame split in two zones: Search & Details */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ZONE A: SEARCH INTERFACE & RESULTS LIST */}
          <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 border-r border-slate-100 bg-white flex flex-col h-1/2 lg:h-full overflow-hidden">
            
            {/* Upper static search form container */}
            <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
              <form onSubmit={handleFormSubmit} className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-450 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="paper-keyword-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="输入学术关键词、期刊/发布编号或研究学者..."
                    className="w-full bg-slate-50 placeholder-slate-400 border border-slate-150 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100/40 transition-all font-mono"
                  />
                </div>
                
                {/* Advanced Search Options toggle */}
                <button
                  id="advanced-filters-toggle"
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    showFilters 
                      ? "bg-slate-900 border-slate-900 text-white" 
                      : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"
                  }`}
                  title="高级检索条件选项"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                <button
                  id="execute-search-btn"
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-2.5 px-4 rounded-2xl text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0 flex items-center justify-center"
                >
                  {isLoading ? "检索中..." : "检索"}
                </button>
              </form>

              {/* Advanced search conditions collapsible item */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-150/80 space-y-3 overflow-hidden text-xs"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {/* Sort selection */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">排序准则</label>
                        <select
                          id="filter-sort-by"
                          value={sortBy}
                          onChange={(e: any) => setSortBy(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
                        >
                          <option value="relevance">综合相关度</option>
                          <option value="lastUpdatedDate">最近修改时间</option>
                          <option value="submittedDate">首次发表期刊日期</option>
                        </select>
                      </div>

                      {/* Direction Selection */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">排序顺序</label>
                        <select
                          id="filter-sort-order"
                          value={sortOrder}
                          onChange={(e: any) => setSortOrder(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
                        >
                          <option value="descending">降序 (新/高)</option>
                          <option value="ascending">升序 (旧/低)</option>
                        </select>
                      </div>
                    </div>

                    {/* Max Results settings slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>最高检索匹配篇数</span>
                        <span className="text-blue-600 font-mono text-[11px]">{maxResults} 篇</span>
                      </div>
                      <input
                        id="filter-max-results-range"
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={maxResults}
                        onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sliding and scrollable listing body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/25">
              
              {/* Errors notifications */}
              {searchError && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-xs text-center space-y-1 font-medium">
                  <p>{searchError}</p>
                  <p className="text-[10px] text-red-400">ArXiv 接口有时会延迟，请稍后刷新检索尝试</p>
                </div>
              )}

              {/* Loader during query execution */}
              {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <span className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-600" />
                  </span>
                  <p className="text-xs text-slate-400 font-medium animate-pulse">正在向国际 arXiv 物理及计算机库请求学者论文...</p>
                </div>
              )}

              {/* Main List items */}
              {!isLoading && (
                <div className="space-y-3">
                  {/* Results count banner */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                    <span>学术论文检索结果 ({papers.length})</span>
                    {papers === SEED_PAPERS && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 p-0.5 px-2 rounded font-bold">推荐经典文献</span>
                    )}
                  </div>

                  {papers.map((p) => (
                    <PaperCard
                      key={p.id}
                      paper={p}
                      isSelected={selectedPaper?.id === p.id}
                      isBookmarked={bookmarks.some((b) => b.id === p.id)}
                      onSelect={() => handleSelectPaper(p)}
                      onToggleBookmark={(e) => handleToggleBookmark(p, e)}
                      onAnalyze={(e) => {
                        e.stopPropagation();
                        handleSelectPaper(p);
                        setActiveTab("analysis");
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Quick Start seed topics if query empty/no results */}
              {!isLoading && papers.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    热门研究追踪 & 学术方向检索
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {TRENDING_TOPICS.map((topic, index) => {
                      const Icon = IconComponentMap[topic.icon] || BookOpen;
                      return (
                        <div
                          key={index}
                          className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-blue-400 transition-all cursor-pointer flex gap-3 text-left group"
                          onClick={() => handleTrendingSearch(topic.query)}
                        >
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl h-9 w-9 shrink-0 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {topic.title}
                            </h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                              {topic.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ZONE B: EXPLORER AND ACTIVE SELECTION WORKSPACE */}
          <div className="flex-1 bg-white flex flex-col h-1/2 lg:h-full overflow-hidden border-t lg:border-t-0 border-slate-100">
            {selectedPaper ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Visual Workspace Toggles segment */}
                <div className="h-14 bg-slate-50/50 border-b border-slate-100 shrink-0 flex items-center justify-between px-6">
                  {/* Selectors tabs */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      id="tab-toggle-analysis"
                      onClick={() => setActiveTab("analysis")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "analysis"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      📑 AI 深度学术速读
                    </button>
                    <button
                      id="tab-toggle-chat"
                      onClick={() => setActiveTab("chat")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "chat"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      💬 与论文模拟对话
                    </button>
                  </div>

                  {/* Indicator info tag */}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Gemini 3.5 智慧引擎运行中</span>
                  </div>
                </div>

                {/* Right Tab panels workspace inner container scrollable */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  {activeTab === "analysis" ? (
                    <AnalysisView
                      paper={selectedPaper}
                      analysis={analysisCache[selectedPaper.id] || null}
                      isLoading={analysisLoading}
                      onRunAnalysis={handleAnalyzePaper}
                      error={analysisError}
                    />
                  ) : (
                    <PaperChat
                      paper={selectedPaper}
                      messages={currentChatMessages}
                      onSendMessage={handleSendMessage}
                      isGenerating={chatGenerating}
                      onClearChat={handleClearChat}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <BookOpen className="w-16 h-16 text-slate-300 stroke-1" />
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="font-semibold text-slate-900 text-sm">暂无选中的学术文献</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    请在左侧文献搜索列表中，点击您感兴趣的论文，便能在此开展 AI 文档解析和深度对话工作！
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
