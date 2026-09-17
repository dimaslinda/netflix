import MovieController from './MovieController'
import LiveTvController from './LiveTvController'
import UserAccountController from './UserAccountController'
import SubtitleController from './SubtitleController'
import PlaybackController from './PlaybackController'
import LocalMediaController from './LocalMediaController'
import ArchiveController from './ArchiveController'
import Settings from './Settings'
const Controllers = {
    MovieController: Object.assign(MovieController, MovieController),
LiveTvController: Object.assign(LiveTvController, LiveTvController),
UserAccountController: Object.assign(UserAccountController, UserAccountController),
SubtitleController: Object.assign(SubtitleController, SubtitleController),
PlaybackController: Object.assign(PlaybackController, PlaybackController),
LocalMediaController: Object.assign(LocalMediaController, LocalMediaController),
ArchiveController: Object.assign(ArchiveController, ArchiveController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers