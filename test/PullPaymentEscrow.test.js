const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PullPaymentEscrow", function () {
  let Escrow, escrow;
  let buyer, seller, other;
  const oneEth = ethers.parseEther("1.0");

  beforeEach(async function () {
    [buyer, seller, other] = await ethers.getSigners();
    Escrow = await ethers.getContractFactory("PullPaymentEscrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
  });

  it("deposit emits Deposited and stores escrow", async function () {
    const tx = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const parsedEvent = escrow.interface.parseLog(evt);
    expect(evt).to.exist;
    const escrowId = parsedEvent.args.escrowId;
    const e = await escrow.getEscrow(escrowId);
    expect(e.buyer).to.equal(buyer.address);
    expect(e.seller).to.equal(seller.address);
    expect(e.amount).to.equal(oneEth);
    expect(e.state).to.equal(1); // Deposited
    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(oneEth);
  });

  it("buyer can refund before confirm and withdraw back", async function () {
    const tx = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const rcpt = await tx.wait();
    const depositedLog = rcpt.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const escrowId = escrow.interface.parseLog(depositedLog).args.escrowId;

    await expect(escrow.connect(buyer).refund(escrowId)).to.emit(escrow, "Refunded").withArgs(escrowId);

    const balBefore = await ethers.provider.getBalance(buyer.address);
    const wtx = await escrow.connect(buyer).withdrawPayments();
    const wrcpt = await wtx.wait();
    const gas = wrcpt.gasUsed * wrcpt.gasPrice;
    const balAfter = await ethers.provider.getBalance(buyer.address);
    expect(balAfter).to.equal(balBefore + oneEth - gas);

    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0);
  });

  it("non-buyer cannot refund (reverts)", async function () {
    const tx = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const rcpt = await tx.wait();
    const depositedLog = rcpt.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const escrowId = escrow.interface.parseLog(depositedLog).args.escrowId;

    await expect(escrow.connect(other).refund(escrowId)).to.be.reverted;
  });

  it("buyer confirms then seller withdraws", async function () {
    const tx = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const rcpt = await tx.wait();
    const depositedLog = rcpt.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const escrowId = escrow.interface.parseLog(depositedLog).args.escrowId;

    await expect(escrow.connect(buyer).confirm(escrowId)).to.emit(escrow, "Confirmed").withArgs(escrowId);

    const before = await ethers.provider.getBalance(seller.address);
    const wtx = await escrow.connect(seller).withdrawPayments();
    const wrcpt = await wtx.wait();
    const gas = wrcpt.gasUsed * wrcpt.gasPrice;
    const after = await ethers.provider.getBalance(seller.address);
    expect(after).to.equal(before + oneEth - gas);

    // second withdraw should revert
    await expect(escrow.connect(seller).withdrawPayments()).to.be.reverted;
  });

  it("cannot confirm twice or refund after confirm", async function () {
    const tx = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const rcpt = await tx.wait();
    const depositedLog = rcpt.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const escrowId = escrow.interface.parseLog(depositedLog).args.escrowId;

    await escrow.connect(buyer).confirm(escrowId);
    await expect(escrow.connect(buyer).confirm(escrowId)).to.be.reverted;
    await expect(escrow.connect(buyer).refund(escrowId)).to.be.reverted;
  });

  it("withdrawPayments reverts when nothing to withdraw", async function () {
    await expect(escrow.connect(other).withdrawPayments()).to.be.reverted;
  });

  it("supports multiple escrows and mixed flows", async function () {
    const tx1 = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const r1 = await tx1.wait();
    const depositedLog1 = r1.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const id1 = escrow.interface.parseLog(depositedLog1).args.escrowId;

    const tx2 = await escrow.connect(buyer).createEscrow(seller.address, { value: oneEth });
    const r2 = await tx2.wait();
    const depositedLog2 = r2.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed.name === "Deposited";
      } catch {
        return false;
      }
    });
    const id2 = escrow.interface.parseLog(depositedLog2).args.escrowId;

    await escrow.connect(buyer).confirm(id1);
    await escrow.connect(buyer).refund(id2);

    // seller withdraw 1 ETH
    const sellerBefore = await ethers.provider.getBalance(seller.address);
    const sW = await escrow.connect(seller).withdrawPayments();
    const sR = await sW.wait();
    const sGas = sR.gasUsed * sR.gasPrice;
    const sellerAfter = await ethers.provider.getBalance(seller.address);
    expect(sellerAfter).to.equal(sellerBefore + oneEth - sGas);

    // buyer withdraw 1 ETH
    const buyerBefore = await ethers.provider.getBalance(buyer.address);
    const bW = await escrow.connect(buyer).withdrawPayments();
    const bR = await bW.wait();
    const bGas = bR.gasUsed * bR.gasPrice;
    const buyerAfter = await ethers.provider.getBalance(buyer.address);
    expect(buyerAfter).to.equal(buyerBefore + oneEth - bGas);

    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0);
  });
});
