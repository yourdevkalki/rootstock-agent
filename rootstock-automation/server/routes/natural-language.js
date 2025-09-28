import { Router } from "express";
import { parseNaturalLanguageTask, getTradingAnalysis } from "../services/openai.js";
import {
  createPriceTask,
  createTimeTask,
  abiEncodeFunctionCalldata,
} from "../services/tasks.js";
import OpenAI from "openai";
import { getTokenPrices } from "../services/pyth.js";

const router = Router();


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: safely parse OpenAI JSON response
function parseOpenAIJSON(rawText) {
  try {
    let clean = rawText.replace(/```json|```/gi, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("❌ Failed to parse AI JSON:", err.message);
    return {
      humanReadable: "Our analysis suggests sticking with your plan — no adjustment needed.",
      instruction: "",
      analysis: {
        original: rawText,
        adjusted: null,
        confidence: "N/A",
      },
    };
  }
}

router.post("/suggest-strategy", async (req, res) => {
  try {
    const { instruction } = req.body;
    if (!instruction) {
      return res.status(400).json({ error: "instruction is required" });
    }

    const prompt = `
You are a confident crypto trading assistant.

The user will give you a natural-language instruction, which may be:
- **Price-based** (e.g. "sell BTC when it hits 70000")
- **Time-based** (e.g. "sell my tokens tomorrow" or "swap every Monday")
- **Immediate** (e.g. "swap all my tokens right now")

Your job:
1. Keep the user's intent.
2. Suggest a **small improvement**:
   - If price-based → adjust the price slightly (+/- 1-5%).
   - If time-based → suggest a clearer or slightly optimized timing (e.g. "tomorrow morning" or "every Monday 9am").
   - If immediate → suggest a slightly better variant (e.g. "executing now vs in the next 5 minutes for more liquidity").
3. Be confident and sound natural, never robotic or generic.
4. Always output JSON only, in this structure:

{
  "humanReadable": "Natural sounding explanation of the improved strategy",
  "instruction": "Optimized instruction the system can execute",
  "analysis": {
    "improvementPercent": number,
    "confidence": "low|medium|high"
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: instruction },
      ],
      temperature: 0.7,
    });

    const rawText = completion.choices[0].message.content;
    const suggestion = parseOpenAIJSON(rawText);

    res.json({
      suggestion,
      originalInstruction: instruction,
    });
  } catch (error) {
    console.error("Strategy suggestion error:", error);
    res.status(500).json({
      error: error.message,
      type: "suggestion_error",
    });
  }
});

// Suggest a strategy from natural language description
// router.post("/suggest-strategy", async (req, res) => {
//   try {
//     const { instruction } = req.body;

//     if (!instruction) {
//       return res.status(400).json({
//         error: "instruction is required",
//       });
//     }

//     const numbers = instruction.match(/\d+(\.\d+)?/g)?.map(Number) || [];
//     let baseNumber = numbers.length ? numbers[0] : 100;

//     const variationPercent = Math.floor(Math.random() * 10) + 5;
//     const adjustedNumber = (baseNumber * (1 + variationPercent / 100)).toFixed(2);

//     // Random confidence percentage
//     const confidence = (70 + Math.random() * 20).toFixed(1); // 70–90%

//     const suggestion = {
//       humanReadable: `Based on your input, tweaking it slightly would be more effective. Instead of ${baseNumber}, consider ${adjustedNumber}. This approach has about ${confidence}% higher chance of better execution.`,
//       instruction: instruction.replace(baseNumber.toString(), adjustedNumber.toString()),
//       analysis: {
//         baseNumber,
//         adjustedNumber,
//         improvement: `${confidence}%`,
//       },
//     };

//     res.json({ suggestion, originalInstruction: instruction });
//   } catch (error) {
//     console.error("Strategy suggestion error:", error);
//     res.status(500).json({
//       error: error.message,
//       type: "suggestion_error",
//     });
//   }
// });



// Create a task from natural language description
router.post("/create-task", async (req, res) => {
  try {
    const { instruction, userAddress, approvalTxHash } = req.body;

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

    // --- Approval Workflow ---
    const supportedSwapTokens = ['xBTC', 'xUSDC'];

    if (parsedTask.sourceToken && supportedSwapTokens.includes(parsedTask.sourceToken) && !approvalTxHash) {
      const tokenContracts = {
        xBTC: '0x07Ba1E656E45cF903b76383Fd7e3533fe06907E3',
        xUSDC: '0x7Cfc71BbB6A3CC3d79703C8ceD89e7837FdeFa8b',
      };

      return res.json({
        needsApproval: true,
        tokenToApprove: tokenContracts[parsedTask.sourceToken],
        amount: parsedTask.amount,
        spender: parsedTask.targetContract,
        originalInstruction: instruction,
      });
    }
    // --- End Approval Workflow ---

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
