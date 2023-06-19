import { Bytes, log } from '@graphprotocol/graph-ts';
import { getOrCreateMetaContract } from './MetaContract.utils';

export const CHANNEL_NATIVE_20_vPOOL_BYTES32 = Bytes.fromHexString(
  '0x4e41544956455f32305f76504f4f4c0000000000000000000000000000000000'
); //NATIVE_20_vPOOL

export const CHANNEL_LIQUID_20_A_vPOOL_BYTES32 = Bytes.fromHexString(
  '0x4c49515549445f32305f415f76504f4f4c000000000000000000000000000000'
); //LIQUID_20_A_vPOOL

export const CHANNEL_LIQUID_20_C_vPOOL_BYTES32 = Bytes.fromHexString(
  '0x4c49515549445f32305f435f76504f4f4c000000000000000000000000000000'
); //LIQUID_20_C_vPOOL

export const CHANNEL_NATIVE_1155_vPOOL_BYTES32 = Bytes.fromHexString(
  '0x4e41544956455f313135355f76504f4f4c000000000000000000000000000000'
); //NATIVE_1155_vPOOL

export const CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32 = Bytes.fromHexString(
  '0x4c49515549445f313135355f76504f4f4c000000000000000000000000000000'
); //LIQUID_1155_vPOOL

export const CHANNEL_VNFT_BYTES32 = Bytes.fromHexString(
  '0x764e465400000000000000000000000000000000000000000000000000000000'
); //vNFT

const CHANNELS_NAMES = new Map<string, string>();
const CHANNELS_CONTRACTS = new Map<string, string>();

CHANNELS_NAMES.set(CHANNEL_NATIVE_20_vPOOL_BYTES32.toHexString(), 'NATIVE_20_vPOOL');
CHANNELS_CONTRACTS.set(CHANNEL_NATIVE_20_vPOOL_BYTES32.toHexString(), 'Native20');

CHANNELS_NAMES.set(CHANNEL_LIQUID_20_A_vPOOL_BYTES32.toHexString(), 'LIQUID_20_A_vPOOL');
CHANNELS_CONTRACTS.set(CHANNEL_LIQUID_20_A_vPOOL_BYTES32.toHexString(), 'Liquid20A');

CHANNELS_NAMES.set(CHANNEL_LIQUID_20_C_vPOOL_BYTES32.toHexString(), 'LIQUID_20_C_vPOOL');
CHANNELS_CONTRACTS.set(CHANNEL_LIQUID_20_C_vPOOL_BYTES32.toHexString(), 'Liquid20C');

CHANNELS_NAMES.set(CHANNEL_NATIVE_1155_vPOOL_BYTES32.toHexString(), 'NATIVE_1155_vPOOL');
CHANNELS_CONTRACTS.set(CHANNEL_NATIVE_1155_vPOOL_BYTES32.toHexString(), 'Native1155');

CHANNELS_NAMES.set(CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32.toHexString(), 'LIQUID_1155_vPOOL');
CHANNELS_CONTRACTS.set(CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32.toHexString(), 'Liquid1155');

CHANNELS_NAMES.set(CHANNEL_VNFT_BYTES32.toHexString(), 'vNFT');
CHANNELS_CONTRACTS.set(CHANNEL_VNFT_BYTES32.toHexString(), 'vNFT');

export function checkChannel(id: Bytes): void {
  if (!existsChannel(id)) {
    throw new Error(`Invalid channel id ${id.toHexString()}`);
  }
}

export function getChannelName(id: Bytes): string {
  checkChannel(id);

  return CHANNELS_NAMES.get(id.toHexString());
}

export function existsChannel(id: Bytes): bool {
  return CHANNELS_NAMES.has(id.toHexString()) && CHANNELS_CONTRACTS.has(id.toHexString());
}

export function getMetaContractForChannel(id: Bytes): string {
  checkChannel(id);

  return getOrCreateMetaContract(CHANNELS_CONTRACTS.get(id.toHexString()));
}
