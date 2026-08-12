# NetworkUp AI Chat Assistant

An AI-powered assistant for NetworkUp.io that combines a natural-language chat interface, skill-based routing, Retrieval-Augmented Generation (RAG), and an LLM response layer.

The current implementation focuses on a TXT-based knowledge base containing NetworkUp product information, FAQs, features, pricing, integrations, and selected platform comparison content.

---

## Overview

The assistant is designed to help users:

* Ask questions about NetworkUp.io
* Get answers from a controlled knowledge base
* Retrieve relevant product and FAQ information using semantic search
* Generate answers using an LLM
* Use predefined FAQ questions from the chat interface
* Perform broader AI tasks such as company research, meeting preparation, campaign generation, conversation analysis, buying-signal research, and weekly reporting

The RAG layer is intentionally kept separate from the LLM layer.

---

## Current Architecture

```text
                         User
                           │
                           ▼
                 React Chat Assistant
                           │
                           ▼
                  Intent / Skill Router
                           │
                           ▼
                    /chat API
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
          RAG Retrieval           LLM Service
                │                     │
                ▼                     │
        Query Embedding              │
                │                     │
                ▼                     │
        Cosine Similarity             │
                │                     │
                ▼                     │
        Top-K Relevant Chunks         │
                │                     │
                └──────────┬──────────┘
                           ▼
                  Context + User Query
                           │
                           ▼
                         LLM
                           │
                           ▼
                  Final AI Response
                           │
                           ▼
                    React Interface
```

---

## Project Structure

```text
networkup-chatassistant/
│
├── ai-chat-assistant.jsx
├── README.md
├── package-lock.json
│
└── backend/
    │
    ├── package.json
    ├── tsconfig.json
    ├── .env
    │
    ├── knowledge/
    │   ├── faqs.txt
    │   ├── reachy-vs-heyreach.txt
    │   ├── reachy-vs-expandi.txt
    │   ├── reachy-vs-dripify.txt
    │   ├── reachy-vs-linked-helper.txt
    │   ├── reachy-vs-meet-alfred.txt
    │   ├── reachy-vs-we-connect.txt
    │   └── reachy-vs-waalaxy.txt
    │
    ├── src/
    │   ├── app.ts
    │   │
    │   ├── config/
    │   │   └── config.ts
    │   │
    │   ├── controllers/
    │   │   ├── chatController.ts
    │   │   ├── retrievalController.ts
    │   │   └── uploadController.ts
    │   │
    │   ├── middleware/
    │   │   └── uploadMiddleware.ts
    │   │
    │   ├── routes/
    │   │   ├── chatRoutes.ts
    │   │   ├── retrievalRoutes.ts
    │   │   └── uploadRoutes.ts
    │   │
    │   ├── services/
    │   │   ├── chatService.ts
    │   │   ├── embeddingCache.ts
    │   │   ├── embeddingService.ts
    │   │   ├── geminiService.ts
    │   │   ├── ragService.ts
    │   │   ├── similarityService.ts
    │   │   └── textChunker.ts
    │   │
    │   └── types/
    │
    └── uploads/
```

---

# RAG Pipeline

The current RAG implementation uses TXT files as the initial knowledge source.

### Processing flow

```text
TXT Knowledge Files
        │
        ▼
Text Chunking
        │
        ▼
MiniLM Embeddings
        │
        ▼
In-Memory Embedding Cache
        │
        ▼
Query Embedding
        │
        ▼
Cosine Similarity
        │
        ▼
Top-K Relevant Chunks
        │
        ▼
LLM Context
```

### Embedding model

The current implementation uses:

```text
Xenova/all-MiniLM-L6-v2
```

through `@xenova/transformers`.

### Retrieval

For every user question:

1. The query is converted into an embedding.
2. The query embedding is compared against stored document embeddings.
3. Cosine similarity is used as the relevance score.
4. The highest-scoring chunks are selected.
5. Retrieved content is passed to the LLM as contextual knowledge.

---

# Knowledge Base

The knowledge base currently contains two main types of information.

## NetworkUp product knowledge

The FAQ knowledge covers:

* Getting started
* Smart prospecting
* Campaign Builder
* Campaign automation
* LinkedIn safety
* Unified Inbox
* Relationship Intelligence
* Lead Enrichment
* Analytics and reporting
* AI assistant capabilities
* HubSpot and Salesforce integrations
* Zapier integration
* API and webhooks
* Teams and workspaces
* Support
* Pricing and plans
* Common product questions

