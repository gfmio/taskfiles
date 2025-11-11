/**
 * Example TypeScript file for testing taskfiles
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}

// Example usage
console.log(greet("World"));
console.log(add(2, 3));
