import {
  AllowedDonor,
  SuppliedEther,
  UpdatedEtherForCoverage,
  UpdatedSharesForCoverage,
  VoidedShares
} from '../generated/templates/vCoverageRecipient/vCoverageRecipient';
import {
  CoverageDonor,
  CoverageSuppliedEther,
  CoverageVoidedShares,
  vCoverageRecipient,
  vPool
} from '../generated/schema';
import { store, BigInt } from '@graphprotocol/graph-ts';
import {
  createChangedCoverageRecipientParameterSystemEvent,
  createCoverageRecipientUpdatedEthSystemEvent,
  createCoverageRecipientUpdatedSharesSystemEvent,
  entityUUID,
  txUniqueUUID
} from './utils/utils';

export function handleSuppliedEther(event: SuppliedEther): void {
  const cseId = txUniqueUUID(event, [event.address.toHexString()]);
  const cse = new CoverageSuppliedEther(cseId);
  const cr = vCoverageRecipient.load(event.address);

  cse.coverageRecipient = event.address;
  cse.amount = event.params.amount;

  cse.createdAt = event.block.timestamp;
  cse.createdAtBlock = event.block.number;
  cse.editedAt = event.block.timestamp;
  cse.editedAtBlock = event.block.number;

  cr!.totalSuppliedEther = cr!.totalSuppliedEther.plus(event.params.amount);

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();
  cse.save();
}

export function handleVoidedShares(event: VoidedShares): void {
  const cseId = txUniqueUUID(event, [event.address.toHexString()]);
  const cvs = new CoverageVoidedShares(cseId);
  const cr = vCoverageRecipient.load(event.address);

  cvs.coverageRecipient = event.address;
  cvs.amount = event.params.amount;

  cvs.createdAt = event.block.timestamp;
  cvs.createdAtBlock = event.block.number;
  cvs.editedAt = event.block.timestamp;
  cvs.editedAtBlock = event.block.number;

  cr!.totalVoidedShares = cr!.totalVoidedShares.plus(event.params.amount);

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();
  cvs.save();
}

export function handleUpdatedEtherForCoverage(event: UpdatedEtherForCoverage): void {
  const cr = vCoverageRecipient.load(event.address);

  let initialAmount = cr!.totalAvailableEther;

  cr!.totalAvailableEther = event.params.amount;

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();

  const pool = vPool.load(cr!.pool);
  const se = createCoverageRecipientUpdatedEthSystemEvent(event, pool!.factory, cr!.pool, event.address);
  se.delta = se.delta.plus(event.params.amount.minus(initialAmount));
  se.total = event.params.amount;
  se.save();
}

export function handleUpdatedSharesForCoverage(event: UpdatedSharesForCoverage): void {
  const cr = vCoverageRecipient.load(event.address);

  let initialAmount = cr!.totalAvailableShares;

  cr!.totalAvailableShares = event.params.amount;

  cr!.editedAt = event.block.timestamp;
  cr!.editedAtBlock = event.block.number;

  cr!.save();

  const pool = vPool.load(cr!.pool);
  const se = createCoverageRecipientUpdatedSharesSystemEvent(event, pool!.factory, cr!.pool, event.address);
  se.delta = event.params.amount.minus(initialAmount);
  se.total = event.params.amount;
  se.save();
}

export function handleAllowedDonor(event: AllowedDonor): void {
  const donorId = entityUUID(event, [event.params.donorAddress.toHexString()]);

  let oldValue = false;

  let donor = CoverageDonor.load(donorId);

  if (donor == null) {
    if (event.params.allowed) {
      donor = new CoverageDonor(donorId);

      donor.address = event.params.donorAddress;
      donor.coverageRecipient = event.address;

      donor.createdAt = event.block.timestamp;
      donor.createdAtBlock = event.block.number;
      donor.editedAt = event.block.timestamp;
      donor.editedAtBlock = event.block.number;
      donor.save();
    }
  } else {
    oldValue = true;
    if (!event.params.allowed) {
      store.remove('CoverageDonator', donorId);
    } else {
      donor.editedAt = event.block.timestamp;
      donor.editedAtBlock = event.block.number;
      donor.save();
    }
  }

  if (oldValue !== event.params.allowed) {
    const coverageRecipient = vCoverageRecipient.load(event.address);
    const pool = vPool.load(coverageRecipient!.pool);
    const se = createChangedCoverageRecipientParameterSystemEvent(
      event,
      pool!.factory,
      coverageRecipient!.pool,
      event.address,
      `donor[${event.params.donorAddress.toHexString()}]`,
      oldValue.toString()
    );
    se.newValue = event.params.allowed.toString();
    se.save();
  }
}
