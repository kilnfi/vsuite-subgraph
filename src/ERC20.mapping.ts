import { Address, BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts';
import {
  ERC20,
  MultiPool,
  Commission,
  ERC20Deposit,
  ERC20Balance,
  ERC20Transfer,
  ERC20Approval,
  vPool,
  ERC20BalanceSnapshot,
  ERC20Snapshot,
  UnassignedCommissionSold,
  PoolBalance,
  DepositDataEntry,
  ExitDataEntry,
  vExitQueue,
  CommissionLoader
} from '../generated/schema';
import { Stake as Stake_1_0_0_rc4 } from '../generated/templates/ERC20_1_0_0_rc4/Native20';
import {
  Approval,
  CommissionWithdrawn,
  Exit,
  NewCommissionSplit,
  PoolActivation,
  PoolAdded,
  SetAdmin,
  SetDepositsPaused,
  SetFee,
  SetMaxCommission,
  SetName,
  SetPoolPercentages,
  SetSymbol,
  Stake,
  Transfer,
  VPoolSharesReceived
} from '../generated/templates/ERC20/Native20';
import {
  eventUUID,
  txUniqueUUID,
  entityUUID,
  externalEntityUUID,
  getOrCreateUnassignedCommissionSold,
  _computeEthAfterCommission,
  _computeIntegratorCommissionEarned,
  createERC20DepositSystemEvent,
  createERC20ExitSystemEvent
} from './utils/utils';
import { CommissionSharesSold, ExitedCommissionShares } from '../generated/templates/ERC1155/Liquid1155';
import { getOrCreateBalance } from './vPool.mapping';
import { pushEntryToSummaries } from './utils/rewards';

function snapshotSupply(event: ethereum.Event): void {
  const blockId = event.block.number;
  const ts = event.block.timestamp;

  const snapshotId = txUniqueUUID(event, [blockId.toString(), ts.toString()]);
  const snapshot = new ERC20Snapshot(snapshotId);

  const integration = ERC20.load(event.address);
  snapshot.totalSupply = integration!.totalSupply;
  snapshot.createdAt = ts;
  snapshot.createdAtBlock = blockId;
  snapshot.integration = event.address;
  snapshot.save();
}

function snapshotBalance(event: ethereum.Event, staker: Address): void {
  const blockId = event.block.number;
  const ts = event.block.timestamp;

  const balance = ERC20Balance.load(entityUUID(event, [staker.toHexString()]));
  const balanceSnapshotId = txUniqueUUID(event, [staker.toHexString(), blockId.toString(), ts.toString()]);
  const balanceSnapshot = new ERC20BalanceSnapshot(balanceSnapshotId);
  const integration = ERC20.load(event.address);
  balanceSnapshot.integration = event.address;
  balanceSnapshot.staker = staker;
  balanceSnapshot.sharesBalance = balance!.sharesBalance;
  balanceSnapshot.createdAt = ts;
  balanceSnapshot.createdAtBlock = blockId;
  balanceSnapshot.totalSupply = integration!.totalSupply;
  balanceSnapshot.totalUnderlyingSupply = integration!.totalUnderlyingSupply;
  balanceSnapshot.save();
}

export function handleSetName(event: SetName): void {
  const erc20 = ERC20.load(event.address);

  erc20!.name = event.params.name;

  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;

  erc20!.save();
}

export function handleSetSymbol(event: SetSymbol): void {
  const erc20 = ERC20.load(event.address);
  erc20!.symbol = event.params.symbol;

  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;

  erc20!.save();
}

export function handleSetDepositsPaused(event: SetDepositsPaused): void {
  const erc20 = ERC20.load(event.address);
  erc20!.paused = event.params.isPaused;

  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;

  erc20!.save();
}

export function handlePoolAdded(event: PoolAdded): void {
  const poolAddress = event.params.poolAddress;
  const poolId = event.params.id;

  const multiPool = new MultiPool(entityUUID(event, [poolId.toString()]));
  multiPool.number = poolId;
  multiPool.pool = poolAddress;
  multiPool.active = true;
  multiPool.fees = BigInt.zero();
  multiPool.integration = event.address;
  multiPool.poolAllocation = BigInt.zero();
  multiPool.soldEth = BigInt.zero();
  multiPool.commissionPaid = BigInt.zero();
  multiPool.injectedEth = BigInt.zero();
  multiPool.exitedEth = BigInt.zero();
  const poolBalance = getOrCreateBalance(
    event.params.poolAddress,
    event.address,
    event.block.timestamp,
    event.block.number
  );
  poolBalance.editedAt = event.block.timestamp;
  poolBalance.editedAtBlock = event.block.number;
  multiPool.shares = poolBalance.id;
  poolBalance.save();

  multiPool.poolDepositor = externalEntityUUID(poolAddress, [event.address.toHexString()]);

  multiPool.createdAt = event.block.timestamp;
  multiPool.editedAt = event.block.timestamp;
  multiPool.createdAtBlock = event.block.number;
  multiPool.editedAtBlock = event.block.number;

  multiPool.save();

  const erc20 = ERC20.load(event.address);
  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;
  erc20!.save();

  const pool = vPool.load(event.params.poolAddress);

  const multiPools = pool!.pluggedMultiPools;
  multiPools.push(multiPool.id);
  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.pluggedMultiPools = multiPools;
  pool!.save();
}

export function handleExitedCommissionShares(event: ExitedCommissionShares): void {
  const erc20 = ERC20.load(event.address);

  const multiPool = MultiPool.load(entityUUID(event, [event.params.poolId.toString()]));
  const poolBalance = PoolBalance.load(multiPool!.shares);
  const pool = vPool.load(multiPool!.pool);
  multiPool!.commissionPaid = _computeIntegratorCommissionEarned(
    poolBalance!.amount,
    pool!.totalSupply,
    pool!.totalUnderlyingSupply,
    multiPool!.injectedEth,
    multiPool!.exitedEth,
    multiPool!.fees
  );
  // multiPool!.exitedEth = multiPool!.exitedEth.plus(event.params.shares.times(pool!.totalUnderlyingSupply).div(pool!.totalSupply));
  multiPool!.save();

  erc20!.totalUnderlyingSupply = _recomputeERC20TotalUnderlyingSupply(Address.fromBytes(erc20!.address));
  erc20!.save();
}

export function handleCommissionSharesSold(event: CommissionSharesSold): void {
  const erc20 = ERC20.load(event.address);

  const multiPool = MultiPool.load(entityUUID(event, [event.params.id.toString()]));
  multiPool!.soldEth = multiPool!.soldEth.plus(event.params.amountSold);
  multiPool!.commissionPaid = multiPool!.commissionPaid.plus(event.params.amountSold);
  multiPool!.save();
  const ucs = getOrCreateUnassignedCommissionSold();
  ucs.amount = event.params.amountSold;
  ucs.tx = event.transaction.hash;
  ucs.logIndex = event.logIndex;
  ucs.active = true;
  ucs.save();

  erc20!.totalUnderlyingSupply = _recomputeERC20TotalUnderlyingSupply(Address.fromBytes(erc20!.address));
  erc20!.save();
}

export function _recomputeERC20TotalUnderlyingSupply(erc20Address: Address): BigInt {
  let idx = 0;
  let multipool = MultiPool.load(externalEntityUUID(erc20Address, [idx.toString()]));
  let totalUnderlyingSupply = BigInt.zero();
  while (multipool != null) {
    const pool = vPool.load(multipool.pool);
    const poolBalance = PoolBalance.load(multipool.shares);
    if (poolBalance == null) {
      ++idx;
      multipool = MultiPool.load(externalEntityUUID(erc20Address, [idx.toString()]));
      continue;
    }
    totalUnderlyingSupply = totalUnderlyingSupply.plus(
      _computeEthAfterCommission(
        poolBalance.amount,
        pool!.totalSupply,
        pool!.totalUnderlyingSupply,
        multipool!.injectedEth,
        multipool!.exitedEth,
        multipool!.fees,
        multipool!.commissionPaid
      )
    );
    ++idx;
    multipool = MultiPool.load(externalEntityUUID(erc20Address, [idx.toString()]));
  }
  return totalUnderlyingSupply;
}

export function handleVPoolSharesReceived(event: VPoolSharesReceived): void {}

export function handleSetFee(event: SetFee): void {
  const poolId = event.params.poolId;
  const multiPool = MultiPool.load(entityUUID(event, [poolId.toString()]));
  const pool = vPool.load(multiPool!.pool);

  if (multiPool != null) {
    const poolBalance = PoolBalance.load(multiPool.shares);
    if (poolBalance != null && poolBalance!.amount.gt(BigInt.zero())) {
      const earnedBeforeFeeUpdate = _computeIntegratorCommissionEarned(
        poolBalance!.amount,
        pool!.totalSupply,
        pool!.totalUnderlyingSupply,
        multiPool.injectedEth,
        multiPool.exitedEth,
        multiPool.fees
      );
      const earnedAfterFeeUpdate = _computeIntegratorCommissionEarned(
        poolBalance!.amount,
        pool!.totalSupply,
        pool!.totalUnderlyingSupply,
        multiPool.injectedEth,
        multiPool.exitedEth,
        event.params.operatorFeeBps
      );
      const paidAndEarnedAfterFeeUpdate = multiPool.commissionPaid.plus(earnedAfterFeeUpdate);
      multiPool.commissionPaid = paidAndEarnedAfterFeeUpdate.minus(earnedBeforeFeeUpdate);
    }
  }

  multiPool!.fees = event.params.operatorFeeBps;

  multiPool!.editedAt = event.block.timestamp;
  multiPool!.editedAtBlock = event.block.number;

  multiPool!.save();
}

export function handlePoolActivation(event: PoolActivation): void {
  const poolId = event.params.id;
  const multiPool = MultiPool.load(entityUUID(event, [poolId.toString()]));

  multiPool!.active = event.params.isActive;

  multiPool!.editedAt = event.block.timestamp;
  multiPool!.editedAtBlock = event.block.number;

  multiPool!.save();
}

export function handleNewCommissionSplit(event: NewCommissionSplit): void {
  const erc20 = ERC20.load(event.address);
  const recipients = event.params.recipients;
  const splits = event.params.splits;
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  // clear out old commission splits
  let idx = 0;
  while (true) {
    const commission = Commission.load(entityUUID(event, [idx.toString()]));
    if (commission != null) {
      commission.commission = BigInt.zero();
      commission.save();
      ++idx;
    } else {
      break;
    }
  }

  const length = idx;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const split = splits[i];

    let commission: Commission | null = null;
    for (let j = 0; j < length; j++) {
      const com = Commission.load(entityUUID(event, [j.toString()]));
      if (com!.recipient.equals(recipient)) {
        commission = com;
        break;
      }
    }

    if (!commission) {
      commission = new Commission(entityUUID(event, [idx.toString()]));
      commission.vPoolIntegration = erc20!.id;
      commission.withdrawnCommission = BigInt.zero();
      commission.createdAt = ts;
      commission.createdAtBlock = blockId;
      ++idx;
    }

    commission.commission = split;
    commission.recipient = recipient;

    commission.editedAt = ts;
    commission.editedAtBlock = blockId;
    commission.save();
  }

  erc20!.editedAt = ts;
  erc20!.editedAtBlock = blockId;
  erc20!.save();
}

