import { BigInt } from "@graphprotocol/graph-ts"
import {
  NexusV1,
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
import { ExampleEntity } from "../generated/schema"

export function handleInitialized(event: Initialized): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from)

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from)

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.version = event.params.version
  entity.cdata = event.params.cdata

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.admin(...)
  // - contract.coreHatchers(...)
  // - contract.depositContract(...)
  // - contract.globalConsensusLayerSpec(...)
  // - contract.globalOracle(...)
  // - contract.globalRecipient(...)
  // - contract.isPluggableHatcher(...)
  // - contract.minimalRecipientImplementation(...)
  // - contract.pendingAdmin(...)
  // - contract.plugOnFactory(...)
  // - contract.spawnFactory(...)
  // - contract.spawnPool(...)
  // - contract.spawnedFactory(...)
  // - contract.admin(...)
  // - contract.implementation(...)
  // - contract.paused(...)
}

export function handleSetAdmin(event: SetAdmin): void {}

export function handleSetCoreHatchers(event: SetCoreHatchers): void {}

export function handleSetDepositContract(event: SetDepositContract): void {}

export function handleSetGlobalConsensusLayerSpec(
  event: SetGlobalConsensusLayerSpec
): void {}

export function handleSetGlobalOracle(event: SetGlobalOracle): void {}

export function handleSetGlobalRecipient(event: SetGlobalRecipient): void {}

export function handleSetMinimalRecipientImplementation(
  event: SetMinimalRecipientImplementation
): void {}

export function handleSetPendingAdmin(event: SetPendingAdmin): void {}

export function handleSetPluggableHatcher(event: SetPluggableHatcher): void {}

export function handleSpawn(event: Spawn): void {}

export function handleSpawnedFactory(event: SpawnedFactory): void {}

export function handleSpawnedPool(event: SpawnedPool): void {}

export function handleAdminChanged(event: AdminChanged): void {}

export function handleBeaconUpgraded(event: BeaconUpgraded): void {}

export function handleUpgraded(event: Upgraded): void {}
