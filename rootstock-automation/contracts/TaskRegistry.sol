// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract TaskRegistry {
    enum ResolverType {
        Time,
        Price
    }

    struct Task {
        address creator;
        address targetContract;
        bytes callData;
        ResolverType resolverType;
        bytes resolverData; // ABI-encoded resolver-specific data (e.g., interval or price params)
        uint256 lastRun;
        bool active;
    }

    Task[] public tasks;

    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        address indexed targetContract,
        ResolverType resolverType,
        bytes resolverData
    );
    event TaskExecuted(uint256 indexed taskId, address indexed executor, bool success, bytes returnData);
    event TaskCancelled(uint256 indexed taskId);

    function createTask(
        address _targetContract,
        bytes calldata _callData,
        ResolverType _resolverType,
        bytes calldata _resolverData
    ) external returns (uint256) {
        tasks.push(
            Task({
                creator: msg.sender,
                targetContract: _targetContract,
                callData: _callData,
                resolverType: _resolverType,
                resolverData: _resolverData,
                lastRun: block.timestamp,
                active: true
            })
        );

        uint256 taskId = tasks.length - 1;
        emit TaskCreated(taskId, msg.sender, _targetContract, _resolverType, _resolverData);
        return taskId;
    }

    function executeTask(uint256 _taskId) external returns (bool success, bytes memory returnData) {
        require(_taskId < tasks.length, "Invalid task");
        Task storage task = tasks[_taskId];
        require(task.active, "Task inactive");

        (success, returnData) = task.targetContract.call(task.callData);
        task.lastRun = block.timestamp;

        emit TaskExecuted(_taskId, msg.sender, success, returnData);
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

    function getTask(uint256 _taskId)
        external
        view
        returns (
            address creator,
            address targetContract,
            bytes memory callData,
            ResolverType resolverType,
            bytes memory resolverData,
            uint256 lastRun,
            bool active
        )
    {
        Task storage task = tasks[_taskId];
        return (
            task.creator,
            task.targetContract,
            task.callData,
            task.resolverType,
            task.resolverData,
            task.lastRun,
            task.active
        );
    }
}
