# SAID ↔ A2A Bridge Experiment

**Date:** 2026-03-20  
**Status:** Prototype Design  
**Goal:** Enable SAID agents to interoperate with Google A2A ecosystem

---

## Problem

**SAID Protocol** and **Google A2A** use different identity/discovery mechanisms:
- **SAID:** On-chain identity (Solana wallet), REST/WebSocket messaging
- **A2A:** Agent Cards (JSON at `/.well-known/agent.json`), JSON-RPC/HTTP

**Current state:** SAID agents cannot be discovered or messaged by A2A clients, and vice versa.

---

## Proposed Solution: Translation Bridge

A bidirectional bridge that:
1. **SAID → A2A:** Generates A2A Agent Cards from SAID on-chain metadata
2. **A2A → SAID:** Translates A2A Agent Card format to SAID agent directory entries
3. **Message routing:** Routes A2A messages to SAID REST API (and vice versa)

---

## Architecture

```
┌─────────────────────┐          ┌──────────────────┐          ┌─────────────────────┐
│   A2A Client        │          │  SAID ↔ A2A      │          │   SAID Agent        │
│  (Google/A2A app)   │ ◄─────► │     Bridge       │ ◄─────► │  (on-chain identity)│
└─────────────────────┘          └──────────────────┘          └─────────────────────┘
         │                               │                              │
         │ 1. GET /.well-known/agent    │ 2. Query SAID API            │
         │    .json                      │    (on-chain data)           │
         │                               │                              │
         │ 3. Receive A2A Agent Card     │ 4. Translate to A2A format   │
         │    (generated from SAID)      │    (includes skills, wallet)  │
         │                               │                              │
         │ 5. POST /task (A2A)           │ 6. Route to SAID REST API    │
         │                               │    (/xchain/message)         │
         │                               │                              │
         │ 7. Receive response           │ 8. Translate SAID response   │
         │    (A2A format)               │    back to A2A format        │
```

---

## Mapping: SAID → A2A Agent Card

### SAID Agent Metadata (Example: SAID Labs)
```json
{
  "wallet": "c2TVsFDYURtjAMSYhjRXvCKg9q5wGT3iKNDdYUA5PFm",
  "pda": "3gMUFQtWZH9HiHpnpz71cAMrmRTPhC5qK1wqqbpSUnKK",
  "name": "SAID Labs",
  "description": "Open research lab for autonomous AI agent infrastructure",
  "website": "https://github.com/saidlabs/agent-research",
  "skills": ["research", "agent-to-agent", "protocol-analysis"],
  "isVerified": true,
  "reputationScore": 0
}
```

### A2A Agent Card (Generated)
```json
{
  "name": "SAID Labs",
  "description": "Open research lab for autonomous AI agent infrastructure. On-chain verified agent on SAID Protocol (Solana).",
  "version": "1.0.0",
  "url": "https://bridge.saidprotocol.com/a2a/c2TVsFDYURtjAMSYhjRXvCKg9q5wGT3iKNDdYUA5PFm",
  "provider": {
    "name": "SAID Protocol",
    "url": "https://www.saidprotocol.com",
    "support_contact": "https://www.saidprotocol.com/agents/c2TVsFDYURtjAMSYhjRXvCKg9q5wGT3iKNDdYUA5PFm"
  },
  "capabilities": {
    "streaming": false,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "research",
      "name": "Research & Analysis",
      "description": "Autonomous research on agent infrastructure, protocols, and coordination",
      "tags": ["research", "analysis", "protocols"],
      "examples": [
        "Compare A2A protocols across ecosystems",
        "Analyze agent coordination patterns"
      ]
    },
    {
      "id": "agent-to-agent",
      "name": "Agent-to-Agent Communication",
      "description": "Cross-protocol agent messaging and coordination",
      "tags": ["a2a", "messaging", "coordination"]
    },
    {
      "id": "protocol-analysis",
      "name": "Protocol Analysis",
      "description": "Deep-dive analysis of agent communication standards",
      "tags": ["protocols", "standards", "interoperability"]
    }
  ],
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "securitySchemes": {
    "solana-wallet": {
      "scheme": "bearer",
      "description": "Solana wallet signature verification",
      "service_identifier": "said-protocol"
    }
  },
  "iconUrl": null,
  "documentationUrl": "https://github.com/saidlabs/agent-research",
  "metadata": {
    "blockchain": "solana",
    "wallet": "c2TVsFDYURtjAMSYhjRXvCKg9q5wGT3iKNDdYUA5PFm",
    "pda": "3gMUFQtWZH9HiHpnpz71cAMrmRTPhC5qK1wqqbpSUnKK",
    "verified": true,
    "reputationScore": 0,
    "source": "said-protocol"
  }
}
```

---

## Key Challenges

### 1. Identity Verification
- **A2A:** Trusts Agent Card at `/.well-known/agent.json` (HTTPS-based)
- **SAID:** Trusts on-chain signature (wallet-based)

**Solution:** Bridge signs Agent Cards with SAID agent's wallet, A2A clients verify signature.

### 2. Message Routing
- **A2A:** Uses JSON-RPC endpoints (`/task`, `/message`)
- **SAID:** Uses REST API (`/xchain/message`)

**Solution:** Bridge translates A2A requests to SAID REST calls, returns A2A-formatted responses.

### 3. Capabilities Mismatch
- **A2A:** Supports streaming, push notifications, complex task lifecycles
- **SAID:** Currently REST-only, no streaming (per SDK issues)

**Solution:** Bridge advertises `streaming: false` in Agent Card, falls back to polling for task status.

### 4. Skills Mapping
- **A2A:** Rich skill schema (input/output types, examples, JSON Schema)
- **SAID:** Simple string array (`["research", "trading"]`)

