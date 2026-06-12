import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Write diagnostics to /src/debug.log
const diagFile = path.join(process.cwd(), "src", "debug.log");
let diagMsg = `--- Diagnostics Ran At: ${new Date().toISOString()} ---\n`;
diagMsg += `cwd: ${process.cwd()}\n`;
diagMsg += `GEMINI_API_KEY exists: ${!!process.env.GEMINI_API_KEY}\n`;
if (process.env.GEMINI_API_KEY) {
  diagMsg += `GEMINI_API_KEY length: ${process.env.GEMINI_API_KEY.length}\n`;
  diagMsg += `GEMINI_API_KEY starts with: ${process.env.GEMINI_API_KEY.substring(0, 4)}\n`;
}
diagMsg += `All env keys: ${Object.keys(process.env).join(", ")}\n`;

// Enable JSON parsing
app.use(express.json());

// Initialize server-side Gemini API client
console.log("--- Gemini API Diagnostics ---");
console.log("GEMINI_API_KEY env exists:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY.length);
  console.log("GEMINI_API_KEY starts with AIza:", process.env.GEMINI_API_KEY.startsWith("AIza"));
} else {
  console.log("GEMINI_API_KEY is not defined in process.env");
}
console.log("------------------------------");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || undefined,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

(async () => {
  try {
    const testRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hi",
    });
    diagMsg += `Test call success response: ${testRes.text?.trim()}\n`;
  } catch (err: any) {
    diagMsg += `Test call failure error: ${err.message}\n`;
    diagMsg += `Stack: ${err.stack || ""}\n`;
    diagMsg += `JSON representation: ${JSON.stringify(err)}\n`;
  }
  try {
    fs.writeFileSync(diagFile, diagMsg);
    console.log("Wrote diagnostic file to:", diagFile);
  } catch (fsErr: any) {
    console.error("Failed to write diagnostics file:", fsErr);
  }
})();

// Helper function to decode XML html-entities
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 1. Search papers endpoint (Proxy ArXiv API)
app.get("/api/papers/search", async (req, res) => {
  const originalQuery = req.query.query as string;
  const maxResults = parseInt((req.query.maxResults as string) || "15", 10);
  const sortBy = (req.query.sortBy as string) || "relevance"; // relevance, lastUpdatedDate, submittedDate
  const sortOrder = (req.query.sortOrder as string) || "descending"; // descending, ascending

  if (!originalQuery) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    let queryToSearch = originalQuery.trim();

    // If query contains Chinese characters, request Gemini-3.5-flash to translate/optimize it for ArXiv search
    const hasChinese = /[\u4e00-\u9fa5]/.test(originalQuery);
    if (hasChinese) {
      try {
        console.log(`Chinese query detected: "${originalQuery}". Directing to Gemini-3.5-flash for academic translation...`);
        const translationPrompt = `You are an elite academic search query translation engineer. Translate the following Chinese search query into a highly optimized, precise combinations of English academic keywords or field terms for searching on ArXiv.
        
Search request: "${originalQuery}"

Return strictly the English query terms/phrase. Do NOT include any quotes, explanations, markdown formatting, or system text. Just return the raw keywords suited for all-field arXiv search.`;

        const translationResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: translationPrompt,
        });

        const resultText = translationResponse.text?.trim();
        if (resultText) {
          queryToSearch = resultText;
          console.log(`Query successfully translated by Gemini: "${originalQuery}" -> "${queryToSearch}"`);
        }
      } catch (gemError) {
        console.error("Failed to translate query using Gemini, fallback to original:", gemError);
      }
    }

    // Formulate ArXiv query
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(queryToSearch)}&start=0&max_results=${maxResults}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    console.log(`Fetching from ArXiv: ${arxivUrl}`);
    const fetchResponse = await fetch(arxivUrl);
    if (!fetchResponse.ok) {
      throw new Error(`ArXiv API returned status: ${fetchResponse.status}`);
    }

    const xmlText = await fetchResponse.text();

    // Parse the Atom XML feed with namespace tolerance (handles standard <entry> and <atom:entry>)
    const entryMatches = xmlText.match(/<(?:atom:)?entry>([\s\S]*?)<\/(?:atom:)?entry>/gi) || [];
    
    const papers = entryMatches.map((entry) => {
      const idMatch = entry.match(/<(?:atom:)?id>([\s\S]*?)<\/(?:atom:)?id>/i);
      const titleMatch = entry.match(/<(?:atom:)?title>([\s\S]*?)<\/(?:atom:)?title>/i);
      const summaryMatch = entry.match(/<(?:atom:)?summary>([\s\S]*?)<\/(?:atom:)?summary>/i);
      const publishedMatch = entry.match(/<(?:atom:)?published>([\s\S]*?)<\/(?:atom:)?published>/i);

      // Extract authors
      const authorBlockRegex = /<(?:atom:)?author>([\s\S]*?)<\/(?:atom:)?author>/gi;
      const authorMatches = [...entry.matchAll(authorBlockRegex)];
      const authors = authorMatches
        .map((m) => {
          const nameMatch = m[1].match(/<(?:atom:)?name>([\s\S]*?)<\/(?:atom:)?name>/i);
          return nameMatch ? decodeXmlEntities(nameMatch[1]) : "";
        })
        .filter(Boolean);

      // Extract categories
      const categoryMatches = [...entry.matchAll(/<category\s+([^>]*?)term="([^"]+)"/g)];
      const categories = categoryMatches.map((m) => m[2]);

      const title = titleMatch ? decodeXmlEntities(titleMatch[1]) : "Untitled";
      const summary = summaryMatch ? decodeXmlEntities(summaryMatch[1]) : "No abstract available.";
      const rawId = idMatch ? idMatch[1].trim() : "";
      
      // Clean up ID and prepare PDF URL
      const arxivIdMatch = rawId.match(/abs\/([^>\s]+)/) || rawId.match(/arxiv.org\/abs\/([^\s]+)/);
      const arxivId = arxivIdMatch ? arxivIdMatch[1] : rawId;
      const pdfUrl = rawId.includes("pdf") ? rawId : rawId.replace("/abs/", "/pdf/") + ".pdf";
      const published = publishedMatch ? publishedMatch[1].trim() : "";

      return {
        id: arxivId,
        title,
        summary,
        authors,
        categories,
        pdfUrl,
        published,
      };
    });

    res.json({ papers });
  } catch (error: any) {
    console.error("Error searching ArXiv papers:", error);
    res.status(500).json({ error: "Failed to fetch papers from academic database.", details: error.message });
  }
});

