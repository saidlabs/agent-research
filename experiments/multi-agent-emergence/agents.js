/**
 * Multi-Agent Emergence Experiment
 * Inspired by MiroFish's simulation approach
 * 
 * 5 specialized agents analyze Solana ecosystem for emerging opportunities
 */

import fs from 'fs';
import path from 'path';

// LLM Client (reusing from memory system)
class LLMClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.defaultModel = config.model || 'anthropic/claude-3.5-haiku';
  }

  async complete(options) {
    const {
      system,
      messages,
      model = this.defaultModel,
      temperature = 0.7,
      max_tokens = 4000,
    } = options;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/saidlabs/agent-research',
        'X-Title': 'SAID Labs Multi-Agent Emergence',
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
    };
  }
}

// Base Agent Class
class Agent {
  constructor(name, role, systemPrompt, llm) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.llm = llm;
    this.findings = [];
    this.memory = [];
  }

  async observe(context) {
    throw new Error('Must implement observe()');
  }

  async shareFindings(otherAgents) {
    // Agents can see what others have discovered
    const sharedKnowledge = otherAgents
      .filter(agent => agent.name !== this.name)
      .flatMap(agent => agent.findings);
    
    return sharedKnowledge;
  }

  log(message) {
    console.log(`[${this.name}] ${message}`);
  }
}

// 1. Price Analyst Agent
class PriceAnalyst extends Agent {
  constructor(llm) {
    super(
      'Price Analyst',
      'price',
      `You are a price analysis specialist for Solana tokens. Your job:
      
1. Identify unusual price movements (pumps, dumps, divergences)
2. Flag tokens showing early momentum
3. Spot mispricing opportunities
4. Report findings in structured JSON format

Be specific. Include token names, price changes, and why it matters.`,
      llm
    );
  }

