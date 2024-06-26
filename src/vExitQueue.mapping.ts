import {
  Cask,
  FillTrace,
  Ticket,
  vExitQueue,
  Payment as PaymentEntity,
  vPool,
  vFactory,
  ExitDataEntry
} from '../generated/schema';
import { Transfer } from '../generated/templates/ERC20/Native20';
import {
  FilledTicket,
  PrintedTicket,
  ReceivedCask,
  SetPool,
  SuppliedEther,
  Payment,
  TicketIdUpdated
} from '../generated/templates/vExitQueue/vExitQueue';
import { pushEntryToSummaries } from './utils/rewards';
import {
  createClaimedExitQueueTicketSystemEvent,
  createNewExitQueueCaskSystemEvent,
  createNewExitQueueTicketSystemEvent,
  entityUUID,
  eventUUID
} from './utils/utils';
import { Address, BigInt } from '@graphprotocol/graph-ts';

export function handlePrintedTicket(event: PrintedTicket): void {
  const exitQueue = vExitQueue.load(event.address);

  const ticketId = entityUUID(event, [idToIdx(event.params.id).toString()]);
  const ticket = Ticket.load(ticketId);

  if (exitQueue!.lastTicket != null) {
    ticket!.index = Ticket.load(exitQueue!.lastTicket!)!.index.plus(BigInt.fromI32(1));
  } else {
    ticket!.index = BigInt.fromI32(0);
  }
  ticket!.ticketId = event.params.id;
  ticket!.exitQueue = event.address;
  ticket!.owner = event.params.owner;
  ticket!.size = event.params.ticket.size;
  ticket!.position = event.params.ticket.position;
  ticket!.maxExitable = event.params.ticket.maxExitable;
  ticket!.exited = BigInt.zero();
  ticket!.exitedEth = BigInt.zero();

  ticket!.editedAt = event.block.timestamp;
  ticket!.editedAtBlock = event.block.number;

  ticket!.save();

  exitQueue!.lastTicket = ticketId;
  const unfulfilledTickets = exitQueue!.unfulfilledTickets;
  unfulfilledTickets.push(ticketId);
  exitQueue!.unfulfilledTickets = unfulfilledTickets;
  exitQueue!.ticketCount = exitQueue!.ticketCount.plus(BigInt.fromI32(1));
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();

  const pool = vPool.load(exitQueue!.pool);

  const se = createNewExitQueueTicketSystemEvent(
    event,
    vFactory.load(pool!.factory)!.address,
    pool!.address,
    event.address,
    event.params.id
  );
  se.ticket = ticketId;
  se.size = event.params.ticket.size;
  se.maxExitable = event.params.ticket.maxExitable;
  se.owner = event.params.owner;
  se.save();

  const exitDataEntry = new ExitDataEntry(eventUUID(event, ['ExitDataEntry']));
  exitDataEntry.type = 'ExitDataEntry';
  exitDataEntry.exitedEth = event.params.ticket.maxExitable;
  exitDataEntry.createdAt = event.block.timestamp;
  exitDataEntry.editedAt = event.block.timestamp;
  exitDataEntry.createdAtBlock = event.block.number;
  exitDataEntry.editedAtBlock = event.block.number;
  exitDataEntry.save();
  pushEntryToSummaries(event, Address.fromBytes(pool!.address), exitDataEntry);
}

export function handleTicketIdUpdated(event: TicketIdUpdated): void {
  const ticketId = entityUUID(event, [idToIdx(event.params.oldTicketId).toString()]);
  const ticket = Ticket.load(ticketId);
  ticket!.ticketId = event.params.newTicketId;
  ticket!.editedAt = event.block.timestamp;
  ticket!.editedAtBlock = event.block.number;
  ticket!.save();
}

function idToIdx(id: BigInt): BigInt {
  return id.rightShift(128);
}

