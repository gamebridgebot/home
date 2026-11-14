const API_BASE = 'http://138.201.21.30:10000';

const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const currentTabTitle = document.getElementById('currentTabTitle');

const PUNISHMENT_LABELS = {
    ban: 'Permanent Ban',
    tempban: 'Temporary Ban',
    mute: 'Mute / Timeout',
    warn: 'Warning',
    unban: 'Unban',
    unmute: 'Unmute'
};

const PUNISHMENT_CLASSES = {
    ban: 'pill-danger',
    tempban: 'pill-warning',
    mute: 'pill-info',
    warn: 'pill-warning',
    unban: 'pill-muted',
    unmute: 'pill-success'
};

const STATUS_LABELS = {
    active: 'Active',
    expired: 'Expired',
    revoked: 'Revoked',
    logged: 'Logged'
};

const STATUS_CLASSES = {
    active: 'pill-danger',
    expired: 'pill-muted',
    revoked: 'pill-muted',
    logged: 'pill-info'
};

let punishmentsLoading = false;

/* Example items to add to console box.
<div class="console-row" style="color: var(--highlight);">[SYSTEM] Realtime socket connection established with Game Cluster 1.</div>
<div class="console-row" style="color: var(--text-muted);">[14:02:11] Player 'Alex99' linked Discord account (ID: 493021948).</div>
<div class="console-row" style="color: var(--warning);">[14:05:43] Mod_Sarah banned 'GamerX' (Reason: Speedhacking). Syncing to Discord...</div>
 */

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-tab');

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        tabContents.forEach(tab => tab.classList.remove('active'));
        const activeContent = document.getElementById(`tab-${targetTab}`);
        if (activeContent) activeContent.classList.add('active');

        currentTabTitle.textContent = item.childNodes[2] ? item.childNodes[2].textContent.trim() : item.textContent.trim();

        if (targetTab === 'moderation') {
            loadPunishments();
        }

        if (targetTab === 'verification') {
            loadVerificationSettings();
        }

        if (targetTab === 'settings') {
            loadLogSettings();
        }
    });
});

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function unlinkUser(discordId) {
    if (confirm(`Are you sure you want to unlink Discord ID: ${discordId}?`)) {
        console.log(`[API HOOK] Dispatch DELETE to /api/players/${discordId}`);
        // Backend integration point
    }
}

function dispatchConsoleCommand() {
    const input = document.getElementById('consoleCmdInput');
    const screen = document.getElementById('fullConsoleScreen');
    const cmd = input.value.trim();

    if (!cmd) return;

    const logRow = document.createElement('div');
    logRow.className = 'console-row';
    logRow.textContent = `> ${cmd}`;
    screen.appendChild(logRow);
    screen.scrollTop = screen.scrollHeight;

    console.log(`[API HOOK] Dispatch PUT /api/server/console with command: "${cmd}"`);
    // Backend integration point: fetch('http://localhost:5000/api/console', ...)

    input.value = '';
}

function clearSyncLogs() {
    document.getElementById('overviewSyncTicker').innerHTML = '';
}

function toggleSecretKey() {
    const field = document.getElementById('settingsKeyDisplay');
    field.type = field.type === 'password' ? 'text' : 'password';
}

function regenerateKey() {
    if (confirm("Regenerating the key will immediately disconnect any active sessions. Continue?")) {
        console.log("[API HOOK] Dispatch POST /api/server/regenerate-key");
    }
}

function submitManualLink() {
    const ign = document.getElementById('manualPlayerIgn').value;
    const dId = document.getElementById('manualDiscordId').value;
    console.log(`[API HOOK] Generate PIN for IGN: ${ign}, Discord ID: ${dId}`);
    closeModal('quickLinkModal');
}

function saveNoticeSettings() {
    console.log("[API HOOK] Save punishment notice settings");
}

function getSessionToken() {
    return localStorage.getItem('session-token');
}

function formatPunishmentDuration(punishment) {
    if (['warn', 'unban', 'unmute'].includes(punishment.type)) {
        return '—';
    }

    if (!punishment.durationSeconds || punishment.durationSeconds <= 0) {
        return 'Permanent';
    }

    const units = [
        ['w', 7 * 24 * 60 * 60],
        ['d', 24 * 60 * 60],
        ['h', 60 * 60],
        ['m', 60],
        ['s', 1]
    ];

    let remaining = Math.floor(punishment.durationSeconds);
    const parts = [];

    for (const [label, size] of units) {
        if (remaining < size) continue;

        parts.push(`${Math.floor(remaining / size)}${label}`);
        remaining %= size;

        if (parts.length === 2) break;
    }

    return parts.join(' ') || '—';
}

