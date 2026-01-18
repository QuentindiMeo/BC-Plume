// Plume - TypeScript for song page and album page display
const APP_NAME = "Plume - Bandcamp Player Enhancer";
const APP_VERSION = "v1.2.6";
const PLUME_KO_FI_URL = "https://ko-fi.com/quentindimeo";

interface BrowserAPI {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
  i18n: {
    getMessage: (key: string, substitutions?: any, options?: object) => string;
  };
}

enum BROWSER_TYPE {
  CHROMIUM = "Chromium",
  FIREFOX = "Firefox",
}
type BrowserType = `${BROWSER_TYPE}`; // Type alias for string literal types

enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`; // Type alias for string literal types

/**
 * Audio player enhancement handles
 */
interface PlumeCore {
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  durationDisplayMethod: TimeDisplayMethodType;
  volumeSlider: HTMLInputElement | null;
  savedVolume: number;
}
const PLUME_DEF: Pick<PlumeCore, "durationDisplayMethod" | "savedVolume"> = {
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  savedVolume: 0.5, // Default volume, 0..1
};
const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5, // seconds before track restarts on backward button click
};

enum PLUME_SVG {
  logo = `
    <svg
      version="1.1"
      id="logo_plume"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 557.6 299.3"
      author="Rebecca ȘES"
    >
      <style type="text/css">
        .st0 { fill-rule: evenodd; clip-rule: evenodd; fill: #20A0C3; }
        .st1 { fill: #20A0C3; }
        .st2 { fill: #20A0C3; stroke: #1FA0C3; stroke-width: 3; stroke-miterlimit: 7.2021; }
        .st3 { fill: #20A0C3; stroke: #1FA0C3; stroke-width: 0.5; stroke-miterlimit: 7.2021; }
      </style>
      <g>
        <g id="plume_p">
          <g id="plume_p_">
            <path
              vector-effect="non-scaling-stroke"
              class="st0"
              d="M31.4,178.7l5.8-12.6c12.5,0,18.7,5.4,18.7,16.2v3.8 c3.5-6.5,8-11.8,13.5-15.9s11.9-6.2,19.3-6.2c6.5,0,12.1,1.7,16.9,5c4.8,3.3,8.5,7.9,11.1,13.7c2.6,5.8,3.9,12.6,3.9,20.3 c0,8.9-1.3,17-3.9,24.2c-2.6,7.3-6.1,13.5-10.5,18.7c-4.4,5.2-9.4,9.2-14.9,12s-11.2,4.1-17.1,4.1c-5.8,0-11.1-1.4-16.1-4.3 c-5-2.9-8.9-6.4-11.6-10.6l-9.2,52.4H21l18.7-107.1c0.4-2,0.5-3.7,0.5-5C40.3,181.5,37.3,178.7,31.4,178.7z M52.1,214.1 l-3.2,18.2c2.6,4.8,6.1,8.5,10.3,11.2c4.2,2.6,8.7,4,13.5,4c5.6,0,10.8-1.8,15.6-5.5c4.7-3.7,8.6-8.7,11.4-15.2 c2.9-6.5,4.3-13.9,4.3-22.3c0-8.2-1.9-14.6-5.6-19.4c-3.7-4.7-8.6-7.1-14.6-7.1c-4.8,0-9.4,1.5-13.8,4.5s-8.1,7.2-11.3,12.6 C55.7,200.5,53.5,206.8,52.1,214.1z"
            />
          </g>
        </g>
        <g id="plume_feather">
          <g>
            <rect x="75.1" y="174.7" transform="matrix(0.1809 -0.9835 0.9835 0.1809 -41.9654 305.8548)" class="st2" width="175.1" height="6.8"/>
          </g>
          <g>
            <path
              class="st2"
              d="M184.8,199.9c-0.8,0-1.6-0.3-2.3-0.9c-1.4-1.3-1.5-3.4-0.2-4.8c6.3-6.9,7.8-15.8,8-22 c0.2-8.3-1.7-16.7-3.5-24.8l-7.4-33.1c-1.6-7.3-3.1-15.2-1.9-22.6c-16.8,17.6-25.1,42.6-21.9,67c0.2,1.9-1.1,3.6-2.9,3.8 c-1.9,0.2-3.6-1.1-3.8-2.9c-3.9-29,7.4-58.9,29.3-77.9c0.2-0.2,0.4-0.4,0.7-0.6c1.5-1.4,3.3-2.9,6.5-3.4c1.4-0.2,2.7,0.5,3.4,1.7 c0.7,1.2,0.5,2.7-0.4,3.8c-6.5,7.6-4.7,18.7-2.3,29.5l7.4,33.1c1.9,8.6,3.9,17.4,3.7,26.5c-0.2,7.4-2,17.9-9.7,26.4 C186.6,199.5,185.7,199.9,184.8,199.9z"
            />
          </g>
          <g>
            <path
              class="st3"
              d="M154,228.4c-0.1,0-0.2,0-0.3,0c-1.2-0.1-2.3-0.9-2.8-2L140,200.9c-0.7-1.7,0.1-3.7,1.8-4.4 c1.7-0.7,3.7,0.1,4.4,1.8l8.5,20c3.9-5.1,8.2-9.8,12.8-14.2c1.4-1.3,3.5-1.2,4.8,0.1c1.3,1.4,1.2,3.5-0.1,4.8 c-5.7,5.5-10.9,11.5-15.5,18C156.1,227.8,155.1,228.4,154,228.4z"
            />
          </g>
          <g>
            <path
              class="st3"
              d="M151.6,246.4c-0.1,0-0.2,0-0.3,0c-1.2-0.1-2.3-0.9-2.8-2l-10.9-25.4c-0.7-1.7,0.1-3.7,1.8-4.4 c1.7-0.7,3.7,0.1,4.4,1.8l8.5,20c3.9-5.1,8.2-9.8,12.8-14.2c1.4-1.3,3.5-1.2,4.8,0.1c1.3,1.4,1.2,3.5-0.1,4.8 c-5.7,5.5-10.9,11.5-15.5,18C153.8,245.9,152.7,246.4,151.6,246.4z"
            />
          </g>
        </g>
        <g id="plume_ume">
          <g id="plume_u">
            <path
              vector-effect="non-scaling-stroke"
              class="st0"
              d="M207.9,225.7l10.3-59.6h16.2l-10.4,59.2c-0.1,1.2-0.2,2.3-0.4,3.2 c-0.1,0.9-0.2,1.9-0.2,3c0,5.4,1.6,9.4,4.7,12.1c3.1,2.6,6.8,4,11,4c4.6,0,9-1.4,13.4-4.2c4.4-2.8,8.3-6.9,11.6-12.2 c3.4-5.3,5.7-11.6,7-19.1l8.1-45.9h16.2l-11.9,68.2c-0.1,0.6-0.2,1.3-0.3,2.1c-0.1,0.8-0.1,1.6-0.1,2.4c0,3.4,1,5.7,2.9,7.1 c1.9,1.4,4.4,2.1,7.6,2.1l-5.6,12.6c-6.5,0-11.4-1.6-14.9-4.8c-3.4-3.2-5.1-8.1-5.1-14.9v-1.6c-8.8,15-20.2,22.5-34.4,22.5 c-4.8,0-9.2-1.1-13.2-3.2c-4-2.2-7.2-5.2-9.6-9.1s-3.6-8.6-3.6-14c0-1.6,0.1-3.2,0.2-4.8C207.5,229.2,207.6,227.5,207.9,225.7z"
            />
            <path
              class="st1"
              d="M233.6,261.9c-4.8,0-9.2-1.1-13.2-3.2c-4-2.2-7.3-5.2-9.6-9.1c-2.4-3.9-3.6-8.6-3.6-14 c0-1.6,0.1-3.2,0.2-4.8c0.1-1.6,0.3-3.3,0.5-5.1v0l10.3-59.6h16.3l0,0l-10.4,59.2c-0.1,1.2-0.2,2.3-0.4,3.1 c-0.1,0.9-0.2,1.9-0.2,3c0,5.4,1.6,9.4,4.7,12c3.1,2.6,6.8,4,11,4c4.5,0,9-1.4,13.4-4.2c4.4-2.8,8.3-6.9,11.6-12.1 c3.3-5.3,5.7-11.7,7-19.1l8.1-45.9h16.3l0,0l-11.9,68.2c-0.1,0.6-0.2,1.3-0.3,2.1c-0.1,0.8-0.1,1.6-0.1,2.4c0,3.3,1,5.7,2.9,7.1 c1.9,1.4,4.4,2.1,7.5,2.1h0l0,0l-5.6,12.6h0c-3.2,0-6.1-0.4-8.6-1.2c-2.5-0.8-4.6-2-6.3-3.6c-1.7-1.6-3-3.6-3.9-6.1 c-0.9-2.5-1.3-5.4-1.3-8.8v-1.5c-4.4,7.4-9.4,13.1-15.1,16.8c-2.9,1.9-5.9,3.3-9.1,4.2S237.2,261.9,233.6,261.9z M207.9,225.7 c-0.2,1.8-0.4,3.5-0.5,5.1c-0.1,1.6-0.2,3.2-0.2,4.8c0,5.4,1.2,10.1,3.6,13.9c2.4,3.9,5.6,6.9,9.6,9.1s8.4,3.2,13.2,3.2 c14.1,0,25.7-7.6,34.4-22.5l0-0.1v1.7c0,6.7,1.7,11.7,5.1,14.8c3.4,3.2,8.4,4.8,14.8,4.8l5.6-12.6c-3.1,0-5.6-0.7-7.5-2.1 c-1.9-1.4-2.9-3.8-2.9-7.1c0-0.8,0-1.7,0.1-2.4c0.1-0.8,0.2-1.5,0.3-2.1l11.9-68.2h-16.2l-8.1,45.9c-1.3,7.4-3.7,13.8-7,19.1 c-3.3,5.3-7.3,9.4-11.6,12.2c-4.4,2.8-8.9,4.2-13.4,4.2c-4.2,0-7.9-1.3-11-4c-1.6-1.3-2.7-3-3.5-5c-0.8-2-1.2-4.4-1.2-7.1 c0-1.1,0.1-2.1,0.2-3c0.1-0.9,0.2-2,0.4-3.1l10.4-59.2h-16.2L207.9,225.7L207.9,225.7z"
            />
          </g>
          <g id="plume_m">
            <path
              vector-effect="non-scaling-stroke"
              class="st0"
              d="M393,221l-6.8,38.7h-16.2l10.3-56c0.6-2.9,1-5,1.1-6.4s0.2-2.7,0.2-3.9 c0-4.7-1.4-8.4-4.1-11.2c-2.7-2.8-6.2-4.1-10.5-4.1c-4.2,0-8.6,1.6-13.3,4.7s-8.9,8-12.8,14.5c-3.8,6.5-6.7,14.9-8.5,25.1 l-6.5,37.3h-16.2l16.4-93.6h15.7l-4,21.6c3.6-7.2,8.5-13,14.7-17.3s12.6-6.5,19.2-6.5c7.4,0,13.4,2.3,18,6.8s7.1,10.2,7.7,17 c4.1-7.4,9.1-13.3,15-17.5s12.4-6.3,19.4-6.3c8,0,14.4,2.5,19.2,7.5c4.7,5,7.1,11.1,7.1,18.3c0,3-0.4,6.8-1.1,11.3l-10.4,58.7 h-16.2l10.3-56c0.6-2.9,1-5,1.1-6.4c0.1-1.4,0.2-2.7,0.2-3.9c0-4.7-1.4-8.4-4.1-11.2s-6.2-4.1-10.5-4.1c-4,0-8.3,1.5-13,4.5 c-4.7,3-8.9,7.7-12.8,14C397.6,202.9,394.8,211.1,393,221z"
            />
            <path
              class="st1"
              d="M446.5,259.8h-16.3l0,0l10.3-56c0.6-2.9,1-5,1.1-6.4c0.1-1.4,0.2-2.7,0.2-3.9c0-4.7-1.4-8.4-4-11.1 s-6.2-4.1-10.5-4.1c-3.9,0-8.3,1.5-13,4.5c-4.7,3-9,7.7-12.8,13.9c-3.8,6.3-6.7,14.5-8.5,24.4l-6.8,38.7h-16.3l0,0l10.3-56 c0.6-2.9,1-5,1.1-6.4c0.1-1.4,0.2-2.7,0.2-3.9c0-4.7-1.4-8.4-4-11.1c-2.7-2.7-6.2-4.1-10.5-4.1c-4.2,0-8.7,1.6-13.3,4.7 c-4.7,3.1-9,8-12.8,14.5c-3.8,6.5-6.7,15-8.5,25.1l-6.5,37.3h-16.3l0,0l16.4-93.6h15.7l0,0l-3.9,21.4c1.8-3.5,3.9-6.7,6.3-9.6 c2.4-2.9,5.2-5.4,8.3-7.6c3.1-2.2,6.3-3.8,9.4-4.9s6.5-1.6,9.8-1.6c3.7,0,7.1,0.6,10.1,1.7c3,1.1,5.7,2.8,7.9,5.1 c2.3,2.2,4.1,4.8,5.4,7.6c1.3,2.8,2.1,5.9,2.4,9.3c4.1-7.4,9.1-13.2,15-17.4c3-2.1,6.1-3.7,9.3-4.7c3.2-1,6.6-1.6,10.1-1.6 c4,0,7.7,0.6,10.8,1.9c3.2,1.2,6,3.1,8.4,5.6c2.4,2.5,4.2,5.3,5.3,8.3c1.2,3,1.8,6.4,1.8,10c0,3-0.4,6.8-1.1,11.3L446.5,259.8z M430.3,259.7h16.2l10.4-58.7c0.7-4.5,1.1-8.4,1.1-11.3c0-7.2-2.4-13.3-7.1-18.3c-4.7-5-11.2-7.5-19.2-7.5 c-6.9,0-13.4,2.1-19.3,6.3c-5.9,4.2-11,10.1-15,17.5l0,0.1l0-0.1c-0.6-6.8-3.2-12.5-7.7-17c-4.5-4.5-10.6-6.7-18-6.7 c-6.6,0-13,2.2-19.2,6.5c-6.1,4.3-11.1,10.1-14.7,17.3l-0.1,0.2l0-0.2l4-21.6H326l-16.4,93.6h16.2l6.5-37.2 c1.8-10.2,4.6-18.6,8.5-25.1c3.8-6.5,8.1-11.4,12.8-14.5c4.7-3.1,9.2-4.7,13.3-4.7c4.3,0,7.9,1.4,10.6,4.1 c2.7,2.8,4.1,6.5,4.1,11.2c0,1.2-0.1,2.5-0.2,3.9c-0.1,1.4-0.5,3.5-1.1,6.4l-10.3,56h16.2L393,221c1.8-9.9,4.6-18.1,8.5-24.4 s8.1-11,12.8-14c4.7-3,9-4.5,13-4.5c4.3,0,7.9,1.4,10.6,4.1c2.7,2.8,4.1,6.5,4.1,11.2c0,1.2-0.1,2.5-0.2,3.9 c-0.1,1.4-0.5,3.5-1.1,6.4L430.3,259.7z"
            />
          </g>
          <g id="plume_e">
            <path
              vector-effect="non-scaling-stroke"
              class="st0"
              d="M544.9,240.5l1.4,14.4c-3.6,1.7-8.2,3.3-13.7,4.8 c-5.5,1.5-11.6,2.3-18.4,2.3c-7.9,0-14.9-1.7-21-5.1s-10.8-8.3-14.2-14.8c-3.4-6.4-5.1-14-5.1-22.8c0-10,2.1-19.1,6.2-27.5 c4.1-8.4,10-15.1,17.6-20.2c7.6-5,16.5-7.6,26.7-7.6c7,0,12.9,1.3,17.7,4c4.9,2.6,8.6,6.1,11.3,10.3c2.6,4.2,4,8.7,4,13.5 c0,6.6-1.6,12.1-4.7,16.4c-3.1,4.3-7.1,7.7-12.1,10c-4.9,2.3-10.2,4-15.9,5c-5.7,1-11.1,1.4-16.3,1.4c-3.2,0-6.5-0.2-9.6-0.5 c-3.2-0.3-6-0.6-8.4-1c1,7.9,3.8,14,8.5,18.2c4.7,4.2,10.7,6.3,18,6.3c6,0,11.3-0.8,16-2.3S541.7,242,544.9,240.5z M523.3,177.6 c-5.6,0-10.7,1.4-15.3,4.2c-4.6,2.8-8.3,6.7-11.3,11.5s-4.9,10.4-5.9,16.7c2.8,0.5,5.6,0.9,8.4,1.2c2.8,0.3,5.9,0.5,9.3,0.5 c10.1,0,18.1-1.4,23.9-4.2c5.9-2.8,8.8-7.7,8.8-14.5c0-4.2-1.7-7.8-5-10.8C533.1,179.1,528.7,177.6,523.3,177.6z"
            />
            <path class="st1"
              d="M514.3,261.9c-3.9,0-7.7-0.4-11.2-1.3c-3.5-0.9-6.8-2.1-9.8-3.9c-3-1.7-5.7-3.8-8.1-6.3 c-2.4-2.5-4.4-5.3-6.1-8.5c-1.7-3.2-3-6.7-3.9-10.5c-0.9-3.8-1.3-7.9-1.3-12.3c0-5,0.5-9.8,1.6-14.4c1-4.6,2.6-9,4.7-13.2 c2.1-4.2,4.6-8,7.5-11.3c2.9-3.3,6.3-6.3,10.1-8.8s8-4.4,12.4-5.7c4.4-1.3,9.3-1.9,14.3-1.9c6.9,0,12.9,1.3,17.7,4 c4.8,2.6,8.6,6.1,11.3,10.3c2.6,4.2,4,8.7,4,13.5c0,6.6-1.6,12.1-4.7,16.4c-3.1,4.3-7.2,7.7-12.1,10c-4.9,2.3-10.3,4-15.9,5 c-5.7,1-11.2,1.4-16.3,1.4c-3.2,0-6.5-0.2-9.6-0.5c-3.1-0.3-5.9-0.6-8.3-1c1,7.9,3.8,14,8.5,18.1c4.7,4.2,10.7,6.3,18,6.3 c6,0,11.4-0.8,16-2.3c4.7-1.6,8.7-3.1,11.9-4.7l0,0l0,0l1.4,14.4l0,0c-3.6,1.7-8.2,3.3-13.7,4.8 C527.2,261.2,521,261.9,514.3,261.9z M524.6,164c-10.2,0-19.1,2.5-26.7,7.6c-7.6,5-13.5,11.8-17.6,20.2s-6.2,17.6-6.2,27.5 c0,8.7,1.7,16.4,5.1,22.8c3.4,6.4,8.2,11.4,14.2,14.8c6,3.4,13.1,5.1,21,5.1c6.7,0,12.9-0.8,18.4-2.2c5.5-1.5,10.1-3.1,13.7-4.8 l-1.4-14.4c-3.2,1.5-7.2,3.1-11.9,4.7c-4.7,1.6-10.1,2.3-16,2.3c-3.6,0-7-0.5-10-1.6c-3-1-5.7-2.6-8-4.7 c-2.3-2.1-4.2-4.7-5.6-7.7c-1.4-3-2.4-6.5-2.8-10.5l0,0l0,0c2.4,0.4,5.2,0.7,8.4,1c3.2,0.3,6.4,0.5,9.6,0.5 c5.1,0,10.6-0.5,16.3-1.4s11-2.6,15.9-4.9c4.9-2.3,8.9-5.7,12.1-10c3.1-4.3,4.7-9.8,4.7-16.4c0-4.8-1.3-9.3-4-13.5 c-2.6-4.2-6.4-7.6-11.2-10.3C537.5,165.3,531.5,164,524.6,164z M508.6,211.7c-3.3,0-6.5-0.2-9.3-0.5c-2.8-0.3-5.6-0.7-8.4-1.2 l0,0l0,0c1-6.2,2.9-11.8,5.9-16.7s6.7-8.7,11.3-11.5c4.5-2.8,9.7-4.2,15.3-4.2c5.4,0,9.8,1.5,13.1,4.5c3.3,3,5,6.6,5,10.8 c0,3.4-0.7,6.4-2.2,8.8c-1.5,2.4-3.7,4.3-6.6,5.7C526.7,210.3,518.6,211.7,508.6,211.7z M491,210c2.7,0.5,5.5,0.9,8.3,1.2 c2.8,0.3,5.9,0.5,9.3,0.5c10,0,18.1-1.4,23.9-4.2c5.8-2.8,8.8-7.7,8.8-14.5c0-4.2-1.7-7.8-4.9-10.8c-3.3-3-7.7-4.5-13-4.5 c-5.6,0-10.8,1.4-15.3,4.2c-4.5,2.8-8.3,6.7-11.2,11.5C493.9,198.2,491.9,203.8,491,210z"
            />
          </g>
        </g>
      </g>
    </svg>
  `,
  trackBackward = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7H5V17H2V7Z" fill="currentColor" />
      <path d="M6 12L13.0023 7.00003V17L6 12Z" fill="currentColor" />
      <path d="M21.0023 7.00003L14 12L21.0023 17V7.00003Z" fill="currentColor" />
    </svg>
  `,
  timeBackward = `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
      <path d="M136,80v43.38116l37.56934,21.69062a8,8,0,1,1-8,13.85644l-41.56934-24c-.064-.03692-.12109-.0805-.18359-.11889-.13575-.08362-.271-.16779-.40088-.2591-.10352-.07232-.20215-.14892-.30127-.22534-.10205-.0788-.20362-.15765-.30127-.24115-.11182-.09479-.21778-.19342-.32276-.29333-.0791-.07532-.15771-.15064-.23388-.22913-.10694-.11017-.2085-.22351-.30811-.339-.06933-.08026-.13769-.16083-.2041-.24377-.0918-.1156-.1792-.23352-.26416-.35352-.06738-.09473-.1333-.19019-.19629-.2879-.07226-.11194-.14062-.22547-.207-.34058-.06592-.11438-.12988-.22986-.19043-.34778-.05322-.10418-.10352-.20941-.15185-.31561-.061-.13287-.11915-.26685-.17334-.4035-.03907-.09986-.0752-.20063-.11036-.30194-.0498-.14252-.09668-.28589-.13818-.432-.03027-.10687-.05664-.21454-.083-.32257-.0332-.13928-.06543-.27881-.09131-.42084-.02392-.12842-.0415-.25757-.05908-.38714-.0166-.12226-.0332-.244-.04394-.368-.01416-.16015-.01953-.3208-.02442-.48187C120.00879,128.14313,120,128.07269,120,128V80a8,8,0,0,1,16,0Zm59.88184-19.88232a96.10782,96.10782,0,0,0-135.76416,0L51.833,68.4021l-14.34278-14.343A7.99981,7.99981,0,0,0,23.8335,59.71582v40a7.99977,7.99977,0,0,0,8,8h40a7.99981,7.99981,0,0,0,5.65673-13.65674L63.147,79.71576l8.28467-8.28461a80.00025,80.00025,0,1,1,0,113.13721,8.00035,8.00035,0,0,0-11.314,11.31445A96.0001,96.0001,0,0,0,195.88184,60.11768Z"/>
    </svg>
  `,
  playPlay = `
    <svg width="100%" height="100%" viewBox="-1 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" fill="currentColor" />
    </svg>
  `,
  playPause = `
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 7H8V17H11V7Z" fill="currentColor" />
      <path d="M13 17H16V7H13V17Z" fill="currentColor" />
    </svg>
  `,
  timeForward = `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
      <path d="M136,80v43.38116l37.56934,21.69062a8,8,0,1,1-8,13.85644l-41.56934-24c-.064-.03692-.12109-.0805-.18359-.11889-.13575-.08362-.271-.16779-.40088-.2591-.10352-.07232-.20215-.14892-.30127-.22534-.10205-.0788-.20362-.15765-.30127-.24115-.11182-.09479-.21778-.19342-.32276-.29333-.0791-.07532-.15771-.15064-.23388-.22913-.10694-.11017-.2085-.22351-.30811-.339-.06933-.08026-.13769-.16083-.2041-.24377-.0918-.1156-.1792-.23352-.26416-.35352-.06738-.09473-.1333-.19019-.19629-.2879-.07226-.11194-.14062-.22547-.207-.34058-.06592-.11438-.12988-.22986-.19043-.34778-.05322-.10418-.10352-.20941-.15186-.31561-.061-.13287-.11914-.26685-.17333-.4035-.03907-.09986-.0752-.20063-.11036-.30194-.0498-.14252-.09668-.28589-.13818-.432-.03027-.10687-.05664-.21454-.083-.32257-.0332-.13928-.06543-.27881-.09131-.42084-.02392-.12842-.0415-.25757-.05908-.38714-.0166-.12226-.0332-.244-.04394-.368-.01416-.16015-.01954-.3208-.02442-.48187C120.00879,128.14313,120,128.07269,120,128V80a8,8,0,0,1,16,0Zm91.228-27.67529a7.99962,7.99962,0,0,0-8.71826,1.73437L204.1665,68.40222l-8.28466-8.28454a95.9551,95.9551,0,1,0,0,135.76464,7.99983,7.99983,0,1,0-11.31348-11.31347,80.00009,80.00009,0,1,1,0-113.1377l8.28467,8.28467L178.50977,94.05908a7.99981,7.99981,0,0,0,5.65673,13.65674h40a7.99977,7.99977,0,0,0,8-8v-40A8.00014,8.00014,0,0,0,227.228,52.32471Z"/>
    </svg>
  `,
  trackForward = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.0023 17H18.0023V7H21.0023V17Z" fill="currentColor" />
      <path d="M17.0023 12L10 17V7L17.0023 12Z" fill="currentColor" />
      <path d="M2 17L9.00232 12L2 7V17Z" fill="currentColor" />
    </svg>
  `,
  fullscreen = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 14H5V19H10V17H7V14Z" fill="currentColor" />
      <path d="M5 10H7V7H10V5H5V10Z" fill="currentColor" />
      <path d="M17 17H14V19H19V14H17V17Z" fill="currentColor" />
      <path d="M14 5V7H17V10H19V5H14Z" fill="currentColor" />
    </svg>
  `,
  fullscreenExit = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 16H8V19H10V14H5V16Z" fill="currentColor" />
      <path d="M8 8H5V10H10V5H8V8Z" fill="currentColor" />
      <path d="M14 19H16V16H19V14H14V19Z" fill="currentColor" />
      <path d="M16 8V5H14V10H19V8H16Z" fill="currentColor" />
    </svg>
  `,
}

/**
 * Cache interface
 */
enum PLUME_CACHE_KEYS {
  DURATION_DISPLAY_METHOD = "plume_duration_display_method",
  VOLUME = "plume_volume",
}
interface LocalStorage {
  [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: TimeDisplayMethodType | undefined;
  [PLUME_CACHE_KEYS.VOLUME]: number | undefined;
}

/**
 * Debug control information
 */
interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

enum PLUME_ELEM_IDENTIFIERS {
  bcElements = "div.bpe-hidden-original",
  plumeContainer = "div#bpe-plume",
  headerContainer = "div#bpe-header-container",
  headerLogo = "a#bpe-header-logo",
  headerCurrent = "div#bpe-header-current",
  headerTitlePretext = "span#bpe-header-title-pretext",
  headerTitle = "span#bpe-header-title",
  playbackManager = "div#bpe-playback-manager",
  playbackControls = "div#bpe-playback-controls",
  progressContainer = "div#bpe-progress-container",
  progressSlider = "input#bpe-progress-slider",
  timeDisplay = "div#bpe-time-display",
  elapsedDisplay = "span#bpe-elapsed-display",
  durationDisplay = "span#bpe-duration-display",
  trackBwdBtn = "button#bpe-track-bwd-btn",
  timeBwdBtn = "button#bpe-time-bwd-btn",
  playPauseBtn = "button#bpe-play-pause-btn",
  timeFwdBtn = "button#bpe-time-fwd-btn",
  trackFwdBtn = "button#bpe-track-fwd-btn",
  fullscreenBtn = "button#bpe-fullscreen-btn",
  fullscreenBtnLabel = "span#bpe-fullscreen-btn-label",
  volumeContainer = "div#bpe-volume-container",
  volumeLabel = "label#bpe-volume-label",
  volumeSlider = "input#bpe-volume-slider",
  volumeValue = "div#bpe-volume-value",
  fullscreenBtnContainer = "div#bpe-fullscreen-btn-container",
  fullscreenOverlay = "div#bpe-fullscreen-overlay",
  fullscreenBackground = "div#bpe-fullscreen-background",
  fullscreenContent = "div#bpe-fullscreen-content",
  fullscreenExitBtn = "button#bpe-fullscreen-exit-btn",
  fullscreenCoverArtContainer = "div#bpe-fullscreen-cover-art",
  fullscreenClone = "div#bpe-fullscreen-clone",
}

enum BC_ELEM_IDENTIFIERS {
  playerParent = "div.inline_player",
  inlinePlayerTable = "div.inline_player>table",
  audioPlayer = "audio",
  playPause = "div.playbutton",
  songPageCurrentTrackTitle = "h2.trackTitle",
  albumPageCurrentTrackTitle = "a.title_link",
  previousTrack = "div.prevbutton",
  nextTrack = "div.nextbutton",
  nameSection = "div#name-section",
  trackList = "table#track_table",
  trackRow = "tr.track_row_view",
  trackTitle = "span.track-title",
  coverArt = "div#tralbumArt img"
}

// Customized console logger with timestamp and level
enum CPL { // Console Printing Level
  DEBUG = "debug",
  INFO = "info",
  LOG = "log",
  WARN = "warn",
  ERROR = "error",
}
type CPLType = `${CPL}`;
const ConsolePrintingPrefix: Record<CPLType, string> = {
  [CPL.DEBUG]: "DEBUG",
  [CPL.INFO]: "INFO.",
  [CPL.LOG]: "LOG..",
  [CPL.WARN]: "WARN?",
  [CPL.ERROR]: "ERR?!",
};
const logger = (method: CPLType, ...toPrint: any[]) => {
  const now = new Date();
  const nowTime = now.toLocaleTimeString();
  const nowMilliseconds = now.getMilliseconds().toString().padStart(3, "0");
  console[method](`[Plume_${APP_VERSION} ${ConsolePrintingPrefix[method]} | ${nowTime}.${nowMilliseconds}]`, ...toPrint);
};

// Browser detection and compatible storage API
const chromeApi = (globalThis as any).chrome;
const firefoxApi = (globalThis as any).browser;
const browserApi: BrowserAPI = (() => {
  if (chromeApi !== undefined && chromeApi.storage) {
    return chromeApi;
  } else if (firefoxApi !== undefined && firefoxApi.storage) {
    return firefoxApi;
  } else {
    logger(CPL.WARN, (globalThis as any).chrome.i18n.getMessage("WARN__BROWSER_API__NOT_DETECTED"));
    return (globalThis as any).chrome; // Assume Chromium-based as fallback
  }
})();
const browserCache = browserApi.storage.local;
if (!browserApi.i18n.getMessage) {
  // Fallback for browsers without i18n support (safety net for if browser detection failed)
  browserApi.i18n.getMessage = (key: string, _?: any[]) => key;
}
const getString = browserApi.i18n.getMessage;
logger(CPL.INFO, getString("INFO__BROWSER__DETECTED"), chromeApi === undefined ? "Firefox-based" : "Chromium-based");
const browserCacheExists = browserCache !== undefined;

(() => {
  "use strict";

  const isAlbumPage = globalThis.location.pathname.includes("/album/");

  // Function to initialize playback (necessary to make Plume buttons effective)
  const initPlayback = () => {
    const playButton = document.querySelector(BC_ELEM_IDENTIFIERS.playPause) as HTMLButtonElement;
    if (playButton) {
      // Double-click to ensure playback has started
      playButton.click();
      playButton.click();
    } else {
      logger(CPL.WARN, getString("WARN__PLAY_PAUSE__NOT_FOUND"));
    }
  };

  const loadSavedVolume = (): Promise<number> => {
    return new Promise((resolve) => {
      if (browserCacheExists) {
        browserCache.get([PLUME_CACHE_KEYS.VOLUME]).then((ls: LocalStorage) => {
          const volume = ls[PLUME_CACHE_KEYS.VOLUME] || PLUME_DEF.savedVolume;
          plume.savedVolume = volume;
          resolve(volume);
        });
      } else {
        // Fallback with localStorage
        try {
          const storedVolume = localStorage.getItem(PLUME_CACHE_KEYS.VOLUME);
          const volume = storedVolume ? Number.parseFloat(storedVolume) : 1;
          plume.savedVolume = volume;
          resolve(volume);
        } catch (e) {
          logger(CPL.WARN, getString("WARN__VOLUME__NOT_LOADED"), e);
          plume.savedVolume = 1;
          resolve(1);
        }
      }
    });
  };

  // Function to find the audio element
  const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
    const audio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
    if (!audio) return null;
    logger(CPL.INFO, getString("INFO__AUDIO__FOUND"), audio);

    // Load and immediately apply saved volume
    await loadSavedVolume();
    audio.volume = plume.savedVolume;
    logger(
      CPL.INFO,
      `${getString("INFO__VOLUME__FOUND")} ${Math.round(plume.savedVolume * 100)}${getString("META__PERCENTAGE")}`
    );

    return audio;
  };

  // Debug function to identify Bandcamp controls
  const debugBandcampControls = (): Array<DebugControl> => {
    logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__DETECTED"));

    // Find all possible buttons and links
    const buttonIdentifiers = 'button, a, div[role="button"], span[onclick]';
    const allButtons = document.querySelectorAll(buttonIdentifiers) as unknown as Array<HTMLButtonElement>;
    const relevantControls: Array<DebugControl> = [];

    allButtons.forEach((element, index) => {
      const classes = element.className || "";
      const title = element.title || "";
      const text = element.textContent || "";
      const onclick = element.onclick || "";

      // Filter elements that could be controls
      if (
        classes.includes("play") ||
        classes.includes("pause") ||
        classes.includes("next") ||
        classes.includes("prev") ||
        classes.includes("skip") ||
        classes.includes("control") ||
        title.toLowerCase().includes("play") ||
        title.toLowerCase().includes("next") ||
        title.toLowerCase().includes("prev") ||
        title.toLowerCase().includes("skip")
      ) {
        relevantControls.push({
          index,
          tagName: element.tagName,
          classes,
          title,
          text: text.trim().substring(0, 20),
          onclick: onclick.toString().substring(0, 50),
        });
      }
    });

    logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__FOUND"), relevantControls);
    logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__END"));

    return relevantControls;
  };

  const setupFullscreenControlSync = (original: HTMLDivElement, clone: HTMLDivElement) => {
    const cloneHeaderContainer = clone.querySelector(PLUME_ELEM_IDENTIFIERS.headerContainer) as HTMLDivElement;
    const headerContainerObserver = new MutationObserver(() => {
      cloneHeaderContainer.innerHTML = plume.titleDisplay!.innerHTML;
    });
    headerContainerObserver.observe(plume.titleDisplay!, { childList: true, subtree: true });

    const cloneProgressSlider = clone.querySelector(PLUME_ELEM_IDENTIFIERS.progressSlider) as HTMLInputElement;
    const progressSliderObserver = new MutationObserver(() => {
      cloneProgressSlider.value = plume.progressSlider!.value;
      cloneProgressSlider.style.backgroundImage = plume.progressSlider!.style.backgroundImage;
    });
    progressSliderObserver.observe(plume.progressSlider!, { attributes: true, attributeFilter: ['value', 'style'] });
    cloneProgressSlider.addEventListener("input", function(this: HTMLInputElement) {
      const originalSlider = original.querySelector(PLUME_ELEM_IDENTIFIERS.progressSlider) as HTMLInputElement;
      originalSlider.value = this.value;
      originalSlider.dispatchEvent(new Event("input"));

      const elapsed = plume.audioElement!.currentTime;
      const duration = plume.audioElement!.duration;

      if (!Number.isNaN(duration) && duration > 0) {
        const percent = (elapsed / duration) * 100;
        const bgPercent = percent < 50 ? (percent + 1) : (percent - 1); // or else it under/overflows
        const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
        cloneProgressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
        cloneProgressSlider.style.backgroundImage = bgImg;
      }
    });

    const cloneElapsedDisplay = clone.querySelector(PLUME_ELEM_IDENTIFIERS.elapsedDisplay) as HTMLSpanElement;
    const elapsedObserver = new MutationObserver(() => {
      cloneElapsedDisplay.textContent = plume.elapsedDisplay!.textContent;
    });
    elapsedObserver.observe(plume.elapsedDisplay!, { childList: true, subtree: true });

    const cloneDurationDisplay = clone.querySelector(PLUME_ELEM_IDENTIFIERS.durationDisplay) as HTMLSpanElement;
    const durationObserver = new MutationObserver(() => {
      cloneDurationDisplay.textContent = plume.durationDisplay!.textContent;
    });
    durationObserver.observe(plume.durationDisplay!, { childList: true, subtree: true });
    cloneDurationDisplay.addEventListener("click", handleDurationChange);

    const cloneTrackBackwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.trackBwdBtn) as HTMLButtonElement;
    cloneTrackBackwardBtn.addEventListener("click", handleTrackBackward);

    const cloneTimeBackwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.timeBwdBtn) as HTMLButtonElement;
    cloneTimeBackwardBtn.addEventListener("click", handleTimeBackward);

    const originalPlayPauseBtn = original.querySelector(PLUME_ELEM_IDENTIFIERS.playPauseBtn) as HTMLButtonElement;
    const clonePlayPauseBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.playPauseBtn) as HTMLButtonElement;
    clonePlayPauseBtn.addEventListener("click", () => {
      handlePlayPause([clonePlayPauseBtn, originalPlayPauseBtn]);
    });

    const cloneTimeForwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.timeFwdBtn) as HTMLButtonElement;
    cloneTimeForwardBtn.addEventListener("click", handleTimeForward);

    const cloneTrackForwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.trackFwdBtn) as HTMLButtonElement;
    cloneTrackForwardBtn.addEventListener("click", handleTrackForward);

    const cloneVolumeSlider = clone.querySelector(PLUME_ELEM_IDENTIFIERS.volumeSlider) as HTMLInputElement;
    cloneVolumeSlider.addEventListener("input", function(this: HTMLInputElement) {
      const newVolume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;
      plume.audioElement!.volume = newVolume;
      saveNewVolume(newVolume);

      // Update the volume display in fullscreen
      const cloneVolumeDisplay = clone.querySelector(PLUME_ELEM_IDENTIFIERS.volumeValue) as HTMLDivElement;
      cloneVolumeDisplay.textContent = `${this.value}${getString("META__PERCENTAGE")}`;
    });

    // Return cleanup function to disconnect all observers
    return () => {
      headerContainerObserver.disconnect();
      progressSliderObserver.disconnect();
      elapsedObserver.disconnect();
      durationObserver.disconnect();
    };
  };

  const fullscreenBtnId = PLUME_ELEM_IDENTIFIERS.fullscreenBtnLabel.split("#")[1];
  const fullscreenBtnLabel = getString("LABEL__FULLSCREEN_TOGGLE");
  let fullscreenCleanupCallback: (() => void) | null = null;
  const toggleFullscreenMode = () => {
    const existingOverlay = document.querySelector(PLUME_ELEM_IDENTIFIERS.fullscreenOverlay) as HTMLDivElement;

    if (existingOverlay) {
      existingOverlay.remove();
      document.body.style.overflow = "auto";

      // Cleanup observers
      fullscreenCleanupCallback?.();
      fullscreenCleanupCallback = null;

      logger(CPL.INFO, getString("INFO__FULLSCREEN__EXITED"));
      return;
    }

    // Enter fullscreen
    const coverArt = document.querySelector(BC_ELEM_IDENTIFIERS.coverArt) as HTMLImageElement;
    if (!coverArt) {
      logger(CPL.WARN, getString("WARN__COVER_ART__NOT_FOUND"));
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = PLUME_ELEM_IDENTIFIERS.fullscreenOverlay.split("#")[1];

    // Create background with cover art (blurred and dimmed)
    const background = document.createElement("div");
    background.id = PLUME_ELEM_IDENTIFIERS.fullscreenBackground.split("#")[1];
    const coverArtUrl = encodeURI(coverArt.src);
    background.style.backgroundImage = `url("${coverArtUrl}")`;
    overlay.appendChild(background);

    const contentContainer = document.createElement("div");
    contentContainer.id = PLUME_ELEM_IDENTIFIERS.fullscreenContent.split("#")[1];

    const coverArtContainer = document.createElement("div");
    coverArtContainer.id = PLUME_ELEM_IDENTIFIERS.fullscreenCoverArtContainer.split("#")[1];
    const coverArtImg = document.createElement("img");
    coverArtImg.src = coverArt.src;
    coverArtImg.alt = getString("ARIA__COVER_ART");
    coverArtContainer.appendChild(coverArtImg);
    contentContainer.appendChild(coverArtContainer);

    // Clone the plume module (right side)
    const plumeContainer = document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer) as HTMLDivElement;
    const plumeClone = plumeContainer.cloneNode(true) as HTMLDivElement;
    plumeClone.id = PLUME_ELEM_IDENTIFIERS.fullscreenClone.split("#")[1];

    const fullscreenLogo = document.createElement("a");
    fullscreenLogo.id = PLUME_ELEM_IDENTIFIERS.headerLogo.split("#")[1];
    fullscreenLogo.innerHTML = PLUME_SVG.logo + `<p id="${fullscreenLogo.id}--version">${APP_VERSION}</p>`;
    fullscreenLogo.href = PLUME_KO_FI_URL;
    fullscreenLogo.target = "_blank";
    fullscreenLogo.rel = "noopener noreferrer";
    fullscreenLogo.ariaLabel = APP_NAME;
    fullscreenLogo.title = getString("ARIA__LOGO_LINK");
    plumeClone.insertBefore(fullscreenLogo, plumeClone.firstChild);

    // Hide the fullscreen button section in the cloned module
    const clonedFullscreenBtn = plumeClone.querySelector(PLUME_ELEM_IDENTIFIERS.fullscreenBtnContainer) as HTMLButtonElement;
    clonedFullscreenBtn.style.display = "none";

    contentContainer.appendChild(plumeClone);
    overlay.appendChild(contentContainer);

    // Create exit fullscreen button in top right corner
    const exitBtn = document.createElement("button");
    exitBtn.id = PLUME_ELEM_IDENTIFIERS.fullscreenExitBtn.split("#")[1];
    exitBtn.innerHTML = PLUME_SVG.fullscreenExit;
    exitBtn.title = getString("ARIA__EXIT_FULLSCREEN_BTN");
    exitBtn.addEventListener("click", () => {
      toggleFullscreenMode();
    });
    overlay.appendChild(exitBtn);

    const setupFullscreenFocusTrap = () => {
      const getFocusableElements = () => {
        return Array.from(overlay.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
      };

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (event.shiftKey) {
          if (document.activeElement === firstFocusable || currentIndex === -1) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else if (document.activeElement === lastFocusable || currentIndex === -1) {
          event.preventDefault();
          firstFocusable.focus();
        }
      };

      overlay.addEventListener("keydown", handleTabKey);

      setTimeout(() => {
        const initialFocusable = getFocusableElements()[0];
        initialFocusable?.focus();
      }, 0); // Somehow needs timeout to function right
    };

    overlay.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape") toggleFullscreenMode();
    });

    // Sync all controls with the original plume module
    fullscreenCleanupCallback = setupFullscreenControlSync(plumeContainer, plumeClone);

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    setupFullscreenFocusTrap();

    logger(CPL.INFO, getString("INFO__FULLSCREEN__ENTERED"));
  };

  const createFullscreenBtnContainer = (): HTMLDivElement => {
    const fullscreenBtn: HTMLButtonElement = document.createElement("button");
    fullscreenBtn.id = PLUME_ELEM_IDENTIFIERS.fullscreenBtn.split("#")[1];
    fullscreenBtn.innerHTML = `<span id="${fullscreenBtnId}">${fullscreenBtnLabel}</span>${PLUME_SVG.fullscreen}`;
    fullscreenBtn.ariaLabel = fullscreenBtnLabel;
    fullscreenBtn.addEventListener("click", () => {
      toggleFullscreenMode();
    });
    const container: HTMLDivElement = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.fullscreenBtnContainer.split("#")[1];
    container.appendChild(fullscreenBtn);
    return container;
  };

  // Function to save the new volume from the slider to browser cache
  const saveNewVolume = (newVolume: number) => {
    plume.savedVolume = newVolume;

    if (browserCacheExists) {
      browserCache.set({ [PLUME_CACHE_KEYS.VOLUME]: newVolume });
    } else {
      // Fallback with localStorage
      try {
        localStorage.setItem(PLUME_CACHE_KEYS.VOLUME, newVolume.toString());
      } catch (e) {
        logger(CPL.WARN, getString("WARN__VOLUME__NOT_SAVED"), e);
      }
    }
  };

  const VOLUME_SLIDER_GRANULARITY = 100;
  // Function to create the volume slider
  const createVolumeSlider = async (): Promise<HTMLDivElement | null> => {
    if (plume.volumeSlider) return null;

    const container = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.volumeContainer.split("#")[1];

    const label = document.createElement("label");
    label.id = PLUME_ELEM_IDENTIFIERS.volumeLabel.split("#")[1];
    label.textContent = getString("LABEL__VOLUME");

    const volumeSlider = document.createElement("input");
    volumeSlider.id = PLUME_ELEM_IDENTIFIERS.volumeSlider.split("#")[1];
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = VOLUME_SLIDER_GRANULARITY.toString();
    volumeSlider.value = Math.round(plume.savedVolume * VOLUME_SLIDER_GRANULARITY).toString();
    volumeSlider.ariaLabel = getString("ARIA__VOLUME_SLIDER");

    // Apply saved volume to audio element
    plume.audioElement!.volume = plume.savedVolume;

    const valueDisplay = document.createElement("div");
    valueDisplay.id = PLUME_ELEM_IDENTIFIERS.volumeValue.split("#")[1];
    valueDisplay.textContent = `${volumeSlider.value}${getString("META__PERCENTAGE")}`;

    // Event listener for volume change
    volumeSlider.addEventListener("input", function (this: HTMLInputElement) {
      const volume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;
      if (plume.audioElement) {
        plume.audioElement.volume = volume;
        valueDisplay.textContent = `${this.value}${getString("META__PERCENTAGE")}`;

        saveNewVolume(volume);
      }
    });

    container.appendChild(label);
    container.appendChild(volumeSlider);
    container.appendChild(valueDisplay);

    plume.volumeSlider = volumeSlider;
    return container;
  };

  const isFirstTrackOfAlbumPlaying = () => {
    const trackList = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    const firstTrackRow = trackList.querySelector(BC_ELEM_IDENTIFIERS.trackRow) as HTMLTableRowElement;
    const firstTrackTitleElem = firstTrackRow.querySelector(BC_ELEM_IDENTIFIERS.trackTitle) as HTMLSpanElement;
    const currentTrackTitleElem = document.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle) as HTMLAnchorElement;
    if (!currentTrackTitleElem) return false;

    return firstTrackTitleElem?.textContent === currentTrackTitleElem.textContent;
  };

  const isLastTrackOfAlbumPlaying = () => {
    const trackList = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    if (!trackList) return false;

    const trackRows = trackList.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow);
    const lastTrackRow = trackRows[trackRows.length - 1] as HTMLTableRowElement;
    const lastTrackTitleElem = lastTrackRow?.querySelector(BC_ELEM_IDENTIFIERS.trackTitle) as HTMLSpanElement;
    const currentTrackTitleElem = document.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle) as HTMLAnchorElement;
    if (!currentTrackTitleElem) return false;

    return lastTrackTitleElem?.textContent === currentTrackTitleElem.textContent;
  };

  // Function to click on the previous track button
  const clickPreviousTrackButton = (): true | null => {
    const prevButton = document.querySelector(BC_ELEM_IDENTIFIERS.previousTrack) as HTMLButtonElement;
    if (!prevButton) {
      logger(CPL.WARN, getString("WARN__PREV_TRACK__NOT_FOUND"));
      return null;
    }

    const firstTrackIsPlaying = !isAlbumPage || isFirstTrackOfAlbumPlaying();
    if (plume.audioElement!.currentTime < PLUME_CONSTANTS.TIME_BEFORE_RESTART && !firstTrackIsPlaying) {
      prevButton.click();
    } else {
      // Restart current track instead, if more than X seconds have elapsed
      plume.audioElement!.currentTime = 0;
      logger(CPL.INFO, getString("DEBUG__PREV_TRACK__RESTARTED"));
      setPauseBtnIcon();
    }
    return true;
  };

  // Function to click on the next track button
  const clickNextTrackButton = (): true | null => {
    const nextButton = document.querySelector(BC_ELEM_IDENTIFIERS.nextTrack) as HTMLButtonElement;
    if (!nextButton) {
      logger(CPL.WARN, getString("WARN__NEXT_TRACK__NOT_FOUND"));
      return null;
    }

    nextButton.click();
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));
    setPauseBtnIcon();
    return true;
  };

  const TIME_STEP_DURATION = 10; // seconds to skip forward/backward
  const createPlaybackControls = () => {
    const container = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.playbackControls.split("#")[1];

    const trackBackwardBtn = document.createElement("button");
    trackBackwardBtn.id = PLUME_ELEM_IDENTIFIERS.trackBwdBtn.split("#")[1];
    trackBackwardBtn.innerHTML = PLUME_SVG.trackBackward;
    trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");
    trackBackwardBtn.addEventListener("click", handleTrackBackward);

    const timeBackwardBtn = document.createElement("button");
    timeBackwardBtn.id = PLUME_ELEM_IDENTIFIERS.timeBwdBtn.split("#")[1];
    timeBackwardBtn.innerHTML = PLUME_SVG.timeBackward;
    timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");
    timeBackwardBtn.addEventListener("click", handleTimeBackward);

    const playPauseBtn = document.createElement("button");
    playPauseBtn.id = PLUME_ELEM_IDENTIFIERS.playPauseBtn.split("#")[1];
    playPauseBtn.innerHTML = plume.audioElement!.paused ? PLUME_SVG.playPlay : PLUME_SVG.playPause;
    playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
    playPauseBtn.addEventListener("click", () => { handlePlayPause([playPauseBtn]); });

    const timeForwardBtn = document.createElement("button");
    timeForwardBtn.id = PLUME_ELEM_IDENTIFIERS.timeFwdBtn.split("#")[1];
    timeForwardBtn.innerHTML = PLUME_SVG.timeForward;
    timeForwardBtn.title = getString("LABEL__TIME_FORWARD");
    timeForwardBtn.addEventListener("click", handleTimeForward);

    const trackForwardBtn = document.createElement("button");
    trackForwardBtn.id = PLUME_ELEM_IDENTIFIERS.trackFwdBtn.split("#")[1];
    trackForwardBtn.innerHTML = PLUME_SVG.trackForward;
    trackForwardBtn.title = getString("LABEL__TRACK_FORWARD");
    trackForwardBtn.addEventListener("click", handleTrackForward);

    container.appendChild(trackBackwardBtn);
    container.appendChild(timeBackwardBtn);
    container.appendChild(playPauseBtn);
    container.appendChild(timeForwardBtn);
    container.appendChild(trackForwardBtn);

    return container;
  };

  const handleTrackBackward = () => {
    logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__CLICKED"));

    const rv = clickPreviousTrackButton();
    if (rv === null) return; // previous track button not found
    logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__DISPATCHED"));
  };

  const handleTimeBackward = () => {
    logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

    const newTime = Math.max(0, plume.audioElement!.currentTime - TIME_STEP_DURATION);
    plume.audioElement!.currentTime = newTime;
    if (plume.audioElement!.paused)
      setTimeout(() => {
        plume.audioElement!.pause(); // prevent auto-play when rewinding on paused track
      }, 10);

    logger(
      CPL.DEBUG,
      `${getString("DEBUG__REWIND_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
        "DEBUG__REWIND_TIME__DISPATCHED2"
      )}`
    );
  };

  const handlePlayPause = (playPauseBtns: HTMLButtonElement[]) => {
    if (plume.audioElement!.paused) {
      plume.audioElement!.play();
      playPauseBtns.forEach(btn => btn.innerHTML = PLUME_SVG.playPause);
    } else {
      plume.audioElement!.pause();
      playPauseBtns.forEach(btn => btn.innerHTML = PLUME_SVG.playPlay);
    }
  };

  const handleTimeForward = () => {
    logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

    const newTime = Math.min(plume.audioElement!.duration || 0, plume.audioElement!.currentTime + TIME_STEP_DURATION);
    plume.audioElement!.currentTime = newTime;
    if (plume.audioElement!.paused)
      setTimeout(() => {
        plume.audioElement!.pause(); // prevent auto-play when forwarding on paused track
      }, 10);

    logger(
      CPL.DEBUG,
      `${getString("DEBUG__FORWARD_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
        "DEBUG__FORWARD_TIME__DISPATCHED2"
      )}`
    );
  };

  const handleTrackForward = () => {
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));

    const rv = clickNextTrackButton();
    if (rv === null) return; // next track button not found
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
  };

  // Function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const saveDurationDisplayMethod = (newMethod: TimeDisplayMethodType) => {
    plume.durationDisplayMethod = newMethod;

    const player = plume.audioElement;
    if (!player || !plume.durationDisplay || !plume.elapsedDisplay) return;
    if (plume.durationDisplayMethod === TIME_DISPLAY_METHOD.DURATION) {
      plume.durationDisplay.textContent = formatTime(player.duration);
    } else {
      plume.durationDisplay.textContent = "-" + formatTime(player.duration - player.currentTime);
    }

    if (browserCacheExists) {
      browserCache.set({ [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: newMethod });
    } else {
      // Fallback with localStorage
      try {
        localStorage.setItem(PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD, newMethod);
      } catch (e) {
        logger(CPL.WARN, getString("WARN__VOLUME__NOT_SAVED"), e);
      }
    }
  };

  const PROGRESS_SLIDER_GRANULARITY = 1000; // use 1000 for better granularity: 1000s = 16m40s
  const createProgressContainer = async () => {
    if (plume.progressSlider) return;

    const container = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.progressContainer.split("#")[1];
    const progressSlider = document.createElement("input");
    progressSlider.id = PLUME_ELEM_IDENTIFIERS.progressSlider.split("#")[1];
    progressSlider.type = "range";
    progressSlider.min = "0";
    progressSlider.max = PROGRESS_SLIDER_GRANULARITY.toString();
    progressSlider.value = "0";
    progressSlider.ariaLabel = getString("ARIA__PROGRESS_SLIDER");

    const timeDisplay = document.createElement("div");
    timeDisplay.id = PLUME_ELEM_IDENTIFIERS.timeDisplay.split("#")[1];

    const elapsed = document.createElement("span");
    elapsed.id = PLUME_ELEM_IDENTIFIERS.elapsedDisplay.split("#")[1];
    elapsed.textContent = "0:00";

    const duration = document.createElement("span");
    duration.textContent = "0:00";
    duration.title = getString("LABEL__TIME_DISPLAY__INVERT");
    duration.id = PLUME_ELEM_IDENTIFIERS.durationDisplay.split("#")[1];

    timeDisplay.appendChild(elapsed);
    timeDisplay.appendChild(duration);

    container.appendChild(progressSlider);
    container.appendChild(timeDisplay);

    duration.addEventListener("click", handleDurationChange);
    progressSlider.addEventListener("input", function (this: HTMLInputElement) {
      const progress = Number.parseFloat(this.value) / PROGRESS_SLIDER_GRANULARITY;
      if (plume.audioElement) {
        plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);
      }
    });

    plume.progressSlider = progressSlider;
    plume.elapsedDisplay = elapsed;
    plume.durationDisplay = duration;

    return container;
  };

  const handleDurationChange = () => {
    if (plume.durationDisplay && plume.audioElement) {
      saveDurationDisplayMethod(plume.durationDisplayMethod === TIME_DISPLAY_METHOD.DURATION
        ? TIME_DISPLAY_METHOD.REMAINING
        : TIME_DISPLAY_METHOD.DURATION
      );
    }
  };

  const RGBToHSL = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number = 0, s: number = 0, l: number = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  const isGrayscale = (rgb: [number, number, number]): boolean => RGBToHSL(...rgb)[1] === 0;
  const getLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const measureContrastRatioWCAG = (rgb: [number, number, number]): number => {
    const bgRgb: [number, number, number] = [18, 18, 18];

    const L1 = getLuminance(rgb);
    const L2 = getLuminance(bgRgb);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  const CONTRAST_ADJUSTMENT_STEP = 0.05;
  const adjustColorContrast = (rgb: [number, number, number], minContrast: number): string => {
    let current = [...rgb] as [number, number, number];
    let factor = 0;
    while (measureContrastRatioWCAG(current) < minContrast && factor < 1) {
      factor += CONTRAST_ADJUSTMENT_STEP;
      current = current.map((c) => Math.round(c + (255 - c) * factor)) as [number, number, number];
    }

    // return as rgb(r, g, b)
    return `rgb(${current.map((c) => Math.round(c)).join(", ")})`;
  }

  const getArtistNameElement = (): HTMLSpanElement => {
    const nameSection = document.querySelector(BC_ELEM_IDENTIFIERS.nameSection) as HTMLElement;
    const nameSectionLinks = nameSection.querySelectorAll("span");
    const artistElementIdx = nameSectionLinks.length - 1; // idx should be 0 if album page, 1 if track page
    return nameSectionLinks[artistElementIdx].querySelector("a")! as HTMLSpanElement;
  };

  const getTrackTitleElement = (): HTMLSpanElement => {
    return document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement;
  };

  const WCAG_CONTRAST = 4.5; // "The visual presentation of text [must have] a contrast ratio of at least 4.5:1"
  const FALLBACK_GRAY = "rgb(127, 127, 127)"; // fallback gray if the best color is grayscale, to ensure visibility on Plume's dark background
  const getAppropriatePretextColor = (): string => {
    const trackColor = getComputedStyle(getTrackTitleElement()).color;
    const artistColor = getComputedStyle(getArtistNameElement()).color;
    const trackColorRGB = trackColor.match(/\d+/g)!.map(Number) as [number, number, number];
    const artistColorRGB = artistColor.match(/\d+/g)!.map(Number) as [number, number, number];
    const trackColorContrast = measureContrastRatioWCAG(trackColorRGB);
    const artistColorContrast = measureContrastRatioWCAG(artistColorRGB);
    if (trackColorContrast > WCAG_CONTRAST && artistColorContrast > WCAG_CONTRAST) {
      const trackColorSaturation = RGBToHSL(...trackColorRGB)[1];
      const artistColorSaturation = RGBToHSL(...artistColorRGB)[1];
      return trackColorSaturation > artistColorSaturation ? trackColor : artistColor;
    } else if (trackColorContrast > WCAG_CONTRAST || artistColorContrast > WCAG_CONTRAST) {
      return trackColorContrast > WCAG_CONTRAST ? trackColor : artistColor;
    } else {
      const preferredColor = trackColorContrast > artistColorContrast ? trackColor : artistColor;
      const preferredColorRgb = preferredColor.match(/\d+/g)!.map(Number) as [number, number, number];
      if (isGrayscale(preferredColorRgb))
        return FALLBACK_GRAY;
      return adjustColorContrast(preferredColorRgb, WCAG_CONTRAST);
    }
  };

  interface TrackQuantifiers {
    current: number;
    total: number;
  };
  // Function to get the current track quantifiers (e.g. 3rd out of 10)
  const getTrackQuantifiers = (trackName: string): TrackQuantifiers => {
    const trackTable = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    if (!trackTable) return { current: 0, total: 0 };

    const trackRows = trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow);
    const trackCount = trackRows.length;
    const trackRowTitles = Array.from(trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackTitle));
    const currentTrackNumber = trackRowTitles.findIndex((el) => el.textContent === trackName) + 1;
    logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [currentTrackNumber, trackCount]));
    return { current: currentTrackNumber, total: trackCount };
  };

  // Function to get the current track title from Bandcamp
  const getCurrentTrackTitle = (): string => {
    const titleElement = isAlbumPage
      ? (document.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle) as HTMLSpanElement)
      : (document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement);
    if (!titleElement?.textContent) return getString("LABEL__TRACK_UNKNOWN");

    return titleElement.textContent.trim();
  };

  // Function to hide original Bandcamp player elements
  const hideOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(BC_ELEM_IDENTIFIERS.inlinePlayerTable) as HTMLTableElement;
    if (bcAudioTable) {
      bcAudioTable.style.display = "none";
      bcAudioTable.classList.add("bpe-hidden-original");
    }

    logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__HIDDEN"));
  };

  // Function to restore original player elements (use it for debug purposes)
  const restoreOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(PLUME_ELEM_IDENTIFIERS.bcElements) as HTMLTableElement;
    if (!bcAudioTable) return; // eliminate onInit function call

    bcAudioTable.style.display = "unset";
    bcAudioTable.classList.remove("bpe-hidden-original");

    logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__RESTORED"));
  };

  // Function to find the original Bandcamp player container
  const findOriginalPlayerContainer = (): HTMLDivElement | null => {
    const BC_PLAYER_SELECTORS = [
      ".inline_player",
      "#trackInfoInner",
      ".track_play_auxiliary",
      ".track_play_hilite",
      ".track_play_area",
    ];

    let playerContainer = null;
    for (const selector of BC_PLAYER_SELECTORS) {
      playerContainer = document.querySelector(selector);
      if (playerContainer) break; // found the original player container!
    }

    if (!playerContainer) {
      logger(CPL.WARN, getString("WARN__PLAYER_CONTAINER_NOT_FOUND"));
      // Search near audio elements
      if (plume.audioElement) {
        playerContainer = plume.audioElement.closest("div") || plume.audioElement.parentElement;
      }
    }

    return playerContainer ? (playerContainer as HTMLDivElement) : null;
  };

  const injectEnhancements = async () => {
    const bcPlayerContainer = findOriginalPlayerContainer();
    if (!bcPlayerContainer) {
      logger(CPL.ERROR, getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
      return;
    }

    restoreOriginalPlayerElements(); // call it to prevent "unused function" linter warning
    hideOriginalPlayerElements();

    const plumeContainer = document.createElement("div");
    plumeContainer.id = PLUME_ELEM_IDENTIFIERS.plumeContainer.split("#")[1];

    const headerContainer = document.createElement("div");
    headerContainer.id = PLUME_ELEM_IDENTIFIERS.headerContainer.split("#")[1];

    const headerLogo = document.createElement("a");
    headerLogo.id = PLUME_ELEM_IDENTIFIERS.headerLogo.split("#")[1];
    headerLogo.innerHTML = PLUME_SVG.logo + `<p id="${headerLogo.id}--version">${APP_VERSION}</p>`;
    headerLogo.href = PLUME_KO_FI_URL;
    headerLogo.target = "_blank";
    headerLogo.rel = "noopener noreferrer";
    headerLogo.ariaLabel = APP_NAME;
    headerLogo.title = getString("ARIA__LOGO_LINK");
    headerContainer.appendChild(headerLogo);

    const initialTrackTitle = getCurrentTrackTitle();
    const initialTq = getTrackQuantifiers(initialTrackTitle);
    const currentTitleSection = document.createElement("div");
    currentTitleSection.id = PLUME_ELEM_IDENTIFIERS.headerCurrent.split("#")[1];
    currentTitleSection.tabIndex = 0; // make it focusable for screen readers
    currentTitleSection.ariaLabel = isAlbumPage
      ? getString("ARIA__TRACK_CURRENT", [initialTq.current, initialTq.total, initialTrackTitle])
      : getString("ARIA__TRACK", initialTrackTitle);
    const currentTitlePretext = document.createElement("span");
    currentTitlePretext.id = PLUME_ELEM_IDENTIFIERS.headerTitlePretext.split("#")[1];
    currentTitlePretext.textContent = isAlbumPage
      ? getString("LABEL__TRACK_CURRENT", `${initialTq.current}/${initialTq.total}`)
      : getString("LABEL__TRACK");
    currentTitlePretext.style.color = getAppropriatePretextColor();
    currentTitlePretext.ariaHidden = "true"; // hide from screen readers to avoid redundancy
    currentTitleSection.appendChild(currentTitlePretext);
    const currentTitleText = document.createElement("span");
    currentTitleText.id = PLUME_ELEM_IDENTIFIERS.headerTitle.split("#")[1];
    currentTitleText.textContent = initialTrackTitle;
    currentTitleText.title = initialTrackTitle; // see full title on hover in case title is truncated
    currentTitleText.ariaHidden = "true"; // hide from screen readers to avoid redundancy
    currentTitleSection.appendChild(currentTitleText);
    headerContainer.appendChild(currentTitleSection);

    plume.titleDisplay = headerContainer;
    plumeContainer.appendChild(headerContainer);

    const playbackManager = document.createElement("div");
    playbackManager.id = PLUME_ELEM_IDENTIFIERS.playbackManager.split("#")[1];

    const progressContainer = await createProgressContainer();
    if (progressContainer) {
      playbackManager.appendChild(progressContainer);
    }
    const playbackControls = createPlaybackControls();
    if (playbackControls) {
      playbackManager.appendChild(playbackControls);
    }
    plumeContainer.appendChild(playbackManager);

    const volumeContainer = await createVolumeSlider();
    if (volumeContainer) {
      plumeContainer.appendChild(volumeContainer);
    }

    const fullscreenBtnContainer = createFullscreenBtnContainer();
    plumeContainer.appendChild(fullscreenBtnContainer);

    bcPlayerContainer.appendChild(plumeContainer);

    logger(CPL.LOG, getString("LOG__MOUNT__COMPLETE"));
  };

  const setPauseBtnIcon = () => {
    const playPauseBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.playPauseBtn);
    playPauseBtns.forEach(btn => btn.innerHTML = PLUME_SVG.playPause);
  };

  const updateTrackForwardBtnState = () => {
    const trackFwdBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.trackFwdBtn);
    if (trackFwdBtns.length === 0) return;

    const shouldDisable = !isAlbumPage || isLastTrackOfAlbumPlaying();
    trackFwdBtns.forEach(btn => btn.disabled = shouldDisable);
  };

  // Function to update the pretext display (track numbering)
  const updatePretextDisplay = () => {
    const preText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitlePretext) as HTMLSpanElement;
    if (!preText) return;

    const newTrackTitle = getCurrentTrackTitle();
    const newTq = getTrackQuantifiers(newTrackTitle);
    preText.textContent = isAlbumPage
      ? getString("LABEL__TRACK_CURRENT", `${newTq.current}/${newTq.total}`)
      : getString("LABEL__TRACK");

    const headerCurrent = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerCurrent) as HTMLDivElement;
    headerCurrent.ariaLabel = isAlbumPage
      ? getString("ARIA__TRACK_CURRENT", [newTq.current, newTq.total, newTrackTitle])
      : getString("ARIA__TRACK", newTrackTitle);
  };

  const LOGO_DEFAULT_VERTICAL_PADDING = 1; // in rem, from `styles.css`
  const LATIN_CHAR_HEIGHT = 19; // in px, for calculation
  // Function to update the title display when track changes
  const updateTitleDisplay = () => {
    const titleText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitle) as HTMLSpanElement;
    if (!titleText) return;

    const newTrackTitle = getCurrentTrackTitle();
    titleText.textContent = newTrackTitle;
    titleText.title = newTrackTitle; // allow the user to see the full title on hover, in case the title is truncated

    if (titleText.offsetHeight !== LATIN_CHAR_HEIGHT) {
      const logo = document.querySelector(PLUME_ELEM_IDENTIFIERS.headerLogo) as HTMLAnchorElement;
      if (!logo) return;

      const deltaPaddingPx = titleText.offsetHeight - LATIN_CHAR_HEIGHT; // calculate difference in px
      const deltaPaddingRem = deltaPaddingPx / 16; // 16px = 1rem
      logo.style.paddingTop = `${LOGO_DEFAULT_VERTICAL_PADDING + deltaPaddingRem}rem`;
    }
  };

  // Function to update the progress bar and time displays as audio plays or metadata change
  const updateProgressBar = () => {
    if (!plume.progressSlider) return;

    const elapsed = plume.audioElement!.currentTime;
    const duration = plume.audioElement!.duration;

    if (!Number.isNaN(duration) && duration > 0) {
      const percent = (elapsed / duration) * 100;
      const bgPercent = percent < 50 ? (percent + 1) : (percent - 1); // or else it under/overflows
      const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
      plume.progressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
      plume.progressSlider.style.backgroundImage = bgImg;

      if (plume.elapsedDisplay) {
        plume.elapsedDisplay.textContent = formatTime(elapsed);
      }

      if (plume.durationDisplay) {
        if (plume.durationDisplayMethod === TIME_DISPLAY_METHOD.DURATION) {
          plume.durationDisplay.textContent = formatTime(duration);
        } else {
          plume.durationDisplay.textContent = "-" + formatTime(duration - elapsed);
        }
      }
    }
  };

  // Function to set up event listeners on the audio element: progress, metadata, volume
  const setupAudioListeners = () => {
    // Update progress container
    plume.audioElement!.addEventListener("timeupdate", updateProgressBar);
    plume.audioElement!.addEventListener("loadedmetadata", updateProgressBar);
    plume.audioElement!.addEventListener("durationchange", updateProgressBar);

    // Update title when metadata loads (new track)
    plume.audioElement!.addEventListener("loadedmetadata", updateTitleDisplay);
    plume.audioElement!.addEventListener("loadedmetadata", updatePretextDisplay);
    plume.audioElement!.addEventListener("loadedmetadata", updateTrackForwardBtnState);
    plume.audioElement!.addEventListener("loadstart", updateTitleDisplay);
    plume.audioElement!.addEventListener("loadstart", updatePretextDisplay);
    plume.audioElement!.addEventListener("loadstart", updateTrackForwardBtnState);

    // Sync volume with Plume's slider
    plume.audioElement!.addEventListener("volumechange", () => {
      if (!plume.volumeSlider) return;

      plume.volumeSlider.value = `${Math.round(plume.audioElement!.volume * VOLUME_SLIDER_GRANULARITY)}`;
      const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
        PLUME_ELEM_IDENTIFIERS.volumeValue
      ) as HTMLSpanElement;
      if (valueDisplay) {
        valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      saveNewVolume(plume.audioElement!.volume);
    });

    logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));
  };

  let scrollIsTicking = false; // this variable must be outside the function scope to have persistent state
  const SCROLLED_CLASSNAME = "scrolled"; // from `styles.css`
  // Function to create a scroll listener to apply a specific styling to the player when it's out of viewport
  const createPlumeStickinessListener = () => {
    const parentDivClassName = BC_ELEM_IDENTIFIERS.playerParent.split(".")[1];
    const plumeParentDiv = document.getElementsByClassName(parentDivClassName)[0];
    if (!plumeParentDiv) {
      logger(CPL.ERROR, getString("ERROR__PLAYER_PARENT__NOT_FOUND"));
      return;
    }

    const triggerHeight = (plumeParentDiv as HTMLDivElement).offsetTop;
    window.addEventListener("scroll", () => { // Check if plume is in viewport height for sticky styling
      if (scrollIsTicking) return;
      globalThis.requestAnimationFrame(() => {
        const plumeIsInViewport = window.scrollY < triggerHeight;
        if (plumeIsInViewport) {
          plumeParentDiv.classList.remove(SCROLLED_CLASSNAME);
        } else {
          plumeParentDiv.classList.add(SCROLLED_CLASSNAME);
        }
        scrollIsTicking = false;
      });
      scrollIsTicking = true;
    });
  };

  // Function to load the duration display method from browser cache (duration or remaining)
  const loadDurationDisplayMethod = (): Promise<TimeDisplayMethodType> => {
    return new Promise((resolve) => {
      if (browserCacheExists) {
        browserCache.get([PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]).then((ls: LocalStorage) => {
          const durationDisplayMethod =
            ls[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] || PLUME_DEF.durationDisplayMethod;
          plume.durationDisplayMethod = durationDisplayMethod;
          resolve(durationDisplayMethod);
        });
      } else {
        // Fallback with localStorage
        try {
          const storedDurationDisplayMethod = localStorage.getItem(PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD);
          const durationDisplayMethod: TimeDisplayMethodType = storedDurationDisplayMethod
            ? (storedDurationDisplayMethod as TimeDisplayMethodType)
            : TIME_DISPLAY_METHOD.DURATION;
          plume.durationDisplayMethod = durationDisplayMethod;
          resolve(durationDisplayMethod);
        } catch (e) {
          logger(CPL.WARN, getString("WARN__TIME_DISPLAY_METHOD__NOT_LOADED"), e);
          plume.durationDisplayMethod = TIME_DISPLAY_METHOD.DURATION;
          resolve(TIME_DISPLAY_METHOD.DURATION);
        }
      }
    });
  };

  // Main initialization function
  const init = async () => {
    logger(CPL.INFO, getString("LOG__INITIALIZATION__START"));

    // Wait for the page to be fully loaded
    if (document.readyState !== "complete") {
      window.addEventListener("load", init);
      return;
    }

    plume.audioElement = await findAudioElement();
    if (!plume.audioElement) {
      logger(CPL.WARN, getString("WARN__AUDIO_ELEMENT__NOT_FOUND"));
      setTimeout(init, 1000); // retry after 1 second
      return;
    }

    const plumeIsAlreadyInjected = !!document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer);
    if (plumeIsAlreadyInjected) return;

    // Ensure duration display method is applied
    await loadDurationDisplayMethod();
    logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${plume.durationDisplayMethod}"`);

    // Inject enhancements
    await injectEnhancements();
    setupAudioListeners();
    initPlayback();

    // Debug: show detected controls
    debugBandcampControls();

    logger(CPL.LOG, getString("LOG__INITIALIZATION__COMPLETE"));
  };

  const plume: PlumeCore = {
    audioElement: null,
    titleDisplay: null,
    progressSlider: null,
    elapsedDisplay: null,
    durationDisplay: null,
    durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
    volumeSlider: null,
    savedVolume: PLUME_DEF.savedVolume,
  };

  // Observe DOM changes for players that load dynamically
  const domObserver = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
        if (newAudio && newAudio !== plume.audioElement) {
          logger(CPL.INFO, getString("INFO__NEW_AUDIO__FOUND"));

          // Ensure duration display method is applied
          await loadDurationDisplayMethod();
          logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${plume.durationDisplayMethod}"`);

          // Load and apply saved volume to the new element
          await loadSavedVolume();
          newAudio.volume = plume.savedVolume;
          logger(
            CPL.INFO,
            `${getString("INFO__VOLUME__APPLIED")} ${Math.round(plume.savedVolume * 100)}${getString(
              "META__PERCENTAGE"
            )}`
          );

          plume.audioElement = newAudio;

          // Reset if needed
          if (!document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer)) {
            setTimeout(init, 500);
          }
        }

        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle.slice(1)) ||
            mutation.target.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle))
        ) {
          updateTitleDisplay();
          updatePretextDisplay();
        }
      }
    });
  });

  // Start observing
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  init();
  createPlumeStickinessListener();

  // Support for SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentPageUrl = location.href;
    if (currentPageUrl === lastUrl) return;

    lastUrl = currentPageUrl;
    logger(CPL.LOG, getString("LOG__NAVIGATION_DETECTED"));
    setTimeout(() => {
      init();
      setTimeout(updateTitleDisplay, 500);
      setTimeout(updatePretextDisplay, 600); // slight delay to ensure track display is updated
    }, 1000);
  }).observe(document, { subtree: true, childList: true });
})();
