export interface Paper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  categories: string[];
  pdfUrl: string;
  published: string;
}

export interface PaperAnalysis {
  contribution: string;
  methodology: string;
  findings: string[];
  limitations: string[];
  futureDirections: string;
  keywords: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SearchQueryConfig {
  query: string;
  sortBy: "relevance" | "lastUpdatedDate" | "submittedDate";
  sortOrder: "descending" | "ascending";
  maxResults: number;
}
