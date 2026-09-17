import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/api/user/password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
const password = {
    update: Object.assign(update, update),
}

export default password