export const commandsDocs = [
  {
    command: '/start',
    description: 'Initial greeting'
  },
  {
    command: '/help',
    description: 'List commands'
  },
  {
    command: '/my-accounts',
    description: 'List accounts'
  },
  {
    command: '/set-current-account',
    description: 'Set current account for user'
  },
  {
    command: '/set-current-network',
    description: 'Set current network for user'
  },
  {
    command: '/create-account',
    description: 'Account creation'
  },
];

export const helpCommansText = commandsDocs
  .map(c => `${c.command} ${c.description}`)
  .join('\n');
 