import { Bytes, store, BigInt, dataSource, log, crypto, ByteArray, Address, ethereum } from '@graphprotocol/graph-ts';
import {
  WithdrawalChannel,
  ValidationKey,
  FundedValidationKey,
  ExitRequest,
  ValidatorRequest as ValidatorRequestEntity,
  vFactory,
  FactoryDepositor,
  CommonValidationKeyEntry,
  DepositEvent,
  PendingKeyValidationRequest,
  PendingKeyValidationTracker
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
import { SetMinimalRecipientImplementation } from '../generated/Nexus/Nexus';
import { SetValidatorExtraData } from '../generated/templates/vFactory/vFactory';
import {
  cancelSystemEvent,
  createAddedValidationKeysSystemEvent,
  createChangedFactoryParameterSystemEvent,
  createDuplicateKeySystemAlert,
  createExternalFundingSystemAlert,
  createFundedValidationKeySystemEvent,
  createRemovedValidationKeysSystemEvent,
  createUpdatedLimitSystemEvent,
  createValidatorExtraDataChangedSystemEvent,
  createValidatorFeeRecipientChangedSystemEvent,
  createValidatorOwnerChangedSystemEvent,
  entityUUID,
  eventUUID,
  externalEntityUUID
} from './utils/utils';
import { verify } from './bls12_381_verify';
import {
  FORK_VERSIONS,
  generateDepositDomain,
  hashTreeRootDepositMessage,
  hashTreeRootSigningData
} from './ssz_deposit_message/index';

const PUBLIC_KEY_LENGTH = 48;
const SIGNATURE_LENGTH = 96;
const KEY_PACK_LENGTH = PUBLIC_KEY_LENGTH + SIGNATURE_LENGTH;

function concat(b: ByteArray[]): ByteArray {
  let res = new ByteArray(0);
  for (let i = 0; i < b.length; i++) {
    res = res.concat(b[i]);
  }
  return res;
}

// due to an issue with the heap when verify a lot of signatures, we need this
// workaround to very the keys in an async manner. This is suboptimal and an
// alternative should be found as it slows down the whole indexing process
export function handleBlock(block: ethereum.Block): void {
  const verificationTracker = getOrLoadVerificationTracker();

  if (verificationTracker.current.lt(verificationTracker.total)) {
    log.info('Found pending verifications !', []);
    const from = verificationTracker.current;
    let to = verificationTracker.total;
    if (to.minus(from).gt(BigInt.fromI32(10))) {
      to = from.plus(BigInt.fromI32(10));
    }
    for (let i = from; i.lt(to); i = i.plus(BigInt.fromI32(1))) {
      const keyReq = PendingKeyValidationRequest.load(i.toString());
      const key = ValidationKey.load(keyReq!.key);
      const wc = WithdrawalChannel.load(key!.withdrawalChannel);
      const factory = vFactory.load(wc!.factory);
      let withdrawalCredentials: Bytes;
      if (wc!.withdrawalChannel.toHexString() == '0x0000000000000000000000000000000000000000000000000000000000000000') {
        withdrawalCredentials = Bytes.fromByteArray(
          concat([
            ByteArray.fromHexString('0x010000000000000000000000'),
            Bytes.fromUint8Array(
              crypto
                .keccak256(
                  concat([
                    Bytes.fromHexString('0xff'),
                    factory!.address,
                    crypto.keccak256(key!.publicKey),
                    crypto.keccak256(
                      concat([
                        Bytes.fromHexString('0x3d602d80600a3d3981f3363d3d373d3d3d363d73'),
                        factory!.minimalRecipientImplementation as Bytes,
                        Bytes.fromHexString('0x5af43d82803e903d91602b57fd5bf3')
                      ])
                    )
                  ])
                )
                .slice(12, 32)
            )
          ])
        );
      } else {
        withdrawalCredentials = wc!.withdrawalChannel;
      }

      log.info('Starting verification for {}', [key!.publicKey.toHexString()]);

      const depositMessageRoot = hashTreeRootDepositMessage({
        pubkey: key!.publicKey,
        withdrawalCredentials: withdrawalCredentials,
        amount: 32000000000
      });

      const forkVersion: Uint8Array = FORK_VERSIONS[dataSource.network() == 'mainnet' ? 0 : 1];
      const depositDomain: Uint8Array = generateDepositDomain(forkVersion);

      const signingRoot = hashTreeRootSigningData({
        objectRoot: depositMessageRoot,
        domain: depositDomain
      });

      const signature_verification = verify(key!.signature, signingRoot, key!.publicKey);

      if (signature_verification.error != null || signature_verification.value == false) {
        key!.validSignature = false;
        key!.validationError = signature_verification.error;
      } else {
        key!.validSignature = true;
      }

      key!.validationStatus = 'done';
      key!.save();

      log.info('Finished verification for {}', [key!.publicKey.toHexString()]);
    }
    verificationTracker.current = to;
    verificationTracker.save();
  }
}

function getOrLoadVerificationTracker(): PendingKeyValidationTracker {
  let tracker = PendingKeyValidationTracker.load('global');
  if (tracker == null) {
    tracker = new PendingKeyValidationTracker('global');
    tracker.total = BigInt.fromI32(0);
    tracker.current = BigInt.fromI32(0);
    tracker.save();
  }
  return tracker;
}

export function handleAddedValidators(event: AddedValidators): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);
  let entity = WithdrawalChannel.load(channelId);

  if (entity == null) {
    entity = new WithdrawalChannel(channelId);
    entity.withdrawalChannel = event.params.withdrawalChannel;
    entity.factory = entityUUID(event, []);
    entity.total = BigInt.fromI32(0);
    entity.funded = BigInt.fromI32(0);
    entity.limit = BigInt.fromI32(0);
    entity.createdAt = event.block.timestamp;
    entity.createdAtBlock = event.block.number;
  }

  entity.editedAt = event.block.timestamp;
  entity.editedAtBlock = event.block.number;
  const keyCount = entity.total.toI32();

  const keys = event.params.keys;

  const verificationTracker = getOrLoadVerificationTracker();

  for (let idx = 0; idx < keys.length / KEY_PACK_LENGTH; ++idx) {
    const signature = Bytes.fromUint8Array(keys.slice(idx * KEY_PACK_LENGTH, idx * KEY_PACK_LENGTH + SIGNATURE_LENGTH));
    const publicKey = Bytes.fromUint8Array(
      keys.slice(idx * KEY_PACK_LENGTH + SIGNATURE_LENGTH, (idx + 1) * KEY_PACK_LENGTH)
    );
    const keyId = entityUUID(event, [event.params.withdrawalChannel.toHexString(), (keyCount + idx).toString()]);
    const keyEntity = new ValidationKey(keyId);
    keyEntity.signature = signature;
    keyEntity.publicKey = publicKey;
    keyEntity.withdrawalChannel = channelId;
    keyEntity.index = BigInt.fromI32(keyCount + idx);

    keyEntity.validationStatus = 'pending';

    const verificationRequest = new PendingKeyValidationRequest(
      verificationTracker.total.plus(BigInt.fromI32(idx)).toString()
    );
    verificationRequest.key = keyId;
    verificationRequest.save();

    let commonValidationKeyEntry = CommonValidationKeyEntry.load(publicKey.toHexString());
    if (commonValidationKeyEntry == null) {
      commonValidationKeyEntry = new CommonValidationKeyEntry(publicKey.toHexString());
      commonValidationKeyEntry.depositEventCount = BigInt.fromI32(0);
      commonValidationKeyEntry.validationKeyCount = BigInt.fromI32(0);
      commonValidationKeyEntry.publicKey = publicKey;
      commonValidationKeyEntry.createdAt = event.block.timestamp;
      commonValidationKeyEntry.createdAtBlock = event.block.number;
    }
    commonValidationKeyEntry.editedAt = event.block.timestamp;
    commonValidationKeyEntry.editedAtBlock = event.block.number;
    commonValidationKeyEntry.validationKeyCount = commonValidationKeyEntry.validationKeyCount.plus(BigInt.fromI32(1));
    commonValidationKeyEntry.save();

    if (commonValidationKeyEntry.validationKeyCount.gt(BigInt.fromI32(1))) {
      const se = createDuplicateKeySystemAlert(event, event.address, publicKey);
      se.key = publicKey.toHexString();
      se.save();
    }

    let depositIndex = 0;
    let depositEventId = `${publicKey.toHexString()}-${depositIndex.toString()}`;
    let depositEvent = DepositEvent.load(depositEventId);
    while (depositEvent != null) {
      const depositMessageRoot = hashTreeRootDepositMessage({
        pubkey: depositEvent.pubkey,
        withdrawalCredentials: depositEvent.withdrawalCredentials,
        amount: depositEvent.amount.toI64()
      });

      const forkVersion: Uint8Array = FORK_VERSIONS[dataSource.network() == 'mainnet' ? 0 : 1];
      const depositDomain: Uint8Array = generateDepositDomain(forkVersion);

      const signingRoot = hashTreeRootSigningData({
        objectRoot: depositMessageRoot,
        domain: depositDomain
      });

      const signature_verification = verify(depositEvent.signature, signingRoot, depositEvent.pubkey);

      if (signature_verification.error != null || signature_verification.value == false) {
        depositEvent.validSignature = false;
        depositEvent.validationError = signature_verification.error;
      } else {
        depositEvent.validSignature = true;
        const se = createExternalFundingSystemAlert(event, publicKey);
        se.key = publicKey.toHexString();
        se.save();
      }
      depositEvent.verified = true;
      depositEvent.editedAt = event.block.timestamp;
      depositEvent.editedAtBlock = event.block.number;
      depositEvent.save();

      depositIndex++;
      depositEventId = `${publicKey.toHexString()}-${depositIndex.toString()}`;
      depositEvent = DepositEvent.load(depositEventId);
    }

    keyEntity.commonValidationKeyEntry = publicKey.toHexString();
    keyEntity.createdAt = event.block.timestamp;
    keyEntity.createdAtBlock = event.block.number;
    keyEntity.editedAt = event.block.timestamp;
    keyEntity.editedAtBlock = event.block.number;
    keyEntity.save();
  }

  verificationTracker.total = verificationTracker.total.plus(BigInt.fromI32(keys.length / KEY_PACK_LENGTH));
  verificationTracker.save();

  entity.total = BigInt.fromI32(entity.total.toI32() + keys.length / KEY_PACK_LENGTH);

  entity.save();

  const se = createAddedValidationKeysSystemEvent(event, event.address, event.params.withdrawalChannel);
  se.count = se.count.plus(BigInt.fromI32(keys.length / KEY_PACK_LENGTH));
  se.newTotal = entity.total;
  se.save();

  dataSource.create;
}

