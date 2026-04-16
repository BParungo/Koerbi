import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRequest {
  type: 'image' | 'pdf' | 'url' | 'text'
  data: string
}

interface ImportedRecipe {
  title: string
  servings: number
  duration: string
  category: string
  ingredients: { name: string; amount: string; unit: string }[]
  steps: string[]
}

const SYSTEM_PROMPT = `Du bist ein Assistent, der Rezepte aus verschiedenen Quellen extrahiert.
Antworte ausschließlich mit einem JSON-Objekt ohne Markdown-Formatierung.
Das JSON muss exakt dieses Format haben:
{
  "title": "Rezeptname",
  "servings": 4,
  "duration": "30 Minuten",
  "category": "Hauptgericht",
  "ingredients": [
    { "name": "Mehl", "amount": "200", "unit": "g" }
  ],
  "steps": ["Schritt 1", "Schritt 2"]
}
Falls kein Rezept erkennbar ist, antworte mit: { "error": "Kein Rezept erkannt" }`

async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  })

  if (!response.ok) {
    throw new Error(`URL konnte nicht geladen werden: ${response.status}`)
  }

  const html = await response.text()

  // Schema.org JSON-LD extrahieren
  const jsonLdMatch = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      const content = block.replace(/<\/?script[^>]*>/gi, '').trim()
      try {
        const parsed = JSON.parse(content)
        const items = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of items) {
          if (item['@type'] === 'Recipe' || item['@type']?.includes?.('Recipe')) {
            // Nur relevante Felder extrahieren
            const slim = {
              name: item.name,
              recipeYield: item.recipeYield,
              totalTime: item.totalTime ?? item.cookTime,
              recipeCategory: item.recipeCategory,
              recipeIngredient: item.recipeIngredient,
              recipeInstructions: Array.isArray(item.recipeInstructions)
                ? item.recipeInstructions.map((s: { text?: string } | string) =>
                    typeof s === 'string' ? s : s.text,
                  )
                : item.recipeInstructions,
            }
            return `Schema.org Rezept:\n${JSON.stringify(slim)}`
          }
        }
      } catch {
        // kein valides JSON, weiter
      }
    }
  }

  // Fallback: sichtbaren Text aus body extrahieren
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1] : html
  const text = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)

  return text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data }: ImportRequest = await req.json()

    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'type und data sind erforderlich' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageContent: any[]

    if (type === 'url') {
      const text = await extractTextFromUrl(data)
      messageContent = [
        {
          type: 'text',
          text: `Extrahiere das Rezept aus folgendem Inhalt:\n\n${text}`,
        },
      ]
    } else if (type === 'text') {
      messageContent = [
        {
          type: 'text',
          text: `Extrahiere das Rezept aus folgendem Text:\n\n${data.slice(0, 4000)}`,
        },
      ]
    } else if (type === 'image') {
      const [mediaTypePart, base64Data] = data.includes(',') ? data.split(',') : ['', data]
      const mediaType =
        (mediaTypePart.match(/:(.*?);/)?.[1] as 'image/jpeg' | 'image/png' | 'image/webp') ??
        'image/jpeg'

      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: 'Extrahiere das Rezept aus diesem Bild.',
        },
      ]
    } else if (type === 'pdf') {
      const base64Data = data.includes(',') ? data.split(',')[1] : data

      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: 'Extrahiere das Rezept aus diesem PDF.',
        },
      ]
    } else {
      return new Response(JSON.stringify({ error: 'Ungültiger type. Erlaubt: image, pdf, url, text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const responseText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed: ImportedRecipe & { error?: string }
    try {
      parsed = JSON.parse(responseText)
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Rezept konnte nicht verarbeitet werden',
          detail: responseText.slice(0, 500),
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (parsed.error) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    const stack = err instanceof Error ? err.stack : undefined
    console.error('import-recipe error:', message, stack)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
