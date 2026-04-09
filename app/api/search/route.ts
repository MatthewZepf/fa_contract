import { z } from "zod"

import embeddings from "@/data/embeddings.json"
import { getOpenAI } from "@/lib/openai"

const requestSchema = z
  .object({
    embedding: z.array(z.number()).min(1).optional(),
    message: z.string().trim().min(1).optional(),
    limit: z.number().int().positive().max(20).default(5),
  })
  .refine((value) => Boolean(value.embedding || value.message), {
    message: "Provide either `embedding` or `message`.",
    path: ["embedding"],
  })

type EmbeddingRow = {
  id: string
  text: string
  embedding: number[]
  section_title?: string
  subsection_name?: string
}

type SearchResult = {
  id: string
  text: string
  section_title?: string
  subsection_name?: string
  score: number
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function rankEmbeddings(queryEmbedding: number[], limit: number): SearchResult[] {
  return (embeddings as EmbeddingRow[])
    .map((row) => ({
      id: row.id,
      text: row.text,
      section_title: row.section_title,
      subsection_name: row.subsection_name,
      score: cosineSimilarity(queryEmbedding, row.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function buildContext(results: SearchResult[]) {
  return results
    .map((result) => {
      const sectionBits = [result.section_title, result.subsection_name].filter(Boolean).join(" / ")

      return [
        `[${result.id}]${sectionBits ? ` ${sectionBits}` : ""}`,
        result.text,
      ].join("\n")
    })
    .join("\n\n")
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = requestSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid request",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { embedding, message, limit } = parsed.data

  try {
    const openai = getOpenAI()

    const queryEmbedding =
      embedding ??
      (
        await openai.embeddings.create({
          model: "text-embedding-3-large",
          input: message!,
          encoding_format: "float",
        })
      ).data[0].embedding

    const results = rankEmbeddings(queryEmbedding, limit)

    if (!message) {
      return Response.json({ results })
    }

    const context = buildContext(results)

    const response = await openai.responses.create({
      model: "gpt-5.1",
      instructions:
        "You answer questions about the United flight attendant contract. Use the provided contract excerpts as your source of truth. If the excerpts do not support the answer, say that directly. Cite section ids when helpful. Be concise.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: message,
            },
          ],
        },
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `Retrieved contract excerpts:\n\n${context}`,
            },
          ],
        },
      ],
      stream: true,
    })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta))
            }
          }

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Search route failed", error)

    return Response.json(
      {
        error: "Search request failed.",
      },
      { status: 500 }
    )
  }
}
