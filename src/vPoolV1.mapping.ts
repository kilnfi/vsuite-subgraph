import {
  Mint,
  Burn,
  Transfer,
  Deposit,
  PurchasedValidators,
  RevenueUpdate,
  SetOracleAggregator,
  SetCoverageRecipient,
  SetExecLayerRecipient,
  SetWithdrawalRecipient,
  SetNexus,
  SetOperatorFee,
  SetEpochsPerFrame,
  SetReportBounds,
  Approval,
  ApproveDepositor
} from "../generated/templates/vPool/vPoolV1"
import { PoolBalance, PoolPurchasedValidator, vPool, RevenueUpdate as RevenueUpdateEntity, PoolBalanceApproval, PoolDepositor } from "../generated/schema"
import { Bytes, BigInt, Address, store } from "@graphprotocol/graph-ts"
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum"

function getOrCreateBalance(pool: Bytes, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalance {
  const balanceId = account.toHexString() + "@" + pool.toHexString()

  let balance = PoolBalance.load(balanceId)

  if (balance == null) {
    balance = new PoolBalance(balanceId)
    balance.address = account
    balance.pool = pool
    balance.amount = BigInt.zero()
    balance.totalApproval = BigInt.zero()
    balance.createdAt = timestamp
    balance.createdAtBlock = block
  }

  return balance
}

function saveOrEraseBalance(balance: PoolBalance, event: ethereum.Event): void {
  if (balance.amount == BigInt.zero() && balance.totalApproval == BigInt.zero()) {
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
  
  saveOrEraseBalance(balance, event)

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.totalSupply = event.params.totalSupply

  pool!.save()
}

export function handleBurn(event: Burn): void {
  const pool = vPool.load(event.address)

  const balance = getOrCreateBalance(event.address, event.params.burner, event.block.timestamp, event.block.number)

  balance.amount = balance.amount - event.params.amount
  
  saveOrEraseBalance(balance, event)

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

  saveOrEraseBalance(fromBalance, event)
  saveOrEraseBalance(toBalance, event)
  
  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()
}

export function handlePurchasedValidators(event: PurchasedValidators): void {
  const pool = vPool.load(event.address)

  const validatorCount = pool!.purchasedValidatorCount.toI32();

  for (let idx = 0; idx < event.params.validators.length; ++idx)  {

    const poolPurchasedValidatorId = (validatorCount + idx).toString() + "@" + event.params.validators[idx].toString() + "@" + pool!.factory.toHexString();
    const poolPurchasedValidator = new PoolPurchasedValidator(poolPurchasedValidatorId)
    const fundedKeyId = event.params.validators[idx].toString() + "@" + pool!.factory.toHexString();

    poolPurchasedValidator.pool = event.address
    poolPurchasedValidator.index = BigInt.fromI32(validatorCount + idx)
    poolPurchasedValidator.fundedValidationKey = fundedKeyId
    poolPurchasedValidator.createdAt = event.block.timestamp
    poolPurchasedValidator.editedAt = event.block.timestamp
    poolPurchasedValidator.createdAtBlock = event.block.number
    poolPurchasedValidator.editedAtBlock = event.block.number

    poolPurchasedValidator.save()
  
  }

  pool!.purchasedValidatorCount = BigInt.fromI32(pool!.purchasedValidatorCount.toI32() + event.params.validators.length)
  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()
}

export function handleRevenueUpdate(event: RevenueUpdate): void {
  const pool = vPool.load(event.address)
  
  const revenueUpdateId = event.address.toHexString() + "@" + event.params.epoch.toString()
  const revenueUpdate = new RevenueUpdateEntity(revenueUpdateId)

  revenueUpdate.pool = event.address
  revenueUpdate.epoch = event.params.epoch
  revenueUpdate.delta = event.params.delta
  revenueUpdate.covered = event.params.covered
  revenueUpdate.totalSupply = event.params.newTotalSupply
  revenueUpdate.totalUnderlyingSupply = event.params.newTotalUnderlyingSupply

  revenueUpdate.createdAt = event.block.timestamp
  revenueUpdate.createdAtBlock = event.block.number
  revenueUpdate.editedAt = event.block.timestamp
  revenueUpdate.editedAtBlock = event.block.number

  revenueUpdate.save()
  
  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()
}

export function handleSetOracleAggregator(event: SetOracleAggregator):void {
  const pool = vPool.load(event.address)

  pool!.oracleAggregator = event.params.oracleAggregator

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()
}

export function handleSetCoverageRecipient(event: SetCoverageRecipient):void {
  const pool = vPool.load(event.address)

  pool!.coverageRecipient = event.params.coverageRecipient

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()

}

export function handleSetExecLayerRecipient(event: SetExecLayerRecipient):void {
  const pool = vPool.load(event.address)

  pool!.execLayerRecipient = event.params.execLayerRecipient

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()


}

export function handleSetWithdrawalRecipient(event: SetWithdrawalRecipient):void {
  const pool = vPool.load(event.address)

  pool!.withdrawalRecipient = event.params.withdrawalRecipient

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()

}

export function handleSetOperatorFee(event: SetOperatorFee):void {

  const pool = vPool.load(event.address)

  pool!.operatorFee = event.params.operatorFeeBps

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()
}

export function handleSetEpochsPerFrame(event: SetEpochsPerFrame):void {
  const pool = vPool.load(event.address)

  pool!.epochsPerFrame = event.params.epochsPerFrame

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()

}

export function handleSetReportBounds(event: SetReportBounds):void {
  const pool = vPool.load(event.address)

  pool!.maxAPRUpperBound = event.params.maxAPRUpperBound
  pool!.maxAPRUpperCoverageBoost = event.params.maxAPRUpperCoverageBoost
  pool!.maxRelativeLowerBound = event.params.maxRelativeLowerBound

  pool!.editedAt = event.block.timestamp
  pool!.editedAtBlock = event.block.number
  pool!.save()


}

function getOrCreateApproval(balance: string, account: Bytes, timestamp: BigInt, block: BigInt): PoolBalanceApproval {
  const approvalId = account.toHexString() + "@" + balance

  let approval = PoolBalanceApproval.load(approvalId)

  if (approval == null) {
    approval = new PoolBalanceApproval(approvalId)
    approval.address = account
    approval.balance = balance
    approval.amount = BigInt.fromI32(0)
    approval.createdAt = timestamp
    approval.createdAtBlock = block
  }

  return approval
}

function saveOrEraseApproval(approval: PoolBalanceApproval, event: ethereum.Event): void {
  if (approval.amount == BigInt.zero()) {
    store.remove("PoolBalanceApproval", approval.id)
  } else {
  approval.editedAt = event.block.timestamp
  approval.editedAtBlock = event.block.number
    approval.save()
  }
}

export function handleApproval(event: Approval): void {

  const balance = getOrCreateBalance(event.address, event.params.owner, event.block.timestamp, event.block.number)
  const approval = getOrCreateApproval(balance.id, event.params.spender, event.block.timestamp, event.block.number)
  
  if (approval.amount >= event.params.value) {
    balance.totalApproval = (balance.totalApproval - (approval.amount - event.params.value))
  } else {
    balance.totalApproval = (balance.totalApproval + (event.params.value - approval.amount))
  }
  approval.amount = event.params.value

  saveOrEraseBalance(balance, event)
  saveOrEraseApproval(approval, event)
}

export function handleApproveDepositor(event: ApproveDepositor): void {
  const depositorId = event.params.depositor.toHexString() + "@" + event.address.toHexString()
  let depositor = PoolDepositor.load(depositorId)

  if (depositor == null) {
    if (event.params.allowed) {
      depositor = new PoolDepositor(depositorId)
      
      depositor.address = event.params.depositor
      depositor.pool = event.address

      depositor.createdAt = event.block.timestamp
      depositor.createdAtBlock = event.block.number
      depositor.editedAt = event.block.timestamp
      depositor.editedAtBlock = event.block.number
      depositor.save()
    }
  } else {
    if (!event.params.allowed) {
      store.remove("PoolDepositor", depositorId)
    } else {
      depositor.editedAt = event.block.timestamp
      depositor.editedAtBlock = event.block.number
      depositor.save()
    }
  }
}