function formatPunishmentDate(value) {
    if (!value) return 'Unknown date';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Unknown date';

    return date.toLocaleString();
}

function createCell(text, className) {
    const cell = document.createElement('td');

    if (className) cell.className = className;
    if (text !== undefined && text !== null) cell.textContent = text;

    return cell;
}

function createMetaLine(text) {
    const meta = document.createElement('small');
    meta.className = 'punishment-meta';
    meta.textContent = text;
    return meta;
}

function setPunishmentTableMessage(message) {
    const body = document.getElementById('punishmentTableBody');
    if (!body) return;

    body.innerHTML = '';

    const row = document.createElement('tr');
    const cell = createCell(message, 'table-empty');
    cell.colSpan = 7;
    row.appendChild(cell);
    body.appendChild(row);
}

function renderPunishmentRow(punishment) {
    const row = document.createElement('tr');

    const typeLabel = PUNISHMENT_LABELS[punishment.type] || punishment.type;
    const typeClass = PUNISHMENT_CLASSES[punishment.type] || 'pill-muted';

    const punishmentCell = createCell();
    const typePill = document.createElement('span');
    typePill.className = `pill ${typeClass}`;
    typePill.textContent = typeLabel;
    punishmentCell.appendChild(typePill);
    punishmentCell.appendChild(createMetaLine(punishment.id || 'No ID'));
    row.appendChild(punishmentCell);

    const offenderCell = createCell();
    const offenderName = punishment.playerName
        || punishment.discordTag
        || punishment.uuid
        || punishment.discordId
        || 'Unknown player';
    const offenderStrong = document.createElement('strong');
    offenderStrong.textContent = offenderName;
    offenderCell.appendChild(offenderStrong);

    const offenderMeta = punishment.uuid || punishment.discordId;
    if (offenderMeta) offenderCell.appendChild(createMetaLine(offenderMeta));
    row.appendChild(offenderCell);

    const sourceCell = createCell();
    const sourceTag = document.createElement('span');
    sourceTag.className = 'source-tag';
    sourceTag.textContent = punishment.source === 'minecraft' ? 'Minecraft' : 'Discord';
    sourceCell.appendChild(sourceTag);
    row.appendChild(sourceCell);

    const moderatorCell = createCell();
    const moderatorName = punishment.moderatorName || 'Unknown';
    const moderatorStrong = document.createElement('strong');
    moderatorStrong.textContent = moderatorName;
    moderatorCell.appendChild(moderatorStrong);

    if (punishment.moderatorId) {
        moderatorCell.appendChild(createMetaLine(punishment.moderatorId));
    }
    row.appendChild(moderatorCell);

    row.appendChild(createCell(punishment.reason || 'No reason provided.'));

    const durationCell = createCell(formatPunishmentDuration(punishment));

    if (punishment.expiresAt && punishment.status === 'active') {
        durationCell.appendChild(createMetaLine(`Ends ${formatPunishmentDate(punishment.expiresAt)}`));
    }
    row.appendChild(durationCell);

    const statusCell = createCell();
    const statusPill = document.createElement('span');
    statusPill.className = `pill ${STATUS_CLASSES[punishment.status] || 'pill-muted'}`;
    statusPill.textContent = STATUS_LABELS[punishment.status] || punishment.status || 'Unknown';
    statusCell.appendChild(statusPill);
    statusCell.appendChild(createMetaLine(formatPunishmentDate(punishment.createdAt)));
    row.appendChild(statusCell);

    return row;
}

