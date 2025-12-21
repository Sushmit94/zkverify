/**
 * Custom hook for zkVerify integration
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { getZkVerifyService, ZkVerifyAttestation, SubmitProofParams } from "@/lib/zkverify";
import { useAccount } from "wagmi";
import { keccak256, toHex } from "viem";

export interface UseSubmitProofParams {
  proof: string;
  publicInputs: string[];
  taskId: string;
  outputHash: string;
}

/**
 * Hook to submit a proof to zkVerify
 */
export function useSubmitProof() {
  const { address } = useAccount();
  const zkVerify = getZkVerifyService();

  return useMutation({
    mutationFn: async (params: UseSubmitProofParams) => {
      if (!address) throw new Error("Wallet not connected");

      // Generate nullifier from task ID and solver address
      const nullifier = keccak256(
        toHex(`${params.taskId}-${address}`)
      ).slice(2);

      const submitParams: SubmitProofParams = {
        proof: params.proof,
        publicInputs: params.publicInputs,
        taskId: params.taskId,
        outputHash: params.outputHash,
        nullifier,
      };

      return await zkVerify.submitProof(submitParams);
    },
  });
}

/**
 * Hook to get attestation by ID
 */
export function useAttestation(attestationId: string | null) {
  const zkVerify = getZkVerifyService();

  return useQuery({
    queryKey: ["attestation", attestationId],
    queryFn: () => zkVerify.getAttestation(attestationId!),
    enabled: !!attestationId,
  });
}

/**
 * Hook to get the current Merkle root
 */
export function useMerkleRoot() {
  const zkVerify = getZkVerifyService();

  return useQuery({
    queryKey: ["merkleRoot"],
    queryFn: () => zkVerify.getMerkleRoot(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to wait for attestation to be included in Merkle tree
 */
export function useWaitForAttestation() {
  const zkVerify = getZkVerifyService();

  return useMutation({
    mutationFn: async ({
      attestationId,
      maxWaitTime = 60000,
      pollInterval = 2000,
    }: {
      attestationId: string;
      maxWaitTime?: number;
      pollInterval?: number;
    }) => {
      return await zkVerify.waitForAttestation(attestationId, maxWaitTime, pollInterval);
    },
  });
}