export function handleCommissionWithdrawn(event: CommissionWithdrawn): void {
  const erc20 = ERC20.load(event.address);
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  let idx = 0;
  while (true) {
    const commission = Commission.load(entityUUID(event, [idx.toString()]));
    if (commission != null) {
      if (commission.recipient.equals(event.params.withdrawer)) {
        commission.withdrawnCommission = commission.withdrawnCommission.plus(event.params.amountWithdrawn);
        commission.editedAt = ts;
        commission.editedAtBlock = blockId;
        commission.save();

        erc20!.editedAt = ts;
        erc20!.editedAtBlock = blockId;
        erc20!.save();
        break;
      }
      ++idx;
    } else {
      break;
    }
  }
}

export function handleStake_1_0_0_rc4(event: Stake_1_0_0_rc4): void {
  const erc20 = ERC20.load(event.address);

  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const staker = event.params.staker;
  const ucs = getOrCreateUnassignedCommissionSold();

  const deposit = new ERC20Deposit(eventUUID(event, [event.address.toHexString(), staker.toHexString()]));
  deposit.integration = event.address;
  deposit.depositAmount = BigInt.zero();
  if (ucs.active && ucs.tx.equals(event.transaction.hash)) {
    deposit.depositAmount = deposit.depositAmount.plus(ucs.amount);
    createERC20DepositSystemEvent(
      event,
      event.address,
      event.params.staker,
      event.params.ethValue.plus(ucs.amount),
      event.params.sharesBought
    );
  } else {
    createERC20DepositSystemEvent(
      event,
      event.address,
      event.params.staker,
      event.params.ethValue,
      event.params.sharesBought
    );
  }
  deposit.mintedShares = event.params.sharesBought;
  deposit.hash = event.transaction.hash;
  deposit.staker = staker;
  deposit.createdAt = ts;
  deposit.createdAtBlock = blockId;

  deposit.depositAmount = deposit.depositAmount.plus(event.params.ethValue);
  erc20!.totalUnderlyingSupply = erc20!.totalUnderlyingSupply.plus(event.params.ethValue);

  deposit.editedAt = ts;
  deposit.editedAtBlock = blockId;

  deposit.save();
  erc20!.save();

  let balance = ERC20Balance.load(entityUUID(event, [staker.toHexString()]));
  if (balance == null) {
    balance = new ERC20Balance(entityUUID(event, [staker.toHexString()]));
    balance.integration = event.address;
    balance.staker = staker;
    balance.sharesBalance = BigInt.zero();
    balance.totalDeposited = BigInt.zero();
    balance.adjustedTotalDeposited = BigInt.zero();
    balance.createdAt = ts;
    balance.createdAtBlock = blockId;
    balance.editedAt = ts;
    balance.editedAtBlock = blockId;
    balance.save();
  }
  balance.totalDeposited = balance.totalDeposited.plus(event.params.ethValue);
  balance.adjustedTotalDeposited = balance.adjustedTotalDeposited.plus(event.params.ethValue);

  if (ucs.active && ucs.tx.equals(event.transaction.hash)) {
    balance.totalDeposited = balance.totalDeposited.plus(ucs.amount);
    balance.adjustedTotalDeposited = balance.adjustedTotalDeposited.plus(ucs.amount);
    ucs.active = false;
  }

  const poolId = event.params.id;
  const multiPool = MultiPool.load(entityUUID(event, [poolId.toString()]));
  multiPool!.injectedEth = multiPool!.injectedEth.plus(event.params.ethValue);
  multiPool!.editedAt = ts;
  multiPool!.editedAtBlock = blockId;
  multiPool!.save();

  ucs.save();
  balance.save();

  erc20!.totalUnderlyingSupply = _recomputeERC20TotalUnderlyingSupply(Address.fromBytes(erc20!.address));
  erc20!.save();

  const depositDataEntry = new DepositDataEntry(eventUUID(event, ['DepositDataEntry']));
  depositDataEntry.type = 'DepositDataEntry';
  depositDataEntry.depositedEth = event.params.ethValue;
  if (ucs.active && ucs.tx.equals(event.transaction.hash)) {
    depositDataEntry.depositedEth = depositDataEntry.depositedEth.plus(ucs.amount);
  }
  depositDataEntry.createdAt = event.block.timestamp;
  depositDataEntry.editedAt = event.block.timestamp;
  depositDataEntry.createdAtBlock = event.block.number;
  depositDataEntry.editedAtBlock = event.block.number;
  depositDataEntry.save();
  pushEntryToSummaries(event, Address.fromBytes(event.address), depositDataEntry);
}

