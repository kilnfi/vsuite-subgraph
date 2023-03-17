import {
  AddedOracleAggregatorMember,
  GlobalMemberVoted,
  MemberVoted,
  RemovedOracleAggregatorMember,
  SetHighestReportedEpoch,
  SubmittedReport
} from '../generated/templates/vOracleAggregator/vOracleAggregatorV1';
import {
  vOracleAggregator,
  OracleAggregatorMember,
  OracleAggregatorReportVariant,
  OracleAggregatorReportVariantVote,
  vPool,
  Nexus
} from '../generated/schema';
import { BigInt, Bytes, ethereum, store } from '@graphprotocol/graph-ts';
import { entityUUID } from './utils';

function getQuorum(memberCount: BigInt): BigInt {
  return ((memberCount + BigInt.fromI32(1)) * BigInt.fromI32(3)) / BigInt.fromI32(4) + BigInt.fromI32(1);
}

export function handleAddedOracleAggregatorMember(event: AddedOracleAggregatorMember): void {
  const oa = vOracleAggregator.load(event.address);

  const memberCount = oa!.memberCount.toI32();

  const oaMemberId = entityUUID(event, [memberCount.toString()]);

  const oaMember = new OracleAggregatorMember(oaMemberId);

  oaMember.address = event.params.member;
  oaMember.oracleAggregator = event.address;
  oaMember.index = BigInt.fromI32(memberCount);
  oaMember.createdAt = event.block.timestamp;
  oaMember.createdAtBlock = event.block.number;
  oaMember.editedAt = event.block.timestamp;
  oaMember.editedAtBlock = event.block.number;

  oaMember.save();

  oa!.memberCount = oa!.memberCount + BigInt.fromI32(1);
  oa!.quorum = getQuorum(oa!.memberCount);

  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();
}

export function handleRemovedOracleAggregatorMember(event: RemovedOracleAggregatorMember): void {
  const oa = vOracleAggregator.load(event.address);

  const memberCount = oa!.memberCount.toI32();
  let removedMemberIndex = -1;

  for (let idx = 0; idx < oa!.memberCount.toI32(); ++idx) {
    const oaMemberId = entityUUID(event, [idx.toString()]);

    const oaMember = OracleAggregatorMember.load(oaMemberId);

    if (oaMember!.address == event.params.member) {
      removedMemberIndex = idx;
      break;
    }
  }

  if (removedMemberIndex == -1) {
    throw new Error('CANNOT FIND REMOVED MEMBER');
  }

  if (removedMemberIndex == memberCount - 1) {
    const oaMemberId = entityUUID(event, [removedMemberIndex.toString()]);
    store.remove('OracleAggregatorMember', oaMemberId);
  } else {
    const removedOaMemberId = entityUUID(event, [(memberCount - 1).toString()]);
    const swapOaMemberId = entityUUID(event, [removedMemberIndex.toString()]);

    const removedOaMember = OracleAggregatorMember.load(removedOaMemberId);
    const swapOaMember = OracleAggregatorMember.load(swapOaMemberId);

    swapOaMember!.address = removedOaMember!.address;

    swapOaMember!.editedAt = event.block.timestamp;
    swapOaMember!.editedAtBlock = event.block.number;

    store.remove('OracleAggregatorMember', removedOaMemberId);
    swapOaMember!.save();
  }

  oa!.memberCount = oa!.memberCount - BigInt.fromI32(1);
  oa!.quorum = getQuorum(oa!.memberCount);

  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();
}

function timeSinceLastVariant(epoch: BigInt, oracleAggregatorAddress: Bytes): BigInt {
  const oa = vOracleAggregator.load(oracleAggregatorAddress);

  if (oa != null) {
    if (oa.lastVariant != null) {
      const lastVariant = OracleAggregatorReportVariant.load(oa.lastVariant as string);
      if (lastVariant != null) {
        if (lastVariant.epoch == epoch) {
          return lastVariant.period;
        }
        const epochDelta = epoch - lastVariant.epoch;
        const pool = vPool.load(oa.pool);
        if (pool != null) {
          const nexus = Nexus.load(pool.nexus);
          if (nexus != null) {
            return epochDelta * nexus.slotsPerEpoch * nexus.secondsPerSlot;
          }
        }
      }
    }
  }
  return BigInt.zero();
}

export function handleVote(
  event: ethereum.Event,
  globalMember: boolean,
  voter: Bytes,
  epoch: BigInt,
  validatorCount: BigInt,
  balanceSum: BigInt,
  slashedBalanceSum: BigInt
): void {
  const oa = vOracleAggregator.load(event.address);

  const variantId = entityUUID(event, [
    epoch.toString(),
    validatorCount.toString(),
    balanceSum.toString(),
    slashedBalanceSum.toString()
  ]);

  let variant = OracleAggregatorReportVariant.load(variantId);

  if (variant === null) {
    variant = new OracleAggregatorReportVariant(variantId);
    variant.epoch = epoch;
    variant.validatorCount = validatorCount;
    variant.validatorBalanceSum = balanceSum;
    variant.validatorSlashedBalanceSum = slashedBalanceSum;
    variant.submitted = false;
    variant.voteCount = BigInt.zero();
    variant.period = timeSinceLastVariant(epoch, event.address);
    variant.oracleAggregator = event.address;
    variant.createdAt = event.block.timestamp;
    variant.createdAtBlock = event.block.number;
  }

  const voteId = entityUUID(event, [
    epoch.toString(),
    validatorCount.toString(),
    balanceSum.toString(),
    slashedBalanceSum.toString(),
    globalMember ? 'globalMember' : 'member',
    voter.toHexString()
  ]);
  const vote = new OracleAggregatorReportVariantVote(voteId);
  vote.member = voter;
  vote.globalMember = globalMember;
  vote.variant = variantId;
  vote.createdAt = event.block.timestamp;
  vote.createdAtBlock = event.block.number;
  vote.editedAt = event.block.timestamp;
  vote.editedAtBlock = event.block.number;
  vote.save();

  variant.voteCount = variant.voteCount + BigInt.fromI32(1);
  variant.editedAt = event.block.timestamp;
  variant.editedAtBlock = event.block.number;
  variant.save();

  oa!.lastVariant = variantId;
  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();
}

export function handleMemberVoted(event: MemberVoted): void {
  handleVote(
    event,
    false,
    event.params.member,
    event.params.epoch,
    event.params.validatorCount,
    event.params.balanceSum,
    event.params.slashedBalanceSum
  );
}

export function handlerGlobalMemberVoted(event: GlobalMemberVoted): void {
  handleVote(
    event,
    true,
    event.params.globalMember,
    event.params.epoch,
    event.params.validatorCount,
    event.params.balanceSum,
    event.params.slashedBalanceSum
  );
}

export function handleSubmittedReport(event: SubmittedReport): void {
  const oa = vOracleAggregator.load(event.address);
  const variantId = entityUUID(event, [
    event.params.epoch.toString(),
    event.params.validatorCount.toString(),
    event.params.balanceSum.toString(),
    event.params.slashedBalanceSum.toString()
  ]);

  const variant = OracleAggregatorReportVariant.load(variantId);

  variant!.submitted = true;

  variant!.save();
  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();
}

export function handleSetHighestReportedEpoch(event: SetHighestReportedEpoch): void {
  const oa = vOracleAggregator.load(event.address);
  oa!.highestReportedEpoch = event.params.epoch;
  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();
}
