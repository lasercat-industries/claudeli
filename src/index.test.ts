import { describe, expect, it } from 'bun:test';
import { hello } from './index';

describe('hello', () => {
  it('should return a greeting', () => {
    expect(hello('World')).toBe('Hello, World!');
  });

  it('should work with different names', () => {
    expect(hello('TypeScript')).toBe('Hello, TypeScript!');
  });
});
