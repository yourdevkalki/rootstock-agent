import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import tasksRouter from "./routes/tasks.js";
import { startWorker } from "./worker.js";
import { wireEventLogs } from "./events.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/tasks", tasksRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${PORT}`);
});

// kick background worker
startWorker().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Worker failed to start", err);
});

// wire events
wireEventLogs();


