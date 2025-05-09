import { dataSource, ethereum } from '@graphprotocol/graph-ts';

const skippedEvents: string[] = [
  '0x27a0ee1a915df7730fd0fe096ad743159b26b7fd0c8514f80d78f2fc079e05cf_288_mainnet'.toLowerCase(), // SetDepositedEthers
  '0x27a0ee1a915df7730fd0fe096ad743159b26b7fd0c8514f80d78f2fc079e05cf_289_mainnet'.toLowerCase(), // SetCommittedEthers
  '0x27a0ee1a915df7730fd0fe096ad743159b26b7fd0c8514f80d78f2fc079e05cf_292_mainnet'.toLowerCase(), // ProcessedReport
  '0xc50902b8f07708902349a8259f4a25f9f2e8fdd4fc38c3e38d50e3736c843535_432_mainnet'.toLowerCase(), // ProcessedReport (Kiln)
  '0x0264583ac95a15752828ab4fc928479088f64b444a726a254edf9813908d02e8_395_mainnet'.toLowerCase() // ProcessedReport (Coinbase)
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