export function handleStake(event: Stake): void {
  const erc20 = ERC20.load(event.address);

  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const staker = event.params.staker;

  createERC20DepositSystemEvent(event, event.address, staker, event.params.depositedEth, event.params.mintedTokens);

  const deposit = new ERC20Deposit(eventUUID(event, [event.address.toHexString(), staker.toHexString()]));
  deposit.integration = event.address;
  deposit.mintedShares = event.params.mintedTokens;
  deposit.hash = event.transaction.hash;
  deposit.staker = staker;
  deposit.createdAt = ts;
  deposit.createdAtBlock = blockId;
  deposit.depositAmount = event.params.depositedEth;
  erc20!.totalUnderlyingSupply = erc20!.totalUnderlyingSupply.plus(event.params.depositedEth);

  deposit.editedAt = ts;
  deposit.editedAtBlock = blockId;

  deposit.save();
  erc20!.save();

  let balance = ERC20Balance.load(entityUUID(event, [staker.toHexString()]));
  if (balance == null) {
    balance = new ERC20Balance(entityUUID(event, [staker.toHexString()]));
    balance.integration = event.address;
    balance.staker = staker;
    balance.sharesBalance = BigInt.zero();
    balance.totalDeposited = BigInt.zero();
    balance.adjustedTotalDeposited = BigInt.zero();
    balance.createdAt = ts;
    balance.createdAtBlock = blockId;
    balance.editedAt = ts;
    balance.editedAtBlock = blockId;
  }
  balance.totalDeposited = balance.totalDeposited.plus(event.params.depositedEth);
  balance.adjustedTotalDeposited = balance.adjustedTotalDeposited.plus(event.params.depositedEth);

  for (let i = 0; i < event.params.stakeDetails.length; i++) {
    const stakeDetail = event.params.stakeDetails[i];
    const poolId = stakeDetail.poolId;
    const multiPool = MultiPool.load(entityUUID(event, [poolId.toString()]));
    multiPool!.injectedEth = multiPool!.injectedEth.plus(stakeDetail.ethToPool);
    multiPool!.editedAt = ts;
    multiPool!.editedAtBlock = blockId;
    multiPool!.save();
  }

  balance.save();

  erc20!.totalUnderlyingSupply = _recomputeERC20TotalUnderlyingSupply(Address.fromBytes(erc20!.address));
  erc20!.save();

  const depositDataEntry = new DepositDataEntry(eventUUID(event, ['DepositDataEntry']));
  depositDataEntry.type = 'DepositDataEntry';
  depositDataEntry.depositedEth = event.params.depositedEth;
  depositDataEntry.createdAt = event.block.timestamp;
  depositDataEntry.editedAt = event.block.timestamp;
  depositDataEntry.createdAtBlock = event.block.number;
  depositDataEntry.editedAtBlock = event.block.number;
  depositDataEntry.save();
  pushEntryToSummaries(event, Address.fromBytes(event.address), depositDataEntry);
}

