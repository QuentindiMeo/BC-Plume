import { logDetectedBrowser } from "./features/i18n";
import { launchPlume } from "./features/lifecycle";

(() => {
  "use strict";

  logDetectedBrowser();
  launchPlume();
})();
