import type { AudioProviderPort } from "@/domain/ports/audio-provider";
import type { IGui } from "@/domain/ports/plume-ui";

export class GuiAudioProvider implements AudioProviderPort {
  constructor(private readonly getGui: () => IGui) {}

  getAudioElement(): HTMLAudioElement {
    return this.getGui().getState().audioElement;
  }
}
