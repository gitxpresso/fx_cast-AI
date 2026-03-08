import type { TypedMessagePort } from "../lib/TypedMessagePort";
import messaging, { type Message } from "../messaging";
import type { ReceiverDevice } from "../types";

import pageMessaging from "./pageMessaging";

// Ensure extension-side is initialized first
void pageMessaging.extension;

import CastSDK from "./sdk";

export type CastPort = TypedMessagePort<Message>;

let existingPort: CastPort;
let existingInstance = new CastSDK();

export default existingInstance;

interface EnsureInitOpts {
    /** Skip receiver selection. */
    receiverDevice?: ReceiverDevice;
}

/**
 * To support exporting the API from a module, we need to retain the
 * MessageChannel-based pageMessaging layer despite not crossing any
 * context boundaries.
 *
 * The ensureInit function creates a messaging connection to the
 * cast manager, hooks it up to the pageMessaging layer and also
 * provides a messaging port so consumers of this module can communicate
 * with the cast manager.
 */
export function ensureInit(opts?: EnsureInitOpts): Promise<CastPort> {
    return new Promise(async (resolve, reject) => {
        // If already initialized
        if (existingPort) {
            existingPort.close();
            existingInstance = new CastSDK();
        }

        const managerPort = messaging.connect({ name: "trusted-cast" });

        // Cast manager -> cast instance
        managerPort.onMessage.addListener(message => {
            if (message.subject === "cast:instanceCreated") {
                if (message.data.isAvailable) {
                    resolve(pageMessaging.page.messagePort);
                } else {
                    reject();
                }
            }

            pageMessaging.extension.sendMessage(message);
        });

        // Cast instance -> cast manager
        pageMessaging.extension.addListener(message => {
            // Skip receiver selection
            if (opts?.receiverDevice) {
                message = rewriteTrustedRequestSession(
                    message,
                    opts.receiverDevice
                );
            }

            managerPort.postMessage(message);
        });

        managerPort.onDisconnect.addListener(() => {
            pageMessaging.extension.close();
        });

        existingPort = pageMessaging.page.messagePort;
    });
}

/**
 * If a receiver device was passed to `ensureInit`, messages to the cast
 * manager will be passed through this function and the receiver device
 * will be added to the message payload. This tells the cast manager to
 * skip receiver selection when requesting a session.
 */
function rewriteTrustedRequestSession(
    message: Message,
    receiverDevice: ReceiverDevice
) {
    if (message.subject !== "main:requestSession") return message;
    message.data.receiverDevice = receiverDevice;
    return message;
}