The official NetworkUp website currently lists:

### Starter

```text
$21/month
```

Includes:

* 1 LinkedIn account
* 500 messages/month
* Daily activity reports
* Basic personalization
* Basic lead database
* Email support

### Growth

```text
$59/month
```

Includes:

* 5 LinkedIn accounts
* Multi-workspace
* Advanced AI personalization
* Sequence branching
* 2-variant A/B testing
* Full CRM sync
* Read-only API
* Extended database
* Shared success manager
* Email and chat support

### Enterprise

```text
$129/month
```

Includes:

* Custom organization limits
* SSO/SAML setup
* Custom logic engine
* Regional compliance
* Priority execution
* Custom webhooks
* On-prem hosting option
* Audit logging
* 24/7 priority support
* Technical onboarding

The website also displays a yearly billing option marked as 20% off and a 14-day free trial with no credit card required.

Pricing is time-sensitive and should be updated whenever NetworkUp changes its plans.

---

## Competitor Knowledge

The project also contains comparison information for:

* HeyReach
* Expandi
* Dripify
* Linked Helper
* Meet Alfred
* We-Connect
* Waalaxy

These documents can be used for questions such as:

```text
How does NetworkUp compare with Waalaxy?
How does Reachy compare with HeyReach?
How does Reachy compare with Expandi?
```

Competitor information should be treated as supporting knowledge rather than the primary source for NetworkUp product facts.

---

# AI Assistant Capabilities

The React assistant currently supports these skill categories:

### Company Research

Research companies and generate seller-oriented summaries.

### Meeting Prep

Prepare concise meeting briefs from user-provided information.

### Campaign Generation

Generate campaign concepts based on the user's product, audience, or goal.

### Conversation Analysis

Analyze sales conversations, transcripts, objections, and buying signals.

### Buying Signals

Research recent signals that may indicate buying intent.

### Weekly Reports

Turn user-provided weekly activity into structured reports.

### Pricing & Documentation

Answer pricing, plan, subscription, usage and documentation questions using available knowledge.

---

# FAQ Quick Actions

The interface includes predefined questions such as:

* Create my first campaign
* Is LinkedIn automation safe?
* Pricing & plans
* Manage multiple accounts
* Campaign analytics
* CRM integrations
* Troubleshoot campaign
* Improve reply rates

These buttons use the same existing chat pipeline as manually typed queries.

---

# API

The backend currently runs on:

```text
http://localhost:3000
```

## Health Check

```http
GET /
```

Example:

```json
{
  "success": true,
  "message": "NetworkUp RAG Backend Running 🚀"
}
```

---

## Chat

```http
POST /chat
```

Request:

```json
{
  "query": "How do I create my first campaign?"
}
```

The chat service:

1. Receives the query.
2. Generates a query embedding.
3. Retrieves relevant knowledge.
4. Builds a context-aware prompt.
5. Sends the prompt to the configured LLM.
6. Returns the final response and retrieved sources.

Example response:

```json
{
  "success": true,
  "response": "To create your first campaign...",
  "sources": [
    {
      "source": "faqs.txt",
      "chunkNumber": 2,
      "score": 0.55
    }
  ]
}
```

---

## Retrieve

```http
POST /retrieve
```

Request:

```json
{
  "query": "Is LinkedIn automation safe?"
}
```

Example response:

```json
{
  "success": true,
  "context": "Source: faqs.txt...",
  "sources": [
    {
      "source": "faqs.txt",
      "chunkNumber": 3,
      "score": 0.74
    }
  ]
}
```

This endpoint is useful for testing the RAG layer independently from the LLM.

---

# Upload

The project contains upload infrastructure for TXT knowledge ingestion.

The current initial knowledge-base implementation is intentionally focused on:

```text
.txt
```

PDF and DOCX ingestion are not part of the current first-stage implementation.

---

# Environment Variables

Create:

```text
backend/.env
```

Example:

```env
PORT=3000
GEMINI_API_KEY=your_api_key_here
```

Never commit `.env` to GitHub.

Recommended `.gitignore`:

```gitignore
.env
node_modules/
dist/
uploads/
```

---

# Installation

## Backend

Open a terminal in:

```text
networkup-chatassistant/backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run dev
```

The server should start at:

```text
http://localhost:3000
```

On the first RAG startup, the embedding model may take additional time to download/load.

---

# Testing

## RAG Retrieval

Use Postman:

