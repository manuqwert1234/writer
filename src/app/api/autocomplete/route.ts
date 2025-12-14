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
                    // Simpler system prompt for faster processing
                    content: "You are a fast autocomplete engine completing the user's sentence. Output ONLY the completion text. No quotes. No explanations."
                },
                { role: "user", content: context }
            ],
            // 8B Instant - The Speed King (~800+ tokens/sec)
            model: "llama-3.1-8b-instant",
            // Autocomplete only needs 3-5 words
            max_tokens: 20,
            // Lower temperature = faster deterministic result
            temperature: 0.1,
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
