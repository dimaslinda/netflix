import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/api/user/profile',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
const profile = {
    update: Object.assign(update, update),
}

export default profile