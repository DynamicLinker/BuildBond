import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const useMock = !OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-');

export async function verifyMilestone(milestoneTitle, milestoneDescription, imagePath) {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      approved: true,
      confidence: 0.82,
      reasoning:
        'Mock analysis: Photo appears to show completed work matching the milestone description. Structural elements visible and appear properly installed.',
    };
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a strict but fair independent construction inspector reviewing work photos. Analyze whether the photo shows the specified work is genuinely complete. Look for quality, completeness, and adherence to the description. Be skeptical of low-quality or misleading photos.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Milestone: ${milestoneTitle}. Expected work: ${milestoneDescription}. Based on this photo, is this milestone complete? Reply ONLY with valid JSON: {"approved": boolean, "confidence": number between 0 and 1, "reasoning": string of 1-2 sentences}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('AI returned empty response');

  // Strip markdown code fences if present
  const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI response not valid JSON: ${content}`);
  }

  return {
    approved: Boolean(parsed.approved),
    confidence: Number(parsed.confidence),
    reasoning: String(parsed.reasoning),
  };
}
