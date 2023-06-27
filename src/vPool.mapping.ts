import {
  Mint,
  Burn,
  Transfer,
  Deposit,
  PurchasedValidators,
  SetOperatorFee,
  SetEpochsPerFrame,
  SetReportBounds,
  Approval,
  ApproveDepositor,
  ProcessedReport,
  SetCommittedEthers,
  SetDepositedEthers,
  SetRequestedExits,
  SetContractLinks
} from '../generated/templates/vPool/vPool';
import {
  PoolBalance,
  PoolPurchasedValidator,
  vPool,
  PoolBalanceApproval,
  PoolDepositor,
  Report,
  PoolDeposit,
  vFactory,
  MultiPool
} from '../generated/schema';
import { Bytes, BigInt, Address, store } from '@graphprotocol/graph-ts';
import { ethereum } from '@graphprotocol/graph-ts/chain/ethereum';
import { MultiPoolRewardsSnapshot } from '../generated/schema';
import {
  createChangedPoolParameterSystemEvent,
  createPoolDepositSystemEvent,
  createPoolValidatorPurchaseSystemEvent,
  createReportProcessedSystemEvent,
  entityUUID,
  eventUUID,
  externalEntityUUID
} from './utils/utils';

function getOrCreateBalance(pool: Bytes, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalance {
  const balanceId = externalEntityUUID(Address.fromBytes(pool), [account.toHexString()]);

  let balance = PoolBalance.load(balanceId);

  if (balance == null) {
    balance = new PoolBalance(balanceId);
    balance.address = account;
    balance.pool = externalEntityUUID(Address.fromBytes(pool), []);
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
  const pool = vPool.load(entityUUID(event, []));

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.committed = event.params.committedEthers;

  pool!.save();
}

export function handleSetDepositedEthers(event: SetDepositedEthers): void {
  const pool = vPool.load(entityUUID(event, []));

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.deposited = event.params.depositedEthers;

  pool!.save();
}

export function handleSetRequestedExits(event: SetRequestedExits): void {
  const pool = vPool.load(entityUUID(event, []));

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.requestedExits = event.params.newRequestedExits;

  pool!.save();
}

export function handleDeposit(event: Deposit): void {
  const pool = vPool.load(entityUUID(event, []));

  const poolDeposit = new PoolDeposit(eventUUID(event, ['deposit']));

  poolDeposit.pool = pool!.id;

  poolDeposit.from = event.params.sender;
  poolDeposit.amount = event.params.amount;
  poolDeposit.mintedShares = event.params.mintedShares;

  poolDeposit.createdAt = event.block.timestamp;
  poolDeposit.editedAt = event.block.timestamp;
  poolDeposit.createdAtBlock = event.block.number;
  poolDeposit.editedAtBlock = event.block.number;

  poolDeposit.save();

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.totalUnderlyingSupply = pool!.totalUnderlyingSupply.plus(event.params.amount);

  pool!.save();

  const depositorId = entityUUID(event, [event.params.sender.toHexString()]);
  const depositor = PoolDepositor.load(depositorId);
  depositor!.depositedEth = depositor!.depositedEth.plus(event.params.amount);
  depositor!.editedAt = event.block.timestamp;
  depositor!.editedAtBlock = event.block.number;
  depositor!.save();

  const se = createPoolDepositSystemEvent(
    event,
    Address.fromBytes(vFactory.load(pool!.factory)!.address),
    event.address,
    event.params.sender
  );

  se.amountEth = se.amountEth.plus(event.params.amount);
  se.amountShares = se.amountShares.plus(poolDeposit.mintedShares);
  se.depositor = entityUUID(event, [event.params.sender.toHexString()]);
  se.save();
}

export function handleMint(event: Mint): void {
  const pool = vPool.load(entityUUID(event, []));

  const balance = getOrCreateBalance(
    event.address,
    Address.fromHexString('0x0000000000000000000000000000000000000000'),
    event.block.timestamp,
    event.block.number
  );

  balance.amount = balance.amount.plus(event.params.amount);

  saveOrEraseBalance(balance, event);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.totalSupply = event.params.totalSupply;

  pool!.save();
}

export function handleBurn(event: Burn): void {
  const pool = vPool.load(entityUUID(event, []));

  const balance = getOrCreateBalance(event.address, event.params.burner, event.block.timestamp, event.block.number);

  balance.amount = balance.amount.minus(event.params.amount);

  saveOrEraseBalance(balance, event);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.totalSupply = event.params.totalSupply;

  pool!.save();
}

export function handleTransfer(event: Transfer): void {
  const pool = vPool.load(entityUUID(event, []));

  const fromBalance = getOrCreateBalance(event.address, event.params.from, event.block.timestamp, event.block.number);

  const toBalance = getOrCreateBalance(event.address, event.params.to, event.block.timestamp, event.block.number);

  fromBalance.amount = fromBalance.amount.minus(event.params.value);
  toBalance.amount = toBalance.amount.plus(event.params.value);

  saveOrEraseBalance(fromBalance, event);
  saveOrEraseBalance(toBalance, event);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

export function handlePurchasedValidators(event: PurchasedValidators): void {
  const pool = vPool.load(entityUUID(event, []));

  const validatorCount = pool!.purchasedValidatorCount.toI32();
  const validators: string[] = [];

  for (let idx = 0; idx < event.params.validators.length; ++idx) {
    const poolPurchasedValidatorId = entityUUID(event, [
      (validatorCount + idx).toString(),
      vFactory.load(pool!.factory)!.address.toHexString(),
      event.params.validators[idx].toString()
    ]);
    validators.push(poolPurchasedValidatorId);
    const poolPurchasedValidator = new PoolPurchasedValidator(poolPurchasedValidatorId);
    const fundedKeyId = externalEntityUUID(Address.fromBytes(vFactory.load(pool!.factory)!.address), [
      event.params.validators[idx].toString()
    ]);

    poolPurchasedValidator.pool = pool!.id;
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

  const se = createPoolValidatorPurchaseSystemEvent(
    event,
    Address.fromBytes(vFactory.load(pool!.factory)!.address),
    event.address
  );
  se.validatorCount = se.validatorCount.plus(BigInt.fromI32(event.params.validators.length));
  const currentValidators = se.validators;
  for (let idx = 0; idx < validators.length; ++idx) {
    currentValidators.push(validators[idx]);
  }
  se.validators = currentValidators;
  se.save();
}

function maxBigInt(a: BigInt, b: BigInt): BigInt {
  if (a.gt(b)) {
    return a;
  }
  return b;
}

export function handleProcessedReport(event: ProcessedReport): void {
  const pool = vPool.load(entityUUID(event, []));

  const reportId = entityUUID(event, [event.params.epoch.toString()]);
  const report = new Report(reportId);

  report.pool = pool!.id;
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
  report.newSkimmedEthers = event.params.traces.newSkimmedEthers;
  report.exitBoostEthers = event.params.traces.exitBoostEthers;
  report.exitFedEthers = event.params.traces.exitFedEthers;
  report.exitBurnedShares = event.params.traces.exitBurnedShares;
  report.revenue = event.params.traces.revenue;
  report.delta = event.params.traces.delta;
  report.increaseLimit = event.params.traces.increaseLimit;
  report.coverageIncreaseLimit = event.params.traces.coverageIncreaseLimit;
  report.decreaseLimit = event.params.traces.decreaseLimit;
  report.consensusLayerDelta = event.params.traces.consensusLayerDelta;
  report.pulledCoverageFunds = event.params.traces.pulledCoverageFunds;
  report.pulledExecutionLayerRewards = event.params.traces.pulledExecutionLayerRewards;
  report.pulledExitQueueUnclaimedFunds = event.params.traces.pulledExitQueueUnclaimedFunds;

  report.createdAt = event.block.timestamp;
  report.editedAt = event.block.timestamp;
  report.createdAtBlock = event.block.number;
  report.editedAtBlock = event.block.number;
  report.save();

  const pool_pre_supply = pool!.totalSupply;
  const pool_pre_underlying_supply = pool!.totalUnderlyingSupply;
  const pool_post_supply = event.params.traces.postSupply;
  const pool_post_underlying_supply = event.params.traces.postUnderlyingSupply;

  pool!.totalSupply = event.params.traces.postSupply;
  pool!.totalUnderlyingSupply = event.params.traces.postUnderlyingSupply;
  pool!.lastEpoch = event.params.epoch;
  pool!.expectedEpoch = event.params.epoch.plus(pool!.epochsPerFrame);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  //
  // pre_raw_underlying = (owned_pool_shares * pool_pre_underlying_supply) / pool_pre_supply
  // pre_commission = max(0, ((max(0, pre_raw_underlying - deposited_eth) * integrator_fee_bps) / 10_000) - sold_eth)
  // pre_underlying = pre_raw_underlying - pre_commission
  //
  // post_raw_underlying = (owned_pool_shares * pool_post_underlying_supply) / pool_post_supply
  // post_commission = max(0, ((max(0, post_raw_underlying - deposited_eth) * integrator_fee_bps) / 10_000) - sold_eth)
  // post_underlying = post_raw_underlying - post_commission
  //
  // integration_contract_report_rewards = max(0, post_underlying - pre_underlying)
  //
  const multipools = pool!.pluggedMultiPools;
  for (let idx = 0; idx < multipools.length; ++idx) {
    const multipool = MultiPool.load(multipools[idx]);
    let rewards = BigInt.zero();
    let commission = BigInt.zero();

    if (multipool!.shares != null) {
      const multiPoolBalance = PoolBalance.load(multipool!.shares as string);

      let deposited_eth = BigInt.zero();
      const poolDepositor = PoolDepositor.load(multipool!.poolDepositor);
      if (poolDepositor != null) {
        deposited_eth = poolDepositor.depositedEth;
      }

      const pre_raw_underlying = multiPoolBalance!.amount.times(pool_pre_underlying_supply).div(pool_pre_supply);
      const pre_commission = maxBigInt(
        BigInt.zero(),
        maxBigInt(BigInt.zero(), pre_raw_underlying.minus(deposited_eth))
          .times(multipool!.fees)
          .div(BigInt.fromI32(10000))
          .minus(multipool!.soldEth)
      );
      const pre_underlying = maxBigInt(BigInt.zero(), pre_raw_underlying.minus(pre_commission));
      const post_raw_underlying = multiPoolBalance!.amount.times(pool_post_underlying_supply).div(pool_post_supply);
      const post_commission = maxBigInt(
        BigInt.zero(),
        maxBigInt(BigInt.zero(), post_raw_underlying.minus(deposited_eth))
          .times(multipool!.fees)
          .div(BigInt.fromI32(10000))
          .minus(multipool!.soldEth)
      );
      const post_underlying = maxBigInt(BigInt.zero(), post_raw_underlying.minus(post_commission));

      rewards = maxBigInt(BigInt.zero(), post_underlying.minus(pre_underlying));
      commission = maxBigInt(BigInt.zero(), post_commission.minus(pre_commission));
    }

    const multiPoolRewardsSnapshot = new MultiPoolRewardsSnapshot(
      eventUUID(event, [multipool!.id, report.epoch.toString()])
    );
    multiPoolRewardsSnapshot.multiPool = multipool!.id;
    multiPoolRewardsSnapshot.report = reportId;
    multiPoolRewardsSnapshot.rewards = rewards;
    multiPoolRewardsSnapshot.commission = commission;

    multiPoolRewardsSnapshot.createdAt = event.block.timestamp;
    multiPoolRewardsSnapshot.editedAt = event.block.timestamp;
    multiPoolRewardsSnapshot.createdAtBlock = event.block.number;
    multiPoolRewardsSnapshot.editedAtBlock = event.block.number;
    multiPoolRewardsSnapshot.save();
  }

  const systemEvent = createReportProcessedSystemEvent(
    event,
    Address.fromBytes(vFactory.load(pool!.factory)!.address),
    event.address,
    report.epoch
  );
  systemEvent.report = reportId;
  systemEvent.save();
}

export function handleSetContractLinks(event: SetContractLinks): void {
  const pool = vPool.load(entityUUID(event, []));

  const withdrawalRecipientOld = pool!.withdrawalRecipient;
  const exitQueueOld = pool!.exitQueue;
  const execLayerRecipientOld = pool!.execLayerRecipient;
  const coverageRecipientOld = pool!.coverageRecipient;
  const oracleAggregatorOld = pool!.oracleAggregator;

  pool!.withdrawalRecipient = externalEntityUUID(event.params.withdrawalRecipient, []);
  pool!.exitQueue = externalEntityUUID(event.params.exitQueue, []);
  pool!.execLayerRecipient = externalEntityUUID(event.params.execLayerRecipient, []);
  pool!.coverageRecipient = externalEntityUUID(event.params.coverageRecipient, []);
  pool!.oracleAggregator = externalEntityUUID(event.params.oracleAggregator, []);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `withdrawalRecipient`,
      withdrawalRecipientOld
    );
    systemEvent.newValue = event.params.withdrawalRecipient.toHexString();
    systemEvent.save();
  }
  {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `exitQueue`,
      exitQueueOld
    );
    systemEvent.newValue = event.params.exitQueue.toHexString();
    systemEvent.save();
  }
  {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `execLayerRecipient`,
      execLayerRecipientOld
    );
    systemEvent.newValue = event.params.execLayerRecipient.toHexString();
    systemEvent.save();
  }
  {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `coverageRecipient`,
      coverageRecipientOld
    );
    systemEvent.newValue = event.params.coverageRecipient.toHexString();
    systemEvent.save();
  }
  {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `oracleAggregator`,
      oracleAggregatorOld
    );
    systemEvent.newValue = event.params.oracleAggregator.toHexString();
    systemEvent.save();
  }
}

