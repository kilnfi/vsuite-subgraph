import { ethereum, BigInt, Address, Entity } from '@graphprotocol/graph-ts';
import {
  PeriodRewardSummary,
  RewardSummary,
  vPoolRewardEntry,
  IntegrationRewardEntry,
  vPool,
  DepositDataEntry,
  ExitDataEntry
} from '../../generated/schema';
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
    rs.totalNetCLRewards = BigInt.zero();
    rs.totalNetELRewards = BigInt.zero();
    rs.totalGrossCLRewards = BigInt.zero();
    rs.totalGrossELRewards = BigInt.zero();
    rs.totalCoverage = BigInt.zero();
    rs.grossRewardRate = BigInt.zero();
    rs.grossRewardRateCumulator = BigInt.zero();
    rs.depositedEth = BigInt.zero();
    rs.exitedEth = BigInt.zero();
    rs.entries = [];
    rs.entryCounts = [];
    rs.entryTypes = [];
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
  if (period.equals(BigInt.zero())) {
    if (entries.length > 0) {
      oldestEntryId = entries[0];
    }
    rs.oldestEntry = oldestEntryId != null ? oldestEntryId : null;
    return rs;
  }
  for (let i = 0; i < entries.length; ++i) {
    const entry = entries[i];
    if (entry.indexOf('vPoolRewardEntry') != -1) {
      const vpoolEntry = vPoolRewardEntry.load(entry) as vPoolRewardEntry;
      if (vpoolEntry.createdAt.lt(event.block.timestamp.minus(period))) {
        rs.totalNetRewards = rs.totalNetRewards.minus(vpoolEntry.netReward);
        rs.totalGrossRewards = rs.totalGrossRewards.minus(vpoolEntry.grossReward);
        rs.totalCoverage = rs.totalCoverage.minus(vpoolEntry.coverage);
        rs.totalGrossCLRewards = rs.totalGrossCLRewards.minus(vpoolEntry.grossCLRewards);
        rs.totalGrossELRewards = rs.totalGrossELRewards.minus(vpoolEntry.grossELRewards);
        rs.totalNetCLRewards = rs.totalNetCLRewards.minus(vpoolEntry.netCLRewards);
        rs.totalNetELRewards = rs.totalNetELRewards.minus(vpoolEntry.netELRewards);
        rs.netRewardRateCumulator = rs.netRewardRateCumulator.minus(vpoolEntry.netRewardRate);
        rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.minus(vpoolEntry.grossRewardRate);

        const addRes = unregisterEntryFromCounts('vPoolRewardEntry', rs.entryTypes, rs.entryCounts);
        rs.entryTypes = addRes.types;
        rs.entryCounts = addRes.counts;

        entriesToDelete++;
      } else {
        oldestEntryId = vpoolEntry.id;
        break;
      }
    } else if (entry.indexOf('IntegrationRewardEntry') != -1) {
      const integrationEntry = IntegrationRewardEntry.load(entry) as IntegrationRewardEntry;
      if (integrationEntry.createdAt.lt(event.block.timestamp.minus(period))) {
        rs.totalNetRewards = rs.totalNetRewards.minus(integrationEntry.netReward);
        rs.totalGrossRewards = rs.totalGrossRewards.minus(integrationEntry.grossReward);
        rs.totalCoverage = rs.totalCoverage.minus(integrationEntry.coverage);
        rs.totalGrossCLRewards = rs.totalGrossCLRewards.minus(integrationEntry.grossCLRewards);
        rs.totalGrossELRewards = rs.totalGrossELRewards.minus(integrationEntry.grossELRewards);
        rs.totalNetCLRewards = rs.totalNetCLRewards.minus(integrationEntry.netCLRewards);
        rs.totalNetELRewards = rs.totalNetELRewards.minus(integrationEntry.netELRewards);
        rs.netRewardRateCumulator = rs.netRewardRateCumulator.minus(integrationEntry.netRewardRate);
        rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.minus(integrationEntry.grossRewardRate);

        const addRes = unregisterEntryFromCounts('IntegrationRewardEntry', rs.entryTypes, rs.entryCounts);
        rs.entryTypes = addRes.types;
        rs.entryCounts = addRes.counts;

        entriesToDelete++;
      } else {
        oldestEntryId = integrationEntry.id;
        break;
      }
    } else if (entry.indexOf('DepositDataEntry') != -1) {
      const depositDataEntry = DepositDataEntry.load(entry) as DepositDataEntry;
      if (depositDataEntry.createdAt.lt(event.block.timestamp.minus(period))) {
        rs.depositedEth = rs.depositedEth.minus(depositDataEntry.depositedEth);

        const addRes = unregisterEntryFromCounts('DepositDataEntry', rs.entryTypes, rs.entryCounts);
        rs.entryTypes = addRes.types;
        rs.entryCounts = addRes.counts;

        entriesToDelete++;
      } else {
        oldestEntryId = depositDataEntry.id;
        break;
      }
    } else if (entry.indexOf('ExitDataEntry') != -1) {
      const exitDataEntry = ExitDataEntry.load(entry) as ExitDataEntry;
      if (exitDataEntry.createdAt.lt(event.block.timestamp.minus(period))) {
        rs.exitedEth = rs.exitedEth.minus(exitDataEntry.exitedEth);

        const addRes = unregisterEntryFromCounts('ExitDataEntry', rs.entryTypes, rs.entryCounts);
        rs.entryTypes = addRes.types;
        rs.entryCounts = addRes.counts;

        entriesToDelete++;
      } else {
        oldestEntryId = exitDataEntry.id;
        break;
      }
    }
  }
  rs.entries = entries.slice(entriesToDelete);
  rs.oldestEntry = oldestEntryId != null ? oldestEntryId : null;
  return rs;
}

