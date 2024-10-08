import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class OpenAIService {

    /*
    async generate(): Promise<string> {
        try {            
            const apiKey: string = process.env.OPENAI_API_KEY
            const apiUrl: string = process.env.OPENAI_API_URL

            const messages = [
                {
                    role: 'user',
                    content:
                        'Act like a teacher. Generate just only one exercise with gamified approach about computer programming (you should prefere most common languages). You can use any of this kynd of exercises (Code completion challenges, Multiple choice coding quiz game, Debugging quest, Algorithm adventure, Code prediction challenge, Matching memory game, Syntax race, Function/method quest, Code order puzzle) to generate exercises. Also provide the solution at the problem you have generated. Start the text with the exercises tipology. return the resopnse in json format',
                },
            ];

            const response = await axios.post(
                apiUrl,
                {
                    model: 'gpt-3.5-turbo',
                    temperature: 0.4,
                    messages: messages,
                    max_tokens: 2048,
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                    responseType: 'json',
                }
            );

            const responseData = response.data.choices[0].message.content.trim();

            return responseData;
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    */
    
  }
}
