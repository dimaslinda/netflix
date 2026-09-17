import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
export const getWatchHistory = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getWatchHistory.url(options),
    method: 'get',
})

getWatchHistory.definition = {
    methods: ["get","head"],
    url: '/api/user/watch-history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
getWatchHistory.url = (options?: RouteQueryOptions) => {
    return getWatchHistory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
getWatchHistory.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getWatchHistory.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
getWatchHistory.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getWatchHistory.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
    const getWatchHistoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getWatchHistory.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
        getWatchHistoryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getWatchHistory.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserAccountController::getWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:15
 * @route '/api/user/watch-history'
 */
        getWatchHistoryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getWatchHistory.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getWatchHistory.form = getWatchHistoryForm
/**
* @see \App\Http\Controllers\UserAccountController::saveWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
export const saveWatchHistory = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: saveWatchHistory.url(options),
    method: 'post',
})

saveWatchHistory.definition = {
    methods: ["post"],
    url: '/api/user/watch-history',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::saveWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
saveWatchHistory.url = (options?: RouteQueryOptions) => {
    return saveWatchHistory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::saveWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
saveWatchHistory.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: saveWatchHistory.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::saveWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
    const saveWatchHistoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: saveWatchHistory.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::saveWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:36
 * @route '/api/user/watch-history'
 */
        saveWatchHistoryForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: saveWatchHistory.url(options),
            method: 'post',
        })
    
    saveWatchHistory.form = saveWatchHistoryForm
/**
* @see \App\Http\Controllers\UserAccountController::deleteWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
export const deleteWatchHistory = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteWatchHistory.url(options),
    method: 'delete',
})

deleteWatchHistory.definition = {
    methods: ["delete"],
    url: '/api/user/watch-history',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserAccountController::deleteWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
deleteWatchHistory.url = (options?: RouteQueryOptions) => {
    return deleteWatchHistory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::deleteWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
deleteWatchHistory.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteWatchHistory.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserAccountController::deleteWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
    const deleteWatchHistoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deleteWatchHistory.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::deleteWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:85
 * @route '/api/user/watch-history'
 */
        deleteWatchHistoryForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deleteWatchHistory.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    deleteWatchHistory.form = deleteWatchHistoryForm
/**
* @see \App\Http\Controllers\UserAccountController::syncWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
export const syncWatchHistory = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncWatchHistory.url(options),
    method: 'post',
})

syncWatchHistory.definition = {
    methods: ["post"],
    url: '/api/user/watch-history/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::syncWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
syncWatchHistory.url = (options?: RouteQueryOptions) => {
    return syncWatchHistory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::syncWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
syncWatchHistory.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncWatchHistory.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::syncWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
    const syncWatchHistoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: syncWatchHistory.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::syncWatchHistory
 * @see app/Http/Controllers/UserAccountController.php:110
 * @route '/api/user/watch-history/sync'
 */
        syncWatchHistoryForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: syncWatchHistory.url(options),
            method: 'post',
        })
    
    syncWatchHistory.form = syncWatchHistoryForm
/**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
export const getBookmarks = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getBookmarks.url(options),
    method: 'get',
})

getBookmarks.definition = {
    methods: ["get","head"],
    url: '/api/user/bookmarks',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
getBookmarks.url = (options?: RouteQueryOptions) => {
    return getBookmarks.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
getBookmarks.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getBookmarks.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
getBookmarks.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getBookmarks.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
    const getBookmarksForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getBookmarks.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
        getBookmarksForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getBookmarks.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserAccountController::getBookmarks
 * @see app/Http/Controllers/UserAccountController.php:157
 * @route '/api/user/bookmarks'
 */
        getBookmarksForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getBookmarks.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getBookmarks.form = getBookmarksForm
