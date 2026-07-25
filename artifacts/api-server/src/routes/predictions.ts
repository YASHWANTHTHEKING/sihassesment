import { Router, type IRouter } from "express";
import { db, predictionsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { spawn } from "child_process";
import path from "path";

const router: IRouter = Router();

function runPythonPredict(): Promise<{ success: boolean; count: number; message: string }> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), "../../ml-service/predict.py");
    const proc = spawn("python3", [scriptPath], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) {
        logger.error({ stderr, code }, "Python prediction script failed");
        reject(new Error(stderr || `Python process exited with code ${code}`));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          reject(new Error(result.error));
          return;
        }
        resolve({ success: result.success, count: result.count, message: result.message });
      } catch {
        reject(new Error(`Failed to parse prediction output: ${stdout}`));
      }
    });

    proc.on("error", reject);
  });
}

router.get("/predictions", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(predictionsTable)
    .orderBy(predictionsTable.applicationId);

  res.json(
    rows.map((p) => ({
      applicationId: p.applicationId,
      studentName: p.studentName,
      company: p.company,
      stage: p.stage,
      riskLevel: p.riskLevel,
      confidence: Number(p.confidence),
      needsAttention: p.needsAttention,
      predictedOutcome: p.predictedOutcome,
    }))
  );
});

router.post("/predictions/run", async (req, res): Promise<void> => {
  try {
    const result = await runPythonPredict();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to run predictions");
    res.status(500).json({ error: err instanceof Error ? err.message : "Prediction failed" });
  }
});

export default router;
