const generativeResponse = async(prompt)=>{

  const messages = {"messages":[{"role":"user","content":prompt}]}

  try{
    let genTextCall = await fetch('https://openai-demo-mb-001.openai.azure.com/openai/deployments/openaidemomb001/chat/completions?api-version=2023-05-15',
    {
      method: 'POST',
      headers:{
        'Content-Type':'application/json',
        'api-key':'da8176df16014be0a4b35214321fe010' 
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