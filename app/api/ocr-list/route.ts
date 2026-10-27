import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Fotoğraf verisi bulunamadı.' }, { status: 400 });
    }

    // Clean base64 prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Sen kağıt-kalem alışkanlığı olan annelerin ve esnafların el yazısını okuyan uzman bir yardımcısın.
Bu fotoğrafta kağıda yazılmış bir alışveriş listesi veya not kağıdı var.
Lütfen resimdeki tüm maddeleri tek tek oku.
Her maddeyi temiz, anlaşılır ve sade bir Türkçe ile yaz.
Her maddeye uygun bir kategori ata (Örn: 'Manav', 'Market', 'Kasap', 'Fırın', 'Eczane', 'Genel').
Eğer resimde hiçbir madde okunamıyorsa boş liste döndür.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: 'Okunan alışveriş listesi maddeleri',
              items: {
                type: Type.OBJECT,
                properties: {
                  text: {
                    type: Type.STRING,
                    description: 'Maddenin adı ve miktarı (Örn: 2 Ekmek, 1 kg Domates)',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Kategori (Manav, Market, vb.)',
                  },
                },
                required: ['text'],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ items: [] });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json({ items: parsed.items || [] });
  } catch (error) {
    console.error('OCR Hatası:', error);
    return NextResponse.json(
      {
        error: 'Fotoğraftaki liste okunamadı. Lütfen fotoğrafın net ve aydınlık olduğundan emin olun.',
        items: [],
      },
      { status: 500 }
    );
  }
}
