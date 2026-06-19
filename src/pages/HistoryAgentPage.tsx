import { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Loader2, RotateCcw, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_TOPICS = [
  'The Life of Prophet Muhammad ﷺ',
  'The Islamic Golden Age',
  'The Ottoman Empire',
  'Al-Andalus: Islamic Spain',
  'The Rightly Guided Caliphs',
  'The Crusades',
  'Islamic Scholars & Scientists',
  'Rise of the Abbasid Caliphate',
  'Ancient Egypt & the Pharaohs',
  'The Mongol Conquests',
];

const HISTORY_AGENT_URL = import.meta.env.VITE_HISTORY_AGENT_URL;

export function HistoryAgentPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (!HISTORY_AGENT_URL) {
      setError('History agent URL is not configured. Please set VITE_HISTORY_AGENT_URL in your environment.');
      return;
    }

    setError(null);
    const userMessage: Message = { role: 'user', content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const assistantPlaceholder: Message = { role: 'assistant', content: '' };
    setMessages([...updatedMessages, assistantPlaceholder]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(HISTORY_AGENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta' &&
              parsed.delta.text
            ) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + parsed.delta.text },
                ];
              });
            }
          } catch {
            // skip malformed SSE events
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => prev.slice(0, -1));
      } else {
        const message = err instanceof Error ? err.message : 'Failed to get response';
        setError(message);
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTopicClick = (topic: string) => {
    sendMessage(`Tell me about: ${topic}`);
  };

  const handleReset = () => {
    if (isLoading) {
      abortControllerRef.current?.abort();
    }
    setMessages([]);
    setError(null);
    setInput('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar isScrolled={isScrolled} activeSection="history" />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 pt-28 pb-10 px-4">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 mb-4">
            <BookOpen className="text-amber-400" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
            History Teaching Agent
          </h1>
          <p className="text-emerald-200 text-base md:text-lg max-w-xl mx-auto">
            Explore Islamic history and world history through conversation.
            Ask about any era, civilization, or historical event.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {/* Suggested Topics */}
        {messages.length === 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Suggested Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors duration-200"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                    <BookOpen size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-sm'
                      : 'bg-white shadow-md border border-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-emerald-800 prose-headings:font-serif prose-strong:text-gray-900 prose-a:text-emerald-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Scroll to bottom button */}
        {messages.length > 3 && (
          <div className="fixed bottom-32 right-6 z-10">
            <button
              onClick={scrollToBottom}
              className="w-10 h-10 rounded-full bg-emerald-700 text-white shadow-lg flex items-center justify-center hover:bg-emerald-800 transition-colors"
              aria-label="Scroll to bottom"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RotateCcw size={12} />
                New conversation
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any historical topic..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 bg-gray-50 max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
