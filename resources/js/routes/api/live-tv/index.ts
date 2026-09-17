import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
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
const liveTv = {
    channels: Object.assign(channels, channels),
}

export default liveTv