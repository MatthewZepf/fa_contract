"use client"

import * as React from "react"

import Chat, { type ChatMessage } from "@/components/chat"

const starterMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Ask about the agreement.",
  },
]

export default function ChatDemo() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  function appendMessage(message: ChatMessage) {
    setMessages((current) => [...current, message])
  }

  function updateMessage(id: string, text: string) {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, text } : message))
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = input.trim()

    if (!message || isLoading) {
      return
    }

    appendMessage({
      id: crypto.randomUUID(),
      role: "user",
      text: message,
    })
    setInput("")
    setIsLoading(true)

    const assistantId = crypto.randomUUID()

    try {
      appendMessage({
        id: assistantId,
        role: "assistant",
        text: "",
      })

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok || !response.body) {
        throw new Error("Request failed")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let answer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        answer += decoder.decode(value, { stream: true })
        updateMessage(assistantId, answer)
      }

      answer += decoder.decode()

      if (!answer) {
        throw new Error("Empty response")
      }

      updateMessage(assistantId, answer)
    } catch {
      updateMessage(assistantId, "I couldn't complete that request.")
      setMessages((current) =>
        current.some((message) => message.id === assistantId)
          ? current
          : [
              ...current,
              {
                id: assistantId,
                role: "assistant",
                text: "I couldn't complete that request.",
              },
            ]
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Chat
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      title="Contract Chat"
      description="hopfully is helpful - Boyfie ❤️"
      placeholder="Ask something about the contract..."
    />
  )
}
