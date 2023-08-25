export interface PromptRequest {
    model: 'text-davinci-003' | string;
    prompt: string;
    temperature: number;
    max_tokens: number;
}

interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface Choice {
    text: string;
    index: number;
    logprobs: any;
    finish_reason: string;
}
interface ChoiceChat {
    message: {
        role: string;
        content: string;
    };
    index: number;
    finish_reason: string;
}

export interface PromptResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: Usage;
}

  export interface PromptChatResponse {
    id: string;
    object: string;
    created: number;
    choices: ChoiceChat[];
    usage: Usage;
  }