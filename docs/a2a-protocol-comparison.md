# A2A Protocol Comparison: Google A2A, MCP, IBM ACP, and SAID Protocol

**Author:** SAID Labs  
**Date:** 2026-03-18  
**Status:** Draft — Phase 1 Research

---

## Executive Summary

Four major protocols are competing/complementing in the agent communication space:

1. **Google A2A** — Agent-to-agent task delegation and collaboration
2. **Anthropic MCP** — LLM-to-tool/data integration
3. **IBM ACP** — Multi-agent coordination and state management
4. **SAID Protocol** — On-chain identity and agent discovery with A2A messaging

**Key Finding:** These protocols are **complementary, not competitive**. They solve different layers of the agent infrastructure stack:
- **MCP** = Agent ↔ Tools
- **A2A** = Agent ↔ Agent (task-oriented)
- **ACP** = Agent ↔ Agent (stateful, REST-first)
- **SAID** = Agent Identity + Discovery + Messaging

---

## 1. Google A2A Protocol

### Overview
- **Developed by:** Google (donated to Linux Foundation)
- **Purpose:** Enable agents from different frameworks to collaborate on complex, long-running tasks
- **Philosophy:** "Public internet for AI agents" — decentralized, universal standard

### Architecture
```
User → Client Agent → A2A → Remote Agent 1
                    → A2A → Remote Agent 2
```

**Core Components:**
1. **Agent Card** (JSON metadata)
   - Advertises capabilities (streaming, push notifications)
   - Lists skills (tools/functions with IDs, descriptions, tags, examples)
   - Specifies input/output modes (text, audio, video)
   - Discovery mechanism

2. **A2A Server**
   - Hosts remote agent
   - Manages task lifecycles (execution, status, cancellation)
   - Handles async messaging

3. **A2A Client**
   - Sends tasks/messages
   - Manages async responses
   - Supports streaming and push notifications

### Protocol Details
- **Transport:** HTTP, SSE (Server-Sent Events), JSON-RPC
- **Message Format:** Task-oriented with "parts" (text, images, artifacts)
- **Security:** Enterprise authentication (OpenAPI schemes), secure by default
- **Modality:** Agnostic (text, audio, video, etc.)

### Workflow
1. Client discovers agents via **Agent Cards**
2. Client sends task to server URL
3. Server executes via **AgentExecutor** (custom logic)
4. Server enqueues events (completion, artifacts, streaming updates)
5. Supports human-in-the-loop for long-running tasks (days)

### Strengths
- ✅ **Task-oriented** — Built for complex, multi-step workflows
- ✅ **Async-first** — Handles long-running tasks naturally
- ✅ **Multimodal** — Text, audio, video, artifacts
- ✅ **Enterprise-ready** — Strong security and authentication
- ✅ **Ecosystem support** — 50+ partners, integration with Vertex AI

### Weaknesses
- ❌ **Complex** — More moving parts than simpler protocols
- ❌ **New** — Still maturing, fewer implementations than MCP
- ❌ **No on-chain identity** — Identity/discovery is off-chain

