import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
export const category = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: category.url(args, options),
    method: 'get',
})

category.definition = {
    methods: ["get","head"],
    url: '/browse/{category}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
category.url = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    category: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        category: args.category,
                }

    return category.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
category.get = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: category.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
category.head = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: category.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
    const categoryForm = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: category.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
        categoryForm.get = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: category.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MovieController::category
 * @see app/Http/Controllers/MovieController.php:147
 * @route '/browse/{category}'
 */
        categoryForm.head = (args: { category: string | number } | [category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: category.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    category.form = categoryForm
const browse = {
    category: Object.assign(category, category),
}

export default browse