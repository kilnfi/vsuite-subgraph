import { ChannelImplementationUpdated, ProxyFactoryDeployed } from '../generated/IntegrationRouter/IntegrationRouter';
import { IntegrationChannel } from '../generated/schema';
import { ProxyFactory } from '../generated/templates';
import { existsChannel, getChannelName, getMetaContractForChannel } from './utils/IntegrationChannel.utils';

export function handleChannelImplementationUpdated(event: ChannelImplementationUpdated): void {
  const channel = event.params.channel;
  if (existsChannel(channel)) {
    const ts = event.block.timestamp;
    const blockId = event.block.number;
    let implem = IntegrationChannel.load(channel);

    if (!implem) {
      implem = new IntegrationChannel(channel);
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
