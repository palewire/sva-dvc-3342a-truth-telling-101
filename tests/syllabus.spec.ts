import { expect, test, type Page } from '@playwright/test';

const basePath = process.env.BASE_PATH ?? '';
const canonicalUrl = process.env.VITE_CANONICAL_URL;
const shareImagePath = `${basePath}/social/sva-continuing-education.avif`;
const shareImageUrl = canonicalUrl
  ? new URL(shareImagePath, canonicalUrl).href
  : shareImagePath;

async function runCritiqueSession(page: Page, students: string[]) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./critique-wheel/');

  const roster = page.getByRole('textbox', { name: 'Students' });
  const promptInput = page.getByRole('textbox', { name: 'Prompts' });
  await roster.fill(students.join('\n'));
  await promptInput.fill('Ask a question');
  await expect(promptInput).toHaveValue('Ask a question');
  await page.getByRole('button', { name: 'Randomize order' }).click();
  await page.getByRole('button', { name: 'Begin the session' }).click();

  const presenters: string[] = [];
  const reviewerCounts = new Map(students.map((student) => [student, 0]));
  let totalResponses = 0;

  for (let presenterIndex = 0; presenterIndex < students.length; presenterIndex += 1) {
    await expect(
      page.getByText(`Presenter ${presenterIndex + 1} of ${students.length}`)
    ).toBeVisible();
    const currentPresenter = await page.locator('.session-heading h1').innerText();
    presenters.push(currentPresenter);
    const reviewerWheel = page.locator('.wheel-svg').first();
    const currentRow = page.locator('.session-order tbody tr').nth(presenterIndex);
    const initialWheelLabels = await reviewerWheel.locator('text').allTextContents();
    expect(initialWheelLabels.length).toBeGreaterThan(0);
    expect(initialWheelLabels).not.toContain(currentPresenter);

    while (await page.getByRole('button', { name: 'Spin reviewer wheel' }).count()) {
      const previousResponseCount = await currentRow.locator('.pairing-reviewer').count();
      await page.getByRole('button', { name: 'Spin reviewer wheel' }).click();
      await expect(currentRow.locator('.pairing-reviewer')).toHaveCount(
        previousResponseCount + 1,
        { timeout: 2000 }
      );
      const selectedReviewer = await currentRow
        .locator('.pairing-reviewer')
        .last()
        .innerText();
      const remainingReviewers = await reviewerWheel.locator('text').allTextContents();
      expect(remainingReviewers).toContain(selectedReviewer);
      if (
        students.length % 2 === 1 &&
        presenterIndex === students.length - 1 &&
        previousResponseCount === 0
      ) {
        expect(remainingReviewers).toHaveLength(students.length - 1);
      }
    }

    const reviewers = await currentRow.locator('.pairing-reviewer').allTextContents();
    for (const reviewer of reviewers) {
      reviewerCounts.set(reviewer, (reviewerCounts.get(reviewer) ?? 0) + 1);
      totalResponses += 1;
    }

    const nextButton = page.getByRole('button', {
      name: presenterIndex + 1 < students.length ? 'Next presenter' : 'Finish session'
    });
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    if (presenterIndex + 1 < students.length) {
      await expect(
        page.getByText(`Presenter ${presenterIndex + 2} of ${students.length}`)
      ).toBeVisible();
      const nextWheelLabels = await reviewerWheel.locator('text').allTextContents();
      for (const reviewer of reviewers) expect(nextWheelLabels).not.toContain(reviewer);
    }
  }

  await expect(
    page.getByRole('heading', { name: 'Everyone has presented.' })
  ).toBeVisible();

  return { presenters, reviewerCounts, totalResponses };
}

