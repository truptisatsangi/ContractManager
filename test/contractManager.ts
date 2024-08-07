import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ContractManager, ContractManager__factory } from "../typechain-types";

const { expect } = require("chai");
const { ethers } = require("hardhat");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("ContractManager", function () {
  let ContractManager: ContractManager__factory;
  let contractManager: ContractManager;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let contractAddress: string;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    ContractManager = await ethers.getContractFactory("ContractManager", {});

    contractManager = await ContractManager.deploy();

    contractAddress = await contractManager.getAddress();

    contractManager.giveCallPermission(
      contractAddress,
      "addAddresses(address,string)",
      owner.address,
    );
    contractManager.giveCallPermission(
      contractAddress,
      "updateDescription(address,string)",
      owner.address,
    );
    contractManager.giveCallPermission(
      contractAddress,
      "removeAddress(address)",
      owner.address,
    );
  });

  describe("addAddresses", function () {
    it("should add a new address with a description", async function () {
      await expect(
        contractManager
          .connect(owner)
          .addAddresses(contractAddress, "First address"),
      ).to.emit(contractManager, "AddAddress");
      const description = await contractManager.addDescription(contractAddress);
      expect(description).to.equal("First address");
    });

    it("should revert if the address already exists", async function () {
      await contractManager.addAddresses(contractAddress, "First address");
      await expect(
        contractManager.addAddresses(contractAddress, "Duplicate address"),
      ).to.be.revertedWith("Address already exists");
    });

    it("Reverts if contract address is invalid", async function () {
      await expect(
        contractManager.addAddresses(addr1.address, "Wrong address"),
      ).to.be.revertedWith("Not a valid address");
    });

    it("Reverts if zero address is passed", async function () {
      await expect(
        contractManager.addAddresses(zeroAddress, "Zero address"),
      ).to.be.revertedWith("Not a valid address");
    });

    it("should revert if given description is empty", async function () {
      await expect(
        contractManager.addAddresses(contractAddress, ""),
      ).to.be.revertedWithCustomError(
        contractManager,
        "EmptyDescriptionNotAllowed",
      );
    });
  });

  describe("updateDescription", function () {
    it("should update the description of an existing address", async function () {
      await contractManager.addAddresses(contractAddress, "First address");
      await expect(
        contractManager.updateDescription(
        contractAddress,
          "Updated description",
        ),
      ).to.emit(contractManager, "UpdateDescription");
      const description = await contractManager.addDescription(contractAddress);
      expect(description).to.equal("Updated description");
    });

    it("should revert if the address does not exist", async function () {
      await expect(
        contractManager.updateDescription(
            contractAddress,
          "Non-existent address",
        ),
      )
        .to.be.revertedWithCustomError(contractManager, "AddressNotExist")
        .withArgs(contractAddress);
    });

    it("should revert if given description is empty", async function () {
      await expect(
        contractManager.updateDescription(contractAddress, ""),
      ).to.be.revertedWithCustomError(
        contractManager,
        "EmptyDescriptionNotAllowed",
      );
    });
  });

  describe("removeAddress", function () {
    it("should remove an existing address and its description", async function () {
      await contractManager.addAddresses(contractAddress, "First address");
      await expect(contractManager.removeAddress(contractAddress)).to.emit(
        contractManager,
        "RemoveAddress",
      );
      const description = await contractManager.addDescription(contractAddress);
      expect(description).to.equal("");
    });

    it("should revert if the address does not exist", async function () {
      await expect(contractManager.removeAddress(contractAddress))
        .to.be.revertedWithCustomError(contractManager, "AddressNotExist")
        .withArgs(contractAddress);
    });
  });

  describe("Access control", function () {
    it("should allow the owner to add, update, and remove addresses", async function () {
      await expect(
        contractManager.addAddresses(contractAddress, "Owner address"),
      )
        .to.emit(contractManager, "AddAddress")
        .withArgs(contractAddress);

      await expect(
        contractManager.updateDescription(contractAddress, "Updated by owner"),
      )
        .to.emit(contractManager, "UpdateDescription")
        .withArgs(contractAddress);

      await expect(contractManager.removeAddress(contractAddress))
        .to.emit(contractManager, "RemoveAddress")
        .withArgs(contractAddress);
    });

    it("should revert when a non-owner tries to add, update, or remove addresses", async function () {
      await expect(
        contractManager
          .connect(addr1)
          .addAddresses(addr2.address, "Addr2 address"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await contractManager.addAddresses(contractAddress, "Addr1 address");

      await expect(
        contractManager
          .connect(addr1)
          .updateDescription(contractAddress, "Updated by addr1"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await expect(
        contractManager.connect(addr1).removeAddress(contractAddress),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");
    });

    it("should revert when permission revokes from user", async function () {
      contractManager.revokeCallPermission(
        await contractManager.getAddress(),
        "addAddresses(address,string)",
        owner.address,
      );
      contractManager.revokeCallPermission(
        await contractManager.getAddress(),
        "updateDescription(address,string)",
        owner.address,
      );
      contractManager.revokeCallPermission(
        await contractManager.getAddress(),
        "removeAddress(address)",
        owner.address,
      );

      await expect(
        contractManager.addAddresses(contractAddress, "Addr2 address"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await expect(
        contractManager.updateDescription(contractAddress, "Updated by addr1"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await expect(
        contractManager.removeAddress(contractAddress),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");
    });
  });
});
