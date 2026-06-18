/**
 * Floating queue pointer — anchors to a DOM target with CSS-driven motion.
 */

const DEFAULT_GAP_PX = 10;

export class QueuePointer {
  /**
   * @param {object} [options]
   * @param {HTMLElement} [options.mountNode=document.body]
   * @param {number} [options.zIndex=99]
   */
  constructor(options = {}) {
    this.mountNode = options.mountNode || document.body;
    this.zIndex = options.zIndex ?? 99;
    /** @type {HTMLElement|null} */
    this._root = null;
    /** @type {HTMLElement|null} */
    this._iconEl = null;
    /** @type {HTMLElement|null} */
    this._messageEl = null;
    /** @type {HTMLElement|null} */
    this._targetEl = null;
    this._visible = false;
    /** @type {number|null} */
    this._rafId = null;

    this._onResize = this._onResize.bind(this);
    this._followFrame = this._followFrame.bind(this);
  }

  isVisible() {
    return this._visible;
  }

  /**
   * @param {HTMLElement|string|null|undefined} elementOrId
   * @param {string} [messageText=""]
   */
  showPointerAt(elementOrId, messageText = '') {
    const target = this._resolveTarget(elementOrId);
    if (!target) {
      console.warn('[QueuePointer] Target not found:', elementOrId);
      return;
    }

    this._ensureRoot();
    this._targetEl = target;
    this._visible = true;

    if (this._messageEl) {
      const msg = String(messageText ?? '').trim();
      this._messageEl.textContent = msg;
      this._messageEl.classList.toggle('hidden', msg === '');
    }

    this._root.classList.remove('hidden');
    this._positionPointer();
    this._bindListeners();
    this._startFollowLoop();
  }

  hidePointer() {
    this._visible = false;
    this._targetEl = null;
    this._stopFollowLoop();
    this._unbindListeners();

    if (this._root) {
      this._root.classList.add('hidden');
      this._root.style.left = '';
      this._root.style.top = '';
    }

    if (this._messageEl) {
      this._messageEl.textContent = '';
      this._messageEl.classList.add('hidden');
    }
  }

  /** Re-read target rect — useful if an anchor was repositioned externally. */
  refreshPointerPosition() {
    if (!this._visible || !this._targetEl) return;
    this._positionPointer();
  }

  destroy() {
    this.hidePointer();
    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
    this._iconEl = null;
    this._messageEl = null;
  }

  _resolveTarget(elementOrId) {
    if (!elementOrId) return null;
    if (typeof elementOrId === 'string') {
      return document.getElementById(elementOrId);
    }
    if (elementOrId instanceof Element) return elementOrId;
    return null;
  }

  _ensureRoot() {
    if (this._root) return;

    const root = document.createElement('div');
    root.id = 'queue-pointer';
    root.className = 'queue-pointer hidden';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.style.zIndex = String(this.zIndex);

    const icon = document.createElement('div');
    icon.className = 'queue-pointer-icon';
    icon.setAttribute('aria-hidden', 'true');

    const message = document.createElement('p');
    message.className = 'queue-pointer-message hidden';

    root.append(icon, message);
    this.mountNode.appendChild(root);

    this._root = root;
    this._iconEl = icon;
    this._messageEl = message;
  }

  _positionPointer() {
    if (!this._root || !this._targetEl) return;

    const rect = this._targetEl.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) return;

    this._root.classList.remove('queue-pointer--side');

    const pointerRect = this._root.getBoundingClientRect();
    const pointerW = pointerRect.width || 48;
    const pointerH = pointerRect.height || 56;

    let left = rect.left + rect.width / 2 - pointerW / 2;
    let top = rect.top - pointerH - DEFAULT_GAP_PX;

    const pad = 8;
    const maxLeft = window.innerWidth - pointerW - pad;
    left = Math.max(pad, Math.min(left, maxLeft));

    if (top < pad) {
      top = rect.bottom + DEFAULT_GAP_PX;
      this._root.classList.add('queue-pointer--side');
    }

    this._root.style.left = `${Math.round(left)}px`;
    this._root.style.top = `${Math.round(top)}px`;
  }

  _bindListeners() {
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _unbindListeners() {
    window.removeEventListener('resize', this._onResize);
  }

  _onResize() {
    this._positionPointer();
  }

  _startFollowLoop() {
    this._stopFollowLoop();
    this._rafId = requestAnimationFrame(this._followFrame);
  }

  _stopFollowLoop() {
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _followFrame() {
    if (!this._visible) return;
    this._positionPointer();
    this._rafId = requestAnimationFrame(this._followFrame);
  }
}

/** Shared instance for game + tutorial use. */
export const queuePointer = new QueuePointer();
