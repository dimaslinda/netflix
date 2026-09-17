import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
export const catalog = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: catalog.url(options),
    method: 'get',
})

catalog.definition = {
    methods: ["get","head"],
    url: '/api/catalog/open-movies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
catalog.url = (options?: RouteQueryOptions) => {
    return catalog.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
catalog.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: catalog.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
catalog.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: catalog.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
    const catalogForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: catalog.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
        catalogForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: catalog.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::catalog
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
        catalogForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: catalog.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    catalog.form = catalogForm
/**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
export const playable = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: playable.url(options),
    method: 'get',
})

playable.definition = {
    methods: ["get","head"],
    url: '/api/catalog/playable',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
playable.url = (options?: RouteQueryOptions) => {
    return playable.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
playable.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: playable.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
playable.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: playable.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
    const playableForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: playable.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
        playableForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: playable.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::playable
 * @see app/Http/Controllers/ArchiveController.php:33
 * @route '/api/catalog/playable'
 */
        playableForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: playable.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    playable.form = playableForm
/**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
export const search = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/api/catalog/archive',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
search.url = (options?: RouteQueryOptions) => {
    return search.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
search.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
search.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
    const searchForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: search.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
        searchForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: search.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::search
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
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
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
export const metadata = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metadata.url(args, options),
    method: 'get',
})

metadata.definition = {
    methods: ["get","head"],
    url: '/api/catalog/archive/{identifier}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
metadata.url = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { identifier: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    identifier: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        identifier: args.identifier,
                }

    return metadata.definition.url
            .replace('{identifier}', parsedArgs.identifier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
metadata.get = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metadata.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
metadata.head = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: metadata.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
    const metadataForm = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: metadata.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
        metadataForm.get = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: metadata.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::metadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
        metadataForm.head = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: metadata.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    metadata.form = metadataForm
const ArchiveController = { catalog, playable, search, metadata }

export default ArchiveController