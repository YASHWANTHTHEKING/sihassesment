import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  applicationId: text("application_id").notNull().unique(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  company: text("company").notNull(),
  driveDate: date("drive_date", { mode: "string" }).notNull(),
  stage: text("stage").notNull().default("Applied"),
  offerStatus: text("offer_status").notNull().default("Pending"),
  package: numeric("package", { precision: 6, scale: 2 }),
  cgpa: numeric("cgpa", { precision: 4, scale: 2 }),
  branch: text("branch"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