/**
* @see \App\Http\Controllers\UserAccountController::toggleBookmark
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
export const toggleBookmark = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleBookmark.url(options),
    method: 'post',
})

toggleBookmark.definition = {
    methods: ["post"],
    url: '/api/user/bookmarks/toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::toggleBookmark
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
toggleBookmark.url = (options?: RouteQueryOptions) => {
    return toggleBookmark.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::toggleBookmark
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
toggleBookmark.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleBookmark.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::toggleBookmark
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
    const toggleBookmarkForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleBookmark.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::toggleBookmark
 * @see app/Http/Controllers/UserAccountController.php:173
 * @route '/api/user/bookmarks/toggle'
 */
        toggleBookmarkForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleBookmark.url(options),
            method: 'post',
        })
    
    toggleBookmark.form = toggleBookmarkForm
/**
* @see \App\Http\Controllers\UserAccountController::syncBookmarks
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
export const syncBookmarks = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncBookmarks.url(options),
    method: 'post',
})

syncBookmarks.definition = {
    methods: ["post"],
    url: '/api/user/bookmarks/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::syncBookmarks
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
syncBookmarks.url = (options?: RouteQueryOptions) => {
    return syncBookmarks.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::syncBookmarks
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
syncBookmarks.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncBookmarks.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::syncBookmarks
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
    const syncBookmarksForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: syncBookmarks.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::syncBookmarks
 * @see app/Http/Controllers/UserAccountController.php:229
 * @route '/api/user/bookmarks/sync'
 */
        syncBookmarksForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: syncBookmarks.url(options),
            method: 'post',
        })
    
    syncBookmarks.form = syncBookmarksForm
/**
* @see \App\Http\Controllers\UserAccountController::updateProfile
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
export const updateProfile = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateProfile.url(options),
    method: 'post',
})

updateProfile.definition = {
    methods: ["post"],
    url: '/api/user/profile',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::updateProfile
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
updateProfile.url = (options?: RouteQueryOptions) => {
    return updateProfile.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::updateProfile
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
updateProfile.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateProfile.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::updateProfile
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
    const updateProfileForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateProfile.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::updateProfile
 * @see app/Http/Controllers/UserAccountController.php:304
 * @route '/api/user/profile'
 */
        updateProfileForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateProfile.url(options),
            method: 'post',
        })
    
    updateProfile.form = updateProfileForm
/**
* @see \App\Http\Controllers\UserAccountController::updatePassword
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
export const updatePassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword.url(options),
    method: 'post',
})

updatePassword.definition = {
    methods: ["post"],
    url: '/api/user/password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::updatePassword
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
updatePassword.url = (options?: RouteQueryOptions) => {
    return updatePassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::updatePassword
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
updatePassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::updatePassword
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
    const updatePasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::updatePassword
 * @see app/Http/Controllers/UserAccountController.php:339
 * @route '/api/user/password'
 */
        updatePasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword.url(options),
            method: 'post',
        })
    
    updatePassword.form = updatePasswordForm
/**
* @see \App\Http\Controllers\UserAccountController::updatePin
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
export const updatePin = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePin.url(options),
    method: 'post',
})

updatePin.definition = {
    methods: ["post"],
    url: '/api/user/pin',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserAccountController::updatePin
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
updatePin.url = (options?: RouteQueryOptions) => {
    return updatePin.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::updatePin
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
updatePin.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePin.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserAccountController::updatePin
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
    const updatePinForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePin.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::updatePin
 * @see app/Http/Controllers/UserAccountController.php:364
 * @route '/api/user/pin'
 */
        updatePinForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePin.url(options),
            method: 'post',
        })
    
    updatePin.form = updatePinForm
/**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
export const accountPage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountPage.url(options),
    method: 'get',
})

accountPage.definition = {
    methods: ["get","head"],
    url: '/account',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
accountPage.url = (options?: RouteQueryOptions) => {
    return accountPage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
accountPage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountPage.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
accountPage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: accountPage.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
    const accountPageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: accountPage.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
        accountPageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountPage.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserAccountController::accountPage
 * @see app/Http/Controllers/UserAccountController.php:280
 * @route '/account'
 */
        accountPageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountPage.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    accountPage.form = accountPageForm
const UserAccountController = { getWatchHistory, saveWatchHistory, deleteWatchHistory, syncWatchHistory, getBookmarks, toggleBookmark, syncBookmarks, updateProfile, updatePassword, updatePin, accountPage }

export default UserAccountController