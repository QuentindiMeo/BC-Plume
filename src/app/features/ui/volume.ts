import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../../../domain/plume";
import { PLUME_SVG } from "../../../svg/icons";
import { coreActions, getAppCoreInstance } from "../../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../../stores/GuiImpl";
import { getString } from "../i18n";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export const syncMuteBtn = (isMuted: boolean): void => {
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();
  const newMuteBtn = plume.muteBtn;

  newMuteBtn.innerHTML = isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
  newMuteBtn.title = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  newMuteBtn.ariaLabel = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  newMuteBtn.ariaPressed = isMuted.toString();
  newMuteBtn.classList.toggle("muted", isMuted);
  plumeUi.dispatch(guiActions.setMuteBtn(newMuteBtn));
};

export const handleMuteToggle = (): void => {
  const appCore = getAppCoreInstance();
  appCore.dispatch(coreActions.toggleMute());
};

export const createVolumeControlSection = async (): Promise<HTMLDivElement | null> => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();

  if (plume.volumeSlider) return null;

  const container = document.createElement("div");
  container.id = PLUME_ELEM_IDENTIFIERS.volumeContainer.split("#")[1];

  const muteBtn = document.createElement("button");
  muteBtn.id = PLUME_ELEM_IDENTIFIERS.muteBtn.split("#")[1];
  muteBtn.type = "button";
  muteBtn.title = getString("ARIA__MUTE");
  muteBtn.ariaLabel = getString("ARIA__MUTE");
  muteBtn.ariaPressed = "false";
  muteBtn.innerHTML = PLUME_SVG.volumeOn;

  const volumeSlider = document.createElement("input");
  volumeSlider.id = PLUME_ELEM_IDENTIFIERS.volumeSlider.split("#")[1];
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = VOLUME_SLIDER_GRANULARITY.toString();
  const currentVolume = appCore.getState().volume;
  volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();
  volumeSlider.ariaLabel = getString("ARIA__VOLUME_SLIDER");

  // Apply saved volume to audio element
  plume.audioElement.volume = currentVolume;

  const valueDisplay = document.createElement("div");
  valueDisplay.id = PLUME_ELEM_IDENTIFIERS.volumeValue.split("#")[1];
  valueDisplay.textContent = `${volumeSlider.value}${getString("META__PERCENTAGE")}`;

  muteBtn.addEventListener("click", handleMuteToggle);

  // Event listener for volume change via slider
  volumeSlider.addEventListener("input", function (this: HTMLInputElement) {
    const volume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;

    // Moving slider off zero counts as an intentional unmute
    if (volume > 0 && appCore.getState().isMuted) {
      appCore.dispatch(coreActions.setIsMuted(false));
    }

    // Dispatch to store only - subscription updates the audio element and value display
    appCore.dispatch(coreActions.setVolume(volume));
  });

  container.appendChild(muteBtn);
  container.appendChild(volumeSlider);
  container.appendChild(valueDisplay);

  plumeUi.dispatch(guiActions.setVolumeSlider(volumeSlider));
  plumeUi.dispatch(guiActions.setMuteBtn(muteBtn));

  return container;
};
