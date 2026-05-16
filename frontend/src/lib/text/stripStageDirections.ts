/** Remove *stage direction* segments (e.g. *nods politely*) from assistant text. */
export function stripStageDirections(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*[^*\n]+\*/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
