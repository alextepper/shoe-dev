/** Compare model numbers (numeric-aware; empty last). */
export function compareModelNumber(a, b) {
  const sa = String(a ?? "").trim();
  const sb = String(b ?? "").trim();
  if (!sa && !sb) return 0;
  if (!sa) return 1;
  if (!sb) return -1;
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
}

export function compareSn(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/** Sort color variants: by model number, then SN. */
export function sortByModelNumberThenSn(items) {
  return [...items].sort((a, b) => {
    const byModel = compareModelNumber(a.model_number, b.model_number);
    if (byModel !== 0) return byModel;
    return compareSn(a.sn, b.sn);
  });
}
