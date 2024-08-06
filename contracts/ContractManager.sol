// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./AccessControlWrapper.sol";

/**
 * @title ContractManager
 * @dev Manages a set of contract addresses with associated descriptions.
 *      Includes functionality for adding, updating, and removing addresses.
 */
contract ContractManager is AccessControl, Initializable, AccessControlWrapper {

    /// @notice Mapping from contract address to its description.
    mapping(address => string) public addDescription;

    /// @notice Emitted when a new address is added.
    /// @param newAddress The address that was added.
    event AddAddress(address newAddress);

    /// @notice Emitted when an existing address's description is updated.
    /// @param existingAddress The address whose description was updated.
    event UpdateDescription(address existingAddress);

    /// @notice Emitted when an existing address is removed.
    /// @param existingAddress The address that was removed.
    event RemoveAddress(address existingAddress);

    /// @notice Error indicating that an address does not exist.
    /// @param add The address that does not exist.
    error AddressNotExist(address add);
        
    /// @notice Error indicating that the caller is not authorized to perform an action.
    error Unauthorized(); 

    /**
     * @notice Adds a new address with its description.
     * @dev Reverts if the address is zero or already exists.
     * @param newAddress The address to be added.
     * @param description The description of the address.
     */
    function addAddresses(address newAddress, string calldata description) external {
        _checkAccessAllowed("addAddresses(address,string)");

        require(newAddress != address(0), "zero address not allowed");
        require(bytes(addDescription[newAddress]).length == 0, "Address already exists");

        addDescription[newAddress] = description;
        emit AddAddress(newAddress);
    }

    /**
     * @notice Updates the description of an existing address.
     * @dev Reverts if the address does not exist.
     * @param existingAddress The address whose description is to be updated.
     * @param description The new description of the address.
     */
    function updateDescription(address existingAddress, string calldata description) external {
        _checkAccessAllowed("updateDescription(address,string)");

        if (bytes(addDescription[existingAddress]).length == 0) {
            revert AddressNotExist(existingAddress);
        }
        addDescription[existingAddress] = description;
        emit UpdateDescription(existingAddress);
    }

    /**
     * @notice Removes an existing address and its description.
     * @dev Reverts if the address does not exist.
     * @param existingAddress The address to be removed.
     */
    function removeAddress(address existingAddress) external {
        _checkAccessAllowed("removeAddress(address)");

        if (bytes(addDescription[existingAddress]).length == 0) {
            revert AddressNotExist(existingAddress);
        } 
        delete addDescription[existingAddress];
        emit RemoveAddress(existingAddress);
    }

    /**
     * @dev Checks if the caller is allowed to call a specific function. Reverts with an Unauthorized error if the caller is not allowed.
     * @param signature The function signature to check.
     */
    function _checkAccessAllowed(string memory signature) internal view {
        bool isAllowed = isAllowedToCall(msg.sender, signature);

        if (!isAllowed) {
            revert Unauthorized();
        }
    }
}