export function handleValidatorRequest(event: ValidatorRequest): void {
  const channelId = entityUUID(event, [event.params.withdrawalChannel.toHexString()]);

  let entity = WithdrawalChannel.load(channelId);

  if (entity == null) {
    entity = new WithdrawalChannel(channelId);
    entity.withdrawalChannel = event.params.withdrawalChannel;
    entity.factory = entityUUID(event, []);
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

  let commonValidationKeyEntry = CommonValidationKeyEntry.load(keyToDelete!.publicKey.toHexString());
  commonValidationKeyEntry!.validationKeyCount = commonValidationKeyEntry!.validationKeyCount.minus(BigInt.fromI32(1));
  commonValidationKeyEntry!.editedAt = event.block.timestamp;
  commonValidationKeyEntry!.editedAtBlock = event.block.number;
  commonValidationKeyEntry!.save();

  channel!.total = BigInt.fromI32(channel!.total.toI32() - 1);
  channel!.editedAt = event.block.timestamp;
  channel!.editedAtBlock = event.block.number;
  channel!.save();

  const se = createRemovedValidationKeysSystemEvent(event, event.address, event.params.withdrawalChannel);
  se.count = se.count.plus(BigInt.fromI32(1));
  se.newTotal = channel!.total;
  se.save();
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
  const depositorId = entityUUID(event, [event.params.depositor.toHexString()]);

  key!.funded = fundedKeyId;
  key!.editedAt = event.block.timestamp;
  key!.editedAtBlock = event.block.number;

  let depositIndex = 1;
  let depositEventId = `${key!.publicKey.toHexString()}-${depositIndex.toString()}`;
  let depositEvent = DepositEvent.load(depositEventId);
  while (depositEvent != null) {
    depositIndex++;
    depositEventId = `${key!.publicKey.toHexString()}-${depositIndex.toString()}`;
    depositEvent = DepositEvent.load(depositEventId);
  }
  depositEventId = `${key!.publicKey.toHexString()}-${(depositIndex - 1).toString()}`;

  fundedKey.depositEvent = depositEventId;
  fundedKey.validationKey = keyId;
  fundedKey.validatorId = event.params.id;
  fundedKey.depositor = depositorId;
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

  const se = createExternalFundingSystemAlert(event, key!.publicKey);
  if (se.logIndex !== null && (se.logIndex as BigInt).equals(event.logIndex.minus(BigInt.fromI32(1)))) {
    cancelSystemEvent(se.id, 'ExternalFundingSystemAlert');
  }

  const systemEvent = createFundedValidationKeySystemEvent(
    event,
    event.address,
    event.params.withdrawalChannel,
    event.params.depositor
  );
  systemEvent.count = systemEvent.count.plus(BigInt.fromI32(1));
  systemEvent.newTotal = channel!.funded;
  const fundedKeys = systemEvent.fundedValidationKeys;
  fundedKeys.push(fundedKeyId);
  systemEvent.fundedValidationKeys = fundedKeys;
  systemEvent.save();

  const factory = vFactory.load(entityUUID(event, []));
  factory!.totalActivatedValidators = factory!.totalActivatedValidators.plus(BigInt.fromI32(1));
  factory!.save();
}

export function handleExitValidator(event: ExitValidator): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    const exitRequestId = eventUUID(event, [event.params.id.toString()]);
    const exitRequest = new ExitRequest(exitRequestId);

    exitRequest.validator = fundedKeyId;
    exitRequest.emitter = fundedKey.owner as Bytes;
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

  const oldLimit = channel!.limit;

  channel!.limit = event.params.limit;
  channel!.editedAt = event.block.timestamp;
  channel!.editedAtBlock = event.block.number;

  channel!.save();

  if (oldLimit.notEqual(event.params.limit)) {
    const se = createUpdatedLimitSystemEvent(event, event.address, event.params.withdrawalChannel);
    if (se.oldLimit === null) {
      se.oldLimit = oldLimit;
    }
    se.newLimit = event.params.limit;
    se.save();
  }
}

