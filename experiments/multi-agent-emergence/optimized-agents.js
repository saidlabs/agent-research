/**
 * Optimized Multi-Agent System
 * Cost reduction through batching and tiered models
 */

import fs from 'fs';
import crypto from 'crypto';

// LLM Client with model tiering
class LLMClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    
    // Tiered models
    this.models = {
      cheap: 'anthropic/claude-3.5-haiku',      // $0.25/M in, $1.25/M out
      medium: 'anthropic/claude-3.5-haiku',     // Same as cheap for now
      premium: 'anthropic/claude-sonnet-4-5',   // $3/M in, $15/M out
    };
  }

  async complete(options) {
    const {
      system,
      messages,
      tier = 'cheap',  // default to cheapest
      temperature = 0.7,
      max_tokens = 4000,
    } = options;

    const model = this.models[tier];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/saidlabs/agent-research',
        'X-Title': 'SAID Labs Multi-Agent Optimized',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      tier,
    };
  }
}

// Result cache (in-memory for now, would use Redis in production)
class ResultCache {
  constructor() {
    this.cache = new Map();
  }

  hash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check age (5 minute TTL)
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  stats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Batched Observer (runs 3 agents in 1 LLM call)
class BatchedObserver {
  constructor(llm, cache) {
    this.llm = llm;
    this.cache = cache;
    this.name = 'BatchedObserver';
  }

  async observe(context) {
    // Check cache first
    const cacheKey = this.cache.hash({ type: 'batched_observer', context });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`[${this.name}] Cache hit - reusing previous observations`);
      return cached;
    }

    console.log(`[${this.name}] Running batched analysis (3 agents in 1 call)...`);

    const systemPrompt = `You are THREE specialized agents analyzing Solana ecosystem data simultaneously.

**Agent 1: Price Analyst**
- Identify unusual price movements, momentum, early breakouts
- Focus on tokens with significant percentage changes

**Agent 2: Volume Tracker**  
- Track volume spikes, accumulation patterns
- Focus on volume relative to market cap

**Agent 3: Sentiment Agent**
- Analyze social signals, narrative shifts, meme potential
- Focus on early signals before mainstream attention

Analyze the data and output findings for ALL THREE agents in one structured response.`;

    const prompt = `Context:
${JSON.stringify(context, null, 2)}

Output JSON:
{
  "price_analyst": {
    "findings": [
      {
        "token": "TOKEN_NAME",
        "observation": "what you noticed",
        "significance": "why it matters",
        "confidence": 0.0-1.0
      }
    ],
    "summary": "brief overview"
  },
  "volume_tracker": {
    "findings": [...same format...],
    "summary": "brief overview"
  },
  "sentiment_agent": {
    "findings": [...same format...],
    "summary": "brief overview"
  }
}

IMPORTANT: Output ONLY valid JSON. No markdown, no explanations.`;

    try {
      const response = await this.llm.complete({
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        tier: 'cheap',  // Use cheapest model for observers
      });

      // Parse response
      let content = response.content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(content);
      
      // Cache result
      this.cache.set(cacheKey, result);
      
      const totalFindings = 
        (result.price_analyst?.findings?.length || 0) +
        (result.volume_tracker?.findings?.length || 0) +
        (result.sentiment_agent?.findings?.length || 0);
      
      console.log(`[${this.name}] Found ${totalFindings} total findings (${response.usage.prompt_tokens} in, ${response.usage.completion_tokens} out)`);
      
      return result;
    } catch (err) {
      console.log(`[${this.name}] Error: ${err.message}`);
      return {
        price_analyst: { findings: [], summary: 'Failed' },
        volume_tracker: { findings: [], summary: 'Failed' },
        sentiment_agent: { findings: [], summary: 'Failed' },
      };
    }
  }
}

// Pattern Matcher (premium model - needs reasoning)
class PatternMatcher {
  constructor(llm, cache) {
    this.llm = llm;
    this.cache = cache;
    this.name = 'PatternMatcher';
  }

