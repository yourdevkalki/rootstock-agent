import "dotenv/config";

const BASE_URL = process.env.API_URL || "http://localhost:3000";

class NaturalLanguageTaskTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  async testParseInstruction(instruction) {
    console.log(`\n📝 Testing instruction parsing: "${instruction}"`);

    try {
      const result = await this.makeRequest("/natural-language/parse", {
        method: "POST",
        body: JSON.stringify({ instruction }),
      });

      if (result.status === 200) {
        console.log("✅ Successfully parsed instruction");
        console.log(`   Task Type: ${result.data.parsedTask.taskType}`);
        console.log(`   Description: ${result.data.parsedTask.description}`);
        console.log(`   Confidence: ${result.data.parsedTask.confidence}%`);
        console.log(
          `   Target Contract: ${result.data.parsedTask.targetContract}`
        );
        console.log(`   Function: ${result.data.parsedTask.functionSignature}`);

        if (result.data.parsedTask.warnings?.length > 0) {
          console.log(
            `   ⚠️  Warnings: ${result.data.parsedTask.warnings.join(", ")}`
          );
        }
      } else {
        console.log(`❌ Failed to parse: ${result.data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  async testCreateTask(
    instruction,
    userAddress = "0x1234567890abcdef1234567890abcdef12345678"
  ) {
    console.log(`\n🚀 Testing task creation: "${instruction}"`);

    try {
      const result = await this.makeRequest("/natural-language/create-task", {
        method: "POST",
        body: JSON.stringify({ instruction, userAddress }),
      });

      if (result.status === 200) {
        console.log("✅ Successfully created task");
        console.log(`   Task ID: ${result.data.taskId}`);
        console.log(`   Transaction Hash: ${result.data.transactionHash}`);
        console.log(`   Description: ${result.data.parsedTask.description}`);
        console.log(`   Confidence: ${result.data.parsedTask.confidence}%`);

        if (result.data.parsedTask.warnings?.length > 0) {
          console.log(
            `   ⚠️  Warnings: ${result.data.parsedTask.warnings.join(", ")}`
          );
        }

        return result.data.taskId;
      } else {
        console.log(`❌ Failed to create task: ${result.data.error}`);
        if (result.data.suggestion) {
          console.log(`   💡 Suggestion: ${result.data.suggestion}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    return null;
  }

  async testGetTask(taskId) {
    console.log(`\n🔍 Testing get task: ${taskId}`);

    try {
      const result = await this.makeRequest(`/natural-language/task/${taskId}`);

      if (result.status === 200) {
        console.log("✅ Successfully retrieved task");
        console.log(
          `   Original Instruction: ${result.data.task.originalInstruction}`
        );
        console.log(`   Created At: ${result.data.task.createdAt}`);
        console.log(`   User Address: ${result.data.task.userAddress}`);
      } else {
        console.log(`❌ Failed to get task: ${result.data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  async testListTasks() {
    console.log(`\n📋 Testing list all natural language tasks`);

    try {
      const result = await this.makeRequest("/natural-language/tasks");

      if (result.status === 200) {
        console.log(
          `✅ Successfully retrieved tasks (${result.data.totalCount} found)`
        );
        result.data.tasks.forEach((task, index) => {
          console.log(
            `   ${index + 1}. "${task.originalInstruction}" (Task ID: ${
              task.taskId
            })`
          );
        });
      } else {
        console.log(`❌ Failed to list tasks: ${result.data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log("🧪 Natural Language Task Creation Tests");
    console.log("=====================================");

    // Test different types of instructions
    const testInstructions = [
      // Price-based tasks
      "Swap 1 BTC to USDC when BTC price reaches $120,000",
      "Sell all my USDC if BTC drops below $100,000",
      "Remove my ETH from Aave lending if the interest rate drops below 2.5%",

      // Time-based tasks
      "Withdraw my earnings from the liquidity pool every week",
      "Rebalance my portfolio every 24 hours",

      // Edge cases
      "Buy Bitcoin when it's cheap",
      "Do something with my tokens",
    ];

    // Test parsing first
    console.log("\n🔍 PARSING TESTS");
    console.log("=================");

    for (const instruction of testInstructions) {
      await this.testParseInstruction(instruction);
    }

    // Test task creation with a few good examples
    console.log("\n\n🚀 TASK CREATION TESTS");
    console.log("=======================");

    const creationTests = [
      "Swap 1 BTC to USDC when BTC price reaches $120,000",
      "Sell 0.5 USDC if BTC drops below $100,000",
      "Execute a swap every 3600 seconds",
    ];

    const createdTaskIds = [];

    for (const instruction of creationTests) {
      const taskId = await this.testCreateTask(instruction);
      if (taskId) {
        createdTaskIds.push(taskId);
      }
    }

    // Test retrieval
    if (createdTaskIds.length > 0) {
      console.log("\n\n🔍 TASK RETRIEVAL TESTS");
      console.log("========================");

      await this.testGetTask(createdTaskIds[0]);
      await this.testListTasks();
    }

    // Test error cases
    console.log("\n\n❌ ERROR HANDLING TESTS");
    console.log("========================");

    await this.testCreateTask("", "0x123"); // Empty instruction
    await this.testCreateTask("Valid instruction"); // Missing user address
    await this.testGetTask("nonexistent"); // Non-existent task

    console.log("\n\n🎉 Testing completed!");
    console.log("\nAvailable endpoints:");
    console.log("- POST /natural-language/create-task");
    console.log("- POST /natural-language/parse");
    console.log("- GET /natural-language/task/:taskId");
    console.log("- GET /natural-language/tasks");
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new NaturalLanguageTaskTester(BASE_URL);
  tester.runAllTests().catch(console.error);
}

export default NaturalLanguageTaskTester;
