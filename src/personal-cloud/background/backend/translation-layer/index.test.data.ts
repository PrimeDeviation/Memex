import StorageManager from '@worldbrain/storex'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export async function insertTestPages(storageManager: StorageManager) {
    await storageManager
        .collection('pages')
        .createObject(LOCAL_TEST_DATA_V24.pages.first)
    await storageManager
        .collection('pages')
        .createObject(LOCAL_TEST_DATA_V24.pages.second)
}

const LOCAL_FIRST_PAGE_V24 = {
    url: 'getmemexed.com/test',
    fullUrl: 'https://www.getmemexed.com/test',
    domain: 'getmemexed.com',
    hostname: 'www.getmemexed.com',
    fullTitle: 'getmemexed.com title',
    text: 'getmemexed.com page conmtent',
    lang: 'en-GB',
    canonicalUrl: 'https://www.getmemexed.com/test',
    description: 'getmemexed.com description',
}

export const LOCAL_TEST_DATA_V24 = {
    pages: {
        first: LOCAL_FIRST_PAGE_V24,
        second: {
            url: 'notionized.com/foo',
            fullUrl: 'https://www.notionized.com/foo',
            domain: 'notionized.com/foo',
            hostname: 'www.notionized.com/foo',
            fullTitle: 'notionized.com/foo title',
            text: 'notionized.com/foo page conmtent',
            lang: 'en-US',
            canonicalUrl: 'https://www.notionized.com/foo',
            description: 'notionized.com/foo description',
        },
    },
    visits: {
        first: {
            url: LOCAL_FIRST_PAGE_V24.url,
            time: 4545,
            duration: 1122,
            scrollMaxPerc: 100,
            scrollMaxPx: 500,
            scrollPerc: 50,
            scrollPx: 250,
        },
    },
    tags: {
        first: {
            url: LOCAL_FIRST_PAGE_V24.url,
            name: 'foo-tag',
        },
    },
}

export const REMOTE_TEST_DATA_V24 = {
    personalDeviceInfo: {
        first: {
            id: 1,
        },
    },
    personalContentMetadata: {
        first: {
            id: 1,
            createdWhen: 555,
            updatedWhen: 555,
            user: TEST_USER.id,
            createdByDevice: 1,
            canonicalUrl: 'https://www.getmemexed.com/test',
            title: 'getmemexed.com title',
        },
        second: {
            id: 2,
            createdWhen: 557,
            updatedWhen: 557,
            user: TEST_USER.id,
            createdByDevice: 1,
            canonicalUrl: 'https://www.notionized.com/foo',
            title: 'notionized.com/foo title',
        },
    },
    personalContentLocator: {
        first: {
            id: 1,
            createdWhen: 556,
            updatedWhen: 556,
            user: TEST_USER.id,
            createdByDevice: 1,
            personalContentMetadata: 1,
            contentSize: null,
            fingerprint: null,
            format: 'html',
            lastVisited: null,
            location: 'getmemexed.com/test',
            locationScheme: 'normalized-url-v1',
            locationType: 'remote',
            originalLocation: 'https://www.getmemexed.com/test',
            primary: true,
            valid: true,
            version: 0,
        },
        second: {
            id: 2,
            createdWhen: 558,
            updatedWhen: 558,
            user: TEST_USER.id,
            createdByDevice: 1,
            personalContentMetadata: 2,
            contentSize: null,
            fingerprint: null,
            format: 'html',
            lastVisited: null,
            location: 'notionized.com/foo',
            locationScheme: 'normalized-url-v1',
            locationType: 'remote',
            originalLocation: 'https://www.notionized.com/foo',
            primary: true,
            valid: true,
            version: 0,
        },
    },
    personalContentRead: {
        first: {
            id: 1,
            createdWhen: 559,
            updatedWhen: 559,
            user: TEST_USER.id,
            createdByDevice: 1,
            personalContentMetadata: 1,
            personalContentLocator: 1,
            readWhen: LOCAL_TEST_DATA_V24.visits.first.time,
            readDuration: LOCAL_TEST_DATA_V24.visits.first.duration,
            progressPercentage: LOCAL_TEST_DATA_V24.visits.first.scrollPerc,
            scrollTotal: LOCAL_TEST_DATA_V24.visits.first.scrollMaxPx,
            scrollProgress: LOCAL_TEST_DATA_V24.visits.first.scrollPx,
            pageTotal: null,
            pageProgress: null,
            durationTotal: null,
            durationProgress: null,
        },
    },
    personalTag: {
        first: {
            id: 1,
            createdByDevice: 1,
            createdWhen: 559,
            updatedWhen: 559,
            user: TEST_USER.id,
            name: 'foo-tag',
        },
    },
    personalTagConnection: {
        first: {
            id: 1,
            collection: 'personalContentMetadata',
            createdByDevice: 1,
            createdWhen: 560,
            updatedWhen: 560,
            objectId: 1,
            personalTag: 1,
            user: TEST_USER.id,
        },
    },
}
