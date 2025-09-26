import { Router } from "express";
import {
  abiEncodeFunctionCalldata,
  cancelTask,
  createPriceTask,
  createTimeTask,
  describeTask,
  executeTask,
  getAllTasks,
} from "../services/tasks.js";

const router = Router();

router.get("/", async (_req, res) => {
  const tasks = await getAllTasks();
  res.json(tasks);
});

router.post("/time", async (req, res) => {
  const { targetContract, functionSignature, args, intervalSeconds } = req.body || {};
  if (!targetContract || !functionSignature || intervalSeconds == null) {
    return res.status(400).json({ error: "targetContract, functionSignature, intervalSeconds required" });
  }
  const callData = abiEncodeFunctionCalldata(functionSignature, args || []);
  const taskId = await createTimeTask(targetContract, callData, BigInt(intervalSeconds));
  res.json({ taskId });
});

router.post("/price", async (req, res) => {
  const { targetContract, functionSignature, args, priceId, comparator, targetPrice, targetExpo } = req.body || {};
  if (!targetContract || !functionSignature || !priceId || !comparator || targetPrice == null || targetExpo == null) {
    return res.status(400).json({
      error: "targetContract, functionSignature, priceId, comparator, targetPrice, targetExpo required",
    });
  }
  const callData = abiEncodeFunctionCalldata(functionSignature, args || []);
  const taskId = await createPriceTask(targetContract, callData, priceId, comparator, BigInt(targetPrice), Number(targetExpo));
  res.json({ taskId });
});

router.post("/:taskId/execute", async (req, res) => {
  const { taskId } = req.params;
  const result = await executeTask(Number(taskId));
  res.json(result);
});

router.post("/:taskId/cancel", async (req, res) => {
  const { taskId } = req.params;
  await cancelTask(Number(taskId));
  res.json({ ok: true });
});

router.get("/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const task = await describeTask(Number(taskId));
  res.json(task);
});

export default router;


