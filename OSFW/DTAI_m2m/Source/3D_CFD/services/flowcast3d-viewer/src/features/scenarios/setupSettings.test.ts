import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSetupSettings } from "./setupSettings";

const defaults = {
  speed: 5,
  direction: 0,
  durationSeconds: 60,
  stepSeconds: 1,
};
const edited = {
  speed: 7,
  direction: 45,
  durationSeconds: 120,
  stepSeconds: 2,
};
const reset = () =>
  useSetupSettings.setState(useSetupSettings.getInitialState(), true);
beforeEach(reset);
afterEach(reset);

function fingerprint() {
  return JSON.stringify({
    source: [12, 34, 1.5],
    ...useSetupSettings.getState().input,
    seed: 0,
  });
}

describe("setup settings for the selected city", () => {
  it("retains edited inputs and the completed result when the same city mounts again", () => {
    const store = useSetupSettings.getState();
    store.initialize("case:harbor");
    store.update(edited);
    const completedFingerprint = fingerprint();
    store.complete(completedFingerprint, "concentration:first");

    useSetupSettings.getState().initialize("case:harbor");

    expect(useSetupSettings.getState()).toMatchObject({
      datasetId: "case:harbor",
      input: edited,
      completed: {
        fingerprint: completedFingerprint,
        resultId: "concentration:first",
      },
    });
  });

  it("uses defaults and clears the previous result when selecting another city", () => {
    const store = useSetupSettings.getState();
    store.initialize("case:harbor");
    store.update(edited);
    store.complete(fingerprint(), "concentration:first");

    store.initialize("case:other");

    expect(useSetupSettings.getState()).toMatchObject({
      datasetId: "case:other",
      input: defaults,
    });
    expect(useSetupSettings.getState().completed).toBeUndefined();
    store.update({ speed: 9 });
    store.initialize("case:harbor");
    expect(useSetupSettings.getState().input).toEqual(defaults);
    expect(useSetupSettings.getState().completed).toBeUndefined();
  });

  it("keeps the last successful fingerprint while editing and binds a new success to its result", () => {
    const store = useSetupSettings.getState();
    store.initialize("case:harbor");
    const originalFingerprint = fingerprint();
    store.complete(originalFingerprint, "concentration:first");

    store.update(edited);

    expect(fingerprint()).not.toBe(originalFingerprint);
    expect(useSetupSettings.getState().completed).toEqual({
      fingerprint: originalFingerprint,
      resultId: "concentration:first",
    });
    store.update(defaults);
    expect(fingerprint()).toBe(originalFingerprint);
    store.update(edited);
    const revisedFingerprint = fingerprint();
    store.complete(revisedFingerprint, "concentration:second");
    store.update({ speed: 8 });
    expect(useSetupSettings.getState().completed).toEqual({
      fingerprint: revisedFingerprint,
      resultId: "concentration:second",
    });
    expect(fingerprint()).not.toBe(revisedFingerprint);
  });
});
