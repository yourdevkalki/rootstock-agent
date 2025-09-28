#!/usr/bin/env node

/**
 * Test script to query GRC-20 Task data
 * Run with: node test-queries.js
 */

const GRAPHQL_ENDPOINT = "https://hypergraph.xyz/api/graphql";

async function queryGraphQL(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Query error:", error);
    return null;
  }
}

async function getAllTasks() {
  console.log("🔍 Querying all tasks...");

  const query = `
    query GetAllTasks {
      Tasks {
        id
        taskId
        creator
        target
        action
        condition
        status
        createdAt
      }
    }
  `;

  const data = await queryGraphQL(query);

  if (data && data.Tasks) {
    console.log(`✅ Found ${data.Tasks.length} tasks:`);
    data.Tasks.forEach((task, index) => {
      console.log(`\n📋 Task ${index + 1}:`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Creator: ${task.creator}`);
      console.log(`   Target: ${task.target}`);
      console.log(`   Action: ${task.action}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${task.createdAt}`);
    });
  } else {
    console.log("❌ No tasks found or query failed");
  }
}

async function getTaskById(taskId) {
  console.log(`🔍 Querying task by ID: ${taskId}...`);

  const query = `
    query GetTaskById($taskId: String!) {
      Task(id: $taskId) {
        id
        taskId
        creator
        target
        action
        condition
        status
        createdAt
      }
    }
  `;

  const data = await queryGraphQL(query, { taskId });

  if (data && data.Task) {
    console.log("✅ Task found:");
    console.log(`   ID: ${data.Task.id}`);
    console.log(`   Task ID: ${data.Task.taskId}`);
    console.log(`   Creator: ${data.Task.creator}`);
    console.log(`   Target: ${data.Task.target}`);
    console.log(`   Action: ${data.Task.action}`);
    console.log(`   Status: ${data.Task.status}`);
    console.log(`   Created: ${data.Task.createdAt}`);
  } else {
    console.log("❌ Task not found or query failed");
  }
}

async function getTasksByCreator(creator) {
  console.log(`🔍 Querying tasks by creator: ${creator}...`);

  const query = `
    query GetTasksByCreator($creator: String!) {
      Tasks(where: { creator: $creator }) {
        id
        taskId
        creator
        target
        action
        condition
        status
        createdAt
      }
    }
  `;

  const data = await queryGraphQL(query, { creator });

  if (data && data.Tasks) {
    console.log(`✅ Found ${data.Tasks.length} tasks by creator ${creator}:`);
    data.Tasks.forEach((task, index) => {
      console.log(`\n📋 Task ${index + 1}:`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Target: ${task.target}`);
      console.log(`   Action: ${task.action}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${task.createdAt}`);
    });
  } else {
    console.log("❌ No tasks found for this creator or query failed");
  }
}

async function getActiveTasks() {
  console.log("🔍 Querying active tasks...");

  const query = `
    query GetActiveTasks {
      Tasks(where: { status: "active" }) {
        id
        taskId
        creator
        target
        action
        condition
        status
        createdAt
      }
    }
  `;

  const data = await queryGraphQL(query);

  if (data && data.Tasks) {
    console.log(`✅ Found ${data.Tasks.length} active tasks:`);
    data.Tasks.forEach((task, index) => {
      console.log(`\n📋 Active Task ${index + 1}:`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Creator: ${task.creator}`);
      console.log(`   Target: ${task.target}`);
      console.log(`   Action: ${task.action}`);
      console.log(`   Created: ${task.createdAt}`);
    });
  } else {
    console.log("❌ No active tasks found or query failed");
  }
}

async function main() {
  console.log("🚀 GRC-20 Task Query Test\n");

  // Test 1: Get all tasks
  await getAllTasks();

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Get specific task by ID (using one from your backfill)
  await getTaskById(
    "0x0000000000000000000000000000000000000000000000000000000000000018"
  );

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 3: Get tasks by creator
  await getTasksByCreator("0xa9a01d19b29F16811a9D5E160ad415a7C1E8A917");

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 4: Get active tasks only
  await getActiveTasks();

  console.log("\n🎉 Query tests completed!");
  console.log("\n📚 For more query examples, see query-examples.md");
  console.log(
    "🌐 Try the GraphQL playground at: https://hypergraph.xyz/api/graphql"
  );
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  queryGraphQL,
  getAllTasks,
  getTaskById,
  getTasksByCreator,
  getActiveTasks,
};
