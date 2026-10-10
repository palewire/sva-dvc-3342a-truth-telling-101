<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import Hero from '$lib/components/Hero.svelte';
  import Meta from '$lib/components/Meta.svelte';

  let { data }: { data: PageData } = $props();
  const Content = $derived(data.pageComponent);
  const week = $derived(
    data.site.schedule.weeks.find((item) => item.number === data.metadata.week)
  );
  const canonicalRoot = import.meta.env.VITE_CANONICAL_URL?.replace(/\/+$/, '');
  const canonicalUrl = $derived(
    canonicalRoot ? canonicalRoot + '/weeks/' + data.slug + '/' : undefined
  );

  onMount(() => {
    const weekBody = document.querySelector('.week-body');
    if (!weekBody) return;

    weekBody.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.copy-btn');
      if (!btn) return;
      const pre = btn.closest('.code-block')?.querySelector('pre');
      if (!pre) return;
      const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
      navigator.clipboard.writeText(pre.textContent ?? '').then(() => {
        btn.innerHTML = `${checkIcon}Copied!`;
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(() => {
          btn.innerHTML = `${copyIcon}Copy`;
          btn.setAttribute('aria-label', 'Copy code');
        }, 2000);
      });
    });
  });
</script>

<Meta
  meta={{
    title: data.metadata.title + ' | ' + data.site.course.title,
    description: data.metadata.summary || data.site.meta.description
  }}
  {canonicalUrl}
/>

<main id="main-content" class="week-page" tabindex="-1">
  <Hero
    course={data.site.course}
    instructor={data.site.instructor}
    homeHref={base + '/'}
  />
  <div class="container week-container">
    <div class="week-content">
      <header class="week-header">
        <p class="eyebrow">Week {data.metadata.week}</p>
        <h1>{data.metadata.title}</h1>
        {#if data.metadata.summary}
          <p class="week-summary">{data.metadata.summary}</p>
        {/if}
        {#if week}
          <p class="week-date">{week.displayDate}</p>
        {/if}
      </header>
      <article class="week-body">
        <Content />
      </article>
    </div>
  </div>
</main>
