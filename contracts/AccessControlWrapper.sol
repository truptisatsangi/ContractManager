// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract AccessControlWrapper is AccessControl {
    /// @notice Emitted when an account is given a permission to a certain contract function
    /// @dev If contract address is 0x000..0 this means that the account is a default admin of this function and
    /// can call any contract function with this signature
    event PermissionGranted(
        address account,
        address contractAddress,
        string functionSig
    );

    /// @notice Emitted when an account is revoked a permission to a certain contract function
    event PermissionRevoked(
        address account,
        address contractAddress,
        string functionSig
    );

    constructor() {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Gives a function call permission to one single account
     * @dev this function can be called only from Role Admin or DEFAULT_ADMIN_ROLE
     * @param contractAddress address of contract for which call permissions will be granted
     * @dev if contractAddress is zero address, the account can access the specified function
     *      on **any** contract managed by this ACL
     * @param functionSig signature e.g. "functionName(uint256,bool)"
     * @param accountToPermit account that will be given access to the contract function
     * @custom:event Emits a {RoleGranted} and {PermissionGranted} events.
     */
    function giveCallPermission(
        address contractAddress,
        string calldata functionSig,
        address accountToPermit
    ) public {
        bytes32 role = keccak256(
            abi.encodePacked(contractAddress, functionSig)
        );
        grantRole(role, accountToPermit);
        emit PermissionGranted(accountToPermit, contractAddress, functionSig);
    }

    /**
     * @notice Revokes an account's permission to a particular function call
     * @dev this function can be called only from Role Admin or DEFAULT_ADMIN_ROLE
     * 		May emit a {RoleRevoked} event.
     * @param contractAddress address of contract for which call permissions will be revoked
     * @param functionSig signature e.g. "functionName(uint256,bool)"
     * @custom:event Emits {RoleRevoked} and {PermissionRevoked} events.
     */
    function revokeCallPermission(
        address contractAddress,
        string calldata functionSig,
        address accountToRevoke
    ) public {
        bytes32 role = keccak256(
            abi.encodePacked(contractAddress, functionSig)
        );
        revokeRole(role, accountToRevoke);
        emit PermissionRevoked(accountToRevoke, contractAddress, functionSig);
    }

    /**
     * @notice Verifies if the given account can call a contract's guarded function
     * @dev Since restricted contracts using this function as a permission hook
     * @param account for which call permissions will be checked
     * @param functionSig restricted function signature e.g. "functionName(uint256,bool)"
     * @return false if the user account cannot call the particular contract function
     */
    function isAllowedToCall(
        address contractAddress,
        address account,
        string memory functionSig
    ) public view returns (bool) {
        bytes32 role = keccak256(abi.encodePacked(contractAddress, functionSig));

        if (hasRole(role, account)) {
            return true;
        } else {
            role = keccak256(abi.encodePacked(address(0), functionSig));
            return hasRole(role, account);
        }
    }
}
