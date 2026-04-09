"use client"

import * as React from "react"
import { SendHorizonalIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

function AssistantMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ children }) => (
          <code className="rounded bg-foreground/8 px-1 py-0.5 font-mono text-[0.9em]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="overflow-x-auto rounded-lg bg-foreground/8 p-3 font-mono text-[0.9em]">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

type ChatProps = {
  messages: ChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isLoading?: boolean
  disabled?: boolean
  title?: string
  description?: string
  placeholder?: string
  emptyStateTitle?: string
  emptyStateBody?: string
  className?: string
}

export default function Chat({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  title = "Ask About The Contract",
  description = "Ask a question.",
  placeholder = "Ask about pay, scheduling, reserve...",
  emptyStateTitle = "Start here",
  emptyStateBody = "Ask a contract question.",
  className,
}: ChatProps) {
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const hasConversation = messages.some((message) => message.role === "user")

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, isLoading])

  const submitDisabled = disabled || isLoading || input.trim().length === 0

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_4px_24px_rgba(59,35,20,0.1)]",
        className
      )}
    >
      <CardHeader className="gap-2 border-b border-primary/15 bg-card px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl text-foreground">{title}</CardTitle>
            <CardDescription className="max-w-2xl text-[15px] leading-6 text-primary/80">
              {description}
            </CardDescription>
          </div>
          <div className="hidden rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-[11px] tracking-[0.25em] text-primary/70 uppercase md:block">Chat</div>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0">
        <ScrollArea
          className={cn(
            "bg-background transition-[height] duration-200",
            hasConversation ? "h-[32rem]" : "h-96"
          )}
        >
          {messages.length === 0 ? (
            <div
              className={cn(
                "flex h-full items-center justify-center px-5 py-4",
                hasConversation ? "min-h-[32rem]" : "min-h-80"
              )}
            >
              <div className="max-w-md text-center">
                <p className="font-display text-2xl text-foreground">{emptyStateTitle}</p>
                <p className="mt-2 text-[15px] leading-7 text-primary/80">{emptyStateBody}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 px-5 py-4">
              {messages.map((message) => {
                const isUser = message.role === "user"

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-3",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar
                      size="sm"
                      className="size-7 border-0 bg-card shadow-none after:hidden"
                    >
                      <AvatarImage
                        src={isUser ? "/raccoon_icon.svg" : "/otter.svg "}
                        alt={isUser ? "User avatar" : "Assistant avatar"}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "font-display text-xs",
                          "bg-card text-foreground"
                        )}
                      >
                        {isUser ? "Y" : "H"}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        "px-4 py-2 text-sm leading-relaxed",
                        isUser
                          ? "max-w-xs rounded-[18px_4px_18px_18px] bg-primary text-primary-foreground"
                          : "max-w-[min(42rem,85%)] rounded-[4px_18px_18px_18px] border border-secondary/20 bg-secondary/12 text-foreground"
                      )}
                    >
                      {isUser ? message.text : <AssistantMessage text={message.text} />}
                    </div>
                  </div>
                )
              })}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" ? (
                <div className="flex items-end gap-3">
                  <Avatar size="sm" className="size-7 border-0 bg-card shadow-none after:hidden">
                    <AvatarImage src="/otter.svg" alt="Assistant avatar" className="object-cover" />
                    <AvatarFallback className="bg-card font-display text-xs text-foreground">
                      H
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex max-w-[min(42rem,85%)] items-center gap-2 rounded-[4px_18px_18px_18px] border border-secondary/20 bg-secondary/12 px-4 py-2 text-sm text-foreground/70">
                    <Spinner className="size-4" />
                    Loading...
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="gap-3 bg-card px-4 py-3">
        <form className="flex w-full items-center gap-3" onSubmit={onSubmit}>
          <Input
            value={input}
            placeholder={placeholder}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={disabled || isLoading}
            className="h-10 border-0 bg-transparent px-0 text-sm text-foreground placeholder:text-primary/60 shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={submitDisabled}
            className="size-8 rounded-full bg-foreground text-background hover:bg-primary"
            aria-label="Send"
          >
            {isLoading ? <Spinner className="size-4" /> : <SendHorizonalIcon className="size-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
