import { classificationService } from '../../src/services/classification.service';
import { Category, Priority } from '../../src/types/ticket.types';

describe('Auto-Classification Service', () => {
  describe('Category Classification', () => {
    it('should classify account access issues', () => {
      const result = classificationService.classify(
        'Cannot login',
        'I forgot my password and cannot access my account'
      );

      expect(result.category).toBe(Category.ACCOUNT_ACCESS);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify technical issues', () => {
      const result = classificationService.classify(
        'Application crash',
        'The app keeps crashing with error code 500'
      );

      expect(result.category).toBe(Category.TECHNICAL_ISSUE);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify billing questions', () => {
      const result = classificationService.classify(
        'Refund request',
        'I need a refund for my subscription payment'
      );

      expect(result.category).toBe(Category.BILLING_QUESTION);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify feature requests', () => {
      const result = classificationService.classify(
        'Feature suggestion',
        'Would like to add dark mode feature'
      );

      expect(result.category).toBe(Category.FEATURE_REQUEST);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify bug reports', () => {
      const result = classificationService.classify(
        'Bug in checkout',
        'Steps to reproduce: 1. Add item 2. Go to checkout 3. Expected: success, Actual: error'
      );

      expect(result.category).toBe(Category.BUG_REPORT);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should default to OTHER for unclear tickets', () => {
      const result = classificationService.classify(
        'Random title',
        'Some random description without keywords'
      );

      expect(result.category).toBe(Category.OTHER);
    });
  });

  describe('Priority Classification', () => {
    it('should classify urgent priority', () => {
      const result = classificationService.classify(
        'Critical production issue',
        'Production down, cannot access critical systems'
      );

      expect(result.priority).toBe(Priority.URGENT);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify high priority', () => {
      const result = classificationService.classify(
        'Important issue',
        'This is blocking our work and needed asap'
      );

      expect(result.priority).toBe(Priority.HIGH);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify low priority', () => {
      const result = classificationService.classify(
        'Minor cosmetic issue',
        'This is just a suggestion for a minor improvement'
      );

      expect(result.priority).toBe(Priority.LOW);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should default to medium priority', () => {
      const result = classificationService.classify(
        'Regular issue',
        'This is a regular problem without specific priority keywords'
      );

      expect(result.priority).toBe(Priority.MEDIUM);
    });
  });
});
