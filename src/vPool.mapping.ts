import {
  Mint,
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
  SetContractLinks,
  SetConsensusLayerSpec
} from '../generated/templates/vPool/vPool';
import { ProcessedReport as ProcessedReport_2_2_0 } from '../generated/templates/vPool_2_2_0/vPool_2_2_0';
import {
  PoolBalance,
  PoolPurchasedValidator,
  vPool,
  PoolBalanceApproval,
  PoolDepositor,
  Report,
  PoolDeposit,
  vFactory,
  MultiPool,
  ERC20,
  vExitQueue,
  vPoolRewardEntry,
  IntegrationRewardEntry,
  DepositDataEntry
} from '../generated/schema';
import { Bytes, BigInt, Address, store, dataSource } from '@graphprotocol/graph-ts';
import { ethereum } from '@graphprotocol/graph-ts/chain/ethereum';
import { MultiPoolRewardsSnapshot } from '../generated/schema';
import {
  _computeEthAfterCommission,
  _computeStakedEthValue,
  createChangedPoolParameterSystemEvent,
  createPoolDepositSystemEvent,
  createPoolValidatorPurchaseSystemEvent,
  createReportProcessedSystemEvent,
  entityUUID,
  eventUUID,
  externalEntityUUID
} from './utils/utils';
import { _recomputeERC20TotalUnderlyingSupply } from './ERC20.mapping';
import { YEAR, pushEntryToSummaries } from './utils/rewards';
import { shouldSkip } from './utils/shouldSkip';

