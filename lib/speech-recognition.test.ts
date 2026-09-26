import { describe, expect, it } from "vitest";
import { speechFallbackCause } from "./speech-recognition";

describe("speechFallbackCause", () => {
    it("blames the connection only when the device is offline", () => {
        expect(speechFallbackCause("network", false)).toBe("Speech check needs a connection.");
        expect(speechFallbackCause("network", true)).toBe(
            "This browser can't check speech. Google Chrome can.",
        );
    });

    it("names the microphone problems whatever the connection", () => {
        expect(speechFallbackCause("not-allowed", true)).toBe("The microphone is off.");
        expect(speechFallbackCause("audio-capture", false)).toBe("No microphone found.");
    });

    it("says nothing for other errors or none", () => {
        expect(speechFallbackCause("no-speech", true)).toBeNull();
        expect(speechFallbackCause(null, true)).toBeNull();
        expect(speechFallbackCause(undefined, false)).toBeNull();
    });
});
