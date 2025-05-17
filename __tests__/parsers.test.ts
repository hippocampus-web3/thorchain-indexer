import { MidgardAction } from '../src/types';
import { getParser } from '../src/indexer/parsers';
import mockThornodeApi from '../__mocks__/thornode'
import { DatabaseManager } from '../src/db';
import { testDataSource } from '../test-utils/testDataSource';
import { subscriptionDataSource } from '../src/data-source-subscription';

describe('Parser Security Tests', () => {
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = new DatabaseManager(testDataSource, subscriptionDataSource);
    await dbManager.initialize();
    await testDataSource.runMigrations()
    await mockThornodeApi.init()
  });

  afterEach(async () => {
    await dbManager.getRepository('whitelist_requests').clear();
    await dbManager.getRepository('node_listings').delete({});
  });

  afterAll(async () => {
    await mockThornodeApi.restore()
    await testDataSource.destroy();
  });

  describe('Node Listing Parser Security Tests', () => {
    describe('V1 Format Tests (height <= 20810526)', () => {
      it('should add node listing with V1 format', async () => {
        const validAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8:1000000:2000000:100'
            }
          },
          in: [{
            address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810526, // Last valid block for V1
          date: '1234567890000000'
        };

        expect(await getParser('nodeListing')(validAction, dbManager)).toEqual({
          "feePercentage": 100,
          "height": 20810526,
          "minRune": 1000000,
          "maxRune": 2000000,
          "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
          "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
          "timestamp": new Date("1970-01-15T06:56:07.890Z"),
          "txId": "fake-tx-id"
        });
      });

      it('should reject node listing with maxRune less than minRune in V1 format', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8:2000000:1000000:100'
            }
          },
          in: [{
            address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810526,
          date: '1234567890000000'
        };

        await expect(getParser('nodeListing')(maliciousAction, dbManager))
          .rejects
          .toThrow('maxRune (1000000) must be greater than or equal to minRune (2000000)');
      });

      it('should reject node listing with invalid fee percentage in V1 format', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8:1000000:2000000:10001'
            }
          },
          in: [{
            address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810526,
          date: '1234567890000000'
        };

        await expect(getParser('nodeListing')(maliciousAction, dbManager))
          .rejects
          .toThrow('feePercentage (10001) must be between 0 and 100');
      });
    });

    describe('V2 Format Tests (height > 20810526)', () => {
      it('should reject node listing with impersonated sender', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:V2:LIST:thor1wd59r6pn0fdaxpu2vcgjypfzr9qh34rhml07ns:100000000000:5000000000000:1500'
            }
          },
          in: [{
            address: 'thor1fakeaddress', // Different from operator address
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810527, // First block for V2
          date: '1234567890000000'
        };

        await expect(getParser('nodeListingV2')(maliciousAction, dbManager))
          .rejects
          .toThrow('Only the node operator can list a node');
      });

      it('should reject node listing with invalid memo format', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:V2:LIST:thor1address:thor1operator:1000000' // Missing fee percentage
            }
          },
          in: [{
            address: 'thor1operator',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810527,
          date: '1234567890000000'
        };

        await expect(getParser('nodeListingV2')(maliciousAction, dbManager))
          .rejects
          .toThrow('Invalid memo format for node listing V2');
      });

      it('should reject node listing for non-official node', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:V2:LIST:thor1fakeaddress:thor1fakeoperator:1000000:100'
            }
          },
          in: [{
            address: 'thor1fakeoperator',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810527,
          date: '1234567890000000'
        };

        await expect(getParser('nodeListingV2')(maliciousAction, dbManager))
          .rejects
          .toThrow('Node thor1fakeaddress not found in official nodes');
      });

      it('should add node listing with V2 format', async () => {
        const validAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:V2:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:1000000:2000000:100'
            }
          },
          in: [{
            address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810527,
          date: '1234567890000000'
        };

        expect(await getParser('nodeListingV2')(validAction, dbManager)).toEqual({
          "feePercentage": 100,
          "height": 20810527,
          "minRune": 1000000,
          "targetTotalBond": 2000000,
          "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
          "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
          "timestamp": new Date("1970-01-15T06:56:07.890Z"),
          "txId": "fake-tx-id"
        });
      });

      it('should reject node listing with targetTotalBond less than minRune', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:V2:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:2000000:1000000:100'
            }
          },
          in: [{
            address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810527,
          date: '1234567890000000'
        };

        await expect(getParser('nodeListingV2')(maliciousAction, dbManager))
          .rejects
          .toThrow('targetTotalBond (1000000) must be greater than or equal to minRune (2000000)');
      });

      it('should reject node listing with invalid fee percentage', async () => {
        const maliciousAction: MidgardAction = {
          type: 'send',
          status: 'success',
          pools: [],
          metadata: {
            send: {
              memo: 'TB:V2:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:1000000:2000000:10001'
            }
          },
          in: [{
            address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          out: [{
            address: 'thor1vault',
            txID: 'fake-tx-id',
            coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
          }],
          height: 20810527,
          date: '1234567890000000'
        };

        await expect(getParser('nodeListingV2')(maliciousAction, dbManager))
          .rejects
          .toThrow('feePercentage (10001) must be between 0 and 100');
      });
    });

    it('should edit existing node with V2 format', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      
      await nodeRepository.save({
        nodeAddress: "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        operatorAddress: "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        minRune: 1000000,
        feePercentage: 100,
        txId: "fake-tx-id",
        height: 20000,
        timestamp: new Date("1970-01-15T06:56:07.890Z")
      });

      const existingNode = await nodeRepository.findOne({ 
        where: { nodeAddress: "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t" } 
      });

      expect(existingNode?.id).toBe(1);

      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:V2:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:33333333:3333330000:6666'
          }
        },
        in: [{
          address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      expect(await getParser('nodeListingV2')(maliciousAction, dbManager)).toEqual({
        "id": 1,
        "feePercentage": 6666,
        "height": 1000,
        "minRune": 33333333,
        "maxRune": null,
        "targetTotalBond": 3333330000,
        "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        "timestamp": new Date("1970-01-15T06:56:07.890Z"),
        "txId": "fake-tx-id"
      });
    });
  });

  describe('Node Delisting Parser Tests', () => {
    it('should reject delisting with impersonated sender', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:DELIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t'
          }
        },
        in: [{
          address: 'thor1fakeaddress', // Different from operator address
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 20810527,
        date: '1234567890000000'
      };

      await expect(getParser('nodeDelist')(maliciousAction, dbManager))
        .rejects
        .toThrow('Only the node operator can delist a node');
    });

    it('should reject delisting with invalid memo format', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:DELIST' // Missing node address
          }
        },
        in: [{
          address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 20810527,
        date: '1234567890000000'
      };

      await expect(getParser('nodeDelist')(maliciousAction, dbManager))
        .rejects
        .toThrow('Invalid memo format for node delist');
    });

    it('should reject delisting for non-existent node', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:DELIST:thor16xxh3kmd4fsadhf4u92gdte2nnhlw8rhjgw245'
          }
        },
        in: [{
          address: 'thor1upuw8yvg96uf4nd6jfuq9s25284dzr45kyzarc',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 20810527,
        date: '1234567890000000'
      };

      await expect(getParser('nodeDelist')(maliciousAction, dbManager))
        .rejects
        .toThrow('Node thor16xxh3kmd4fsadhf4u92gdte2nnhlw8rhjgw245 not found in listings');
    });

    it('should successfully delist a node', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      
      // First create a valid node
      await nodeRepository.save({
        nodeAddress: "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        operatorAddress: "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        minRune: 1000000,
        targetTotalBond: 2000000,
        feePercentage: 100,
        txId: "fake-tx-id",
        height: 20000,
        timestamp: new Date("1970-01-15T06:56:07.890Z"),
        isDelisted: false
      });

      const delistAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:DELIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t'
          }
        },
        in: [{
          address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
          txID: 'new-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'new-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 20810527,
        date: '1234567890000000'
      };

      const result = await getParser('nodeDelist')(delistAction, dbManager);
      console.log('result', result)
      expect(result).toEqual({
        "id": 1,
        "feePercentage": 100,
        "height": 20810527,
        "minRune": 1000000,
        "maxRune": null,
        "targetTotalBond": "2000000",
        "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        "timestamp": new Date("1970-01-15T06:56:07.890Z"),
        "txId": "new-tx-id",
        "isDelisted": true
      });
    });

    it('should re-list a delisted node with V2 format', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      
      // Create a delisted node
      await nodeRepository.save({
        nodeAddress: "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        operatorAddress: "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        minRune: 1000000,
        targetTotalBond: 2000000,
        feePercentage: 100,
        txId: "fake-tx-id",
        height: 20000,
        timestamp: new Date("1970-01-15T06:56:07.890Z"),
        isDelisted: true
      });

      const reListAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:V2:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:1500000:2500000:150'
          }
        },
        in: [{
          address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
          txID: 'new-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1500000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'new-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1500000' }]
        }],
        height: 20810527,
        date: '1234567890000000'
      };

      const result = await getParser('nodeListingV2')(reListAction, dbManager);
      expect(result).toEqual({
        "id": 1,
        "feePercentage": 150,
        "height": 20810527,
        "minRune": 1500000,
        "targetTotalBond": 2500000,
        "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        "timestamp": new Date("1970-01-15T06:56:07.890Z"),
        "txId": "new-tx-id",
        "maxRune": null,
        "isDelisted": false
      });
    });
  });

  describe('Whitelist Request Parser Security Tests', () => {
    it('should reject whitelist request with impersonated user address', async () => {

      const nodeRepository = dbManager.getRepository('node_listings')
      // First create a valid node
      await nodeRepository.save({
        nodeAddress: 'thor1realnode',
        operatorAddress: 'thor1realoperator',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:WHT:thor1realnode:thor1fakeuser:1000000'
          }
        },
        in: [{
          address: 'thor1differentaddress', // Different from user address
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('whitelistRequest')(maliciousAction, dbManager))
        .rejects
        .toThrow('Impersonated address');
    });

    it('should reject whitelist request for non-registed node', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:WHT:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:thor1realuser:1000000'
          }
        },
        in: [{
          address: 'thor1realuser',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('whitelistRequest')(maliciousAction, dbManager))
        .rejects
        .toThrow("Node thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t does not exist");
    });

    it('should reject whitelist request with invalid memo format', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'whitelist:thor1node:thor1user' // Missing bond amount
          }
        },
        in: [{
          address: 'thor1user',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('whitelistRequest')(maliciousAction, dbManager))
        .rejects
        .toThrow('Invalid memo format');
    });

    it('should register valid whitelist', async () => {

      const nodeRepository = dbManager.getRepository('node_listings')
      // First create a valid node
      await nodeRepository.save({
        nodeAddress: 'thor1realnode',
        operatorAddress: 'thor1realoperator',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:WHT:thor1realnode:thor1realUser:1000000'
          }
        },
        in: [{
          address: 'thor1realUser',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      expect(await getParser('whitelistRequest')(maliciousAction, dbManager)).toEqual(
        {
          "height": 1000,
          "intendedBondAmount": 1000000,
          "nodeAddress": "thor1realnode",
          "timestamp": new Date("1970-01-15T06:56:07.890Z"),
          "txId": "fake-tx-id",
          "userAddress": "thor1realUser",
        }
      )
    });

    it('should reject whitelist request for non-existent node', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:WHT:thor1nonexistentnode:thor1user:1000000'
          }
        },
        in: [{
          address: 'thor1user',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('whitelistRequest')(maliciousAction, dbManager))
        .rejects
        .toThrow('Node thor1nonexistentnode does not exist');
    });

    it('should update existing whitelist request', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      // First create a valid node
      await nodeRepository.save({
        nodeAddress: 'thor1realnode',
        operatorAddress: 'thor1realoperator',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const whitelistRepo = dbManager.getRepository('whitelist_requests');
      // Create initial whitelist request
      await whitelistRepo.save({
        nodeAddress: 'thor1realnode',
        userAddress: 'thor1realUser',
        intendedBondAmount: 1000000,
        txId: "old-tx-id",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z"),
        status: 'pending'
      });

      const existingRequest = await whitelistRepo.findOne({
        where: {
          nodeAddress: 'thor1realnode',
          userAddress: 'thor1realUser'
        }
      });

      expect(existingRequest?.id).toBe(1);

      const updateAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:WHT:thor1realnode:thor1realUser:2000000' // Different bond amount
          }
        },
        in: [{
          address: 'thor1realUser',
          txID: 'new-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '2000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'new-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '2000000' }]
        }],
        height: 2000,
        date: '1234567890000000'
      };

      const result = await getParser('whitelistRequest')(updateAction, dbManager);
      expect(result).toEqual({
        id: 1,
        nodeAddress: 'thor1realnode',
        userAddress: 'thor1realUser',
        intendedBondAmount: 2000000,
        txId: 'new-tx-id',
        height: 2000,
        timestamp: new Date("1970-01-15T06:56:07.890Z"),
        realBond: "0",
        status: 'pending'
      });

      // Verify only one record exists
      const allRequests = await whitelistRepo.find();
      expect(allRequests.length).toBe(1);
    });
  });

  describe('Chat Message Parser Security Tests', () => {
    it('should reject chat message with invalid memo format', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1node' // Missing message
          }
        },
        in: [{
          address: 'thor1user',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('chatMessage')(maliciousAction, dbManager))
        .rejects
        .toThrow('Invalid memo format');
    });

    it('should reject chat message without sender address', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1node:base64message'
          }
        },
        in: [], // No sender address
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('chatMessage')(maliciousAction, dbManager))
        .rejects
        .toThrow('No sender address found in transaction');
    });

    it('should reject chat message for non-existent node', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1nonexistentnode:base64message'
          }
        },
        in: [{
          address: 'thor1user',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('chatMessage')(maliciousAction, dbManager))
        .rejects
        .toThrow('Node thor1nonexistentnode does not exist');
    });
    it('should create chat message from node operator', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      await nodeRepository.save({
        nodeAddress: 'thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t',
        operatorAddress: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const validAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:' + Buffer.from('Hello from operator').toString('base64')
          }
        },
        in: [{
          address: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8', // Node operator address
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      const result = await getParser('chatMessage')(validAction, dbManager);
      expect(result).toEqual({
        role: 'NO',
        nodeAddress: 'thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t',
        userAddress: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
        message: 'Hello from operator',
        txId: 'fake-tx-id',
        height: 1000,
        timestamp: new Date("1970-01-15T06:56:07.890Z")
      });
    });

    it('should create chat message from bond provider', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      await nodeRepository.save({
        nodeAddress: 'thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t',
        operatorAddress: 'thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const validAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:' + Buffer.from('Hello from bond provider').toString('base64')
          }
        },
        in: [{
          address: 'thor1wuk3w3ymesv6hwf0uxpj66lv6kr6tznpykamuy', // Bond provider address
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      const result = await getParser('chatMessage')(validAction, dbManager);
      expect(result).toEqual({
        role: 'BP',
        nodeAddress: 'thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t',
        userAddress: 'thor1wuk3w3ymesv6hwf0uxpj66lv6kr6tznpykamuy',
        message: 'Hello from bond provider',
        txId: 'fake-tx-id',
        height: 1000,
        timestamp: new Date("1970-01-15T06:56:07.890Z")
      });
    });

    it('should create chat message from regular user', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      await nodeRepository.save({
        nodeAddress: 'thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t',
        operatorAddress: 'thor1wuk3w3ymesv6hwf0uxpj66lv6kr6tznpykamuy',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const validAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:' + Buffer.from('Hello from user').toString('base64')
          }
        },
        in: [{
          address: 'thor1jqsdv03pp867t98d0kwe0pzl5ks6q0f9fvf3ha', // Regular user address
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '100000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '100000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      const result = await getParser('chatMessage')(validAction, dbManager);
      expect(result).toEqual({
        role: 'USER',
        nodeAddress: 'thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t',
        userAddress: 'thor1jqsdv03pp867t98d0kwe0pzl5ks6q0f9fvf3ha',
        message: 'Hello from user',
        txId: 'fake-tx-id',
        height: 1000,
        timestamp: new Date("1970-01-15T06:56:07.890Z")
      });
    });

    it('should reject chat message when node not found in Thornode', async () => {
      const nodeRepository = dbManager.getRepository('node_listings')
      await nodeRepository.save({
        nodeAddress: 'thor1node',
        operatorAddress: 'thor1operator',
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "0x",
        height: 1000,
        timestamp: new Date("2025-01-15T06:56:07.890Z")
      });

      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:MSG:thor1node:' + Buffer.from('Hello').toString('base64')
          }
        },
        in: [{
          address: 'thor1user',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        out: [{
          address: 'thor1vault',
          txID: 'fake-tx-id',
          coins: [{ asset: 'THOR.RUNE', amount: '1000000' }]
        }],
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('chatMessage')(maliciousAction, dbManager))
        .rejects
        .toThrow('Could not fetch node details from Thornode');
    });
  });
}); 