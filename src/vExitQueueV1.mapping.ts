import { Cask, FillTrace, Ticket, vExitQueue, Payment as PaymentEntity } from '../generated/schema';
import {
  FilledTicket,
  PrintedTicket,
  ReceivedCask,
  SetPool,
  SuppliedEther,
  Payment
} from '../generated/templates/vExitQueue/vExitQueueV1';
import { entityUUID, eventUUID, txUniqueUUID } from './utils';
import { BigInt } from '@graphprotocol/graph-ts';

export function handlePrintedTicket(event: PrintedTicket): void {
  const exitQueue = vExitQueue.load(event.address);

  const ticketId = entityUUID(event, [event.params.id.toString()]);
  const ticket = new Ticket(ticketId);

  ticket.ticketId = event.params.id;
  ticket.exitQueue = event.address;
  ticket.owner = event.params.ticket.owner;
  ticket.size = event.params.ticket.size;
  ticket.position = event.params.ticket.position;
  ticket.maxExitable = event.params.ticket.maxExitable;
  ticket.exited = BigInt.zero();
  ticket.exitedEth = BigInt.zero();

  ticket.createdAt = event.block.timestamp;
  ticket.editedAt = event.block.timestamp;
  ticket.createdAtBlock = event.block.number;
  ticket.editedAtBlock = event.block.number;

  ticket.save();

  exitQueue!.ticketCount = exitQueue!.ticketCount + BigInt.fromI32(1);
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();
}

export function handleReceivedCask(event: ReceivedCask): void {
  const exitQueue = vExitQueue.load(event.address);

  const caskId = entityUUID(event, [event.params.id.toString()]);
  const cask = new Cask(caskId);

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

  exitQueue!.ticketCount = exitQueue!.ticketCount + BigInt.fromI32(1);
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();
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

  exitQueue!.unclaimedFunds = exitQueue!.unclaimedFunds + event.params.unclaimedEth;
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();

  const ticketId = entityUUID(event, [event.params.ticketId.toString()]);
  const ticket = Ticket.load(ticketId);

  ticket!.size = ticket!.size - event.params.amountFilled;
  ticket!.maxExitable = ticket!.maxExitable - event.params.amountEthFilled;
  ticket!.position = ticket!.position + event.params.amountFilled;
  ticket!.exited = ticket!.exited + event.params.amountFilled;
  ticket!.exitedEth = ticket!.exitedEth + event.params.amountEthFilled;

  ticket!.editedAt = event.block.timestamp;
  ticket!.editedAtBlock = event.block.number;

  ticket!.save();

  const caskId = entityUUID(event, [event.params.caskId.toString()]);
  const cask = Cask.load(caskId);

  cask!.provided = cask!.provided + event.params.amountFilled;
  cask!.providedEth = cask!.providedEth + event.params.amountEthFilled;
  cask!.unclaimedEth = cask!.unclaimedEth + event.params.unclaimedEth;
  cask!.editedAt = event.block.timestamp;
  cask!.editedAtBlock = event.block.number;

  cask!.save();

  const fillTraceId = entityUUID(event, [event.params.ticketId.toString(), event.params.caskId.toString()]);
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

  exitQueue!.unclaimedFunds = exitQueue!.unclaimedFunds - event.params.amount;
  exitQueue!.editedAt = event.block.timestamp;
  exitQueue!.editedAtBlock = event.block.number;

  exitQueue!.save();
}
