import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import companiesRouter from "./companies";
import dashboardRouter from "./dashboard";
import predictionsRouter from "./predictions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(applicationsRouter);
router.use(companiesRouter);
router.use(dashboardRouter);
router.use(predictionsRouter);

export default router;
