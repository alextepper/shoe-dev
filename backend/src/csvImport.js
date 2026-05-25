import { parse } from "csv-parse/sync";
import db from "./db.js";
import { ITEM_DATA_COLUMNS, ITEM_DATA_KEYS } from "./schema.js";

const CORE_FIELDS = [
  { key: "model_number", label: "MODEL NUMBER", required: true },
  { key: "sn", label: "SN" },
  { key: "title", label: "UPDATED MODEL NAME", required: true },
];

export const CSV_TEMPLATE_FIELDS = [...CORE_FIELDS, ...ITEM_DATA_COLUMNS];

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const HEADER_TO_KEY = (() => {
  const map = new Map();
  for (const field of CSV_TEMPLATE_FIELDS) {
    map.set(normalizeHeader(field.key), field.key);
    map.set(normalizeHeader(field.label), field.key);
  }
  map.set("model", "model_number");
  map.set("model no", "model_number");
  map.set("model #", "model_number");
  map.set("updated model name", "title");
  map.set("name", "title");
  return map;
})();

export function buildCsvTemplate() {
  const headers = CSV_TEMPLATE_FIELDS.map((f) => f.label);
  const example = [
    "4521",
    "A1",
    "Runner Prototype A — Navy",
    "12mm",
    "Navy Blue",
    "Rubber",
    "",
    "",
    "NEW",
    "M",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  return `${headers.join(",")}\n${example.map(escapeCsvCell).join(",")}\n`;
}

function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function mapHeaders(rawHeaders) {
  const mapping = {};
  for (let i = 0; i < rawHeaders.length; i++) {
    const key = HEADER_TO_KEY.get(normalizeHeader(rawHeaders[i]));
    if (key) mapping[i] = key;
  }
  return mapping;
}

function rowToFields(values, headerMapping) {
  const fields = {};
  for (const [index, key] of Object.entries(headerMapping)) {
    const val = values[Number(index)]?.trim();
    if (val) fields[key] = val;
  }
  if (fields.sn) fields.sn = fields.sn.slice(0, 8);
  return fields;
}

export function importItemsFromCsv(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const records = parse(text, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  if (!records.length) {
    return { created: 0, errors: [{ row: 0, error: "CSV file is empty" }] };
  }

  const headerMapping = mapHeaders(records[0]);
  if (!Object.values(headerMapping).includes("model_number")) {
    return {
      created: 0,
      errors: [{ row: 1, error: "Missing MODEL NUMBER column in header row" }],
    };
  }
  if (!Object.values(headerMapping).includes("title")) {
    return {
      created: 0,
      errors: [{ row: 1, error: "Missing UPDATED MODEL NAME column in header row" }],
    };
  }

  const insert = db.prepare(
    `INSERT INTO items (model_number, title, main_image, sn, ${ITEM_DATA_KEYS.join(", ")})
     VALUES (?, ?, NULL, ?, ${ITEM_DATA_KEYS.map(() => "?").join(", ")})`
  );

  const errors = [];
  let created = 0;
  const dataRows = records.slice(1);

  const importBatch = db.transaction((rows) => {
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const fields = rowToFields(rows[i], headerMapping);
      if (!fields.model_number && !fields.title && !fields.sn) continue;

      if (!fields.model_number) {
        errors.push({ row: rowNum, error: "Model number is required" });
        continue;
      }
      if (!fields.title) {
        errors.push({ row: rowNum, error: "Updated model name is required" });
        continue;
      }

      try {
        insert.run(
          fields.model_number,
          fields.title,
          fields.sn ?? null,
          ...ITEM_DATA_KEYS.map((k) => fields[k] ?? null)
        );
        created++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
      }
    }
  });

  importBatch(dataRows);
  return { created, errors, total: dataRows.length };
}
