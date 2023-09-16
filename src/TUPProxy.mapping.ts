import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { TUPProxy, TUPProxyUpgrade } from '../generated/schema';
import { AdminChanged, PauserChanged, SetFreezeTime, Upgraded } from '../generated/templates/TUPProxy/TUPProxy';
import { TUPProxy as TUPProxyTemplate } from '../generated/templates';
import { txUniqueUUID } from './utils/utils';

export function handleAdminChanged(event: AdminChanged): void {
  const proxy = TUPProxy.load(event.address.toHexString());
  proxy!.admin = event.params.newAdmin;
  proxy!.editedAt = event.block.timestamp;
  proxy!.editedAtBlock = event.block.number;
  proxy!.save();
}

export function handlePauserChanged(event: PauserChanged): void {
  const proxy = TUPProxy.load(event.address.toHexString());
  proxy!.pauser = event.params.newPauser;
  proxy!.editedAt = event.block.timestamp;
  proxy!.editedAtBlock = event.block.number;
  proxy!.save();
}

export function handleSetFreezeTime(event: SetFreezeTime): void {
  const proxy = TUPProxy.load(event.address.toHexString());
  proxy!.freezeTime = event.params.freezeTime;
  proxy!.editedAt = event.block.timestamp;
  proxy!.editedAtBlock = event.block.number;
  proxy!.save();
}

export function handleUpgraded(event: Upgraded): void {
  const proxy = TUPProxy.load(event.address.toHexString());

  const upgrade = new TUPProxyUpgrade(txUniqueUUID(event, [event.address.toHexString()]));
  upgrade.proxy = event.address.toHexString();
  upgrade.newImplementation = event.params.implementation;
  upgrade.oldImplementation = proxy!.implementation;
  upgrade.createdAt = event.block.timestamp;
  upgrade.editedAt = event.block.timestamp;
  upgrade.createdAtBlock = event.block.number;
  upgrade.editedAtBlock = event.block.number;
  upgrade.save();

  proxy!.implementation = event.params.implementation;
  proxy!.editedAt = event.block.timestamp;

  proxy!.editedAtBlock = event.block.number;
  proxy!.save();
}

export const getOrCreateTUPProxy = (event: ethereum.Event, address: Address): TUPProxy => {
  let proxy = TUPProxy.load(address.toHexString());

  if (proxy == null) {
    proxy = new TUPProxy(address.toHexString());
    proxy.admin = Address.zero();
    proxy.pauser = Address.zero();
    proxy.freezeTime = BigInt.zero();
    proxy.implementation = Address.zero();
    proxy.createdAt = event.block.timestamp;
    proxy.editedAt = event.block.timestamp;
    proxy.createdAtBlock = event.block.number;
    proxy.editedAtBlock = event.block.number;
    proxy.save();
    TUPProxyTemplate.create(address);
  }

  return proxy;
};
