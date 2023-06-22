import { Bytes } from '@graphprotocol/graph-ts';
import {
  ChannelImplementationUpdated,
  Initialized,
  ProxyFactoryDeployed
} from '../generated/IntegrationRouter/IntegrationRouter';
import { ERC20, IntegrationChannel, IntegrationList } from '../generated/schema';
import { ProxyFactory } from '../generated/templates';
import { existsChannel, getChannelName, getMetaContractForChannel } from './utils/IntegrationChannel.utils';

export function getAllIntegrations(): ERC20[] {
  const list = IntegrationList.load('integrationList');
  if (list) {
    let loaded: ERC20[] = [];
    for (let i = 0; i < list.integrations.length; i++) {
      loaded.push(ERC20.load(list.integrations[i])!);
    }
    return loaded;
  } else {
    return [];
  }
}

export function handleChannelImplementationUpdated(event: ChannelImplementationUpdated): void {
  const channel = event.params.channel;
  if (existsChannel(channel)) {
    const ts = event.block.timestamp;
    const blockId = event.block.number;
    let implem = IntegrationChannel.load(channel.toHexString());

    if (!implem) {
      implem = new IntegrationChannel(channel.toHexString());
      implem.createdAt = ts;
      implem.createdAtBlock = blockId;
    }

    implem.name = getChannelName(channel);
    implem.implementation = event.params.implem;
    implem.contract = getMetaContractForChannel(channel);

    implem.editedAt = ts;
    implem.editedAtBlock = blockId;

    implem.save();
  }
}

export function handleProxyFactoryDeployed(event: ProxyFactoryDeployed): void {
  const channel = event.params.channel;
  if (existsChannel(channel)) {
    ProxyFactory.create(event.params.factory);
  }
}

export function handleInitialized(event: Initialized): void {
  const list = new IntegrationList('integrationList');
  list.integrations = [];
  list.save();
}
