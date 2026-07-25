import { Router, type IRouter } from "express";
import { eq, ilike, and, or, SQL } from "drizzle-orm";
import { db, applicationsTable, predictionsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  ListApplicationsQueryParams,
  CreateApplicationBody,
  GetApplicationParams,
  UpdateApplicationParams,
  UpdateApplicationBody,
  DeleteApplicationParams,
  ListApplicationsResponse,
  CreateApplicationResponse,
  GetApplicationResponse,
  UpdateApplicationResponse,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

function mapApplication(app: typeof applicationsTable.$inferSelect) {
  return {
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
  };
}

router.get("/applications", async (req, res): Promise<void> => {
  const parsed = ListApplicationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { stage, company, offer_status, search } = parsed.data;
  const conditions: SQL[] = [];

  if (stage) {
    conditions.push(eq(applicationsTable.stage, stage));
  }
  if (company) {
    conditions.push(eq(applicationsTable.company, company));
  }
  if (offer_status) {
    conditions.push(eq(applicationsTable.offerStatus, offer_status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(applicationsTable.studentName, `%${search}%`),
        ilike(applicationsTable.company, `%${search}%`),
        ilike(applicationsTable.studentId, `%${search}%`),
        ilike(applicationsTable.branch, `%${search}%`)
      )!
    );
  }

  const query = db.select().from(applicationsTable);
  const results = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(applicationsTable.createdAt)
    : await query.orderBy(applicationsTable.createdAt);

  const mapped = results.map(mapApplication);
  res.json(ListApplicationsResponse.parse(mapped));
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid application body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const applicationId = `APP-${nanoid(8).toUpperCase()}`;

  // Drizzle date columns with mode:"string" expect YYYY-MM-DD strings;
  // Orval coerces format:date to Date objects, so we convert.
  const driveDateStr =
    data.driveDate instanceof Date
      ? data.driveDate.toISOString().split("T")[0]
      : String(data.driveDate);

  const [app] = await db.insert(applicationsTable).values({
    applicationId,
    studentId: data.studentId,
    studentName: data.studentName,
    company: data.company,
    driveDate: driveDateStr,
    stage: data.stage,
    offerStatus: data.offerStatus,
    package: data.package !== null && data.package !== undefined ? String(data.package) : null,
    cgpa: data.cgpa !== null && data.cgpa !== undefined ? String(data.cgpa) : null,
    branch: data.branch ?? null,
    notes: data.notes ?? null,
  }).returning();

  res.status(201).json(CreateApplicationResponse.parse(mapApplication(app)));
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json(GetApplicationResponse.parse(mapApplication(app)));
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.studentName !== undefined) updateData.studentName = data.studentName;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.driveDate !== undefined) {
    updateData.driveDate =
      data.driveDate instanceof Date
        ? data.driveDate.toISOString().split("T")[0]
        : String(data.driveDate);
  }
  if (data.stage !== undefined) updateData.stage = data.stage;
  if (data.offerStatus !== undefined) updateData.offerStatus = data.offerStatus;
  if (data.package !== undefined) updateData.package = data.package !== null ? String(data.package) : null;
  if (data.cgpa !== undefined) updateData.cgpa = data.cgpa !== null ? String(data.cgpa) : null;
  if (data.branch !== undefined) updateData.branch = data.branch;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const [app] = await db
    .update(applicationsTable)
    .set(updateData)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  // Synchronize basic prediction fields if studentName, company or stage updated
  const predUpdate: Record<string, unknown> = {};
  if (data.studentName !== undefined) predUpdate.studentName = data.studentName;
  if (data.company !== undefined) predUpdate.company = data.company;
  if (data.stage !== undefined) predUpdate.stage = data.stage;
  if (Object.keys(predUpdate).length > 0) {
    await db
      .update(predictionsTable)
      .set(predUpdate)
      .where(eq(predictionsTable.applicationId, params.data.id));
  }

  res.json(UpdateApplicationResponse.parse(mapApplication(app)));
});

router.delete("/applications/:id", async (req, res): Promise<void> => {
  const params = DeleteApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .delete(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  // Remove corresponding prediction record
  await db
    .delete(predictionsTable)
    .where(eq(predictionsTable.applicationId, params.data.id));

  res.sendStatus(204);
});

export default router;
