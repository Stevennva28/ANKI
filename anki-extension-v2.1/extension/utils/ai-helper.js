// ai-helper.js - AI Model Integration (Claude, ChatGPT, Gemini)
// Context-aware vocabulary enhancement using AI

import { ERROR_CODES, LIMITS } from './constants.js';
import { VocabError, fetchWithRetry } from './helpers.js';

/**
 * AI Helper for vocabulary enhancement
 * Supports: Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google)
 */
class AIHelper {
  constructor() {
    this.apiKeys = {
      claude: null,
      openai: null,
      gemini: null,
    };
    this.selectedModel = 'claude'; // Default
    this.usageStats = {
      claude: { requests: 0, tokens: 0, cost: 0 },
      openai: { requests: 0, tokens: 0, cost: 0 },
      gemini: { requests: 0, tokens: 0, cost: 0 },
    };
  }

  /**
   * Initialize AI helper with API keys from storage
   */
  async init(storage) {
    const settings = await storage.getSettings();
    if (settings.aiApiKeys) {
      this.apiKeys = { ...this.apiKeys, ...settings.aiApiKeys };
    }
    if (settings.selectedAIModel) {
      this.selectedModel = settings.selectedAIModel;
    }
    if (settings.aiUsageStats) {
      this.usageStats = settings.aiUsageStats;
    }
  }

  /**
   * Set API key for a model
   */
  setApiKey(model, key) {
    if (!['claude', 'openai', 'gemini'].includes(model)) {
      throw new VocabError(ERROR_CODES.INVALID_CONFIG);
    }
    this.apiKeys[model] = key;
  }

  /**
   * Check if AI is available
   */
  isAvailable(model = this.selectedModel) {
    return !!this.apiKeys[model];
  }

  /**
   * Get context-aware explanation of a word
   */
  async explainWordInContext(word, sentence, pageContext) {
    if (!this.isAvailable()) {
      throw new VocabError(ERROR_CODES.AI_NOT_CONFIGURED);
    }

    const prompt = this.buildPrompt('explain', {
      word,
      sentence,
      pageContext,
    });

    const response = await this.query(prompt, {
      maxTokens: 300,
      temperature: 0.7,
    });

    return this.parseExplanation(response);
  }

  /**
   * Generate example sentences for a word
   */
  async generateExamples(word, meaning, level = 'intermediate') {
    if (!this.isAvailable()) {
      throw new VocabError(ERROR_CODES.AI_NOT_CONFIGURED);
    }

    const prompt = this.buildPrompt('examples', {
      word,
      meaning,
      level,
      count: 3,
    });

    const response = await this.query(prompt, {
      maxTokens: 200,
      temperature: 0.8,
    });

    return this.parseExamples(response);
  }

  /**
   * Generate mnemonics for better memorization
   */
  async generateMnemonic(word, meaning) {
    if (!this.isAvailable()) {
      throw new VocabError(ERROR_CODES.AI_NOT_CONFIGURED);
    }

    const prompt = this.buildPrompt('mnemonic', {
      word,
      meaning,
    });

    const response = await this.query(prompt, {
      maxTokens: 150,
      temperature: 0.9,
    });

    return this.parseMnemonic(response);
  }

  /**
   * Get grammar tips for a word
   */
  async getGrammarTips(word, partOfSpeech) {
    if (!this.isAvailable()) {
      throw new VocabError(ERROR_CODES.AI_NOT_CONFIGURED);
    }

    const prompt = this.buildPrompt('grammar', {
      word,
      partOfSpeech,
    });

    const response = await this.query(prompt, {
      maxTokens: 200,
      temperature: 0.6,
    });

    return this.parseGrammarTips(response);
  }

