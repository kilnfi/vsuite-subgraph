# `vsuite-subgraph`

## Run locally

### Requirements

- [docker](https://docs.docker.com/compose/install/)
- [docker-compose](https://docs.docker.com/compose/install/linux/)
- [graph cli](https://thegraph.com/docs/en/cookbook/quick-start/)
- A goerli RPC endpoint (on-premise works better)

### 1. Clone the `graph-node` repo

```
git clone https://github.com/graphprotocol/graph-node.git
```

### 2. Locate the `docker-compose.yml` file

```
cd graph-node/docker && ls
```

### 3. Edit the `ethereum` environment variable of the `graph-node` service (L.22)


```
...
      ethereum: 'goerli:ETHEREUM_GOERLI_RPC_ENDPOINT'
...
```

### 4. Start everything

```
docker-compose up
```


### 5. Register this subgraph on the `graph-node`

```
graph codegen subgraph.goerli_fast.yaml
graph create --node http://localhost:8020 vsuite-goerli
```

### 6. Deploy this subgraph

```
graph deploy vsuite-goerli --node http://localhost:8020 --ipfs http://localhost:5001 subgraph.goerli_fast.yaml
```

### 7. Visit the [web UI](http://localhost:8000/subgraphs/name/vsuite-goerli/graphql)

Test the following GraphQL request to ensure everything works well

```
{
  nexuses {
    factories {
      address
      pools {
        address
      }
    }
  }
}
```

## Run on chainstack dedicated subgraph

After you create an account on [chainstack](https://chainstack.com/), you can deploy this subgraph on their platform.

### 1. Install the graph cli and prepare the environment

```
yarn global add @graphprotocol/graph-cli
yarn
graph codegen subgraph.testnet_fast.yaml  # or subgraph.mainnet_fast.yaml
```

### 2. Create a new project

You'll need to create a new project on chainstack to contain the subgraph.

### 3. Create a new subgraph

Then go into `Subgraphs` > `Add Subgraph` > `Dedicated Subgraph` 
Select Ethereum and chose the network you want to deploy on. (Mainnet or Holesky)
Then `Deploy Subgraph`

### 4. Deploy the subgraph

Copy the `Deployment command` and append the `subgraph.mainnet_fast.yaml` or `subgraph.testnet_fast.yaml` to the command according to the network you want to deploy on.

```

`graph deploy --node https://api.graph-ams.p2pify.com/.../deploy --ipfs https://api.graph-ams.p2pify.com/.../ipfs sgr-190-148-475 subgraph.mainnet_fast.yaml
`
```
### 5. Test the GraphQL request

Wait for the indexing to happen and test the following GraphQL request in the webUI (next to the indexing bar)
```
{
  nexuses {
    factories {
      address
      pools {
        address
      }
    }
  }
}
```
