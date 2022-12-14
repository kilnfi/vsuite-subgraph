import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  Initialized,
  SetAdmin,
  SetCoreHatchers,
  SetDepositContract,
  SetGlobalConsensusLayerSpec,
  SetGlobalOracle,
  SetGlobalRecipient,
  SetMinimalRecipientImplementation,
  SetPendingAdmin,
  SetPluggableHatcher,
  Spawn,
  SpawnedFactory,
  SpawnedPool,
  AdminChanged,
  BeaconUpgraded,
  Upgraded
} from "../generated/NexusV1/NexusV1"

export function createInitializedEvent(
  version: BigInt,
  cdata: Bytes
): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )
  initializedEvent.parameters.push(
    new ethereum.EventParam("cdata", ethereum.Value.fromBytes(cdata))
  )

  return initializedEvent
}

export function createSetAdminEvent(admin: Address): SetAdmin {
  let setAdminEvent = changetype<SetAdmin>(newMockEvent())

  setAdminEvent.parameters = new Array()

  setAdminEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return setAdminEvent
}

export function createSetCoreHatchersEvent(
  factory: Address,
  pool: Address,
  treasury: Address,
  withdrawalRecipient: Address,
  execLayerRecipient: Address,
  coverageRecipient: Address,
  oracleAggregator: Address
): SetCoreHatchers {
  let setCoreHatchersEvent = changetype<SetCoreHatchers>(newMockEvent())

  setCoreHatchersEvent.parameters = new Array()

  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
  )
  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )
  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam(
      "withdrawalRecipient",
      ethereum.Value.fromAddress(withdrawalRecipient)
    )
  )
  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam(
      "execLayerRecipient",
      ethereum.Value.fromAddress(execLayerRecipient)
    )
  )
  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam(
      "coverageRecipient",
      ethereum.Value.fromAddress(coverageRecipient)
    )
  )
  setCoreHatchersEvent.parameters.push(
    new ethereum.EventParam(
      "oracleAggregator",
      ethereum.Value.fromAddress(oracleAggregator)
    )
  )

  return setCoreHatchersEvent
}

export function createSetDepositContractEvent(
  depositContractAddress: Address
): SetDepositContract {
  let setDepositContractEvent = changetype<SetDepositContract>(newMockEvent())

  setDepositContractEvent.parameters = new Array()

  setDepositContractEvent.parameters.push(
    new ethereum.EventParam(
      "depositContractAddress",
      ethereum.Value.fromAddress(depositContractAddress)
    )
  )

  return setDepositContractEvent
}

export function createSetGlobalConsensusLayerSpecEvent(
  genesisTimestamp: BigInt,
  epochsUntilFinal: BigInt,
  slotsPerEpoch: BigInt,
  secondsPerSlot: BigInt
): SetGlobalConsensusLayerSpec {
  let setGlobalConsensusLayerSpecEvent = changetype<
    SetGlobalConsensusLayerSpec
  >(newMockEvent())

  setGlobalConsensusLayerSpecEvent.parameters = new Array()

  setGlobalConsensusLayerSpecEvent.parameters.push(
    new ethereum.EventParam(
      "genesisTimestamp",
      ethereum.Value.fromUnsignedBigInt(genesisTimestamp)
    )
  )
  setGlobalConsensusLayerSpecEvent.parameters.push(
    new ethereum.EventParam(
      "epochsUntilFinal",
      ethereum.Value.fromUnsignedBigInt(epochsUntilFinal)
    )
  )
  setGlobalConsensusLayerSpecEvent.parameters.push(
    new ethereum.EventParam(
      "slotsPerEpoch",
      ethereum.Value.fromUnsignedBigInt(slotsPerEpoch)
    )
  )
  setGlobalConsensusLayerSpecEvent.parameters.push(
    new ethereum.EventParam(
      "secondsPerSlot",
      ethereum.Value.fromUnsignedBigInt(secondsPerSlot)
    )
  )

  return setGlobalConsensusLayerSpecEvent
}

export function createSetGlobalOracleEvent(
  globalOracle: Address
): SetGlobalOracle {
  let setGlobalOracleEvent = changetype<SetGlobalOracle>(newMockEvent())

  setGlobalOracleEvent.parameters = new Array()

  setGlobalOracleEvent.parameters.push(
    new ethereum.EventParam(
      "globalOracle",
      ethereum.Value.fromAddress(globalOracle)
    )
  )

  return setGlobalOracleEvent
}

export function createSetGlobalRecipientEvent(
  globalRecipient: Address
): SetGlobalRecipient {
  let setGlobalRecipientEvent = changetype<SetGlobalRecipient>(newMockEvent())

  setGlobalRecipientEvent.parameters = new Array()

  setGlobalRecipientEvent.parameters.push(
    new ethereum.EventParam(
      "globalRecipient",
      ethereum.Value.fromAddress(globalRecipient)
    )
  )

  return setGlobalRecipientEvent
}

