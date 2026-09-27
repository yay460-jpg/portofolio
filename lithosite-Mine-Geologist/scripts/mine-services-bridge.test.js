// Stage 6 host bridge contract tests.
// Intended for a browser-capable test runner or direct console execution.

(async function () {
  'use strict';

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  const calls = [];
  const bridge = new MineServicesBridge(async (request) => {
    calls.push(request);
    return {
      request_id: request.request_id,
      status: 'COMMITTED'
    };
  });

  const response = await bridge.call(
    'CREATE',
    {
      entity: 'Equipment',
      row: { equipment_id: 'EQ-HOST' }
    },
    'host-test-001'
  );

  assert(response.request_id === 'host-test-001', 'request_id must be preserved');
  assert(response.status === 'COMMITTED', 'runtime status must be preserved');
  assert(calls[0].operation === 'CREATE', 'operation must be preserved');
  assert(calls[0].entity === 'Equipment', 'entity must be preserved');

  let unsupportedRejected = false;
  try {
    await bridge.call('DROP_DATABASE', {});
  } catch (error) {
    unsupportedRejected = error.code === 'HOST-002';
  }
  assert(unsupportedRejected, 'unsupported operation must be rejected');

  const generated = await bridge.call('READ', { entity: 'Equipment' });
  assert(generated.request_id, 'bridge must generate request_id');

  console.info('Mine Services Stage 6 bridge contract: PASS');
})();
