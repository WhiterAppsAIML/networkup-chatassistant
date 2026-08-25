import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Calendar,
  Megaphone,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Send,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  Users,
  DollarSign,
  Wrench,
  Link,
  Rocket,
  BarChart2,
} from 'lucide-react';

const RAG_API_URL = 'http://localhost:3000';

/* =========================================================
   AI SKILLS
========================================================= */

const SKILLS = {
  research_company: {
    label: 'Company Research',
    icon: Search,
    accent: '#2563eb',
    loading: 'Researching company...',
    example: 'Research Notion before my call',

    system: `You are a B2B sales research assistant inside a GTM AI assistant.

When given a company name and optionally a contact or deal context, research the company using available information and produce a concise briefing a seller can use before a call.

If retrieved knowledge is provided, use it when relevant and do not contradict it.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence conversational summary","insights":["4-6 short factual bullets"],"next_actions":["2-3 short suggested next steps"]}

If the company name is missing or too ambiguous, ask for the company name.

Never invent facts.`,
  },

  prepare_meeting: {
    label: 'Meeting Prep',
    icon: Calendar,
    accent: '#7c3aed',
    loading: 'Preparing your brief...',
    example: "Prep me for tomorrow's meeting with a VP of Sales",

    system: `You are a meeting-prep assistant for salespeople.

Given whatever details the user provides about an upcoming meeting, produce a short preparation brief.

If retrieved knowledge is provided, use it when relevant.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence framing of the meeting","insights":["3-5 short bullets"],"next_actions":["2-3 concrete things to do before the meeting"]}

If key details are missing, ask for them.

Never invent facts.`,
  },

  generate_campaign: {
    label: 'Campaign Generation',
    icon: Megaphone,
    accent: '#db2777',
    loading: 'Drafting campaign...',
    example: 'Generate a campaign for our new pricing tier',

    system: `You are a campaign strategist for a marketing and sales team.

Given a product, audience, or goal, draft a campaign concept.

If retrieved knowledge is provided, use it when relevant.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence pitch of the campaign concept","insights":["3-5 short bullets"],"next_actions":["2-3 concrete next steps"]}

If the product, audience, or goal is missing, ask for that context.

Never invent product facts.`,
  },

  analyze_conversation: {
    label: 'Conversation Analysis',
    icon: MessageSquare,
    accent: '#059669',
    loading: 'Analyzing conversation...',
    example:
      'Analyze this call: the prospect loved the demo but said pricing felt steep',

    system: `You are a conversation intelligence assistant.

Given a pasted transcript, notes, or description of a sales conversation, analyze it.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence read on how the conversation went","insights":["3-6 short bullets"],"next_actions":["2-3 concrete follow-up actions"]}

If no conversation content is provided, ask the user to provide it.

Never invent information.`,
  },

  find_buying_signals: {
    label: 'Buying Signals',
    icon: TrendingUp,
    accent: '#d97706',
    loading: 'Scanning for signals...',
    example: 'Find buying signals for Figma',

    system: `You are a buying-signals research assistant.

Given a company or account name, identify credible signals that may indicate buying intent.

If retrieved knowledge is provided, use it when relevant.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence summary","insights":["3-5 short bullets"],"next_actions":["2-3 suggested ways to act"]}

If no company is named, ask for the company.

Never invent signals.`,
  },

  weekly_report: {
    label: 'Weekly Report',
    icon: BarChart3,
    accent: '#0891b2',
    loading: 'Building your report...',
    example:
      "Give me this week's report — 3 new deals, 12 calls, lost the Acme deal",

    system: `You are a reporting assistant.

Given a summary of the week's activity provided by the user, structure it into a clean weekly report.

Never invent numbers or activity.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence executive summary","insights":["3-6 short bullets"],"next_actions":["2-3 priorities for next week"]}

If no activity is provided, ask what happened this week.`,
  },

  pricing_and_docs: {
    label: 'Pricing & Docs',
    icon: HelpCircle,
    accent: '#dc2626',
    loading: 'Looking that up...',
    example: "What's included in the Team plan pricing?",

    system: `You are a product-information assistant.

Answer questions about pricing, plans, subscriptions, usage limits, documentation, and product information.

IMPORTANT:
If retrieved knowledge is provided, treat it as the primary knowledge source.
Use only information supported by the retrieved knowledge.
Do not invent prices, plans, limits, integrations, or features.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"2-3 sentence direct answer","insights":["3-5 short factual bullets"],"next_actions":["1-3 short suggested next steps"]}

If the retrieved knowledge does not contain the requested information, clearly say that the information is not currently available in the knowledge base.`,
  },

  general: {
    label: 'Assistant',
    icon: Sparkles,
    accent: '#475569',
    loading: 'Thinking...',
    example: '',

    system: `You are the front door of a sales and marketing AI assistant.

The assistant can:
- research companies
- prepare meetings
- generate campaigns
- analyze conversations
- find buying signals
- produce weekly reports
- answer product, FAQ, pricing and documentation questions

IMPORTANT:
If retrieved knowledge is provided, use it as the primary source for factual questions.
Do not invent product information.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:

{"response":"a short conversational reply","insights":[],"next_actions":[]}`,
  },
};

