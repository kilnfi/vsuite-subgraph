import { ERC1155Integration, ERC20, IntegrationList, vNFT, vNFTIntegration } from '../generated/schema';
import { ERC20 as ERC20Template, ERC1155 as ERC1155Template, vNFT as vNFTTemplate } from '../generated/templates';
import { DeployedProxy } from '../generated/templates/ProxyFactory/ProxyFactory';
import {
  CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32,
  CHANNEL_LIQUID_20_A_vPOOL_BYTES32,
  CHANNEL_LIQUID_20_C_vPOOL_BYTES32,
  CHANNEL_NATIVE_1155_vPOOL_BYTES32,
  CHANNEL_NATIVE_20_vPOOL_BYTES32,
  CHANNEL_VNFT_BYTES32,
  checkChannel
} from './utils/IntegrationChannel.utils';
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { externalEntityUUID } from './utils/utils';

export function handleDeployedProxy(event: DeployedProxy): void {
  if (
    Address.fromByteArray(event.params.proxy).equals(Address.fromString('0x46ebeb3de4fc1dd81590d82bebcdaede6cf44883')) // BAD IMPLEMENTATION DO NOT TRACK
  ) {
    return;
  }

  const channel = event.params.channel;
  checkChannel(channel);

  const list = IntegrationList.load('integrationList');

  if (
    channel.equals(CHANNEL_NATIVE_20_vPOOL_BYTES32) ||
    channel.equals(CHANNEL_LIQUID_20_A_vPOOL_BYTES32) ||
    channel.equals(CHANNEL_LIQUID_20_C_vPOOL_BYTES32)
  ) {
    ERC20Template.create(event.params.proxy);

    const integration = new ERC20(externalEntityUUID(event.params.proxy, []));
    integration.address = event.params.proxy;
    integration.channel = channel.toHexString();
    integration.paused = false;
    integration.name = '';
    integration.symbol = '';
    integration.totalSupply = BigInt.zero();
    integration.totalUnderlyingSupply = BigInt.zero();
    integration.decimals = BigInt.fromI32(18);
    integration.admin = Address.empty();
    integration.maxCommission = BigInt.zero();
    integration._poolsDerived = [];

    integration.createdAt = event.block.timestamp;
    integration.editedAt = event.block.timestamp;
    integration.createdAtBlock = event.block.number;
    integration.editedAtBlock = event.block.number;

    integration.save();
    const erc20s = list!.erc20s;
    erc20s.push(integration.id);
    list!.erc20s = erc20s;
  } else if (
    channel.equals(CHANNEL_NATIVE_1155_vPOOL_BYTES32) ||
    channel.equals(CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32)
  ) {
    ERC1155Template.create(event.params.proxy);

    const integration = new ERC1155Integration(externalEntityUUID(event.params.proxy, []));
    integration.address = event.params.proxy;
    integration.channel = channel.toHexString();
    integration.paused = false;
    integration.name = '';
    integration.symbol = '';
    integration.uriPrefix = '';
    integration.totalSupply = BigInt.zero();
    integration.totalUnderlyingSupply = BigInt.zero();
    integration._poolsDerived = [];

    integration.createdAt = event.block.timestamp;
    integration.editedAt = event.block.timestamp;
    integration.createdAtBlock = event.block.number;
    integration.editedAtBlock = event.block.number;
    integration.admin = Address.empty();
    integration.maxCommission = BigInt.zero();

    integration.save();
  } else if (channel.equals(CHANNEL_VNFT_BYTES32)) {
    vNFTTemplate.create(event.params.proxy);

    const vnft = new vNFTIntegration(externalEntityUUID(event.params.proxy, []));
    vnft.address = event.params.proxy;
    vnft.channel = channel.toHexString();
    vnft.paused = false;
    vnft.name = '';
    vnft.symbol = '';
    vnft.uriPrefix = '';
    vnft.supply = BigInt.zero();
    vnft.operatorCommission = BigInt.zero();
    vnft.integratorCommission = BigInt.zero();
    vnft.integrator = Address.empty();
    vnft.vFactory = externalEntityUUID(Address.zero(), []);
    vnft.extraData = '';
    vnft.execLayerVault = externalEntityUUID(Address.zero(), []);
    vnft.soulboundMode = false;
    vnft.admin = Address.empty();

    vnft.createdAt = event.block.timestamp;
    vnft.editedAt = event.block.timestamp;
    vnft.createdAtBlock = event.block.number;
    vnft.editedAtBlock = event.block.number;

    vnft.save();
  }
  // else if () {}

  list!.save();
}
