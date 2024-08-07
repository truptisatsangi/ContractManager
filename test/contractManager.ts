import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
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

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    ContractManager = await ethers.getContractFactory("ContractManager", {});

    contractManager = await ContractManager.deploy();
    contractManager.giveCallPermission(
      await contractManager.getAddress(),
      "addAddresses(address,string)",
      owner.address,
    );
    contractManager.giveCallPermission(
      await contractManager.getAddress(),
      "updateDescription(address,string)",
      owner.address,
    );
    contractManager.giveCallPermission(
      await contractManager.getAddress(),
      "removeAddress(address)",
      owner.address,
    );

    expect();
  });

  describe("addAddresses", function () {
    it("should add a new address with a description", async function () {
      await contractManager
        .connect(owner)
        .addAddresses(addr1.address, "First address");
      const description = await contractManager.addDescription(addr1.address);
      expect(description).to.equal("First address");
    });

    it("should revert if the address is zero", async function () {
      await expect(
        contractManager.addAddresses(zeroAddress, "Zero address"),
      ).to.be.revertedWith("zero address not allowed");
    });

    it("should revert if the address already exists", async function () {
      await contractManager.addAddresses(addr1.address, "First address");
      await expect(
        contractManager.addAddresses(addr1.address, "Duplicate address"),
      ).to.be.revertedWith("Address already exists");
    });
  });

  describe("updateDescription", function () {
    it("should update the description of an existing address", async function () {
      await contractManager.addAddresses(addr1.address, "First address");
      await contractManager.updateDescription(
        addr1.address,
        "Updated description",
      );
      const description = await contractManager.addDescription(addr1.address);
      expect(description).to.equal("Updated description");
    });

    it("should revert if the address does not exist", async function () {
      await expect(
        contractManager.updateDescription(
          addr1.address,
          "Non-existent address",
        ),
      )
        .to.be.revertedWithCustomError(contractManager, "AddressNotExist")
        .withArgs(addr1.address);
    });
  });

  describe("removeAddress", function () {
    it("should remove an existing address and its description", async function () {
      await contractManager.addAddresses(addr1.address, "First address");
      await contractManager.removeAddress(addr1.address);
      const description = await contractManager.addDescription(addr1.address);
      expect(description).to.equal("");
    });

    it("should revert if the address does not exist", async function () {
      await expect(contractManager.removeAddress(addr1.address))
        .to.be.revertedWithCustomError(contractManager, "AddressNotExist")
        .withArgs(addr1.address);
    });
  });

  describe("Access control", function () {
    it("should allow the owner to add, update, and remove addresses", async function () {
      await expect(contractManager.addAddresses(addr1.address, "Owner address"))
        .to.emit(contractManager, "AddAddress")
        .withArgs(addr1.address);

      await expect(
        contractManager.updateDescription(addr1.address, "Updated by owner"),
      )
        .to.emit(contractManager, "UpdateDescription")
        .withArgs(addr1.address);

      await expect(contractManager.removeAddress(addr1.address))
        .to.emit(contractManager, "RemoveAddress")
        .withArgs(addr1.address);
    });

    it("should revert when a non-owner tries to add, update, or remove addresses", async function () {
      await expect(
        contractManager
          .connect(addr1)
          .addAddresses(addr2.address, "Addr2 address"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await contractManager.addAddresses(addr1.address, "Addr1 address");

      await expect(
        contractManager
          .connect(addr1)
          .updateDescription(addr1.address, "Updated by addr1"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await expect(
        contractManager.connect(addr1).removeAddress(addr1.address),
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
        contractManager.addAddresses(addr2.address, "Addr2 address"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await expect(
        contractManager.updateDescription(addr1.address, "Updated by addr1"),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");

      await expect(
        contractManager.removeAddress(addr1.address),
      ).to.be.revertedWithCustomError(contractManager, "Unauthorized");
    });
  });
});