class EntryCountRegistrationResult {
  types: string[];
  counts: BigInt[];
}

function registerEntryToCounts(
  entryType: string,
  entryTypes: string[],
  entryCounts: BigInt[]
): EntryCountRegistrationResult {
  if (entryTypes.length !== entryCounts.length) {
    throw new Error('invalid entry count and types lengths');
  }
  const typeIndex = entryTypes.indexOf(entryType);
  if (typeIndex === -1) {
    entryTypes.push(entryType);
    entryCounts.push(BigInt.fromI32(1));
  } else {
    entryCounts[typeIndex] = entryCounts[typeIndex].plus(BigInt.fromI32(1));
  }

  return {
    types: entryTypes,
    counts: entryCounts
  };
}

function unregisterEntryFromCounts(
  entryType: string,
  entryTypes: string[],
  entryCounts: BigInt[]
): EntryCountRegistrationResult {
  if (entryTypes.length !== entryCounts.length) {
    throw new Error('invalid entry count and types lengths');
  }
  const typeIndex = entryTypes.indexOf(entryType);
  if (typeIndex === -1) {
    throw new Error('invalid entry unregister while type does not exist');
  } else {
    entryCounts[typeIndex] = entryCounts[typeIndex].minus(BigInt.fromI32(1));
  }

  return {
    types: entryTypes,
    counts: entryCounts
  };
}

function getTypeCount(types: string[], entryTypes: string[], entryCounts: BigInt[]): BigInt {
  let res = BigInt.zero();
  for (let idx = 0; idx < types.length; ++idx) {
    const typeIndex = entryTypes.indexOf(types[idx]);
    if (typeIndex !== -1) {
      res = res.plus(entryCounts[typeIndex]);
    }
  }
  return res;
}

