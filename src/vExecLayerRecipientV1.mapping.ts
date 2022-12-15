import {
  SuppliedEther
} from "../generated/templates/vExecLayerRecipient/vExecLayerRecipientV1"
import { vExecLayerRecipient, ExecLayerSuppliedEther } from "../generated/schema"

export function handleSuppliedEther(event: SuppliedEther): void {
  
  const elseId = event.transaction.hash.toHexString() + "@" + event.transactionLogIndex.toString() + "@" + event.address.toHexString()
  const else_ = new ExecLayerSuppliedEther(elseId)
  const elr = vExecLayerRecipient.load(event.address)

  else_.execLayerRecipient = event.address
  else_.amount = event.params.amount

  else_.createdAt = event.block.timestamp
  else_.createdAtBlock = event.block.number
  else_.editedAt = event.block.timestamp
  else_.editedAtBlock = event.block.number

  elr!.totalSuppliedEther = elr!.totalSuppliedEther + event.params.amount

  elr!.editedAt = event.block.timestamp
  elr!.editedAtBlock = event.block.number

  elr!.save()
  else_.save();
}

