// Converts a small, safe subset of inline Markdown to HTML. Shared by the
// website components AND the PDF generator (scripts/build-resume.mjs) so the two
// can never render bullet formatting differently.
//
//   **bold**           -> <strong>bold</strong>
//   [text](https://…)  -> <a href="https://…" target="_blank" rel="noopener noreferrer">text</a>
//
// Everything else is HTML-escaped first, so bullet text is safe to inject.
export function inline(str = "") {
  let s = String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return s;
}
