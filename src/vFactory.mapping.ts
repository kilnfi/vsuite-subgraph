import { Bytes, store, BigInt, Address } from '@graphprotocol/graph-ts';
import { WithdrawalChannel, ValidationKey, vFactory, FactoryDepositor, ExitRequest } from '../generated/schema';
import {
  SetValidatorOwner,
  SetValidatorFeeRecipient,
  SetMetadata,
  SetAdmin,
  ChangedOperator,
  SetHatcherRegistry,
  ChangedTreasury,
  ApproveDepositor,
  SetExitTotal
} from '../generated/templates/vFactory/vFactory';
import {
  ActivatedValidator,
  SetRoot,
  ExitValidator,
  SetValidatorThreshold
} from '../generated/templates/vFactory_2_2_0/vFactory_2_2_0';
import { SetMinimalRecipientImplementation } from '../generated/Nexus/Nexus';
import { SetValidatorExtraData } from '../generated/templates/vFactory/vFactory';
import {
  createChangedFactoryParameterSystemEvent,
  createFundedValidationKeySystemEvent,
  createValidatorExtraDataChangedSystemEvent,
  createValidatorFeeRecipientChangedSystemEvent,
  createValidatorOwnerChangedSystemEvent,
  createValidatorThresholdChangedSystemEvent,
  entityUUID,
  eventUUID
} from './utils/utils';

export function handleActivatedValidator_2_2_0(event: ActivatedValidator): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);
  let channel = WithdrawalChannel.load(channelId);

  if (channel == null) {
    channel = new WithdrawalChannel(channelId);
    channel.withdrawalChannel = event.params.withdrawalChannel;
    channel.factory = event.address;
    channel.funded = BigInt.fromI32(0);
    channel.lastExitTotal = BigInt.fromI32(0);
    channel.createdAt = event.block.timestamp;
    channel.createdAtBlock = event.block.number;
  }

  const keyId = entityUUID(event, [event.params.id.toString()]);

  const keyEntity = new ValidationKey(keyId);

  const depositorId = entityUUID(event, [
    event.params.withdrawalChannel.toHexString(),
    event.params.depositor.toHexString()
  ]);

  keyEntity.signature = event.params.signature;
  keyEntity.publicKey = event.params.publicKey;
  keyEntity.withdrawalChannel = channelId;
  keyEntity.index = channel.funded;

  keyEntity.validationStatus = 'pending';
  keyEntity.validatorId = event.params.id;
  keyEntity.depositor = depositorId;
  keyEntity.withdrawalAddress = event.params.withdrawalAddress;
  keyEntity.createdAt = event.block.timestamp;
  keyEntity.createdAtBlock = event.block.number;
  keyEntity.editedAt = event.block.timestamp;
  keyEntity.editedAtBlock = event.block.number;

  keyEntity!.save();

  channel.funded = BigInt.fromI32(channel.funded.toI32() + 1);
  channel.editedAt = event.block.timestamp;
  channel.editedAtBlock = event.block.number;

  channel!.save();

  const systemEvent = createFundedValidationKeySystemEvent(
    event,
    event.address,
    event.params.withdrawalChannel,
    event.params.depositor
  );
  systemEvent.count = systemEvent.count.plus(BigInt.fromI32(1));
  systemEvent.newTotal = channel!.funded;
  const activatedKeys = systemEvent.validationKeys;
  activatedKeys.push(keyId);
  systemEvent.validationKeys = activatedKeys;
  systemEvent.save();

  const factory = vFactory.load(event.address);
  factory!.totalActivatedValidators = factory!.totalActivatedValidators.plus(BigInt.fromI32(1));
  factory!.save();
}

