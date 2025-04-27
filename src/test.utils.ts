import type {LoaderContext} from "astro/loaders";
import {vi} from "vitest";
import {http, HttpResponse} from 'msw'
import {setupServer} from "msw/node";

export function mockLoaderContext(config?: { lastSynced?: string }): LoaderContext {
    return {
        store: {
            clear: vi.fn(),
            set: vi.fn()
        },
        meta: {
            get: vi.fn((key: string) => key === 'lastSynced' ? config?.lastSynced : undefined),
            set: vi.fn(),
            has: vi.fn(),
            delete: vi.fn(),
        },
        logger: {
            info: vi.fn(),
            error: vi.fn(),
        }
    } as unknown as LoaderContext
}


export function handlers(url: string, contentTypes: Record<string, object>) {
    return Object.keys(contentTypes).map(contentType => {
        const contentTypeUrl = `${url}/api/${contentType}s`
        const schemaUrl = `${url}/get-strapi-schema/schema/${contentType}`
        return [
            http.get(contentTypeUrl, () => {
                return HttpResponse.json({data: contentTypes[contentType]})
            }),
            // TODO: what does this return?
            http.get(schemaUrl, () => {
                return HttpResponse.json({attributes: {}})
            }),
        ]
    }).flat()
}

const ABOUT_PAGE = {
    id: 6,
    documentId: "gny2yrqho5t9o4okxjqlpwqn",
    title: "About",
    description: "About page.",
    slug: "about",
    createdAt: "2025-03-05T19:13:40.938Z",
    updatedAt: "2025-04-26T20:18:50.480Z",
    publishedAt: "2025-04-26T20:18:50.488Z"
};
const COMPANY_PAGE = {
    id: 4,
    documentId: "dje64j42rlsry0p7lpnt87nb",
    title: "Our Company",
    description: "This will be page about our company.",
    slug: "our-company",
    createdAt: "2025-04-12T04:11:15.114Z",
    updatedAt: "2025-04-12T04:11:15.114Z",
    publishedAt: "2025-04-12T04:11:15.122Z"
};
export const PAGES = [
    COMPANY_PAGE,
    ABOUT_PAGE
]
const BASE_URL = "http://localhost:1337";
export const TYPE = "testType";
export const server = setupServer(...handlers(BASE_URL, {[TYPE]: PAGES}))
