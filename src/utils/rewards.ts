import { ethereum, BigInt, Address } from '@graphprotocol/graph-ts';
import { PeriodRewardSummary, RewardSummary, vPoolRewardEntry, IntegrationRewardEntry } from '../../generated/schema';
import { entityUUID, externalEntityUUID } from './utils';

export function getOrCreateRewardSummary(
  event: ethereum.Event,
  addr: Address,
  period: number,
  name: string
): PeriodRewardSummary {
  let rs = PeriodRewardSummary.load(externalEntityUUID(addr, ['summaries', name]));
  if (rs == null) {
    rs = new PeriodRewardSummary(externalEntityUUID(addr, ['summaries', name]));
    rs.name = name;
    rs.period = BigInt.fromI64(i64(period));
    rs.totalNetRewards = BigInt.zero();
    rs.netRewardRate = BigInt.zero();
    rs.netRewardRateCumulator = BigInt.zero();
    rs.totalGrossRewards = BigInt.zero();
    rs.grossRewardRate = BigInt.zero();
    rs.grossRewardRateCumulator = BigInt.zero();
    rs.entries = [];
    rs.entryCount = BigInt.zero();
    rs.createdAt = event.block.timestamp;
    rs.editedAt = event.block.timestamp;
    rs.createdAtBlock = event.block.number;
    rs.editedAtBlock = event.block.number;

    rs.save();
  }
  return rs;
}

export const SECOND = 1;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

export function getOrCreateRewardSummaries(event: ethereum.Event, addr: Address): RewardSummary {
  let rs = RewardSummary.load(externalEntityUUID(addr, ['summaries']));
  if (rs == null) {
    rs = new RewardSummary(externalEntityUUID(addr, ['summaries']));

    const allTime = getOrCreateRewardSummary(event, addr, 0, 'allTime');
    const oneYear = getOrCreateRewardSummary(event, addr, YEAR, 'oneYear');
    const sixMonths = getOrCreateRewardSummary(event, addr, 6 * MONTH, 'sixMonths');
    const threeMonths = getOrCreateRewardSummary(event, addr, 3 * MONTH, 'threeMonths');
    const oneMonth = getOrCreateRewardSummary(event, addr, MONTH, 'oneMonth');
    const oneWeek = getOrCreateRewardSummary(event, addr, WEEK, 'oneWeek');

    rs.allTime = allTime.id;
    rs.oneYear = oneYear.id;
    rs.sixMonths = sixMonths.id;
    rs.threeMonths = threeMonths.id;
    rs.oneMonth = oneMonth.id;
    rs.oneWeek = oneWeek.id;

    rs.createdAt = event.block.timestamp;
    rs.editedAt = event.block.timestamp;
    rs.createdAtBlock = event.block.number;
    rs.editedAtBlock = event.block.number;

    rs.save();
  }
  return rs;
}

function cleanOutOfRangeEntries(event: ethereum.Event, rs: PeriodRewardSummary): PeriodRewardSummary {
  const entries = rs.entries;
  const period = rs.period;
  let entriesToDelete = 0;
  let oldestEntryId: string | null = '';
  let oldestEntryTimestamp = BigInt.zero();
  for (let i = 0; i < entries.length; ++i) {
    const entry = entries[i];
    if (entry.indexOf('vPoolRewardEntry') != -1) {
      const vpoolEntry = vPoolRewardEntry.load(entry) as vPoolRewardEntry;
      if (vpoolEntry.createdAt.lt(event.block.timestamp.minus(period)) && period.gt(BigInt.zero())) {
        rs.totalNetRewards = rs.totalNetRewards.minus(vpoolEntry.netReward);
        rs.totalGrossRewards = rs.totalGrossRewards.minus(vpoolEntry.grossReward);
        rs.netRewardRateCumulator = rs.netRewardRateCumulator.minus(vpoolEntry.netRewardRate);
        rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.minus(vpoolEntry.grossRewardRate);
        rs.entryCount = rs.entryCount.minus(BigInt.fromI32(1));
        entriesToDelete++;
      } else {
        oldestEntryId = vpoolEntry.id;
        oldestEntryTimestamp = vpoolEntry.createdAt;
        break;
      }
    } else if (entry.indexOf('IntegrationRewardEntry') != -1) {
      const integrationEntry = IntegrationRewardEntry.load(entry) as IntegrationRewardEntry;
      if (integrationEntry.createdAt.lt(event.block.timestamp.minus(period)) && period.gt(BigInt.zero())) {
        rs.totalNetRewards = rs.totalNetRewards.minus(integrationEntry.netReward);
        rs.totalGrossRewards = rs.totalGrossRewards.minus(integrationEntry.grossReward);
        rs.netRewardRateCumulator = rs.netRewardRateCumulator.minus(integrationEntry.netRewardRate);
        rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.minus(integrationEntry.grossRewardRate);
        rs.entryCount = rs.entryCount.minus(BigInt.fromI32(1));
        entriesToDelete++;
      } else {
        oldestEntryId = integrationEntry.id;
        oldestEntryTimestamp = integrationEntry.createdAt;
        break;
      }
    }
  }
  rs.entries = entries.slice(entriesToDelete);
  rs.oldestEntry = oldestEntryId != null ? oldestEntryId : null;
  return rs;
}

