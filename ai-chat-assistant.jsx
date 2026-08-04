import { useState, useRef, useEffect } from 'react';
import { Search, Calendar, Megaphone, MessageSquare, TrendingUp, BarChart3, Send, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

const SKILLS = {
  research_company: {
    label: 'Company Research',
    icon: Search,
    accent: '#2563eb',
    loading: 'Researching company...',
    example: 'Research Notion before my call',
    system: `You are a B2B sales research assistant inside a GTM AI assistant. When given a company name (and optionally a contact or deal context), research the company using web search and produce a concise briefing a seller can use before a call.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence conversational summary of the company and why it matters right now", "insights": ["4-6 short factual bullets: what they do, size or funding, recent news, market position - each under 20 words"], "next_actions": ["2-3 short suggested next steps for a seller"]}

If the company name is missing or too ambiguous to research, set "response" to a short clarifying question asking for the company name, and leave insights and next_actions as empty arrays. Never invent facts you didn't find.`,
  },
  prepare_meeting: {
    label: 'Meeting Prep',
    icon: Calendar,
    accent: '#7c3aed',
    loading: 'Preparing your brief...',
    example: "Prep me for tomorrow's meeting with a VP of Sales",
    system: `You are a meeting-prep assistant for salespeople. Given whatever details the user provides about an upcoming meeting (attendee, company, deal stage, past context), produce a short prep brief.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence framing of who this meeting is with and what's at stake", "insights": ["3-5 short bullets: talking points, likely questions, relevant context to raise"], "next_actions": ["2-3 concrete things to do before the meeting"]}

If key details are missing (who the meeting is with, what it's about), set "response" to a short friendly question asking for those details, and leave insights and next_actions as empty arrays.`,
  },
  generate_campaign: {
    label: 'Campaign Generation',
    icon: Megaphone,
    accent: '#db2777',
    loading: 'Drafting campaign...',
    example: 'Generate a campaign for our new pricing tier',
    system: `You are a campaign strategist for a marketing and sales team. Given a product, audience, or goal, draft a campaign concept.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence pitch of the campaign concept and angle", "insights": ["3-5 short bullets: channel mix, key message, target segment, hook ideas"], "next_actions": ["2-3 concrete next steps to launch it"]}

If the product, audience, or goal is missing, set "response" to a short question asking for that context, and leave insights and next_actions as empty arrays.`,
  },
  analyze_conversation: {
    label: 'Conversation Analysis',
    icon: MessageSquare,
    accent: '#059669',
    loading: 'Analyzing conversation...',
    example: 'Analyze this call: the prospect loved the demo but said pricing felt steep',
    system: `You are a conversation intelligence assistant. Given a pasted transcript, notes, or description of a sales conversation, analyze it.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence read on how the conversation went overall", "insights": ["3-6 short bullets: objections raised, buying signals noticed, open questions, risks"], "next_actions": ["2-3 concrete follow-up actions"]}

If no conversation content was actually provided, set "response" to a short request asking the user to paste the transcript or describe the conversation, and leave insights and next_actions as empty arrays.`,
  },
  find_buying_signals: {
    label: 'Buying Signals',
    icon: TrendingUp,
    accent: '#d97706',
    loading: 'Scanning for signals...',
    example: 'Find buying signals for Figma',
    system: `You are a buying-signals research assistant. Given a company or account name, use web search to find recent, credible signals that indicate buying intent (funding, leadership changes, hiring surges, product launches, expansion news).

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence summary of the strongest signal found and why it matters", "insights": ["3-5 short bullets, one signal each with a brief note on relevance"], "next_actions": ["2-3 suggested ways to act on these signals"]}

If no company is named, set "response" to a short clarifying question, and leave insights and next_actions as empty arrays. If you find no meaningful recent signals, say so honestly instead of inventing any.`,
  },
  weekly_report: {
    label: 'Weekly Report',
    icon: BarChart3,
    accent: '#0891b2',
    loading: 'Building your report...',
    example: "Give me this week's report — 3 new deals, 12 calls, lost the Acme deal",
    system: `You are a reporting assistant. Given a summary of the week's activity the user provides (deals, calls, emails, blockers), structure it into a clean weekly report. Never invent numbers or activity the user didn't mention.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence executive summary of the week", "insights": ["3-6 short bullets covering wins, risks, and metrics the user mentioned"], "next_actions": ["2-3 priorities for next week"]}

If no activity or context was provided at all, set "response" to a short question asking what happened this week, and leave insights and next_actions as empty arrays.`,
  },
  pricing_and_docs: {
    label: 'Pricing & Docs',
    icon: HelpCircle,
    accent: '#dc2626',
    loading: 'Looking that up...',
    example: "What's included in the Team plan pricing?",
    system: `You are a product-information assistant. Given a question about pricing, plans, subscriptions, usage limits, or documentation - for the user's own product or a third-party tool - use web search to find accurate, current, publicly available information.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "2-3 sentence direct answer to the question", "insights": ["3-5 short bullets: exact figures, plan tiers, limits, or doc references found"], "next_actions": ["1-3 short suggested next steps, e.g. where to double check or who to ask"]}

If the question is about the user's own private account (their specific usage, invoice, or subscription details) rather than public information, be honest that you can't see their account data - set "response" to say so and suggest checking their account or billing dashboard directly. Never invent numbers, prices, or limits you didn't find.`,
  },
  general: {
    label: 'Assistant',
    icon: Sparkles,
    accent: '#475569',
    loading: 'Thinking...',
    example: '',
    system: `You are the front door of a sales and marketing AI assistant that can research companies, prep meetings, generate campaigns, analyze conversations, find buying signals, produce weekly reports, and look up pricing/subscription/docs info. The user's message didn't clearly match one of those. Respond conversationally and helpfully, and if relevant, mention which capability might fit what they need.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"response": "a short conversational reply", "insights": [], "next_actions": []}`,
  },
};

const INTENT_KEYS = Object.keys(SKILLS).filter((k) => k !== 'general');

async function callClaude({ system, message, useWebSearch }) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system,
    messages: [{ role: 'user', content: message }],
  };
  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error((data && data.error && data.error.message) || 'API request failed');
  }
  return (data.content || [])
    .map((b) => (b.type === 'text' ? b.text : ''))
    .filter(Boolean)
    .join('\n');
}