test('shows the SVA course facts without artwork in the hero', async ({ page }) => {
  await page.goto('./');

  await expect(page).toHaveTitle(
    "Truth-Telling 101: how New York's leading newsrooms turn raw data into compelling journalism | SVA Continuing Education"
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Fall 2026 syllabus/
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    shareImageUrl
  );
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute(
    'content',
    'image/avif'
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    'content',
    '1777'
  );
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
    'content',
    '999'
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image'
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    shareImageUrl
  );
  if (canonicalUrl) {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonicalUrl
    );
  } else {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
  await expect(page.locator('.brand-mark')).toHaveAttribute('href', `${basePath}/`);
  await expect(page.locator('.brand-name')).toHaveAttribute('href', `${basePath}/`);
  await page.locator('.brand-name').hover();
  await expect(page.locator('.brand-name')).toHaveCSS('color', 'rgb(73, 73, 73)');
  await expect(page.locator('.brand-program')).toHaveCount(0);
  await expect(page.locator('.site-footer')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Professional Development');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Truth-Telling 101');
  await expect(page.locator('.hero-proposition')).toHaveText(
    "Learn how New York's leading newsrooms turn raw data into compelling journalism"
  );
  await expect(page.locator('.introduction-copy p')).toHaveText([
    'In this hands-on introduction to data journalism, students will learn how to blend cutting-edge statistical analysis with time-tested reporting techniques.',
    'You will practice the fundamental skills of the craft by working through the full arc of data-driven stories, together in class and then on your own. By the end of the six-week course, you will be ready to pitch a professional editor.'
  ]);
  await expect(page.locator('.introduction .section-kicker')).toHaveText('What this is');
  await expect(page.locator('#introduction-title')).toHaveText(
    'Data science on deadline'
  );
  await expect(page.locator('.skills-section .section-kicker')).toHaveText(
    "What we'll cover"
  );
  await expect(page.locator('#skills-title')).toHaveText('Fundamental skills');
  await expect(page.locator('.skills-section .section-intro')).toHaveText(
    "You'll get multiple rounds of practice applying the key techniques common to every data story."
  );
  await expect(page.locator('.course-skill')).toHaveCount(6);
  await expect(page.locator('.skill-number')).toHaveCount(0);
  await expect(page.locator('.course-skill svg')).toHaveCount(6);
  await expect(page.locator('.course-skill h3')).toHaveText([
    'Identifying measurable questions',
    'Locating data that can provide answers',
    'Preparing raw data for rigorous analysis',
    'Interviewing prepared data to develop findings',
    'Testing your findings against the real world',
    'Ensuring your subjects have a say'
  ]);
  await expect(page.locator('.course-quote p')).toHaveText(
    "“To cope with the acceleration of social change in today's world, journalism must become social science in a hurry.”"
  );
  await expect(page.locator('.course-quote cite strong')).toHaveText('Philip Meyer');
  await expect(page.locator('.course-quote cite')).toHaveText('— Philip Meyer');
  await expect(page.locator('.course-quote cite a')).toHaveCount(0);
  await expect(page.locator('.hero')).toContainText('DVC-3342-A');
  await expect(page.locator('.hero')).toContainText('Oct. 5–Nov. 9, 2026');
  await expect(page.locator('.hero')).toContainText('6:30–9:30 p.m.');
  const location = page.locator('.hero-meta-item').filter({ hasText: 'Location' });
  await expect(location.locator('strong')).toHaveText('214 E. 21st Street');
  await expect(location.locator('span').last()).toHaveText('Room 305A');
  await expect(page.locator('.hero')).toContainText('Ben Welsh');
  await expect(page.locator('.hero img, .hero svg, .hero canvas')).toHaveCount(0);
  await expect(page.locator('.site-nav')).toHaveCount(0);
  await expect(page.locator('.hero-official')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /Official SVA course listing/ })
  ).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('CUNY');
});

test('links the instructor photo to the bio page', async ({ page }) => {
  await page.goto('./');

  await expect(page.locator('.instructor-section .section-intro')).toHaveText(
    'Each class will be led in person by a working professional.'
  );
  const photoLink = page.locator('.instructor-avatar');
  await expect(photoLink).toHaveAttribute('href', 'https://palewi.re/who-is-ben-welsh/');
  await expect(photoLink.locator('img')).toHaveAttribute(
    'src',
    /\/ben-welsh-transparent\.png$/
  );
  await expect(page.locator('.instructor-affiliation')).toHaveText(
    'News Applications Editor, Reuters'
  );
  await expect(page.locator('.instructor-bio')).toHaveText(
    'I am a reporter, editor and computer programmer with more than 20 years of journalism experience. You can contact me at b@palewi.re.'
  );
  await expect(page.locator('.instructor-bio a[href="mailto:b@palewi.re"]')).toHaveText(
    'b@palewi.re'
  );
  const heroInstructorLink = page.locator('.hero-meta-item').first().locator('a');
  const emailLink = page.locator('.instructor-bio a[href="mailto:b@palewi.re"]');
  await expect(emailLink).toHaveCSS(
    'color',
    await heroInstructorLink.evaluate((link) => getComputedStyle(link).color)
  );
  await emailLink.hover();
  await expect(emailLink).toHaveCSS('color', 'rgb(230, 31, 0)');
  await emailLink.focus();
  await expect(emailLink).toHaveCSS('color', 'rgb(230, 31, 0)');
  await expect(emailLink).toHaveCSS('outline-color', 'rgb(230, 31, 0)');
});