  async analyze(batchedFindings) {
    // Check cache
    const cacheKey = this.cache.hash({ type: 'pattern_matcher', batchedFindings });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`[${this.name}] Cache hit`);
      return cached;
    }

    console.log(`[${this.name}] Finding patterns (premium model)...`);

    const systemPrompt = `You are a pattern recognition specialist.

Your job:
1. Find correlations between price, volume, and sentiment signals
2. Identify confluences (multiple signals aligning on same token)
3. Spot divergences (conflicting signals worth investigating)
4. Connect non-obvious dots

Be selective - only report patterns that are actually significant.`;

    const prompt = `Findings from batched observers:
${JSON.stringify(batchedFindings, null, 2)}

Find patterns:
- Tokens with multiple positive signals (confluence)
- Contradictions worth investigating (divergence)
- Cross-asset correlations

Output JSON:
{
  "patterns": [
    {
      "type": "confluence" or "divergence",
      "tokens": ["TOKEN1", "TOKEN2"],
      "description": "pattern description",
      "significance": "why it matters",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "brief overview"
}`;

    try {
      const response = await this.llm.complete({
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Output ONLY valid JSON.' }],
        temperature: 0.4,
        tier: 'premium',  // Premium model for complex reasoning
      });

      let content = response.content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(content);
      
      // Cache result
      this.cache.set(cacheKey, result);
      
      console.log(`[${this.name}] Found ${result.patterns?.length || 0} patterns (${response.usage.prompt_tokens} in, ${response.usage.completion_tokens} out)`);
      
      return result;
    } catch (err) {
      console.log(`[${this.name}] Error: ${err.message}`);
      return { patterns: [], summary: 'Failed' };
    }
  }
}

// Synthesizer (premium model - final decision making)
class Synthesizer {
  constructor(llm, cache) {
    this.llm = llm;
    this.cache = cache;
    this.name = 'Synthesizer';
  }

  async synthesize(allFindings) {
    // Check cache
    const cacheKey = this.cache.hash({ type: 'synthesizer', allFindings });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`[${this.name}] Cache hit`);
      return cached;
    }

    console.log(`[${this.name}] Synthesizing (premium model)...`);

    const systemPrompt = `You are a synthesis specialist combining insights from multiple agents.

Your job:
1. Identify top opportunities (ranked by confidence × significance)
2. Assess risks
3. Provide clear reasoning
4. Surface any emergent insights

Be critical and selective. Quality over quantity.`;

    const prompt = `All findings:
${JSON.stringify(allFindings, null, 2)}

Synthesize into actionable insights:

Output JSON:
{
  "opportunities": [
    {
      "rank": 1,
      "token/strategy": "WHAT",
      "thesis": "WHY this is an opportunity",
      "supporting_signals": ["signal1", "signal2"],
      "risk": "what could go wrong",
      "confidence": 0.0-1.0
    }
  ],
  "emergent_insight": "any non-obvious pattern from agent interactions",
  "recommendation": "what to do next"
}`;

    try {
      const response = await this.llm.complete({
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Output ONLY valid JSON.' }],
        temperature: 0.5,
        max_tokens: 6000,
        tier: 'premium',  // Premium for final synthesis
      });

      let content = response.content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(content);
      
      // Cache result
      this.cache.set(cacheKey, result);
      
      console.log(`[${this.name}] Generated ${result.opportunities?.length || 0} opportunities (${response.usage.prompt_tokens} in, ${response.usage.completion_tokens} out)`);
      
      return result;
    } catch (err) {
      console.log(`[${this.name}] Error: ${err.message}`);
      return {
        opportunities: [],
        emergent_insight: 'Synthesis failed',
        recommendation: 'Retry',
      };
    }
  }
}

export {
  LLMClient,
  ResultCache,
  BatchedObserver,
  PatternMatcher,
  Synthesizer,
};
