/** Copies text; tries the async Clipboard API, then a hidden-textarea fallback. Resolves false if both fail. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const element = document.createElement("textarea");
  element.value = text;
  element.setAttribute("readonly", "");
  element.style.position = "fixed";
  element.style.opacity = "0";
  document.body.appendChild(element);
  element.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(element);
  return ok;
}
