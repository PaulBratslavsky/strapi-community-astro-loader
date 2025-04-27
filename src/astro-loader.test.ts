import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it} from "vitest";
import {strapiLoader} from "./astro-loader";
import type {Loader, LoaderContext} from "astro/loaders";
import {mockLoaderContext, PAGES, server, TYPE} from "./test.utils";

describe('#load', () => {
    const ONE_SECOND = 1000
    const TEN_SECONDS = ONE_SECOND * 10
    const THIRTY_SECONDS = ONE_SECOND * 30
    let loader: Loader
    let context: LoaderContext

    // TODO: move to setup-test
    beforeAll(() => {
        server.listen()
    })

    afterEach(() => {
        server.resetHandlers()
    })

    afterAll(() => {
        server.close()
    })

    it('should name loader based on content type', () => {
        const expectedLoaderName = 'strapi-testType';
        const {name} = strapiLoader({contentType: TYPE})
        expect(name).toEqual(expectedLoaderName)
    })

    describe('with recent sync', async () => {
        beforeEach(() => {
            // TODO: mock Date.now
            const tenSecondsAgo = Date.now() - TEN_SECONDS
            context = mockLoaderContext({lastSynced: String(tenSecondsAgo)})
            loader = strapiLoader({contentType: TYPE, syncInterval: THIRTY_SECONDS})
        })

        it('should skip syncing if it was recently synced', async () => {
            await loader.load(context)
            expect(context.store.clear).not.toHaveBeenCalled()
            expect(context.store.set).not.toHaveBeenCalled()
        })
    })

    describe('with stale sync', async () => {
        beforeEach(() => {
            // TODO: mock Date.now
            const thirtySecondsAgo = Date.now() - THIRTY_SECONDS
            context = mockLoaderContext({lastSynced: String(thirtySecondsAgo)})
            loader = strapiLoader({contentType: TYPE, syncInterval: TEN_SECONDS})
        })

        it('should fetch content types', async () => {
            const expectedDataStoreEntries = PAGES.map(page => ({
                id: page.id,
                data: page
            }))
            await loader.load(context)
            expect(context.store.clear).toHaveBeenCalledOnce()
            expect(context.store.set).toHaveBeenCalledTimes(PAGES.length)
            expect(context.store.set).toHaveBeenNthCalledWith(1, expectedDataStoreEntries[0])
            expect(context.store.set).toHaveBeenNthCalledWith(2, expectedDataStoreEntries[1])
            expect(context.meta.set).toHaveBeenCalledExactlyOnceWith("lastSynced", expect.any(String))
        })
    })

    describe('without previous sync', async () => {
        beforeEach(() => {
            context = mockLoaderContext()
            loader = strapiLoader({contentType: TYPE})
        })

        it.todo('in theory, we should do every test from the stale sync scenario.')
    })
})
