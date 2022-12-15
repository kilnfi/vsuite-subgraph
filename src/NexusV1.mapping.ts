import {
    Initialized,
  SpawnedFactory,
} from "../generated/NexusV1/NexusV1"
import {
  vFactory as vFactoryTemplate,
} from "../generated/templates"
import { Nexus, vFactory, vTreasury } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

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

