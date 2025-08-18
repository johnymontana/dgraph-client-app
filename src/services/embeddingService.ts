import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export type EmbeddingProvider = 'openai' | 'anthropic' | 'ollama';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey?: string;
  model?: string;
  ollamaEndpoint?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  usage?: {
    tokens: number;
  };
}

class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  private getDefaultModel(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'text-embedding-ada-002';
      case 'anthropic':
        return 'claude-3-haiku-20240307';
      case 'ollama':
        return 'nomic-embed-text';
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async createOllamaProvider() {
    const endpoint = this.config.ollamaEndpoint || 'http://localhost:11434';
    
    return {
      async embed(values: string[]) {
        const responses = await Promise.all(
          values.map(async (text) => {
            const response = await fetch(`${endpoint}/api/embeddings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: this.config.model || this.getDefaultModel(),
                prompt: text,
              }),
            });

            if (!response.ok) {
              throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const result = await response.json();
            return {
              embedding: result.embedding,
            };
          })
        );

        return {
          embeddings: responses.map(r => r.embedding),
          usage: {
            tokens: values.reduce((sum, text) => sum + text.length, 0),
          },
        };
      },
    };
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const model = this.config.model || this.getDefaultModel();

    try {
      let provider;
      
      switch (this.config.provider) {
        case 'openai':
          if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
          }
          provider = openai({
            apiKey: this.config.apiKey,
          });
          break;
          
        case 'anthropic':
          if (!this.config.apiKey) {
            throw new Error('Anthropic API key is required');
          }
          provider = anthropic({
            apiKey: this.config.apiKey,
          });
          break;
          
        case 'ollama':
          provider = await this.createOllamaProvider();
          break;
          
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }

      if (this.config.provider === 'ollama') {
        const result = await provider.embed([text]);
        return {
          embedding: result.embeddings[0],
          usage: {
            tokens: result.usage?.tokens || text.length,
          },
        };
      }

      const { embeddings, usage } = await embedMany({
        model: provider(model),
        values: [text],
      });

      return {
        embedding: embeddings[0],
        usage: {
          tokens: usage?.tokens || text.length,
        },
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const model = this.config.model || this.getDefaultModel();

    try {
      let provider;
      
      switch (this.config.provider) {
        case 'openai':
          if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
          }
          provider = openai({
            apiKey: this.config.apiKey,
          });
          break;
          
        case 'anthropic':
          if (!this.config.apiKey) {
            throw new Error('Anthropic API key is required');
          }
          provider = anthropic({
            apiKey: this.config.apiKey,
          });
          break;
          
        case 'ollama':
          provider = await this.createOllamaProvider();
          break;
          
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }

      if (this.config.provider === 'ollama') {
        const result = await provider.embed(texts);
        return result.embeddings.map((embedding: number[], index: number) => ({
          embedding,
          usage: {
            tokens: texts[index].length,
          },
        }));
      }

      const { embeddings, usage } = await embedMany({
        model: provider(model),
        values: texts,
      });

      return embeddings.map((embedding, index) => ({
        embedding,
        usage: {
          tokens: usage?.tokens ? Math.floor(usage.tokens / texts.length) : texts[index].length,
        },
      }));
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
}

export default EmbeddingService;