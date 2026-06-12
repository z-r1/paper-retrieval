// Academic disciplines map for ArXiv category designations
export const CATEGORY_MAP: Record<string, { label: string; bg: string; text?: string }> = {
  // Computer Science
  "cs.AI": { label: "Artificial Intelligence", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.CL": { label: "Computation & Language (NLP)", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.CV": { label: "Computer Vision", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.LG": { label: "Machine Learning (cs)", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.NE": { label: "Neural & Evolutionary Computing", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.RO": { label: "Robotics", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.CR": { label: "Cryptography & Security", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.DB": { label: "Databases", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.HC": { label: "Human-Computer Interaction", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cs.IR": { label: "Information Retrieval", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  
  // Statistics / Machine Learning
  "stat.ML": { label: "Machine Learning (stat)", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  "stat.ME": { label: "Methodology", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  "stat.AP": { label: "Applied Statistics", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  "stat.TH": { label: "Theory", bg: "bg-amber-50 text-amber-700 border-amber-200" },

  // Mathematics
  "math.QA": { label: "Quantum Algebra", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  "math.PR": { label: "Probability", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  "math.CO": { label: "Combinatorics", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  "math.AP": { label: "Analysis of PDEs", bg: "bg-blue-50 text-blue-700 border-blue-200" },

  // Physics
  "quant-ph": { label: "Quantum Physics", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  "hep-th": { label: "High Energy Physics - Theory", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  "astro-ph": { label: "Astrophysics", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  "physics.comp-ph": { label: "Computational Physics", bg: "bg-purple-50 text-purple-700 border-purple-200" },

  // Biology & Finance & EESS
  "q-bio.NC": { label: "Neurons & Cognition", bg: "bg-rose-50 text-rose-700 border-rose-200" },
  "q-bio.BM": { label: "Biomolecules", bg: "bg-rose-50 text-rose-700 border-rose-200" },
  "q-fin.ST": { label: "Statistical Finance", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  "eess.AS": { label: "Audio & Speech Processing", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "eess.IV": { label: "Image & Video Processing", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "eess.SP": { label: "Signal Processing", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

export const DEFAULT_BADGE = {
  label: "Scientific Paper",
  bg: "bg-slate-50 text-slate-700 border-slate-200",
};

// Generates an elegant readable category tag for ArXiv domains
export function getCategoryBadge(term: string) {
  return CATEGORY_MAP[term] || { label: term, bg: DEFAULT_BADGE.bg };
}

// Popular research topics for seed searches
export interface TrendingTopic {
  title: string;
  query: string;
  description: string;
  icon: string;
}

export const TRENDING_TOPICS: TrendingTopic[] = [
  {
    title: "Large Language Models",
    query: "Large Language Models",
    description: "LLM scaling laws, transformer optimizations, and reinforcement learning alignment.",
    icon: "Cpu",
  },
  {
    title: "Quantum Computation",
    query: "Quantum Computing hardware algorithm",
    description: "Superconducting qubits, fault-tolerant gate systems, and quantum cryptography.",
    icon: "Atom",
  },
  {
    title: "Climatic Forecasting",
    query: "Climate climate simulation neural network",
    description: "Global warming models, deep learning weather predictions, and ice-sheet dynamics.",
    icon: "Globe",
  },
  {
    title: "CRISPR & BioTech",
    query: "CRISPR gene editing therapy",
    description: "Genetic engineering therapies, Cas9 precision enhancements, and biomolecule synthesis.",
    icon: "Dna",
  },
  {
    title: "Text-to-Image Imagen",
    query: "Diffusion text-to-image generative models",
    description: "Latent diffusion architectures, high-resolution visual syntheses, and canvas edits.",
    icon: "Sparkles",
  },
  {
    title: "Astronomy Exoplanets",
    query: "Exoplanets transit spectroscopic James Webb",
    description: "Discoveries of planetary transit signatures, James Webb spectroscopy, and biosignatures.",
    icon: "Orbit",
  },
];

// Seed sample papers for instant render when user hasn't typed anything,
// preventing cold blank screens and acting as awesome starting previews!
export const SEED_PAPERS = [
  {
    id: "2005.11401",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    summary: "Large pre-trained language models have been shown to store implicit knowledge in their parameters, and achieve state-of-the-art results when transfer-learned to downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and they can hallucinate or perform poorly on knowledge-intensive jobs. We propose Retrieval-Augmented Generation (RAG) which merges frozen pre-trained generators with dense neural search indices, showing state-of-the-art accuracy in factual question answering and open-domain dialogues.",
    authors: ["Patrick Lewis", "Ethan Perez", "Aleksandra Piktus", "Fabio Petroni", "Vladimir Karpukhin", "Naman Goyal", "Heinrich Küttler", "Mike Lewis", "Wen-tau Yih", "Tim Rocktäschel", "Sebastian Riedel", "Douwe Kiela"],
    categories: ["cs.CL", "cs.AI", "cs.LG"],
    pdfUrl: "https://arxiv.org/pdf/2005.11401.pdf",
    published: "2020-05-22T19:04:12Z",
  },
  {
    id: "1706.03762",
    title: "Attention Is All You Need",
    summary: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable.",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Lukasz Kaiser", "Illia Polosukhin"],
    categories: ["cs.CL", "cs.LG"],
    pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    published: "2017-06-12T18:00:00Z",
  },
  {
    id: "1512.03385",
    title: "Deep Residual Learning for Image Recognition",
    summary: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from greatly increased depth.",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    categories: ["cs.CV", "cs.LG"],
    pdfUrl: "https://arxiv.org/pdf/1512.03385.pdf",
    published: "2015-12-10T11:23:44Z",
  },
];
