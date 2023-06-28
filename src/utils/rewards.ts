import { ethereum, BigInt, Address } from '@graphprotocol/graph-ts';
import { RewardSummary, RewardSummaries, vPoolRewardEntry, IntegrationRewardEntry } from "../../generated/schema";
import { entityUUID, externalEntityUUID } from "./utils";

export function getOrCreateRewardSummary(event: ethereum.Event, period: number, name: string): RewardSummary {
	let rs = RewardSummary.load(entityUUID(event, ["summaries", name]));
	if (rs == null) {
		rs = new RewardSummary(entityUUID(event, ["summaries", name]));
		rs.name = name;
		rs.period = BigInt.fromI64(i64(period));
		rs.totalRewards = BigInt.zero();
		rs.entries = [];
		rs.createdAt = event.block.timestamp;
		rs.editedAt = event.block.timestamp;
		rs.createdAtBlock = event.block.number;
		rs.editedAtBlock = event.block.number;

		rs.save();
	}
	return rs;
}

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function getOrCreateRewardSummaries(event: ethereum.Event): RewardSummaries {
	let rs = RewardSummaries.load(entityUUID(event, ["summaries"]));
	if (rs == null) {
		rs = new RewardSummaries(entityUUID(event, ["summaries"]));

		const allTime = getOrCreateRewardSummary(event, 0, "allTime");
		const oneYear = getOrCreateRewardSummary(event, YEAR, "oneYear");
		const sixMonths = getOrCreateRewardSummary(event, 6 * MONTH, "sixMonths");
		const threeMonths = getOrCreateRewardSummary(event, 3 * MONTH, "threeMonths");
		const oneMonth = getOrCreateRewardSummary(event, MONTH, "oneMonth");
		const oneWeek = getOrCreateRewardSummary(event, WEEK, "oneWeek");

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

export function pushEntryToSummary(event: ethereum.Event, addr: Address, name: string) {
	const rs = RewardSummary.load(externalEntityUUID(addr, ["summaries", name])) as RewardSummary;
}

export function pushEntryToSummaries(event: ethereum.Event, addr: Address, entry: vPoolRewardEntry | IntegrationRewardEntry) {
	const rs = RewardSummaries.load(externalEntityUUID(addr, ["summaries"])) as RewardSummaries;
	pushEntryToSummary(event, addr, "allTime");
	pushEntryToSummary(event, addr, "oneYear");
	pushEntryToSummary(event, addr, "sixMonths");
	pushEntryToSummary(event, addr, "threeMonths");
	pushEntryToSummary(event, addr, "oneMonth");
	pushEntryToSummary(event, addr, "oneWeek");

	rs.editedAt = event.block.timestamp;
	rs.editedAtBlock = event.block.number;
	rs.save();
}

