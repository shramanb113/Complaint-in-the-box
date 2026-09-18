export function formatInrNumber(amountInr: number): string {
  return amountInr.toLocaleString("en-IN");
}

export function formatInr(amountInr: number): string {
  return "₹" + formatInrNumber(amountInr);
}
