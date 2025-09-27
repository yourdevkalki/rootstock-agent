import { Router } from "express";
import { parseNaturalLanguageTask } from "../services/openai.js";
import {
  createPriceTask,
  createTimeTask,
  abiEncodeFunctionCalldata,
} from "../services/tasks.js";

const router = Router();

// Create a task from natural language description
router.post("/create-task", async (req, res) => {
  try {
    const { instruction, userAddress } = req.body;

    // Validate input
    if (!instruction) {
      return res.status(400).json({
        error: "instruction is required",
        example:
          "Remove my ETH from Aave lending if the interest rate drops below 2.5%",
      });
    }

    if (!userAddress) {
      return res.status(400).json({
        error: "userAddress is required for task creation",
      });
    }

    console.log(`Processing natural language instruction: "${instruction}"`);

    // Parse the instruction using OpenAI
    const parsedTask = await parseNaturalLanguageTask(instruction);

    console.log("Parsed task parameters:", JSON.stringify(parsedTask, null, 2));

    // Validate the parsed task
    if (
      !parsedTask.taskType ||
      !parsedTask.targetContract ||
      !parsedTask.functionSignature
    ) {
      return res.status(400).json({
        error: "Could not parse instruction into valid task parameters",
        parsedTask,
        suggestion:
          "Please provide more specific instructions with clear trigger conditions",
      });
    }

    // Check confidence level
    if (parsedTask.confidence < 60) {
      return res.status(400).json({
        error: "Low confidence in instruction parsing",
        confidence: parsedTask.confidence,
        warnings: parsedTask.warnings,
        suggestion: "Please provide more specific or clearer instructions",
      });
    }

    // Generate call data
    const callData = abiEncodeFunctionCalldata(
      parsedTask.functionSignature,
      parsedTask.args || []
    );

    let taskResult;

    // Create the appropriate task type
    if (parsedTask.taskType === "price") {
      const { priceId, comparator, targetPrice, targetExpo } =
        parsedTask.resolverData;

      if (!priceId || !comparator || !targetPrice || targetExpo === undefined) {
        return res.status(400).json({
          error: "Missing required price task parameters",
          required: ["priceId", "comparator", "targetPrice", "targetExpo"],
          received: parsedTask.resolverData,
        });
      }

      taskResult = await createPriceTask(
        parsedTask.targetContract,
        callData,
        priceId,
        comparator,
        BigInt(targetPrice),
        Number(targetExpo)
      );
    } else if (parsedTask.taskType === "time") {
      const { intervalSeconds } = parsedTask.resolverData;

      if (!intervalSeconds) {
        return res.status(400).json({
          error: "Missing intervalSeconds for time-based task",
          received: parsedTask.resolverData,
        });
      }

      taskResult = await createTimeTask(
        parsedTask.targetContract,
        callData,
        BigInt(intervalSeconds)
      );
    } else {
      return res.status(400).json({
        error: "Invalid task type",
        received: parsedTask.taskType,
        expected: ["price", "time"],
      });
    }

    const { taskId, transactionHash } = taskResult;

    // Store the natural language context for future reference
    global.naturalLanguageTasks = global.naturalLanguageTasks || new Map();
    global.naturalLanguageTasks.set(taskId, {
      originalInstruction: instruction,
      userAddress,
      parsedTask,
      createdAt: new Date().toISOString(),
      taskId,
    });

    // Return success response
    res.json({
      success: true,
      taskId,
      transactionHash, // Real transaction hash from blockchain
      originalInstruction: instruction,
      parsedTask: {
        taskType: parsedTask.taskType,
        description: parsedTask.description,
        confidence: parsedTask.confidence,
        warnings: parsedTask.warnings,
      },
      taskDetails: {
        targetContract: parsedTask.targetContract,
        functionSignature: parsedTask.functionSignature,
        resolverData: parsedTask.resolverData,
      },
      message: `Task created successfully! ${parsedTask.description}`,
      nextSteps: [
        "The task is now registered on-chain and will be monitored",
        "You can check task status using GET /tasks/:taskId",
        "Cancel the task anytime using POST /tasks/:taskId/cancel",
      ],
    });
  } catch (error) {
    console.error("Natural language task creation error:", error);

    // Provide helpful error messages
    if (error.message.includes("OpenAI API key not configured")) {
      return res.status(500).json({
        error: "AI service not available",
        message:
          "The natural language processing service is currently unavailable",
      });
    }

    if (error.message.includes("JSON")) {
      return res.status(500).json({
        error: "Failed to parse AI response",
        message:
          "The AI service returned an invalid response. Please try rephrasing your instruction.",
      });
    }

    res.status(500).json({
      error: error.message,
      type: "task_creation_error",
      suggestion: "Please check your instruction format and try again",
    });
  }
});

// Get natural language task details
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const nlTask = global.naturalLanguageTasks?.get(taskId);

    if (!nlTask) {
      return res.status(404).json({
        error: "Natural language task not found",
        taskId,
      });
    }

    res.json({
      success: true,
      task: nlTask,
    });
  } catch (error) {
    console.error("Get natural language task error:", error);
    res.status(500).json({ error: error.message });
  }
});

// List all natural language tasks
router.get("/tasks", async (req, res) => {
  try {
    const { userAddress } = req.query;

    let tasks = [];

    if (global.naturalLanguageTasks) {
      tasks = Array.from(global.naturalLanguageTasks.values());

      // Filter by user address if provided
      if (userAddress) {
        tasks = tasks.filter((task) => task.userAddress === userAddress);
      }
    }

    res.json({
      success: true,
      tasks,
      totalCount: tasks.length,
    });
  } catch (error) {
    console.error("List natural language tasks error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Parse instruction without creating task (for testing/preview)
router.post("/parse", async (req, res) => {
  try {
    const { instruction } = req.body;

    if (!instruction) {
      return res.status(400).json({
        error: "instruction is required",
      });
    }

    const parsedTask = await parseNaturalLanguageTask(instruction);

    res.json({
      success: true,
      originalInstruction: instruction,
      parsedTask,
      preview: true,
      message:
        "This is a preview. Use POST /natural-language/create-task to actually create the task.",
    });
  } catch (error) {
    console.error("Parse instruction error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
