"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubmitProof, useWaitForAttestation } from "@/hooks/useZkVerify";
import { useSubmitSolution } from "@/hooks/useMarketplace";
import { useTask } from "@/hooks/useMarketplace";
import { generateProof, generateNullifier, hashPublicInput } from "@/lib/proof-generation";
import { keccak256, toHex } from "viem";

interface SubmitSolutionModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "idle" | "generating" | "submitting" | "waiting" | "releasing" | "success" | "error";

export function SubmitSolutionModal({ taskId, isOpen, onClose }: SubmitSolutionModalProps) {
  const { address } = useAccount();
  const { task } = useTask(taskId);
  const { mutate: submitProof, data: attestation } = useSubmitProof();
  const { mutate: waitForAttestation, data: finalAttestation } = useWaitForAttestation();
  const { submitSolution, isPending: isSubmitting, isSuccess: isSubmitted } = useSubmitSolution();
  
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Mock model inputs - in production, load from file or user input
  const [modelInputs] = useState({
    input: [1.0, 2.0],
    layer1_weights: [
      [0.5, 0.3],
      [0.2, 0.8],
      [0.1, 0.9],
      [0.7, 0.4],
    ],
    layer1_biases: [0.1, 0.2, 0.3, 0.4],
    layer2_weights: [[0.5, 0.3, 0.2, 0.1]],
    layer2_bias: 0.1,
  });

  const handleSubmit = async () => {
    if (!address || !task) return;

    try {
      setStep("generating");
      setProgress(20);
      setError(null);

      // Step 1: Generate proof
      const publicInputHash = task.publicInputHash.slice(2); // Remove 0x
      const nullifier = generateNullifier(taskId, address);

      const proofResult = await generateProof({
        ...modelInputs,
        public_input_hash: publicInputHash,
        nullifier,
      });

      setProgress(40);

      // Step 2: Submit to zkVerify
      setStep("submitting");
      submitProof(
        {
          proof: proofResult.proof,
          publicInputs: proofResult.publicInputs,
          taskId,
          outputHash: proofResult.outputHash,
        },
        {
          onSuccess: (attestation) => {
            setProgress(60);
            setStep("waiting");

            // Step 3: Wait for attestation to be included in Merkle tree
            waitForAttestation(
              { attestationId: attestation.attestationId },
              {
                onSuccess: (finalAttestation) => {
                setProgress(80);
                setStep("releasing");

                // Step 4: Submit solution to contract
                submitSolution(
                  {
                    taskId,
                    attestationId: finalAttestation.attestationId,
                    outputHash: proofResult.outputHash,
                    nullifier: `0x${nullifier}`,
                    merkleProof: finalAttestation.merkleProof,
                  },
                  {
                    onSuccess: () => {
                      setProgress(100);
                      setStep("success");
                    },
                    onError: (err) => {
                      setError(err.message);
                      setStep("error");
                    },
                  }
                );
              },
              onError: (err) => {
                setError(err.message);
                setStep("error");
              },
            });
          },
          onError: (err) => {
            setError(err.message);
            setStep("error");
          },
        }
      );
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setStep("error");
    }
  };

  useEffect(() => {
    if (isSubmitted) {
      setStep("success");
      setProgress(100);
    }
  }, [isSubmitted]);

  const getStepLabel = () => {
    switch (step) {
      case "generating":
        return "Generating ZK Proof...";
      case "submitting":
        return "Submitting to zkVerify...";
      case "waiting":
        return "Waiting for Merkle inclusion...";
      case "releasing":
        return "Releasing payment...";
      case "success":
        return "Solution submitted successfully!";
      case "error":
        return "Error occurred";
      default:
        return "Ready to submit";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Solution</DialogTitle>
          <DialogDescription>
            Generate a ZK proof and submit your solution to claim the reward.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {task && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reward:</span>
                  <span className="font-semibold">{task.reward.toString()} wei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span>{task.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          )}

          {step !== "idle" && step !== "success" && step !== "error" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getStepLabel()}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {step === "success" && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                Your solution has been submitted and payment has been released!
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {step === "success" ? "Close" : "Cancel"}
          </Button>
          {step === "idle" && (
            <Button onClick={handleSubmit} disabled={!address || !task?.isActive}>
              Start Submission
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

