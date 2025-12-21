# Model Server

Local AI inference wrapper for Aura Marketplace. Provides a REST API for running model inference before generating ZK proofs.

## Usage

```bash
npm install
npm run dev
```

## API Endpoints

### POST /inference
Run model inference on input data.

**Request:**
```json
{
  "input": [1.0, 2.0],
  "weights": {
    "layer1_weights": [[0.5, 0.3], [0.2, 0.8], [0.1, 0.9], [0.7, 0.4]],
    "layer1_biases": [0.1, 0.2, 0.3, 0.4],
    "layer2_weights": [[0.5, 0.3, 0.2, 0.1]],
    "layer2_bias": 0.1
  }
}
```

**Response:**
```json
{
  "input": [1.0, 2.0],
  "output": 0.85,
  "outputHash": "hex_string"
}
```

### GET /health
Health check endpoint.

