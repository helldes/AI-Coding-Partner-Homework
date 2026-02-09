import { Category, Priority, ClassificationResult } from '../types/ticket.types';

interface KeywordPattern {
  keywords: string[];
  weight: number;
}

const CATEGORY_PATTERNS: Record<Category, KeywordPattern[]> = {
  [Category.ACCOUNT_ACCESS]: [
    { keywords: ['login', 'password', 'sign in', 'authenticate', '2fa', 'two factor', 'locked out', 'forgot password'], weight: 1.0 }
  ],
  [Category.TECHNICAL_ISSUE]: [
    { keywords: ['error', 'crash', 'bug', 'broken', 'not working', 'failure', 'exception', 'timeout'], weight: 1.0 }
  ],
  [Category.BILLING_QUESTION]: [
    { keywords: ['payment', 'invoice', 'refund', 'charge', 'subscription', 'billing', 'credit card', 'price'], weight: 1.0 }
  ],
  [Category.FEATURE_REQUEST]: [
    { keywords: ['feature', 'enhancement', 'suggestion', 'improve', 'add', 'would like', 'could you'], weight: 1.0 }
  ],
  [Category.BUG_REPORT]: [
    { keywords: ['reproduce', 'steps to reproduce', 'expected', 'actual', 'defect', 'issue'], weight: 1.0 }
  ],
  [Category.OTHER]: []
};

const PRIORITY_PATTERNS = {
  [Priority.URGENT]: ['can\'t access', 'cannot access', 'critical', 'production down', 'security', 'urgent', 'emergency', 'immediately'],
  [Priority.HIGH]: ['important', 'blocking', 'asap', 'as soon as possible', 'high priority', 'needed soon'],
  [Priority.LOW]: ['minor', 'cosmetic', 'suggestion', 'nice to have', 'low priority'],
  [Priority.MEDIUM]: []
};

export class ClassificationService {
  classify(subject: string, description: string): ClassificationResult {
    const text = `${subject} ${description}`.toLowerCase();

    const categoryResult = this.classifyCategory(text);
    const priorityResult = this.classifyPriority(text);

    return {
      category: categoryResult.category,
      priority: priorityResult.priority,
      confidence: (categoryResult.confidence + priorityResult.confidence) / 2,
      reasoning: `Category: ${categoryResult.reasoning}. Priority: ${priorityResult.reasoning}`,
      keywords: [...categoryResult.keywords, ...priorityResult.keywords]
    };
  }

  private classifyCategory(text: string): {
    category: Category;
    confidence: number;
    reasoning: string;
    keywords: string[];
  } {
    const scores: Record<string, { score: number; keywords: string[] }> = {};

    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      scores[category] = { score: 0, keywords: [] };

      for (const pattern of patterns) {
        for (const keyword of pattern.keywords) {
          if (text.includes(keyword)) {
            scores[category].score += pattern.weight;
            scores[category].keywords.push(keyword);
          }
        }
      }
    }

    const entries = Object.entries(scores);
    const maxScore = Math.max(...entries.map(([_, data]) => data.score));

    if (maxScore === 0) {
      return {
        category: Category.OTHER,
        confidence: 0.3,
        reasoning: 'No specific keywords matched',
        keywords: []
      };
    }

    const winner = entries.find(([_, data]) => data.score === maxScore)!;
    const totalKeywords = winner[1].keywords.length;
    const confidence = Math.min(0.5 + (totalKeywords * 0.1), 1.0);

    return {
      category: winner[0] as Category,
      confidence,
      reasoning: `Matched ${totalKeywords} keyword(s)`,
      keywords: winner[1].keywords
    };
  }

  private classifyPriority(text: string): {
    priority: Priority;
    confidence: number;
    reasoning: string;
    keywords: string[];
  } {
    for (const [priority, keywords] of Object.entries(PRIORITY_PATTERNS)) {
      const matched = keywords.filter(k => text.includes(k));
      if (matched.length > 0) {
        return {
          priority: priority as Priority,
          confidence: Math.min(0.6 + (matched.length * 0.15), 1.0),
          reasoning: `Matched ${matched.length} priority keyword(s)`,
          keywords: matched
        };
      }
    }

    return {
      priority: Priority.MEDIUM,
      confidence: 0.5,
      reasoning: 'Default priority applied',
      keywords: []
    };
  }
}

export const classificationService = new ClassificationService();
