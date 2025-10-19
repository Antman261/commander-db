export function sortBy<T, K extends keyof T>(key: K, reverse = false) {
  const sortOrder = reverse ? -1 : 1;
  return (a: T, b: T) => (a[key] < b[key]) ? -1 : (a[key] > b[key]) ? 1 : 0 * sortOrder;
}
