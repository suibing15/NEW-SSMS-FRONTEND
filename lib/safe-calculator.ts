// A small, safe arithmetic evaluator — the old calculator used raw
// eval() on whatever was typed, which works but is bad practice even
// in a constrained context like this. Handles +, -, *, /, decimals,
// and respects standard operator precedence (* and / before + and -).
export function safeEvaluate(expression: string): string {
  const cleaned = expression.replace(/\s+/g, "");
  if (!/^[0-9+\-*/.]+$/.test(cleaned)) return "ERR";

  try {
    const tokens = cleaned.match(/(\d+\.?\d*|\+|-|\*|\/)/g);
    if (!tokens || !tokens.length) return "ERR";

    // First pass: resolve * and /
    const pass1: (number | string)[] = [];
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok === "*" || tok === "/") {
        const prev = pass1.pop();
        const next = Number(tokens[++i]);
        if (typeof prev !== "number" || Number.isNaN(next)) return "ERR";
        pass1.push(tok === "*" ? prev * next : prev / next);
      } else {
        pass1.push(tok === "+" || tok === "-" ? tok : Number(tok));
      }
      i++;
    }

    // Second pass: resolve + and -
    let result = typeof pass1[0] === "number" ? (pass1[0] as number) : NaN;
    for (let j = 1; j < pass1.length; j += 2) {
      const op = pass1[j];
      const val = pass1[j + 1];
      if (typeof val !== "number") return "ERR";
      result = op === "+" ? result + val : result - val;
    }

    if (Number.isNaN(result) || !Number.isFinite(result)) return "ERR";
    return String(Math.round(result * 1e10) / 1e10);
  } catch {
    return "ERR";
  }
}
