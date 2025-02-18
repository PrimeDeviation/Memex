import type { User } from 'src/social-integration/types'
import type SearchStorage from './storage'
import type { Annotation } from 'src/annotations/types'
import type { PageIndexingBackground } from 'src/page-indexing/background'
import type { Annotation as _Annotation } from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export type SearchResultAnnotation = Annotation & {
    lists: number[]
    privacyLevel: AnnotationPrivacyLevels
}

export interface SearchResultPage {
    url: string
    fullUrl: string | null
    fullPdfUrl?: string
    fullTitle?: string
    /** Object URL to the in-memory location of the assoc. fav-icon. */
    favIcon?: string
    displayTime: number
    annotations: SearchResultAnnotation[]
    totalAnnotationsCount: number
    pageId?: string
    lists: number[]
    text: string
}

export interface AnnotSearchParams {
    /** Main text to search against annot (pre-processed). */
    query?: string
    /** Main text terms to search against annot (post-processed). */
    termsInc?: string[]
    termsExc?: string[]
    /** Collections to include (all results must be of pages in this collection). */
    collections?: number[]
    /** Tags to include (all results must have these tags). */
    tagsInc?: string[]
    /** Tags to exclude (no results can have these tags). */
    tagsExc?: string[]
    /** Same idea as tags, but for domains (['google.com', 'twitter.com']). */
    domainsInc?: string[]
    domainsExc?: string[]
    /** Lower-bound for time filter (all results must be created AFTER this time). */
    startDate?: Date | number
    /** Upper-bound for time filter (all results must be created BEFORE this time). */
    endDate?: Date | number
    /** If defined, confines search to a particular page. */
    url?: string
    /** Use for pagination (result skip may not be possible). */
    limit?: number
    skip?: number
    /** Denotes whether or not to limit search to annotations on a bookmarked page. */
    bookmarksOnly?: boolean
    /** Denotes whether or not to include highlighted text (body) in search. */
    includeHighlights?: boolean
    /** Denotes whether or not to include comments/notes in search. */
    includeNotes?: boolean
    /** Denotes whether or not to include direct links in search. */
    includeDirectLinks?: boolean
    /** Denotes whether or not to return the assoc. pages with matched annots. */
    includePageResults?: boolean
}

/**
 * Maps day (start of day timestamp) to list of pages that have annots created/edited
 * on that day.
 */
export interface PageUrlsByDay {
    [day: number]: AnnotsByPageUrl
}

export interface AnnotsByPageUrl {
    [pageUrl: string]: Annotation[]
}

export interface SocialSearchParams extends AnnotSearchParams {
    usersInc?: User[]
    usersExc?: User[]
    hashtagsInc?: string[]
    hashtagsExc?: string[]
}

export interface StandardSearchResponse {
    resultsExhausted: boolean
    totalCount?: number
    docs: SearchResultPage[]
    isBadTerm?: boolean
}

export interface RemoteSearchInterface {
    unifiedSearch: (
        params: UnifiedSearchParams & UnifiedSearchPaginationParams,
    ) => Promise<UnifiedSearchResult>
    suggest: SearchStorage['suggest']
    extendedSuggest: SearchStorage['suggestExtended']
    delPages: PageIndexingBackground['delPages']
    resolvePdfPageFullUrls: (
        url: string,
    ) => Promise<{
        fullUrl: string
        fullPdfUrl: string
        originalLocation: string
    }>
}

export type UnifiedSearchParams = TermsSearchOpts & {
    query: string
    terms?: string[]
    phrases?: string[]
    fromWhen?: number
    untilWhen?: number
    filterByDomains: string[]
    filterByListIds: number[]
    filterByPDFs?: boolean
    filterByVideos?: boolean
    filterByTweets?: boolean
    filterByEvents?: boolean
    omitPagesWithoutAnnotations?: boolean
}

export interface TermsSearchOpts {
    /** Set to enable fuzzy startsWith terms matching, instead of exact match. */
    matchTermsFuzzyStartsWith?: boolean
    matchPageText?: boolean
    matchPageTitleUrl?: boolean
    matchHighlights?: boolean
    matchNotes?: boolean
}

export interface UnifiedSearchPaginationParams {
    skip: number
    limit: number
}

export type UnifiedTermsSearchParams = UnifiedSearchParams &
    UnifiedSearchPaginationParams & {
        queryPages: (
            terms: string[],
            phrases?: string[],
        ) => Promise<Array<{ id: string; latestTimestamp: number }>>
        queryAnnotations: (
            terms: string[],
            phrases?: string[],
        ) => Promise<_Annotation[]>
    }

/**
 * Note that, unlike terms search, blank search does not use the traditional pagination params.
 * Instead it expects the caller to keep a state of the oldest search result so far
 * (which gets returned from blank searches) and supply that as the new upper time bound
 * for subsequent blank search pages.
 */
export type UnifiedBlankSearchParams = UnifiedSearchParams &
    Pick<UnifiedSearchPaginationParams, 'limit'> & {
        /** This is how pagination is afforded for blank search. Set to page N's `oldestResultTimestamp` to get page N+1. */
        untilWhen: number
        /** The time of the oldest visit/bookmark/annotation to determine results exhausted or not. */
        lowestTimeBound: number
    }

export type UnifiedSearchResult = {
    docs: SearchResultPage[]
    resultsExhausted: boolean
    oldestResultTimestamp: number
}

export type IntermediarySearchResult = {
    resultsExhausted: boolean
    resultDataByPage: ResultDataByPage
    /** Always null for terms search. */
    oldestResultTimestamp: number | null
}

export type ResultDataByPage = Map<string, UnifiedSearchPageResultData>

export type UnifiedSearchPageResultData = {
    annotations: Annotation[]
    /**
     * Contains the latest timestamp associated with the page bookmark or visits. Not annotation.
     * Used primarily for sorting and display in UI.
     */
    latestPageTimestamp: number
    /**
     * Contains the oldest timestamp associated with the page, including bookmarks, visits, or annotations.
     * Used for paging back through blank search results (oldest timestamp of batch N is the upper bound for batch N+1)
     */
    oldestTimestamp: number
}

export type UnifiedSearchLookupData = {
    pages: Map<string, Omit<SearchResultPage, 'annotations' | 'hasBookmark'>>
    annotations: Map<string, SearchResultAnnotation>
}