### Adoption
- Supported by Google Cloud (Vertex AI)
- 50+ partners announced
- GitHub: [a2aproject/A2A](https://github.com/a2aproject/A2A)

---

## 2. Anthropic Model Context Protocol (MCP)

### Overview
- **Developed by:** Anthropic (November 2024)
- **Purpose:** Standardize LLM ↔ tools/data integration
- **Philosophy:** "Language Server Protocol for AI" — solve the M×N integration problem

### Architecture
```
LLM Application (Host/Client) ↔ MCP Server ↔ Data Source / Tool
```

**Not agent-to-agent** — focuses on connecting LLMs to external resources.

### Protocol Details
- **Transport:** JSON-RPC 2.0 over transport-agnostic channels
- **Primitives:**
  - **Resources** (server): Context/data for AI/user (app-controlled)
  - **Prompts** (server): Templated workflows (user-controlled)
  - **Tools** (server): Executable functions (model-controlled)
  - **Roots** (client): Filesystem/URI boundaries
  - **Sampling** (client): Server-initiated LLM calls (agentic behavior)

### Security Model
- **User consent required** for all data access and tool execution
- **Data privacy** — No transmission without explicit approval
- **Tool safety** — Descriptions are untrusted unless from verified server
- **LLM sampling controls** — User approves prompts and controls what servers see

### Workflow
1. Host connects to MCP server
2. Capability negotiation
3. LLM queries → Client → Server execution → Response to LLM
4. User approves all tool calls and data access

### Strengths
- ✅ **Simple** — Clear primitives, easy to understand
- ✅ **Strong adoption** — Claude Desktop, Replit, Sourcegraph, OpenAI, DeepMind
- ✅ **SDKs** — Python, TypeScript, C#, Java
- ✅ **Security-first** — User consent baked into design
- ✅ **Composable** — Resources, prompts, tools can be mixed/matched

### Weaknesses
- ❌ **Not agent-to-agent** — Designed for LLM ↔ tools, not agent ↔ agent
- ❌ **Stateless** — No built-in session/state management
- ❌ **No discovery** — Requires external mechanism to find MCP servers

### Adoption
- Used in IDEs (Replit, Sourcegraph)
- Adopted by OpenAI, Google DeepMind
- Reference implementations from Anthropic
- GitHub: [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol)

---

## 3. IBM Agent Communication Protocol (ACP)

### Overview
- **Developed by:** IBM Research (BeeAI community, Linux Foundation governance)
- **Purpose:** Standardize agent-to-agent, agent-to-tool, agent-to-human communication
- **Philosophy:** Minimal, extensible, REST-first (no mandatory SDK)

### Architecture
```
Agent ↔ ACP Server ↔ Agent / Tool / Human
```

**Key Difference from A2A:** REST-preferred over JSON-RPC, async-first with sync fallback.

### Protocol Details
- **Transport:** HTTP (REST), WebSockets/SSE for streaming
- **Core Concepts:**
  - **Agent Manifest** (JSON): Name, description, capabilities, schemas, status (for discovery)
  - **Message / MessagePart**: Multimodal (text, images, JSON via MimeTypes)
  - **Run**: Single agent execution (task/run ID), supports sync, async, streaming, pausing (**Await** for client input)
  - **Sessions**: Stateful contexts with session IDs, persistent across restarts
  - **Lifecycle States**: INITIALIZING → ACTIVE → DEGRADED → RETIRING → RETIRED

### Security
- **Capability tokens** (signed, expiring)
- Kubernetes RBAC integration
- Observability via OpenTelemetry (OTLP)

### Workflow
1. **Discovery**: Online (server-indexed manifests) or offline (embedded in packages)
2. **Communication**: Sync POST, async tasks, or streaming
3. **State management**: Sessions persist conversation history

### Strengths
- ✅ **REST-first** — No SDK required (cURL, Postman work)
- ✅ **Async + stateful** — Built for long-running, persistent interactions
- ✅ **Multimodal** — Text, images, JSON
- ✅ **Observability** — OTLP traces to tools like Arize Phoenix
- ✅ **LangChain/CrewAI compatible** — Easy to wrap existing agents

### Weaknesses
- ❌ **Alpha status** (as of late 2025) — Still maturing
- ❌ **Less adoption** than MCP or A2A
- ❌ **No on-chain identity** — Discovery is off-chain

### Adoption
- IBM BeeAI community
- GitHub: [i-am-bee/acp](https://github.com/i-am-bee/acp)
- Note: Confused with unrelated "Agent Client Protocol" (editor ↔ agent, JSON-RPC)

---

## 4. SAID Protocol

### Overview
- **Developed by:** SAID Protocol team
- **Purpose:** On-chain identity and discovery for AI agents, with A2A messaging
- **Philosophy:** "Passport and phone line for agents" — cryptographic identity + real-time communication

### Architecture
```
Agent (on-chain identity) ↔ SAID A2A (WebSocket/REST) ↔ Agent
                         ↔ x402 micropayments (USDC)
```

**Key Difference:** Identity is on-chain (Solana), verifiable, and tied to reputation.

### Protocol Details
- **Blockchain:** Solana (program ID: `5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G`)
- **Identity:**
  - Each agent has a persistent, verifiable identity (Solana wallet)
  - Multi-wallet support (link multiple wallets, transfer authority)
  - Permanent verification badge (0.01 SOL)
  - Reputation accumulates on-chain
- **A2A Messaging:**
  - WebSocket / REST via `@said-protocol/agent` SDK
  - **x402 micropayments** ($0.01 USDC per message)
  - Cross-chain support (Solana + 10 EVM chains)
- **Discovery:**
  - Agent directory at https://www.saidprotocol.com/agents
  - Programmatic lookup via SDK (`isVerified("WALLET_ADDRESS")`)

### Workflow
```javascript
import { SAIDAgent } from '@said-protocol/agent';
const agent = new SAIDAgent({ keypair });

agent.on('message', (msg) => {
  console.log(msg.from, msg.text);
});

await agent.send(recipient, 'hello from solana');  // Costs $0.01 USDC
```

### Strengths
- ✅ **On-chain identity** — Persistent, verifiable, cryptographically secure
- ✅ **Reputation system** — Accumulates over time, tied to identity
- ✅ **Cross-chain** — Solana + 10 EVMs
- ✅ **Economic incentives** — x402 micropayments for agent services
- ✅ **Discovery** — Public directory + SDK lookup
- ✅ **Portable identity** — Multi-wallet, transferable authority

### Weaknesses
- ❌ **No public A2A spec** — Documentation is SDK-focused, not protocol-level
- ❌ **On-chain costs** — Verification requires 0.01 SOL, messages cost $0.01 USDC
- ❌ **Solana-centric** — While cross-chain, identity lives on Solana
- ❌ **Smaller ecosystem** — Fewer agents than MCP/A2A ecosystems (1,471 as of March 2026)

### Adoption
- 1,471 verified agents on Solana mainnet
- Listed in Solana Foundation's awesome-solana-ai repo
- SDK: `@said-protocol/agent`
- Website: https://www.saidprotocol.com

---

## Comparison Matrix

| Feature | Google A2A | Anthropic MCP | IBM ACP | SAID Protocol |
|---------|-----------|---------------|---------|---------------|
| **Primary Use Case** | Agent ↔ Agent (tasks) | LLM ↔ Tools | Agent ↔ Agent (stateful) | Agent Identity + A2A |
| **Transport** | HTTP, SSE, JSON-RPC | JSON-RPC 2.0 | REST, WebSockets | WebSocket, REST |
| **Identity** | Off-chain (Agent Cards) | N/A | Off-chain (Manifests) | **On-chain (Solana)** |
| **Discovery** | Agent Cards | Manual | Manifests | On-chain directory |
| **Reputation** | No | No | No | **Yes (on-chain)** |
| **Payments** | No | No | No | **Yes (x402, USDC)** |
| **Async Support** | ✅ Yes (task lifecycle) | ❌ No | ✅ Yes (Runs + Sessions) | ✅ Yes |
| **Stateful** | Partial (task state) | ❌ No | ✅ Yes (Sessions) | ✅ Yes (SDK) |
| **Multimodal** | ✅ Yes (text, audio, video) | ✅ Yes (Resources) | ✅ Yes (MimeTypes) | ⚠️ Partial (SDK) |
| **Security** | Enterprise auth (OpenAPI) | User consent required | Capability tokens | Wallet signatures |
| **Observability** | Vendor-specific | Logging primitives | OTLP traces | N/A (SDK-level) |
| **SDK Required** | No (cURL works) | Yes (Python, TS, etc.) | No (REST-first) | Yes (npm package) |
| **Status** | Stable (Linux Foundation) | Stable (Anthropic) | Alpha (IBM BeeAI) | Stable (Solana mainnet) |
| **Adoption** | 50+ partners, Vertex AI | Claude Desktop, IDEs, OpenAI | IBM BeeAI | 1,471 agents (Solana) |

---

## Key Insights

### 1. Complementary, Not Competitive

These protocols serve **different layers** of the agent stack:

```
┌─────────────────────────────────────────┐
│         Agent Application Layer         │
│   (Business logic, workflows, UI)       │
└─────────────────────────────────────────┘
              ↕️ A2A / ACP
┌─────────────────────────────────────────┐
│      Agent-to-Agent Communication       │
│   (Task delegation, collaboration)      │
└─────────────────────────────────────────┘
              ↕️ MCP
┌─────────────────────────────────────────┐
│       Agent-to-Tool Integration         │
│   (Data sources, APIs, functions)       │
└─────────────────────────────────────────┘
              ↕️ SAID
┌─────────────────────────────────────────┐
│      Identity & Discovery Layer         │
│   (Who am I? Who can I trust? Find)    │
└─────────────────────────────────────────┘
```

**You can use all four together:**
- SAID for identity and discovery
- A2A for task delegation
- MCP for tool integration
- ACP for stateful coordination

### 2. On-Chain Identity is Unique to SAID

SAID is the **only protocol** with cryptographic, on-chain identity:
- **A2A, MCP, ACP** rely on off-chain identity (Agent Cards, Manifests)
- **SAID** puts identity on Solana → persistent, verifiable, reputation-linked

**Why this matters:**
- Can't fake identity (cryptographic proof)
- Reputation persists forever (on-chain)
- Cross-platform trust (Solana + 10 EVMs)

### 3. Economic Layer is Unique to SAID

SAID has built-in **agent-to-agent payments** via x402:
- $0.01 USDC per message
- Enables agent services marketplace
- Economic incentives for coordination

**A2A, MCP, ACP** have no payment primitives.

### 4. A2A vs. ACP: Task-Oriented vs. Stateful

Both are agent-to-agent, but different philosophies:

| Feature | A2A | ACP |
|---------|-----|-----|
| Philosophy | Task-oriented, async | Stateful sessions, REST-first |
| Best For | Long-running workflows | Persistent conversations |
| Transport | JSON-RPC, SSE | REST, WebSockets |
| State | Task lifecycle | Sessions + state management |

**Use A2A for:** Complex, multi-day tasks with human-in-the-loop  
**Use ACP for:** Persistent, stateful agent conversations

### 5. MCP is Not Agent-to-Agent

**MCP is for LLM ↔ tools**, not agent ↔ agent.

- Use MCP to give an agent access to databases, APIs, files
- Use A2A/ACP/SAID for agents to talk to each other

### 6. Discovery Mechanisms Differ

| Protocol | Discovery Method | Scalability |
|----------|-----------------|-------------|
| A2A | Agent Cards (JSON) | ⚠️ Off-chain, manual |
| MCP | Manual config | ❌ No built-in discovery |
| ACP | Manifests (online/offline) | ⚠️ Off-chain, indexed |
| SAID | On-chain directory | ✅ Public, queryable, verifiable |

**SAID's on-chain directory** is the most scalable for decentralized discovery.

---

## Open Questions for Future Research

1. **Interoperability:** Can A2A agents discover and message SAID agents? (Likely no — different identity systems)
2. **Bridging:** Could a bridge translate between A2A Agent Cards and SAID on-chain identities?
3. **ACP + SAID:** Could ACP's stateful sessions run on top of SAID's identity layer?
4. **MCP + SAID:** Could SAID agents expose MCP servers as "skills" in their profile?
5. **Latency comparison:** What's the real-world latency of A2A vs. ACP vs. SAID messaging?
6. **Economic viability:** Does $0.01/message on SAID limit adoption, or enable new business models?
7. **Reputation portability:** Can SAID reputation be trusted across chains? What happens if an agent changes wallets?

---

## Next Steps

### Phase 1 Experiments (Week 3-4)
1. **Latency benchmark:** Measure message round-trip time for A2A, ACP, SAID
2. **Discovery test:** How long to find an agent with specific skills on each protocol?
3. **Interop test:** Can we build a bridge between SAID and A2A?

### Phase 2 Analysis (Week 5-6)
1. **Network analysis:** Map SAID's 1,471 agents — what are they doing? Who's talking to who?
2. **Economic analysis:** How many SAID agents are using x402 payments? What's the typical message volume?
3. **Reputation analysis:** Does on-chain reputation correlate with agent quality/activity?

---

## Sources

1. Google A2A: https://a2a-protocol.org/latest/ | https://github.com/a2aproject/A2A
2. Anthropic MCP: https://modelcontextprotocol.io/specification/2025-06-18 | https://github.com/modelcontextprotocol/modelcontextprotocol
3. IBM ACP: https://agentcommunicationprotocol.dev | https://github.com/i-am-bee/acp
4. SAID Protocol: https://www.saidprotocol.com | https://www.saidprotocol.com/docs

---

**Document Status:** Draft — Open for feedback and iteration  
**Contact:** labs@saidprotocol.com | GitHub: @saidlabs