function parseSkillResponse(raw) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return { response: raw.trim() || "Sorry, I couldn't process that.", insights: [], next_actions: [] };
  }
}

async function classifyIntent(query) {
  const system = `Classify the user message into exactly one of these categories:
${INTENT_KEYS.join('\n')}
general (only if none of the above clearly fit)

Reply with ONLY the category key, lowercase, nothing else.`;
  try {
    const raw = await callClaude({ system, message: query });
    const key = raw.trim().toLowerCase().replace(/[^a-z_]/g, '');
    return SKILLS[key] ? key : 'general';
  } catch {
    return 'general';
  }
}

function AssistantBubble({ msg }) {
  const skill = SKILLS[msg.intent] || SKILLS.general;
  const Icon = skill.icon;
  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm overflow-hidden"
      style={{ borderLeft: `3px solid ${skill.accent}` }}
    >
      <div className="flex items-center gap-2 px-4 pt-3">
        <Icon className="w-3.5 h-3.5" style={{ color: skill.accent }} />
        <span className="font-mono text-xs uppercase tracking-wide" style={{ color: skill.accent }}>
          {skill.label}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-slate-800 leading-relaxed">{msg.response}</p>

        {msg.insights?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {msg.insights.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="text-slate-300 mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {msg.next_actions?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="font-mono text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Suggested next steps
            </div>
            <div className="space-y-1.5">
              {msg.next_actions.map((item, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-700">
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: skill.accent }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Thinking...');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(text) {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: query }]);
    setLoading(true);
    setLoadingLabel('Reading your message...');

    try {
      const intent = await classifyIntent(query);
      const skill = SKILLS[intent];
      setLoadingLabel(skill.loading);

      const useWebSearch =
        intent === 'research_company' || intent === 'find_buying_signals' || intent === 'pricing_and_docs';
      const raw = await callClaude({ system: skill.system, message: query, useWebSearch });
      const parsed = parseSkillResponse(raw);

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          intent,
          response: parsed.response,
          insights: parsed.insights || [],
          next_actions: parsed.next_actions || [],
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          intent: 'general',
          response: 'I hit an error reaching the model. Please try again.',
          insights: [],
          next_actions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans antialiased">
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">AI Chat Assistant</h1>
          <p className="text-sm text-slate-500">Natural language interface for all AI functions</p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          prototype · live model
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center mb-6">
              <h2 className="text-base font-semibold text-slate-800 mb-1">One box. Seven jobs.</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                Type in plain English — the assistant figures out which of these to run.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full" style={{ maxWidth: '480px' }}>
              {INTENT_KEYS.map((key) => {
                const skill = SKILLS[key];
                const Icon = skill.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleSend(skill.example)}
                    className="flex items-start gap-2.5 text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                    style={{ borderTop: `2px solid ${skill.accent}` }}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: skill.accent }} />
                    <span className="text-xs text-slate-600 leading-snug">{skill.example}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div
                className="bg-slate-900 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
                style={{ maxWidth: '75%' }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="w-full" style={{ maxWidth: '85%' }}>
                <AssistantBubble msg={msg} />
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-slate-400 text-sm px-4 py-2.5">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              {loadingLabel}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-end gap-2 bg-slate-100 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-300">
          <textarea
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything — e.g. 'Research Stripe before my 3pm call'"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400 py-1.5 max-h-24"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-900 disabled:bg-slate-300 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Research, buying-signal, and pricing/docs replies use live web search. Connect your CRM, calendar and
          inbox next to ground every skill in your real data.
        </p>
      </div>
    </div>
  );
}
