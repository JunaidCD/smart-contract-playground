const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BountyBoard", function () {
  let Board, board;
  let poster, hunter1, hunter2, other;
  const oneEth = ethers.parseEther("1.0");

  beforeEach(async function () {
    [poster, hunter1, hunter2, other] = await ethers.getSigners();
    Board = await ethers.getContractFactory("BountyBoard");
    board = await Board.deploy();
    await board.waitForDeployment();
  });

  it("poster can post a bounty (funds) and event emitted", async function () {
    const tx = await board.connect(poster).postBounty({ value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = board.interface.parseLog(log);
        return parsed.name === "Posted";
      } catch {
        return false;
      }
    });
    const parsedEvt = board.interface.parseLog(evt);
    expect(evt).to.exist;
    const bountyId = parsedEvt.args.bountyId;
    const [bPoster, bAmount, bState, bAcceptedHunter] = await board.getBounty(bountyId);
    expect(bPoster).to.equal(poster.address);
    expect(bAmount).to.equal(oneEth);
    expect(bState).to.equal(1); // Active
    expect(await ethers.provider.getBalance(await board.getAddress())).to.equal(oneEth);
  });

  it("hunter can submit solution when bounty Active", async function () {
    const tx = await board.connect(poster).postBounty({ value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = board.interface.parseLog(log);
        return parsed.name === "Posted";
      } catch {
        return false;
      }
    });
    const bountyId = board.interface.parseLog(evt).args.bountyId;
    await expect(board.connect(hunter1).submitSolution(bountyId, "ipfs://hash")).to.emit(board, "Submitted");
    expect(await board.submissions(bountyId, hunter1.address)).to.equal("ipfs://hash");
  });

  it("poster approves hunter and hunter can withdraw", async function () {
    const tx = await board.connect(poster).postBounty({ value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = board.interface.parseLog(log);
        return parsed.name === "Posted";
      } catch {
        return false;
      }
    });
    const bountyId = board.interface.parseLog(evt).args.bountyId;

    await board.connect(hunter1).submitSolution(bountyId, "sol1");

    await expect(board.connect(poster).approve(bountyId, hunter1.address)).to.emit(board, "Approved");

    // hunter withdraw
    const before = await ethers.provider.getBalance(hunter1.address);
    const wtx = await board.connect(hunter1).withdrawPayments();
    const wrcpt = await wtx.wait();
    const gas = wrcpt.gasUsed * wrcpt.gasPrice;
    const after = await ethers.provider.getBalance(hunter1.address);
    expect(after).to.equal(before + oneEth - gas);
  });

  it("non-poster cannot approve", async function () {
    const tx = await board.connect(poster).postBounty({ value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = board.interface.parseLog(log);
        return parsed.name === "Posted";
      } catch {
        return false;
      }
    });
    const bountyId = board.interface.parseLog(evt).args.bountyId;
    await expect(board.connect(other).approve(bountyId, hunter1.address)).to.be.reverted;
  });

  it("cannot submit to Closed bounty", async function () {
    const tx = await board.connect(poster).postBounty({ value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = board.interface.parseLog(log);
        return parsed.name === "Posted";
      } catch {
        return false;
      }
    });
    const bountyId = board.interface.parseLog(evt).args.bountyId;
    await board.connect(poster).approve(bountyId, hunter1.address);
    await expect(board.connect(hunter2).submitSolution(bountyId, "x")).to.be.reverted;
  });

  it("approve twice should revert", async function () {
    const tx = await board.connect(poster).postBounty({ value: oneEth });
    const rcpt = await tx.wait();
    const evt = rcpt.logs.find(log => {
      try {
        const parsed = board.interface.parseLog(log);
        return parsed.name === "Posted";
      } catch {
        return false;
      }
    });
    const bountyId = board.interface.parseLog(evt).args.bountyId;
    await board.connect(poster).approve(bountyId, hunter1.address);
    await expect(board.connect(poster).approve(bountyId, hunter2.address)).to.be.reverted;
  });

  it("withdrawPayments reverts with nothing to withdraw", async function () {
    await expect(board.connect(other).withdrawPayments()).to.be.reverted;
  });
});
