/* A theatrical boot log. These lines describe the portfolio, not the visitor's device. */
(function (g) {
  const groups = [
    ['OKARU / interactive portfolio', 'Boot sequence — simulated console', 'Loading local application bundle', 'Mounting read-only portfolio volume', 'Checking UTF-8 character map', 'Loading Latin font subsets', 'Loading Japanese glyph ranges', 'Opening language catalog'],
    ['Initializing canvas renderer', 'Allocating pixel-art atlas', 'Preparing room tiles', 'Registering keyboard input', 'Registering pointer input', 'Checking reduced-motion preference', 'Checking audio preference', 'Audio waits for user input'],
    ['Starting Okaru controller', 'Calibrating walking pace', 'Mapping interactive targets', 'Preparing alternate routes', 'Inspecting tiny rocks', 'Loading stumble animations', 'Checking emergency somersault', 'Okaru is ready'],
    ['Mounting projects/AquaSense', 'Mapping ESP32 → MQTT/TLS', 'Mapping cloud → dashboard', 'Mounting projects/Infrastructure', 'Mapping identity → firewall → SIEM', 'Mounting projects/ElectronicSafe', 'Mapping keypad → NVS → servo', 'Mounting projects/CPTM'],
    ['Mapping REST controllers', 'Registering repository links', 'Loading project galleries', 'Preparing schematic viewer', 'Building skill tree', 'Extending hardware branch', 'Branching infrastructure paths', 'Linking software tools'],
    ['Opening arcade cabinet', 'Loading combo input buffer', 'Calibrating directional controls', 'Registering SELECT reset', 'Loading room collectibles', 'Checking the collection cabinet', 'Checking Castle Crashers equipment', 'Opening the sketchbook'],
    ['Teddy bear occupies the corner', 'Mimikyu is behaving normally', 'Mimikyu guards the bed', 'Checking the green plush', 'Loading local achievement save', 'Preparing résumé files', 'Registering contact shortcuts', 'Preparing recruiter view'],
    ['Checking relative asset paths', 'No remote runtime required', 'Preparing focus navigation', 'Registering dialog controls', 'Enabling volume controls', 'Starting portfolio scene', 'All systems ready', 'Preparing final checks'],
    ['Starting system services', 'Mounting local font cache', 'Reading project index', 'Scanning collectible inventory', 'Checking door destinations', 'Preparing entry animations', 'Preparing exit animations', 'Door controller ready'],
    ['Loading gold dice mesh', 'Projecting twenty faces', 'Applying golden material', 'Loading skill challenges', 'Checking advantage rules', 'Checking disadvantage rules', 'Preparing critical success', 'Honour Mode recorded'],
    ['Warming hardware model', 'Warming software model', 'Starting inventory carousel', 'Preparing character reveal', 'Reading commit history', 'Preparing typing cursor', 'Restoring scene scale', 'Display ready'],
    ['Collecting service status', 'Synchronizing game clock', 'Checking sound mixer', 'Sealing read-only assets', 'Returning control to Okaru', 'Welcome to the portfolio', 'Boot sequence complete', 'PRESS START']
  ];
  const lines = groups.flat().map((t, i) => ({ t, tag: i % 8 === 0 ? '' : 'ok', ts: (i * .093).toFixed(6), ms: i % 24 === 0 ? 1450 : i % 8 === 0 ? 500 : i % 7 === 0 ? 240 : i % 3 === 0 ? 9 : 94 }));
  g.PortfolioBoot = { lines, duration: lines.reduce((n, line) => n + line.ms, 0) };
})(window);