function renderPunishmentTicker(punishments) {
    const ticker = document.getElementById('overviewSyncTicker');
    if (!ticker) return;

    ticker.innerHTML = '';

    if (!punishments.length) {
        const empty = document.createElement('div');
        empty.className = 'console-row';
        empty.style.color = 'var(--text-muted)';
        empty.textContent = '[SYSTEM] No punishments have been synced for this guild yet.';
        ticker.appendChild(empty);
        return;
    }

    const recent = punishments.slice(0, 10).reverse();

    for (const punishment of recent) {
        const line = document.createElement('div');
        line.className = 'console-row';

        if (punishment.type === 'ban') {
            line.style.color = 'var(--danger)';
        } else if (punishment.type === 'unban' || punishment.type === 'unmute') {
            line.style.color = 'var(--success)';
        } else if (punishment.type === 'warn' || punishment.type === 'mute' || punishment.type === 'tempban') {
            line.style.color = 'var(--warning)';
        } else {
            line.style.color = 'var(--text-muted)';
        }

        const timestamp = new Date(punishment.createdAt).toLocaleTimeString();
        const typeLabel = PUNISHMENT_LABELS[punishment.type] || punishment.type;
        const player = punishment.playerName || punishment.discordTag || punishment.uuid || punishment.discordId || 'Unknown player';
        const source = punishment.source === 'minecraft' ? 'Minecraft' : 'Discord';

        line.textContent = `[${timestamp}] ${typeLabel}: ${player} by ${punishment.moderatorName || 'Unknown'} (${source}) — ${punishment.reason}`;
        ticker.appendChild(line);
    }

    ticker.scrollTop = ticker.scrollHeight;
}

function renderPunishments(punishments, summary) {
    const body = document.getElementById('punishmentTableBody');
    if (!body) return;

    const stat = document.getElementById('statPunishments');
    const statMeta = document.getElementById('statPunishmentsMeta');

    if (stat) stat.textContent = summary?.total ?? punishments.length;
    if (statMeta) statMeta.textContent = `${summary?.active ?? 0} Active`;

    body.innerHTML = '';

    if (!punishments.length) {
        setPunishmentTableMessage('No punishments have been issued for this guild yet.');
        renderPunishmentTicker([]);
        return;
    }

    for (const punishment of punishments) {
        body.appendChild(renderPunishmentRow(punishment));
    }

    renderPunishmentTicker(punishments);
}

