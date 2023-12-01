import { Address, ethereum, BigInt, Bytes, Entity, store } from '@graphprotocol/graph-ts';
import {
  AddedValidationKeysSystemEvent,
  ChangedCoverageRecipientParameterSystemEvent,
  ChangedFactoryParameterSystemEvent,
  ChangedOracleAggregatorParameterSystemEvent,
  ChangedPoolParameterSystemEvent,
  ClaimedExitQueueTicketSystemEvent,
  CoverageRecipientUpdatedEthSystemEvent,
  CoverageRecipientUpdatedSharesSystemEvent,
  DuplicateKeySystemAlert,
  ERC20DepositSystemEvent,
  ERC20ExitSystemEvent,
  ExternalFundingSystemAlert,
  FundedValidationKeySystemEvent,
  G,
  NewExitQueueCaskSystemEvent,
  NewExitQueueTicketSystemEvent,
  OracleMemberVotedSystemEvent,
  PoolDepositSystemEvent,
  PoolValidatorPurchaseSystemEvent,
  RemovedValidationKeysSystemEvent,
  ReportProcessedSystemEvent,
  UnassignedCommissionSold,
  UpdatedLimitSystemEvent,
  ValidatorExtraDataChangedSystemEvent,
  ValidatorFeeRecipientChangedSystemEvent,
  ValidatorOwnerChangedSystemEvent
} from '../../generated/schema';

// an event is not unique per transaction
export function eventUUID(event: ethereum.Event, keys: string[]): string {
  return `EVENT=${event.address.toHexString()}_${event.transaction.hash.toHexString()}${event.transactionLogIndex.toString()}__${keys.join(
    '_'
  )}`;
}

// an entity is unique per contract
export function entityUUID(event: ethereum.Event, keys: string[]): string {
  return `ENTITY=${event.address.toHexString()}__${keys.join('_')}`;
}

export function externalEntityUUID(address: Address, keys: string[]): string {
  return `ENTITY=${address.toHexString()}__${keys.join('_')}`;
}

export function txUniqueUUID(event: ethereum.Event, keys: string[]): string {
  return `TX_UNIQUE=${event.transaction.hash.toHexString()}__${keys.join('_')}`;
}

function getOrCreateG(): G {
  let g = G.load('G');
  if (g == null) {
    g = new G('G');
    g.systemLogIndex = BigInt.fromI32(0);
  }
  return g;
}

