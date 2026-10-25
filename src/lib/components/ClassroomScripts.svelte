<script lang="ts">
  import { base } from '$app/paths';
  import type { CourseContent } from '$lib/types';

  let { schedule }: { schedule: CourseContent['schedule'] } = $props();
</script>

<section class="schedule-section" id="schedule" aria-labelledby="scripts-title">
  <div class="container">
    <div class="section-header">
      <p class="section-kicker">{schedule.kicker}</p>
      <h2 id="scripts-title">{schedule.title}</h2>
    </div>
    <p class="section-intro">{schedule.note}</p>
    <div class="scripts-grid">
      {#each schedule.weeks as item (item.number)}
        {#if item.href}
          <a class="script-card" href={base + item.href}>
            <span class="week-number">Week {String(item.number).padStart(2, '0')}</span>
            <h3>{item.topic}</h3>
            <p>{item.displayDate}</p>
          </a>
        {:else}
          <div class="script-card script-card-disabled" aria-disabled="true">
            <span class="week-number">Week {String(item.number).padStart(2, '0')}</span>
            <h3>{item.topic}</h3>
            <p>{item.displayDate}</p>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>
