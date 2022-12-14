import { BigInt } from "@graphprotocol/graph-ts"
import { WithdrawalChannel, ValidationKey } from "../generated/schema"
import {
 AddedValidators,
  RemovedValidator
} from "../generated/templates/vFactory/vFactoryV1"
import { Bytes } from '@graphprotocol/graph-ts'
import { store } from '@graphprotocol/graph-ts'

export function handleAddedValidators(event: AddedValidators): void {
  
  let channelId = event.params.withdrawalChannel.toHex() + "@" + event.address.toHex();

  let entity = WithdrawalChannel.load(channelId)

  if (entity == null) {
    entity = new WithdrawalChannel(channelId)
    entity.withdrawalChannel = event.params.withdrawalChannel
    entity.factory = event.address
    entity.keyCount = BigInt.fromI32(0)
  }
  let keyCount = entity.keyCount.toI32()
  
  for (let idx = 0; idx < (event.params.keys.length) / (48 + 96); ++idx ) {
    let signature= Bytes.fromUint8Array(event.params.keys.slice(idx * (48 + 96), idx * (48 + 96) + 96))
    let publicKey = Bytes.fromUint8Array(event.params.keys.slice(idx * (48 + 96) + 96, (idx + 1) * (48 + 96)))
    let keyId = event.params.withdrawalChannel.toHex() + "@" + (keyCount + idx).toString();
    let keyEntity = new ValidationKey(keyId)
    keyEntity.signature = signature
    keyEntity.publicKey = publicKey
    keyEntity.withdrawalChannel = channelId
    keyEntity.index = BigInt.fromI32(keyCount + idx)
    keyEntity.save()
  }

  entity.keyCount = BigInt.fromI32(entity.keyCount.toI32() + (event.params.keys.length) / (48 + 96));

  entity.save()
}

export function handleRemovedValidator(event: RemovedValidator): void {
  let channelId = event.params.withdrawalChannel.toHex() + "@" + event.address.toHex();

  let channel = WithdrawalChannel.load(channelId)

  let keyId = event.params.withdrawalChannel.toHex() + "@" + event.params.validatorIndex.toString()
  let keyIndex = event.params.validatorIndex.toI32()

  let keyToDelete = ValidationKey.load(keyId)

  if (keyIndex == channel!.keyCount.toI32() - 1) {
    store.remove('ValidationKey', keyId)
  } else {
    let lastKeyId = event.params.withdrawalChannel.toHex() + "@" + (channel!.keyCount.toI32() - 1).toString()
    let lastKey = ValidationKey.load(lastKeyId)
    keyToDelete!.publicKey = lastKey!.publicKey
    keyToDelete!.signature = lastKey!.signature
    keyToDelete!.save()
    store.remove('ValidationKey', lastKeyId)
  }

  channel!.keyCount = BigInt.fromI32(channel!.keyCount.toI32() - 1)
  channel!.save()
}

