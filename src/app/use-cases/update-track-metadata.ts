import { getTrackQuantifiers } from "@/app/features/track-quantifiers";
import { coreActions, IAppCore } from "@/domain/ports/app-core";
import type { BcPlayerPort } from "@/domain/ports/bc-player";
import { getString } from "@/shared/i18n";

export interface TrackMetadataResult {
  trackTitle: string;
  trackNumberText: string;
  current: number;
  total: number;
}

// Dispatches current track title and track number from BC player state to the store
export const updateTrackMetadata = (appCore: IAppCore, bcPlayer: BcPlayerPort): TrackMetadataResult => {
  const isAlbumPage = appCore.getState().pageType === "album";

  const trackTitle = bcPlayer.getTrackTitle(isAlbumPage ? "album" : "track") ?? getString("LABEL__TRACK_UNKNOWN");
  appCore.dispatch(coreActions.setTrackTitle(trackTitle));

  const { current, total } = getTrackQuantifiers(trackTitle, bcPlayer);

  const trackNumberText = isAlbumPage
    ? getString("LABEL__TRACK_CURRENT", [`${current}/${total}`])
    : getString("LABEL__TRACK");

  appCore.dispatch(coreActions.setTrackNumber(trackNumberText));

  return { trackTitle, trackNumberText, current, total };
};
