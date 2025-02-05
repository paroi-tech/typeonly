export function assertExists<T>(val: T | undefined): asserts val is T {
  if (val === undefined) throw new Error("missing value");
}