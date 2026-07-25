import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { applicationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalApplications: sql<number>`COUNT(*)`,
      totalStudents: sql<number>`COUNT(DISTINCT ${applicationsTable.studentId})`,
      totalCompanies: sql<number>`COUNT(DISTINCT ${applicationsTable.company})`,
      totalOffers: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.offerStatus} = 'Offered')`,
      avgPackage: sql<number | null>`AVG(${applicationsTable.package}::numeric) FILTER (WHERE ${applicationsTable.stage} = 'Selected')`,
      pendingApplications: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.stage} NOT IN ('Selected', 'Rejected'))`,
    })
    .from(applicationsTable);

  const totalApplications = Number(stats.totalApplications);
  const totalOffers = Number(stats.totalOffers);

  res.json({
    totalApplications,
    totalStudents: Number(stats.totalStudents),
    totalCompanies: Number(stats.totalCompanies),
    totalOffers,
    offerRate: totalApplications > 0 ? Math.round((totalOffers / totalApplications) * 1000) / 10 : 0,
    avgPackage: stats.avgPackage !== null ? Math.round(Number(stats.avgPackage) * 100) / 100 : null,
    pendingApplications: Number(stats.pendingApplications),
  });
});

router.get("/dashboard/pipeline", async (_req, res): Promise<void> => {
  const stages = ["Applied", "Shortlisted", "Interview", "Selected", "Rejected"];

  const rows = await db
    .select({
      stage: applicationsTable.stage,
      count: sql<number>`COUNT(*)`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.stage);

  const countMap: Record<string, number> = {};
  for (const r of rows) {
    countMap[r.stage] = Number(r.count);
  }

  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  res.json(
    stages.map((stage) => ({
      stage,
      count: countMap[stage] ?? 0,
      percentage: total > 0 ? Math.round(((countMap[stage] ?? 0) / total) * 1000) / 10 : 0,
    }))
  );
});

router.get("/dashboard/recent", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(applicationsTable)
    .orderBy(sql`${applicationsTable.updatedAt} DESC`)
    .limit(10);

  res.json(
    rows.map((app) => ({
      id: app.id,
      applicationId: app.applicationId,
      studentId: app.studentId,
      studentName: app.studentName,
      company: app.company,
      driveDate: app.driveDate,
      stage: app.stage,
      offerStatus: app.offerStatus,
      package: app.package !== null && app.package !== undefined ? Number(app.package) : null,
      cgpa: app.cgpa !== null && app.cgpa !== undefined ? Number(app.cgpa) : null,
      branch: app.branch,
      notes: app.notes,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }))
  );
});

router.get("/dashboard/company-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      company: applicationsTable.company,
      total: sql<number>`COUNT(*)`,
      offers: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.offerStatus} = 'Offered')`,
      rejections: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.stage} = 'Rejected')`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.stage} NOT IN ('Selected','Rejected'))`,
      avgPackage: sql<number | null>`AVG(${applicationsTable.package}::numeric) FILTER (WHERE ${applicationsTable.stage} = 'Selected')`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.company)
    .orderBy(sql`COUNT(*) DESC`);

  res.json(
    rows.map((r) => {
      const total = Number(r.total);
      const offers = Number(r.offers);
      return {
        company: r.company,
        total,
        offers,
        rejections: Number(r.rejections),
        pending: Number(r.pending),
        offerRate: total > 0 ? Math.round((offers / total) * 1000) / 10 : 0,
        avgPackage: r.avgPackage !== null ? Math.round(Number(r.avgPackage) * 100) / 100 : null,
      };
    })
  );
});

export default router;
