import {
  AddedOracleAggregatorMember,
  GlobalMemberVoted,
  MemberVoted,
  MemberVotedReportStruct,
  GlobalMemberVotedReportStruct,
  RemovedOracleAggregatorMember,
  SetHighestReportedEpoch,
  SubmittedReport
} from '../generated/templates/vOracleAggregator/vOracleAggregator';
import {
  vOracleAggregator,
  OracleAggregatorMember,
  OracleAggregatorReportVariant,
  OracleAggregatorReportVariantVote,
  vPool,
  Nexus
} from '../generated/schema';
import { Address, BigInt, Bytes, ethereum, store } from '@graphprotocol/graph-ts';
import {
  createChangedOracleAggregatorParameterSystemEvent,
  createOracleMemberVotedSystemEvent,
  entityUUID
} from './utils';

function getQuorum(memberCount: BigInt): BigInt {
  return memberCount.plus(BigInt.fromI32(1)).times(BigInt.fromI32(3)).div(BigInt.fromI32(4)).plus(BigInt.fromI32(1));
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

  oa!.memberCount = oa!.memberCount.plus(BigInt.fromI32(1));
  oa!.quorum = getQuorum(oa!.memberCount);

  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();

  const pool = vPool.load(oa!.pool);

  const se = createChangedOracleAggregatorParameterSystemEvent(
    event,
    Address.fromBytes(pool!.factory),
    Address.fromBytes(oa!.pool),
    event.address,
    `member[${event.params.member.toHexString()}]`,
    'false'
  );
  se.newValue = 'true';
  se.save();
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

    const pool = vPool.load(oa!.pool);

    const se = createChangedOracleAggregatorParameterSystemEvent(
      event,
      Address.fromBytes(pool!.factory),
      Address.fromBytes(oa!.pool),
      event.address,
      `member[${event.params.member.toHexString()}]`,
      'true'
    );
    se.newValue = 'false';
    se.save();
  }

  oa!.memberCount = oa!.memberCount.minus(BigInt.fromI32(1));
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
        const epochDelta = epoch.minus(lastVariant.epoch);
        const pool = vPool.load(oa.pool);
        if (pool != null) {
          const nexus = Nexus.load(pool.nexus);
          if (nexus != null) {
            return epochDelta.times(nexus.slotsPerEpoch).times(nexus.secondsPerSlot);
          }
        }
      }
    }
  }
  return BigInt.zero();
}

export function handleGlobalVote(
  event: ethereum.Event,
  voter: Bytes,
  variant: Bytes,
  report: GlobalMemberVotedReportStruct
): void {
  const oa = vOracleAggregator.load(event.address);

  const variantId = entityUUID(event, [variant.toHexString()]);

  let _variant = OracleAggregatorReportVariant.load(variantId);

  if (_variant === null) {
    _variant = new OracleAggregatorReportVariant(variantId);

    _variant.epoch = report.epoch;
    _variant.balanceSum = report.balanceSum;
    _variant.exitedSum = report.exitedSum;
    _variant.skimmedSum = report.skimmedSum;
    _variant.slashedSum = report.slashedSum;
    _variant.exiting = report.exiting;
    _variant.maxExitable = report.maxExitable;
    _variant.maxCommittable = report.maxCommittable;
    _variant.activatedCount = report.activatedCount;
    _variant.stoppedCount = report.stoppedCount;

    _variant.oracleAggregator = event.address;
    _variant.createdAt = event.block.timestamp;
    _variant.createdAtBlock = event.block.number;

    _variant.submitted = false;
    _variant.voteCount = BigInt.zero();
    _variant.period = timeSinceLastVariant(report.epoch, event.address);
  }

  const voteId = entityUUID(event, [variant.toHexString(), 'globalMember', voter.toHexString()]);
  const vote = new OracleAggregatorReportVariantVote(voteId);
  vote.member = voter;
  vote.globalMember = true;
  vote.variant = variantId;
  vote.createdAt = event.block.timestamp;
  vote.createdAtBlock = event.block.number;
  vote.editedAt = event.block.timestamp;
  vote.editedAtBlock = event.block.number;
  vote.save();

  _variant.voteCount = _variant.voteCount.plus(BigInt.fromI32(1));
  _variant.editedAt = event.block.timestamp;
  _variant.editedAtBlock = event.block.number;
  _variant.save();

  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();

  const pool = vPool.load(oa!.pool);
  const systemEvent = createOracleMemberVotedSystemEvent(
    event,
    Address.fromBytes(pool!.factory),
    Address.fromBytes(oa!.pool),
    event.address,
    Address.fromBytes(voter),
    true
  );
  systemEvent.vote = voteId;
  systemEvent.save();
}

export function handleVote(event: ethereum.Event, voter: Bytes, variant: Bytes, report: MemberVotedReportStruct): void {
  const oa = vOracleAggregator.load(event.address);

  const variantId = entityUUID(event, [variant.toHexString()]);

  let _variant = OracleAggregatorReportVariant.load(variantId);

  if (_variant === null) {
    _variant = new OracleAggregatorReportVariant(variantId);

    _variant.epoch = report.epoch;
    _variant.balanceSum = report.balanceSum;
    _variant.exitedSum = report.exitedSum;
    _variant.skimmedSum = report.skimmedSum;
    _variant.slashedSum = report.slashedSum;
    _variant.exiting = report.exiting;
    _variant.maxExitable = report.maxExitable;
    _variant.maxCommittable = report.maxCommittable;
    _variant.activatedCount = report.activatedCount;
    _variant.stoppedCount = report.stoppedCount;

    _variant.oracleAggregator = event.address;
    _variant.createdAt = event.block.timestamp;
    _variant.createdAtBlock = event.block.number;

    _variant.submitted = false;
    _variant.voteCount = BigInt.zero();
    _variant.period = timeSinceLastVariant(report.epoch, event.address);
  }

  const voteId = entityUUID(event, [variant.toHexString(), 'member', voter.toHexString()]);
  const vote = new OracleAggregatorReportVariantVote(voteId);
  vote.member = voter;
  vote.globalMember = false;
  vote.variant = variantId;
  vote.createdAt = event.block.timestamp;
  vote.createdAtBlock = event.block.number;
  vote.editedAt = event.block.timestamp;
  vote.editedAtBlock = event.block.number;
  vote.save();

  _variant.voteCount = _variant.voteCount.plus(BigInt.fromI32(1));
  _variant.editedAt = event.block.timestamp;
  _variant.editedAtBlock = event.block.number;
  _variant.save();

  oa!.editedAt = event.block.timestamp;
  oa!.editedAtBlock = event.block.number;
  oa!.save();

  const pool = vPool.load(oa!.pool);
  const systemEvent = createOracleMemberVotedSystemEvent(
    event,
    Address.fromBytes(pool!.factory),
    Address.fromBytes(oa!.pool),
    event.address,
    Address.fromBytes(voter),
    false
  );
  systemEvent.vote = voteId;
  systemEvent.save();
}

export function handleMemberVoted(event: MemberVoted): void {
  handleVote(event, event.params.member, event.params.variant, event.params.report);
}

export function handlerGlobalMemberVoted(event: GlobalMemberVoted): void {
  handleGlobalVote(event, event.params.globalMember, event.params.variant, event.params.report);
}

export function handleSubmittedReport(event: SubmittedReport): void {
  const oa = vOracleAggregator.load(event.address);
  const variantId = entityUUID(event, [event.params.variant.toHexString()]);

  const variant = OracleAggregatorReportVariant.load(variantId);

  variant!.submitted = true;
  variant!.save();

  oa!.lastVariant = variantId;
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