export function handleSetValidatorOwner(event: SetValidatorOwner): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    let oldOwner = fundedKey.owner;
    if (oldOwner === null) {
      oldOwner = Address.zero();
    }
    fundedKey.owner = event.params.owner;

    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();

    if (oldOwner != event.params.owner) {
      const se = createValidatorOwnerChangedSystemEvent(event, event.address, event.params.id);
      se.oldOwner = oldOwner;
      se.newOwner = event.params.owner;
      se.save();
    }
  }
}

export function handleSetValidatorFeeRecipient(event: SetValidatorFeeRecipient): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    let oldFeeRecipient = fundedKey.feeRecipient;
    if (oldFeeRecipient === null) {
      oldFeeRecipient = Address.zero();
    }
    fundedKey.feeRecipient = event.params.feeRecipient;

    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();

    if (oldFeeRecipient != event.params.feeRecipient) {
      const se = createValidatorFeeRecipientChangedSystemEvent(event, event.address, event.params.id);
      se.oldFeeRecipient = oldFeeRecipient;
      se.newFeeRecipient = event.params.feeRecipient;
      se.save();
    }
  }
}

export function handleSetValidatorExtraData(event: SetValidatorExtraData): void {
  const fundedKeyId = entityUUID(event, [event.params.id.toString()]);
  const fundedKey = FundedValidationKey.load(fundedKeyId);

  if (fundedKey != null) {
    let oldExtraData = fundedKey.extraData;
    if (oldExtraData === null) {
      oldExtraData = '';
    }
    fundedKey.extraData = event.params.extraData;

    fundedKey.editedAt = event.block.timestamp;
    fundedKey.editedAtBlock = event.block.number;

    fundedKey.save();
    if (oldExtraData != event.params.extraData) {
      const se = createValidatorExtraDataChangedSystemEvent(event, event.address, event.params.id);
      se.oldExtraData = oldExtraData;
      se.newExtraData = event.params.extraData;
      se.save();
    }
  }
}

