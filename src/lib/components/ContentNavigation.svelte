<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';

  interface NavItem {
    href: string;
    title: string;
  }

  let {
    previous = undefined,
    next = undefined,
    ariaLabel = 'Content navigation'
  }: {
    previous?: NavItem | null;
    next?: NavItem | null;
    ariaLabel?: string;
  } = $props();
</script>

<nav class="content-navigation" aria-label={ariaLabel}>
  <div class="nav-link previous">
    {#if previous}
      <a href={previous.href}>
        <ChevronLeft size={20} aria-hidden="true" focusable="false" />
        <span class="nav-content">
          <span class="nav-label">Previous</span>
          <span class="nav-title">{previous.title}</span>
        </span>
      </a>
    {/if}
  </div>

  <div class="nav-link next">
    {#if next}
      <a href={next.href}>
        <span class="nav-content">
          <span class="nav-label">Next</span>
          <span class="nav-title">{next.title}</span>
        </span>
        <ChevronRight size={20} aria-hidden="true" focusable="false" />
      </a>
    {/if}
  </div>
</nav>

<style>
  .content-navigation {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 16px;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--rule);
  }

  .nav-link {
    flex: 1;
    max-width: 45%;
  }

  .nav-link.previous {
    text-align: left;
  }

  .nav-link.next {
    margin-left: auto;
    text-align: right;
  }

  .nav-link a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--surface);
    color: var(--sva-charcoal);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .nav-link a:hover,
  .nav-link a:focus-visible {
    background: var(--sva-red);
    color: var(--white);
  }

  .nav-link a:hover :global(svg),
  .nav-link a:focus-visible :global(svg) {
    color: var(--white);
  }

  .nav-link :global(svg) {
    flex-shrink: 0;
    color: var(--sva-red);
    transition: color 0.2s ease;
  }

  .nav-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .nav-label {
    font-family: var(--font-ui);
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .nav-title {
    font-size: 15px;
    font-weight: 700;
  }

  @media (max-width: 600px) {
    .content-navigation {
      flex-direction: column;
      gap: 8px;
    }

    .nav-link {
      flex: none;
      max-width: 100%;
      width: 100%;
    }

    .nav-link.next {
      margin-left: 0;
      text-align: left;
    }

    .nav-link a {
      width: 100%;
      padding: 12px 16px;
      gap: 8px;
    }

    .nav-content {
      flex: 1;
    }

    .nav-label {
      font-size: 11px;
    }

    .nav-title {
      font-size: 14px;
    }
  }
</style>
