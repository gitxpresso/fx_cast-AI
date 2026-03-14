/**
 * Content script loaded on whitelisted URLs. Sets some window
 * properties to help with Chrome compatibility and handles dynamic
 * chrome-extension:// cast script loads.
 */

import { CAST_EXTENSION_SENDER_SCRIPT_URLS, CAST_SDK_SCRIPT_URL } from "./urls";

declare global {
    interface Object {
        wrappedJSObject: this;
    }

    interface Window {
        wrappedJSObject: Window;
        chrome: {
            cast?: object;
        };
        __onGCastApiAvailable: (isAvailable: boolean) => void;
    }
    interface Navigator {
        presentation: object | undefined;
    }
}

window.wrappedJSObject.chrome = cloneInto({}, window);
if (!window.wrappedJSObject.navigator.presentation) {
    window.wrappedJSObject.navigator.presentation = cloneInto({}, window);
}

const srcPropDesc = Reflect.getOwnPropertyDescriptor(
    HTMLScriptElement.prototype.wrappedJSObject,
    "src"
);
/**
 * Intercept script element src attribute changes and rewrite cast
 * script URLs to the remote loader script URL to be redirected by the
 * extension's webRequest handlers in the background script.
 */
Reflect.defineProperty(HTMLScriptElement.prototype.wrappedJSObject, "src", {
    configurable: true,
    enumerable: true,
    get: srcPropDesc?.get,

    set: exportFunction(function (this: HTMLScriptElement, value: string) {
        if (CAST_EXTENSION_SENDER_SCRIPT_URLS.includes(value)) {
            return srcPropDesc?.set?.call(this, CAST_SDK_SCRIPT_URL);
        }

        return srcPropDesc?.set?.call(this, value);
    }, window)
});
