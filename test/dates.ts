export const NOW = new Date(2000, 1, 1, 13);
export const NOW_STR = String(NOW.getTime());
export const ONE_SECOND_IN_MS = 1000;

export const TEN_SECONDS_IN_MS = ONE_SECOND_IN_MS * 10;
export const TEN_SECONDS_AGO = new Date(NOW.getTime() - TEN_SECONDS_IN_MS);
export const TEN_SECONDS_AGO_STR = String(TEN_SECONDS_AGO.getTime());

export const THIRTY_SECONDS_IN_MS = ONE_SECOND_IN_MS * 30;
export const THIRTY_SECONDS_AGO = new Date(
  NOW.getTime() - THIRTY_SECONDS_IN_MS,
);
export const THIRTY_SECONDS_AGO_STR = String(THIRTY_SECONDS_AGO.getTime());
