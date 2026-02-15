import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { getPlumeUiInstance, plumeActions } from "../../infra/AppInstanceImpl";
import { getStoreInstance, storeActions } from "../../infra/AppStoreImpl";
import { PLUME_SVG } from "../../svg/icons";
import { getString } from "../i18n";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export const syncMuteBtn = (isMuted: boolean): void => {
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();
  const newMuteBtn = plume.muteBtn;

  newMuteBtn.innerHTML = isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
  newMuteBtn.title = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  newMuteBtn.ariaLabel = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  newMuteBtn.ariaPressed = isMuted.toString();
  newMuteBtn.classList.toggle("muted", isMuted);
  plumeUi.dispatch(plumeActions.setMuteBtn(newMuteBtn));
};

export const handleMuteToggle = (): void => {
  const store = getStoreInstance();
  store.dispatch(storeActions.toggleMute());
};

export const createVolumeControlSection = async (): Promise<HTMLDivElement | null> => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();
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
  const currentVolume = store.getState().volume;
  volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();
  volumeSlider.ariaLabel = getString("ARIA__VOLUME_SLIDER");

  // Apply saved volume to audio element
  plume.audioElement.volume = currentVolume;

  plumeUi.dispatch(plumeActions.setAudioElement(plume.audioElement));

  const valueDisplay = document.createElement("div");
  valueDisplay.id = PLUME_ELEM_IDENTIFIERS.volumeValue.split("#")[1];
  valueDisplay.textContent = `${volumeSlider.value}${getString("META__PERCENTAGE")}`;

  muteBtn.addEventListener("click", handleMuteToggle);

  // Event listener for volume change via slider
  volumeSlider.addEventListener("input", function (this: HTMLInputElement) {
    const volume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;

    // Moving slider off zero counts as an intentional unmute
    if (volume > 0 && store.getState().isMuted) {
      store.dispatch(storeActions.setIsMuted(false));
    }

    // Dispatch to store only - subscription handles audio element and display updates
    store.dispatch(storeActions.setVolume(volume));
  });

  container.appendChild(muteBtn);
  container.appendChild(volumeSlider);
  container.appendChild(valueDisplay);

  plumeUi.dispatch(plumeActions.setVolumeSlider(volumeSlider));
  plumeUi.dispatch(plumeActions.setMuteBtn(muteBtn));

  return container;
};
