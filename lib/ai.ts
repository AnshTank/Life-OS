import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAIResponse(
  contents: any[],
  systemPrompt: string,
  isCallMode = false
) {
  const messages: any[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  for (const item of contents) {
    messages.push({
      role: item.role === "model" ? "assistant" : "user",
      content: item.parts[0].text,
    });
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: isCallMode ? 0.15 : 0.4,
    max_tokens: isCallMode ? 60 : 1200,
  });

  return completion.choices[0].message.content || "";
}