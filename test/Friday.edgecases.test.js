const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Friday - Edge cases (Vault, Escrow, BountyBoard)", function () {
  let TimeLockedVault, Vault;
  let PullPaymentEscrow, Escrow;
  let BountyBoard, Board;
  let owner, buyer, seller, poster, hunter1, hunter2, other;
  const oneEth = ethers.parseEther("1.0");
  const twoEth = ethers.parseEther("2.0");

  beforeEach(async function () {
    [owner, buyer, seller, poster, hunter1, hunter2, other] = await ethers.getSigners();

    TimeLockedVault = await ethers.getContractFactory("TimeLockedVault");
    // unlockTime 1 hour in future from current block timestamp
    const currentBlock = await ethers.provider.getBlock("latest");
    const unlock = currentBlock.timestamp + 3600;
    Vault = await TimeLockedVault.deploy(unlock);
    await Vault.waitForDeployment();

    PullPaymentEscrow = await ethers.getContractFactory("PullPaymentEscrow");
    Escrow = await PullPaymentEscrow.deploy();
    await Escrow.waitForDeployment();

    BountyBoard = await ethers.getContractFactory("BountyBoard");
    Board = await BountyBoard.deploy();
    await Board.waitForDeployment();
  });

  // ---------------- TimeLockedVault edge cases ----------------
  describe("TimeLockedVault edge cases", function () {
    it("multiple deposits and balance check", async function () {
      await Vault.connect(buyer).deposit({ value: oneEth });
      await Vault.connect(other).deposit({ value: twoEth });
      const bal = await Vault.getBalance();
      expect(bal).to.equal(oneEth + twoEth);
    });

    it("attempt early withdrawal reverts", async function () {
      await Vault.connect(buyer).deposit({ value: oneEth });
      await expect(Vault.connect(owner).withdraw()).to.be.revertedWith("Vault is still locked");
    });

    it("double withdraw attempt reverts after successful withdraw", async function () {
      await Vault.connect(buyer).deposit({ value: oneEth });

      // increase time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // owner withdraws
      await Vault.withdraw();

      // second withdraw should revert (no funds)
      await expect(Vault.withdraw()).to.be.revertedWith("No funds to withdraw");
    });

    it("deposit zero should revert", async function () {
      await expect(Vault.connect(buyer).deposit({ value: 0 })).to.be.reverted;
    });
  });

  // ---------------- PullPaymentEscrow edge cases ----------------
  describe("PullPaymentEscrow edge cases", function () {
    it("multiple escrows and mixed flows", async function () {
      const tx1 = await Escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
      const rcpt1 = await tx1.wait();
      const id1 = rcpt1.logs.find(log => {
        try {
          return Escrow.interface.parseLog(log).name === "Deposited";
        } catch { return false; }
      });
      const parsedId1 = Escrow.interface.parseLog(id1).args.escrowId;

      const tx2 = await Escrow.connect(buyer).createEscrow(seller.address, { value: twoEth });
      const rcpt2 = await tx2.wait();
      const id2 = rcpt2.logs.find(log => {
        try {
          return Escrow.interface.parseLog(log).name === "Deposited";
        } catch { return false; }
      });
      const parsedId2 = Escrow.interface.parseLog(id2).args.escrowId;

      // confirm first, refund second
      await Escrow.connect(buyer).confirm(parsedId1);
      await Escrow.connect(buyer).refund(parsedId2);

      // seller withdraw oneEth
      await Escrow.connect(seller).withdrawPayments();
      // buyer withdraw twoEth
      await Escrow.connect(buyer).withdrawPayments();

      expect(await ethers.provider.getBalance(await Escrow.getAddress())).to.equal(0);
    });

    it("double withdraw attempt reverts", async function () {
      const tx = await Escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
      const rcpt = await tx.wait();
      const evt = rcpt.logs.find(log => {
        try {
          return Escrow.interface.parseLog(log).name === "Deposited";
        } catch { return false; }
      });
      const id = Escrow.interface.parseLog(evt).args.escrowId;

      await Escrow.connect(buyer).confirm(id);
      await Escrow.connect(seller).withdrawPayments();

      // second withdraw should revert
      await expect(Escrow.connect(seller).withdrawPayments()).to.be.reverted;
    });

    it("refund by non-buyer reverts", async function () {
      const tx = await Escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
      const rcpt = await tx.wait();
      const evt = rcpt.logs.find(log => {
        try {
          return Escrow.interface.parseLog(log).name === "Deposited";
        } catch { return false; }
      });
      const id = Escrow.interface.parseLog(evt).args.escrowId;
      await expect(Escrow.connect(other).refund(id)).to.be.reverted;
    });

    it("zero deposit should revert", async function () {
      await expect(Escrow.connect(buyer).createEscrow(seller.address, { value: 0 })).to.be.reverted;
    });
  });

  // ---------------- BountyBoard edge cases ----------------
  describe("BountyBoard edge cases", function () {
    it("multiple bounties and mixed flows", async function () {
      const t1 = await Board.connect(poster).postBounty({ value: oneEth });
      const rcpt1 = await t1.wait();
      const evt1 = rcpt1.logs.find(log => {
        try {
          return Board.interface.parseLog(log).name === "Posted";
        } catch { return false; }
      });
      const id1 = Board.interface.parseLog(evt1).args.bountyId;

      const t2 = await Board.connect(poster).postBounty({ value: twoEth });
      const rcpt2 = await t2.wait();
      const evt2 = rcpt2.logs.find(log => {
        try {
          return Board.interface.parseLog(log).name === "Posted";
        } catch { return false; }
      });
      const id2 = Board.interface.parseLog(evt2).args.bountyId;

      await Board.connect(hunter1).submitSolution(id1, "solA");
      await Board.connect(hunter2).submitSolution(id2, "solB");

      await Board.connect(poster).approve(id1, hunter1.address);
      await Board.connect(poster).approve(id2, hunter2.address);

      // both hunters withdraw
      await Board.connect(hunter1).withdrawPayments();
      await Board.connect(hunter2).withdrawPayments();

      expect(await ethers.provider.getBalance(await Board.getAddress())).to.equal(0);
    });

    it("cannot submit to Closed bounty", async function () {
      const tx = await Board.connect(poster).postBounty({ value: oneEth });
      const rcpt = await tx.wait();
      const evt = rcpt.logs.find(log => {
        try {
          return Board.interface.parseLog(log).name === "Posted";
        } catch { return false; }
      });
      const id = Board.interface.parseLog(evt).args.bountyId;
      await Board.connect(poster).approve(id, hunter1.address);
      await expect(Board.connect(hunter2).submitSolution(id, "x")).to.be.reverted;
    });

    it("approve twice should revert", async function () {
      const tx = await Board.connect(poster).postBounty({ value: oneEth });
      const rcpt = await tx.wait();
      const evt = rcpt.logs.find(log => {
        try {
          return Board.interface.parseLog(log).name === "Posted";
        } catch { return false; }
      });
      const id = Board.interface.parseLog(evt).args.bountyId;
      await Board.connect(poster).approve(id, hunter1.address);
      await expect(Board.connect(poster).approve(id, hunter2.address)).to.be.reverted;
    });

    it("post zero value should revert", async function () {
      await expect(Board.connect(poster).postBounty({ value: 0 })).to.be.reverted;
    });

    it("withdrawPayments reverts with nothing to withdraw", async function () {
      await expect(Board.connect(other).withdrawPayments()).to.be.reverted;
    });
  });
});
