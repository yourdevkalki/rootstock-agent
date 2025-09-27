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
import { getLatestPythPrice } from "../services/pyth.js";
import { getAllowance } from "../services/erc20.js";
import {
  getSpenderAddress,
  storeUserStrategy,
  getUserStrategies,
  createLimitOrderTask,
} from "../services/user.js";

const router = Router();

router.get("/", async (_req, res) => {
  const tasks = await getAllTasks();
  res.json(tasks);
});

router.post("/time", async (req, res) => {
  const { targetContract, functionSignature, args, intervalSeconds } =
    req.body || {};
  if (!targetContract || !functionSignature || intervalSeconds == null) {
    return res
      .status(400)
      .json({
        error: "targetContract, functionSignature, intervalSeconds required",
      });
  }
  const callData = abiEncodeFunctionCalldata(functionSignature, args || []);
  const result = await createTimeTask(
    targetContract,
    callData,
    BigInt(intervalSeconds)
  );
  res.json(result);
});

router.post("/price", async (req, res) => {
  const {
    targetContract,
    functionSignature,
    args,
    priceId,
    comparator,
    targetPrice,
    targetExpo,
  } = req.body || {};
  if (
    !targetContract ||
    !functionSignature ||
    !priceId ||
    !comparator ||
    targetPrice == null ||
    targetExpo == null
  ) {
    return res.status(400).json({
      error:
        "targetContract, functionSignature, priceId, comparator, targetPrice, targetExpo required",
    });
  }
  const callData = abiEncodeFunctionCalldata(functionSignature, args || []);
  const result = await createPriceTask(
    targetContract,
    callData,
    priceId,
    comparator,
    BigInt(targetPrice),
    Number(targetExpo)
  );
  res.json(result);
});

// Pricing endpoint via Pyth
router.get("/price/:priceId", async (req, res) => {
  const { priceId } = req.params;
  const data = await getLatestPythPrice(priceId);
  res.json(data);
});

// Spender address for allowances
router.get("/spender", async (_req, res) => {
  res.json({ spender: getSpenderAddress() });
});

// Query current allowance of an owner for a token toward spender
router.get("/allowance", async (req, res) => {
  const { token, owner, spender } = req.query;
  if (!token || !owner)
    return res.status(400).json({ error: "token and owner required" });
  const useSpender = spender || getSpenderAddress();
  const info = await getAllowance(token, owner, useSpender);
  res.json({ spender: useSpender, ...info });
});

// Store user strategy metadata (in-memory), and optionally create on-chain price task
router.post("/strategy", async (req, res) => {
  const body = req.body || {};
  const { wallet, persistOnChain } = body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  storeUserStrategy(wallet, body);
  let taskId = null;
  if (persistOnChain) {
    taskId = await createLimitOrderTask(body);
  }
  res.json({ ok: true, taskId });
});

router.get("/strategy/:wallet", async (req, res) => {
  const { wallet } = req.params;
  res.json(getUserStrategies(wallet));
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
