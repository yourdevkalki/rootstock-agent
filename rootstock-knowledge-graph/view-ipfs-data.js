#!/usr/bin/env node

/**
 * IPFS Data Viewer for GRC-20 Tasks
 * This script demonstrates how to access your published task data directly from IPFS
 */

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

// CIDs from your recent backfill
const PUBLISHED_TASKS = [
  {
    taskId:
      "0x0000000000000000000000000000000000000000000000000000000000000018",
    cid: "bafkreigpgjlc5wtxhq2qnsjarnmxvysuielvm472yxoj35v2ixfao6u5um",
    editId: "acc10adb-afa8-4e50-ba59-0e7f2847e730",
  },
  {
    taskId:
      "0x0000000000000000000000000000000000000000000000000000000000000019",
    cid: "bafkreibfw6ve3sxnxpghi23uwmxlh2arg3bkaeheau2vhwuxka5hg3bzsu",
    editId: "c2bbee46-6778-419e-adaf-916c261f815f",
  },
];

async function fetchIPFSData(cid) {
  try {
    const url = `${IPFS_GATEWAY}${cid}`;
    console.log(`🔗 Fetching from IPFS: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching IPFS data for CID ${cid}:`, error.message);
    return null;
  }
}

async function displayTaskData(task) {
  console.log(`\n📋 Task ${task.taskId}`);
  console.log(`🔗 IPFS CID: ${task.cid}`);
  console.log(`📄 Edit ID: ${task.editId}`);
  console.log(`🌐 Direct IPFS URL: ${IPFS_GATEWAY}${task.cid}`);

  const data = await fetchIPFSData(task.cid);

  if (data) {
    console.log("✅ Task data retrieved from IPFS:");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("❌ Failed to retrieve task data");
  }
}

async function displayAllTasks() {
  console.log("🚀 GRC-20 Task Data Viewer\n");
  console.log("📊 Published Tasks from Your Indexer:");

  for (const task of PUBLISHED_TASKS) {
    await displayTaskData(task);
    console.log("\n" + "=".repeat(60) + "\n");
  }

  console.log("🎉 Data viewing completed!");
  console.log("\n📚 Next Steps:");
  console.log("1. Visit https://www.geobrowser.io/ to explore the Geo Browser");
  console.log("2. Create a space in the Hypergraph to organize your tasks");
  console.log("3. Use the space-specific GraphQL API to query your data");
  console.log("4. Integrate IPFS data access into your applications");
}

async function testIPFSAccess() {
  console.log("🧪 Testing IPFS Access...\n");

  // Test with a known IPFS hash
  const testCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // IPFS hello world
  console.log(`Testing with IPFS hello world: ${testCid}`);

  const data = await fetchIPFSData(testCid);
  if (data) {
    console.log("✅ IPFS access working!");
    console.log("Data:", data);
  } else {
    console.log("❌ IPFS access not working");
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--test")) {
    await testIPFSAccess();
  } else {
    await displayAllTasks();
  }
}

// Run the viewer
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchIPFSData,
  displayTaskData,
  displayAllTasks,
  PUBLISHED_TASKS,
};
