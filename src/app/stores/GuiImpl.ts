import { DefinedGui, Gui, GUI_ACTIONS, GuiAction, IGui } from "../../domain/ports/gui";
import { handleUnknownAction } from "./shared";

const INITIAL_STATE: Gui = {
  plumeContainer: null,
  headerLogo: null,
  audioElement: null,
  titleDisplay: null,
  progressSlider: null,
  elapsedDisplay: null,
  durationDisplay: null,
  playPauseBtns: [],
  trackFwdBtns: [],
  loopBtns: [],
  volumeSlider: null,
  muteBtn: null,
  fullscreenOverlay: null,
  hiddenBcTable: null,
};

const createGuiInstance = (): IGui => {
  let state = { ...INITIAL_STATE };

  const updateState = <GuiProp extends keyof Gui>(key: GuiProp, value: Gui[GuiProp]): void => {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };
  };

  const reducer = (action: GuiAction): void => {
    switch (action.type) {
      case GUI_ACTIONS.RESET_GUI_INSTANCE:
        updateState("plumeContainer", null);
        updateState("headerLogo", null);
        updateState("audioElement", null);
        updateState("titleDisplay", null);
        updateState("progressSlider", null);
        updateState("elapsedDisplay", null);
        updateState("durationDisplay", null);
        updateState("playPauseBtns", []);
        updateState("trackFwdBtns", []);
        updateState("loopBtns", []);
        updateState("volumeSlider", null);
        updateState("muteBtn", null);
        updateState("fullscreenOverlay", null);
        updateState("hiddenBcTable", null);
        break;
      case GUI_ACTIONS.SET_PLUME_CONTAINER:
        updateState("plumeContainer", action.payload);
        break;
      case GUI_ACTIONS.SET_HEADER_LOGO:
        updateState("headerLogo", action.payload);
        break;
      case GUI_ACTIONS.SET_AUDIO_ELEMENT:
        updateState("audioElement", action.payload);
        break;
      case GUI_ACTIONS.SET_TITLE_DISPLAY:
        updateState("titleDisplay", action.payload);
        break;
      case GUI_ACTIONS.SET_PROGRESS_SLIDER:
        updateState("progressSlider", action.payload);
        break;
      case GUI_ACTIONS.SET_ELAPSED_DISPLAY:
        updateState("elapsedDisplay", action.payload);
        break;
      case GUI_ACTIONS.SET_DURATION_DISPLAY:
        updateState("durationDisplay", action.payload);
        break;
      case GUI_ACTIONS.SET_PLAY_PAUSE_BTNS:
        updateState("playPauseBtns", action.payload);
        break;
      case GUI_ACTIONS.SET_TRACK_FWD_BTNS:
        updateState("trackFwdBtns", action.payload);
        break;
      case GUI_ACTIONS.SET_LOOP_BTNS:
        updateState("loopBtns", action.payload);
        break;
      case GUI_ACTIONS.SET_VOLUME_SLIDER:
        updateState("volumeSlider", action.payload);
        break;
      case GUI_ACTIONS.SET_MUTE_BTN:
        updateState("muteBtn", action.payload);
        break;
      case GUI_ACTIONS.SET_FULLSCREEN_OVERLAY:
        updateState("fullscreenOverlay", action.payload);
        break;
      case GUI_ACTIONS.SET_HIDDEN_BC_TABLE:
        updateState("hiddenBcTable", action.payload);
        break;
      default:
        action satisfies never; // Ensure declared all action types are handled
        handleUnknownAction(action);
    }
  };

  return {
    getState(): Readonly<DefinedGui> {
      return state as DefinedGui;
    },

    dispatch(action: GuiAction): void {
      reducer(action);
    },
  };
};

let guiInstance: IGui | null = null;
export const getGuiInstance = (): IGui => {
  guiInstance ??= createGuiInstance();
  return guiInstance;
};
