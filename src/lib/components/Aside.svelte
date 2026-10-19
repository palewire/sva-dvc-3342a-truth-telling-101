<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title = 'Note', children } = $props<{
    title?: string;
    children: Snippet;
  }>();
</script>

<aside class="aside">
  {#if title}
    <p class="aside__title">{title}</p>
  {/if}
  <div class="aside__body">
    {@render children()}
  </div>
</aside>

<style>
  .aside {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    border-left: 4px solid var(--sva-orange);
    background: var(--surface);
  }

  .aside__title {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-ui);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--sva-charcoal);
  }

  .aside__body {
    display: grid;
    gap: 0.75rem;
    color: var(--sva-copy);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .aside__body > :global(*) {
    min-width: 0;
  }
</style>
