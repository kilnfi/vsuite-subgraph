import {
  Mint,
  Burn,
  Transfer,
  Deposit
} from "../generated/templates/vPool/vPoolV1"
import { PoolBalance, vPool } from "../generated/schema"
import { Bytes, BigInt, Address, store } from "@graphprotocol/graph-ts"
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum"

function getOrCreateBalance(pool: Bytes, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalance {
  const balanceId = account.toHexString() + "@" + pool.toHexString()

  let balance = PoolBalance.load(balanceId)

  if (balance == null) {
    balance = new PoolBalance(balanceId)
    balance.address = account
    balance.pool = pool
    balance.amount = BigInt.fromI32(0)
    balance.createdAt = timestamp
    balance.createdAtBlock = block
  }

  return balance
}

function saveOrErase(balance: PoolBalance, event: ethereum.Event): void {
  if (balance.amount == BigInt.fromI32(0)) {
    store.remove("PoolBalance", balance.id)
  } else {
  balance.editedAt = event.block.timestamp
  balance.editedAtBlock = event.block.number
    balance.save()
  }
}

export function handleDeposit(event: Deposit): void {
  const pool = vPool.load(event.address)

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.totalUnderlyingSupply = pool!.totalUnderlyingSupply + event.params.amount

  pool!.save()
}

export function handleMint(event: Mint): void {
  const pool = vPool.load(event.address)

  const balance = getOrCreateBalance(event.address, Address.fromHexString("0x0000000000000000000000000000000000000000"), event.block.timestamp, event.block.number)

  balance.amount = balance.amount + event.params.amount
  
  saveOrErase(balance, event)

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.totalSupply = event.params.totalSupply

  pool!.save()
}

export function handleBurn(event: Burn): void {
  const pool = vPool.load(event.address)

  const balance = getOrCreateBalance(event.address, event.params.burner, event.block.timestamp, event.block.number)

  balance.amount = balance.amount - event.params.amount
  
  saveOrErase(balance, event)

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.totalSupply = event.params.totalSupply

  pool!.save()
}

export function handleTransfer(event: Transfer): void {
  const pool = vPool.load(event.address)

  const fromBalance = getOrCreateBalance(event.address, event.params.from, event.block.timestamp, event.block.number)

  const toBalance = getOrCreateBalance(event.address, event.params.to, event.block.timestamp, event.block.number)

  fromBalance.amount = fromBalance.amount - event.params.value
  toBalance.amount = toBalance.amount + event.params.value

  saveOrErase(fromBalance, event)
  saveOrErase(toBalance, event)
  
  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()
}

