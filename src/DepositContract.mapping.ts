import { DepositEvent } from '../generated/DepositContract/DepositContract';
import { DepositEvent as DepositEventEntity, CommonValidationKeyEntry } from '../generated/schema';
import { verify } from './bls12_381_verify';
import {
  FORK_VERSIONS,
  generateDepositDomain,
  hashTreeRootDepositMessage,
  hashTreeRootSigningData
} from './ssz_deposit_message';
import { BigInt, dataSource } from '@graphprotocol/graph-ts';
import { createExternalFundingSystemAlert } from './utils/utils';

export function handleDepositEvent(event: DepositEvent): void {
  let depositIndex = 0;
  let depositEventId = `${event.params.pubkey.toHexString()}-${depositIndex.toString()}`;
  let depositEvent = DepositEventEntity.load(depositEventId);
  while (depositEvent != null) {
    depositIndex++;
    depositEventId = `${event.params.pubkey.toHexString()}-${depositIndex.toString()}`;
    depositEvent = DepositEventEntity.load(depositEventId);
  }

  const deposit = new DepositEventEntity(depositEventId);

  deposit.tx = event.transaction.hash;
  deposit.logIndex = event.logIndex;
  deposit.validatorDepositIndex = BigInt.fromI32(depositIndex);

  deposit.pubkey = event.params.pubkey;
  deposit.withdrawalCredentials = event.params.withdrawal_credentials;
  deposit.signature = event.params.signature;

  let amountU64: u64;
  {
    const dataview = new DataView(event.params.amount.buffer);
    amountU64 = dataview.getUint64(0, true);
    deposit.amount = BigInt.fromU64(amountU64);
    deposit.amountRaw = event.params.amount;
  }
  {
    const dataview = new DataView(event.params.index.buffer);
    const indexU64 = dataview.getUint64(0, true);
    deposit.index = BigInt.fromU64(indexU64);
    deposit.indexRaw = event.params.index;
  }

  deposit.commonValidationKeyEntry = event.params.pubkey;
  deposit.verified = false;

  deposit.createdAt = event.block.timestamp;
  deposit.createdAtBlock = event.block.number;
  deposit.editedAt = event.block.timestamp;
  deposit.editedAtBlock = event.block.number;

  let commonValidationKeyEntry = CommonValidationKeyEntry.load(event.params.pubkey);
  if (commonValidationKeyEntry == null) {
    commonValidationKeyEntry = new CommonValidationKeyEntry(event.params.pubkey);
    commonValidationKeyEntry.depositEventCount = BigInt.fromI32(0);
    commonValidationKeyEntry.validationKeyCount = BigInt.fromI32(0);
    commonValidationKeyEntry.publicKey = event.params.pubkey;
    commonValidationKeyEntry.createdAt = event.block.timestamp;
    commonValidationKeyEntry.createdAtBlock = event.block.number;
    commonValidationKeyEntry.editedAt = event.block.timestamp;
    commonValidationKeyEntry.editedAtBlock = event.block.number;
  }

  commonValidationKeyEntry.depositEventCount = commonValidationKeyEntry.depositEventCount.plus(BigInt.fromI32(1));
  commonValidationKeyEntry.save();

  if (commonValidationKeyEntry.validationKeyCount.gt(BigInt.zero())) {
    const depositMessageRoot = hashTreeRootDepositMessage({
      pubkey: deposit.pubkey,
      withdrawalCredentials: deposit.withdrawalCredentials,
      amount: deposit.amount.toI64()
    });

    const forkVersion: Uint8Array = FORK_VERSIONS[dataSource.network() == 'mainnet' ? 0 : 1];
    const depositDomain: Uint8Array = generateDepositDomain(forkVersion);

    const signingRoot = hashTreeRootSigningData({
      objectRoot: depositMessageRoot,
      domain: depositDomain
    });

    const signature_verification = verify(deposit.signature, signingRoot, deposit.pubkey);

    if (signature_verification.error != null || signature_verification.value == false) {
      deposit.validSignature = false;
      deposit.validationError = signature_verification.error;
    } else {
      deposit.validSignature = true;
      const se = createExternalFundingSystemAlert(event, event.params.pubkey);
      se.key = event.params.pubkey;
      se.logIndex = event.logIndex;
      se.save();
    }
    deposit.verified = true;
  }

  deposit.save();
}
