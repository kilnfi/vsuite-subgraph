import { Address, BigInt } from "@graphprotocol/graph-ts";
import { vNFT, vNFTIntegration, vNFTTransfer, vNFTUser } from "../generated/schema";
import { Approval, PurchasedValidator, SetExtraData, SetIntegrator, SetIntegratorCommission, SetName, SetOperatorCommission, SetSymbol, SetURIPrefix, Transfer, UpdateUser } from "../generated/vNFT/vNFTV1";
import { entityUUID, eventUUID } from "./utils";

export function handleSetName(event: SetName): void {
    const e = new vNFTIntegration(event.address); // TEST ONLY
    e.name = "";
    e.symbol = "";
    e.extraData = "";
    e.uriPrefix = "";
    e.editedAt = event.block.timestamp;
    e.editedAtBlock = event.block.number;
    e.createdAt = event.block.timestamp;
    e.createdAtBlock = event.block.number;
    e.supply = BigInt.fromI32(0);
    e.supply = BigInt.fromI32(0);
    e.operatorCommission = BigInt.fromI32(0);
    e.integratorCommission = BigInt.fromI32(0);
    e.integrator = Address.empty(); 
    e.save();

    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.name = event.params.name;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handleSetSymbol(event: SetSymbol): void {
    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.symbol = event.params.symbol;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handleSetExtraData(event: SetExtraData): void {
    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.extraData = event.params.extraData;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handleSetURIPrefix(event: SetURIPrefix): void {
    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.uriPrefix = event.params.uriPrefix;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handleSetOperatorCommission(event: SetOperatorCommission): void {
    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.operatorCommission = event.params.operatorCommission;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handleSetIntegratorCommission(event: SetIntegratorCommission): void {
    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.integratorCommission = event.params.integratorCommission;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handleSetIntegrator(event: SetIntegrator): void {
    const vnftIntegration = vNFTIntegration.load(event.address);

    vnftIntegration!.integrator = event.params.integrator;

    vnftIntegration!.editedAt = event.block.timestamp;
    vnftIntegration!.editedAtBlock = event.block.number;
    vnftIntegration!.save();
}

export function handlePurchasedValidator(event: PurchasedValidator): void {
    const vnftIntegrationAddress = event.address;
    const tokenId = event.params.tokenId;
    const ts = event.block.timestamp;
    const blockId = event.block.number;

    const id = entityUUID(event, [tokenId.toString()]);
    const vnft = new vNFT(id);
    vnft.tokenId = tokenId;
    vnft.vNFTIntegration = vnftIntegrationAddress;
    vnft.owner = event.params.owner;
    vnft.validatorId = event.params.validatorId;

    vnft.editedAt = ts;
    vnft.editedAtBlock = blockId;
    vnft.createdAt = ts;
    vnft.createdAtBlock = blockId;
    
    vnft.save();

    const vnftIntegration = vNFTIntegration.load(vnftIntegrationAddress);
    vnftIntegration!.supply = vnftIntegration!.supply.plus(BigInt.fromI32(1));
    vnftIntegration!.save();
}

export function handleTransfer(event: Transfer): void {
    const vnftIntegration = event.address;
    const tokenId = event.params.tokenId;
    const ts = event.block.timestamp;
    const blockId = event.block.number;

    const id = eventUUID(event, [tokenId.toString()]);
    const transfer = new vNFTTransfer(id);
    transfer.from = event.params.from;
    transfer.to = event.params.to;

    transfer.editedAt = ts;
    transfer.editedAtBlock = blockId;
    transfer.createdAt = ts;
    transfer.createdAtBlock = blockId;

    const vnft = vNFT.load(entityUUID(event, [tokenId.toString()]));
    vnft!.owner = event.params.to;
    vnft!.editedAt = ts;
    vnft!.editedAtBlock = blockId;
    vnft!.approval = null;

    transfer.vNFT = vnft!.id;

    vnft!.save();
    transfer.save();
}

export function handleUpdateUser(event: UpdateUser): void {
    const tokenId = event.params.tokenId;
    const id = entityUUID(event, [tokenId.toString()]);
    const ts = event.block.timestamp;
    const blockId = event.block.number;

    let user = vNFTUser.load(id);
    if(!user) {
        user = new vNFTUser(id);
        user.createdAt = ts;
        user.createdAtBlock = blockId;
        user.vNFT = id;
    }
    user.user = event.params.user;
    user.expiry = event.params.expires;
    user.editedAt = ts;
    user.editedAtBlock = blockId;

    user.save();
}

export function handleApproval(event: Approval): void {
    const ts = event.block.timestamp;
    const blockId = event.block.number;

    const vnft = vNFT.load(entityUUID(event, [event.params.tokenId.toString()]));
    vnft!.editedAt = ts;
    vnft!.editedAtBlock = blockId;
    vnft!.approval = event.params.approved;
    vnft!.save();
}