// export function handleFundedValidator(event: FundedValidator): void {
//   const keyId = entityUUID(event, [
//     event.params.withdrawalChannel.toHexString(),
//     event.params.validatorIndex.toString()
//   ]);
//   const key = ValidationKey.load(keyId);
//   const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);
//   const channel = WithdrawalChannel.load(channelId);
//   const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
//   const fundedKey = new FundedValidationKey(fundedKeyId);
//   const depositorId = entityUUID(event, [
//     event.params.withdrawalChannel.toHexString(),
//     event.params.depositor.toHexString()
//   ]);
//
//   key!.funded = fundedKeyId;
//   key!.editedAt = event.block.timestamp;
//   key!.editedAtBlock = event.block.number;
//
//   let depositIndex = 1;
//   let depositEventId = `${key!.publicKey.toHexString()}-${depositIndex.toString()}`;
//   let depositEvent = DepositEvent.load(depositEventId);
//   while (depositEvent != null) {
//     depositIndex++;
//     depositEventId = `${key!.publicKey.toHexString()}-${depositIndex.toString()}`;
//     depositEvent = DepositEvent.load(depositEventId);
//   }
//   depositEventId = `${key!.publicKey.toHexString()}-${(depositIndex - 1).toString()}`;
//
//   fundedKey.depositEvent = depositEventId;
//   fundedKey.validationKey = keyId;
//   fundedKey.validatorId = event.params.id;
//   fundedKey.depositor = depositorId;
//   fundedKey.withdrawalAddress = event.params.withdrawalAddress;
//   fundedKey.createdAt = event.block.timestamp;
//   fundedKey.createdAtBlock = event.block.number;
//   fundedKey.editedAt = event.block.timestamp;
//   fundedKey.editedAtBlock = event.block.number;
//
//   channel!.funded = BigInt.fromI32(channel!.funded.toI32() + 1);
//   channel!.editedAt = event.block.timestamp;
//   channel!.editedAtBlock = event.block.number;
//
//   key!.save();
//   channel!.save();
//   fundedKey.save();
//
//   const se = createExternalFundingSystemAlert(event, key!.publicKey);
//   if (se.logIndex !== null && (se.logIndex as BigInt).equals(event.logIndex.minus(BigInt.fromI32(1)))) {
//     cancelSystemEvent(se.id, 'ExternalFundingSystemAlert');
//   }
//
//   const systemEvent = createFundedValidationKeySystemEvent(
//     event,
//     event.address,
//     event.params.withdrawalChannel,
//     event.params.depositor
//   );
//   systemEvent.count = systemEvent.count.plus(BigInt.fromI32(1));
//   systemEvent.newTotal = channel!.funded;
//   const fundedKeys = systemEvent.fundedValidationKeys;
//   fundedKeys.push(fundedKeyId);
//   systemEvent.fundedValidationKeys = fundedKeys;
//   systemEvent.save();
//
//   const factory = vFactory.load(event.address);
//   factory!.totalActivatedValidators = factory!.totalActivatedValidators.plus(BigInt.fromI32(1));
//   factory!.save();
// }

export function handleExitValidator_2_2_0(event: ExitValidator): void {
  const keyId = entityUUID(event, [event.params.id.toString()]);
  const key = ValidationKey.load(keyId);

  if (key != null) {
    const exitRequestId = eventUUID(event, [event.params.id.toString()]);
    const exitRequest = new ExitRequest(exitRequestId);

    exitRequest.validator = keyId;
    exitRequest.emitter = key.owner as Bytes;
    exitRequest.createdAt = event.block.timestamp;
    exitRequest.createdAtBlock = event.block.number;
    exitRequest.editedAt = event.block.timestamp;
    exitRequest.editedAtBlock = event.block.number;

    exitRequest.save();

    key.lastExitRequest = exitRequestId;
    key.editedAt = event.block.timestamp;
    key.editedAtBlock = event.block.number;

    key.save();
  }
}

export function handleSetRoot_2_2_0(event: SetRoot): void {
  const factory = vFactory.load(event.address);

  factory!.treeRoot = event.params.newRoot.root;
  factory!.treeIPFSHash = event.params.newRoot.ipfsHash;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();
}

export function handleSetValidatorThreshold_2_2_0(event: SetValidatorThreshold): void {
  const keyId = entityUUID(event, [event.params.id.toString()]);
  const key = ValidationKey.load(keyId);

  if (key != null) {
    let oldThreshold = key.threshold;
    if (oldThreshold === null) {
      oldThreshold = BigInt.zero();
    }
    key.threshold = event.params.thresholdGwei;

    key.editedAt = event.block.timestamp;
    key.editedAtBlock = event.block.number;

    key.save();

    if (oldThreshold.notEqual(event.params.thresholdGwei)) {
      const se = createValidatorThresholdChangedSystemEvent(event, event.address, event.params.id);
      se.oldThreshold = oldThreshold;
      se.newThreshold = event.params.thresholdGwei;
      se.save();
    }
  }
}

