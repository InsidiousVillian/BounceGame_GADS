/**
 * Progressive onboarding for Velvet Rope — state machine with explicit listener lifecycle.
 */

import { queuePointer } from './QueuePointer.js';

export const Steps = {
  INTRO: 0,
  INSPECT: 1,
  DIALOGUE: 2,
  DECISION: 3,
  DONE: 4,
};

const LS_TUTORIAL_DONE = 'velvetRope_tutorialDone';

/** Static tutorial patron — same field schema as NPCSystem.generateNpcData(). */
export const TUTORIAL_GUEST_DATA = {
  name: 'Riley Shaw',
  age: 19,
  isValidID: true,
  isMinor: true,
  isVip: false,
  idSector: 4,
  reasonForEntry: 'Birthday — just one drink with friends',
  vibeContribution: 10,
  idNumber: '482917365',
  vipAnnexLine: '',
  aggressionChance: 0,
  portraitSvg:
    '<svg class="id-portrait-svg" viewBox="0 0 88 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="tut-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d4d8dc"/><stop offset="100%" stop-color="#9aa3ad"/></linearGradient></defs>' +
    '<rect width="88" height="112" fill="url(#tut-bg)"/>' +
    '<circle cx="44" cy="52" r="22" fill="#4a6670" opacity="0.94"/>' +
    '<circle cx="34" cy="46" r="4" fill="#2a5c5c" opacity="0.94"/>' +
    '<circle cx="54" cy="46" r="4" fill="#2a5c5c" opacity="0.94"/>' +
    '</svg>',
  securitySealVariant: 'valid',
  hairStyle: 'Black',
  hasPiercings: false,
  vibeType: 'Punk',
  idHairStyle: 'Black',
  idHasPiercings: false,
  idVibeType: 'Punk',
};

/** Fixed line shown in the dialogue step (behavioral tell vs ID age). */
export const TUTORIAL_DIALOGUE_LINE =
  'Come on — the hologram is real, I just look young. Everyone inside knows me.';

const STEP_COPY = {
  [Steps.INTRO]: {
    text: 'Welcome to the rope. This quick walkthrough shows how to read a guest before the shift gets hectic.',
    showNext: true,
  },
  [Steps.INSPECT]: {
    text: 'Study the ID card: name, age, seal, and status. Mismatch what you see on the floor and you pay in Chaos.',
    showNext: true,
  },
  [Steps.DIALOGUE]: {
    text: 'Listen to what they say. Excuses, pressure, and stories that do not match the document are clues — not small talk.',
    showNext: true,
  },
  [Steps.DECISION]: {
    text: 'Make the call. Riley is 19 with a valid minor ID. Letting them in adds Chaos; denying a bad entry keeps the line clean.',
    showNext: false,
  },
};

export class TutorialManager {
  /**
   * @param {object} deps
   * @param {object} deps.elements — DOM refs
   * @param {object} deps.callbacks — game hooks (mount guest, inspection, live shift)
   */
  constructor({ elements, callbacks }) {
    this.el = elements;
    this.cb = callbacks;
    this.step = Steps.DONE;
    /** @type {(() => void)|null} */
    this.onComplete = null;
    /** @type {object|null} */
    this.tutorialNpc = null;

    this._onNextClick = this._onNextClick.bind(this);
    this._onContinueClick = this._onContinueClick.bind(this);
    this._onDecisionLetIn = this._onDecisionLetIn.bind(this);
    this._onDecisionDeny = this._onDecisionDeny.bind(this);
    this._blockPointer = this._blockPointer.bind(this);
    this._blockKeyboard = this._blockKeyboard.bind(this);
  }

  isActive() {
    return this.step >= Steps.INTRO && this.step < Steps.DONE;
  }

  isDecisionStep() {
    return this.step === Steps.DECISION;
  }

  shouldSkip() {
    try {
      return localStorage.getItem(LS_TUTORIAL_DONE) === '1';
    } catch (_) {
      return false;
    }
  }

  /** Clear saved completion so the next shift runs onboarding again. */
  static resetProgress() {
    try {
      localStorage.removeItem(LS_TUTORIAL_DONE);
    } catch (_) {
      /* ignore */
    }
  }

