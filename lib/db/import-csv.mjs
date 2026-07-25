import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const csvPath = process.argv[2] || process.env.CSV_PATH;
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:1234@localhost:5432/placement_tracker";

if (!csvPath) {
  throw new Error("CSV path is required as the first argument or CSV_PATH environment variable.");
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function normalizeValue(value) {
  if (value === "" || value === "NULL") {
    return null;
  }

  return value;
}

async function main() {
  const resolvedPath = path.resolve(csvPath);
  const csv = await fs.readFile(resolvedPath, "utf8");
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error(`CSV file ${resolvedPath} must have a header and at least one row.`);
  }

  const header = parseCsvLine(lines[0]);
  const expected = [
    "id",
    "application_id",
    "student_id",
    "student_name",
    "company",
    "drive_date",
    "stage",
    "offer_status",
    "package",
    "cgpa",
    "branch",
    "notes",
    "created_at",
    "updated_at",
  ];

  if (header.length !== expected.length || !header.every((value, index) => value === expected[index])) {
    throw new Error(`CSV header does not match expected columns. Expected: ${expected.join(",")}. Got: ${header.join(",")}.`);
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== expected.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${expected.length}.`);
    }

    return {
      applicationId: normalizeValue(values[1]),
      studentId: normalizeValue(values[2]),
      studentName: normalizeValue(values[3]),
      company: normalizeValue(values[4]),
      driveDate: normalizeValue(values[5]),
      stage: normalizeValue(values[6]),
      offerStatus: normalizeValue(values[7]),
      package: normalizeValue(values[8]) !== null ? Number(values[8]) : null,
      cgpa: normalizeValue(values[9]) !== null ? Number(values[9]) : null,
      branch: normalizeValue(values[10]),
      notes: normalizeValue(values[11]),
      createdAt: normalizeValue(values[12]),
      updatedAt: normalizeValue(values[13]),
    };
  });

  console.log(`Importing ${rows.length} rows from ${resolvedPath}`);
  const client = new Client({ connectionString: DATABASE_URL });

  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE applications RESTART IDENTITY");

    const insertSql = `
      INSERT INTO applications (
        application_id,
        student_id,
        student_name,
        company,
        drive_date,
        stage,
        offer_status,
        package,
        cgpa,
        branch,
        notes,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `;

    for (const row of rows) {
      await client.query(insertSql, [
        row.applicationId,
        row.studentId,
        row.studentName,
        row.company,
        row.driveDate,
        row.stage,
        row.offerStatus,
        row.package,
        row.cgpa,
        row.branch,
        row.notes,
        row.createdAt,
        row.updatedAt,
      ]);
    }

    await client.query("COMMIT");
    const count = await client.query("SELECT count(*) AS total FROM applications");
    console.log(`Imported ${rows.length} rows. applications count=${count.rows[0].total}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
