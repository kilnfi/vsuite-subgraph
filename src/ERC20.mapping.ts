import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  ERC20,
  MultiPool,
  Commission,
  ERC20Deposit,
  ERC20Balance,
  ERC20Transfer,
  ERC20Approval
} from '../generated/schema';
import {
  Approval,
  CommissionWithdrawn,
  NewCommissionSplit,
  PoolActivation,
  PoolAdded,
  SetDepositsPaused,
  SetFee,
  SetName,
  SetSymbol,
  Stake,
  Transfer,
  VPoolSharesReceived
} from '../generated/templates/ERC20/Native20';
import { eventUUID, txUniqueUUID, entityUUID } from './utils/utils';

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
  const vPool = event.params.poolAddress;
  const poolId = event.params.id;

  const multiPool = new MultiPool(entityUUID(event, [poolId.toString()]));
  multiPool.number = poolId;
  multiPool.pool = vPool;
  multiPool.active = true;
  multiPool.fees = BigInt.zero();
  multiPool.integration = event.address;
  multiPool.poolAllocation = BigInt.zero();

  multiPool.createdAt = event.block.timestamp;
  multiPool.editedAt = event.block.timestamp;
  multiPool.createdAtBlock = event.block.number;
  multiPool.editedAtBlock = event.block.number;

  multiPool.save();
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
  const erc20 = ERC20.load(event.address);
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
  const erc20 = ERC20.load(event.address);
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
  const erc20 = ERC20.load(event.address);

  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const staker = event.params.staker;

  const depositId = txUniqueUUID(event, [event.address.toHexString(), staker.toHexString()]);
  let deposit = ERC20Deposit.load(depositId);
  if (!deposit) {
    deposit = new ERC20Deposit(depositId);
    deposit.integration = event.address;
    deposit.depositAmount = BigInt.zero();
    // deposit.mintedShares = BigInt.zero();
    deposit.hash = event.transaction.hash;
    deposit.staker = staker;
    deposit.createdAt = ts;
    deposit.createdAtBlock = blockId;
  }

  deposit.depositAmount = deposit.depositAmount.plus(event.params.ethValue);
  erc20!.totalUnderlyingSupply = erc20!.totalUnderlyingSupply.plus(event.params.ethValue);

  deposit.editedAt = ts;
  deposit.editedAtBlock = blockId;

  deposit.save();
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

  if (Address.fromByteArray(from).equals(Address.zero())) {
    erc20!.totalSupply = erc20!.totalSupply.plus(value);
    // const depositId = txUniqueUUID(event, [event.address.toHexString(), to.toHexString()]);
    // const deposit = ERC20Deposit.load(depositId);
    // deposit!.mintedShares = deposit!.mintedShares.plus(value);
    // deposit!.save();

    if (!ERC20Balance.load(balanceToId)) {
      const balance = new ERC20Balance(balanceToId);
      balance.integration = event.address;
      balance.staker = to;
      balance.sharesBalance = BigInt.zero();
      balance.createdAt = ts;
      balance.createdAtBlock = blockId;
      balance.editedAt = ts;
      balance.editedAtBlock = blockId;
      balance.save();
    }
  }

  if (Address.fromByteArray(to).equals(Address.zero())) {
    erc20!.totalSupply = erc20!.totalSupply.minus(value);
  }

  erc20!.save();

  const balanceFrom = ERC20Balance.load(balanceFromId);
  if (balanceFrom) {
    balanceFrom.sharesBalance = balanceFrom.sharesBalance.minus(value);
    balanceFrom.editedAt = ts;
    balanceFrom.editedAtBlock = blockId;
    balanceFrom.save();
  }

  const balanceTo = ERC20Balance.load(balanceToId);
  if (balanceTo) {
    balanceTo.sharesBalance = balanceTo.sharesBalance.plus(value);
    balanceTo.editedAt = ts;
    balanceTo.editedAtBlock = blockId;
    balanceTo.save();
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
