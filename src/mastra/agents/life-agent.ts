import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { readFileSync } from 'fs';
import { join } from 'path';
import { addTodoTool, completeTodoTool, listTodoTool } from '../tools/todo-tools';
import { addExpenseTool, expenseSummaryTool } from '../tools/expense-tools';
import { addIdeaTool } from '../tools/idea-tools';
import { addDeadlineTool, listDeadlineTool } from '../tools/deadline-tools';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

function loadDoc(filename: string): string {
  try {
    return readFileSync(join(process.cwd(), 'docs', filename), 'utf-8');
  } catch {
    return `[${filename} not found]`;
  }
}

const getInstructions = () => {
  const now = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
Sekarang adalah: ${now} WIB

${loadDoc('SOUL.md')}

${loadDoc('IDENTITY.md')}

${loadDoc('USER.md')}

${loadDoc('AGENTS.md')}

${loadDoc('TOOLS.md')}
  `;
};

export const lifeAgent = new Agent({
  id: 'life-agent',
  name: 'inut-life-assistant',
  instructions: getInstructions,
  model: openrouter('openai/gpt-4o-mini'),
  tools: {
    addTodoTool,
    completeTodoTool,
    listTodoTool,
    addExpenseTool,
    expenseSummaryTool,
    addIdeaTool,
    addDeadlineTool,
    listDeadlineTool,
  },
  memory: new Memory({}),
});