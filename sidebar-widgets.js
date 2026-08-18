// =============================================================================
// PlayPivot — Widgets compartidos de la topbar: la campanita de
// solicitudes pendientes y el sobre de mensajes directos.
//
// Se incluye en TODAS las páginas de la app (como org-switcher.js), para
// que el correo y las notificaciones se comporten exactamente igual en
// todos lados, y para que un arreglo futuro solo haya que hacerlo una
// vez acá, no repetirlo en 10 archivos.
//
// Requiere que la página que lo incluye ya tenga definidos, ANTES de
// llamar a pivotInitTopbarWidgets():
//   - supabaseClient, currentUserId, currentOrgId, isPlatformController
//   - canValidateAssociations (booleano)
//   - showMessage(text, type) -- para mostrar errores
//   - los mismos IDs de HTML que en dashboard.html: pending-requests-*,
//     messages-*, sidebar-user-name, contact-support-btn (si existe)
// =============================================================================

function pivotEscapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let pivotOpenConversationWith = null;

function pivotInitTopbarWidgets() {
  const assocWidget = document.getElementById("pending-requests-widget");
  const assocBtn = document.getElementById("pending-requests-btn");
  const assocCount = document.getElementById("pending-requests-count");
  const assocPanel = document.getElementById("pending-requests-panel");
  const msgWidget = document.getElementById("messages-widget");
  const msgBtn = document.getElementById("messages-btn");
  const msgCount = document.getElementById("messages-count");
  const msgPanel = document.getElementById("messages-panel");

  // -------------------------------------------------------------------
  // Solicitudes de asociación pendientes
  // -------------------------------------------------------------------
  async function loadPendingRequestsWidget() {
    if (typeof canValidateAssociations !== "undefined" && canValidateAssociations) {
      const { data, error } = await supabaseClient
        .from("club_association_members")
        .select("association_id, organization_id, created_at, message, club_associations(name), organizations(name)")
        .eq("status", "pending");
      if (error) { console.error("loadPendingRequestsWidget error:", error); return; }
      const rows = data || [];
      if (rows.length === 0) { assocWidget.style.display = "none"; return; }
      assocWidget.style.display = "inline-block";
      assocCount.textContent = rows.length;
      assocCount.style.display = "flex";
      assocPanel.innerHTML = `<div style="font-weight:600; margin-bottom:8px;">Pending association requests</div>` + rows.map((r) => `
        <div style="padding:8px 0; border-bottom:1px solid var(--line);">
          <div><strong>${pivotEscapeHtml((r.organizations && r.organizations.name) || "—")}</strong> wants to join <strong>${pivotEscapeHtml((r.club_associations && r.club_associations.name) || "—")}</strong></div>
          ${r.message ? `<div style="font-size:14px; color:var(--muted); font-style:italic; margin-top:4px;">"${pivotEscapeHtml(r.message)}"</div>` : ""}
          <div style="margin-top:6px; display:flex; gap:6px;">
            <button class="btn btn-approve assoc-approve-btn" data-assoc="${r.association_id}" data-org="${r.organization_id}" style="padding:4px 10px; font-size:13.5px;">Approve</button>
            <button class="btn btn-reject assoc-reject-btn" data-assoc="${r.association_id}" data-org="${r.organization_id}" style="padding:4px 10px; font-size:13.5px;">Reject</button>
          </div>
        </div>
      `).join("");
      assocPanel.querySelectorAll(".assoc-approve-btn").forEach((btn) => btn.addEventListener("click", () => decideAssociationRequest(btn.dataset.assoc, btn.dataset.org, "approved")));
      assocPanel.querySelectorAll(".assoc-reject-btn").forEach((btn) => btn.addEventListener("click", () => decideAssociationRequest(btn.dataset.assoc, btn.dataset.org, "rejected")));
    } else {
      if (!currentOrgId) { assocWidget.style.display = "none"; return; }
      const { data, error } = await supabaseClient
        .from("club_association_members")
        .select("status, club_associations(name)")
        .eq("organization_id", currentOrgId)
        .eq("status", "pending");
      if (error) { console.error("loadPendingRequestsWidget error:", error); return; }
      const rows = data || [];
      if (rows.length === 0) { assocWidget.style.display = "none"; return; }
      assocWidget.style.display = "inline-block";
      assocCount.textContent = rows.length;
      assocCount.style.display = "flex";
      assocPanel.innerHTML = `<div style="font-weight:600; margin-bottom:8px;">Your requests</div>` + rows.map((r) => `
        <div style="padding:8px 0; border-bottom:1px solid var(--line);">⏳ Waiting for approval to join <strong>${pivotEscapeHtml((r.club_associations && r.club_associations.name) || "—")}</strong></div>
      `).join("");
    }
  }

  async function decideAssociationRequest(associationId, organizationId, decision) {
    const { data: userData } = await supabaseClient.auth.getUser();
    const userId = userData && userData.user && userData.user.id;
    const { error: memberErr } = await supabaseClient
      .from("club_association_members")
      .update({ status: decision, decided_at: new Date().toISOString(), decided_by: userId })
      .eq("association_id", associationId).eq("organization_id", organizationId);
    if (memberErr) { showMessage(memberErr.message, "error"); return; }
    if (decision === "approved") {
      await supabaseClient.from("club_associations").update({ status: "approved", decided_at: new Date().toISOString(), decided_by: userId }).eq("id", associationId).eq("status", "pending");
    }
    showMessage(decision === "approved" ? "Association request approved." : "Association request rejected.", "success");
    await loadPendingRequestsWidget();
  }

  if (assocBtn) {
    assocBtn.addEventListener("click", () => {
      assocPanel.style.display = assocPanel.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", (e) => {
      if (!e.composedPath().includes(assocWidget)) assocPanel.style.display = "none";
    });
  }

  // -------------------------------------------------------------------
  // Mensajería directa
  // -------------------------------------------------------------------
  async function loadMessagesWidget() {
    const { data, error } = await supabaseClient
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at, read_at, sender:sender_id(full_name), recipient:recipient_id(full_name)")
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });
    if (error) { console.error("loadMessagesWidget error:", error); return; }

    const unread = (data || []).filter((m) => m.recipient_id === currentUserId && !m.read_at).length;
    msgCount.textContent = unread > 0 ? unread : "";
    msgCount.style.display = unread > 0 ? "flex" : "none";

    const byPerson = {};
    (data || []).forEach((m) => {
      const otherId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
      const otherName = (m.sender_id === currentUserId ? m.recipient : m.sender)?.full_name || "Someone";
      if (!byPerson[otherId]) byPerson[otherId] = { otherId, otherName, latest: m, unread: 0 };
      if (m.recipient_id === currentUserId && !m.read_at) byPerson[otherId].unread++;
    });
    renderMessagesPanel(Object.values(byPerson));
  }

  function renderMessagesPanel(conversations) {
    if (pivotOpenConversationWith) { renderThread(pivotOpenConversationWith); return; }
    let html = `<div style="font-weight:600; margin-bottom:8px;">Messages</div>
      <button id="new-message-btn" class="nav-btn" style="width:100%; margin-bottom:6px;">+ New message</button>
      <button id="new-message-support-btn" style="width:100%; margin-bottom:10px; background:none; border:none; color:var(--accent-deep); font-size:13.5px; cursor:pointer; padding:2px 0;">✉️ Message the PlayPivot team</button>`;
    if (conversations.length === 0) {
      html += `<p class="hint" style="margin:0;">No messages yet.</p>`;
    } else {
      html += conversations.sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at)).map((c) => `
        <div class="conv-row" data-other="${c.otherId}" style="padding:8px 0; border-bottom:1px solid var(--line); cursor:pointer;">
          <div style="display:flex; justify-content:space-between;">
            <strong>${pivotEscapeHtml(c.otherName)}</strong>
            ${c.unread > 0 ? `<span style="background:var(--accent); color:#fff; border-radius:100px; font-size:12.5px; padding:1px 7px;">${c.unread}</span>` : ""}
          </div>
          <div style="font-size:14px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${pivotEscapeHtml(c.latest.body)}</div>
        </div>
      `).join("");
    }
    msgPanel.innerHTML = html;
    msgPanel.querySelectorAll(".conv-row").forEach((row) => row.addEventListener("click", () => { pivotOpenConversationWith = row.dataset.other; loadMessagesWidget(); }));
    document.getElementById("new-message-btn").addEventListener("click", showComposeNew);
    document.getElementById("new-message-support-btn").addEventListener("click", showComposeToSupport);
  }

  async function renderThread(otherId) {
    const { data, error } = await supabaseClient
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at, read_at, sender:sender_id(full_name)")
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });
    if (error) { console.error("renderThread error:", error); return; }

    const unreadIds = (data || []).filter((m) => m.recipient_id === currentUserId && !m.read_at).map((m) => m.id);
    if (unreadIds.length > 0) {
      await supabaseClient.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
    }

    const otherName = (data && data[0] && (data[0].sender_id === otherId ? data[0].sender.full_name : null)) || "Conversation";
    msgPanel.innerHTML = `
      <button id="back-to-inbox-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
      <div style="font-weight:600; margin-bottom:8px;">${pivotEscapeHtml(otherName)}</div>
      <div id="thread-messages" style="max-height:220px; overflow-y:auto; margin-bottom:10px;">
        ${(data || []).map((m) => `
          <div style="margin-bottom:8px; text-align:${m.sender_id === currentUserId ? "right" : "left"};">
            <div style="display:inline-block; max-width:80%; background:${m.sender_id === currentUserId ? "var(--accent-tint)" : "var(--paper)"}; border-radius:8px; padding:6px 10px; font-size:14px;">${pivotEscapeHtml(m.body)}</div>
          </div>
        `).join("")}
      </div>
      <div style="display:flex; gap:6px;">
        <input id="reply-input" type="text" placeholder="Write a reply…" style="flex:1; padding:6px 8px; border:1px solid var(--line); border-radius:6px; font-size:14.5px;" />
        <button id="reply-send-btn" class="nav-btn">Send</button>
      </div>
    `;
    document.getElementById("thread-messages").scrollTop = document.getElementById("thread-messages").scrollHeight;
    document.getElementById("back-to-inbox-btn").addEventListener("click", () => { pivotOpenConversationWith = null; loadMessagesWidget(); });
    const send = async () => {
      const input = document.getElementById("reply-input");
      const body = input.value.trim();
      if (!body) return;
      const { error: sendErr } = await supabaseClient.from("messages").insert({ sender_id: currentUserId, recipient_id: otherId, body });
      if (sendErr) { showMessage(sendErr.message, "error"); return; }
      input.value = "";
      await loadMessagesWidget();
    };
    document.getElementById("reply-send-btn").addEventListener("click", send);
    document.getElementById("reply-input").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }

  async function showComposeNew() {
    msgPanel.innerHTML = `
      <button id="back-to-inbox-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
      <div style="font-weight:600; margin-bottom:8px;">New message</div>
      <p class="hint" style="margin:0 0 8px;">Loading who you can message…</p>
    `;
    document.getElementById("back-to-inbox-btn").addEventListener("click", () => loadMessagesWidget());

    let teammates = [];
    if (isPlatformController) {
      const { data } = await supabaseClient
        .from("memberships")
        .select("user_id, profiles(full_name), organizations(name)")
        .eq("status", "active")
        .neq("user_id", currentUserId);
      const seen = new Set();
      teammates = (data || []).filter((m) => {
        if (!m.profiles || seen.has(m.user_id)) return false;
        seen.add(m.user_id);
        return true;
      });
    } else {
      const { data: myOrgs } = await supabaseClient
        .from("memberships")
        .select("organization_id")
        .eq("user_id", currentUserId)
        .eq("status", "active");
      const myOrgIds = [...new Set((myOrgs || []).map((m) => m.organization_id))];

      if (myOrgIds.length > 0) {
        const { data } = await supabaseClient
          .from("memberships")
          .select("user_id, profiles(full_name), organizations(name)")
          .in("organization_id", myOrgIds)
          .eq("status", "active")
          .neq("user_id", currentUserId);
        const seen = new Set();
        teammates = (data || []).filter((m) => {
          if (!m.profiles || seen.has(m.user_id)) return false;
          seen.add(m.user_id);
          return true;
        });
      }
    }
    const { data: adminsRaw } = await supabaseClient.rpc("get_platform_admin_contact");
    const admins = (adminsRaw || []).filter((a) => a.id !== currentUserId);

    const people = [
      ...teammates.map((m) => ({ id: m.user_id, name: m.profiles.full_name || "Teammate" })),
      ...(admins.map((a) => ({ id: a.id, name: a.full_name || "PlayPivot support" }))),
    ];

    if (people.length === 0) {
      msgPanel.innerHTML = `
        <button id="back-to-inbox-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
        <div style="font-weight:600; margin-bottom:8px;">New message</div>
        <p class="hint" style="margin:0;">No one to message yet — join a club to message teammates.</p>
      `;
      document.getElementById("back-to-inbox-btn").addEventListener("click", () => loadMessagesWidget());
      return;
    }

    msgPanel.innerHTML = `
      <button id="back-to-inbox-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
      <div style="font-weight:600; margin-bottom:8px;">New message — who to?</div>
      <div id="new-msg-people-list" style="max-height:220px; overflow-y:auto; margin-bottom:6px;">
        ${people.map((p) => `<div class="new-msg-person-row" data-person-id="${p.id}" data-person-name="${pivotEscapeHtml(p.name)}" style="padding:8px 4px; border-bottom:1px solid var(--line); cursor:pointer;">${pivotEscapeHtml(p.name)}</div>`).join("")}
      </div>
    `;
    document.getElementById("back-to-inbox-btn").addEventListener("click", () => loadMessagesWidget());
    msgPanel.querySelectorAll(".new-msg-person-row").forEach((row) => {
      row.addEventListener("click", () => showComposeToPerson(row.dataset.personId, row.dataset.personName));
    });
  }

  function showComposeToPerson(recipientId, recipientName) {
    msgPanel.innerHTML = `
      <button id="back-to-new-msg-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
      <div style="font-weight:600; margin-bottom:8px;">To: ${pivotEscapeHtml(recipientName)}</div>
      <textarea id="new-msg-body" rows="3" placeholder="Your message…" style="width:100%; padding:6px 8px; border:1px solid var(--line); border-radius:6px; font-size:14.5px; margin-bottom:6px;"></textarea>
      <button id="new-msg-send-btn" class="nav-btn" style="width:100%;">Send</button>
    `;
    document.getElementById("back-to-new-msg-btn").addEventListener("click", () => showComposeNew());
    document.getElementById("new-msg-send-btn").addEventListener("click", async () => {
      const body = document.getElementById("new-msg-body").value.trim();
      if (!body) return;
      const { error: sendErr } = await supabaseClient.from("messages").insert({ sender_id: currentUserId, recipient_id: recipientId, body });
      if (sendErr) { showMessage("Couldn't send that — try again in a moment.", "error"); return; }
      pivotOpenConversationWith = recipientId;
      await loadMessagesWidget();
    });
  }

  async function showComposeToSupport() {
    msgPanel.style.display = "block";
    msgPanel.innerHTML = `<div class="hint" style="padding:8px 0;">Finding the PlayPivot team…</div>`;
    const { data: adminsRaw, error } = await supabaseClient.rpc("get_platform_admin_contact");
    const admins = (adminsRaw || []).filter((a) => a.id !== currentUserId);
    if (error || admins.length === 0) {
      msgPanel.innerHTML = `
        <button id="back-to-inbox-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
        <div class="hint" style="padding:8px 0;">You're the only PlayPivot admin right now — there's no one else here to message. (Other coaches using "Contact us" will reach you fine.)</div>
      `;
      document.getElementById("back-to-inbox-btn").addEventListener("click", () => loadMessagesWidget());
      return;
    }
    const recipient = admins[0];
    const myName = (document.getElementById("sidebar-user-name") || {}).textContent || "you";
    msgPanel.innerHTML = `
      <button id="back-to-inbox-btn" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 0 8px;">&larr; Back</button>
      <div style="font-weight:600; margin-bottom:4px;">Message the PlayPivot team</div>
      <p class="hint" style="margin:0 0 8px;">Straight to ${pivotEscapeHtml(recipient.full_name || "the PlayPivot admin")} — bug report, question, anything. Sent as ${pivotEscapeHtml(myName)} — they'll see it's from you.</p>
      <textarea id="new-msg-body" rows="4" placeholder="What's up?" style="width:100%; padding:6px 8px; border:1px solid var(--line); border-radius:6px; font-size:14.5px; margin-bottom:6px; font-family:inherit;"></textarea>
      <button id="new-msg-send-btn" class="nav-btn" style="width:100%;">Send</button>
    `;
    document.getElementById("back-to-inbox-btn").addEventListener("click", () => loadMessagesWidget());
    document.getElementById("new-msg-send-btn").addEventListener("click", async () => {
      const body = document.getElementById("new-msg-body").value.trim();
      if (!body) return;
      const { error: sendErr } = await supabaseClient.from("messages").insert({ sender_id: currentUserId, recipient_id: recipient.id, body });
      if (sendErr) { showMessage("Couldn't send that — try again in a moment.", "error"); return; }
      pivotOpenConversationWith = recipient.id;
      await loadMessagesWidget();
    });
  }

  if (msgBtn) {
    msgBtn.addEventListener("click", () => {
      const opening = msgPanel.style.display === "none";
      msgPanel.style.display = opening ? "block" : "none";
      if (opening) loadMessagesWidget();
    });
    document.addEventListener("click", (e) => {
      if (!e.composedPath().includes(msgWidget)) msgPanel.style.display = "none";
    });
  }

  const contactBtn = document.getElementById("contact-support-btn");
  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showComposeToSupport();
    });
  }

  loadPendingRequestsWidget();
  loadMessagesWidget();
}

