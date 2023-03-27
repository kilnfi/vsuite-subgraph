import { vNFT, vStakes } from '../generated/templates';
import { DeployedProxy } from '../generated/templates/ProxyFactory/ProxyFactory';
import { vNFTIntegration, vStake } from '../generated/schema';
import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { CHANNEL_NATIVE_VPOOL_BYTES32, CHANNEL_VNFT_BYTES32 } from './IntegrationChannel.utils';

export function handleDeployedProxy(event: DeployedProxy): void {
  const channel = event.params.channel;

  if (channel.equals(CHANNEL_NATIVE_VPOOL_BYTES32)) {
    vStakes.create(event.params.proxy);
    const vstake = new vStake(event.params.proxy);
    vstake.address = event.params.proxy;
    vstake.channel = channel;
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
  } else if (channel.equals(CHANNEL_VNFT_BYTES32)) {
    vNFT.create(event.params.proxy);
    const vnft = new vNFTIntegration(event.params.proxy);
    vnft.name = '';
    vnft.symbol = '';
    vnft.extraData = '';
    vnft.uriPrefix = '';
    vnft.supply = BigInt.fromI32(0);
    vnft.supply = BigInt.fromI32(0);
    vnft.operatorCommission = BigInt.fromI32(0);
    vnft.integratorCommission = BigInt.fromI32(0);
    vnft.integrator = Address.empty();

    vnft.editedAt = event.block.timestamp;
    vnft.editedAtBlock = event.block.number;
    vnft.createdAt = event.block.timestamp;
    vnft.createdAtBlock = event.block.number;

    vnft.save();
  }
}
