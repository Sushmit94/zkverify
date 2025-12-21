// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title EscrowMarketplace
 * @notice A marketplace where Requesters post AI tasks and Solvers submit solutions with ZK proofs.
 *         Payments are released only after zkVerify attestation is verified via Merkle proof.
 */
contract EscrowMarketplace is ReentrancyGuard, Ownable {
    using MerkleProof for bytes32[];

    // Task structure
    struct Task {
        address requester;
        uint256 reward;
        bytes32 publicInputHash; // Hash of the public input (e.g., dataset URI)
        bytes32 expectedOutputHash; // Expected hash of the AI model output
        bool isActive;
        bool isCompleted;
        address solver;
        bytes32 nullifier; // Prevents double-claiming
    }

    // zkVerify attestation structure
    struct Attestation {
        bytes32 attestationId; // Unique ID from zkVerify
        bytes32 taskId;
        bytes32 outputHash;
        bool isValid;
    }

    // Mapping from task ID to Task
    mapping(bytes32 => Task) public tasks;
    
    // Mapping from nullifier to bool (prevents double-claiming)
    mapping(bytes32 => bool) public usedNullifiers;
    
    // Mapping from attestation ID to Attestation
    mapping(bytes32 => Attestation) public attestations;
    
    // zkVerify Merkle root (updated periodically by zkVerify network)
    bytes32 public zkVerifyMerkleRoot;
    
    // Events
    event TaskCreated(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 reward,
        bytes32 publicInputHash,
        bytes32 expectedOutputHash
    );
    
    event SolutionSubmitted(
        bytes32 indexed taskId,
        address indexed solver,
        bytes32 attestationId,
        bytes32 nullifier
    );
    
    event PaymentReleased(
        bytes32 indexed taskId,
        address indexed solver,
        uint256 amount
    );
    
    event ZkVerifyRootUpdated(bytes32 newRoot);

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Create a new AI task
     * @param taskId Unique identifier for the task
     * @param publicInputHash Hash of the public input (dataset URI, etc.)
     * @param expectedOutputHash Expected hash of the model output
     */
    function createTask(
        bytes32 taskId,
        bytes32 publicInputHash,
        bytes32 expectedOutputHash
    ) external payable nonReentrant {
        require(msg.value > 0, "Reward must be greater than 0");
        require(tasks[taskId].requester == address(0), "Task already exists");
        require(!tasks[taskId].isActive, "Task already active");

        tasks[taskId] = Task({
            requester: msg.sender,
            reward: msg.value,
            publicInputHash: publicInputHash,
            expectedOutputHash: expectedOutputHash,
            isActive: true,
            isCompleted: false,
            solver: address(0),
            nullifier: bytes32(0)
        });

        emit TaskCreated(
            taskId,
            msg.sender,
            msg.value,
            publicInputHash,
            expectedOutputHash
        );
    }

    /**
     * @notice Submit a solution with zkVerify attestation Merkle proof
     * @param taskId The task ID
     * @param attestationId The zkVerify attestation ID
     * @param outputHash The hash of the AI model output
     * @param nullifier Unique nullifier to prevent double-claiming
     * @param merkleProof Merkle proof proving the attestation exists in zkVerify's Merkle tree
     */
    function submitSolution(
        bytes32 taskId,
        bytes32 attestationId,
        bytes32 outputHash,
        bytes32 nullifier,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        Task storage task = tasks[taskId];
        
        require(task.isActive, "Task is not active");
        require(!task.isCompleted, "Task already completed");
        require(!usedNullifiers[nullifier], "Nullifier already used");
        require(outputHash == task.expectedOutputHash, "Output hash mismatch");

        // Verify the attestation exists in zkVerify's Merkle tree
        bytes32 leaf = keccak256(abi.encodePacked(attestationId, taskId, outputHash, true));
        require(
            merkleProof.verifyCalldata(zkVerifyMerkleRoot, leaf),
            "Invalid Merkle proof"
        );

        // Mark nullifier as used
        usedNullifiers[nullifier] = true;

        // Update task
        task.isCompleted = true;
        task.solver = msg.sender;
        task.nullifier = nullifier;

        // Store attestation
        attestations[attestationId] = Attestation({
            attestationId: attestationId,
            taskId: taskId,
            outputHash: outputHash,
            isValid: true
        });

        emit SolutionSubmitted(taskId, msg.sender, attestationId, nullifier);

        // Release payment
        uint256 reward = task.reward;
        task.reward = 0; // Prevent reentrancy
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Payment transfer failed");

        emit PaymentReleased(taskId, msg.sender, reward);
    }

    /**
     * @notice Update the zkVerify Merkle root (called by owner/zkVerify oracle)
     * @param newRoot The new Merkle root from zkVerify network
     */
    function updateZkVerifyRoot(bytes32 newRoot) external onlyOwner {
        zkVerifyMerkleRoot = newRoot;
        emit ZkVerifyRootUpdated(newRoot);
    }

    /**
     * @notice Cancel a task and refund the requester
     * @param taskId The task ID to cancel
     */
    function cancelTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        
        require(task.requester == msg.sender, "Not the requester");
        require(task.isActive, "Task is not active");
        require(!task.isCompleted, "Task already completed");

        task.isActive = false;
        uint256 refund = task.reward;
        task.reward = 0;

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        require(success, "Refund transfer failed");
    }

    /**
     * @notice Get task details
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Check if a nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
}