export function handleSetOperatorFee(event: SetOperatorFee): void {
  const pool = vPool.load(entityUUID(event, []));

  let oldValue = pool!.operatorFee;
  pool!.operatorFee = event.params.operatorFeeBps;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  if (oldValue.notEqual(event.params.operatorFeeBps)) {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `operatorFee`,
      oldValue.toString()
    );
    systemEvent.newValue = event.params.operatorFeeBps.toString();
    systemEvent.save();
  }
}

export function handleSetEpochsPerFrame(event: SetEpochsPerFrame): void {
  const pool = vPool.load(entityUUID(event, []));

  let oldValue = pool!.epochsPerFrame;

  pool!.epochsPerFrame = event.params.epochsPerFrame;
  pool!.expectedEpoch = pool!.lastEpoch.plus(pool!.epochsPerFrame);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  if (oldValue.notEqual(event.params.epochsPerFrame)) {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `epochsPerFrame`,
      oldValue.toString()
    );
    systemEvent.newValue = event.params.epochsPerFrame.toString();
    systemEvent.save();
  }
}

export function handleSetReportBounds(event: SetReportBounds): void {
  const pool = vPool.load(entityUUID(event, []));

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
    balance.totalApproval = balance.totalApproval.minus(approval.amount.minus(event.params.value));
  } else {
    balance.totalApproval = balance.totalApproval.plus(event.params.value.minus(approval.amount));
  }
  approval.amount = event.params.value;

  saveOrEraseBalance(balance, event);
  saveOrEraseApproval(approval, event);
}

export function handleApproveDepositor(event: ApproveDepositor): void {
  const depositorId = entityUUID(event, [event.params.depositor.toHexString()]);
  let depositor = PoolDepositor.load(depositorId);

  let oldValue = false;

  if (depositor == null) {
    depositor = new PoolDepositor(depositorId);

    depositor.allowed = event.params.allowed;
    depositor.address = event.params.depositor;
    depositor.pool = externalEntityUUID(event.address, []);
    depositor.depositedEth = BigInt.fromI32(0);
    depositor.createdAt = event.block.timestamp;
    depositor.createdAtBlock = event.block.number;
    depositor.editedAt = event.block.timestamp;
    depositor.editedAtBlock = event.block.number;
    depositor.save();
  } else {
    oldValue = true;
    depositor.allowed = event.params.allowed;
    depositor.editedAt = event.block.timestamp;
    depositor.editedAtBlock = event.block.number;
    depositor.save();
  }

  const pool = vPool.load(entityUUID(event, []));

  if (oldValue != event.params.allowed) {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `depositor[${event.params.depositor.toHexString()}]`,
      oldValue.toString()
    );
    systemEvent.newValue = event.params.allowed.toString();
    systemEvent.save();
  }
}
