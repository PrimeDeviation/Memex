import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import type { AuthDialogMode } from 'src/authentication/components/AuthDialog/types'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'

export interface Dependencies {
    authBG: AuthRemoteFunctionsInterface
    personalCloudBG: PersonalCloudRemoteInterface
    navToDashboard: () => void
    navToGuidedTutorial: () => void
    contentScriptsBG: ContentScriptsInterface<'caller'>
    analyticsBG?: AnalyticsCoreInterface
}

export interface State {
    loadState: UITaskState
    syncState: UITaskState
    authDialogMode?: AuthDialogMode
    step: 'tutorial' | 'sync'
    shouldShowLogin: boolean
    newSignUp: boolean
    mode: 'signup' | 'login'
    email: string
    password: string
    passwordConfirm: string
    displayName: string
    passwordMatch: boolean
    preventOnboardingFlow: boolean
    autoLoginState: UITaskState
    showSyncNotification?: boolean
    showOnboardingSelection?: boolean
    showOnboardingVideo?: boolean
    welcomeStep: string
    enableNudges: boolean
}

export type Event = UIEvent<{
    finishOnboarding: null
    goToSyncStep: null
    goToGuidedTutorial: null
    onUserLogIn: { newSignUp?: boolean }
    setAuthDialogMode: { mode: AuthDialogMode }
    showOnboardingVideo: null
    goToNextOnboardingStep: null
    enableNudges: null
}>
