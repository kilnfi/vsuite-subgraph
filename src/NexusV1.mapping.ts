import {
  SpawnedFactory,
} from "../generated/NexusV1/NexusV1"
import {
  vFactory as vFactoryTemplate,
} from "../generated/templates"
import { vFactory } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleSpawnedFactory(event: SpawnedFactory): void {
  const entity = new vFactory(event.params.factory)
  entity.version = BigInt.fromI32(1)
  entity.address = event.params.factory
  
  entity.operatorName = ""
  entity.operatorUrl = ""
  entity.operatorIconUrl = ""
  entity.createdAt = event.block.timestamp
  entity.editedAt = event.block.timestamp
  entity.createdAtBlock = event.block.number
  entity.editedAtBlock = event.block.number

  entity.save()
  vFactoryTemplate.create(event.params.factory);
}