**Solution:** Bridge infers skill details from agent description + metadata, or uses default templates.

---

## Prototype Implementation

### Step 1: Agent Card Generator (Python)

```python
#!/usr/bin/env python3
"""
SAID → A2A Agent Card Generator
Fetches SAID agent metadata, generates A2A-compliant Agent Card
"""

import requests
import json

SAID_API = "https://api.saidprotocol.com/api/agents"
BRIDGE_URL = "https://bridge.saidprotocol.com/a2a"

def fetch_said_agent(wallet_address):
    """Fetch SAID agent metadata from API"""
    response = requests.get(f"{SAID_API}/{wallet_address}")
    response.raise_for_status()
    return response.json()

def generate_agent_card(said_agent):
    """Convert SAID metadata to A2A Agent Card"""
    wallet = said_agent["wallet"]
    
    # Map SAID skills to A2A skills with richer metadata
    skills = []
    for skill in said_agent.get("skills", []):
        skills.append({
            "id": skill,
            "name": skill.replace("-", " ").title(),
            "description": f"Agent capability: {skill}",
            "tags": [skill],
            "examples": []
        })
    
    # Generate A2A Agent Card
    card = {
        "name": said_agent["name"],
        "description": f"{said_agent['description']} (On-chain verified via SAID Protocol on Solana)",
        "version": "1.0.0",
        "url": f"{BRIDGE_URL}/{wallet}",
        "provider": {
            "name": "SAID Protocol",
            "url": "https://www.saidprotocol.com",
            "support_contact": f"https://www.saidprotocol.com/agents/{wallet}"
        },
        "capabilities": {
            "streaming": False,
            "pushNotifications": False
        },
        "skills": skills,
        "defaultInputModes": ["text/plain", "application/json"],
        "defaultOutputModes": ["text/plain", "application/json"],
        "securitySchemes": {
            "solana-wallet": {
                "scheme": "bearer",
                "description": "Solana wallet signature verification",
                "service_identifier": "said-protocol"
            }
        },
        "documentationUrl": said_agent.get("website"),
        "metadata": {
            "blockchain": "solana",
            "wallet": wallet,
            "pda": said_agent["pda"],
            "verified": said_agent["isVerified"],
            "reputationScore": said_agent["reputationScore"],
            "source": "said-protocol"
        }
    }
    
    return card

if __name__ == "__main__":
    # Example: Generate Agent Card for SAID Labs
    wallet = "c2TVsFDYURtjAMSYhjRXvCKg9q5wGT3iKNDdYUA5PFm"
    
    print(f"Fetching SAID agent: {wallet}")
    said_agent = fetch_said_agent(wallet)
    
    print(f"Generating A2A Agent Card...")
    agent_card = generate_agent_card(said_agent)
    
    print(json.dumps(agent_card, indent=2))
```

### Step 2: Message Router (Conceptual)

```python
@app.post("/a2a/{wallet}/task")
async def route_a2a_task(wallet: str, task: A2ATask):
    """
    Receive A2A task, translate to SAID message, return A2A response
    """
    # 1. Extract message from A2A task
    message_text = extract_message(task)
    
    # 2. Route to SAID REST API
    said_response = requests.post(
        "https://api.saidprotocol.com/xchain/message",
        json={
            "from": {"address": task.sender, "chain": "solana"},
            "to": {"address": wallet, "chain": "solana"},
            "message": message_text
        }
    )
    
    # 3. Translate SAID response back to A2A format
    a2a_response = {
        "task_id": task.id,
        "status": "completed",
        "result": {
            "parts": [
                {"type": "text/plain", "content": said_response.json()["message"]}
            ]
        }
    }
    
    return a2a_response
```

---

## Research Questions

1. **Identity Trust:** Will A2A clients trust a bridge-generated Agent Card if it's signed by the SAID agent's wallet?
2. **Discovery:** Can A2A clients discover SAID agents via the bridge, or do they need direct integration?
3. **Performance:** What's the latency overhead of routing through the bridge vs. native A2A?
4. **Reputation:** Can SAID's on-chain reputation be surfaced in A2A Agent Cards in a meaningful way?
5. **Bidirectional:** Can SAID agents discover and message A2A agents via the bridge?

---

## Next Steps

### Phase 1: Proof of Concept (Week 1)
- [x] Design bridge architecture
- [ ] Implement Agent Card generator
- [ ] Deploy bridge endpoint (host Agent Cards)
- [ ] Test with A2A client (if available)

### Phase 2: Message Routing (Week 2)
- [ ] Implement A2A → SAID message translation
- [ ] Implement SAID → A2A response translation
- [ ] Test end-to-end messaging
- [ ] Measure latency overhead

### Phase 3: Bidirectional Discovery (Week 3)
- [ ] Implement A2A Agent Card parser
- [ ] Add A2A agents to SAID directory (off-chain index)
- [ ] Test SAID → A2A messaging
- [ ] Document interop patterns

### Phase 4: Publication (Week 4)
- [ ] Write research paper: "Cross-Protocol Agent Interoperability: A Bridge Between SAID and A2A"
- [ ] Open-source bridge code (MIT license)
- [ ] Submit to A2A and SAID communities for feedback

---

## Impact

**If successful, this bridge:**
- Enables 1,471 SAID agents to interoperate with A2A ecosystem
- Demonstrates cross-protocol agent discovery and messaging
- Provides template for other protocol bridges (MCP, ACP)
- Advances the field toward true agent interoperability

**This is genuinely novel** — no existing bridge between on-chain identity (SAID) and task-oriented A2A.

---

**Status:** Design complete, implementation starting  
**Estimated completion:** 3-4 weeks  
**Code:** TBD (will publish to GitHub when functional)
