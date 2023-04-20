import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  ERC1155Integration,
  MultiPool,
  Commission,
  ERC1155,
  ERC1155Deposit,
  ERC1155Balance,
  ERC1155Transfer,
  ERC1155Approval
} from '../generated/schema';
import {
  ApprovalForAll,
  CommissionWithdrawn,
  NewCommissionSplit,
  PoolActivation,
  PoolAdded,
  SetDepositsPaused,
  SetFee,
  SetName,
  SetSymbol,
  SetURIPrefix,
  Stake,
  TransferBatch,
  TransferSingle,
  VPoolSharesReceived
} from '../generated/templates/ERC1155/Liquid1155';
import { eventUUID, txUniqueUUID, entityUUID, externalEntityUUID } from './utils/utils';

export function handleSetName(event: SetName): void {
  const erc1155 = ERC1155Integration.load(event.address);

  erc1155!.name = event.params.name;

  erc1155!.editedAt = event.block.timestamp;
  erc1155!.editedAtBlock = event.block.number;

  erc1155!.save();
}

export function handleSetURIPrefix(event: SetURIPrefix): void {
  const erc1155 = ERC1155Integration.load(event.address);

  erc1155!.uriPrefix = event.params.uri;

  erc1155!.editedAt = event.block.timestamp;
  erc1155!.editedAtBlock = event.block.number;

  erc1155!.save();
}

export function handleSetSymbol(event: SetSymbol): void {
  const erc1155 = ERC1155Integration.load(event.address);
  erc1155!.symbol = event.params.symbol;

  erc1155!.editedAt = event.block.timestamp;
  erc1155!.editedAtBlock = event.block.number;

  erc1155!.save();
}

export function handleSetDepositsPaused(event: SetDepositsPaused): void {
  const erc1155 = ERC1155Integration.load(event.address);
  erc1155!.paused = event.params.isPaused;

  erc1155!.editedAt = event.block.timestamp;
  erc1155!.editedAtBlock = event.block.number;

  erc1155!.save();
}

export function handlePoolAdded(event: PoolAdded): void {
  const vPool = event.params.poolAddress;
  const poolId = event.params.id;

  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const tokenAndPoolId = entityUUID(event, [poolId.toString()]);
  const multiPool = new MultiPool(tokenAndPoolId);
  multiPool.number = poolId;
  multiPool.pool = vPool;
  multiPool.active = true;
  multiPool.fees = BigInt.zero();
  multiPool.integration = event.address;
  multiPool.poolAllocation = BigInt.zero();

  multiPool.createdAt = ts;
  multiPool.editedAt = ts;
  multiPool.createdAtBlock = blockId;
  multiPool.editedAtBlock = blockId;

  multiPool.save();

  const erc1155 = new ERC1155(tokenAndPoolId);
  erc1155.pool = tokenAndPoolId;
  erc1155.integration = event.address;
  erc1155.tokenId = poolId;
  erc1155.totalSupply = BigInt.zero();
  erc1155.totalUnderlyingSupply = BigInt.zero();

  erc1155.createdAt = ts;
  erc1155.editedAt = ts;
  erc1155.createdAtBlock = blockId;
  erc1155.editedAtBlock = blockId;

  erc1155.save();
}

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
  const erc1155 = ERC1155Integration.load(event.address);
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
      commission.vPoolIntegration = erc1155!.id;
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

  erc1155!.editedAt = ts;
  erc1155!.editedAtBlock = blockId;
  erc1155!.save();
}

export function handleCommissionWithdrawn(event: CommissionWithdrawn): void {
  const erc1155 = ERC1155Integration.load(event.address);
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const id = entityUUID(event, [event.params.withdrawer.toHexString()]);
  const commission = Commission.load(id);
  commission!.withdrawnCommission = commission!.withdrawnCommission.plus(event.params.amountWithdrawn);
  commission!.editedAt = ts;
  commission!.editedAtBlock = blockId;
  commission!.save();

  erc1155!.editedAt = ts;
  erc1155!.editedAtBlock = blockId;
  erc1155!.save();
}

