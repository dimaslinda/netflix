import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
export const search = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/api/subtitles/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
search.url = (options?: RouteQueryOptions) => {
    return search.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
search.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
search.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
    const searchForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: search.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
        searchForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: search.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::search
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
        searchForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: search.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    search.form = searchForm
/**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
export const searchQuery = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchQuery.url(options),
    method: 'get',
})

searchQuery.definition = {
    methods: ["get","head"],
    url: '/api/subtitles/search/query',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
searchQuery.url = (options?: RouteQueryOptions) => {
    return searchQuery.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
searchQuery.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchQuery.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
searchQuery.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchQuery.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
    const searchQueryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: searchQuery.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
        searchQueryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchQuery.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::searchQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
        searchQueryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchQuery.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    searchQuery.form = searchQueryForm
/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
export const languages = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: languages.url(options),
    method: 'get',
})

languages.definition = {
    methods: ["get","head"],
    url: '/api/subtitles/languages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
languages.url = (options?: RouteQueryOptions) => {
    return languages.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
languages.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: languages.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
languages.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: languages.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
    const languagesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: languages.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
        languagesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: languages.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:119
 * @route '/api/subtitles/languages'
 */
        languagesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: languages.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    languages.form = languagesForm
/**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
export const stream = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stream.url(options),
    method: 'get',
})

stream.definition = {
    methods: ["get","head"],
    url: '/api/subtitles/stream',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
stream.url = (options?: RouteQueryOptions) => {
    return stream.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
stream.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stream.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
stream.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stream.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
    const streamForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stream.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
        streamForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stream.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::stream
 * @see app/Http/Controllers/SubtitleController.php:94
 * @route '/api/subtitles/stream'
 */
        streamForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stream.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stream.form = streamForm
const subtitles = {
    search: Object.assign(search, search),
searchQuery: Object.assign(searchQuery, searchQuery),
languages: Object.assign(languages, languages),
stream: Object.assign(stream, stream),
}

export default subtitles