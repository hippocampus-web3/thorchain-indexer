import { Client } from '@xchainjs/xchain-thorchain'
import { baseAmount } from '@xchainjs/xchain-util'

// This test file should only be run manually and with caution
// as it requires real RUNE and interacts with the live network
describe('Parser Security E2E Tests', () => {
  let thorchainClient: Client;
  const recipient = "thor1xazgmh7sv0p393t9ntj6q9p52ahycc8jjlaap9"
  const minAmount = baseAmount(10000000)
  const testNodeAddress = "thor1z6lg2u2kxccnmz3xy65856mcuslwaxcvx56uuk"

  beforeAll(async () => {
    thorchainClient = new Client({
      phrase: process.env.PHRASE_MAINNET,
    })
  });

  describe('Real Network Node Listing Tests', () => {
    it('List node from non node operator address', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: `TB:V2:LIST:${testNodeAddress}:100000000000:200000000000000:1040`
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });

    it('List non node address', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: 'TB:V2:LIST:thor1jqsdv03pp867t98d0kwe0pzl5ks6q0f9fvf3ha:1000000:2000000000:100'
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });

    it('Try to use old format', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: `TB:LIST:${testNodeAddress}:thor1n9gcud325e25ywe9sycwwh6pqgalq03e5mj7dg:1000000:2000000000:100`
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });
  });

  describe('Real Network Whitelist Tests', () => {
    it('Without minimun amount', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: baseAmount(9999),
        memo: `TB:WHT:${testNodeAddress}:thor1jqsdv03pp867t98d0kwe0pzl5ks6q0f9fvf3ha:100000000`
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });

    it('Impersonating user address', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: `TB:WHT:${testNodeAddress}:thor1uz4fpyd5f5d6p9pzk8lxyj4qxnwq6f9utg0e7k:100000000`
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });

    it('No listed node', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: 'TB:WHT:thor12z69uvtwxlj2j9c5cqrnnfqy7s2twrqmvqvj20:thor1jqsdv03pp867t98d0kwe0pzl5ks6q0f9fvf3ha:100000000'
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });
  });

  describe('Real Network delist', () => {
    it('Without minimun amount', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: baseAmount(9999),
        memo: `TB:DELIST:${testNodeAddress}`
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });

    it('Impersonating user address', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: `TB:DELIST:${testNodeAddress}`
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });

    it('No listed node', async () => {
      const maliciousTxHash = await thorchainClient.transfer({
        walletIndex: 0,
        recipient,
        amount: minAmount,
        memo: 'TB:DELIST:thor12z69uvtwxlj2j9c5cqrnnfqy7s2twrqmvqvj20'
      });

      console.log('maliciousTxHash', maliciousTxHash)
    });
  });
}); 