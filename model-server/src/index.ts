/**
 * Model Server - Local AI Inference Wrapper
 * 
 * This server provides a REST API for running AI model inference locally.
 * It can be used by Solvers to generate model outputs before creating ZK proofs.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * Simple 2-layer MLP inference (matches the Noir circuit)
 * 
 * In production, this would load actual model weights from a file
 * or use a proper ML framework like TensorFlow.js or ONNX Runtime
 */
function runInference(input: number[], weights: any): number {
  // Layer 1: 2 inputs -> 4 hidden neurons
  const hidden: number[] = [];
  for (let i = 0; i < 4; i++) {
    let sum = weights.layer1_biases[i];
    for (let j = 0; j < 2; j++) {
      sum += weights.layer1_weights[i][j] * input[j];
    }
    hidden.push(Math.max(0, sum)); // ReLU
  }

  // Layer 2: 4 inputs -> 1 output
  let output = weights.layer2_bias;
  for (let i = 0; i < 4; i++) {
    output += weights.layer2_weights[0][i] * hidden[i];
  }

  // Sigmoid approximation
  return 1 / (1 + Math.exp(-output));
}

/**
 * POST /inference
 * Run model inference on input data
 */
app.post("/inference", async (req, res) => {
  try {
    const { input, weights } = req.body;

    if (!input || !Array.isArray(input) || input.length !== 2) {
      return res.status(400).json({ error: "Invalid input: expected array of 2 numbers" });
    }

    if (!weights) {
      return res.status(400).json({ error: "Weights are required" });
    }

    // Default weights if not provided (should match circuit)
    const defaultWeights = {
      layer1_weights: [
        [0.5, 0.3],
        [0.2, 0.8],
        [0.1, 0.9],
        [0.7, 0.4],
      ],
      layer1_biases: [0.1, 0.2, 0.3, 0.4],
      layer2_weights: [[0.5, 0.3, 0.2, 0.1]],
      layer2_bias: 0.1,
    };

    const modelWeights = weights || defaultWeights;
    const output = runInference(input, modelWeights);

    res.json({
      input,
      output,
      outputHash: Buffer.from(output.toString()).toString("hex"), // Simplified hash
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Model server running on http://localhost:${PORT}`);
});