export function pushvPoolEntryToSummary(
  event: ethereum.Event,
  addr: Address,
  name: string,
  entry: vPoolRewardEntry
): void {
  let rs = PeriodRewardSummary.load(externalEntityUUID(addr, ['summaries', name])) as PeriodRewardSummary;
  rs = cleanOutOfRangeEntries(event, rs);
  rs.totalNetRewards = rs.totalNetRewards.plus(entry.netReward);
  rs.totalGrossRewards = rs.totalGrossRewards.plus(entry.grossReward);
  rs.netRewardRateCumulator = rs.netRewardRateCumulator.plus(entry.netRewardRate);
  rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.plus(entry.grossRewardRate);
  const entries = rs.entries;
  entries.push(entry.id);
  rs.entryCount = rs.entryCount.plus(BigInt.fromI32(1));
  rs.entries = entries;

  rs.netRewardRate = rs.netRewardRateCumulator.div(rs.entryCount);
  rs.grossRewardRate = rs.grossRewardRateCumulator.div(rs.entryCount);

  rs.save();
}

export function pushvPoolEntryToSummaries(event: ethereum.Event, addr: Address, entry: vPoolRewardEntry): void {
  const rs = RewardSummary.load(externalEntityUUID(addr, ['summaries'])) as RewardSummary;
  pushvPoolEntryToSummary(event, addr, 'allTime', entry);
  pushvPoolEntryToSummary(event, addr, 'oneYear', entry);
  pushvPoolEntryToSummary(event, addr, 'sixMonths', entry);
  pushvPoolEntryToSummary(event, addr, 'threeMonths', entry);
  pushvPoolEntryToSummary(event, addr, 'oneMonth', entry);
  pushvPoolEntryToSummary(event, addr, 'oneWeek', entry);

  rs.editedAt = event.block.timestamp;
  rs.editedAtBlock = event.block.number;
  rs.save();
}

export function pushIntegrationEntryToSummary(
  event: ethereum.Event,
  addr: Address,
  name: string,
  entry: IntegrationRewardEntry
): void {
  let rs = PeriodRewardSummary.load(externalEntityUUID(addr, ['summaries', name])) as PeriodRewardSummary;
  rs = cleanOutOfRangeEntries(event, rs);
  rs.totalNetRewards = rs.totalNetRewards.plus(entry.netReward);
  rs.totalGrossRewards = rs.totalGrossRewards.plus(entry.grossReward);
  rs.netRewardRateCumulator = rs.netRewardRateCumulator.plus(entry.netRewardRate);
  rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.plus(entry.grossRewardRate);
  const entries = rs.entries;
  entries.push(entry.id);
  rs.entryCount = rs.entryCount.plus(BigInt.fromI32(1));
  rs.entries = entries;
  rs.netRewardRate = rs.netRewardRateCumulator.div(rs.entryCount);
  rs.grossRewardRate = rs.grossRewardRateCumulator.div(rs.entryCount);

  rs.save();
}

export function pushIntegrationEntryToSummaries(
  event: ethereum.Event,
  addr: Address,
  entry: IntegrationRewardEntry
): void {
  const rs = RewardSummary.load(externalEntityUUID(addr, ['summaries'])) as RewardSummary;
  pushIntegrationEntryToSummary(event, addr, 'allTime', entry);
  pushIntegrationEntryToSummary(event, addr, 'oneYear', entry);
  pushIntegrationEntryToSummary(event, addr, 'sixMonths', entry);
  pushIntegrationEntryToSummary(event, addr, 'threeMonths', entry);
  pushIntegrationEntryToSummary(event, addr, 'oneMonth', entry);
  pushIntegrationEntryToSummary(event, addr, 'oneWeek', entry);

  rs.editedAt = event.block.timestamp;
  rs.editedAtBlock = event.block.number;
  rs.save();
}
