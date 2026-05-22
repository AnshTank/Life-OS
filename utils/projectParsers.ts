export function parseTimeLogs(notes: string[]): { id: string; date: string; hours: number; desc: string }[] {
  return notes.filter(n => n.startsWith('⏱|')).map(n => {
    const [, id, date, hours, desc] = n.split('|');
    return { id, date, hours: parseFloat(hours), desc };
  });
}

export function encodeTimeLog(id: string, date: string, hours: number, desc: string): string {
  return `⏱|${id}|${date}|${hours}|${desc}`;
}

export function parseStandups(notes: string[]): { id: string; date: string; done: string; doing: string; blockers: string }[] {
  return notes.filter(n => n.startsWith('📋|')).map(n => {
    const [, id, date, done, doing, blockers] = n.split('|');
    return { id, date, done, doing, blockers };
  });
}

export function encodeStandup(id: string, date: string, done: string, doing: string, blockers: string): string {
  return `📋|${id}|${date}|${done}|${doing}|${blockers}`;
}

export function parseMilestones(notes: string[]): { id: string; title: string; completed: boolean; target?: string }[] {
  return notes.filter(n => n.startsWith('🏁|')).map(n => {
    const [, id, title, completed, target] = n.split('|');
    return { id, title, completed: completed === '1', target: target || undefined };
  });
}

export function encodeMilestone(id: string, title: string, completed: boolean, target?: string): string {
  return `🏁|${id}|${title}|${completed ? '1' : '0'}|${target || ''}`;
}

export function parseTechDebt(notes: string[]): { id: string; title: string; severity: 'high' | 'medium' | 'low'; status: 'open' | 'resolved' }[] {
  return notes.filter(n => n.startsWith('🐛|')).map(n => {
    const [, id, title, severity, status] = n.split('|');
    return { id, title, severity: severity as any, status: status as any };
  });
}

export function encodeTechDebt(id: string, title: string, severity: string, status: string): string {
  return `🐛|${id}|${title}|${severity}|${status}`;
}

export function parseInvoices(notes: string[]): { id: string; amount: number; issueDate: string; dueDate: string; status: 'draft' | 'sent' | 'paid' | 'overdue'; clientName: string }[] {
  return notes.filter(n => n.startsWith('🧾|')).map(n => {
    const [, id, amount, issueDate, dueDate, status, clientName] = n.split('|');
    return { id, amount: parseFloat(amount), issueDate, dueDate, status: status as any, clientName };
  });
}

export function encodeInvoice(id: string, amount: number, issueDate: string, dueDate: string, status: string, clientName: string): string {
  return `🧾|${id}|${amount}|${issueDate}|${dueDate}|${status}|${clientName}`;
}

export function parseTeamMembers(notes: string[]): { id: string, name: string, role: string }[] {
  return notes.filter(n => n.startsWith('👥|')).map(n => {
    const [, id, name, role] = n.split('|');
    return { id, name, role };
  });
}

export function encodeTeamMember(id: string, name: string, role: string): string {
  return `👥|${id}|${name}|${role}`;
}

export function parseStructuredNotes(notes: string[]): { id: string, category: string, content: string }[] {
  return notes.filter(n => !n.startsWith('⏱|') && !n.startsWith('📋|') && !n.startsWith('🏁|') && !n.startsWith('🐛|') && !n.startsWith('🧾|') && !n.startsWith('👥|'))
    .map((n, i) => {
      if (n.startsWith('📝|')) {
        const [, category, ...rest] = n.split('|');
        return { id: `n-${i}`, category, content: rest.join('|') };
      }
      return { id: `n-${i}`, category: 'General', content: n };
    });
}

export function encodeStructuredNote(category: string, content: string): string {
  return `📝|${category}|${content}`;
}
