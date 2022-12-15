import {
    Initialized,
  SpawnedFactory,
  SpawnedPool
} from "../generated/NexusV1/NexusV1"
import {
    vExecLayerRecipient as vExecLayerRecipientTemplate,
  vFactory as vFactoryTemplate,
  vPool as vPoolTemplate
} from "../generated/templates"
import { Nexus, vFactory, vTreasury, vPool, vExecLayerRecipient } from "../generated/schema"
import { Address, BigInt } from "@graphprotocol/graph-ts"

export function handleInitialized(event: Initialized): void {
  const nexus = new Nexus(event.address)

  nexus.address = event.address;

  nexus.createdAt = event.block.timestamp
  nexus.editedAt = event.block.timestamp
  nexus.createdAtBlock = event.block.number
  nexus.editedAtBlock = event.block.number

  nexus.save()
}

export function handleSpawnedFactory(event: SpawnedFactory): void {
  const treasury = new vTreasury(event.params.treasury)
  treasury.address = event.params.treasury
  treasury.factory = event.params.factory
  treasury.createdAt = event.block.timestamp
  treasury.editedAt = event.block.timestamp
  treasury.createdAtBlock = event.block.number
  treasury.editedAtBlock = event.block.number

  treasury.save()

  const factory = new vFactory(event.params.factory)
  factory.version = BigInt.fromI32(1)
  factory.address = event.params.factory
  factory.treasury = event.params.treasury
  factory.operatorName = ""
  factory.operatorUrl = ""
  factory.operatorIconUrl = ""
  factory.createdAt = event.block.timestamp
  factory.editedAt = event.block.timestamp
  factory.createdAtBlock = event.block.number
  factory.editedAtBlock = event.block.number

  factory.save()
  
  vFactoryTemplate.create(event.params.factory);
}

export function handleSpawnedPool(event: SpawnedPool): void {
  const pool = new vPool(event.params.pool)
  
  pool.address = event.params.pool
  pool.factory = event.params.factory
  pool.nexus = event.address
  pool.totalSupply = BigInt.zero()
  pool.totalUnderlyingSupply = BigInt.zero()
  pool.purchasedValidatorCount = BigInt.zero()

  pool.oracleAggregator = Address.zero()
  pool.coverageRecipient = Address.zero()
  pool.execLayerRecipient = Address.zero()
  pool.withdrawalRecipient = Address.zero()
  pool.operatorFee = BigInt.zero()
  pool.epochsPerFrame = BigInt.zero()
  pool.maxAPRUpperBound = BigInt.zero()
  pool.maxAPRUpperCoverageBoost = BigInt.zero()
  pool.maxRelativeLowerBound = BigInt.zero()

  pool.createdAt = event.block.timestamp
  pool.editedAt = event.block.timestamp
  pool.createdAtBlock = event.block.number
  pool.editedAtBlock = event.block.number

  pool.save()
  vPoolTemplate.create(event.params.pool);

  const elr = new vExecLayerRecipient(event.params.execLayerRecipient)

  elr.totalSuppliedEther = BigInt.zero()
  elr.address = event.params.execLayerRecipient
  elr.pool = event.params.pool

  elr.createdAt = event.block.timestamp
  elr.editedAt = event.block.timestamp
  elr.createdAtBlock = event.block.number
  elr.editedAtBlock = event.block.number

  elr.save()
  vExecLayerRecipientTemplate.create(event.params.execLayerRecipient)

}