// -------------------------------------------------------------------
// Sidebar: apertura/cierre en móvil, y el bloque de usuario abajo
// (avatar con inicial, nombre, rol). Compartido igual que lo de arriba.
// -------------------------------------------------------------------
function pivotInitSidebarChrome() {
  const sidebarEl = document.getElementById("sidebar");
  const sidebarOverlayEl = document.getElementById("sidebar-overlay");
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const closeBtn = document.getElementById("sidebar-close-btn");
  if (!sidebarEl || !sidebarOverlayEl) return;

  function openSidebar() { sidebarEl.classList.add("open"); sidebarOverlayEl.classList.add("visible"); }
  function closeSidebar() { sidebarEl.classList.remove("open"); sidebarOverlayEl.classList.remove("visible"); }
  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  sidebarOverlayEl.addEventListener("click", closeSidebar);
  document.querySelectorAll(".sidebar-link").forEach((link) => link.addEventListener("click", closeSidebar));

  const helpLink = document.getElementById("sidebar-help-link");
  if (helpLink) {
    helpLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
      const helpBox = document.getElementById("help-box");
      if (helpBox) {
        helpBox.style.display = helpBox.style.display === "none" ? "block" : "none";
        if (helpBox.style.display === "block") helpBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
}

function pivotUpdateSidebarUser(name, role) {
  if (name) {
    const nameEl = document.getElementById("sidebar-user-name");
    const avatarEl = document.getElementById("sidebar-user-avatar");
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.trim().charAt(0).toUpperCase() || "?";
  }
  if (role) {
    const roleEl = document.getElementById("sidebar-user-role");
    if (roleEl) roleEl.textContent = role;
  }
}
