# ASMR Status — Agentic Search and Memory Retrieval

**Started:** 2026-03-22  
**Status:** 🟡 In Progress (Phase 0: Prototype)

---

## What We're Testing

A claim that **~99% accuracy on LongMemEval_s** can be achieved using parallel observer agents instead of vector embeddings for memory retrieval.

**Key Question:** Can specialized agents (temporal, causal, state tracking) outperform traditional RAG (embeddings + cosine similarity) on multi-session memory benchmarks?

---

## Current State

✅ **Prototype Built** (`asmr_prototype.js`)
- 6 observer agents implemented (keyword-based)
- Parallel execution pipeline
- Simple ensemble aggregator
- Runs on LongMemEval_s dataset

❌ **Not Yet Using LLMs**
- Currently just keyword matching
- Need to replace with Claude Haiku calls

❌ **No Answer Generation**
- Only extracting context, not generating answers
- Need reader LLM to complete pipeline

❌ **No Evaluation**
- Not comparing against ground truth yet
- Need exact-match and F1 scoring

---

## Next Milestones

### Phase 1: LLM-Powered Agents (Week 1)
- [ ] Replace keyword matching with LLM extraction
- [ ] Add answer generation layer
- [ ] Evaluate exact-match accuracy on LongMemEval_s
- **Target:** Beat BM25 baseline

### Phase 2: Benchmark Comparison (Week 2)
- [ ] Implement vector RAG baseline (Stella V5 embeddings)
- [ ] Implement full-context baseline (feed all history)
- [ ] Compare accuracy, latency, cost
- **Target:** Match or beat vector RAG

### Phase 3: Ensemble Optimization (Week 2-3)
- [ ] Test 8-variant ensemble (majority vote)
- [ ] Test 12-variant decision forest (routing by question type)
- [ ] Confidence-weighted aggregation
- **Target:** Approach claimed 99% accuracy

### Phase 4: Scaling Test (Week 3)
- [ ] Run on LongMemEval_M (500 sessions, ~1.5M tokens)
- [ ] Measure performance degradation
- [ ] Identify bottlenecks
- **Target:** Maintain >90% accuracy at scale

---

## Research Questions

1. **Can specialized agents beat cosine similarity?**
   - Hypothesis: Yes, because they preserve structure (temporal, causal, state)
   - Confidence: Medium (needs LLM implementation to validate)

2. **What's the cost/latency tradeoff?**
   - Hypothesis: 6 parallel LLM calls will be slower but more accurate
   - Confidence: High (but need to measure)

3. **Does ensemble aggregation matter?**
   - Hypothesis: Routing by question type will outperform majority vote
   - Confidence: Medium (theory sounds right, needs testing)

4. **Can this generalize beyond benchmarks?**
   - Hypothesis: Yes, real agent memory has similar patterns
   - Confidence: Low (benchmarks are synthetic)

---

## Why This Matters

If ASMR works as claimed, it could replace vector databases as the default for agent memory:
- **No embeddings needed** → lower infrastructure cost
- **Better temporal reasoning** → critical for long-running agents
- **More explainable** → agents can trace their reasoning
- **Cheaper at scale** → no re-indexing when memory grows

---

## Files

- `asmr_prototype.js` — Current implementation
- `README.md` — Full research doc
- `STATUS.md` — This file

---

**Last Updated:** 2026-03-23 07:19 UTC
