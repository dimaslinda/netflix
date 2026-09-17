import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
export const get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: get.url(options),
    method: 'get',
})

get.definition = {
    methods: ["get","head"],
    url: '/api/user/bookmarks',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
get.url = (options?: RouteQueryOptions) => {
    return get.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
get.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: get.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
get.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: get.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
    const getForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: get.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
        getForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: get.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
        getForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: get.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    get.form = getForm
/**
* @see \App\Http\Controllers\UserAccountController::toggle
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
export const toggle = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})

toggle.definition = {
    methods: ["post"],
    url: '/api/user/bookmarks/toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::toggle
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
toggle.url = (options?: RouteQueryOptions) => {
    return toggle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::toggle
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
toggle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::toggle
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
    const toggleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggle.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::toggle
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
        toggleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggle.url(options),
            method: 'post',
        })
    
    toggle.form = toggleForm
/**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
export const sync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

sync.definition = {
    methods: ["post"],
    url: '/api/user/bookmarks/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
    const syncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
        syncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sync.url(options),
            method: 'post',
        })
    
    sync.form = syncForm
const bookmarks = {
    get: Object.assign(get, get),
toggle: Object.assign(toggle, toggle),
sync: Object.assign(sync, sync),
}

export default bookmarks