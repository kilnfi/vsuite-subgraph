import {
  Mint,
  Burn,
  Transfer,
  Deposit,
  PurchasedValidators,
  SetOracleAggregator,
  SetCoverageRecipient,
  SetExecLayerRecipient,
  SetWithdrawalRecipient,
  SetOperatorFee,
  SetEpochsPerFrame,
  SetReportBounds,
  Approval,
  ApproveDepositor,
  ProcessedReport,
  SetCommittedEthers,
  SetDepositedEthers,
  SetRequestedExits
} from '../generated/templates/vPool/vPoolV1';
import {
  PoolBalance,
  PoolPurchasedValidator,
  vPool,
  PoolBalanceApproval,
  PoolDepositor,
  Report
} from '../generated/schema';
import { Bytes, BigInt, Address, store } from '@graphprotocol/graph-ts';
import { ethereum } from '@graphprotocol/graph-ts/chain/ethereum';
import { entityUUID, externalEntityUUID } from './utils';

function getOrCreateBalance(pool: Bytes, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalance {
  const balanceId = externalEntityUUID(Address.fromBytes(pool), [account.toHexString()]);

  let balance = PoolBalance.load(balanceId);

  if (balance == null) {
    balance = new PoolBalance(balanceId);
    balance.address = account;
    balance.pool = pool;
    balance.amount = BigInt.zero();
    balance.totalApproval = BigInt.zero();
    balance.createdAt = timestamp;
    balance.createdAtBlock = block;
  }

  return balance;
}

function saveOrEraseBalance(balance: PoolBalance, event: ethereum.Event): void {
  if (balance.amount == BigInt.zero() && balance.totalApproval == BigInt.zero()) {
    store.remove('PoolBalance', balance.id);
  } else {
    balance.editedAt = event.block.timestamp;
    balance.editedAtBlock = event.block.number;
    balance.save();
  }
}

export function handleSetCommittedEthers(event: SetCommittedEthers): void {
  const pool = vPool.load(event.address);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.committed = event.params.committedEthers;

  pool!.save();
}

export function handleSetDepositedEthers(event: SetDepositedEthers): void {
  const pool = vPool.load(event.address);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.deposited = event.params.depositedEthers;

  pool!.save();
}

export function handleSetRequestedExits(event: SetRequestedExits): void {
  const pool = vPool.load(event.address);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.requestedExits = event.params.newRequestedExits;

  pool!.save();
}

export function handleDeposit(event: Deposit): void {
  const pool = vPool.load(event.address);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.totalUnderlyingSupply = pool!.totalUnderlyingSupply + event.params.amount;

  pool!.save();
}

export function handleMint(event: Mint): void {
  const pool = vPool.load(event.address);

  const balance = getOrCreateBalance(
    event.address,
    Address.fromHexString('0x0000000000000000000000000000000000000000'),
    event.block.timestamp,
    event.block.number
  );

  balance.amount = balance.amount + event.params.amount;

  saveOrEraseBalance(balance, event);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.totalSupply = event.params.totalSupply;

  pool!.save();
}

export function handleBurn(event: Burn): void {
  const pool = vPool.load(event.address);

  const balance = getOrCreateBalance(event.address, event.params.burner, event.block.timestamp, event.block.number);

  balance.amount = balance.amount - event.params.amount;

  saveOrEraseBalance(balance, event);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.totalSupply = event.params.totalSupply;

  pool!.save();
}

export function handleTransfer(event: Transfer): void {
  const pool = vPool.load(event.address);

  const fromBalance = getOrCreateBalance(event.address, event.params.from, event.block.timestamp, event.block.number);

  const toBalance = getOrCreateBalance(event.address, event.params.to, event.block.timestamp, event.block.number);

  fromBalance.amount = fromBalance.amount - event.params.value;
  toBalance.amount = toBalance.amount + event.params.value;

  saveOrEraseBalance(fromBalance, event);
  saveOrEraseBalance(toBalance, event);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handlePurchasedValidators(event: PurchasedValidators): void {
  const pool = vPool.load(event.address);

  const validatorCount = pool!.purchasedValidatorCount.toI32();

  for (let idx = 0; idx < event.params.validators.length; ++idx) {
    const poolPurchasedValidatorId = entityUUID(event, [
      (validatorCount + idx).toString(),
      pool!.factory.toHexString(),
      event.params.validators[idx].toString()
    ]);
    const poolPurchasedValidator = new PoolPurchasedValidator(poolPurchasedValidatorId);
    const fundedKeyId = externalEntityUUID(Address.fromBytes(pool!.factory), [event.params.validators[idx].toString()]);

    poolPurchasedValidator.pool = event.address;
    poolPurchasedValidator.index = BigInt.fromI32(validatorCount + idx);
    poolPurchasedValidator.fundedValidationKey = fundedKeyId;
    poolPurchasedValidator.createdAt = event.block.timestamp;
    poolPurchasedValidator.editedAt = event.block.timestamp;
    poolPurchasedValidator.createdAtBlock = event.block.number;
    poolPurchasedValidator.editedAtBlock = event.block.number;

    poolPurchasedValidator.save();
  }

  pool!.purchasedValidatorCount = BigInt.fromI32(
    pool!.purchasedValidatorCount.toI32() + event.params.validators.length
  );
  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleProcessedReport(event: ProcessedReport): void {
  const pool = vPool.load(event.address);

  const reportId = entityUUID(event, [event.params.epoch.toString()]);
  const report = new Report(reportId);

  report.pool = event.address;
  report.epoch = event.params.epoch;
  report.balanceSum = event.params.report.balanceSum;
  report.exitedSum = event.params.report.exitedSum;
  report.skimmedSum = event.params.report.skimmedSum;
  report.slashedSum = event.params.report.slashedSum;
  report.exiting = event.params.report.exiting;
  report.maxExitable = event.params.report.maxExitable;
  report.maxCommittable = event.params.report.maxCommittable;
  report.activatedCount = event.params.report.activatedCount;
  report.stoppedCount = event.params.report.stoppedCount;
  report.preUnderlyingSupply = event.params.traces.preUnderlyingSupply;
  report.postUnderlyingSupply = event.params.traces.postUnderlyingSupply;
  report.preSupply = event.params.traces.preSupply;
  report.postSupply = event.params.traces.postSupply;
  report.newExitedEthers = event.params.traces.newExitedEthers;
  report.exitBoostEthers = event.params.traces.exitBoostEthers;
  report.exitFedEthers = event.params.traces.exitFedEthers;
  report.exitBurnedShares = event.params.traces.exitBurnedShares;
  report.newSkimmedEthers = event.params.traces.newSkimmedEthers;
  report.revenue = event.params.traces.revenue;
  report.pulledCoverageFunds = event.params.traces.pulledCoverageFunds;
  report.earnedConsensusLayerRewards = event.params.traces.earnedConsensusLayerRewards;
  report.pulledExecutionLayerRewards = event.params.traces.pulledExecutionLayerRewards;
  report.pulledExitQueueUnclaimedFunds = event.params.traces.pulledExitQueueUnclaimedFunds;
  report.createdAt = event.block.timestamp;
  report.editedAt = event.block.timestamp;
  report.createdAtBlock = event.block.number;
  report.editedAtBlock = event.block.number;
  report.save();

  pool!.totalSupply = event.params.traces.postSupply;
  pool!.totalUnderlyingSupply = event.params.traces.postUnderlyingSupply;
  pool!.lastEpoch = event.params.epoch;
  pool!.expectedEpoch = event.params.epoch + pool!.epochsPerFrame;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetOracleAggregator(event: SetOracleAggregator): void {
  const pool = vPool.load(event.address);

  pool!.oracleAggregator = event.params.oracleAggregator;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetCoverageRecipient(event: SetCoverageRecipient): void {
  const pool = vPool.load(event.address);

  pool!.coverageRecipient = event.params.coverageRecipient;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetExecLayerRecipient(event: SetExecLayerRecipient): void {
  const pool = vPool.load(event.address);

  pool!.execLayerRecipient = event.params.execLayerRecipient;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetWithdrawalRecipient(event: SetWithdrawalRecipient): void {
  const pool = vPool.load(event.address);

  pool!.withdrawalRecipient = event.params.withdrawalRecipient;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetOperatorFee(event: SetOperatorFee): void {
  const pool = vPool.load(event.address);

  pool!.operatorFee = event.params.operatorFeeBps;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetEpochsPerFrame(event: SetEpochsPerFrame): void {
  const pool = vPool.load(event.address);

  pool!.epochsPerFrame = event.params.epochsPerFrame;
  pool!.expectedEpoch = pool!.lastEpoch + pool!.epochsPerFrame;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handleSetReportBounds(event: SetReportBounds): void {
  const pool = vPool.load(event.address);

  pool!.maxAPRUpperBound = event.params.maxAPRUpperBound;
  pool!.maxAPRUpperCoverageBoost = event.params.maxAPRUpperCoverageBoost;
  pool!.maxRelativeLowerBound = event.params.maxRelativeLowerBound;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

function getOrCreateApproval(balance: string, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalanceApproval {
  const approvalId = balance + '_' + account.toHexString();

  let approval = PoolBalanceApproval.load(approvalId);

  if (approval == null) {
    approval = new PoolBalanceApproval(approvalId);
    approval.address = account;
    approval.balance = balance;
    approval.amount = BigInt.fromI32(0);
    approval.createdAt = timestamp;
    approval.createdAtBlock = block;
  }

  return approval;
}

function saveOrEraseApproval(approval: PoolBalanceApproval, event: ethereum.Event): void {
  if (approval.amount == BigInt.zero()) {
    store.remove('PoolBalanceApproval', approval.id);
  } else {
    approval.editedAt = event.block.timestamp;
    approval.editedAtBlock = event.block.number;
    approval.save();
  }
}

export function handleApproval(event: Approval): void {
  const balance = getOrCreateBalance(event.address, event.params.owner, event.block.timestamp, event.block.number);
  const approval = getOrCreateApproval(balance.id, event.params.spender, event.block.timestamp, event.block.number);

  if (approval.amount >= event.params.value) {
    balance.totalApproval = balance.totalApproval - (approval.amount - event.params.value);
  } else {
    balance.totalApproval = balance.totalApproval + (event.params.value - approval.amount);
  }
  approval.amount = event.params.value;

  saveOrEraseBalance(balance, event);
  saveOrEraseApproval(approval, event);
}

export function handleApproveDepositor(event: ApproveDepositor): void {
  const depositorId = entityUUID(event, [event.params.depositor.toHexString()]);
  let depositor = PoolDepositor.load(depositorId);

  if (depositor == null) {
    if (event.params.allowed) {
      depositor = new PoolDepositor(depositorId);

      depositor.address = event.params.depositor;
      depositor.pool = event.address;

      depositor.createdAt = event.block.timestamp;
      depositor.createdAtBlock = event.block.number;
      depositor.editedAt = event.block.timestamp;
      depositor.editedAtBlock = event.block.number;
      depositor.save();
    }
  } else {
    if (!event.params.allowed) {
      store.remove('PoolDepositor', depositorId);
    } else {
      depositor.editedAt = event.block.timestamp;
      depositor.editedAtBlock = event.block.number;
      depositor.save();
    }
  }
}
