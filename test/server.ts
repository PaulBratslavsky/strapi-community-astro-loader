import { setupServer } from "msw/node";
import { handlers } from "./handlers";
import { BASE_URL, PAGES, TYPE } from "./constants";

export const server = setupServer(...handlers(BASE_URL, { [TYPE]: PAGES }));