  /**
   * Build prompt based on task type
   */
  buildPrompt(taskType, data) {
    const prompts = {
      explain: `Explain the word "${data.word}" as used in this context:
Sentence: "${data.sentence}"
Page context: ${data.pageContext || 'General web page'}

Provide a clear, concise explanation (2-3 sentences) focusing on:
1. What the word means in THIS specific context
2. Why this meaning fits the context
3. Any nuances or connotations

Keep it simple and practical for a language learner.`,

      examples: `Generate ${data.count} example sentences using the word "${data.word}" with this meaning:
"${data.meaning}"

Requirements:
- Level: ${data.level}
- Make sentences natural and practical
- Show different usage patterns
- Keep each sentence under 20 words

Format: One sentence per line, no numbering.`,

      mnemonic: `Create a memorable mnemonic device for learning this word:
Word: "${data.word}"
Meaning: "${data.meaning}"

Make it:
- Easy to remember
- Fun or creative
- Connected to the word's sound or spelling
- Maximum 2 sentences

Just provide the mnemonic, no extra explanation.`,

      grammar: `Provide grammar tips for the word "${data.word}" (${data.partOfSpeech}):

Include:
1. Common collocations (words that go with it)
2. Typical sentence patterns
3. Common mistakes to avoid
4. Register (formal/informal)

Keep it concise (3-4 bullet points).`,
    };

    return prompts[taskType];
  }

  /**
   * Query AI model
   */
  async query(prompt, options = {}) {
    const model = this.selectedModel;

    if (!this.apiKeys[model]) {
      throw new VocabError(ERROR_CODES.AI_NOT_CONFIGURED);
    }

    try {
      let response;

      switch (model) {
        case 'claude':
          response = await this.queryClaude(prompt, options);
          break;
        case 'openai':
          response = await this.queryOpenAI(prompt, options);
          break;
        case 'gemini':
          response = await this.queryGemini(prompt, options);
          break;
        default:
          throw new Error('Invalid AI model');
      }

      // Track usage
      this.trackUsage(model, response.usage);

      return response.text;
    } catch (error) {
      console.error(`AI query failed (${model}):`, error);
      throw new VocabError(ERROR_CODES.AI_REQUEST_FAILED);
    }
  }

  /**
   * Query Claude (Anthropic)
   */
  async queryClaude(prompt, options) {
    const response = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKeys.claude,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // Fast & cheap
          max_tokens: options.maxTokens || 300,
          temperature: options.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      },
      'claude'
    );

    const data = await response.json();

    return {
      text: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }

  /**
   * Query OpenAI (ChatGPT)
   */
  async queryOpenAI(prompt, options) {
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Fast & cheap
          max_tokens: options.maxTokens || 300,
          temperature: options.temperature || 0.7,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful English vocabulary teacher. Be concise and practical.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      },
      'openai'
    );

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }

  /**
   * Query Google Gemini
   */
  async queryGemini(prompt, options) {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKeys.gemini}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 300,
          },
        }),
      },
      'gemini'
    );

    const data = await response.json();

    return {
      text: data.candidates[0].content.parts[0].text,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  /**
   * Track usage stats
   */
  trackUsage(model, usage) {
    this.usageStats[model].requests++;
    this.usageStats[model].tokens += (usage.inputTokens || 0) + (usage.outputTokens || 0);

    // Estimate cost (approximate)
    const costs = {
      claude: 0.00025, // $0.25 per 1M tokens (Haiku)
      openai: 0.0005, // $0.50 per 1M tokens (GPT-3.5)
      gemini: 0.000125, // $0.125 per 1M tokens (Gemini Pro)
    };

    const totalTokens = (usage.inputTokens || 0) + (usage.outputTokens || 0);
    this.usageStats[model].cost += (totalTokens / 1000000) * costs[model];
  }

  /**
   * Parse AI responses
   */
  parseExplanation(text) {
    return text.trim();
  }

  parseExamples(text) {
    return text
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);
  }

  parseMnemonic(text) {
    return text.trim();
  }

  parseGrammarTips(text) {
    return text
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•]\s*/, '').trim());
  }

  /**
   * Get usage stats
   */
  getUsageStats() {
    return { ...this.usageStats };
  }

  /**
   * Reset usage stats
   */
  resetUsageStats() {
    this.usageStats = {
      claude: { requests: 0, tokens: 0, cost: 0 },
      openai: { requests: 0, tokens: 0, cost: 0 },
      gemini: { requests: 0, tokens: 0, cost: 0 },
    };
  }

  /**
   * Save settings
   */
  async saveSettings(storage) {
    await storage.saveSettings({
      aiApiKeys: this.apiKeys,
      selectedAIModel: this.selectedModel,
      aiUsageStats: this.usageStats,
    });
  }
}

export default AIHelper;
