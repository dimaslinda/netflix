import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
export const get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: get.url(options),
    method: 'get',
})

get.definition = {
    methods: ["get","head"],
    url: '/api/user/watch-history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
get.url = (options?: RouteQueryOptions) => {
    return get.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
get.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: get.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
get.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: get.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
    const getForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: get.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
        getForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: get.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserAccountController::get
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
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
* @see \App\Http\Controllers\UserAccountController::save
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
export const save = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: save.url(options),
    method: 'post',
})

save.definition = {
    methods: ["post"],
    url: '/api/user/watch-history',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::save
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
save.url = (options?: RouteQueryOptions) => {
    return save.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::save
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
save.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: save.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::save
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
    const saveForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: save.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::save
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
        saveForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: save.url(options),
            method: 'post',
        })
    
    save.form = saveForm
/**
* @see \App\Http\Controllers\UserAccountController::deleteMethod
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
export const deleteMethod = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(options),
    method: 'delete',
})

deleteMethod.definition = {
    methods: ["delete"],
    url: '/api/user/watch-history',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserAccountController::deleteMethod
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
deleteMethod.url = (options?: RouteQueryOptions) => {
    return deleteMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::deleteMethod
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
deleteMethod.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserAccountController::deleteMethod
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
    const deleteMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deleteMethod.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::deleteMethod
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
        deleteMethodForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deleteMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    deleteMethod.form = deleteMethodForm
/**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
export const sync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

sync.definition = {
    methods: ["post"],
    url: '/api/user/watch-history/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
    const syncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::sync
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
        syncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sync.url(options),
            method: 'post',
        })
    
    sync.form = syncForm
const history = {
    get: Object.assign(get, get),
save: Object.assign(save, save),
delete: Object.assign(deleteMethod, deleteMethod),
sync: Object.assign(sync, sync),
}

export default history