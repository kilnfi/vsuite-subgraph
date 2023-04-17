import { MetaContract } from '../generated/schema';

import CubAbi from '../abis_ts/Cub';
import NexusAbi from '../abis_ts/Nexus';
import PluggableHatcherAbi from '../abis_ts/PluggableHatcher';
import vCoverageRecipientAbi from '../abis_ts/vCoverageRecipient';
import vExecLayerRecipientAbi from '../abis_ts/vExecLayerRecipient';
import vFactoryAbi from '../abis_ts/vFactory';
import vOracleAggregatorAbi from '../abis_ts/vOracleAggregator';
import vPoolAbi from '../abis_ts/vPool';
import vStakesAbi from '../abis_ts/vStakes';
import vExitQueueAbi from '../abis_ts/vExitQueue';

const m = new Map<string, string>();

m.set('Cub', CubAbi);
m.set('Nexus', NexusAbi);
m.set('PluggableHatcher', PluggableHatcherAbi);
m.set('vCoverageRecipient', vCoverageRecipientAbi);
m.set('vExecLayerRecipient', vExecLayerRecipientAbi);
m.set('vFactory', vFactoryAbi);
m.set('vOracleAggregator', vOracleAggregatorAbi);
m.set('vPool', vPoolAbi);
m.set('vStakes', vStakesAbi);
m.set('vExitQueue', vExitQueueAbi);

export const getOrCreateMetaContract = (name: string): string => {
  let metaContract = MetaContract.load(name);

  if (metaContract == null) {
    metaContract = new MetaContract(name);

    if (!m.has(name)) {
      throw new Error(`Invalid meta contract id ${name}`);
    }
    metaContract.abi = m.get(name).replaceAll('\n', '').replaceAll(' ', '');
    metaContract.save();
  }

  return name;
};