```http
POST http://localhost:3000/retrieve
```

Body:

```json
{
  "query": "What is the difference between Reachy and HeyReach?"
}
```

## FAQ Testing

```http
POST http://localhost:3000/chat
```

Test questions:

```text
How do I create my first campaign?
```

```text
Is LinkedIn automation safe?
```

```text
Why are invitations not being sent?
```

```text
What is NetworkUp pricing?
```

```text
What integrations does NetworkUp support?
```

```text
What is Smart Prospecting?
```

A successful response should contain:

```text
success: true
response: ...
sources: ...
```

---

# Frontend Component

The current React component is:

```text
ai-chat-assistant.jsx
```

It contains:

* Skill definitions
* Intent classification
* Chat UI
* Predefined FAQ buttons
* Loading states
* RAG retrieval integration
* LLM request handling
* Response rendering

The component expects to be integrated into a React application.

At the current repository state, the root project does not contain a complete standalone React/Vite application setup. Therefore, `ai-chat-assistant.jsx` should be treated as the assistant component until it is placed into the team's frontend application.

---

# LLM Layer

The architecture intentionally keeps retrieval separate from generation.

```text
ragService.ts
```

is responsible for:

* query embeddings
* similarity search
* context retrieval
* source information

The LLM service is responsible for:

* receiving the context
* receiving the user question
* generating the final response

The current backend implementation uses the Google GenAI SDK and Gemini 2.5 Flash.

The frontend prototype retains its LLM adapter structure so the provider can be changed later without redesigning the RAG layer.

---

# Current Status

## Completed

* TXT knowledge ingestion
* Text chunking
* Embedding generation
* MiniLM embedding model integration
* In-memory embedding cache
* Cosine similarity retrieval
* Top-K retrieval
* RAG context generation
* `/retrieve` endpoint
* `/chat` endpoint
* FAQ knowledge base
* NetworkUp product information
* Competitor comparison knowledge
* FAQ predefined questions in the React component
* Source tracking
* Basic RAG → LLM integration

## Tested

The RAG pipeline has been tested with:

* Reachy vs HeyReach
* Reachy vs Expandi
* Reachy vs Waalaxy
* Campaign creation FAQ
* LinkedIn safety FAQ
* Invitation troubleshooting FAQ

The tests successfully returned relevant knowledge chunks and LLM-generated responses.

---

# Current Limitations

The current implementation is intentionally an initial RAG prototype.

### Knowledge Storage

Embeddings are currently held in memory.

A persistent vector database has not yet been selected.

Potential future options include a vector database or a PostgreSQL-based vector solution.

### File Formats

The current knowledge pipeline is focused on TXT files.

Future versions may support:

* PDF
* DOCX
* HTML
* Web pages
* Other structured sources

### Pricing

Pricing information is time-sensitive. The FAQ knowledge base should be updated whenever NetworkUp pricing or plan limits change.

### Frontend

The React assistant component is available, but the current repository does not contain a standalone frontend application configuration.

---

# Future Roadmap

Potential next improvements:

1. Connect the assistant component to the team's actual frontend application.
2. Improve FAQ quick actions and categorization.
3. Add more verified NetworkUp documentation.
4. Add citations/source links in the UI.
5. Improve retrieval ranking and duplicate-chunk handling.
6. Add persistent vector storage.
7. Add document management.
8. Support PDF and DOCX ingestion.
9. Add RAG evaluation datasets and retrieval metrics.
10. Add authentication and user-specific knowledge bases.
11. Add conversation memory.
12. Add production deployment configuration.

---

# Development Principles

The project follows these principles:

### Separate Retrieval From Generation

RAG retrieves knowledge; the LLM generates the answer.

### Use Verified Product Information

Product pricing, plans and capabilities should come from official NetworkUp information whenever possible.

### Avoid Hallucinated Product Claims

When information is missing from the knowledge base, the assistant should say so rather than inventing facts.

### Keep The RAG Provider-Agnostic

The retrieval layer should not depend on a specific LLM provider.

### Start Simple

TXT + local embeddings + in-memory retrieval are being used for the prototype before choosing a production vector database.

---

# Official NetworkUp Website

```text
https://networkup.io/
```

The official site provides current product information, features, integrations, pricing, documentation and comparison pages.

Pricing and product information should always be rechecked against the official website before being used as authoritative customer-facing information.

---

# License

This project is currently an internal/team project for NetworkUp development.

All rights reserved.
