import { Cub, Fix } from '../generated/schema';
import { AppliedFixes } from '../generated/templates/Cub/Cub';

export function handleAppliedFixes(event: AppliedFixes): void {
  const cub = Cub.load(event.address);

  for (let idx = 0; idx < event.params.fixes.length; ++idx) {
    const fixId =
      'fix@' +
      event.address.toHexString() +
      '@' +
      event.params.fixes[idx].toHexString() +
      '@' +
      event.transaction.hash.toHexString() +
      '@' +
      event.transactionLogIndex.toString();

    const fix = new Fix(fixId);
    fix.address = event.params.fixes[idx];
    fix.fix = event.address;

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
