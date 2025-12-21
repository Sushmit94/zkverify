// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZkVerify
 * @notice Interface for zkVerify attestation verification
 */
interface IZkVerify {
    /**
     * @notice Get the current Merkle root of attestations
     * @return The Merkle root
     */
    function getMerkleRoot() external view returns (bytes32);
    
    /**
     * @notice Verify an attestation exists in the Merkle tree
     * @param attestationId The attestation ID
     * @param proof The Merkle proof
     * @return Whether the attestation is valid
     */
    function verifyAttestation(
        bytes32 attestationId,
        bytes32[] calldata proof
    ) external view returns (bool);
}

