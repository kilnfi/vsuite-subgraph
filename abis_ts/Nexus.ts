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
        "name": "hatcher",
        "type": "address"
      }
    ],
    "name": "InvalidProvidedHatcher",
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
        "internalType": "address",
        "name": "caller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "invalidFactory",
        "type": "address"
      }
    ],
    "name": "NotSpawnedFactory",
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
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "SetAdmin",
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
        "name": "pool",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "treasury",
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
      }
    ],
    "name": "SetCoreHatchers",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "depositContractAddress",
        "type": "address"
      }
    ],
    "name": "SetDepositContract",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "genesisTimestamp",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "epochsUntilFinal",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "slotsPerEpoch",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "secondsPerSlot",
        "type": "uint64"
      }
    ],
    "name": "SetGlobalConsensusLayerSpec",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "globalOracle",
        "type": "address"
      }
    ],
    "name": "SetGlobalOracle",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "globalRecipient",
        "type": "address"
      }
    ],
    "name": "SetGlobalRecipient",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "minimalRecipientImplementationAddress",
        "type": "address"
      }
    ],
    "name": "SetMinimalRecipientImplementation",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "pendingAdmin",
        "type": "address"
      }
    ],
    "name": "SetPendingAdmin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "pluggableHatcher",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "name": "SetPluggableHatcher",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "caller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "hatcher",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "cub",
        "type": "address"
      }
    ],
    "name": "Spawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "factory",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      }
    ],
    "name": "SpawnedFactory",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "factory",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "pool",
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
      }
    ],
    "name": "SpawnedPool",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "acceptAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
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
    "name": "coreHatchers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositContract",
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
    "name": "globalConsensusLayerSpec",
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
        "internalType": "struct ctypes.GlobalConsensusLayerSpec",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "globalOracle",
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
    "name": "globalRecipient",
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
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "internalType": "address[7]",
        "name": "pluggableHatcherList",
        "type": "address[7]"
      },
      {
        "internalType": "address",
        "name": "depositContract_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "minimalRecipientImplementation_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "globalRecipient_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "globalOracle_",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "genesisTimestamp_",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "epochsUntilFinal_",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "slotsPerEpoch_",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "secondsPerSlot_",
        "type": "uint64"
      }
    ],
    "name": "initializeV1",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "pluggableHatcher",
        "type": "address"
      }
    ],
    "name": "isPluggableHatcher",
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
    "name": "minimalRecipientImplementation",
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
    "name": "pendingAdmin",
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
        "internalType": "address",
        "name": "factory",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "pluggableHatcher",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "cdata",
        "type": "bytes"
      }
    ],
    "name": "plugOnFactory",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "pluggableHatcher",
        "type": "address"
      }
    ],
    "name": "registerPluggableHatcher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[7]",
        "name": "coreHatchers_",
        "type": "address[7]"
      }
    ],
    "name": "replaceCoreHatchers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
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
    "name": "setGlobalConsensusLayerSpec",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newGlobalOracle",
        "type": "address"
      }
    ],
    "name": "setGlobalOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newGlobalRecipient",
        "type": "address"
      }
    ],
    "name": "setGlobalRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "treasuryFee",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "operatorName",
            "type": "string"
          }
        ],
        "internalType": "struct INexusV1.FactoryConstructionArguments",
        "name": "fca",
        "type": "tuple"
      }
    ],
    "name": "spawnFactory",
    "outputs": [
      {
        "internalType": "address[2]",
        "name": "spawned",
        "type": "address[2]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "epochsPerFrame",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "operatorFeeBps",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "factory",
            "type": "address"
          },
          {
            "internalType": "uint64[3]",
            "name": "reportBounds",
            "type": "uint64[3]"
          },
          {
            "internalType": "string",
            "name": "initialExtraData",
            "type": "string"
          }
        ],
        "internalType": "struct INexusV1.PoolConstructionArguments",
        "name": "pca",
        "type": "tuple"
      }
    ],
    "name": "spawnPool",
    "outputs": [
      {
        "internalType": "address[5]",
        "name": "spawned",
        "type": "address[5]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "factory",
        "type": "address"
      }
    ],
    "name": "spawnedFactory",
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
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "transferAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "pluggableHatcher",
        "type": "address"
      }
    ],
    "name": "unregisterPluggableHatcher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
`;

export default abi;
