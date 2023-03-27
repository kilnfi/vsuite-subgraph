import { Bytes, log } from '@graphprotocol/graph-ts';
import { MetaContract } from '../generated/schema';
import { getOrCreateMetaContract } from './MetaContract.utils';

export const CHANNEL_NATIVE_VPOOL_BYTES32 = Bytes.fromHexString(
  '0x4e41544956455f76504f4f4c0000000000000000000000000000000000000000'
); //NATIVE_vPOOL

export const CHANNEL_VNFT_BYTES32 = Bytes.fromHexString(
  '0x764e465400000000000000000000000000000000000000000000000000000000'
); //vNFT

const CHANNELS = new Map<string, string>();
CHANNELS.set(CHANNEL_NATIVE_VPOOL_BYTES32.toHexString(), 'NATIVE_vPOOL');
CHANNELS.set(CHANNEL_VNFT_BYTES32.toHexString(), 'vNFT');

export function getChannelName(id: Bytes): string {
  if (!existsChannel(id)) {
    throw new Error(`Invalid channel id ${id.toHexString()}`);
  }

  return CHANNELS.get(id.toHexString());
}

export function existsChannel(id: Bytes): bool {
  return CHANNELS.has(id.toHexString());
}

export function getMetaContractForChannel(id: Bytes): string {
  if (!existsChannel(id)) {
    throw new Error(`Invalid channel id ${id.toHexString()}`);
  }

  let name = '';
  if (id.equals(CHANNEL_NATIVE_VPOOL_BYTES32)) {
    name = 'vStakesV1';
  } else if (id.equals(CHANNEL_VNFT_BYTES32)) {
    name = 'vNFTV1';
  }

  return getOrCreateMetaContract(name);
}