test('links the published classroom scripts', async ({ page }) => {
  await page.goto('./');

  await expect(page.locator('.meeting-dates')).toHaveCount(0);
  await expect(page.locator('#schedule .section-kicker')).toHaveText('Documentation');
  await expect(page.locator('#scripts-title')).toHaveText('Classroom scripts');
  await expect(page.locator('#schedule .section-intro')).toHaveText(
    'All of the materials we cover will be made available after class.'
  );

  const cards = page.locator('.script-card');
  await expect(cards).toHaveCount(6);
  await expect(page.locator('.script-card-disabled')).toHaveCount(3);

  const week1 = cards.nth(0);
  await expect(week1).toHaveAttribute('href', `${basePath}/weeks/week-1/`);
  await expect(week1.locator('h3')).toHaveText('Social science in a hurry');
  await expect(week1.locator('p')).toHaveText('October 5, 2026');

  const week2 = cards.nth(1);
  await expect(week2).toHaveAttribute('href', `${basePath}/weeks/week-2/`);
  await expect(week2.locator('h3')).toHaveText('Interviewing data');
  await expect(week2.locator('p')).toHaveText('Monday, Oct. 12, 2026');

  const week3 = cards.nth(2);
  await expect(week3).toHaveAttribute('href', `${basePath}/weeks/week-3/`);
  await expect(week3.locator('h3')).toHaveText('Calculating context');
  await expect(week3.locator('p')).toHaveText('Monday, Oct. 19, 2026');

  const sections = page.locator('main > section');
  await expect(sections.nth((await sections.count()) - 1)).toHaveAttribute(
    'id',
    'schedule'
  );
});

test('lets the lecture deck widen on desktop and fit the mobile text column', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./weeks/week-1/');

  const deck = page.locator('.lesson-deck');
  const desktopWidths = await deck.evaluate((iframe) => ({
    deck: iframe.getBoundingClientRect().width,
    text: iframe.closest('.week-content')?.getBoundingClientRect().width ?? 0,
    linkRight: document.querySelector('.deck-link a')?.getBoundingClientRect().right ?? 0,
    deckRight: iframe.getBoundingClientRect().right
  }));
  expect(desktopWidths.deck).toBeGreaterThan(desktopWidths.text);
  expect(desktopWidths.linkRight).toBeCloseTo(desktopWidths.deckRight, 0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileWidths = await deck.evaluate((iframe) => ({
    deck: iframe.getBoundingClientRect().width,
    text: iframe.closest('.week-content')?.getBoundingClientRect().width ?? 0,
    linkRight: document.querySelector('.deck-link a')?.getBoundingClientRect().right ?? 0,
    deckRight: iframe.getBoundingClientRect().right,
    page: document.documentElement.scrollWidth
  }));
  expect(mobileWidths.deck).toBeCloseTo(mobileWidths.text, 0);
  expect(mobileWidths.linkRight).toBeCloseTo(mobileWidths.deckRight, 0);
  expect(mobileWidths.page).toBe(390);
});

