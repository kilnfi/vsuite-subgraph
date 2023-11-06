import { MetaContract } from '../../generated/schema';

import CubAbi from '../../abis_ts/Cub';
import NexusAbi from '../../abis_ts/Nexus';
import PluggableHatcherAbi from '../../abis_ts/PluggableHatcher';
import vCoverageRecipientAbi from '../../abis_ts/vCoverageRecipient';
import vExecLayerRecipientAbi from '../../abis_ts/vExecLayerRecipient';
import vFactoryAbi from '../../abis_ts/vFactory';
import vOracleAggregatorAbi from '../../abis_ts/vOracleAggregator';
import vPoolAbi from '../../abis_ts/vPool';
import vExitQueueAbi from '../../abis_ts/vExitQueue';
import Liquid20A from '../../abis_ts/Liquid20A';
import Liquid20C from '../../abis_ts/Liquid20C';
import Native20 from '../../abis_ts/Native20';
import Native1155 from '../../abis_ts/Native1155';
import Liquid1155 from '../../abis_ts/Liquid1155';
import vNFT from '../../abis_ts/vNFT';
import TUPProxy from '../../abis_ts/TUPProxy';

const m = new Map<string, string>();

m.set('Cub', CubAbi);
m.set('Nexus', NexusAbi);
m.set('PluggableHatcher', PluggableHatcherAbi);
m.set('vCoverageRecipient', vCoverageRecipientAbi);
m.set('vExecLayerRecipient', vExecLayerRecipientAbi);
m.set('vFactory', vFactoryAbi);
m.set('vOracleAggregator', vOracleAggregatorAbi);
m.set('vPool', vPoolAbi);
m.set('vExitQueue', vExitQueueAbi);
m.set('Liquid20A', Liquid20A);
m.set('Native20', Native20);
m.set('Liquid20C', Liquid20C);
m.set('Native1155', Native1155);
m.set('Liquid1155', Liquid1155);
m.set('vNFT', vNFT);
m.set('TUPProxy', TUPProxy);

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