export function createAddedValidationKeysSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  withdrawalChannel: Bytes
): AddedValidationKeysSystemEvent {
  const g = getOrCreateG();

  const id = `AddedValidationKeysSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${withdrawalChannel.toHexString()}`;
  let systemEvent = AddedValidationKeysSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new AddedValidationKeysSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'AddedValidationKeysSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.withdrawalChannel = externalEntityUUID(factoryAddress, [withdrawalChannel.toHexString()]);
    systemEvent.count = BigInt.fromI32(0);
    systemEvent.newTotal = BigInt.fromI32(0);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createRemovedValidationKeysSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  withdrawalChannel: Bytes
): RemovedValidationKeysSystemEvent {
  const g = getOrCreateG();

  const id = `RemovedValidationKeysSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${withdrawalChannel.toHexString()}`;
  let systemEvent = RemovedValidationKeysSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new RemovedValidationKeysSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'RemovedValidationKeysSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.withdrawalChannel = externalEntityUUID(factoryAddress, [withdrawalChannel.toHexString()]);
    systemEvent.count = BigInt.fromI32(0);
    systemEvent.newTotal = BigInt.fromI32(0);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createUpdatedLimitSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  withdrawalChannel: Bytes
): UpdatedLimitSystemEvent {
  const g = getOrCreateG();

  const id = `UpdatedLimitSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${withdrawalChannel.toHexString()}`;
  let systemEvent = UpdatedLimitSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new UpdatedLimitSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'UpdatedLimitSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.withdrawalChannel = externalEntityUUID(factoryAddress, [withdrawalChannel.toHexString()]);
    systemEvent.oldLimit = null;
    systemEvent.newLimit = BigInt.fromI32(0);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createValidatorOwnerChangedSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  validatorId: BigInt
): ValidatorOwnerChangedSystemEvent {
  const g = getOrCreateG();

  const id = `ValidatorOwnerChangedSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${validatorId.toString()}`;
  let systemEvent = ValidatorOwnerChangedSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ValidatorOwnerChangedSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ValidatorOwnerChangedSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.validator = externalEntityUUID(factoryAddress, [validatorId.toString()]);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createValidatorFeeRecipientChangedSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  validatorId: BigInt
): ValidatorFeeRecipientChangedSystemEvent {
  const g = getOrCreateG();

  const id = `ValidatorFeeRecipientChangedSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${validatorId.toString()}`;
  let systemEvent = ValidatorFeeRecipientChangedSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ValidatorFeeRecipientChangedSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ValidatorFeeRecipientChangedSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.validator = externalEntityUUID(factoryAddress, [validatorId.toString()]);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createValidatorExtraDataChangedSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  validatorId: BigInt
): ValidatorExtraDataChangedSystemEvent {
  const g = getOrCreateG();

  const id = `ValidatorExtraDataChangedSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${validatorId.toString()}`;
  let systemEvent = ValidatorExtraDataChangedSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ValidatorExtraDataChangedSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ValidatorExtraDataChangedSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.validator = externalEntityUUID(factoryAddress, [validatorId.toString()]);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createDuplicateKeySystemAlert(
  event: ethereum.Event,
  factoryAddress: Address,
  publicKey: Bytes
): DuplicateKeySystemAlert {
  const g = getOrCreateG();

  const id = `DuplicateKeySystemAlert/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${publicKey.toHexString()}`;
  let systemEvent = DuplicateKeySystemAlert.load(id);
  if (systemEvent == null) {
    systemEvent = new DuplicateKeySystemAlert(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'DuplicateKeySystemAlert';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createExternalFundingSystemAlert(event: ethereum.Event, publicKey: Bytes): ExternalFundingSystemAlert {
  const g = getOrCreateG();

  const id = `ExternalFundingSystemAlert/${event.transaction.hash.toHexString()}/${publicKey.toHexString()}`;
  let systemEvent = ExternalFundingSystemAlert.load(id);
  if (systemEvent == null) {
    systemEvent = new ExternalFundingSystemAlert(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ExternalFundingSystemAlert';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createFundedValidationKeySystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  withdrawalChannel: Bytes,
  depositor: Address
): FundedValidationKeySystemEvent {
  const g = getOrCreateG();

  const id = `FundedValidationKeySystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${withdrawalChannel.toHexString()}`;
  let systemEvent = FundedValidationKeySystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new FundedValidationKeySystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'FundedValidationKeySystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.depositor = externalEntityUUID(factoryAddress, [depositor.toHexString()]);
    systemEvent.withdrawalChannel = externalEntityUUID(factoryAddress, [withdrawalChannel.toHexString()]);
    systemEvent.count = BigInt.fromI32(0);
    systemEvent.newTotal = BigInt.fromI32(0);
    systemEvent.fundedValidationKeys = [];

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createChangedFactoryParameterSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  parameter: string,
  oldValue: string
): ChangedFactoryParameterSystemEvent {
  const g = getOrCreateG();

  const id = `ChangedFactoryParameterSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${parameter}`;
  let systemEvent = ChangedFactoryParameterSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ChangedFactoryParameterSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ChangedFactoryParameterSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.parameter = parameter;
    systemEvent.oldValue = oldValue;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createReportProcessedSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  poolAddress: Address,
  epoch: BigInt
): ReportProcessedSystemEvent {
  const g = getOrCreateG();

  const id = `ReportProcessedSystemEvent/${event.transaction.hash.toHexString()}/${poolAddress.toHexString()}/${epoch.toString()}`;
  let systemEvent = ReportProcessedSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ReportProcessedSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ReportProcessedSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}
export function createOracleMemberVotedSystemEvent(
  event: ethereum.Event,
  factoryAddress: Address,
  poolAddress: Address,
  oracleAggregatorAddress: Address,
  voterAddress: Address,
  globalMember: boolean,
  epoch: BigInt
): OracleMemberVotedSystemEvent {
  const g = getOrCreateG();

  const id = `OracleMemberVotedSystemEvent/${event.transaction.hash.toHexString()}/${poolAddress.toHexString()}/${oracleAggregatorAddress.toHexString()}/${voterAddress.toHexString()}/${globalMember.toString()}/${epoch.toString()}`;
  let systemEvent = OracleMemberVotedSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new OracleMemberVotedSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'OracleMemberVotedSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.factory = factoryAddress;
    systemEvent.pool = poolAddress;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}
export function createChangedPoolParameterSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Address,
  parameter: string,
  oldValue: string
): ChangedPoolParameterSystemEvent {
  const g = getOrCreateG();

  const id = `ChangedPoolParameterSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${parameter}`;
  let systemEvent = ChangedPoolParameterSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ChangedPoolParameterSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ChangedPoolParameterSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;
    systemEvent.parameter = parameter;
    systemEvent.oldValue = oldValue;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createChangedCoverageRecipientParameterSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  coverageRecipientAddress: Address,
  parameter: string,
  oldValue: string
): ChangedCoverageRecipientParameterSystemEvent {
  const g = getOrCreateG();

  const id = `ChangedCoverageRecipientParameterSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${coverageRecipientAddress.toHexString()}/${parameter}`;
  let systemEvent = ChangedCoverageRecipientParameterSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ChangedCoverageRecipientParameterSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ChangedCoverageRecipientParameterSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;
    systemEvent.parameter = parameter;
    systemEvent.oldValue = oldValue;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createCoverageRecipientUpdatedEthSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  coverageRecipientAddress: Address
): CoverageRecipientUpdatedEthSystemEvent {
  const g = getOrCreateG();

  const id = `CoverageRecipientUpdatedEthSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${coverageRecipientAddress.toHexString()}`;
  let systemEvent = CoverageRecipientUpdatedEthSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new CoverageRecipientUpdatedEthSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'CoverageRecipientUpdatedEthSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.delta = BigInt.fromI32(0);
    systemEvent.total = BigInt.fromI32(0);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createCoverageRecipientUpdatedSharesSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  coverageRecipientAddress: Address
): CoverageRecipientUpdatedSharesSystemEvent {
  const g = getOrCreateG();

  const id = `CoverageRecipientUpdatedSharesSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${coverageRecipientAddress.toHexString()}`;
  let systemEvent = CoverageRecipientUpdatedSharesSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new CoverageRecipientUpdatedSharesSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'CoverageRecipientUpdatedSharesSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.delta = BigInt.fromI32(0);
    systemEvent.total = BigInt.fromI32(0);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createChangedOracleAggregatorParameterSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  oracleAggregatorAddress: Address,
  parameter: string,
  oldValue: string
): ChangedOracleAggregatorParameterSystemEvent {
  const g = getOrCreateG();

  const id = `ChangedOracleAggregatorParameterSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${oracleAggregatorAddress.toHexString()}/${parameter}`;
  let systemEvent = ChangedOracleAggregatorParameterSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ChangedOracleAggregatorParameterSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ChangedOracleAggregatorParameterSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.oracleAggregator = oracleAggregatorAddress;
    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;
    systemEvent.parameter = parameter;
    systemEvent.oldValue = oldValue;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createPoolDepositSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Address,
  depositor: Bytes
): PoolDepositSystemEvent {
  const g = getOrCreateG();

  const id = `PoolDepositSystemEvent/${event.transaction.hash.toHexString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${depositor.toHexString()}`;
  let systemEvent = PoolDepositSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new PoolDepositSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'PoolDepositSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.amountEth = BigInt.fromI32(0);
    systemEvent.amountShares = BigInt.fromI32(0);

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createPoolValidatorPurchaseSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Address
): PoolValidatorPurchaseSystemEvent {
  const g = getOrCreateG();

  const id = `PoolValidatorPurchaseSystemEvent/${event.transaction.hash.toHexString()}/${event.logIndex.toString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}`;
  let systemEvent = PoolValidatorPurchaseSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new PoolValidatorPurchaseSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'PoolValidatorPurchaseSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.validatorCount = BigInt.fromI32(0);
    systemEvent.validators = [];

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createNewExitQueueTicketSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  exitQueueAddress: Address,
  ticketId: BigInt
): NewExitQueueTicketSystemEvent {
  const g = getOrCreateG();

  const id = `NewExitQueueTicketSystemEvent/${event.transaction.hash.toHexString()}/${event.logIndex.toString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${exitQueueAddress.toHexString()}/${ticketId.toString()}`;
  let systemEvent = NewExitQueueTicketSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new NewExitQueueTicketSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'NewExitQueueTicketSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.exitQueue = exitQueueAddress;
    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createNewExitQueueCaskSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  exitQueueAddress: Address,
  caskId: BigInt
): NewExitQueueCaskSystemEvent {
  const g = getOrCreateG();

  const id = `NewExitQueueCaskSystemEvent/${event.transaction.hash.toHexString()}/${event.logIndex.toString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${exitQueueAddress.toHexString()}/${caskId.toString()}`;
  let systemEvent = NewExitQueueCaskSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new NewExitQueueCaskSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'NewExitQueueCaskSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.exitQueue = exitQueueAddress;
    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function createClaimedExitQueueTicketSystemEvent(
  event: ethereum.Event,
  factoryAddress: Bytes,
  poolAddress: Bytes,
  exitQueueAddress: Address,
  ticketId: BigInt
): ClaimedExitQueueTicketSystemEvent {
  const g = getOrCreateG();

  const id = `ClaimedExitQueueTicketSystemEvent/${event.transaction.hash.toHexString()}/${event.logIndex.toString()}/${factoryAddress.toHexString()}/${poolAddress.toHexString()}/${exitQueueAddress.toHexString()}/${ticketId.toString()}`;
  let systemEvent = ClaimedExitQueueTicketSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ClaimedExitQueueTicketSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ClaimedExitQueueTicketSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.exitQueue = exitQueueAddress;
    systemEvent.pool = poolAddress;
    systemEvent.factory = factoryAddress;

    systemEvent.remainingAmount = BigInt.fromI32(0);
    systemEvent.remainingEthAmount = BigInt.fromI32(0);
    systemEvent.claimedAmount = BigInt.fromI32(0);
    systemEvent.receivedEth = BigInt.fromI32(0);
    systemEvent.usedCaskCount = BigInt.fromI32(0);
    systemEvent.usedCasks = [];

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  return systemEvent;
}

export function cancelSystemEvent(id: string, entityName: string): void {
  store.remove(entityName, id);

  const g = getOrCreateG();
  g.systemLogIndex = g.systemLogIndex.minus(BigInt.fromI32(1));
  g.save();
}

export function getOrCreateUnassignedCommissionSold(): UnassignedCommissionSold {
  let ucs = UnassignedCommissionSold.load('G');
  if (ucs == null) {
    ucs = new UnassignedCommissionSold('G');
    ucs.active = false;
    ucs.amount = BigInt.zero();
    ucs.tx = new Bytes(0);
    ucs.logIndex = BigInt.zero();
    ucs.save();
  }
  return ucs;
}

export function _computeStakedEthValue(
  ownedPoolShares: BigInt,
  poolTotalSupply: BigInt,
  poolTotalUnderlyingSupply: BigInt
): BigInt {
  if (poolTotalSupply.equals(BigInt.zero())) {
    return BigInt.zero();
  }
  return ownedPoolShares.times(poolTotalUnderlyingSupply).div(poolTotalSupply);
}

export function _computeIntegratorCommissionEarned(
  ownedPoolShares: BigInt,
  poolTotalSupply: BigInt,
  poolTotalUnderlyingSupply: BigInt,
  injectedEth: BigInt,
  exitedEth: BigInt,
  fee: BigInt
): BigInt {
  const staked = _computeStakedEthValue(ownedPoolShares, poolTotalSupply, poolTotalUnderlyingSupply);
  if (injectedEth.ge(staked.plus(exitedEth))) {
    return BigInt.zero();
  }
  const rewardsEarned = staked.plus(exitedEth).minus(injectedEth);
  return rewardsEarned.times(fee).div(BigInt.fromI32(10000));
}

export function _computeIntegratorCommissionOwed(
  ownedPoolShares: BigInt,
  poolTotalSupply: BigInt,
  poolTotalUnderlyingSupply: BigInt,
  injectedEth: BigInt,
  exitedEth: BigInt,
  fee: BigInt,
  commissionPaid: BigInt
): BigInt {
  const earned = _computeIntegratorCommissionEarned(
    ownedPoolShares,
    poolTotalSupply,
    poolTotalUnderlyingSupply,
    injectedEth,
    exitedEth,
    fee
  );
  if (earned.gt(commissionPaid)) {
    return earned.minus(commissionPaid);
  }
  return BigInt.zero();
}

export function _computeEthAfterCommission(
  ownedPoolShares: BigInt,
  poolTotalSupply: BigInt,
  poolTotalUnderlyingSupply: BigInt,
  injectedEth: BigInt,
  exitedEth: BigInt,
  fee: BigInt,
  commissionPaid: BigInt
): BigInt {
  return _computeStakedEthValue(ownedPoolShares, poolTotalSupply, poolTotalUnderlyingSupply).minus(
    _computeIntegratorCommissionOwed(
      ownedPoolShares,
      poolTotalSupply,
      poolTotalUnderlyingSupply,
      injectedEth,
      exitedEth,
      fee,
      commissionPaid
    )
  );
}

export function createERC20DepositSystemEvent(
  event: ethereum.Event,
  erc20Address: Address,
  depositor: Address,
  amount: BigInt,
  shares: BigInt
): void {
  const g = getOrCreateG();

  const id = `ERC20DepositSystemEvent/${event.transaction.hash.toHexString()}/${event.logIndex.toString()}/${erc20Address.toHexString()}/${depositor.toHexString()}`;
  let systemEvent = ERC20DepositSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ERC20DepositSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ERC20DepositSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.integration = erc20Address;
    systemEvent.staker = depositor;
    systemEvent.depositedAmount = amount;
    systemEvent.mintedShares = shares;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  systemEvent.save();
}

export function createERC20ExitSystemEvent(
  event: ethereum.Event,
  erc20Address: Address,
  depositor: Address,
  amount: BigInt,
  shares: BigInt
): void {
  const g = getOrCreateG();

  const id = `ERC20ExitSystemEvent/${event.transaction.hash.toHexString()}/${event.logIndex.toString()}/${erc20Address.toHexString()}/${depositor.toHexString()}`;
  let systemEvent = ERC20ExitSystemEvent.load(id);
  if (systemEvent == null) {
    systemEvent = new ERC20ExitSystemEvent(id);
    systemEvent.index = g.systemLogIndex;
    systemEvent.type = 'ERC20ExitSystemEvent';

    systemEvent.tx = event.transaction.hash;
    systemEvent.who = event.transaction.from;

    systemEvent.integration = erc20Address;
    systemEvent.staker = depositor;
    systemEvent.exitedAmount = amount;
    systemEvent.exitedShares = shares;

    systemEvent.createdAt = event.block.timestamp;
    systemEvent.createdAtBlock = event.block.number;

    g.systemLogIndex = g.systemLogIndex.plus(BigInt.fromI32(1));
    g.save();
  }

  systemEvent.save();
}

export function addressInArray(address: Address, array: Array<Address>): boolean {
  for (let i = 0; i < array.length; i++) {
    if (address.equals(array[i])) {
      return true;
    }
  }
  return false;
}
