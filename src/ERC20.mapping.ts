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
  UnassignedCommissionSold
} from '../generated/schema';
import {
  Approval,
  CommissionWithdrawn,
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
  getOrCreateUnassignedCommissionSold
} from './utils/utils';
import { CommissionSharesSold } from '../generated/templates/ERC1155/Liquid1155';

function snapshotSupply(event: ethereum.Event): void {
  const blockId = event.block.number;
  const ts = event.block.timestamp;

  const snapshotId = txUniqueUUID(event, [blockId.toString(), ts.toString()]);
  const snapshot = new ERC20Snapshot(snapshotId);

  const integration = ERC20.load(entityUUID(event, []));
  snapshot.totalSupply = integration!.totalSupply;
  snapshot.createdAt = ts;
  snapshot.createdAtBlock = blockId;
  snapshot.integration = entityUUID(event, []);
  snapshot.save();
}

function snapshotBalance(event: ethereum.Event, staker: Address): void {
  const blockId = event.block.number;
  const ts = event.block.timestamp;

  const balance = ERC20Balance.load(entityUUID(event, [staker.toHexString()]));
  const balanceSnapshotId = txUniqueUUID(event, [staker.toHexString(), blockId.toString(), ts.toString()]);
  const balanceSnapshot = new ERC20BalanceSnapshot(balanceSnapshotId);
  balanceSnapshot.integration = entityUUID(event, []);
  balanceSnapshot.staker = staker;
  balanceSnapshot.sharesBalance = balance!.sharesBalance;
  balanceSnapshot.createdAt = ts;
  balanceSnapshot.createdAtBlock = blockId;
  balanceSnapshot.save();
}

export function handleSetName(event: SetName): void {
  const erc20 = ERC20.load(entityUUID(event, []));

  erc20!.name = event.params.name;

  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;

  erc20!.save();
}

export function handleSetSymbol(event: SetSymbol): void {
  const erc20 = ERC20.load(entityUUID(event, []));
  erc20!.symbol = event.params.symbol;

  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;

  erc20!.save();
}

export function handleSetDepositsPaused(event: SetDepositsPaused): void {
  const erc20 = ERC20.load(entityUUID(event, []));
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
  multiPool.pool = externalEntityUUID(poolAddress, []);
  multiPool.active = true;
  multiPool.fees = BigInt.zero();
  multiPool.integration = entityUUID(event, []);
  multiPool.poolAllocation = BigInt.zero();
  multiPool.soldEth = BigInt.zero();
  multiPool.shares = externalEntityUUID(poolAddress, [event.address.toHexString()]);
  multiPool.poolDepositor = externalEntityUUID(poolAddress, [event.address.toHexString()]);

  multiPool.createdAt = event.block.timestamp;
  multiPool.editedAt = event.block.timestamp;
  multiPool.createdAtBlock = event.block.number;
  multiPool.editedAtBlock = event.block.number;

  multiPool.save();

  const erc20 = ERC20.load(externalEntityUUID(event.address, []));
  const pools = erc20!._poolsDerived;
  pools.push(multiPool.id);
  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;
  erc20!._poolsDerived = pools;
  erc20!.save();

  const pool = vPool.load(externalEntityUUID(event.params.poolAddress, []));

  const multiPools = pool!.pluggedMultiPools;
  multiPools.push(multiPool.id);
  pool!.editedAt = event.block.timestamp;
  pool!.editedAtBlock = event.block.number;
  pool!.pluggedMultiPools = multiPools;
  pool!.save();
}

export function handleCommissionSharesSold(event: CommissionSharesSold): void {
  const erc20 = ERC20.load(externalEntityUUID(event.address, []));
  const multiPoolId = erc20!._poolsDerived[event.params.id.toU32()];
  const multiPool = MultiPool.load(multiPoolId);
  multiPool!.soldEth = multiPool!.soldEth.plus(event.params.amountSold);
  const ucs = getOrCreateUnassignedCommissionSold();
  ucs.amount = event.params.amountSold;
  ucs.tx = event.transaction.hash;
  ucs.logIndex = event.logIndex;
  ucs.active = true;
  ucs.save();
}

export function handleVPoolSharesReceived(event: VPoolSharesReceived): void {}

export function handleSetFee(event: SetFee): void {
  const poolId = event.params.poolId;
  const multiPool = MultiPool.load(entityUUID(event, [poolId.toString()]));

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
  const erc20 = ERC20.load(entityUUID(event, []));
  const recipients = event.params.recipients;
  const splits = event.params.splits;
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const split = splits[i];

    const id = entityUUID(event, [recipient.toHexString()]);
    let commission = Commission.load(id);

    if (!commission) {
      commission = new Commission(id);
      commission.vPoolIntegration = erc20!.id;
      commission.withdrawnCommission = BigInt.fromI32(0);
      commission.createdAt = ts;
      commission.createdAtBlock = blockId;
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
  const erc20 = ERC20.load(entityUUID(event, []));
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const id = entityUUID(event, [event.params.withdrawer.toHexString()]);
  const commission = Commission.load(id);
  commission!.withdrawnCommission = commission!.withdrawnCommission.plus(event.params.amountWithdrawn);
  commission!.editedAt = ts;
  commission!.editedAtBlock = blockId;
  commission!.save();

  erc20!.editedAt = ts;
  erc20!.editedAtBlock = blockId;
  erc20!.save();
}

export function handleStake(event: Stake): void {
  const erc20 = ERC20.load(entityUUID(event, []));

  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const staker = event.params.staker;
  const ucs = getOrCreateUnassignedCommissionSold();

  const deposit = new ERC20Deposit(eventUUID(event, [event.address.toHexString(), staker.toHexString()]));
  deposit.integration = entityUUID(event, []);
  deposit.depositAmount = BigInt.zero();
  if (ucs.active && ucs.tx.equals(event.transaction.hash)) {
    deposit.depositAmount = deposit.depositAmount.plus(ucs.amount);
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
    balance.integration = entityUUID(event, []);
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

  ucs.save();
  balance.save();
}

export function handleTransfer(event: Transfer): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const from = event.params.from;
  const to = event.params.to;
  const value = event.params.value;

  const erc20 = ERC20.load(entityUUID(event, []));

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
      balance.integration = entityUUID(event, []);
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

  if (Address.fromByteArray(to).equals(Address.zero())) {
    erc20!.totalSupply = erc20!.totalSupply.minus(value);
    supplyUpdated = true;
  }

  erc20!.save();
  if (supplyUpdated) {
    snapshotSupply(event);
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

  const transferId = eventUUID(event, []);
  const transfer = new ERC20Transfer(transferId);
  transfer.from = from;
  transfer.integration = entityUUID(event, []);
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
    approval.integration = entityUUID(event, []);
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
  const erc20 = ERC20.load(entityUUID(event, []));
  erc20!.admin = event.params.admin;
  erc20!.editedAt = event.block.timestamp;
  erc20!.editedAtBlock = event.block.number;
  erc20!.save();
}

export function handleSetMaxCommission(event: SetMaxCommission): void {
  const erc20 = ERC20.load(entityUUID(event, []));
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