export function handleExit(event: Exit): void {
  const erc20 = ERC20.load(event.address);
  const tickets = erc20!.tickets;
  const details = event.params.exitDetails;
  const depositDataEntry = new ExitDataEntry(eventUUID(event, ['ExitDataEntry']));
  depositDataEntry.exitedEth = BigInt.zero();

  let totalETH = BigInt.zero();
  for (let idx = 0; idx < details.length; ++idx) {
    const poolId = details[idx].poolId;
    const exitedShares = details[idx].exitedPoolShares;
    const multiPool = MultiPool.load(entityUUID(event, [poolId.toString()]));
    const pool = vPool.load(multiPool!.pool);
    const ethValue = exitedShares.times(pool!.totalUnderlyingSupply).div(pool!.totalSupply);
    totalETH = totalETH.plus(ethValue);
    depositDataEntry.exitedEth = depositDataEntry.exitedEth.plus(ethValue);
    const exitQueue = vExitQueue.load(pool!.exitQueue);
    const nextTicketIdx = exitQueue!.ticketCount;
    const linkedTicketId = externalEntityUUID(Address.fromBytes(exitQueue!.address), [nextTicketIdx.toString()]);
    tickets.push(linkedTicketId);
  }

  createERC20ExitSystemEvent(event, event.address, event.params.staker, totalETH, event.params.exitedTokens);

  depositDataEntry.type = 'ExitDataEntry';
  depositDataEntry.createdAt = event.block.timestamp;
  depositDataEntry.editedAt = event.block.timestamp;
  depositDataEntry.createdAtBlock = event.block.number;
  depositDataEntry.editedAtBlock = event.block.number;
  depositDataEntry.save();
  pushEntryToSummaries(event, Address.fromBytes(event.address), depositDataEntry);
  erc20!.tickets = tickets;
  erc20!.editedAt = event.block.timestamp;
  erc20!.save();
}

