import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PHRASE_SIGN_GIFS,
  matchPhraseSignGif,
} from "@/lib/sign/phraseSignGifs";
import { applySignPreviewFromText } from "@/lib/sign/signPreviewHelpers";

const setSignPreview = vi.fn();

vi.mock("@/lib/state/sessionStore", () => ({
  useSessionStore: {
    getState: () => ({
      setSignPreview,
      signShowSpacesBetweenLetters: false,
    }),
  },
}));

describe("applySignPreviewFromText — phrase GIF mode", () => {
  beforeEach(() => {
    setSignPreview.mockClear();
  });

  for (const entry of PHRASE_SIGN_GIFS) {
    it(`sets phrase-gif preview for "${entry.phraseKey}"`, () => {
      applySignPreviewFromText(entry.phraseKey, "deaf");

      expect(setSignPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          phraseKey: entry.phraseKey,
          previewMode: "phrase-gif",
          phraseGifFile: entry.fileName,
          spellPlan: undefined,
        })
      );
    });

    it(`sets phrase-gif preview for first variant of "${entry.phraseKey}"`, () => {
      const variant = entry.variants[0];
      applySignPreviewFromText(variant, "deaf");

      expect(setSignPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          phraseKey: entry.phraseKey,
          previewMode: "phrase-gif",
          phraseGifFile: entry.fileName,
        })
      );
    });
  }

  it("does not finger-spell when phrase GIF matches", () => {
    applySignPreviewFromText("please repeat", "deaf");
    const call = setSignPreview.mock.calls.at(-1)?.[0];
    expect(call?.previewMode).toBe("phrase-gif");
    expect(call?.spellPlan).toBeUndefined();
  });

  it("falls back to 2D phrase widget for thank you (no GIF)", () => {
    applySignPreviewFromText("thank you", "deaf");
    expect(setSignPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        phraseKey: "thank you",
        previewMode: "sign",
        spellPlan: undefined,
      })
    );
    expect(matchPhraseSignGif("thank you")).toBeNull();
  });
});