  /**
   * @param {() => void} onComplete
   * @param {{ force?: boolean }} [options]
   */
  start(onComplete, options = {}) {
    if (!options.force && this.shouldSkip()) {
      onComplete();
      return;
    }

    this.onComplete = onComplete;
    this.step = Steps.INTRO;
    this.tutorialNpc = null;

    document.body.classList.add('tutorial-active');
    this.el.root.classList.remove('hidden');
    this._bindGlobalBlockers();
    this._enterStep();
  }

  blocksKeyboard(e) {
    if (!this.isActive()) return false;
    if (this.step === Steps.DECISION && (e.code === 'Enter' || e.key === 'Enter')) return false;
    return true;
  }

  _bindGlobalBlockers() {
    document.addEventListener('keydown', this._blockKeyboard, true);
    if (this.el.uiOverlay) {
      this.el.uiOverlay.addEventListener('click', this._blockPointer, true);
    }
  }

  _unbindGlobalBlockers() {
    document.removeEventListener('keydown', this._blockKeyboard, true);
    if (this.el.uiOverlay) {
      this.el.uiOverlay.removeEventListener('click', this._blockPointer, true);
    }
  }

  _blockKeyboard(e) {
    if (!this.isActive()) return;
    e.preventDefault();
    e.stopPropagation();
  }

