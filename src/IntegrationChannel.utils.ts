import { Bytes, log } from '@graphprotocol/graph-ts';

export const CHANNEL_NATIVE_VPOOL_BYTES32 = Bytes.fromHexString(
  '0x4e41544956455f76504f4f4c0000000000000000000000000000000000000000'
); //NATIVE_vPOOL

const CHANNELS = new Map<string, string>();
CHANNELS.set(CHANNEL_NATIVE_VPOOL_BYTES32.toHexString(), 'NATIVE_vPOOL');

export function getChannelName(id: Bytes): string {
  if (!existsChannel(id)) {
    throw new Error(`Invalid channel id ${id.toHexString()}`);
  }

  return CHANNELS.get(id.toHexString());
}

export function existsChannel(id: Bytes): bool {
  return CHANNELS.has(id.toHexString());
}