  async observe(context) {
    this.log('Analyzing price data...');
    
    const prompt = `Analyze the Solana ecosystem for price-related opportunities.

Context:
${JSON.stringify(context, null, 2)}

Find:
- New tokens gaining momentum
- Unusual price movements
- Potential mispricings

Output JSON:
{
  "findings": [
    {
      "token": "TOKEN_NAME",
      "observation": "what you noticed",
      "significance": "why it matters",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "brief overview"
}`;

    try {
      const response = await this.llm.complete({
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const result = JSON.parse(response.content);
      this.findings = result.findings || [];
      this.log(`Found ${this.findings.length} price anomalies`);
      
      return result;
    } catch (err) {
      this.log(`Error: ${err.message}`);
      return { findings: [], summary: 'Analysis failed' };
    }
  }
}

// 2. Volume Tracker Agent
class VolumeTracker extends Agent {
  constructor(llm) {
    super(
      'Volume Tracker',
      'volume',
      `You are a trading volume specialist for Solana. Your job:

1. Track unusual volume spikes
2. Identify accumulation/distribution patterns
3. Flag tokens with growing interest
4. Report findings in structured JSON format

Focus on volume relative to market cap and historical patterns.`,
      llm
    );
  }

  async observe(context) {
    this.log('Analyzing volume patterns...');
    
    const prompt = `Analyze trading volume patterns in the Solana ecosystem.

Context:
${JSON.stringify(context, null, 2)}

Find:
- Volume spikes indicating interest
- Accumulation patterns
- Unusual trading activity

Output JSON (same format as price analyst)`;

    try {
      const response = await this.llm.complete({
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const result = JSON.parse(response.content);
      this.findings = result.findings || [];
      this.log(`Found ${this.findings.length} volume anomalies`);
      
      return result;
    } catch (err) {
      this.log(`Error: ${err.message}`);
      return { findings: [], summary: 'Analysis failed' };
    }
  }
}

// 3. Sentiment Agent
class SentimentAgent extends Agent {
  constructor(llm) {
    super(
      'Sentiment Agent',
      'sentiment',
      `You are a social sentiment analyst for Solana. Your job:

1. Track narrative shifts (what's being talked about)
2. Identify emerging memes and trends
3. Flag projects gaining social momentum
4. Report findings in structured JSON format

Focus on early signals before mainstream attention.`,
      llm
    );
  }

  async observe(context) {
    this.log('Analyzing sentiment signals...');
    
    const prompt = `Analyze social sentiment in the Solana ecosystem.

Context:
${JSON.stringify(context, null, 2)}

Find:
- Emerging narratives
- Projects gaining traction
- Meme potential
- Community energy shifts

Output JSON (same format as price analyst)`;

    try {
      const response = await this.llm.complete({
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      const result = JSON.parse(response.content);
      this.findings = result.findings || [];
      this.log(`Found ${this.findings.length} sentiment signals`);
      
      return result;
    } catch (err) {
      this.log(`Error: ${err.message}`);
      return { findings: [], summary: 'Analysis failed' };
    }
  }
}

// 4. Pattern Matcher Agent
class PatternMatcher extends Agent {
  constructor(llm) {
    super(
      'Pattern Matcher',
      'patterns',
      `You are a pattern recognition specialist. Your job:

1. Find correlations between price, volume, and sentiment
2. Identify confluences (multiple signals aligning)
3. Spot divergences (conflicting signals worth investigating)
4. Report findings in structured JSON format

You see what other agents found. Your job is to connect the dots.`,
      llm
    );
  }

  async observe(context, sharedFindings) {
    this.log('Finding patterns across agent observations...');
    
    const prompt = `Analyze findings from other agents to find patterns.

Other agents found:
${JSON.stringify(sharedFindings, null, 2)}

Find:
- Tokens with multiple positive signals
- Contradictions worth investigating
- Emerging patterns across datasets

Output JSON:
{
  "patterns": [
    {
      "type": "confluence" or "divergence",
      "tokens": ["TOKEN1", "TOKEN2"],
      "description": "what pattern you found",
      "significance": "why it matters",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "brief overview"
}`;

    try {
      const response = await this.llm.complete({
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      const result = JSON.parse(response.content);
      this.findings = result.patterns || [];
      this.log(`Found ${this.findings.length} patterns`);
      
      return result;
    } catch (err) {
      this.log(`Error: ${err.message}`);
      return { patterns: [], summary: 'Analysis failed' };
    }
  }
}

// 5. Synthesizer Agent
class Synthesizer extends Agent {
  constructor(llm) {
    super(
      'Synthesizer',
      'synthesis',
      `You are a synthesis specialist. Your job:

1. Combine insights from all agents
2. Identify the most actionable opportunities
3. Produce a final ranked list of opportunities
4. Explain the reasoning

You're the final decision maker. Be critical and selective.`,
      llm
    );
  }

  async synthesize(allFindings) {
    this.log('Synthesizing collective intelligence...');
    
    const prompt = `All agents have reported. Synthesize their findings into actionable insights.

All findings:
${JSON.stringify(allFindings, null, 2)}

Produce:
1. Top 3 opportunities (ranked by confidence × significance)
2. Reasoning for each
3. Risk assessment
4. Next steps

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
  "emergent_insight": "any non-obvious pattern that emerged from agent interactions",
  "recommendation": "what to do next"
}`;

    try {
      const response = await this.llm.complete({
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Output ONLY valid JSON. No markdown, no explanations, just the JSON object.' }],
        temperature: 0.5,
        max_tokens: 6000,
      });

      // Strip markdown if present
      let content = response.content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(content);
      this.log('Synthesis complete');
      
      return result;
    } catch (err) {
      this.log(`Error: ${err.message}`);
      return { opportunities: [], emergent_insight: 'Synthesis failed', recommendation: 'Retry' };
    }
  }
}

export {
  LLMClient,
  Agent,
  PriceAnalyst,
  VolumeTracker,
  SentimentAgent,
  PatternMatcher,
  Synthesizer,
};