export function createSetMinimalRecipientImplementationEvent(
  minimalRecipientImplementationAddress: Address
): SetMinimalRecipientImplementation {
  let setMinimalRecipientImplementationEvent = changetype<
    SetMinimalRecipientImplementation
  >(newMockEvent())

  setMinimalRecipientImplementationEvent.parameters = new Array()

  setMinimalRecipientImplementationEvent.parameters.push(
    new ethereum.EventParam(
      "minimalRecipientImplementationAddress",
      ethereum.Value.fromAddress(minimalRecipientImplementationAddress)
    )
  )

  return setMinimalRecipientImplementationEvent
}

export function createSetPendingAdminEvent(
  pendingAdmin: Address
): SetPendingAdmin {
  let setPendingAdminEvent = changetype<SetPendingAdmin>(newMockEvent())

  setPendingAdminEvent.parameters = new Array()

  setPendingAdminEvent.parameters.push(
    new ethereum.EventParam(
      "pendingAdmin",
      ethereum.Value.fromAddress(pendingAdmin)
    )
  )

  return setPendingAdminEvent
}

export function createSetPluggableHatcherEvent(
  pluggableHatcher: Address,
  active: boolean
): SetPluggableHatcher {
  let setPluggableHatcherEvent = changetype<SetPluggableHatcher>(newMockEvent())

  setPluggableHatcherEvent.parameters = new Array()

  setPluggableHatcherEvent.parameters.push(
    new ethereum.EventParam(
      "pluggableHatcher",
      ethereum.Value.fromAddress(pluggableHatcher)
    )
  )
  setPluggableHatcherEvent.parameters.push(
    new ethereum.EventParam("active", ethereum.Value.fromBoolean(active))
  )

  return setPluggableHatcherEvent
}

export function createSpawnEvent(
  caller: Address,
  hatcher: Address,
  cub: Address
): Spawn {
  let spawnEvent = changetype<Spawn>(newMockEvent())

  spawnEvent.parameters = new Array()

  spawnEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  spawnEvent.parameters.push(
    new ethereum.EventParam("hatcher", ethereum.Value.fromAddress(hatcher))
  )
  spawnEvent.parameters.push(
    new ethereum.EventParam("cub", ethereum.Value.fromAddress(cub))
  )

  return spawnEvent
}

export function createSpawnedFactoryEvent(
  factory: Address,
  treasury: Address
): SpawnedFactory {
  let spawnedFactoryEvent = changetype<SpawnedFactory>(newMockEvent())

  spawnedFactoryEvent.parameters = new Array()

  spawnedFactoryEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  spawnedFactoryEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )

  return spawnedFactoryEvent
}

export function createSpawnedPoolEvent(
  factory: Address,
  pool: Address,
  withdrawalRecipient: Address,
  execLayerRecipient: Address,
  coverageRecipient: Address,
  oracleAggregator: Address
): SpawnedPool {
  let spawnedPoolEvent = changetype<SpawnedPool>(newMockEvent())

  spawnedPoolEvent.parameters = new Array()

  spawnedPoolEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  spawnedPoolEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
  )
  spawnedPoolEvent.parameters.push(
    new ethereum.EventParam(
      "withdrawalRecipient",
      ethereum.Value.fromAddress(withdrawalRecipient)
    )
  )
  spawnedPoolEvent.parameters.push(
    new ethereum.EventParam(
      "execLayerRecipient",
      ethereum.Value.fromAddress(execLayerRecipient)
    )
  )
  spawnedPoolEvent.parameters.push(
    new ethereum.EventParam(
      "coverageRecipient",
      ethereum.Value.fromAddress(coverageRecipient)
    )
  )
  spawnedPoolEvent.parameters.push(
    new ethereum.EventParam(
      "oracleAggregator",
      ethereum.Value.fromAddress(oracleAggregator)
    )
  )

  return spawnedPoolEvent
}

export function createAdminChangedEvent(
  previousAdmin: Address,
  newAdmin: Address
): AdminChanged {
  let adminChangedEvent = changetype<AdminChanged>(newMockEvent())

  adminChangedEvent.parameters = new Array()

  adminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdmin",
      ethereum.Value.fromAddress(previousAdmin)
    )
  )
  adminChangedEvent.parameters.push(
    new ethereum.EventParam("newAdmin", ethereum.Value.fromAddress(newAdmin))
  )

  return adminChangedEvent
}

export function createBeaconUpgradedEvent(beacon: Address): BeaconUpgraded {
  let beaconUpgradedEvent = changetype<BeaconUpgraded>(newMockEvent())

  beaconUpgradedEvent.parameters = new Array()

  beaconUpgradedEvent.parameters.push(
    new ethereum.EventParam("beacon", ethereum.Value.fromAddress(beacon))
  )

  return beaconUpgradedEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}
