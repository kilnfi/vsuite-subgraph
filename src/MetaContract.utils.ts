import { MetaContract } from '../generated/schema';

import CubAbi from '../abis_ts/Cub';
import NexusV1Abi from '../abis_ts/NexusV1';
import PluggableHatcherAbi from '../abis_ts/PluggableHatcher';
import vCoverageRecipientV1Abi from '../abis_ts/vCoverageRecipientV1';
import vExecLayerRecipientV1Abi from '../abis_ts/vExecLayerRecipientV1';
import vFactoryV1Abi from '../abis_ts/vFactoryV1';
import vOracleAggregatorV1Abi from '../abis_ts/vOracleAggregatorV1';
import vPoolV1Abi from '../abis_ts/vPoolV1';
import vStakesV1Abi from '../abis_ts/vStakesV1';
import { CHANNEL_NATIVE_VPOOL_BYTES32 } from './IntegrationChannel.utils';

const m = new Map<string, string>();

m.set('Cub', CubAbi);
m.set('NexusV1', NexusV1Abi);
m.set('PluggableHatcher', PluggableHatcherAbi);
m.set('vCoverageRecipientV1', vCoverageRecipientV1Abi);
m.set('vExecLayerRecipientV1', vExecLayerRecipientV1Abi);
m.set('vFactoryV1', vFactoryV1Abi);
m.set('vOracleAggregatorV1', vOracleAggregatorV1Abi);
m.set('vPoolV1', vPoolV1Abi);
m.set('vStakesV1', vStakesV1Abi);

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
