#!/usr/bin/env bash
# Print the release notes for a version from CHANGELOG.md.
# From 2.0 on, the steps to upgrade from the 1.x dashboard plugin follow: the Marketplace cannot change an installed
# repository's type, so those users see "The installed content has no alarm_card.zip" when they update.
#   release-notes.sh X.Y.Z            -> the "## X.Y.Z" section, without its heading
#   release-notes.sh X.Y.Z A.B.C      -> every section from X.Y.Z down to A.B.C (excluded), so that
#                                        one release carries all the versions bumped since the previous
#                                        tag; the headings are kept when there is more than one section.
set -euo pipefail
awk -v v="$1" -v prev="${2:-}" '
  /^## / {
    if (!started) {
      if ($2 != v) next
      started = 1
    } else if (prev == "" || $2 == prev) {
      exit
    }
    n++; head[n] = $0; body[n] = ""; next
  }
  started { if (body[n] == "" && $0 == "") next; body[n] = body[n] $0 "\n" }
  END {
    for (i = 1; i <= n; i++) {
      if (n > 1) printf "%s\n\n", head[i]
      printf "%s", body[i]
    }
  }
' CHANGELOG.md | sed -e '/./,$!d'
if [ "${1%%.*}" -ge 2 ] 2>/dev/null; then
  cat <<'NOTE'

### Upgrading from 1.x (dashboard plugin)
Since 2.0 this repository is an **Integration**, no longer a Dashboard plugin, and the Marketplace cannot change the type of an installed repository: updating the old dashboard plugin fails with *"The installed content has no alarm_card.zip"*. Remove **Alarm Card** (type Dashboard) from the Marketplace and its `/local/community/ha-alarm-card/alarm-card.js` resource, add the repository again with the type **Integration**, install it, restart, then add the integration in **Settings → Devices & services**. Your cards keep their YAML. See [Upgrading from 1.x](https://github.com/juju35/ha-alarm-card#upgrading-from-1x-dashboard-plugin).
NOTE
fi