const INTENT_KEYS = Object.keys(SKILLS).filter(
  (key) => key !== 'general'
);

/* =========================================================
   PREDEFINED FAQ QUESTIONS
========================================================= */

const FAQ_QUESTIONS = [
  {
    label: 'Create my first campaign',
    icon: Rocket,
    question: 'How do I create my first campaign?',
  },
  {
    label: 'Is LinkedIn automation safe?',
    icon: ShieldCheck,
    question: 'Is LinkedIn automation safe?',
  },
  {
    label: 'Pricing & plans',
    icon: DollarSign,
    question: 'What are the available pricing plans?',
  },
  {
    label: 'Manage multiple accounts',
    icon: Users,
    question: 'Can I manage multiple LinkedIn accounts?',
  },
  {
    label: 'Campaign analytics',
    icon: BarChart2,
    question: 'How can I view campaign analytics?',
  },
  {
    label: 'CRM integrations',
    icon: Link,
    question: 'What CRM integrations are available?',
  },
  {
    label: 'Troubleshoot campaign',
    icon: Wrench,
    question: "Why aren't my invitations being sent?",
  },
  {
    label: 'Improve reply rates',
    icon: TrendingUp,
    question: 'How can I improve my LinkedIn outreach reply rate?',
  },
];

/* =========================================================
   CALL BACKEND
========================================================= */

