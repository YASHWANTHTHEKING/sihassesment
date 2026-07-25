import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { applicationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/companies", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      company: applicationsTable.company,
      driveCount: sql<number>`COUNT(DISTINCT ${applicationsTable.driveDate})`.as("drive_count"),
      applicationCount: sql<number>`COUNT(*)`.as("application_count"),
      offerCount: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.offerStatus} = 'Offered')`.as("offer_count"),
      latestDriveDate: sql<string>`MAX(${applicationsTable.driveDate})`.as("latest_drive_date"),
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.company)
    .orderBy(applicationsTable.company);

  res.json(
    rows.map((r) => ({
      company: r.company,
      driveCount: Number(r.driveCount),
      applicationCount: Number(r.applicationCount),
      offerCount: Number(r.offerCount),
      latestDriveDate: r.latestDriveDate ?? null,
    }))
  );
});

export default router;
