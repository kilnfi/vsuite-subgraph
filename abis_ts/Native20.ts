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
      "inputs": [],
      "name": "CallbackNotFromMinting",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CommissionPaidUnderflow",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "DepositsPaused",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EmptyPoolList",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "maxFeeBps",
          "type": "uint256"
        }
      ],
      "name": "FeeOverMax",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        }
      ],
      "name": "InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        }
      ],
      "name": "InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "sum",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "msgValue",
          "type": "uint256"
        }
      ],
      "name": "InvalidAmounts",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidBPSValue",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidNullValue",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "InvalidPoolId",
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
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "NoSharesToExit",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "NonZeroPercentageOnDeactivatedPool",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "poolAddress",
          "type": "address"
        }
      ],
      "name": "NotARegisteredPool",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "ethLeft",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "OutstandingCommission",
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
          "internalType": "address",
          "name": "newPool",
          "type": "address"
        }
      ],
      "name": "PoolAlreadyRegistered",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "PoolDisabled",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "PoolTransferFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "Reentrancy",
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
          "name": "lengthA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lengthB",
          "type": "uint256"
        }
      ],
      "name": "UnequalLengths",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZeroSharesMint",
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
          "internalType": "uint256",
          "name": "pSharesSold",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountSold",
          "type": "uint256"
        }
      ],
      "name": "CommissionSharesSold",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "withdrawer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountWithdrawn",
          "type": "uint256"
        }
      ],
      "name": "CommissionWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "staker",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "exitedTokens",
          "type": "uint128"
        },
        {
          "components": [
            {
              "internalType": "uint128",
              "name": "poolId",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "exitedPoolShares",
              "type": "uint128"
            }
          ],
          "indexed": false,
          "internalType": "struct PoolExitDetails[]",
          "name": "exitDetails",
          "type": "tuple[]"
        }
      ],
      "name": "Exit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "weights",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "address[]",
          "name": "recipients",
          "type": "address[]"
        }
      ],
      "name": "ExitedCommissionShares",
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
          "internalType": "address[]",
          "name": "recipients",
          "type": "address[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "splits",
          "type": "uint256[]"
        }
      ],
      "name": "NewCommissionSplit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "poolAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        }
      ],
      "name": "PoolActivation",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "poolAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "PoolAdded",
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
          "internalType": "bool",
          "name": "isPaused",
          "type": "bool"
        }
      ],
      "name": "SetDepositsPaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "operatorFeeBps",
          "type": "uint256"
        }
      ],
      "name": "SetFee",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "maxCommission",
          "type": "uint256"
        }
      ],
      "name": "SetMaxCommission",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        }
      ],
      "name": "SetName",
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
          "indexed": false,
          "internalType": "uint256[]",
          "name": "split",
          "type": "uint256[]"
        }
      ],
      "name": "SetPoolPercentages",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "symbol",
          "type": "string"
        }
      ],
      "name": "SetSymbol",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "staker",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "depositedEth",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "mintedTokens",
          "type": "uint128"
        },
        {
          "components": [
            {
              "internalType": "uint128",
              "name": "poolId",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "ethToPool",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "ethToIntegrator",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "pSharesFromPool",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "pSharesFromIntegrator",
              "type": "uint128"
            }
          ],
          "indexed": false,
          "internalType": "struct PoolStakeDetails[]",
          "name": "stakeDetails",
          "type": "tuple[]"
        }
      ],
      "name": "Stake",
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
          "name": "vPool",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "VPoolSharesReceived",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "_getPool",
      "outputs": [
        {
          "internalType": "contract IvPool",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "acceptAdmin",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "pool",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "feeBps",
          "type": "uint256"
        }
      ],
      "name": "addPool",
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
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOfUnderlying",
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
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "newFeeBps",
          "type": "uint256"
        }
      ],
      "name": "changeFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "recipients",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "splits",
          "type": "uint256[]"
        }
      ],
      "name": "changeSplit",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "depositsPaused",
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
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "exitCommissionShares",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCurrentSplit",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        },
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "getFee",
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
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "getPoolActivation",
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
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "symbol",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "admin",
              "type": "address"
            },
            {
              "internalType": "address[]",
              "name": "pools",
              "type": "address[]"
            },
            {
              "internalType": "uint256[]",
              "name": "poolFees",
              "type": "uint256[]"
            },
            {
              "internalType": "address[]",
              "name": "commissionRecipients",
              "type": "address[]"
            },
            {
              "internalType": "uint256[]",
              "name": "commissionDistribution",
              "type": "uint256[]"
            },
            {
              "internalType": "uint256[]",
              "name": "poolPercentages",
              "type": "uint256[]"
            },
            {
              "internalType": "uint256",
              "name": "maxCommissionBps",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "monoTicketThreshold",
              "type": "uint256"
            }
          ],
          "internalType": "struct Native20Configuration",
          "name": "args",
          "type": "tuple"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        }
      ],
      "name": "integratorCommissionOwed",
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
          "internalType": "address[]",
          "name": "exitQueues",
          "type": "address[]"
        },
        {
          "internalType": "uint256[][]",
          "name": "ticketIds",
          "type": "uint256[][]"
        },
        {
          "internalType": "uint32[][]",
          "name": "casksIds",
          "type": "uint32[][]"
        }
      ],
      "name": "multiClaim",
      "outputs": [
        {
          "internalType": "enum IvExitQueue.ClaimStatus[][]",
          "name": "statuses",
          "type": "uint8[][]"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "exitQueues",
          "type": "address[]"
        },
        {
          "internalType": "uint256[][]",
          "name": "ticketIds",
          "type": "uint256[][]"
        }
      ],
      "name": "multiResolve",
      "outputs": [
        {
          "internalType": "int64[][]",
          "name": "caskIdsOrErrors",
          "type": "int64[][]"
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
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "name": "onvPoolSharesReceived",
      "outputs": [
        {
          "internalType": "bytes4",
          "name": "",
          "type": "bytes4"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "isPaused",
          "type": "bool"
        }
      ],
      "name": "pauseDeposits",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "inputs": [],
      "name": "pools",
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
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "requestExit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "minTicketEthValue",
          "type": "uint256"
        }
      ],
      "name": "setMonoTicketThreshold",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "poolId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "status",
          "type": "bool"
        },
        {
          "internalType": "uint256[]",
          "name": "newPoolPercentages",
          "type": "uint256[]"
        }
      ],
      "name": "setPoolActivation",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256[]",
          "name": "split",
          "type": "uint256[]"
        }
      ],
      "name": "setPoolPercentages",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stake",
      "outputs": [],
      "stateMutability": "payable",
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
      "inputs": [],
      "name": "withdrawCommission",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
`;
export default abi;