function pushEntryToSummary(event: ethereum.Event, addr: Address, name: string, _entry: Entity): void {
  const entryId = _entry.getString('id');
  let rs = PeriodRewardSummary.load(externalEntityUUID(addr, ['summaries', name])) as PeriodRewardSummary;
  if (entryId.includes('vPoolRewardEntry')) {
    const entry = _entry as vPoolRewardEntry;
    rs = cleanOutOfRangeEntries(event, rs);
    rs.totalNetRewards = rs.totalNetRewards.plus(entry.netReward);
    rs.totalGrossRewards = rs.totalGrossRewards.plus(entry.grossReward);
    rs.totalCoverage = rs.totalCoverage.plus(entry.coverage);
    rs.totalGrossCLRewards = rs.totalGrossCLRewards.plus(entry.grossCLRewards);
    rs.totalGrossELRewards = rs.totalGrossELRewards.plus(entry.grossELRewards);
    rs.totalNetCLRewards = rs.totalNetCLRewards.plus(entry.netCLRewards);
    rs.totalNetELRewards = rs.totalNetELRewards.plus(entry.netELRewards);
    rs.netRewardRateCumulator = rs.netRewardRateCumulator.plus(entry.netRewardRate);
    rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.plus(entry.grossRewardRate);

    const addRes = registerEntryToCounts('vPoolRewardEntry', rs.entryTypes, rs.entryCounts);
    rs.entryTypes = addRes.types;
    rs.entryCounts = addRes.counts;

    const rewardEntryCount = getTypeCount(['vPoolRewardEntry'], rs.entryTypes, rs.entryCounts);
    rs.netRewardRate = rs.netRewardRateCumulator.div(rewardEntryCount);
    rs.grossRewardRate = rs.grossRewardRateCumulator.div(rewardEntryCount);

    const entries = rs.entries;
    entries.push(entry.id);
    rs.entries = entries;

    rs.save();
  } else if (entryId.includes('IntegrationRewardEntry')) {
    const entry = _entry as IntegrationRewardEntry;
    rs = cleanOutOfRangeEntries(event, rs);
    rs.totalNetRewards = rs.totalNetRewards.plus(entry.netReward);
    rs.totalGrossRewards = rs.totalGrossRewards.plus(entry.grossReward);
    rs.totalCoverage = rs.totalCoverage.plus(entry.coverage);
    rs.totalGrossCLRewards = rs.totalGrossCLRewards.plus(entry.grossCLRewards);
    rs.totalGrossELRewards = rs.totalGrossELRewards.plus(entry.grossELRewards);
    rs.totalNetCLRewards = rs.totalNetCLRewards.plus(entry.netCLRewards);
    rs.totalNetELRewards = rs.totalNetELRewards.plus(entry.netELRewards);
    rs.netRewardRateCumulator = rs.netRewardRateCumulator.plus(entry.netRewardRate);
    rs.grossRewardRateCumulator = rs.grossRewardRateCumulator.plus(entry.grossRewardRate);

    const addRes = registerEntryToCounts('IntegrationRewardEntry', rs.entryTypes, rs.entryCounts);
    rs.entryTypes = addRes.types;
    rs.entryCounts = addRes.counts;

    const rewardEntryCount = getTypeCount(['IntegrationRewardEntry'], rs.entryTypes, rs.entryCounts);
    rs.netRewardRate = rs.netRewardRateCumulator.div(rewardEntryCount);
    rs.grossRewardRate = rs.grossRewardRateCumulator.div(rewardEntryCount);

    const entries = rs.entries;
    entries.push(entry.id);
    rs.entries = entries;

    rs.save();
  } else if (entryId.includes('DepositDataEntry')) {
    const entry = _entry as DepositDataEntry;
    rs = cleanOutOfRangeEntries(event, rs);
    rs.depositedEth = rs.depositedEth.plus(entry.depositedEth);

    const addRes = registerEntryToCounts('DepositDataEntry', rs.entryTypes, rs.entryCounts);
    rs.entryTypes = addRes.types;
    rs.entryCounts = addRes.counts;

    const entries = rs.entries;
    entries.push(entry.id);
    rs.entries = entries;

    rs.save();
  } else if (entryId.includes('ExitDataEntry')) {
    const entry = _entry as ExitDataEntry;
    rs = cleanOutOfRangeEntries(event, rs);
    rs.exitedEth = rs.exitedEth.plus(entry.exitedEth);

    const addRes = registerEntryToCounts('ExitDataEntry', rs.entryTypes, rs.entryCounts);
    rs.entryTypes = addRes.types;
    rs.entryCounts = addRes.counts;

    const entries = rs.entries;
    entries.push(entry.id);
    rs.entries = entries;

    rs.save();
  } else {
    throw new Error('Unknown entry');
  }
}

export function pushEntryToSummaries(event: ethereum.Event, addr: Address, entry: Entity): void {
  const rs = RewardSummary.load(externalEntityUUID(addr, ['summaries'])) as RewardSummary;
  pushEntryToSummary(event, addr, 'allTime', entry);
  pushEntryToSummary(event, addr, 'oneYear', entry);
  pushEntryToSummary(event, addr, 'sixMonths', entry);
  pushEntryToSummary(event, addr, 'threeMonths', entry);
  pushEntryToSummary(event, addr, 'oneMonth', entry);
  pushEntryToSummary(event, addr, 'oneWeek', entry);

  rs.editedAt = event.block.timestamp;
  rs.editedAtBlock = event.block.number;
  rs.save();
}
