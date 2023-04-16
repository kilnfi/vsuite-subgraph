import { BigInt } from '@graphprotocol/graph-ts';
import {
  WithdrawalChannel,
  ValidationKey,
  FundedValidationKey,
  ExitRequest,
  ValidatorRequest as ValidatorRequestEntity,
  vFactory,
  FactoryDepositor
} from '../generated/schema';
import {
  AddedValidators,
  RemovedValidator,
  FundedValidator,
  SetValidatorOwner,
  SetValidatorFeeRecipient,
  UpdatedLimit,
  ExitValidator,
  ValidatorRequest,
  SetMetadata,
  SetAdmin,
  ChangedOperator,
  SetHatcherRegistry,
  ChangedTreasury,
  ApproveDepositor
} from '../generated/templates/vFactory/vFactory';
import { Bytes } from '@graphprotocol/graph-ts';
import { store } from '@graphprotocol/graph-ts';
import { SetMinimalRecipientImplementation } from '../generated/Nexus/Nexus';
import { SetValidatorExtraData } from '../generated/templates/vFactory/vFactory';
import { entityUUID, eventUUID } from './utils';

const PUBLIC_KEY_LENGTH = 48;
const SIGNATURE_LENGTH = 96;
const KEY_PACK_LENGTH = PUBLIC_KEY_LENGTH + SIGNATURE_LENGTH;

export function handleAddedValidators(event: AddedValidators): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);

  let entity = WithdrawalChannel.load(channelId);

  if (entity == null) {
    entity = new WithdrawalChannel(channelId);
    entity.withdrawalChannel = event.params.withdrawalChannel;
    entity.factory = event.address;
    entity.total = BigInt.fromI32(0);
    entity.funded = BigInt.fromI32(0);
    entity.limit = BigInt.fromI32(0);
    entity.createdAt = event.block.timestamp;
    entity.createdAtBlock = event.block.number;
  }

  entity.editedAt = event.block.timestamp;
  entity.editedAtBlock = event.block.number;
  const keyCount = entity.total.toI32();

  for (let idx = 0; idx < event.params.keys.length / KEY_PACK_LENGTH; ++idx) {
    const signature = Bytes.fromUint8Array(
      event.params.keys.slice(idx * KEY_PACK_LENGTH, idx * KEY_PACK_LENGTH + SIGNATURE_LENGTH)
    );
    const publicKey = Bytes.fromUint8Array(
      event.params.keys.slice(idx * KEY_PACK_LENGTH + SIGNATURE_LENGTH, (idx + 1) * KEY_PACK_LENGTH)
    );
    const keyId = entityUUID(event, [event.params.withdrawalChannel.toHexString(), (keyCount + idx).toString()]);
    const keyEntity = new ValidationKey(keyId);
    keyEntity.signature = signature;
    keyEntity.publicKey = publicKey;
    keyEntity.withdrawalChannel = channelId;
    keyEntity.index = BigInt.fromI32(keyCount + idx);
    keyEntity.createdAt = event.block.timestamp;
    keyEntity.createdAtBlock = event.block.number;
    keyEntity.editedAt = event.block.timestamp;
    keyEntity.editedAtBlock = event.block.number;
    keyEntity.save();
  }

  entity.total = BigInt.fromI32(entity.total.toI32() + event.params.keys.length / KEY_PACK_LENGTH);

  entity.save();
}

export function handleValidatorRequest(event: ValidatorRequest): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);

  let entity = WithdrawalChannel.load(channelId);

  if (entity == null) {
    entity = new WithdrawalChannel(channelId);
    entity.withdrawalChannel = event.params.withdrawalChannel;
    entity.factory = event.address;
    entity.total = BigInt.fromI32(0);
    entity.funded = BigInt.fromI32(0);
    entity.limit = BigInt.fromI32(0);
    entity.createdAt = event.block.timestamp;
    entity.createdAtBlock = event.block.number;
  }

  const validatorRequestId = eventUUID(event, [event.params.withdrawalChannel.toHexString()]);

  const validatorRequest = new ValidatorRequestEntity(validatorRequestId);

  validatorRequest.withdrawalChannel = channelId;
  validatorRequest.requestedTotal = event.params.total;
  validatorRequest.totalOnRequest = entity.total;
  validatorRequest.createdAt = event.block.timestamp;
  validatorRequest.createdAtBlock = event.block.number;
  validatorRequest.editedAt = event.block.timestamp;
  validatorRequest.editedAtBlock = event.block.number;

  entity.lastValidatorRequest = validatorRequestId;
  entity.editedAt = event.block.timestamp;
  entity.editedAtBlock = event.block.number;

  entity.save();
  validatorRequest.save();
}