export function handleTransfer(event: Transfer): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const from = event.params.from;
  const to = event.params.to;
  const value = event.params.value;

  const erc20 = ERC20.load(event.address);

  const balanceFromId = entityUUID(event, [from.toHexString()]);
  const balanceToId = entityUUID(event, [to.toHexString()]);

  let supplyUpdated = false;
  if (Address.fromByteArray(from).equals(Address.zero())) {
    erc20!.totalSupply = erc20!.totalSupply.plus(value);
    supplyUpdated = true;
    // const depositId = txUniqueUUID(event, [event.address.toHexString(), to.toHexString()]);
    // const deposit = ERC20Deposit.load(depositId);
    // deposit!.mintedShares = deposit!.mintedShares.plus(value);
    // deposit!.save();

    if (!ERC20Balance.load(balanceToId)) {
      const balance = new ERC20Balance(balanceToId);
      balance.integration = event.address;
      balance.staker = to;
      balance.sharesBalance = BigInt.zero();
      balance.totalDeposited = BigInt.zero();
      balance.adjustedTotalDeposited = BigInt.zero();
      balance.createdAt = ts;
      balance.createdAtBlock = blockId;
      balance.editedAt = ts;
      balance.editedAtBlock = blockId;
      balance.save();
    }
  }

  const balanceFrom = ERC20Balance.load(balanceFromId);
  if (balanceFrom) {
    const balanceBefore = balanceFrom.sharesBalance;
    balanceFrom.sharesBalance = balanceFrom.sharesBalance.minus(value);
    balanceFrom.editedAt = ts;
    balanceFrom.editedAtBlock = blockId;
    balanceFrom.adjustedTotalDeposited = balanceFrom.adjustedTotalDeposited
      .times(balanceFrom.sharesBalance)
      .div(balanceBefore);
    balanceFrom.save();
    snapshotBalance(event, from);
  }

  const balanceTo = ERC20Balance.load(balanceToId);
  if (balanceTo) {
    // in the case of a regular transfer (not mint), we need to adjust the total deposited values
    if (from.notEqual(Address.zero())) {
      const totalSupply = erc20!.totalSupply;
      const totalUnderlyingSupply = erc20!.totalUnderlyingSupply;
      balanceTo.totalDeposited = balanceTo.totalDeposited.plus(value.times(totalUnderlyingSupply).div(totalSupply));
      balanceTo.adjustedTotalDeposited = balanceTo.adjustedTotalDeposited.plus(
        value.times(totalUnderlyingSupply).div(totalSupply)
      );
    }

    balanceTo.sharesBalance = balanceTo.sharesBalance.plus(value);
    balanceTo.editedAt = ts;
    balanceTo.editedAtBlock = blockId;
    balanceTo.save();
    snapshotBalance(event, to);
  }

  if (Address.fromByteArray(to).equals(Address.zero())) {
    erc20!.totalSupply = erc20!.totalSupply.minus(value);
    supplyUpdated = true;
  }

  erc20!.save();
  if (supplyUpdated) {
    snapshotSupply(event);
  }

  const transferId = eventUUID(event, []);
  const transfer = new ERC20Transfer(transferId);
  transfer.from = from;
  transfer.integration = event.address;
  transfer.to = to;
  transfer.amount = value;
  transfer.createdAt = ts;
  transfer.createdAtBlock = blockId;
  transfer.editedAt = ts;
  transfer.editedAtBlock = blockId;
  transfer.save();
}

