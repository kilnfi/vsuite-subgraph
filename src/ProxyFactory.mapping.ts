import { ERC20 } from '../generated/schema';
import {
  ERC20 as ERC20Template,
  ERC20_1_0_0_rc4 as ERC20_1_0_0_rc4Template,
  ERC20_2_2_0 as ERC20_2_2_0Template,
  Native20_Fix_09_12_Oracle_Report
} from '../generated/templates';
import { DeployedProxy } from '../generated/templates/ProxyFactory/ProxyFactory';
import {
  CHANNEL_LIQUID_20_A_vPOOL_BYTES32,
  CHANNEL_LIQUID_20_C_vPOOL_BYTES32,
  CHANNEL_NATIVE_20_vPOOL_BYTES32,
  checkChannel
} from './utils/IntegrationChannel.utils';
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { addressInArray } from './utils/utils';
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
    //check is only for a goerli failed instance
    if (addressInArray(event.params.proxy, [Address.fromString('0xd32e4d4cbde76738a766f5413323d8a52838e145')])) {
      return;
    }
    ERC20Template.create(event.params.proxy);
    ERC20_1_0_0_rc4Template.create(event.params.proxy);
    ERC20_2_2_0Template.create(event.params.proxy);
    Native20_Fix_09_12_Oracle_Report.create(event.params.proxy);

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
  }
}
