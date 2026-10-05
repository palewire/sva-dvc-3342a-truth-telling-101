<script lang="ts">
  import { base } from '$app/paths';
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
