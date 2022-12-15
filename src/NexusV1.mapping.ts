import {
  SpawnedFactory,
} from "../generated/NexusV1/NexusV1"
import {
  vFactory as vFactoryTemplate,
} from "../generated/templates"
import { vFactory, vTreasury } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleSpawnedFactory(event: SpawnedFactory): void {
  const treasury = new vTreasury(event.params.treasury)
  treasury.address = event.params.treasury
  treasury.factory = event.params.factory

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

