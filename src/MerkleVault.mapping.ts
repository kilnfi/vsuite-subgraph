import { MerkleVault, VaultClaim } from '../generated/schema';
import { Claimed, SetFrameSize, SetRootAndIpfsHash } from '../generated/templates/MerkleVault/MerkleVault';
import { eventUUID } from './utils/utils';

export function handleSetFrameSize(event: SetFrameSize): void {
  const merkleVault = MerkleVault.load(event.address);
  merkleVault!.frameSize = event.params.frameSize;

  merkleVault!.editedAt = event.block.timestamp;
  merkleVault!.editedAtBlock = event.block.number;
  merkleVault!.save();
}

export function handleSetRootAndIpfshash(event: SetRootAndIpfsHash): void {
  const merkleVault = MerkleVault.load(event.address);
  merkleVault!.root = event.params.root;
  merkleVault!.ipfsHash = event.params.ipfsHash;

  merkleVault!.editedAt = event.block.timestamp;
  merkleVault!.editedAtBlock = event.block.number;
  merkleVault!.save();
}

export function handleClaimed(event: Claimed): void {
  const merkleVault = MerkleVault.load(event.address);

  const claim = new VaultClaim(eventUUID(event, []));
  claim.execLayerVault = merkleVault!.id;
  claim.hash = event.transaction.hash;
  claim.account = event.params.account;
  claim.amount = event.params.amount;
  claim.totalClaimed = event.params.totalClaimed;

  claim.createdAt = event.block.timestamp;
  claim.createdAtBlock = event.block.number;
  claim.editedAt = event.block.timestamp;
  claim.editedAtBlock = event.block.number;

  merkleVault!.editedAt = event.block.timestamp;
  merkleVault!.editedAtBlock = event.block.number;
  merkleVault!.save();
}
