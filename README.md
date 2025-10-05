# AllowanceVault

## What
AllowanceVault is a simple owner-funded ETH vault. The owner deposits ETH, sets withdrawal allowances for beneficiaries, and beneficiaries use a pull model (`withdraw`) to claim their allowed ETH.

## Why
- The pull model is safer: beneficiaries request funds rather than the owner pushing funds (less risk of failed transfers, reentrancy patterns are easier to handle).
- Custom errors reduce gas and provide structured revert data.
- Events (`Deposited`, `AllowanceSet`, `Withdrawn`) make it easy for UIs and tests to track activity.

## How tested
- Tests cover:
  - Happy path: fund vault → set allowance → beneficiary withdraws.
  - Over-allowance: withdraw more than allowed reverts with `InsufficientAllowance`.
  - Non-beneficiary: withdraw with zero allowance reverts.
  - No funds: setting allowance but vault empty => withdraw reverts with `NoFunds`.
  - Only owner can set allowances.

Run tests:


## Owned.sol vs OpenZeppelin Ownable
- **Owned.sol** (this project): minimal, easy to understand. Good for learning and small projects.
- **OpenZeppelin Ownable**: production-ready, audited, widely used, and interoperable with many OZ contracts. Prefer OZ in real-world deployments.

