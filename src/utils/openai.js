const {
  OPEN_AI_API_KEY: apiKey,
  OPEN_AI_RESOURCE_NAME: resourceName,
  OPEN_AI_DEPLOYMENT_NAME: deploymentName,
} = require('../../process');


const generativeResponse = async(prompt)=>{

  const messages = {"messages":[{"role":"user","content":prompt}]}

  try{
    let genTextCall = await fetch(`https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}/chat/completions?api-version=2023-05-15`,
    {
      method: 'POST',
      headers:{
        'Content-Type':'application/json',
        'api-key':apiKey 
      },
      body: JSON.stringify(messages)
    })
  
    const genTextResponse = await genTextCall.json();
  
    console.log(genTextResponse)
  
    if('choices' in genTextResponse && Array.isArray(genTextResponse.choices)){
      if('message' in genTextResponse.choices[0]){
        if('content' in genTextResponse.choices[0].message){
          return genTextResponse.choices[0].message.content
        }else{
          return 'Apologies, unable to generate response for now. 1'
        }
      }else{
        return 'Apologies, unable to generate response for now. 2'
      }
    }else{
      return 'Apologies, unable to generate response for now. 3'
    }
  }catch(err){
    console.log(err)
    return err
  }

}

module.exports = {generativeResponse}