import { getOrCreateMetaContract } from './utils/MetaContract.utils';
import {
  Initialized,
  SetCoreHatchers,
  SetDepositContract,
  SetGlobalConsensusLayerSpec,
  SetGlobalOracle,
  SetGlobalRecipient,
  SetMinimalRecipientImplementation,
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
  vExitQueue,
  PendingKeyValidationRequest,
  ValidationKey,
  WithdrawalChannel,
  PendingKeyValidationTracker
} from '../generated/schema';
import {
  FORK_VERSIONS,
  generateDepositDomain,
  hashTreeRootDepositMessage,
  hashTreeRootSigningData
} from './ssz_deposit_message/index';
import { Address, BigInt, ByteArray, Bytes, ethereum, log, crypto, dataSource } from '@graphprotocol/graph-ts';
import { entityUUID, externalEntityUUID } from './utils/utils';
import { getOrCreateRewardSummaries } from './utils/rewards';
import { verify } from './bls12_381_verify';
import { getOrCreateTUPProxy } from './TUPProxy.mapping';

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

export function getOrLoadVerificationTracker(): PendingKeyValidationTracker {
  let tracker = PendingKeyValidationTracker.load('global');
  if (tracker == null) {
    tracker = new PendingKeyValidationTracker('global');
    tracker.total = BigInt.fromI32(0);
    tracker.current = BigInt.fromI32(0);
    tracker.save();
  }
  return tracker;
}

function _getOrCreateNexus(addr: Bytes, event: ethereum.Event): Nexus {
  let nexus = Nexus.load(addr);
  if (nexus == null) {
    nexus = new Nexus(addr);

    nexus.address = addr;
    nexus.admin = Address.zero();
    nexus.contract = getOrCreateMetaContract('Nexus');
    nexus.proxy = getOrCreateTUPProxy(event, Address.fromBytes(addr)).id;
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
  factory.totalActivatedValidators = BigInt.zero();
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
    pool.pluggedMultiPools = [];

    pool.oracleAggregator = Address.zero();
    pool.coverageRecipient = Address.zero();
    pool.execLayerRecipient = Address.zero();
    pool.withdrawalRecipient = Address.zero();
    pool.exitQueue = Address.zero();
    pool.operatorFee = BigInt.zero();
    pool.epochsPerFrame = BigInt.zero();
    pool.genesisTimestamp = BigInt.zero();
    pool.epochsUntilFinal = BigInt.zero();
    pool.slotsPerEpoch = BigInt.zero();
    pool.secondsPerSlot = BigInt.zero();
    pool.maxAPRUpperBound = BigInt.zero();
    pool.maxAPRUpperCoverageBoost = BigInt.zero();
    pool.maxRelativeLowerBound = BigInt.zero();

    pool.summaries = getOrCreateRewardSummaries(event, event.params.pool).id;

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
    eq.cub = event.params.exitQueue;

    eq.createdAt = event.block.timestamp;
    eq.editedAt = event.block.timestamp;
    eq.createdAtBlock = event.block.number;
    eq.editedAtBlock = event.block.number;
    eq.unfulfilledTickets = [];
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

export function handleSetCoreHatchers(event: SetCoreHatchers): void {
  const nexus = _getOrCreateNexus(event.address, event);

  nexus.factoryHatcher = event.params.factory;
  nexus.treasuryHatcher = event.params.treasury;
  nexus.poolHatcher = event.params.pool;
  nexus.withdrawalRecipientHatcher = event.params.withdrawalRecipient;
  nexus.execLayerRecipientHatcher = event.params.execLayerRecipient;
  nexus.coverageRecipientHatcher = event.params.coverageRecipient;
  nexus.oracleAggregatorHatcher = event.params.oracleAggregator;
  nexus.exitQueueHatcher = event.params.exitQueue;

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
