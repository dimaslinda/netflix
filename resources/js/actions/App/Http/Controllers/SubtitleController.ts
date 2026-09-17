import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
export const searchByTmdb = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByTmdb.url(options),
    method: 'get',
})

searchByTmdb.definition = {
    methods: ["get","head"],
    url: '/api/subtitles/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
searchByTmdb.url = (options?: RouteQueryOptions) => {
    return searchByTmdb.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
searchByTmdb.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByTmdb.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
searchByTmdb.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchByTmdb.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
    const searchByTmdbForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: searchByTmdb.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
        searchByTmdbForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchByTmdb.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::searchByTmdb
 * @see app/Http/Controllers/SubtitleController.php:32
 * @route '/api/subtitles/search'
 */
        searchByTmdbForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchByTmdb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    searchByTmdb.form = searchByTmdbForm
/**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
export const searchByQuery = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByQuery.url(options),
    method: 'get',
})

searchByQuery.definition = {
    methods: ["get","head"],
    url: '/api/subtitles/search/query',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
searchByQuery.url = (options?: RouteQueryOptions) => {
    return searchByQuery.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
searchByQuery.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByQuery.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
searchByQuery.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchByQuery.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
    const searchByQueryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: searchByQuery.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
        searchByQueryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchByQuery.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::searchByQuery
 * @see app/Http/Controllers/SubtitleController.php:68
 * @route '/api/subtitles/search/query'
 */
        searchByQueryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchByQuery.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    searchByQuery.form = searchByQueryForm
/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:117
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
 * @see app/Http/Controllers/SubtitleController.php:117
 * @route '/api/subtitles/languages'
 */
languages.url = (options?: RouteQueryOptions) => {
    return languages.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:117
 * @route '/api/subtitles/languages'
 */
languages.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: languages.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:117
 * @route '/api/subtitles/languages'
 */
languages.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: languages.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:117
 * @route '/api/subtitles/languages'
 */
    const languagesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: languages.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:117
 * @route '/api/subtitles/languages'
 */
        languagesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: languages.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SubtitleController::languages
 * @see app/Http/Controllers/SubtitleController.php:117
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
const SubtitleController = { searchByTmdb, searchByQuery, languages, stream }

export default SubtitleController