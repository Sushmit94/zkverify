use dep::std;

// Fixed-point arithmetic constants
// Using Q16.16 format (16 bits integer, 16 bits fractional)
const SCALE: u32 = 65536; // 2^16
const SCALE_SHIFT: u32 = 16;

// Simple 2-layer MLP (Multi-Layer Perceptron)
// Input: 2 features
// Hidden layer: 4 neurons
// Output: 1 value

// Model weights (private)
// Layer 1: 2 inputs -> 4 hidden neurons (weights: 2x4, biases: 4)
// Layer 2: 4 inputs -> 1 output (weights: 4x1, bias: 1)

// Fixed-point multiplication helper
fn fixed_mul(a: u32, b: u32) -> u32 {
    let result = (a as u64 * b as u64) >> SCALE_SHIFT;
    result as u32
}

// Fixed-point addition
fn fixed_add(a: u32, b: u32) -> u32 {
    a + b
}

// ReLU activation function (fixed-point)
fn relu(x: u32) -> u32 {
    if x > 0 {
        x
    } else {
        0
    }
}

// Sigmoid activation function (fixed-point approximation)
fn sigmoid(x: u32) -> u32 {
    // Simple approximation: sigmoid(x) ≈ x / (1 + |x|) scaled
    // For simplicity, we'll use a bounded sigmoid
    let abs_x = if x > 0x80000000 { (0xFFFFFFFF - x) + 1 } else { x };
    let denominator = SCALE + (abs_x >> 1);
    let numerator = x;
    fixed_mul(numerator, SCALE) / (denominator >> SCALE_SHIFT)
}

// Forward pass through the neural network
fn forward(
    input: [u32; 2],
    layer1_weights: [[u32; 2]; 4],  // 4 neurons, 2 inputs each
    layer1_biases: [u32; 4],
    layer2_weights: [[u32; 4]; 1],  // 1 neuron, 4 inputs
    layer2_bias: u32
) -> u32 {
    // Layer 1: 2 inputs -> 4 hidden neurons
    let mut hidden: [u32; 4] = [0; 4];
    
    for i in 0..4 {
        let mut sum = layer1_biases[i];
        for j in 0..2 {
            sum = fixed_add(sum, fixed_mul(layer1_weights[i][j], input[j]));
        }
        hidden[i] = relu(sum);
    }
    
    // Layer 2: 4 inputs -> 1 output
    let mut output = layer2_bias;
    for i in 0..4 {
        output = fixed_add(output, fixed_mul(layer2_weights[0][i], hidden[i]));
    }
    
    sigmoid(output)
}

fn main(
    // Private inputs
    input: [u32; 2],
    layer1_weights: [[u32; 2]; 4],
    layer1_biases: [u32; 4],
    layer2_weights: [[u32; 4]; 1],
    layer2_bias: u32,
    // Public inputs
    public_input_hash: [u8; 32],  // Hash of the public input (dataset URI)
    nullifier: [u8; 32],           // Unique nullifier to prevent double-claiming
) -> pub [u8; 32] {
    // Compute the forward pass
    let output = forward(
        input,
        layer1_weights,
        layer1_biases,
        layer2_weights,
        layer2_bias
    );
    
    // Convert output to bytes and hash it
    let output_bytes: [u8; 4] = [
        (output >> 24) as u8,
        (output >> 16) as u8,
        (output >> 8) as u8,
        output as u8,
    ];
    
    // Combine public_input_hash, nullifier, and output for final hash
    let mut combined: [u8; 68] = [0; 68];
    for i in 0..32 {
        combined[i] = public_input_hash[i];
    }
    for i in 0..32 {
        combined[32 + i] = nullifier[i];
    }
    for i in 0..4 {
        combined[64 + i] = output_bytes[i];
    }
    
    // Return hash of the combined data
    std::hash::pedersen_hash(combined)
}

