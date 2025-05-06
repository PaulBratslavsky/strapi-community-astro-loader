import { vi, afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { server } from "./test/test.utils";

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => {
  server.close();
});
