import { describe, expect, it } from 'bun:test';

function hello(name: string): string {
  return `Hello, ${name}!`;
}

describe('hello', () => {
  it('should return a greeting', () => {
    expect(hello('World')).toBe('Hello, World!');
  });

  it('should work with different names', () => {
    expect(hello('TypeScript')).toBe('Hello, TypeScript!');
  });
});
