import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/library',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LocalMediaController::index
 * @see app/Http/Controllers/LocalMediaController.php:24
 * @route '/api/library'
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
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
 */
export const stream = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stream.url(options),
    method: 'get',
})

stream.definition = {
    methods: ["get","head"],
    url: '/api/library/stream',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
 */
stream.url = (options?: RouteQueryOptions) => {
    return stream.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
 */
stream.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stream.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
 */
stream.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stream.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
 */
    const streamForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stream.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
 */
        streamForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stream.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LocalMediaController::stream
 * @see app/Http/Controllers/LocalMediaController.php:32
 * @route '/api/library/stream'
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
const media = {
    index: Object.assign(index, index),
stream: Object.assign(stream, stream),
}

export default media