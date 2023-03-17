import { Address, ethereum } from '@graphprotocol/graph-ts';

// an event is not unique per transaction
export function eventUUID(event: ethereum.Event, keys: string[]): string {
  return `EVENT=${event.address.toHexString()}_${event.transaction.hash.toHexString()}${event.transactionLogIndex.toString()}__${keys.join(
    '_'
  )}`;
}

// an entity is unique per contract
export function entityUUID(event: ethereum.Event, keys: string[]): string {
  return `ENTITY=${event.address.toHexString()}__${keys.join('_')}`;
}

export function externalEntityUUID(address: Address, keys: string[]): string {
  return `ENTITY=${address.toHexString()}__${keys.join('_')}`;
}

export function txUniqueUUID(event: ethereum.Event, keys: string[]): string {
  return `TX_UNIQUE=${event.transaction.hash.toHexString()}__${keys.join('_')}`;
}
