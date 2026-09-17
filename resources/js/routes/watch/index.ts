import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
 * @see routes/web.php:55
 * @route '/tonton'
 */
export const direct = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: direct.url(options),
    method: 'get',
})

direct.definition = {
    methods: ["get","head"],
    url: '/tonton',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:55
 * @route '/tonton'
 */
direct.url = (options?: RouteQueryOptions) => {
    return direct.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:55
 * @route '/tonton'
 */
direct.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: direct.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:55
 * @route '/tonton'
 */
direct.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: direct.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:55
 * @route '/tonton'
 */
    const directForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: direct.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:55
 * @route '/tonton'
 */
        directForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: direct.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:55
 * @route '/tonton'
 */
        directForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: direct.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    direct.form = directForm