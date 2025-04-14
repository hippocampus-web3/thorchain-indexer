import { MidgardAction } from '../src/types';
import { getParser } from '../src/indexer/parsers';
import mockThornodeApi from '../__mocks__/thornode'
import { DatabaseManager } from '../src/db';
import { testDataSource } from '../test-utils/testDataSource';

describe('Parser Security Tests', () => {
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = new DatabaseManager(testDataSource);
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
    it('should reject node listing with impersonated sender', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:LIST:thor1wd59r6pn0fdaxpu2vcgjypfzr9qh34rhml07ns:thor1drm88nvzn8qclrddac876ectt548cscgukm62d:100000000000:5000000000000:1500'
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
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('nodeListing')(maliciousAction, dbManager))
        .rejects
        .toThrow('Impersonated node operator');
    });

    it('should reject node listing with invalid memo format', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:LIST:thor1address:thor1operator:1000000:2000000' // Missing fee percentage
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
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('nodeListing')(maliciousAction, dbManager))
        .rejects
        .toThrow('Invalid memo format');
    });

    it('should reject node listing for non-official node', async () => {
      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:LIST:thor1fakeaddress:thor1fakeoperator:1000000:2000000:100'
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
        height: 1000,
        date: '1234567890000000'
      };

      await expect(getParser('nodeListing')(maliciousAction, dbManager))
        .rejects
        .toThrow('Node and node operator mismatch');
    });

    it('should add node listing', async () => {
      const maliciousAction: MidgardAction = {
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
        height: 1000,
        date: '1234567890000000'
      };

      expect(await getParser('nodeListing')(maliciousAction, dbManager)).toStrictEqual({"feePercentage": 100, "height": 1000, "maxRune": 2000000, "minRune": 1000000, "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t", "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8", "timestamp": new Date("1970-01-15T06:56:07.890Z"), "txId": "fake-tx-id"})
    });

    it('should edit existing node', async () => {

      const nodeRepository = dbManager.getRepository('node_listings')
      
      await nodeRepository.save({
        nodeAddress: "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t",
        operatorAddress: "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8",
        minRune: 1000000,
        maxRune: 2000000,
        feePercentage: 100,
        txId: "fake-tx-id",
        height: 20000,
        timestamp: new Date("1970-01-15T06:56:07.890Z")
      })

      const existingNode = await nodeRepository.findOne({ 
        where: { nodeAddress: "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t" } 
      });

      expect(existingNode?.id).toBe(1)

      const maliciousAction: MidgardAction = {
        type: 'send',
        status: 'success',
        pools: [],
        metadata: {
          send: {
            memo: 'TB:LIST:thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t:thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8:33333333:3333330000:6666'
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

      expect(await getParser('nodeListing')(maliciousAction, dbManager)).toEqual({"id": 1, "feePercentage": 6666, "height": 1000, "maxRune": 3333330000, "minRune": 33333333, "nodeAddress": "thor1zhacxe8lmhu2a6nakxumsv5h8rzhauqsw74t2t", "operatorAddress": "thor1crrv4y4ndyl9ppqvacfzfvux363v50xsstz4a8", "timestamp": new Date("1970-01-15T06:56:07.890Z"), "txId": "fake-tx-id"})
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

      expect(await getParser('whitelistRequest')(maliciousAction, dbManager)).toStrictEqual(
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
  });
}); 