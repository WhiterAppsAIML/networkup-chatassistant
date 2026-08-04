# AI Chat Assistant

A single-file React prototype: one chat box that understands plain English and routes each message to the right AI skill — no menus, no forms.

## What it does

Type a request, and the assistant automatically figures out which of these seven jobs you mean, then answers it:

| Skill | What it's for |
|---|---|
| **Company Research** | Look up a company before a call (uses live web search) |
| **Meeting Prep** | Build a short talking-points brief for an upcoming meeting |
| **Campaign Generation** | Draft a marketing/sales campaign concept |
| **Conversation Analysis** | Analyze a pasted call transcript or notes |
| **Buying Signals** | Find recent signs a company is ready to buy (uses live web search) |
| **Weekly Report** | Turn a summary of the week's activity into a clean report |
| **Pricing & Docs** | Answer questions about pricing, plans, or documentation (uses live web search) |

Every answer comes back with a short summary, a few key insights, and suggested next steps.

## How it works

1. **Classify** — the user's message is sent to Claude with a small prompt asking which of the 7 skills it matches.
2. **Route** — based on that answer, a second call is made using a system prompt written specifically for that skill.
3. **Search (sometimes)** — for Company Research, Buying Signals, and Pricing & Docs, that second call also turns on live web search, so those answers are grounded in real, current information instead of guesses.
4. **Display** — the response is shown as a color-coded card with the skill name, the answer, key insights, and next steps.

## Tech notes

- Single React component (`AIChatAssistant.jsx`), styled with Tailwind utility classes.
- Calls Anthropic's Claude API (`claude-sonnet-4-6`) directly from the browser. No API key is needed in the code — this version is built to run inside a Claude.ai artifact, which handles that automatically.
- No backend, no database. All state lives in memory for the current session.

## Known limitations

- **No real business data connected.** There's no CRM, calendar, or inbox hooked up — skills like Meeting Prep and Weekly Report only know what you type into the chat.
- **No memory between sessions.** Refreshing clears the conversation; nothing is saved.
- **No custom knowledge base yet.** The assistant can't be given your own product docs or notes to draw on in this version.

## Possible next steps

- Connect real data sources (CRM, calendar, inbox)
- Add a way to save context (notes, docs) the assistant can reference
- Persist chat history across sessions
