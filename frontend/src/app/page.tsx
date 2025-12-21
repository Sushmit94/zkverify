"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TaskList } from "@/components/TaskList";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { useState } from "react";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Aura Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Privacy-Preserving AI Marketplace with ZK Proofs
            </p>
          </div>
          <ConnectButton />
        </header>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Available Tasks</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Task
          </button>
        </div>

        <TaskList />

        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </main>
  );
}