export function handleApproval(event: Approval): void {
  const owner = event.params.owner;
  const spender = event.params.spender;
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const approvalId = entityUUID(event, [owner.toHexString(), spender.toHexString()]);
  let approval = ERC20Approval.load(approvalId);
  if (!approval) {
    approval = new ERC20Approval(approvalId);
    approval.integration = event.address;
    approval.spender = spender;
    approval.owner = owner;
    approval.createdAt = ts;
    approval.createdAtBlock = blockId;
  }

  approval.allowance = event.params.value;
  approval.editedAt = ts;
  approval.editedAtBlock = blockId;

  approval.save();
}

export function handleSetAdmin(event: SetAdmin): void {
  const erc20 = ERC20.load(event.address);
  erc20!.admin = event.params.admin;
  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;
  erc20!.save();
}

export function handleSetMaxCommission(event: SetMaxCommission): void {
  const erc20 = ERC20.load(event.address);
  erc20!.maxCommission = event.params.maxCommission;
  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;
  erc20!.save();
}

export function handleSetPoolPercentages(event: SetPoolPercentages): void {
  for (let i = 0; i < event.params.split.length; i++) {
    const pool = MultiPool.load(entityUUID(event, [i.toString()]));
    pool!.poolAllocation = event.params.split[i];
    pool!.save();
  }
}