async function callAssistant(message) {
  const res = await fetch(`${RAG_API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: message,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data?.error ||
      data?.response ||
      'API request failed'
    );
  }

  return data;
}

/* =========================================================
   PARSE AI RESPONSE
========================================================= */

function parseSkillResponse(raw) {
  if (!raw) {
    return {
      response: "Sorry, I couldn't process that.",
      insights: [],
      next_actions: [],
    };
  }

  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Continue to fallback.
      }
    }

    return {
      response: raw.trim(),
      insights: [],
      next_actions: [],
    };
  }
}

/* =========================================================
   INTENT CLASSIFICATION
========================================================= */

async function classifyIntent(query) {
  const system = `Classify the user message into exactly one of these categories:

${INTENT_KEYS.join('\n')}
general

Reply with ONLY the category key, lowercase, nothing else.`;

  try {
    const data = await callAssistant(
      `${system}

User request:
${query}`
    );

    const raw = data.response || '';

    const key = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, '');

    return SKILLS[key] ? key : 'general';
  } catch {
    return 'general';
  }
}

/* =========================================================
   ASSISTANT MESSAGE
========================================================= */

function AssistantBubble({ msg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3">
        <Sparkles className="w-3.5 h-3.5 text-slate-500" />

        <span className="font-mono text-xs uppercase tracking-wide text-slate-500">
          NetworkUp Assistant
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
          {msg.response}
        </p>

        {msg.sources?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="font-mono text-xs text-slate-400 uppercase tracking-wide mb-2">
              Sources
            </div>

            <div className="space-y-1">
              {msg.sources.map((source, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-500"
                >
                  {source.source}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] =
    useState('Thinking...');

  const scrollRef = useRef(null);

  /* Auto scroll */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  async function handleSend(text) {
  const query = (text ?? input).trim();

  if (!query || loading) return;

  setInput('');

  setMessages((current) => [
    ...current,
    {
      role: 'user',
      content: query,
    },
  ]);

  setLoading(true);
  setLoadingLabel('Thinking...');

  try {
    const data = await callAssistant(query);

    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        intent: 'general',
        response:
          data.response ||
          'No response generated.',
        insights: [],
        next_actions: [],
        sources: data.sources || [],
      },
    ]);
  } catch (error) {
    console.error('Assistant error:', error);

    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        intent: 'general',
        response:
          'I hit an error reaching the assistant. Please try again.',
        insights: [],
        next_actions: [],
      },
    ]);
  } finally {
    setLoading(false);
    setLoadingLabel('Thinking...');
  }
}

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans antialiased">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">

        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            AI Chat Assistant
          </h1>

          <p className="text-sm text-slate-500">
            Natural language interface for all AI functions
          </p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">

          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

          prototype · live model
        </div>
      </div>

      {/* =================================================
          CHAT AREA
      ================================================= */}

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="min-h-full flex flex-col items-center justify-center px-4">

            <div className="text-center mb-6">

              <h2 className="text-base font-semibold text-slate-800 mb-1">
                One box. Seven jobs.
              </h2>

              <p className="text-slate-500 text-sm max-w-sm">
                Type in plain English — the
                assistant figures out which
                capability fits your request.
              </p>
            </div>

            {/* =================================================
                EXISTING AI SKILLS
            ================================================= */}

            <div className="w-full max-w-[480px]">

              <div className="font-mono text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                AI Capabilities
              </div>

              <div className="grid grid-cols-2 gap-2">

                {INTENT_KEYS.map((key) => {
                  const skill = SKILLS[key];

                  const Icon = skill.icon;

                  return (
                    <button
                      key={key}
                      onClick={() =>
                        handleSend(
                          skill.example
                        )
                      }
                      className="flex items-start gap-2.5 text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                      style={{
                        borderTop: `2px solid ${skill.accent}`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{
                          color: skill.accent,
                        }}
                      />

                      <span className="text-xs text-slate-600 leading-snug">
                        {skill.example}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                FAQ QUICK QUESTIONS
            ================================================= */}

            <div className="w-full max-w-[480px] mt-6">

              <div className="flex items-center gap-2 mb-2">

                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />

                <div className="font-mono text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Common Questions
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">

                {FAQ_QUESTIONS.map(
                  (faq) => {
                    const Icon = faq.icon;

                    return (
                      <button
                        key={faq.question}
                        onClick={() =>
                          handleSend(
                            faq.question
                          )
                        }
                        className="flex items-start gap-2 text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />

                        <span className="text-xs text-slate-600 leading-snug">
                          {faq.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            MESSAGES
        ================================================= */}

        {messages.map((msg, index) =>
          msg.role === 'user' ? (
            <div
              key={index}
              className="flex justify-end"
            >
              <div
                className="bg-slate-900 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-line"
                style={{
                  maxWidth: '75%',
                }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div
              key={index}
              className="flex justify-start"
            >
              <div
                className="w-full"
                style={{
                  maxWidth: '85%',
                }}
              >
                <AssistantBubble msg={msg} />
              </div>
            </div>
          )
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="flex justify-start">

            <div className="flex items-center gap-2 text-slate-400 text-sm px-4 py-2.5">

              <span className="flex gap-1">

                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{
                    animationDelay: '0ms',
                  }}
                />

                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{
                    animationDelay: '150ms',
                  }}
                />

                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{
                    animationDelay: '300ms',
                  }}
                />
              </span>

              {loadingLabel}
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* =================================================
          INPUT
      ================================================= */}

      <div className="border-t border-slate-200 bg-white p-4">

        <div className="flex items-end gap-2 bg-slate-100 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-300">

          <textarea
            value={input}
            disabled={loading}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault();

                handleSend();
              }
            }}
            placeholder="Ask anything — e.g. 'Is LinkedIn automation safe?'"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400 py-1.5 max-h-24"
          />

          <button
            onClick={() => handleSend()}
            disabled={
              loading ||
              !input.trim()
            }
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-900 disabled:bg-slate-300 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2 text-center">
          Ask about campaigns, LinkedIn safety,
          pricing, accounts, analytics,
          integrations, troubleshooting and more.
        </p>
      </div>
    </div>
  );
}