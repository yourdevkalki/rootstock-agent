import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import tasksRouter from "./routes/tasks.js";
import swapRouter from "./routes/swap.js";
import swapPythRouter from "./routes/swap-pyth.js";
import automationRouter from "./routes/automation.js";
import dummyTokensRouter from "./routes/dummy-tokens.js";
import pricesRouter from "./routes/prices.js";
import tokensRouter from "./routes/tokens.js";
import openaiRouter from "./routes/openai.js";
import naturalLanguageRouter from "./routes/natural-language.js";
import { startWorker } from "./worker.js";
import { wireEventLogs } from "./events.js";
import { eventsDisabled } from "./py.config.mjs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/tasks", tasksRouter);
app.use("/swap", swapRouter);
app.use("/swap-pyth", swapPythRouter);
app.use("/automation", automationRouter);
app.use("/dummy-tokens", dummyTokensRouter);
app.use("/prices", pricesRouter);
app.use("/tokens", tokensRouter);
app.use("/openai", openaiRouter);
app.use("/natural-language", naturalLanguageRouter);

const PORT = process.env.PORT || 3000;

let server;
if (process.env.DISABLE_LISTEN !== "1") {
  server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${PORT}`);
  });
}

// kick background worker
startWorker().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Worker failed to start", err);
});

// wire events (optional for some RPCs which do not support filters)
if (!eventsDisabled()) {
  try {
    wireEventLogs();
  } catch (e) {
    console.error("Event wire failed", e?.message || e);
  }
}

export default app;
export { server };
