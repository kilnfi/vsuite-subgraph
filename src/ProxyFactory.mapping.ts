import { ERC1155Integration, ERC20, vNFTIntegration } from '../generated/schema';
import {
  ERC20 as ERC20Template,
  ERC1155 as ERC1155Template,
  vNFT as vNFTTemplate,
  ERC20_1_0_0_rc4 as ERC20_1_0_0_rc4Template,
  ERC1155_1_0_0_rc4 as ERC1155_1_0_0_rc4Template
} from '../generated/templates';
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
import { getOrCreateRewardSummaries } from './utils/rewards';
import { getOrCreateTUPProxy } from './TUPProxy.mapping';

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
    ERC20_1_0_0_rc4Template.create(event.params.proxy);

    const integration = new ERC20(event.params.proxy);
    integration.proxy = getOrCreateTUPProxy(event, event.params.proxy).id;
    integration.address = event.params.proxy;
    integration.channel = channel;
    integration.paused = false;
    integration.name = '';
    integration.symbol = '';
    integration.totalSupply = BigInt.zero();
    integration.totalUnderlyingSupply = BigInt.zero();
    integration.decimals = BigInt.fromI32(18);
    integration.admin = Address.zero();
    integration.maxCommission = BigInt.zero();
    integration.tickets = [];
    integration.summaries = getOrCreateRewardSummaries(event, event.params.proxy).id;
    if (channel.equals(CHANNEL_NATIVE_20_vPOOL_BYTES32)) {
      integration.type = 'Native20';
    } else if (channel.equals(CHANNEL_LIQUID_20_A_vPOOL_BYTES32)) {
      integration.type = 'Liquid20A';
    } else if (channel.equals(CHANNEL_LIQUID_20_C_vPOOL_BYTES32)) {
      integration.type = 'Liquid20C';
    }

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
    ERC1155_1_0_0_rc4Template.create(event.params.proxy);

    const integration = new ERC1155Integration(event.params.proxy);
    integration.proxy = getOrCreateTUPProxy(event, event.params.proxy).id;
    integration.address = event.params.proxy;
    integration.channel = channel;
    integration.paused = false;
    integration.name = '';
    integration.symbol = '';
    integration.uriPrefix = '';
    integration.totalSupply = BigInt.zero();
    integration.totalUnderlyingSupply = BigInt.zero();

    integration.createdAt = event.block.timestamp;
    integration.editedAt = event.block.timestamp;
    integration.createdAtBlock = event.block.number;
    integration.editedAtBlock = event.block.number;
    integration.admin = Address.zero();
    integration.maxCommission = BigInt.zero();
    if (channel.equals(CHANNEL_NATIVE_1155_vPOOL_BYTES32)) {
      integration.type = 'Native1155';
    } else if (channel.equals(CHANNEL_LIQUID_1155_vPOOL_vPOOL_BYTES32)) {
      integration.type = 'Liquid1155';
    }

    integration.save();
  } else if (channel.equals(CHANNEL_VNFT_BYTES32)) {
    vNFTTemplate.create(event.params.proxy);

    const vnft = new vNFTIntegration(event.params.proxy);
    vnft.proxy = getOrCreateTUPProxy(event, event.params.proxy).id;
    vnft.address = event.params.proxy;
    vnft.channel = channel;
    vnft.paused = false;
    vnft.name = '';
    vnft.symbol = '';
    vnft.uriPrefix = '';
    vnft.supply = BigInt.zero();
    vnft.operatorCommission = BigInt.zero();
    vnft.integratorCommission = BigInt.zero();
    vnft.integrator = Address.zero();
    vnft.vFactory = Address.zero();
    vnft.extraData = '';
    vnft.execLayerVault = Address.zero();
    vnft.soulboundMode = false;
    vnft.admin = Address.zero();
    vnft.type = 'vNFT';

    vnft.createdAt = event.block.timestamp;
    vnft.editedAt = event.block.timestamp;
    vnft.createdAtBlock = event.block.number;
    vnft.editedAtBlock = event.block.number;

    vnft.save();
  }
  // else if () {}
}
