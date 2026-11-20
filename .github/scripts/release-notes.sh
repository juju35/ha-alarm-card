#!/usr/bin/env bash
# Print the CHANGELOG.md section for a version, without its "## x.y.z" heading.
# From 2.0 on, the steps to upgrade from the 1.x dashboard plugin follow: the Marketplace cannot change an installed
# repository's type, so those users see "The installed content has no alarm_card.zip" when they update.
set -euo pipefail
awk -v v="$1" '
  /^## / { if (found) exit; found = ($2 == v); next }
  found { print }
' CHANGELOG.md | sed -e '/./,$!d'
if [ "${1%%.*}" -ge 2 ] 2>/dev/null; then
  cat <<'NOTE'

### Upgrading from 1.x (dashboard plugin)
Since 2.0 this repository is an **Integration**, no longer a Dashboard plugin, and the Marketplace cannot change the type of an installed repository: updating the old dashboard plugin fails with *"The installed content has no alarm_card.zip"*. Remove **Alarm Card** (type Dashboard) from the Marketplace and its `/local/community/ha-alarm-card/alarm-card.js` resource, add the repository again with the type **Integration**, install it, restart, then add the integration in **Settings → Devices & services**. Your cards keep their YAML. See [Upgrading from 1.x](https://github.com/juju35/ha-alarm-card#upgrading-from-1x-dashboard-plugin).
NOTE
fi
