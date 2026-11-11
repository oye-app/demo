/** Keep person selection in the current personal section, never in a visit. */
export function personSection(path: string): "/" | "/llamada" | "/historial" | "/persona" {
  if (path === "/llamada" || path === "/historial" || path === "/persona") return path;
  return "/";
}