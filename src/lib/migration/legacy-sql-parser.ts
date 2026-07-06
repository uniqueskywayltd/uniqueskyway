import type {
  LegacyAdmin,
  LegacyExtract,
  LegacyTransaction,
  LegacyUser,
} from "./types";

function parseSqlValues(block: string): string[] {
  const rows: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of block) {
    if (ch === "(") depth += 1;
    if (depth > 0) current += ch;
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        rows.push(current.slice(1, -1));
        current = "";
      }
    }
  }

  return rows;
}

/** Parse a single SQL INSERT value tuple respecting quoted strings. */
export function parseSqlRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i];
    if (ch === "'" && row[i - 1] !== "\\") {
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      values.push(unquoteSqlValue(current.trim()));
      current = "";
      continue;
    }
    current += ch;
  }

  if (current.trim()) {
    values.push(unquoteSqlValue(current.trim()));
  }

  return values;
}

function unquoteSqlValue(value: string): string {
  if (value === "NULL") return "";
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  }
  return value;
}

function extractInsertBlock(sql: string, table: string): string | null {
  const pattern = new RegExp(
    `INSERT INTO \`${table}\` VALUES\\s*(.*?);`,
    "s",
  );
  const match = sql.match(pattern);
  return match?.[1] ?? null;
}

function toNumber(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseLegacyUsers(sql: string): LegacyUser[] {
  const block = extractInsertBlock(sql, "users");
  if (!block) return [];

  return parseSqlValues(block).map((row) => {
    const v = parseSqlRow(row);
    return {
      uId: parseInt(v[0] ?? "0", 10),
      name: (v[1] ?? "").trim(),
      userName: (v[2] ?? "").trim(),
      pass: v[3] ?? "",
      email: (v[4] ?? "").trim().toLowerCase(),
      plan: v[5] ?? "",
      passport: v[6] ?? "",
      registeredAt: v[7] ?? "",
      ref: v[8] ?? "",
      myRef: v[9] ?? "",
      raw: {
        u_id: v[0],
        name: v[1],
        user_name: v[2],
        email: v[4],
        plan: v[5],
        passport: v[6],
        date: v[7],
        ref: v[8],
        my_ref: v[9],
      },
    };
  });
}

export function parseLegacyTransactions(sql: string): LegacyTransaction[] {
  const block = extractInsertBlock(sql, "transactions");
  if (!block) return [];

  return parseSqlValues(block).map((row) => {
    const v = parseSqlRow(row);
    return {
      tId: parseInt(v[0] ?? "0", 10),
      userId: v[1] ?? "",
      email: (v[2] ?? "").trim().toLowerCase(),
      plan: v[3] ?? "",
      type: v[4] ?? "",
      method: v[5] ?? "",
      amount: toNumber(v[6] ?? "0"),
      traId: v[7] ?? "",
      createdAt: v[8] ?? "",
      interest: toNumber(v[9] ?? "0"),
      eventDate: v[10] ?? "",
      address: v[11] ?? "",
      network: v[12] ?? "",
      confirm: parseInt(v[13] ?? "0", 10),
      complete: parseInt(v[14] ?? "0", 10),
      raw: {
        t_id: v[0],
        user_id: v[1],
        email: v[2],
        plan: v[3],
        type: v[4],
        method: v[5],
        amount: v[6],
        tra_id: v[7],
        d: v[8],
        interest: v[9],
        date: v[10],
        address: v[11],
        network: v[12],
        confirm: v[13],
        complete: v[14],
      },
    };
  });
}

export function parseLegacyAdmins(sql: string): LegacyAdmin[] {
  const block = extractInsertBlock(sql, "admin");
  if (!block) return [];

  return parseSqlValues(block).map((row) => {
    const v = parseSqlRow(row);
    return {
      aId: parseInt(v[0] ?? "0", 10),
      adminEmail: (v[1] ?? "").trim().toLowerCase(),
      adminPass: v[2] ?? "",
      raw: { a_id: v[0], admin_email: v[1] },
    };
  });
}

export function extractLegacyData(
  sourcePath: string,
  sqlContent: string,
): LegacyExtract {
  const users = parseLegacyUsers(sqlContent);
  const transactions = parseLegacyTransactions(sqlContent);
  const admins = parseLegacyAdmins(sqlContent);

  return {
    sourcePath,
    extractedAt: new Date().toISOString(),
    users,
    transactions: transactions.sort((a, b) => a.tId - b.tId),
    admins,
    stats: {
      userCount: users.length,
      transactionCount: transactions.length,
      adminCount: admins.length,
    },
  };
}

export function normalizeTxType(type: string): string {
  return type.trim().toLowerCase();
}

export function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const ms = endDate.getTime() - startDate.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
