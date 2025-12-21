"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/hooks/useMarketplace";
import { hashPublicInput } from "@/lib/proof-generation";
import { keccak256, toHex } from "viem";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { address } = useAccount();
  const { createTask, isPending, isSuccess } = useCreateTask();
  const [formData, setFormData] = useState({
    taskName: "",
    datasetUri: "",
    expectedOutputHash: "",
    reward: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    try {
      // Hash the dataset URI
      const publicInputHash = await hashPublicInput(formData.datasetUri);
      
      // Generate task ID from task name and requester
      const taskId = keccak256(toHex(`${formData.taskName}-${address}-${Date.now()}`));

      await createTask({
        taskId: taskId.slice(2), // Remove 0x prefix
        publicInputHash: `0x${publicInputHash}`,
        expectedOutputHash: formData.expectedOutputHash.startsWith("0x")
          ? formData.expectedOutputHash
          : `0x${formData.expectedOutputHash}`,
        reward: formData.reward,
      });

      if (isSuccess) {
        setFormData({
          taskName: "",
          datasetUri: "",
          expectedOutputHash: "",
          reward: "",
        });
        onClose();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Post an AI inference task. Solvers will submit solutions with ZK proofs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Task Name</label>
            <input
              type="text"
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dataset URI</label>
            <input
              type="text"
              value={formData.datasetUri}
              onChange={(e) => setFormData({ ...formData, datasetUri: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="ipfs://... or https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Output Hash</label>
            <input
              type="text"
              value={formData.expectedOutputHash}
              onChange={(e) => setFormData({ ...formData, expectedOutputHash: e.target.value })}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="0x..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reward (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !address}>
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

