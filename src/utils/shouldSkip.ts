import { dataSource, ethereum } from '@graphprotocol/graph-ts';

const skippedEvents: string[] = [
  '0x27a0ee1a915df7730fd0fe096ad743159b26b7fd0c8514f80d78f2fc079e05cf_288_mainnet'.toLowerCase(), // SetDepositedEthers
  '0x27a0ee1a915df7730fd0fe096ad743159b26b7fd0c8514f80d78f2fc079e05cf_289_mainnet'.toLowerCase(), // SetCommittedEthers
  '0x27a0ee1a915df7730fd0fe096ad743159b26b7fd0c8514f80d78f2fc079e05cf_292_mainnet'.toLowerCase() // ProcessedReport
];

export function shouldSkip(event: ethereum.Event): boolean {
  const eventId =
    (event.transaction.hash.toHexString() + '_' + event.logIndex.toString()).toLowerCase() + '_' + dataSource.network();
  for (let idx = 0; idx < skippedEvents.length; ++idx) {
    if (eventId == skippedEvents[idx]) {
      return true;
    }
  }
  return false;
}
