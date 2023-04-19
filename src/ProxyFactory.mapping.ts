import { ERC1155Integration, ERC20 } from '../generated/schema';
import { ERC20 as ERC20Template, ERC1155 as ERC1155Template } from '../generated/templates';
import { DeployedProxy } from '../generated/templates/ProxyFactory/ProxyFactory';
import {
  CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32,
  CHANNEL_LIQUID_20_A_vPOOL_BYTES32,
  CHANNEL_LIQUID_20_C_vPOOL_BYTES32,
  CHANNEL_NATIVE_1155_vPOOL_BYTES32,
  CHANNEL_NATIVE_20_vPOOL_BYTES32,
  checkChannel
} from './utils/IntegrationChannel.utils';
import { Address, BigInt } from '@graphprotocol/graph-ts';

export function handleDeployedProxy(event: DeployedProxy): void {
  if (
    Address.fromByteArray(event.params.proxy).equals(Address.fromString('0x46ebeb3de4fc1dd81590d82bebcdaede6cf44883')) // BAD IMPLEMENTATION DO NOT TRACK
  ) {
    return;
  }

  const channel = event.params.channel;
  checkChannel(channel);

  if (
    channel.equals(CHANNEL_NATIVE_20_vPOOL_BYTES32) ||
    channel.equals(CHANNEL_LIQUID_20_A_vPOOL_BYTES32) ||
    channel.equals(CHANNEL_LIQUID_20_C_vPOOL_BYTES32)
  ) {
    ERC20Template.create(event.params.proxy);

    const integration = new ERC20(event.params.proxy);
    integration.address = event.params.proxy;
    integration.channel = channel;
    integration.paused = false;
    integration.name = '';
    integration.symbol = '';
    integration.totalSupply = BigInt.fromI32(0);
    integration.totalUnderlyingSupply = BigInt.fromI32(0);
    integration.decimals = BigInt.fromI32(18);

    integration.createdAt = event.block.timestamp;
    integration.editedAt = event.block.timestamp;
    integration.createdAtBlock = event.block.number;
    integration.editedAtBlock = event.block.number;

    integration.save();
  } else if (
    channel.equals(CHANNEL_NATIVE_1155_vPOOL_BYTES32) ||
    channel.equals(CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32)
  ) {
    ERC1155Template.create(event.params.proxy);

    const integration = new ERC1155Integration(event.params.proxy);
    integration.address = event.params.proxy;
    integration.channel = channel;
    integration.paused = false;
    integration.name = '';
    integration.symbol = '';
    integration.uriPrefix = '';
    integration.totalSupply = BigInt.fromI32(0);
    integration.totalUnderlyingSupply = BigInt.fromI32(0);

    integration.createdAt = event.block.timestamp;
    integration.editedAt = event.block.timestamp;
    integration.createdAtBlock = event.block.number;
    integration.editedAtBlock = event.block.number;

    integration.save();
  }
  // else if () {}
}
