import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  LoginLink,
  MessageState,
  RetryButton,
  SavingState
} from "~/components/message-state"
import { PopupStyles } from "~/components/popup-shell"
import { SavedState } from "~/components/saved-state"
import { sendRuntimeMessage, setBadgeText } from "~/lib/browser"
import {
  MissingConfigError,
  readExtensionConfig,
  type ExtensionConfig
} from "~/lib/config"
import type {
  AuthStatus,
  CaptureIntent,
  ExtensionResponse
} from "~/lib/messages"
import {
  MANUAL_RETRY_HINT,
  responseToView,
  takePendingCaptureIntent,
  type PopupView
} from "~/lib/popup-view"

function PopupBody({ config }: { config: ExtensionConfig }) {
  const [view, setView] = useState<PopupView>({ kind: "preparing" })
  const attemptRef = useRef(0)
  const startedRef = useRef(false)
  const currentIntentRef = useRef<CaptureIntent>({ kind: "page" })

  const readAuthStatus = useCallback(async (): Promise<AuthStatus> => {
    let response: ExtensionResponse

    try {
      response = await sendRuntimeMessage<ExtensionResponse>({
        type: "auth-status"
      })
    } catch {
      return "unknown"
    }

    return response.ok && response.type === "auth-status"
      ? response.authStatus
      : "unknown"
  }, [])

  const startCapture = useCallback(
    async (intent: CaptureIntent) => {
      currentIntentRef.current = intent
      const attempt = (attemptRef.current += 1)
      const authStatus = await readAuthStatus()

      if (attemptRef.current !== attempt) {
        return
      }

      if (authStatus !== "authenticated") {
        setView({ kind: "signin" })
        return
      }

      setView({ kind: "saving" })

      let response: ExtensionResponse

      try {
        response = await sendRuntimeMessage<ExtensionResponse>({
          type: "capture-intent",
          intent
        })
      } catch {
        if (attemptRef.current === attempt) {
          setView({
            kind: "failed",
            message: "无法连接后台保存服务。",
            canRetry: true
          })
        }
        return
      }

      if (attemptRef.current === attempt) {
        setView(responseToView(response))
      }
    },
    [readAuthStatus]
  )

  useEffect(() => {
    if (startedRef.current) {
      return
    }

    startedRef.current = true

    void (async () => {
      await setBadgeText("")

      const pendingIntent = await takePendingCaptureIntent()

      await startCapture(pendingIntent ?? { kind: "page" })
    })()
  }, [startCapture])

  switch (view.kind) {
    case "preparing":
      return (
        <MessageState
          mark="plain"
          title="正在准备…"
          description="正在确认登录状态。"
        />
      )
    case "saving":
      return <SavingState />
    case "signin":
      return (
        <MessageState
          mark="signin"
          title="无法保存到 Inspira"
          description={
            <>
              请先 <LoginLink landingUrl={config.landingUrl} />
              ，再重新保存这一条。
            </>
          }
        />
      )
    case "saved":
      return (
        <SavedState
          inspirationId={view.inspirationId}
          landingUrl={config.landingUrl}
          onAutoClose={() => window.close()}
        />
      )
    case "failed":
      return (
        <MessageState
          mark="failed"
          title="无法保存到 Inspira"
          description={
            view.canRetry ? view.message : `${view.message}${MANUAL_RETRY_HINT}`
          }
          action={
            view.canRetry ? (
              <RetryButton
                onClick={() => void startCapture(currentIntentRef.current)}
              />
            ) : undefined
          }
        />
      )
  }
}

function ConfigErrorState({ error }: { error: MissingConfigError }) {
  return (
    <MessageState
      mark="failed"
      title="插件尚未配置"
      description={`缺少 ${error.missingKeys.join("、")}，请先按 README 写入 .env.local。`}
    />
  )
}

function Popup() {
  const config = useMemo<ExtensionConfig | MissingConfigError>(() => {
    try {
      return readExtensionConfig()
    } catch (error) {
      if (error instanceof MissingConfigError) {
        return error
      }

      throw error
    }
  }, [])

  if (config instanceof MissingConfigError) {
    return (
      <>
        <PopupStyles />
        <ConfigErrorState error={config} />
      </>
    )
  }

  return (
    <>
      <PopupStyles />
      <PopupBody config={config} />
    </>
  )
}

export default Popup