export function handleSetValidatorOwner(event: SetValidatorOwner): void {
  const keyId = entityUUID(event, [event.params.id.toString()]);
  const key = ValidationKey.load(keyId);

  if (key != null) {
    let oldOwner = key.owner;
    if (oldOwner === null) {
      oldOwner = Address.zero();
    }
    key.owner = event.params.owner;

    key.editedAt = event.block.timestamp;
    key.editedAtBlock = event.block.number;

    key.save();

    if (oldOwner != event.params.owner) {
      const se = createValidatorOwnerChangedSystemEvent(event, event.address, event.params.id);
      se.oldOwner = oldOwner;
      se.newOwner = event.params.owner;
      se.save();
    }
  }
}

export function handleSetValidatorFeeRecipient(event: SetValidatorFeeRecipient): void {
  const keyId = entityUUID(event, [event.params.id.toString()]);
  const key = ValidationKey.load(keyId);

  if (key != null) {
    let oldFeeRecipient = key.feeRecipient;
    if (oldFeeRecipient === null) {
      oldFeeRecipient = Address.zero();
    }
    key.feeRecipient = event.params.feeRecipient;

    key.editedAt = event.block.timestamp;
    key.editedAtBlock = event.block.number;

    key.save();

    if (oldFeeRecipient != event.params.feeRecipient) {
      const se = createValidatorFeeRecipientChangedSystemEvent(event, event.address, event.params.id);
      se.oldFeeRecipient = oldFeeRecipient;
      se.newFeeRecipient = event.params.feeRecipient;
      se.save();
    }
  }
}

export function handleSetValidatorExtraData(event: SetValidatorExtraData): void {
  const keyId = entityUUID(event, [event.params.id.toString()]);
  const key = ValidationKey.load(keyId);

  if (key != null) {
    let oldExtraData = key.extraData;
    if (oldExtraData === null) {
      oldExtraData = '';
    }
    key.extraData = event.params.extraData;

    key.editedAt = event.block.timestamp;
    key.editedAtBlock = event.block.number;

    key.save();
    if (oldExtraData != event.params.extraData) {
      const se = createValidatorExtraDataChangedSystemEvent(event, event.address, event.params.id);
      se.oldExtraData = oldExtraData;
      se.newExtraData = event.params.extraData;
      se.save();
    }
  }
}

export function handleSetMetadata(event: SetMetadata): void {
  const factory = vFactory.load(event.address);

  let oldValueOperatorName = factory!.operatorName;
  if (oldValueOperatorName === null) {
    oldValueOperatorName = '';
  }

  let oldValueOperatorUrl = factory!.operatorUrl;
  if (oldValueOperatorUrl === null) {
    oldValueOperatorUrl = '';
  }

  let oldValueOperatorIconUrl = factory!.operatorIconUrl;
  if (oldValueOperatorIconUrl === null) {
    oldValueOperatorIconUrl = '';
  }

  factory!.operatorName = event.params.name;
  factory!.operatorUrl = event.params.url;
  factory!.operatorIconUrl = event.params.iconUrl;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  if (oldValueOperatorName != event.params.name) {
    const systemEvent = createChangedFactoryParameterSystemEvent(
      event,
      event.address,
      `operatorName`,
      oldValueOperatorName.toString()
    );
    systemEvent.newValue = event.params.name;
    systemEvent.save();
  }
  if (oldValueOperatorUrl != event.params.url) {
    const systemEvent = createChangedFactoryParameterSystemEvent(
      event,
      event.address,
      `operatorUrl`,
      oldValueOperatorUrl.toString()
    );
    systemEvent.newValue = event.params.url;
    systemEvent.save();
  }
  if (oldValueOperatorIconUrl != event.params.iconUrl) {
    const systemEvent = createChangedFactoryParameterSystemEvent(
      event,
      event.address,
      `operatorIconUrl`,
      oldValueOperatorIconUrl.toString()
    );
    systemEvent.newValue = event.params.iconUrl;
    systemEvent.save();
  }
}

export function handleSetAdmin(event: SetAdmin): void {
  const factory = vFactory.load(event.address);

  let oldValue = factory!.admin;
  if (oldValue === null) {
    oldValue = Address.zero();
  }

  factory!.admin = event.params.admin;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(event, event.address, `admin`, oldValue.toHexString());
  systemEvent.newValue = event.params.admin.toHexString();
  systemEvent.save();
}

