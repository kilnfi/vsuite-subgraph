import { MultiPool } from '../../generated/schema';
import { CommissionSharesReturnedFix091223 } from '../../generated/templates/Native20_Fix_09_12_Oracle_Report/Native20_Fix_09_12_Oracle_Report';
import { entityUUID } from '../utils/utils';

export function handleCommissionSharesReturnedFix091223(event: CommissionSharesReturnedFix091223): void {
  const multiPool = MultiPool.load(entityUUID(event, [event.params.poolId.toString()]));
  multiPool!.commissionPaid = multiPool!.commissionPaid.minus(event.params.eth);
  multiPool!.save();
}
