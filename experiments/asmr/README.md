# ASMR Research: Agentic Search and Memory Retrieval

**Date:** 2026-03-22  
**Researcher:** SAID LABS  
**Status:** Initial exploration phase

---

## Context

A researcher claims **~99% accuracy on LongMemEval_s** using an "ASMR" technique that replaces vector embeddings with parallel observer agents extracting structured knowledge across six reasoning vectors.

This is significant because:
1. Traditional RAG relies on static embeddings + cosine similarity
2. LongMemEval is designed to test multi-session memory and temporal reasoning
3. The approach claims to work **without vector databases**

---

## What is ASMR?

**Agentic Search and Memory Retrieval** is an alternative to traditional RAG that uses:
- **Parallel observer agents** instead of embedding models
- **Six reasoning vectors** (facts, temporal, causal, state, context, meta)
- **Ensemble aggregation** (8-variant or 12-variant decision forest)
- **On-the-fly knowledge extraction** instead of pre-computed indices

### The Six Vectors (Hypothesized)

Based on the claim, I'm inferring these are the six reasoning dimensions:

1. **Direct Fact Extraction** — Explicit statements matching the question
2. **Temporal Reconstruction** — Timeline of events, chronological ordering
3. **Causal Inference** — Cause-effect relationships, reasoning chains
4. **Entity State Tracking** — Changes to entities over time
5. **Contextual Associations** — Co-occurrence, related information
6. **Meta-Reasoning** — Contradictions, uncertainty, confidence

---

## Why This Might Work

### 1. **Vector Embeddings Are Lossy**
Embeddings compress text into fixed-dimensional vectors, losing:
- Temporal order
- Causal structure
- Entity state transitions
- Explicit facts

ASMR agents can preserve these by analyzing raw text.

### 2. **Multi-Session Memory Needs More Than Similarity**
LongMemEval tests:
- Temporal reasoning ("What happened after X?")
- Knowledge updates ("What changed about Y?")
- Multi-hop inference ("What did I say about Z across sessions?")

Cosine similarity can't handle these well. ASMR's specialized agents can.

### 3. **Ensemble Robustness**
Different question types need different retrieval strategies:
- Factual Q → Direct extraction
- Temporal Q → Timeline reconstruction
- Multi-hop Q → Contextual association + causal chains

An ensemble can route questions to the right agent.

---

## Current Implementation (Prototype)

I've built a **minimal proof-of-concept** (`asmr_prototype.js`) with:

✅ Six observer agents (keyword-based, no LLM yet)  
✅ Parallel observation pipeline  
✅ Simple ensemble aggregator  
❌ No answer generation (just context extraction)  
❌ No evaluation against ground truth  
❌ No comparison to vector RAG baseline

### Observations So Far

Running on the first 5 LongMemEval instances:
- `DirectFactExtractor` wins most of the time (high keyword matches)
- `TemporalReconstructor` and `EntityStateTracker` correctly detect non-temporal questions
- Ensemble is **not yet smart** — just picks highest confidence

---

## Next Steps

### Phase 1: LLM-Powered Agents (Week 1)
Replace keyword matching with LLM-based extraction:
- Each agent gets a specialized system prompt
- Use Claude Haiku for cost efficiency
- Parallelize agent calls with Promise.all

### Phase 2: Answer Generation (Week 1)
After extraction, generate answers:
- Feed top contexts to a reader LLM
- Compare against ground truth
- Measure exact-match and F1 scores

### Phase 3: Benchmark (Week 2)
Compare ASMR against:
- **Full-context baseline** (feed entire history to LLM)
- **Vector RAG** (Stella V5 or gte-Qwen2-7B embeddings)
- **BM25** (keyword search)

Metrics:
- Accuracy (exact match)
- Latency (wall-clock time)
- Cost (LLM tokens consumed)
- Scalability (performance vs. history length)

### Phase 4: Ensemble Optimization (Week 2)
Test different aggregation strategies:
- Majority vote (8-variant)
- Decision forest with routing (12-variant)
- Confidence-weighted fusion
- Question-type-based routing

### Phase 5: Open-Source Release (Week 3)
If results hold:
- Clean up code
- Write full paper
- Release on GitHub
- Build OpenClaw skill for agent memory

---

## Questions to Answer

1. **Latency:** How long does a query take with 6 parallel LLM calls?
2. **Cost:** What's the token cost per query vs. vector search?
3. **Scalability:** Does this work on 500-session histories (LongMemEval_M)?
4. **Generalization:** Does it handle non-conversational memory (facts, preferences)?
5. **Reproducibility:** Can others achieve ~99% with this approach?

---

## Why This Matters for SAID Protocol

If ASMR works as claimed, it's a **new primitive for agent memory**:

- **No vector database needed** — agents just store raw logs
- **Better temporal reasoning** — critical for long-running agents
- **Lower infrastructure cost** — no embeddings to compute/store
- **More explainable** — agents can trace their reasoning

This could replace Mem0/LangMem as the default memory system for SAID agents.

---

## Confidence Level

| Claim | Confidence | Why |
|-------|-----------|-----|
| ASMR architecture is sound | **High** | Specialized agents for different reasoning types makes sense |
| Can achieve 99% on LongMemEval_s | **Medium** | Need to validate with full LLM implementation |
| Outperforms vector RAG | **Medium** | Depends on latency/cost tradeoffs |
| Scales to 500+ sessions | **Low** | Parallel LLM calls get expensive fast |
| Generalizes beyond benchmarks | **Low** | Need real-world agent testing |

---

## Status: In Progress

**Current Task:** Build LLM-powered observer agents  
**Next Milestone:** Run full evaluation on LongMemEval_s  
**Timeline:** 2-3 weeks to full validation

---

## Code

- Prototype: `/home/agent/.openclaw/workspace/asmr_prototype.js`
- Benchmark: `/home/agent/.openclaw/workspace/LongMemEval/`
- Dataset: `longmemeval_s_cleaned.json` (500 instances, ~115k tokens each)

---

## References

- LongMemEval paper: https://arxiv.org/pdf/2410.10813.pdf
- Repo: https://github.com/xiaowu0162/LongMemEval
- Dataset: https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned

---

**Last Updated:** 2026-03-22 22:48 UTC
