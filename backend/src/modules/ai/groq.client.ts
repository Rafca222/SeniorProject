// Thin wrapper around Groq's chat completions endpoint. Groq's API is
// OpenAI-compatible, so this is a plain fetch call rather than a separate
// SDK dependency -- one less package to install and keep updated.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Verified directly against this account's own /v1/models endpoint --
// the Llama family (3.1, 3.3) isn't available on this key at all, which
// is why those earlier attempts both 404'd. gpt-oss-20b is confirmed
// present and explicitly supports json_mode + structured_outputs.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

export async function callGroqJSON(systemPrompt: string, userPrompt: string): Promise<any> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      // json_object mode requires the word "JSON" to appear in the
      // prompt somewhere -- the system prompt below satisfies that.
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');

  return JSON.parse(content);
}