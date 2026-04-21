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
    }],
    systemInstruction: {
      parts: [{
        text: messages.find(m => m.role === 'system')?.content || 'You are a helpful shopping assistant.'
      }]
    }
  });

  // Convert to Gemini format — skip system messages
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  const chatHistory = nonSystemMessages
    .slice(0, -1)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
    }))
    .filter(m => m.parts[0].text);

  const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;

  // Check for function call
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