export function handleTransfer(event: Transfer): void {
  const ticketId = entityUUID(event, [idToIdx(event.params.value).toString()]);
  if (event.params.from == Address.zero()) {
    let ticket = Ticket.load(ticketId);
    if (ticket == null) {
      ticket = new Ticket(ticketId);
      ticket.index = BigInt.zero();
      ticket.ticketId = event.params.value;
      ticket.exitQueue = event.address;
      ticket.size = BigInt.zero();
      ticket.position = BigInt.zero();
      ticket.maxExitable = BigInt.zero();
      ticket.fulfillableBy = [];
      ticket.fulfillableAmount = BigInt.zero();
      ticket.exited = BigInt.zero();
      ticket.exitedEth = BigInt.zero();
      ticket.createdAt = event.block.timestamp;
      ticket.createdAtBlock = event.block.number;
    }
    ticket.editedAt = event.block.timestamp;
    ticket.editedAtBlock = event.block.number;
    ticket.owner = event.params.to;
    ticket.save();
  } else if (event.params.to != Address.zero()) {
    let ticket = Ticket.load(ticketId);
    ticket!.owner = event.params.to;
    ticket!.editedAt = event.block.timestamp;
    ticket!.editedAtBlock = event.block.number;
    ticket!.save();
  }
}

function minBI(a: BigInt, b: BigInt): BigInt {
  if (a.lt(b)) {
    return a;
  }
  return b;
}

export function handleReceivedCask(event: ReceivedCask): void {
  const exitQueue = vExitQueue.load(event.address);

  const caskId = entityUUID(event, [event.params.id.toString()]);
  const cask = new Cask(caskId);

  if (exitQueue!.lastCask != null) {
    cask.index = Cask.load(exitQueue!.lastCask!)!.index.plus(BigInt.fromI32(1));
  } else {
    cask.index = BigInt.fromI32(0);
  }
  cask.caskId = event.params.id;
  cask.exitQueue = event.address;
  cask.size = event.params.cask.size;
  cask.position = event.params.cask.position;
  cask.value = event.params.cask.value;
  cask.provided = BigInt.zero();
  cask.providedEth = BigInt.zero();
  cask.unclaimedEth = BigInt.zero();

  cask.createdAt = event.block.timestamp;
  cask.editedAt = event.block.timestamp;
  cask.createdAtBlock = event.block.number;
  cask.editedAtBlock = event.block.number;

  cask.save();

  exitQueue!.lastCask = caskId;
  exitQueue!.caskCount = exitQueue!.caskCount.plus(BigInt.fromI32(1));
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  const unfullfilledTickets = exitQueue!.unfulfilledTickets;
  let removeCount = 0;
  let shouldBreak = false;
  for (let i = 0; i < unfullfilledTickets.length; i++) {
    const ticket = Ticket.load(unfullfilledTickets[i]) as Ticket;
    if (ticket.position.lt(cask.position.plus(cask.size))) {
      if (ticket.position.plus(ticket.size).le(cask.position.plus(cask.size))) {
        ++removeCount;
      }
      if (ticket.position.plus(ticket.size).ge(cask.position.plus(cask.size))) {
        shouldBreak = true;
      }
      const fulfillableBy = ticket.fulfillableBy;
      fulfillableBy.push(caskId);
      ticket.fulfillableBy = fulfillableBy;
      ticket.fulfillableAmount = ticket.fulfillableAmount.plus(
        minBI(
          cask.position.plus(cask.size).minus(ticket.position.plus(ticket.fulfillableAmount)),
          ticket.size.minus(ticket.fulfillableAmount)
        )
      );
      ticket.save();
    }
    if (shouldBreak) {
      break;
    }
  }

  exitQueue!.unfulfilledTickets = unfullfilledTickets.slice(removeCount);
  exitQueue!.save();
  const pool = vPool.load(exitQueue!.pool);

  const se = createNewExitQueueCaskSystemEvent(
    event,
    vFactory.load(pool!.factory)!.address,
    pool!.address,
    event.address,
    event.params.id
  );
  se.cask = caskId;
  se.size = event.params.cask.size;
  se.value = event.params.cask.value;
  se.save();
}

export function handleSetPool(event: SetPool): void {
  const exitQueue = vExitQueue.load(event.address);

  exitQueue!.pool = event.params.pool;
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();
}