export function getOrCreateBalance(pool: Bytes, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalance {
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
  if (shouldSkip(event)) {
    return;
  }
  const pool = vPool.load(event.address);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.committed = event.params.committedEthers;

  pool!.save();
}

export function handleSetDepositedEthers(event: SetDepositedEthers): void {
  if (shouldSkip(event)) {
    return;
  }
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

  const depositDataEntry = new DepositDataEntry(eventUUID(event, ['DepositDataEntry']));
  depositDataEntry.type = 'DepositDataEntry';
  depositDataEntry.depositedEth = event.params.amount;
  depositDataEntry.createdAt = event.block.timestamp;
  depositDataEntry.editedAt = event.block.timestamp;
  depositDataEntry.createdAtBlock = event.block.number;
  depositDataEntry.editedAtBlock = event.block.number;
  depositDataEntry.save();
  pushEntryToSummaries(event, Address.fromBytes(event.address), depositDataEntry);
}

export function handleMint(event: Mint): void {
  const pool = vPool.load(event.address);

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

export function handleTransfer(event: Transfer): void {
  const pool = vPool.load(event.address);

  const fromBalance = getOrCreateBalance(event.address, event.params.from, event.block.timestamp, event.block.number);

  const toBalance = getOrCreateBalance(event.address, event.params.to, event.block.timestamp, event.block.number);

  const exitQueue = vExitQueue.load(event.params.to);
  const erc20Integration = ERC20.load(event.params.from);

  if (exitQueue != null && exitQueue.id == pool!.exitQueue && erc20Integration != null) {
    const stakedValueBefore = _computeStakedEthValue(
      fromBalance.amount,
      pool!.totalSupply,
      pool!.totalUnderlyingSupply
    );
    const stakedValueAfter = _computeStakedEthValue(
      fromBalance.amount.minus(event.params.value),
      pool!.totalSupply,
      pool!.totalUnderlyingSupply
    );
    let poolId = 0;
    let multiPool = MultiPool.load(externalEntityUUID(event.params.from, [BigInt.fromI32(poolId).toString()]));
    while (multiPool != null && multiPool.pool != pool!.id) {
      ++poolId;
      multiPool = MultiPool.load(externalEntityUUID(event.params.from, [BigInt.fromI32(poolId).toString()]));
    }
    if (multiPool == null) {
      throw new Error('cannot find multipool instance linked to pool');
    }
    multiPool.exitedEth = multiPool.exitedEth.plus(stakedValueBefore.minus(stakedValueAfter));
    multiPool.editedAt = event.block.timestamp;
    multiPool.editedAtBlock = event.block.number;
    multiPool.save();
  }

  fromBalance.amount = fromBalance.amount.minus(event.params.value);
  toBalance.amount = toBalance.amount.plus(event.params.value);

  saveOrEraseBalance(fromBalance, event);
  if (toBalance.address.notEqual(Address.zero())) {
    saveOrEraseBalance(toBalance, event);
  }

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  if (exitQueue != null && exitQueue.id == pool!.exitQueue) {
    if (erc20Integration != null) {
      erc20Integration.totalUnderlyingSupply = _recomputeERC20TotalUnderlyingSupply(
        Address.fromBytes(erc20Integration.address)
      );
      erc20Integration.save();
    }
  }
}

export function handlePurchasedValidators(event: PurchasedValidators): void {
  const pool = vPool.load(event.address);

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
    const keyId = externalEntityUUID(Address.fromBytes(vFactory.load(pool!.factory)!.address), [
      event.params.validators[idx].toString()
    ]);

    poolPurchasedValidator.pool = pool!.id;
    poolPurchasedValidator.index = BigInt.fromI32(validatorCount + idx);
    poolPurchasedValidator.validationKey = keyId;
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

export function handleSetConsensusLayerSpec(event: SetConsensusLayerSpec): void {
  const pool = vPool.load(event.address);

  pool!.epochsUntilFinal = event.params.consensusLayerSpec.epochsUntilFinal;
  pool!.slotsPerEpoch = event.params.consensusLayerSpec.slotsPerEpoch;
  pool!.secondsPerSlot = event.params.consensusLayerSpec.secondsPerSlot;
  pool!.genesisTimestamp = event.params.consensusLayerSpec.genesisTimestamp;
  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();
}

function _computeTotalUnderlyingSupply(pool: vPool, lastReport: Report | null): BigInt {
  let totalUnderlyingSupply = BigInt.fromI32(0);
  totalUnderlyingSupply = totalUnderlyingSupply.plus(pool.deposited);
  totalUnderlyingSupply = totalUnderlyingSupply.plus(pool.committed);
  let activatedCount = BigInt.fromI32(0);
  let consensusLayerBalanceSum = BigInt.fromI32(0);
  if (lastReport != null) {
    activatedCount = lastReport.activatedCount;
    consensusLayerBalanceSum = lastReport.balanceSum;
  }
  if (pool.purchasedValidatorCount.gt(activatedCount)) {
    totalUnderlyingSupply = totalUnderlyingSupply.plus(
      pool.purchasedValidatorCount.minus(activatedCount).times(BigInt.fromString('32000000000000000000'))
    );
  }
  totalUnderlyingSupply = totalUnderlyingSupply.plus(consensusLayerBalanceSum);
  return totalUnderlyingSupply;
}

class ReportStruct {
  balanceSum: BigInt;
  exitedSum: BigInt;
  skimmedSum: BigInt;
  slashedSum: BigInt;
  exitingSum: BigInt;
  maxExitable: BigInt;
  maxCommittable: BigInt;
  epoch: BigInt;
  activatedCount: BigInt;
  stoppedCount: BigInt;
  invalidActivationCount: BigInt;
}

class TracesStruct {
  preUnderlyingSupply: BigInt;
  postUnderlyingSupply: BigInt;
  preSupply: BigInt;
  postSupply: BigInt;
  newExitedEthers: BigInt;
  newSkimmedEthers: BigInt;
  exitBoostEthers: BigInt;
  exitFedEthers: BigInt;
  exitBurnedShares: BigInt;
  exitingProjection: BigInt;
  baseFulfillableDemand: BigInt;
  extraFulfillableDemand: BigInt;
  rewards: BigInt;
  delta: BigInt;
  increaseLimit: BigInt;
  coverageIncreaseLimit: BigInt;
  decreaseLimit: BigInt;
  consensusLayerDelta: BigInt;
  pulledCoverageFunds: BigInt;
  pulledExecutionLayerRewards: BigInt;
  pulledExitQueueUnclaimedFunds: BigInt;
}

export function handleProcessedReport(event: ProcessedReport): void {
  const reportStruct: ReportStruct = {
    balanceSum: event.params.report.balanceSum,
    exitedSum: event.params.report.exitedSum,
    skimmedSum: event.params.report.skimmedSum,
    slashedSum: event.params.report.slashedSum,
    exitingSum: event.params.report.exiting,
    maxExitable: event.params.report.maxExitable,
    maxCommittable: event.params.report.maxCommittable,
    epoch: event.params.report.epoch,
    activatedCount: event.params.report.activatedCount,
    stoppedCount: event.params.report.stoppedCount,
    invalidActivationCount: BigInt.zero()
  };

  const traces: TracesStruct = {
    preUnderlyingSupply: event.params.traces.preUnderlyingSupply,
    postUnderlyingSupply: event.params.traces.postUnderlyingSupply,
    preSupply: event.params.traces.preSupply,
    postSupply: event.params.traces.postSupply,
    newExitedEthers: event.params.traces.newExitedEthers,
    newSkimmedEthers: event.params.traces.newSkimmedEthers,
    exitBoostEthers: event.params.traces.exitBoostEthers,
    exitFedEthers: event.params.traces.exitFedEthers,
    exitBurnedShares: event.params.traces.exitBurnedShares,
    exitingProjection: event.params.traces.exitingProjection,
    baseFulfillableDemand: event.params.traces.baseFulfillableDemand,
    extraFulfillableDemand: event.params.traces.extraFulfillableDemand,
    rewards: event.params.traces.rewards,
    delta: event.params.traces.delta,
    increaseLimit: event.params.traces.increaseLimit,
    coverageIncreaseLimit: event.params.traces.coverageIncreaseLimit,
    decreaseLimit: event.params.traces.decreaseLimit,
    consensusLayerDelta: event.params.traces.consensusLayerDelta,
    pulledCoverageFunds: event.params.traces.pulledCoverageFunds,
    pulledExecutionLayerRewards: event.params.traces.pulledExecutionLayerRewards,
    pulledExitQueueUnclaimedFunds: event.params.traces.pulledExitQueueUnclaimedFunds
  };

  processedReportLogic(event, event.params.epoch, reportStruct, traces);
}

export function handleProcessedReport_2_2_0(event: ProcessedReport_2_2_0): void {
  const reportStruct: ReportStruct = {
    balanceSum: event.params.report.balanceSum,
    exitedSum: event.params.report.exitedSum,
    skimmedSum: event.params.report.skimmedSum,
    slashedSum: event.params.report.slashedSum,
    exitingSum: event.params.report.exitingSum,
    maxExitable: event.params.report.maxExitable,
    maxCommittable: event.params.report.maxCommittable,
    epoch: event.params.report.epoch,
    activatedCount: event.params.report.activatedCount,
    stoppedCount: event.params.report.stoppedCount,
    invalidActivationCount: event.params.report.invalidActivationCount
  };

  const traces: TracesStruct = {
    preUnderlyingSupply: event.params.traces.preUnderlyingSupply,
    postUnderlyingSupply: event.params.traces.postUnderlyingSupply,
    preSupply: event.params.traces.preSupply,
    postSupply: event.params.traces.postSupply,
    newExitedEthers: event.params.traces.newExitedEthers,
    newSkimmedEthers: event.params.traces.newSkimmedEthers,
    exitBoostEthers: event.params.traces.exitBoostEthers,
    exitFedEthers: event.params.traces.exitFedEthers,
    exitBurnedShares: event.params.traces.exitBurnedShares,
    exitingProjection: event.params.traces.exitingProjection,
    baseFulfillableDemand: event.params.traces.baseFulfillableDemand,
    extraFulfillableDemand: event.params.traces.extraFulfillableDemand,
    rewards: event.params.traces.rewards,
    delta: event.params.traces.delta,
    increaseLimit: event.params.traces.increaseLimit,
    coverageIncreaseLimit: event.params.traces.coverageIncreaseLimit,
    decreaseLimit: event.params.traces.decreaseLimit,
    consensusLayerDelta: event.params.traces.consensusLayerDelta,
    pulledCoverageFunds: event.params.traces.pulledCoverageFunds,
    pulledExecutionLayerRewards: event.params.traces.pulledExecutionLayerRewards,
    pulledExitQueueUnclaimedFunds: event.params.traces.pulledExitQueueUnclaimedFunds
  };

  processedReportLogic(event, event.params.epoch, reportStruct, traces);
}

export function processedReportLogic(
  event: ethereum.Event,
  epoch: BigInt,
  report: ReportStruct,
  traces: TracesStruct
): void {
  if (shouldSkip(event)) {
    return;
  }
  const pool = vPool.load(event.address);

  const reportId = entityUUID(event, [epoch.toString()]);
  if (Report.load(reportId) != null) {
    // if we have the same epoch twice, it's most probably due to a manual fix
    return;
  }
  const reportEntity = new Report(reportId);
  const lastEpoch = pool!.lastEpoch;

  reportEntity.pool = pool!.id;
  reportEntity.epoch = epoch;
  reportEntity.balanceSum = report.balanceSum;
  reportEntity.exitedSum = report.exitedSum;
  reportEntity.skimmedSum = report.skimmedSum;
  reportEntity.slashedSum = report.slashedSum;
  reportEntity.exitingSum = report.exitingSum;
  reportEntity.maxExitable = report.maxExitable;
  reportEntity.maxCommittable = report.maxCommittable;
  reportEntity.activatedCount = report.activatedCount;
  reportEntity.stoppedCount = report.stoppedCount;
  reportEntity.invalidActivationCount = report.invalidActivationCount;

  reportEntity.preUnderlyingSupply = traces.preUnderlyingSupply;
  reportEntity.postUnderlyingSupply = traces.postUnderlyingSupply;
  reportEntity.preSupply = traces.preSupply;
  reportEntity.postSupply = traces.postSupply;
  reportEntity.newExitedEthers = traces.newExitedEthers;
  reportEntity.newSkimmedEthers = traces.newSkimmedEthers;
  reportEntity.exitBoostEthers = traces.exitBoostEthers;
  reportEntity.exitFedEthers = traces.exitFedEthers;
  reportEntity.exitBurnedShares = traces.exitBurnedShares;
  reportEntity.rewards = traces.rewards;
  reportEntity.delta = traces.delta;
  reportEntity.increaseLimit = traces.increaseLimit;
  reportEntity.coverageIncreaseLimit = traces.coverageIncreaseLimit;
  reportEntity.decreaseLimit = traces.decreaseLimit;
  reportEntity.consensusLayerDelta = traces.consensusLayerDelta;
  reportEntity.pulledCoverageFunds = traces.pulledCoverageFunds;
  reportEntity.pulledExecutionLayerRewards = traces.pulledExecutionLayerRewards;
  reportEntity.pulledExitQueueUnclaimedFunds = traces.pulledExitQueueUnclaimedFunds;

  reportEntity.createdAt = event.block.timestamp;
  reportEntity.editedAt = event.block.timestamp;
  reportEntity.createdAtBlock = event.block.number;
  reportEntity.editedAtBlock = event.block.number;
  reportEntity.save();

  if (dataSource.network() === 'mainnet') {
    if (pool!.totalUnderlyingSupply != traces.preUnderlyingSupply) {
      throw new Error(
        'Invalid pool.totalUnderlyingSupply ' +
          pool!.totalUnderlyingSupply.toString() +
          ' ' +
          traces.preUnderlyingSupply.toString()
      );
    }
    if (pool!.totalSupply.plus(traces.exitBurnedShares) != traces.preSupply) {
      throw new Error(
        'Invalid pool.totalSupply + traces.exitBurnedShares ' +
          pool!.totalSupply.plus(traces.exitBurnedShares).toString() +
          ' ' +
          traces.preSupply.toString()
      );
    }
  }

  const pool_pre_supply = traces.preSupply;
  const pool_pre_underlying_supply = traces.preUnderlyingSupply;
  let pool_post_supply: BigInt;
  if (
    event.block.number.lt(BigInt.fromI64(9305795)) &&
    (event.address.equals(Address.fromString('0xdd354898622a972416876b59f179f992f2a4e93d')) ||
      event.address.equals(Address.fromString('0x182e3d45efc4436edb183f4278838505a1847e21')))
  ) {
    // edge case for testnet pools before the traces fix was introduces
    pool_post_supply = traces.postSupply.minus(reportEntity.exitBurnedShares);
  } else {
    pool_post_supply = traces.postSupply;
  }
  const pool_post_underlying_supply = _computeTotalUnderlyingSupply(pool!, reportEntity);
  if (dataSource.network() === 'mainnet') {
    if (pool_post_underlying_supply != traces.postUnderlyingSupply) {
      throw new Error(
        'Invalid pool_post_underlying_supply ' +
          pool_post_underlying_supply.toString() +
          ' ' +
          traces.postUnderlyingSupply.toString()
      );
    }
  }

  pool!.totalSupply = pool_post_supply;
  pool!.totalUnderlyingSupply = pool_post_underlying_supply;
  pool!.lastEpoch = epoch;
  pool!.expectedEpoch = epoch.plus(pool!.epochsPerFrame);

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  const period = epoch.minus(lastEpoch).times(pool!.slotsPerEpoch).times(pool!.secondsPerSlot);

  const vpoolRewardEntry = new vPoolRewardEntry(eventUUID(event, ['vPoolRewardEntry']));
  vpoolRewardEntry.type = 'vPoolRewardEntry';
  vpoolRewardEntry.grossReward = reportEntity.delta.gt(BigInt.fromI32(0)) ? reportEntity.delta : BigInt.fromI32(0);
  vpoolRewardEntry.netReward = (
    reportEntity.delta.gt(BigInt.fromI32(0)) ? reportEntity.delta : BigInt.fromI32(0)
  ).minus(reportEntity.rewards.times(pool!.operatorFee).div(BigInt.fromI32(10000)));
  vpoolRewardEntry.coverage = reportEntity.pulledCoverageFunds;
  vpoolRewardEntry.grossELRewards = reportEntity.pulledExecutionLayerRewards;
  vpoolRewardEntry.grossCLRewards = reportEntity.consensusLayerDelta;
  vpoolRewardEntry.netELRewards = reportEntity.pulledExecutionLayerRewards.minus(
    reportEntity.pulledExecutionLayerRewards.times(pool!.operatorFee).div(BigInt.fromI32(10000))
  );
  vpoolRewardEntry.netCLRewards = reportEntity.consensusLayerDelta.gt(BigInt.fromI32(0))
    ? reportEntity.consensusLayerDelta.minus(
        reportEntity.consensusLayerDelta.times(pool!.operatorFee).div(BigInt.fromI32(10000))
      )
    : reportEntity.consensusLayerDelta;

  if (reportEntity.preUnderlyingSupply.gt(BigInt.fromI32(0))) {
    vpoolRewardEntry.netRewardRate = vpoolRewardEntry.netReward
      .times(BigInt.fromString('1000000000000000000'))
      .times(BigInt.fromI64(YEAR))
      .div(reportEntity.preUnderlyingSupply.times(period));
    vpoolRewardEntry.grossRewardRate = vpoolRewardEntry.grossReward
      .times(BigInt.fromString('1000000000000000000'))
      .times(BigInt.fromI64(YEAR))
      .div(reportEntity.preUnderlyingSupply.times(period));
  } else {
    vpoolRewardEntry.netRewardRate = BigInt.fromI32(0);
    vpoolRewardEntry.grossRewardRate = BigInt.fromI32(0);
  }
  vpoolRewardEntry.report = reportEntity.id;
  vpoolRewardEntry.createdAt = event.block.timestamp;
  vpoolRewardEntry.editedAt = event.block.timestamp;
  vpoolRewardEntry.createdAtBlock = event.block.number;
  vpoolRewardEntry.editedAtBlock = event.block.number;
  vpoolRewardEntry.save();
  pushEntryToSummaries(event, event.address, vpoolRewardEntry);

  const multipools = pool!.pluggedMultiPools;
  for (let idx = 0; idx < multipools.length; ++idx) {
    const multipool = MultiPool.load(multipools[idx]);
    let rewards = BigInt.zero();
    let commission = BigInt.zero();
    let grossElRewards = BigInt.zero();
    let grossClRewards = BigInt.zero();
    let coverage = BigInt.zero();
    let netElRewards = BigInt.zero();
    let netClRewards = BigInt.zero();

    if (multipool!.shares != null && pool_pre_supply.gt(BigInt.fromI32(0)) && pool_post_supply.gt(BigInt.fromI32(0))) {
      const multiPoolBalance = PoolBalance.load(multipool!.shares as string);

      const preRawUnderlyingSupply = multiPoolBalance!.amount.times(pool_pre_underlying_supply).div(pool_pre_supply);

      const postRawUnderlyingSupply = multiPoolBalance!.amount.times(pool_post_underlying_supply).div(pool_post_supply);

      rewards = maxBigInt(BigInt.zero(), postRawUnderlyingSupply.minus(preRawUnderlyingSupply));
      commission = rewards.times(multipool!.fees).div(BigInt.fromI32(10000));
      rewards = rewards.minus(commission);

      grossElRewards = reportEntity.pulledExecutionLayerRewards.times(multiPoolBalance!.amount).div(pool_pre_supply);
      grossClRewards = reportEntity.consensusLayerDelta.times(multiPoolBalance!.amount).div(pool_pre_supply);
      coverage = reportEntity.pulledCoverageFunds.times(multiPoolBalance!.amount).div(pool_pre_supply);

      netElRewards = grossElRewards.minus(grossElRewards.times(multipool!.fees).div(BigInt.fromI32(10000)));
      netClRewards = grossClRewards.minus(grossClRewards.times(multipool!.fees).div(BigInt.fromI32(10000)));

      const erc20 = ERC20.load(multipool!.integration);
      if (erc20 != null) {
        const multiPoolBalance = PoolBalance.load(multipool!.shares as string);

        erc20.totalUnderlyingSupply = _recomputeERC20TotalUnderlyingSupply(Address.fromBytes(erc20.address));

        if (multiPoolBalance!.amount.gt(BigInt.zero())) {
          const preGrossRate = multiPoolBalance!.amount.gt(BigInt.zero())
            ? preRawUnderlyingSupply.times(BigInt.fromString('1000000000000000000')).div(multiPoolBalance!.amount)
            : BigInt.zero();

          const postGrossRate = multiPoolBalance!.amount.gt(BigInt.zero())
            ? postRawUnderlyingSupply.times(BigInt.fromString('1000000000000000000')).div(multiPoolBalance!.amount)
            : BigInt.zero();

          let grossAPY = BigInt.zero();
          if (postGrossRate.gt(BigInt.zero()) && preGrossRate.gt(BigInt.zero())) {
            grossAPY = postGrossRate
              .times(BigInt.fromString('1000000000000000000'))
              .div(preGrossRate)
              .minus(BigInt.fromString('1000000000000000000'))
              .times(BigInt.fromI64(YEAR))
              .div(period);
          }

          let netAPY = BigInt.zero();
          if (grossAPY.gt(BigInt.zero())) {
            netAPY = grossAPY.times(BigInt.fromI32(10000).minus(multipool!.fees)).div(BigInt.fromI32(10000));
          }

          const integrationRewardEntry = new IntegrationRewardEntry(
            eventUUID(event, [erc20.address.toHexString(), 'IntegrationRewardEntry'])
          );
          integrationRewardEntry.type = 'IntegrationRewardEntry';
          integrationRewardEntry.coverage = coverage;
          integrationRewardEntry.grossReward = rewards.plus(commission);
          integrationRewardEntry.grossELRewards = grossElRewards;
          integrationRewardEntry.grossCLRewards = grossClRewards;
          integrationRewardEntry.netReward = rewards;
          integrationRewardEntry.netELRewards = netElRewards;
          integrationRewardEntry.netCLRewards = netClRewards;
          integrationRewardEntry.netRewardRate = netAPY;
          integrationRewardEntry.grossRewardRate = grossAPY;
          integrationRewardEntry.report = reportEntity.id;
          integrationRewardEntry.createdAt = event.block.timestamp;
          integrationRewardEntry.editedAt = event.block.timestamp;
          integrationRewardEntry.createdAtBlock = event.block.number;
          integrationRewardEntry.editedAtBlock = event.block.number;
          integrationRewardEntry.save();
          pushEntryToSummaries(event, Address.fromBytes(erc20.address), integrationRewardEntry);

          erc20.save();
        } else {
          const integrationRewardEntry = new IntegrationRewardEntry(
            eventUUID(event, [erc20.address.toHexString(), 'IntegrationRewardEntry'])
          );
          integrationRewardEntry.type = 'IntegrationRewardEntry';
          integrationRewardEntry.grossReward = BigInt.zero();
          integrationRewardEntry.netReward = BigInt.zero();
          integrationRewardEntry.coverage = BigInt.zero();
          integrationRewardEntry.grossELRewards = BigInt.zero();
          integrationRewardEntry.grossCLRewards = BigInt.zero();
          integrationRewardEntry.netELRewards = BigInt.zero();
          integrationRewardEntry.netCLRewards = BigInt.zero();
          integrationRewardEntry.netRewardRate = BigInt.zero();
          integrationRewardEntry.grossRewardRate = BigInt.zero();
          integrationRewardEntry.report = reportEntity.id;
          integrationRewardEntry.createdAt = event.block.timestamp;
          integrationRewardEntry.editedAt = event.block.timestamp;
          integrationRewardEntry.createdAtBlock = event.block.number;
          integrationRewardEntry.editedAtBlock = event.block.number;
          integrationRewardEntry.save();
          pushEntryToSummaries(event, Address.fromBytes(erc20.address), integrationRewardEntry);
        }

        const multiPoolRewardsSnapshot = new MultiPoolRewardsSnapshot(
          eventUUID(event, [multipool!.id, reportEntity.epoch.toString()])
        );
        multiPoolRewardsSnapshot.multiPool = multipool!.id;
        multiPoolRewardsSnapshot.report = reportId;
        multiPoolRewardsSnapshot.rewards = rewards;
        multiPoolRewardsSnapshot.clRewards = netClRewards;
        multiPoolRewardsSnapshot.elRewards = netElRewards;
        multiPoolRewardsSnapshot.coverage = coverage;
        multiPoolRewardsSnapshot.commission = commission;
        multiPoolRewardsSnapshot.integrationTotalSupply = erc20.totalSupply;

        multiPoolRewardsSnapshot.createdAt = event.block.timestamp;
        multiPoolRewardsSnapshot.editedAt = event.block.timestamp;
        multiPoolRewardsSnapshot.createdAtBlock = event.block.number;
        multiPoolRewardsSnapshot.editedAtBlock = event.block.number;
        multiPoolRewardsSnapshot.save();
      }
    }
  }

  const systemEvent = createReportProcessedSystemEvent(
    event,
    Address.fromBytes(vFactory.load(pool!.factory)!.address),
    event.address,
    reportEntity.epoch
  );
  systemEvent.report = reportId;
  systemEvent.save();
}

export function handleSetContractLinks(event: SetContractLinks): void {
  const pool = vPool.load(event.address);

  const withdrawalRecipientOld = pool!.withdrawalRecipient;
  const exitQueueOld = pool!.exitQueue;
  const execLayerRecipientOld = pool!.execLayerRecipient;
  const coverageRecipientOld = pool!.coverageRecipient;
  const oracleAggregatorOld = pool!.oracleAggregator;

  pool!.withdrawalRecipient = event.params.withdrawalRecipient;
  pool!.exitQueue = event.params.exitQueue;
  pool!.execLayerRecipient = event.params.execLayerRecipient;
  pool!.coverageRecipient = event.params.coverageRecipient;
  pool!.oracleAggregator = event.params.oracleAggregator;

  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.save();

  {
    const systemEvent = createChangedPoolParameterSystemEvent(
      event,
      vFactory.load(pool!.factory)!.address,
      event.address,
      `withdrawalRecipient`,
      withdrawalRecipientOld.toHexString()
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
      exitQueueOld.toHexString()
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
      execLayerRecipientOld.toHexString()
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
      coverageRecipientOld.toHexString()
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
      oracleAggregatorOld.toHexString()
    );
    systemEvent.newValue = event.params.oracleAggregator.toHexString();
    systemEvent.save();
  }
}

export function handleSetOperatorFee(event: SetOperatorFee): void {
  const pool = vPool.load(event.address);

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
  const pool = vPool.load(event.address);

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
    depositor.pool = event.address;
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

  const pool = vPool.load(event.address);

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
