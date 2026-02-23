/**
 * Telegram Bot Pool management
 * Handles bot assignment, customization, and webhook setup
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

export interface TelegramBot {
  id: string;
  bot_token: string;
  bot_username: string;
  bot_name: string;
  assigned_user_id: string | null;
  assigned_agent_id: string | null;
  custom_name: string | null;
  custom_description: string | null;
  webhook_url: string | null;
  status: 'available' | 'assigned' | 'disabled';
  created_at: string;
  assigned_at: string | null;
}

/**
 * Call Telegram Bot API
 */
async function callTelegramAPI(token: string, method: string, params?: Record<string, unknown>) {
  const response = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Telegram API error');
  return data.result;
}

/**
 * Customize a bot's display name and description
 */
export async function customizeBot(token: string, name: string, description?: string) {
  await callTelegramAPI(token, 'setMyName', { name });
  if (description) {
    await callTelegramAPI(token, 'setMyDescription', { description });
    await callTelegramAPI(token, 'setMyShortDescription', { short_description: description });
  }
}

/**
 * Set webhook for a bot
 */
export async function setWebhook(token: string, webhookUrl: string, secretToken?: string) {
  return callTelegramAPI(token, 'setWebhook', {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
  });
}

/**
 * Remove webhook from a bot
 */
export async function removeWebhook(token: string) {
  return callTelegramAPI(token, 'deleteWebhook');
}

/**
 * Get bot info
 */
export async function getBotInfo(token: string) {
  return callTelegramAPI(token, 'getMe');
}
