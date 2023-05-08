import { Sha256 } from '../sha256';

const zeroHashes = [new Uint8Array(32)];

function digest64(a: Uint8Array, b: Uint8Array): Uint8Array {
  return new Sha256().update(a).update(b).final();
}

function zeroHash(depth: i32): Uint8Array {
  if (depth >= zeroHashes.length) {
    for (let i = zeroHashes.length; i <= depth; i++) {
      zeroHashes[i] = digest64(zeroHashes[i - 1], zeroHashes[i - 1]);
    }
  }
  return zeroHashes[depth];
}

export function bitLength(i: i32): i32 {
  if (i === 0) {
    return 0;
  }

  return i32(Math.floor(Math.log2(i)) + 1);
}

export function nextPowerOf2(n: i32): i32 {
  return n <= 0 ? 1 : i32(Math.pow(2, bitLength(n - 1)));
}

export function merkleize(chunks: Uint8Array[], padFor: i32): Uint8Array {
  const layerCount = bitLength(nextPowerOf2(padFor) - 1);
  if (chunks.length == 0) {
    return zeroHash(layerCount);
  }

  let chunkCount = chunks.length;

  // Instead of pushing on all padding zero chunks at the leaf level
  // we push on zero hash chunks at the highest possible level to avoid over-hashing
  for (let l = 0; l < layerCount; l++) {
    const padCount = chunkCount % 2;
    const paddedChunkCount = chunkCount + padCount;

    // if the chunks.length is odd
    // we need to push on the zero-hash of that level to merkleize that level
    for (let i = 0; i < padCount; i++) {
      chunks[chunkCount + i] = zeroHash(l);
    }

    for (let i = 0; i < paddedChunkCount; i += 2) {
      chunks[i / 2] = digest64(chunks[i], chunks[i + 1]);
    }

    chunkCount = paddedChunkCount / 2;
  }

  return chunks[0];
}

class DepositMessage {
  pubkey: Uint8Array;
  withdrawalCredentials: Uint8Array;
  amount: i64;
}

export function splitIntoRootChunks(longChunk: Uint8Array): Uint8Array[] {
  const chunkCount = i32(Math.ceil(f32(longChunk.length) / 32));
  const chunks = new Array<Uint8Array>(chunkCount);

  for (let i = 0; i < chunkCount; i++) {
    const chunk = new Uint8Array(32);
    chunk.set(longChunk.slice(i * 32, (i + 1) * 32));
    chunks[i] = chunk;
  }

  return chunks;
}

function hashTreeRootPubkey(pubkey: Uint8Array): Uint8Array {
  const roots = splitIntoRootChunks(pubkey);
  return merkleize(roots, roots.length);
}

function hashTreeRootWithdrawalCredentials(withdrawalCredentials: Uint8Array): Uint8Array {
  const roots = splitIntoRootChunks(withdrawalCredentials);
  return merkleize(roots, roots.length);
}

const NUMBER_2_POW_32: i64 = 2 ** 32;

function hashTreeRootAmount(amount: i64): Uint8Array {
  const uint8Array = new Uint8Array(32);
  const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
  dataView.setUint32(0, u32(amount & 0xffffffff), true);
  dataView.setUint32(4, u32((amount / NUMBER_2_POW_32) & 0xffffffff), true);
  return uint8Array;
}

export function hashTreeRootDepositMessage(value: DepositMessage): Uint8Array {
  const roots = new Array<Uint8Array>(3);

  roots[0] = hashTreeRootPubkey(value.pubkey);
  roots[1] = hashTreeRootWithdrawalCredentials(value.withdrawalCredentials);
  roots[2] = hashTreeRootAmount(value.amount);

  const root = merkleize(roots, 3);

  return root;
}

class SigningData {
  objectRoot: Uint8Array;
  domain: Uint8Array;
}

function hashTreeRootObjectRoot(objectRoot: Uint8Array): Uint8Array {
  const roots = splitIntoRootChunks(objectRoot);
  return merkleize(roots, roots.length);
}

function hashTreeRootDomain(domain: Uint8Array): Uint8Array {
  const roots = splitIntoRootChunks(domain);
  return merkleize(roots, roots.length);
}

export function hashTreeRootSigningData(value: SigningData): Uint8Array {
  const roots = new Array<Uint8Array>(2);

  roots[0] = hashTreeRootObjectRoot(value.objectRoot);
  roots[1] = hashTreeRootDomain(value.domain);

  const root = merkleize(roots, 2);

  return root;
}

class ForkData {
  currentVersion: Uint8Array;
  genesisValidatorsRoot: Uint8Array;
}

function hashTreeRootCurrentVersion(currentVersion: Uint8Array): Uint8Array {
  const roots = splitIntoRootChunks(currentVersion);
  return merkleize(roots, roots.length);
}

function hashTreeRootGenesisValidatorsRoot(genesisValidatorsRoot: Uint8Array): Uint8Array {
  const roots = splitIntoRootChunks(genesisValidatorsRoot);
  return merkleize(roots, roots.length);
}

function hashTreeRootForkData(value: ForkData): Uint8Array {
  const roots = new Array<Uint8Array>(2);

  roots[0] = hashTreeRootCurrentVersion(value.currentVersion);
  roots[1] = hashTreeRootGenesisValidatorsRoot(value.genesisValidatorsRoot);

  const root = merkleize(roots, 2);

  return root;
}

function hexStringToUint8Array(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw 'Invalid hexString';
  } /*from  w w w.  j  av a 2s  . c  o  m*/
  var arrayBuffer = new Uint8Array(hexString.length / 2);

  for (var i = 0; i < hexString.length; i += 2) {
    var byteValue = parseInt(hexString.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw 'Invalid hexString';
    }
    arrayBuffer[i / 2] = u8(byteValue);
  }

  return arrayBuffer;
}

function concatBytes(arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 1) return arrays[0];
  const length = arrays.reduce((a, arr) => a + arr.length, 0);
  const result = new Uint8Array(length);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const arr = arrays[i];
    result.set(arr, pad);
    pad += arr.length;
  }
  return result;
}

const generateForkData = (forkVersion: Uint8Array): ForkData => {
  return {
    currentVersion: forkVersion,
    genesisValidatorsRoot: GENESIS_VALIDATOR_ROOT
  };
};

export const generateDepositDomain = (forkVersion: Uint8Array): Uint8Array => {
  const forkData = generateForkData(forkVersion);

  return concatBytes([DOMAIN_DEPOSIT, hashTreeRootForkData(forkData).slice(0, 28)]);
};

export const DOMAIN_DEPOSIT = hexStringToUint8Array('03000000');
export const FORK_VERSIONS: Array<Uint8Array> = [
  hexStringToUint8Array('00000000'), // mainnet
  hexStringToUint8Array('00001020'), // prater
  hexStringToUint8Array('00002009') // pyrmont
];
export const GENESIS_VALIDATOR_ROOT = hexStringToUint8Array(
  '0000000000000000000000000000000000000000000000000000000000000000'
);