async function loadPunishments() {
    if (punishmentsLoading) return;

    const token = getSessionToken();

    if (!token) {
        setPunishmentTableMessage('No dashboard session found. Please log in again.');
        return;
    }

    punishmentsLoading = true;
    setPunishmentTableMessage('Loading punishments...');

    try {
        const response = await fetch(`${API_BASE}/api/punishments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.status === 401) {
            setPunishmentTableMessage('Your dashboard session expired. Please log in again.');
            return;
        }

        if (!response.ok) {
            setPunishmentTableMessage(`Failed to load punishments (HTTP ${response.status}).`);
            return;
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.punishments)) {
            setPunishmentTableMessage('The punishment API returned an unexpected response.');
            return;
        }

        renderPunishments(data.punishments, data.summary);
    } catch (error) {
        console.error('[PUNISHMENTS] Failed to load punishment log:', error);
        setPunishmentTableMessage('Could not reach the punishment API. Please try again.');
    } finally {
        punishmentsLoading = false;
    }
}

let verificationSettingsLoading = false;
let verificationSettingsSaving = false;

function setVerificationStatus(message, type = 'info') {
    for (const id of ['verificationSaveStatus', 'verificationRoleStatus']) {
        const element = document.getElementById(id);
        if (!element) continue;

        element.textContent = message || '';
        element.classList.remove('success', 'error');

        if (type === 'success') element.classList.add('success');
        if (type === 'error') element.classList.add('error');
    }
}

async function dashboardApi(path, options = {}) {
    const token = getSessionToken();

    if (!token) {
        const error = new Error('No dashboard session found. Please log in again.');
        error.status = 401;
        throw error;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Accept': 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        const error = new Error(data.message || `Request failed (HTTP ${response.status}).`);
        error.status = response.status;
        throw error;
    }

    return data;
}

function populateVerificationSelect(select, items, selectedId, placeholder) {
    if (!select) return;

    select.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    for (const item of items) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    }

    if (selectedId && !items.some(item => item.id === selectedId)) {
        const missingOption = document.createElement('option');
        missingOption.value = selectedId;
        missingOption.textContent = `${selectedId} (not found)`;
        select.appendChild(missingOption);
    }

    select.value = selectedId || '';
}

function applyVerificationSettings(settings) {
    const embed = settings.embed || {};

    const channelSelect = document.getElementById('verificationChannelSelect');
    const roleSelect = document.getElementById('verificationRoleSelect');
    const titleInput = document.getElementById('verificationEmbedTitle');
    const descriptionInput = document.getElementById('verificationEmbedDescription');
    const colorInput = document.getElementById('verificationEmbedColor');
    const footerInput = document.getElementById('verificationEmbedFooter');
    const buttonInput = document.getElementById('verificationButtonLabel');

    if (channelSelect) channelSelect.value = settings.channelId || '';
    if (roleSelect) roleSelect.value = settings.roleId || '';
    if (titleInput) titleInput.value = embed.title || '';
    if (descriptionInput) descriptionInput.value = embed.description || '';
    if (colorInput) colorInput.value = embed.color || '#5FBFF9';
    if (footerInput) footerInput.value = embed.footer || '';
    if (buttonInput) buttonInput.value = embed.buttonLabel || '';

    updateVerificationPreview();
}

function renderVerificationUsage(usage) {
    const element = document.getElementById('verificationUsage');
    const planBadge = document.querySelector('.sidebar-footer .tier-badge');

    if (!element) return;

    if (!usage) {
        element.textContent = '';
        element.classList.remove('limit-reached');
        return;
    }

    const used = usage.used ?? 0;

    if (usage.limit === null || usage.limit === undefined) {
        element.textContent = `${usage.planName} plan · ${used} verifications (unlimited)`;
    } else {
        element.textContent = `${usage.planName} plan · ${used} / ${usage.limit} verifications used`;
    }

    element.classList.toggle('limit-reached', !!usage.reached);

    if (planBadge) {
        planBadge.textContent = `Plan: ${usage.planName}`;
    }
}

function updateVerificationPreview() {
    const titleInput = document.getElementById('verificationEmbedTitle');
    const descriptionInput = document.getElementById('verificationEmbedDescription');
    const colorInput = document.getElementById('verificationEmbedColor');
    const footerInput = document.getElementById('verificationEmbedFooter');
    const buttonInput = document.getElementById('verificationButtonLabel');

    const previewTitle = document.getElementById('verificationPreviewTitle');
    const previewDescription = document.getElementById('verificationPreviewDescription');
    const previewAccent = document.getElementById('verificationPreviewAccent');
    const previewFooter = document.getElementById('verificationPreviewFooter');
    const previewButton = document.getElementById('verificationPreviewButton');

    if (previewTitle) previewTitle.textContent = titleInput?.value.trim() || 'Verify your Minecraft account';
    if (previewDescription) previewDescription.textContent = descriptionInput?.value.trim() || 'Your embed description will appear here.';
    if (previewAccent) previewAccent.style.background = colorInput?.value || '#5FBFF9';
    if (previewFooter) previewFooter.textContent = footerInput?.value.trim() || '';
    if (previewButton) previewButton.textContent = buttonInput?.value.trim() || 'Verify Account';
}

function collectVerificationSettings() {
    return {
        channelId: document.getElementById('verificationChannelSelect')?.value || null,
        roleId: document.getElementById('verificationRoleSelect')?.value || null,
        embed: {
            title: document.getElementById('verificationEmbedTitle')?.value || '',
            description: document.getElementById('verificationEmbedDescription')?.value || '',
            color: document.getElementById('verificationEmbedColor')?.value || '#5FBFF9',
            footer: document.getElementById('verificationEmbedFooter')?.value || '',
            buttonLabel: document.getElementById('verificationButtonLabel')?.value || ''
        }
    };
}

async function loadVerificationSettings() {
    if (verificationSettingsLoading) return;

    verificationSettingsLoading = true;
    setVerificationStatus('Loading verification settings...');

    try {
        const [settingsResponse, channelsResponse, rolesResponse] = await Promise.all([
            dashboardApi('/api/verification/settings'),
            dashboardApi('/api/discord/channels'),
            dashboardApi('/api/discord/roles')
        ]);

        const settings = settingsResponse.settings || {};
        const channels = (channelsResponse.channels || [])
            .filter(channel => channel.type === 0 || channel.type === 5)
            .sort((left, right) => left.name.localeCompare(right.name));
        const roles = rolesResponse.roles || [];

        populateVerificationSelect(
            document.getElementById('verificationChannelSelect'),
            channels,
            settings.channelId,
            'Select a channel'
        );
        populateVerificationSelect(
            document.getElementById('verificationRoleSelect'),
            roles,
            settings.roleId,
            'No verified role'
        );

        applyVerificationSettings(settings);
        renderVerificationUsage(settingsResponse.usage);
        setVerificationStatus('');
    } catch (error) {
        console.error('[VERIFICATION] Failed to load settings:', error);
        setVerificationStatus(
            error.status === 401
                ? 'Your dashboard session expired. Please log in again.'
                : error.message,
            'error'
        );
    } finally {
        verificationSettingsLoading = false;
    }
}

async function saveVerificationSettings() {
    if (verificationSettingsSaving) return false;

    verificationSettingsSaving = true;
    setVerificationStatus('Saving verification settings...');

    try {
        const data = await dashboardApi('/api/verification/settings', {
            method: 'PUT',
            body: JSON.stringify(collectVerificationSettings())
        });

        if (data.settings) {
            applyVerificationSettings(data.settings);
        }

        if (data.usage) {
            renderVerificationUsage(data.usage);
        }

        setVerificationStatus('Verification settings saved.', 'success');
        return true;
    } catch (error) {
        console.error('[VERIFICATION] Failed to save settings:', error);
        setVerificationStatus(
            error.status === 401
                ? 'Your dashboard session expired. Please log in again.'
                : error.message,
            'error'
        );
        return false;
    } finally {
        verificationSettingsSaving = false;
    }
}

async function sendVerificationEmbed() {
    const channelSelect = document.getElementById('verificationChannelSelect');

    if (!channelSelect?.value) {
        setVerificationStatus('Select a verification channel first.', 'error');
        return;
    }

    const saved = await saveVerificationSettings();

    if (!saved) return;

    const sendButton = document.getElementById('verificationSendBtn');

    if (sendButton) sendButton.disabled = true;

    setVerificationStatus('Sending verification embed...');

    try {
        await dashboardApi('/api/verification/embed', { method: 'POST' });

        const channelName = channelSelect.options[channelSelect.selectedIndex]?.textContent || 'the selected channel';
        setVerificationStatus(`Verification embed sent to ${channelName}.`, 'success');
    } catch (error) {
        console.error('[VERIFICATION] Failed to send embed:', error);
        setVerificationStatus(
            error.status === 401
                ? 'Your dashboard session expired. Please log in again.'
                : error.message,
            'error'
        );
    } finally {
        if (sendButton) sendButton.disabled = false;
    }
}

let logSettingsLoading = false;
let logSettingsSaving = false;

function setLogSettingsStatus(message, type = 'info') {
    const element = document.getElementById('logSettingsStatus');
    if (!element) return;

    element.textContent = message || '';
    element.classList.remove('success', 'error');

    if (type === 'success') element.classList.add('success');
    if (type === 'error') element.classList.add('error');
}

async function loadLogSettings() {
    if (logSettingsLoading) return;

    logSettingsLoading = true;
    setLogSettingsStatus('Loading log settings...');

    try {
        const [settingsResponse, channelsResponse] = await Promise.all([
            dashboardApi('/api/logs/settings'),
            dashboardApi('/api/discord/channels')
        ]);

        const settings = settingsResponse.settings || {};
        const channels = (channelsResponse.channels || [])
            .filter(channel => channel.type === 0 || channel.type === 5)
            .sort((left, right) => left.name.localeCompare(right.name));

        populateVerificationSelect(
            document.getElementById('logChannelSelect'),
            channels,
            settings.channelId,
            'No log channel'
        );

        setLogSettingsStatus(
            settings.channelId ? 'Log relay is enabled.' : 'Log relay is disabled.',
            settings.channelId ? 'success' : 'info'
        );
    } catch (error) {
        console.error('[LOG SETTINGS] Failed to load settings:', error);
        setLogSettingsStatus(
            error.status === 401
                ? 'Your dashboard session expired. Please log in again.'
                : error.message,
            'error'
        );
    } finally {
        logSettingsLoading = false;
    }
}

async function saveLogSettings() {
    if (logSettingsSaving) return;

    logSettingsSaving = true;
    setLogSettingsStatus('Saving log channel...');

    try {
        const channelId = document.getElementById('logChannelSelect')?.value || null;
        const data = await dashboardApi('/api/logs/settings', {
            method: 'PUT',
            body: JSON.stringify({ channelId })
        });

        setLogSettingsStatus(
            data.settings?.channelId ? 'Log channel saved.' : 'Log relay disabled.',
            'success'
        );
    } catch (error) {
        console.error('[LOG SETTINGS] Failed to save settings:', error);
        setLogSettingsStatus(
            error.status === 401
                ? 'Your dashboard session expired. Please log in again.'
                : error.message,
            'error'
        );
    } finally {
        logSettingsSaving = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('session-token');
            window.location.href = '../login/login.html';
        });
    }

    for (const id of [
        'verificationEmbedTitle',
        'verificationEmbedDescription',
        'verificationEmbedColor',
        'verificationEmbedFooter',
        'verificationButtonLabel'
    ]) {
        document.getElementById(id)?.addEventListener('input', updateVerificationPreview);
    }

    loadPunishments();
    loadVerificationSettings();
    loadLogSettings();
});
