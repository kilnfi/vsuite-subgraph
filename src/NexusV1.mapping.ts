import {
  SpawnedFactory,
} from "../generated/NexusV1/NexusV1"
import {
  vFactory as vFactoryTemplate,
} from "../generated/templates"
import { vFactory } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleSpawnedFactory(event: SpawnedFactory): void {
  let entity = new vFactory(event.params.factory)
  entity.version = BigInt.fromI32(1)
  entity.address = event.params.factory
  entity.save()
  vFactoryTemplate.create(event.params.factory);
}

