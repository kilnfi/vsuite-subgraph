import { Address, Bytes, ethereum, BigInt } from '@graphprotocol/graph-ts';
import {
  AppliedFix,
  DeletedGlobalFix,
  GlobalPause,
  GlobalUnpause,
  Hatched,
  Pause,
  RegisteredGlobalFix,
  SetInitialProgress,
  Unpause,
  Upgraded
} from '../generated/FactoryHatcher/PluggableHatcher';
import { SetAdmin } from '../generated/Nexus/Nexus';
import { Cub, Fix, PluggableHatcher, PluggableHatcherImplementation } from '../generated/schema';
import { Cub as CubTemplate } from '../generated/templates';
import { getOrCreateMetaContract } from './MetaContract.utils';
import { entityUUID, eventUUID } from './utils';

function _getOrCreatePluggableHatcher(addr: Bytes, event: ethereum.Event): PluggableHatcher {
  let ph = PluggableHatcher.load(addr);

  if (ph == null) {
    ph = new PluggableHatcher(addr);
    ph.address = addr;
    ph.contract = getOrCreateMetaContract('PluggableHatcher');
    ph.admin = Address.zero();
    ph.initialProgress = BigInt.zero();
    ph.globalPaused = false;
    ph.globalFixesCount = BigInt.zero();
    ph.upgradeCount = BigInt.zero();
    ph.cubCount = BigInt.zero();
    ph.createdAt = event.block.timestamp;
    ph.createdAtBlock = event.block.number;
  }

  return ph;
}

export function handleUpgraded(event: Upgraded): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);

  const implementationId = eventUUID(event, [event.params.implementation.toHexString()]);
  const implementation = new PluggableHatcherImplementation(implementationId);
  implementation.address = event.params.implementation;
  implementation.pluggableHatcher = event.address;
  implementation.createdAt = event.block.timestamp;
  implementation.createdAtBlock = event.block.number;
  implementation.editedAt = event.block.timestamp;
  implementation.editedAtBlock = event.block.number;
  implementation.save();

  ph.currentImplementation = implementationId;
  ph.upgradeCount = ph.upgradeCount + BigInt.fromI32(1);
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;

  ph.save();
}

export function handleHatched(event: Hatched): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);

  const cubId = event.params.cub;
  const cub = new Cub(cubId);
  cub.address = event.params.cub;
  cub.contract = getOrCreateMetaContract('Cub');
  cub.progress = ph.initialProgress;
  cub.paused = false;
  cub.hatcher = event.address;
  cub.constructionData = event.params.cdata;
  cub.createdAt = event.block.timestamp;
  cub.createdAtBlock = event.block.number;
  cub.editedAt = event.block.timestamp;
  cub.editedAtBlock = event.block.number;

  cub.save();
  CubTemplate.create(event.params.cub);

  ph.cubCount = ph.cubCount + BigInt.fromI32(1);
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;

  ph.save();
}

export function handlePause(event: Pause): void {
  const cub = Cub.load(event.params.cub);

  cub!.paused = true;

  cub!.save();
}

export function handleUnpause(event: Unpause): void {
  const cub = Cub.load(event.params.cub);

  cub!.paused = false;

  cub!.save();
}

export function handleGlobalPause(event: GlobalPause): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);
  ph.globalPaused = true;
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;
  ph.save();
}

export function handleGlobalUnpause(event: GlobalUnpause): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);
  ph.globalPaused = false;
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;
  ph.save();
}

export function handleSetAdmin(event: SetAdmin): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);
  ph.admin = event.params.admin;
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;
  ph.save();
}

export function handleSetInitialProgress(event: SetInitialProgress): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);
  ph.initialProgress = event.params.initialProgress;
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;
  ph.save();
}

export function handleRegisteredGlobalFix(event: RegisteredGlobalFix): void {
  const ph = _getOrCreatePluggableHatcher(event.address, event);

  const globalFixId = entityUUID(event, ['globalFix', event.params.index.toString()]);
  const globalFix = new Fix(globalFixId);
  globalFix.address = event.params.fix;
  globalFix.globalFix = event.address;
  globalFix.index = event.params.index;
  globalFix.deleted = false;

  globalFix.createdAt = event.block.timestamp;
  globalFix.createdAtBlock = event.block.number;
  globalFix.editedAt = event.block.timestamp;
  globalFix.editedAtBlock = event.block.number;
  globalFix.save();

  ph.globalFixesCount = ph.globalFixesCount + BigInt.fromI32(1);
  ph.editedAt = event.block.timestamp;
  ph.editedAtBlock = event.block.number;
  ph.save();
}

export function handleDeletedGlobalFix(event: DeletedGlobalFix): void {
  const globalFixId = entityUUID(event, ['globalFix', event.params.index.toString()]);
  const globalFix = Fix.load(globalFixId);
  globalFix!.deleted = false;

  globalFix!.editedAt = event.block.timestamp;
  globalFix!.editedAtBlock = event.block.number;
  globalFix!.save();
}

export function handleAppliedFix(event: AppliedFix): void {
  const cub = Cub.load(event.params.cub);

  const fixId = eventUUID(event, ['fix', event.params.fix.toHexString()]);

  const fix = new Fix(fixId);
  fix.address = event.params.fix;
  fix.fix = event.params.cub;

  fix.createdAt = event.block.timestamp;
  fix.createdAtBlock = event.block.number;
  fix.editedAt = event.block.timestamp;
  fix.editedAtBlock = event.block.number;
  fix.save();

  cub!.editedAt = event.block.timestamp;
  cub!.editedAtBlock = event.block.number;
  cub!.save();
}
