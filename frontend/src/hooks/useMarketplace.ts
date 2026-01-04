/**
 * Custom hook for interacting with the Marketplace contract
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MARKETPLACE_ABI, getMarketplaceAddress } from "@/lib/contracts";
import { Address, keccak256, toHex, encodePacked } from "viem";

export interface Task {
  requester: Address;
  reward: bigint;
  publicInputHash: string;
  expectedOutputHash: string;
  isActive: boolean;
  isCompleted: boolean;
  solver: Address;
  nullifier: string;
}

export interface CreateTaskParams {
  taskId: string;
  publicInputHash: string;
  expectedOutputHash: string;
  reward: string; // In ETH
}

export interface SubmitSolutionParams {
  taskId: string;
  attestationId: string;
  outputHash: string;
  nullifier: string;
  merkleProof: string[];
}

/**
 * Hook to get a task by ID
 */
export function useTask(taskId: string | null) {
  const { data, isLoading, error } = useReadContract({
    address: getMarketplaceAddress(),
    abi: MARKETPLACE_ABI,
    functionName: "getTask",
    args: taskId ? [taskId as `0x${string}`] : undefined,
    query: {
      enabled: !!taskId,
    },
  });

  return {
    task: data
      ? {
          requester: data.requester,
          reward: data.reward,
          publicInputHash: data.publicInputHash,
          expectedOutputHash: data.expectedOutputHash,
          isActive: data.isActive,
          isCompleted: data.isCompleted,
          solver: data.solver,
          nullifier: data.nullifier,
        }
      : null,
    isLoading,
    error,
  };
}

/**
 * Hook to get the zkVerify Merkle root
 */
export function useZkVerifyMerkleRoot() {
  const { data, isLoading, error } = useReadContract({
    address: getMarketplaceAddress(),
    abi: MARKETPLACE_ABI,
    functionName: "zkVerifyMerkleRoot",
  });

  return {
    merkleRoot: data,
    isLoading,
    error,
  };
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createTask = async (params: CreateTaskParams) => {
    const taskIdBytes = keccak256(toHex(params.taskId));
    const publicInputHash = params.publicInputHash as `0x${string}`;
    const expectedOutputHash = params.expectedOutputHash as `0x${string}`;
    const reward = parseEther(params.reward);

    writeContract({
      address: getMarketplaceAddress(),
      abi: MARKETPLACE_ABI,
      functionName: "createTask",
      args: [taskIdBytes, publicInputHash, expectedOutputHash],
      value: reward,
    });
  };

  return {
    createTask,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to submit a solution
 */
/**
 * Hook to submit a solution
 */
export function useSubmitSolution() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Add an 'options' parameter here
  const submitSolution = async (
    params: SubmitSolutionParams, 
    options?: { onSuccess?: () => void; onError?: (err: any) => void }
  ) => {
    const taskIdBytes = params.taskId as `0x${string}`;
    const attestationIdBytes = params.attestationId as `0x${string}`;
    const outputHashBytes = params.outputHash as `0x${string}`;
    const nullifierBytes = params.nullifier as `0x${string}`;
    const merkleProof = params.merkleProof as `0x${string}`[];

    writeContract({
      address: getMarketplaceAddress(),
      abi: MARKETPLACE_ABI,
      functionName: "submitSolution",
      args: [
        taskIdBytes,
        attestationIdBytes,
        outputHashBytes,
        nullifierBytes,
        merkleProof,
      ],
    }, {
      // Pass the callbacks into writeContract so they actually fire
      onSuccess: () => {
        if (options?.onSuccess) options.onSuccess();
      },
      onError: (err) => {
        if (options?.onError) options.onError(err);
      }
    });
  };

  return {
    submitSolution,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}
/**
 * Hook to cancel a task
 */
export function useCancelTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelTask = async (taskId: string) => {
    const taskIdBytes = taskId as `0x${string}`;
    writeContract({
      address: getMarketplaceAddress(),
      abi: MARKETPLACE_ABI,
      functionName: "cancelTask",
      args: [taskIdBytes],
    });
  };

  return {
    cancelTask,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