  _blockPointer(e) {
    if (!this.isActive()) return;
    const t = e.target;
    if (t && typeof t.closest === 'function') {
      if (t.closest('.tutorial-tooltip')) return;
      if (t.closest('.tutorial-highlight')) return;
      if (this.step === Steps.DECISION && t.closest('#btn-let-in, #btn-deny')) return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  _bindStepListeners() {
    if (this.el.btnNext) {
      this.el.btnNext.addEventListener('click', this._onNextClick);
    }
    if (this.el.btnContinue) {
      this.el.btnContinue.addEventListener('click', this._onContinueClick);
    }
  }

  _unbindStepListeners() {
    if (this.el.btnNext) {
      this.el.btnNext.removeEventListener('click', this._onNextClick);
    }
    if (this.el.btnContinue) {
      this.el.btnContinue.removeEventListener('click', this._onContinueClick);
    }
    this._unbindDecisionListeners();
  }

  _bindDecisionListeners() {
    if (this.el.btnLetIn) {
      this.el.btnLetIn.addEventListener('click', this._onDecisionLetIn, true);
    }
    if (this.el.btnDeny) {
      this.el.btnDeny.addEventListener('click', this._onDecisionDeny, true);
    }
  }

  _unbindDecisionListeners() {
    if (this.el.btnLetIn) {
      this.el.btnLetIn.removeEventListener('click', this._onDecisionLetIn, true);
    }
    if (this.el.btnDeny) {
      this.el.btnDeny.removeEventListener('click', this._onDecisionDeny, true);
    }
  }

  _clearHighlightClasses() {
    document.body.classList.remove('tutorial-step-intro', 'tutorial-step-inspect', 'tutorial-step-dialogue', 'tutorial-step-decision');
    if (this.el.inspectionMenu) this.el.inspectionMenu.classList.remove('tutorial-highlight');
    if (this.el.idCard) this.el.idCard.classList.remove('tutorial-highlight');
    if (this.el.dialogueCallout) this.el.dialogueCallout.classList.remove('tutorial-highlight');
    if (this.el.inspectActions) this.el.inspectActions.classList.remove('tutorial-highlight');
    if (this.el.btnTraitMismatch) this.el.btnTraitMismatch.classList.remove('tutorial-disabled');
  }

  _setTooltip(text, { showNext = false, showContinue = false } = {}) {
    if (this.el.tooltipText) this.el.tooltipText.textContent = text;
    if (this.el.btnNext) this.el.btnNext.classList.toggle('hidden', !showNext);
    if (this.el.btnContinue) this.el.btnContinue.classList.toggle('hidden', !showContinue);
    if (this.el.tooltip) this.el.tooltip.classList.remove('hidden');
  }

  _hideQueuePointer() {
    queuePointer.hidePointer();
    this.cb.hideQueueFrontAnchor?.();
  }

  _enterStep() {
    this._unbindStepListeners();
    this._clearHighlightClasses();
    this._hideQueuePointer();

    const copy = STEP_COPY[this.step];
    if (!copy) return;

    switch (this.step) {
      case Steps.INTRO:
        document.body.classList.add('tutorial-step-intro');
        this._hideDialogueCallout();
        this.cb.hideInspection?.();
        this._setTooltip(copy.text, { showNext: copy.showNext });
        break;

      case Steps.INSPECT:
        document.body.classList.add('tutorial-step-inspect');
        this._hideDialogueCallout();
        this.tutorialNpc = this.cb.mountTutorialGuest?.(TUTORIAL_GUEST_DATA) ?? null;
        this.cb.syncQueueFrontAnchor?.(this.tutorialNpc);
        queuePointer.showPointerAt('queue-front-anchor', 'Patron at the rope');
        this.cb.showInspection?.(this.tutorialNpc, { skipGreeting: true });
        if (this.el.inspectionMenu) this.el.inspectionMenu.classList.add('tutorial-highlight');
        if (this.el.idCard) this.el.idCard.classList.add('tutorial-highlight');
        this._setTooltip(copy.text, { showNext: copy.showNext });
        break;

      case Steps.DIALOGUE:
        document.body.classList.add('tutorial-step-dialogue');
        if (this.tutorialNpc) {
          this.tutorialNpc._bubbleCustomText = TUTORIAL_DIALOGUE_LINE;
          this.tutorialNpc._bubbleFallbackLine = false;
        }
        this.cb.hideInspection?.();
        this._showDialogueCallout(TUTORIAL_DIALOGUE_LINE);
        if (this.el.dialogueCallout) this.el.dialogueCallout.classList.add('tutorial-highlight');
        this._setTooltip(copy.text, { showNext: copy.showNext });
        break;

      case Steps.DECISION:
        document.body.classList.add('tutorial-step-decision');
        this._hideDialogueCallout();
        this.cb.showInspection?.(this.tutorialNpc, {
          skipGreeting: true,
          staticGreeting: TUTORIAL_DIALOGUE_LINE,
        });
        if (this.el.inspectionMenu) this.el.inspectionMenu.classList.add('tutorial-highlight');
        if (this.el.inspectActions) this.el.inspectActions.classList.add('tutorial-highlight');
        if (this.el.btnTraitMismatch) this.el.btnTraitMismatch.classList.add('tutorial-disabled');
        this._setTooltip(copy.text, { showNext: false });
        this._bindDecisionListeners();
        break;

      default:
        break;
    }

    this._bindStepListeners();
  }

  _showDialogueCallout(line) {
    if (this.el.dialogueText) this.el.dialogueText.textContent = line;
    if (this.el.dialogueCallout) this.el.dialogueCallout.classList.remove('hidden');
  }

  _hideDialogueCallout() {
    if (this.el.dialogueCallout) this.el.dialogueCallout.classList.add('hidden');
    if (this.el.dialogueCallout) this.el.dialogueCallout.classList.remove('tutorial-highlight');
  }

  _onNextClick() {
    if (this.step === Steps.INTRO) this.step = Steps.INSPECT;
    else if (this.step === Steps.INSPECT) this.step = Steps.DIALOGUE;
    else if (this.step === Steps.DIALOGUE) this.step = Steps.DECISION;
    else return;
    this._enterStep();
  }

  _onDecisionLetIn(e) {
    if (this.step !== Steps.DECISION) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    this._unbindDecisionListeners();
    this._setTooltip(
      'Not quite — Riley is a verified minor (19). Letting them in would spike Chaos and count as a mistake on your shift report.',
      { showContinue: true }
    );
  }

  _onDecisionDeny(e) {
    if (this.step !== Steps.DECISION) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    this._unbindDecisionListeners();
    this._setTooltip(
      'Correct. Denying underage guests — even with a real ID — keeps Chaos down. In live play, patrons may push back; read the card and their story together.',
      { showContinue: true }
    );
  }

  _onContinueClick() {
    this.finish();
  }

  finish() {
    this.step = Steps.DONE;
    this._unbindStepListeners();
    this._unbindGlobalBlockers();
    this._clearHighlightClasses();
    this._hideDialogueCallout();
    this._hideQueuePointer();

    document.body.classList.remove('tutorial-active');
    if (this.el.root) this.el.root.classList.add('hidden');
    if (this.el.tooltip) this.el.tooltip.classList.add('hidden');

    this.cb.hideInspection?.();
    this.cb.clearTutorialGuest?.();
    this.tutorialNpc = null;

    try {
      localStorage.setItem(LS_TUTORIAL_DONE, '1');
    } catch (_) {
      /* ignore */
    }

    const done = this.onComplete;
    this.onComplete = null;
    if (typeof done === 'function') done();
  }
}
