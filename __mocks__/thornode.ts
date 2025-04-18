import mock from './axios-adapter'

export default {
  restore: mock.restore,
  init: () => {
    // Mock GET https://thornode.ninerealms.com/thorchain/nodes
    mock.onGet(/\/thorchain\/nodes(\?.*)?$/).reply(() => {
      const resp = require('./responses/get-all-nodes.json');
      return [200, resp];
    });
    

    // Mock GET https://thornode.ninerealms.com/thorchain/lastblock
    mock.onGet(/\/thorchain\/lastblock$/).reply(() => {
      const resp = require('./responses/get-last-block.json');
      return [200, resp];
    });

    // Mock GET https://thornode.ninerealms.com/thorchain/node/:address
    mock.onGet(/\/thorchain\/node\/thor1\w+$/).reply(config => {
      const address = config.url?.split('/').pop();
      const resp = require(`./responses/get-node/${address}.json`);
      return [200, resp];
    });
  }
};
