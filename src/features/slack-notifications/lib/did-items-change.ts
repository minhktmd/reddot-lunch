export function didItemsChange(
  before: { name: string; price: number; sideDishes: string | null }[],
  after: { name: string; price: number; sideDishes: string | null }[]
): boolean {
  const toKey = (i: { name: string; price: number; sideDishes: string | null }) =>
    `${i.name}|${i.price}|${i.sideDishes ?? ''}`;
  const beforeKeys = new Set(before.map(toKey));
  const afterKeys = new Set(after.map(toKey));
  if (beforeKeys.size !== afterKeys.size) return true;
  for (const k of afterKeys) if (!beforeKeys.has(k)) return true;
  return false;
}
