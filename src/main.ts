import { logDetectedBrowser } from "./app/features/i18n";
import { launchPlume } from "./app/features/lifecycle";

(() => {
  "use strict";

  logDetectedBrowser();
  launchPlume();
})();
