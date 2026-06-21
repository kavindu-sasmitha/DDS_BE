import { Request, Response } from "express";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;


 //Dedicated AI Teacher Chatbot Assistant for Students

export const askAiTeacher = async (req: Request, res: Response) => {
  const { question } = req.body; 

  if (!question) {
    return res.status(400).json({ message: "Please provide a question for the AI Teacher." });
  }

  try {
    //Ai teacher system context
    const systemPrompt = `
      Context: You are "Diniru AI Teacher", an expert, friendly and supportive driving instructor for Diniru Driving School in Sri Lanka. 
      Your job is to help students clear their doubts regarding Sri Lankan driving license theory exams, road rules, traffic signs, and practical driving test tips.
      Respond to the student's question clearly, comprehensively, with a detailed explanation, and encouragingly. If appropriate, mention Sri Lankan road contexts.
      If the student asks in Sinhala, respond with a detailed and complete explanation in Sinhala. Never cut the response halfway.
      Student Question: ${question}
    `;

    const payload = JSON.stringify({
      contents: [
        {
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 4096, 
        temperature: 0.7
      }
    });

    const aiResponse: any = await new Promise((resolve, reject) => {
      const request = https.request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY as string
          }
        },
        (response) => {
          let responseBody = "";

          response.on("data", (chunk) => {
            responseBody += chunk;
          });

          response.on("end", () => {
            try {
              resolve(JSON.parse(responseBody));
            } catch (parseError) {
              reject(parseError);
            }
          });
        }
      );

      request.on("error", reject);
      request.write(payload);
      request.end();
    });

    //rerad response structure
    const reply =
      aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't process that right now. Please try again.";

    res.status(200).json({
      success: true,
      botReply: reply
    });
  } catch (err: any) {
    console.error("AI Teacher Error: ", err);
    res.status(500).json({ 
      message: "AI Teacher is currently offline. Please try again later.", 
      error: err.message 
    });
  }
};