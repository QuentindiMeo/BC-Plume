// Plume - TypeScript Content Script
const version = "_v1.2.3";

interface BrowserAPI {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
  i18n: {
    getMessage: (key: string, ...args: any[]) => string;
  };
}

/**
 * Audio player enhancement handles
 */
interface PlumeObject {
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  volumeSlider: HTMLInputElement | null;
  savedVolume: number;
}

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
}

/**
 * Volume storage interface
 */
interface LocalStorage {
  bandcamp_volume?: number;
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
  plumeContainer = "div.bpe-plume",
  headerTitlePretext = "span.bpe-header-title-pretext",
  headerTitle = "span.bpe-header-title",
  volumeValue = "div.bpe-volume-value",
}

enum BC_ELEM_IDENTIFIERS {
  inlinePlayerTable = "div.inline_player>table",
  audioPlayer = "audio",
  playPause = "div.playbutton",
  onTrackCurrentTrackTitle = "h2.trackTitle",
  onAlbumCurrentTrackTitle = "a.title_link",
  previousTrack = "div.prevbutton",
  nextTrack = "div.nextbutton",
  nameSection = "div#name-section",
  trackList = "table#track_table",
  trackRow = "tr.track_row_view",
  trackTitle = "span.track-title",
}

type ConsolePrintingMethod = "debug" | "info" | "log" | "warn" | "error";
const ConsolePrintingPrefix: Record<ConsolePrintingMethod, string> = {
  debug: "DEBUG",
  info: "INFO.",
  log: "LOG..",
  warn: "WARN?",
  error: "ERR?!",
};

const logger = (method: ConsolePrintingMethod, ...toPrint: any[]) => {
  const now = new Date();
  const nowTime = now.toLocaleTimeString();
  const nowMilliseconds = now.getMilliseconds().toString().padStart(3, "0");
  console[method](`[Plume${version} ${ConsolePrintingPrefix[method]} | ${nowTime}.${nowMilliseconds}]`, ...toPrint);
};

