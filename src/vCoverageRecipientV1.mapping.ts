import {
  AllowedDonator,
  SuppliedEther,
  UpdatedEtherForCoverage,
  UpdatedSharesForCoverage,
  VoidedShares
} from '../generated/templates/vCoverageRecipient/vCoverageRecipientV1';
import { CoverageDonator, CoverageSuppliedEther, CoverageVoidedShares, vCoverageRecipient } from '../generated/schema';
import { store } from '@graphprotocol/graph-ts';

export function handleSuppliedEther(event: SuppliedEther): void {
  const cseId =
    event.transaction.hash.toHexString() +
    '@' +
    event.transactionLogIndex.toString() +
    '@' +
    event.address.toHexString();
  const cse = new CoverageSuppliedEther(cseId);
  const cr = vCoverageRecipient.load(event.address);

  cse.coverageRecipient = event.address;
  cse.amount = event.params.amount;

  cse.createdAt = event.block.timestamp;
  cse.createdAtBlock = event.block.number;
  cse.editedAt = event.block.timestamp;
  cse.editedAtBlock = event.block.number;

  cr!.totalSuppliedEther = cr!.totalSuppliedEther + event.params.amount;
  cr!.totalAvailableEther = cr!.totalAvailableEther - event.params.amount;

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();
  cse.save();
}

export function handleVoidedShares(event: VoidedShares): void {
  const cseId =
    event.transaction.hash.toHexString() +
    '@' +
    event.transactionLogIndex.toString() +
    '@' +
    event.address.toHexString();
  const cvs = new CoverageVoidedShares(cseId);
  const cr = vCoverageRecipient.load(event.address);

  cvs.coverageRecipient = event.address;
  cvs.amount = event.params.amount;

  cvs.createdAt = event.block.timestamp;
  cvs.createdAtBlock = event.block.number;
  cvs.editedAt = event.block.timestamp;
  cvs.editedAtBlock = event.block.number;

  cr!.totalVoidedShares = cr!.totalVoidedShares + event.params.amount;
  cr!.totalAvailableShares = cr!.totalAvailableShares - event.params.amount;

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();
  cvs.save();
}

export function handleUpdatedEtherForCoverage(event: UpdatedEtherForCoverage): void {
  const cr = vCoverageRecipient.load(event.address);

  cr!.totalAvailableEther = event.params.amount;

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();
}

export function handleUpdatedSharesForCoverage(event: UpdatedSharesForCoverage): void {
  const cr = vCoverageRecipient.load(event.address);

  cr!.totalAvailableShares = event.params.amount;

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();
}

export function handleAllowedDonator(event: AllowedDonator): void {
  const donatorId = event.params.donatorAddress.toHexString() + '@' + event.address.toHexString();

  let donator = CoverageDonator.load(donatorId);

  if (donator == null) {
    if (event.params.allowed) {
      donator = new CoverageDonator(donatorId);

      donator.address = event.params.donatorAddress;
      donator.coverageRecipient = event.address;

      donator.createdAt = event.block.timestamp;
      donator.createdAtBlock = event.block.number;
      donator.editedAt = event.block.timestamp;
      donator.editedAtBlock = event.block.number;
      donator.save();
    }
  } else {
    if (!event.params.allowed) {
      store.remove('CoverageDonator', donatorId);
    } else {
      donator.editedAt = event.block.timestamp;
      donator.editedAtBlock = event.block.number;
      donator.save();
    }
  }
}
