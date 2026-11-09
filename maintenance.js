(() => {
  const config = window.ENTRANCE_CONFIG;
  if (config?.maintenanceMessage) document.querySelector('#status').textContent = config.maintenanceMessage;
  document.querySelector('#resume').textContent = config?.resumeAt || '再開後は、この入口からいつもどおり開けます。';
})();
