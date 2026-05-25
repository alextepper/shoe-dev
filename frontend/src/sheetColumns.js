export const DEFAULT_COMMENT_COLUMNS = [
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 I",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 II",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 III",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 IV",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 V",
  "SHAHAR COMMENTS 17/05/26 I",
  "SHAHAR COMMENTS 17/05/26 II",
  "SHAHAR COMMENTS 17/05/26 III",
  "SHAHAR COMMENTS 17/05/26 IV",
  "SHAHAR COMMENTS 17/05/26 V",
];

/** Sticky columns on color-variant sheets (model number is not shown — use page title / filter). */
export const STICKY_COLUMNS = [
  { key: "sn", label: "SN", width: 44 },
  { key: "main_image", label: "MODEL PHOTO", width: 72 },
  { key: "title", label: "UPDATED MODEL NAME", width: 200 },
];

export const DATA_COLUMNS = [
  { key: "edge_sole_total_thickness", label: "EDGE SOLE TOTAL THICKNES", width: 140 },
  { key: "upper_color", label: "UPPER COLOR", width: 120 },
  { key: "outsole", label: "OUTSOLE", width: 100 },
  { key: "outsole_thickness", label: "OUTSOLE THICKNES", width: 120 },
  { key: "mid_sole_footbed_thickness", label: "MID SOLE FOOTBED THICKNESS", width: 160 },
  { key: "new_updated_carry_over", label: "NEW|UPDATED|CARRY OVER", width: 150 },
  { key: "gender", label: "GENDER", width: 80 },
  { key: "upper_color_pantones", label: "UPPER COLOR PANTHONES", width: 150 },
  { key: "footbed_material", label: "FOOTBED Material", width: 120 },
  { key: "footbed_color", label: "FOOTBED COLOR", width: 110 },
  { key: "outsole_color", label: "OUTSOLE COLOR", width: 110 },
  { key: "size_range", label: "SIZE RANGE", width: 100 },
  { key: "original_sole_shape", label: "ORIGINAL SOLE SHAPE", width: 140 },
  { key: "new_sole_shape_code", label: "NEW SOLE SHAPE CODE", width: 140 },
  { key: "logo", label: "LOGO", width: 80 },
  { key: "straps_upper_material", label: "STRAPS|UPPERR MATIRAIL", width: 150 },
  { key: "straps_upper_comments", label: "STRAPS|UPPERR COMENTS", width: 150 },
  { key: "toe_post", label: "TOE PSOT", width: 90 },
  { key: "shoe_box", label: "SHOE BOX", width: 90 },
];

/** Wider photo column on model detail sheet (still 3 pinned columns). */
export const MODEL_PAGE_STICKY_COLUMNS = [
  { key: "sn", label: "SN", width: 44 },
  { key: "main_image", label: "MODEL PHOTO", width: 96 },
  { key: "title", label: "UPDATED MODEL NAME", width: 200 },
];

export function stickyLeftOffsets(columns = STICKY_COLUMNS) {
  let left = 0;
  return columns.map((col) => {
    const offset = left;
    left += col.width;
    return { ...col, left: offset };
  });
}

export function cellValue(item, key) {
  if (key === "main_image") return null;
  const v = item[key];
  return v == null || v === "" ? "" : String(v);
}

export function commentValue(item, label) {
  return item.comment_cells?.[label] ?? "";
}
