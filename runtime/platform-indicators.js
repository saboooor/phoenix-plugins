// @description Show reported Discord clients beside chat timestamps and on profiles.
// @version 1.0.0
(() => {
  const platforms = { desktop: "Desktop", mobile: "Mobile", web: "Web", embedded: "Embedded" };
  const statuses = { online: "online", idle: "idle", dnd: "do not disturb" };
  const byUser = new Map();
  const rendered = new Map();
  let profileUser;
  const header = phoenix.ui.addMessageAccessory({
    placement: "header",
    render({ messageId, message }) {
      const id = message?.author?.id;
      if (!id) return;
      rendered.delete(messageId);
      if (rendered.size >= 1000) rendered.delete(rendered.keys().next().value);
      rendered.set(messageId, id);
      return byUser.get(id);
    }
  });
  const profile = phoenix.ui.addProfileSection({
    title: "Platforms",
    render({ userId }) { profileUser = userId; return byUser.get(userId); }
  });
  function apply(rows, reset = false) {
    const changed = new Set(reset ? byUser.keys() : []);
    if (reset) byUser.clear();
    for (const row of rows) {
      const id = row?.user?.id ?? row?.user_id;
      if (typeof id !== "string") continue;
      if (row.status !== "offline" && row.status !== "invisible" && !row.client_status) continue;
      const labels = [];
      for (const [key, name] of Object.entries(platforms)) {
        const state = statuses[row.client_status?.[key]];
        if (state && row.status !== "offline" && row.status !== "invisible")
          labels.push(name + " (" + state + ")");
      }
      const label = labels.join(" · ") || undefined;
      if (byUser.get(id) === label) continue;
      if (label) byUser.set(id, label); else byUser.delete(id);
      changed.add(id);
    }
    if (!changed.size) return;
    if (changed.has(profileUser)) profile.update();
    for (const [messageId, id] of rendered) if (changed.has(id)) header.update(messageId);
  }
  function listen(event, callback) {
    const sig = phoenix.gateway[event];
    if (sig) phoenix.on(sig, callback);
  }
  function snapshot(p, reset) {
    const rows = [];
    function collect(group) {
      if (Array.isArray(group)) for (const item of group) {
        if (Array.isArray(item)) collect(item); else rows.push(item);
      }
    }
    collect(p.presences);
    collect(p.merged_presences?.friends);
    collect(p.merged_presences?.guilds);
    for (const guild of p.guilds ?? []) collect(guild?.presences);
    apply(rows, reset);
  }
  listen("ready", p => snapshot(p, true));
  listen("readySupplemental", p => snapshot(p, false));
  listen("guildCreate", p => apply(p.presences ?? []));
  listen("guildMembersChunk", p => apply(p.presences ?? []));
  listen("guildMemberListUpdate", p => {
    const rows = [];
    for (const op of p.ops ?? []) {
      if (op.item?.member?.presence) rows.push(op.item.member.presence);
      for (const item of op.items ?? []) if (item.member?.presence) rows.push(item.member.presence);
    }
    apply(rows);
  });
  listen("presenceUpdate", p => apply([p]));
})();
