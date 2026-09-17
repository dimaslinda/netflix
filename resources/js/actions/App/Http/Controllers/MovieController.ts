import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::index
 * @see app/Http/Controllers/MovieController.php:19
 * @route '/'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
export const searchPage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchPage.url(options),
    method: 'get',
})

searchPage.definition = {
    methods: ["get","head"],
    url: '/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
searchPage.url = (options?: RouteQueryOptions) => {
    return searchPage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
searchPage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchPage.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
searchPage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchPage.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
    const searchPageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: searchPage.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
        searchPageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchPage.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::searchPage
 * @see app/Http/Controllers/MovieController.php:89
 * @route '/search'
 */
        searchPageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchPage.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    searchPage.form = searchPageForm
/**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
 */
export const search = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/api/tmdb/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
 */
search.url = (options?: RouteQueryOptions) => {
    return search.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
 */
search.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
 */
search.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
 */
    const searchForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: search.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
 */
        searchForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: search.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::search
 * @see app/Http/Controllers/MovieController.php:72
 * @route '/api/tmdb/search'
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
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
export const details = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: details.url(args, options),
    method: 'get',
})

details.definition = {
    methods: ["get","head"],
    url: '/api/tmdb/{type}/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
details.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return details.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
details.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: details.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
details.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: details.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
    const detailsForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: details.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
        detailsForm.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: details.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::details
 * @see app/Http/Controllers/MovieController.php:106
 * @route '/api/tmdb/{type}/{id}'
 */
        detailsForm.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: details.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    details.form = detailsForm
/**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
export const videos = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: videos.url(args, options),
    method: 'get',
})

videos.definition = {
    methods: ["get","head"],
    url: '/api/tmdb/{type}/{id}/videos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
videos.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return videos.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
videos.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: videos.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
videos.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: videos.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
    const videosForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: videos.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
        videosForm.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: videos.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::videos
 * @see app/Http/Controllers/MovieController.php:124
 * @route '/api/tmdb/{type}/{id}/videos'
 */
        videosForm.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: videos.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    videos.form = videosForm
/**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
export const tvSeason = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tvSeason.url(args, options),
    method: 'get',
})

tvSeason.definition = {
    methods: ["get","head"],
    url: '/api/tmdb/tv/{id}/season/{season}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
tvSeason.url = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                    season: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                                season: args.season,
                }

    return tvSeason.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{season}', parsedArgs.season.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
tvSeason.get = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tvSeason.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
tvSeason.head = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: tvSeason.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
    const tvSeasonForm = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: tvSeason.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
        tvSeasonForm.get = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tvSeason.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::tvSeason
 * @see app/Http/Controllers/MovieController.php:140
 * @route '/api/tmdb/tv/{id}/season/{season}'
 */
        tvSeasonForm.head = (args: { id: string | number, season: string | number } | [id: string | number, season: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tvSeason.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    tvSeason.form = tvSeasonForm
/**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
export const browseCategory = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browseCategory.url(args, options),
    method: 'get',
})

browseCategory.definition = {
    methods: ["get","head"],
    url: '/browse/{category}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
browseCategory.url = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    category: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        category: args.category,
                }

    return browseCategory.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
browseCategory.get = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browseCategory.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
browseCategory.head = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: browseCategory.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
    const browseCategoryForm = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: browseCategory.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
        browseCategoryForm.get = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: browseCategory.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::browseCategory
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
        browseCategoryForm.head = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: browseCategory.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    browseCategory.form = browseCategoryForm
const MovieController = { index, searchPage, search, details, videos, tvSeason, browseCategory }

export default MovieController