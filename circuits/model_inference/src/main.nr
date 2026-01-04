use dep::std;

// In Noir v0.10.0, global constants must be declared inside the function 
// or as 'static' if supported, but usually, putting them inside the 
// logic or as function arguments is the safest way to avoid 'Expected item' errors.

// Fixed-point multiplication helper
fn fixed_mul(a: u32, b: u32) -> u32 {
    let scale_shift: u32 = 16;
    // Cast scale_shift to u64 to match the LHS bit width
    let result = (a as u64 * b as u64) >> (scale_shift as u64);
    result as u32
}

// ReLU activation function
fn relu(x: u32) -> u32 {
    if x < 0x80000000 { x } else { 0 }
}

// Sigmoid approximation: sigmoid(x) approx x / (1 + |x|)
fn sigmoid(x: u32) -> u32 {
    let scale: u32 = 65536;
    let scale_shift: u32 = 16;
    
    let abs_x = if x > 0x80000000 { (0xFFFFFFFF - x) + 1 } else { x };
    let denominator = scale + (abs_x >> 1);
    let numerator = x;
    
    fixed_mul(numerator, scale) / (denominator >> scale_shift)
}

fn forward(
    input: [u32; 2],
    layer1_weights: [[u32; 2]; 4],
    layer1_biases: [u32; 4],
    layer2_weights: [[u32; 4]; 1],
    layer2_bias: u32
) -> u32 {
    let mut hidden: [u32; 4] = [0; 4];
    
    for i in 0..4 {
        let mut sum = layer1_biases[i];
        for j in 0..2 {
            // sum = sum + (weight * input)
            sum = sum + fixed_mul(layer1_weights[i][j], input[j]);
        }
        hidden[i] = relu(sum);
    }
    
    let mut output = layer2_bias;
    for i in 0..4 {
        output = output + fixed_mul(layer2_weights[0][i], hidden[i]);
    }
    
    sigmoid(output)
}

fn main(
    input: [u32; 2],
    layer1_weights: [[u32; 2]; 4],
    layer1_biases: [u32; 4],
    layer2_weights: [[u32; 4]; 1],
    layer2_bias: u32,
    public_input_hash: [Field; 2], // Pedersen in v0.10.0 prefers Fields
    nullifier: Field
) -> pub Field {
    
    let output = forward(input, layer1_weights, layer1_biases, layer2_weights, layer2_bias);
    
    // Convert output to Field for hashing
    let output_field = output as Field;
    
    // Combined hash of [hash_part1, hash_part2, nullifier, output]
    // std::hash::pedersen_hash returns a Field
    let result_hash = std::hash::pedersen_hash([
        public_input_hash[0], 
        public_input_hash[1], 
        nullifier, 
        output_field
    ]);

    result_hash
}