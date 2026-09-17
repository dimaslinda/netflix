import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
export const providers = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: providers.url(options),
    method: 'get',
})

providers.definition = {
    methods: ["get","head"],
    url: '/api/playback/providers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
providers.url = (options?: RouteQueryOptions) => {
    return providers.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
providers.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: providers.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
providers.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: providers.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
    const providersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: providers.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
        providersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: providers.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PlaybackController::providers
 * @see app/Http/Controllers/PlaybackController.php:18
 * @route '/api/playback/providers'
 */
        providersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: providers.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    providers.form = providersForm
/**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
export const resolve = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resolve.url(options),
    method: 'get',
})

resolve.definition = {
    methods: ["get","head"],
    url: '/api/playback/resolve',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
resolve.url = (options?: RouteQueryOptions) => {
    return resolve.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
resolve.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resolve.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
resolve.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: resolve.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
    const resolveForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: resolve.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
        resolveForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: resolve.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PlaybackController::resolve
 * @see app/Http/Controllers/PlaybackController.php:26
 * @route '/api/playback/resolve'
 */
        resolveForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: resolve.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    resolve.form = resolveForm
const PlaybackController = { providers, resolve }

export default PlaybackController