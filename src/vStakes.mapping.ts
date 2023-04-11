import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { vStakesBalance, vStake, OperatorCommission, vStakesDeposit } from '../generated/schema';
import {
  Transfer,
  CommissionWithdrawn,
  NewCommissionSplit,
  SetIntegratorFee,
  SetName,
  SetPool,
  SetSymbol,
  Stake,
  VPoolSharesReceived
} from '../generated/templates/vStakes/vStakes';

export function handleSetPool(event: SetPool): void {
  const vstake = vStake.load(event.address);
  vstake!.vPool = event.params.poolAddress;

  vstake!.editedAt = event.block.timestamp;
  vstake!.editedAtBlock = event.block.number;

  vstake!.save();
}

export function handleSetName(event: SetName): void {
  const vstake = vStake.load(event.address);
  vstake!.name = event.params.name;

  vstake!.editedAt = event.block.timestamp;
  vstake!.editedAtBlock = event.block.number;

  vstake!.save();
}

export function handleSetSymbol(event: SetSymbol): void {
  const vstake = vStake.load(event.address);
  vstake!.symbol = event.params.symbol;

  vstake!.editedAt = event.block.timestamp;
  vstake!.editedAtBlock = event.block.number;

  vstake!.save();
}

export function handleSetIntegratorFee(event: SetIntegratorFee): void {
  const vstake = vStake.load(event.address);
  vstake!.integratorFee = event.params.operatorFeeBps;

  vstake!.editedAt = event.block.timestamp;
  vstake!.editedAtBlock = event.block.number;

  vstake!.save();
}

export function handleNewCommissionSplit(event: NewCommissionSplit): void {
  const vstake = vStake.load(event.address);
  const recipients = event.params.recipients;
  const splits = event.params.splits;
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const split = splits[i];

    const id = `${vstake!.id.toHexString()}@${recipient.toHexString()}`;
    let commission = OperatorCommission.load(id);

    if (!commission) {
      commission = new OperatorCommission(id);
      commission.vStake = vstake!.id;
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

  vstake!.editedAt = ts;
  vstake!.editedAtBlock = blockId;
  vstake!.save();
}

export function handleNewCommissionWithdrawn(event: CommissionWithdrawn): void {
  const vstake = vStake.load(event.address);
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const id = `${vstake!.id.toHexString()}@${event.params.withdrawer.toHexString()}`;
  const commission = OperatorCommission.load(id);
  commission!.withdrawnCommission = commission!.withdrawnCommission.minus(event.params.amountWithdrawn);
  commission!.editedAt = ts;
  commission!.editedAtBlock = blockId;
  commission!.save();

  vstake!.editedAt = ts;
  vstake!.editedAtBlock = blockId;
  vstake!.save();
}

export function handleStake(event: Stake): void {
  const vstake = vStake.load(event.address);
  const ts = event.block.timestamp;
  const blockId = event.block.number;
  const txHash = event.transaction.hash.toHexString();
  const staker = event.params.staker;

  const depositId = `${vstake!.id.toHexString()}@${staker.toHexString()}@${txHash}`;
  const balanceId = `${vstake!.id.toHexString()}@${staker.toHexString()}`;

  let balance = vStakesBalance.load(balanceId);
  if (!balance) {
    balance = new vStakesBalance(balanceId);
    balance.vStake = vstake!.id;
    balance.staker = staker;
    balance.underlyingBalance = BigInt.fromI32(0);
    balance.sharesBalance = BigInt.fromI32(0);
    balance.createdAt = ts;
    balance.createdAtBlock = blockId;
  }

  balance.underlyingBalance = balance.underlyingBalance.plus(event.params.ethValue);
  balance.sharesBalance = balance.sharesBalance.plus(event.params.shares);
  balance.editedAt = ts;
  balance.editedAtBlock = blockId;
  balance.save();

  let stake = vStakesDeposit.load(depositId);
  if (!stake) {
    stake = new vStakesDeposit(depositId);
    stake.vStake = vstake!.id;
    stake.createdAt = ts;
    stake.createdAtBlock = blockId;
    stake.staker = staker;
    stake.depositAmount = BigInt.fromI32(0);
    stake.mintedShares = BigInt.fromI32(0);
    stake.hash = event.transaction.hash;
  }

  stake.depositAmount = stake.depositAmount.plus(event.params.ethValue);
  stake.mintedShares = stake.mintedShares.plus(event.params.shares);
  stake.editedAt = ts;
  stake.editedAtBlock = blockId;

  stake.save();

  vstake!.editedAt = ts;
  vstake!.editedAtBlock = blockId;
  vstake!.save();
}

export function handleVPoolSharesReceived(event: VPoolSharesReceived): void {
  const vstake = vStake.load(event.address);
  vstake!.totalUnderlyingSupply = vstake!.totalUnderlyingSupply.plus(event.params.amount);

  vstake!.editedAt = event.block.timestamp;
  vstake!.editedAtBlock = event.block.number;

  vstake!.save();
}

export function handleTransfer(event: Transfer): void {
  const vstake = vStake.load(event.address);

  vstake!.totalSupply = vstake!.totalSupply.plus(event.params.value);

  vstake!.editedAt = event.block.timestamp;
  vstake!.editedAtBlock = event.block.number;

  vstake!.save();
}
