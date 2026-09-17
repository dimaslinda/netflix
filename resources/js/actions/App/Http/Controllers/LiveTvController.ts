import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/live-tv',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LiveTvController::index
 * @see app/Http/Controllers/LiveTvController.php:23
 * @route '/live-tv'
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
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
export const channels = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: channels.url(options),
    method: 'get',
})

channels.definition = {
    methods: ["get","head"],
    url: '/api/live-tv/channels',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
channels.url = (options?: RouteQueryOptions) => {
    return channels.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
channels.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: channels.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
channels.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: channels.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
    const channelsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: channels.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
        channelsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: channels.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LiveTvController::channels
 * @see app/Http/Controllers/LiveTvController.php:46
 * @route '/api/live-tv/channels'
 */
        channelsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: channels.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    channels.form = channelsForm
const LiveTvController = { index, channels }

export default LiveTvController