export function handleStake(event: Stake): void {
  const tokenId = event.params.id;
  const erc1155 = ERC1155.load(entityUUID(event, [tokenId.toString()]));
  const erc1155Integration = ERC1155Integration.load(event.address);

  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const staker = event.params.staker;
  const value = event.params.ethValue;

  const depositId = eventUUID(event, [event.address.toHexString(), tokenId.toString(), staker.toHexString()]);
  const deposit = new ERC1155Deposit(depositId);
  deposit.token = erc1155!.id;
  deposit.depositAmount = BigInt.zero();
  // deposit.mintedShares = BigInt.zero();
  deposit.hash = event.transaction.hash;
  deposit.staker = staker;

  deposit.depositAmount = value;

  deposit.editedAt = ts;
  deposit.editedAtBlock = blockId;
  deposit.createdAt = ts;
  deposit.createdAtBlock = blockId;

  erc1155!.totalUnderlyingSupply = erc1155!.totalUnderlyingSupply.plus(value);
  erc1155Integration!.totalUnderlyingSupply = erc1155Integration!.totalUnderlyingSupply.plus(value);

  deposit.save();
  erc1155!.save();
  erc1155Integration!.save();
}

function _transfer(
  event: ethereum.Event,
  operator: Address,
  from: Address,
  to: Address,
  tokenId: BigInt,
  amount: BigInt
): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const erc1155 = ERC1155.load(entityUUID(event, [tokenId.toString()]));
  const balanceFromId = entityUUID(event, [tokenId.toString(), from.toHexString()]);
  const balanceToId = entityUUID(event, [tokenId.toString(), to.toHexString()]);

  if (from.equals(Address.zero())) {
    erc1155!.totalSupply = erc1155!.totalSupply.plus(amount);
    if (!ERC1155Balance.load(balanceToId)) {
      const balanceTo = new ERC1155Balance(balanceToId);
      balanceTo.token = erc1155!.id;
      balanceTo.staker = to;
      balanceTo.tokenBalance = BigInt.zero();
      balanceTo.createdAt = ts;
      balanceTo.createdAtBlock = blockId;
      balanceTo.editedAt = ts;
      balanceTo.editedAtBlock = blockId;
      balanceTo.save();
    }
  }
  if (to.equals(Address.zero())) {
    erc1155!.totalSupply = erc1155!.totalSupply.minus(amount);
  }
  erc1155!.save();

  const balanceFrom = ERC1155Balance.load(balanceFromId);
  const balanceTo = ERC1155Balance.load(balanceToId);
  if (balanceFrom) {
    balanceFrom.tokenBalance = balanceFrom.tokenBalance.minus(amount);
    balanceFrom.editedAt = ts;
    balanceFrom.editedAtBlock = blockId;
    balanceFrom.save();
  }

  if (balanceTo) {
    balanceTo.tokenBalance = balanceTo.tokenBalance.plus(amount);
    balanceTo.editedAt = ts;
    balanceTo.editedAtBlock = blockId;
    balanceTo.save();
  }

  const transferId = eventUUID(event, [tokenId.toString()]);
  const transfer = new ERC1155Transfer(transferId);
  transfer.token = erc1155!.id;
  transfer.by = operator;
  transfer.from = from;
  transfer.to = to;
  transfer.amount = amount;
  transfer.createdAt = ts;
  transfer.createdAtBlock = blockId;
  transfer.editedAt = ts;
  transfer.editedAtBlock = blockId;

  transfer.save();
}

export function handleTransferSingle(event: TransferSingle): void {
  _transfer(event, event.params.operator, event.params.from, event.params.to, event.params.id, event.params.value);
}

export function handleTransferBatch(event: TransferBatch): void {
  for (let i = 0; i < event.params.ids.length; i++) {
    _transfer(
      event,
      event.params.operator,
      event.params.from,
      event.params.to,
      event.params.ids[i],
      event.params.values[i]
    );
  }
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const id = entityUUID(event, [event.params.account.toHexString(), event.params.operator.toHexString()]);
  let approval = ERC1155Approval.load(id);
  if (!approval) {
    approval = new ERC1155Approval(id);
    approval.owner = event.params.account;
    approval.operator = event.params.operator;
    approval.createdAt = ts;
    approval.createdAtBlock = blockId;
  }

  approval.approval = event.params.approved;
  approval.editedAt = ts;
  approval.editedAtBlock = blockId;
  approval.save();
}

export function handleVPoolSharesReceived(event: VPoolSharesReceived): void {}
