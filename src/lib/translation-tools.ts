export interface TranslationTool {
  name: string;
  translate: (text: string, previousContext?: string) => Promise<string>;
  validateTranslation: (originalText: string, translatedText: string) => Promise<{
    isValid: boolean;
    score: number;
    details: { message: string };
    issues: string[];
  }>;
}

export const translationTools: Record<string, TranslationTool> = {
  openai: {
    name: 'OpenAI',
    translate: async (text: string, previousContext?: string) => {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, previousContext, tool: 'openai' })
      })
      const data = await response.json()
      return data.translation
    },
    validateTranslation: async (originalText: string, translatedText: string) => {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText, translatedText })
      })
      const data = await response.json()
      return data
    }
  },
  deepl: {
    name: 'DeepL',
    translate: async (text: string, previousContext?: string) => {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, previousContext, tool: 'deepl' })
      })
      const data = await response.json()
      return data.translation
    },
    validateTranslation: async (originalText: string, translatedText: string) => {
      return {
        isValid: true,
        score: 1,
        details: { message: 'DeepL translation completed' },
        issues: []
      }
    }
  },
  gemini: {
    name: 'Gemini',
    translate: async (text: string, previousContext?: string) => {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, previousContext, tool: 'gemini' })
      })
      const data = await response.json()
      return data.translation
    },
    validateTranslation: async (originalText: string, translatedText: string) => {
      return {
        isValid: true,
        score: 1,
        details: { message: 'Gemini translation completed' },
        issues: []
      }
    }
  }
} 