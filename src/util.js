import * as tf from '@tensorflow/tfjs-core';
import { TUNABLE_FLAG_VALUE_RANGE_MAP } from './params';

export function isiOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

export function isMobile() {
    return isAndroid() || isiOS();
}

/**
 * Reset the target backend
 * 
 * @param backendName: The name of the backend to be reset
 */
async function resetBackend(backendName) {
    const ENGINE = tf.engine();
    if (!(backendName in ENGINE.registryFactory)) {
        throw new Error(`${backendName} backend is not registered.`);
    }

    if (backendName in ENGINE.registry) {
        const backendFactory = tf.findBackendFactory(backendName);
        tf.removeBackend(backendName);
        tf.registerBackend(backendName, backendFactory);
    }

    await tf.setBackend(backendName);
}

/**
 * Set Environment Flags
 * 
 * This is a wrapper function of `tf.env().setFlags()` to constrain users to 
 * only set tunable flags (keys of `TUNABLE_FLAG_TYPE_MAP`).
 * 
 * @param flagConfig: An object to store flag-value pairs.
 */
export async function setBackendAndEnvFlags(flagConfig, backend) {
    if (flagConfig == null) {
        return;
    } else if (flagConfig !== 'object') {
        throw new Error(`An object is expected, while a(n) ${typeof flagConfig} is found`);
    }

    // Check the validation of flags and values
    for (const flag in flagConfig) {
        // TODO: Check whether flag can be set as flagConfig[flag].
        if (!(flag in TUNABLE_FLAG_VALUE_RANGE_MAP)) {
            throw new Error(`${flag} is not tunable or valid environment flag.`);
        }

        if (TUNABLE_FLAG_VALUE_RANGE_MAP[flag].indexOf(flagConfig[flag]) == -1) {
            throw new Error(
                `${flag} value is expected to be in range [${
                    TUNABLE_FLAG_VALUE_RANGE_MAP[flag]}], while ${flagConfig[flag]}` + ' is found.');
        }
    }

    tf.env().setFlags(flagConfig);
    const [runtime, $backend] = backend.split('-');

    if (runtime === 'tfjs') {
        await resetBackend($backend);
    }
}