// 2. Explain/Analyze Paper using Gemini-3.5-flash
app.post("/api/papers/analyze", async (req, res) => {
  const { title, summary, authors } = req.body;

  if (!title || !summary) {
    return res.status(400).json({ error: "Missing title or summary parameter" });
  }

  try {
    const prompt = `You are an elite scientific research AI. Deeply analyze the following scientific paper abstract and return a structured JSON synthesis.
    
Paper Title: ${title}
Authors: ${authors ? (Array.isArray(authors) ? authors.join(", ") : authors) : "Unknown"}
Abstract: ${summary}

Provide your response in JSON format. It must follow this strict schema structure:
{
  "contribution": "A professional paragraph summarizing the core contributions and innovation of this paper.",
  "methodology": "A detailed paragraph explaining the methodology, model architecture, or research framework utilized.",
  "findings": [
    "Key milestone, result, or experimental performance finding 1",
    "Key milestone, result, or experimental performance finding 2",
    "Key milestone, result, or experimental performance finding 3"
  ],
  "limitations": [
    "Identified limitation, constraint, or dataset boundary 1",
    "Identified limitation, constraint, or dataset boundary 2"
  ],
  "futureDirections": "Promising avenues of future work indicated or enabled by this paper's insights.",
  "keywords": ["5 to 8 precise, high-level scientific and technical concept tags representing files or key ideas"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contribution: { type: Type.STRING },
            methodology: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            limitations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            futureDirections: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["contribution", "methodology", "findings", "limitations", "futureDirections", "keywords"],
        },
      },
    });

    const text = response.text || "{}";
    const analysis = JSON.parse(text);
    res.json(analysis);
  } catch (error: any) {
    console.error("Error analyzing paper with Gemini:", error);
    
    // Check if it is a credential, API key, scope or permissions issue, or missing key
    const isAuthError = error.message?.includes("authentication") || 
                        error.message?.includes("scopes") || 
                        error.message?.includes("PERMISSION_DENIED") || 
                        error.status === 403 || 
                        !process.env.GEMINI_API_KEY;

    if (isAuthError) {
      return res.json({
        contribution: "⚠️ **Gemini 论文全维度深度解剖尚未激活**。要解锁此强大的论文核心学术贡献与智能长文极速解剖摘要，请前往 AI Studio 编辑器的右上角/齿轮 **Settings > Secrets** 面板，添加名为 **`GEMINI_API_KEY`** 的 Secret 环境变量并填入您的 API 密钥。",
        methodology: "模型配置成功热加载后，Gemini 3.5 旗舰大模型将全天候自动激活运作：从公式推导、数据工程、消融实验到方案架构深度剥离分析。",
        findings: [
          "未绑定/激活 GEMINI_API_KEY 或 API 授权范围受限 (scopes error)",
          "请访问 Google AI Studio (ai.studio) 免费获取开发密钥",
          "在 AI Studio Settings 绑定密钥后系统会自动重启并热加载生效"
        ],
        limitations: [
          "您当前正以「离线纸质及基本元数据检索」的本地预览模式浏览此平台",
          "此状态下暂不支持云端大模型在线对话推理与跨语种摘要润色解析"
        ],
        futureDirections: "配置密钥生效后，右侧的「学术导师智囊 Q&A」多轮问答对话将全面激活，让您的论文泛读和精读效率提升百倍！",
        keywords: ["配置API_KEY", "激活学术AI", "论文极速精读", "多项研究对比"],
        isPlaceholder: true
      });
    }

    res.status(500).json({ error: "Failed to generate paper analysis.", details: error.message });
  }
});

// 3. Interactive Q&A Chat with Paper using Gemini-3.5-flash
app.post("/api/papers/chat", async (req, res) => {
  const { title, summary, authors, messages, userMessage } = req.body;

  if (!title || !summary || !userMessage) {
    return res.status(400).json({ error: "Missing required parameters (title, summary, userMessage)" });
  }

  try {
    // Construct chat system instructions referencing paper contents
    const systemInstruction = `You are "PaperIntellect", an advanced scientific dialogue partner. 
You are deeply discussing the academic paper titled "${title}" authored by ${authors ? (Array.isArray(authors) ? authors.join(", ") : authors) : "Unknown"}.
The abstract/summary of the paper is provided below as the absolute context:

---
${summary}
---

Your goal is to answer the user's questions about this paper's domain, approach, and scope. 
- Use the provided summary as the source of truth, but bring in your broad scientific knowledge to elaborate or explain complex concepts when asked, clearly distinguishing paper facts from general concepts.
- Adopt a professional, extremely clear, student-friendly and academic tone.
- Keep answers structured with bullet points or clear typography.`;

    // Construct history parts or chat
    const chatHistory = messages || [];
    
    // We can use standard generateContent with complete message thread to avoid complex stateful chat endpoints,
    // which works phenomenally and is stateless/robust.
    const contents: any[] = [];
    
    // Convert history format to turn-based content
    chatHistory.forEach((msg: any) => {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    });

    // Add final message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Ensure we do not try to make API call if API key clearly doesn't exist
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("PERMISSION_DENIED_NO_KEY");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Error in paper chat endpoint:", error);
    
    const isAuthError = error.message?.includes("authentication") || 
                        error.message?.includes("scopes") || 
                        error.message?.includes("PERMISSION_DENIED") || 
                        error.message?.includes("PERMISSION_DENIED_NO_KEY") ||
                        error.status === 403 || 
                        !process.env.GEMINI_API_KEY;

    if (isAuthError) {
      return res.json({
        reply: "⚠️ **学术智囊对话激活指引**\n\n欢迎来到您的个人论文对话导师模块！目前大模型学术问答服务的 **`GEMINI_API_KEY`** 尚未配置，导致无法接入云端大模型数据库。\n\n**🛠️ 激活步骤：**\n\n1. 点击 AI Studio 顶部的 **Settings** ⚙️ 齿轮图标（或右侧的 Secrets 控制键）。\n2. 点击 **Secrets** 类别添加如下环境变量：\n   - **Name/键名**: `GEMINI_API_KEY`\n   - **Value/键值**: *[填入您在 Google AI Studio 获取的 API Key]*\n\n配置成功后系统会自动重建。再次提问，我将为您深度剖析本篇论文的参数、数学模型及实验创见！"
      });
    }

    res.status(500).json({ error: "Failed to process chat response.", details: error.message });
  }
});

// Setup Vite & static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server setup
    console.log("Loading Vite DevServer Middlewares...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build static assets serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Academic paper server booting successfully`);
    console.log(`Port: ${PORT}`);
    console.log(`Access at http://0.0.0.0:${PORT}`);
  });
}

startServer();
