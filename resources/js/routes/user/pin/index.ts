import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/api/user/pin',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::update
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
const pin = {
    update: Object.assign(update, update),
}

export default pin