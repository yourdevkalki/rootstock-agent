import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("TaskRegistry", function () {
  it("creates and executes a time task calling DummyTarget.poke", async function () {
    const [deployer] = await ethers.getSigners();

    const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
    const registry = await TaskRegistry.deploy();
    await registry.waitForDeployment();

    const DummyTarget = await ethers.getContractFactory("DummyTarget");
    const dummy = await DummyTarget.deploy();
    await dummy.waitForDeployment();

    const iface = new ethers.Interface(["function poke()"]);
    const callData = iface.encodeFunctionData("poke", []);

    const resolverData = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
    const tx = await registry.createTask(await dummy.getAddress(), callData, 0, resolverData);
    await tx.wait();

    const before = await dummy.pokeCount();
    const ex = await registry.executeTask(0);
    await ex.wait();
    const after = await dummy.pokeCount();

    expect(after - before).to.equal(1n);
  });
});


