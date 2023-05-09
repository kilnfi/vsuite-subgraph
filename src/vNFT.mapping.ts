import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { MerkleVault, vNFT, vNFTApprovals, vNFTIntegration, vNFTTransfer, vNFTUser } from '../generated/schema';
import {
  Approval,
  ApprovalForAll,
  Freeze,
  PurchasedValidator,
  SetExecLayerVault,
  SetExtraData,
  SetFactory,
  SetIntegrator,
  SetIntegratorCommission,
  SetName,
  SetOperatorCommission,
  SetPurchasePause,
  SetSymbol,
  SetTimeout,
  SetURIPrefix,
  Transfer,
  UpdateUser,
  UsershipCleared
} from '../generated/templates/vNFT/vNFT';
import { MerkleVault as MerkleVaultTemplate } from '../generated/templates';
import { entityUUID, eventUUID, externalEntityUUID } from './utils/utils';

export function handleSetName(event: SetName): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.name = event.params.name;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetSymbol(event: SetSymbol): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.symbol = event.params.symbol;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetExtraData(event: SetExtraData): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.extraData = event.params.extraData;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetURIPrefix(event: SetURIPrefix): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.uriPrefix = event.params.uriPrefix;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetPaused(event: SetPurchasePause): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.paused = event.params.isPaused;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetFactory(event: SetFactory): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.vFactory = event.params.factory;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetOperatorCommission(event: SetOperatorCommission): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.operatorCommission = event.params.operatorCommission;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetIntegratorCommission(event: SetIntegratorCommission): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.integratorCommission = event.params.integratorCommission;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetIntegrator(event: SetIntegrator): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.integrator = event.params.integrator;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handleSetTimeout(event: SetTimeout): void {
  const vnftIntegration = vNFTIntegration.load(event.address);

  vnftIntegration!.timeout = event.params.timeout;

  vnftIntegration!.editedAt = event.block.timestamp;
  vnftIntegration!.editedAtBlock = event.block.number;
  vnftIntegration!.save();
}

export function handlePurchasedValidator(event: PurchasedValidator): void {
  const vnftIntegrationAddress = event.address;
  const tokenId = event.params.tokenId;
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const vFactoryAddres = vNFTIntegration.load(vnftIntegrationAddress)!.vFactory;

  const id = entityUUID(event, [tokenId.toString()]);
  const vnft = new vNFT(id);
  vnft.tokenId = tokenId;
  vnft.integration = vnftIntegrationAddress;
  vnft.owner = event.params.owner;
  vnft.validator = externalEntityUUID(Address.fromBytes(vFactoryAddres), [event.params.validatorId.toString()]);
  vnft.freezeTimestamp = BigInt.zero();

  vnft.editedAt = ts;
  vnft.editedAtBlock = blockId;
  vnft.createdAt = ts;
  vnft.createdAtBlock = blockId;

  vnft.save();

  const vnftIntegration = vNFTIntegration.load(vnftIntegrationAddress);
  vnftIntegration!.supply = vnftIntegration!.supply.plus(BigInt.fromI32(1));
  vnftIntegration!.editedAt = ts;
  vnftIntegration!.editedAtBlock = blockId;
  vnftIntegration!.save();
}

export function handleTransfer(event: Transfer): void {
  const tokenId = event.params.tokenId;
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const id = eventUUID(event, [tokenId.toString()]);
  const transfer = new vNFTTransfer(id);
  transfer.from = event.params.from;
  transfer.to = event.params.to;

  transfer.editedAt = ts;
  transfer.editedAtBlock = blockId;
  transfer.createdAt = ts;
  transfer.createdAtBlock = blockId;

  const vnft = vNFT.load(entityUUID(event, [tokenId.toString()]));
  vnft!.owner = event.params.to;
  vnft!.editedAt = ts;
  vnft!.editedAtBlock = blockId;
  vnft!.approval = null;

  transfer.vNFT = vnft!.id;

  vnft!.save();
  transfer.save();
}

export function handleUpdateUser(event: UpdateUser): void {
  const tokenId = event.params.tokenId;
  const id = entityUUID(event, [tokenId.toString()]);
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  let user = vNFTUser.load(id);
  if (!user) {
    user = new vNFTUser(id);
    user.createdAt = ts;
    user.createdAtBlock = blockId;
    user.vNFT = id;
  }
  user.user = event.params.user;
  user.expiry = event.params.expires;
  user.editedAt = ts;
  user.editedAtBlock = blockId;

  user.save();
}

export function handleApproval(event: Approval): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const vnft = vNFT.load(entityUUID(event, [event.params.tokenId.toString()]));
  vnft!.editedAt = ts;
  vnft!.editedAtBlock = blockId;
  vnft!.approval = event.params.approved;
  vnft!.save();
}

export function handleUsershipCleared(event: UsershipCleared): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const vnftUser = vNFTUser.load(entityUUID(event, [event.params.tokenId.toString()]));
  vnftUser!.user = Address.empty();
  vnftUser!.expiry = BigInt.zero();

  vnftUser!.editedAt = ts;
  vnftUser!.editedAtBlock = blockId;
  vnftUser!.save();
}

export function handleFreeze(event: Freeze): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const vnft = vNFT.load(entityUUID(event, [event.params.tokenId.toString()]));
  vnft!.freezeTimestamp = event.params.freezeTimestamp;

  vnft!.editedAt = ts;
  vnft!.editedAtBlock = blockId;
  vnft!.save();
}

export function handleSetExecLayerVault(event: SetExecLayerVault): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const merkleVaultAddress = event.params.execLayerVault;
  let merkleVault = MerkleVault.load(merkleVaultAddress);
  if (!merkleVault) {
    merkleVault = new MerkleVault(merkleVaultAddress);
    merkleVault.root = Bytes.empty();
    merkleVault.frameSize = BigInt.zero();
    merkleVault.ipfsHash = '';

    merkleVault.createdAt = ts;
    merkleVault.createdAtBlock = blockId;
    merkleVault.editedAt = ts;
    merkleVault.editedAtBlock = blockId;
    merkleVault.save();

    MerkleVaultTemplate.create(merkleVaultAddress);
  }
  const vnftIntegration = vNFTIntegration.load(event.address);
  vnftIntegration!.execLayerVault = merkleVaultAddress;

  vnftIntegration!.editedAt = ts;
  vnftIntegration!.editedAtBlock = blockId;
  vnftIntegration!.save();
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  const ts = event.block.timestamp;
  const blockId = event.block.number;

  const id = entityUUID(event, [event.params.owner.toHexString(), event.params.operator.toHexString()]);
  let approval = vNFTApprovals.load(id);
  if (!approval) {
    approval = new vNFTApprovals(id);
    approval.owner = event.params.owner;
    approval.operator = event.params.operator;
    approval.createdAt = ts;
    approval.createdAtBlock = blockId;
    approval.integration = event.address;
  }

  approval.approval = event.params.approved;
  approval.editedAt = ts;
  approval.editedAtBlock = blockId;

  approval.save();
}