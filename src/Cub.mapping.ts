import { Cub, Fix } from '../generated/schema';
import { AppliedFixes } from '../generated/templates/Cub/Cub';
import { entityUUID, eventUUID } from './utils/utils';

export function handleAppliedFixes(event: AppliedFixes): void {
  const cub = Cub.load(entityUUID(event, []));

  for (let idx = 0; idx < event.params.fixes.length; ++idx) {
    const fixId = eventUUID(event, ['fix', event.params.fixes[idx].toHexString()]);

    const fix = new Fix(fixId);
    fix.address = event.params.fixes[idx];
    fix.fix = entityUUID(event, []);

    fix.createdAt = event.block.timestamp;
    fix.createdAtBlock = event.block.number;
    fix.editedAt = event.block.timestamp;
    fix.editedAtBlock = event.block.number;
    fix.save();
  }

  cub!.editedAt = event.block.timestamp;
  cub!.editedAtBlock = event.block.number;
  cub!.save();
}