export function handleSetMetadata(event: SetMetadata): void {
  const factory = vFactory.load(entityUUID(event, []));

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
  const factory = vFactory.load(entityUUID(event, []));

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
  const factory = vFactory.load(entityUUID(event, []));

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
  const factory = vFactory.load(entityUUID(event, []));

  let oldValue = factory!.treasury;
  if (oldValue === null) {
    oldValue = externalEntityUUID(Address.zero(), []);
  }

  factory!.treasury = externalEntityUUID(event.params.treasury, []);

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(event, event.address, `treasury`, oldValue);
  systemEvent.newValue = event.params.treasury.toHexString();
  systemEvent.save();
}

export function handleSetMinimalRecipientImplementation(event: SetMinimalRecipientImplementation): void {
  const factory = vFactory.load(entityUUID(event, []));

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
  const factory = vFactory.load(entityUUID(event, []));

  let oldValue = factory!.nexus;
  if (oldValue === null) {
    oldValue = externalEntityUUID(Address.zero(), []);
  }

  factory!.nexus = externalEntityUUID(event.params.hatcherRegistry, []);

  factory!.editedAt = event.block.timestamp;
  factory!.editedAtBlock = event.block.number;

  factory!.save();

  const systemEvent = createChangedFactoryParameterSystemEvent(event, event.address, `nexus`, oldValue);
  systemEvent.newValue = event.params.hatcherRegistry.toHexString();
  systemEvent.save();
}

export function handleApproveDepositor(event: ApproveDepositor): void {
  const depositorId = entityUUID(event, [event.params.wc.toHexString(), event.params.depositor.toHexString()]);
  let depositor = FactoryDepositor.load(depositorId);
  const channelId = entityUUID(event, [event.params.wc.toHexString()]);
  let channel = WithdrawalChannel.load(channelId);

  if (channel == null) {
    channel = new WithdrawalChannel(channelId);
    channel.withdrawalChannel = event.params.wc;
    channel.factory = externalEntityUUID(event.address, []);
    channel.total = BigInt.fromI32(0);
    channel.funded = BigInt.fromI32(0);
    channel.limit = BigInt.fromI32(0);
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
