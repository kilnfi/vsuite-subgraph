const abi = `
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "currentApproval",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredAmount",
        "type": "uint256"
      }
    ],
    "name": "AllowanceTooLow",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "version",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentVersion",
        "type": "uint256"
      }
    ],
    "name": "AlreadyInitialized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ApprovalAlreadyZero",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "currentBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredAmount",
        "type": "uint256"
      }
    ],
    "name": "BalanceTooLow",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "balanceIncrease",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maximumAllowedBalanceIncrease",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maximumAllowedCoverage",
        "type": "uint256"
      }
    ],
    "name": "BoostedBoundCrossed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "coverage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "loss",
        "type": "uint256"
      }
    ],
    "name": "CoverageHigherThanLoss",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reportedExitedBalanceSum",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastReportedExitedBalanceSum",
        "type": "uint256"
      }
    ],
    "name": "DecreasingExitedBalanceSum",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reportedSkimmedBalanceSum",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastReportedSkimmedBalanceSum",
        "type": "uint256"
      }
    ],
    "name": "DecreasingSkimmedBalanceSum",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reportedSlashedBalanceSum",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastReportedSlashedBalanceSum",
        "type": "uint256"
      }
    ],
    "name": "DecreasingSlashedBalanceSum",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "previousStoppedValidatorCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stoppedValidatorCount",
        "type": "uint256"
      }
    ],
    "name": "DecreasingStoppedValidatorCount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "previousValidatorCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "validatorCount",
        "type": "uint256"
      }
    ],
    "name": "DecreasingValidatorCount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "finalTimestamp",
        "type": "uint256"
      }
    ],
    "name": "EpochNotFinal",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "EpochNotFrameFirst",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expectEpoch",
        "type": "uint256"
      }
    ],
    "name": "EpochTooOld",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "exiting",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      }
    ],
    "name": "ExitingBalanceTooHigh",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBPSValue",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidNullMint",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidNullValue",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidZeroAddress",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "balanceDecrease",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maximumAllowedBalanceDecrease",
        "type": "uint256"
      }
    ],
    "name": "LowerBoundCrossed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoValidatorToPurchase",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "prod1",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "denominator",
        "type": "uint256"
      }
    ],
    "name": "PRBMath__MulDivOverflow",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "err",
        "type": "string"
      }
    ],
    "name": "ShareReceiverError",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "stoppedValidatorsCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxStoppedValidatorsCount",
        "type": "uint256"
      }
    ],
    "name": "StoppedValidatorCountTooHigh",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "expected",
        "type": "address"
      }
    ],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "balanceIncrease",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maximumAllowedBalanceIncrease",
        "type": "uint256"
      }
    ],
    "name": "UpperBoundCrossed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reportedValidatorCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "depositedValidatorCount",
        "type": "uint256"
      }
    ],
    "name": "ValidatorCountTooHigh",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "depositor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "allowed",
        "type": "bool"
      }
    ],
    "name": "ApproveDepositor",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "burner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalSupply",
        "type": "uint256"
      }
    ],
    "name": "Burn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "mintedShares",
        "type": "uint256"
      }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "operatorTreasury",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sharesCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sharesValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalSupply",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalUnderlyingSupply",
        "type": "uint256"
      }
    ],
    "name": "DistributedOperatorRewards",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "version",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "cdata",
        "type": "bytes"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "injecter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "InjectedEther",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalSupply",
        "type": "uint256"
      }
    ],
    "name": "Mint",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "balanceSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "skimmedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "slashedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exiting",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "maxExitable",
            "type": "uint128"
          },
          {
            "internalType": "int256",
            "name": "maxCommittable",
            "type": "int256"
          },
          {
            "internalType": "uint64",
            "name": "epoch",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "activatedCount",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "stoppedCount",
            "type": "uint32"
          }
        ],
        "indexed": false,
        "internalType": "struct ctypes.ValidatorsReport",
        "name": "report",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "preUnderlyingSupply",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "postUnderlyingSupply",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "preSupply",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "postSupply",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "newExitedEthers",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "newSkimmedEthers",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitBoostEthers",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitFedEthers",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitBurnedShares",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitingProjection",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "baseFulfillableDemand",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "extraFulfillableDemand",
            "type": "uint128"
          },
          {
            "internalType": "int128",
            "name": "rewards",
            "type": "int128"
          },
          {
            "internalType": "int128",
            "name": "delta",
            "type": "int128"
          },
          {
            "internalType": "uint128",
            "name": "increaseLimit",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "coverageIncreaseLimit",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "decreaseLimit",
            "type": "uint128"
          },
          {
            "internalType": "int128",
            "name": "consensusLayerDelta",
            "type": "int128"
          },
          {
            "internalType": "uint128",
            "name": "pulledCoverageFunds",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "pulledExecutionLayerRewards",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "pulledExitQueueUnclaimedFunds",
            "type": "uint128"
          }
        ],
        "indexed": false,
        "internalType": "struct IvPool.ReportTraces",
        "name": "traces",
        "type": "tuple"
      }
    ],
    "name": "ProcessedReport",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "validators",
        "type": "uint256[]"
      }
    ],
    "name": "PurchasedValidators",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "committedEthers",
        "type": "uint256"
      }
    ],
    "name": "SetCommittedEthers",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "genesisTimestamp",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "epochsUntilFinal",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "slotsPerEpoch",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "secondsPerSlot",
            "type": "uint64"
          }
        ],
        "indexed": false,
        "internalType": "struct ctypes.ConsensusLayerSpec",
        "name": "consensusLayerSpec",
        "type": "tuple"
      }
    ],
    "name": "SetConsensusLayerSpec",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "factory",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "withdrawalRecipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "execLayerRecipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "coverageRecipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "oracleAggregator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "exitQueue",
        "type": "address"
      }
    ],
    "name": "SetContractLinks",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "depositedEthers",
        "type": "uint256"
      }
    ],
    "name": "SetDepositedEthers",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "epochsPerFrame",
        "type": "uint256"
      }
    ],
    "name": "SetEpochsPerFrame",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "operatorFeeBps",
        "type": "uint256"
      }
    ],
    "name": "SetOperatorFee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "maxAPRUpperBound",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "maxAPRUpperCoverageBoost",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "maxRelativeLowerBound",
        "type": "uint64"
      }
    ],
    "name": "SetReportBounds",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "newRequestedExits",
        "type": "uint32"
      }
    ],
    "name": "SetRequestedExits",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "extraData",
        "type": "string"
      }
    ],
    "name": "SetValidatorGlobalExtraData",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "voider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "VoidedShares",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "depositorAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "allowed",
        "type": "bool"
      }
    ],
    "name": "allowDepositor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "consensusLayerSpec",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "genesisTimestamp",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "epochsUntilFinal",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "slotsPerEpoch",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "secondsPerSlot",
            "type": "uint64"
          }
        ],
        "internalType": "struct ctypes.ConsensusLayerSpec",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "coverageRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "depositorAddress",
        "type": "address"
      }
    ],
    "name": "depositors",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "epochsPerFrame",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ethers",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "deposited",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "committed",
            "type": "uint128"
          }
        ],
        "internalType": "struct ctypes.Ethers",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "execLayerRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "exitQueue",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "factory",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fix",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[6]",
        "name": "addrs",
        "type": "address[6]"
      },
      {
        "internalType": "uint256",
        "name": "epochsPerFrame_",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "genesisTimestamp",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "epochsUntilFinal",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "slotsPerEpoch",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "secondsPerSlot",
            "type": "uint64"
          }
        ],
        "internalType": "struct ctypes.ConsensusLayerSpec",
        "name": "consensusLayerSpec_",
        "type": "tuple"
      },
      {
        "internalType": "uint64[3]",
        "name": "bounds_",
        "type": "uint64[3]"
      },
      {
        "internalType": "uint256",
        "name": "operatorFeeBps_",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "extraData_",
        "type": "string"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "injectEther",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "isValidEpoch",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastEpoch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastReport",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "balanceSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "skimmedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "slashedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exiting",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "maxExitable",
            "type": "uint128"
          },
          {
            "internalType": "int256",
            "name": "maxCommittable",
            "type": "int256"
          },
          {
            "internalType": "uint64",
            "name": "epoch",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "activatedCount",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "stoppedCount",
            "type": "uint32"
          }
        ],
        "internalType": "struct ctypes.ValidatorsReport",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "onlyValidEpoch",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "operatorFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "oracleAggregator",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "max",
        "type": "uint256"
      }
    ],
    "name": "purchaseValidators",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "idx",
        "type": "uint256"
      }
    ],
    "name": "purchasedValidatorAtIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "purchasedValidatorCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "purchasedValidators",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "balanceSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exitedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "skimmedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "slashedSum",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "exiting",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "maxExitable",
            "type": "uint128"
          },
          {
            "internalType": "int256",
            "name": "maxCommittable",
            "type": "int256"
          },
          {
            "internalType": "uint64",
            "name": "epoch",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "activatedCount",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "stoppedCount",
            "type": "uint32"
          }
        ],
        "internalType": "struct ctypes.ValidatorsReport",
        "name": "rprt",
        "type": "tuple"
      }
    ],
    "name": "report",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reportBounds",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "maxAPRUpperBound",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "maxAPRUpperCoverageBoost",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "maxRelativeLowerBound",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestedExits",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "genesisTimestamp",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "epochsUntilFinal",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "slotsPerEpoch",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "secondsPerSlot",
            "type": "uint64"
          }
        ],
        "internalType": "struct ctypes.ConsensusLayerSpec",
        "name": "consensusLayerSpec_",
        "type": "tuple"
      }
    ],
    "name": "setConsensusLayerSpec",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newEpochsPerFrame",
        "type": "uint256"
      }
    ],
    "name": "setEpochsPerFrame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "operatorFeeBps",
        "type": "uint256"
      }
    ],
    "name": "setOperatorFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "maxAPRUpperBound",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "maxAPRUpperCoverageBoost",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "maxRelativeLowerBound",
        "type": "uint64"
      }
    ],
    "name": "setReportBounds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "extraData",
        "type": "string"
      }
    ],
    "name": "setValidatorGlobalExtraData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCovered",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalUnderlyingSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "transferShares",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "transferSharesFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "validatorGlobalExtraData",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "voidAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "voidShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawalRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
`;

export default abi;