export function handleFilledTicket(event: FilledTicket): void {
  const exitQueue = vExitQueue.load(event.address);

  exitQueue!.unclaimedFunds = exitQueue!.unclaimedFunds.plus(event.params.unclaimedEth);
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();

  const ticketId = entityUUID(event, [idToIdx(event.params.ticketId).toString()]);
  const caskId = entityUUID(event, [event.params.caskId.toString()]);

  const ticket = Ticket.load(ticketId);

  if (ticket!.fulfillableBy.length == 0 || ticket!.fulfillableBy[0] != caskId) {
    throw new Error('Ticket filled but had not fulfillable casks');
  }

  const fulfillableBy = ticket!.fulfillableBy.slice(1);
  ticket!.fulfillableBy = fulfillableBy;
  ticket!.fulfillableAmount = ticket!.fulfillableAmount.minus(event.params.amountFilled);
  ticket!.size = ticket!.size.minus(event.params.amountFilled);
  ticket!.maxExitable = ticket!.maxExitable.minus(event.params.amountEthFilled);
  ticket!.position = ticket!.position.plus(event.params.amountFilled);
  ticket!.exited = ticket!.exited.plus(event.params.amountFilled);
  ticket!.exitedEth = ticket!.exitedEth.plus(event.params.amountEthFilled);

  ticket!.editedAt = event.block.timestamp;
  ticket!.editedAtBlock = event.block.number;

  ticket!.save();

  const cask = Cask.load(caskId);

  cask!.provided = cask!.provided.plus(event.params.amountFilled);
  cask!.providedEth = cask!.providedEth.plus(event.params.amountEthFilled);
  cask!.unclaimedEth = cask!.unclaimedEth.plus(event.params.unclaimedEth);
  cask!.editedAt = event.block.timestamp;
  cask!.editedAtBlock = event.block.number;

  cask!.save();

  const fillTraceId = entityUUID(event, [idToIdx(event.params.ticketId).toString(), event.params.caskId.toString()]);
  const fillTrace = new FillTrace(fillTraceId);

  fillTrace.ticket = ticketId;
  fillTrace.cask = caskId;
  fillTrace.amount = event.params.amountFilled;
  fillTrace.amountEth = event.params.amountEthFilled;
  fillTrace.createdAt = event.block.timestamp;
  fillTrace.editedAt = event.block.timestamp;
  fillTrace.createdAtBlock = event.block.number;
  fillTrace.editedAtBlock = event.block.number;

  fillTrace.save();

  const pool = vPool.load(exitQueue!.pool);

  const se = createClaimedExitQueueTicketSystemEvent(
    event,
    vFactory.load(pool!.factory)!.address,
    pool!.address,
    event.address,
    event.params.ticketId
  );
  se.ticket = ticketId;
  se.remainingAmount = ticket!.size;
  se.claimedAmount = se.claimedAmount.plus(event.params.amountFilled);
  se.receivedEth = se.receivedEth.plus(event.params.amountEthFilled);
  se.usedCaskCount = se.usedCaskCount.plus(BigInt.fromI32(1));
  const casks = se.usedCasks;
  casks.push(caskId);
  se.usedCasks = casks;

  se.save();
}

export function handlePayment(event: Payment): void {
  const paymentId = eventUUID(event, [event.params.recipient.toHexString(), event.params.amount.toString()]);
  const payment = new PaymentEntity(paymentId);

  payment.recipient = event.params.recipient;
  payment.amount = event.params.amount;
  payment.exitQueue = event.address;
  payment.createdAt = event.block.timestamp;
  payment.editedAt = event.block.timestamp;
  payment.createdAtBlock = event.block.number;
  payment.editedAtBlock = event.block.number;

  payment.save();
}

export function handleSuppliedEther(event: SuppliedEther): void {
  const exitQueue = vExitQueue.load(event.address);

  exitQueue!.unclaimedFunds = exitQueue!.unclaimedFunds.minus(event.params.amount);
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();
}
