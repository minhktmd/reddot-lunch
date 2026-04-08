export function buildExternalDishesUpdatedMessage(
  dishes: { name: string; orderUrl: string }[]
): string {
  const lines = dishes.map((d) => `• ${d.name} — ${d.orderUrl}`).join('\n');
  return `🛵 Admin vừa cập nhật món ăn ngoài cho hôm nay:\n\n${lines}`;
}
