import { AutoCover, Cub, Fix, TreasuryFeeVote, vTreasury, TreasuryWithdrawal } from '../generated/schema';
import { entityUUID, eventUUID } from './utils/utils';
import { SetAutoCover, SetFee, SetOperator, VoteChanged, Withdraw } from '../generated/templates/vTreasury/vTreasury';

export function handleSetOperator(event: SetOperator): void {
  const treasury = vTreasury.load(event.address);

  treasury!.operator = event.params.operator;

  treasury!.editedAt = event.block.timestamp;
  treasury!.editedAtBlock = event.block.number;
  treasury!.save();
}

export function handleSetFee(event: SetFee): void {
  const treasury = vTreasury.load(event.address);

  treasury!.fee = event.params.fee;

  treasury!.editedAt = event.block.timestamp;
  treasury!.editedAtBlock = event.block.number;
  treasury!.save();
}

export function handleSetAutoCover(event: SetAutoCover): void {
  const autoCoverId = entityUUID(event, ['auto-cover', event.params.pool.toHexString()]);
  const autoCover = new AutoCover(autoCoverId);

  autoCover.treasury = event.address;

  autoCover.autoCoverBps = event.params.autoCover;

  autoCover.createdAt = event.block.timestamp;
  autoCover.createdAtBlock = event.block.number;
  autoCover.editedAt = event.block.timestamp;
  autoCover.editedAtBlock = event.block.number;
  autoCover.save();
}

export function handleWithdraw(event: Withdraw): void {
  const withdrawId = eventUUID(event, ['withdraw']);
  const withdraw = new TreasuryWithdrawal(withdrawId);

  withdraw.treasury = event.address;

  withdraw.operator = event.params.operator;
  withdraw.globalRecipient = event.params.globalRecipient;
  withdraw.revenue = event.params.revenue;
  withdraw.commission = event.params.commission;

  withdraw.createdAt = event.block.timestamp;
  withdraw.createdAtBlock = event.block.number;
  withdraw.editedAt = event.block.timestamp;
  withdraw.editedAtBlock = event.block.number;
  withdraw.save();
}

export function handleVoteChanged(event: VoteChanged): void {
  const voteFeeId = eventUUID(event, ['fee-vote']);
  const vote = new TreasuryFeeVote(voteFeeId);

  vote.treasury = event.address;

  vote.voter = event.params.voter;
  vote.operatorFeeVote = event.params.operatorFeeVote;
  vote.globalRecipientFeeVote = event.params.globalRecipientFeeVote;

  vote.createdAt = event.block.timestamp;
  vote.createdAtBlock = event.block.number;
  vote.editedAt = event.block.timestamp;
  vote.editedAtBlock = event.block.number;
  vote.save();
}
