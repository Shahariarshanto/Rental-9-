import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function generatePropertyDescription(data: {
  title: string;
  category: string;
  area: string;
  city: string;
  rent: number;
  amenities: string[];
}) {
  const prompt = `Write a professional, catchy, and inviting house rental description for a listing with the following details:
    Title: ${data.title}
    Category: ${data.category}
    Area: ${data.area}
    City: ${data.city}
    Rent: ${data.rent} BDT
    Amenities: ${data.amenities.join(", ")}

    The description should be concise but highlights the best features. Make it sound appealing to potential tenants. Keep it under 150 words.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating description:", error);
    return "";
  }
}

export async function getChatResponse(message: string, history: { role: string; parts: { text: string }[] }[]) {
  const chat = model.startChat({
    history: history,
    generationConfig: {
      maxOutputTokens: 500,
    },
  });

  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in AI Chat:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

export async function getPropertyInsights(property: any) {
  const prompt = `As a real estate expert, provide 3 quick bullet points on why this property is a good choice based on these details:
    Title: ${property.title}
    Category: ${property.category}
    Area: ${property.area}
    Rent: ${property.rent} BDT
    Amenities: ${property.amenities.join(", ")}

    Format as short bullet points. Be honest and professional. Focus on value for money and lifestyle.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating insights:", error);
    return "";
  }
}
