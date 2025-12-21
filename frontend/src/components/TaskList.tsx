"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAddress, formatEther } from "@/lib/utils";
import { SubmitSolutionModal } from "./SubmitSolutionModal";
import { useState } from "react";

// Mock data - in production, fetch from contract events or subgraph
const MOCK_TASKS = [
  {
    taskId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    requester: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    reward: BigInt("1000000000000000000"), // 1 ETH
    publicInputHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    expectedOutputHash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    isActive: true,
    isCompleted: false,
  },
];

export function TaskList() {
  const { address } = useAccount();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // In production, fetch tasks from contract events or The Graph
  const tasks = MOCK_TASKS;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No tasks available. Create one to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.taskId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">AI Inference Task</CardTitle>
              <CardDescription>
                Task ID: {task.taskId.slice(0, 10)}...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Requester:</span>
                  <span className="text-sm font-mono">{formatAddress(task.requester)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reward:</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {formatEther(task.reward)} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span
                    className={`text-sm ${
                      task.isCompleted
                        ? "text-green-600"
                        : task.isActive
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {task.isCompleted ? "Completed" : task.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {task.isActive && !task.isCompleted && address && (
                <Button
                  onClick={() => setSelectedTask(task.taskId)}
                  className="w-full"
                  variant="default"
                >
                  Submit Solution
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedTask && (
        <SubmitSolutionModal
          taskId={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}

