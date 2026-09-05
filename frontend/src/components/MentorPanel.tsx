import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Terminal, 
  Code, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  FileCode2,
  Play,
  ShieldCheck
} from 'lucide-react';
import { ProjectIdea, CitationItem, AstVivaResponse, StudentProfile } from '../types';
import { ApiService } from '../services/api';

interface MentorPanelProps {
  activeIdea: ProjectIdea | null;
  activeProfile: StudentProfile | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: CitationItem[];
  timestamp: string;
  confidence_score?: number;
  confidence_label?: string;
  source_count?: number;
  is_grounded?: boolean;
}


export const MentorPanel: React.FC<MentorPanelProps> = ({
  activeIdea,
  activeProfile
}) => {
  const [activeTab, setActiveTab] = useState<'mentor' | 'ast_viva'>('mentor');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Greetings. I am **Dr. Aris**, your technical faculty advisor for **${
        activeIdea?.title || 'your Engineering Capstone'
      }**.\n\nI am here to guide your system architecture, data pipeline calibration, and viva defense preparation. How can we advance your project today?`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // AST Viva state
  const [sourceCode, setSourceCode] = useState<string>(`import asyncio
from fastapi import FastAPI, HTTPException
import onnxruntime as ort
import numpy as np

app = FastAPI(title="EdgeMed Triage Service")

class PathologyInferenceEngine:
    def __init__(self, model_path: str = "models/chest_pathology_int8.onnx"):
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name

    async def predict_pathologies(self, image_tensor: list):
        try:
            arr = np.array(image_tensor, dtype=np.float32)
            outputs = self.session.run(None, {self.input_name: arr})
            return {"status": "success", "probabilities": outputs[0].tolist()}
        except Exception as e:
            return {"status": "error", "message": str(e)}
`);
  const [astAnalysis, setAstAnalysis] = useState<AstVivaResponse | null>(null);
  const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle SSE streaming chat
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isStreaming) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsStreaming(true);

    const assistantMsgId = `asst-${Date.now()}`;
    // Temporary assistant placeholder
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    try {
      const response = await fetch('http://127.0.0.1:8000/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeIdea?.id || 'sample-project',
          project_title: activeIdea?.title || 'Engineering Capstone',
          project_domain: activeIdea?.domain || 'General',
          message: query,
          skill_gaps: activeIdea?.skill_coverage?.missing_skills || [],
          citations: []
        })
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let collectedCitations: CitationItem[] = [];
      let collectedConfidenceLabel = '';
      let collectedConfidenceScore: number | undefined;
      let collectedIsGrounded: boolean | undefined;
      let collectedSourceCount: number | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                accumulatedText += data.token;
              }
              if (data.citations) {
                collectedCitations = data.citations;
              }
              if (data.confidence_label) {
                collectedConfidenceLabel = data.confidence_label;
              }
              if (data.confidence_score !== undefined) {
                collectedConfidenceScore = data.confidence_score;
              }
              if (data.is_grounded !== undefined) {
                collectedIsGrounded = data.is_grounded;
              }
              if (data.source_count !== undefined) {
                collectedSourceCount = data.source_count;
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        text: accumulatedText,
                        citations: collectedCitations,
                        confidence_label: collectedConfidenceLabel,
                        confidence_score: collectedConfidenceScore,
                        is_grounded: collectedIsGrounded,
                        source_count: collectedSourceCount
                      }
                    : m
                )
              );
            } catch (e) {
              // Non-fatal parse error in chunk stream
            }
          }
        }
      }

      // Final attach
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: accumulatedText,
                citations: collectedCitations,
                confidence_label: collectedConfidenceLabel,
                confidence_score: collectedConfidenceScore,
                is_grounded: collectedIsGrounded,
                source_count: collectedSourceCount
              }
            : m
        )
      );

    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: `As your faculty advisor for **${activeIdea?.title || 'your capstone'}**, ensure you benchmark latency and memory footprint before submission. Let us focus on your core architecture deliverables.`
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Run AST Analysis
  const handleRunAstAnalysis = async () => {
    setIsAnalyzingCode(true);
    try {
      const res = await ApiService.analyzeAstViva(sourceCode, 'pipeline.py');
      setAstAnalysis(res);
    } catch (err: any) {
      console.error('AST analysis error:', err);
    } finally {
      setIsAnalyzingCode(false);
    }
  };

  return (
    <div className="academic-card overflow-hidden flex flex-col h-[740px]">
      {/* Tab Switcher Header */}
      <div className="bg-[#faf7f2] border-b border-[#e7e2d8] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'mentor'
                ? 'bg-white text-[#1d6e5c] shadow-sm border border-[#d6cfc4]'
                : 'text-[#57534e] hover:text-[#1c1917]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Faculty Advisor (Dr. Aris)
          </button>
          <button
            onClick={() => setActiveTab('ast_viva')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ast_viva'
                ? 'bg-white text-[#1d6e5c] shadow-sm border border-[#d6cfc4]'
                : 'text-[#57534e] hover:text-[#1c1917]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Static AST Viva Inspector
          </button>
        </div>

        <span className="text-[11px] font-mono text-[#78716c] hidden sm:block">
          {activeIdea ? activeIdea.title.split(':')[0] : 'Project Workbench'}
        </span>
      </div>

      {/* Tab 1: Dr. Aris Chat */}
      {activeTab === 'mentor' && (
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 blueprint-grid-dense">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#78716c] mb-1 px-1 w-full max-w-[85%]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{m.sender === 'user' ? 'Student' : 'Dr. Aris (Faculty Mentor)'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  {m.sender === 'assistant' && (m.confidence_label || m.confidence_score !== undefined) && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border shadow-xs ${
                      m.is_grounded === false
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-[#faf7f2] text-[#1d6e5c] border-[#d6cfc4]'
                    }`}>
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      {m.confidence_label || `Answer Confidence: ${m.confidence_score ?? 95}%`}
                      {m.source_count !== undefined && m.source_count > 0 ? ` • ${m.source_count} sources` : ''}
                    </span>
                  )}
                </div>


                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-[#1d6e5c] text-white rounded-tr-none'
                      : 'academic-card text-[#1c1917] rounded-tl-none space-y-2'
                  }`}
                >
                  <div>{m.text || <span className="animate-pulse">Synthesizing advisory response...</span>}</div>

                  {/* Grounded Citation Chips */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-[#e7e2d8] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#78716c] font-bold block">
                        Grounded Research Citations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations.map((c, i) => (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#faf7f2] border border-[#d6cfc4] hover:border-[#1d6e5c] text-[#1d6e5c] px-2 py-0.5 rounded transition-colors"
                          >
                            <BookOpen className="w-3 h-3" />
                            {c.title} ({c.year})
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 bg-[#faf7f2] border-t border-[#e7e2d8] flex items-center gap-1.5 overflow-x-auto text-[11px] text-[#57534e]">
            <span className="font-mono text-[10px] text-[#78716c] shrink-0">Prompts:</span>
            <button
              onClick={() => handleSendMessage("How do I handle INT8 quantization error in clinical imaging?")}
              className="bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] px-2 py-1 rounded shrink-0 transition-colors text-left"
            >
              INT8 Quantization Trade-offs
            </button>
            <button
              onClick={() => handleSendMessage("What viva questions will the evaluation committee ask about our database layer?")}
              className="bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] px-2 py-1 rounded shrink-0 transition-colors text-left"
            >
              Viva Defense Questions
            </button>
            <button
              onClick={() => handleSendMessage("How do we bridge our missing skill gap in under 3 weeks?")}
              className="bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] px-2 py-1 rounded shrink-0 transition-colors text-left"
            >
              Skill Gap Roadmap
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-[#e7e2d8] flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Dr. Aris about your architecture, stack trade-offs, or viva defense..."
              className="flex-1 bg-[#faf7f2] border border-[#d6cfc4] rounded-lg px-3 py-2 text-xs font-sans text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isStreaming || !inputMessage.trim()}
              className="p-2 bg-[#1d6e5c] text-white rounded-lg hover:bg-[#165648] disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Tab 2: AST Static Analysis Viva Voce */}
      {activeTab === 'ast_viva' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <h4 className="font-serif-heading font-bold text-base text-[#1c1917] flex items-center justify-between">
              <span>AST Static Code Inspector for Viva Defense</span>
              <span className="text-xs font-mono text-[#1d6e5c] font-bold">Python ast parser</span>
            </h4>
            <p className="text-xs text-[#57534e]">
              Paste your capstone code snippet below. Our static parser detects actual imports, class hierarchies, and async patterns to synthesize targeted viva defense questions.
            </p>
          </div>

          {/* Code editor textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-[#78716c]">
              <span>pipeline.py (Python Source)</span>
              <button
                onClick={handleRunAstAnalysis}
                disabled={isAnalyzingCode}
                className="px-3 py-1 bg-[#1d6e5c] text-white rounded font-sans font-semibold text-xs hover:bg-[#165648] transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" />
                {isAnalyzingCode ? 'Analyzing AST...' : 'Run Static AST Analysis'}
              </button>
            </div>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              rows={9}
              className="w-full bg-[#1c1917] text-[#e7e2d8] font-mono text-xs p-3 rounded-lg border border-[#44403c] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            />
          </div>

          {/* Analysis Results & Generated Questions */}
          {astAnalysis && (
            <div className="space-y-3 pt-2">
              {/* Detected Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="academic-card p-2">
                  <span className="text-[#78716c] block text-[10px]">Detected Modules</span>
                  <span className="font-bold text-[#1d6e5c] line-clamp-1">
                    {astAnalysis.stats.detected_modules.join(', ') || 'None'}
                  </span>
                </div>
                <div className="academic-card p-2">
                  <span className="text-[#78716c] block text-[10px]">Async Coroutines</span>
                  <span className="font-bold text-[#1c1917]">{astAnalysis.stats.async_function_count}</span>
                </div>
                <div className="academic-card p-2">
                  <span className="text-[#78716c] block text-[10px]">Class Count</span>
                  <span className="font-bold text-[#1c1917]">{astAnalysis.stats.class_count}</span>
                </div>
                <div className="academic-card p-2">
                  <span className="text-[#78716c] block text-[10px]">Exception Handling</span>
                  <span className="font-bold text-emerald-700">
                    {astAnalysis.stats.has_exception_handling ? 'Verified' : 'Missing'}
                  </span>
                </div>
              </div>

              {/* Viva Voce Targeted Defense Questions */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase font-bold text-[#1d6e5c] block">
                  Targeted Viva Questions for Your Defense:
                </span>

                {astAnalysis.viva_questions.map((q, idx) => (
                  <div key={idx} className="academic-card p-3 text-xs space-y-1.5 border-l-4 border-l-[#1d6e5c]">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#1c1917]">{q.category}</span>
                      <span className="text-[#78716c] text-[10px]">{q.evaluated_construct}</span>
                    </div>
                    <p className="text-[#1c1917] font-medium leading-relaxed">{q.question}</p>
                    <div className="pt-1 flex flex-wrap items-center gap-1 text-[10px] font-mono">
                      <span className="text-[#78716c]">Expected Keywords:</span>
                      {q.expected_keywords.map((kw, i) => (
                        <span key={i} className="bg-[#ede8df] text-[#57534e] px-1.5 py-0.2 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
