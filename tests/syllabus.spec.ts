import { expect, test } from '@playwright/test';

const basePath = process.env.BASE_PATH ?? '';
const canonicalUrl = process.env.VITE_CANONICAL_URL;
const shareImagePath = `${basePath}/social/sva-continuing-education.avif`;
const shareImageUrl = canonicalUrl
  ? new URL(shareImagePath, canonicalUrl).href
  : shareImagePath;

test('shows the SVA course facts without artwork in the hero', async ({ page }) => {
  await page.goto('./');

  await expect(page).toHaveTitle(
    'Truth-Telling 101: Artists Meet Data Journalism | SVA Continuing Education'
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
  await expect(page.locator('.brand-mark')).toHaveAttribute('href', 'https://sva.edu');
  await expect(page.locator('.brand-name')).toHaveAttribute('href', 'https://sva.edu');
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
    'Identifying newsworthy questions',
    'Locating data that can provide the answers',
    'Preparing raw data for rigorous analysis',
    'Interviewing data to develop meaningful findings',
    'Verifying your findings in the real world',
    'Ensuring subjects have a shot to sound off'
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
  await expect(location.locator('strong')).toHaveText('214 E. 21 Street');
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
    'I am a reporter, editor and computer programmer with more than 20 years of journalism experience. You contact me at b@palewi.re.'
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

test('shows one disabled classroom script', async ({ page }) => {
  await page.goto('./');

  await expect(page.locator('.meeting-dates')).toHaveCount(0);
  await expect(page.locator('#scripts .section-kicker')).toHaveText('Documentation');
  await expect(page.locator('#scripts-title')).toHaveText('Classroom scripts');
  await expect(page.locator('#scripts .section-intro')).toHaveText(
    'All of the materials we cover will be made available after class.'
  );
  await expect(page.locator('.script-card')).toHaveCount(1);
  await expect(page.locator('.script-card')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.script-card h3')).toHaveText('Social science in a hurry');
  await expect(page.locator('.script-card p')).toHaveText('October 5, 2026');
  await expect(page.locator('.script-card a')).toHaveCount(0);
  await expect(page.locator('a[href*="/weeks/"]')).toHaveCount(0);
  const sections = page.locator('main > section');
  await expect(sections.nth((await sections.count()) - 1)).toHaveAttribute(
    'id',
    'scripts'
  );
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
  const scriptCard = page.locator('.script-card');
  const skillCard = page.locator('.course-skill').first();
  await expect(scriptCard).toHaveCount(1);
  await expect(page.locator('.speaker-card')).toHaveCount(3);
  await expect(scriptCard).toHaveCSS('padding', '12px');
  await expect(skillCard).toHaveCSS('padding', '12px');
  await expect(page.locator('.speaker-card').first()).toHaveCSS('padding', '12px');
  await expect(page.locator('.section-header h2').first()).toHaveCSS('font-size', '26px');
  await expect(page.locator('.section-intro').first()).toHaveCSS('font-size', '16px');
  await expect(page.locator('.course-skill h3').first()).toHaveCSS('font-size', '16px');
  await expect(page.locator('.script-card h3')).toHaveCSS('font-size', '20px');
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
  await expect(page.locator('.script-card')).toHaveCount(1);
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
