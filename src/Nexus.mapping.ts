import { getOrCreateMetaContract } from './utils/MetaContract.utils';
import {
  Initialized,
  SetCoreHatchers,
  SetDepositContract,
  SetGlobalConsensusLayerSpec,
  SetGlobalOracle,
  SetGlobalRecipient,
  SetMinimalRecipientImplementation,
  SetPluggableHatcher,
  SpawnedFactory,
  SpawnedPool,
  SetAdmin
} from '../generated/Nexus/Nexus';
import {
  vOracleAggregator as vOracleAggregatorTemplate,
  vCoverageRecipient as vCoverageRecipientTemplate,
  vExecLayerRecipient as vExecLayerRecipientTemplate,
  vFactory as vFactoryTemplate,
  vPool as vPoolTemplate,
  vExitQueue as vExitQueueTemplate,
  vTreasury as vTreasuryTemplate
} from '../generated/templates';
import {
  Nexus,
  vFactory,
  vTreasury,
  vPool,
  vExecLayerRecipient,
  vCoverageRecipient,
  vWithdrawalRecipient,
  vOracleAggregator,
  PluggableHatcher,
  vExitQueue
} from '../generated/schema';
import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

function _getOrCreateNexus(addr: Bytes, event: ethereum.Event): Nexus {
  let nexus = Nexus.load(addr);
  if (nexus == null) {
    nexus = new Nexus(event.address);

    nexus.address = event.address;
    nexus.admin = Address.zero();
    nexus.contract = getOrCreateMetaContract('Nexus');
    nexus.globalOracle = Address.zero();
    nexus.globalRecipient = Address.zero();
    nexus.depositContract = Address.zero();
    nexus.genesisTimestamp = BigInt.zero();
    nexus.epochsUntilFinal = BigInt.zero();
    nexus.slotsPerEpoch = BigInt.zero();
    nexus.secondsPerSlot = BigInt.zero();
    nexus.minimalRecipientImplementation = Address.zero();

    nexus.createdAt = event.block.timestamp;
    nexus.createdAtBlock = event.block.number;
  }
  return nexus;
}

export function handleInitialized(event: Initialized): void {
  const nexus = _getOrCreateNexus(event.address, event);
  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;

  nexus.save();
}

export function handleSpawnedFactory(event: SpawnedFactory): void {
  const treasury = new vTreasury(event.params.treasury);
  treasury.address = event.params.treasury;
  treasury.cub = event.params.treasury;
  treasury.operator = Address.zero();
  treasury.fee = BigInt.zero();
  treasury.factory = event.params.factory;
  treasury.createdAt = event.block.timestamp;
  treasury.editedAt = event.block.timestamp;
  treasury.createdAtBlock = event.block.number;
  treasury.editedAtBlock = event.block.number;

  vTreasuryTemplate.create(event.params.treasury);

  treasury.save();

  const factory = new vFactory(event.params.factory);
  factory.version = BigInt.fromI32(1);
  factory.address = event.params.factory;
  factory.contract = getOrCreateMetaContract('vFactory');
  factory.cub = event.params.factory;
  factory.treasury = Address.zero();
  factory.operatorName = '';
  factory.operatorUrl = '';
  factory.operatorIconUrl = '';
  factory.createdAt = event.block.timestamp;
  factory.editedAt = event.block.timestamp;
  factory.createdAtBlock = event.block.number;
  factory.editedAtBlock = event.block.number;

  factory.save();

  vFactoryTemplate.create(event.params.factory);
}

