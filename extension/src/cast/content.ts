/**
 * Cast Sender SDK page script loaded in place of remote cast_sender
 * script. Handles API object creation and initializes sender apps.
 */

import pageMessaging from "./pageMessaging";
import CastSDK from "./sdk";

// Create page-accessible API object
window.chrome.cast = new CastSDK();

pageMessaging.page.addListener(async message => {
    switch (message.subject) {
        case "cast:instanceCreated": {
            // Call page script/framework API script's init function
            const initFn = window.__onGCastApiAvailable;
            if (initFn && typeof initFn === "function") {
                initFn(message.data.isAvailable);
            }

            break;
        }
    }
});
