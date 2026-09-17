import history from './history'
import bookmarks from './bookmarks'
import profile from './profile'
import password from './password'
import pin from './pin'
const user = {
    history: Object.assign(history, history),
bookmarks: Object.assign(bookmarks, bookmarks),
profile: Object.assign(profile, profile),
password: Object.assign(password, password),
pin: Object.assign(pin, pin),
}

export default user