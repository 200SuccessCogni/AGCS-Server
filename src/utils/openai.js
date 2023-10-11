const { Configuration, OpenAIApi } = require("openai");
const {OPEN_AI_KEY:openAIKey} = require('../../process');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });
const openai = new OpenAIApi(configuration);

const generativeResponse = async(prompt)=>{
    
    try {
        // const response = await openai.Completion.create({
        //   engine: 'text-davinci-002',
        //   prompt: prompt,
        //   max_tokens: 50,
        //   n: 1,
        //   stop: null,
        //   temperature: 0.5,
        // })

        const chatCompletion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{role: "user", content: prompt}],
        });
    
        return chatCompletion ;
      } catch (error) {
        console.error(error);
        return error
        // res.status(500).json({ error: 'An error occurred while processing your request.' });
      }
}

// const chatCompletion = await openai.createChatCompletion({
//   model: "gpt-3.5-turbo",
//   messages: [{role: "user", content: "Hello world"}],
// });

module.exports = {generativeResponse}
// console.log(chatCompletion.data.choices[0].message);