import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

// 1. Enable Edge Runtime (Bypasses Node.js cold starts)
export const runtime = 'edge';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { context } = await req.json();

        if (!context || context.length < 10) {
            return NextResponse.json({ suggestion: '' });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Continue the user's writing naturally. Output ONLY the continuation text. No quotes, no explanations. Match the tone and style."
                },
                { role: "user", content: context }
            ],
            // 8B Instant - fastest model (~800+ tokens/sec)
            model: "llama-3.1-8b-instant",
            // More tokens = better sentence completions
            max_tokens: 50,
            // Low temperature for coherent, predictable completions
            temperature: 0.3,
            // Stop at sentence boundaries for cleaner completions
            stop: ["\n\n", ".", "!", "?"],
        });

        const suggestion = completion.choices[0]?.message?.content || "";

        // Clean up any quotes the AI might add
        const cleanSuggestion = suggestion.replace(/^"/, '').replace(/"$/, '').trim();

        return NextResponse.json({ suggestion: cleanSuggestion });

    } catch (error) {
        console.error("Groq Error:", error);
        return NextResponse.json({ suggestion: '' });
    }
}
