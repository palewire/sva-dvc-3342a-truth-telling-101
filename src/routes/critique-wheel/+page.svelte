<script lang="ts">
  type Phase = 'setup' | 'order' | 'session' | 'complete';

  interface Participant {
    id: number;
    name: string;
    label: string;
  }

  interface FeedbackPrompt {
    short: string;
    full: string;
  }

  interface FeedbackResult {
    participant: Participant;
    prompt: FeedbackPrompt;
  }

  interface PresentationTurn {
    presenter: Participant;
    reviewers: Participant[];
  }

  const DEFAULT_PROMPTS = ['Name a strength', 'Ask a question', 'Suggest a next step'];
  const WHEEL_COLORS = [
    { fill: '#d21c00', text: '#ffffff' },
    { fill: '#29b5cf', text: '#292929' },
    { fill: '#ffe588', text: '#292929' },
    { fill: '#494949', text: '#ffffff' }
  ];
  const WHEEL_SIZE = 360;
  const WHEEL_CENTER = WHEEL_SIZE / 2;
  const WHEEL_RADIUS = WHEEL_SIZE / 2 - 16;
  const SPIN_DURATION = 2400;

  let phase = $state<Phase>('setup');
  let rawRoster = $state('');
  let rawPrompts = $state(DEFAULT_PROMPTS.join('\n'));
  let presentationOrder = $state<Participant[]>([]);
  let presentationTurns = $state<PresentationTurn[]>([]);
  let presenterIndex = $state(0);
  let roundResults = $state<FeedbackResult[]>([]);
  let isSpinning = $state(false);
  let wheelRotation = $state(0);
  let promptRotation = $state(0);
  let spinTimer: ReturnType<typeof setTimeout> | undefined;

  let pendingParticipantId: number | null = null;
  let pendingPromptIndex: number | null = null;

  const participants = $derived.by(() => {
    const names = rawRoster
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);

    return names.map((name, id) => {
      const occurrence = names.slice(0, id + 1).filter((item) => item === name).length;
      const total = names.filter((item) => item === name).length;
      return {
        id,
        name,
        label: total > 1 ? `${name} (${occurrence})` : name
      };
    });
  });

  const prompts = $derived.by(() =>
    rawPrompts
      .split(/\r?\n/)
      .map((prompt) => prompt.trim())
      .filter(Boolean)
      .map((prompt) => ({ short: prompt, full: prompt }))
  );
  const setupError = $derived.by(() => {
    if (participants.length < 2) return 'Enter at least two names, one per line.';
    if (prompts.length === 0) return 'Enter at least one feedback prompt.';
    return '';
  });
  const currentTurn = $derived(presentationTurns[presenterIndex]);
  const currentPresenter = $derived(currentTurn?.presenter);
  const audience = $derived(
    currentPresenter
      ? presentationOrder.filter((participant) => participant.id !== currentPresenter.id)
      : []
  );
  const roundComplete = $derived(
    !!currentTurn && roundResults.length >= currentTurn.reviewers.length
  );

  const canonicalRoot = import.meta.env.VITE_CANONICAL_URL?.replace(/\/+$/, '');
  const canonicalUrl = canonicalRoot ? `${canonicalRoot}/critique-wheel/` : undefined;

  function segmentPath(index: number, total: number): string {
    if (total === 1) {
      const top = WHEEL_CENTER - WHEEL_RADIUS;
      const bottom = WHEEL_CENTER + WHEEL_RADIUS;
      return `M ${WHEEL_CENTER} ${top} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 1 1 ${WHEEL_CENTER} ${bottom} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 1 1 ${WHEEL_CENTER} ${top} Z`;
    }

    const angle = (2 * Math.PI) / total;
    const start = index * angle - Math.PI / 2;
    const end = start + angle;
    const startX = WHEEL_CENTER + WHEEL_RADIUS * Math.cos(start);
    const startY = WHEEL_CENTER + WHEEL_RADIUS * Math.sin(start);
    const endX = WHEEL_CENTER + WHEEL_RADIUS * Math.cos(end);
    const endY = WHEEL_CENTER + WHEEL_RADIUS * Math.sin(end);
    const largeArc = angle > Math.PI ? 1 : 0;
    return `M ${WHEEL_CENTER} ${WHEEL_CENTER} L ${startX} ${startY} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  function segmentLabelPosition(index: number, total: number) {
    const angle = (2 * Math.PI) / total;
    const middle = index * angle - Math.PI / 2 + angle / 2;
    const radius = WHEEL_RADIUS * 0.64;
    let rotation = (middle * 180) / Math.PI + 90;
    if (rotation > 90 && rotation < 270) rotation += 180;
    else if (rotation >= 270) rotation -= 180;

    return {
      x: WHEEL_CENTER + radius * Math.cos(middle),
      y: WHEEL_CENTER + radius * Math.sin(middle),
      rotation
    };
  }

  function labelLimit(total: number): number {
    return Math.max(5, Math.floor(84 / Math.max(1, total)));
  }

  function truncate(label: string, limit: number): string {
    return label.length > limit ? `${label.slice(0, limit - 1)}…` : label;
  }

  function rotationForTarget(
    currentRotation: number,
    index: number,
    total: number
  ): number {
    const segmentAngle = 360 / total;
    const segmentCenter = index * segmentAngle + segmentAngle / 2;
    const currentPosition = ((currentRotation % 360) + 360) % 360;
    const needed = (360 - ((segmentCenter + currentPosition) % 360)) % 360;
    return currentRotation + (needed === 0 ? 360 : needed) + 4 * 360;
  }

  function clearSpinTimer(): void {
    if (spinTimer !== undefined) clearTimeout(spinTimer);
    spinTimer = undefined;
    isSpinning = false;
    pendingParticipantId = null;
    pendingPromptIndex = null;
  }

  function buildPresentationTurns(order: Participant[]): PresentationTurn[] {
    const reviewerOffset = 1 + Math.floor(Math.random() * (order.length - 1));
    const turns = order.map((presenter, index) => ({
      presenter,
      reviewers: [order[(index + reviewerOffset) % order.length]!]
    }));

    if (order.length % 2 === 1) {
      const finalTurn = turns[turns.length - 1];
      const firstReviewer = finalTurn?.reviewers[0];
      if (finalTurn && firstReviewer) {
        const extraReviewerOptions = order.filter(
          (participant) =>
            participant.id !== finalTurn.presenter.id &&
            participant.id !== firstReviewer.id
        );
        const extraReviewer =
          extraReviewerOptions[Math.floor(Math.random() * extraReviewerOptions.length)];
        if (extraReviewer) finalTurn.reviewers.push(extraReviewer);
      }
    }

    return turns;
  }

  function handleRandomize(): void {
    if (setupError) return;
    const shuffled = [...participants];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    presentationOrder = shuffled;
    phase = 'order';
  }

  function beginRound(): void {
    roundResults = [];
  }

  function handleBeginSession(): void {
    presenterIndex = 0;
    presentationTurns = buildPresentationTurns(presentationOrder);
    beginRound();
    phase = 'session';
  }

  function handleSpin(): void {
    if (isSpinning || roundComplete || !currentTurn) return;

    const participant = currentTurn.reviewers[roundResults.length];
    const promptIndex =
      prompts.length === 1 ? 0 : Math.floor(Math.random() * prompts.length);
    if (!participant) return;

    const audienceIndex = audience.findIndex((item) => item.id === participant.id);
    pendingParticipantId = participant.id;
    pendingPromptIndex = promptIndex;
    wheelRotation = rotationForTarget(wheelRotation, audienceIndex, audience.length);
    if (prompts.length > 1) {
      promptRotation = rotationForTarget(promptRotation, promptIndex, prompts.length);
    }
    isSpinning = true;

    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 50
      : SPIN_DURATION;
    spinTimer = setTimeout(() => {
      const selectedParticipant = audience.find(
        (item) => item.id === pendingParticipantId
      );
      const selectedPrompt = prompts[pendingPromptIndex ?? -1];
      if (!selectedParticipant || !selectedPrompt) return;

      roundResults = [
        ...roundResults,
        { participant: selectedParticipant, prompt: selectedPrompt }
      ];
      pendingParticipantId = null;
      pendingPromptIndex = null;
      spinTimer = undefined;
      isSpinning = false;
    }, duration);
  }

  function handleNextPresenter(): void {
    if (!roundComplete) return;
    if (presenterIndex + 1 >= presentationOrder.length) {
      phase = 'complete';
      return;
    }
    presenterIndex += 1;
    beginRound();
  }

  function handleEditRoster(): void {
    clearSpinTimer();
    presentationOrder = [];
    presentationTurns = [];
    presenterIndex = 0;
    beginRound();
    phase = 'setup';
  }
</script>

<svelte:head>
  <title>Wheel of Feedback | Truth-Telling 101</title>
  <meta
    name="description"
    content="A classroom tool for organizing presentation order and peer feedback in Truth-Telling 101."
  />
  {#if canonicalUrl}
    <link rel="canonical" href={canonicalUrl} />
  {/if}
</svelte:head>

<main id="main-content" class="critique-page" tabindex="-1">
  <div class="container critique-container">
    {#if phase === 'setup'}
      <header class="critique-header">
        <p class="critique-kicker">Truth-Telling 101</p>
        <h1>Wheel of Feedback</h1>
      </header>

      <section class="setup-panel" aria-labelledby="roster-title">
        <div class="panel-heading">
          <p class="critique-kicker">Start here</p>
          <h2 id="roster-title">Build the roster</h2>
          <p id="roster-help">
            Enter one participant per line. Names are only kept in this browser tab.
          </p>
        </div>
        <label for="roster-input">Participant names</label>
        <textarea
          id="roster-input"
          bind:value={rawRoster}
          rows="9"
          placeholder="Enter one name per line"
          aria-describedby="roster-help roster-count"
          spellcheck="false"
        ></textarea>
        <p class="roster-count" id="roster-count" aria-live="polite">
          {participants.length}
          {participants.length === 1 ? 'name' : 'names'} entered
        </p>
        <label for="prompt-input">Feedback prompts</label>
        <textarea
          id="prompt-input"
          bind:value={rawPrompts}
          rows="4"
          placeholder="Enter one prompt per line"
          aria-describedby="prompt-help prompt-count"
        ></textarea>
        <p class="prompt-help" id="prompt-help">
          Enter one prompt per line. A single prompt is used for every response; two or
          more prompts create a second wheel.
        </p>
        <p class="roster-count" id="prompt-count" aria-live="polite">
          {prompts.length}
          {prompts.length === 1 ? 'prompt' : 'prompts'} entered
        </p>
        {#if setupError}
          <p class="setup-error" role="alert">{setupError}</p>
        {/if}
        <button
          class="tool-button tool-button-primary"
          onclick={handleRandomize}
          disabled={!!setupError}
        >
          Randomize presentation order
        </button>
        <p class="privacy-note">Your roster is not saved or sent anywhere.</p>
      </section>
    {:else if phase === 'order'}
      <header class="critique-header">
        <p class="critique-kicker">The order is set</p>
        <h1>Who presents first?</h1>
        <p>
          Here’s the randomized presentation order. You can still go back and edit the
          roster.
        </p>
      </header>

      <ol class="presentation-order">
        {#each presentationOrder as participant, index (participant.id)}
          <li>
            <span class="order-number">{String(index + 1).padStart(2, '0')}</span>
            <span>{participant.label}</span>
          </li>
        {/each}
      </ol>

      <div class="tool-actions">
        <button class="tool-button tool-button-secondary" onclick={handleEditRoster}
          >Edit roster</button
        >
        <button class="tool-button tool-button-primary" onclick={handleBeginSession}
          >Begin the session</button
        >
      </div>
    {:else if phase === 'session'}
      {#if currentPresenter}
        <header class="session-heading">
          <p class="critique-kicker">
            Presenter {presenterIndex + 1} of {presentationOrder.length}
          </p>
          <h1>{currentPresenter.label}</h1>
          <p>
            This presenter gets {currentTurn?.reviewers.length}
            {currentTurn?.reviewers.length === 1 ? ' reviewer.' : ' reviewers.'}
          </p>
        </header>

        <section
          class="wheels"
          class:single-wheel={prompts.length === 1}
          aria-label={prompts.length === 1
            ? 'Reviewer wheel'
            : 'Reviewer and feedback prompt wheels'}
        >
          <div class="wheel-card">
            <h2>Who responds?</h2>
            <div class="wheel-frame">
              <span class="wheel-pointer" aria-hidden="true">▼</span>
              <svg
                class="wheel-svg"
                viewBox="0 0 360 360"
                role="img"
                aria-label="Reviewer wheel with {audience.length} participants"
              >
                <g
                  class="wheel-rotor"
                  style="transform: rotate({wheelRotation}deg); transition-duration: {SPIN_DURATION}ms;"
                >
                  {#each audience as participant, index (participant.id)}
                    {@const position = segmentLabelPosition(index, audience.length)}
                    {@const color = WHEEL_COLORS[index % WHEEL_COLORS.length]}
                    <path
                      d={segmentPath(index, audience.length)}
                      fill={color.fill}
                      stroke="#ffffff"
                      stroke-width="2"
                      opacity={roundResults.some(
                        (result) => result.participant.id === participant.id
                      )
                        ? 0.32
                        : 1}
                    />
                    <text
                      x={position.x}
                      y={position.y}
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill={color.text}
                      font-size={Math.max(8, Math.min(15, 160 / audience.length))}
                      font-weight="700"
                      transform="rotate({position.rotation}, {position.x}, {position.y})"
                      opacity={roundResults.some(
                        (result) => result.participant.id === participant.id
                      )
                        ? 0.48
                        : 1}
                    >
                      {truncate(participant.label, labelLimit(audience.length))}
                    </text>
                  {/each}
                  <circle cx="180" cy="180" r="20" fill="#ffffff" />
                </g>
                <circle
                  cx="180"
                  cy="180"
                  r="164"
                  fill="none"
                  stroke="#494949"
                  stroke-width="2"
                />
              </svg>
            </div>
            <p class="wheel-result" aria-live="polite">
              {#if roundResults.length}
                {roundResults[roundResults.length - 1]?.participant.label}
              {:else}
                Reviewer
              {/if}
            </p>
          </div>

          {#if prompts.length > 1}
            <div class="wheel-card">
              <h2>How to respond?</h2>
              <div class="wheel-frame">
                <span class="wheel-pointer" aria-hidden="true">▼</span>
                <svg
                  class="wheel-svg"
                  viewBox="0 0 360 360"
                  role="img"
                  aria-label="Feedback prompt wheel"
                >
                  <g
                    class="wheel-rotor"
                    style="transform: rotate({promptRotation}deg); transition-duration: {SPIN_DURATION}ms;"
                  >
                    {#each prompts as prompt, index (prompt.short)}
                      {@const position = segmentLabelPosition(index, prompts.length)}
                      {@const color = WHEEL_COLORS[index % WHEEL_COLORS.length]}
                      <path
                        d={segmentPath(index, prompts.length)}
                        fill={color.fill}
                        stroke="#ffffff"
                        stroke-width="2"
                      />
                      <text
                        x={position.x}
                        y={position.y}
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill={color.text}
                        font-size="13"
                        font-weight="700"
                        transform="rotate({position.rotation}, {position.x}, {position.y})"
                      >
                        {truncate(prompt.short, labelLimit(prompts.length))}
                      </text>
                    {/each}
                    <circle cx="180" cy="180" r="20" fill="#ffffff" />
                  </g>
                  <circle
                    cx="180"
                    cy="180"
                    r="164"
                    fill="none"
                    stroke="#494949"
                    stroke-width="2"
                  />
                </svg>
              </div>
              <p class="wheel-result" aria-live="polite">
                {#if roundResults.length}
                  {roundResults[roundResults.length - 1]?.prompt.full}
                {:else}
                  Feedback prompt
                {/if}
              </p>
            </div>
          {/if}
        </section>

        <div class="spin-control">
          {#if roundComplete}
            <p class="round-complete" role="status">
              This presenter has received {roundResults.length}
              {roundResults.length === 1 ? ' response.' : ' responses.'}
            </p>
            <button class="tool-button tool-button-primary" onclick={handleNextPresenter}>
              {presenterIndex + 1 < presentationOrder.length
                ? 'Next presenter'
                : 'Finish session'}
            </button>
          {:else}
            <button
              class="tool-button tool-button-primary spin-button"
              onclick={handleSpin}
              disabled={isSpinning}
              aria-label={isSpinning
                ? 'The wheels are spinning'
                : prompts.length === 1
                  ? 'Spin reviewer wheel'
                  : 'Spin both wheels'}
            >
              {isSpinning
                ? 'Spinning…'
                : prompts.length === 1
                  ? 'Spin reviewer wheel'
                  : 'Spin both wheels'}
            </button>
          {/if}
        </div>

        <section class="feedback-log" aria-labelledby="feedback-log-title">
          <h2 id="feedback-log-title">Feedback so far</h2>
          {#if roundResults.length}
            <ol>
              {#each roundResults as result, index (`${result.participant.id}-${index}`)}
                <li>
                  <span class="log-number">{String(index + 1).padStart(2, '0')}</span>
                  <span>{result.participant.label}</span>
                  <span class="log-prompt">{result.prompt.full}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p>
              Spin to choose the first reviewer{prompts.length === 1
                ? '.'
                : ' and prompt.'}
            </p>
          {/if}
        </section>
      {/if}

      <button class="text-button" onclick={handleEditRoster} disabled={isSpinning}>
        Start over with this roster
      </button>
    {:else}
      <section class="complete-panel" aria-labelledby="complete-title">
        <p class="critique-kicker">Session complete</p>
        <h1 id="complete-title">Everyone has presented.</h1>
        <p>Everyone presented and gave feedback.</p>
        <button class="tool-button tool-button-primary" onclick={handleEditRoster}>
          Run it again
        </button>
      </section>
    {/if}
  </div>
</main>

<style>
  .critique-page {
    min-height: calc(100vh - 60px);
    padding-block: 24px 80px;
    background: var(--white);
  }

  .critique-container {
    max-width: 828px;
  }

  .text-button:hover {
    text-decoration: underline;
  }

  .critique-header,
  .session-heading,
  .complete-panel {
    max-width: 780px;
    margin: 0 auto 36px;
    padding-left: 24px;
    border-left: 4px solid var(--sva-orange);
  }

  .critique-kicker {
    margin-bottom: 8px;
    color: var(--sva-red-on-surface);
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .critique-header h1,
  .session-heading h1,
  .complete-panel h1 {
    margin-bottom: 12px;
    color: var(--sva-charcoal);
    font-family: var(--font-display);
    font-size: clamp(36px, 6vw, 56px);
    line-height: 1.08;
  }

  .critique-header > p:last-child,
  .session-heading > p:last-child,
  .complete-panel > p:not(.critique-kicker) {
    margin-bottom: 0;
    font-size: 18px;
  }

  .setup-panel {
    max-width: 780px;
    margin-inline: auto;
    padding: clamp(20px, 4vw, 40px);
    background: var(--white);
    border: 1px solid var(--sva-blue);
  }

  .panel-heading {
    margin-bottom: 24px;
  }

  .panel-heading h2,
  .feedback-log h2,
  .wheel-card h2 {
    margin-bottom: 8px;
    color: var(--sva-charcoal);
    font-family: var(--font-display);
    font-size: 24px;
  }

  .panel-heading > p:last-child {
    margin-bottom: 0;
  }

  .setup-panel label {
    display: block;
    margin-bottom: 8px;
    color: var(--sva-charcoal);
    font-family: var(--font-ui);
    font-weight: 700;
    text-transform: uppercase;
  }

  .setup-panel textarea {
    display: block;
    width: 100%;
    min-height: 180px;
    padding: 12px;
    border: 1px solid var(--sva-blue);
    border-radius: 0;
    color: var(--sva-copy);
    font: inherit;
    resize: vertical;
  }

  .setup-panel textarea:focus-visible {
    outline: 3px solid var(--sva-red);
    outline-offset: 3px;
  }

  .roster-count,
  .prompt-help,
  .privacy-note {
    margin: 8px 0 0;
    color: var(--sva-copy);
    font-size: 14px;
  }

  .setup-error {
    margin: 12px 0;
    color: var(--sva-red-on-surface);
    font-weight: 700;
  }

  .tool-button {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    padding: 12px 18px;
    border: 2px solid transparent;
    border-radius: 0;
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    text-transform: uppercase;
    cursor: pointer;
  }

  .tool-button:focus-visible,
  .text-button:focus-visible {
    outline: 3px solid var(--sva-red);
    outline-offset: 3px;
  }

  .tool-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .tool-button-primary {
    background: var(--sva-red);
    color: var(--white);
  }

  .tool-button-primary:hover:not(:disabled) {
    background: var(--sva-charcoal);
  }

  .tool-button-secondary {
    background: var(--white);
    border-color: var(--sva-red);
    color: var(--sva-red-on-surface);
  }

  .tool-button-secondary:hover {
    background: var(--sva-red);
    color: var(--white);
  }

  .setup-panel > .tool-button {
    margin-top: 20px;
  }

  .presentation-order {
    max-width: 780px;
    margin: 0 auto 24px;
    padding: 0;
    list-style: none;
    background: var(--white);
    border-top: 1px solid var(--rule);
  }

  .presentation-order li,
  .feedback-log li {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--rule);
  }

  .order-number,
  .log-number {
    color: var(--sva-red-on-surface);
    font-family: var(--font-ui);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .tool-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .session-heading {
    margin-bottom: 24px;
  }

  .wheels {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  .wheels.single-wheel {
    grid-template-columns: minmax(0, 1fr);
    max-width: 780px;
    margin-inline: auto;
  }

  .wheels.single-wheel .wheel-card {
    width: fit-content;
  }

  .wheels.single-wheel .wheel-frame {
    margin-inline: 0;
  }

  .wheel-card {
    min-width: 0;
    padding: 20px;
    background: var(--white);
    border: 1px solid var(--sva-blue);
    text-align: center;
  }

  .wheel-frame {
    position: relative;
    width: min(100%, 380px);
    margin-inline: auto;
  }

  .wheel-pointer {
    position: absolute;
    z-index: 1;
    top: -3px;
    left: 50%;
    color: var(--sva-red);
    font-size: 28px;
    line-height: 1;
    transform: translateX(-50%);
  }

  .wheel-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .wheel-rotor {
    transform-origin: 180px 180px;
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.17, 0.67, 0.12, 0.99);
  }

  .wheel-result {
    min-height: 32px;
    margin: 12px 0 0;
    color: var(--sva-red-on-surface);
    font-size: 18px;
    font-weight: 700;
  }

  .spin-control {
    display: flex;
    min-height: 76px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    margin-block: 20px 32px;
    text-align: center;
  }

  .round-complete {
    margin: 0;
    color: var(--sva-charcoal);
    font-weight: 700;
  }

  .feedback-log {
    max-width: 780px;
    margin-inline: auto;
    padding: 24px;
    background: var(--white);
    border-top: 4px solid var(--sva-orange);
  }

  .feedback-log ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .feedback-log li {
    padding-inline: 0;
  }

  .log-prompt {
    margin-left: auto;
    color: var(--sva-red-on-surface);
    font-weight: 700;
    text-align: right;
  }

  .feedback-log > p {
    margin-bottom: 0;
  }

  .text-button {
    display: block;
    margin: 24px auto 0;
    padding: 8px;
    border: 0;
    background: transparent;
    color: var(--sva-red-on-surface);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .text-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .complete-panel {
    padding-block: 24px;
  }

  .complete-panel .tool-button {
    margin-top: 24px;
  }

  @media (max-width: 720px) {
    .critique-page {
      padding-bottom: 48px;
    }

    .critique-header,
    .session-heading,
    .complete-panel {
      padding-left: 16px;
    }

    .wheels {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .wheel-card {
      padding: 16px;
    }

    .wheel-frame {
      width: min(100%, 340px);
    }

    .feedback-log {
      padding: 16px;
    }

    .presentation-order li,
    .feedback-log li {
      gap: 10px;
      padding-inline: 10px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wheel-rotor {
      transition-duration: 0.01ms !important;
    }
  }

  @media print {
    .critique-page {
      min-height: 0;
      padding-block: 0;
      background: #fff;
    }

    .tool-button,
    .text-button {
      display: none;
    }

    .setup-panel,
    .wheel-card,
    .feedback-log,
    .presentation-order {
      break-inside: avoid;
      background: #fff;
      border-color: #777;
      color: #000;
    }

    .wheels {
      gap: 8px;
    }
  }
</style>
