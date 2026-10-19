export function notificationVersion(item) {
 let hash=2166136261;
 for(const character of `${item.id}|${item.text}`){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(36);
}
export function unreadNotifications(items,read){return items.filter(item=>read?.[item.id]!==notificationVersion(item));}
export function markNotificationsRead(read,items){return Object.fromEntries(Object.entries({...read,...Object.fromEntries(items.map(item=>[item.id,notificationVersion(item)]))}).slice(-500));}
export function notificationStorageKey(role,account){return `votara-notifications-read:${role}:${account?.id||account?.student_id||account?.studentId||account?.email||'session'}`;}
