const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function chatWithGemini(messages, tools) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools: [{
      functionDeclarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters
      }))
    }]
  });

  // Convert OpenAI message format to Gemini format
  const systemMsg = messages.find(m => m.role === 'system');
  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .slice(0, -1) // all except last
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history: chatHistory,
    systemInstruction: systemMsg?.content || ''
  });

  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;

  // Check if Gemini wants to call a function
  const functionCall = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall);

  if (functionCall) {
    return {
      tool_calls: [{
        function: {
          name: functionCall.functionCall.name,
          arguments: JSON.stringify(functionCall.functionCall.args)
        }
      }],
      content: null
    };
  }

  return {
    tool_calls: null,
    content: response.text()
  };
}

module.exports = { chatWithGemini };