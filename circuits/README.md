# Aura Marketplace - ZK Circuits

This directory contains Noir circuits for proving AI model inference computations.

## Circuit: model_inference

A 2-layer Multi-Layer Perceptron (MLP) that takes:
- **Private inputs**: Model weights, biases, and input data
- **Public inputs**: Public input hash (dataset URI), nullifier

The circuit outputs a hash that combines:
- Public input hash
- Nullifier
- Model output

## Building

```bash
cd circuits/model_inference
nargo build
```

## Proving

```bash
nargo prove
```

## Verifying

```bash
nargo verify
```

## Fixed-Point Arithmetic

The circuit uses Q16.16 fixed-point format:
- 16 bits for integer part
- 16 bits for fractional part
- Scale factor: 65536 (2^16)

To convert a float to fixed-point:
```rust
let fixed = (float_value * 65536.0) as u32
```

To convert fixed-point to float:
```rust
let float = fixed_value as f32 / 65536.0
```