export function handleRemovedValidator(event: RemovedValidator): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);

  const channel = WithdrawalChannel.load(channelId);

  const keyId = entityUUID(event, [
    event.params.withdrawalChannel.toHexString(),
    event.params.validatorIndex.toString()
  ]);
  const keyIndex = event.params.validatorIndex.toI32();

  const keyToDelete = ValidationKey.load(keyId);

  if (keyIndex == channel!.total.toI32() - 1) {
    store.remove('ValidationKey', keyId);
  } else {
    const lastKeyId = entityUUID(event, [
      event.params.withdrawalChannel.toHexString(),
      (channel!.total.toI32() - 1).toString()
    ]);
    const lastKey = ValidationKey.load(lastKeyId);
    keyToDelete!.publicKey = lastKey!.publicKey;
    keyToDelete!.signature = lastKey!.signature;
    keyToDelete!.save();
    store.remove('ValidationKey', lastKeyId);
  }

  channel!.total = BigInt.fromI32(channel!.total.toI32() - 1);
  channel!.editedAt = event.block.timestamp;
  channel!.editedAtBlock = event.block.number;
  channel!.save();
}

export function handleFundedValidator(event: FundedValidator): void {
  const keyId = entityUUID(event, [
    event.params.withdrawalChannel.toHexString(),
    event.params.validatorIndex.toString()
  ]);
  const key = ValidationKey.load(keyId);
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);
  const channel = WithdrawalChannel.load(channelId);
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = new FundedValidationKey(fundedKeyId);

  key!.funded = fundedKeyId;
  key!.editedAt = event.block.timestamp;
  key!.editedAtBlock = event.block.number;

  fundedKey.validationKey = keyId;
  fundedKey.validatorId = event.params.id;
  fundedKey.withdrawalAddress = event.params.withdrawalAddress;
  fundedKey.createdAt = event.block.timestamp;
  fundedKey.createdAtBlock = event.block.number;
  fundedKey.editedAt = event.block.timestamp;
  fundedKey.editedAtBlock = event.block.number;

  channel!.funded = BigInt.fromI32(channel!.funded.toI32() + 1);
  channel!.editedAt = event.block.timestamp;
  channel!.editedAtBlock = event.block.number;

  key!.save();
  channel!.save();
  fundedKey.save();
}

export function handleExitValidator(event: ExitValidator): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    const exitRequestId = eventUUID(event, [event.params.id.toString()]);
    const exitRequest = new ExitRequest(exitRequestId);

    exitRequest.validator = fundedKeyId;
    exitRequest.emitter = fundedKey!.owner as Bytes;
    exitRequest.createdAt = event.block.timestamp;
    exitRequest.createdAtBlock = event.block.number;
    exitRequest.editedAt = event.block.timestamp;
    exitRequest.editedAtBlock = event.block.number;

    exitRequest.save();

    fundedKey.lastExitRequest = exitRequestId;
    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();
  }
}

export function handleUpdatedLimit(event: UpdatedLimit): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);
  const channel = WithdrawalChannel.load(channelId);

  channel!.limit = event.params.limit;
  channel!.editedAt = event.block.timestamp;
  channel!.editedAtBlock = event.block.number;

  channel!.save();
}

export function handleSetValidatorOwner(event: SetValidatorOwner): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    fundedKey.owner = event.params.owner;

    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();
  }
}

export function handleSetValidatorFeeRecipient(event: SetValidatorFeeRecipient): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    fundedKey.feeRecipient = event.params.feeRecipient;

    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();
  }
}

export function handleSetValidatorExtraData(event: SetValidatorExtraData): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    fundedKey.extraData = event.params.extraData;

    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();
  }
}

export function handleSetMetadata(event: SetMetadata): void {
  const factory = vFactory.load(event.address);

  // @TODO OPERATOR NAME
  // factory!.operatorName = event.params.name;
  // factory!.operatorUrl = event.params.url;
  // factory!.operatorIconUrl = event.params.iconUrl;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleSetAdmin(event: SetAdmin): void {
  const factory = vFactory.load(event.address);

  factory!.admin = event.params.admin;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleChangedOperator(event: ChangedOperator): void {
  const factory = vFactory.load(event.address);

  factory!.operator = event.params.operator;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleChangedTreasury(event: ChangedTreasury): void {
  const factory = vFactory.load(event.address);

  factory!.treasury = event.params.treasury;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleSetMinimalRecipientImplementation(event: SetMinimalRecipientImplementation): void {
  const factory = vFactory.load(event.address);

  factory!.minimalRecipientImplementation = event.params.minimalRecipientImplementationAddress;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleSetHatcherRegistry(event: SetHatcherRegistry): void {
  const factory = vFactory.load(event.address);

  factory!.nexus = event.params.hatcherRegistry;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleApproveDepositor(event: ApproveDepositor): void {
  const depositorId = entityUUID(event, [event.params.depositor.toHexString()]);
  let depositor = FactoryDepositor.load(depositorId);

  if (depositor == null) {
    if (event.params.allowed) {
      depositor = new FactoryDepositor(depositorId);

      depositor.address = event.params.depositor;
      depositor.factory = event.address;

      depositor.createdAt = event.block.timestamp;
      depositor.createdAtBlock = event.block.number;
      depositor.editedAt = event.block.timestamp;
      depositor.editedAtBlock = event.block.number;
      depositor.save();
    }
  } else {
    if (!event.params.allowed) {
      store.remove('FactoryDepositor', depositorId);
    } else {
      depositor.editedAt = event.block.timestamp;
      depositor.editedAtBlock = event.block.number;
      depositor.save();
    }
  }
}