export function handleChangedOperator(event: ChangedOperator): void {
  const factory = vFactory.load(event.address);

  let oldValue = factory!.operator;
  if (oldValue === null) {
    oldValue = Address.zero();
  }

  factory!.operator = event.params.operator;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(
    event,
    event.address,
    `operator`,
    oldValue.toHexString()
  );
  systemEvent.newValue = event.params.operator.toHexString();
  systemEvent.save();
}

export function handleChangedTreasury(event: ChangedTreasury): void {
  const factory = vFactory.load(event.address);

  let oldValue = factory!.treasury;
  if (oldValue === null) {
    oldValue = Address.zero();
  }

  factory!.treasury = event.params.treasury;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(
    event,
    event.address,
    `treasury`,
    oldValue.toHexString()
  );
  systemEvent.newValue = event.params.treasury.toHexString();
  systemEvent.save();
}

export function handleSetMinimalRecipientImplementation(event: SetMinimalRecipientImplementation): void {
  const factory = vFactory.load(event.address);

  let oldValue = factory!.minimalRecipientImplementation;
  if (oldValue === null) {
    oldValue = Address.zero();
  }

  factory!.minimalRecipientImplementation = event.params.minimalRecipientImplementationAddress;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(
    event,
    event.address,
    `minimalRecipientImplementation`,
    oldValue.toHexString()
  );
  systemEvent.newValue = event.params.minimalRecipientImplementationAddress.toHexString();
  systemEvent.save();
}

export function handleSetHatcherRegistry(event: SetHatcherRegistry): void {
  const factory = vFactory.load(event.address);

  let oldValue = factory!.nexus;
  if (oldValue === null) {
    oldValue = Address.zero();
  }

  factory!.nexus = event.params.hatcherRegistry;

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(event, event.address, `nexus`, oldValue.toHexString());
  systemEvent.newValue = event.params.hatcherRegistry.toHexString();
  systemEvent.save();
}

export function handleSetExitTotal(event: SetExitTotal): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);
  let channel = WithdrawalChannel.load(channelId);

  if (channel == null) {
    channel = new WithdrawalChannel(channelId);
    channel.withdrawalChannel = event.params.withdrawalChannel;
    channel.factory = event.address;
    channel.funded = BigInt.fromI32(0);
    channel.createdAt = event.block.timestamp;
    channel.createdAtBlock = event.block.number;
  }

  channel.editedAt = event.block.timestamp;
  channel.editedAtBlock = event.block.number;
  channel.lastExitTotal = event.params.totalExited;
  channel.save();
}

export function handleApproveDepositor(event: ApproveDepositor): void {
  const depositorId = entityUUID(event, [event.params.wc.toHexString(), event.params.depositor.toHexString()]);
  let depositor = FactoryDepositor.load(depositorId);
  const channelId = entityUUID(event, [event.params.wc.toHexString()]);
  let channel = WithdrawalChannel.load(channelId);

  if (channel == null) {
    channel = new WithdrawalChannel(channelId);
    channel.withdrawalChannel = event.params.wc;
    channel.factory = event.address;
    channel.funded = BigInt.fromI32(0);
    channel.lastExitTotal = BigInt.fromI32(0);
    channel.editedAt = event.block.timestamp;
    channel.editedAtBlock = event.block.number;
    channel.createdAt = event.block.timestamp;
    channel.createdAtBlock = event.block.number;
    channel.save();
  }

  let oldValue = false;

  if (depositor == null) {
    if (event.params.allowed) {
      depositor = new FactoryDepositor(depositorId);

      depositor.address = event.params.depositor;
      depositor.withdrawalChannel = channelId;

      depositor.createdAt = event.block.timestamp;
      depositor.createdAtBlock = event.block.number;
      depositor.editedAt = event.block.timestamp;
      depositor.editedAtBlock = event.block.number;
      depositor.save();
    }
  } else {
    oldValue = true;
    if (!event.params.allowed) {
      store.remove('FactoryDepositor', depositorId);
    } else {
      depositor.editedAt = event.block.timestamp;
      depositor.editedAtBlock = event.block.number;
      depositor.save();
    }
  }

  if (oldValue != event.params.allowed) {
    const systemEvent = createChangedFactoryParameterSystemEvent(
      event,
      event.address,
      `depositor[${event.params.depositor.toHexString()}]`,
      oldValue.toString()
    );
    systemEvent.newValue = event.params.allowed.toString();
    systemEvent.save();
  }
}
