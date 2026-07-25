import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  studentName: text("student_name").notNull(),
  company: text("company").notNull(),
  stage: text("stage").notNull(),
  riskLevel: text("risk_level").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  needsAttention: boolean("needs_attention").notNull().default(false),
  predictedOutcome: text("predicted_outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