(() => {
  "use strict";

  // Browser detection and compatible storage API
  const browserAPI: BrowserAPI = (() => {
    if (typeof (globalThis as any).chrome !== "undefined" && (globalThis as any).chrome.storage) {
      return (globalThis as any).chrome;
    } else if (typeof (globalThis as any).browser !== "undefined" && (globalThis as any).browser.storage) {
      return (globalThis as any).browser;
    } else {
      logger("warn", (globalThis as any).chrome.i18n.getMessage("WARN__BROWSER_API__NOT_DETECTED"));
      return (globalThis as any).chrome; // Assume Chromium-based as fallback
    }
  })();
  const browserLocalStorage = browserAPI.storage.local;
  const browserType = typeof (globalThis as any).chrome !== "undefined" ? "Chromium" : "Firefox";
  if (!browserAPI.i18n.getMessage) {
    // Fallback for browsers without i18n support (safety net for if browser detection failed)
    browserAPI.i18n.getMessage = (key: string, ..._: any[]) => key;
  }
  const getString = browserAPI.i18n.getMessage;
  logger("info", getString("INFO__BROWSER__DETECTED"), browserType);

  const plume: PlumeObject = {
    audioElement: null,
    titleDisplay: null,
    progressSlider: null,
    elapsedDisplay: null,
    durationDisplay: null,
    volumeSlider: null,
    savedVolume: 0.5, // Default volume, 0..1
  };

  const saveNewVolume = (newVolume: number) => {
    plume.savedVolume = newVolume;

    if (browserLocalStorage !== undefined) {
      // Chrome/Firefox with extension API
      browserLocalStorage.set({ bandcamp_volume: newVolume });
    } else {
      // Fallback with localStorage
      try {
        localStorage.setItem("bandcamp_volume", newVolume.toString());
      } catch (e) {
        logger("warn", getString("WARN__VOLUME__NOT_SAVED"), e);
      }
    }
  };

  const loadSavedVolume = (): Promise<number> => {
    return new Promise((resolve) => {
      if (browserLocalStorage !== undefined) {
        // Chrome/Firefox with extension API
        browserLocalStorage.get(["bandcamp_volume"]).then((ls: LocalStorage) => {
          const volume = ls.bandcamp_volume || 0.5; // 0.5 = 50% volume by default since Bandcamp is loud
          plume.savedVolume = volume;
          resolve(volume);
        });
      } else {
        // Fallback with localStorage
        try {
          const storedVolume = localStorage.getItem("bandcamp_volume");
          const volume = storedVolume ? parseFloat(storedVolume) : 1;
          plume.savedVolume = volume;
          resolve(volume);
        } catch (e) {
          logger("warn", getString("WARN__VOLUME__NOT_LOADED"), e);
          plume.savedVolume = 1;
          resolve(1);
        }
      }
    });
  };

  // Function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Function to click on the previous track button
  const clickPreviousTrackButton = () => {
    const prevButton = document.querySelector(BC_ELEM_IDENTIFIERS.previousTrack) as HTMLButtonElement;
    if (prevButton) {
      prevButton.click();
      logger("debug", getString("DEBUG__PREV_TRACK__CLICKED"));
    } else {
      logger("warn", getString("WARN__PREV_TRACK__NOT_FOUND"));
    }
  };

  // Function to click on the next track button
  const clickNextTrackButton = () => {
    const nextButton = document.querySelector(BC_ELEM_IDENTIFIERS.nextTrack) as HTMLButtonElement;
    if (nextButton) {
      nextButton.click();
      logger("debug", getString("DEBUG__NEXT_TRACK__CLICKED"));
    } else {
      logger("warn", getString("WARN__NEXT_TRACK__NOT_FOUND"));
    }
  };

  // Function to initialize playback (necessary to make Plume buttons effective)
  const initPlayback = () => {
    const playButton = document.querySelector(BC_ELEM_IDENTIFIERS.playPause) as HTMLButtonElement;
    if (playButton) {
      // Double-click to ensure playback has started
      playButton.click();
      playButton.click();
    } else {
      logger("warn", getString("WARN__PLAY_PAUSE__NOT_FOUND"));
    }
  };

  // Function to get the current track title from Bandcamp
  const getCurrentTrackTitle = (): string => {
    const titleElement = window.location.pathname.includes("/album/")
      ? (document.querySelector(BC_ELEM_IDENTIFIERS.onAlbumCurrentTrackTitle) as HTMLSpanElement)
      : (document.querySelector(BC_ELEM_IDENTIFIERS.onTrackCurrentTrackTitle) as HTMLSpanElement);
    if (titleElement?.textContent) {
      return titleElement.textContent.trim();
    }
    return getString("LABEL__TRACK_UNKNOWN");
  };

  // Function to update the pretext display (track numbering)
  const updatePretextDisplay = () => {
    if (plume.titleDisplay) {
      const preText = plume.titleDisplay.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitlePretext) as HTMLSpanElement;
      if (!preText) return;

      const currentTrackNumberingString = getTrackNumberingString(getCurrentTrackTitle());
      preText.textContent = getString("LABEL__TRACK_CURRENT", currentTrackNumberingString);
    }
  };

  // Function to update the title display when track changes
  const updateTitleDisplay = () => {
    if (plume.titleDisplay) {
      const titleText = plume.titleDisplay.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitle) as HTMLSpanElement;
      if (!titleText) return;

      const currentTrackTitle = getCurrentTrackTitle();
      titleText.textContent = currentTrackTitle;
      titleText.title = currentTrackTitle; // see full title on hover in case title is truncated
    }
  };

  // Function to find the audio element
  const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
    const audio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
    if (audio) {
      logger("info", getString("INFO__AUDIO__FOUND"), audio);

      // Load and immediately apply saved volume
      await loadSavedVolume();
      audio.volume = plume.savedVolume;
      logger(
        "info",
        `${getString("INFO__VOLUME__FOUND")} ${Math.round(plume.savedVolume * 100)}${getString("META__PERCENTAGE")}`
      );

      return audio;
    }
    return null;
  };

  // Function to create the volume slider
  const createVolumeSlider = async (): Promise<HTMLDivElement | null> => {
    if (!plume.audioElement || plume.volumeSlider) return null;

    // Load saved volume before creating the slider to ensure it's applied
    await loadSavedVolume();

    const container = document.createElement("div");
    container.className = "bpe-volume-container";

    const label = document.createElement("label");
    label.className = "bpe-volume-label";
    label.textContent = getString("LABEL__VOLUME");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = Math.round(plume.savedVolume * 100).toString();
    slider.className = "bpe-volume-slider";

    // Apply saved volume to audio element
    plume.audioElement.volume = plume.savedVolume;

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "bpe-volume-value";
    valueDisplay.textContent = `${slider.value}${getString("META__PERCENTAGE")}`;

    // Event listener for volume change
    slider.addEventListener("input", function (this: HTMLInputElement) {
      const volume = parseInt(this.value) / 100;
      if (plume.audioElement) {
        plume.audioElement.volume = volume;
        valueDisplay.textContent = `${this.value}${getString("META__PERCENTAGE")}`;

        // Save new volume
        saveNewVolume(volume);
      }
    });

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueDisplay);

    plume.volumeSlider = slider;
    return container;
  };

  const hideOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(BC_ELEM_IDENTIFIERS.inlinePlayerTable) as HTMLTableElement;
    if (bcAudioTable) {
      bcAudioTable.style.display = "none";
      bcAudioTable.classList.add("bpe-hidden-original");
    }

    logger("log", getString("LOG__ORIGINAL_PLAYER__HIDDEN"));
  };

  // Function to restore original player elements (use it for debug purposes)
  const restoreOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(PLUME_ELEM_IDENTIFIERS.bcElements) as HTMLTableElement;

    if (!bcAudioTable) return; // eliminate onInit function call

    bcAudioTable.style.display = "unset";
    bcAudioTable.classList.remove("bpe-hidden-original");

    logger("log", getString("LOG__ORIGINAL_PLAYER__RESTORED"));
  };

  // Debug function to identify Bandcamp controls
  const debugBandcampControls = () => {
    logger("debug", getString("DEBUG__CONTROL_ELEMENTS__DETECTED"));

    // Find all possible buttons and links
    const allButtons = document.querySelectorAll(
      'button, a, div[role="button"], span[onclick]'
    ) as unknown as Array<HTMLButtonElement>;
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

    logger("debug", getString("DEBUG__CONTROL_ELEMENTS__FOUND"), relevantControls);
    logger("debug", getString("DEBUG__CONTROL_ELEMENTS__END"));

    return relevantControls;
  };

  const createPlaybackControls = () => {
    const container = document.createElement("div");
    container.className = "bpe-playback-controls";

    const trackBackwardBtn = document.createElement("button");
    trackBackwardBtn.className = "bpe-track-bwd-btn";
    trackBackwardBtn.innerHTML = PLUME_SVG.trackBackward;
    trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");

    const timeBackwardBtn = document.createElement("button");
    timeBackwardBtn.className = "bpe-time-bwd-btn";
    timeBackwardBtn.innerHTML = PLUME_SVG.timeBackward;
    timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");

    const playPauseBtn = document.createElement("button");
    playPauseBtn.className = "bpe-play-pause-btn";
    playPauseBtn.innerHTML = PLUME_SVG.playPlay;
    playPauseBtn.title = getString("LABEL__PLAY_PAUSE");

    const timeForwardBtn = document.createElement("button");
    timeForwardBtn.className = "bpe-time-fwd-btn";
    timeForwardBtn.innerHTML = PLUME_SVG.timeForward;
    timeForwardBtn.title = getString("LABEL__TIME_FORWARD");

    const trackForwardBtn = document.createElement("button");
    trackForwardBtn.className = "bpe-track-fwd-btn";
    trackForwardBtn.innerHTML = PLUME_SVG.trackForward;
    trackForwardBtn.title = getString("LABEL__TRACK_FORWARD");

    // === Event listeners for buttons ===
    trackBackwardBtn.addEventListener("click", () => {
      logger("debug", getString("DEBUG__PREV_TRACK__CLICKED"));

      if (!plume.audioElement) {
        logger("warn", getString("WARN__AUDIO__NOT_FOUND"));
        return;
      }

      clickPreviousTrackButton();
      logger("debug", getString("DEBUG__PREV_TRACK__DISPATCHED"));
    });

    timeBackwardBtn.addEventListener("click", () => {
      logger("debug", getString("DEBUG__REWIND_TIME__CLICKED"));

      if (!plume.audioElement) {
        logger("warn", getString("WARN__AUDIO__NOT_FOUND"));
        return;
      }

      const newTime = Math.max(0, plume.audioElement.currentTime - 10);
      plume.audioElement.currentTime = newTime;
      logger(
        "debug",
        `${getString("DEBUG__REWIND_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
          "DEBUG__REWIND_TIME__DISPATCHED2"
        )}`
      );
    });

    playPauseBtn.addEventListener("click", () => {
      if (!plume.audioElement) return;

      if (plume.audioElement.paused) {
        plume.audioElement.play();
        playPauseBtn.innerHTML = PLUME_SVG.playPause;
      } else {
        plume.audioElement.pause();
        playPauseBtn.innerHTML = PLUME_SVG.playPlay;
      }
    });

    timeForwardBtn.addEventListener("click", () => {
      logger("debug", getString("DEBUG__FORWARD_TIME__CLICKED"));

      if (!plume.audioElement) {
        logger("warn", getString("WARN__AUDIO__NOT_FOUND"));
        return;
      }

      const newTime = Math.min(plume.audioElement.duration || 0, plume.audioElement.currentTime + 10);
      plume.audioElement.currentTime = newTime;
      logger(
        "debug",
        `${getString("DEBUG__FORWARD_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
          "DEBUG__FORWARD_TIME__DISPATCHED2"
        )}`
      );
    });

    trackForwardBtn.addEventListener("click", () => {
      logger("debug", getString("DEBUG__NEXT_TRACK__CLICKED"));

      if (!plume.audioElement) {
        logger("warn", getString("WARN__AUDIO__NOT_FOUND"));
        return;
      }

      clickNextTrackButton();
      logger("debug", getString("DEBUG__NEXT_TRACK__DISPATCHED"));
    });

    plume.audioElement?.addEventListener("play", () => {
      playPauseBtn.innerHTML = PLUME_SVG.playPause;
    });

    plume.audioElement?.addEventListener("pause", () => {
      playPauseBtn.innerHTML = PLUME_SVG.playPlay;
    });

    // Initial state
    playPauseBtn.innerHTML = plume.audioElement?.paused ? PLUME_SVG.playPlay : PLUME_SVG.playPause;

    container.appendChild(trackBackwardBtn);
    container.appendChild(timeBackwardBtn);
    container.appendChild(playPauseBtn);
    container.appendChild(timeForwardBtn);
    container.appendChild(trackForwardBtn);

    return container;
  };

  const createProgressContainer = () => {
    if (!plume.audioElement || plume.progressSlider) return;

    const container = document.createElement("div");
    container.className = "bpe-progress-container";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1000"; // use 1000 for better granularity: 1000s = 16m40s
    slider.value = "0";
    slider.className = "bpe-progress-slider";

    const timeDisplay = document.createElement("div");
    timeDisplay.className = "bpe-time-display";

    const elapsed = document.createElement("span");
    elapsed.textContent = "0:00";

    const duration = document.createElement("span");
    duration.textContent = "0:00";

    timeDisplay.appendChild(elapsed);
    timeDisplay.appendChild(duration);

    container.appendChild(slider);
    container.appendChild(timeDisplay);

    // Event listener for progress change
    slider.addEventListener("input", function (this: HTMLInputElement) {
      const progress = parseFloat(this.value) / 1000;
      if (plume.audioElement) {
        plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);
      }
    });

    plume.progressSlider = slider;
    plume.elapsedDisplay = elapsed;
    plume.durationDisplay = duration;

    return container;
  };

  const updateProgressBar = () => {
    if (!plume.audioElement || !plume.progressSlider) return;

    const elapsed = plume.audioElement.currentTime;
    const duration = plume.audioElement.duration;

    if (!isNaN(duration) && duration > 0) {
      const percent = (elapsed / duration) * 100;
      const bgPercent = percent < 50 ? (percent + 1) : (percent - 1); // or else it under/overflows
      const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
      plume.progressSlider.value = `${percent * 10}`;
      plume.progressSlider.style.backgroundImage = bgImg;

      if (plume.elapsedDisplay) {
        plume.elapsedDisplay.textContent = formatTime(elapsed);
      }

      if (plume.durationDisplay) {
        plume.durationDisplay.textContent = formatTime(duration);
      }
    }
  };

  const getTrackNumberingString = (title: string | undefined): string => {
    const trackTable = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    if (!trackTable) return "";

    const trackRows = trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow);
    const trackCount = trackRows.length;
    const trackRowTitles: HTMLSpanElement[] = Array.from(trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackTitle));
    const currentTrackNumber = trackRowTitles.findIndex((el) => el.textContent === title) + 1;
    return trackRows.length ? `(${currentTrackNumber}/${trackCount})` : "";
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
  const adjustForContrast = (rgb: [number, number, number], minContrast: number): string => {
    let current = [...rgb] as [number, number, number];
    let factor = 0;
    while (measureContrastRatioWCAG(current) < minContrast && factor < 1) {
      factor += CONTRAST_ADJUSTMENT_STEP;
      current = current.map((c) => Math.round(c + (255 - c) * factor)) as [number, number, number];
    }

    // return as rgb(r, g, b)
    return `rgb(${current.map((c) => Math.round(c)).join(", ")})`;
  }

  const getTrackTitleElement = (): HTMLSpanElement => {
    return document.querySelector(BC_ELEM_IDENTIFIERS.onTrackCurrentTrackTitle) as HTMLSpanElement;
  };

  const getArtistNameElement = (): HTMLSpanElement => {
    const nameSection = document.querySelector(BC_ELEM_IDENTIFIERS.nameSection) as HTMLElement;
    const nameSectionLinks = nameSection.querySelectorAll("span");
    const artistElementIdx = nameSectionLinks.length - 1; // idx should be 0 if album page, 1 if track page
    return nameSectionLinks[artistElementIdx].querySelector("a")! as HTMLSpanElement;
  };

  // "The visual presentation of text [must have] a contrast ratio of at least 4.5:1"
  const WCAG_CONTRAST = 4.5;
  const FALLBACK_GRAY = "rgb(127, 127, 127)";
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
    } else {
      const preferredColor = trackColorContrast > artistColorContrast ? trackColor : artistColor;
      const preferredColorRgb = preferredColor.match(/\d+/g)!.map(Number) as [number, number, number];
      if (isGrayscale(preferredColorRgb))
        return FALLBACK_GRAY;
      return adjustForContrast(preferredColorRgb, WCAG_CONTRAST);
    }
  };

  const injectEnhancements = async () => {
    const bcPlayerSelectors = [
      ".inline_player",
      "#trackInfoInner",
      ".track_play_auxiliary",
      ".track_play_hilite",
      ".track_play_area",
    ];

    let playerContainer = null;
    for (const selector of bcPlayerSelectors) {
      playerContainer = document.querySelector(selector);
      if (playerContainer) break;
    }

    if (!playerContainer) {
      logger("warn", getString("WARN__PLAYER_CONTAINER_NOT_FOUND"));
      // Search near audio elements
      if (plume.audioElement) {
        playerContainer = plume.audioElement.closest("div") || plume.audioElement.parentElement;
      }
    }

    if (!playerContainer) {
      logger("error", getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
      return;
    }

    // Hide or remove old player elements
    restoreOriginalPlayerElements(); // to prevent unused function
    hideOriginalPlayerElements();

    // Create main container for our enhancements
    const plumeContainer = document.createElement("div");
    plumeContainer.className = "bpe-plume";

    // Create title display
    const headerContainer = document.createElement("div");
    headerContainer.className = "bpe-header-display";

    const headerLogo = document.createElement("div");
    headerLogo.className = "bpe-header-logo";
    headerLogo.innerHTML = PLUME_SVG.logo;
    headerLogo.title = "BC-Plume - Bandcamp Player Enhancer";
    headerContainer.appendChild(headerLogo);

    const currentTitleSection = document.createElement("div");
    currentTitleSection.className = "bpe-header-current";
    const currentTitlePretext = document.createElement("span");
    currentTitlePretext.className = "bpe-header-title-pretext";
    const currentTrackNumberingString = getTrackNumberingString(getCurrentTrackTitle());
    currentTitlePretext.textContent = getString("LABEL__TRACK_CURRENT", currentTrackNumberingString);
    currentTitlePretext.style.color = getAppropriatePretextColor();
    currentTitleSection.appendChild(currentTitlePretext);
    const currentTitleText = document.createElement("span");
    currentTitleText.className = "bpe-header-title";
    const currentTrackTitle = getCurrentTrackTitle();
    currentTitleText.textContent = currentTrackTitle;
    currentTitleText.title = currentTrackTitle; // see full title on hover in case title is truncated
    currentTitleSection.appendChild(currentTitleText);
    headerContainer.appendChild(currentTitleSection);

    plume.titleDisplay = headerContainer;
    plumeContainer.appendChild(headerContainer);

    const playbackManager = document.createElement("div");
    playbackManager.className = "bpe-playback-manager";

    const progressContainer = createProgressContainer();
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

    playerContainer.appendChild(plumeContainer);

    logger("log", getString("LOG__MOUNT__COMPLETE"));
  };

  const setupAudioListeners = () => {
    if (!plume.audioElement) return;

    // Update progress container
    plume.audioElement.addEventListener("timeupdate", updateProgressBar);
    plume.audioElement.addEventListener("loadedmetadata", updateProgressBar);
    plume.audioElement.addEventListener("durationchange", updateProgressBar);

    // Update title when metadata loads (new track)
    plume.audioElement.addEventListener("loadedmetadata", updateTitleDisplay);
    plume.audioElement.addEventListener("loadedmetadata", updatePretextDisplay);
    plume.audioElement.addEventListener("loadstart", updateTitleDisplay);
    plume.audioElement.addEventListener("loadstart", updatePretextDisplay);

    // Sync volume with Plume's slider
    plume.audioElement.addEventListener("volumechange", () => {
      if (plume.volumeSlider) {
        plume.volumeSlider.value = `${Math.round(plume.audioElement!.volume * 100)}`;
        const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
          PLUME_ELEM_IDENTIFIERS.volumeValue
        ) as HTMLSpanElement;
        if (valueDisplay) {
          valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
        }

        // Save volume when it changes (even if not via our slider)
        saveNewVolume(plume.audioElement!.volume);
      }
    });

    logger("info", getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));
  };

  // Main initialization function
  const init = async () => {
    logger("info", getString("LOG__INITIALIZATION__START"));

    // Wait for the page to be fully loaded
    if (document.readyState !== "complete") {
      window.addEventListener("load", init);
      return;
    }

    plume.audioElement = await findAudioElement();
    if (!plume.audioElement) {
      logger("warn", getString("WARN__AUDIO_ELEMENT__NOT_FOUND"));
      setTimeout(init, 2000);
      return;
    }

    const plumeIsAlreadyInjected = !!document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer);
    if (plumeIsAlreadyInjected) return;

    // Inject enhancements
    await injectEnhancements();
    setupAudioListeners();
    initPlayback();

    // Debug: show detected controls
    debugBandcampControls();

    logger("log", getString("LOG__INITIALIZATION__COMPLETE"));
  };

  // Observe DOM changes for players that load dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
        if (newAudio && newAudio !== plume.audioElement) {
          logger("info", getString("INFO__NEW_AUDIO__FOUND"));

          // Load and apply saved volume to the new element
          await loadSavedVolume();
          newAudio.volume = plume.savedVolume;
          logger(
            "info",
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
          (mutation.target.classList.contains(BC_ELEM_IDENTIFIERS.onAlbumCurrentTrackTitle.slice(1)) ||
            mutation.target.querySelector(BC_ELEM_IDENTIFIERS.onAlbumCurrentTrackTitle))
        ) {
          updateTitleDisplay();
          updatePretextDisplay();
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  init();

  // Support for SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentPageUrl = location.href;
    if (currentPageUrl === lastUrl) return;

    lastUrl = currentPageUrl;
    logger("log", getString("LOG__NAVIGATION_DETECTED"));
    setTimeout(() => {
      init();
      // Update title after navigation in case the track changed
      setTimeout(updateTitleDisplay, 500);
      setTimeout(updatePretextDisplay, 600);
    }, 1000);
  }).observe(document, { subtree: true, childList: true });
})();