export function handleSpawnedPool(event: SpawnedPool): void {
  {
    const pool = new vPool(event.params.pool);

    pool.address = event.params.pool;
    pool.contract = getOrCreateMetaContract('vPool');
    pool.cub = event.params.pool;
    pool.factory = event.params.factory;
    pool.nexus = event.address;
    pool.totalSupply = BigInt.zero();
    pool.totalUnderlyingSupply = BigInt.zero();
    pool.purchasedValidatorCount = BigInt.zero();
    pool.requestedExits = BigInt.zero();
    pool.committed = BigInt.zero();
    pool.deposited = BigInt.zero();
    pool.lastEpoch = BigInt.zero();
    pool.expectedEpoch = BigInt.zero();

    pool.oracleAggregator = Address.zero();
    pool.coverageRecipient = Address.zero();
    pool.execLayerRecipient = Address.zero();
    pool.withdrawalRecipient = Address.zero();
    pool.exitQueue = Address.zero();
    pool.operatorFee = BigInt.zero();
    pool.epochsPerFrame = BigInt.zero();
    pool.maxAPRUpperBound = BigInt.zero();
    pool.maxAPRUpperCoverageBoost = BigInt.zero();
    pool.maxRelativeLowerBound = BigInt.zero();

    pool.createdAt = event.block.timestamp;
    pool.editedAt = event.block.timestamp;
    pool.createdAtBlock = event.block.number;
    pool.editedAtBlock = event.block.number;

    pool.save();
    vPoolTemplate.create(event.params.pool);
  }
  {
    const eq = new vExitQueue(event.params.exitQueue);

    eq.address = event.params.exitQueue;
    eq.contract = getOrCreateMetaContract('vExitQueue');
    eq.pool = event.params.pool;

    eq.createdAt = event.block.timestamp;
    eq.editedAt = event.block.timestamp;
    eq.createdAtBlock = event.block.number;
    eq.editedAtBlock = event.block.number;
    eq.ticketCount = BigInt.zero();
    eq.caskCount = BigInt.zero();
    eq.unclaimedFunds = BigInt.zero();

    eq.save();
    vExitQueueTemplate.create(event.params.exitQueue);
  }
  {
    const elr = new vExecLayerRecipient(event.params.execLayerRecipient);

    elr.totalSuppliedEther = BigInt.zero();
    elr.address = event.params.execLayerRecipient;
    elr.contract = getOrCreateMetaContract('vExecLayerRecipient');
    elr.cub = event.params.execLayerRecipient;
    elr.pool = event.params.pool;

    elr.createdAt = event.block.timestamp;
    elr.editedAt = event.block.timestamp;
    elr.createdAtBlock = event.block.number;
    elr.editedAtBlock = event.block.number;

    elr.save();
    vExecLayerRecipientTemplate.create(event.params.execLayerRecipient);
  }
  {
    const cr = new vCoverageRecipient(event.params.coverageRecipient);

    cr.totalSuppliedEther = BigInt.zero();
    cr.totalVoidedShares = BigInt.zero();
    cr.totalAvailableEther = BigInt.zero();
    cr.totalAvailableShares = BigInt.zero();
    cr.address = event.params.coverageRecipient;
    cr.contract = getOrCreateMetaContract('vCoverageRecipient');
    cr.cub = event.params.coverageRecipient;
    cr.pool = event.params.pool;

    cr.createdAt = event.block.timestamp;
    cr.editedAt = event.block.timestamp;
    cr.createdAtBlock = event.block.number;
    cr.editedAtBlock = event.block.number;

    cr.save();
    vCoverageRecipientTemplate.create(event.params.coverageRecipient);
  }

  {
    const wr = new vWithdrawalRecipient(event.params.withdrawalRecipient);

    wr.withdrawalCredentials = Bytes.fromHexString('0x010000000000000000000000').concat(
      event.params.withdrawalRecipient
    );
    wr.address = event.params.withdrawalRecipient;
    wr.cub = event.params.withdrawalRecipient;
    wr.pool = event.params.pool;

    wr.createdAt = event.block.timestamp;
    wr.editedAt = event.block.timestamp;
    wr.createdAtBlock = event.block.number;
    wr.editedAtBlock = event.block.number;

    wr.save();
  }

  {
    const oa = new vOracleAggregator(event.params.oracleAggregator);

    oa.address = event.params.oracleAggregator;
    oa.contract = getOrCreateMetaContract('vOracleAggregator');
    oa.cub = event.params.oracleAggregator;
    oa.pool = event.params.pool;
    oa.memberCount = BigInt.zero();
    oa.quorum = BigInt.fromI32(1);
    oa.highestReportedEpoch = BigInt.zero();

    oa.createdAt = event.block.timestamp;
    oa.editedAt = event.block.timestamp;
    oa.createdAtBlock = event.block.number;
    oa.editedAtBlock = event.block.number;

    oa.save();
    vOracleAggregatorTemplate.create(event.params.oracleAggregator);
  }
}

export function handleSetPluggableHatcher(event: SetPluggableHatcher): void {
  const nexus = Nexus.load(event.address);

  const ph = PluggableHatcher.load(event.address);

  if (ph != null) {
    ph.hatcherRegistry = event.address;
    ph.editedAt = event.block.timestamp;
    ph.editedAtBlock = event.block.number;
    ph.save();
  }

  nexus!.editedAt = event.block.timestamp;
  nexus!.editedAtBlock = event.block.number;
  nexus!.save();
}

export function handleSetCoreHatchers(event: SetCoreHatchers): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.factoryHatcher = event.params.factory;
  nexus.treasuryHatcher = event.params.treasury;
  nexus.poolHatcher = event.params.pool;
  nexus.withdrawalRecipientHatcher = event.params.withdrawalRecipient;
  nexus.execLayerRecipientHatcher = event.params.execLayerRecipient;
  nexus.coverageRecipientHatcher = event.params.coverageRecipient;
  nexus.oracleAggregatorHatcher = event.params.oracleAggregator;

  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;
  nexus.save();
}

export function handleSetGlobalRecipient(event: SetGlobalRecipient): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.globalRecipient = event.params.globalRecipient;
  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;
  nexus.save();
}

export function handleSetGlobalOracle(event: SetGlobalOracle): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.globalOracle = event.params.globalOracle;
  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;
  nexus.save();
}

export function handleSetMinimalRecipientImplementation(event: SetMinimalRecipientImplementation): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.minimalRecipientImplementation = event.params.minimalRecipientImplementationAddress;
  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;
  nexus.save();
}

export function handleSetDepositContract(event: SetDepositContract): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.depositContract = event.params.depositContractAddress;
  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;
  nexus.save();
}

export function handlerSetGlobalConsensusLayerSpec(event: SetGlobalConsensusLayerSpec): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.genesisTimestamp = event.params.genesisTimestamp;
  nexus.epochsUntilFinal = event.params.epochsUntilFinal;
  nexus.slotsPerEpoch = event.params.slotsPerEpoch;
  nexus.secondsPerSlot = event.params.secondsPerSlot;
  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;
  nexus.save();
}

export function handleSetAdmin(event: SetAdmin): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.admin = event.params.admin;

  nexus.editedAt = event.block.timestamp;
  nexus.editedAtBlock = event.block.number;

  nexus.save();
}
