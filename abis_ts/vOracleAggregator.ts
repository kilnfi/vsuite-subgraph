const abi = `
[
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
        "name": "member",
        "type": "address"
      }
    ],
    "name": "AlreadyOracleAggregatorMember",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "AlreadyReported",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyMembersArray",
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
    "name": "EpochInvalid",
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
        "name": "highestReportedEpoch",
        "type": "uint256"
      }
    ],
    "name": "EpochTooOld",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OracleNotReady",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "StatusNotChanged",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TooManyMembers",
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
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "UnknownOracleAggregatorMember",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "AddedOracleAggregatorMember",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "globalMember",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "variant",
        "type": "bytes32"
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
      }
    ],
    "name": "GlobalMemberVoted",
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
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "variant",
        "type": "bytes32"
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
      }
    ],
    "name": "MemberVoted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "RemovedOracleAggregatorMember",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "ReportingCleared",
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
      }
    ],
    "name": "SetFactory",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "SetGlobalMemberEjectionStatus",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "SetHighestReportedEpoch",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "nexus",
        "type": "address"
      }
    ],
    "name": "SetNexus",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "pool",
        "type": "address"
      }
    ],
    "name": "SetPool",
    "type": "event"
  },
  {
    "anonymous": false,
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
        "indexed": false,
        "internalType": "struct ctypes.ValidatorsReport",
        "name": "report",
        "type": "tuple"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "variant",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "votes",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "variantCount",
        "type": "uint256"
      }
    ],
    "name": "SubmittedReport",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "addMember",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "inputs": [],
    "name": "globalMember",
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
    "name": "globalMemberEjected",
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
    "name": "highestReportedEpoch",
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
        "name": "vpool_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "vfactory_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "nexus_",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "members",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nexus",
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
    "name": "pool",
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
    "name": "quorum",
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
    "name": "ready",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "removeMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reportingDetails",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "reportVariants",
        "type": "bytes32[]"
      },
      {
        "internalType": "uint256[]",
        "name": "reportVoteCount",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "reportVoteTracker",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "setGlobalMemberEjectionStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "name": "report",
        "type": "tuple"
      }
    ],
    "name": "submitReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
`;

export default abi;