test('runs the critique wheel without saving or hard-coding a roster', async ({
  page
}) => {
  await page.goto('./critique-wheel/');

  await expect(page).toHaveURL(/\/critique-wheel\/$/);
  await expect(page).toHaveTitle('Wheel of Feedback | Truth-Telling 101');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wheel of Feedback');
  await expect(page.locator('body')).not.toContainText('CUNY');
  const mastheadLeft = await page
    .locator('.brand')
    .evaluate((element) => element.getBoundingClientRect().left);
  const panelLeft = await page
    .locator('.setup-panel')
    .evaluate((element) => element.getBoundingClientRect().left);
  expect(mastheadLeft).toBeCloseTo(panelLeft, 0);

  const roster = page.getByRole('textbox', { name: 'Students' });
  await expect(page.getByRole('button', { name: 'Randomize order' })).toBeDisabled();
  await roster.fill('Alex\nSam\nAlex');
  await expect(roster).toHaveValue('Alex\nSam\nAlex');
  await page.getByRole('button', { name: 'Randomize order' }).click();

  await expect(page.getByRole('heading', { name: 'Who presents first?' })).toBeVisible();
  const orderEntries = page.locator('.presentation-order');
  await expect(orderEntries.locator('li')).toHaveCount(3);
  for (const label of ['Alex (1)', 'Sam', 'Alex (2)']) {
    await expect(orderEntries.getByText(label, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Begin the session' }).click();

  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(
    'Wheel of Feedback'
  );
  await expect(page.locator('.wheel-svg')).toHaveCount(2);
  await page.getByRole('button', { name: 'Spin both wheels' }).click();
  await expect(
    page.getByRole('button', { name: 'The wheels are spinning' })
  ).toBeDisabled();
  await expect(
    page.locator('.session-order tr.current-presenter .pairing-reviewer')
  ).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.wheel-result')).not.toHaveText([
    'Reviewer',
    'Feedback prompt'
  ]);
  await expect(page.getByRole('button', { name: 'Next presenter' })).toBeVisible();
  await page.getByRole('button', { name: 'Next presenter' }).click();
  await expect(page.getByText('Presenter 2 of 3')).toBeVisible();

  await page.getByRole('button', { name: 'Start over with this roster' }).click();
  await expect(roster).toHaveValue('Alex\nSam\nAlex');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Students' })).toHaveValue('');

  const promptInput = page.getByRole('textbox', { name: 'Prompts' });
  await expect(promptInput).toHaveValue(
    'Ask a question\nGive a compliment\nSuggest an improvement'
  );
  const tenStudents = Array.from({ length: 10 }, (_, index) => `Student ${index + 1}`);
  await roster.fill(tenStudents.join('\n'));
  await promptInput.fill('Ask a question');
  await page.getByRole('button', { name: 'Randomize order' }).click();
  await page.getByRole('button', { name: 'Begin the session' }).click();

  await expect(page.locator('.wheel-svg')).toHaveCount(1);
  await expect(page.locator('.wheel-svg path')).toHaveCount(9);
  await page.getByRole('button', { name: 'Spin reviewer wheel' }).click();
  await expect(
    page.locator('.session-order tr.current-presenter .pairing-reviewer')
  ).toHaveCount(1, { timeout: 5000 });
  const firstReviewer = await page.locator('.wheel-result').first().innerText();
  expect(await page.locator('.wheel-svg text').allTextContents()).toContain(
    firstReviewer
  );
  await page.getByRole('button', { name: 'Next presenter' }).click();
  await expect(page.getByText('Presenter 2 of 10')).toBeVisible();
  expect(await page.locator('.wheel-svg text').allTextContents()).not.toContain(
    firstReviewer
  );
});

test('gives every student one presentation and critique with an even roster', async ({
  page
}) => {
  const students = Array.from({ length: 10 }, (_, index) => `Student ${index + 1}`);
  const { presenters, reviewerCounts, totalResponses } = await runCritiqueSession(
    page,
    students
  );

  expect([...presenters].sort()).toEqual([...students].sort());
  expect([...reviewerCounts.values()]).toEqual(students.map(() => 1));
  expect(totalResponses).toBe(students.length);
});

test('gives everyone a presentation and critique plus one extra critique with an odd roster', async ({
  page
}) => {
  const students = Array.from({ length: 5 }, (_, index) => `Student ${index + 1}`);
  const { presenters, reviewerCounts, totalResponses } = await runCritiqueSession(
    page,
    students
  );

  expect([...presenters].sort()).toEqual([...students].sort());
  expect(totalResponses).toBe(students.length + 1);
  expect([...reviewerCounts.values()].sort((first, second) => first - second)).toEqual([
    1, 1, 1, 1, 2
  ]);
});

test('limits each feedback prompt to 80 characters', async ({ page }) => {
  await page.goto('./critique-wheel/');

  const roster = page.getByRole('textbox', { name: 'Students' });
  const promptInput = page.getByRole('textbox', { name: 'Prompts' });
  await roster.fill('Alex\nSam');
  await promptInput.fill(`${'A'.repeat(90)}\n${'B'.repeat(81)}`);

  await expect(promptInput).toHaveValue(`${'A'.repeat(80)}\n${'B'.repeat(80)}`);
  await expect(page.getByRole('button', { name: 'Randomize order' })).toBeEnabled();
});

test('renders the published week one page', async ({ page }) => {
  await page.goto('./weeks/week-1/');

  await expect(page).toHaveTitle(
    "Social science in a hurry | Truth-Telling 101: How New York's leading newsrooms turn raw data into compelling journalism"
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Social science in a hurry'
  );
  await expect(page.locator('.hero-title a')).toHaveAttribute('href', `${basePath}/`);
  await expect(
    page.locator('iframe[title="Social science in a hurry lecture deck"]')
  ).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Homework' })).toBeVisible();
});

test('names the three booked guests without assigning dates', async ({ page }) => {
  await page.goto('./');

  const speakers = [
    [
      'Caitlin Ostroff',
      'The Wall Street Journal',
      'https://www.wsj.com/news/author/caitlin-ostroff'
    ],
    ['Haidee Chu', 'The City Reporter', 'https://www.thecityreporter.nyc/author/haidee/'],
    ['Bianca Pallaro', 'The New York Times', 'https://www.nytimes.com/by/bianca-pallaro']
  ];
  const cards = page.locator('.speaker-card');
  await expect(cards).toHaveCount(speakers.length);

  for (const [index, [name, newsroom, url]] of speakers.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute('href', url);
    await expect(card.getByRole('heading', { name })).toBeVisible();
    await expect(card.locator('.speaker-info p')).toHaveText(newsroom);
    await expect(card.locator('.portrait-initials')).toHaveCount(0);
    if (name === 'Caitlin Ostroff') {
      await expect(card.locator('img')).toHaveAttribute(
        'src',
        /\/speakers\/caitlin-ostroff-transparent\.png$/
      );
    } else if (name === 'Haidee Chu') {
      await expect(card.locator('img')).toHaveAttribute(
        'src',
        /\/speakers\/haidee-chu-transparent\.png$/
      );
    } else if (name === 'Bianca Pallaro') {
      await expect(card.locator('img')).toHaveAttribute(
        'src',
        /\/speakers\/bianca-pallaro-transparent\.png$/
      );
    } else {
      await expect(card.locator('img')).toHaveCount(0);
    }
  }
  await expect(page.locator('.guests-section')).toContainText(
    "Three of the city's best data reporters will join our class to share how they turn data into impactful journalism."
  );
});

test('fits a phone screen and supports the keyboard skip link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const scriptCard = page.locator('.script-card').first();
  const skillCard = page.locator('.course-skill').first();
  await expect(page.locator('.script-card')).toHaveCount(6);
  await expect(page.locator('.speaker-card')).toHaveCount(3);
  await expect(scriptCard).toHaveCSS('padding', '12px');
  await expect(skillCard).toHaveCSS('padding', '12px');
  await expect(page.locator('.speaker-card').first()).toHaveCSS('padding', '12px');
  await expect(page.locator('.section-header h2').first()).toHaveCSS('font-size', '26px');
  await expect(page.locator('.section-intro').first()).toHaveCSS('font-size', '16px');
  await expect(page.locator('.course-skill h3').first()).toHaveCSS('font-size', '16px');
  await expect(page.locator('.script-card h3').first()).toHaveCSS('font-size', '20px');
  for (const portrait of await page.locator('.speaker-portrait').all()) {
    await expect(portrait).toHaveCSS('background-color', 'rgb(30, 150, 184)');
    await expect(portrait).toHaveCSS('border-radius', '0px');
  }
  const instructorCard = page.locator('.instructor-profile');
  const instructorAvatar = page.locator('.instructor-avatar');
  const instructorDetails = page.locator('.instructor-details');
  const instructorBio = page.locator('.instructor-bio');
  await expect(instructorCard).toHaveCSS('padding', '12px');
  await expect(instructorAvatar).toHaveCSS('width', '80px');
  await expect(instructorAvatar).toHaveCSS('height', '80px');
  await expect(instructorAvatar).toHaveCSS('background-color', 'rgb(30, 150, 184)');
  await expect(instructorAvatar).toHaveCSS('border-radius', '0px');
  const avatarBox = await instructorAvatar.boundingBox();
  const detailsBox = await instructorDetails.boundingBox();
  const bioBox = await instructorBio.boundingBox();
  expect(avatarBox).not.toBeNull();
  expect(detailsBox).not.toBeNull();
  expect(bioBox).not.toBeNull();
  expect(detailsBox!.x).toBeGreaterThan(avatarBox!.x + avatarBox!.width);
  expect(bioBox!.y).toBeGreaterThanOrEqual(avatarBox!.y + avatarBox!.height);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('prints the syllabus in black on white without navigation or portrait blocks', async ({
  page
}) => {
  await page.goto('./');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.site-nav')).toBeHidden();
  await expect(page.locator('.hero-official')).toBeHidden();
  for (const portrait of await page.locator('.speaker-portrait').all()) {
    await expect(portrait).toBeHidden();
  }
  await expect(page.locator('.script-card')).toHaveCount(6);
  expect(
    await page
      .locator('.hero')
      .evaluate((element) => getComputedStyle(element).backgroundColor)
  ).toBe('rgb(255, 255, 255)');
  expect(
    await page.locator('.hero h1').evaluate((element) => getComputedStyle(element).color)
  ).toBe('rgb(0, 0, 0)');
  expect(
    await page
      .locator('.schedule-section .section-kicker')
      .evaluate((element) => getComputedStyle(element).color)
  ).toBe('rgb(0, 0, 0)');
});
