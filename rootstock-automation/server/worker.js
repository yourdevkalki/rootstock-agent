import { describeTask, evaluateShouldExecute, executeTask, getAllTasks } from "./services/tasks.js";

const POLL_MS = Number(process.env.WORKER_POLL_MS || 30_000);

export async function startWorker() {
  // eslint-disable-next-line no-console
  console.log(`Worker polling every ${POLL_MS}ms`);
  setInterval(async () => {
    try {
      const tasks = await getAllTasks();
      for (const t of tasks) {
        // eslint-disable-next-line no-await-in-loop
        const fresh = await describeTask(Number(t.taskId));
        // eslint-disable-next-line no-await-in-loop
        const should = await evaluateShouldExecute(fresh);
        if (should) {
          // eslint-disable-next-line no-console
          console.log(`Executing task ${fresh.taskId}`);
          // eslint-disable-next-line no-await-in-loop
          const res = await executeTask(Number(fresh.taskId));
          // eslint-disable-next-line no-console
          console.log(`Executed task ${fresh.taskId}`, res);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Worker error", err?.message || err);
    }
  }, POLL_MS);
}


