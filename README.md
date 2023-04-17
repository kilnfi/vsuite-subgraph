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
graph codegen
graph create --node http://localhost:8020 vsuite-goerli
```

### 6. Deploy this subgraph

```
graph deploy vsuite-goerli --node http://localhost:8020 --ipfs http://localhost:5001
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


