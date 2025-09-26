// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract TaskRegistry {
    struct Task {
        address creator;
        address targetContract;
        bytes callData;
        uint256 interval;
        uint256 lastRun;
        bool active;
    }

    Task[] public tasks;

    event TaskCreated(uint256 indexed taskId, address indexed creator, address targetContract);
    event TaskExecuted(uint256 indexed taskId, bool success);
    event TaskCancelled(uint256 indexed taskId);

    function createTask(address _targetContract, bytes calldata _callData, uint256 _interval) external returns (uint256) {
        tasks.push(Task({
            creator: msg.sender,
            targetContract: _targetContract,
            callData: _callData,
            interval: _interval,
            lastRun: block.timestamp,
            active: true
        }));

        uint256 taskId = tasks.length - 1;
        emit TaskCreated(taskId, msg.sender, _targetContract);
        return taskId;
    }

    function markExecuted(uint256 _taskId) external {
        require(_taskId < tasks.length, "Invalid task");
        Task storage task = tasks[_taskId];
        require(task.active, "Task inactive");

        task.lastRun = block.timestamp;
        emit TaskExecuted(_taskId, true);
    }

    function cancelTask(uint256 _taskId) external {
        require(_taskId < tasks.length, "Invalid task");
        Task storage task = tasks[_taskId];
        require(msg.sender == task.creator, "Not task creator");

        task.active = false;
        emit TaskCancelled(_taskId);
    }

    function getTaskCount() external view returns (uint256) {
        return tasks.length;
    }

    function getTask(uint256 _taskId) external view returns (
        address creator,
        address targetContract,
        bytes memory callData,
        uint256 interval,
        uint256 lastRun,
        bool active
    ) {
        Task storage task = tasks[_taskId];
        return (task.creator, task.targetContract, task.callData, task.interval, task.lastRun, task.active);
    }
}
