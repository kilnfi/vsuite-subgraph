import { ChannelImplementationUpdated } from '../generated/IntegrationRouter/IntegrationRouterV1';
import { IntegrationChannel } from '../generated/schema';
import { existsChannel, getChannelName } from './IntegrationChannel.utils';
import { getOrCreateMetaContract } from './MetaContract.utils';

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
    implem.contract = getOrCreateMetaContract('vStakesV1');

    implem.editedAt = ts;
    implem.editedAtBlock = blockId;

    implem.save();
  }
}
