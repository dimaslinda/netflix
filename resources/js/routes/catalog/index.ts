import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
export const openMovies = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: openMovies.url(options),
    method: 'get',
})

openMovies.definition = {
    methods: ["get","head"],
    url: '/api/catalog/open-movies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
openMovies.url = (options?: RouteQueryOptions) => {
    return openMovies.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
openMovies.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: openMovies.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
openMovies.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: openMovies.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
    const openMoviesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: openMovies.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
        openMoviesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: openMovies.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::openMovies
 * @see app/Http/Controllers/ArchiveController.php:62
 * @route '/api/catalog/open-movies'
 */
        openMoviesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: openMovies.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    openMovies.form = openMoviesForm
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
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
export const archive = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: archive.url(options),
    method: 'get',
})

archive.definition = {
    methods: ["get","head"],
    url: '/api/catalog/archive',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
archive.url = (options?: RouteQueryOptions) => {
    return archive.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
archive.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: archive.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
archive.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: archive.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
    const archiveForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: archive.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
        archiveForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: archive.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::archive
 * @see app/Http/Controllers/ArchiveController.php:73
 * @route '/api/catalog/archive'
 */
        archiveForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: archive.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    archive.form = archiveForm
/**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
export const archiveMetadata = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: archiveMetadata.url(args, options),
    method: 'get',
})

archiveMetadata.definition = {
    methods: ["get","head"],
    url: '/api/catalog/archive/{identifier}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
archiveMetadata.url = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return archiveMetadata.definition.url
            .replace('{identifier}', parsedArgs.identifier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
archiveMetadata.get = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: archiveMetadata.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
archiveMetadata.head = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: archiveMetadata.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
    const archiveMetadataForm = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: archiveMetadata.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
        archiveMetadataForm.get = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: archiveMetadata.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ArchiveController::archiveMetadata
 * @see app/Http/Controllers/ArchiveController.php:111
 * @route '/api/catalog/archive/{identifier}'
 */
        archiveMetadataForm.head = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: archiveMetadata.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    archiveMetadata.form = archiveMetadataForm
const catalog = {
    openMovies: Object.assign(openMovies, openMovies),
playable: Object.assign(playable, playable),
archive: Object.assign(archive, archive),
archiveMetadata: Object.assign(archiveMetadata, archiveMetadata),
}

export default catalog