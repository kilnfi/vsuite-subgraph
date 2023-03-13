import { vStakes } from '../generated/templates';
import { DeployedProxy } from '../generated/ProxyFactory/ProxyFactory';
import { vStake } from '../generated/schema';
import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { CHANNEL_NATIVE_VPOOL_BYTES32 } from './IntegrationChannel.utils';

export function handleDeployedProxy(event: DeployedProxy): void {
  if (event.params.channel.equals(CHANNEL_NATIVE_VPOOL_BYTES32)) {
    vStakes.create(event.params.proxy);
    const vstake = new vStake(event.params.proxy);
    vstake.address = event.params.proxy;
    vstake.channel = event.params.channel;
    vstake.vPool = Address.empty();
    vstake.name = '';
    vstake.symbol = '';
    vstake.decimals = BigInt.fromI32(18);
    vstake.integratorFee = BigInt.fromI32(0);
    vstake.totalSupply = BigInt.fromI32(0);
    vstake.totalUnderlyingSupply = BigInt.fromI32(0);

    vstake.createdAt = event.block.timestamp;
    vstake.editedAt = event.block.timestamp;
    vstake.createdAtBlock = event.block.number;
    vstake.editedAtBlock = event.block.number;

    vstake.save();
  }
  // else if (...){...}
}
