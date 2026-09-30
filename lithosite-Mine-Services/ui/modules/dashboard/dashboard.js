(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  async function loadData() {
    if (!runtimeClient) return;

    try {
      const results = await Promise.all([
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' }),
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Operations' }),
        runtimeClient.request({ operation: 'READ', entity: 'Issues' })
      ]);

      const equipment = Array.isArray(results[0].data) ? results[0].data : [];
      const workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      const operations = Array.isArray(results[2].data) ? results[2].data : [];
      const issues = Array.isArray(results[3].data) ? results[3].data : [];

      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('-');

      const todayOperations = operations.filter(function (row) {
        return String(row.transaction_date || '') === today;
      });

      const openIssues = issues.filter(function (row) {
        return String(row.status || '').toLowerCase() !== 'closed';
      });

      const activeWorkFronts = workFronts.filter(function (row) {
        return String(row.status || '').toLowerCase() === 'active';
      });

      setText('dashboardTotalEquipment', equipment.length);
      setText('dashboardActiveWorkFront', activeWorkFronts.length);
      setText('dashboardTodayOperations', todayOperations.length);
      setText('dashboardOpenIssues', openIssues.length);
    } catch (error) {
      console.warn('Dashboard runtime sync failed:', error);
    }
  }

  function init() {
    const expand = document.getElementById('expand');

    if (expand) {
      expand.addEventListener('click', function () {
        const app = document.querySelector('.app');
        if (!app) return;

        app.classList.toggle('expanded-tables');
        expand.textContent = app.classList.contains('expanded-tables')
          ? 'Collapse Tables'
          : 'Expand Tables';
      });
    }

    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.LithositeDashboard = Object.freeze({
    init,
    refresh: loadData
  });
})(window);
