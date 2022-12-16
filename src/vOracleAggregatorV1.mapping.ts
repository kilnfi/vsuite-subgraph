import {
  AddedOracleAggregatorMember, RemovedOracleAggregatorMember
} from "../generated/templates/vOracleAggregator/vOracleAggregatorV1"
import { vOracleAggregator, OracleAggregatorMember } from "../generated/schema"
import {BigInt, log, store} from '@graphprotocol/graph-ts'

export function handleAddedOracleAggregatorMember(event: AddedOracleAggregatorMember): void {

  const oa = vOracleAggregator.load(event.address)

  const memberCount = oa!.memberCount.toI32()

  const oaMemberId = memberCount.toString() + "@" + event.address.toHexString()

  const oaMember = new OracleAggregatorMember(oaMemberId)

  oaMember.address = event.params.member
  oaMember.oracleAggregator = event.address
  oaMember.index = BigInt.fromI32(memberCount)
  oaMember.createdAt = event.block.timestamp
  oaMember.createdAtBlock = event.block.number
  oaMember.editedAt = event.block.timestamp
  oaMember.editedAtBlock = event.block.number

  oaMember.save()

  oa!.memberCount = oa!.memberCount + BigInt.fromI32(1)

  oa!.editedAt = event.block.timestamp
  oa!.editedAtBlock = event.block.number
  oa!.save()
}

export function handleRemovedOracleAggregatorMember(event: RemovedOracleAggregatorMember): void {

  const oa = vOracleAggregator.load(event.address)

  const memberCount = oa!.memberCount.toI32()
  let removedMemberIndex = -1;

  for (let idx = 0; idx < oa!.memberCount.toI32(); ++idx) {
    
    const oaMemberId = idx.toString() + "@" + event.address.toHexString()

    const oaMember = OracleAggregatorMember.load(oaMemberId)

    if (oaMember!.address == event.params.member) {
      removedMemberIndex = idx
      break
    }
  }

  if (removedMemberIndex == -1) {
    throw new Error("CANNOT FIND REMOVED MEMBER")
  }

  if (removedMemberIndex == memberCount - 1) {
    const oaMemberId = removedMemberIndex.toString() + "@" + event.address.toHexString()
    store.remove("OracleAggregatorMember", oaMemberId)
  } else {
    const removedOaMemberId = (memberCount - 1).toString() + "@" + event.address.toHexString()
    const swapOaMemberId = removedMemberIndex.toString() + "@" + event.address.toHexString() 

    const removedOaMember = OracleAggregatorMember.load(removedOaMemberId)
    const swapOaMember = OracleAggregatorMember.load(swapOaMemberId)

    swapOaMember!.address = removedOaMember!.address

    swapOaMember!.editedAt = event.block.timestamp
    swapOaMember!.editedAtBlock = event.block.number

    store.remove("OracleAggregatorMember", removedOaMemberId)
    swapOaMember!.save()
  }

  oa!.memberCount = oa!.memberCount - BigInt.fromI32(1)

  oa!.editedAt = event.block.timestamp
  oa!.editedAtBlock = event.block.number
  oa!.save()
}


